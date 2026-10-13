import { MODEL_VERSION, type AplicabilidadeMetodos, type ResultadoValuation } from "./types";
import type { MotorSnapshot } from "./motor";

/** Formato de uma linha de public.resultados, como o Postgres devolve. */
interface ResultadoRow {
  valuation_final: number | null;
  valuation_ebitda: number | null;
  valuation_dcf: number | null;
  valuation_patrimonial: number | null;
  score_total: number;
  score_financeiro: number;
  score_operacao: number;
  score_mercado: number;
  score_juridico: number;
  analise_ia: ResultadoValuation["analiseIA"];
  modelo_versao: string | null;
  /** V2 — null em resultados gerados antes do Motor de Análise existir. */
  motor_snapshot: MotorSnapshot | null;
}

/**
 * A aplicabilidade de cada método (RG-20/RG-21/RG-24) é 100% derivável dos
 * próprios valores persistidos, sem precisar de nenhuma coluna/campo extra:
 * Múltiplos e DCF só têm um valor gravado quando eram aplicáveis (o motor
 * nunca grava um "valor" para um método não aplicável — ver
 * lib/valuation/calcular.ts); o Patrimonial sempre grava o valor informado
 * (mesmo quando ≤ 0, para permanecer visível — RG-21), então sua
 * aplicabilidade depende também do sinal. O consolidado existe exatamente
 * quando `valuation_final` não é nulo (RG-24).
 */
function derivarAplicabilidade(row: ResultadoRow): AplicabilidadeMetodos {
  return {
    multiplos: row.valuation_ebitda !== null,
    dcf: row.valuation_dcf !== null,
    patrimonial: row.valuation_patrimonial !== null && row.valuation_patrimonial > 0,
    consolidadoDisponivel: row.valuation_final !== null,
  };
}

/**
 * Converte uma linha crua de public.resultados (colunas snake_case) para o
 * shape ResultadoValuation (mesmo formato esperado pela tela de resultado).
 */
export function mapRowParaResultadoValuation(
  row: ResultadoRow,
): ResultadoValuation {
  return {
    valuationFinal: row.valuation_final,
    valuationEbitda: row.valuation_ebitda,
    valuationDcf: row.valuation_dcf,
    valuationPatrimonial: row.valuation_patrimonial,
    modeloVersao: row.modelo_versao,
    // V2: `null` = resultado gerado antes do Motor de Análise existir — o
    // consumidor decide como tratar isso (mesmo padrão de `modeloVersao`
    // acima); ver lib/valuation/motor.ts::MOTOR_SNAPSHOT_LEGADO para o
    // fallback já pronto, usado por components/resultado/como-chegamos.tsx.
    motorSnapshot: row.motor_snapshot,
    aplicabilidade: derivarAplicabilidade(row),
    scoreTotal: row.score_total,
    scoreFinanceiro: row.score_financeiro,
    scoreOperacao: row.score_operacao,
    scoreMercado: row.score_mercado,
    scoreJuridico: row.score_juridico,
    analiseIA: row.analise_ia,
  };
}

/**
 * Resultado gerado antes do versionamento explícito do modelo existir, ou
 * com uma versão diferente da atual (RG-47). Lê exclusivamente
 * `resultado.modeloVersao` (coluna própria `resultados.modelo_versao`) —
 * NUNCA `analiseIA`/`analise_ia` (achado DIV-02 da auditoria
 * pós-implementação: a versão precisa ser independente do JSON da IA, então
 * uma falha ou ausência da análise de IA nunca pode afetar esta checagem).
 * `null` (ausência de versão, inclusive todo resultado gerado antes desta
 * coluna existir) é sempre tratado como legado.
 */
export function ehResultadoLegado(resultado: ResultadoValuation): boolean {
  return resultado.modeloVersao !== MODEL_VERSION;
}
