"use client";

import {
  useFieldArray,
  type Control,
  type UseFormRegister,
} from "react-hook-form";
import { MoneyInput } from "@/components/intake/money-input";
import { AjudaPopover } from "@/components/ui/ajuda-popover";
import type { FinanceiroFormValues } from "@/lib/intake/schema-financeiro";

const inputClass =
  "rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900";

const DRE_CAMPOS: {
  name: keyof FinanceiroFormValues["dre"][number];
  label: string;
  ajudaId?: string;
}[] = [
  { name: "receitaBruta", label: "Receita bruta", ajudaId: "receitaBruta" },
  { name: "deducoes", label: "Deduções" },
  { name: "receitaLiquida", label: "Receita líquida" },
  { name: "custos", label: "Custos" },
  { name: "lucroBruto", label: "Lucro bruto" },
  { name: "despesasOperacionais", label: "Despesas operacionais" },
  { name: "ebitda", label: "EBITDA", ajudaId: "ebitda" },
  { name: "lucroLiquido", label: "Lucro líquido" },
];

/**
 * Bloco fixo de 3 anos de DRE. Usa useFieldArray só para ter `field.id`
 * estável entre renders (não há adicionar/remover — a lista de anos é fixa).
 */
export function DreFieldset({
  control,
  register,
}: {
  control: Control<FinanceiroFormValues>;
  register: UseFormRegister<FinanceiroFormValues>;
}) {
  const { fields } = useFieldArray({ control, name: "dre" });

  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="text-sm font-semibold">
        DRE — últimos 3 anos
      </legend>

      {fields.map((field, index) => (
        <div
          key={field.id}
          className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
        >
          <label className="flex w-32 flex-col gap-1 text-sm">
            Ano
            <input
              type="number"
              {...register(`dre.${index}.ano`, { valueAsNumber: true })}
              className={inputClass}
            />
          </label>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {DRE_CAMPOS.map(({ name, label, ajudaId }) => (
              <label key={name} className="flex flex-col gap-1 text-sm">
                <span className="flex items-center gap-1">
                  {label}
                  {ajudaId && <AjudaPopover campoId={ajudaId} />}
                </span>
                <MoneyInput
                  id={`financeiro.dre.${index}.${name}`}
                  control={control}
                  name={`dre.${index}.${name}`}
                  className={inputClass}
                />
              </label>
            ))}
          </div>
        </div>
      ))}
    </fieldset>
  );
}
