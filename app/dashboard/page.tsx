import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/logout-button";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("nome_completo")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold">
        Bem-vindo{profile?.nome_completo ? `, ${profile.nome_completo}` : ""}!
      </h1>
      <p className="text-zinc-600 dark:text-zinc-400">{user.email}</p>
      <LogoutButton />
    </div>
  );
}
