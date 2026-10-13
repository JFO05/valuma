import { informadoExplicitamente, type DadosProcesso } from "@/lib/valuation/types";
import type { FaseIntake } from "@/lib/intake/fases";
import type { DreAnoFormValues } from "@/lib/intake/schema-financeiro";
import {
  CATEGORIAS_DOCUMENTO,
  CATEGORIA_DOCUMENTO_LABELS,
  documentoDisponibilizado,
} from "@/lib/intake/schema-documentos";

/**
 * Índice de Prontidão Informacional para M&A (RG-26 a RG-32 de
 * docs/REGRAS_NEGOCIO_VALUMA_V1.md) — "percentual de preparação e
 * estruturação das informações necessárias para uma análise preliminar".
 * NÃO é uma nota de qualidade do negócio (isso era o antigo
 * lib/valuation/score.ts, removido na Regra de Negócio v1.0 — RG-28).
 *
 * O Perfil não entra no cálculo (RG-29) — só Financeiro, Operacional,
 * Mercado e Documental, cada um valendo 25% (RG-27), com pesos iguais entre
 * os itens dentro de cada dimensão (RG-30).
 */

export type DimensaoProntidao =
  | "financeiro"
  | "operacional"
  | "mercado"
  | "documental";

/**
 * Quatro estados de validade (RG-32): AUSENTE e INVÁLIDO não contam para a
 * nota da dimensão; VÁLIDO_ESTRUTURALMENTE e VÁLIDO_COM_ALERTA contam — o
 * segundo, além disso, gera um alerta visível ao usuário (RG-32). Não existe
 * um quinto estado "validado profissionalmente" — isso é escopo da etapa
 * posterior de contador/advogado (RG-38), fora do motor automático da v1.
 */
export const ESTADOS_ITEM_PRONTIDAO = [
  "ausente",
  "invalido",
  "valido_estruturalmente",
  "valido_com_alerta",
] as const;
export type EstadoItemProntidao = (typeof ESTADOS_ITEM_PRONTIDAO)[number];

export interface ItemChecklistProntidao {
  id: string;
  dimensao: DimensaoProntidao;
  fase: FaseIntake;
  /** Caminho do campo de origem nos dados do intake, só para documentação/depuração. */
  campo: string;
  /** Texto amigável mostrado ao usuário nas pendências/alertas. */
  label: string;
  avaliar: (dados: DadosProcesso) => EstadoItemProntidao;
}

// ---------------------------------------------------------------------------
// Helpers de validação (RG-32/RG-33 — limites da validação automática:
// presença, tipo/formato, domínio, consistência simples; nunca leitura
// semântica de conteúdo nem decisão de IA).
// ---------------------------------------------------------------------------

/**
 * Convenção aceita e documentada (achado da auditoria original) para campos
 * numéricos que NÃO migraram para o modelo "undefined = não informado" nesta
 * versão (RG-33 cobre explicitamente só EBITDA, Patrimônio Líquido e Caixa e
 * Equivalentes — os demais campos numéricos do intake continuam usando esta
 * heurística de "diferente de zero" por não terem sido citados pela Regra de
 * Negócio v1.0 como precisando de correção nesta rodada).
 */
function numeroInformado(valor: number | undefined): boolean {
  return typeof valor === "number" && Number.isFinite(valor) && valor !== 0;
}

function binario(condicao: boolean): EstadoItemProntidao {
  return condicao ? "valido_estruturalmente" : "ausente";
}

/** Domínio 0–100 (percentuais) — fora do intervalo é tratado como INVÁLIDO, não como ausente (RG-32: validação de domínio). */
function estadoPercentual(valor: number | undefined, informado: boolean): EstadoItemProntidao {
  if (!informado) return "ausente";
  if (typeof valor !== "number" || valor < 0 || valor > 100) return "invalido";
  return "valido_estruturalmente";
}

/**
 * Textos livres (Fase 3.7 do prompt de implementação): rejeita vazio,
 * repetição trivial de um único caractere e conteúdo sem nenhuma letra ou
 * dígito — sem exigir um mínimo de caracteres exagerado e sem qualquer
 * leitura semântica (isso é papel da IA, nunca da Prontidão).
 */
function estadoTexto(valor: string | undefined): EstadoItemProntidao {
  if (typeof valor !== "string") return "ausente";
  const texto = valor.trim();
  if (texto.length === 0) return "ausente";
  if (texto.length < 5) return "invalido";
  const semEspacos = texto.replace(/\s+/g, "");
  if (/^(.)\1*$/.test(semEspacos)) return "invalido";
  if (!/[a-zA-ZÀ-ÿ0-9]/.test(texto)) return "invalido";
  return "valido_estruturalmente";
}

// ---------------------------------------------------------------------------
// FINANCEIRO — DRE (3 anos fixos × 8 campos) + balanço (5 campos) + dívidas +
// caixa e equivalentes
// ---------------------------------------------------------------------------

const RECEITA_LABEL_POR_INDICE = ["ano mais recente", "ano intermediário", "ano mais antigo"];

/** Campos do DRE com valores que nunca são negativos na vida real — "preenchido" = maior que zero (heurística não migrada nesta versão, ver numeroInformado). */
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

/** lucroBruto/lucroLiquido continuam na heurística "diferente de zero"; EBITDA usa informadoExplicitamente (RG-33) — tratado à parte abaixo. */
const CAMPOS_DRE_COM_SINAL: { campo: "lucroBruto" | "lucroLiquido"; label: string }[] = [
  { campo: "lucroBruto", label: "Lucro bruto" },
  { campo: "lucroLiquido", label: "Lucro líquido" },
];

/**
 * V2 (anos dinâmicos, seção 5/10 do prompt de evolução): o DRE deixou de ter
 * um array fixo de 3 posições — o usuário pode ter 1, 2, 5, 10 anos. Para que
 * "anos financeiros adicionais não criem pontos extras" (exigência
 * explícita), a dimensão Financeira continua avaliando sempre os mesmos 3
 * "slots" (mais recente, intermediário, mais antigo), olhando para os 3 anos
 * de MAIOR valor em `.ano` — nunca pela posição no array. Com menos de 3 anos
 * cadastrados, os slots que sobram ficam "ausente" (mesmo comportamento de
 * hoje quando um dos 3 anos fixos nunca era preenchido).
 */
function anoNoSlot(
  dre: DadosProcesso["financeiro"]["dre"],
  slot: number,
): DreAnoFormValues | undefined {
  return [...dre].sort((a, b) => b.ano - a.ano)[slot];
}

function itensDre(): ItemChecklistProntidao[] {
  const itens: ItemChecklistProntidao[] = [];

  for (let slot = 0; slot < 3; slot++) {
    const rotuloAno = RECEITA_LABEL_POR_INDICE[slot];

    for (const { campo, label } of CAMPOS_DRE_NAO_NEGATIVOS) {
      itens.push({
        // Âncora aponta pro fieldset do DRE como um todo, não mais pra um
        // índice fixo: com anos dinâmicos, "o 2º ano mais recente" pode estar
        // em qualquer posição do array a cada render, então não existe mais
        // um id de campo estático correspondente (trade-off documentado).
        id: `financeiro.dre.slot${slot}.${campo}`,
        dimensao: "financeiro",
        fase: "financeiro",
        campo: "financeiro.dre",
        label: `${label} — DRE, ${rotuloAno}`,
        avaliar: (dados) => {
          const valor = anoNoSlot(dados.financeiro.dre, slot)?.[campo];
          return binario(typeof valor === "number" && valor > 0);
        },
      });
    }

    for (const { campo, label } of CAMPOS_DRE_COM_SINAL) {
      itens.push({
        id: `financeiro.dre.slot${slot}.${campo}`,
        dimensao: "financeiro",
        fase: "financeiro",
        campo: "financeiro.dre",
        label: `${label} — DRE, ${rotuloAno}`,
        avaliar: (dados) => {
          const valor = anoNoSlot(dados.financeiro.dre, slot)?.[campo];
          return binario(numeroInformado(valor as number | undefined));
        },
      });
    }

    // EBITDA (RG-33): zero ou negativo, quando explicitamente informado,
    // conta como preenchido — diferente dos demais campos do DRE acima.
    itens.push({
      id: `financeiro.dre.slot${slot}.ebitda`,
      dimensao: "financeiro",
      fase: "financeiro",
      campo: "financeiro.dre",
      label: `EBITDA — DRE, ${rotuloAno}`,
      avaliar: (dados) =>
        binario(informadoExplicitamente(anoNoSlot(dados.financeiro.dre, slot)?.ebitda)),
    });
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
    avaliar: (dados) => binario(dados.financeiro.balanco.ativoTotal > 0),
  },
  {
    id: "financeiro.balanco.ativoCirculante",
    dimensao: "financeiro",
    fase: "financeiro",
    campo: "financeiro.balanco.ativoCirculante",
    label: "Ativo circulante",
    avaliar: (dados) => binario(dados.financeiro.balanco.ativoCirculante > 0),
  },
  {
    id: "financeiro.balanco.passivoTotal",
    dimensao: "financeiro",
    fase: "financeiro",
    campo: "financeiro.balanco.passivoTotal",
    label: "Passivo total",
    avaliar: (dados) => binario(dados.financeiro.balanco.passivoTotal > 0),
  },
  {
    id: "financeiro.balanco.passivoCirculante",
    dimensao: "financeiro",
    fase: "financeiro",
    campo: "financeiro.balanco.passivoCirculante",
    label: "Passivo circulante",
    avaliar: (dados) => binario(dados.financeiro.balanco.passivoCirculante > 0),
  },
  {
    // RG-33: mesma correção do EBITDA — zero/negativo informado conta.
    id: "financeiro.balanco.patrimonioLiquido",
    dimensao: "financeiro",
    fase: "financeiro",
    campo: "financeiro.balanco.patrimonioLiquido",
    label: "Patrimônio líquido",
    avaliar: (dados) =>
      binario(informadoExplicitamente(dados.financeiro.balanco.patrimonioLiquido)),
  },
  {
    id: "financeiro.caixaEquivalentes",
    dimensao: "financeiro",
    fase: "financeiro",
    campo: "financeiro.caixaEquivalentes",
    label: "Caixa e equivalentes de caixa",
    avaliar: (dados) =>
      binario(informadoExplicitamente(dados.financeiro.caixaEquivalentes)),
  },
  {
    // RG-14/1.2 do prompt de implementação: "Não" já conta como informado
    // (dívida financeira total = 0 é uma resposta válida, não uma ausência).
    // "Sim" com lista vazia é uma inconsistência — conta para a Prontidão,
    // mas como VÁLIDO_COM_ALERTA (RG-32), não como um preenchimento limpo.
    id: "financeiro.dividas",
    dimensao: "financeiro",
    fase: "financeiro",
    campo: "financeiro.dividas",
    label: "Situação de dívida financeira",
    avaliar: (dados) => {
      const { possuiDividas, dividas } = dados.financeiro;
      if (possuiDividas === undefined) return "ausente";
      if (possuiDividas === "sim" && dividas.length === 0) return "valido_com_alerta";
      return "valido_estruturalmente";
    },
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
    avaliar: (dados) => binario(dados.operacao.numeroFuncionariosTotal > 0),
  },
  {
    id: "operacao.cargosEquipe",
    dimensao: "operacional",
    fase: "operacao",
    campo: "operacao.cargosEquipe",
    label: "Principais cargos/áreas informados",
    avaliar: (dados) => binario(dados.operacao.cargosEquipe.length > 0),
  },
  {
    id: "operacao.numeroClientesAtivos",
    dimensao: "operacional",
    fase: "operacao",
    campo: "operacao.numeroClientesAtivos",
    label: "Número de clientes ativos",
    avaliar: (dados) => binario(dados.operacao.numeroClientesAtivos > 0),
  },
  {
    id: "operacao.concentracaoTop3Clientes",
    dimensao: "operacional",
    fase: "operacao",
    campo: "operacao.concentracaoTop3Clientes",
    label: "Concentração dos 3 maiores clientes",
    avaliar: (dados) =>
      estadoPercentual(
        dados.operacao.concentracaoTop3Clientes,
        numeroInformado(dados.operacao.concentracaoTop3Clientes),
      ),
  },
  {
    id: "operacao.clientesPrincipais",
    dimensao: "operacional",
    fase: "operacao",
    campo: "operacao.clientesPrincipais",
    label: "Principais clientes informados",
    avaliar: (dados) => binario(dados.operacao.clientesPrincipais.length > 0),
  },
  {
    id: "operacao.fornecedoresPrincipais",
    dimensao: "operacional",
    fase: "operacao",
    campo: "operacao.fornecedoresPrincipais",
    label: "Principais fornecedores informados",
    avaliar: (dados) => binario(dados.operacao.fornecedoresPrincipais.length > 0),
  },
  {
    id: "operacao.processosOperacionais",
    dimensao: "operacional",
    fase: "operacao",
    campo: "operacao.processosOperacionais",
    label: "Descrição dos processos operacionais",
    avaliar: (dados) => estadoTexto(dados.operacao.processosOperacionais),
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
    avaliar: (dados) => binario(dados.mercado.concorrentes.length > 0),
  },
  {
    id: "mercado.posicionamento",
    dimensao: "mercado",
    fase: "mercado",
    campo: "mercado.posicionamento",
    label: "Posicionamento descrito",
    avaliar: (dados) => estadoTexto(dados.mercado.posicionamento),
  },
  {
    id: "mercado.tamMercado",
    dimensao: "mercado",
    fase: "mercado",
    campo: "mercado.tamMercado",
    // tamMercado já era opcional de verdade (undefined por padrão, não 0) —
    // sem ambiguidade: qualquer número, incluindo 0, conta como informado.
    label: "Tamanho de mercado estimado (TAM)",
    avaliar: (dados) => binario(typeof dados.mercado.tamMercado === "number"),
  },
  {
    id: "mercado.sinergiasPotenciais",
    dimensao: "mercado",
    fase: "mercado",
    campo: "mercado.sinergiasPotenciais",
    label: "Sinergias potenciais para M&A descritas",
    avaliar: (dados) => estadoTexto(dados.mercado.sinergiasPotenciais),
  },
];

// ---------------------------------------------------------------------------
// DOCUMENTAL — 6 categorias fixas (RG-35/RG-36), não mais "slots" genéricos
// ---------------------------------------------------------------------------

function itensDocumentais(): ItemChecklistProntidao[] {
  return CATEGORIAS_DOCUMENTO.map((categoria) => ({
    id: `documentos.categoria.${categoria}`,
    dimensao: "documental" as const,
    fase: "documentos" as const,
    campo: "documentos.arquivos",
    label: CATEGORIA_DOCUMENTO_LABELS[categoria],
    avaliar: (dados: DadosProcesso): EstadoItemProntidao =>
      // RG-36: uma categoria conta 1 vez, não importa quantos documentos
      // (válidos/disponibilizados) ela tenha — nunca por quantidade bruta.
      binario(
        dados.documentos.arquivos.some(
          (arquivo) => arquivo.categoria === categoria && documentoDisponibilizado(arquivo),
        ),
      ),
  }));
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
  /** "ausente" (nunca preenchido) ou "invalido" (preenchido, mas fora do domínio/consistência esperada) — RG-32. */
  estado: "ausente" | "invalido";
}

export interface AlertaProntidao {
  id: string;
  dimensao: DimensaoProntidao;
  fase: FaseIntake;
  label: string;
}

/**
 * Id do item → id de DOM do campo correspondente no formulário, pra "O que
 * ainda falta" poder linkar direto pro campo. Para quase todo item é a
 * mesma string, exceto os itens documentais (RG-35): todos apontam para a
 * mesma área de upload/categorização, não um campo por categoria.
 */
export function ancoraDoItemProntidao(
  item: Pick<PendenciaProntidao, "id" | "dimensao">,
): string {
  if (item.dimensao === "documental") return "documentos.arquivos";
  // V2 (anos dinâmicos): itens do DRE não têm mais um índice de array fixo
  // correspondente (ver itensDre acima) — a âncora aponta pro fieldset do
  // DRE inteiro, não pra um campo específico.
  if (item.id.startsWith("financeiro.dre.slot")) return "financeiro.dre";
  return item.id;
}

export interface NotaDimensao {
  nota: number;
  validos: number;
  esperados: number;
  pendencias: PendenciaProntidao[];
  alertas: AlertaProntidao[];
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
 * Função pura: nota da dimensão = itens válidos (estruturalmente ou com
 * alerta) / itens esperados × 100. Índice Geral = média simples das 4
 * dimensões, calculada com precisão completa — o arredondamento acontece só
 * na apresentação (RG-49/RG-51), nunca aqui.
 *
 * Lança erro se alguma dimensão não tiver nenhum item no checklist (erro de
 * configuração, não um estado válido de dados de usuário).
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
    const alertas: AlertaProntidao[] = [];
    let validos = 0;

    for (const item of itens) {
      const estado = item.avaliar(dados);

      if (estado === "valido_estruturalmente") {
        validos += 1;
      } else if (estado === "valido_com_alerta") {
        validos += 1;
        alertas.push({ id: item.id, dimensao: item.dimensao, fase: item.fase, label: item.label });
      } else {
        pendencias.push({
          id: item.id,
          dimensao: item.dimensao,
          fase: item.fase,
          label: item.label,
          estado,
        });
      }
    }

    dimensoes[dimensao] = {
      nota: (validos / itens.length) * 100,
      validos,
      esperados: itens.length,
      pendencias,
      alertas,
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
