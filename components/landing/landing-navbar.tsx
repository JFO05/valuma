"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const LINKS = [
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#resultados", label: "Resultados" },
  { href: "#para-quem-e", label: "Para quem é" },
  { href: "#sobre", label: "Sobre" },
];

/**
 * Navbar fixa e translúcida (RG do redesign, item NAVBAR): transparente
 * sobre o hero escuro, ganha fundo sólido ao rolar — só CSS/estado de
 * scroll, sem lib nova. `backdrop-blur` é barato (GPU-composited), não deve
 * afetar Core Web Vitals.
 *
 * Menu mobile (plano da landing, docs/plano-landing-valuma.md, "lacuna
 * real"): abaixo de `md` os links de âncora simplesmente desapareciam, sem
 * hambúrguer nenhum — corrigido aqui. O painel usa
 * `grid-template-rows: 0fr -> 1fr` pra animar a altura sem precisar medir o
 * conteúdo em JS (técnica puramente CSS).
 */
export function LandingNavbar() {
  const [rolado, setRolado] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    function aoRolar() {
      setRolado(window.scrollY > 24);
    }
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  useEffect(() => {
    function aoRedimensionar() {
      if (window.innerWidth >= 768) setMenuAberto(false);
    }
    window.addEventListener("resize", aoRedimensionar);
    return () => window.removeEventListener("resize", aoRedimensionar);
  }, []);

  const fundoSolido = rolado || menuAberto;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-colors duration-300 ${
        fundoSolido
          ? "border-b border-zinc-900/5 bg-[#fafaf9]/80 backdrop-blur-md dark:border-white/5 dark:bg-[#0a0a0a]/80"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" aria-label="ValuM&amp;A" onClick={() => setMenuAberto(false)}>
          <BrandLogo />
        </Link>

        <nav
          className={`hidden items-center gap-8 text-sm font-medium md:flex ${
            rolado ? "text-zinc-600 dark:text-zinc-400" : "text-zinc-600 dark:text-white/70"
          }`}
        >
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`transition-colors ${
                rolado ? "hover:text-ink dark:hover:text-zinc-100" : "hover:text-ink dark:hover:text-white"
              }`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <div
            className={
              rolado
                ? ""
                : "[&_button]:text-zinc-600 dark:[&_button]:text-white/70 [&_button:hover]:text-ink dark:[&_button:hover]:text-white"
            }
          >
            <ThemeToggle />
          </div>
          <Link
            href="/login"
            className={`hidden text-sm font-medium transition-colors md:inline ${
              rolado
                ? "text-zinc-600 hover:text-ink dark:text-zinc-400 dark:hover:text-zinc-100"
                : "text-zinc-600 hover:text-ink dark:text-white/70 dark:hover:text-white"
            }`}
          >
            Entrar
          </Link>
          <Link
            href="/signup"
            className={`hidden rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 md:inline-block ${
              rolado
                ? "bg-ink text-white dark:bg-white dark:text-black"
                : "bg-white text-zinc-900 hover:bg-white/90"
            }`}
          >
            Iniciar avaliação
          </Link>

          <button
            type="button"
            aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
            aria-expanded={menuAberto}
            aria-controls="menu-mobile-landing"
            onClick={() => setMenuAberto((aberto) => !aberto)}
            className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors md:hidden ${
              rolado
                ? "text-ink hover:bg-zinc-900/5 dark:text-zinc-100 dark:hover:bg-white/10"
                : "text-zinc-700 hover:bg-black/5 dark:text-white dark:hover:bg-white/10"
            }`}
          >
            <span aria-hidden="true" className="text-lg leading-none">
              {menuAberto ? "✕" : "☰"}
            </span>
          </button>
        </div>
      </div>

      <div
        id="menu-mobile-landing"
        className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] md:hidden ${
          menuAberto ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          {/* inert quando fechado: sem isso, os links continuam focáveis
              por teclado mesmo com o painel visualmente recolhido a
              altura 0 (overflow-hidden não tira o foco, só corta o
              recorte visual) — um usuário tabulando "pularia" por links
              invisíveis. */}
          <nav
            inert={!menuAberto}
            className="mx-auto flex w-full max-w-6xl flex-col gap-1 border-t border-zinc-900/5 bg-[#fafaf9]/95 px-6 py-4 text-sm font-medium text-zinc-700 backdrop-blur-md dark:border-white/5 dark:bg-[#0a0a0a]/95 dark:text-zinc-300"
          >
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuAberto(false)}
                className="rounded-lg px-2 py-2.5 transition-colors hover:bg-zinc-900/5 hover:text-ink dark:hover:bg-white/5 dark:hover:text-white"
              >
                {link.label}
              </a>
            ))}

            <div className="mt-2 flex flex-col gap-2 border-t border-zinc-900/5 pt-3 dark:border-white/5">
              <Link
                href="/login"
                onClick={() => setMenuAberto(false)}
                className="rounded-lg px-2 py-2.5 transition-colors hover:bg-zinc-900/5 hover:text-ink dark:hover:bg-white/5 dark:hover:text-white"
              >
                Entrar
              </Link>
              <Link
                href="/signup"
                onClick={() => setMenuAberto(false)}
                className="rounded-full bg-ink px-4 py-2.5 text-center font-medium text-white dark:bg-white dark:text-black"
              >
                Iniciar avaliação
              </Link>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
