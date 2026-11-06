import { Reveal } from "@/components/ui/reveal";
import { AnimatedBarFill } from "@/components/ui/animated-bar-fill";

/**
 * Mockup do relatório de resultado (item 5 do plano da landing) — mesmas 3
 * metodologias e os mesmos pesos reais do motor (lib/valuation/calcular.ts
 * e components/resultado/valuation-breakdown.tsx: EBITDA 50%, DCF 30%,
 * Patrimonial 20%). Valores em reais são só exemplo, rotulados como tal —
 * o que não muda é a estrutura/peso, que é a mesma do sistema de verdade.
 */
const METODOS = [
  { label: "Múltiplo de EBITDA", peso: 50, valor: "R$ 2.340.000", largura: 100 },
  { label: "DCF simplificado", peso: 30, valor: "R$ 2.180.000", largura: 93 },
  { label: "Patrimonial", peso: 20, valor: "R$ 1.650.000", largura: 70 },
] as const;

export function SecaoResultado() {
  return (
    <section className="mx-auto w-full max-w-5xl px-6 py-24 sm:py-32">
      <Reveal className="flex flex-col items-center gap-3 text-center">
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
          O resultado
        </span>
        <h2 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl dark:text-zinc-50">
          Um número, três metodologias, nenhuma caixa-preta
        </h2>
        <p className="max-w-xl text-balance text-sm text-zinc-600 dark:text-zinc-400">
          A estimativa consolidada combina três métodos financeiros
          clássicos, cada um com peso fixo e transparente — nunca escolhido
          caso a caso.
        </p>
      </Reveal>

      <Reveal delayMs={100}>
        <div className="relative mt-12 overflow-hidden rounded-[1.75rem] border border-zinc-900/5 bg-white p-8 sm:p-10 dark:border-white/5 dark:bg-zinc-900">
          <div
            aria-hidden="true"
            className="glow-accent pointer-events-none absolute inset-x-0 top-0 h-48"
          />

          <div className="relative flex flex-col items-center gap-1.5 text-center">
            <span className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-400">
              Exemplo ilustrativo
            </span>
            <span className="text-sm font-medium text-zinc-500">
              Estimativa preliminar de Equity Value
            </span>
            <span className="tabular-nums text-4xl font-bold tracking-tight text-ink sm:text-5xl dark:text-zinc-50">
              R$ 2.150.000
            </span>
          </div>

          <div className="relative mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {METODOS.map((metodo) => (
              <div
                key={metodo.label}
                className="flex flex-col gap-2 rounded-xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  {metodo.label}
                </span>
                <span className="text-lg font-semibold tabular-nums text-ink dark:text-zinc-50">
                  {metodo.valor}
                </span>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <AnimatedBarFill valor={metodo.largura} className="bg-ink dark:bg-accent" />
                </div>
                <span className="text-xs text-zinc-500">
                  Peso no consolidado: {metodo.peso}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </section>
  );
}
