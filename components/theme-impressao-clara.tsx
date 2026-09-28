"use client";

import { useEffect, useRef } from "react";

/**
 * Fase 5 (PDF) + alternador de tema: garante que qualquer impressão/PDF saia
 * no tema claro, independente do tema escolhido na tela. Em vez de tentar
 * neutralizar cor por cor (frágil — um contêiner com fundo escuro por
 * `dark:bg-*` mais texto forçado a ficar escuro por CSS de impressão vira
 * texto ilegível sobre fundo escuro), remove de verdade a classe `.dark` da
 * tag <html> antes de imprimir e devolve depois — como o `dark:` do
 * Tailwind agora reage a essa classe (ver `@custom-variant dark` em
 * globals.css), isso desliga TODAS as variantes escuras de uma vez, o
 * mesmo efeito de o usuário nunca ter ligado o tema escuro.
 */
export function ThemeImpressaoClara() {
  const estadoAntesDeImprimirRef = useRef(false);

  useEffect(() => {
    function aoAntesDeImprimir() {
      estadoAntesDeImprimirRef.current =
        document.documentElement.classList.contains("dark");
      document.documentElement.classList.remove("dark");
    }
    function aoDepoisDeImprimir() {
      document.documentElement.classList.toggle(
        "dark",
        estadoAntesDeImprimirRef.current,
      );
    }

    window.addEventListener("beforeprint", aoAntesDeImprimir);
    window.addEventListener("afterprint", aoDepoisDeImprimir);
    return () => {
      window.removeEventListener("beforeprint", aoAntesDeImprimir);
      window.removeEventListener("afterprint", aoDepoisDeImprimir);
    };
  }, []);

  return null;
}
