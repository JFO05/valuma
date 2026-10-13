"use client";

import { Badge } from "@/components/ui/badge";
import { DocumentoListItem } from "@/components/intake/documento-list-item";
import { DocumentoUploadProgress, type UploadEmAndamento } from "@/components/intake/documento-upload-progress";
import {
  CATEGORIA_DOCUMENTO_LABELS,
  documentoDisponibilizado,
  type CategoriaDocumento,
  type DocumentoArquivo,
} from "@/lib/intake/schema-documentos";

/**
 * Um card por categoria documental fixa (RG-35), cada um com seu próprio
 * upload — o cliente já envia o arquivo direto na categoria certa, sem
 * precisar escolher depois (o antigo fluxo tinha um upload geral + um
 * seletor de categoria por arquivo). "Disponibilizado"/"Pendente" nunca vira
 * "validado profissionalmente" (RG-38).
 */
export function CategoriaDocumentoCard({
  categoria,
  arquivos,
  uploads,
  removendoPath,
  onFiles,
  onRemover,
  onPeriodoChange,
  onDispensarUpload,
}: {
  categoria: CategoriaDocumento;
  arquivos: DocumentoArquivo[];
  uploads: UploadEmAndamento[];
  removendoPath: string | null;
  onFiles: (fileList: FileList | null) => void;
  onRemover: (documento: DocumentoArquivo) => void;
  onPeriodoChange: (documento: DocumentoArquivo, periodo: string) => void;
  onDispensarUpload: (uploadId: string) => void;
}) {
  const inputId = `documentos.categoria.${categoria}`;
  const atendida = arquivos.some((a) => documentoDisponibilizado(a));

  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border p-4 transition-colors ${
        atendida
          ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/30"
          : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
      }`}
    >
      <div className="flex flex-col items-start gap-2">
        <span className="text-sm font-medium text-ink dark:text-zinc-50">
          {CATEGORIA_DOCUMENTO_LABELS[categoria]}
        </span>
        <Badge variante={atendida ? "sucesso" : "neutro"}>
          {atendida ? "Disponibilizado" : "Pendente"}
        </Badge>
      </div>

      {arquivos.length === 0 && uploads.length === 0 && (
        <span className="text-xs text-zinc-500">Nenhum arquivo nesta categoria ainda.</span>
      )}

      {arquivos.length > 0 && (
        <ul className="flex flex-col gap-2">
          {arquivos.map((documento) => (
            <DocumentoListItem
              key={documento.path}
              documento={documento}
              removendo={removendoPath === documento.path}
              onRemover={() => onRemover(documento)}
              onPeriodoChange={(periodo) => onPeriodoChange(documento, periodo)}
            />
          ))}
        </ul>
      )}

      {uploads.length > 0 && (
        <ul className="flex flex-col gap-2">
          {uploads.map((upload) => (
            <DocumentoUploadProgress
              key={upload.id}
              upload={upload}
              onDispensar={() => onDispensarUpload(upload.id)}
            />
          ))}
        </ul>
      )}

      <label
        htmlFor={inputId}
        className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-dashed border-zinc-300 px-3 py-2.5 text-xs font-medium text-ink transition-colors hover:border-accent/50 dark:border-zinc-700 dark:text-zinc-50"
      >
        <span aria-hidden>+</span> Anexar arquivo
        <input
          id={inputId}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
          className="hidden"
          onChange={(e) => {
            onFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </label>
    </div>
  );
}
