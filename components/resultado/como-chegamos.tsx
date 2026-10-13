"use client";

import { useEffect, useRef } from "react";
import { formatBRL } from "@/lib/format";
import type { ResultadoValuation } from "@/lib/valuation/types";
import type { ResultadoProntidao } from "@/lib/prontidao/checklist";
import { MOTOR_SNAPSHOT_LEGADO, type MotorSnapshot } from "@/lib/valuation/motor";
import { ValuationBreakdown } from "@/components/resultado/valuation-breakdown";

const NOMES_METODO: Record<"multiplos" | "dcf" | "patrimonial", string> = {
  multiplos: "Múltiplos",
  dcf: "DCF simplificado",
  patrimonial: "Patrimonial",
};

function metodosAtivosDoSnapshot(snapshot: MotorSnapshot): string {
  const ativos = (Object.keys(snapshot.configuracao.metodosAtivos) as (keyof typeof NOMES_METODO)[]).filter(
    (metodo) => snapshot.configuracao.metodosAtivos[metodo],
  );
  return ativos.length > 0 ? ativos.map((m) => NOMES_METODO[m]).join(" + ") : "Nenhum método ativo";
}

const ROTULOS_DIMENSAO: { chave: keyof ResultadoProntidao["dimensoes"]; label: string }[] = [
  { chave: "financeiro", label: "Financeiro" },
  { chave: "operacional", label: "Operacional" },
  { chave: "mercado", label: "Mercado" },
  { chave: "documental", label: "Documental" },
];

/**
 * Explicabilidade (RG-52) — detalhamento por método (incluindo Enterprise
 * Value bruto, dívida líquida e a conversão para Equity Value, RG-16/RG-17)
 * e por dimensão do Índice de Prontidão. Métodos não aplicáveis (RG-20/RG-21)
 * mostram o motivo, nunca um valor calculado silenciosamente.
 *
 * Progressive disclosure com <details>/<summary> nativos (item 26.4 do
 * redesign: resumo inicialmente legível, detalhes sob demanda — sem
 * despejar fórmulas na tela de cara), forçado a abrir durante a
 * impressão/PDF via beforeprint/afterprint — sem dependência nova.
 */
export function ComoChegamos({
  resultado,
  prontidao,
}: {
  resultado: ResultadoValuation;
  prontidao: ResultadoProntidao;
}) {
  const detalhesRef = useRef<HTMLDetailsElement>(null);
  const estadoAntesDeImprimirRef = useRef(false);

  useEffect(() => {
    function aoAntesDeImprimir() {
      if (!detalhesRef.current) return;
      estadoAntesDeImprimirRef.current = detalhesRef.current.open;
      detalhesRef.current.open = true;
    }
    function aoDepoisDeImprimir() {
      if (!detalhesRef.current) return;
      detalhesRef.current.open = estadoAntesDeImprimirRef.current;
    }

    window.addEventListener("beforeprint", aoAntesDeImprimir);
    window.addEventListener("afterprint", aoDepoisDeImprimir);
    return () => {
      window.removeEventListener("beforeprint", aoAntesDeImprimir);
      window.removeEventListener("afterprint", aoDepoisDeImprimir);
    };
  }, []);

  const { aplicabilidade } = resultado;

  return (
    <details
      ref={detalhesRef}
      className="group rounded-2xl border border-zinc-900/5 bg-white p-6 dark:border-white/5 dark:bg-zinc-900"
    >
      <summary className="print:hidden flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-ink marker:content-none dark:text-zinc-50">
        <span className="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-300 text-xs group-open:hidden dark:border-zinc-700">
          +
        </span>
        <span className="hidden h-6 w-6 items-center justify-center rounded-full border border-zinc-300 text-xs group-open:flex dark:border-zinc-700">
          −
        </span>
        Como chegamos a este resultado?
      </summary>
      <h3 className="hidden print:block text-sm font-semibold">
        Como chegamos a este resultado?
      </h3>

      <div className="mt-6 flex flex-col gap-3 border-b border-zinc-100 pb-6 dark:border-zinc-800">
        <h4 className="text-sm font-semibold text-ink dark:text-zinc-50">Motor utilizado</h4>
        {(() => {
          const snapshot = resultado.motorSnapshot ?? MOTOR_SNAPSHOT_LEGADO;
          const { configuracao } = snapshot;
          return (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-zinc-600 tabular-nums sm:grid-cols-4 dark:text-zinc-400">
              <div>
                <dt className="text-xs text-zinc-400">Motor</dt>
                <dd className="font-medium text-ink dark:text-zinc-50">
                  {snapshot.tipo === "configuravel" ? "Configurável" : "Essencial"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-400">Métodos</dt>
                <dd>{metodosAtivosDoSnapshot(snapshot)}</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-400">Múltiplo</dt>
                <dd>{configuracao.multiploEbitda.toFixed(1)}x</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-400">Crescimento</dt>
                <dd>{(configuracao.crescimentoAnual * 100).toFixed(0)}%</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-400">Taxa de desconto</dt>
                <dd>{(configuracao.taxaDesconto * 100).toFixed(0)}%</dd>
              </div>
              <div>
                <dt className="text-xs text-zinc-400">Horizonte</dt>
                <dd>{configuracao.horizonteAnos} anos</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-zinc-400">Ponderação</dt>
                <dd>
                  {configuracao.metodosAtivos.multiplos && `Múltiplos: ${(configuracao.pesos.multiplos * 100).toFixed(0)}% `}
                  {configuracao.metodosAtivos.dcf && `DCF: ${(configuracao.pesos.dcf * 100).toFixed(0)}% `}
                  {configuracao.metodosAtivos.patrimonial && `Patrimonial: ${(configuracao.pesos.patrimonial * 100).toFixed(0)}%`}
                </dd>
              </div>
            </dl>
          );
        })()}
        {!resultado.motorSnapshot && (
          <p className="text-xs text-zinc-500">
            Resultado gerado antes do Motor de Análise existir — tratado como
            Motor Essencial, sem alterar nenhum número já calculado.
          </p>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-4">
        <h4 className="text-sm font-semibold text-ink dark:text-zinc-50">
          Estimativa de Equity Value, por método
        </h4>
        <ValuationBreakdown resultado={resultado} />

        {(() => {
          const snapshot = resultado.motorSnapshot ?? MOTOR_SNAPSHOT_LEGADO;
          const { metodosAtivos, pesos } = snapshot.configuracao;
          const parcelas: string[] = [];
          if (metodosAtivos.multiplos) {
            parcelas.push(`${formatBRL(resultado.valuationEbitda ?? 0)} × ${pesos.multiplos.toFixed(2)}`);
          }
          if (metodosAtivos.dcf) {
            parcelas.push(`${formatBRL(resultado.valuationDcf ?? 0)} × ${pesos.dcf.toFixed(2)}`);
          }
          if (metodosAtivos.patrimonial) {
            parcelas.push(`${formatBRL(resultado.valuationPatrimonial ?? 0)} × ${pesos.patrimonial.toFixed(2)}`);
          }

          return aplicabilidade.consolidadoDisponivel && resultado.valuationFinal !== null ? (
            <p className="tabular-nums text-sm text-zinc-600 dark:text-zinc-400">
              Estimativa preliminar de Equity Value = {parcelas.join(" + ")} ={" "}
              <strong className="text-ink dark:text-zinc-50">{formatBRL(resultado.valuationFinal)}</strong>
            </p>
          ) : (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              O consolidado só é calculado quando TODOS os métodos ativados no
              Motor ({metodosAtivosDoSnapshot(snapshot)}) forem aplicáveis ao
              mesmo tempo — os pesos nunca são redistribuídos entre os
              métodos restantes, e um método só fica de fora do consolidado
              se estiver desativado ou indisponível para este cenário.
            </p>
          );
        })()}

        <p className="text-xs text-zinc-500">
          {(() => {
            const snapshot = resultado.motorSnapshot ?? MOTOR_SNAPSHOT_LEGADO;
            const { configuracao } = snapshot;
            const prefixo =
              snapshot.tipo === "configuravel"
                ? "Este resultado foi gerado pelo Motor Configurável, com premissas ajustadas pelo usuário — não são padrões universais de mercado."
                : "O múltiplo utilizado é uma premissa simplificada do MVP (Motor Essencial) e não representa uma cotação de mercado ou múltiplo setorial em tempo real.";
            return `${prefixo} Múltiplo: ${configuracao.multiploEbitda.toFixed(1)}x. DCF simplificado: ${configuracao.horizonteAnos} anos, crescimento de ${(configuracao.crescimentoAnual * 100).toFixed(0)}% a.a., descontado a ${(configuracao.taxaDesconto * 100).toFixed(0)}% a.a., sem valor terminal/perpetuidade.`;
          })()}
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3 border-t border-zinc-100 pt-6 dark:border-zinc-800">
        <h4 className="text-sm font-semibold text-ink dark:text-zinc-50">
          Dívida líquida (usada para converter Enterprise Value em Equity Value)
        </h4>
        {resultado.analiseIA.explicabilidade ? (
          <ul className="flex flex-col gap-1.5 text-sm text-zinc-600 tabular-nums dark:text-zinc-400">
            <li>
              Enterprise Value por Múltiplos:{" "}
              {resultado.analiseIA.explicabilidade.evMultiplos !== null
                ? formatBRL(resultado.analiseIA.explicabilidade.evMultiplos)
                : "não aplicável"}
            </li>
            <li>
              Enterprise Value pelo DCF simplificado:{" "}
              {resultado.analiseIA.explicabilidade.evDcf !== null
                ? formatBRL(resultado.analiseIA.explicabilidade.evDcf)
                : "não aplicável"}
            </li>
            <li>Dívida financeira total: {formatBRL(resultado.analiseIA.explicabilidade.dividaFinanceiraTotal)}</li>
            <li>Caixa e equivalentes de caixa: {formatBRL(resultado.analiseIA.explicabilidade.caixaEquivalentes)}</li>
            <li>Dívida líquida (dívida total − caixa): {formatBRL(resultado.analiseIA.explicabilidade.dividaLiquida)}</li>
          </ul>
        ) : (
          <p className="text-sm text-zinc-500">
            Detalhamento indisponível — este resultado foi gerado antes desta
            versão. Recalcule para ver o detalhamento completo.
          </p>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3 border-t border-zinc-100 pt-6 dark:border-zinc-800">
        <h4 className="text-sm font-semibold text-ink dark:text-zinc-50">
          Índice de Prontidão Informacional, por dimensão
        </h4>
        <ul className="flex flex-col gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
          {ROTULOS_DIMENSAO.map(({ chave, label }) => {
            const dimensao = prontidao.dimensoes[chave];
            return (
              <li key={chave} className="tabular-nums">
                {label}: {dimensao.validos} de {dimensao.esperados} informações
                → {dimensao.nota.toFixed(0)}%
                {dimensao.alertas.length > 0 && (
                  <span className="text-amber-700 dark:text-amber-400">
                    {" "}
                    ({dimensao.alertas.length} com alerta)
                  </span>
                )}
              </li>
            );
          })}
        </ul>
        <p className="tabular-nums text-sm text-zinc-600 dark:text-zinc-400">
          Índice Geral = ({prontidao.dimensoes.financeiro.nota.toFixed(0)}% +{" "}
          {prontidao.dimensoes.operacional.nota.toFixed(0)}% +{" "}
          {prontidao.dimensoes.mercado.nota.toFixed(0)}% +{" "}
          {prontidao.dimensoes.documental.nota.toFixed(0)}%) / 4 ={" "}
          <strong className="text-ink dark:text-zinc-50">{prontidao.indiceGeral.toFixed(0)}%</strong>
        </p>
      </div>
    </details>
  );
}
