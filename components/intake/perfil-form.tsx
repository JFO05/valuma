"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAutosave } from "@/lib/hooks/useAutosave";
import { AutosaveStatusIndicator } from "@/components/intake/autosave-status";
import { SociosFieldset } from "@/components/intake/socios-fieldset";
import { syncPartners } from "@/app/intake/perfil-actions";
import {
  PORTE_LABELS,
  PORTE_OPTIONS,
  UF_OPTIONS,
  parsePerfilData,
  perfilSchema,
  type PerfilFormValues,
} from "@/lib/intake/schema-perfil";

const inputClass =
  "rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900";

export function PerfilForm({
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
    formState: { errors },
  } = useForm<PerfilFormValues>({
    resolver: zodResolver(perfilSchema),
    defaultValues: parsePerfilData(dadosIniciais),
  });

  // watch() sem argumentos: objeto novo a cada mudança de campo, é o
  // gatilho que useAutosave espera (ver lib/hooks/useAutosave.ts).
  const dados = watch();
  const { status } = useAutosave(processoId, "perfil", dados);

  // Depois que o jsonb da etapa é salvo, sincroniza a cópia normalizada de
  // sócios em public.partners (ver app/intake/perfil-actions.ts).
  useEffect(() => {
    if (status !== "salvo") return;

    syncPartners(processoId, dados.socios).catch(() => {
      // Silencioso: partners é uma cópia derivada, o jsonb continua sendo a
      // fonte de verdade caso essa sincronização falhe pontualmente.
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="flex flex-col gap-8"
    >
      <fieldset className="flex flex-col gap-4">
        <legend className="text-sm font-semibold">Dados da empresa</legend>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            Razão social
            <input {...register("razaoSocial")} className={inputClass} />
            {errors.razaoSocial && (
              <span className="text-xs text-red-600">
                {errors.razaoSocial.message}
              </span>
            )}
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Nome fantasia
            <input {...register("nomeFantasia")} className={inputClass} />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            CNPJ
            <input
              {...register("cnpj")}
              placeholder="00.000.000/0000-00"
              className={inputClass}
            />
            {errors.cnpj && (
              <span className="text-xs text-red-600">{errors.cnpj.message}</span>
            )}
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Data de fundação
            <input type="date" {...register("dataFundacao")} className={inputClass} />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Setor/segmento de atuação
            <input {...register("setor")} className={inputClass} />
            {errors.setor && (
              <span className="text-xs text-red-600">{errors.setor.message}</span>
            )}
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Porte
            <select {...register("porte")} className={inputClass}>
              {PORTE_OPTIONS.map((porte) => (
                <option key={porte} value={porte}>
                  {PORTE_LABELS[porte]}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Número de funcionários
            <input
              type="number"
              {...register("numeroFuncionarios", { valueAsNumber: true })}
              className={inputClass}
            />
            {errors.numeroFuncionarios && (
              <span className="text-xs text-red-600">
                {errors.numeroFuncionarios.message}
              </span>
            )}
          </label>

          <div className="grid grid-cols-[2fr_1fr] gap-2">
            <label className="flex flex-col gap-1 text-sm">
              Cidade
              <input {...register("cidade")} className={inputClass} />
              {errors.cidade && (
                <span className="text-xs text-red-600">
                  {errors.cidade.message}
                </span>
              )}
            </label>

            <label className="flex flex-col gap-1 text-sm">
              UF
              <select {...register("uf")} className={inputClass}>
                {UF_OPTIONS.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </fieldset>

      <SociosFieldset control={control} register={register} errors={errors} />

      <AutosaveStatusIndicator status={status} />
    </form>
  );
}
