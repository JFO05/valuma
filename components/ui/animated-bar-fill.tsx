"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Substitui o preenchimento estático de uma barra de progresso — anima de
 * 0 até `valor` uma única vez, quando o elemento entra na viewport
 * (IntersectionObserver nativo, sem lib nova). É a 2ª microanimação
 * aprovada no plano da landing (docs/plano-landing-valuma.md, Risco 1) —
 * nunca um fade-up de seção inteira, só o preenchimento de barras que já
 * existiam estáticas. Respeita `prefers-reduced-motion` mostrando o valor
 * final direto, sem animar.
 */
export function AnimatedBarFill({
  valor,
  className = "",
}: {
  valor: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [largura, setLargura] = useState(0);

  useEffect(() => {
    const elemento = ref.current;
    if (!elemento) return;

    const observer = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setLargura(valor);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(elemento);
    return () => observer.disconnect();
  }, [valor]);

  return (
    <div
      ref={ref}
      // motion-reduce:transition-none: a largura ainda só é definida ao
      // entrar na viewport (não precisa de um ramo de JS separado pra
      // "reduced motion"), só a transição CSS que anima até lá é desligada
      // — o valor final aparece direto, sem animar.
      className={`h-full rounded-full transition-[width] duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none ${className}`}
      style={{ width: `${largura}%` }}
    />
  );
}
