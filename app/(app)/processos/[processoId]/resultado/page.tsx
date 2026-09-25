import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { mapRowParaResultadoValuation } from "@/lib/valuation/resultados";
import type { ResultadoValuation } from "@/lib/valuation/types";
import { consolidarDadosProcesso } from "@/lib/valuation/consolidar";
import { verificarCamposObrigatorios } from "@/lib/valuation/campos-obrigatorios";
import { ValuationDestaque } from "@/components/resultado/valuation-destaque";
import { ValuationBreakdown } from "@/components/resultado/valuation-breakdown";
import { ScoreGauge } from "@/components/resultado/score-gauge";
import { ScoreBreakdown } from "@/components/resultado/score-breakdown";
import { AnaliseIaCards } from "@/components/resultado/analise-ia-cards";
import { ResultadoVazio } from "@/components/resultado/resultado-vazio";
import { GerarResultadoButton } from "@/components/resultado/gerar-resultado-button";
import { PendenciasObrigatorias } from "@/components/resultado/pendencias-obrigatorias";

export default async function ResultadoPage({
  params,
}: PageProps<"/processos/[processoId]/resultado">) {
  const { processoId } = await params;

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

  // Busca real em public.resultados — colunas snake_case, convertidas para
  // o formato ResultadoValuation (camelCase) pelo mesmo mapper que a rota
  // de geração usa (lib/valuation/resultados.ts), então os dois caminhos
  // (gerar agora vs. reabrir uma página já gerada) produzem o mesmo shape.
  // RLS garante que só vem linha se o processo for do usuário logado.
  const { data: resultadoRow } = await supabase
    .from("resultados")
    .select("*")
    .eq("processo_id", processoId)
    .maybeSingle();

  const resultado: ResultadoValuation | null = resultadoRow
    ? mapRowParaResultadoValuation(resultadoRow)
    : null;

  // Calculado sempre (não só quando falta resultado): dados obrigatórios
  // podem ter sido apagados do intake DEPOIS de um resultado já existir, e
  // "Recalcular" precisa ficar bloqueado nesse caso também (DEF-01).
  const dadosProcesso = await consolidarDadosProcesso(processoId);
  const pendencias = verificarCamposObrigatorios(dadosProcesso);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 p-8">
      <div>
        <Link
          href={`/intake/${processoId}/perfil`}
          className="text-sm text-zinc-500 underline"
        >
          ← Editar dados do intake
        </Link>
        <p className="mt-2 text-sm text-zinc-500">{processo.nome_empresa}</p>
        <h1 className="text-2xl font-semibold">Resultado do Valuation</h1>
      </div>

      {!resultado ? (
        <ResultadoVazio
          processoId={processoId}
          nomeEmpresa={processo.nome_empresa}
          pendencias={pendencias}
        />
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
            <h2 className="text-lg font-semibold">
              Índice de Prontidão para M&amp;A
            </h2>
            <ScoreGauge indiceGeral={resultado.scoreTotal} />
            <ScoreBreakdown resultado={resultado} />
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Análise de IA</h2>
            <AnaliseIaCards analiseIA={resultado.analiseIA} processoId={processoId} />
          </section>

          <div className="flex flex-col items-center gap-2 border-t border-zinc-200 pt-6 dark:border-zinc-800">
            {pendencias.length > 0 ? (
              <>
                <p className="text-sm text-zinc-500">
                  Algumas informações obrigatórias foram removidas do intake
                  desde a última geração:
                </p>
                <PendenciasObrigatorias
                  processoId={processoId}
                  pendencias={pendencias}
                />
              </>
            ) : (
              <>
                <p className="text-sm text-zinc-500">
                  Mudou algo no intake? Recalcule para atualizar o resultado.
                </p>
                <GerarResultadoButton
                  processoId={processoId}
                  label="Recalcular Resultado"
                  variante="secundario"
                />
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
