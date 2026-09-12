import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/logout-button";
import { FASES_INTAKE } from "@/lib/intake/fases";

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

        <div className="mt-2 flex gap-3">
          <Link
            href="/intake"
            className="rounded bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
          >
            Novo Valuation
          </Link>
          <LogoutButton />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Meus processos</h2>

        {(processos ?? []).length === 0 ? (
          <p className="text-sm text-zinc-500">
            Nenhum processo criado ainda. Clique em &quot;Novo Valuation&quot;
            para começar.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {(processos ?? []).map((processo) => (
              <li
                key={processo.id}
                className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800"
              >
                <div>
                  <p className="font-medium">{processo.nome_empresa}</p>
                  <p className="text-xs text-zinc-500">{processo.status}</p>
                </div>

                <div className="flex gap-2">
                  <Link
                    href={`/intake/${processo.id}/perfil`}
                    className="rounded border border-zinc-300 px-3 py-1.5 text-sm font-medium dark:border-zinc-700"
                  >
                    Continuar intake
                  </Link>

                  {intakeCompleto(processo.id) && (
                    <Link
                      href={`/processos/${processo.id}/resultado`}
                      className="rounded bg-black px-3 py-1.5 text-sm font-medium text-white dark:bg-white dark:text-black"
                    >
                      Ver Resultado
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
