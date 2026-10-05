"use client";

import { useState } from "react";
import {
  formatBytes,
  CATEGORIAS_DOCUMENTO,
  CATEGORIA_DOCUMENTO_LABELS,
  CATEGORIA_DOCUMENTO_PERIODO_APLICAVEL,
  type CategoriaDocumento,
  type DocumentoArquivo,
} from "@/lib/intake/schema-documentos";

const selectClass =
  "rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900";

/**
 * Categorização (RG-35/RG-37) acontece aqui, logo após o upload — o
 * documento fica "disponibilizado" (conta para a Prontidão Documental) só
 * depois que uma categoria é escolhida. Período/exercício só é exibido para
 * categorias em que ele faz sentido (RG-35/1.5).
 */
export function DocumentoListItem({
  documento,
  onRemover,
  onCategoriaChange,
  onPeriodoChange,
  removendo,
}: {
  documento: DocumentoArquivo;
  onRemover: () => void;
  onCategoriaChange: (categoria: CategoriaDocumento) => void;
  onPeriodoChange: (periodo: string) => void;
  removendo: boolean;
}) {
  const [periodoLocal, setPeriodoLocal] = useState(documento.periodoReferencia ?? "");
  const periodoAplicavel = documento.categoria
    ? CATEGORIA_DOCUMENTO_PERIODO_APLICAVEL[documento.categoria]
    : false;

  return (
    <li className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-sm font-medium">{documento.nome}</span>
          <span className="text-xs text-zinc-500">
            {formatBytes(documento.tamanho)} ·{" "}
            {new Date(documento.enviadoEm).toLocaleString("pt-BR")}
          </span>
        </div>

        <button
          type="button"
          onClick={onRemover}
          disabled={removendo}
          className="shrink-0 rounded border border-zinc-300 px-3 py-1 text-sm font-medium text-red-600 disabled:opacity-50 dark:border-zinc-700"
        >
          {removendo ? "Removendo..." : "Remover"}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
          Categoria
          <select
            value={documento.categoria ?? ""}
            onChange={(e) => onCategoriaChange(e.target.value as CategoriaDocumento)}
            className={selectClass}
          >
            <option value="" disabled>
              Selecione...
            </option>
            {CATEGORIAS_DOCUMENTO.map((categoria) => (
              <option key={categoria} value={categoria}>
                {CATEGORIA_DOCUMENTO_LABELS[categoria]}
              </option>
            ))}
          </select>
        </label>

        {periodoAplicavel && (
          <label className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
            Período/exercício
            <input
              type="text"
              placeholder="ex.: 2025"
              value={periodoLocal}
              onChange={(e) => setPeriodoLocal(e.target.value)}
              onBlur={() => onPeriodoChange(periodoLocal)}
              className={`${selectClass} w-24`}
            />
          </label>
        )}

        {!documento.categoria && (
          <span className="text-xs text-amber-700 dark:text-amber-400">
            Sem categoria — não conta para o Índice de Prontidão Documental.
          </span>
        )}
      </div>
    </li>
  );
}
