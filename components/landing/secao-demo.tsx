import { Reveal } from "@/components/ui/reveal";
import { DemoVideo } from "@/components/ui/demo-video";

/**
 * Vídeo real do sistema (fornecido pela equipe, não gravado/roteirizado
 * por mim — a tentativa de gravação automatizada via Playwright esbarrou
 * em bloqueio de rede neste ambiente). Autoplay a pedido explícito, mesmo
 * o arquivo sendo grande (~107MB, bem acima dos ~11MB de outro vídeo que
 * já existia em public/brand/) — ciente do custo de carregamento que isso
 * traz pra todo visitante.
 */
export function SecaoDemo() {
  return (
    <section className="mx-auto w-full max-w-5xl px-6 py-24 sm:py-32">
      <Reveal className="flex flex-col items-center gap-3 text-center">
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
          Veja o sistema em ação
        </span>
        <h2 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl dark:text-zinc-50">
          Do cadastro à análise, direto do navegador
        </h2>
      </Reveal>

      <Reveal delayMs={100}>
        <div className="shadow-premium mt-12 overflow-hidden rounded-[1.75rem] border border-zinc-900/5 bg-black dark:border-white/5">
          <DemoVideo src="/brand/demo-sistema.mp4" className="aspect-video w-full" />
        </div>
      </Reveal>
    </section>
  );
}
