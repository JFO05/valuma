import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { Hero } from "@/components/landing/hero";
import { SecaoProblema } from "@/components/landing/secao-problema";
import { SecaoComoFunciona } from "@/components/landing/secao-como-funciona";
import { SecaoPilares } from "@/components/landing/secao-pilares";
import { SecaoExplicabilidade } from "@/components/landing/secao-explicabilidade";
import { SecaoProntidao } from "@/components/landing/secao-prontidao";
import { SecaoProfissionais } from "@/components/landing/secao-profissionais";
import { CtaFinal } from "@/components/landing/cta-final";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-1 flex-col">
      <LandingNavbar />

      <main className="flex flex-1 flex-col">
        <Hero />

        {/* Hero e CtaFinal já têm a própria arte de fundo (imagem clara/
            escura); as seções entre eles ficam transparentes (sem
            bg-zinc-50/bg-zinc-950 próprios) e dividem este único pano de
            manchas âmbar/azul desfocadas — é o que faz a transição de uma
            seção pra outra não parecer um corte reto de cor. */}
        <div className="relative overflow-x-hidden">
          {/* Manchas estáticas (sem parallax de scroll — o listener de
              scroll + transform a cada frame causava engasgo visível na
              rolagem; blur-3xl já é pesado o bastante sem isso). */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
            <div className="glow-blob-amber absolute -left-32 top-[6%] h-[28rem] w-[28rem] blur-3xl" />
            <div className="glow-blob-blue absolute -right-32 top-[24%] h-[30rem] w-[30rem] blur-3xl" />
            <div className="glow-blob-amber absolute -left-24 top-[44%] h-[26rem] w-[26rem] blur-3xl" />
            <div className="glow-blob-blue absolute -right-24 top-[62%] h-[28rem] w-[28rem] blur-3xl" />
            <div className="glow-blob-amber absolute -left-32 top-[80%] h-[26rem] w-[26rem] blur-3xl" />
            <div className="glow-blob-blue absolute -right-32 top-[96%] h-[26rem] w-[26rem] blur-3xl" />
          </div>

          <SecaoProblema />
          <SecaoComoFunciona />
          <SecaoPilares />
          <SecaoExplicabilidade />
          <SecaoProntidao />
          <SecaoProfissionais />
        </div>

        <CtaFinal />
      </main>

      <footer className="border-t border-zinc-900/5 px-6 py-8 text-center text-xs text-zinc-500 dark:border-white/5">
        <p>
          ValuM&amp;A — plataforma de preparação e análise preliminar para
          M&amp;A.{" "}
          <Link href="/login" className="underline">
            Entrar
          </Link>
        </p>
      </footer>
    </div>
  );
}
