import Link from "next/link";
import type { AutosaveStatus } from "@/lib/hooks/useAutosave";

/**
 * Só fica clicável quando não há save em andamento nem erro no último save
 * — assim o usuário não sai da etapa achando que algo já foi salvo quando
 * na verdade ainda está salvando (ou falhou).
 */
export function VoltarDashboardButton({ status }: { status: AutosaveStatus }) {
  const habilitado = status === "idle" || status === "salvo";

  if (!habilitado) {
    return (
      <span
        aria-disabled="true"
        title="Aguarde o salvamento terminar"
        className="w-fit cursor-not-allowed rounded border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-400 dark:border-zinc-800 dark:text-zinc-600"
      >
        Voltar para o Dashboard
      </span>
    );
  }

  return (
    <Link
      href="/dashboard"
      className="w-fit rounded border border-zinc-300 px-4 py-2 text-sm font-medium hover:border-zinc-400 dark:border-zinc-700 dark:hover:border-zinc-600"
    >
      Voltar para o Dashboard
    </Link>
  );
}
