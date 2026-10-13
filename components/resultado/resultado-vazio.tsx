import { GerarResultadoButton } from "@/components/resultado/gerar-resultado-button";
import { PendenciasObrigatorias } from "@/components/resultado/pendencias-obrigatorias";
import type { PendenciaObrigatoria } from "@/lib/valuation/campos-obrigatorios";

export function ResultadoVazio({
  processoId,
  nomeEmpresa,
  pendencias,
}: {
  processoId: string;
  nomeEmpresa: string;
  pendencias: PendenciaObrigatoria[];
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-xl text-accent">
        ◌
      </span>
      <h2 className="text-xl font-semibold text-ink dark:text-zinc-50">
        Resultado ainda não gerado
      </h2>
      <p className="max-w-md text-sm text-zinc-600 dark:text-zinc-400">
        O valuation e a análise de {nomeEmpresa} ainda não foram calculados.
        Gere o resultado para ver a estimativa de Equity Value, o Índice de
        Prontidão e a análise qualitativa.
      </p>

      {pendencias.length > 0 ? (
        <PendenciasObrigatorias processoId={processoId} pendencias={pendencias} />
      ) : (
        <GerarResultadoButton processoId={processoId} />
      )}
    </div>
  );
}
