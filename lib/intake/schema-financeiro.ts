import { z } from "zod";

const valorNaoNegativo = z
  .number({ invalid_type_error: "Informe um valor" })
  .min(0, "Não pode ser negativo");

// Lucro bruto, EBITDA e lucro líquido podem ser negativos (empresa
// deficitária no ano), por isso não usam valorNaoNegativo.
const valorComSinal = z.number({ invalid_type_error: "Informe um valor" });

export const dreAnoSchema = z.object({
  ano: z
    .number({ invalid_type_error: "Informe o ano" })
    .int("Use um ano válido")
    .min(2000, "Ano inválido")
    .max(2100, "Ano inválido"),
  receitaBruta: valorNaoNegativo,
  deducoes: valorNaoNegativo,
  receitaLiquida: valorNaoNegativo,
  custos: valorNaoNegativo,
  lucroBruto: valorComSinal,
  despesasOperacionais: valorNaoNegativo,
  ebitda: valorComSinal,
  lucroLiquido: valorComSinal,
});

export type DreAnoFormValues = z.infer<typeof dreAnoSchema>;

export const dividaSchema = z.object({
  credor: z.string().min(1, "Informe o credor"),
  valor: valorNaoNegativo,
  taxaJurosAnual: z
    .number({ invalid_type_error: "Informe a taxa" })
    .min(0, "Não pode ser negativa"),
  vencimento: z.string().min(1, "Informe o vencimento"),
});

export type DividaFormValues = z.infer<typeof dividaSchema>;

export const balancoSchema = z.object({
  ativoTotal: valorNaoNegativo,
  ativoCirculante: valorNaoNegativo,
  passivoTotal: valorNaoNegativo,
  passivoCirculante: valorNaoNegativo,
  patrimonioLiquido: valorComSinal,
});

export const financeiroSchema = z.object({
  dre: z.array(dreAnoSchema).length(3, "Preencha os 3 anos"),
  balanco: balancoSchema,
  dividas: z.array(dividaSchema),
});

export type FinanceiroFormValues = z.infer<typeof financeiroSchema>;

function anoAtual() {
  return new Date().getFullYear();
}

export function criarDreAnoVazio(ano: number): DreAnoFormValues {
  return {
    ano,
    receitaBruta: 0,
    deducoes: 0,
    receitaLiquida: 0,
    custos: 0,
    lucroBruto: 0,
    despesasOperacionais: 0,
    ebitda: 0,
    lucroLiquido: 0,
  };
}

export const dividaVazia: DividaFormValues = {
  credor: "",
  valor: 0,
  taxaJurosAnual: 0,
  vencimento: "",
};

export const financeiroDefaultValues: FinanceiroFormValues = {
  dre: [
    criarDreAnoVazio(anoAtual() - 1),
    criarDreAnoVazio(anoAtual() - 2),
    criarDreAnoVazio(anoAtual() - 3),
  ],
  balanco: {
    ativoTotal: 0,
    ativoCirculante: 0,
    passivoTotal: 0,
    passivoCirculante: 0,
    patrimonioLiquido: 0,
  },
  dividas: [],
};

/**
 * Mesma lógica de parsePerfilData: funde com os defaults e valida, caindo
 * nos defaults se o jsonb salvo estiver num formato inesperado.
 */
export function parseFinanceiroData(
  dados: Record<string, unknown>,
): FinanceiroFormValues {
  const merged = { ...financeiroDefaultValues, ...dados };
  const result = financeiroSchema.safeParse(merged);
  return result.success ? result.data : financeiroDefaultValues;
}
