import { formatBRL } from "@/lib/format";
import type { ResultadoValuation } from "@/lib/valuation/types";

const METODOS = [
  { chave: "valuationEbitda", label: "Múltiplo de EBITDA", peso: 50 },
  { chave: "valuationDcf", label: "Fluxo de Caixa Descontado", peso: 30 },
  { chave: "valuationPatrimonial", label: "Patrimonial", peso: 20 },
] as const;

export function ValuationBreakdown({
  resultado,
}: {
  resultado: ResultadoValuation;
}) {
  const maiorValor = Math.max(...METODOS.map((m) => resultado[m.chave]), 1);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {METODOS.map((metodo) => {
        const valor = resultado[metodo.chave];

        return (
          <div
            key={metodo.chave}
            className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              {metodo.label}
            </span>
            <span className="text-xl font-semibold">{formatBRL(valor)}</span>
            <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div
                className="h-full rounded-full bg-black dark:bg-white"
                style={{ width: `${(valor / maiorValor) * 100}%` }}
              />
            </div>
            <span className="text-xs text-zinc-500">
              Peso na média final: {metodo.peso}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
