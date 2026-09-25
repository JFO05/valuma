"use client";

/**
 * D4 (grupo decidiu): sem biblioteca nova de PDF. Reaproveita a própria tela
 * de resultado via `window.print()` + CSS `@media print` (ver globals.css e
 * as classes `print:hidden` espalhadas nos componentes desta página) — o
 * "PDF" é o que o navegador gera ao salvar a impressão como arquivo, usando
 * exatamente os mesmos dados e cálculos já renderizados na tela, sem
 * recálculo nem segunda fonte de layout para manter sincronizada.
 */
export function BaixarPdfButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print:hidden rounded border border-zinc-300 px-4 py-2 text-sm font-medium dark:border-zinc-700"
    >
      Baixar relatório em PDF
    </button>
  );
}
