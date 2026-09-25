"use client";

import { useId, useRef, useState } from "react";
import { AJUDA_CAMPOS } from "@/lib/content/ajuda-campos";

/**
 * Botão "(?)" de ajuda contextual (Fase 4.7) — abre por clique, foco ou
 * Enter (Enter num <button> já dispara onClick nativamente, não precisa de
 * handler extra), fecha com Esc ou ao perder o foco, e usa
 * `aria-describedby` apontando pro texto do popover. Não depende só de
 * hover — decisão explícita da especificação, porque hover não funciona em
 * touch nem é acessível por teclado.
 */
export function AjudaPopover({ campoId }: { campoId: string }) {
  const conteudo = AJUDA_CAMPOS[campoId];
  const [aberto, setAberto] = useState(false);
  const popoverId = useId();
  // Um clique de mouse dispara "focus" e depois "click" no mesmo gesto; sem
  // isso, o foco abriria o popover e o clique alternaria de volta pra
  // fechado, no mesmo evento. O mousedown (que sempre vem antes do focus)
  // marca essa flag pra o handler de foco ceder a vez pro de clique.
  const focoPorMouseRef = useRef(false);

  if (!conteudo) return null;

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label={`Ajuda sobre ${conteudo.titulo}`}
        aria-describedby={aberto ? popoverId : undefined}
        aria-expanded={aberto}
        onMouseDown={() => {
          focoPorMouseRef.current = true;
        }}
        onClick={() => setAberto((valor) => !valor)}
        onFocus={() => {
          if (focoPorMouseRef.current) {
            focoPorMouseRef.current = false;
            return;
          }
          setAberto(true);
        }}
        onBlur={(evento) => {
          if (!evento.currentTarget.parentElement?.contains(evento.relatedTarget as Node)) {
            setAberto(false);
          }
        }}
        onKeyDown={(evento) => {
          if (evento.key === "Escape") setAberto(false);
        }}
        className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-zinc-400 text-[10px] font-medium text-zinc-500 hover:border-zinc-600 hover:text-zinc-700 dark:border-zinc-600 dark:text-zinc-400"
      >
        ?
      </button>

      {aberto && (
        <div
          id={popoverId}
          role="tooltip"
          className="absolute left-1/2 top-full z-20 mt-1 w-64 -translate-x-1/2 rounded-lg border border-zinc-200 bg-white p-3 text-left text-xs shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
        >
          <p className="mb-1">
            <strong>O que é?</strong> {conteudo.oQueE}
          </p>
          <p>
            <strong>Como influencia a análise?</strong> {conteudo.comoInfluencia}
          </p>
        </div>
      )}
    </span>
  );
}
