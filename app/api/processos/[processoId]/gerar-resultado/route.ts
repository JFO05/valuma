import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { consolidarDadosProcesso } from "@/lib/valuation/consolidar";
import { calcularValuation } from "@/lib/valuation/calcular";
import { calcularProntidao } from "@/lib/prontidao/checklist";
import { analisarComIA } from "@/lib/ai/analisar";
import { mapRowParaResultadoValuation } from "@/lib/valuation/resultados";
import { verificarCamposObrigatorios } from "@/lib/valuation/campos-obrigatorios";
import { MODEL_VERSION, type ResultadoValuation } from "@/lib/valuation/types";
import { configuracaoMotorValida } from "@/lib/valuation/motor";
import { configuracaoMotorParaCalculo } from "@/lib/intake/schema-motor";

export async function POST(
  _request: Request,
  { params }: RouteContext<"/api/processos/[processoId]/gerar-resultado">,
) {
  const { processoId } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  // RLS já garante isso nas queries abaixo, mas confirmamos explicitamente
  // para devolver um 404 claro em vez de deixar o restante falhar calado.
  const { data: processo, error: processoError } = await supabase
    .from("processos")
    .select("id")
    .eq("id", processoId)
    .maybeSingle();

  if (processoError || !processo) {
    return NextResponse.json(
      { error: "Processo não encontrado." },
      { status: 404 },
    );
  }

  const dados = await consolidarDadosProcesso(processoId);

  // Campos mínimos (RG-40) — únicos que realmente bloqueiam a geração,
  // checados de novo aqui porque a rota é alcançável por qualquer request,
  // não só pelo clique no botão. Ver lib/valuation/campos-obrigatorios.ts.
  const pendencias = verificarCamposObrigatorios(dados);
  if (pendencias.length > 0) {
    return NextResponse.json(
      {
        error:
          "Faltam informações obrigatórias para gerar o resultado. Complete o intake antes de tentar novamente.",
        pendencias,
      },
      { status: 422 },
    );
  }

  // V2 — Motor de Análise: o Motor Configurável exige pelo menos 1 método
  // ativo com os pesos somando 100% entre os ativos (seção 2.2 do prompt de
  // evolução). Checado aqui também (não só na UI) pelo mesmo motivo de
  // verificarCamposObrigatorios acima — a rota é alcançável por qualquer
  // request HTTP. O Motor Essencial sempre passa (pesos fixos já somam 100%).
  const configuracaoCalculo = configuracaoMotorParaCalculo(dados.motor.configuracao);
  if (!configuracaoMotorValida(dados.motor.tipo, configuracaoCalculo)) {
    return NextResponse.json(
      {
        error:
          "A configuração do Motor Configurável é inválida — ative pelo menos 1 método e ajuste os pesos para totalizar 100% entre os métodos ativos antes de gerar o resultado.",
      },
      { status: 422 },
    );
  }

  const valuation = calcularValuation(dados, configuracaoCalculo);
  const prontidao = calcularProntidao(dados);

  // RG-25/RG-26: mesmo com NENHUM método de valuation aplicável, o
  // resultado (Prontidão + pendências + análise de IA) continua sendo
  // gerado — nunca um erro 422 aqui. A ausência de consolidado é um estado
  // de negócio válido, não uma falha técnica.
  const analiseIA = await analisarComIA(dados, { valuation, prontidao });

  // Fase 2 / D3: colunas score_* reaproveitadas para o Índice de Prontidão
  // (financeiro/operacional/mercado/documental) — ver comentário em
  // lib/valuation/types.ts::ResultadoValuation. A versão da Regra de
  // Negócio (RG-47) é gravada em `modelo_versao`, coluna própria,
  // INDEPENDENTE de `analiseIA`/`analise_ia` (DIV-02 da auditoria
  // pós-implementação) — por isso é atribuída fora do objeto `analiseIA`,
  // incondicionalmente, mesmo que a chamada à IA tenha falhado acima.
  const resultado: ResultadoValuation = {
    valuationFinal: valuation.valuationFinal,
    valuationEbitda: valuation.valuationEbitda,
    valuationDcf: valuation.valuationDcf,
    valuationPatrimonial: valuation.valuationPatrimonial,
    modeloVersao: MODEL_VERSION,
    // V2: snapshot do Motor usado NESTA geração — independente da fase
    // "motor" atual do intake (se o usuário mudar o Motor depois, este
    // resultado continua mostrando o que foi realmente usado pra calculá-lo).
    motorSnapshot: { tipo: dados.motor.tipo, configuracao: configuracaoCalculo },
    aplicabilidade: valuation.aplicabilidade,
    scoreTotal: prontidao.indiceGeral,
    scoreFinanceiro: prontidao.dimensoes.financeiro.nota,
    scoreOperacao: prontidao.dimensoes.operacional.nota,
    scoreMercado: prontidao.dimensoes.mercado.nota,
    scoreJuridico: prontidao.dimensoes.documental.nota,
    analiseIA: {
      ...analiseIA,
      explicabilidade: {
        evMultiplos: valuation.evMultiplos,
        evDcf: valuation.evDcf,
        dividaFinanceiraTotal: valuation.dividaFinanceiraTotal,
        caixaEquivalentes: valuation.caixaEquivalentes,
        dividaLiquida: valuation.dividaLiquida,
      },
    },
  };

  const { data: salvo, error: saveError } = await supabase
    .from("resultados")
    .upsert(
      {
        processo_id: processoId,
        valuation_final: resultado.valuationFinal,
        valuation_ebitda: resultado.valuationEbitda,
        valuation_dcf: resultado.valuationDcf,
        valuation_patrimonial: resultado.valuationPatrimonial,
        modelo_versao: resultado.modeloVersao,
        motor_snapshot: resultado.motorSnapshot,
        score_total: resultado.scoreTotal,
        score_financeiro: resultado.scoreFinanceiro,
        score_operacao: resultado.scoreOperacao,
        score_mercado: resultado.scoreMercado,
        score_juridico: resultado.scoreJuridico,
        analise_ia: resultado.analiseIA,
      },
      { onConflict: "processo_id" },
    )
    .select()
    .single();

  if (saveError || !salvo) {
    return NextResponse.json(
      { error: saveError?.message ?? "Falha ao salvar o resultado." },
      { status: 500 },
    );
  }

  // Melhor esforço: reflete no dashboard que o processo já tem um resultado
  // gerado. Não falha a requisição se isso não gravar — o resultado em si já
  // foi salvo com sucesso acima, que é o que importa.
  await supabase
    .from("processos")
    .update({ status: "concluido" })
    .eq("id", processoId);

  return NextResponse.json({
    resultado: mapRowParaResultadoValuation(salvo),
  });
}
