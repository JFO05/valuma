import Link from "next/link";

/**
 * Footer extraído de app/page.tsx (era uma linha só). Só linka pra coisas
 * que realmente existem: âncoras da própria landing e as rotas /login e
 * /signup. Sem Termos/Privacidade (não existem no projeto) e sem endereço/
 * e-mail de contato (não documentados em lugar nenhum) — decisão registrada
 * em docs/plano-landing-valuma.md, Dúvida 4: inventar texto legal ou dado
 * de contato é um risco maior do que deixar de fora por enquanto.
 */
const COLUNAS = [
  {
    titulo: "Produto",
    links: [
      { href: "#como-funciona", label: "Como funciona" },
      { href: "#resultados", label: "Resultados" },
      { href: "#indice-prontidao", label: "Índice de Prontidão" },
      { href: "#seguranca", label: "Segurança" },
    ],
  },
  {
    titulo: "Empresa",
    links: [
      { href: "#para-quem-e", label: "Para quem é" },
      { href: "#sobre", label: "Sobre" },
      { href: "#faq", label: "Perguntas frequentes" },
    ],
  },
  {
    titulo: "Conta",
    links: [
      { href: "/login", label: "Entrar" },
      { href: "/signup", label: "Criar conta" },
    ],
  },
];

export function LandingFooter() {
  const ano = new Date().getFullYear();

  return (
    <footer className="border-t border-zinc-900/5 px-6 py-16 dark:border-white/5">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12">
        {/* lg:flex-row (não sm:) de propósito: em 768px (revisão da Etapa
            3.8) o bloco de marca + as 3 colunas de link ficam espremidos
            demais lado a lado — ficam empilhados até telas realmente
            largas o bastante pra caber os dois confortavelmente. */}
        <div className="flex flex-col gap-8 lg:flex-row lg:justify-between">
          <div className="flex max-w-xs flex-col gap-2">
            <span className="text-sm font-semibold text-ink dark:text-zinc-50">
              ValuM&amp;A
            </span>
            <p className="text-sm text-zinc-500">
              Plataforma de preparação e análise preliminar para M&amp;A.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 sm:gap-16">
            {COLUNAS.map((coluna) => (
              <div key={coluna.titulo} className="flex flex-col gap-3">
                <span className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-400">
                  {coluna.titulo}
                </span>
                <ul className="flex flex-col gap-2">
                  {coluna.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-zinc-600 transition-colors hover:text-ink dark:text-zinc-400 dark:hover:text-zinc-100"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <p className="border-t border-zinc-900/5 pt-6 text-xs text-zinc-400 dark:border-white/5">
          © {ano} ValuM&amp;A. Estimativas geradas pelo sistema são
          preliminares e não substituem avaliação profissional.
        </p>
      </div>
    </footer>
  );
}
