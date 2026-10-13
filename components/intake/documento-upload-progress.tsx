import type { CategoriaDocumento } from "@/lib/intake/schema-documentos";

export interface UploadEmAndamento {
  id: string;
  nome: string;
  progresso: number;
  status: "enviando" | "erro";
  erro?: string;
  /** Categoria em que este upload foi iniciado — cada card de categoria mostra só os seus. */
  categoria: CategoriaDocumento;
}

export function DocumentoUploadProgress({
  upload,
  onDispensar,
}: {
  upload: UploadEmAndamento;
  onDispensar: () => void;
}) {
  return (
    <li className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">{upload.nome}</span>
        {upload.status === "erro" && (
          <button
            type="button"
            onClick={onDispensar}
            className="text-xs font-medium text-zinc-500 underline"
          >
            Dispensar
          </button>
        )}
      </div>

      {upload.status === "enviando" ? (
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-black transition-all dark:bg-white"
            style={{ width: `${upload.progresso}%` }}
          />
        </div>
      ) : (
        <span className="text-xs text-red-600">{upload.erro}</span>
      )}
    </li>
  );
}
