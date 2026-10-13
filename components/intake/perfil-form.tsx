"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAutosave } from "@/lib/hooks/useAutosave";
import { useFreshDadosIniciais } from "@/lib/hooks/useFreshDadosIniciais";
import { AutosaveStatusIndicator } from "@/components/intake/autosave-status";
import { IntakeNavButtons } from "@/components/intake/intake-nav-buttons";
import { SociosFieldset } from "@/components/intake/socios-fieldset";
import { syncPartners, atualizarNomeEmpresa } from "@/app/(app)/intake/perfil-actions";
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
const inputClassErro =
  "rounded border border-red-500 px-3 py-2 dark:border-red-500 dark:bg-zinc-900";

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
    reset,
    formState: { errors },
  } = useForm<PerfilFormValues>({
    resolver: zodResolver(perfilSchema),
    defaultValues: parsePerfilData(dadosIniciais),
    // Sem handleSubmit (o form nunca "envia" — autosave salva o rascunho o
    // tempo todo), então o padrão `mode: "onSubmit"` do RHF nunca dispararia
    // validação nenhuma. `onBlur` valida ao sair de um campo, sem exigir
    // 100% de preenchimento nem bloquear a navegação entre etapas (achado
    // DIV-03 da auditoria pós-implementação).
    mode: "onBlur",
  });

  // Corrige o caso do usuário voltar pra esta página pelo botão
  // Voltar/Avançar do navegador com uma versão desatualizada em cache (ver
  // comentário em lib/hooks/useFreshDadosIniciais.ts).
  useFreshDadosIniciais(processoId, "perfil", (dados) =>
    reset(parsePerfilData(dados)),
  );

  // watch() sem argumentos: objeto novo a cada mudança de campo, é o
  // gatilho que useAutosave espera (ver lib/hooks/useAutosave.ts).
  const dados = watch();
  const { status, ultimoSalvamento, tentarNovamente } = useAutosave(
    processoId,
    "perfil",
    dados,
  );

  // Campos mínimos desta etapa (RG-40: razão social e setor) — checados ao
  // vivo (não a partir do último estado salvo) para o botão "Próximo" nunca
  // ficar um passo atrás do que o usuário acabou de digitar. `tentouAvancar`
  // só vira true depois do primeiro clique em "Próximo" sem sucesso — antes
  // disso o formulário fica limpo, sem vermelho num form ainda vazio.
  const [tentouAvancar, setTentouAvancar] = useState(false);
  const faltaRazaoSocial = !dados.razaoSocial?.trim();
  const faltaSetor = !dados.setor?.trim();
  const podeAvancar = !faltaRazaoSocial && !faltaSetor;

  // Depois que o jsonb da etapa é salvo: sincroniza a cópia normalizada de
  // sócios em public.partners, e atualiza processos.nome_empresa com a
  // razão social (esse campo começa como "Novo processo — DD/MM" e não muda
  // sozinho — ver app/intake/perfil-actions.ts).
  useEffect(() => {
    if (status !== "salvo") return;

    syncPartners(processoId, dados.socios).catch(() => {
      // Silencioso: partners é uma cópia derivada, o jsonb continua sendo a
      // fonte de verdade caso essa sincronização falhe pontualmente.
    });

    atualizarNomeEmpresa(processoId, dados.razaoSocial).catch(() => {
      // Silencioso pelo mesmo motivo: nome_empresa é só um espelho do
      // razaoSocial do jsonb, não a fonte de verdade.
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
            Razão social *
            <input
              id="razaoSocial"
              {...register("razaoSocial")}
              className={tentouAvancar && faltaRazaoSocial ? inputClassErro : inputClass}
            />
            {tentouAvancar && faltaRazaoSocial ? (
              <span className="text-xs text-red-600">Campo obrigatório</span>
            ) : (
              errors.razaoSocial && (
                <span className="text-xs text-red-600">
                  {errors.razaoSocial.message}
                </span>
              )
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
            Setor/segmento de atuação *
            <input
              id="setor"
              {...register("setor")}
              className={tentouAvancar && faltaSetor ? inputClassErro : inputClass}
            />
            {tentouAvancar && faltaSetor ? (
              <span className="text-xs text-red-600">Campo obrigatório</span>
            ) : (
              errors.setor && (
                <span className="text-xs text-red-600">{errors.setor.message}</span>
              )
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

      <AutosaveStatusIndicator
        status={status}
        ultimoSalvamento={ultimoSalvamento}
        onTentarNovamente={tentarNovamente}
      />
      <IntakeNavButtons
        processoId={processoId}
        faseAtual="perfil"
        status={status}
        podeAvancar={podeAvancar}
        aoTentarAvancarBloqueado={() => setTentouAvancar(true)}
      />
    </form>
  );
}
