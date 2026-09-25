/**
 * Textos de ajuda contextual (Fase 4.7), indexados por um id semântico do
 * campo (não precisa bater com nenhum `id` de HTML). Centralizados aqui,
 * fora dos formulários, para ficar fácil manter coerente com a fórmula real
 * do motor (lib/valuation/calcular.ts, lib/prontidao/checklist.ts) — cada
 * texto só diz que um campo "influencia o valuation" quando ele realmente
 * aparece em calcularValuation; os demais dizem explicitamente que só contam
 * para o Índice de Prontidão.
 */
export interface AjudaCampo {
  titulo: string;
  oQueE: string;
  comoInfluencia: string;
}

export const AJUDA_CAMPOS: Record<string, AjudaCampo> = {
  ebitda: {
    titulo: "EBITDA",
    oQueE:
      "Lucro antes de juros, impostos, depreciação e amortização — uma medida aproximada da geração de caixa operacional da empresa.",
    comoInfluencia:
      "É o principal dado usado na estimativa de valuation (métodos de Múltiplo de EBITDA e Fluxo de Caixa Descontado) e também conta na dimensão Financeira do Índice de Prontidão.",
  },
  receitaBruta: {
    titulo: "Receita bruta",
    oQueE:
      "O total faturado pela empresa antes de descontar impostos e devoluções.",
    comoInfluencia:
      "Não entra diretamente na estimativa de valuation hoje (quem entra é o EBITDA). Conta na dimensão Financeira do Índice de Prontidão.",
  },
  patrimonioLiquido: {
    titulo: "Patrimônio líquido",
    oQueE:
      "A diferença entre tudo que a empresa possui (ativos) e tudo que ela deve (passivos) — o valor contábil do negócio.",
    comoInfluencia:
      "É usado diretamente no método Patrimonial da estimativa de valuation (peso de 20% no consolidado) e conta na dimensão Financeira do Índice de Prontidão.",
  },
  dividas: {
    titulo: "Dívidas e financiamentos",
    oQueE:
      "Empréstimos, financiamentos e outras obrigações formais da empresa com credores.",
    comoInfluencia:
      "Não entra na estimativa de valuation hoje. No Índice de Prontidão, conta como preenchida quando pelo menos uma dívida é cadastrada — se a empresa não tem dívidas, essa informação específica fica em aberto no Índice, mesmo assim.",
  },
  concentracaoClientes: {
    titulo: "Concentração dos 3 maiores clientes",
    oQueE: "O percentual da receita total que vem dos 3 maiores clientes.",
    comoInfluencia:
      "Não entra na estimativa de valuation. Conta na dimensão Operacional do Índice de Prontidão.",
  },
  tamMercado: {
    titulo: "Tamanho de mercado (TAM)",
    oQueE:
      "Uma estimativa do tamanho total do mercado em que a empresa atua (Total Addressable Market).",
    comoInfluencia:
      "Não entra na estimativa de valuation. Conta na dimensão Mercado do Índice de Prontidão.",
  },
  sinergias: {
    titulo: "Sinergias potenciais para M&A",
    oQueE:
      "Ganhos que um comprador poderia obter ao combinar operações com a empresa — por exemplo, logística compartilhada ou novos canais de venda.",
    comoInfluencia:
      "Não entra na estimativa de valuation. Conta na dimensão Mercado do Índice de Prontidão e ajuda a IA a compor a análise qualitativa.",
  },
  documentos: {
    titulo: "Documentos",
    oQueE:
      "Arquivos que comprovam ou detalham as informações da empresa (ex.: contrato social, balanços).",
    comoInfluencia:
      "Não entram na estimativa de valuation. A quantidade de documentos enviados forma a dimensão Documental do Índice de Prontidão.",
  },
};
