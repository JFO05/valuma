import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { mapRowParaResultadoValuation, ehResultadoLegado } from "@/lib/valuation/resultados";
import type { ResultadoValuation } from "@/lib/valuation/types";
import { consolidarDadosProcesso } from "@/lib/valuation/consolidar";
import { verificarCamposObrigatorios } from "@/lib/valuation/campos-obrigatorios";
import { calcularProntidao } from "@/lib/prontidao/checklist";
import { ValuationDestaque } from "@/components/resultado/valuation-destaque";
import { ScoreGauge } from "@/components/resultado/score-gauge";
import { ScoreBreakdown } from "@/components/resultado/score-breakdown";
import { PendenciasProntidao } from "@/components/resultado/pendencias-prontidao";
import { ComoChegamos } from "@/components/resultado/como-chegamos";
import { AnaliseIaCards } from "@/components/resultado/analise-ia-cards";
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
  // "Recalcular" precisa ficar bloqueado nesse caso também (RG-40).
  const dadosProcesso = await consolidarDadosProcesso(processoId);
  const pendencias = verificarCamposObrigatorios(dadosProcesso);

  // O Índice de Prontidão exibido em "O que ainda falta"/"Como chegamos" usa
  // o intake ATUAL, não o valor congelado no último resultado salvo — o
  // usuário pode ter editado o intake depois da última geração (mesmo
  // raciocínio do gate de campos mínimos).
  const prontidaoAoVivo = calcularProntidao(dadosProcesso);

  // RG-46: "resultado desatualizado" compara o momento da última geração
  // (resultados.atualizado_em — NUNCA processos.updated_at, que é
  // atualizado pela própria geração do resultado, o que criaria um falso
  // "sempre atualizado") com o momento da última alteração do intake.
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
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 p-8">
      <div>
        <div className="print:hidden flex flex-wrap items-center gap-x-4 gap-y-1">
          <Link
            href="/dashboard"
            className="text-sm text-zinc-500 underline"
          >
            ← Voltar para o Dashboard
          </Link>
          <Link
            href={`/intake/${processoId}/perfil`}
            className="text-sm text-zinc-500 underline"
          >
            ← Editar dados do intake
          </Link>
        </div>
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
          {resultadoLegado && <ResultadoLegadoBanner processoId={processoId} />}
          {!resultadoLegado && resultadoDesatualizado && (
            <ResultadoDesatualizadoBanner processoId={processoId} />
          )}

          {/* 1. Estimativa preliminar de Equity Value */}
          <ValuationDestaque valor={resultado.valuationFinal} />

          {/* 2. Índice de Prontidão — nota geral e as 4 dimensões */}
          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">
              Índice de Prontidão Informacional para M&amp;A
            </h2>
            <ScoreGauge indiceGeral={resultado.scoreTotal} />
            <ScoreBreakdown resultado={resultado} />
          </section>

          {/* 3. Pendências e alertas */}
          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">O que ainda falta</h2>
            <PendenciasProntidao
              processoId={processoId}
              prontidao={prontidaoAoVivo}
            />
          </section>

          {/* 4. Como chegamos a este resultado? (recolhível) */}
          <ComoChegamos resultado={resultado} prontidao={prontidaoAoVivo} />

          {/* 5. Análise qualitativa */}
          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">Análise de IA</h2>
            <AnaliseIaCards analiseIA={resultado.analiseIA} processoId={processoId} />
          </section>

          {/* 6. Próximas etapas profissionais */}
          <ProximasEtapas />

          <div className="print:hidden flex justify-center">
            <BaixarPdfButton />
          </div>

          {/* 7. Disclaimer / informações complementares */}
          <p className="text-xs text-zinc-500">{DISCLAIMER_OFICIAL}</p>

          <div className="print:hidden flex flex-col items-center gap-2 border-t border-zinc-200 pt-6 dark:border-zinc-800">
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
        </>
      )}
    </div>
  );
}
