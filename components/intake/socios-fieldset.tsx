"use client";

import {
  useFieldArray,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form";
import {
  socioVazio,
  type PerfilFormValues,
} from "@/lib/intake/schema-perfil";
import { useConfirm } from "@/components/confirm-dialog";

const inputClass =
  "rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900";

export function SociosFieldset({
  control,
  register,
  errors,
}: {
  control: Control<PerfilFormValues>;
  register: UseFormRegister<PerfilFormValues>;
  errors: FieldErrors<PerfilFormValues>;
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "socios",
  });
  const { confirm, dialog } = useConfirm();

  async function handleRemover(index: number) {
    if (await confirm(`Remover o sócio ${index + 1}?`)) remove(index);
  }

  return (
    <fieldset className="flex flex-col gap-4">
      {dialog}
      <div className="flex items-center justify-between">
        <legend className="text-sm font-semibold">Sócios</legend>
        <button
          type="button"
          onClick={() => append(socioVazio)}
          className="rounded border border-zinc-300 px-3 py-1 text-sm font-medium dark:border-zinc-700"
        >
          + Adicionar sócio
        </button>
      </div>

      {fields.length === 0 && (
        <p className="text-sm text-zinc-500">Nenhum sócio adicionado ainda.</p>
      )}

      {fields.map((field, index) => (
        <div
          key={field.id}
          className="grid grid-cols-1 gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800 sm:grid-cols-[2fr_1fr_1fr_auto]"
        >
          <label className="flex flex-col gap-1 text-sm">
            Nome completo
            <input {...register(`socios.${index}.nome`)} className={inputClass} />
            {errors.socios?.[index]?.nome && (
              <span className="text-xs text-red-600">
                {errors.socios[index]?.nome?.message}
              </span>
            )}
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Participação (%)
            <input
              type="number"
              step="0.01"
              {...register(`socios.${index}.percentualParticipacao`, {
                valueAsNumber: true,
              })}
              className={inputClass}
            />
            {errors.socios?.[index]?.percentualParticipacao && (
              <span className="text-xs text-red-600">
                {errors.socios[index]?.percentualParticipacao?.message}
              </span>
            )}
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Cargo/função
            <input {...register(`socios.${index}.cargo`)} className={inputClass} />
            {errors.socios?.[index]?.cargo && (
              <span className="text-xs text-red-600">
                {errors.socios[index]?.cargo?.message}
              </span>
            )}
          </label>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => handleRemover(index)}
              className="rounded border border-zinc-300 px-3 py-2 text-sm font-medium text-red-600 dark:border-zinc-700"
            >
              Remover
            </button>
          </div>
        </div>
      ))}
    </fieldset>
  );
}
