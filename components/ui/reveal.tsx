"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Fade-up sutil quando o elemento entra na tela — usado só nas telas "de
 * vitrine" redesenhadas (landing, dashboard), não nos formulários de intake
 * (dado denso não precisa de coreografia de entrada). Sem Framer Motion:
 * `IntersectionObserver` + transição CSS, só em `transform`/`opacity`
 * (nada de `blur` animado — mais barato para o GPU, principalmente em
 * telas com várias instâncias na tela ao mesmo tempo). Se o usuário pediu
 * menos movimento (`prefers-reduced-motion`), o conteúdo já nasce visível.
 */
export function Reveal({
  children,
  delayMs = 0,
  className = "",
}: {
  children: React.ReactNode;
  delayMs?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const prefereReduzido = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefereReduzido) {
      // Adiado pra um callback (rAF) em vez de chamado direto no corpo do
      // efeito — mesma regra do React Compiler (`react-hooks/set-state-in-effect`)
      // já vista em components/ui/theme-toggle.tsx.
      const frame = requestAnimationFrame(() => setVisivel(true));
      return () => cancelAnimationFrame(frame);
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisivel(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: visivel ? `${delayMs}ms` : "0ms" }}
      className={`transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] ${
        visivel ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}
