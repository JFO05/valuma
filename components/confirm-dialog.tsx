"use client";

import { useCallback, useState } from "react";

export interface OpcoesConfirmacao {
  /** Cabeçalho do diálogo — omitido, o diálogo mostra só a mensagem (uso mais simples). */
  titulo?: string;
  mensagem: string;
  /** Rótulo do botão de confirmar — "Remover" por padrão. */
  confirmarLabel?: string;
}

/**
 * Substitui window.confirm()/window.alert() (que quebram a identidade visual
 * do app e travam a aba inteira) por um diálogo estilizado e assíncrono.
 *
 * Uso simples: `if (await confirm("Remover X?")) { ... }`.
 * Uso com título e rótulo customizados (ex.: exclusão de processo, Fase 4.3):
 * `if (await confirm({ titulo: "Excluir este processo?", mensagem: "Esta ação não poderá ser desfeita.", confirmarLabel: "Excluir" })) { ... }`.
 *
 * Renderizar `{dialog}` uma vez em algum lugar do componente (geralmente logo
 * antes do `return` principal).
 */
export function useConfirm() {
  const [pedido, setPedido] = useState<
    (OpcoesConfirmacao & { resolve: (valor: boolean) => void }) | null
  >(null);

  const confirm = useCallback((opcoes: string | OpcoesConfirmacao) => {
    const normalizado = typeof opcoes === "string" ? { mensagem: opcoes } : opcoes;
    return new Promise<boolean>((resolve) => {
      setPedido({ ...normalizado, resolve });
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
      aria-labelledby={pedido.titulo ? "confirm-dialog-titulo" : undefined}
      aria-describedby="confirm-dialog-mensagem"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onKeyDown={(e) => e.key === "Escape" && responder(false)}
    >
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        {pedido.titulo && (
          <h2 id="confirm-dialog-titulo" className="text-base font-semibold">
            {pedido.titulo}
          </h2>
        )}
        <p id="confirm-dialog-mensagem" className="text-sm text-zinc-800 dark:text-zinc-200">
          {pedido.mensagem}
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
            {pedido.confirmarLabel ?? "Remover"}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return { confirm, dialog };
}
