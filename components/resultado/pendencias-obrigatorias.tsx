import Link from "next/link";
import { FASE_LABELS } from "@/lib/intake/fases";
import type { PendenciaObrigatoria } from "@/lib/valuation/campos-obrigatorios";

/**
 * Lista exatamente o que falta para liberar "Gerar Resultado" (DEF-01),
 * cada item linkando para a etapa E o campo específico (âncora "#slug" —
 * os inputs correspondentes têm esse `id` nos formulários). Reaproveitado
 * tanto quando ainda não há resultado (ResultadoVazio) quanto quando já
 * existe um resultado mas dados obrigatórios foram apagados depois.
 */
export function PendenciasObrigatorias({
  processoId,
  pendencias,
}: {
  processoId: string;
  pendencias: PendenciaObrigatoria[];
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-left dark:border-amber-900 dark:bg-amber-950">
      <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
        Ainda falta preencher {pendencias.length === 1 ? "1 informação" : `${pendencias.length} informações`}{" "}
        obrigatória{pendencias.length === 1 ? "" : "s"} para gerar o resultado:
      </p>
      <ul className="flex flex-col gap-1.5">
        {pendencias.map((pendencia) => (
          <li key={`${pendencia.fase}-${pendencia.campo}`}>
            <Link
              href={`/intake/${processoId}/${pendencia.fase}#${pendencia.campo}`}
              className="text-sm text-amber-900 underline dark:text-amber-200"
            >
              {pendencia.label} — etapa {FASE_LABELS[pendencia.fase]}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
