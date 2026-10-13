import { Reveal } from "@/components/ui/reveal";

const ITENS = [
  "Quais dados entraram",
  "Quais premissas foram utilizadas",
  "Quais métodos foram aplicáveis",
  "Como dívida e caixa influenciaram",
  "Quais informações ainda faltam",
];

/**
 * "Big statement" — bloco escuro arredondado dentro de uma seção clara
 * (tradução do bloco de imagem dramática da referência visual, aqui sem
 * foto: o produto é a própria substância). Quebra o ritmo claro/escuro da
 * página sem precisar de uma section inteira escura.
 */
export function SecaoExplicabilidade() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-24 sm:py-32">
      <Reveal>
        <div className="section-ink texture-grid relative overflow-hidden rounded-[2rem] px-8 py-16 sm:px-16 sm:py-20">
          <div
            aria-hidden="true"
            className="glow-accent pointer-events-none absolute inset-x-0 top-0 h-80"
          />
          <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-8 text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Não entregamos apenas um número.
            </h2>
            <p className="text-white/60">
              Cada estimativa vem acompanhada de como ela foi construída —
              para diferenciar o produto de uma calculadora.
            </p>
            <ul className="grid w-full grid-cols-1 gap-3 text-left sm:grid-cols-2">
              {ITENS.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80"
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
