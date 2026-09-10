import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Acessar /intake diretamente (ex: botão "Novo Valuation" do dashboard) cria
 * um processo novo em branco e já redireciona para a primeira fase.
 */
export default async function NewIntakePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: processo, error } = await supabase
    .from("processos")
    .insert({ user_id: user.id, nome_empresa: "Empresa sem nome" })
    .select("id")
    .single();

  if (error || !processo) {
    throw new Error(
      error?.message ?? "Não foi possível criar um novo processo.",
    );
  }

  redirect(`/intake/${processo.id}/perfil`);
}
