"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export interface ItemMenu {
  label: string;
  href?: string;
  onClick?: () => void;
  destrutivo?: boolean;
}

/**
 * Menu de ações "⋮" genérico (Fase 4.3 pede isso para os cards de processo,
 * mas não é específico deles). Decisões de acessibilidade, deliberadamente
 * simples — sem `role="menu"`/`role="menuitem"`: esses papéis ARIA implicam
 * um contrato de navegação por setas que este componente não implementa;
 * usar o papel sem o comportamento correspondente atrapalharia leitores de
 * tela mais do que ajudaria. Em vez disso, os itens são links/botões
 * normais, acessíveis por Tab e ativáveis com Enter/Espaço (comportamento
 * nativo do HTML) — cobre "navegação por teclado" sem o contrato completo de
 * um menu ARIA. Fecha com Esc, clique fora, ou ao ativar um item; o foco
 * volta para o botão que abriu o menu.
 */
export function Menu({ label, itens }: { label: string; itens: ItemMenu[] }) {
  const [aberto, setAberto] = useState(false);
  const botaoRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;

    function aoClicarFora(evento: MouseEvent) {
      const alvo = evento.target as Node;
      if (!menuRef.current?.contains(alvo) && !botaoRef.current?.contains(alvo)) {
        setAberto(false);
      }
    }

    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        setAberto(false);
        botaoRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", aoClicarFora);
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("mousedown", aoClicarFora);
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [aberto]);

  function ativarItem(item: ItemMenu) {
    setAberto(false);
    botaoRef.current?.focus();
    item.onClick?.();
  }

  return (
    <div className="relative">
      <button
        ref={botaoRef}
        type="button"
        aria-label={label}
        aria-haspopup="true"
        aria-expanded={aberto}
        onClick={() => setAberto((valor) => !valor)}
        className="rounded px-2 py-1 text-lg leading-none text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
      >
        ⋮
      </button>

      {aberto && (
        <div
          ref={menuRef}
          className="absolute right-0 z-10 mt-1 flex w-56 flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
        >
          {itens.map((item, indice) =>
            item.href ? (
              <Link
                key={indice}
                href={item.href}
                onClick={() => {
                  setAberto(false);
                }}
                className="px-3 py-2 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                {item.label}
              </Link>
            ) : (
              <button
                key={indice}
                type="button"
                onClick={() => ativarItem(item)}
                className={`px-3 py-2 text-left text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 ${
                  item.destrutivo ? "text-red-600" : ""
                }`}
              >
                {item.label}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
