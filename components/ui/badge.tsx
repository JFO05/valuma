const VARIANTES = {
  neutro: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  sucesso: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  atencao: "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  erro: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  destaque: "bg-accent/10 text-accent",
} as const;

/**
 * Badge de estado reutilizável — unifica a linguagem visual de pequenos
 * rótulos de status (Prontidão, documentos, resultado) num só lugar, em vez
 * de cada tela declarar sua própria combinação de cores (achado do redesign:
 * `StatusBadge` já fazia isso só para processos; isto generaliza o padrão).
 */
export function Badge({
  children,
  variante = "neutro",
  className = "",
}: {
  children: React.ReactNode;
  variante?: keyof typeof VARIANTES;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${VARIANTES[variante]} ${className}`}
    >
      {children}
    </span>
  );
}
