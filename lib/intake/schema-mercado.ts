import { z } from "zod";

export const PORTE_CONCORRENTE_OPTIONS = ["pequeno", "medio", "grande"] as const;
export const PORTE_CONCORRENTE_LABELS: Record<
  (typeof PORTE_CONCORRENTE_OPTIONS)[number],
  string
> = {
  pequeno: "Pequeno",
  medio: "Médio",
  grande: "Grande",
};

export const concorrenteSchema = z.object({
  nome: z.string().min(1, "Informe o nome do concorrente"),
  porteEstimado: z.enum(PORTE_CONCORRENTE_OPTIONS),
  diferencialPercebido: z.string(),
});
export type ConcorrenteFormValues = z.infer<typeof concorrenteSchema>;

export const mercadoSchema = z.object({
  concorrentes: z.array(concorrenteSchema),
  posicionamento: z.string(),
  tamMercado: z
    .number({ invalid_type_error: "Informe um número" })
    .min(0, "Não pode ser negativo")
    .optional(),
  sinergiasPotenciais: z.string(),
});
export type MercadoFormValues = z.infer<typeof mercadoSchema>;

export const mercadoDefaultValues: MercadoFormValues = {
  concorrentes: [],
  posicionamento: "",
  tamMercado: undefined,
  sinergiasPotenciais: "",
};

export const concorrenteVazio: ConcorrenteFormValues = {
  nome: "",
  porteEstimado: "medio",
  diferencialPercebido: "",
};

/**
 * Não valida contra mercadoSchema de propósito — ver o comentário
 * equivalente em schema-perfil.ts::parsePerfilData.
 */
export function parseMercadoData(dados: Record<string, unknown>): MercadoFormValues {
  return { ...mercadoDefaultValues, ...dados } as MercadoFormValues;
}
