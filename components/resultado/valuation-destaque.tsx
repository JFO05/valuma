import { formatBRL } from "@/lib/format";

/**
 * "Análise preliminar" abaixo do número (Fase 3) reforça, já no primeiro
 * elemento que o usuário vê, que isto não é um laudo definitivo — antes de
 * qualquer outra explicação mais longa (o aviso completo vem no rodapé da
 * página).
 */
export function ValuationDestaque({ valor }: { valor: number }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg bg-zinc-50 p-8 text-center dark:bg-zinc-900">
      <span className="text-sm font-medium text-zinc-500">
        Estimativa preliminar de valuation
      </span>
      <span className="tabular-nums text-4xl font-bold tracking-tight text-ink sm:text-5xl dark:text-accent">
        {formatBRL(valor)}
      </span>
      <span className="text-xs text-zinc-400">Análise preliminar</span>
    </div>
  );
}
