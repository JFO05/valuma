/**
 * Testes do Motor de Análise (V2 — prompt de evolução, seção 15 "TESTES
 * OBRIGATÓRIOS"). Função pura: só chama calcularValuation/configuracaoMotorValida
 * com dados fabricados em memória, sem banco nem navegador — não é E2E.
 */
import type { DadosProcesso } from "../lib/valuation/types";
import { calcularValuation, CONFIGURACAO_ESSENCIAL, type ConfiguracaoMotor } from "../lib/valuation/calcular";
import { configuracaoMotorValida } from "../lib/valuation/motor";
import { motorDefaultValues } from "../lib/intake/schema-motor";
import { perfilDefaultValues } from "../lib/intake/schema-perfil";
import { financeiroDefaultValues, criarDreAnoVazio } from "../lib/intake/schema-financeiro";
import { operacaoDefaultValues } from "../lib/intake/schema-operacao";
import { mercadoDefaultValues } from "../lib/intake/schema-mercado";
import { documentosDefaultValues } from "../lib/intake/schema-documentos";

let falhas = 0;

function assert(condicao: boolean, mensagem: string) {
  if (condicao) {
    console.log(`OK   - ${mensagem}`);
  } else {
    console.error(`FALHOU - ${mensagem}`);
    falhas++;
  }
}

function assertProximo(atual: number, esperado: number, mensagem: string, tolerancia = 0.01) {
  assert(
    Math.abs(atual - esperado) < tolerancia,
    `${mensagem} (esperado ≈${esperado.toFixed(2)}, obtido ${atual.toFixed(2)})`,
  );
}

function processo(ebitda: number | undefined, patrimonioLiquido: number | undefined): DadosProcesso {
  return {
    processoId: "teste-motor",
    motor: { ...motorDefaultValues },
    perfil: { ...perfilDefaultValues, razaoSocial: "Empresa Teste", setor: "Comércio" },
    financeiro: {
      ...financeiroDefaultValues,
      dre: [
        { ...criarDreAnoVazio(2025), receitaBruta: 1_000_000, ebitda },
        { ...criarDreAnoVazio(2024) },
        { ...criarDreAnoVazio(2023) },
      ],
      balanco: { ...financeiroDefaultValues.balanco, patrimonioLiquido },
      caixaEquivalentes: 0,
      possuiDividas: "nao",
    },
    operacao: { ...operacaoDefaultValues },
    mercado: { ...mercadoDefaultValues },
    documentos: { ...documentosDefaultValues },
  };
}

console.log("=== MOTOR ESSENCIAL ===\n");

console.log("--- EBITDA > 0 + PL > 0: três métodos disponíveis, consolidado 50/30/20 ---");
{
  const r = calcularValuation(processo(200_000, 1_000_000));
  assert(r.aplicabilidade.multiplos && r.aplicabilidade.dcf && r.aplicabilidade.patrimonial, "três métodos aplicáveis");
  assert(r.aplicabilidade.consolidadoDisponivel && r.valuationFinal !== null, "consolidado disponível");
}

console.log("\n--- EBITDA <= 0 + PL > 0: Múltiplos/DCF indisponíveis, Patrimonial disponível, sem consolidado ---");
{
  const r = calcularValuation(processo(-50_000, 1_000_000));
  assert(!r.aplicabilidade.multiplos, "Múltiplos indisponível");
  assert(!r.aplicabilidade.dcf, "DCF indisponível");
  assert(r.aplicabilidade.patrimonial, "Patrimonial disponível");
  assert(!r.aplicabilidade.consolidadoDisponivel && r.valuationFinal === null, "sem consolidado essencial");
  assert(r.valuationPatrimonial === 1_000_000, "Patrimonial continua exposto individualmente");
}

console.log("\n--- EBITDA <= 0 + PL <= 0: nenhum método disponível, sem valuation, Prontidão não é afetada por este teste ---");
{
  const r = calcularValuation(processo(-50_000, -10_000));
  assert(!r.aplicabilidade.multiplos && !r.aplicabilidade.dcf && !r.aplicabilidade.patrimonial, "nenhum método disponível");
  assert(r.valuationFinal === null, "sem valuation");
}

console.log("\n=== MOTOR CONFIGURÁVEL ===\n");

function configCom(overrides: Partial<ConfiguracaoMotor>): ConfiguracaoMotor {
  return {
    metodosAtivos: { ...CONFIGURACAO_ESSENCIAL.metodosAtivos },
    pesos: { ...CONFIGURACAO_ESSENCIAL.pesos },
    multiploEbitda: CONFIGURACAO_ESSENCIAL.multiploEbitda,
    crescimentoAnual: CONFIGURACAO_ESSENCIAL.crescimentoAnual,
    taxaDesconto: CONFIGURACAO_ESSENCIAL.taxaDesconto,
    horizonteAnos: CONFIGURACAO_ESSENCIAL.horizonteAnos,
    ...overrides,
  };
}

console.log("--- Múltiplos 60% + DCF 40%, Patrimonial desativado ---");
{
  const config = configCom({
    metodosAtivos: { multiplos: true, dcf: true, patrimonial: false },
    pesos: { multiplos: 0.6, dcf: 0.4, patrimonial: 0 },
  });
  assert(configuracaoMotorValida("configuravel", config), "soma dos pesos ativos = 100%");
  const r = calcularValuation(processo(200_000, 1_000_000), config);
  assert(r.aplicabilidade.consolidadoDisponivel, "consolidado disponível mesmo sem Patrimonial (ele está desativado, não indisponível)");
  assertProximo(r.valuationFinal!, r.valuationEbitda! * 0.6 + r.valuationDcf! * 0.4, "consolidado = 60% Múltiplos + 40% DCF, Patrimonial fora da conta");
}

console.log("\n--- Patrimonial 100% (único método ativo) ---");
{
  const config = configCom({
    metodosAtivos: { multiplos: false, dcf: false, patrimonial: true },
    pesos: { multiplos: 0, dcf: 0, patrimonial: 1 },
  });
  assert(configuracaoMotorValida("configuravel", config), "100% num único método ativo é válido");
  const r = calcularValuation(processo(-999, 1_000_000), config); // EBITDA negativo é irrelevante: Múltiplos/DCF nem estão ativos
  assert(r.aplicabilidade.consolidadoDisponivel, "consolidado disponível só com Patrimonial");
  assertProximo(r.valuationFinal!, 1_000_000, "consolidado = 100% do valor patrimonial");
}

console.log("\n--- Pesos somando menos de 100% => configuração inválida ---");
{
  const config = configCom({ pesos: { multiplos: 0.5, dcf: 0.3, patrimonial: 0 }, metodosAtivos: { multiplos: true, dcf: true, patrimonial: false } });
  assert(!configuracaoMotorValida("configuravel", config), "80% não é válido");
}

console.log("\n--- Pesos somando mais de 100% => configuração inválida ---");
{
  const config = configCom({ pesos: { multiplos: 0.7, dcf: 0.5, patrimonial: 0 }, metodosAtivos: { multiplos: true, dcf: true, patrimonial: false } });
  assert(!configuracaoMotorValida("configuravel", config), "120% não é válido");
}

console.log("\n--- Nenhum método ativo => configuração inválida ---");
{
  const config = configCom({ metodosAtivos: { multiplos: false, dcf: false, patrimonial: false } });
  assert(!configuracaoMotorValida("configuravel", config), "0 métodos ativos não é válido");
}

console.log("\n--- Método desativado não participa do consolidado, mesmo que seus dados sejam válidos ---");
{
  const config = configCom({
    metodosAtivos: { multiplos: true, dcf: false, patrimonial: true },
    pesos: { multiplos: 0.5, dcf: 0, patrimonial: 0.5 },
  });
  const r = calcularValuation(processo(200_000, 1_000_000), config);
  assert(r.evDcf === null && r.valuationDcf === null, "DCF nem é calculado quando desativado");
  assertProximo(r.valuationFinal!, r.valuationEbitda! * 0.5 + 1_000_000 * 0.5, "consolidado ignora DCF completamente");
}

console.log("\n--- EBITDA negativo com Múltiplos selecionado: continua indisponível (configurar não remove a regra de aplicabilidade) ---");
{
  const config = configCom({ metodosAtivos: { multiplos: true, dcf: false, patrimonial: false }, pesos: { multiplos: 1, dcf: 0, patrimonial: 0 } });
  const r = calcularValuation(processo(-100_000, 1_000_000), config);
  assert(!r.aplicabilidade.multiplos, "Múltiplos continua indisponível com EBITDA negativo, mesmo ativado e com múltiplo configurável");
  assert(!r.aplicabilidade.consolidadoDisponivel && r.valuationFinal === null, "sem consolidado — o único método ativo está indisponível");
}

console.log("\n--- EBITDA negativo com DCF selecionado: continua indisponível ---");
{
  const config = configCom({ metodosAtivos: { multiplos: false, dcf: true, patrimonial: false }, pesos: { multiplos: 0, dcf: 1, patrimonial: 0 } });
  const r = calcularValuation(processo(-100_000, 1_000_000), config);
  assert(!r.aplicabilidade.dcf, "DCF continua indisponível com EBITDA negativo");
}

console.log("\n--- Múltiplo de EBITDA configurável muda o Enterprise Value, mas não a regra de aplicabilidade ---");
{
  const config = configCom({ multiploEbitda: 6 });
  const r = calcularValuation(processo(200_000, 1_000_000), config);
  assertProximo(r.evMultiplos!, 200_000 * 6, "EV = EBITDA × múltiplo configurado (6x)");
}

console.log(`\n=== Resultado: ${falhas === 0 ? "TODAS AS VERIFICAÇÕES PASSARAM" : `${falhas} VERIFICAÇÃO(ÕES) FALHOU/FALHARAM`} ===`);
process.exit(falhas === 0 ? 0 : 1);
