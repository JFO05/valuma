"use client";

import {
  useFieldArray,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form";
import {
  clientePrincipalVazio,
  type OperacaoFormValues,
} from "@/lib/intake/schema-operacao";

const inputClass =
  "rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900";

export function ClientesPrincipaisFieldset({
  control,
  register,
  errors,
}: {
  control: Control<OperacaoFormValues>;
  register: UseFormRegister<OperacaoFormValues>;
  errors: FieldErrors<OperacaoFormValues>;
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "clientesPrincipais",
  });

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Principais clientes</p>
        <button
          type="button"
          onClick={() => append(clientePrincipalVazio)}
          className="rounded border border-zinc-300 px-3 py-1 text-sm font-medium dark:border-zinc-700"
        >
          + Adicionar cliente
        </button>
      </div>

      {fields.length === 0 && (
        <p className="text-sm text-zinc-500">Nenhum cliente adicionado ainda.</p>
      )}

      {fields.map((field, index) => (
        <div
          key={field.id}
          className="grid grid-cols-1 gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800 sm:grid-cols-[2fr_1fr_auto]"
        >
          <label className="flex flex-col gap-1 text-sm">
            Nome do cliente
            <input
              {...register(`clientesPrincipais.${index}.nome`)}
              className={inputClass}
            />
            {errors.clientesPrincipais?.[index]?.nome && (
              <span className="text-xs text-red-600">
                {errors.clientesPrincipais[index]?.nome?.message}
              </span>
            )}
          </label>

          <label className="flex flex-col gap-1 text-sm">
            % da receita
            <input
              type="number"
              step="0.01"
              {...register(`clientesPrincipais.${index}.percentualReceita`, {
                valueAsNumber: true,
              })}
              className={inputClass}
            />
            {errors.clientesPrincipais?.[index]?.percentualReceita && (
              <span className="text-xs text-red-600">
                {errors.clientesPrincipais[index]?.percentualReceita?.message}
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
