import { z } from "zod";

const valorNaoNegativo = z
  .number({ invalid_type_error: "Informe um valor" })
  .min(0, "Não pode ser negativo");

// Lucro bruto e lucro líquido podem ser negativos (empresa deficitária no
// ano), por isso não usam valorNaoNegativo.
const valorComSinal = z.number({ invalid_type_error: "Informe um valor" });

// EBITDA é o único campo do DRE com a ambiguidade do zero corrigida (RG-33):
// `undefined` = não informado, qualquer número definido (incluindo 0 ou
// negativo) = informado. Sem `.optional()` aqui o campo se comportaria como
// os demais (default 0 == "não tocado"), o que a Regra de Negócio v1.0
// proíbe especificamente para o EBITDA-base (RG-41).
const valorComSinalOpcional = z
  .number({ invalid_type_error: "Informe um valor" })
  .optional();

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
  ebitda: valorComSinalOpcional,
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
  // Mesma correção da ambiguidade do zero aplicada ao EBITDA acima (RG-33) —
  // patrimônio líquido é o segundo campo explicitamente citado por RG-41
  // como precisando distinguir "não informado" de "informado como zero".
  patrimonioLiquido: valorComSinalOpcional,
});

export const POSSUI_DIVIDAS_OPTIONS = ["sim", "nao"] as const;
export type PossuiDividas = (typeof POSSUI_DIVIDAS_OPTIONS)[number];

export const financeiroSchema = z.object({
  dre: z.array(dreAnoSchema).length(3, "Preencha os 3 anos"),
  balanco: balancoSchema,
  // Caixa e equivalentes de caixa (RG-13): "recursos de alta liquidez
  // disponíveis pela empresa, como caixa e saldos bancários" — usado no
  // cálculo da Dívida Líquida (RG-15). Opcional/undefined por padrão (não
  // `0`) pelo mesmo motivo do EBITDA/patrimônio líquido acima.
  caixaEquivalentes: valorNaoNegativo.optional(),
  // Situação de dívida declarada (RG-14/1.2 do prompt de implementação):
  // elimina a ambiguidade entre "não respondeu" e "empresa não possui
  // dívidas" que o campo `dividas` (lista) sozinho não resolve — uma lista
  // vazia sempre significava as duas coisas ao mesmo tempo.
  possuiDividas: z.enum(POSSUI_DIVIDAS_OPTIONS).optional(),
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
    ebitda: undefined,
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
    patrimonioLiquido: undefined,
  },
  caixaEquivalentes: undefined,
  possuiDividas: undefined,
  dividas: [],
};

/**
 * Funde o jsonb salvo com os defaults, sem validar contra financeiroSchema —
 * ver o comentário equivalente em schema-perfil.ts::parsePerfilData. Um
 * `safeParse` aqui descartaria TODO o progresso parcial (ex: só o DRE de um
 * ano preenchido) sempre que qualquer campo obrigatório de outro bloco
 * ainda estivesse vazio.
 */
export function parseFinanceiroData(
  dados: Record<string, unknown>,
): FinanceiroFormValues {
  return { ...financeiroDefaultValues, ...dados } as FinanceiroFormValues;
}
