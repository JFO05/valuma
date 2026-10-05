/**
 * Motor de cálculo de valuation — Regra de Negócio v1.0
 * (docs/REGRAS_NEGOCIO_VALUMA_V1.md, seções B–G). Função pura: só recebe
 * DadosProcesso e devolve números, sem I/O.
 *
 * PREMISSAS (documentar na banca):
 *
 * 1) Múltiplo de EBITDA (RG-06/RG-07/RG-16)
 *    - Múltiplo FIXO (MULTIPLO_EBITDA_PADRAO = 4x) sobre o EBITDA do último
 *      ano com dados reais no DRE (anoBase, ver anosDreComDados em
 *      ./types.ts). Produz um Enterprise Value (evMultiplos), depois
 *      convertido para Equity Value subtraindo a Dívida Líquida (RG-16).
 *    - Não varia por setor/porte/região — simplificação deliberada do MVP.
 *
 * 2) DCF simplificado (RG-09/RG-10/RG-17)
 *    - EBITDA-base como proxy de fluxo de caixa livre, projetado 5 anos a
 *      3% a.a. e descontado a 15% a.a., sem valor terminal. Produz um
 *      Enterprise Value (evDcf), convertido para Equity Value subtraindo a
 *      Dívida Líquida — mesma conversão do método de Múltiplos (RG-17).
 *
 * 3) Patrimonial (RG-18)
 *    - O Patrimônio Líquido informado já é uma proxy de Equity Value —
 *      nenhuma conversão de dívida líquida é aplicada a ele.
 *
 * 4) Dívida líquida (RG-13/RG-14/RG-15)
 *    - DividaLiquida = soma das dívidas financeiras informadas − Caixa e
 *      Equivalentes de Caixa. Pode ser negativa (mais caixa que dívida).
 *
 * 5) Aplicabilidade dos métodos (RG-20/RG-21/RG-22/RG-24)
 *    - EBITDA-base ausente ou ≤ 0 => Múltiplos e DCF NÃO aplicáveis (não são
 *      sequer calculados — nenhum valor literal negativo/zero é produzido).
 *    - Patrimônio Líquido ausente ou ≤ 0 => Patrimonial não aplicável ao
 *      consolidado, mas o valor informado continua exposto separadamente.
 *    - Pesos NUNCA são renormalizados entre os métodos restantes.
 *    - O consolidado (valuationFinal, 50/30/20) só existe quando os 3
 *      métodos forem aplicáveis simultaneamente — caso contrário é `null`
 *      (RG-24), mesmo que 1 ou 2 métodos individuais estejam disponíveis.
 */

import { anosDreComDados, informadoExplicitamente, type AplicabilidadeMetodos, type DadosProcesso } from "./types";

export const MULTIPLO_EBITDA_PADRAO = 4;
export const HORIZONTE_PROJECAO_ANOS = 5;
export const TAXA_CRESCIMENTO_PROJECAO = 0.03;
export const TAXA_DESCONTO_PADRAO = 0.15;

export const PESO_VALUATION_EBITDA = 0.5;
export const PESO_VALUATION_DCF = 0.3;
export const PESO_VALUATION_PATRIMONIAL = 0.2;

export interface ResultadoCalculoValuation {
  /** Enterprise Value bruto por múltiplo de EBITDA, antes do ajuste de dívida líquida — só para explicabilidade (RG-52). `null` quando o método não é aplicável. */
  evMultiplos: number | null;
  /** Enterprise Value bruto pelo DCF simplificado, antes do ajuste de dívida líquida — só para explicabilidade. `null` quando o método não é aplicável. */
  evDcf: number | null;
  dividaFinanceiraTotal: number;
  caixaEquivalentes: number;
  /** DividaFinanceiraTotal − CaixaEquivalentes — pode ser negativa (RG-15). */
  dividaLiquida: number;
  /** Equity Value por Múltiplos (evMultiplos − dívida líquida). `null` quando não aplicável. */
  valuationEbitda: number | null;
  /** Equity Value pelo DCF simplificado (evDcf − dívida líquida). `null` quando não aplicável. */
  valuationDcf: number | null;
  /** Valor informado do Patrimônio Líquido (já é Equity Value, sem conversão) — visível mesmo quando `aplicabilidade.patrimonial` é `false` (RG-21). `null` só quando não foi informado. */
  valuationPatrimonial: number | null;
  /** Consolidado 50/30/20 — só existe quando os 3 métodos forem aplicáveis (RG-24). */
  valuationFinal: number | null;
  aplicabilidade: AplicabilidadeMetodos;
  anoBaseUtilizado: number | null;
  /** EBITDA do ano-base, informado ou não — pode ser ≤ 0 mesmo quando os métodos que dependem dele não são aplicáveis (serve para explicar o motivo na interface). `null` quando o EBITDA-base não foi informado. */
  ebitdaBaseUtilizado: number | null;
}

export function calcularValuation(dados: DadosProcesso): ResultadoCalculoValuation {
  const anosComDados = anosDreComDados(dados.financeiro.dre);
  const anoBase = anosComDados.at(-1) ?? null;
  const ebitdaBase =
    anoBase && informadoExplicitamente(anoBase.ebitda) ? anoBase.ebitda : null;

  const dividaFinanceiraTotal = dados.financeiro.dividas.reduce(
    (soma, divida) => soma + divida.valor,
    0,
  );
  const caixaEquivalentes = dados.financeiro.caixaEquivalentes ?? 0;
  const dividaLiquida = dividaFinanceiraTotal - caixaEquivalentes;

  // RG-20: EBITDA-base ausente ou ≤ 0 torna Múltiplos e DCF não aplicáveis —
  // nenhum dos dois é sequer calculado neste caso (não produzimos um valor
  // negativo/zero "literal" para depois esconder).
  const ebitdaAplicavel = ebitdaBase !== null && ebitdaBase > 0;

  const evMultiplos = ebitdaAplicavel ? ebitdaBase * MULTIPLO_EBITDA_PADRAO : null;
  const evDcf = ebitdaAplicavel ? calcularDcfSimplificado(ebitdaBase) : null;

  const valuationEbitda = evMultiplos !== null ? evMultiplos - dividaLiquida : null;
  const valuationDcf = evDcf !== null ? evDcf - dividaLiquida : null;

  const patrimonioLiquidoInformado = dados.financeiro.balanco.patrimonioLiquido;
  const valuationPatrimonial = informadoExplicitamente(patrimonioLiquidoInformado)
    ? patrimonioLiquidoInformado
    : null;
  // RG-21: Patrimônio Líquido ausente ou ≤ 0 torna o método não aplicável ao
  // consolidado — mas o valor informado permanece em valuationPatrimonial.
  const patrimonialAplicavel = valuationPatrimonial !== null && valuationPatrimonial > 0;

  const aplicabilidade: AplicabilidadeMetodos = {
    multiplos: ebitdaAplicavel,
    dcf: ebitdaAplicavel,
    patrimonial: patrimonialAplicavel,
    consolidadoDisponivel: ebitdaAplicavel && patrimonialAplicavel,
  };

  // RG-22/RG-24: sem renormalização — o consolidado só existe com os 3
  // métodos aplicáveis simultaneamente.
  const valuationFinal = aplicabilidade.consolidadoDisponivel
    ? valuationEbitda! * PESO_VALUATION_EBITDA +
      valuationDcf! * PESO_VALUATION_DCF +
      valuationPatrimonial! * PESO_VALUATION_PATRIMONIAL
    : null;

  return {
    evMultiplos,
    evDcf,
    dividaFinanceiraTotal,
    caixaEquivalentes,
    dividaLiquida,
    valuationEbitda,
    valuationDcf,
    valuationPatrimonial,
    valuationFinal,
    aplicabilidade,
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
