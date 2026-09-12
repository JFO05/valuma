/**
 * Motor de cálculo de valuation — MVP acadêmico (TCC). Função pura: só
 * recebe DadosProcesso e devolve números, sem I/O.
 *
 * PREMISSAS ASSUMIDAS (documentar na banca):
 *
 * 1) Múltiplo de EBITDA (valuationEbitda)
 *    - Usa um múltiplo FIXO (MULTIPLO_EBITDA_PADRAO = 4x) sobre o EBITDA do
 *      último ano com dados reais no DRE (ver anosDreComDados em ./types.ts:
 *      um ano com receita bruta e EBITDA zerados é tratado como "não
 *      preenchido", não como "empresa com receita zero").
 *    - Na prática, múltiplos de EBITDA variam MUITO por setor, porte,
 *      momento de mercado e risco específico do negócio. Aqui foi
 *      simplificado para um valor único, igual para qualquer empresa —
 *      uma evolução natural seria parametrizar por setor/porte.
 *
 * 2) Fluxo de caixa descontado simplificado (valuationDcf)
 *    - Usa o EBITDA do último ano disponível como proxy de Fluxo de Caixa
 *      Livre (FCL) — NÃO desconta capex, variação de capital de giro nem
 *      impostos (IR/CSLL), e não ajusta por D&A. Um DCF real usa o FCL
 *      efetivo, não o EBITDA bruto; isso é uma simplificação grosseira e
 *      deliberada para o MVP.
 *    - Projeta HORIZONTE_PROJECAO_ANOS (5) anos à frente, crescendo o "FCL"
 *      a uma taxa fixa conservadora (TAXA_CRESCIMENTO_PROJECAO = 3% a.a.).
 *    - Desconta os fluxos projetados por uma taxa fixa
 *      (TAXA_DESCONTO_PADRAO = 15% a.a.), como proxy simplificado de uma
 *      taxa de desconto/WACC para PMEs brasileiras de risco moderado-alto.
 *    - NÃO inclui valor terminal/perpetuidade — soma só os 5 fluxos
 *      descontados. Isso SUBESTIMA o valor de uma empresa em continuidade;
 *      foi uma escolha deliberada para manter o MVP simples (evolução
 *      natural: somar um valor terminal via Gordon Growth).
 *
 * 3) Valuation patrimonial (valuationPatrimonial)
 *    - É o Patrimônio Líquido informado no balanço patrimonial resumido do
 *      intake. O formulário não versiona o balanço por ano (é um snapshot
 *      único), então assume-se que é a posição patrimonial mais recente.
 *
 * 4) Valuation final (valuationFinal)
 *    - Média ponderada: EBITDA 50%, DCF 30%, Patrimonial 20%
 *      (PESO_VALUATION_EBITDA / _DCF / _PATRIMONIAL).
 *    - Se EBITDA/DCF não puderem ser calculados (nenhum ano de DRE com
 *      dados reais), os pesos são renormalizados entre os métodos
 *      disponíveis em vez de zerar a média — ex: só com o patrimonial
 *      disponível, valuationFinal = valuationPatrimonial.
 */

import { anosDreComDados, type DadosProcesso } from "./types";

export const MULTIPLO_EBITDA_PADRAO = 4;
export const HORIZONTE_PROJECAO_ANOS = 5;
export const TAXA_CRESCIMENTO_PROJECAO = 0.03;
export const TAXA_DESCONTO_PADRAO = 0.15;

export const PESO_VALUATION_EBITDA = 0.5;
export const PESO_VALUATION_DCF = 0.3;
export const PESO_VALUATION_PATRIMONIAL = 0.2;

export interface ResultadoValuation {
  valuationEbitda: number | null;
  valuationDcf: number | null;
  valuationPatrimonial: number;
  valuationFinal: number | null;
  anoBaseUtilizado: number | null;
  ebitdaBaseUtilizado: number | null;
}

export function calcularValuation(dados: DadosProcesso): ResultadoValuation {
  const anosComDados = anosDreComDados(dados.financeiro.dre);
  const anoBase = anosComDados.at(-1) ?? null;
  const ebitdaBase = anoBase?.ebitda ?? null;

  const valuationEbitda =
    ebitdaBase !== null ? ebitdaBase * MULTIPLO_EBITDA_PADRAO : null;

  const valuationDcf =
    ebitdaBase !== null ? calcularDcfSimplificado(ebitdaBase) : null;

  const valuationPatrimonial = dados.financeiro.balanco.patrimonioLiquido;

  const componentes: { valor: number; peso: number }[] = [
    { valor: valuationPatrimonial, peso: PESO_VALUATION_PATRIMONIAL },
  ];
  if (valuationEbitda !== null) {
    componentes.push({ valor: valuationEbitda, peso: PESO_VALUATION_EBITDA });
  }
  if (valuationDcf !== null) {
    componentes.push({ valor: valuationDcf, peso: PESO_VALUATION_DCF });
  }

  const pesoTotal = componentes.reduce((soma, c) => soma + c.peso, 0);
  const valuationFinal =
    pesoTotal > 0
      ? componentes.reduce((soma, c) => soma + c.valor * c.peso, 0) / pesoTotal
      : null;

  return {
    valuationEbitda,
    valuationDcf,
    valuationPatrimonial,
    valuationFinal,
    anoBaseUtilizado: anoBase?.ano ?? null,
    ebitdaBaseUtilizado: ebitdaBase,
  };
}

function calcularDcfSimplificado(ebitdaBase: number): number {
  let valorPresente = 0;
  let fluxo = ebitdaBase;

  for (let ano = 1; ano <= HORIZONTE_PROJECAO_ANOS; ano++) {
    fluxo *= 1 + TAXA_CRESCIMENTO_PROJECAO;
    valorPresente += fluxo / Math.pow(1 + TAXA_DESCONTO_PADRAO, ano);
  }

  return valorPresente;
}
