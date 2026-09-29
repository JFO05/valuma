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

  // "Novo processo — DD/MM" em vez de um "Empresa sem nome" genérico igual
  // pra todos: com mais de um processo ainda sem nome preenchido, os cards
  // do dashboard ficavam indistinguíveis entre si (achado durante a revisão
  // de UX, fora da numeração das Fases 1-6).
  const dataCriacao = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });

  const { data: processo, error } = await supabase
    .from("processos")
    .insert({ user_id: user.id, nome_empresa: `Novo processo — ${dataCriacao}` })
    .select("id")
    .single();

  if (error || !processo) {
    throw new Error(
      error?.message ?? "Não foi possível criar um novo processo.",
    );
  }

  redirect(`/intake/${processo.id}/perfil`);
}
