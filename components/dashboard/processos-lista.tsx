"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { Menu } from "@/components/ui/menu";
import { useConfirm } from "@/components/confirm-dialog";
import { excluirProcesso } from "@/app/(app)/dashboard/actions";
import { FASES_INTAKE } from "@/lib/intake/fases";
import { formatBRL } from "@/lib/format";

export interface ProcessoResumo {
  id: string;
  nomeEmpresa: string;
  status: string;
  atualizadoEm: string;
  preenchidas: number;
  completo: boolean;
  valuationFinal: number | null;
  indiceGeral: number | null;
}

/**
 * Fase 4.3: cards de processo com menu de ações "⋮" (em vez dos 2 botões
 * sempre visíveis + nenhuma forma de excluir, que era o estado anterior) —
 * resolve o problema concreto de não existir jeito nenhum de limpar um
 * processo de teste/errado da lista (achado da auditoria de heurísticas,
 * Fase 0, severidade 3).
 */
export function ProcessosLista({ processos }: { processos: ProcessoResumo[] }) {
  const router = useRouter();
  const { confirm, dialog } = useConfirm();
  const [mensagem, setMensagem] = useState<string | null>(null);

  async function handleExcluir(processo: ProcessoResumo) {
    const confirmado = await confirm({
      titulo: "Excluir este processo?",
      mensagem: "Esta ação não poderá ser desfeita.",
      confirmarLabel: "Excluir",
    });
    if (!confirmado) return;

    const resultado = await excluirProcesso(processo.id);

    if (!resultado.success) {
      setMensagem(`Não foi possível excluir "${processo.nomeEmpresa}": ${resultado.error}`);
      return;
    }

    setMensagem(`"${processo.nomeEmpresa}" foi excluído.`);
    router.refresh();
  }

  if (processos.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700">
        <p className="text-sm text-zinc-500">Nenhum processo criado ainda.</p>
        <p className="text-sm text-zinc-500">
          Clique em &quot;Novo Valuation&quot; acima para começar o intake da
          sua primeira empresa.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {dialog}

      {mensagem && (
        <p
          role="status"
          className="rounded border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
        >
          {mensagem}
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {processos.map((processo) => {
          // Card inteiro clicável (não só o menu "⋮"): vai direto pro
          // resultado quando já existe um, ou continua o preenchimento
          // quando ainda não existe — mesmo destino que o item
          // correspondente do menu já usava, só acessível de mais um jeito.
          const destino = processo.completo
            ? `/processos/${processo.id}/resultado`
            : `/intake/${processo.id}/perfil`;

          return (
            <li
              key={processo.id}
              className="relative flex items-center justify-between gap-3 rounded-lg border border-zinc-200 p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
            >
              <Link
                href={destino}
                className="absolute inset-0 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink dark:focus-visible:outline-accent"
                aria-label={
                  processo.completo
                    ? `Ver resultado de ${processo.nomeEmpresa}`
                    : `Continuar preenchimento de ${processo.nomeEmpresa}`
                }
              />

              <div className="flex flex-col gap-1">
                <p className="font-medium">{processo.nomeEmpresa}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={processo.status} />
                  {!processo.completo && (
                    <span className="text-xs text-zinc-500">
                      {processo.preenchidas} de {FASES_INTAKE.length} etapas
                      preenchidas
                    </span>
                  )}
                  <span className="text-xs text-zinc-400">
                    Atualizado em{" "}
                    {new Date(processo.atualizadoEm).toLocaleDateString("pt-BR")}
                  </span>
                </div>

                {/* Prévia do resultado (revisão de UX, fora da numeração das
                    Fases 1-6) — deliberadamente pequena e no mesmo tom de
                    cinza do resto do card (não um número em destaque), e com
                    "preliminar" explícito: o card não repete o disclaimer
                    inteiro da tela de resultado, mas evita a leitura de
                    "nota de qualidade da empresa" que o Índice de Prontidão
                    trabalha pra afastar desde a Fase 2. Só aparece quando
                    existe mesmo um resultado gerado (não usa `completo`, que
                    é sobre o intake, não sobre o resultado). */}
                {processo.valuationFinal !== null && processo.indiceGeral !== null && (
                  <p className="text-xs text-zinc-500">
                    Estimativa preliminar: {formatBRL(processo.valuationFinal)}
                    {" · "}
                    Prontidão: {processo.indiceGeral.toFixed(0)}%
                  </p>
                )}
              </div>

              <div className="relative z-10">
                <Menu
                  label={`Mais ações de ${processo.nomeEmpresa}`}
                  itens={[
                    {
                      label: processo.completo ? "Editar dados" : "Continuar preenchimento",
                      href: `/intake/${processo.id}/perfil`,
                    },
                    ...(processo.completo
                      ? [{ label: "Ver resultado", href: `/processos/${processo.id}/resultado` }]
                      : []),
                    {
                      label: "Excluir processo",
                      destrutivo: true,
                      onClick: () => handleExcluir(processo),
                    },
                  ]}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
