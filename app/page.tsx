import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { Hero } from "@/components/landing/hero";
import { SecaoDemo } from "@/components/landing/secao-demo";
import { SecaoProblema } from "@/components/landing/secao-problema";
import { SecaoComoFunciona } from "@/components/landing/secao-como-funciona";
import { SecaoPilares } from "@/components/landing/secao-pilares";
import { SecaoResultado } from "@/components/landing/secao-resultado";
import { SecaoExplicabilidade } from "@/components/landing/secao-explicabilidade";
import { SecaoProntidao } from "@/components/landing/secao-prontidao";
import { SecaoParaQuemE } from "@/components/landing/secao-para-quem-e";
import { SecaoSeguranca } from "@/components/landing/secao-seguranca";
import { SecaoProfissionais } from "@/components/landing/secao-profissionais";
import { SecaoFaq } from "@/components/landing/secao-faq";
import { CtaFinal } from "@/components/landing/cta-final";
import { LandingFooter } from "@/components/landing/landing-footer";

// Sobrescreve o title/description genéricos de app/layout.tsx (achado da
// Etapa 1, item D — a própria Mynr tem um <title> fraco; aqui corrigido em
// vez de repetido) só para a rota pública. metadataBase usa a URL real de
// produção (confirmada nesta mesma sessão), não um domínio inventado.
export const metadata: Metadata = {
  metadataBase: new URL("https://valuma.vercel.app"),
  title: "ValuM&A — Valuation e Prontidão para M&A",
  description:
    "Organize as informações da sua empresa, meça a prontidão para uma análise de M&A e receba uma estimativa preliminar de valor, com o cálculo explicado passo a passo.",
  openGraph: {
    title: "ValuM&A — Valuation e Prontidão para M&A",
    description:
      "Organize as informações da sua empresa, meça a prontidão para uma análise de M&A e receba uma estimativa preliminar de valor.",
    type: "website",
    locale: "pt_BR",
    url: "/",
  },
};

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
        {/* overflow-x-clip (não overflow-x-hidden): "hidden" vira scroll
            container e o CSS promove overflow-y de "visible" para "auto"
            automaticamente quando só o eixo X é restringido — como as
            manchas abaixo passam da altura deste bloco, isso criava uma
            barra de rolagem vertical própria, aninhada dentro da página.
            "clip" só corta o conteúdo sem nunca virar scroll container. */}
        <div className="relative overflow-x-clip">
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

          <SecaoDemo />
          <SecaoProblema />
          <SecaoComoFunciona />
          <SecaoPilares />
          <SecaoResultado />
          <SecaoExplicabilidade />
          <SecaoProntidao />
          <SecaoParaQuemE />
          <SecaoSeguranca />
          <SecaoProfissionais />
          <SecaoFaq />
        </div>

        <CtaFinal />
      </main>

      <LandingFooter />
    </div>
  );
}
