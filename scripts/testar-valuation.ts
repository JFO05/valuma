/**
 * Testa calcularValuation e calcularScore isoladamente, com um objeto
 * DadosProcesso fictício — sem precisar de tela nem de banco.
 *
 * NÃO testa consolidarDadosProcesso: essa função só roda dentro de uma
 * request do Next (usa lib/supabase/server.ts, que depende de
 * next/headers), então não dá pra chamá-la de um script solto rodado com
 * tsx. calcularValuation/calcularScore, por outro lado, são puras — só
 * recebem o objeto DadosProcesso e devolvem números — por isso dá pra
 * testá-las aqui com dados inventados, no formato exato que
 * consolidarDadosProcesso produziria a partir do banco.
 *
 * Rodar com: npm run valuation:test
 */
import type { DadosProcesso } from "../lib/valuation/types";
import { calcularValuation } from "../lib/valuation/calcular";
import { calcularScore } from "../lib/valuation/score";

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
      },
      {
        nome: "balanco_2025.pdf",
        path: "exemplo/balanco_2025.pdf",
        tamanho: 180_000,
        tipo: "application/pdf",
        enviadoEm: new Date().toISOString(),
      },
      {
        nome: "dre_2025.xlsx",
        path: "exemplo/dre_2025.xlsx",
        tamanho: 90_000,
        tipo: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        enviadoEm: new Date().toISOString(),
      },
    ],
  },
};

function formatBRL(valor: number | null): string {
  if (valor === null) return "N/A (dados insuficientes)";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

const valuation = calcularValuation(dadosExemplo);
const score = calcularScore(dadosExemplo);

console.log("=== VALUATION ===");
console.log("Ano base utilizado:", valuation.anoBaseUtilizado);
console.log("EBITDA base utilizado:", formatBRL(valuation.ebitdaBaseUtilizado));
console.log("Valuation por múltiplo de EBITDA:", formatBRL(valuation.valuationEbitda));
console.log("Valuation por DCF simplificado:  ", formatBRL(valuation.valuationDcf));
console.log("Valuation patrimonial:           ", formatBRL(valuation.valuationPatrimonial));
console.log("Valuation final (média ponderada):", formatBRL(valuation.valuationFinal));

console.log("\n=== SCORE (0-100) ===");
console.log("Financeiro:", score.scoreFinanceiro.toFixed(1));
console.log("Operação:  ", score.scoreOperacao.toFixed(1));
console.log("Mercado:   ", score.scoreMercado.toFixed(1));
console.log("Jurídico:  ", score.scoreJuridico.toFixed(1));
console.log("TOTAL:     ", score.scoreTotal.toFixed(1));
