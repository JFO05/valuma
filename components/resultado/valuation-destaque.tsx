import { formatBRL } from "@/lib/format";
import type { MotorTipo } from "@/lib/valuation/motor";

/**
 * Rótulo/subtítulo oficiais (RG-52/RG-54). Quando nenhum método de valuation
 * é aplicável (RG-25), o consolidado é `null` — tratado como um ESTADO
 * ELEGANTE, não um erro do sistema (item 26 do redesign): mesmo peso visual
 * do card "disponível", sem vermelho/alerta, com um ícone neutro.
 *
 * V2 (Motor de Análise): quando o resultado foi gerado pelo Motor
 * Configurável, o rótulo diz isso explicitamente — "Tornar parâmetros
 * configuráveis não elimina as condições de aplicabilidade do método",
 * então o usuário precisa sempre saber qual motor produziu o número que
 * está vendo (seção 2.2 do prompt de evolução).
 */
export function ValuationDestaque({
  valor,
  motorTipo = "essencial",
}: {
  valor: number | null;
  motorTipo?: MotorTipo;
}) {
  const sufixoMotor = motorTipo === "configuravel" ? " — Motor Configurável" : "";

  if (valor === null) {
    return (
      <div className="relative overflow-hidden rounded-[1.75rem] border border-zinc-900/5 bg-white p-10 text-center dark:border-white/5 dark:bg-zinc-900">
        <div
          aria-hidden="true"
          className="glow-accent pointer-events-none absolute inset-x-0 top-0 h-40 opacity-60"
        />
        <div className="relative flex flex-col items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-100 text-lg text-zinc-400 dark:bg-zinc-800">
            ◌
          </span>
          <span className="text-lg font-semibold text-ink dark:text-zinc-50">
            Estimativa preliminar de Equity Value indisponível pelo modelo
            simplificado{sufixoMotor}
          </span>
          <p className="max-w-md text-sm text-zinc-500">
            Com os dados financeiros informados, nenhum dos métodos ativos no
            Motor pôde ser combinado em um consolidado. Isso não significa
            que a empresa não tenha valor — veja a seção &quot;Como chegamos
            a este resultado&quot; para entender exatamente o que impediu o
            cálculo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-zinc-900/5 bg-white p-10 text-center dark:border-white/5 dark:bg-zinc-900">
      <div
        aria-hidden="true"
        className="glow-accent pointer-events-none absolute inset-x-0 top-0 h-48"
      />
      <div className="relative flex flex-col items-center gap-1.5">
        <span className="text-sm font-medium text-zinc-500">
          Estimativa preliminar de Equity Value{sufixoMotor}
        </span>
        <span className="tabular-nums text-4xl font-bold tracking-tight text-ink sm:text-5xl dark:text-zinc-50">
          {formatBRL(valor)}
        </span>
        <span className="text-xs text-zinc-400">
          Estimativa preliminar do valor econômico atribuível aos sócios.
        </span>
      </div>
    </div>
  );
}
