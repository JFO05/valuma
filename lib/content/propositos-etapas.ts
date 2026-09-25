import type { FaseIntake } from "@/lib/intake/fases";

/**
 * Frase curta mostrada abaixo do título de cada etapa do intake (Fase 4.6)
 * — explica por que os dados daquela etapa são pedidos. Centralizado aqui
 * (não espalhado pelos formulários) para facilitar manter coerente com a
 * fórmula real do motor (lib/valuation/calcular.ts, lib/prontidao/
 * checklist.ts) conforme os dados evoluem.
 */
export const PROPOSITO_ETAPA: Record<FaseIntake, string> = {
  perfil:
    "Esses dados identificam a empresa nas telas e documentos gerados. Não entram no cálculo da estimativa de valuation nem do Índice de Prontidão.",
  financeiro:
    "Esses dados são utilizados na estimativa preliminar de valuation (principalmente o EBITDA mais recente e o patrimônio líquido) e na dimensão Financeira do Índice de Prontidão.",
  operacao:
    "Esses dados alimentam a dimensão Operacional do Índice de Prontidão para M&A. Não entram no cálculo da estimativa de valuation.",
  mercado:
    "Esses dados alimentam a dimensão Mercado do Índice de Prontidão para M&A. Não entram no cálculo da estimativa de valuation.",
  documentos:
    "Os documentos ajudam a avaliar a disponibilidade das informações necessárias para a análise — formam a dimensão Documental do Índice de Prontidão.",
};
