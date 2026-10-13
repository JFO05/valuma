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
      "É o principal dado usado na estimativa de valuation (métodos de Múltiplo de EBITDA e DCF simplificado — Fluxo de Caixa Descontado) e também conta na dimensão Financeira do Índice de Prontidão.",
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
      "Compõe a Dívida Líquida (dívida financeira total − caixa e equivalentes), usada para converter os métodos de Múltiplo de EBITDA e DCF simplificado de Enterprise Value para Equity Value. Também conta na dimensão Financeira do Índice de Prontidão.",
  },
  caixaEquivalentes: {
    titulo: "Caixa e equivalentes de caixa",
    oQueE:
      "Recursos de alta liquidez disponíveis pela empresa, como caixa e saldos bancários.",
    comoInfluencia:
      "É subtraído da dívida financeira total para calcular a Dívida Líquida, usada para converter os métodos de Múltiplo de EBITDA e DCF simplificado de Enterprise Value para Equity Value. Conta na dimensão Financeira do Índice de Prontidão.",
  },
  possuiDividas: {
    titulo: "Possui dívidas financeiras?",
    oQueE:
      "Declaração explícita de Sim/Não — evita confundir 'não respondi ainda' com 'a empresa realmente não tem dívidas'.",
    comoInfluencia:
      "Não entra na estimativa de valuation. É um dos campos mínimos para gerar qualquer análise e conta na dimensão Financeira do Índice de Prontidão.",
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
  motorMultiploEbitda: {
    titulo: "Múltiplo de EBITDA",
    oQueE:
      "O fator que multiplica o EBITDA do exercício-base para estimar o valor da operação (Enterprise Value) pelo método de Múltiplo de EBITDA.",
    comoInfluencia:
      "No Motor Essencial o ValuM&A utiliza 4,0x como premissa simplificada do MVP — não é uma cotação de mercado real. No Motor Configurável, você pode ajustar esse número, mas o método continua exigindo EBITDA positivo para ser aplicável.",
  },
  motorCrescimentoAnual: {
    titulo: "Crescimento anual (DCF simplificado)",
    oQueE:
      "A taxa de crescimento aplicada ao EBITDA-base em cada um dos anos projetados no DCF simplificado.",
    comoInfluencia:
      "No Motor Essencial é fixa em 3% a.a. Quanto maior, maior tende a ser o Equity Value estimado pelo DCF — mas isso não muda a condição de aplicabilidade do método (continua exigindo EBITDA positivo).",
  },
  motorTaxaDesconto: {
    titulo: "Taxa de desconto (DCF simplificado)",
    oQueE:
      "A taxa usada para trazer os fluxos futuros projetados a valor presente — uma proxy simplificada do risco do negócio.",
    comoInfluencia:
      "No Motor Essencial é fixa em 15% a.a. Quanto maior, menor tende a ser o Equity Value estimado pelo DCF (fluxos futuros valem menos hoje).",
  },
  motorHorizonteAnos: {
    titulo: "Horizonte de projeção (DCF simplificado)",
    oQueE: "Por quantos anos o DCF simplificado projeta o fluxo de caixa.",
    comoInfluencia:
      "No Motor Essencial são 5 anos, sem valor terminal/perpetuidade — o modelo não captura o valor da empresa além desse horizonte, por isso tende a ser conservador para empresas em continuidade.",
  },
  motorPonderacao: {
    titulo: "Ponderação dos métodos",
    oQueE:
      "O peso de cada método ativo na Estimativa preliminar de Equity Value consolidada.",
    comoInfluencia:
      "No Motor Essencial é fixo em 50% Múltiplo + 30% DCF simplificado + 20% Patrimonial. No Motor Configurável, os pesos dos métodos ativos precisam somar exatamente 100% — sem isso, o sistema não gera o consolidado.",
  },
  documentos: {
    titulo: "Documentos",
    oQueE:
      "Arquivos organizados em 6 categorias fixas (DRE, Balanço Patrimonial, Endividamento, Societário, Fiscal/Tributário, Contratos relevantes).",
    comoInfluencia:
      "Não entram na estimativa de valuation. A dimensão Documental do Índice de Prontidão mede quantas das 6 categorias têm pelo menos 1 documento categorizado — enviar vários arquivos na mesma categoria conta só 1 vez.",
  },
};
