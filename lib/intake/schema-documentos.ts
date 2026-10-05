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

/**
 * Seis categorias documentais fixas da v1 (RG-35 de
 * docs/REGRAS_NEGOCIO_VALUMA_V1.md) — substituem a antiga medição por
 * quantidade bruta de arquivos (5 "slots" genéricos) na dimensão Documental
 * do Índice de Prontidão. Períodos: DRE/Balanço/Endividamento/Fiscal
 * suportam um período de referência opcional; Societário e Contratos
 * normalmente não têm um exercício associado (1.5 do prompt de
 * implementação) — por isso `periodoAplicavel` abaixo, usado só para exibir
 * ou não o campo de período no formulário, nunca para bloquear o upload.
 */
export const CATEGORIAS_DOCUMENTO = [
  "dre",
  "balanco_patrimonial",
  "endividamento",
  "societario",
  "fiscal_tributario",
  "contratos_relevantes",
] as const;

export type CategoriaDocumento = (typeof CATEGORIAS_DOCUMENTO)[number];

export const CATEGORIA_DOCUMENTO_LABELS: Record<CategoriaDocumento, string> = {
  dre: "Demonstração do Resultado — DRE",
  balanco_patrimonial: "Balanço Patrimonial",
  endividamento: "Documentação/posição de endividamento",
  societario: "Contrato Social ou Estatuto e alterações",
  fiscal_tributario: "Documentação fiscal/tributária relevante",
  contratos_relevantes: "Contratos relevantes",
};

export const CATEGORIA_DOCUMENTO_PERIODO_APLICAVEL: Record<CategoriaDocumento, boolean> = {
  dre: true,
  balanco_patrimonial: true,
  endividamento: true,
  societario: false,
  fiscal_tributario: true,
  contratos_relevantes: false,
};

export const documentoArquivoSchema = z.object({
  nome: z.string(),
  path: z.string(),
  tamanho: z.number(),
  tipo: z.string(),
  enviadoEm: z.string(),
  /**
   * Ausente = documento ainda não categorizado — não conta para nenhuma
   * categoria da Prontidão Documental (RG-33: `undefined` é sempre "não
   * informado", nunca um valor implícito). O usuário categoriza logo após o
   * upload; ver components/intake/documentos-form.tsx.
   */
  categoria: z.enum(CATEGORIAS_DOCUMENTO).optional(),
  /** Período/exercício de referência (ex.: "2025"), quando aplicável à categoria (RG-35). */
  periodoReferencia: z.string().optional(),
  /**
   * Hash SHA-256 (hex) do conteúdo do arquivo, calculado no navegador antes
   * do upload (Web Crypto API — sem biblioteca nova) — mecanismo de
   * duplicidade simples pedido em 1.4 do prompt de implementação. Ausente em
   * documentos enviados antes desta versão (compatibilidade retroativa: sem
   * hash, simplesmente não participam da checagem de duplicidade).
   */
  hash: z.string().optional(),
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

/**
 * Hash SHA-256 do conteúdo do arquivo via Web Crypto (`crypto.subtle`, nativa
 * do navegador) — usado só para detectar duplicidade (1.4 do prompt de
 * implementação), nunca para inspecionar o conteúdo do documento.
 */
export async function calcularHashArquivo(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Um documento já existente é considerado duplicata do arquivo recém-enviado
 * quando tem o mesmo hash de conteúdo E a mesma categoria (RG-36: a
 * duplicidade é avaliada por categoria, não globalmente — dois documentos
 * idênticos em categorias diferentes não são "a mesma informação
 * duplicada"). Documentos antigos sem `hash` (enviados antes desta versão)
 * nunca são considerados duplicata de nada.
 */
export function encontrarDuplicata(
  arquivos: DocumentoArquivo[],
  novo: { hash: string; categoria: CategoriaDocumento | undefined },
): DocumentoArquivo | undefined {
  if (!novo.categoria) return undefined;
  return arquivos.find(
    (a) => a.hash === novo.hash && a.categoria === novo.categoria,
  );
}

/**
 * Critérios mínimos de "documento disponibilizado" (RG-37) — NÃO é
 * "validado profissionalmente" (RG-38): só presença estrutural mínima,
 * nenhuma leitura de conteúdo. Formato/tamanho máximo já são aplicados no
 * momento do upload (validarArquivo + policy do bucket), então aqui só
 * resta confirmar categoria presente e arquivo não vazio.
 */
export function documentoDisponibilizado(documento: DocumentoArquivo): boolean {
  return documento.categoria !== undefined && documento.tamanho > 0;
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
