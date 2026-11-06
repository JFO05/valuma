import { Reveal } from "@/components/ui/reveal";
import { PillCta } from "@/components/ui/pill-cta";

const FLUXO = [
  "ValuM&A",
  "Validação contábil/financeira",
  "Validação jurídica",
  "Due diligence / negociação",
];

/**
 * Os 2 blocos de entrada abaixo do fluxo (padrão "Como começar" da Mynr,
 * item 14 do relatório de referência — duas opções, não uma) não são duas
 * rotas diferentes: os dois caminhos começam no mesmo /signup (sem
 * formulário/backend novo, regra 3 do pedido original). A diferença real
 * é o que a pessoa faz DEPOIS de entrar — digitar os dados manualmente ou
 * usar a importação de Excel que já existe na etapa Financeiro
 * (components/intake/importar-excel-financeiro.tsx).
 */
const ENTRADAS = [
  {
    titulo: "Começar do zero",
    descricao:
      "Fluxo guiado em 6 etapas, com salvamento automático — preencha aos poucos, sem precisar ter tudo pronto de uma vez.",
  },
  {
    titulo: "Já tenho os dados organizados",
    descricao:
      "Na etapa Financeiro, importe DRE, balanço e dívidas direto de uma planilha Excel no formato esperado, em vez de digitar campo a campo.",
  },
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

      <Reveal delayMs={200}>
        <div className="mt-16 flex flex-col gap-4">
          <h3 className="text-center text-sm font-medium uppercase tracking-[0.2em] text-accent">
            Como começar
          </h3>

          <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {ENTRADAS.map((entrada, indice) => (
              <div
                key={entrada.titulo}
                className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-black/[0.03] p-6 dark:border-white/10 dark:bg-white/5"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-accent/40 bg-accent/10 text-xs font-semibold text-accent">
                  {String(indice + 1).padStart(2, "0")}
                </span>
                <h4 className="text-sm font-semibold text-ink dark:text-zinc-50">
                  {entrada.titulo}
                </h4>
                <p className="text-xs text-zinc-500">{entrada.descricao}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-center">
            <PillCta href="/signup">Iniciar avaliação</PillCta>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
