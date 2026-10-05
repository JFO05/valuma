"use client";

import {
  useFieldArray,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form";
import {
  cargoEquipeVazio,
  type OperacaoFormValues,
} from "@/lib/intake/schema-operacao";

const inputClass =
  "rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900";

export function EquipeCargosFieldset({
  id,
  control,
  register,
  errors,
}: {
  id?: string;
  control: Control<OperacaoFormValues>;
  register: UseFormRegister<OperacaoFormValues>;
  errors: FieldErrors<OperacaoFormValues>;
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "cargosEquipe",
  });

  return (
    <div id={id} className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Principais cargos/áreas</p>
        <button
          type="button"
          onClick={() => append(cargoEquipeVazio)}
          className="rounded border border-zinc-300 px-3 py-1 text-sm font-medium dark:border-zinc-700"
        >
          + Adicionar cargo
        </button>
      </div>

      {fields.length === 0 && (
        <p className="text-sm text-zinc-500">Nenhum cargo adicionado ainda.</p>
      )}

      {fields.map((field, index) => (
        <div
          key={field.id}
          className="grid grid-cols-1 gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800 sm:grid-cols-[2fr_1fr_auto]"
        >
          <label className="flex flex-col gap-1 text-sm">
            Cargo/área
            <input
              {...register(`cargosEquipe.${index}.cargo`)}
              className={inputClass}
            />
            {errors.cargosEquipe?.[index]?.cargo && (
              <span className="text-xs text-red-600">
                {errors.cargosEquipe[index]?.cargo?.message}
              </span>
            )}
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Quantidade de pessoas
            <input
              type="number"
              {...register(`cargosEquipe.${index}.quantidade`, {
                valueAsNumber: true,
              })}
              className={inputClass}
            />
            {errors.cargosEquipe?.[index]?.quantidade && (
              <span className="text-xs text-red-600">
                {errors.cargosEquipe[index]?.quantidade?.message}
              </span>
            )}
          </label>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => remove(index)}
              className="rounded border border-zinc-300 px-3 py-2 text-sm font-medium text-red-600 dark:border-zinc-700"
            >
              Remover
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
