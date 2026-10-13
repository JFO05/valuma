"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAutosave } from "@/lib/hooks/useAutosave";
import { useFreshDadosIniciais } from "@/lib/hooks/useFreshDadosIniciais";
import { AutosaveStatusIndicator } from "@/components/intake/autosave-status";
import { IntakeNavButtons } from "@/components/intake/intake-nav-buttons";
import { AjudaPopover } from "@/components/ui/ajuda-popover";
import {
  motorSchema,
  parseMotorData,
  configuracaoMotorParaCalculo,
  somaPesosAtivosFormulario,
  type MotorFormValues,
} from "@/lib/intake/schema-motor";
import { configuracaoMotorValida } from "@/lib/valuation/motor";

const inputClass =
  "rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900";

/**
 * Etapa "Motor de Análise" (V2, seção 2 do prompt de evolução) — primeira
 * etapa do intake, antes de Perfil. O usuário escolhe COMO o ValuM&A vai
 * calcular este processo. Motor Essencial é o padrão (e o único motor que
 * existia até aqui, comportamento v1 inalterado); Motor Configurável permite
 * ajustar método/pesos/premissas, sem nunca remover as condições de
 * aplicabilidade (EBITDA > 0 para Múltiplos/DCF, Patrimônio Líquido > 0 para
 * Patrimonial).
 */
export function MotorForm({
  processoId,
  dadosIniciais,
}: {
  processoId: string;
  dadosIniciais: Record<string, unknown>;
}) {
  const {
    control,
    watch,
    reset,
    register,
  } = useForm<MotorFormValues>({
    resolver: zodResolver(motorSchema),
    defaultValues: parseMotorData(dadosIniciais),
    mode: "onBlur",
  });

  useFreshDadosIniciais(processoId, "motor", (dados) => reset(parseMotorData(dados)));

  const dados = watch();
  const { status, ultimoSalvamento, tentarNovamente } = useAutosave(processoId, "motor", dados);

  const [tentouAvancar, setTentouAvancar] = useState(false);

  const configuracaoCalculo = configuracaoMotorParaCalculo(dados.configuracao);
  const configuracaoValida = configuracaoMotorValida(dados.tipo, configuracaoCalculo);
  const somaPesos = somaPesosAtivosFormulario(dados.configuracao);
  const podeAvancar = dados.tipo === "essencial" || configuracaoValida;

  return (
    <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-8">
      <div>
        <h2 className="text-sm font-semibold text-ink dark:text-zinc-50">
          Como o ValuM&amp;A deve calcular este processo?
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Escolha como o ValuM&amp;A deve realizar os cálculos deste processo.
          O ValuM&amp;A não força uma fórmula a funcionar em qualquer empresa —
          cada método possui premissas e condições de aplicabilidade.
        </p>
      </div>

      <Controller
        control={control}
        name="tipo"
        render={({ field }) => (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <CardMotor
              selecionado={field.value === "essencial"}
              onSelecionar={() => field.onChange("essencial")}
              titulo="Motor Essencial"
              descricao="Utiliza as premissas simplificadas do ValuM&A. Recomendado para uma primeira análise guiada."
              indicadoPara="Quem quer uma primeira estimativa rápida, sem precisar ajustar parâmetros financeiros."
              podeAlterar="Nada — usa sempre múltiplo 4,0x, DCF com crescimento 3%/desconto 15%/5 anos, e pesos 50/30/20."
              vantagens="Simples, rápido e já validado — é a mesma metodologia usada desde a primeira versão do produto."
              limitacoes="Não se ajusta a particularidades do seu setor ou momento de mercado."
            />
            <CardMotor
              selecionado={field.value === "configuravel"}
              onSelecionar={() => field.onChange("configuravel")}
              titulo="Motor Configurável"
              descricao="Permite ajustar as principais premissas da análise. Indicado para usuários que possuem conhecimento financeiro ou orientação profissional."
              indicadoPara="Quem tem conhecimento financeiro ou orientação profissional e quer ajustar as premissas."
              podeAlterar="Quais métodos participam, o múltiplo de EBITDA, crescimento/taxa de desconto/horizonte do DCF, e os pesos de cada método."
              vantagens="Mais flexível para refletir o conhecimento que você já tem sobre o seu negócio ou setor."
              limitacoes="Exige entender o que cada parâmetro significa — cada campo tem uma ajuda contextual (ⓘ)."
            />
            <CardMotorDesabilitado />
          </div>
        )}
      />

      {dados.tipo === "configuravel" && (
        <section className="flex flex-col gap-6 rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
          <div>
            <h3 className="text-sm font-semibold text-ink dark:text-zinc-50">
              Métodos ativos e ponderação
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Tornar os parâmetros configuráveis não elimina as condições de
              aplicabilidade de cada método — um método ativado continua
              podendo ficar indisponível para o seu cenário (ex.: EBITDA ≤ 0).
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <MetodoLinha
              control={control}
              register={register}
              campoAtivo="configuracao.metodosAtivos.multiplos"
              campoPeso="configuracao.pesos.multiplos"
              label="Múltiplos (EBITDA)"
            />
            <MetodoLinha
              control={control}
              register={register}
              campoAtivo="configuracao.metodosAtivos.dcf"
              campoPeso="configuracao.pesos.dcf"
              label="DCF simplificado"
            />
            <MetodoLinha
              control={control}
              register={register}
              campoAtivo="configuracao.metodosAtivos.patrimonial"
              campoPeso="configuracao.pesos.patrimonial"
              label="Patrimonial"
            />
          </div>

          <p
            className={`text-sm font-medium ${
              configuracaoValida ? "text-ink dark:text-zinc-50" : "text-amber-700 dark:text-amber-400"
            }`}
          >
            Total da ponderação: {somaPesos.toFixed(0)}%
            {!configuracaoValida && " — os pesos dos métodos ativos precisam totalizar 100%."}
          </p>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <label className="flex flex-col gap-1 text-sm">
              <span className="flex items-center gap-1">
                Múltiplo de EBITDA <AjudaPopover campoId="motorMultiploEbitda" />
              </span>
              <input
                type="number"
                step="0.1"
                {...register("configuracao.multiploEbitda", { valueAsNumber: true })}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="flex items-center gap-1">
                Crescimento a.a. (%) <AjudaPopover campoId="motorCrescimentoAnual" />
              </span>
              <input
                type="number"
                step="0.1"
                {...register("configuracao.crescimentoAnual", { valueAsNumber: true })}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="flex items-center gap-1">
                Taxa de desconto a.a. (%) <AjudaPopover campoId="motorTaxaDesconto" />
              </span>
              <input
                type="number"
                step="0.1"
                {...register("configuracao.taxaDesconto", { valueAsNumber: true })}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="flex items-center gap-1">
                Horizonte (anos) <AjudaPopover campoId="motorHorizonteAnos" />
              </span>
              <input
                type="number"
                {...register("configuracao.horizonteAnos", { valueAsNumber: true })}
                className={inputClass}
              />
            </label>
          </div>

          {tentouAvancar && !configuracaoValida && (
            <p className="text-xs text-red-600" role="alert">
              Ative pelo menos 1 método e ajuste os pesos para totalizar 100%
              antes de continuar.
            </p>
          )}
        </section>
      )}

      <AutosaveStatusIndicator
        status={status}
        ultimoSalvamento={ultimoSalvamento}
        onTentarNovamente={tentarNovamente}
      />
      <IntakeNavButtons
        processoId={processoId}
        faseAtual="motor"
        status={status}
        podeAvancar={podeAvancar}
        aoTentarAvancarBloqueado={() => setTentouAvancar(true)}
      />
    </form>
  );
}

function CardMotor({
  selecionado,
  onSelecionar,
  titulo,
  descricao,
  indicadoPara,
  podeAlterar,
  vantagens,
  limitacoes,
}: {
  selecionado: boolean;
  onSelecionar: () => void;
  titulo: string;
  descricao: string;
  indicadoPara: string;
  podeAlterar: string;
  vantagens: string;
  limitacoes: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selecionado}
      onClick={onSelecionar}
      className={`flex flex-col gap-3 rounded-2xl border p-4 text-left transition-colors ${
        selecionado
          ? "border-accent bg-accent/5 dark:bg-accent/10"
          : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-ink dark:text-zinc-50">{titulo}</h3>
        <span
          aria-hidden
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
            selecionado ? "border-accent bg-accent" : "border-zinc-300 dark:border-zinc-700"
          }`}
        />
      </div>
      <p className="text-xs text-zinc-600 dark:text-zinc-400">{descricao}</p>
      <dl className="flex flex-col gap-1.5 text-xs text-zinc-500">
        <div>
          <dt className="font-medium text-zinc-700 dark:text-zinc-300">Para quem é</dt>
          <dd>{indicadoPara}</dd>
        </div>
        <div>
          <dt className="font-medium text-zinc-700 dark:text-zinc-300">O que pode ajustar</dt>
          <dd>{podeAlterar}</dd>
        </div>
        <div>
          <dt className="font-medium text-zinc-700 dark:text-zinc-300">Vantagens</dt>
          <dd>{vantagens}</dd>
        </div>
        <div>
          <dt className="font-medium text-zinc-700 dark:text-zinc-300">Limitações</dt>
          <dd>{limitacoes}</dd>
        </div>
      </dl>
    </button>
  );
}

function CardMotorDesabilitado() {
  return (
    <div
      aria-disabled="true"
      className="flex cursor-not-allowed flex-col gap-3 rounded-2xl border border-dashed border-zinc-200 p-4 text-left opacity-60 dark:border-zinc-800"
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-ink dark:text-zinc-50">
          Especialista <span className="font-normal text-zinc-400">— em evolução</span>
        </h3>
      </div>
      <p className="text-xs text-zinc-500">
        Modelos avançados (WACC completo, Gordon Growth, valor terminal,
        múltiplos setoriais) estão no roadmap do produto — ainda não
        disponíveis nesta versão.
      </p>
    </div>
  );
}

function MetodoLinha({
  control,
  register,
  campoAtivo,
  campoPeso,
  label,
}: {
  control: ReturnType<typeof useForm<MotorFormValues>>["control"];
  register: ReturnType<typeof useForm<MotorFormValues>>["register"];
  campoAtivo:
    | "configuracao.metodosAtivos.multiplos"
    | "configuracao.metodosAtivos.dcf"
    | "configuracao.metodosAtivos.patrimonial";
  campoPeso: "configuracao.pesos.multiplos" | "configuracao.pesos.dcf" | "configuracao.pesos.patrimonial";
  label: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <Controller
        control={control}
        name={campoAtivo}
        render={({ field }) => (
          <label className="flex w-40 shrink-0 items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={field.value}
              onChange={(e) => field.onChange(e.target.checked)}
            />
            {label}
          </label>
        )}
      />
      <label className="flex items-center gap-2 text-sm text-zinc-500">
        Peso (%)
        <input
          type="number"
          step="1"
          {...register(campoPeso, { valueAsNumber: true })}
          className={`${inputClass} w-24`}
        />
      </label>
    </div>
  );
}
