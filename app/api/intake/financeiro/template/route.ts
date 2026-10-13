import { gerarModeloFinanceiroExcel } from "@/lib/intake/excel-financeiro";
import { anoAtual } from "@/lib/intake/schema-financeiro";

/**
 * Modelo (.xlsx) em branco para a importação da etapa Financeiro — mesmo
 * arquivo para qualquer usuário (sem dado de nenhum processo), por isso sem
 * checagem de autenticação aqui.
 */
export async function GET() {
  const ano = anoAtual();
  const buffer = await gerarModeloFinanceiroExcel([ano - 1, ano - 2, ano - 3]);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="valuma-modelo-financeiro.xlsx"',
    },
  });
}
