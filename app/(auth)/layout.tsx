import Link from "next/link";

/**
 * Layout compartilhado por login, signup, verify-email, forgot-password e
 * reset-password: antes, nenhuma dessas telas tinha qualquer marca — alguém
 * caindo direto em /login não via em nenhum lugar que aquilo era o
 * ValuM&A. Isso adiciona só a marca acima do cartão de cada página, sem
 * mexer no conteúdo de cada formulário.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="px-6 py-4">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-ink dark:text-zinc-50"
        >
          ValuM&amp;A
        </Link>
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
