/**
 * Índice de Prontidão para M&A (Fase 2) — NÃO é uma nota de qualidade do
 * negócio, por isso o desenho evita qualquer leitura de "bom/ruim": sem
 * gradiente vermelho-amarelo-verde nem rótulos como "Atenção/Regular/Bom"
 * (o antigo score de qualidade tinha os dois; ambos foram removidos aqui).
 * O texto de esclarecimento abaixo é o mesmo, literal, em toda tela que
 * mostrar este número — ver docs/PLANO_EVOLUCAO_MVP.md, Fase 2.
 */
export function ScoreGauge({ indiceGeral }: { indiceGeral: number }) {
  const posicao = Math.min(100, Math.max(0, indiceGeral));

  return (
    <div className="flex flex-col gap-2">
      <span className="text-4xl font-bold">{indiceGeral.toFixed(0)}%</span>

      <div className="relative h-4 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className="h-full rounded-full bg-ink dark:bg-accent"
          style={{ width: `${posicao}%` }}
        />
      </div>

      <p className="text-xs text-zinc-500">
        Percentual de preparação e estruturação das informações necessárias
        para uma análise preliminar. Não é uma avaliação da qualidade da
        empresa.
      </p>
    </div>
  );
}
