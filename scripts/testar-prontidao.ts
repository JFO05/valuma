/**
 * Verificação das funções puras do Índice de Prontidão (Fase 2 do plano de
 * evolução) — checklist.ts e calcularProntidao. Mesmo padrão de
 * scripts/testar-valuation.ts: sem framework de testes (D6 ainda em aberto,
 * ver docs/PLANO_EVOLUCAO_MVP.md), então isto é um script com asserts
 * simples, que sai com código 1 se qualquer verificação falhar.
 *
 * Rodar com: npx tsx scripts/testar-prontidao.ts
 */
import type { DadosProcesso } from "../lib/valuation/types";
import {
  CHECKLIST_PRONTIDAO,
  calcularProntidao,
  type DimensaoProntidao,
} from "../lib/prontidao/checklist";
import { perfilDefaultValues } from "../lib/intake/schema-perfil";
import {
  financeiroDefaultValues,
  criarDreAnoVazio,
  dividaVazia,
} from "../lib/intake/schema-financeiro";
import {
  operacaoDefaultValues,
  cargoEquipeVazio,
  clientePrincipalVazio,
  fornecedorVazio,
} from "../lib/intake/schema-operacao";
import { mercadoDefaultValues, concorrenteVazio } from "../lib/intake/schema-mercado";
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

function assertIgual(atual: unknown, esperado: unknown, mensagem: string) {
  assert(atual === esperado, `${mensagem} (esperado ${esperado}, obtido ${atual})`);
}

function processoVazio(): DadosProcesso {
  return {
    processoId: "teste-vazio",
    perfil: { ...perfilDefaultValues },
    financeiro: { ...financeiroDefaultValues, dre: financeiroDefaultValues.dre.map((a) => ({ ...a })) },
    operacao: { ...operacaoDefaultValues },
    mercado: { ...mercadoDefaultValues },
    documentos: { ...documentosDefaultValues },
  };
}

function processoCompleto(): DadosProcesso {
  return {
    processoId: "teste-completo",
    perfil: { ...perfilDefaultValues, razaoSocial: "Empresa Teste Ltda.", setor: "Comércio" },
    financeiro: {
      dre: [2025, 2024, 2023].map((ano) => ({
        ...criarDreAnoVazio(ano),
        receitaBruta: 1_000_000,
        deducoes: 100_000,
        receitaLiquida: 900_000,
        custos: 500_000,
        lucroBruto: 400_000,
        despesasOperacionais: 200_000,
        ebitda: 200_000,
        lucroLiquido: 150_000,
      })),
      balanco: {
        ativoTotal: 2_000_000,
        ativoCirculante: 800_000,
        passivoTotal: 900_000,
        passivoCirculante: 300_000,
        patrimonioLiquido: 1_100_000,
      },
      dividas: [{ ...dividaVazia, credor: "Banco Teste", valor: 100_000, vencimento: "2027-01-01" }],
    },
    operacao: {
      numeroFuncionariosTotal: 10,
      cargosEquipe: [{ ...cargoEquipeVazio, cargo: "Vendas", quantidade: 5 }],
      numeroClientesAtivos: 50,
      concentracaoTop3Clientes: 30,
      clientesPrincipais: [{ ...clientePrincipalVazio, nome: "Cliente A", percentualReceita: 10 }],
      fornecedoresPrincipais: [{ ...fornecedorVazio, nome: "Fornecedor A", tipoInsumo: "Insumo" }],
      processosOperacionais: "Descrição dos processos.",
    },
    mercado: {
      concorrentes: [{ ...concorrenteVazio, nome: "Concorrente A" }],
      posicionamento: "Posicionamento descrito.",
      tamMercado: 10_000_000,
      sinergiasPotenciais: "Sinergias descritas.",
    },
    documentos: {
      arquivos: Array.from({ length: 5 }, (_, i) => ({
        nome: `doc${i + 1}.pdf`,
        path: `teste/doc${i + 1}.pdf`,
        tamanho: 1000,
        tipo: "application/pdf",
        enviadoEm: new Date().toISOString(),
      })),
    },
  };
}

console.log("=== 1) Configuração: nenhuma dimensão pode ter zero itens esperados ===");
const dimensoes: DimensaoProntidao[] = ["financeiro", "operacional", "mercado", "documental"];
for (const dimensao of dimensoes) {
  const quantidade = CHECKLIST_PRONTIDAO.filter((i) => i.dimensao === dimensao).length;
  assert(quantidade > 0, `dimensão "${dimensao}" tem ${quantidade} item(ns) esperado(s) (> 0)`);
}
assertIgual(CHECKLIST_PRONTIDAO.length > 0, true, "checklist tem pelo menos 1 item no total");

console.log("\n=== 2) Intake vazio => 0 em tudo ===");
const resultadoVazio = calcularProntidao(processoVazio());
assertIgual(resultadoVazio.dimensoes.financeiro.nota, 0, "financeiro = 0");
assertIgual(resultadoVazio.dimensoes.operacional.nota, 0, "operacional = 0");
assertIgual(resultadoVazio.dimensoes.mercado.nota, 0, "mercado = 0");
assertIgual(resultadoVazio.dimensoes.documental.nota, 0, "documental = 0");
assertIgual(resultadoVazio.indiceGeral, 0, "índice geral = 0");
assertIgual(
  resultadoVazio.dimensoes.financeiro.pendencias.length,
  resultadoVazio.dimensoes.financeiro.esperados,
  "todas as pendências do financeiro aparecem quando vazio",
);

console.log("\n=== 3) Intake completo => 100 em tudo ===");
const resultadoCompleto = calcularProntidao(processoCompleto());
assertIgual(resultadoCompleto.dimensoes.financeiro.nota, 100, "financeiro = 100");
assertIgual(resultadoCompleto.dimensoes.operacional.nota, 100, "operacional = 100");
assertIgual(resultadoCompleto.dimensoes.mercado.nota, 100, "mercado = 100");
assertIgual(resultadoCompleto.dimensoes.documental.nota, 100, "documental = 100");
assertIgual(resultadoCompleto.indiceGeral, 100, "índice geral = 100");
assertIgual(resultadoCompleto.dimensoes.financeiro.pendencias.length, 0, "sem pendências no financeiro");

console.log("\n=== 4) Caso conhecido, calculado manualmente neste teste ===");
// Parte do processo completo (dimensão Mercado = 4/4 = 100%), remove 1 dos 4
// itens (TAM) e confere a conta na mão: 3 válidos de 4 esperados = 75%.
const parcial = processoCompleto();
parcial.mercado = { ...parcial.mercado, tamMercado: undefined };
const resultadoParcial = calcularProntidao(parcial);
const notaMercadoEsperada = Math.round((3 / 4) * 100); // 75
assertIgual(resultadoParcial.dimensoes.mercado.nota, notaMercadoEsperada, "Mercado com TAM removido = 75 (3 de 4 itens)");
assertIgual(resultadoParcial.dimensoes.mercado.esperados, 4, "Mercado continua com 4 itens esperados");
assertIgual(resultadoParcial.dimensoes.mercado.validos, 3, "Mercado com 3 itens válidos");

console.log("\n=== 5) Remover um campo => nota cai e pendência aparece; devolver => pendência some ===");
const antesRemover = calcularProntidao(processoCompleto());
assertIgual(
  antesRemover.dimensoes.mercado.pendencias.some((p) => p.id === "mercado.tamMercado"),
  false,
  "TAM não é pendência quando preenchido",
);

const comCampoRemovido = processoCompleto();
comCampoRemovido.mercado = { ...comCampoRemovido.mercado, tamMercado: undefined };
const depoisRemover = calcularProntidao(comCampoRemovido);
assert(
  depoisRemover.dimensoes.mercado.nota < antesRemover.dimensoes.mercado.nota,
  `nota do Mercado caiu ao remover o TAM (${antesRemover.dimensoes.mercado.nota} -> ${depoisRemover.dimensoes.mercado.nota})`,
);
assertIgual(
  depoisRemover.dimensoes.mercado.pendencias.some((p) => p.id === "mercado.tamMercado"),
  true,
  "TAM aparece como pendência quando removido",
);

const comCampoDevolvido = processoCompleto(); // TAM de volta ao valor original
const depoisDevolver = calcularProntidao(comCampoDevolvido);
assertIgual(
  depoisDevolver.dimensoes.mercado.pendencias.some((p) => p.id === "mercado.tamMercado"),
  false,
  "TAM sai das pendências ao ser preenchido de novo",
);
assertIgual(
  depoisDevolver.dimensoes.mercado.nota,
  antesRemover.dimensoes.mercado.nota,
  "nota do Mercado volta ao valor original",
);

console.log(`\n=== Resultado: ${falhas === 0 ? "TODAS AS VERIFICAÇÕES PASSARAM" : `${falhas} VERIFICAÇÃO(ÕES) FALHOU/FALHARAM`} ===`);
if (falhas > 0) process.exit(1);
