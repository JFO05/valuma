import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Reveal } from "@/components/ui/reveal";
import { PremiumCard } from "@/components/ui/premium-card";

const RECURSOS = [
  {
    titulo: "Valuation por 3 métodos",
    descricao:
      "Múltiplo de EBITDA, fluxo de caixa descontado e patrimonial, ponderados numa única estimativa.",
  },
  {
    titulo: "Índice de Prontidão para M&A",
    descricao:
      "Financeiro, operacional, mercado e documental, de 0 a 100%, para mostrar onde estruturar antes de negociar.",
  },
  {
    titulo: "Análise por IA",
    descricao:
      "Pontos fortes, riscos e recomendações a partir dos dados que você mesmo preencheu.",
  },
];

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-zinc-900/5 px-6 py-4 dark:border-white/5">
        <span className="text-lg font-semibold tracking-tight text-ink dark:text-zinc-50">
          ValuM&amp;A
        </span>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/login"
            className="text-sm font-medium text-zinc-600 underline decoration-zinc-300 underline-offset-4 transition-colors hover:text-ink dark:text-zinc-400 dark:decoration-zinc-700 dark:hover:text-zinc-100"
          >
            Entrar
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center gap-20 px-6 py-24 text-center sm:py-32">
        <Reveal className="flex flex-col items-center gap-6">
          <span className="rounded-full bg-accent/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-accent">
            Valuation &amp; M&amp;A para PMEs
          </span>

          <div className="flex flex-col gap-5">
            <h1 className="text-4xl leading-[1.05] font-semibold tracking-tight text-ink sm:text-6xl dark:text-zinc-50">
              Quanto vale a sua empresa, antes de sentar à mesa de negociação
            </h1>
            <p className="text-balance text-lg text-zinc-600 dark:text-zinc-400">
              O ValuM&amp;A conduz o dono de uma pequena ou média empresa por
              um intake estruturado e devolve uma estimativa preliminar de
              valuation, um índice de prontidão para M&amp;A e uma análise de
              pontos fortes, riscos e recomendações — preparação para uma
              fusão ou aquisição sem depender, neste primeiro passo, de uma
              consultoria.
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Link
              href="/signup"
              className="group flex items-center gap-3 rounded-full bg-ink py-1.5 pl-6 pr-1.5 text-sm font-medium text-white transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] dark:bg-white dark:text-black"
            >
              Criar conta
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 dark:bg-black/10">
                ↗
              </span>
            </Link>
            <Link
              href="/login"
              className="flex items-center justify-center rounded-full border border-zinc-300 px-6 py-3 text-sm font-medium text-ink transition-colors hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-50 dark:hover:border-zinc-600"
            >
              Já tenho conta
            </Link>
          </div>
        </Reveal>

        <dl className="grid w-full grid-cols-1 gap-4 text-left sm:grid-cols-3">
          {RECURSOS.map((recurso, indice) => (
            <Reveal key={recurso.titulo} delayMs={indice * 100}>
              <PremiumCard className="h-full">
                <div className="flex h-full flex-col gap-2 p-6">
                  <dt className="text-sm font-medium text-ink dark:text-zinc-50">
                    {recurso.titulo}
                  </dt>
                  <dd className="text-sm text-zinc-500 dark:text-zinc-400">
                    {recurso.descricao}
                  </dd>
                </div>
              </PremiumCard>
            </Reveal>
          ))}
        </dl>
      </main>
    </div>
  );
}
