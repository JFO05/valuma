"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type AtualizarNomeResult = { success: true } | { success: false; error: string };

/**
 * Fase 4.4/D5: nome editável a partir do menu de perfil no AppShell (não uma
 * página própria — decisão do grupo, ver docs/DECISOES_MVP.md). E-mail é
 * somente leitura (vem de auth.users, não é editado aqui); redefinir senha
 * reaproveita a página /reset-password que já existe (funciona com qualquer
 * sessão ativa, não só a de recuperação por e-mail).
 */
export async function atualizarNomeUsuario(nome: string): Promise<AtualizarNomeResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Sessão expirada. Faça login novamente." };
  }

  const nomeLimpo = nome.trim();

  const { error } = await supabase
    .from("users")
    .update({ nome_completo: nomeLimpo || null })
    .eq("id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}
