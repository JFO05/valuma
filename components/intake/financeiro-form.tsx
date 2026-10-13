"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAutosave } from "@/lib/hooks/useAutosave";
import { useFreshDadosIniciais } from "@/lib/hooks/useFreshDadosIniciais";
import { AutosaveStatusIndicator } from "@/components/intake/autosave-status";
import { IntakeNavButtons } from "@/components/intake/intake-nav-buttons";
import { DreFieldset } from "@/components/intake/dre-fieldset";
import { DividasFieldset } from "@/components/intake/dividas-fieldset";
import { MoneyInput } from "@/components/intake/money-input";
import { AjudaPopover } from "@/components/ui/ajuda-popover";
import { anosDreComDados, informadoExplicitamente } from "@/lib/valuation/types";
import {
  criarDreAnoVazio,
  financeiroSchema,
  parseFinanceiroData,
  type FinanceiroFormValues,
} from "@/lib/intake/schema-financeiro";
import { Controller, useFieldArray } from "react-hook-form";
import { ImportarExcelFinanceiro } from "@/components/intake/importar-excel-financeiro";
import type { ValoresImportadosFinanceiro } from "@/lib/intake/excel-financeiro";

const inputClass =
  "rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900";
const inputClassErro =
  "rounded border border-red-500 px-3 py-2 dark:border-red-500 dark:bg-zinc-900";

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
    setValue,
    getValues,
    trigger,
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

  // Campos mínimos desta etapa (RG-40), checados ao vivo com a mesma
  // convenção do gate oficial (lib/valuation/campos-obrigatorios.ts): o
  // EBITDA exigido é o do ano-base (último ano do DRE com dados reais), não
  // um índice fixo do array.
  const [tentouAvancar, setTentouAvancar] = useState(false);
  const anoBase = anosDreComDados(dados.dre ?? []).at(-1);
  const faltaEbitda = !anoBase || !informadoExplicitamente(anoBase.ebitda);
  const faltaPatrimonioLiquido = !informadoExplicitamente(dados.balanco?.patrimonioLiquido);
  const faltaCaixa = !informadoExplicitamente(dados.caixaEquivalentes);
  const faltaPossuiDividas = dados.possuiDividas === undefined;
  const podeAvancar =
    !faltaEbitda && !faltaPatrimonioLiquido && !faltaCaixa && !faltaPossuiDividas;

  // Única instância de useFieldArray para "dividas" e "dre" — repassada por
  // props pros respectivos fieldsets (que não criam mais a sua própria) para
  // garantir que `replace()`/`insert()` (usados pela importação de Excel
  // abaixo) atualizem a mesma lista renderizada na tela. Ver o mesmo
  // problema já corrigido nesta sessão para "dividas": duas instâncias de
  // useFieldArray para o mesmo campo não ficam garantidamente em sincronia.
  const {
    fields: dividaFields,
    append: adicionarDivida,
    remove: removerDivida,
    replace: substituirDividas,
  } = useFieldArray({ control, name: "dividas" });

  const { fields: dreFields, insert: inserirDre, remove: removerDre } = useFieldArray({
    control,
    name: "dre",
  });

  function aplicarImportacaoExcel(valores: ValoresImportadosFinanceiro) {
    // V2: cada ano importado já carrega o próprio `ano` (não é mais
    // posicional) — anos que já existem no formulário só têm os campos
    // encontrados atualizados (o resto do ano permanece como estava); anos
    // novos são inseridos na posição certa (mais recente → mais antigo).
    // `getValues` (não os `dreFields` do último render) garante que cada
    // inserção dentro deste mesmo loop enxergue o que a anterior já inseriu.
    for (const anoImportado of valores.dre) {
      if (anoImportado.ano === undefined) continue;

      const anoAtualNoForm = getValues("dre");
      const indiceExistente = anoAtualNoForm.findIndex((a) => a.ano === anoImportado.ano);

      if (indiceExistente !== -1) {
        (Object.keys(anoImportado) as (keyof typeof anoImportado)[]).forEach((campo) => {
          if (campo === "ano") return;
          setValue(`dre.${indiceExistente}.${campo}`, anoImportado[campo], { shouldDirty: true });
        });
        continue;
      }

      const novoAno = { ...criarDreAnoVazio(anoImportado.ano), ...anoImportado };
      const posicao = anoAtualNoForm.findIndex((a) => a.ano < novoAno.ano);
      inserirDre(posicao === -1 ? anoAtualNoForm.length : posicao, novoAno);
    }

    (Object.keys(valores.balanco) as (keyof typeof valores.balanco)[]).forEach((campo) => {
      setValue(`balanco.${campo}`, valores.balanco[campo], { shouldDirty: true });
    });

    if (valores.caixaEquivalentes !== undefined) {
      setValue("caixaEquivalentes", valores.caixaEquivalentes, { shouldDirty: true });
    }

    if (valores.possuiDividas !== undefined) {
      setValue("possuiDividas", valores.possuiDividas, { shouldDirty: true });
    }

    if (valores.dividas) {
      substituirDividas(valores.dividas);
    }
  }

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="flex flex-col gap-8"
    >
      <ImportarExcelFinanceiro onAplicar={aplicarImportacaoExcel} />

      <DreFieldset
        control={control}
        register={register}
        trigger={trigger}
        errors={errors}
        fields={dreFields}
        insert={inserirDre}
        remove={removerDre}
        ebitdaObrigatorioFaltando={tentouAvancar && faltaEbitda}
      />

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
              Patrimônio líquido *
              <AjudaPopover campoId="patrimonioLiquido" />
            </span>
            <MoneyInput
              id="financeiro.balanco.patrimonioLiquido"
              control={control}
              name="balanco.patrimonioLiquido"
              className={
                tentouAvancar && faltaPatrimonioLiquido ? inputClassErro : inputClass
              }
            />
            {tentouAvancar && faltaPatrimonioLiquido ? (
              <span className="text-xs text-red-600">Campo obrigatório</span>
            ) : (
              errors.balanco?.patrimonioLiquido && (
                <span className="text-xs text-red-600">
                  {errors.balanco.patrimonioLiquido.message}
                </span>
              )
            )}
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="flex items-center gap-1">
              Caixa e equivalentes de caixa *
              <AjudaPopover campoId="caixaEquivalentes" />
            </span>
            <MoneyInput
              id="financeiro.caixaEquivalentes"
              control={control}
              name="caixaEquivalentes"
              className={tentouAvancar && faltaCaixa ? inputClassErro : inputClass}
            />
            {tentouAvancar && faltaCaixa ? (
              <span className="text-xs text-red-600">Campo obrigatório</span>
            ) : (
              errors.caixaEquivalentes && (
                <span className="text-xs text-red-600">
                  {errors.caixaEquivalentes.message}
                </span>
              )
            )}
          </label>
        </div>
      </fieldset>

      <fieldset
        id="financeiro.possuiDividas"
        className={[
          "flex flex-col gap-2 rounded-lg p-3",
          tentouAvancar && faltaPossuiDividas
            ? "border border-red-500"
            : "border border-transparent",
        ].join(" ")}
      >
        <legend className="flex items-center gap-1 text-sm font-semibold">
          Possui dívidas financeiras? *
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
        {tentouAvancar && faltaPossuiDividas && (
          <span className="text-xs text-red-600">Campo obrigatório</span>
        )}
      </fieldset>

      <DividasFieldset
        control={control}
        register={register}
        errors={errors}
        fields={dividaFields}
        append={adicionarDivida}
        remove={removerDivida}
      />

      <AutosaveStatusIndicator
        status={status}
        ultimoSalvamento={ultimoSalvamento}
        onTentarNovamente={tentarNovamente}
      />
      <IntakeNavButtons
        processoId={processoId}
        faseAtual="financeiro"
        status={status}
        podeAvancar={podeAvancar}
        aoTentarAvancarBloqueado={() => setTentouAvancar(true)}
      />
    </form>
  );
}
