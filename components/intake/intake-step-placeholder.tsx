"use client";

import { useState } from "react";
import { useAutosave, type AutosaveStatus } from "@/lib/hooks/useAutosave";
import type { FaseIntake } from "@/lib/intake/fases";

const STATUS_LABEL: Record<AutosaveStatus, string> = {
  idle: "",
  salvando: "Salvando...",
  salvo: "Todas as alterações salvas",
  erro: "Erro ao salvar. Ajuste algo para tentar de novo.",
};

/**
 * Placeholder do conteúdo de cada etapa. O campo de texto abaixo é só para
 * validar o autosave de ponta a ponta — os campos reais de cada fase
 * (perfil, financeiro, operacao, mercado, documentos) substituem este
 * componente inteiro, seguindo o exemplo de uso documentado em
 * lib/hooks/useAutosave.ts.
 */
export function IntakeStepPlaceholder({
  processoId,
  fase,
  dadosIniciais,
}: {
  processoId: string;
  fase: FaseIntake;
  dadosIniciais: Record<string, unknown>;
}) {
  const [notas, setNotas] = useState(
    typeof dadosIniciais.notas === "string" ? dadosIniciais.notas : "",
  );

  const { status } = useAutosave(processoId, fase, { notas });

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-dashed border-zinc-300 p-6 dark:border-zinc-700">
      <p className="text-zinc-600 dark:text-zinc-400">
        Formulário da etapa <strong>{fase}</strong> entra aqui.
      </p>

      <textarea
        value={notas}
        onChange={(e) => setNotas(e.target.value)}
        rows={4}
        placeholder="Digite algo para testar o autosave..."
        className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
      />

      <p className="text-sm text-zinc-500" role="status">
        {STATUS_LABEL[status]}
      </p>
    </div>
  );
}
