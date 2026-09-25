import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";

/**
 * Layout compartilhado por /dashboard, /intake e /processos — o "grupo" de
 * rotas autenticadas do produto (ver lib/supabase/middleware.ts para a lista
 * equivalente de PROTECTED_PATHS). Move o header comum (components/
 * app-shell.tsx) pra fora de cada página individual.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Redundante com o middleware (que já redireciona rotas protegidas sem
  // sessão), mas mantém este layout correto mesmo se um dia for reutilizado
  // fora do middleware atual.
  if (!user) {
    redirect("/login");
  }

  return <AppShell email={user.email}>{children}</AppShell>;
}
