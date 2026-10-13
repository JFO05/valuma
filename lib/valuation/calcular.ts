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

/**
 * Motor de Análise (V2 — prompt de evolução, seções 2/3/11): forma da
 * configuração que `calcularValuation` aceita. Vive aqui (não em
 * lib/valuation/motor.ts) para evitar import circular — motor.ts importa
 * estes tipos e `CONFIGURACAO_ESSENCIAL` daqui, nunca o contrário.
 */
export interface MetodosAtivos {
  multiplos: boolean;
  dcf: boolean;
  patrimonial: boolean;
}

/** Pesos e taxas são frações (0 a 1) — ex.: 0.5 = 50%, 0.03 = 3% a.a. A conversão para percentual acontece só na UI. */
export interface ConfiguracaoMotor {
  metodosAtivos: MetodosAtivos;
  pesos: { multiplos: number; dcf: number; patrimonial: number };
  multiploEbitda: number;
  crescimentoAnual: number;
  taxaDesconto: number;
  horizonteAnos: number;
}

/** Configuração do Motor Essencial — idêntica, número por número, ao que o motor v1 sempre calculou. */
export const CONFIGURACAO_ESSENCIAL: ConfiguracaoMotor = {
  metodosAtivos: { multiplos: true, dcf: true, patrimonial: true },
  pesos: {
    multiplos: PESO_VALUATION_EBITDA,
    dcf: PESO_VALUATION_DCF,
    patrimonial: PESO_VALUATION_PATRIMONIAL,
  },
  multiploEbitda: MULTIPLO_EBITDA_PADRAO,
  crescimentoAnual: TAXA_CRESCIMENTO_PROJECAO,
  taxaDesconto: TAXA_DESCONTO_PADRAO,
  horizonteAnos: HORIZONTE_PROJECAO_ANOS,
};

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

/**
 * V2 (Motor de Análise — prompt de evolução, seções 2/3/11): aceita uma
 * configuração opcional de motor; sem ela, usa CONFIGURACAO_ESSENCIAL (os
 * mesmos números fixos do v1 — 4,0x, 50/30/20, 3%/15%/5 anos). Importante:
 * tornar os parâmetros configuráveis NÃO elimina as condições de
 * aplicabilidade dos métodos (EBITDA > 0 para Múltiplos/DCF, Patrimônio
 * Líquido > 0 para Patrimonial) — um método desativado no Motor Configurável
 * simplesmente não entra no consolidado; um método ativado mas inaplicável
 * ao cenário também não entra (nunca é "forçado"), e isso é reportado à
 * interface como um estado legítimo do domínio, não um erro técnico.
 */
export function calcularValuation(
  dados: DadosProcesso,
  config: ConfiguracaoMotor = CONFIGURACAO_ESSENCIAL,
): ResultadoCalculoValuation {
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
  // negativo/zero "literal" para depois esconder). Independente de o método
  // estar ativado no Motor Configurável ou não.
  const ebitdaAplicavel = ebitdaBase !== null && ebitdaBase > 0;
  const { multiplos: multiplosAtivo, dcf: dcfAtivo, patrimonial: patrimonialAtivo } =
    config.metodosAtivos;

  const evMultiplos =
    multiplosAtivo && ebitdaAplicavel ? ebitdaBase! * config.multiploEbitda : null;
  const evDcf =
    dcfAtivo && ebitdaAplicavel
      ? calcularDcfSimplificado(
          ebitdaBase!,
          config.crescimentoAnual,
          config.taxaDesconto,
          config.horizonteAnos,
        )
      : null;

  const valuationEbitda = evMultiplos !== null ? evMultiplos - dividaLiquida : null;
  const valuationDcf = evDcf !== null ? evDcf - dividaLiquida : null;

  const patrimonioLiquidoInformado = dados.financeiro.balanco.patrimonioLiquido;
  const valuationPatrimonial = informadoExplicitamente(patrimonioLiquidoInformado)
    ? patrimonioLiquidoInformado
    : null;
  // RG-21: Patrimônio Líquido ausente ou ≤ 0 torna o método não aplicável ao
  // consolidado — mas o valor informado permanece em valuationPatrimonial.
  const patrimonialAplicavelBase = valuationPatrimonial !== null && valuationPatrimonial > 0;

  const aplicabilidade: AplicabilidadeMetodos = {
    multiplos: multiplosAtivo && ebitdaAplicavel,
    dcf: dcfAtivo && ebitdaAplicavel,
    patrimonial: patrimonialAtivo && patrimonialAplicavelBase,
    // Consolidado existe quando TODO método ATIVADO é aplicável (um método
    // nunca ativado simplesmente não entra na conta) e pelo menos 1 método
    // está ativado — equivalente exato da regra v1 quando os 3 estão
    // sempre ativos (Motor Essencial).
    consolidadoDisponivel:
      (!multiplosAtivo || ebitdaAplicavel) &&
      (!dcfAtivo || ebitdaAplicavel) &&
      (!patrimonialAtivo || patrimonialAplicavelBase) &&
      (multiplosAtivo || dcfAtivo || patrimonialAtivo),
  };

  // RG-22/RG-24: sem renormalização — o consolidado soma só os métodos
  // ativados, cada um com o peso configurado (que para o Motor Configurável
  // já foi validado para somar 100% entre os ativos antes da geração).
  const valuationFinal = aplicabilidade.consolidadoDisponivel
    ? (multiplosAtivo ? valuationEbitda! * config.pesos.multiplos : 0) +
      (dcfAtivo ? valuationDcf! * config.pesos.dcf : 0) +
      (patrimonialAtivo ? valuationPatrimonial! * config.pesos.patrimonial : 0)
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

function calcularDcfSimplificado(
  ebitdaBase: number,
  crescimentoAnual: number,
  taxaDesconto: number,
  horizonteAnos: number,
): number {
  let valorPresente = 0;
  let fluxo = ebitdaBase;

  for (let ano = 1; ano <= horizonteAnos; ano++) {
    fluxo *= 1 + crescimentoAnual;
    valorPresente += fluxo / Math.pow(1 + taxaDesconto, ano);
  }

  return valorPresente;
}
