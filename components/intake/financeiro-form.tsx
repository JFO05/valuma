"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAutosave } from "@/lib/hooks/useAutosave";
import { useFreshDadosIniciais } from "@/lib/hooks/useFreshDadosIniciais";
import { AutosaveStatusIndicator } from "@/components/intake/autosave-status";
import { VoltarDashboardButton } from "@/components/intake/voltar-dashboard-button";
import { DreFieldset } from "@/components/intake/dre-fieldset";
import { DividasFieldset } from "@/components/intake/dividas-fieldset";
import { MoneyInput } from "@/components/intake/money-input";
import { AjudaPopover } from "@/components/ui/ajuda-popover";
import {
  financeiroSchema,
  parseFinanceiroData,
  type FinanceiroFormValues,
} from "@/lib/intake/schema-financeiro";
import { Controller } from "react-hook-form";

const inputClass =
  "rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900";

export function FinanceiroForm({
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
  } = useForm<FinanceiroFormValues>({
    resolver: zodResolver(financeiroSchema),
    defaultValues: parseFinanceiroData(dadosIniciais),
    // Ver comentário equivalente em perfil-form.tsx — sem isso a validação
    // Zod nunca rodava (achado DIV-03 da auditoria pós-implementação).
    mode: "onBlur",
  });

  // Corrige o usuário voltar pra esta página pelo botão Voltar/Avançar do
  // navegador com uma versão desatualizada em cache (ver
  // lib/hooks/useFreshDadosIniciais.ts).
  useFreshDadosIniciais(processoId, "financeiro", (dados) =>
    reset(parseFinanceiroData(dados)),
  );

  const dados = watch();
  const { status, ultimoSalvamento, tentarNovamente } = useAutosave(
    processoId,
    "financeiro",
    dados,
  );

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="flex flex-col gap-8"
    >
      <DreFieldset control={control} register={register} errors={errors} />

      <fieldset className="flex flex-col gap-4">
        <legend className="text-sm font-semibold">
          Balanço patrimonial (resumido)
        </legend>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <label className="flex flex-col gap-1 text-sm">
            Ativo total
            <MoneyInput
              id="financeiro.balanco.ativoTotal"
              control={control}
              name="balanco.ativoTotal"
              className={inputClass}
            />
            {errors.balanco?.ativoTotal && (
              <span className="text-xs text-red-600">
                {errors.balanco.ativoTotal.message}
              </span>
            )}
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Ativo circulante
            <MoneyInput
              id="financeiro.balanco.ativoCirculante"
              control={control}
              name="balanco.ativoCirculante"
              className={inputClass}
            />
            {errors.balanco?.ativoCirculante && (
              <span className="text-xs text-red-600">
                {errors.balanco.ativoCirculante.message}
              </span>
            )}
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Passivo total
            <MoneyInput
              id="financeiro.balanco.passivoTotal"
              control={control}
              name="balanco.passivoTotal"
              className={inputClass}
            />
            {errors.balanco?.passivoTotal && (
              <span className="text-xs text-red-600">
                {errors.balanco.passivoTotal.message}
              </span>
            )}
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Passivo circulante
            <MoneyInput
              id="financeiro.balanco.passivoCirculante"
              control={control}
              name="balanco.passivoCirculante"
              className={inputClass}
            />
            {errors.balanco?.passivoCirculante && (
              <span className="text-xs text-red-600">
                {errors.balanco.passivoCirculante.message}
              </span>
            )}
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="flex items-center gap-1">
              Patrimônio líquido
              <AjudaPopover campoId="patrimonioLiquido" />
            </span>
            <MoneyInput
              id="financeiro.balanco.patrimonioLiquido"
              control={control}
              name="balanco.patrimonioLiquido"
              className={inputClass}
            />
            {errors.balanco?.patrimonioLiquido && (
              <span className="text-xs text-red-600">
                {errors.balanco.patrimonioLiquido.message}
              </span>
            )}
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="flex items-center gap-1">
              Caixa e equivalentes de caixa
              <AjudaPopover campoId="caixaEquivalentes" />
            </span>
            <MoneyInput
              id="financeiro.caixaEquivalentes"
              control={control}
              name="caixaEquivalentes"
              className={inputClass}
            />
            {errors.caixaEquivalentes && (
              <span className="text-xs text-red-600">
                {errors.caixaEquivalentes.message}
              </span>
            )}
          </label>
        </div>
      </fieldset>

      <fieldset id="financeiro.possuiDividas" className="flex flex-col gap-2">
        <legend className="flex items-center gap-1 text-sm font-semibold">
          Possui dívidas financeiras?
          <AjudaPopover campoId="possuiDividas" />
        </legend>
        <Controller
          control={control}
          name="possuiDividas"
          render={({ field }) => (
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-1.5">
                <input
                  type="radio"
                  checked={field.value === "sim"}
                  onChange={() => field.onChange("sim")}
                />
                Sim
              </label>
              <label className="flex items-center gap-1.5">
                <input
                  type="radio"
                  checked={field.value === "nao"}
                  onChange={() => field.onChange("nao")}
                />
                Não
              </label>
            </div>
          )}
        />
      </fieldset>

      <DividasFieldset control={control} register={register} errors={errors} />

      <AutosaveStatusIndicator
        status={status}
        ultimoSalvamento={ultimoSalvamento}
        onTentarNovamente={tentarNovamente}
      />
      <VoltarDashboardButton status={status} />
    </form>
  );
}
