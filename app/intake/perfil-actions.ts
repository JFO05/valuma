"use server";

import { createActionClient } from "@/lib/supabase/action-client";
import type { SocioFormValues } from "@/lib/intake/schema-perfil";

type SyncPartnersResult = { success: true } | { success: false; error: string };

/**
 * Sincroniza a lista de sócios do jsonb da etapa "perfil" com
 * public.partners (cópia normalizada, para consultas futuras — o jsonb
 * continua sendo a fonte de verdade do formulário). Chamada pelo
 * PerfilForm depois que o useAutosave genérico confirma o save do jsonb.
 *
 * Estratégia: apaga os sócios atuais do processo e insere a lista completa
 * de novo. Mais simples que diffar item a item, e o volume por processo
 * (poucos sócios) torna isso barato.
 */
export async function syncPartners(
  processoId: string,
  socios: SocioFormValues[],
): Promise<SyncPartnersResult> {
  // createActionClient (não createClient) pelo mesmo motivo de
  // app/intake/actions.ts::saveIntakeData — ver lib/supabase/action-client.ts.
  const supabase = await createActionClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Sessão expirada." };
  }

  const { error: deleteError } = await supabase
    .from("partners")
    .delete()
    .eq("processo_id", processoId);

  if (deleteError) {
    return { success: false, error: deleteError.message };
  }

  if (socios.length === 0) {
    return { success: true };
  }

  const { error: insertError } = await supabase.from("partners").insert(
    socios.map((socio) => ({
      processo_id: processoId,
      nome: socio.nome,
      percentual_participacao: socio.percentualParticipacao,
      cargo: socio.cargo,
    })),
  );

  if (insertError) {
    return { success: false, error: insertError.message };
  }

  return { success: true };
}
