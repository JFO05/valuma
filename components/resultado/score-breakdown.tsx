import type { ResultadoValuation } from "@/lib/valuation/types";

const DIMENSOES = [
  { chave: "scoreFinanceiro", label: "Financeiro" },
  { chave: "scoreOperacao", label: "Operação" },
  { chave: "scoreMercado", label: "Mercado" },
  { chave: "scoreJuridico", label: "Jurídico" },
] as const;

export function ScoreBreakdown({
  resultado,
}: {
  resultado: ResultadoValuation;
}) {
  return (
    <div className="flex flex-col gap-3">
      {DIMENSOES.map((dimensao) => {
        const valor = resultado[dimensao.chave];

        return (
          <div key={dimensao.chave} className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-sm text-zinc-600 dark:text-zinc-400">
              {dimensao.label}
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div
                className="h-full rounded-full bg-black dark:bg-white"
                style={{ width: `${valor}%` }}
              />
            </div>
            <span className="w-10 shrink-0 text-right text-sm font-medium">
              {valor.toFixed(0)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
