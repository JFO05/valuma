import { formatBRL } from "@/lib/format";
import type { AplicabilidadeMetodos, ResultadoValuation } from "@/lib/valuation/types";

const METODOS = [
  { chave: "valuationEbitda", label: "Múltiplo de EBITDA", peso: 50, aplicavel: "multiplos" },
  { chave: "valuationDcf", label: "DCF simplificado", peso: 30, aplicavel: "dcf" },
  { chave: "valuationPatrimonial", label: "Patrimonial", peso: 20, aplicavel: "patrimonial" },
] as const satisfies readonly {
  chave: keyof Pick<ResultadoValuation, "valuationEbitda" | "valuationDcf" | "valuationPatrimonial">;
  label: string;
  peso: number;
  aplicavel: keyof AplicabilidadeMetodos;
}[];

/** RG-20/RG-21: método não aplicável mostra o motivo, nunca um valor zero literal (Fase 6.5 do prompt de implementação). */
export function ValuationBreakdown({
  resultado,
}: {
  resultado: ResultadoValuation;
}) {
  const valoresAplicaveis = METODOS.filter((m) => resultado.aplicabilidade[m.aplicavel] && resultado[m.chave] !== null).map(
    (m) => resultado[m.chave] as number,
  );
  const maiorValor = Math.max(...valoresAplicaveis, 1);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {METODOS.map((metodo) => {
        const valor = resultado[metodo.chave];
        const aplicavel = resultado.aplicabilidade[metodo.aplicavel];

        return (
          <div
            key={metodo.chave}
            className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              {metodo.label}
            </span>
            {aplicavel && valor !== null ? (
              <>
                <span className="text-xl font-semibold">{formatBRL(valor)}</span>
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-black dark:bg-white"
                    style={{ width: `${(valor / maiorValor) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-zinc-500">
                  Peso no consolidado: {metodo.peso}%
                </span>
              </>
            ) : (
              <>
                <span className="text-sm text-zinc-500">Não aplicável</span>
                {valor !== null && (
                  <span className="text-xs text-zinc-400">
                    Valor informado: {formatBRL(valor)} (não entra no consolidado)
                  </span>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
