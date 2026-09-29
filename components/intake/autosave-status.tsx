import type { AutosaveStatus as AutosaveStatusValue } from "@/lib/hooks/useAutosave";

function formatarHora(data: Date): string {
  return data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

/**
 * `ultimoSalvamento`/`onTentarNovamente` são opcionais: o formulário de
 * Documentos (components/intake/documentos-form.tsx) não usa o hook
 * useAutosave (tem seu próprio controle de status por upload) e continua
 * passando só `status`, sem quebrar.
 */
export function AutosaveStatusIndicator({
  status,
  ultimoSalvamento,
  onTentarNovamente,
}: {
  status: AutosaveStatusValue;
  ultimoSalvamento?: Date | null;
  onTentarNovamente?: () => void;
}) {
  if (status === "idle") {
    return <p className="text-sm text-zinc-500" role="status" />;
  }

  if (status === "salvando") {
    return (
      <p className="text-sm text-zinc-500" role="status">
        Salvando...
      </p>
    );
  }

  if (status === "salvo") {
    return (
      <p className="flex items-center gap-1 text-sm text-zinc-500" role="status">
        <span aria-hidden="true" className="text-green-600 dark:text-green-500">
          ✓
        </span>
        {ultimoSalvamento
          ? `Salvo às ${formatarHora(ultimoSalvamento)}`
          : "Todas as alterações salvas"}
      </p>
    );
  }

  return (
    <p className="text-sm text-red-600" role="status">
      Erro ao salvar.{" "}
      {onTentarNovamente ? (
        <button
          type="button"
          onClick={onTentarNovamente}
          className="font-medium underline"
        >
          Tentar novamente
        </button>
      ) : (
        "Ajuste algo para tentar de novo."
      )}
    </p>
  );
}
