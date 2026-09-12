import type { PerfilFormValues } from "@/lib/intake/schema-perfil";
import type { DreAnoFormValues, FinanceiroFormValues } from "@/lib/intake/schema-financeiro";
import type { OperacaoFormValues } from "@/lib/intake/schema-operacao";
import type { MercadoFormValues } from "@/lib/intake/schema-mercado";
import type { DocumentosData } from "@/lib/intake/schema-documentos";

/**
 * Módulo 100% puro (sem I/O) — deliberado, para que calcular.ts, score.ts e
 * o script de teste (scripts/testar-valuation.ts, rodado com tsx fora do
 * Next) possam importar isso sem arrastar `next/headers`/Supabase, que só
 * funcionam dentro de uma request do Next. Quem busca os dados de verdade é
 * consolidarDadosProcesso, em ./consolidar.ts.
 */
export interface DadosProcesso {
  processoId: string;
  perfil: PerfilFormValues;
  financeiro: FinanceiroFormValues;
  operacao: OperacaoFormValues;
  mercado: MercadoFormValues;
  documentos: DocumentosData;
}

/**
 * Anos do DRE considerados "com dados reais": receita bruta ou EBITDA
 * diferente de zero. Um ano inteiramente zerado é tratado como "não
 * preenchido" — o formulário sempre inicializa os 3 anos com zeros, então um
 * ano zerado quase certamente é isso, não uma empresa com receita zero.
 * Retorna ordenado do ano mais antigo para o mais recente.
 */
export function anosDreComDados(dre: DreAnoFormValues[]): DreAnoFormValues[] {
  return dre
    .filter((ano) => ano.receitaBruta > 0 || ano.ebitda !== 0)
    .sort((a, b) => a.ano - b.ano);
}
