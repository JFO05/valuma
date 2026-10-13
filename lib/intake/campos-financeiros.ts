import type { DreAnoFormValues } from "@/lib/intake/schema-financeiro";

/**
 * Fonte única de verdade dos campos financeiros (V2, seção 5 do prompt de
 * evolução): formulário manual (dre-fieldset.tsx), modelo Excel e parser de
 * importação (excel-financeiro.ts) usam esta mesma definição — evita manter
 * 2-3 listas independentes que podem divergir silenciosamente.
 */
export interface CampoDre {
  chave: Exclude<keyof DreAnoFormValues, "ano">;
  label: string;
  ajudaId?: string;
}

export const CAMPOS_DRE: CampoDre[] = [
  { chave: "receitaBruta", label: "Receita bruta", ajudaId: "receitaBruta" },
  { chave: "deducoes", label: "Deduções" },
  { chave: "receitaLiquida", label: "Receita líquida" },
  { chave: "custos", label: "Custos" },
  { chave: "lucroBruto", label: "Lucro bruto" },
  { chave: "despesasOperacionais", label: "Despesas operacionais" },
  { chave: "ebitda", label: "EBITDA", ajudaId: "ebitda" },
  { chave: "lucroLiquido", label: "Lucro líquido" },
];

export interface CampoBalanco {
  chave: "ativoTotal" | "ativoCirculante" | "passivoTotal" | "passivoCirculante" | "patrimonioLiquido";
  label: string;
  ajudaId?: string;
}

export const CAMPOS_BALANCO: CampoBalanco[] = [
  { chave: "ativoTotal", label: "Ativo total" },
  { chave: "ativoCirculante", label: "Ativo circulante" },
  { chave: "passivoTotal", label: "Passivo total" },
  { chave: "passivoCirculante", label: "Passivo circulante" },
  { chave: "patrimonioLiquido", label: "Patrimônio líquido", ajudaId: "patrimonioLiquido" },
];
