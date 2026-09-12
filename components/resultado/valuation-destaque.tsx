import { formatBRL } from "@/lib/format";

export function ValuationDestaque({ valor }: { valor: number }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg bg-zinc-50 p-8 text-center dark:bg-zinc-900">
      <span className="text-sm font-medium text-zinc-500">
        Valuation estimado
      </span>
      <span className="text-4xl font-bold tracking-tight sm:text-5xl">
        {formatBRL(valor)}
      </span>
    </div>
  );
}
