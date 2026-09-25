import Link from "next/link";
import { FASES_INTAKE, FASE_LABELS, type FaseIntake } from "@/lib/intake/fases";

/**
 * Sidebar de navegação do intake para desktop (Fase 4.5, especificação
 * original — ver docs/DECISOES_MVP.md para o registro de que a Fase 0 havia
 * recomendado evoluir o stepper horizontal em vez de criar uma sidebar, e o
 * grupo optou por seguir com a sidebar mesmo assim). Escondida em telas
 * estreitas (`hidden lg:flex`) — nessas o `IntakeStepper` horizontal
 * continua sendo usado (ver a própria página da etapa).
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
    <nav className="hidden w-56 shrink-0 flex-col gap-1 lg:flex">
      <Link
        href="/dashboard"
        className="mb-4 text-sm text-zinc-500 underline"
      >
        ← Dashboard
      </Link>

      <ol className="flex flex-col gap-1">
        {FASES_INTAKE.map((fase, index) => {
          const isAtual = fase === faseAtual;
          const isVisitada = fasesComDados.includes(fase);
          const temPendencia = fasesComPendencia?.has(fase) ?? false;

          return (
            <li key={fase}>
              <Link
                href={`/intake/${processoId}/${fase}`}
                aria-current={isAtual ? "step" : undefined}
                title={temPendencia ? "Faltam campos obrigatórios nesta etapa" : undefined}
                className={[
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isAtual
                    ? "bg-ink text-white dark:bg-white dark:text-black"
                    : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs",
                    temPendencia
                      ? "border-amber-500 text-amber-600 dark:border-amber-400 dark:text-amber-400"
                      : isAtual
                        ? "border-white dark:border-black"
                        : "",
                  ].join(" ")}
                  aria-hidden={temPendencia ? undefined : "true"}
                  aria-label={temPendencia ? "Faltam campos obrigatórios" : undefined}
                >
                  {temPendencia ? "!" : isVisitada ? "✓" : index + 1}
                </span>
                {FASE_LABELS[fase]}
              </Link>
            </li>
          );
        })}

        <li className="mt-2 border-t border-zinc-200 pt-2 dark:border-zinc-800">
          <Link
            href={`/processos/${processoId}/resultado`}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Resultado
          </Link>
        </li>
      </ol>
    </nav>
  );
}
