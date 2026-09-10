import type { AutosaveStatus as AutosaveStatusValue } from "@/lib/hooks/useAutosave";

const STATUS_LABEL: Record<AutosaveStatusValue, string> = {
  idle: "",
  salvando: "Salvando...",
  salvo: "Todas as alterações salvas",
  erro: "Erro ao salvar. Ajuste algo para tentar de novo.",
};

export function AutosaveStatusIndicator({
  status,
}: {
  status: AutosaveStatusValue;
}) {
  return (
    <p className="text-sm text-zinc-500" role="status">
      {STATUS_LABEL[status]}
    </p>
  );
}
