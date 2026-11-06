import { Reveal } from "@/components/ui/reveal";
import { FASES_INTAKE, FASE_LABELS } from "@/lib/intake/fases";
import { PROPOSITO_ETAPA } from "@/lib/content/propositos-etapas";

/**
 * Stepper com as 6 fases REAIS do intake (lib/intake/fases.ts) e a mesma
 * frase de propósito que o próprio formulário mostra ao usuário logado
 * (lib/content/propositos-etapas.ts) — reaproveitada, não reescrita, pra
 * nunca divergir do que o sistema realmente faz em cada etapa. Decisão
 * registrada em docs/plano-landing-valuma.md: mostrar as 6, não forçar 5.
 *
 * Uma trilha vertical só (como components/intake/intake-sidebar.tsx), em
 * todas as telas — tentei uma segunda versão horizontal de 6 colunas pra
 * desktop, mas na revisão responsiva (Etapa 3.8) o texto real de
 * PROPOSITO_ETAPA (140-190 caracteres cada) não cabe legível numa coluna de
 * ~160px em 1440px sem cortar ou cursivar o texto; central ancorado numa
 * largura máxima fica legível em qualquer tela e evita essa armadilha.
 */
export function SecaoComoFunciona() {
  return (
    <section id="como-funciona" className="py-24 sm:py-32">
      <div className="mx-auto w-full max-w-6xl px-6">
        <Reveal className="flex flex-col items-center gap-3 text-center">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
            Como funciona
          </span>
          <h2 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl dark:text-zinc-50">
            As mesmas 6 etapas que o sistema usa de verdade
          </h2>
          <p className="max-w-xl text-balance text-sm text-zinc-600 dark:text-zinc-400">
            Nada aqui é ilustrativo — é o fluxo real de preenchimento,
            guiado do início ao fim.
          </p>
        </Reveal>

        <ol className="relative mx-auto mt-14 flex max-w-2xl flex-col gap-1">
          <div
            aria-hidden="true"
            className="absolute left-[19px] top-4 bottom-4 w-px bg-zinc-200 dark:bg-zinc-800"
          />
          {FASES_INTAKE.map((fase, indice) => (
            <li key={fase} className="relative flex gap-4 px-2 py-3">
              <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-accent/40 bg-[#fafaf9] text-sm font-semibold text-accent dark:bg-[#0a0a0a]">
                {indice + 1}
              </span>
              <div className="flex flex-col gap-1 pt-1.5">
                <h3 className="text-sm font-semibold text-ink dark:text-zinc-50">
                  {FASE_LABELS[fase]}
                </h3>
                <p className="text-xs text-zinc-500">{PROPOSITO_ETAPA[fase]}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
