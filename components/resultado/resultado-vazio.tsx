import Link from "next/link";

/**
 * Botão "Gerar Resultado" navega para `?mock=1` na própria página — hoje
 * isso só troca qual branch a page.tsx renderiza (ver TODO lá). Quando o
 * cálculo real existir, esse link deve virar uma Server Action que dispara
 * o cálculo de verdade e então redireciona (sem o query param).
 */
export function ResultadoVazio({ nomeEmpresa }: { nomeEmpresa: string }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
      <h2 className="text-xl font-semibold">Resultado ainda não gerado</h2>
      <p className="max-w-md text-sm text-zinc-600 dark:text-zinc-400">
        O valuation e a análise de {nomeEmpresa} ainda não foram calculados.
        Gere o resultado para ver o valuation, o score e a análise de IA.
      </p>
      <Link
        href="?mock=1"
        className="rounded bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
      >
        Gerar Resultado
      </Link>
    </div>
  );
}
