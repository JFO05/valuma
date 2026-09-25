"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAutosave } from "@/lib/hooks/useAutosave";
import { useFreshDadosIniciais } from "@/lib/hooks/useFreshDadosIniciais";
import { AutosaveStatusIndicator } from "@/components/intake/autosave-status";
import { VoltarDashboardButton } from "@/components/intake/voltar-dashboard-button";
import { EquipeCargosFieldset } from "@/components/intake/equipe-cargos-fieldset";
import { ClientesPrincipaisFieldset } from "@/components/intake/clientes-principais-fieldset";
import { FornecedoresFieldset } from "@/components/intake/fornecedores-fieldset";
import {
  operacaoSchema,
  parseOperacaoData,
  type OperacaoFormValues,
} from "@/lib/intake/schema-operacao";

const inputClass =
  "rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900";

export function OperacaoForm({
  processoId,
  dadosIniciais,
}: {
  processoId: string;
  dadosIniciais: Record<string, unknown>;
}) {
  const {
    register,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<OperacaoFormValues>({
    resolver: zodResolver(operacaoSchema),
    defaultValues: parseOperacaoData(dadosIniciais),
  });

  useFreshDadosIniciais(processoId, "operacao", (dados) =>
    reset(parseOperacaoData(dados)),
  );

  const dados = watch();
  const { status, ultimoSalvamento, tentarNovamente } = useAutosave(
    processoId,
    "operacao",
    dados,
  );

  return (
    <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-8">
      <fieldset className="flex flex-col gap-4">
        <legend className="text-sm font-semibold">Equipe</legend>

        <label className="flex max-w-xs flex-col gap-1 text-sm">
          Número total de funcionários
          <input
            type="number"
            {...register("numeroFuncionariosTotal", { valueAsNumber: true })}
            className={inputClass}
          />
          {errors.numeroFuncionariosTotal && (
            <span className="text-xs text-red-600">
              {errors.numeroFuncionariosTotal.message}
            </span>
          )}
        </label>

        <EquipeCargosFieldset control={control} register={register} errors={errors} />
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="text-sm font-semibold">Clientes</legend>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            Número de clientes ativos
            <input
              type="number"
              {...register("numeroClientesAtivos", { valueAsNumber: true })}
              className={inputClass}
            />
            {errors.numeroClientesAtivos && (
              <span className="text-xs text-red-600">
                {errors.numeroClientesAtivos.message}
              </span>
            )}
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Concentração dos 3 maiores clientes (% da receita)
            <input
              type="number"
              step="0.01"
              {...register("concentracaoTop3Clientes", { valueAsNumber: true })}
              className={inputClass}
            />
            {errors.concentracaoTop3Clientes && (
              <span className="text-xs text-red-600">
                {errors.concentracaoTop3Clientes.message}
              </span>
            )}
          </label>
        </div>

        <ClientesPrincipaisFieldset
          control={control}
          register={register}
          errors={errors}
        />
      </fieldset>

      <FornecedoresFieldset control={control} register={register} errors={errors} />

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-semibold">
          Processos operacionais
        </legend>
        <textarea
          {...register("processosOperacionais")}
          rows={4}
          placeholder="Descreva brevemente os principais processos/operações do negócio..."
          className={inputClass}
        />
      </fieldset>

      <AutosaveStatusIndicator
        status={status}
        ultimoSalvamento={ultimoSalvamento}
        onTentarNovamente={tentarNovamente}
      />
      <VoltarDashboardButton status={status} />
    </form>
  );
}
