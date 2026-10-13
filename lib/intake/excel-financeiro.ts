import ExcelJS from "exceljs";
import { CAMPOS_DRE, CAMPOS_BALANCO } from "@/lib/intake/campos-financeiros";
import type { DreAnoFormValues, PossuiDividas } from "@/lib/intake/schema-financeiro";

/**
 * Importação de planilha Excel para a etapa Financeiro — conveniência para
 * empresas que já têm os números num Excel próprio, evitando redigitar tudo
 * manualmente. Decisão de design: roda só no servidor (Server Action/Route
 * Handler, nunca num Client Component) para manter a dependência `exceljs`
 * fora do bundle do navegador, e o arquivo enviado NUNCA é salvo em lugar
 * nenhum — só é lido em memória, os valores extraídos voltam pro formulário,
 * e o buffer é descartado. Não é um "documento" da etapa Documentos (RG-35):
 * é um atalho de preenchimento, não um dos 6 documentos oficiais.
 *
 * V2 (seção 6 do prompt de evolução): a aba DRE passou de "1 linha por ano,
 * até 3 anos fixos" para "Indicador | ano1 | ano2 | ano3 | ...", para
 * acompanhar os anos dinâmicos do financeiro — o usuário pode adicionar
 * quantas colunas de ano quiser, seguindo o mesmo padrão. Os nomes dos
 * indicadores e do balanço vêm de lib/intake/campos-financeiros.ts — a mesma
 * fonte usada pelo formulário manual, evitando duas listas divergentes.
 *
 * Qualquer célula que não seja reconhecida ou esteja vazia fica de fora do
 * resultado (nunca vira 0 nem qualquer valor inventado) — quem decide o que
 * fazer com "não encontrado" é o formulário (financeiro-form.tsx), que
 * mantém o valor atual do campo intocado nesse caso.
 */

const ABA_DRE = "DRE";
const ABA_BALANCO = "Balanço e Caixa";
const ABA_DIVIDAS = "Dívidas";

const CABECALHO_DIVIDAS = ["Credor", "Valor", "Taxa de juros anual (%)", "Vencimento"] as const;

const LABEL_BALANCO_EXTRA: Record<string, "caixaEquivalentes" | "possuiDividas"> = {
  "caixa e equivalentes de caixa": "caixaEquivalentes",
  "possui dividas financeiras? (sim/nao)": "possuiDividas",
};

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

/** Aceita número já numérico ou texto no formato BRL ("R$ 1.234,56"); célula vazia/irreconhecível => undefined (nunca 0). */
function numeroOuIndefinido(valor: ExcelJS.CellValue): number | undefined {
  if (typeof valor === "number" && Number.isFinite(valor)) return valor;

  if (typeof valor === "string") {
    const limpo = valor.replace(/[^\d.,-]/g, "").trim();
    if (!limpo) return undefined;
    const normalizado = limpo.replace(/\./g, "").replace(",", ".");
    const numero = Number.parseFloat(normalizado);
    return Number.isFinite(numero) ? numero : undefined;
  }

  return undefined;
}

function textoOuIndefinido(valor: ExcelJS.CellValue): string | undefined {
  if (typeof valor === "string" && valor.trim()) return valor.trim();
  if (typeof valor === "number") return String(valor);
  return undefined;
}

export interface ValoresImportadosFinanceiro {
  /** Uma entrada por ano RECONHECIDO na planilha (não posicional — cada item já carrega o próprio `ano`). */
  dre: Partial<DreAnoFormValues>[];
  balanco: {
    ativoTotal?: number;
    ativoCirculante?: number;
    passivoTotal?: number;
    passivoCirculante?: number;
    patrimonioLiquido?: number;
  };
  caixaEquivalentes?: number;
  possuiDividas?: PossuiDividas;
  dividas: { credor: string; valor: number; taxaJurosAnual: number; vencimento: string }[] | null;
}

export interface ImportacaoFinanceiroResultado {
  sucesso: boolean;
  erro?: string;
  anosEncontrados: number[];
  camposEncontrados: string[];
  camposNaoEncontrados: string[];
  totalCamposReconhecidos: number;
  totalCamposPossiveis: number;
  valores: ValoresImportadosFinanceiro;
}

function vazio(): ImportacaoFinanceiroResultado["valores"] {
  return { dre: [], balanco: {}, dividas: null };
}

export function erroImportacaoFinanceiro(mensagem: string): ImportacaoFinanceiroResultado {
  return {
    sucesso: false,
    erro: mensagem,
    anosEncontrados: [],
    camposEncontrados: [],
    camposNaoEncontrados: [],
    totalCamposReconhecidos: 0,
    totalCamposPossiveis: 0,
    valores: vazio(),
  };
}

export async function lerPlanilhaFinanceiro(
  bytes: ArrayBuffer,
): Promise<ImportacaoFinanceiroResultado> {
  const workbook = new ExcelJS.Workbook();

  try {
    await workbook.xlsx.load(bytes);
  } catch {
    return erroImportacaoFinanceiro(
      "Não foi possível ler o arquivo. Confirme que é uma planilha .xlsx válida, baixada a partir do modelo.",
    );
  }

  const encontrados: string[] = [];
  const naoEncontrados: string[] = [];
  const valores = vazio();
  const anosEncontrados: number[] = [];

  // --- Aba DRE: layout transposto — linha 1 = "Indicador" + 1 coluna por
  // ano (quantas o usuário quiser); linhas seguintes = 1 indicador cada. ---
  const abaDre = workbook.worksheets.find((aba) => normalizar(aba.name) === normalizar(ABA_DRE));

  if (!abaDre) {
    naoEncontrados.push(`Aba "${ABA_DRE}" não encontrada`);
  } else {
    const linhaCabecalho = abaDre.getRow(1).values as ExcelJS.CellValue[];
    // Coluna 1 = "Indicador"; colunas 2+ = anos. ExcelJS usa índice 1-based e
    // reserva values[0] como vazio (particularidade da lib) — por isso o
    // loop começa em 2.
    const colunasAno: { coluna: number; ano: number }[] = [];
    for (let coluna = 2; coluna < linhaCabecalho.length; coluna++) {
      const ano = numeroOuIndefinido(linhaCabecalho[coluna]);
      if (ano !== undefined) colunasAno.push({ coluna, ano: Math.trunc(ano) });
    }

    if (colunasAno.length === 0) {
      naoEncontrados.push("Nenhuma coluna de ano reconhecida na aba DRE");
    } else {
      const porAno = new Map<number, Partial<DreAnoFormValues>>();
      for (const { ano } of colunasAno) {
        porAno.set(ano, { ano });
        anosEncontrados.push(ano);
      }

      abaDre.eachRow({ includeEmpty: false }, (row, numeroLinha) => {
        if (numeroLinha === 1) return;

        const nomeIndicador = textoOuIndefinido(row.getCell(1).value);
        if (!nomeIndicador) return;

        const campo = CAMPOS_DRE.find((c) => normalizar(c.label) === normalizar(nomeIndicador));
        if (!campo) return; // indicador não reconhecido — ignorado silenciosamente (não é erro: planilhas podem ter linhas extras)

        for (const { coluna, ano } of colunasAno) {
          const numero = numeroOuIndefinido(row.getCell(coluna).value);
          const rotulo = `${campo.label} (${ano})`;
          if (numero !== undefined) {
            (porAno.get(ano) as Record<string, number>)[campo.chave] = numero;
            encontrados.push(rotulo);
          } else {
            naoEncontrados.push(rotulo);
          }
        }
      });

      valores.dre = Array.from(porAno.values()).sort((a, b) => (b.ano ?? 0) - (a.ano ?? 0));
    }
  }

  // --- Aba Balanço e Caixa: pares Campo/Valor, 1 por linha (sem dependência de ano — é um snapshot único). ---
  const abaBalanco = workbook.worksheets.find(
    (aba) => normalizar(aba.name) === normalizar(ABA_BALANCO),
  );

  if (!abaBalanco) {
    naoEncontrados.push(`Aba "${ABA_BALANCO}" não encontrada`);
  } else {
    abaBalanco.eachRow({ includeEmpty: false }, (row, numeroLinha) => {
      if (numeroLinha === 1) return;

      const label = textoOuIndefinido(row.getCell(1).value);
      if (!label) return;

      const normalizado = normalizar(label);
      const campoBalanco = CAMPOS_BALANCO.find((c) => normalizar(c.label) === normalizado);
      const extra = LABEL_BALANCO_EXTRA[normalizado];

      if (extra === "possuiDividas") {
        const texto = normalizar(textoOuIndefinido(row.getCell(2).value) ?? "");
        if (texto === "sim" || texto === "nao" || texto === "não") {
          valores.possuiDividas = texto === "sim" ? "sim" : "nao";
          encontrados.push(label);
        } else {
          naoEncontrados.push(label);
        }
        return;
      }

      if (!campoBalanco && extra !== "caixaEquivalentes") return; // linha não reconhecida, ignorada

      const numero = numeroOuIndefinido(row.getCell(2).value);
      if (numero === undefined) {
        naoEncontrados.push(label);
        return;
      }

      if (extra === "caixaEquivalentes") {
        valores.caixaEquivalentes = numero;
      } else if (campoBalanco) {
        (valores.balanco as Record<string, number>)[campoBalanco.chave] = numero;
      }
      encontrados.push(label);
    });
  }

  // --- Aba Dívidas: lista de tamanho variável — só substitui a lista atual
  // do formulário se encontrar pelo menos 1 linha de dívida válida. ---
  const abaDividas = workbook.worksheets.find(
    (aba) => normalizar(aba.name) === normalizar(ABA_DIVIDAS),
  );

  if (abaDividas) {
    const lista: NonNullable<ImportacaoFinanceiroResultado["valores"]["dividas"]> = [];

    abaDividas.eachRow({ includeEmpty: false }, (row, numeroLinha) => {
      if (numeroLinha === 1) return;

      const credor = textoOuIndefinido(row.getCell(1).value);
      const valor = numeroOuIndefinido(row.getCell(2).value);
      const taxa = numeroOuIndefinido(row.getCell(3).value);
      const vencimento = textoOuIndefinido(row.getCell(4).value);

      if (credor && valor !== undefined && vencimento) {
        lista.push({ credor, valor, taxaJurosAnual: taxa ?? 0, vencimento });
      }
    });

    if (lista.length > 0) {
      valores.dividas = lista;
      encontrados.push(`Dívidas (${lista.length} registro(s))`);
    }
  }

  const totalCamposPossiveis =
    anosEncontrados.length * CAMPOS_DRE.length + CAMPOS_BALANCO.length + 2; // +2 = caixa + possuiDividas

  return {
    sucesso: true,
    anosEncontrados: anosEncontrados.sort((a, b) => b - a),
    camposEncontrados: encontrados,
    camposNaoEncontrados: naoEncontrados,
    totalCamposReconhecidos: encontrados.length,
    totalCamposPossiveis,
    valores,
  };
}

/** Gera o modelo (.xlsx) que a empresa preenche e depois reimporta — layout "Indicador | ano1 | ano2 | ano3", extensível por coluna. */
export async function gerarModeloFinanceiroExcel(anos: number[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();

  const abaDre = workbook.addWorksheet(ABA_DRE);
  abaDre.addRow(["Indicador", ...anos]).font = { bold: true };
  for (const campo of CAMPOS_DRE) {
    abaDre.addRow([campo.label, ...anos.map(() => null)]);
  }
  abaDre.getColumn(1).width = 28;
  for (let i = 0; i < anos.length; i++) {
    abaDre.getColumn(i + 2).width = 16;
  }

  const abaBalanco = workbook.addWorksheet(ABA_BALANCO);
  abaBalanco.addRow(["Campo", "Valor"]).font = { bold: true };
  for (const campo of CAMPOS_BALANCO) {
    abaBalanco.addRow([campo.label, null]);
  }
  abaBalanco.addRow(["Caixa e equivalentes de caixa", null]);
  abaBalanco.addRow(["Possui dívidas financeiras? (sim/nao)", null]);
  abaBalanco.columns.forEach((coluna) => {
    coluna.width = 36;
  });

  const abaDividas = workbook.addWorksheet(ABA_DIVIDAS);
  abaDividas.addRow([...CABECALHO_DIVIDAS]).font = { bold: true };
  abaDividas.columns.forEach((coluna) => {
    coluna.width = 24;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
