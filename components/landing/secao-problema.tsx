import { Reveal } from "@/components/ui/reveal";

/**
 * As 4 dimensões aqui são as mesmas do Índice de Prontidão real
 * (lib/prontidao/checklist.ts) — não é uma lista de "dores" genérica
 * inventada pra landing, é o problema que as próprias 4 dimensões do
 * produto existem pra resolver. Cada card mostra um mini-mockup HTML/CSS
 * de um campo real do intake em estado "vazio/pendente" (padrão inspirado
 * na seção de problema da Mynr — mockup de dor em vez de texto solto — mas
 * com campos e rótulos genuínos do ValuM&A, não copiados).
 */
const DORES = [
  {
    dimensao: "Financeiro",
    titulo: "Números que não fecham",
    descricao:
      "EBITDA, dívida líquida e caixa espalhados em planilhas diferentes, sem um lugar único.",
    campo: "EBITDA (2025)",
  },
  {
    dimensao: "Operacional",
    titulo: "Responsabilidades sem dono",
    descricao:
      "Cargos-chave e processos críticos que nunca foram documentados formalmente.",
    campo: "Diretor Comercial",
  },
  {
    dimensao: "Mercado",
    titulo: "Concorrência fora do radar",
    descricao:
      "Nenhum registro de quem são os concorrentes nem como a empresa se posiciona.",
    campo: "Concorrentes cadastrados",
  },
  {
    dimensao: "Documental",
    titulo: "Contratos e certidões soltos",
    descricao:
      "Documentos societários e fiscais espalhados entre e-mail, pasta e gaveta.",
    campo: "Contrato social",
  },
];

export function SecaoProblema() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-24 sm:py-32">
      <Reveal className="flex flex-col items-center gap-4 text-center">
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
          O problema
        </span>
        <h2 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl dark:text-zinc-50">
          Uma análise de M&amp;A começa muito antes da negociação.
        </h2>
        <p className="max-w-xl text-balance text-zinc-600 dark:text-zinc-400">
          Informações financeiras, operacionais, comerciais e documentais
          normalmente estão espalhadas — e ninguém percebe o quanto, até
          precisar reunir tudo de uma vez.
        </p>
      </Reveal>

      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {DORES.map((dor) => (
          <Reveal key={dor.dimensao}>
            <div className="flex h-full flex-col gap-4 rounded-2xl border border-black/10 bg-black/[0.03] p-5 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
                {dor.dimensao}
              </span>

              <div className="flex flex-col gap-1.5">
                <h3 className="text-sm font-semibold text-ink dark:text-zinc-50">
                  {dor.titulo}
                </h3>
                <p className="text-xs text-zinc-500">{dor.descricao}</p>
              </div>

              <div className="mt-auto rounded-xl border border-black/5 bg-white px-3 py-2.5 dark:border-white/10 dark:bg-zinc-950">
                <span className="truncate text-xs text-zinc-500">
                  {dor.campo}
                </span>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
