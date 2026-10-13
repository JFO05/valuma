/**
 * Verificação das funções puras do Índice de Prontidão Informacional
 * (Regra de Negócio v1.0, RG-26 a RG-36) — checklist.ts e calcularProntidao.
 * Sem framework de testes (mesmo padrão de scripts/testar-valuation.ts):
 * script com asserts simples, sai com código 1 se qualquer verificação
 * falhar.
 *
 * Rodar com: npx tsx scripts/testar-prontidao.ts
 */
import type { DadosProcesso } from "../lib/valuation/types";
import {
  CHECKLIST_PRONTIDAO,
  calcularProntidao,
  type DimensaoProntidao,
} from "../lib/prontidao/checklist";
import { motorDefaultValues } from "../lib/intake/schema-motor";
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
import { documentosDefaultValues, CATEGORIAS_DOCUMENTO } from "../lib/intake/schema-documentos";

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
    motor: { ...motorDefaultValues },
    perfil: { ...perfilDefaultValues },
    financeiro: {
      ...financeiroDefaultValues,
      dre: financeiroDefaultValues.dre.map((a) => ({ ...a })),
      balanco: { ...financeiroDefaultValues.balanco },
    },
    operacao: { ...operacaoDefaultValues },
    mercado: { ...mercadoDefaultValues },
    documentos: { ...documentosDefaultValues },
  };
}

function processoCompleto(): DadosProcesso {
  return {
    processoId: "teste-completo",
    motor: { ...motorDefaultValues },
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
      caixaEquivalentes: 300_000,
      possuiDividas: "sim",
      dividas: [{ ...dividaVazia, credor: "Banco Teste", valor: 100_000, vencimento: "2027-01-01" }],
    },
    operacao: {
      numeroFuncionariosTotal: 10,
      cargosEquipe: [{ ...cargoEquipeVazio, cargo: "Vendas", quantidade: 5 }],
      numeroClientesAtivos: 50,
      concentracaoTop3Clientes: 30,
      clientesPrincipais: [{ ...clientePrincipalVazio, nome: "Cliente A", percentualReceita: 10 }],
      fornecedoresPrincipais: [{ ...fornecedorVazio, nome: "Fornecedor A", tipoInsumo: "Insumo" }],
      processosOperacionais: "Descrição real dos processos operacionais da empresa.",
    },
    mercado: {
      concorrentes: [{ ...concorrenteVazio, nome: "Concorrente A" }],
      posicionamento: "Posicionamento descrito com detalhe suficiente.",
      tamMercado: 10_000_000,
      sinergiasPotenciais: "Sinergias descritas com detalhe suficiente.",
    },
    documentos: {
      // Uma categoria por documento (RG-35/RG-36) — 6 categorias = 100%.
      arquivos: CATEGORIAS_DOCUMENTO.map((categoria, i) => ({
        nome: `doc-${categoria}.pdf`,
        path: `teste/doc-${categoria}.pdf`,
        tamanho: 1000 + i,
        tipo: "application/pdf",
        enviadoEm: new Date().toISOString(),
        categoria,
        periodoReferencia: "2025",
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
assertIgual(
  CHECKLIST_PRONTIDAO.filter((i) => i.dimensao === "documental").length,
  6,
  "dimensão documental tem exatamente 6 itens (uma por categoria fixa — RG-35)",
);
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
for (const pendencia of resultadoVazio.dimensoes.financeiro.pendencias) {
  assertIgual(pendencia.estado, "ausente", `pendência "${pendencia.id}" do vazio é AUSENTE, não INVÁLIDO`);
}

console.log("\n=== 3) Intake completo => 100 em tudo ===");
const resultadoCompleto = calcularProntidao(processoCompleto());
assertIgual(resultadoCompleto.dimensoes.financeiro.nota, 100, "financeiro = 100");
assertIgual(resultadoCompleto.dimensoes.operacional.nota, 100, "operacional = 100");
assertIgual(resultadoCompleto.dimensoes.mercado.nota, 100, "mercado = 100");
assertIgual(resultadoCompleto.dimensoes.documental.nota, 100, "documental = 100 (6 de 6 categorias)");
assertIgual(resultadoCompleto.indiceGeral, 100, "índice geral = 100");
assertIgual(resultadoCompleto.dimensoes.financeiro.pendencias.length, 0, "sem pendências no financeiro");

console.log("\n=== 4) Zero explicitamente informado conta como preenchido (RG-33) ===");
const comZeros = processoCompleto();
comZeros.financeiro.dre = comZeros.financeiro.dre.map((ano) => ({ ...ano, ebitda: 0 }));
comZeros.financeiro.balanco = { ...comZeros.financeiro.balanco, patrimonioLiquido: 0 };
comZeros.financeiro.caixaEquivalentes = 0;
const resultadoComZeros = calcularProntidao(comZeros);
assertIgual(
  resultadoComZeros.dimensoes.financeiro.nota,
  100,
  "EBITDA=0, patrimônio=0 e caixa=0 informados explicitamente continuam válidos para a Prontidão",
);

console.log("\n=== 5) undefined (não tocado) NÃO conta — vira pendência AUSENTE ===");
const semEbitda = processoCompleto();
semEbitda.financeiro.dre[0] = { ...semEbitda.financeiro.dre[0], ebitda: undefined };
const resultadoSemEbitda = calcularProntidao(semEbitda);
assert(
  resultadoSemEbitda.dimensoes.financeiro.pendencias.some((p) => p.id === "financeiro.dre.slot0.ebitda"),
  "EBITDA do ano mais recente não informado aparece como pendência",
);

console.log("\n=== 6) Situação de dívida: 'Sim' com lista vazia => VÁLIDO_COM_ALERTA ===");
const dividaInconsistente = processoCompleto();
dividaInconsistente.financeiro.possuiDividas = "sim";
dividaInconsistente.financeiro.dividas = [];
const resultadoDividaInconsistente = calcularProntidao(dividaInconsistente);
assertIgual(
  resultadoDividaInconsistente.dimensoes.financeiro.alertas.some((a) => a.id === "financeiro.dividas"),
  true,
  "declarar 'possui dívidas' com lista vazia gera alerta",
);
assertIgual(
  resultadoDividaInconsistente.dimensoes.financeiro.pendencias.some((p) => p.id === "financeiro.dividas"),
  false,
  "mas ainda conta como válido para a nota (alerta, não pendência)",
);

console.log("\n=== 7) Situação de dívida: 'Não' com lista vazia é normal (sem alerta) ===");
const semDividas = processoCompleto();
semDividas.financeiro.possuiDividas = "nao";
semDividas.financeiro.dividas = [];
const resultadoSemDividas = calcularProntidao(semDividas);
assertIgual(
  resultadoSemDividas.dimensoes.financeiro.alertas.length,
  0,
  "'Não possui dívidas' com lista vazia não gera nenhum alerta",
);

console.log("\n=== 8) Documentos: categoria repetida continua contando só 1 (RG-36) ===");
const comDuplicatas = processoCompleto();
comDuplicatas.documentos.arquivos = [
  ...comDuplicatas.documentos.arquivos,
  ...Array.from({ length: 10 }, (_, i) => ({
    nome: `dre-duplicado-${i}.pdf`,
    path: `teste/dre-duplicado-${i}.pdf`,
    tamanho: 1000,
    tipo: "application/pdf",
    enviadoEm: new Date().toISOString(),
    categoria: "dre" as const,
  })),
];
const resultadoComDuplicatas = calcularProntidao(comDuplicatas);
assertIgual(
  resultadoComDuplicatas.dimensoes.documental.nota,
  100,
  "10 arquivos extras na mesma categoria não inflam a nota documental além de 100",
);

console.log("\n=== 9) Documento sem categoria não conta ===");
const semCategoria = processoCompleto();
semCategoria.documentos.arquivos = semCategoria.documentos.arquivos.map((a, i) =>
  i === 0 ? { ...a, categoria: undefined } : a,
);
const resultadoSemCategoria = calcularProntidao(semCategoria);
assertIgual(
  resultadoSemCategoria.dimensoes.documental.nota,
  (5 / 6) * 100,
  "remover a categoria de 1 documento derruba a nota documental para 5/6",
);

console.log("\n=== 10) Caso conhecido, calculado manualmente (dimensão Mercado) ===");
const parcial = processoCompleto();
parcial.mercado = { ...parcial.mercado, tamMercado: undefined };
const resultadoParcial = calcularProntidao(parcial);
const notaMercadoEsperada = (3 / 4) * 100; // 75, precisão completa (RG-51)
assertIgual(resultadoParcial.dimensoes.mercado.nota, notaMercadoEsperada, "Mercado com TAM removido = 75 (3 de 4 itens)");
assertIgual(resultadoParcial.dimensoes.mercado.esperados, 4, "Mercado continua com 4 itens esperados");
assertIgual(resultadoParcial.dimensoes.mercado.validos, 3, "Mercado com 3 itens válidos");

console.log("\n=== 11) Remover um campo => nota cai e pendência aparece; devolver => pendência some ===");
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

const comCampoDevolvido = processoCompleto();
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

console.log("\n=== 12) Textos triviais são INVÁLIDOS, não contam como preenchidos ===");
const textoTrivial = processoCompleto();
textoTrivial.mercado.posicionamento = "----";
const resultadoTextoTrivial = calcularProntidao(textoTrivial);
const pendenciaPosicionamento = resultadoTextoTrivial.dimensoes.mercado.pendencias.find(
  (p) => p.id === "mercado.posicionamento",
);
assert(pendenciaPosicionamento !== undefined, "texto '----' em posicionamento vira pendência");
assertIgual(pendenciaPosicionamento?.estado, "invalido", "a pendência é do tipo INVÁLIDO (texto presente, mas trivial), não AUSENTE");

console.log("\n=== 13) Percentual fora do domínio 0–100 é INVÁLIDO ===");
const percentualForaDoDominio = processoCompleto();
percentualForaDoDominio.operacao.concentracaoTop3Clientes = 250;
const resultadoPercentualInvalido = calcularProntidao(percentualForaDoDominio);
const pendenciaConcentracao = resultadoPercentualInvalido.dimensoes.operacional.pendencias.find(
  (p) => p.id === "operacao.concentracaoTop3Clientes",
);
assertIgual(pendenciaConcentracao?.estado, "invalido", "concentração de 250% é INVÁLIDA (fora do domínio 0–100)");

console.log(`\n=== Resultado: ${falhas === 0 ? "TODAS AS VERIFICAÇÕES PASSARAM" : `${falhas} VERIFICAÇÃO(ÕES) FALHOU/FALHARAM`} ===`);
if (falhas > 0) process.exit(1);
