/**
 * Motor de score — MVP acadêmico (TCC). Função pura, 4 dimensões de 0 a 100.
 *
 * REGRA GERAL SOBRE DADOS AUSENTES:
 * - Critérios baseados em LISTA (concorrentes, fornecedores, documentos)
 *   tratam lista vazia como um sinal REAL, não como "sem dados": contam
 *   quantos itens existem e pontuam a partir disso (0 itens => nota baixa
 *   quando "mais é melhor", já que uma lista vazia não é ambígua — o usuário
 *   simplesmente não cadastrou nada).
 * - Critérios baseados em um único campo numérico/percentual cujo valor
 *   padrão (0) É ambíguo entre "não preenchido" e "genuinamente zero" (ex:
 *   % de concentração de clientes, margem EBITDA) usam nota NEUTRA (50)
 *   quando não há nenhum outro sinal de que aquela parte do formulário foi
 *   tocada — em vez de premiar ou penalizar o silêncio.
 *
 * DIMENSÃO FINANCEIRA (scoreFinanceiro) — média de 2 critérios:
 *   1) Margem EBITDA do último ano disponível (ebitda / receitaBruta):
 *      0% => 0, MARGEM_EBITDA_REFERENCIA (30%) ou mais => 100, linear entre
 *      os dois. Sem nenhum ano de DRE com dados reais => nota neutra 50.
 *   2) Endividamento (soma das dívidas / patrimônio líquido): 0x => 100,
 *      ALAVANCAGEM_LIMIAR (1.5x) ou mais => 0, linear entre os dois.
 *      Patrimônio líquido <= 0 com dívidas > 0 => 0 (pior caso, alavancagem
 *      infinita). Patrimônio líquido <= 0 e nenhuma dívida cadastrada =>
 *      nota neutra 50 (não há sinal suficiente para avaliar).
 *
 * DIMENSÃO OPERAÇÃO (scoreOperacao) — média de 2 critérios:
 *   1) Concentração de clientes (concentracaoTop3Clientes): 0% => 100,
 *      100% => 0, linear entre os dois. Sem nenhum cliente cadastrado e sem
 *      número de clientes ativos informado => nota neutra 50.
 *   2) Diversificação de fornecedores: média do nível de dependência
 *      informado por fornecedor (baixa=100, média=60, alta=20). Nenhum
 *      fornecedor cadastrado => nota neutra 50 (aqui a lista vazia é tratada
 *      como ausência de dado, não como "não depende de ninguém" — não dá
 *      pra saber se a empresa não tem fornecedores relevantes ou só não
 *      preencheu essa parte).
 *
 * DIMENSÃO MERCADO (scoreMercado) — média de 2 critérios:
 *   1) Concorrentes mapeados: 0 => 0, CONCORRENTES_REFERENCIA (5) ou mais
 *      => 100, linear entre os dois. Lista vazia aqui É um sinal real
 *      (ninguém foi mapeado / não houve pesquisa de mercado).
 *   2) Clareza do posicionamento: proxy simples pelo tamanho do texto
 *      escrito (não há análise de conteúdo aqui, só de volume): 0
 *      caracteres => 0, POSICIONAMENTO_CARACTERES_REFERENCIA (120, ~um
 *      parágrafo curto) ou mais => 100, linear entre os dois.
 *
 * DIMENSÃO JURÍDICA (scoreJuridico) — não existe etapa jurídica dedicada no
 * intake, então usamos como proxy a quantidade de documentos enviados na
 * etapa "documentos": 0 => 0, DOCUMENTOS_ESPERADOS_PADRAO (5) ou mais =>
 * 100, linear entre os dois. Não valida QUAIS documentos foram enviados (o
 * formulário não categoriza por tipo), só a quantidade.
 *
 * SCORE TOTAL: média simples das 4 dimensões (25% cada) — não havia outra
 * definição de pesos no momento da implementação.
 */

import type { DadosProcesso } from "./types";
import { anosDreComDados } from "./types";

export const MARGEM_EBITDA_REFERENCIA = 0.3;
export const ALAVANCAGEM_LIMIAR = 1.5;
export const CONCORRENTES_REFERENCIA = 5;
export const POSICIONAMENTO_CARACTERES_REFERENCIA = 120;
export const DOCUMENTOS_ESPERADOS_PADRAO = 5;

const NOTA_NEUTRA = 50;

const NOTA_DEPENDENCIA: Record<"baixa" | "media" | "alta", number> = {
  baixa: 100,
  media: 60,
  alta: 20,
};

export interface ResultadoScore {
  scoreFinanceiro: number;
  scoreOperacao: number;
  scoreMercado: number;
  scoreJuridico: number;
  scoreTotal: number;
}

function clamp01(valor: number): number {
  return Math.min(1, Math.max(0, valor));
}

function escalaLinear(valor: number, minimo: number, maximo: number): number {
  if (maximo === minimo) return 0;
  return clamp01((valor - minimo) / (maximo - minimo)) * 100;
}

export function calcularScore(dados: DadosProcesso): ResultadoScore {
  const scoreFinanceiro = calcularScoreFinanceiro(dados);
  const scoreOperacao = calcularScoreOperacao(dados);
  const scoreMercado = calcularScoreMercado(dados);
  const scoreJuridico = calcularScoreJuridico(dados);

  const scoreTotal =
    (scoreFinanceiro + scoreOperacao + scoreMercado + scoreJuridico) / 4;

  return { scoreFinanceiro, scoreOperacao, scoreMercado, scoreJuridico, scoreTotal };
}

function calcularScoreFinanceiro(dados: DadosProcesso): number {
  const anoBase = anosDreComDados(dados.financeiro.dre).at(-1);

  const scoreMargem =
    anoBase && anoBase.receitaBruta > 0
      ? escalaLinear(
          anoBase.ebitda / anoBase.receitaBruta,
          0,
          MARGEM_EBITDA_REFERENCIA,
        )
      : NOTA_NEUTRA;

  const totalDividas = dados.financeiro.dividas.reduce(
    (soma, d) => soma + d.valor,
    0,
  );
  const patrimonioLiquido = dados.financeiro.balanco.patrimonioLiquido;

  let scoreEndividamento: number;
  if (totalDividas === 0 && patrimonioLiquido <= 0) {
    scoreEndividamento = NOTA_NEUTRA;
  } else if (patrimonioLiquido <= 0) {
    scoreEndividamento = 0;
  } else {
    scoreEndividamento =
      100 - escalaLinear(totalDividas / patrimonioLiquido, 0, ALAVANCAGEM_LIMIAR);
  }

  return (scoreMargem + scoreEndividamento) / 2;
}

function calcularScoreOperacao(dados: DadosProcesso): number {
  const { operacao } = dados;

  const temSinalDeClientes =
    operacao.numeroClientesAtivos > 0 || operacao.clientesPrincipais.length > 0;

  const scoreConcentracao = temSinalDeClientes
    ? 100 - escalaLinear(operacao.concentracaoTop3Clientes, 0, 100)
    : NOTA_NEUTRA;

  const scoreDiversificacaoFornecedores =
    operacao.fornecedoresPrincipais.length === 0
      ? NOTA_NEUTRA
      : operacao.fornecedoresPrincipais.reduce(
          (soma, f) => soma + NOTA_DEPENDENCIA[f.nivelDependencia],
          0,
        ) / operacao.fornecedoresPrincipais.length;

  return (scoreConcentracao + scoreDiversificacaoFornecedores) / 2;
}

function calcularScoreMercado(dados: DadosProcesso): number {
  const { mercado } = dados;

  const scoreConcorrentes = escalaLinear(
    mercado.concorrentes.length,
    0,
    CONCORRENTES_REFERENCIA,
  );

  const scorePosicionamento = escalaLinear(
    mercado.posicionamento.trim().length,
    0,
    POSICIONAMENTO_CARACTERES_REFERENCIA,
  );

  return (scoreConcorrentes + scorePosicionamento) / 2;
}

function calcularScoreJuridico(dados: DadosProcesso): number {
  return escalaLinear(
    dados.documentos.arquivos.length,
    0,
    DOCUMENTOS_ESPERADOS_PADRAO,
  );
}
