import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/ui/reveal";
import { HeroMockup } from "@/components/landing/hero-mockup";

/**
 * Hero com arte de fundo própria (fornecida pela marca): uma versão clara e
 * uma escura, que alternam com o tema claro/escuro do site via `dark:` —
 * diferente do resto da seção, que antes forçava um fundo sempre escuro
 * (`.section-ink`) independente do tema do usuário. O texto também passou a
 * ser sensível ao tema (antes assumia sempre fundo escuro). O mockup
 * (HeroMockup) já é um cartão escuro autocontido — funciona sobre as duas
 * imagens sem precisar de ajuste.
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-24 sm:pt-40 sm:pb-32">
      <Image
        src="/brand/hero-light.png"
        alt=""
        aria-hidden="true"
        fill
        sizes="100vw"
        className="object-cover dark:hidden"
      />
      <Image
        src="/brand/hero-dark.png"
        alt=""
        aria-hidden="true"
        fill
        sizes="100vw"
        className="hidden object-cover dark:block"
      />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center gap-16 px-6 lg:flex-row lg:items-center lg:gap-12">
        <Reveal className="flex max-w-xl flex-col items-start gap-6 text-left">
          <span className="rounded-full border border-black/10 bg-black/5 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-600 dark:border-white/15 dark:bg-white/5 dark:text-white/70">
            Preparação e análise preliminar para M&amp;A
          </span>

          <h1 className="text-chroma text-4xl leading-[1.08] font-semibold tracking-tight text-ink sm:text-5xl lg:text-[3.4rem] dark:text-white">
            Entenda o valor. Organize as informações. Prepare o próximo
            passo.
          </h1>

          <p className="text-balance text-lg text-zinc-600 dark:text-white/60">
            O ValuM&amp;A estrutura informações empresariais, mede a
            prontidão para uma análise, gera uma estimativa preliminar de
            valor quando o modelo é aplicável e mostra o que ainda precisa
            ser preparado.
          </p>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Link
              href="/signup"
              className="group flex items-center gap-3 rounded-full bg-ink py-1.5 pl-6 pr-1.5 text-sm font-medium text-white transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] dark:bg-white dark:text-zinc-900"
            >
              Iniciar avaliação
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 dark:bg-black/10">
                ↗
              </span>
            </Link>
            <a
              href="#como-funciona"
              className="flex items-center justify-center rounded-full border border-black/15 px-6 py-3 text-sm font-medium text-ink transition-colors hover:border-black/30 dark:border-white/20 dark:text-white dark:hover:border-white/40"
            >
              Entender como funciona
            </a>
          </div>
        </Reveal>

        <Reveal delayMs={150} className="w-full lg:w-auto">
          <HeroMockup />
        </Reveal>
      </div>
    </section>
  );
}
