"use server";

import { createActionClient } from "@/lib/supabase/action-client";
import { isFaseIntake, type FaseIntake } from "@/lib/intake/fases";

type SaveIntakeDataResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Server Action chamada pelo hook useAutosave. Faz upsert em intake_data por
 * (processo_id, fase). A autorização real é a RLS de public.intake_data (só
 * quem é dono do processo_id consegue escrever) — aqui só confirmamos que
 * existe uma sessão, para devolver uma mensagem melhor que o erro cru do
 * Postgres quando não há usuário logado.
 *
 * Toda Server Action é um endpoint POST alcançável por qualquer request, por
 * isso `fase` é revalidada em runtime mesmo já vindo tipada como FaseIntake.
 */
export async function saveIntakeData(
  processoId: string,
  fase: FaseIntake,
  dados: Record<string, unknown>,
): Promise<SaveIntakeDataResult> {
  if (!isFaseIntake(fase)) {
    return { success: false, error: "Fase inválida." };
  }

  // createActionClient (não createClient): esta action roda a cada poucos
  // segundos via useAutosave — usar o cliente que regrava cookies aqui
  // causava um loop infinito de re-render. Ver comentário em
  // lib/supabase/action-client.ts.
  const supabase = await createActionClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Sessão expirada. Faça login novamente." };
  }

  const { error } = await supabase
    .from("intake_data")
    .upsert(
      { processo_id: processoId, fase, dados },
      { onConflict: "processo_id,fase" },
    );

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
