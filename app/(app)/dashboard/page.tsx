import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FASES_INTAKE } from "@/lib/intake/fases";
import { ProcessosLista } from "@/components/dashboard/processos-lista";
import { Reveal } from "@/components/ui/reveal";

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

  const { data: intakeRows, error: intakeError } =
    processoIds.length > 0
      ? await supabase
          .from("intake_data")
          .select("processo_id, fase, atualizado_em")
          .in("processo_id", processoIds)
      : { data: [] as { processo_id: string; fase: string; atualizado_em: string }[], error: null };

  if (intakeError) {
    throw new Error(`Não foi possível carregar o progresso dos processos: ${intakeError.message}`);
  }

  // Prévia do resultado no card (revisão de UX, fora da numeração das Fases
  // 1-6): só os números já calculados, sem recálculo aqui — mesma fonte que
  // a tela de resultado usa (public.resultados). `atualizado_em` é usado
  // para RG-46 (resultado desatualizado), nunca `processos.updated_at`
  // (esse é "poluído" pela própria geração do resultado).
  //
  // Uma falha aqui NUNCA pode virar "nenhum processo tem resultado" — isso
  // esconderia "Ver resultado" de processos que, na verdade, têm um
  // resultado real salvo (achado da auditoria pós-implementação). Em vez de
  // engolir o erro em `data ?? []`, a falha propaga e interrompe o render
  // (mesmo padrão de lib/valuation/consolidar.ts::consolidarDadosProcesso),
  // que é honesto sobre "não sabemos" em vez de mentir "não existe".
  const { data: resultadosRows, error: resultadosError } =
    processoIds.length > 0
      ? await supabase
          .from("resultados")
          .select("processo_id, valuation_final, score_total, atualizado_em")
          .in("processo_id", processoIds)
      : { data: [] as { processo_id: string; valuation_final: number | null; score_total: number; atualizado_em: string }[], error: null };

  if (resultadosError) {
    throw new Error(`Não foi possível carregar os resultados dos processos: ${resultadosError.message}`);
  }

  const resultadoPorProcesso = new Map(
    (resultadosRows ?? []).map((r) => [r.processo_id, r]),
  );

  const fasesPorProcesso = new Map<string, Set<string>>();
  const ultimaAlteracaoIntakePorProcesso = new Map<string, string>();
  for (const row of intakeRows ?? []) {
    const fases = fasesPorProcesso.get(row.processo_id) ?? new Set<string>();
    fases.add(row.fase);
    fasesPorProcesso.set(row.processo_id, fases);

    const atual = ultimaAlteracaoIntakePorProcesso.get(row.processo_id);
    if (!atual || row.atualizado_em > atual) {
      ultimaAlteracaoIntakePorProcesso.set(row.processo_id, row.atualizado_em);
    }
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
    const ultimaAlteracaoIntake = ultimaAlteracaoIntakePorProcesso.get(processo.id);

    return {
      id: processo.id,
      nomeEmpresa: processo.nome_empresa,
      status: processo.status,
      atualizadoEm: processo.updated_at,
      preenchidas: etapasPreenchidas(processo.id),
      completo: intakeCompleto(processo.id),
      // RG-49: "Ver resultado" depende da existência real de um resultado
      // gerado (public.resultados), não da completude do intake — um
      // processo pode ter um resultado válido usando só os campos mínimos
      // (RG-40), sem nunca ter visitado Operação/Mercado/Documentos.
      temResultado: resultado !== undefined,
      resultadoDesatualizado: Boolean(
        resultado && ultimaAlteracaoIntake && ultimaAlteracaoIntake > resultado.atualizado_em,
      ),
      valuationFinal: resultado?.valuation_final ?? null,
      indiceGeral: resultado?.score_total ?? null,
    };
  });

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-12 px-6 py-16">
      <Reveal className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-ink dark:text-zinc-50">
          Bem-vindo, {nomeParaSaudacao}!
        </h1>

        <Link
          href="/intake"
          className="group mt-3 flex items-center gap-3 rounded-full bg-ink py-1.5 pl-6 pr-1.5 text-sm font-medium text-white transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] dark:bg-white dark:text-black"
        >
          Novo Valuation
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 dark:bg-black/10">
            +
          </span>
        </Link>
      </Reveal>

      <Reveal delayMs={100} className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-ink dark:text-zinc-50">
          Meus processos
        </h2>
        <ProcessosLista processos={processosResumo} />
      </Reveal>
    </div>
  );
}
