"use client";

import {
  useFieldArray,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form";
import { MoneyInput } from "@/components/intake/money-input";
import {
  dividaVazia,
  type FinanceiroFormValues,
} from "@/lib/intake/schema-financeiro";
import { useConfirm } from "@/components/confirm-dialog";
import { AjudaPopover } from "@/components/ui/ajuda-popover";

const inputClass =
  "rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900";

export function DividasFieldset({
  control,
  register,
  errors,
}: {
  control: Control<FinanceiroFormValues>;
  register: UseFormRegister<FinanceiroFormValues>;
  errors: FieldErrors<FinanceiroFormValues>;
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "dividas",
  });
  const { confirm, dialog } = useConfirm();

  async function handleRemover(index: number) {
    if (await confirm("Remover esta dívida? Essa informação deixará de contar no Índice de Prontidão.")) {
      remove(index);
    }
  }

  return (
    <fieldset id="financeiro.dividas" className="flex flex-col gap-4">
      {dialog}
      <div className="flex items-center justify-between">
        <legend className="flex items-center gap-1 text-sm font-semibold">
          Dívidas e financiamentos
          <AjudaPopover campoId="dividas" />
        </legend>
        <button
          type="button"
          onClick={() => append(dividaVazia)}
          className="rounded border border-zinc-300 px-3 py-1 text-sm font-medium dark:border-zinc-700"
        >
          + Adicionar dívida
        </button>
      </div>

      {fields.length === 0 && (
        <p className="text-sm text-zinc-500">Nenhuma dívida adicionada ainda.</p>
      )}

      {fields.map((field, index) => (
        <div
          key={field.id}
          className="grid grid-cols-1 gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800 sm:grid-cols-[2fr_1fr_1fr_1fr_auto]"
        >
          <label className="flex flex-col gap-1 text-sm">
            Credor
            <input {...register(`dividas.${index}.credor`)} className={inputClass} />
            {errors.dividas?.[index]?.credor && (
              <span className="text-xs text-red-600">
                {errors.dividas[index]?.credor?.message}
              </span>
            )}
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Valor
            <MoneyInput
              control={control}
              name={`dividas.${index}.valor`}
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Taxa de juros (% a.a.)
            <input
              type="number"
              step="0.01"
              {...register(`dividas.${index}.taxaJurosAnual`, {
                valueAsNumber: true,
              })}
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Vencimento
            <input
              type="date"
              {...register(`dividas.${index}.vencimento`)}
              className={inputClass}
            />
            {errors.dividas?.[index]?.vencimento && (
              <span className="text-xs text-red-600">
                {errors.dividas[index]?.vencimento?.message}
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
