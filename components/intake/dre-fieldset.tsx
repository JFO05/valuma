"use client";

import type {
  Control,
  FieldArrayWithId,
  FieldErrors,
  UseFormRegister,
  UseFormTrigger,
} from "react-hook-form";
import { MoneyInput } from "@/components/intake/money-input";
import { AjudaPopover } from "@/components/ui/ajuda-popover";
import { CAMPOS_DRE } from "@/lib/intake/campos-financeiros";
import { criarDreAnoVazio, type FinanceiroFormValues } from "@/lib/intake/schema-financeiro";

const inputClass =
  "rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900";
const inputClassErro =
  "rounded border border-red-500 px-3 py-2 dark:border-red-500 dark:bg-zinc-900";

/**
 * DRE com anos dinâmicos (V2, seção 5 do prompt de evolução) — o usuário
 * pode adicionar/remover exercícios livremente (mínimo 1). Ao adicionar, o
 * novo ano é inserido já na posição certa (mais recente → mais antigo); ao
 * digitar manualmente um ano já usado, o erro de duplicidade (financeiroSchema)
 * aparece no próprio campo "Ano".
 */
export function DreFieldset({
  control,
  register,
  trigger,
  errors,
  fields,
  insert,
  remove,
  ebitdaObrigatorioFaltando = false,
}: {
  control: Control<FinanceiroFormValues>;
  register: UseFormRegister<FinanceiroFormValues>;
  trigger: UseFormTrigger<FinanceiroFormValues>;
  errors: FieldErrors<FinanceiroFormValues>;
  fields: FieldArrayWithId<FinanceiroFormValues, "dre">[];
  insert: (index: number, valor: FinanceiroFormValues["dre"][number]) => void;
  remove: (index: number) => void;
  /**
   * RG-40 exige o EBITDA do ano-base (o mais recente com dados, não um
   * índice fixo do array) — por isso o destaque de obrigatoriedade é em
   * todos os campos de EBITDA ao mesmo tempo, não em um deles específico.
   */
  ebitdaObrigatorioFaltando?: boolean;
}) {
  function adicionarAno() {
    const anosExistentes = fields.map((f) => f.ano);
    const sugestao = anosExistentes.length > 0 ? Math.min(...anosExistentes) - 1 : new Date().getFullYear();
    const novoAno = criarDreAnoVazio(sugestao);
    // Mantém a ordem "mais recente → mais antigo": insere o novo ano na
    // posição correta em vez de sempre no fim.
    const indiceInsercao = fields.findIndex((f) => f.ano < novoAno.ano);
    insert(indiceInsercao === -1 ? fields.length : indiceInsercao, novoAno);
  }

  const erroDuplicidade = errors.dre?.root?.message;

  return (
    <fieldset id="financeiro.dre" className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <legend className="text-sm font-semibold">DRE</legend>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            * Pelo menos um exercício precisa ter o EBITDA informado para
            gerar a análise.
          </p>
        </div>
        <button
          type="button"
          onClick={adicionarAno}
          className="shrink-0 rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-50 dark:hover:border-zinc-600"
        >
          + Adicionar outro ano
        </button>
      </div>

      {erroDuplicidade && (
        <p className="text-xs text-red-600" role="alert">
          {erroDuplicidade}
        </p>
      )}

      {fields.map((field, index) => (
        <div
          key={field.id}
          className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
        >
          <div className="flex items-end justify-between gap-3">
            <label className="flex w-32 flex-col gap-1 text-sm">
              Ano
              <input
                type="number"
                {...register(`dre.${index}.ano`, {
                  valueAsNumber: true,
                  // O refine de duplicidade vive no array "dre" como um todo
                  // (não em cada item), e o modo onBlur do react-hook-form só
                  // valida o campo-folha que perdeu o foco — sem este
                  // trigger("dre") explícito, o erro de ano repetido nunca
                  // chega a ser calculado.
                  onBlur: () => trigger("dre"),
                })}
                className={inputClass}
              />
              {errors.dre?.[index]?.ano && (
                <span className="text-xs text-red-600">{errors.dre[index]?.ano?.message}</span>
              )}
            </label>

            {fields.length > 1 && (
              <button
                type="button"
                onClick={() => remove(index)}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:border-red-300 dark:border-zinc-700"
              >
                Remover ano
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {CAMPOS_DRE.map(({ chave, label, ajudaId }) => {
              const destacarErro = chave === "ebitda" && ebitdaObrigatorioFaltando;

              return (
                <label key={chave} className="flex flex-col gap-1 text-sm">
                  <span className="flex items-center gap-1">
                    {chave === "ebitda" ? `${label} *` : label}
                    {ajudaId && <AjudaPopover campoId={ajudaId} />}
                  </span>
                  <MoneyInput
                    id={`financeiro.dre.${index}.${chave}`}
                    control={control}
                    name={`dre.${index}.${chave}`}
                    className={destacarErro ? inputClassErro : inputClass}
                  />
                  {errors.dre?.[index]?.[chave] && (
                    <span className="text-xs text-red-600">
                      {errors.dre[index]?.[chave]?.message}
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </fieldset>
  );
}
