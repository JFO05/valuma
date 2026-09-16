"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Chama POST /api/processos/[processoId]/gerar-resultado de verdade. A
 * chamada de IA pode levar alguns segundos, por isso o estado de
 * "carregando" fica explícito. Em caso de sucesso, router.refresh() refaz o
 * render do Server Component da página (app/processos/[processoId]/resultado/page.tsx),
 * que busca o resultado recém-salvo em public.resultados — não precisamos
 * guardar o resultado no estado do client component.
 */
export function GerarResultadoButton({
  processoId,
  label = "Gerar Resultado",
  variante = "primario",
}: {
  processoId: string;
  label?: string;
  variante?: "primario" | "secundario";
}) {
  const router = useRouter();
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleClick() {
    setCarregando(true);
    setErro(null);

    try {
      const response = await fetch(
        `/api/processos/${processoId}/gerar-resultado`,
        { method: "POST" },
      );

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        setErro(
          body?.error ?? "Não foi possível gerar o resultado. Tente novamente.",
        );
        setCarregando(false);
        return;
      }

      router.refresh();
    } catch {
      setErro("Falha de conexão. Tente novamente.");
      setCarregando(false);
    }
  }

  if (carregando) {
    return (
      <div className="flex flex-col items-center gap-3">
        <div
          className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-black dark:border-zinc-700 dark:border-t-white"
          role="status"
          aria-label="Carregando"
        />
        <p className="text-sm text-zinc-500">
          Calculando valuation, score e gerando análise...
        </p>
      </div>
    );
  }

  const classeBotao =
    variante === "primario"
      ? "rounded bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
      : "rounded border border-zinc-300 px-4 py-2 text-sm font-medium dark:border-zinc-700";

  return (
    <div className="flex flex-col items-center gap-2">
      <button type="button" onClick={handleClick} className={classeBotao}>
        {erro ? "Tentar novamente" : label}
      </button>
      {erro && <p className="text-sm text-red-600">{erro}</p>}
    </div>
  );
}
