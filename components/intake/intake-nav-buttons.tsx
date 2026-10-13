"use client";

import { useRouter } from "next/navigation";
import { FASES_INTAKE, FASE_LABELS, type FaseIntake } from "@/lib/intake/fases";
import type { AutosaveStatus } from "@/lib/hooks/useAutosave";

/**
 * Navegação linear Voltar/Próximo entre as 5 etapas do intake. "Próximo" só
 * avança de fato quando `podeAvancar` é true — quando é false, o clique não
 * navega e só aciona `aoTentarAvancarBloqueado` (o formulário usa isso para
 * passar a destacar em vermelho os campos obrigatórios ainda vazios, em vez
 * de desabilitar o botão sem explicação). Desabilitado por completo enquanto
 * o autosave está em andamento, para não sair da etapa no meio de um save.
 */
export function IntakeNavButtons({
  processoId,
  faseAtual,
  status,
  podeAvancar,
  aoTentarAvancarBloqueado,
}: {
  processoId: string;
  faseAtual: FaseIntake;
  status: AutosaveStatus;
  podeAvancar: boolean;
  aoTentarAvancarBloqueado?: () => void;
}) {
  const router = useRouter();
  const indiceAtual = FASES_INTAKE.indexOf(faseAtual);
  const faseAnterior = indiceAtual > 0 ? FASES_INTAKE[indiceAtual - 1] : null;
  const faseProxima =
    indiceAtual < FASES_INTAKE.length - 1 ? FASES_INTAKE[indiceAtual + 1] : null;
  const salvando = status === "salvando";

  function aoClicarProximo() {
    if (!podeAvancar) {
      aoTentarAvancarBloqueado?.();
      return;
    }
    router.push(
      faseProxima
        ? `/intake/${processoId}/${faseProxima}`
        : `/processos/${processoId}/resultado`,
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 border-t border-zinc-100 pt-6 dark:border-zinc-800">
      <button
        type="button"
        disabled={salvando}
        onClick={() =>
          router.push(
            faseAnterior ? `/intake/${processoId}/${faseAnterior}` : "/dashboard",
          )
        }
        className="rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-50 dark:hover:border-zinc-600"
      >
        {faseAnterior ? `← ${FASE_LABELS[faseAnterior]}` : "← Dashboard"}
      </button>

      <button
        type="button"
        disabled={salvando}
        onClick={aoClicarProximo}
        title={
          !podeAvancar
            ? "Preencha os campos obrigatórios desta etapa para continuar"
            : undefined
        }
        className="rounded-full bg-ink px-6 py-2.5 text-sm font-medium text-white transition-transform duration-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {faseProxima ? `${FASE_LABELS[faseProxima]} →` : "Ir para o Resultado →"}
      </button>
    </div>
  );
}
