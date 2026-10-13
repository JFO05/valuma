import { Reveal } from "@/components/ui/reveal";

const FLUXO = [
  "ValuM&A",
  "Validação contábil/financeira",
  "Validação jurídica",
  "Due diligence / negociação",
];

export function SecaoProfissionais() {
  return (
    <section id="sobre" className="mx-auto w-full max-w-4xl px-6 py-24 sm:py-32">
      <Reveal className="flex flex-col items-center gap-4 text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl dark:text-zinc-50">
          O ValuM&amp;A prepara. Profissionais validam.
        </h2>
        <p className="max-w-lg text-balance text-sm text-zinc-600 dark:text-zinc-400">
          A análise é um ponto de partida estruturado — não substitui
          avaliação contábil, financeira, jurídica ou due diligence
          profissional.
        </p>
      </Reveal>

      <Reveal delayMs={120}>
        <div className="mt-12 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          {FLUXO.map((etapa, indice) => (
            <div key={etapa} className="flex items-center gap-3">
              <span
                className={`rounded-full px-4 py-2 text-sm font-medium ${
                  indice === 0
                    ? "bg-ink text-white dark:bg-white dark:text-black"
                    : "border border-zinc-300 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
                }`}
              >
                {etapa}
              </span>
              {indice < FLUXO.length - 1 && (
                <span aria-hidden="true" className="text-zinc-400">
                  →
                </span>
              )}
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
