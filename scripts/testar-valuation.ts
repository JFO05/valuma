/**
 * Testa calcularValuation isoladamente, com um objeto DadosProcesso
 * fictício — sem precisar de tela nem de banco.
 *
 * NÃO testa consolidarDadosProcesso: essa função só roda dentro de uma
 * request do Next (usa lib/supabase/server.ts, que depende de
 * next/headers), então não dá pra chamá-la de um script solto rodado com
 * tsx. calcularValuation, por outro lado, é pura — só recebe o objeto
 * DadosProcesso e devolve números — por isso dá pra testá-la aqui com dados
 * inventados, no formato exato que consolidarDadosProcesso produziria a
 * partir do banco.
 *
 * O antigo motor de score de qualidade (lib/valuation/score.ts) foi
 * removido na Regra de Negócio v1.0 (RG-28) — este script cobria as duas
 * coisas antes; agora cobre só o motor de valuation. O Índice de Prontidão
 * tem sua própria suíte em scripts/testar-prontidao.ts, e as regras de
 * negócio v1.0 (Equity Value, dívida líquida, aplicabilidade) têm a suíte
 * dedicada em scripts/testar-regras-negocio.ts.
 *
 * Rodar com: npm run valuation:test
 */
import type { DadosProcesso } from "../lib/valuation/types";
import { calcularValuation } from "../lib/valuation/calcular";

const dadosExemplo: DadosProcesso = {
  processoId: "exemplo-manual",
  perfil: {
    razaoSocial: "Comércio de Peças ABC Ltda",
    nomeFantasia: "ABC Peças",
    cnpj: "12.345.678/0001-90",
    dataFundacao: "2015-03-10",
    setor: "Comércio de autopeças",
    porte: "pequena",
    numeroFuncionarios: 22,
    cidade: "Campinas",
    uf: "SP",
    socios: [
      { nome: "Ana Souza", percentualParticipacao: 60, cargo: "Diretora" },
      { nome: "Carlos Lima", percentualParticipacao: 40, cargo: "Sócio operacional" },
    ],
  },
  financeiro: {
    dre: [
      {
        ano: 2023,
        receitaBruta: 3_200_000,
        deducoes: 320_000,
        receitaLiquida: 2_880_000,
        custos: 1_800_000,
        lucroBruto: 1_080_000,
        despesasOperacionais: 620_000,
        ebitda: 460_000,
        lucroLiquido: 310_000,
      },
      {
        ano: 2024,
        receitaBruta: 3_650_000,
        deducoes: 365_000,
        receitaLiquida: 3_285_000,
        custos: 2_020_000,
        lucroBruto: 1_265_000,
        despesasOperacionais: 690_000,
        ebitda: 575_000,
        lucroLiquido: 402_000,
      },
      {
        ano: 2025,
        receitaBruta: 4_100_000,
        deducoes: 410_000,
        receitaLiquida: 3_690_000,
        custos: 2_250_000,
        lucroBruto: 1_440_000,
        despesasOperacionais: 760_000,
        ebitda: 680_000,
        lucroLiquido: 470_000,
      },
    ],
    balanco: {
      ativoTotal: 2_800_000,
      ativoCirculante: 1_500_000,
      passivoTotal: 1_100_000,
      passivoCirculante: 600_000,
      patrimonioLiquido: 1_700_000,
    },
    caixaEquivalentes: 250_000,
    possuiDividas: "sim",
    dividas: [
      { credor: "Banco XYZ", valor: 450_000, taxaJurosAnual: 14.5, vencimento: "2027-06-30" },
    ],
  },
  operacao: {
    numeroFuncionariosTotal: 22,
    cargosEquipe: [
      { cargo: "Vendas", quantidade: 8 },
      { cargo: "Logística", quantidade: 6 },
      { cargo: "Administrativo", quantidade: 4 },
    ],
    numeroClientesAtivos: 340,
    concentracaoTop3Clientes: 18,
    clientesPrincipais: [
      { nome: "Oficina Rápida Ltda", percentualReceita: 8 },
      { nome: "Frota Sul Transportes", percentualReceita: 6 },
      { nome: "AutoCenter Norte", percentualReceita: 4 },
    ],
    fornecedoresPrincipais: [
      {
        nome: "Distribuidora Nacional de Peças",
        tipoInsumo: "Peças automotivas",
        nivelDependencia: "media",
      },
      {
        nome: "Importadora XPTO",
        tipoInsumo: "Peças importadas",
        nivelDependencia: "baixa",
      },
    ],
    processosOperacionais:
      "Compras centralizadas, estoque em CD próprio, vendas via loja física e e-commerce, entrega própria na região metropolitana.",
  },
  mercado: {
    concorrentes: [
      { nome: "Peças & Cia", porteEstimado: "medio", diferencialPercebido: "Preço mais baixo" },
      { nome: "AutoPeças União", porteEstimado: "grande", diferencialPercebido: "Rede de lojas maior" },
      { nome: "Peças Já", porteEstimado: "pequeno", diferencialPercebido: "Entrega rápida" },
    ],
    posicionamento:
      "Foco em atendimento técnico especializado e entrega no mesmo dia para oficinas da região metropolitana de Campinas, com curadoria de peças de qualidade a preço competitivo.",
    tamMercado: 150_000_000,
    sinergiasPotenciais:
      "Um comprador com rede de lojas em outras regiões poderia usar a base de fornecedores e o centro de distribuição para expandir rapidamente a operação de entrega no mesmo dia.",
  },
  documentos: {
    arquivos: [
      {
        nome: "contrato_social.pdf",
        path: "exemplo/contrato_social.pdf",
        tamanho: 240_000,
        tipo: "application/pdf",
        enviadoEm: new Date().toISOString(),
        categoria: "societario",
      },
      {
        nome: "balanco_2025.pdf",
        path: "exemplo/balanco_2025.pdf",
        tamanho: 180_000,
        tipo: "application/pdf",
        enviadoEm: new Date().toISOString(),
        categoria: "balanco_patrimonial",
        periodoReferencia: "2025",
      },
      {
        nome: "dre_2025.xlsx",
        path: "exemplo/dre_2025.xlsx",
        tamanho: 90_000,
        tipo: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        enviadoEm: new Date().toISOString(),
        categoria: "dre",
        periodoReferencia: "2025",
      },
    ],
  },
};

function formatBRL(valor: number | null): string {
  if (valor === null) return "N/A (não aplicável)";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

const valuation = calcularValuation(dadosExemplo);

console.log("=== VALUATION (Regra de Negócio v1.0 — Equity Value) ===");
console.log("Ano base utilizado:", valuation.anoBaseUtilizado);
console.log("EBITDA base utilizado:", formatBRL(valuation.ebitdaBaseUtilizado));
console.log("Dívida financeira total:", formatBRL(valuation.dividaFinanceiraTotal));
console.log("Caixa e equivalentes:   ", formatBRL(valuation.caixaEquivalentes));
console.log("Dívida líquida:         ", formatBRL(valuation.dividaLiquida));
console.log("");
console.log("Enterprise Value (Múltiplos):", formatBRL(valuation.evMultiplos));
console.log("Enterprise Value (DCF):      ", formatBRL(valuation.evDcf));
console.log("");
console.log("Equity Value por Múltiplo de EBITDA:", formatBRL(valuation.valuationEbitda));
console.log("Equity Value por DCF simplificado:  ", formatBRL(valuation.valuationDcf));
console.log("Equity Value Patrimonial:           ", formatBRL(valuation.valuationPatrimonial));
console.log("Estimativa preliminar de Equity Value (consolidado):", formatBRL(valuation.valuationFinal));
console.log("Aplicabilidade:", valuation.aplicabilidade);
