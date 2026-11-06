import Image from "next/image";
import { Reveal } from "@/components/ui/reveal";
import { PillCta } from "@/components/ui/pill-cta";

/**
 * Mesmo par de imagens claro/escuro do Hero, repetido aqui num tom bem mais
 * discreto (wash semi-transparente por cima) — um "bookend" visual com o
 * topo da página, sem competir com o CTA nem destoar do tom sóbrio do
 * restante da landing.
 */
export function CtaFinal() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      <Image
        src="/brand/hero-light.png"
        alt=""
        aria-hidden="true"
        fill
        sizes="100vw"
        className="object-cover opacity-40 dark:hidden"
      />
      <Image
        src="/brand/hero-dark.png"
        alt=""
        aria-hidden="true"
        fill
        sizes="100vw"
        className="hidden object-cover opacity-30 dark:block"
      />
      <div className="absolute inset-0 bg-zinc-50/70 dark:bg-zinc-950/70" />

      <Reveal className="relative mx-auto flex w-full max-w-2xl flex-col items-center gap-6 px-6 text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl dark:text-zinc-50">
          Comece organizando o próximo passo da sua empresa.
        </h2>
        <PillCta href="/signup">Iniciar avaliação</PillCta>
      </Reveal>
    </section>
  );
}
