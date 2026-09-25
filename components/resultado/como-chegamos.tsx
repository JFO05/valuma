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
 * Progressive disclosure (Fase 3) com <details>/<summary> nativos — sem
 * dependência nova para um modal/accordion. Fica fechado por padrão na tela
 * (comportamento padrão do <details> sem o atributo `open`), mas é forçado a
 * abrir durante a impressão/PDF (Fase 5 — ver o efeito `beforeprint` abaixo).
 *
 * D1 (EBITDA não positivo) ainda não foi respondida pelo grupo — por isso a
 * fórmula abaixo sempre mostra os 3 métodos, sem o tratamento de "método não
 * aplicável" que a especificação da Fase 3 prevê para quando D1 for
 * decidida. DEF-01 (Fase 1) já garante que valuationEbitda/valuationDcf
 * nunca são nulos num resultado salvo, então isso não quebra hoje — só fica
 * incompleto frente ao que a Fase 3 pede.
 */
export function ComoChegamos({
  resultado,
  prontidao,
}: {
  resultado: ResultadoValuation;
  prontidao: ResultadoProntidao;
}) {
  const contribuicaoEbitda = resultado.valuationEbitda * 0.5;
  const contribuicaoDcf = resultado.valuationDcf * 0.3;
  const contribuicaoPatrimonial = resultado.valuationPatrimonial * 0.2;

  const detalhesRef = useRef<HTMLDetailsElement>(null);
  const estadoAntesDeImprimirRef = useRef(false);

  // Fase 5 (PDF via impressão): o relatório precisa mostrar esta seção
  // mesmo que o usuário nunca tenha clicado para abri-la na tela. Forçar
  // via CSS (`details:not([open])`) é frágil entre navegadores, então
  // abrimos de verdade no `beforeprint` e devolvemos ao estado anterior no
  // `afterprint`, para não alterar a experiência de quem só está navegando.
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
        <h3 className="text-sm font-semibold">Valuation, por método</h3>
        <ValuationBreakdown resultado={resultado} />
        <p className="tabular-nums text-sm text-zinc-600 dark:text-zinc-400">
          Estimativa preliminar = {formatBRL(resultado.valuationEbitda)} × 0,50
          + {formatBRL(resultado.valuationDcf)} × 0,30 +{" "}
          {formatBRL(resultado.valuationPatrimonial)} × 0,20 ={" "}
          <strong>{formatBRL(resultado.valuationFinal)}</strong>
        </p>
        <p className="text-xs text-zinc-500">
          Contribuição de cada método: Múltiplo de EBITDA{" "}
          {formatBRL(contribuicaoEbitda)}, Fluxo de Caixa Descontado{" "}
          {formatBRL(contribuicaoDcf)}, Patrimonial{" "}
          {formatBRL(contribuicaoPatrimonial)}.
        </p>
      </div>

      <div className="flex flex-col gap-3 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <h3 className="text-sm font-semibold">Índice de Prontidão, por dimensão</h3>
        <ul className="flex flex-col gap-1 text-sm text-zinc-600 dark:text-zinc-400">
          {ROTULOS_DIMENSAO.map(({ chave, label }) => {
            const dimensao = prontidao.dimensoes[chave];
            return (
              <li key={chave} className="tabular-nums">
                {label}: {dimensao.validos} de {dimensao.esperados} informações
                → {dimensao.nota}%
              </li>
            );
          })}
        </ul>
        <p className="tabular-nums text-sm text-zinc-600 dark:text-zinc-400">
          Índice Geral = ({prontidao.dimensoes.financeiro.nota}% +{" "}
          {prontidao.dimensoes.operacional.nota}% +{" "}
          {prontidao.dimensoes.mercado.nota}% +{" "}
          {prontidao.dimensoes.documental.nota}%) / 4 ={" "}
          <strong>{prontidao.indiceGeral.toFixed(0)}%</strong>
        </p>
      </div>
    </details>
  );
}
