/**
 * Optei por uma barra segmentada em vez de um velocímetro/gauge circular:
 * mesmo efeito visual (posição numa escala de 0-100 com zonas coloridas),
 * sem precisar de SVG/matemática de arco nem de uma lib de gráficos nova.
 */
export function ScoreGauge({ score }: { score: number }) {
  const posicao = Math.min(100, Math.max(0, score));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-bold">{score.toFixed(0)}</span>
        <span className="text-zinc-500">/ 100</span>
      </div>

      <div className="relative h-4 w-full overflow-hidden rounded-full bg-gradient-to-r from-red-400 via-yellow-400 to-green-400">
        <div
          className="absolute top-0 h-full w-1 -translate-x-1/2 bg-black dark:bg-white"
          style={{ left: `${posicao}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-zinc-500">
        <span>Atenção</span>
        <span>Regular</span>
        <span>Bom</span>
      </div>
    </div>
  );
}
