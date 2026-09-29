import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FASES_INTAKE } from "@/lib/intake/fases";
import { ProcessosLista } from "@/components/dashboard/processos-lista";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("nome_completo")
    .eq("id", user.id)
    .single();

  const { data: processos } = await supabase
    .from("processos")
    .select("id, nome_empresa, status, created_at, updated_at")
    .order("created_at", { ascending: false });

  const processoIds = (processos ?? []).map((p) => p.id);

  const { data: intakeRows } =
    processoIds.length > 0
      ? await supabase
          .from("intake_data")
          .select("processo_id, fase")
          .in("processo_id", processoIds)
      : { data: [] as { processo_id: string; fase: string }[] };

  // Prévia do resultado no card (revisão de UX, fora da numeração das Fases
  // 1-6): só os 2 números já calculados, sem recálculo aqui — mesma fonte
  // que a tela de resultado usa (public.resultados).
  const { data: resultadosRows } =
    processoIds.length > 0
      ? await supabase
          .from("resultados")
          .select("processo_id, valuation_final, score_total")
          .in("processo_id", processoIds)
      : { data: [] as { processo_id: string; valuation_final: number; score_total: number }[] };

  const resultadoPorProcesso = new Map(
    (resultadosRows ?? []).map((r) => [r.processo_id, r]),
  );

  const fasesPorProcesso = new Map<string, Set<string>>();
  for (const row of intakeRows ?? []) {
    const fases = fasesPorProcesso.get(row.processo_id) ?? new Set<string>();
    fases.add(row.fase);
    fasesPorProcesso.set(row.processo_id, fases);
  }

  function etapasPreenchidas(processoId: string) {
    return fasesPorProcesso.get(processoId)?.size ?? 0;
  }

  function intakeCompleto(processoId: string) {
    const fases = fasesPorProcesso.get(processoId);
    return fases !== undefined && FASES_INTAKE.every((fase) => fases.has(fase));
  }

  // Fase 4.2: e-mail some daqui (já aparece uma vez no AppShell, no topo da
  // página) — a saudação usa o e-mail só como reserva, se não houver nome.
  const nomeParaSaudacao = profile?.nome_completo || user.email;

  const processosResumo = (processos ?? []).map((processo) => {
    const resultado = resultadoPorProcesso.get(processo.id);
    return {
      id: processo.id,
      nomeEmpresa: processo.nome_empresa,
      status: processo.status,
      atualizadoEm: processo.updated_at,
      preenchidas: etapasPreenchidas(processo.id),
      completo: intakeCompleto(processo.id),
      valuationFinal: resultado?.valuation_final ?? null,
      indiceGeral: resultado?.score_total ?? null,
    };
  });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 p-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold">Bem-vindo, {nomeParaSaudacao}!</h1>

        <Link
          href="/intake"
          className="mt-2 rounded bg-ink px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
        >
          Novo Valuation
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Meus processos</h2>
        <ProcessosLista processos={processosResumo} />
      </div>
    </div>
  );
}
