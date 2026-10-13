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
 */
export function LandingNavbar() {
  const [rolado, setRolado] = useState(false);

  useEffect(() => {
    function aoRolar() {
      setRolado(window.scrollY > 24);
    }
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-colors duration-300 ${
        rolado
          ? "border-b border-zinc-900/5 bg-[#fafaf9]/80 backdrop-blur-md dark:border-white/5 dark:bg-[#0a0a0a]/80"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" aria-label="ValuM&amp;A">
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
            className={`hidden text-sm font-medium transition-colors sm:inline ${
              rolado
                ? "text-zinc-600 hover:text-ink dark:text-zinc-400 dark:hover:text-zinc-100"
                : "text-zinc-600 hover:text-ink dark:text-white/70 dark:hover:text-white"
            }`}
          >
            Entrar
          </Link>
          <Link
            href="/signup"
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${
              rolado
                ? "bg-ink text-white dark:bg-white dark:text-black"
                : "bg-white text-zinc-900 hover:bg-white/90"
            }`}
          >
            Iniciar avaliação
          </Link>
        </div>
      </div>
    </header>
  );
}
