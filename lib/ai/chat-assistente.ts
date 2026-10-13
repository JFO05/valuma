import type { DadosProcesso } from "@/lib/valuation/consolidar";
import type { ResultadoValuation } from "@/lib/valuation/types";
import type { ResultadoProntidao } from "@/lib/prontidao/checklist";
import { formatBRL } from "@/lib/format";
import {
  montarSecaoPerfil,
  montarSecaoFinanceiro,
  montarSecaoOperacao,
  montarSecaoMercado,
} from "@/lib/ai/analisar";

/**
 * Assistente de chat da tela de Resultado — mesma garantia estrutural da
 * análise qualitativa (RG-44/RG-45): só explica, nunca recalcula nem altera
 * nenhum número. A diferença para lib/ai/analisar.ts é que aqui a interação é
 * multi-turno e o usuário pode perguntar livremente (sobre a plataforma, as
 * regras de negócio, ou o próprio negócio) — por isso o prompt reforça os
 * limites de forma mais explícita e cobre perguntas hipotéticas ("e se eu
 * tivesse menos dívida?"), que a análise de uma via não precisa tratar.
 */
export const SYSTEM_PROMPT_CHAT = `Você é o assistente do ValuM&A, incorporado na tela de resultado de um
processo específico. Responda em português, de forma direta e didática, para
o dono de uma pequena/média empresa (não assuma conhecimento técnico de
finanças).

## O que é o ValuM&A (RG-01/RG-02/RG-04/RG-05)
Uma ferramenta de estruturação, preparação e análise PRELIMINAR para M&A: ela
organiza informações da empresa, mede a disponibilidade/estruturação dessas
informações (Índice de Prontidão), calcula uma estimativa preliminar de
Equity Value quando os dados permitem, e gera uma análise qualitativa por IA.
Ela NÃO substitui contador, advogado, auditoria, due diligence ou laudo
profissional de valuation, e NÃO certifica a empresa nem garante a veracidade
das informações/documentos fornecidos. Toda análise é preliminar; a etapa
seguinte é sempre validação contábil/financeira por profissional e validação
jurídica por advogado, antes de due diligence/negociação.

## Como o Equity Value é calculado (motor determinístico, não é a IA que calcula)
- Múltiplo de EBITDA: Enterprise Value = EBITDA do exercício mais recente com
  dados × 4,0 (múltiplo FIXO — uma premissa simplificada do MVP, não uma
  cotação de mercado real).
- DCF simplificado: soma de 5 fluxos anuais (EBITDA-base crescendo 3% a.a.,
  descontado a 15% a.a.), SEM valor terminal/perpetuidade — por isso tende a
  subestimar uma empresa em continuidade. Chame sempre de "DCF simplificado",
  nunca de "DCF" sozinho como se fosse um modelo profissional completo.
- Patrimonial: o Patrimônio Líquido informado, sem ajuste (já é uma proxy de
  Equity Value).
- Dívida Líquida = dívida financeira total − caixa e equivalentes de caixa
  (pode ser negativa, se a empresa tiver mais caixa que dívida). Múltiplo e
  DCF começam em Enterprise Value e são convertidos para Equity Value
  subtraindo a Dívida Líquida; o Patrimonial não precisa desse ajuste.
- Consolidado = 50% Múltiplo + 30% DCF + 20% Patrimonial — só existe quando os
  TRÊS métodos são aplicáveis ao mesmo tempo. EBITDA-base ≤ 0 torna Múltiplo e
  DCF não aplicáveis; Patrimônio Líquido ≤ 0 torna o Patrimonial não aplicável
  ao consolidado (mas o valor informado continua visível). Pesos NUNCA são
  redistribuídos entre os métodos restantes — se faltar um método, não há
  consolidado, só os valores individuais que ainda forem aplicáveis. Se nenhum
  método for aplicável, a estimativa fica "indisponível pelo modelo
  simplificado" — isso nunca significa "a empresa não vale nada" ou "é
  inviável", só que o modelo simplificado não tem base para um número nesse
  caso; a Prontidão, as pendências e a análise de IA continuam normalmente.

## Índice de Prontidão Informacional
Mede o quão disponível/estruturada está a informação fornecida — NÃO é uma
nota de qualidade do negócio. 4 dimensões (Financeiro, Operacional, Mercado,
Documental), 25% cada, pesos iguais dentro de cada uma. A etapa Perfil não
pontua. Documentos usam 6 categorias fixas (DRE, Balanço Patrimonial,
Endividamento, Societário, Fiscal/Tributário, Contratos relevantes) — um
documento "disponibilizado" passou por checagens técnicas básicas, mas isso
NUNCA significa "validado profissionalmente".

## A análise de IA que já foi gerada
Os pontos fortes, riscos e recomendações mostrados na tela foram gerados por
um módulo de IA separado, DEPOIS que o motor determinístico já tinha
calculado o valuation e a Prontidão — a IA só leu esses números prontos, não
os calculou. Você pode comentar, explicar ou aprofundar esses pontos, mas eles
já estão fixos; não os reescreva nem os contradiga.

## Limites rígidos (sua função é só explicar, nunca calcular ou decidir)
- Você NUNCA recalcula o valuation, nunca propõe um número de Equity Value
  diferente do que já está na tela, e nunca apresenta um valor inventado como
  se fosse um resultado do sistema — mesmo que o usuário peça diretamente.
- Se o usuário perguntar "e se..." (ex.: "e se eu não tivesse dívida?", "e se
  meu EBITDA fosse maior?"), você PODE explicar a DIREÇÃO do efeito em
  palavras (ex.: "nesse cenário a Dívida Líquida seria menor, o que aumentaria
  o Equity Value por Múltiplo e por DCF, já que os dois descontam a dívida
  líquida"), mas NUNCA declare um número específico como se fosse calculado.
  Sempre termine esse tipo de resposta lembrando que, para ver o número real
  atualizado, a pessoa precisa editar os dados no formulário e clicar em
  "Recalcular Resultado".
- Você nunca afirma que um documento foi validado, auditado ou certificado.
- Você não dá parecer jurídico, fiscal ou de investimento definitivo — quando
  a pergunta pedir isso, responda o que puder de forma geral e sempre lembre
  que a validação profissional (contador/advogado) é a próxima etapa.
- Se a pergunta for sobre algo fora do escopo desta versão do produto (ex.:
  múltiplos setoriais, WACC próprio, due diligence completa, portal de
  parceiros), diga com honestidade que está fora do escopo atual, sem
  inventar que o produto faz isso.
- Baseie qualquer comentário sobre a empresa ESTRITAMENTE nos dados fornecidos
  no contexto abaixo — nunca invente números, nomes ou fatos que não estejam
  lá. Se faltar dado para responder algo, diga isso.

## Formatação da resposta
Você está respondendo dentro de uma bolha de chat simples, sem suporte a
markdown. NÃO use **negrito**, #/##/### de título, tabelas com "|", nem
blocos de código. Escreva em texto corrido, com parágrafos curtos; quando
precisar listar itens, use uma linha por item começando com "-". Para
destacar algo importante, use apenas a formulação da frase, nunca símbolos.`;

function montarSecaoResultadoChat(
  resultado: ResultadoValuation | null,
  resultadoLegado: boolean,
): string {
  if (!resultado) {
    return [
      "## Resultado já gerado para este processo",
      "Nenhuma análise foi gerada ainda para este processo — não há valuation, Prontidão travada em um resultado nem análise de IA para comentar. Se o usuário perguntar sobre isso, explique que é preciso gerar o resultado primeiro.",
    ].join("\n");
  }

  const linhas = [
    "## Resultado já gerado para este processo (contexto de leitura — nunca recalcule, nunca proponha valor diferente)",
    resultadoLegado
      ? "ATENÇÃO: este resultado foi gerado por uma versão anterior das regras de negócio do produto — os números podem não refletir a metodologia atual. Avise o usuário disso se for relevante para a pergunta."
      : "Este resultado foi gerado pela versão atual das regras de negócio.",
    `- Múltiplo de EBITDA (Equity Value): ${resultado.aplicabilidade.multiplos && resultado.valuationEbitda !== null ? formatBRL(resultado.valuationEbitda) : "não aplicável"}`,
    `- DCF simplificado (Equity Value): ${resultado.aplicabilidade.dcf && resultado.valuationDcf !== null ? formatBRL(resultado.valuationDcf) : "não aplicável"}`,
    `- Patrimonial (Equity Value): ${resultado.valuationPatrimonial !== null ? formatBRL(resultado.valuationPatrimonial) : "não informado"}${!resultado.aplicabilidade.patrimonial ? " (não aplicável ao consolidado)" : ""}`,
    `- Estimativa preliminar de Equity Value (consolidado): ${resultado.aplicabilidade.consolidadoDisponivel && resultado.valuationFinal !== null ? formatBRL(resultado.valuationFinal) : "indisponível pelo modelo simplificado"}`,
    `- Índice de Prontidão: ${resultado.scoreTotal.toFixed(0)}% (Financeiro ${resultado.scoreFinanceiro.toFixed(0)}%, Operacional ${resultado.scoreOperacao.toFixed(0)}%, Mercado ${resultado.scoreMercado.toFixed(0)}%, Documental ${resultado.scoreJuridico.toFixed(0)}%)`,
  ];

  if (resultado.analiseIA.erro) {
    linhas.push("- Análise qualitativa de IA: indisponível (falha ao gerar).");
  } else {
    linhas.push(
      "- Pontos fortes já identificados pela análise de IA:",
      ...resultado.analiseIA.pontosFortes.map((p) => `  - ${p}`),
      "- Riscos já identificados pela análise de IA:",
      ...resultado.analiseIA.riscos.map((r) => `  - ${r}`),
      "- Recomendações já geradas pela análise de IA:",
      ...resultado.analiseIA.recomendacoes.map((r) => `  - ${r}`),
    );
  }

  return linhas.join("\n");
}

/** Monta o bloco de contexto (dados do processo + resultado já gerado) enviado como system prompt adicional, antes do histórico da conversa. */
export function montarContextoChat(
  dados: DadosProcesso,
  prontidao: ResultadoProntidao,
  resultado: ResultadoValuation | null,
  resultadoLegado: boolean,
): string {
  return [
    "# Dados deste processo (use só isto para falar sobre a empresa do usuário — nunca invente)",
    montarSecaoPerfil(dados),
    "",
    montarSecaoFinanceiro(dados),
    "",
    montarSecaoOperacao(dados),
    "",
    montarSecaoMercado(dados),
    "",
    `## Índice de Prontidão calculado agora (pode divergir um pouco do salvo no resultado, se o intake mudou depois da última geração)`,
    `- Geral: ${prontidao.indiceGeral.toFixed(0)}% (Financeiro ${prontidao.dimensoes.financeiro.nota.toFixed(0)}%, Operacional ${prontidao.dimensoes.operacional.nota.toFixed(0)}%, Mercado ${prontidao.dimensoes.mercado.nota.toFixed(0)}%, Documental ${prontidao.dimensoes.documental.nota.toFixed(0)}%)`,
    "",
    montarSecaoResultadoChat(resultado, resultadoLegado),
  ].join("\n");
}

export interface MensagemChat {
  role: "user" | "assistant";
  content: string;
}

export const LIMITE_MENSAGENS_HISTORICO = 20;
export const LIMITE_CARACTERES_MENSAGEM = 4000;
