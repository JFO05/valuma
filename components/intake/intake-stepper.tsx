import Link from "next/link";
import { FASES_INTAKE, FASE_LABELS, type FaseIntake } from "@/lib/intake/fases";

export function IntakeStepper({
  processoId,
  faseAtual,
  fasesComDados,
  fasesComPendencia,
}: {
  processoId: string;
  faseAtual: FaseIntake;
  fasesComDados: FaseIntake[];
  /**
   * Etapas com pendência na lista mínima obrigatória (DEF-01/D2) — não é o
   * mesmo que "incompleta" no sentido geral (isso fica para o Índice de
   * Prontidão, Fase 2). O "!" aqui é o próprio indicador (não depende só de
   * cor); o `title`/`aria-label` reforça em texto para leitor de tela.
   */
  fasesComPendencia?: Set<FaseIntake>;
}) {
  return (
    <ol className="flex flex-wrap gap-2">
      {FASES_INTAKE.map((fase, index) => {
        const isAtual = fase === faseAtual;
        const isVisitada = fasesComDados.includes(fase);
        const temPendencia = fasesComPendencia?.has(fase) ?? false;

        return (
          <li key={fase}>
            <Link
              href={`/intake/${processoId}/${fase}`}
              aria-current={isAtual ? "step" : undefined}
              title={
                temPendencia
                  ? "Faltam campos obrigatórios nesta etapa"
                  : undefined
              }
              className={[
                "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                isAtual
                  ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                  : "border-zinc-300 text-zinc-700 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300",
              ].join(" ")}
            >
              <span
                className={[
                  "flex h-5 w-5 items-center justify-center rounded-full border text-xs",
                  temPendencia
                    ? "border-amber-500 text-amber-600 dark:border-amber-400 dark:text-amber-400"
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
    </ol>
  );
}
