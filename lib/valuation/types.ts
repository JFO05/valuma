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
}

/**
 * Formato final e combinado do resultado de um processo — valuation + score
 * + análise de IA — exatamente como vai ser retornado por `public.resultados`
 * quando essa tabela existir. Não confundir com `ResultadoCalculoValuation`
 * (em ./calcular.ts), que é só a saída bruta de `calcularValuation` (sem
 * scores nem IA); esse tipo aqui é o contrato "de fora para dentro" que a
 * tela de resultado (app/processos/[processoId]/resultado/page.tsx) espera
 * — hoje vem de lib/valuation/mock.ts, depois vai vir de uma query real.
 */
export interface ResultadoValuation {
  valuationFinal: number;
  valuationEbitda: number;
  valuationDcf: number;
  valuationPatrimonial: number;
  scoreTotal: number;
  scoreFinanceiro: number;
  scoreOperacao: number;
  scoreMercado: number;
  scoreJuridico: number;
  analiseIA: AnaliseIA;
}
