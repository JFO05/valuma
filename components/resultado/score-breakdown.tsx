import type { ResultadoValuation } from "@/lib/valuation/types";

// Rótulos do Índice de Prontidão. As chaves continuam apontando para os
// mesmos campos de ResultadoValuation/colunas do banco (score_*) — só o
// rótulo mostrado reflete o significado atual (Documental, não Jurídico).
const DIMENSOES = [
  { chave: "scoreFinanceiro", label: "Financeiro" },
  { chave: "scoreOperacao", label: "Operacional" },
  { chave: "scoreMercado", label: "Mercado" },
  { chave: "scoreJuridico", label: "Documental" },
] as const;

export function ScoreBreakdown({
  resultado,
}: {
  resultado: ResultadoValuation;
}) {
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
      {DIMENSOES.map((dimensao) => {
        const valor = resultado[dimensao.chave];

        return (
          <div key={dimensao.chave} className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-sm text-zinc-600 dark:text-zinc-400">
              {dimensao.label}
            </span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className="h-full rounded-full bg-zinc-400 transition-[width] duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] dark:bg-zinc-500"
                style={{ width: `${valor}%` }}
              />
            </div>
            <span className="w-10 shrink-0 text-right text-sm font-medium tabular-nums text-ink dark:text-zinc-50">
              {valor.toFixed(0)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
