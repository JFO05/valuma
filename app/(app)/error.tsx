"use client";

/**
 * Boundary de erro do grupo autenticado (/dashboard, /intake, /processos).
 * Sem isso, uma falha de query (ex.: dashboard/page.tsx ao consultar
 * `resultados`) derrubava a página inteira sem nenhuma UI própria — e,
 * antes da correção da auditoria pós-implementação, o código evitava isso
 * escondendo o erro em `data ?? []`, o que fazia "Ver resultado" sumir
 * silenciosamente mesmo com resultado real salvo. Agora o erro propaga de
 * propósito (consistente com consolidarDadosProcesso) e este boundary só
 * garante que propagar não vira uma tela em branco.
 */
export default function ErroAreaAutenticada({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
        Não foi possível carregar esta página. Tente novamente.
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
      >
        Tentar novamente
      </button>
    </div>
  );
}
