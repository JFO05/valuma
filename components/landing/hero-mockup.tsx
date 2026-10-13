const DIMENSOES_DEMO = [
  { label: "Financeiro", valor: 82 },
  { label: "Operacional", valor: 68 },
  { label: "Mercado", valor: 75 },
  { label: "Documental", valor: 67 },
];

/**
 * Representação visual do produto (item 9 do redesign) baseada na interface
 * real da tela de resultado — Equity Value + Índice de Prontidão por
 * dimensão + indicação de pendências — nunca um gráfico inventado sem
 * relação com o que o sistema calcula de fato. Valores são demonstrativos
 * (marcados como exemplo), a aplicação real nunca usa este componente.
 */
export function HeroMockup() {
  return (
    <div className="relative w-full max-w-md">
      <div
        aria-hidden="true"
        className="absolute -inset-6 rounded-[2.5rem] bg-accent/10 blur-2xl"
      />
      <div className="relative rounded-[1.75rem] border border-white/10 bg-[#0f1830]/80 p-1.5 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] backdrop-blur">
        <div className="rounded-[1.5rem] bg-[#121b35] p-6">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/40">
              Resultado — exemplo
            </span>
            <span className="flex h-2 w-2 rounded-full bg-accent" />
          </div>

          <div className="mt-5 flex flex-col gap-1">
            <span className="text-xs text-white/50">
              Estimativa preliminar de Equity Value
            </span>
            <span className="text-3xl font-semibold tracking-tight text-white">
              R$ 2.450.000
            </span>
          </div>

          <div className="mt-6 flex flex-col gap-2 border-t border-white/10 pt-5">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-white/50">Prontidão para M&amp;A</span>
              <span className="text-sm font-semibold text-white">75/100</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[75%] rounded-full bg-accent" />
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-2.5">
            {DIMENSOES_DEMO.map((dimensao) => (
              <div key={dimensao.label} className="flex items-center gap-3">
                <span className="w-20 shrink-0 text-xs text-white/50">
                  {dimensao.label}
                </span>
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-white/60"
                    style={{ width: `${dimensao.valor}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400/20 text-[11px] text-amber-300">
              !
            </span>
            <span className="text-xs text-white/60">
              3 informações pendentes na dimensão Documental
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
