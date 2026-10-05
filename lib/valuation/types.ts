import type { PerfilFormValues } from "@/lib/intake/schema-perfil";
import type { DreAnoFormValues, FinanceiroFormValues } from "@/lib/intake/schema-financeiro";
import type { OperacaoFormValues } from "@/lib/intake/schema-operacao";
import type { MercadoFormValues } from "@/lib/intake/schema-mercado";
import type { DocumentosData } from "@/lib/intake/schema-documentos";

/**
 * Módulo 100% puro (sem I/O) — deliberado, para que calcular.ts e os
 * scripts de teste (scripts/testar-*.ts, rodados com tsx fora do Next)
 * possam importar isso sem arrastar `next/headers`/Supabase, que só
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
 * Um campo numérico "informado explicitamente" quando definido (mesmo que
 * zero ou negativo) — `null`/`undefined` é a única forma de "não informado"
 * (RG-31/RG-33 de docs/REGRAS_NEGOCIO_VALUMA_V1.md). Usado nos campos que
 * migraram do antigo default `0` para default `undefined`: EBITDA de cada
 * ano do DRE, patrimônio líquido e caixa e equivalentes de caixa — ver
 * lib/intake/schema-financeiro.ts.
 */
export function informadoExplicitamente(
  valor: number | null | undefined,
): valor is number {
  return typeof valor === "number" && Number.isFinite(valor);
}

/**
 * Anos do DRE considerados "com dados reais": receita bruta maior que zero,
 * ou EBITDA explicitamente informado (RG-33) — inclusive zero ou negativo.
 * Um ano em que nada foi tocado (receita bruta zerada e EBITDA não
 * informado) é tratado como "não preenchido". Retorna ordenado do ano mais
 * antigo para o mais recente.
 */
export function anosDreComDados(dre: DreAnoFormValues[]): DreAnoFormValues[] {
  return dre
    .filter((ano) => ano.receitaBruta > 0 || informadoExplicitamente(ano.ebitda))
    .sort((a, b) => a.ano - b.ano);
}

/** Identificador explícito da versão da regra de negócio que gerou um resultado (RG-47). */
export const MODEL_VERSION = "valu_ma_v1" as const;

/**
 * Valores intermediários do motor de valuation (RG-52 — explicabilidade),
 * persistidos no momento da geração para que "Como chegamos a este
 * resultado?" nunca precise recalcular por conta própria (RG-48: nunca uma
 * segunda fonte de cálculo) — só os 4 valores finais (Equity Value por
 * método + consolidado) têm coluna própria em `public.resultados`; estes
 * intermediários vivem dentro do mesmo jsonb `analise_ia` que já guarda a
 * versão do modelo. Ausente em resultados gerados antes desta versão.
 */
export interface ExplicabilidadeValuation {
  evMultiplos: number | null;
  evDcf: number | null;
  dividaFinanceiraTotal: number;
  caixaEquivalentes: number;
  dividaLiquida: number;
}

export interface AnaliseIA {
  pontosFortes: string[];
  riscos: string[];
  recomendacoes: string[];
  /** Ver ExplicabilidadeValuation — guardado aqui por reaproveitar o jsonb já existente, não por ser parte da análise da IA em si. */
  explicabilidade?: ExplicabilidadeValuation;
  /**
   * true quando a chamada à IA falhou nesta geração (chave ausente, erro da
   * API, resposta fora do schema esperado) — ver DEF-03 em
   * docs/DECISOES_MVP.md. Guardado dentro do próprio jsonb `analise_ia` de
   * public.resultados para não exigir uma coluna nova.
   */
  erro?: boolean;
}

/**
 * Quais dos 3 métodos são aplicáveis ao consolidado (RG-20/RG-21/RG-24 de
 * docs/REGRAS_NEGOCIO_VALUMA_V1.md) — o motor nunca renormaliza pesos entre
 * os métodos restantes (RG-22): o consolidado só existe quando os 3 forem
 * `true` simultaneamente.
 */
export interface AplicabilidadeMetodos {
  multiplos: boolean;
  dcf: boolean;
  patrimonial: boolean;
  consolidadoDisponivel: boolean;
}

/**
 * Formato final e combinado do resultado de um processo — valuation +
 * Índice de Prontidão + análise de IA — como é salvo/lido de
 * `public.resultados`. As colunas score_total/score_financeiro/
 * score_operacao/score_mercado/score_juridico são REAPROVEITADAS da versão
 * anterior (score de qualidade, lib/valuation/score.ts, removido na v1.0)
 * para guardar o Índice de Prontidão (lib/prontidao/checklist.ts) — Fase 2,
 * decisão D3 — sem exigir uma migration nova. scoreJuridico carrega hoje a
 * dimensão "Documental" do Índice, não mais uma nota de completude jurídica
 * específica (o nome da coluna no banco não mudou; só o significado e o
 * rótulo mostrado na interface).
 *
 * Os 4 campos de valuation são `number | null` (RG-24/RG-25): nulos quando o
 * método/consolidado correspondente não é aplicável — nunca renormalizados
 * nem substituídos por zero (ver supabase/schema.sql, colunas agora
 * nullable).
 */
export interface ResultadoValuation {
  valuationFinal: number | null;
  valuationEbitda: number | null;
  valuationDcf: number | null;
  /** Valor informado do Patrimônio Líquido — continua visível mesmo quando `aplicabilidade.patrimonial` é `false` (RG-21). */
  valuationPatrimonial: number | null;
  /**
   * Versão explícita do modelo/regra de negócio que gerou este resultado
   * (RG-47) — coluna própria (`resultados.modelo_versao`), independente de
   * `analiseIA`/`analise_ia` (achado DIV-02 da auditoria pós-implementação:
   * antes, a versão vivia dentro do próprio JSON da IA). `null` = resultado
   * legado (sem versão, ou versão anterior a esta coluna existir) — nunca
   * reinterpretado como `MODEL_VERSION` por omissão.
   */
  modeloVersao: string | null;
  aplicabilidade: AplicabilidadeMetodos;
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
