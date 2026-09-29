import type { DadosProcesso } from "@/lib/valuation/types";
import type { FaseIntake } from "@/lib/intake/fases";
import type { DreAnoFormValues } from "@/lib/intake/schema-financeiro";

/**
 * Índice de Prontidão para M&A (Fase 2 do plano de evolução) — "percentual
 * de preparação e estruturação das informações necessárias para uma análise
 * preliminar". NÃO é uma nota de qualidade do negócio (isso era o antigo
 * lib/valuation/score.ts, removido nesta fase).
 *
 * O Perfil não entra no cálculo (decisão da própria especificação da Fase 2)
 * — só Financeiro, Operacional, Mercado e Documental.
 *
 * Cada item do checklist usa exclusivamente campos que já existem no
 * intake — nenhum campo novo foi criado para isso. A lista completa está
 * documentada em tabela em docs/DECISOES_MVP.md.
 */

export type DimensaoProntidao =
  | "financeiro"
  | "operacional"
  | "mercado"
  | "documental";

export interface ItemChecklistProntidao {
  id: string;
  dimensao: DimensaoProntidao;
  fase: FaseIntake;
  /** Caminho do campo de origem nos dados do intake, só para documentação/depuração. */
  campo: string;
  /** Texto amigável mostrado ao usuário nas pendências. */
  label: string;
  isValido: (dados: DadosProcesso) => boolean;
}

/**
 * Mesma regra de ambiguidade já usada em lib/valuation/score.ts e
 * lib/valuation/campos-obrigatorios.ts: o valor padrão de um campo nunca
 * tocado é 0, então "diferente de zero" é a forma prática de distinguir
 * "não preenchido" de "preenchido com um valor real" sem precisar de um
 * campo extra de "toquei nisso". Aceita negativos (ex.: lucro líquido,
 * patrimônio líquido) como preenchidos — só o zero é ambíguo.
 */
function numeroInformado(valor: number | undefined): boolean {
  return typeof valor === "number" && Number.isFinite(valor) && valor !== 0;
}

function textoInformado(valor: string | undefined): boolean {
  return typeof valor === "string" && valor.trim().length > 0;
}

// ---------------------------------------------------------------------------
// FINANCEIRO — DRE (3 anos fixos × 8 campos) + balanço (5 campos) + dívidas
// ---------------------------------------------------------------------------

const RECEITA_LABEL_POR_INDICE = ["ano mais recente", "ano intermediário", "ano mais antigo"];

/**
 * Campos do DRE com valores que nunca são negativos na vida real (receita,
 * deduções, custos, despesas) — "preenchido" = maior que zero.
 */
const CAMPOS_DRE_NAO_NEGATIVOS: {
  campo: keyof DreAnoFormValues;
  label: string;
}[] = [
  { campo: "receitaBruta", label: "Receita bruta" },
  { campo: "deducoes", label: "Deduções" },
  { campo: "receitaLiquida", label: "Receita líquida" },
  { campo: "custos", label: "Custos" },
  { campo: "despesasOperacionais", label: "Despesas operacionais" },
];

/**
 * Campos do DRE que podem legitimamente ser negativos (empresa deficitária)
 * — "preenchido" = diferente de zero (positivo ou negativo).
 */
const CAMPOS_DRE_COM_SINAL: { campo: keyof DreAnoFormValues; label: string }[] = [
  { campo: "lucroBruto", label: "Lucro bruto" },
  { campo: "ebitda", label: "EBITDA" },
  { campo: "lucroLiquido", label: "Lucro líquido" },
];

function itensDre(): ItemChecklistProntidao[] {
  const itens: ItemChecklistProntidao[] = [];

  for (let indice = 0; indice < 3; indice++) {
    const rotuloAno = RECEITA_LABEL_POR_INDICE[indice];

    for (const { campo, label } of CAMPOS_DRE_NAO_NEGATIVOS) {
      itens.push({
        id: `financeiro.dre.${indice}.${campo}`,
        dimensao: "financeiro",
        fase: "financeiro",
        campo: `financeiro.dre[${indice}].${campo}`,
        label: `${label} — DRE, ${rotuloAno}`,
        isValido: (dados) => {
          const valor = dados.financeiro.dre[indice]?.[campo];
          return typeof valor === "number" && valor > 0;
        },
      });
    }

    for (const { campo, label } of CAMPOS_DRE_COM_SINAL) {
      itens.push({
        id: `financeiro.dre.${indice}.${campo}`,
        dimensao: "financeiro",
        fase: "financeiro",
        campo: `financeiro.dre[${indice}].${campo}`,
        label: `${label} — DRE, ${rotuloAno}`,
        isValido: (dados) => {
          const valor = dados.financeiro.dre[indice]?.[campo];
          return numeroInformado(valor as number | undefined);
        },
      });
    }
  }

  return itens;
}

const ITENS_BALANCO: ItemChecklistProntidao[] = [
  {
    id: "financeiro.balanco.ativoTotal",
    dimensao: "financeiro",
    fase: "financeiro",
    campo: "financeiro.balanco.ativoTotal",
    label: "Ativo total",
    isValido: (dados) => dados.financeiro.balanco.ativoTotal > 0,
  },
  {
    id: "financeiro.balanco.ativoCirculante",
    dimensao: "financeiro",
    fase: "financeiro",
    campo: "financeiro.balanco.ativoCirculante",
    label: "Ativo circulante",
    isValido: (dados) => dados.financeiro.balanco.ativoCirculante > 0,
  },
  {
    id: "financeiro.balanco.passivoTotal",
    dimensao: "financeiro",
    fase: "financeiro",
    campo: "financeiro.balanco.passivoTotal",
    label: "Passivo total",
    isValido: (dados) => dados.financeiro.balanco.passivoTotal > 0,
  },
  {
    id: "financeiro.balanco.passivoCirculante",
    dimensao: "financeiro",
    fase: "financeiro",
    campo: "financeiro.balanco.passivoCirculante",
    label: "Passivo circulante",
    isValido: (dados) => dados.financeiro.balanco.passivoCirculante > 0,
  },
  {
    id: "financeiro.balanco.patrimonioLiquido",
    dimensao: "financeiro",
    fase: "financeiro",
    campo: "financeiro.balanco.patrimonioLiquido",
    label: "Patrimônio líquido",
    isValido: (dados) => numeroInformado(dados.financeiro.balanco.patrimonioLiquido),
  },
  {
    // Lista de tamanho variável — tratada como 1 item binário ("pelo menos
    // uma dívida informada"), não uma dívida por linha. Limitação aceita e
    // documentada em docs/DECISOES_MVP.md: uma empresa genuinamente sem
    // dívidas nunca completa este item, pelo mesmo motivo pelo qual
    // lib/valuation/score.ts trata "nenhuma dívida" como ambíguo, não como
    // "zero dívidas confirmado".
    id: "financeiro.dividas",
    dimensao: "financeiro",
    fase: "financeiro",
    campo: "financeiro.dividas",
    label: "Dívidas e financiamentos informados",
    isValido: (dados) => dados.financeiro.dividas.length > 0,
  },
];

// ---------------------------------------------------------------------------
// OPERACIONAL
// ---------------------------------------------------------------------------

const ITENS_OPERACIONAL: ItemChecklistProntidao[] = [
  {
    id: "operacao.numeroFuncionariosTotal",
    dimensao: "operacional",
    fase: "operacao",
    campo: "operacao.numeroFuncionariosTotal",
    label: "Número total de funcionários",
    isValido: (dados) => dados.operacao.numeroFuncionariosTotal > 0,
  },
  {
    id: "operacao.cargosEquipe",
    dimensao: "operacional",
    fase: "operacao",
    campo: "operacao.cargosEquipe",
    label: "Principais cargos/áreas informados",
    isValido: (dados) => dados.operacao.cargosEquipe.length > 0,
  },
  {
    id: "operacao.numeroClientesAtivos",
    dimensao: "operacional",
    fase: "operacao",
    campo: "operacao.numeroClientesAtivos",
    label: "Número de clientes ativos",
    isValido: (dados) => dados.operacao.numeroClientesAtivos > 0,
  },
  {
    id: "operacao.concentracaoTop3Clientes",
    dimensao: "operacional",
    fase: "operacao",
    campo: "operacao.concentracaoTop3Clientes",
    label: "Concentração dos 3 maiores clientes",
    isValido: (dados) => numeroInformado(dados.operacao.concentracaoTop3Clientes),
  },
  {
    id: "operacao.clientesPrincipais",
    dimensao: "operacional",
    fase: "operacao",
    campo: "operacao.clientesPrincipais",
    label: "Principais clientes informados",
    isValido: (dados) => dados.operacao.clientesPrincipais.length > 0,
  },
  {
    id: "operacao.fornecedoresPrincipais",
    dimensao: "operacional",
    fase: "operacao",
    campo: "operacao.fornecedoresPrincipais",
    label: "Principais fornecedores informados",
    isValido: (dados) => dados.operacao.fornecedoresPrincipais.length > 0,
  },
  {
    id: "operacao.processosOperacionais",
    dimensao: "operacional",
    fase: "operacao",
    campo: "operacao.processosOperacionais",
    label: "Descrição dos processos operacionais",
    isValido: (dados) => textoInformado(dados.operacao.processosOperacionais),
  },
];

// ---------------------------------------------------------------------------
// MERCADO
// ---------------------------------------------------------------------------

const ITENS_MERCADO: ItemChecklistProntidao[] = [
  {
    id: "mercado.concorrentes",
    dimensao: "mercado",
    fase: "mercado",
    campo: "mercado.concorrentes",
    label: "Concorrentes mapeados",
    isValido: (dados) => dados.mercado.concorrentes.length > 0,
  },
  {
    id: "mercado.posicionamento",
    dimensao: "mercado",
    fase: "mercado",
    campo: "mercado.posicionamento",
    label: "Posicionamento descrito",
    isValido: (dados) => textoInformado(dados.mercado.posicionamento),
  },
  {
    id: "mercado.tamMercado",
    dimensao: "mercado",
    fase: "mercado",
    campo: "mercado.tamMercado",
    // tamMercado é opcional de verdade no schema (undefined por padrão, não
    // 0) — diferente dos outros campos numéricos, aqui não há ambiguidade:
    // qualquer número, incluindo 0, conta como informado.
    label: "Tamanho de mercado estimado (TAM)",
    isValido: (dados) => typeof dados.mercado.tamMercado === "number",
  },
  {
    id: "mercado.sinergiasPotenciais",
    dimensao: "mercado",
    fase: "mercado",
    campo: "mercado.sinergiasPotenciais",
    label: "Sinergias potenciais para M&A descritas",
    isValido: (dados) => textoInformado(dados.mercado.sinergiasPotenciais),
  },
];

// ---------------------------------------------------------------------------
// DOCUMENTAL
// ---------------------------------------------------------------------------

/**
 * O formulário de Documentos não categoriza os arquivos por tipo (o schema
 * só guarda nome/path/tamanho/tipo MIME/data — ver
 * lib/intake/schema-documentos.ts) — não há um "checklist de documentos"
 * nomeado para reaproveitar. Na ausência de itens nomeados, cada "slot" de
 * upload (1º ao 5º arquivo) vira um item — o mesmo número de referência (5)
 * já usado pelo score antigo (DOCUMENTOS_ESPERADOS_PADRAO, em
 * lib/valuation/score.ts, removido nesta fase), agora expresso como itens
 * discretos em vez de uma razão contínua. Documentado em docs/DECISOES_MVP.md.
 */
const QUANTIDADE_SLOTS_DOCUMENTOS = 5;

function itensDocumentais(): ItemChecklistProntidao[] {
  const itens: ItemChecklistProntidao[] = [];
  for (let i = 1; i <= QUANTIDADE_SLOTS_DOCUMENTOS; i++) {
    itens.push({
      id: `documentos.arquivo.${i}`,
      dimensao: "documental",
      fase: "documentos",
      campo: "documentos.arquivos",
      label: `${i}º documento enviado`,
      isValido: (dados) => dados.documentos.arquivos.length >= i,
    });
  }
  return itens;
}

export const CHECKLIST_PRONTIDAO: ItemChecklistProntidao[] = [
  ...itensDre(),
  ...ITENS_BALANCO,
  ...ITENS_OPERACIONAL,
  ...ITENS_MERCADO,
  ...itensDocumentais(),
];

export interface PendenciaProntidao {
  id: string;
  dimensao: DimensaoProntidao;
  fase: FaseIntake;
  label: string;
}

/**
 * Id do item → id de DOM do campo correspondente no formulário, pra "O que
 * ainda falta" (Fase 3) e a nova lista por etapa poderem linkar direto pro
 * campo (revisão de UX, fora da numeração das Fases 1-6). Para quase todo
 * item é a mesma string (o `id` do item já é usado literalmente como `id`
 * do input/fieldset correspondente nos componentes de formulário) — exceto
 * os 5 itens documentais, que não têm campo individual no DOM (é uma única
 * área de upload, sem um campo "tipo de documento" no schema — ver
 * `itensDocumentais` acima): todos apontam para o mesmo id da área de
 * upload.
 */
export function ancoraDoItemProntidao(
  item: Pick<PendenciaProntidao, "id" | "dimensao">,
): string {
  if (item.dimensao === "documental") return "documentos.arquivos";
  return item.id;
}

export interface NotaDimensao {
  nota: number;
  validos: number;
  esperados: number;
  pendencias: PendenciaProntidao[];
}

export interface ResultadoProntidao {
  indiceGeral: number;
  dimensoes: Record<DimensaoProntidao, NotaDimensao>;
}

const DIMENSOES: DimensaoProntidao[] = [
  "financeiro",
  "operacional",
  "mercado",
  "documental",
];

/**
 * Função pura: nota da dimensão = itens válidos / itens esperados × 100,
 * arredondada para inteiro. Índice Geral = média simples das 4 dimensões.
 * Sem pesos por campo — cada item do checklist vale o mesmo dentro da sua
 * dimensão.
 *
 * Lança erro se alguma dimensão não tiver nenhum item no checklist (erro de
 * configuração, não um estado válido de dados de usuário) — coberto por
 * teste, conforme pedido na especificação da Fase 2.
 */
export function calcularProntidao(dados: DadosProcesso): ResultadoProntidao {
  const dimensoes = {} as Record<DimensaoProntidao, NotaDimensao>;

  for (const dimensao of DIMENSOES) {
    const itens = CHECKLIST_PRONTIDAO.filter((item) => item.dimensao === dimensao);

    if (itens.length === 0) {
      throw new Error(
        `Erro de configuração do checklist de prontidão: a dimensão "${dimensao}" não tem nenhum item esperado.`,
      );
    }

    const pendencias: PendenciaProntidao[] = [];
    let validos = 0;

    for (const item of itens) {
      if (item.isValido(dados)) {
        validos += 1;
      } else {
        pendencias.push({
          id: item.id,
          dimensao: item.dimensao,
          fase: item.fase,
          label: item.label,
        });
      }
    }

    dimensoes[dimensao] = {
      nota: Math.round((validos / itens.length) * 100),
      validos,
      esperados: itens.length,
      pendencias,
    };
  }

  const indiceGeral =
    (dimensoes.financeiro.nota +
      dimensoes.operacional.nota +
      dimensoes.mercado.nota +
      dimensoes.documental.nota) /
    4;

  return { indiceGeral, dimensoes };
}
