import {
  formatBytes,
  type DocumentoArquivo,
} from "@/lib/intake/schema-documentos";

export function DocumentoListItem({
  documento,
  onRemover,
  removendo,
}: {
  documento: DocumentoArquivo;
  onRemover: () => void;
  removendo: boolean;
}) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
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
        className="rounded border border-zinc-300 px-3 py-1 text-sm font-medium text-red-600 disabled:opacity-50 dark:border-zinc-700"
      >
        {removendo ? "Removendo..." : "Remover"}
      </button>
    </li>
  );
}
