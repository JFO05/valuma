"use client";

import {
  useFieldArray,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form";
import {
  fornecedorVazio,
  NIVEL_DEPENDENCIA_LABELS,
  NIVEL_DEPENDENCIA_OPTIONS,
  type OperacaoFormValues,
} from "@/lib/intake/schema-operacao";

const inputClass =
  "rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900";

export function FornecedoresFieldset({
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
    name: "fornecedoresPrincipais",
  });

  return (
    <fieldset id={id} className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <legend className="text-sm font-semibold">
          Principais fornecedores
        </legend>
        <button
          type="button"
          onClick={() => append(fornecedorVazio)}
          className="rounded border border-zinc-300 px-3 py-1 text-sm font-medium dark:border-zinc-700"
        >
          + Adicionar fornecedor
        </button>
      </div>

      {fields.length === 0 && (
        <p className="text-sm text-zinc-500">
          Nenhum fornecedor adicionado ainda.
        </p>
      )}

      {fields.map((field, index) => (
        <div
          key={field.id}
          className="grid grid-cols-1 gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800 sm:grid-cols-[2fr_2fr_1fr_auto]"
        >
          <label className="flex flex-col gap-1 text-sm">
            Nome do fornecedor
            <input
              {...register(`fornecedoresPrincipais.${index}.nome`)}
              className={inputClass}
            />
            {errors.fornecedoresPrincipais?.[index]?.nome && (
              <span className="text-xs text-red-600">
                {errors.fornecedoresPrincipais[index]?.nome?.message}
              </span>
            )}
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Tipo de insumo/serviço
            <input
              {...register(`fornecedoresPrincipais.${index}.tipoInsumo`)}
              className={inputClass}
            />
            {errors.fornecedoresPrincipais?.[index]?.tipoInsumo && (
              <span className="text-xs text-red-600">
                {errors.fornecedoresPrincipais[index]?.tipoInsumo?.message}
              </span>
            )}
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Nível de dependência
            <select
              {...register(`fornecedoresPrincipais.${index}.nivelDependencia`)}
              className={inputClass}
            >
              {NIVEL_DEPENDENCIA_OPTIONS.map((nivel) => (
                <option key={nivel} value={nivel}>
                  {NIVEL_DEPENDENCIA_LABELS[nivel]}
                </option>
              ))}
            </select>
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
