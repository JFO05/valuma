import { z } from "zod";

export const cargoEquipeSchema = z.object({
  cargo: z.string().min(1, "Informe o cargo/área"),
  quantidade: z
    .number({ invalid_type_error: "Informe um número" })
    .int("Use um número inteiro")
    .min(0, "Não pode ser negativo"),
});
export type CargoEquipeFormValues = z.infer<typeof cargoEquipeSchema>;

export const clientePrincipalSchema = z.object({
  nome: z.string().min(1, "Informe o nome do cliente"),
  percentualReceita: z
    .number({ invalid_type_error: "Informe um número" })
    .min(0, "Não pode ser negativo")
    .max(100, "Não pode passar de 100%"),
});
export type ClientePrincipalFormValues = z.infer<typeof clientePrincipalSchema>;

export const NIVEL_DEPENDENCIA_OPTIONS = ["baixa", "media", "alta"] as const;
export const NIVEL_DEPENDENCIA_LABELS: Record<
  (typeof NIVEL_DEPENDENCIA_OPTIONS)[number],
  string
> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
};

export const fornecedorSchema = z.object({
  nome: z.string().min(1, "Informe o nome do fornecedor"),
  tipoInsumo: z.string().min(1, "Informe o tipo de insumo/serviço"),
  nivelDependencia: z.enum(NIVEL_DEPENDENCIA_OPTIONS),
});
export type FornecedorFormValues = z.infer<typeof fornecedorSchema>;

export const operacaoSchema = z.object({
  numeroFuncionariosTotal: z
    .number({ invalid_type_error: "Informe um número" })
    .int("Use um número inteiro")
    .min(0, "Não pode ser negativo"),
  cargosEquipe: z.array(cargoEquipeSchema),
  numeroClientesAtivos: z
    .number({ invalid_type_error: "Informe um número" })
    .int("Use um número inteiro")
    .min(0, "Não pode ser negativo"),
  concentracaoTop3Clientes: z
    .number({ invalid_type_error: "Informe um número" })
    .min(0, "Não pode ser negativo")
    .max(100, "Não pode passar de 100%"),
  clientesPrincipais: z.array(clientePrincipalSchema),
  fornecedoresPrincipais: z.array(fornecedorSchema),
  processosOperacionais: z.string(),
});
export type OperacaoFormValues = z.infer<typeof operacaoSchema>;

export const operacaoDefaultValues: OperacaoFormValues = {
  numeroFuncionariosTotal: 0,
  cargosEquipe: [],
  numeroClientesAtivos: 0,
  concentracaoTop3Clientes: 0,
  clientesPrincipais: [],
  fornecedoresPrincipais: [],
  processosOperacionais: "",
};

export const cargoEquipeVazio: CargoEquipeFormValues = { cargo: "", quantidade: 0 };
export const clientePrincipalVazio: ClientePrincipalFormValues = {
  nome: "",
  percentualReceita: 0,
};
export const fornecedorVazio: FornecedorFormValues = {
  nome: "",
  tipoInsumo: "",
  nivelDependencia: "media",
};

export function parseOperacaoData(
  dados: Record<string, unknown>,
): OperacaoFormValues {
  const merged = { ...operacaoDefaultValues, ...dados };
  const result = operacaoSchema.safeParse(merged);
  return result.success ? result.data : operacaoDefaultValues;
}
