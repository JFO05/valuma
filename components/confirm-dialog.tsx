"use client";

import { useCallback, useState } from "react";

/**
 * Substitui window.confirm()/window.alert() (que quebram a identidade visual
 * do app e travam a aba inteira) por um diálogo estilizado e assíncrono.
 * Uso: `const { confirm, dialog } = useConfirm();`, chamar
 * `if (await confirm("Remover X?")) { ... }` e renderizar `{dialog}` uma vez
 * em algum lugar do componente (geralmente logo antes do `return` principal).
 */
export function useConfirm() {
  const [pedido, setPedido] = useState<{
    titulo: string;
    resolve: (valor: boolean) => void;
  } | null>(null);

  const confirm = useCallback((titulo: string) => {
    return new Promise<boolean>((resolve) => {
      setPedido({ titulo, resolve });
    });
  }, []);

  function responder(valor: boolean) {
    pedido?.resolve(valor);
    setPedido(null);
  }

  const dialog = pedido ? (
    <div
      role="alertdialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onKeyDown={(e) => e.key === "Escape" && responder(false)}
    >
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm text-zinc-800 dark:text-zinc-200">
          {pedido.titulo}
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            autoFocus
            onClick={() => responder(false)}
            className="rounded border border-zinc-300 px-3 py-1.5 text-sm font-medium dark:border-zinc-700"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => responder(true)}
            className="rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white"
          >
            Remover
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return { confirm, dialog };
}
