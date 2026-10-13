import Link from "next/link";
import { FASES_INTAKE, FASE_LABELS, type FaseIntake } from "@/lib/intake/fases";
import { faseBloqueada } from "@/lib/intake/navegacao";

/**
 * Sidebar de navegação do intake para desktop (item 21 do redesign —
 * estrutura/rotas preservadas, só a camada visual foi refeita: trilha
 * vertical conectando os passos, estado atual com pílula de marca,
 * concluído/pendência bem diferenciados). Escondida em telas estreitas
 * (`hidden lg:flex`) — nessas o `IntakeStepper` horizontal compacto
 * continua sendo usado.
 */
export function IntakeSidebar({
  processoId,
  faseAtual,
  fasesComDados,
  fasesComPendencia,
}: {
  processoId: string;
  faseAtual: FaseIntake;
  fasesComDados: FaseIntake[];
  fasesComPendencia?: Set<FaseIntake>;
}) {
  return (
    <nav className="hidden w-60 shrink-0 flex-col gap-6 lg:flex">
      <Link
        href="/dashboard"
        className="flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-ink dark:hover:text-zinc-200"
      >
        <span aria-hidden="true">←</span> Dashboard
      </Link>

      <ol className="relative flex flex-col gap-1">
        <div
          aria-hidden="true"
          className="absolute left-[18px] top-4 bottom-4 w-px bg-zinc-200 dark:bg-zinc-800"
        />

        {FASES_INTAKE.map((fase, index) => {
          const isAtual = fase === faseAtual;
          const isVisitada = fasesComDados.includes(fase);
          const temPendencia = fasesComPendencia?.has(fase) ?? false;
          const bloqueada = faseBloqueada(fase, fasesComPendencia ?? new Set());

          const conteudoItem = (
            <>
              <span
                className={[
                  "relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                  temPendencia
                    ? "border-amber-500 bg-amber-50 text-amber-700 dark:border-amber-400 dark:bg-amber-950 dark:text-amber-400"
                    : isAtual
                      ? "border-white bg-ink text-white dark:border-black dark:bg-white dark:text-black"
                      : isVisitada
                        ? "border-accent/40 bg-accent/10 text-accent"
                        : "border-zinc-300 bg-white text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900",
                ].join(" ")}
                aria-hidden={temPendencia ? undefined : "true"}
                aria-label={temPendencia ? "Faltam campos obrigatórios" : undefined}
              >
                {bloqueada ? "🔒" : temPendencia ? "!" : isVisitada ? "✓" : index + 1}
              </span>
              {FASE_LABELS[fase]}
            </>
          );

          return (
            <li key={fase} className="relative">
              {bloqueada ? (
                <span
                  aria-disabled="true"
                  title="Preencha os campos obrigatórios da etapa anterior primeiro"
                  className="flex cursor-not-allowed items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm font-medium text-zinc-400 dark:text-zinc-600"
                >
                  {conteudoItem}
                </span>
              ) : (
                <Link
                  href={`/intake/${processoId}/${fase}`}
                  aria-current={isAtual ? "step" : undefined}
                  title={temPendencia ? "Faltam campos obrigatórios nesta etapa" : undefined}
                  className={[
                    "flex items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm font-medium transition-colors",
                    isAtual
                      ? "bg-ink text-white dark:bg-white dark:text-black"
                      : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800",
                  ].join(" ")}
                >
                  {conteudoItem}
                </Link>
              )}
            </li>
          );
        })}
      </ol>

      <Link
        href={`/processos/${processoId}/resultado`}
        className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 px-3 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:border-accent/50 hover:text-accent dark:border-zinc-700 dark:text-zinc-300"
      >
        Ver resultado
      </Link>
    </nav>
  );
}
