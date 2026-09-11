import { z } from "zod";

export const BUCKET_DOCUMENTOS = "documentos-intake";

/**
 * Mantenha em sincronia com file_size_limit/allowed_mime_types do bucket em
 * supabase/schema.sql — isso aqui é só para dar feedback rápido no cliente;
 * quem realmente barra arquivo inválido é o bucket no servidor.
 */
export const TIPOS_PERMITIDOS = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/png",
] as const;

export const EXTENSOES_PERMITIDAS = [
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".jpg",
  ".jpeg",
  ".png",
];

export const TAMANHO_MAXIMO_BYTES = 20 * 1024 * 1024;

export const documentoArquivoSchema = z.object({
  nome: z.string(),
  path: z.string(),
  tamanho: z.number(),
  tipo: z.string(),
  enviadoEm: z.string(),
});
export type DocumentoArquivo = z.infer<typeof documentoArquivoSchema>;

export const documentosSchema = z.object({
  arquivos: z.array(documentoArquivoSchema),
});
export type DocumentosData = z.infer<typeof documentosSchema>;

export const documentosDefaultValues: DocumentosData = { arquivos: [] };

export function parseDocumentosData(dados: Record<string, unknown>): DocumentosData {
  const merged = { ...documentosDefaultValues, ...dados };
  const result = documentosSchema.safeParse(merged);
  return result.success ? result.data : documentosDefaultValues;
}

/** Validação client-side só para feedback rápido; a validação que vale é a do bucket. */
export function validarArquivo(file: File): string | null {
  if (file.size > TAMANHO_MAXIMO_BYTES) {
    return `Arquivo muito grande (máx. ${Math.round(TAMANHO_MAXIMO_BYTES / 1024 / 1024)} MB).`;
  }

  const tipoOk = (TIPOS_PERMITIDOS as readonly string[]).includes(file.type);
  const extensaoOk = EXTENSOES_PERMITIDAS.some((ext) =>
    file.name.toLowerCase().endsWith(ext),
  );

  if (!tipoOk && !extensaoOk) {
    return "Tipo de arquivo não permitido. Use PDF, DOC/DOCX, XLS/XLSX, JPG ou PNG.";
  }

  return null;
}

export function sanitizeFileName(name: string): string {
  return name.normalize("NFKD").replace(/[^\w.-]+/g, "_");
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}
