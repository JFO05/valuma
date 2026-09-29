import { ancoraDoItemProntidao, type PendenciaProntidao } from "@/lib/prontidao/checklist";

/**
 * Lista as pendências do Índice de Prontidão (Fase 2) que pertencem À ETAPA
 * ATUAL, cada uma com link direto (âncora na mesma página) pro campo — parte
 * da revisão de UX fora da numeração das Fases 1-6: antes, "O que ainda
 * falta" na tela de resultado só levava pro topo da etapa (só um resumo por
 * dimensão, ver components/resultado/pendencias-prontidao.tsx), sem indicar
 * QUAL dos até ~22 campos de uma etapa como Financeiro estava faltando.
 *
 * Deliberadamente neutro (cinza, não âmbar/vermelho): diferente do DEF-01
 * (components/resultado/pendencias-obrigatorias.tsx), isso não bloqueia
 * nada — só informa o que ainda conta pro Índice de Prontidão.
 */
export function PendenciasEtapa({
  pendencias,
}: {
  pendencias: PendenciaProntidao[];
}) {
  if (pendencias.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
      <p className="font-medium text-zinc-700 dark:text-zinc-300">
        {pendencias.length === 1
          ? "1 informação desta etapa ainda não conta no Índice de Prontidão:"
          : `${pendencias.length} informações desta etapa ainda não contam no Índice de Prontidão:`}
      </p>
      <ul className="flex flex-wrap gap-x-4 gap-y-1">
        {pendencias.map((pendencia) => (
          <li key={pendencia.id}>
            <a
              href={`#${ancoraDoItemProntidao(pendencia)}`}
              className="text-zinc-600 underline dark:text-zinc-400"
            >
              {pendencia.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
