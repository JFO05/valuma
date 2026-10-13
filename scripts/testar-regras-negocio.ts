/**
 * Suíte de verificação das regras de negócio v1.0
 * (docs/REGRAS_NEGOCIO_VALUMA_V1.md) sobre o motor de valuation e o gate de
 * campos mínimos — funções puras, sem I/O, testadas com objetos
 * DadosProcesso fictícios. Mesmo padrão de scripts/testar-valuation.ts e
 * scripts/testar-prontidao.ts (sem framework de testes): script com
 * asserts simples, sai com código 1 se qualquer verificação falhar.
 *
 * Cobre a seção "Valuation"/"Aplicabilidade"/"Campos mínimos" da lista de
 * testes do prompt de implementação (itens 1–30). Ciclo de vida (resultado
 * desatualizado, versionamento, dashboard), documentos, IA e PDF dependem
 * de Supabase/rota Next e por isso não são pure-function-testáveis aqui —
 * ver docs/IMPLEMENTACAO_REGRAS_V1.md, seção Testes, para como cada um
 * desses foi verificado.
 *
 * Rodar com: npx tsx scripts/testar-regras-negocio.ts
 */
import type { DadosProcesso } from "../lib/valuation/types";
import {
  calcularValuation,
  MULTIPLO_EBITDA_PADRAO,
  PESO_VALUATION_EBITDA,
  PESO_VALUATION_DCF,
  PESO_VALUATION_PATRIMONIAL,
  HORIZONTE_PROJECAO_ANOS,
  TAXA_CRESCIMENTO_PROJECAO,
  TAXA_DESCONTO_PADRAO,
} from "../lib/valuation/calcular";
import { verificarCamposObrigatorios } from "../lib/valuation/campos-obrigatorios";
import { motorDefaultValues } from "../lib/intake/schema-motor";
import { perfilDefaultValues } from "../lib/intake/schema-perfil";
import { financeiroDefaultValues, criarDreAnoVazio, dividaVazia } from "../lib/intake/schema-financeiro";
import { operacaoDefaultValues } from "../lib/intake/schema-operacao";
import { mercadoDefaultValues } from "../lib/intake/schema-mercado";
import { documentosDefaultValues } from "../lib/intake/schema-documentos";
import { MODEL_VERSION, type ResultadoValuation } from "../lib/valuation/types";
import { ehResultadoLegado } from "../lib/valuation/resultados";

let falhas = 0;

function assert(condicao: boolean, mensagem: string) {
  if (condicao) {
    console.log(`OK   - ${mensagem}`);
  } else {
    console.error(`FALHOU - ${mensagem}`);
    falhas++;
  }
}

function assertIgual(atual: unknown, esperado: unknown, mensagem: string) {
  assert(atual === esperado, `${mensagem} (esperado ${esperado}, obtido ${atual})`);
}

function assertProximo(atual: number, esperado: number, mensagem: string, tolerancia = 0.01) {
  assert(
    Math.abs(atual - esperado) < tolerancia,
    `${mensagem} (esperado ≈${esperado.toFixed(2)}, obtido ${atual.toFixed(2)})`,
  );
}

/** Base neutra: só o Perfil e o ano-base do DRE variam por teste. */
function base(): DadosProcesso {
  return {
    processoId: "teste-regras-negocio",
    motor: { ...motorDefaultValues },
    perfil: { ...perfilDefaultValues, razaoSocial: "Empresa Teste Ltda.", setor: "Comércio" },
    financeiro: {
      ...financeiroDefaultValues,
      dre: [
        criarDreAnoVazio(2023),
        criarDreAnoVazio(2024),
        { ...criarDreAnoVazio(2025), receitaBruta: 1, ebitda: 200_000 },
      ],
      balanco: { ...financeiroDefaultValues.balanco, patrimonioLiquido: 1_000_000 },
      caixaEquivalentes: 0,
      possuiDividas: "nao",
      dividas: [],
    },
    operacao: { ...operacaoDefaultValues },
    mercado: { ...mercadoDefaultValues },
    documentos: { ...documentosDefaultValues },
  };
}

function calcularDcfManual(ebitdaBase: number): number {
  let valorPresente = 0;
  let fluxo = ebitdaBase;
  for (let ano = 1; ano <= HORIZONTE_PROJECAO_ANOS; ano++) {
    fluxo *= 1 + TAXA_CRESCIMENTO_PROJECAO;
    valorPresente += fluxo / Math.pow(1 + TAXA_DESCONTO_PADRAO, ano);
  }
  return valorPresente;
}

console.log("=== Valuation: EBITDA e PL positivos — os 3 métodos aplicáveis ===");
{
  const dados = base();
  const r = calcularValuation(dados);
  assertIgual(r.aplicabilidade.multiplos, true, "1. Múltiplos aplicável com EBITDA positivo");
  assertIgual(r.aplicabilidade.patrimonial, true, "1. Patrimonial aplicável com PL positivo");
  assertProximo(r.evMultiplos!, 200_000 * MULTIPLO_EBITDA_PADRAO, "2. EV por Múltiplos = EBITDA-base × 4");
  assertProximo(r.evDcf!, calcularDcfManual(200_000), "3. EV por DCF bate com o cálculo manual do horizonte de 5 anos");
  assertIgual(r.dividaFinanceiraTotal, 0, "4. Dívida financeira total = soma das dívidas (nenhuma cadastrada)");
  assertProximo(r.valuationPatrimonial!, 1_000_000, "10. Equity Patrimonial = Patrimônio Líquido informado, sem conversão");
  const esperadoFinal =
    r.valuationEbitda! * PESO_VALUATION_EBITDA +
    r.valuationDcf! * PESO_VALUATION_DCF +
    r.valuationPatrimonial! * PESO_VALUATION_PATRIMONIAL;
  assertProximo(r.valuationFinal!, esperadoFinal, "11. Consolidado = 50% Múltiplos + 30% DCF + 20% Patrimonial");
}

console.log("\n=== Dívida líquida e caixa ===");
{
  const dados = base();
  dados.financeiro.possuiDividas = "sim";
  dados.financeiro.dividas = [{ ...dividaVazia, credor: "Banco A", valor: 100_000 }, { ...dividaVazia, credor: "Banco B", valor: 50_000 }];
  dados.financeiro.caixaEquivalentes = 0;
  const semCaixa = calcularValuation(dados);
  assertIgual(semCaixa.dividaFinanceiraTotal, 150_000, "5. Dívida financeira total soma as duas dívidas");
  assertIgual(semCaixa.dividaLiquida, 150_000, "6. Caixa=0 informado => dívida líquida = dívida total");

  dados.financeiro.caixaEquivalentes = 200_000;
  const comCaixaMaior = calcularValuation(dados);
  assertIgual(comCaixaMaior.dividaLiquida, -50_000, "7/8. Caixa > dívida => dívida líquida negativa");
  assertProximo(
    comCaixaMaior.valuationEbitda!,
    comCaixaMaior.evMultiplos! - comCaixaMaior.dividaLiquida,
    "9. Equity Múltiplos = EV − Dívida Líquida (mesmo com dívida líquida negativa)",
  );
}

console.log("\n=== Aplicabilidade — casos-limite (RG-20/RG-21/RG-24) ===");
{
  function comEbitdaEPL(ebitda: number, patrimonioLiquido: number): DadosProcesso {
    const dados = base();
    dados.financeiro.dre[2] = { ...dados.financeiro.dre[2], ebitda };
    dados.financeiro.balanco.patrimonioLiquido = patrimonioLiquido;
    return dados;
  }

  const ebitdaZero = calcularValuation(comEbitdaEPL(0, 1_000_000));
  assertIgual(ebitdaZero.aplicabilidade.multiplos, false, "13. EBITDA = 0 => Múltiplos não aplicável");
  assertIgual(ebitdaZero.aplicabilidade.dcf, false, "13. EBITDA = 0 => DCF não aplicável");
  assertIgual(ebitdaZero.valuationEbitda, null, "13. Nenhum valor literal é produzido para Múltiplos quando EBITDA = 0");

  const ebitdaNegativo = calcularValuation(comEbitdaEPL(-50_000, 1_000_000));
  assertIgual(ebitdaNegativo.aplicabilidade.multiplos, false, "14. EBITDA < 0 => Múltiplos não aplicável");
  assertIgual(ebitdaNegativo.evDcf, null, "14. DCF não chega a ser calculado com EBITDA negativo (não projeta valor negativo)");

  const plZero = calcularValuation(comEbitdaEPL(200_000, 0));
  assertIgual(plZero.aplicabilidade.patrimonial, false, "15. PL = 0 => Patrimonial não aplicável ao consolidado");
  assertIgual(plZero.valuationPatrimonial, 0, "15. Mas o valor informado (0) continua visível, não é null");

  const plNegativo = calcularValuation(comEbitdaEPL(200_000, -300_000));
  assertIgual(plNegativo.aplicabilidade.patrimonial, false, "16. PL < 0 => Patrimonial não aplicável ao consolidado");
  assertIgual(plNegativo.valuationPatrimonial, -300_000, "16. Valor negativo informado continua visível");

  const ebitdaNegPlPositivo = calcularValuation(comEbitdaEPL(-10_000, 500_000));
  assertIgual(ebitdaNegPlPositivo.aplicabilidade.consolidadoDisponivel, false, "17. EBITDA<0 + PL>0 => sem consolidado");
  assertIgual(ebitdaNegPlPositivo.valuationPatrimonial, 500_000, "17. Patrimonial continua exposto individualmente (análise parcial)");

  const ebitdaPosPlNegativo = calcularValuation(comEbitdaEPL(200_000, -100_000));
  assertIgual(ebitdaPosPlNegativo.aplicabilidade.consolidadoDisponivel, false, "18. EBITDA>0 + PL<0 => sem consolidado");
  assertIgual(ebitdaPosPlNegativo.valuationEbitda !== null, true, "18. Múltiplos/DCF continuam expostos individualmente");

  const nenhumAplicavel = calcularValuation(comEbitdaEPL(-10_000, -100_000));
  assertIgual(nenhumAplicavel.aplicabilidade.multiplos, false, "19. EBITDA<0 + PL<0 => Múltiplos não aplicável");
  assertIgual(nenhumAplicavel.aplicabilidade.patrimonial, false, "19. EBITDA<0 + PL<0 => Patrimonial não aplicável");
  assertIgual(nenhumAplicavel.valuationFinal, null, "20. Nenhum método aplicável => consolidado null, nenhum valor artificial");

  // 12. Confirma que não há renormalização: com só 2 de 3 aplicáveis, o
  // consolidado é `null`, nunca uma média redistribuída entre os 2.
  assertIgual(
    ebitdaPosPlNegativo.valuationFinal,
    null,
    "12. Sem renormalização — 2 métodos aplicáveis não produzem consolidado (só com os 3)",
  );

  // 21/22. Análise parcial: métodos individualmente aplicáveis continuam
  // com valor, mesmo sem consolidado.
  assert(
    ebitdaPosPlNegativo.valuationEbitda !== null && ebitdaPosPlNegativo.valuationDcf !== null,
    "21/22. Métodos individuais disponíveis continuam calculados mesmo sem consolidado (análise parcial)",
  );
}

console.log("\n=== Campos mínimos (RG-40/RG-41) — zero informado passa, ausência bloqueia ===");
{
  function semPendencia(dados: DadosProcesso, campo: string) {
    return !verificarCamposObrigatorios(dados).some((p) => p.campo === campo);
  }

  const dados = base();

  dados.financeiro.dre[2] = { ...dados.financeiro.dre[2], ebitda: 0 };
  assert(semPendencia(dados, "financeiro.dre.0.ebitda"), "23. EBITDA = 0 informado explicitamente passa pelo gate");

  const semEbitda = base();
  semEbitda.financeiro.dre[2] = { ...semEbitda.financeiro.dre[2], ebitda: undefined, receitaBruta: 0 };
  // V2 (anos dinâmicos): sem nenhum ano-base identificável, a âncora da
  // pendência aponta pro fieldset do DRE como um todo ("financeiro.dre"),
  // não mais pra um índice fixo — não existe mais "o índice 0" garantido.
  assert(!semPendencia(semEbitda, "financeiro.dre"), "24. EBITDA ausente (nenhum ano com dados) falha no gate");

  const plZero = base();
  plZero.financeiro.balanco.patrimonioLiquido = 0;
  assert(semPendencia(plZero, "financeiro.balanco.patrimonioLiquido"), "25. Patrimônio Líquido = 0 informado passa pelo gate");

  const semPl = base();
  semPl.financeiro.balanco.patrimonioLiquido = undefined;
  assert(!semPendencia(semPl, "financeiro.balanco.patrimonioLiquido"), "26. Patrimônio Líquido ausente falha no gate");

  const dividaNao = base();
  dividaNao.financeiro.possuiDividas = "nao";
  assert(semPendencia(dividaNao, "financeiro.possuiDividas"), "27. Dívida declarada como 'Não' passa pelo gate");

  const dividaIndefinida = base();
  dividaIndefinida.financeiro.possuiDividas = undefined;
  assert(!semPendencia(dividaIndefinida, "financeiro.possuiDividas"), "28. Situação de dívida não respondida falha no gate");

  const caixaZero = base();
  caixaZero.financeiro.caixaEquivalentes = 0;
  assert(semPendencia(caixaZero, "financeiro.caixaEquivalentes"), "29. Caixa = 0 informado passa pelo gate");

  const semCaixa = base();
  semCaixa.financeiro.caixaEquivalentes = undefined;
  assert(!semPendencia(semCaixa, "financeiro.caixaEquivalentes"), "30. Caixa ausente falha no gate");
}

console.log("\n=== Versionamento do modelo (RG-47, DIV-02) — independente da IA ===");
{
  function resultadoFicticio(overrides: Partial<ResultadoValuation>): ResultadoValuation {
    return {
      valuationFinal: null,
      valuationEbitda: null,
      valuationDcf: null,
      valuationPatrimonial: null,
      modeloVersao: null,
      motorSnapshot: null,
      aplicabilidade: { multiplos: false, dcf: false, patrimonial: false, consolidadoDisponivel: false },
      scoreTotal: 0,
      scoreFinanceiro: 0,
      scoreOperacao: 0,
      scoreMercado: 0,
      scoreJuridico: 0,
      analiseIA: { pontosFortes: [], riscos: [], recomendacoes: [] },
      ...overrides,
    };
  }

  assertIgual(MODEL_VERSION, "valu_ma_v2", "modelo_versao. MODEL_VERSION é exatamente 'valu_ma_v2' (fechamento V2)");

  const atual = resultadoFicticio({ modeloVersao: MODEL_VERSION });
  assertIgual(ehResultadoLegado(atual), false, "modelo_versao = valu_ma_v2 (atual) não é legado");

  const semVersao = resultadoFicticio({ modeloVersao: null });
  assertIgual(ehResultadoLegado(semVersao), true, "resultado antigo sem versão (modeloVersao = null) é legado");

  const versaoAntiga = resultadoFicticio({ modeloVersao: "prontidao_v1" });
  assertIgual(ehResultadoLegado(versaoAntiga), true, "versão antiga (diferente da atual) é legada");

  // Fechamento V2: resultados v1 antigos (persistidos antes do Motor de
  // Análise existir) não são migrados — continuam com modeloVersao
  // "valu_ma_v1" no banco. Como isso agora é "diferente da versão atual",
  // passam a ser corretamente identificados como legado (RG-47 da v1.0) —
  // consequência esperada e documentada do avanço de versão, não um bug.
  const v1Historico = resultadoFicticio({ modeloVersao: "valu_ma_v1" });
  assertIgual(
    ehResultadoLegado(v1Historico),
    true,
    "resultado v1 histórico (modeloVersao = 'valu_ma_v1') é identificado como legado após o avanço para v2",
  );

  // DIV-02: falha/ausência da IA nunca pode afetar a identificação de
  // versão — ehResultadoLegado não lê `analiseIA` em nenhum momento, só
  // `modeloVersao`. Simula exatamente o shape que o fallback de IA produz
  // (erro: true, listas vazias) e confirma que isso não muda o resultado.
  const comFalhaDeIA = resultadoFicticio({
    modeloVersao: MODEL_VERSION,
    analiseIA: { pontosFortes: [], riscos: [], recomendacoes: [], erro: true },
  });
  assertIgual(
    ehResultadoLegado(comFalhaDeIA),
    false,
    "falha da IA (erro: true, análise vazia) não torna um resultado atual em legado",
  );
}

console.log(`\n=== Resultado: ${falhas === 0 ? "TODAS AS VERIFICAÇÕES PASSARAM" : `${falhas} VERIFICAÇÃO(ÕES) FALHOU/FALHARAM`} ===`);
if (falhas > 0) process.exit(1);
