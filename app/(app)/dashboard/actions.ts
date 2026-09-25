"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { BUCKET_DOCUMENTOS } from "@/lib/intake/schema-documentos";

type ExcluirProcessoResult = { success: true } | { success: false; error: string };

/**
 * Exclui um processo e tudo que depende dele (Fase 4.3). `partners`,
 * `intake_data` e `resultados` já têm `on delete cascade` para `processos`
 * (ver supabase/schema.sql) — apagar a linha de `processos` já limpa essas
 * três tabelas sozinho.
 *
 * O bucket de Storage NÃO está nessa cascata (Storage não é uma tabela
 * Postgres com FK) — por isso os arquivos do processo são listados e
 * removidos explicitamente ANTES de apagar a linha de `processos`. A ordem
 * importa: a policy de exclusão do bucket confirma o dono via
 * `exists (select ... from processos where id = ... and user_id = auth.uid())`
 * — se o processo já não existir mais, essa policy nunca mais autorizaria a
 * remoção dos arquivos, e eles ficariam órfãos para sempre.
 */
export async function excluirProcesso(processoId: string): Promise<ExcluirProcessoResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Sessão expirada. Faça login novamente." };
  }

  const { data: arquivos, error: listError } = await supabase.storage
    .from(BUCKET_DOCUMENTOS)
    .list(processoId);

  if (listError) {
    return { success: false, error: `Não foi possível verificar os documentos do processo: ${listError.message}` };
  }

  if (arquivos && arquivos.length > 0) {
    const caminhos = arquivos.map((arquivo) => `${processoId}/${arquivo.name}`);
    const { error: removeError } = await supabase.storage
      .from(BUCKET_DOCUMENTOS)
      .remove(caminhos);

    if (removeError) {
      return { success: false, error: `Não foi possível remover os documentos do processo: ${removeError.message}` };
    }
  }

  // RLS (processos_delete_own) garante que só o dono consegue apagar —
  // confirmado aqui pelo próprio filtro .eq, sem checagem extra.
  const { error: deleteError } = await supabase
    .from("processos")
    .delete()
    .eq("id", processoId);

  if (deleteError) {
    return { success: false, error: deleteError.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}
