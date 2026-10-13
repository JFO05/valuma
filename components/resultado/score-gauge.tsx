/**
 * Índice de Prontidão para M&A — NÃO é uma nota de qualidade do negócio,
 * por isso o desenho evita qualquer leitura de "bom/ruim" ou aparência
 * gamificada (item 26/27 do redesign): sem emblemas, sem cores de
 * "sucesso/fracasso" no número principal, sem confete. O texto de
 * esclarecimento abaixo é o mesmo, literal, em toda tela que mostrar este
 * número.
 */
export function ScoreGauge({ indiceGeral }: { indiceGeral: number }) {
  const posicao = Math.min(100, Math.max(0, indiceGeral));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-bold tabular-nums text-ink dark:text-zinc-50">
          {indiceGeral.toFixed(0)}%
        </span>
        <span className="text-sm text-zinc-500">de preparação informacional</span>
      </div>

      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div
          className="h-full rounded-full bg-ink transition-[width] duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] dark:bg-accent"
          style={{ width: `${posicao}%` }}
        />
      </div>

      <p className="text-xs text-zinc-500">
        O índice representa o nível de disponibilidade, estruturação e
        validade básica das informações necessárias para uma análise
        preliminar. Ele não representa a qualidade absoluta da empresa nem
        certifica a veracidade das informações.
      </p>
    </div>
  );
}
