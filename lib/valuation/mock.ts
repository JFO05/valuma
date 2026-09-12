import type { ResultadoValuation } from "./types";

/**
 * Dado de exemplo no formato final de ResultadoValuation (ver ./types.ts) —
 * usado temporariamente pela tela de resultado
 * (app/processos/[processoId]/resultado/page.tsx) até que a tabela
 * public.resultados e o cálculo real (valuation + score + IA) existam.
 *
 * Quando isso estiver pronto, troque a fonte do dado na página (ver TODO lá)
 * por uma busca real — o JSX inteiro já está desenhado em cima deste shape.
 */
export const mockResultadoValuation: ResultadoValuation = {
  valuationFinal: 2_441_786.46,
  valuationEbitda: 2_720_000,
  valuationDcf: 2_472_621.54,
  valuationPatrimonial: 1_700_000,
  scoreTotal: 72.5,
  scoreFinanceiro: 68.8,
  scoreOperacao: 81,
  scoreMercado: 80,
  scoreJuridico: 60,
  analiseIA: {
    pontosFortes: [
      "Crescimento consistente de receita e EBITDA nos últimos 3 anos.",
      "Baixa concentração de clientes (18% de receita nos 3 maiores), reduzindo risco de dependência.",
      "Nível de endividamento controlado em relação ao patrimônio líquido.",
    ],
    riscos: [
      "Margem EBITDA (16,6%) está abaixo da referência de mercado para o setor.",
      "Documentação societária e financeira incompleta para due diligence (poucos documentos anexados).",
      "Posicionamento de mercado descrito de forma genérica, sem diferenciação clara frente aos concorrentes mapeados.",
    ],
    recomendacoes: [
      "Completar o envio de documentos societários e financeiros antes de iniciar conversas com potenciais compradores.",
      "Detalhar melhor a proposta de valor e os diferenciais competitivos na etapa de Mercado.",
      "Mapear mais concorrentes diretos e indiretos para fortalecer a análise de posicionamento.",
    ],
  },
};
