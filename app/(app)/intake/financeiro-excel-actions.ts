"use server";

import { createActionClient } from "@/lib/supabase/action-client";
import {
  erroImportacaoFinanceiro,
  lerPlanilhaFinanceiro,
  type ImportacaoFinanceiroResultado,
} from "@/lib/intake/excel-financeiro";

// Bem menor que o limite de 20 MB dos documentos da etapa Documentos — isso
// aqui é só uma planilha pequena com números, nunca persistida em nenhum
// lugar (nem banco, nem Storage): é lida, os valores voltam pro formulário,
// e o arquivo é descartado.
const TAMANHO_MAXIMO_BYTES = 5 * 1024 * 1024;

export async function importarPlanilhaFinanceiro(
  formData: FormData,
): Promise<ImportacaoFinanceiroResultado> {
  const supabase = await createActionClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return erroImportacaoFinanceiro("Sessão expirada. Faça login novamente.");
  }

  const arquivo = formData.get("arquivo");

  if (!(arquivo instanceof File)) {
    return erroImportacaoFinanceiro("Nenhum arquivo enviado.");
  }

  if (arquivo.size > TAMANHO_MAXIMO_BYTES) {
    return erroImportacaoFinanceiro(
      `Arquivo muito grande (máx. ${Math.round(TAMANHO_MAXIMO_BYTES / 1024 / 1024)} MB).`,
    );
  }

  if (!/\.(xlsx|xls)$/i.test(arquivo.name)) {
    return erroImportacaoFinanceiro(
      "Envie um arquivo .xlsx — use o modelo baixado nesta mesma tela.",
    );
  }

  const bytes = await arquivo.arrayBuffer();
  return lerPlanilhaFinanceiro(bytes);
}
