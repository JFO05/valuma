import Link from "next/link";
import { FASES_INTAKE, FASE_LABELS, type FaseIntake } from "@/lib/intake/fases";

export function IntakeStepper({
  processoId,
  faseAtual,
  fasesComDados,
}: {
  processoId: string;
  faseAtual: FaseIntake;
  fasesComDados: FaseIntake[];
}) {
  return (
    <ol className="flex flex-wrap gap-2">
      {FASES_INTAKE.map((fase, index) => {
        const isAtual = fase === faseAtual;
        const isVisitada = fasesComDados.includes(fase);

        return (
          <li key={fase}>
            <Link
              href={`/intake/${processoId}/${fase}`}
              aria-current={isAtual ? "step" : undefined}
              className={[
                "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                isAtual
                  ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                  : "border-zinc-300 text-zinc-700 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300",
              ].join(" ")}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full border text-xs">
                {isVisitada ? "✓" : index + 1}
              </span>
              {FASE_LABELS[fase]}
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
