"use client";

import { useEffect, useRef } from "react";

/**
 * Autoplay/loop/mudo por padrão (pedido explícito, mesmo o arquivo sendo
 * grande) — mas pausa e mostra os controles nativos quando o usuário
 * prefere menos movimento, em vez de forçar a reprodução de qualquer
 * jeito. Mesmo princípio já aplicado nas outras animações da landing
 * (pulso do hero, barras de progresso).
 */
export function DemoVideo({ src, className = "" }: { src: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.pause();
      video.autoplay = false;
      // Sem isso, quem pediu menos movimento ficaria com um vídeo parado
      // e nenhum jeito de dar play — os controles nativos só aparecem
      // pra esse caso, não no visual padrão (mais limpo sem eles).
      video.controls = true;
    }
  }, []);

  return (
    <video
      ref={ref}
      src={src}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      className={className}
    >
      Seu navegador não suporta reprodução de vídeo.
    </video>
  );
}
