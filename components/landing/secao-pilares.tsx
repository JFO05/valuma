import { Reveal } from "@/components/ui/reveal";
import { PremiumCard } from "@/components/ui/premium-card";

const PILARES = [
  {
    titulo: "Valor",
    descricao:
      "Estimativa preliminar de Equity Value quando o modelo for aplicável.",
  },
  {
    titulo: "Prontidão",
    descricao:
      "Quanto das informações esperadas está disponível e estruturalmente válida.",
  },
  {
    titulo: "Interpretação",
    descricao: "Pontos fortes, riscos e recomendações qualitativas.",
  },
];

export function SecaoPilares() {
  return (
    <section id="resultados" className="mx-auto w-full max-w-6xl px-6 py-24 sm:py-32">
      <Reveal className="flex flex-col items-center gap-3 text-center">
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
          O que você recebe
        </span>
        <h2 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl dark:text-zinc-50">
          Três pilares de cada análise
        </h2>
      </Reveal>

      <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {PILARES.map((pilar, indice) => (
          <Reveal key={pilar.titulo} delayMs={indice * 100}>
            <PremiumCard
              className="h-full"
              innerClassName="!bg-white/70 backdrop-blur-sm dark:!bg-zinc-900/40"
            >
              <div className="flex h-full flex-col gap-3 p-8">
                <span className="text-4xl font-semibold text-accent">
                  {String(indice + 1).padStart(2, "0")}
                </span>
                <h3 className="text-lg font-semibold text-ink dark:text-zinc-50">
                  {pilar.titulo}
                </h3>
                <p className="text-sm text-zinc-500">{pilar.descricao}</p>
              </div>
            </PremiumCard>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
