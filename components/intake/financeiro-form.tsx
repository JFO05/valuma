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
      <DreFieldset control={control} register={register} />

      <fieldset className="flex flex-col gap-4">
        <legend className="text-sm font-semibold">
          Balanço patrimonial (resumido)
        </legend>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <label className="flex flex-col gap-1 text-sm">
            Ativo total
            <MoneyInput
              control={control}
              name="balanco.ativoTotal"
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Ativo circulante
            <MoneyInput
              control={control}
              name="balanco.ativoCirculante"
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Passivo total
            <MoneyInput
              control={control}
              name="balanco.passivoTotal"
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Passivo circulante
            <MoneyInput
              control={control}
              name="balanco.passivoCirculante"
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="flex items-center gap-1">
              Patrimônio líquido
              <AjudaPopover campoId="patrimonioLiquido" />
            </span>
            <MoneyInput
              id="patrimonioLiquido"
              control={control}
              name="balanco.patrimonioLiquido"
              className={inputClass}
            />
          </label>
        </div>
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
