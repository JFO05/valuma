import { z } from "zod";

export const PORTE_OPTIONS = ["micro", "pequena", "media"] as const;

export const PORTE_LABELS: Record<(typeof PORTE_OPTIONS)[number], string> = {
  micro: "Microempresa",
  pequena: "Pequena empresa",
  media: "Média empresa",
};

export const UF_OPTIONS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO",
  "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI",
  "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

export const socioSchema = z.object({
  nome: z.string().min(1, "Informe o nome completo"),
  percentualParticipacao: z
    .number({ invalid_type_error: "Informe um número" })
    .min(0, "Não pode ser negativo")
    .max(100, "Não pode passar de 100%"),
  cargo: z.string().min(1, "Informe o cargo/função"),
});

export type SocioFormValues = z.infer<typeof socioSchema>;

export const perfilSchema = z.object({
  razaoSocial: z.string().min(1, "Informe a razão social"),
  nomeFantasia: z.string(),
  cnpj: z
    .string()
    .refine((v) => v === "" || /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(v), {
      message: "Use o formato 00.000.000/0000-00",
    }),
  dataFundacao: z.string(),
  setor: z.string().min(1, "Informe o setor/segmento"),
  porte: z.enum(PORTE_OPTIONS),
  numeroFuncionarios: z
    .number({ invalid_type_error: "Informe um número" })
    .int("Use um número inteiro")
    .min(0, "Não pode ser negativo"),
  cidade: z.string().min(1, "Informe a cidade"),
  uf: z.enum(UF_OPTIONS, { errorMap: () => ({ message: "Selecione a UF" }) }),
  socios: z.array(socioSchema),
});

export type PerfilFormValues = z.infer<typeof perfilSchema>;

export const perfilDefaultValues: PerfilFormValues = {
  razaoSocial: "",
  nomeFantasia: "",
  cnpj: "",
  dataFundacao: "",
  setor: "",
  porte: "micro",
  numeroFuncionarios: 0,
  cidade: "",
  uf: "SP",
  socios: [],
};

export const socioVazio: SocioFormValues = {
  nome: "",
  percentualParticipacao: 0,
  cargo: "",
};

/**
 * Funde o jsonb salvo com os defaults (cobre o caso de um processo novo, cujo
 * `dados` ainda é `{}`) e valida o resultado — se o jsonb estiver num formato
 * inesperado (ex: editado manualmente no Supabase), cai nos defaults em vez
 * de quebrar o formulário.
 */
export function parsePerfilData(dados: Record<string, unknown>): PerfilFormValues {
  const merged = { ...perfilDefaultValues, ...dados };
  const result = perfilSchema.safeParse(merged);
  return result.success ? result.data : perfilDefaultValues;
}
