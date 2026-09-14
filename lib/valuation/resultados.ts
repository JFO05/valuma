import type { ResultadoValuation } from "./types";

/** Formato de uma linha de public.resultados, como o Postgres devolve. */
interface ResultadoRow {
  valuation_final: number;
  valuation_ebitda: number;
  valuation_dcf: number;
  valuation_patrimonial: number;
  score_total: number;
  score_financeiro: number;
  score_operacao: number;
  score_mercado: number;
  score_juridico: number;
  analise_ia: ResultadoValuation["analiseIA"];
}

/**
 * Converte uma linha crua de public.resultados (colunas snake_case) para o
 * shape ResultadoValuation (mesmo formato do mock em lib/valuation/mock.ts e
 * esperado pela tela de resultado). Reaproveite isso ao trocar o mock da
 * tela pela busca real em public.resultados.
 */
export function mapRowParaResultadoValuation(
  row: ResultadoRow,
): ResultadoValuation {
  return {
    valuationFinal: row.valuation_final,
    valuationEbitda: row.valuation_ebitda,
    valuationDcf: row.valuation_dcf,
    valuationPatrimonial: row.valuation_patrimonial,
    scoreTotal: row.score_total,
    scoreFinanceiro: row.score_financeiro,
    scoreOperacao: row.score_operacao,
    scoreMercado: row.score_mercado,
    scoreJuridico: row.score_juridico,
    analiseIA: row.analise_ia,
  };
}
