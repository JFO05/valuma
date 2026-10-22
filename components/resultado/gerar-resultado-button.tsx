"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

/**
 * Chama POST /api/processos/[processoId]/gerar-resultado de verdade. A
 * chamada de IA pode levar alguns segundos, por isso o estado de
 * "carregando" fica explícito. Em caso de sucesso, router.refresh() refaz o
 * render do Server Component da página (app/processos/[processoId]/resultado/page.tsx),
 * que busca o resultado recém-salvo em public.resultados — não precisamos
 * guardar o resultado no estado do client component.
 *
 * router.refresh() é assíncrono: ele dispara a releitura do Server Component,
 * mas não devolve uma Promise que só resolve quando o novo HTML já chegou.
 * Por isso fica dentro de um useTransition — `isPending` continua `true`
 * até o React de fato COMMITAR a árvore nova (ou seja, até a tela do
 * resultado estar pronta pra aparecer). Sem isso, soltar o estado de
 * "carregando" logo após chamar refresh() cria uma janela em que o botão
 * "Gerar Resultado" reaparece por uma fração de segundo antes do resultado
 * chegar — e um clique nessa janela parecia "não ter feito nada" até o
 * usuário clicar de novo.
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
  const [isPending, startTransition] = useTransition();
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const carregando = enviando || isPending;

  async function handleClick() {
    setEnviando(true);
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
        setEnviando(false);
        return;
      }

      setEnviando(false);
      startTransition(() => {
        router.refresh();
      });
    } catch {
      setErro("Falha de conexão. Tente novamente.");
      setEnviando(false);
    }
  }

  if (carregando) {
    return (
      <div className="print:hidden flex flex-col items-center gap-3">
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
      ? "rounded-full bg-ink px-6 py-3 text-sm font-medium text-white transition-transform duration-300 active:scale-[0.98] dark:bg-white dark:text-black"
      : "rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-50 dark:hover:border-zinc-600";

  return (
    <div className="print:hidden flex flex-col items-center gap-2">
      <button type="button" onClick={handleClick} className={classeBotao}>
        {erro ? "Tentar novamente" : label}
      </button>
      {erro && <p className="text-sm text-red-600">{erro}</p>}
    </div>
  );
}
