import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
// zodOutputFormat espera um schema construído com "zod/v4" (o subpath de
// compatibilidade que o pacote zod 3.25+ já inclui), não a API clássica de
// "zod" usada no resto do projeto (react-hook-form + os schemas do intake).
// Isolado só neste arquivo — não afeta os outros schemas.
import { z } from "zod/v4";
import type { DadosProcesso } from "@/lib/valuation/consolidar";
import { anosDreComDados, type AnaliseIA } from "@/lib/valuation/types";
import type { ResultadoCalculoValuation } from "@/lib/valuation/calcular";
import type { ResultadoProntidao } from "@/lib/prontidao/checklist";
import { PORTE_LABELS } from "@/lib/intake/schema-perfil";
import { NIVEL_DEPENDENCIA_LABELS } from "@/lib/intake/schema-operacao";
import { PORTE_CONCORRENTE_LABELS } from "@/lib/intake/schema-mercado";
import { formatBRL } from "@/lib/format";

/**
 * Fase 3 (docs/PLANO_EVOLUCAO_MVP.md): a IA recebe os números JÁ calculados
 * pelo motor determinístico (lib/valuation/calcular.ts,
 * lib/prontidao/checklist.ts) só como CONTEXTO DE LEITURA para a análise
 * qualitativa — nunca para recalcular ou contestar. Passados como parâmetro
 * (não recalculados aqui) porque quem chama esta função (app/api/.../
 * gerar-resultado/route.ts) já os calculou antes de chamar a IA; isso também
 * garante, por construção, que a resposta da IA nunca pode alterar nenhum
 * valor numérico exibido (ver docs/DECISOES_MVP.md, Fase 3).
 */
export interface ResultadoNumericoParaContexto {
  valuation: ResultadoCalculoValuation;
  prontidao: ResultadoProntidao;
}

const client = new Anthropic();

/** Exportado para lib/ai/chat-assistente.ts usar o mesmo modelo. */
export const MODEL = "claude-opus-5";

/**
 * Schema da resposta esperada da IA — usado com output_config.format
 * (Structured Outputs / client.messages.parse), não com instrução textual de
 * "responda em JSON" no prompt. A API garante que a resposta valida contra
 * esse schema antes de devolver, o que é mais robusto que pedir JSON no
 * system prompt e fazer JSON.parse manual na resposta.
 */
const analiseIaSchema = z.object({
  pontosFortes: z
    .array(z.string())
    .describe(
      "3 a 5 pontos fortes do negócio, cada um em uma frase objetiva, baseados estritamente nos dados fornecidos.",
    ),
  riscos: z
    .array(z.string())
    .describe(
      "3 a 5 riscos ou fragilidades identificados, cada um em uma frase objetiva, baseados estritamente nos dados fornecidos.",
    ),
  recomendacoes: z
    .array(z.string())
    .describe(
      "3 a 5 recomendações práticas e acionáveis para melhorar o valuation ou reduzir riscos antes de uma negociação de M&A.",
    ),
});

const FALLBACK_ANALISE_IA: AnaliseIA = {
  pontosFortes: [],
  riscos: [],
  recomendacoes: [],
  erro: true,
};

const SYSTEM_PROMPT = `Você é um analista financeiro especializado em valuation e M&A de pequenas e
médias empresas brasileiras. Você recebe um resumo estruturado dos dados que
o dono da empresa preencheu num formulário de intake (perfil, financeiro,
operação e mercado) e deve produzir uma análise qualitativa objetiva.

Regras (RG-42/RG-43 de docs/REGRAS_NEGOCIO_VALUMA_V1.md — seu papel é
exclusivamente qualitativo/interpretativo, nunca de cálculo):
- Baseie-se ESTRITAMENTE nos dados fornecidos no resumo. Não invente números,
  nomes ou fatos que não estejam lá.
- Se um bloco de dados estiver vazio ou não informado, NÃO infira nem
  presuma um valor para ele — é preferível reconhecer explicitamente que não
  há informação suficiente para avaliar aquele aspecto do que supor algo.
  Trate a ausência de dado, quando fizer sentido, como um ponto de atenção
  em si (ex: nenhum documento societário informado é, em si, um risco para
  due diligence).
- O resumo inclui uma seção "Resultado já calculado", com a Estimativa
  preliminar de Equity Value (quando existir) e o Índice de Prontidão que um
  motor determinístico já produziu, ANTES desta análise. Use esses números
  só como contexto para sua leitura qualitativa. Você NUNCA deve: recalcular
  qualquer método de valuation; alterar ou contestar o valuation; propor um
  valor numérico alternativo de valuation como se fosse um resultado do
  sistema; alterar pesos de qualquer fórmula; alterar o Índice de Prontidão
  ou decidir se algum item conta para ele; afirmar que um documento é
  juridicamente válido ou que um dado contábil foi auditado — nenhuma dessas
  ações é sua função nesta análise.
- Se a Estimativa preliminar de Equity Value estiver indisponível (nenhum
  método de valuation aplicável), você pode comentar a condição financeira
  subjacente como risco/contexto (ex.: EBITDA negativo, patrimônio líquido
  negativo), mas NUNCA deve inventar ou sugerir um valor numérico de
  valuation nesse caso.
- Escreva cada item das listas como uma frase curta e objetiva, em
  português, sem markdown.`;

export async function analisarComIA(
  dados: DadosProcesso,
  resultadoNumerico: ResultadoNumericoParaContexto,
): Promise<AnaliseIA> {
  try {
    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: montarPrompt(dados, resultadoNumerico) }],
      output_config: {
        format: zodOutputFormat(analiseIaSchema),
      },
    });

    if (!response.parsed_output) {
      console.error(
        "analisarComIA: resposta da IA não pôde ser validada contra o schema esperado",
        response,
      );
      return FALLBACK_ANALISE_IA;
    }

    return response.parsed_output;
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      console.error(
        "analisarComIA: ANTHROPIC_API_KEY ausente ou inválida",
        error,
      );
    } else if (error instanceof Anthropic.RateLimitError) {
      console.error("analisarComIA: rate limit da API da Anthropic", error);
    } else if (error instanceof Anthropic.APIError) {
      console.error(
        "analisarComIA: erro da API da Anthropic",
        error.status,
        error.message,
      );
    } else {
      console.error("analisarComIA: erro inesperado", error);
    }

    return FALLBACK_ANALISE_IA;
  }
}

/**
 * Monta o resumo estruturado em português enviado como prompt do usuário.
 * Documentado aqui porque é exatamente o texto que vira o "prompt enviado à
 * IA" para fins de documentação do TCC.
 */
function montarPrompt(
  dados: DadosProcesso,
  resultadoNumerico: ResultadoNumericoParaContexto,
): string {
  return [
    "Analise os dados a seguir, coletados no intake de um processo de valuation/M&A.",
    "",
    montarSecaoPerfil(dados),
    "",
    montarSecaoFinanceiro(dados),
    "",
    montarSecaoOperacao(dados),
    "",
    montarSecaoMercado(dados),
    "",
    montarSecaoResultadoCalculado(resultadoNumerico),
  ].join("\n");
}

function montarSecaoResultadoCalculado({
  valuation,
  prontidao,
}: ResultadoNumericoParaContexto): string {
  const motivoIndisponivel: string[] = [];
  if (!valuation.aplicabilidade.multiplos) {
    motivoIndisponivel.push(
      `Múltiplo de EBITDA e DCF simplificado não aplicáveis (EBITDA-base ${
        valuation.ebitdaBaseUtilizado !== null
          ? formatBRL(valuation.ebitdaBaseUtilizado)
          : "não informado"
      })`,
    );
  }
  if (!valuation.aplicabilidade.patrimonial) {
    motivoIndisponivel.push(
      `Patrimonial não aplicável ao consolidado (Patrimônio Líquido ${
        valuation.valuationPatrimonial !== null
          ? formatBRL(valuation.valuationPatrimonial)
          : "não informado"
      })`,
    );
  }

  return [
    "## Resultado já calculado (contexto de leitura — não recalcule, não conteste, não proponha valor alternativo)",
    `- Múltiplo de EBITDA (Equity Value, dívida líquida já descontada): ${valuation.aplicabilidade.multiplos && valuation.valuationEbitda !== null ? formatBRL(valuation.valuationEbitda) : "não aplicável"}`,
    `- DCF simplificado (Equity Value, dívida líquida já descontada): ${valuation.aplicabilidade.dcf && valuation.valuationDcf !== null ? formatBRL(valuation.valuationDcf) : "não aplicável"}`,
    `- Patrimonial (Equity Value): ${valuation.valuationPatrimonial !== null ? formatBRL(valuation.valuationPatrimonial) : "não informado"}${!valuation.aplicabilidade.patrimonial ? " (não aplicável ao consolidado)" : ""}`,
    `- Estimativa preliminar de Equity Value (50% Múltiplo + 30% DCF + 20% Patrimonial): ${valuation.aplicabilidade.consolidadoDisponivel && valuation.valuationFinal !== null ? formatBRL(valuation.valuationFinal) : "indisponível pelo modelo simplificado"}`,
    ...(motivoIndisponivel.length > 0
      ? [`- Motivo da indisponibilidade: ${motivoIndisponivel.join("; ")}.`]
      : []),
    `- Índice de Prontidão Informacional para M&A: ${prontidao.indiceGeral.toFixed(0)}% (Financeiro ${prontidao.dimensoes.financeiro.nota.toFixed(0)}%, Operacional ${prontidao.dimensoes.operacional.nota.toFixed(0)}%, Mercado ${prontidao.dimensoes.mercado.nota.toFixed(0)}%, Documental ${prontidao.dimensoes.documental.nota.toFixed(0)}%) — mede disponibilidade e estruturação da informação, não a qualidade do negócio.`,
  ].join("\n");
}

/** Exportada para reuso em lib/ai/chat-assistente.ts (mesmo texto de contexto, sem duplicar a lógica). */
export function montarSecaoPerfil(dados: DadosProcesso): string {
  const { perfil } = dados;

  const socios =
    perfil.socios.length > 0
      ? perfil.socios
          .map((s) => `  - ${s.nome} (${s.cargo}, ${s.percentualParticipacao}% de participação)`)
          .join("\n")
      : "  - Nenhum sócio informado.";

  return [
    "## Perfil",
    `- Razão social: ${perfil.razaoSocial || "não informada"}`,
    `- Setor/segmento: ${perfil.setor || "não informado"}`,
    `- Porte: ${PORTE_LABELS[perfil.porte]}`,
    `- Fundação: ${perfil.dataFundacao || "não informada"}`,
    `- Número de funcionários (perfil): ${perfil.numeroFuncionarios}`,
    `- Localização: ${perfil.cidade || "não informada"}/${perfil.uf}`,
    "- Sócios:",
    socios,
  ].join("\n");
}

/** Exportada para reuso em lib/ai/chat-assistente.ts. */
export function montarSecaoFinanceiro(dados: DadosProcesso): string {
  const { financeiro } = dados;
  const anos = anosDreComDados(financeiro.dre);

  const dre =
    anos.length > 0
      ? anos
          .map((ano) => {
            const ebitda = ano.ebitda ?? null;
            const margem =
              ebitda !== null && ano.receitaBruta > 0
                ? `${((ebitda / ano.receitaBruta) * 100).toFixed(1)}%`
                : "N/A";
            return `  - ${ano.ano}: receita bruta ${formatBRL(ano.receitaBruta)}, EBITDA ${ebitda !== null ? formatBRL(ebitda) : "não informado"} (margem ${margem}), lucro líquido ${formatBRL(ano.lucroLiquido)}`;
          })
          .join("\n")
      : "  - Nenhum ano do DRE foi preenchido.";

  const dividas =
    financeiro.dividas.length > 0
      ? financeiro.dividas
          .map(
            (d) =>
              `  - ${d.credor}: ${formatBRL(d.valor)}, taxa ${d.taxaJurosAnual}% a.a., vencimento em ${d.vencimento}`,
          )
          .join("\n")
      : "  - Nenhuma dívida cadastrada.";

  const situacaoDivida =
    financeiro.possuiDividas === "sim"
      ? "possui dívidas financeiras"
      : financeiro.possuiDividas === "nao"
        ? "declarou não possuir dívidas financeiras"
        : "não informada";

  return [
    "## Financeiro",
    "DRE (anos com dados preenchidos):",
    dre,
    "Balanço patrimonial:",
    `  - Ativo total: ${formatBRL(financeiro.balanco.ativoTotal)}`,
    `  - Ativo circulante: ${formatBRL(financeiro.balanco.ativoCirculante)}`,
    `  - Passivo total: ${formatBRL(financeiro.balanco.passivoTotal)}`,
    `  - Passivo circulante: ${formatBRL(financeiro.balanco.passivoCirculante)}`,
    `  - Patrimônio líquido: ${financeiro.balanco.patrimonioLiquido !== undefined ? formatBRL(financeiro.balanco.patrimonioLiquido) : "não informado"}`,
    `  - Caixa e equivalentes de caixa: ${financeiro.caixaEquivalentes !== undefined ? formatBRL(financeiro.caixaEquivalentes) : "não informado"}`,
    `  - Situação de dívida financeira: ${situacaoDivida}`,
    "Dívidas e financiamentos detalhados:",
    dividas,
  ].join("\n");
}

/** Exportada para reuso em lib/ai/chat-assistente.ts. */
export function montarSecaoOperacao(dados: DadosProcesso): string {
  const { operacao } = dados;

  const cargos =
    operacao.cargosEquipe.length > 0
      ? operacao.cargosEquipe
          .map((c) => `  - ${c.cargo}: ${c.quantidade} pessoas`)
          .join("\n")
      : "  - Nenhum cargo detalhado.";

  const clientes =
    operacao.clientesPrincipais.length > 0
      ? operacao.clientesPrincipais
          .map((c) => `  - ${c.nome}: ${c.percentualReceita}% da receita`)
          .join("\n")
      : "  - Nenhum cliente principal informado.";

  const fornecedores =
    operacao.fornecedoresPrincipais.length > 0
      ? operacao.fornecedoresPrincipais
          .map(
            (f) =>
              `  - ${f.nome} (${f.tipoInsumo}), dependência ${NIVEL_DEPENDENCIA_LABELS[f.nivelDependencia]}`,
          )
          .join("\n")
      : "  - Nenhum fornecedor principal informado.";

  return [
    "## Operação",
    `- Número total de funcionários: ${operacao.numeroFuncionariosTotal}`,
    "- Principais cargos/áreas:",
    cargos,
    `- Número de clientes ativos: ${operacao.numeroClientesAtivos}`,
    `- Concentração dos 3 maiores clientes: ${operacao.concentracaoTop3Clientes}% da receita`,
    "- Principais clientes:",
    clientes,
    "- Principais fornecedores:",
    fornecedores,
    `- Descrição dos processos operacionais: ${operacao.processosOperacionais || "não informada"}`,
  ].join("\n");
}

/** Exportada para reuso em lib/ai/chat-assistente.ts. */
export function montarSecaoMercado(dados: DadosProcesso): string {
  const { mercado } = dados;

  const concorrentes =
    mercado.concorrentes.length > 0
      ? mercado.concorrentes
          .map(
            (c) =>
              `  - ${c.nome} (porte ${PORTE_CONCORRENTE_LABELS[c.porteEstimado]}): ${c.diferencialPercebido || "diferencial não informado"}`,
          )
          .join("\n")
      : "  - Nenhum concorrente mapeado.";

  return [
    "## Mercado",
    "- Concorrentes mapeados:",
    concorrentes,
    `- Posicionamento informado: ${mercado.posicionamento || "não informado"}`,
    `- Tamanho de mercado estimado (TAM): ${mercado.tamMercado !== undefined ? formatBRL(mercado.tamMercado) : "não informado"}`,
    `- Sinergias potenciais para M&A: ${mercado.sinergiasPotenciais || "não informadas"}`,
  ].join("\n");
}
