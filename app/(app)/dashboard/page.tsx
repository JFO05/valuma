import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FASES_INTAKE } from "@/lib/intake/fases";
import { StatusBadge } from "@/components/status-badge";

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
    .select("id, nome_empresa, status, created_at")
    .order("created_at", { ascending: false });

  const processoIds = (processos ?? []).map((p) => p.id);

  const { data: intakeRows } =
    processoIds.length > 0
      ? await supabase
          .from("intake_data")
          .select("processo_id, fase")
          .in("processo_id", processoIds)
      : { data: [] as { processo_id: string; fase: string }[] };

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

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 p-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold">
          Bem-vindo{profile?.nome_completo ? `, ${profile.nome_completo}` : ""}!
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">{user.email}</p>

        <Link
          href="/intake"
          className="mt-2 rounded bg-ink px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
        >
          Novo Valuation
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Meus processos</h2>

        {(processos ?? []).length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
            <p className="text-sm text-zinc-500">
              Nenhum processo criado ainda.
            </p>
            <p className="text-sm text-zinc-500">
              Clique em &quot;Novo Valuation&quot; acima para começar o
              intake da sua primeira empresa.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {(processos ?? []).map((processo) => {
              const preenchidas = etapasPreenchidas(processo.id);
              const completo = intakeCompleto(processo.id);

              return (
                <li
                  key={processo.id}
                  className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800"
                >
                  <div className="flex flex-col gap-1">
                    <p className="font-medium">{processo.nome_empresa}</p>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={processo.status} />
                      {!completo && (
                        <span className="text-xs text-zinc-500">
                          {preenchidas} de {FASES_INTAKE.length} etapas
                          preenchidas
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/intake/${processo.id}/perfil`}
                      className="rounded border border-zinc-300 px-3 py-1.5 text-sm font-medium dark:border-zinc-700"
                    >
                      {completo ? "Editar intake" : "Continuar intake"}
                    </Link>

                    {completo && (
                      <Link
                        href={`/processos/${processo.id}/resultado`}
                        className="rounded bg-ink px-3 py-1.5 text-sm font-medium text-white dark:bg-white dark:text-black"
                      >
                        Ver Resultado
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
