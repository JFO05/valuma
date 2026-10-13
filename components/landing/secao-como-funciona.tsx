import { Reveal } from "@/components/ui/reveal";

const ETAPAS = [
  {
    numero: "01",
    titulo: "Organize",
    descricao: "Preencha as informações da empresa em um fluxo guiado.",
  },
  {
    numero: "02",
    titulo: "Analise",
    descricao: "O sistema verifica Prontidão e aplicabilidade do modelo financeiro.",
  },
  {
    numero: "03",
    titulo: "Entenda",
    descricao: "Receba valuation preliminar, pendências e análise qualitativa.",
  },
  {
    numero: "04",
    titulo: "Prepare",
    descricao: "Leve informações mais estruturadas para posterior validação profissional.",
  },
];

export function SecaoComoFunciona() {
  return (
    <section id="como-funciona" className="py-24 sm:py-32">
      <div className="mx-auto w-full max-w-6xl px-6">
        <Reveal className="flex flex-col items-center gap-3 text-center">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
            Como funciona
          </span>
          <h2 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl dark:text-zinc-50">
            Quatro etapas, do dado bruto à preparação
          </h2>
        </Reveal>

        <div className="relative mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ETAPAS.map((etapa, indice) => (
            <Reveal key={etapa.numero} delayMs={indice * 100}>
              <div className="flex h-full flex-col gap-3 rounded-2xl border border-black/10 bg-black/[0.03] p-6 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
                <span className="text-sm font-semibold text-accent">
                  {etapa.numero}
                </span>
                <h3 className="text-base font-semibold text-ink dark:text-zinc-50">
                  {etapa.titulo}
                </h3>
                <p className="text-sm text-zinc-500">{etapa.descricao}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
