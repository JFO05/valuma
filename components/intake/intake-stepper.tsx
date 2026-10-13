import Link from "next/link";
import { FASES_INTAKE, FASE_LABELS, type FaseIntake } from "@/lib/intake/fases";
import { faseBloqueada } from "@/lib/intake/navegacao";

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
        const bloqueada = faseBloqueada(fase, fasesComPendencia ?? new Set());

        const indicador = (
          <span
            className={[
              "flex h-5 w-5 items-center justify-center rounded-full border text-xs",
              temPendencia
                ? "border-amber-500 text-amber-600 dark:border-amber-400 dark:text-amber-400"
                : isVisitada
                  ? "border-accent/40 text-accent"
                  : "",
            ].join(" ")}
            aria-hidden={temPendencia ? undefined : "true"}
            aria-label={temPendencia ? "Faltam campos obrigatórios" : undefined}
          >
            {bloqueada ? "🔒" : temPendencia ? "!" : isVisitada ? "✓" : index + 1}
          </span>
        );

        return (
          <li key={fase}>
            {bloqueada ? (
              <span
                aria-disabled="true"
                title="Preencha os campos obrigatórios da etapa anterior primeiro"
                className="flex cursor-not-allowed items-center gap-2 rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-400 dark:border-zinc-800 dark:text-zinc-600"
              >
                {indicador}
                {FASE_LABELS[fase]}
              </span>
            ) : (
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
                    ? "border-ink bg-ink text-white dark:border-white dark:bg-white dark:text-black"
                    : "border-zinc-300 text-zinc-700 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300",
                ].join(" ")}
              >
                {indicador}
                {FASE_LABELS[fase]}
              </Link>
            )}
          </li>
        );
      })}

      {/* Atalho pro Resultado (mesmo que a sidebar desktop já tem — sem
          isso, no mobile o único caminho até lá era voltar ao dashboard e
          abrir o menu "⋮" do card). Nunca desabilitado: quem só quer
          conferir o que já existe não deveria ficar bloqueado por
          pendências. */}
      <li>
        <Link
          href={`/processos/${processoId}/resultado`}
          className="flex items-center gap-2 rounded-full border border-dashed border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-300"
        >
          Resultado
        </Link>
      </li>
    </ol>
  );
}
