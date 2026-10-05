"use client";

import { useEffect, useRef } from "react";
import { formatBRL } from "@/lib/format";
import type { ResultadoValuation } from "@/lib/valuation/types";
import type { ResultadoProntidao } from "@/lib/prontidao/checklist";
import { ValuationBreakdown } from "@/components/resultado/valuation-breakdown";

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
 * Progressive disclosure com <details>/<summary> nativos, forçado a abrir
 * durante a impressão/PDF via beforeprint/afterprint (Fase 5 do plano de
 * evolução original) — sem dependência nova.
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
      className="group flex flex-col gap-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
    >
      <summary className="print:hidden cursor-pointer text-sm font-semibold marker:content-none">
        <span className="inline-block w-4 group-open:hidden">+</span>
        <span className="hidden w-4 group-open:inline-block">−</span>{" "}
        Como chegamos a este resultado?
      </summary>
      <h3 className="hidden print:block text-sm font-semibold">
        Como chegamos a este resultado?
      </h3>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">Estimativa de Equity Value, por método</h3>
        <ValuationBreakdown resultado={resultado} />

        {aplicabilidade.consolidadoDisponivel && resultado.valuationFinal !== null ? (
          <p className="tabular-nums text-sm text-zinc-600 dark:text-zinc-400">
            Estimativa preliminar de Equity Value = {formatBRL(resultado.valuationEbitda!)} × 0,50
            + {formatBRL(resultado.valuationDcf!)} × 0,30 +{" "}
            {formatBRL(resultado.valuationPatrimonial!)} × 0,20 ={" "}
            <strong>{formatBRL(resultado.valuationFinal)}</strong>
          </p>
        ) : (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            O consolidado só é calculado quando os três métodos (Múltiplo de
            EBITDA, DCF simplificado e Patrimonial) forem aplicáveis ao mesmo
            tempo — os pesos nunca são redistribuídos entre os métodos
            restantes.
          </p>
        )}

        <p className="text-xs text-zinc-500">
          O múltiplo de 4,0x utilizado no MVP é uma premissa simplificada do
          modelo e não representa uma cotação de mercado ou múltiplo setorial
          em tempo real. O DCF simplificado projeta 5 anos a uma taxa de
          crescimento fixa de 3% a.a., descontados a 15% a.a., sem valor
          terminal/perpetuidade.
        </p>
      </div>

      <div className="flex flex-col gap-2 border-t border-zinc-200 pt-4 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Dívida líquida (usada para converter Enterprise Value em Equity Value)
        </h3>
        {resultado.analiseIA.explicabilidade ? (
          <ul className="flex flex-col gap-1 tabular-nums">
            <li>
              Enterprise Value por Múltiplos: {resultado.analiseIA.explicabilidade.evMultiplos !== null ? formatBRL(resultado.analiseIA.explicabilidade.evMultiplos) : "não aplicável"}
            </li>
            <li>
              Enterprise Value pelo DCF simplificado: {resultado.analiseIA.explicabilidade.evDcf !== null ? formatBRL(resultado.analiseIA.explicabilidade.evDcf) : "não aplicável"}
            </li>
            <li>Dívida financeira total: {formatBRL(resultado.analiseIA.explicabilidade.dividaFinanceiraTotal)}</li>
            <li>Caixa e equivalentes de caixa: {formatBRL(resultado.analiseIA.explicabilidade.caixaEquivalentes)}</li>
            <li>Dívida líquida (dívida total − caixa): {formatBRL(resultado.analiseIA.explicabilidade.dividaLiquida)}</li>
          </ul>
        ) : (
          <p>
            Detalhamento indisponível — este resultado foi gerado antes desta
            versão. Recalcule para ver o detalhamento completo.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <h3 className="text-sm font-semibold">Índice de Prontidão Informacional, por dimensão</h3>
        <ul className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-400">
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
          <strong>{prontidao.indiceGeral.toFixed(0)}%</strong>
        </p>
      </div>
    </details>
  );
}
