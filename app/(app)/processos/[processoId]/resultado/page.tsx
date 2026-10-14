import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { createClient } from "@/lib/supabase/server";
import { mapRowParaResultadoValuation, ehResultadoLegado } from "@/lib/valuation/resultados";
import type { ResultadoValuation } from "@/lib/valuation/types";
import { consolidarDadosProcesso } from "@/lib/valuation/consolidar";
import { verificarCamposObrigatorios } from "@/lib/valuation/campos-obrigatorios";
import { calcularProntidao } from "@/lib/prontidao/checklist";
import { Reveal } from "@/components/ui/reveal";
import { ValuationDestaque } from "@/components/resultado/valuation-destaque";
import { ScoreGauge } from "@/components/resultado/score-gauge";
import { ScoreBreakdown } from "@/components/resultado/score-breakdown";
import { PendenciasProntidao } from "@/components/resultado/pendencias-prontidao";
import { ComoChegamos } from "@/components/resultado/como-chegamos";
import { AnaliseIaCards } from "@/components/resultado/analise-ia-cards";
import { ChatAssistente } from "@/components/resultado/chat-assistente";
import { ResultadoVazio } from "@/components/resultado/resultado-vazio";
import { GerarResultadoButton } from "@/components/resultado/gerar-resultado-button";
import { PendenciasObrigatorias } from "@/components/resultado/pendencias-obrigatorias";
import { BaixarPdfButton } from "@/components/resultado/baixar-pdf-button";
import { ProximasEtapas } from "@/components/resultado/proximas-etapas";
import { ResultadoDesatualizadoBanner, ResultadoLegadoBanner } from "@/components/resultado/avisos-resultado";

/** Texto oficial (RG-55) — presente em toda tela de resultado e no PDF gerado a partir dela. */
const DISCLAIMER_OFICIAL =
  "Esta análise é preliminar e foi produzida com base nas informações fornecidas. Os resultados não substituem avaliação contábil, financeira, jurídica ou due diligence profissional. O ValuM&A não certifica a empresa nem garante a veracidade ou regularidade das informações e documentos fornecidos.";

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

  const { data: processo, error: processoError } = await supabase
    .from("processos")
    .select("id, nome_empresa")
    .eq("id", processoId)
    .maybeSingle();

  if (processoError || !processo) {
    notFound();
  }

  const { data: resultadoRow } = await supabase
    .from("resultados")
    .select("*")
    .eq("processo_id", processoId)
    .maybeSingle();

  const resultado: ResultadoValuation | null = resultadoRow
    ? mapRowParaResultadoValuation(resultadoRow)
    : null;

  const dadosProcesso = await consolidarDadosProcesso(processoId);
  const pendencias = verificarCamposObrigatorios(dadosProcesso);
  const prontidaoAoVivo = calcularProntidao(dadosProcesso);

  let resultadoDesatualizado = false;
  if (resultadoRow) {
    const { data: intakeRows } = await supabase
      .from("intake_data")
      .select("atualizado_em")
      .eq("processo_id", processoId);

    const maxIntakeAtualizadoEm = (intakeRows ?? []).reduce<string | null>(
      (max, row) => (!max || row.atualizado_em > max ? row.atualizado_em : max),
      null,
    );

    resultadoDesatualizado = Boolean(
      maxIntakeAtualizadoEm && maxIntakeAtualizadoEm > resultadoRow.atualizado_em,
    );
  }

  const resultadoLegado = resultado !== null && ehResultadoLegado(resultado);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-6 sm:p-8">
      {/* Só aparece no PDF/impressão — na tela, a marca já vem do header do
          AppShell, que é print:hidden (ver RG-50: o PDF é só a reimpressão
          desta mesma tela, sem motor de cálculo próprio). */}
      <div className="hidden print:block">
        <BrandLogo />
      </div>

      <div className="print:hidden flex flex-wrap items-center gap-3">
        <Link
          href="/dashboard"
          className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 px-3 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:border-accent/50 hover:text-accent dark:border-zinc-700 dark:text-zinc-300"
        >
          ← Voltar para o Dashboard
        </Link>
        <Link
          href={`/intake/${processoId}/perfil`}
          className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 px-3 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:border-accent/50 hover:text-accent dark:border-zinc-700 dark:text-zinc-300"
        >
          ← Editar dados do intake
        </Link>
      </div>

      <div>
        <p className="text-sm text-zinc-500">{processo.nome_empresa}</p>
        <h1 className="text-2xl font-semibold tracking-tight text-ink dark:text-zinc-50">
          Resultado do Valuation
        </h1>
      </div>

      {!resultado ? (
        <Reveal>
          <ResultadoVazio
            processoId={processoId}
            nomeEmpresa={processo.nome_empresa}
            pendencias={pendencias}
          />
        </Reveal>
      ) : (
        <div className="flex flex-col gap-8">
          {resultadoLegado && <ResultadoLegadoBanner processoId={processoId} />}
          {!resultadoLegado && resultadoDesatualizado && (
            <ResultadoDesatualizadoBanner processoId={processoId} />
          )}

          {/* 1. Estimativa preliminar de Equity Value */}
          <Reveal>
            <ValuationDestaque
              valor={resultado.valuationFinal}
              motorTipo={resultado.motorSnapshot?.tipo}
            />
          </Reveal>

          {/* 2. Índice de Prontidão + 3. Pendências e alertas (mesmo card:
              Prontidão e o que falta para melhorá-la são a mesma conversa) */}
          <Reveal delayMs={60}>
            <section className="flex flex-col gap-6 rounded-2xl border border-zinc-900/5 bg-white p-6 dark:border-white/5 dark:bg-zinc-900">
              <div>
                <h2 className="text-lg font-semibold text-ink dark:text-zinc-50">
                  Índice de Prontidão Informacional para M&amp;A
                </h2>
                <div className="mt-4">
                  <ScoreGauge indiceGeral={resultado.scoreTotal} />
                </div>
                <div className="mt-5">
                  <ScoreBreakdown resultado={resultado} />
                </div>
              </div>

              <div className="border-t border-zinc-100 pt-6 dark:border-zinc-800">
                <h3 className="mb-3 text-sm font-semibold text-ink dark:text-zinc-50">
                  O que ainda falta
                </h3>
                <PendenciasProntidao processoId={processoId} prontidao={prontidaoAoVivo} />
              </div>
            </section>
          </Reveal>

          {/* 4. Como chegamos a este resultado? (recolhível) */}
          <Reveal delayMs={100}>
            <ComoChegamos resultado={resultado} prontidao={prontidaoAoVivo} />
          </Reveal>

          {/* 5. Análise qualitativa */}
          <Reveal delayMs={140}>
            <section>
              <h2 className="mb-3 text-lg font-semibold text-ink dark:text-zinc-50">
                Análise Estratégica
              </h2>
              <AnaliseIaCards analiseIA={resultado.analiseIA} processoId={processoId} />
            </section>
          </Reveal>

          {/* Chat do assistente — não faz parte da numeração oficial das
              seções (RG-53); fica entre a análise de IA e as próximas
              etapas, e não aparece no PDF (não faz sentido estático). */}
          <Reveal delayMs={160} className="print:hidden">
            <ChatAssistente processoId={processoId} />
          </Reveal>

          {/* 6. Próximas etapas profissionais */}
          <Reveal delayMs={180}>
            <ProximasEtapas />
          </Reveal>

          <div className="print:hidden flex justify-center">
            <BaixarPdfButton />
          </div>

          {/* 7. Disclaimer / informações complementares — visível, sem
              aparência de alerta vermelho assustador (item 26.7). */}
          <p className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 text-xs leading-relaxed text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
            {DISCLAIMER_OFICIAL}
          </p>

          <div className="print:hidden flex flex-col items-center gap-2 border-t border-zinc-100 pt-6 dark:border-zinc-800">
            {pendencias.length > 0 ? (
              <>
                <p className="text-sm text-zinc-500">
                  Algumas informações obrigatórias foram removidas do intake
                  desde a última geração:
                </p>
                <PendenciasObrigatorias processoId={processoId} pendencias={pendencias} />
              </>
            ) : (
              !resultadoDesatualizado &&
              !resultadoLegado && (
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
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
