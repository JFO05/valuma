"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAutosave } from "@/lib/hooks/useAutosave";
import { useFreshDadosIniciais } from "@/lib/hooks/useFreshDadosIniciais";
import { AutosaveStatusIndicator } from "@/components/intake/autosave-status";
import { VoltarDashboardButton } from "@/components/intake/voltar-dashboard-button";
import { AjudaPopover } from "@/components/ui/ajuda-popover";
import { ConcorrentesFieldset } from "@/components/intake/concorrentes-fieldset";
import { MoneyInput } from "@/components/intake/money-input";
import {
  mercadoSchema,
  parseMercadoData,
  type MercadoFormValues,
} from "@/lib/intake/schema-mercado";

const inputClass =
  "rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900";

export function MercadoForm({
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
  } = useForm<MercadoFormValues>({
    resolver: zodResolver(mercadoSchema),
    defaultValues: parseMercadoData(dadosIniciais),
  });

  useFreshDadosIniciais(processoId, "mercado", (dados) =>
    reset(parseMercadoData(dados)),
  );

  const dados = watch();
  const { status, ultimoSalvamento, tentarNovamente } = useAutosave(
    processoId,
    "mercado",
    dados,
  );

  return (
    <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-8">
      <ConcorrentesFieldset control={control} register={register} errors={errors} />

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-semibold">Posicionamento</legend>
        <textarea
          {...register("posicionamento")}
          rows={4}
          placeholder="Proposta de valor, diferenciação..."
          className={inputClass}
        />
      </fieldset>

      <label className="flex max-w-xs flex-col gap-1 text-sm">
        <span className="flex items-center gap-1">
          Tamanho de mercado estimado (TAM), se souber informar
          <AjudaPopover campoId="tamMercado" />
        </span>
        <MoneyInput
          control={control}
          name="tamMercado"
          className={inputClass}
        />
        {errors.tamMercado && (
          <span className="text-xs text-red-600">{errors.tamMercado.message}</span>
        )}
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="flex items-center gap-1 text-sm font-semibold">
          Sinergias potenciais para M&amp;A
          <AjudaPopover campoId="sinergias" />
        </legend>
        <textarea
          {...register("sinergiasPotenciais")}
          rows={4}
          placeholder="Ex: sinergias de produto, geografia, base de clientes..."
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
