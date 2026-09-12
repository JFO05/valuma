import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { mockResultadoValuation } from "@/lib/valuation/mock";
import type { ResultadoValuation } from "@/lib/valuation/types";
import { ValuationDestaque } from "@/components/resultado/valuation-destaque";
import { ValuationBreakdown } from "@/components/resultado/valuation-breakdown";
import { ScoreGauge } from "@/components/resultado/score-gauge";
import { ScoreBreakdown } from "@/components/resultado/score-breakdown";
import { AnaliseIaCards } from "@/components/resultado/analise-ia-cards";
import { ResultadoVazio } from "@/components/resultado/resultado-vazio";

export default async function ResultadoPage({
  params,
  searchParams,
}: PageProps<"/processos/[processoId]/resultado">) {
  const { processoId } = await params;
  const sp = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Mesmo padrão de app/intake/[processoId]/[fase]/page.tsx: a RLS só
  // devolve o processo se ele existir E pertencer ao usuário logado, então
  // um 404 aqui cobre os dois casos sem distinguir.
  const { data: processo, error: processoError } = await supabase
    .from("processos")
    .select("id, nome_empresa")
    .eq("id", processoId)
    .maybeSingle();

  if (processoError || !processo) {
    notFound();
  }

  // TODO(integrantes de valuation/IA): substituir todo este bloco por uma
  // busca real em public.resultados quando a tabela e o cálculo existirem,
  // por exemplo:
  //
  //   const { data: resultado } = await supabase
  //     .from("resultados")
  //     .select("*")
  //     .eq("processo_id", processoId)
  //     .maybeSingle();
  //
  // e usar `resultado` (tipado como ResultadoValuation, de
  // lib/valuation/types.ts) no lugar de `resultado` abaixo. O restante da
  // página (JSX) não muda — só a origem do dado.
  //
  // Por enquanto, simulamos "resultado já gerado" via ?mock=1 na URL
  // (setado pelo botão "Gerar Resultado" em ResultadoVazio) e usamos o mock
  // fixo de lib/valuation/mock.ts como se fosse o retorno real.
  const resultadoJaGerado = sp.mock === "1";
  const resultado: ResultadoValuation | null = resultadoJaGerado
    ? mockResultadoValuation
    : null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 p-8">
      <div>
        <Link
          href={`/intake/${processoId}/perfil`}
          className="text-sm text-zinc-500 underline"
        >
          ← Voltar para o intake
        </Link>
        <p className="mt-2 text-sm text-zinc-500">{processo.nome_empresa}</p>
        <h1 className="text-2xl font-semibold">Resultado do Valuation</h1>
      </div>

      {!resultado ? (
        <ResultadoVazio nomeEmpresa={processo.nome_empresa} />
      ) : (
        <>
          <ValuationDestaque valor={resultado.valuationFinal} />

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">
              Composição do valuation
            </h2>
            <ValuationBreakdown resultado={resultado} />
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Score geral</h2>
            <ScoreGauge score={resultado.scoreTotal} />
            <ScoreBreakdown resultado={resultado} />
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Análise de IA</h2>
            <AnaliseIaCards analiseIA={resultado.analiseIA} />
          </section>
        </>
      )}
    </div>
  );
}
