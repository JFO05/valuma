import { formatBRL } from "@/lib/format";

/**
 * Rótulo/subtítulo oficiais (RG-52/RG-54 de docs/REGRAS_NEGOCIO_VALUMA_V1.md,
 * Fase 6.1). Quando nenhum método de valuation é aplicável (RG-25), o
 * consolidado é `null` — a mensagem oficial explica a limitação sem sugerir
 * "empresa sem valor" ou "empresa inviável".
 */
export function ValuationDestaque({ valor }: { valor: number | null }) {
  if (valor === null) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg bg-zinc-50 p-8 text-center dark:bg-zinc-900">
        <span className="text-lg font-semibold text-ink dark:text-zinc-50">
          Estimativa preliminar de Equity Value indisponível pelo modelo simplificado
        </span>
        <p className="max-w-md text-sm text-zinc-600 dark:text-zinc-400">
          Com os dados financeiros informados, nenhum dos três métodos do
          modelo simplificado pôde ser combinado em um consolidado. Isso não
          significa que a empresa não tenha valor — veja a seção
          &quot;Como chegamos a este resultado&quot; para entender exatamente
          o que impediu o cálculo.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1 rounded-lg bg-zinc-50 p-8 text-center dark:bg-zinc-900">
      <span className="text-sm font-medium text-zinc-500">
        Estimativa preliminar de Equity Value
      </span>
      <span className="tabular-nums text-4xl font-bold tracking-tight text-ink sm:text-5xl dark:text-accent">
        {formatBRL(valor)}
      </span>
      <span className="text-xs text-zinc-400">
        Estimativa preliminar do valor econômico atribuível aos sócios.
      </span>
    </div>
  );
}
