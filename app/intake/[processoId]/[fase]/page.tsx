import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FASE_LABELS, isFaseIntake, type FaseIntake } from "@/lib/intake/fases";
import { IntakeStepper } from "@/components/intake/intake-stepper";
import { IntakeStepPlaceholder } from "@/components/intake/intake-step-placeholder";
import { PerfilForm } from "@/components/intake/perfil-form";
import { FinanceiroForm } from "@/components/intake/financeiro-form";

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

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 p-8">
      <div>
        <p className="text-sm text-zinc-500">{processo.nome_empresa}</p>
        <h1 className="text-2xl font-semibold">
          Valuation — {FASE_LABELS[fase]}
        </h1>
      </div>

      <IntakeStepper
        processoId={processoId}
        faseAtual={fase}
        fasesComDados={fasesComDados}
      />

      {fase === "perfil" && (
        <PerfilForm processoId={processoId} dadosIniciais={dadosAtual} />
      )}

      {fase === "financeiro" && (
        <FinanceiroForm processoId={processoId} dadosIniciais={dadosAtual} />
      )}

      {fase !== "perfil" && fase !== "financeiro" && (
        <IntakeStepPlaceholder
          processoId={processoId}
          fase={fase}
          dadosIniciais={dadosAtual}
        />
      )}
    </div>
  );
}
