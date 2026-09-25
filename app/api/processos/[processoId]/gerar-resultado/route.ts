import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { consolidarDadosProcesso } from "@/lib/valuation/consolidar";
// TODO(Pessoa B): se calcularValuation/calcularScore ainda não existirem no
// momento de rodar isso, comente as duas linhas abaixo e use stubs com a
// mesma assinatura, por exemplo:
//   type ResultadoCalculoValuationStub = { valuationEbitda: number | null; valuationDcf: number | null; valuationPatrimonial: number; valuationFinal: number | null };
//   type ResultadoScoreStub = { scoreFinanceiro: number; scoreOperacao: number; scoreMercado: number; scoreJuridico: number; scoreTotal: number };
//   function calcularValuation(): ResultadoCalculoValuationStub { return { valuationEbitda: 0, valuationDcf: 0, valuationPatrimonial: 0, valuationFinal: 0 }; }
//   function calcularScore(): ResultadoScoreStub { return { scoreFinanceiro: 50, scoreOperacao: 50, scoreMercado: 50, scoreJuridico: 50, scoreTotal: 50 }; }
// e trocar pela importação real assim que as funções existirem. No momento
// em que esta rota foi escrita, ambas já existiam em lib/valuation/, então
// os stubs não foram necessários.
import { calcularValuation } from "@/lib/valuation/calcular";
import { calcularScore } from "@/lib/valuation/score";
import { analisarComIA } from "@/lib/ai/analisar";
import { mapRowParaResultadoValuation } from "@/lib/valuation/resultados";
import { verificarCamposObrigatorios } from "@/lib/valuation/campos-obrigatorios";
import type { ResultadoValuation } from "@/lib/valuation/types";

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

  // DEF-01: mesmo checklist mínimo (decisão D2) que já esconde o botão na
  // tela — verificado de novo aqui porque a rota é alcançável por qualquer
  // request, não só pelo clique no botão. Ver lib/valuation/campos-obrigatorios.ts.
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

  const valuation = calcularValuation(dados);
  const score = calcularScore(dados);

  // Guarda defensiva: com o checklist acima, valuationEbitda/valuationDcf
  // nunca deveriam vir null aqui — mantido como rede de segurança caso o
  // checklist e o motor divirjam no futuro.
  if (valuation.valuationEbitda === null || valuation.valuationDcf === null) {
    return NextResponse.json(
      {
        error:
          "Não há dados financeiros suficientes (nenhum ano do DRE preenchido) para gerar o resultado deste processo.",
      },
      { status: 422 },
    );
  }

  const analiseIA = await analisarComIA(dados);

  const resultado: ResultadoValuation = {
    valuationFinal: valuation.valuationFinal ?? valuation.valuationPatrimonial,
    valuationEbitda: valuation.valuationEbitda,
    valuationDcf: valuation.valuationDcf,
    valuationPatrimonial: valuation.valuationPatrimonial,
    scoreTotal: score.scoreTotal,
    scoreFinanceiro: score.scoreFinanceiro,
    scoreOperacao: score.scoreOperacao,
    scoreMercado: score.scoreMercado,
    scoreJuridico: score.scoreJuridico,
    analiseIA,
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
