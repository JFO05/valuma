import Link from "next/link";
import { PerfilMenu } from "@/components/perfil-menu";

/**
 * Header persistente de todas as páginas autenticadas (dashboard, intake,
 * resultado) — ver app/(app)/layout.tsx. Antes desta introdução, cada página
 * reinventava (ou simplesmente não tinha) uma forma de voltar ou de saber
 * quem estava logado; isso concentra as duas coisas num único lugar
 * previsível, sempre no mesmo canto da tela.
 *
 * A marca é sempre um link para /dashboard: nas etapas do intake, isso
 * convive com o botão "Voltar para o Dashboard" (components/intake/
 * voltar-dashboard-button.tsx), que fica desabilitado enquanto o autosave
 * está em andamento — essa marca no header NÃO tem essa trava, então o botão
 * de baixo continua sendo o caminho "seguro" recomendado durante o
 * preenchimento; a marca é o atalho padrão de qualquer app (clique no logo
 * volta ao início).
 */
export function AppShell({
  email,
  nomeCompleto,
  children,
}: {
  email?: string | null;
  nomeCompleto?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-3 dark:border-zinc-800">
        <Link
          href="/dashboard"
          className="text-lg font-semibold tracking-tight text-ink dark:text-zinc-50"
        >
          ValuM&amp;A
        </Link>

        {email && <PerfilMenu email={email} nomeCompleto={nomeCompleto ?? null} />}
      </header>

      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
