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
    <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
      <h2 className="text-xl font-semibold">Resultado ainda não gerado</h2>
      <p className="max-w-md text-sm text-zinc-600 dark:text-zinc-400">
        O valuation e a análise de {nomeEmpresa} ainda não foram calculados.
        Gere o resultado para ver o valuation, o score e a análise de IA.
      </p>

      {pendencias.length > 0 ? (
        <PendenciasObrigatorias processoId={processoId} pendencias={pendencias} />
      ) : (
        <GerarResultadoButton processoId={processoId} />
      )}
    </div>
  );
}
