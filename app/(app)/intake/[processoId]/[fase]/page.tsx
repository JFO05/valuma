import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { FASE_LABELS, isFaseIntake, type FaseIntake } from "@/lib/intake/fases";
import { consolidarDadosProcesso } from "@/lib/valuation/consolidar";
import { verificarCamposObrigatorios } from "@/lib/valuation/campos-obrigatorios";
import { PROPOSITO_ETAPA } from "@/lib/content/propositos-etapas";
import { IntakeStepper } from "@/components/intake/intake-stepper";
import { IntakeSidebar } from "@/components/intake/intake-sidebar";
import { MotorForm } from "@/components/intake/motor-form";
import { PerfilForm } from "@/components/intake/perfil-form";
import { FinanceiroForm } from "@/components/intake/financeiro-form";
import { OperacaoForm } from "@/components/intake/operacao-form";
import { MercadoForm } from "@/components/intake/mercado-form";
import { DocumentosForm } from "@/components/intake/documentos-form";

export default async function IntakeFasePage({
  params,
}: PageProps<"/intake/[processoId]/[fase]">) {
  const { processoId, fase } = await params;

  if (!isFaseIntake(fase)) {
    notFound();
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // A RLS só devolve o processo se ele existir E pertencer ao usuário logado
  // — por isso um 404 aqui cobre "não existe" e "não é seu" sem distinguir.
  const { data: processo, error: processoError } = await supabase
    .from("processos")
    .select("id, nome_empresa")
    .eq("id", processoId)
    .maybeSingle();

  if (processoError || !processo) {
    notFound();
  }

  const { data: intakeRows } = await supabase
    .from("intake_data")
    .select("fase, dados")
    .eq("processo_id", processoId);

  const fasesComDados = (intakeRows ?? []).map(
    (row) => row.fase as FaseIntake,
  );
  const dadosAtual =
    (intakeRows ?? []).find((row) => row.fase === fase)?.dados ?? {};

  // DEF-01: quais etapas ainda têm pendência da lista mínima (D2) — mostrado
  // no stepper como um indicador que não depende só de cor. Escopo restrito
  // de propósito: só reflete os campos que decidem se dá para gerar um
  // resultado, não a completude geral (isso é o Índice de Prontidão, Fase 2
  // — ver a seção "O que ainda falta" na tela de resultado).
  const dadosProcesso = await consolidarDadosProcesso(processoId);
  const pendencias = verificarCamposObrigatorios(dadosProcesso);
  const fasesComPendencia = new Set(pendencias.map((p) => p.fase));

  return (
    <div className="flex w-full flex-1 gap-16">
      {/* A sidebar fica junto da borda esquerda da tela (não centralizada
          junto com o conteúdo como antes) — layout de duas colunas mais
          "limpo", com o conteúdo centralizado só no espaço que sobra. */}
      <div className="hidden shrink-0 pl-8 pt-8 lg:block">
        <IntakeSidebar
          processoId={processoId}
          faseAtual={fase}
          fasesComDados={fasesComDados}
          fasesComPendencia={fasesComPendencia}
        />
      </div>

      <div className="mx-auto flex min-w-0 max-w-3xl flex-1 flex-col gap-8 p-8">
        {/* Em telas com sidebar (lg+) o "← Dashboard" já está nela; abaixo
            disso, sem a sidebar visível, precisa aparecer aqui também. */}
        <Link href="/dashboard" className="text-sm text-zinc-500 underline lg:hidden">
          ← Dashboard
        </Link>

        <div>
          <p className="text-sm text-zinc-500">{processo.nome_empresa}</p>
          <h1 className="text-2xl font-semibold">
            Valuation — {FASE_LABELS[fase]}
          </h1>
          <p className="mt-1 text-sm text-zinc-500">{PROPOSITO_ETAPA[fase]}</p>
        </div>

        {/* Mobile/tablet: a sidebar acima fica oculta (`hidden lg:flex`); o
            stepper horizontal compacto que já existia continua servindo essa
            navegação em telas estreitas — solução mais simples pedida na
            especificação (Fase 4.5) em vez de uma segunda sidebar responsiva. */}
        <div className="lg:hidden">
          <IntakeStepper
            processoId={processoId}
            faseAtual={fase}
            fasesComDados={fasesComDados}
            fasesComPendencia={fasesComPendencia}
          />
        </div>

        {fase === "motor" && (
          <MotorForm processoId={processoId} dadosIniciais={dadosAtual} />
        )}

        {fase === "perfil" && (
          <PerfilForm processoId={processoId} dadosIniciais={dadosAtual} />
        )}

        {fase === "financeiro" && (
          <FinanceiroForm processoId={processoId} dadosIniciais={dadosAtual} />
        )}

        {fase === "operacao" && (
          <OperacaoForm processoId={processoId} dadosIniciais={dadosAtual} />
        )}

        {fase === "mercado" && (
          <MercadoForm processoId={processoId} dadosIniciais={dadosAtual} />
        )}

        {fase === "documentos" && (
          <DocumentosForm processoId={processoId} dadosIniciais={dadosAtual} />
        )}
      </div>
    </div>
  );
}
