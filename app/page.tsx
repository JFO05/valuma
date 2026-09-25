import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
      <header className="flex items-center justify-between px-6 py-4">
        <span className="text-lg font-semibold tracking-tight text-ink dark:text-zinc-50">
          ValuM&amp;A
        </span>
        <Link
          href="/login"
          className="text-sm font-medium text-zinc-600 underline dark:text-zinc-400"
        >
          Entrar
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-8 px-6 py-16 text-center">
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl dark:text-zinc-50">
            Quanto vale a sua empresa, antes de sentar à mesa de negociação
          </h1>
          <p className="text-balance text-zinc-600 dark:text-zinc-400">
            O ValuM&amp;A conduz o dono de uma pequena ou média empresa por um
            intake estruturado e devolve uma estimativa de valuation por três
            métodos, um score de prontidão em quatro dimensões e uma análise
            de pontos fortes, riscos e recomendações — preparação para uma
            fusão ou aquisição sem depender, neste primeiro passo, de uma
            consultoria.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="rounded bg-ink px-6 py-3 text-sm font-medium text-white dark:bg-white dark:text-black"
          >
            Criar conta
          </Link>
          <Link
            href="/login"
            className="rounded border border-zinc-300 px-6 py-3 text-sm font-medium dark:border-zinc-700"
          >
            Já tenho conta
          </Link>
        </div>

        <dl className="grid grid-cols-1 gap-6 pt-8 text-left sm:grid-cols-3">
          <div className="flex flex-col gap-1">
            <dt className="text-sm font-medium text-ink dark:text-zinc-50">
              Valuation por 3 métodos
            </dt>
            <dd className="text-sm text-zinc-500">
              Múltiplo de EBITDA, fluxo de caixa descontado e patrimonial,
              ponderados numa única estimativa.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-sm font-medium text-ink dark:text-zinc-50">
              Score de prontidão
            </dt>
            <dd className="text-sm text-zinc-500">
              Financeiro, operação, mercado e jurídico, de 0 a 100, para
              mostrar onde focar antes de negociar.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-sm font-medium text-ink dark:text-zinc-50">
              Análise por IA
            </dt>
            <dd className="text-sm text-zinc-500">
              Pontos fortes, riscos e recomendações a partir dos dados que
              você mesmo preencheu.
            </dd>
          </div>
        </dl>
      </main>
    </div>
  );
}
