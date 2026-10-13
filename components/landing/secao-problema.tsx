import { Reveal } from "@/components/ui/reveal";

const FONTES_DISPERSAS = [
  { label: "Financeiro", exemplo: "DRE, balanço, dívidas" },
  { label: "Operacional", exemplo: "equipe, clientes, fornecedores" },
  { label: "Mercado", exemplo: "concorrentes, posicionamento" },
  { label: "Documental", exemplo: "contratos, societário, fiscal" },
];

export function SecaoProblema() {
  return (
    <section className="mx-auto w-full max-w-5xl px-6 py-24 sm:py-32">
      <Reveal className="flex flex-col items-center gap-4 text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl dark:text-zinc-50">
          Uma análise de M&amp;A começa muito antes da negociação.
        </h2>
        <p className="max-w-xl text-balance text-zinc-600 dark:text-zinc-400">
          Informações financeiras, operacionais, comerciais e documentais
          normalmente estão espalhadas. O ValuM&amp;A ajuda a transformar
          isso em um processo estruturado.
        </p>
      </Reveal>

      <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {FONTES_DISPERSAS.map((fonte, indice) => (
          <Reveal key={fonte.label} delayMs={indice * 80}>
            <div className="flex h-full flex-col gap-1 rounded-2xl border border-black/10 bg-black/[0.03] p-5 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
              <span className="text-sm font-semibold text-ink dark:text-zinc-50">
                {fonte.label}
              </span>
              <span className="text-xs text-zinc-500">{fonte.exemplo}</span>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
