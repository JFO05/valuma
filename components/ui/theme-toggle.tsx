"use client";

import { useEffect, useSyncExternalStore } from "react";

type Tema = "claro" | "escuro";

const CHAVE_LOCALSTORAGE = "tema";
// Evento próprio porque o evento nativo "storage" só dispara em OUTRAS abas
// — sem isso, clicar no botão não avisaria o próprio useSyncExternalStore
// desta aba de que o valor mudou.
const EVENTO_TEMA_MUDOU = "tema:mudou";

function lerTemaResolvido(): Tema {
  try {
    const salvo = localStorage.getItem(CHAVE_LOCALSTORAGE);
    if (salvo === "claro" || salvo === "escuro") return salvo;
  } catch {
    // localStorage indisponível (navegação privada, política do navegador)
    // — cai para a preferência do sistema abaixo, só sem persistência.
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "escuro"
    : "claro";
}

function inscrever(callback: () => void) {
  const consultaSistema = window.matchMedia("(prefers-color-scheme: dark)");
  consultaSistema.addEventListener("change", callback);
  window.addEventListener("storage", callback);
  window.addEventListener(EVENTO_TEMA_MUDOU, callback);
  return () => {
    consultaSistema.removeEventListener("change", callback);
    window.removeEventListener("storage", callback);
    window.removeEventListener(EVENTO_TEMA_MUDOU, callback);
  };
}

function obterSnapshotServidor(): Tema {
  return "claro";
}

/**
 * Botão único claro/escuro (não um seletor de 3 opções com "sistema"
 * separado): antes da primeira escolha explícita, segue a preferência do
 * sistema operacional; depois do primeiro clique, fica fixo na escolha do
 * usuário, salva em localStorage.
 *
 * Usa `useSyncExternalStore` (não `useState` + `useEffect` lendo
 * localStorage no mount) de propósito: o valor real vem de uma fonte
 * externa ao React (localStorage/`matchMedia`) que não existe durante a
 * renderização no servidor — esse hook foi feito exatamente para isso,
 * incluindo o "snapshot do servidor" que evita descompasso entre o HTML
 * do servidor e a primeira renderização no cliente. A classe `.dark` na
 * tag <html> em si já foi aplicada antes disso por um script síncrono em
 * app/layout.tsx, então a página não pisca no tema errado.
 */
export function ThemeToggle() {
  const tema = useSyncExternalStore(
    inscrever,
    lerTemaResolvido,
    obterSnapshotServidor,
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", tema === "escuro");
  }, [tema]);

  function alternar() {
    const novoTema: Tema = tema === "claro" ? "escuro" : "claro";
    try {
      localStorage.setItem(CHAVE_LOCALSTORAGE, novoTema);
    } catch {
      // Sem persistência disponível — ainda assim dispara o evento abaixo,
      // então a troca vale para esta sessão/aba.
    }
    window.dispatchEvent(new Event(EVENTO_TEMA_MUDOU));
  }

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label={tema === "claro" ? "Mudar para tema escuro" : "Mudar para tema claro"}
      title={tema === "claro" ? "Tema claro" : "Tema escuro"}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
    >
      <span aria-hidden="true">{tema === "claro" ? "🌙" : "☀️"}</span>
    </button>
  );
}
