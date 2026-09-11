"use client";

import {
  useFieldArray,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form";
import {
  concorrenteVazio,
  PORTE_CONCORRENTE_LABELS,
  PORTE_CONCORRENTE_OPTIONS,
  type MercadoFormValues,
} from "@/lib/intake/schema-mercado";

const inputClass =
  "rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900";

export function ConcorrentesFieldset({
  control,
  register,
  errors,
}: {
  control: Control<MercadoFormValues>;
  register: UseFormRegister<MercadoFormValues>;
  errors: FieldErrors<MercadoFormValues>;
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "concorrentes",
  });

  return (
    <fieldset className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <legend className="text-sm font-semibold">Concorrentes</legend>
        <button
          type="button"
          onClick={() => append(concorrenteVazio)}
          className="rounded border border-zinc-300 px-3 py-1 text-sm font-medium dark:border-zinc-700"
        >
          + Adicionar concorrente
        </button>
      </div>

      {fields.length === 0 && (
        <p className="text-sm text-zinc-500">
          Nenhum concorrente adicionado ainda.
        </p>
      )}

      {fields.map((field, index) => (
        <div
          key={field.id}
          className="grid grid-cols-1 gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800 sm:grid-cols-[2fr_1fr_2fr_auto]"
        >
          <label className="flex flex-col gap-1 text-sm">
            Nome do concorrente
            <input
              {...register(`concorrentes.${index}.nome`)}
              className={inputClass}
            />
            {errors.concorrentes?.[index]?.nome && (
              <span className="text-xs text-red-600">
                {errors.concorrentes[index]?.nome?.message}
              </span>
            )}
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Porte estimado
            <select
              {...register(`concorrentes.${index}.porteEstimado`)}
              className={inputClass}
            >
              {PORTE_CONCORRENTE_OPTIONS.map((porte) => (
                <option key={porte} value={porte}>
                  {PORTE_CONCORRENTE_LABELS[porte]}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Diferencial percebido
            <input
              {...register(`concorrentes.${index}.diferencialPercebido`)}
              className={inputClass}
            />
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
    </fieldset>
  );
}
