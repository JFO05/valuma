const STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  em_andamento: {
    label: "Em andamento",
    className:
      "bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  },
  concluido: {
    label: "Resultado gerado",
    className:
      "bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  },
  arquivado: {
    label: "Arquivado",
    className: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  },
};

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    className: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  };

  return (
    <span
      className={`w-fit rounded-full px-2 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
