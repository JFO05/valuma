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

export interface AnaliseIA {
  pontosFortes: string[];
  riscos: string[];
  recomendacoes: string[];
  /**
   * true quando a chamada à IA falhou nesta geração (chave ausente, erro da
   * API, resposta fora do schema esperado) — ver DEF-03 em
   * docs/DECISOES_MVP.md. Guardado dentro do próprio jsonb `analise_ia` de
   * public.resultados para não exigir uma coluna nova.
   */
  erro?: boolean;
  /**
   * Marca resultados gerados com o Índice de Prontidão (Fase 2, decisão D3
   * em docs/DECISOES_MVP.md) — distingue de resultados antigos, gerados
   * antes desta mudança, cujas colunas score_* guardam o significado
   * anterior (nota de qualidade de lib/valuation/score.ts, removido nesta
   * fase). Guardado aqui, dentro do jsonb `analise_ia`, por ser o único
   * campo flexível disponível em public.resultados sem exigir migration.
   */
  versao?: "prontidao_v1";
}

/**
 * Formato final e combinado do resultado de um processo — valuation +
 * Índice de Prontidão + análise de IA — como é salvo/lido de
 * `public.resultados`. As colunas score_total/score_financeiro/
 * score_operacao/score_mercado/score_juridico são REAPROVEITADAS da versão
 * anterior (score de qualidade, lib/valuation/score.ts) para guardar o
 * Índice de Prontidão (lib/prontidao/checklist.ts) — Fase 2, decisão D3 —
 * sem exigir uma migration nova. scoreJuridico carrega hoje a dimensão
 * "Documental" do Índice, não mais uma nota de completude jurídica
 * específica (o nome da coluna no banco não mudou; só o significado e o
 * rótulo mostrado na interface).
 */
export interface ResultadoValuation {
  valuationFinal: number;
  valuationEbitda: number;
  valuationDcf: number;
  valuationPatrimonial: number;
  /** Índice de Prontidão geral (média das 4 dimensões abaixo). */
  scoreTotal: number;
  scoreFinanceiro: number;
  /** Dimensão "Operacional" do Índice de Prontidão. */
  scoreOperacao: number;
  scoreMercado: number;
  /** Dimensão "Documental" do Índice de Prontidão. */
  scoreJuridico: number;
  analiseIA: AnaliseIA;
}
