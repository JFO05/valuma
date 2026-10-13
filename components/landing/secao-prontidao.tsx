import { Reveal } from "@/components/ui/reveal";

const DIMENSOES = [
  { label: "Financeiro", valor: 82 },
  { label: "Operacional", valor: 68 },
  { label: "Mercado", valor: 75 },
  { label: "Documental", valor: 67 },
];

/**
 * Comunica nível de PREPARAÇÃO INFORMACIONAL, nunca "sua empresa é X% boa"
 * (regra explícita do redesign) — mesmo cuidado de texto já usado em
 * components/resultado/score-gauge.tsx.
 */
export function SecaoProntidao() {
  return (
    <section id="para-quem-e" className="py-24 sm:py-32">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-12 px-6 sm:flex-row sm:items-center sm:gap-16">
        <Reveal className="flex max-w-md flex-col gap-4">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
            Índice de Prontidão
          </span>
          <h2 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl dark:text-zinc-50">
            Nível de preparação informacional, não uma nota da empresa
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Financeiro, operacional, mercado e documental — cada dimensão
            mostra o quanto das informações esperadas está disponível e
            estruturalmente válida, para guiar o que organizar antes de uma
            negociação.
          </p>
        </Reveal>

        <Reveal delayMs={150} className="w-full max-w-sm">
          <div className="flex flex-col gap-4 rounded-2xl border border-black/10 bg-black/[0.03] p-6 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
            {DIMENSOES.map((dimensao) => (
              <div key={dimensao.label} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-sm text-zinc-600 dark:text-zinc-400">
                  {dimensao.label}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-ink dark:bg-accent"
                    style={{ width: `${dimensao.valor}%` }}
                  />
                </div>
                <span className="w-9 shrink-0 text-right text-sm font-medium tabular-nums text-ink dark:text-zinc-50">
                  {dimensao.valor}%
                </span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
