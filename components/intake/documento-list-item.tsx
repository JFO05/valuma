"use client";

import { useState } from "react";
import {
  formatBytes,
  CATEGORIA_DOCUMENTO_PERIODO_APLICAVEL,
  type DocumentoArquivo,
} from "@/lib/intake/schema-documentos";

const inputClass =
  "rounded-lg border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900";

/**
 * Linha de um documento já enviado, dentro do card da sua categoria
 * (components/intake/categoria-documento-card.tsx) — a categoria em si não é
 * mais escolhida aqui: ela é definida pelo card em que o upload aconteceu
 * (o cliente já sobe o arquivo no lugar certo). Período/exercício continua
 * editável aqui, só quando aplicável à categoria (RG-35).
 */
export function DocumentoListItem({
  documento,
  onRemover,
  onPeriodoChange,
  removendo,
}: {
  documento: DocumentoArquivo;
  onRemover: () => void;
  onPeriodoChange: (periodo: string) => void;
  removendo: boolean;
}) {
  const [periodoLocal, setPeriodoLocal] = useState(documento.periodoReferencia ?? "");
  const periodoAplicavel = documento.categoria
    ? CATEGORIA_DOCUMENTO_PERIODO_APLICAVEL[documento.categoria]
    : false;

  return (
    <li className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
      {/* O status "Disponibilizado/Pendente" já aparece uma vez no cabeçalho
          do card da categoria (categoria-documento-card.tsx) — repeti-lo aqui
          por arquivo era redundante num card já estreito. */}
      <div className="flex items-start justify-between gap-2">
        <span className="min-w-0 break-words text-sm font-medium text-ink dark:text-zinc-50">
          {documento.nome}
        </span>

        <button
          type="button"
          onClick={onRemover}
          disabled={removendo}
          aria-label={removendo ? "Removendo arquivo" : "Remover arquivo"}
          title="Remover arquivo"
          className="flex size-6 shrink-0 items-center justify-center rounded-full border border-zinc-300 text-sm leading-none text-red-600 transition-colors hover:border-red-300 hover:bg-red-50 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-red-950/40"
        >
          {removendo ? (
            <span className="size-2.5 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
          ) : (
            <span aria-hidden>×</span>
          )}
        </button>
      </div>

      <span className="text-xs text-zinc-500">
        {formatBytes(documento.tamanho)} ·{" "}
        {new Date(documento.enviadoEm).toLocaleDateString("pt-BR")}
      </span>

      {periodoAplicavel && (
        <label className="flex flex-col gap-1 text-xs text-zinc-600 dark:text-zinc-400">
          Período/exercício
          <input
            type="text"
            placeholder="ex.: 2025"
            value={periodoLocal}
            onChange={(e) => setPeriodoLocal(e.target.value)}
            onBlur={() => onPeriodoChange(periodoLocal)}
            className={`${inputClass} w-24`}
          />
        </label>
      )}
    </li>
  );
}
