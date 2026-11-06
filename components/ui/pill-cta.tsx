import Link from "next/link";

/**
 * Botão primário em pílula com seta — extraído de hero.tsx/cta-final.tsx,
 * que duplicavam a mesma classe com pequenas divergências (dark:text-black
 * vs. dark:text-zinc-900, bg-white/10 vs. bg-white/15). Um só lugar evita
 * essas duas versões ficarem divergindo mais ao longo do redesign.
 */
export function PillCta({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 rounded-full bg-ink py-1.5 pl-6 pr-1.5 text-sm font-medium text-white transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] dark:bg-white dark:text-zinc-900 ${className}`}
    >
      {children}
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 dark:bg-black/10">
        ↗
      </span>
    </Link>
  );
}
