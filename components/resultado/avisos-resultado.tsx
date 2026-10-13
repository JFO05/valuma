import { GerarResultadoButton } from "@/components/resultado/gerar-resultado-button";

/**
 * RG-46: comparação feita em app/(app)/processos/[processoId]/resultado/page.tsx
 * entre `resultados.atualizado_em` (quando o resultado foi de fato
 * (re)gerado — NÃO `processos.updated_at`, que é "poluído" pela própria
 * geração de resultado) e o MAX(intake_data.atualizado_em) do processo.
 * Visual âmbar (alerta), nunca vermelho/erro — item 27 do redesign.
 */
export function ResultadoDesatualizadoBanner({ processoId }: { processoId: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center dark:border-amber-900 dark:bg-amber-950">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-200 text-xs font-semibold text-amber-800 dark:bg-amber-900 dark:text-amber-300">
          !
        </span>
        <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
          Os dados foram alterados após a última análise. Recalcule o
          resultado para atualizar os valores.
        </p>
      </div>
      <GerarResultadoButton processoId={processoId} label="Recalcular análise" variante="secundario" />
    </div>
  );
}

/**
 * RG-47/Fase 8: resultados sem MODEL_VERSION atual são legados — nunca
 * reinterpretados silenciosamente como Equity Value v1 (resultados antigos
 * podiam misturar Enterprise Value e Equity Value sem distinção).
 */
export function ResultadoLegadoBanner({ processoId }: { processoId: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-center dark:border-amber-900 dark:bg-amber-950">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-200 text-xs font-semibold text-amber-800 dark:bg-amber-900 dark:text-amber-300">
          !
        </span>
        <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
          Este resultado foi calculado utilizando uma versão anterior do
          modelo. Recalcule a análise para atualizar.
        </p>
      </div>
      <GerarResultadoButton processoId={processoId} label="Recalcular análise" variante="secundario" />
    </div>
  );
}
