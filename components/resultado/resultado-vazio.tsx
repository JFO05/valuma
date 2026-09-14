import { GerarResultadoButton } from "@/components/resultado/gerar-resultado-button";

export function ResultadoVazio({
  processoId,
  nomeEmpresa,
}: {
  processoId: string;
  nomeEmpresa: string;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
      <h2 className="text-xl font-semibold">Resultado ainda não gerado</h2>
      <p className="max-w-md text-sm text-zinc-600 dark:text-zinc-400">
        O valuation e a análise de {nomeEmpresa} ainda não foram calculados.
        Gere o resultado para ver o valuation, o score e a análise de IA.
      </p>
      <GerarResultadoButton processoId={processoId} />
    </div>
  );
}
