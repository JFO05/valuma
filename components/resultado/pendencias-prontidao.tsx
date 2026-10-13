import Link from "next/link";
import { FASE_LABELS, type FaseIntake } from "@/lib/intake/fases";
import { ancoraDoItemProntidao, type ResultadoProntidao } from "@/lib/prontidao/checklist";

const ROTULO_DIMENSAO: Record<keyof ResultadoProntidao["dimensoes"], string> = {
  financeiro: "Financeiro",
  operacional: "Operacional",
  mercado: "Mercado",
  documental: "Documental",
};

const FASE_DIMENSAO: Record<keyof ResultadoProntidao["dimensoes"], FaseIntake> = {
  financeiro: "financeiro",
  operacional: "operacao",
  mercado: "mercado",
  documental: "documentos",
};

/**
 * "O que ainda falta" (Fase 3) — resumo POR DIMENSÃO (não por campo
 * individual, ao contrário de components/resultado/pendencias-obrigatorias.tsx
 * do DEF-01): o Índice de Prontidão tem até 46 itens no total, listar cada
 * um faria a seção virar uma lista enorme. A especificação pede
 * explicitamente "pendências por dimensão, com link para a etapa
 * correspondente" — um resumo por dimensão atende isso sem sobrecarregar.
 *
 * Calculado a partir do intake ATUAL, não do resultado salvo — por isso pode
 * divergir do Índice exibido acima se o usuário editou dados desde a última
 * geração (mesmo padrão já usado no DEF-01 para os campos obrigatórios).
 */
export function PendenciasProntidao({
  processoId,
  prontidao,
}: {
  processoId: string;
  prontidao: ResultadoProntidao;
}) {
  const dimensoesComPendencia = (
    Object.keys(prontidao.dimensoes) as (keyof ResultadoProntidao["dimensoes"])[]
  )
    .map((chave) => ({ chave, ...prontidao.dimensoes[chave] }))
    .filter((dimensao) => dimensao.pendencias.length > 0);

  const dimensoesComAlerta = (
    Object.keys(prontidao.dimensoes) as (keyof ResultadoProntidao["dimensoes"])[]
  )
    .map((chave) => ({ chave, ...prontidao.dimensoes[chave] }))
    .filter((dimensao) => dimensao.alertas.length > 0);

  if (dimensoesComPendencia.length === 0 && dimensoesComAlerta.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Todas as informações usadas no Índice de Prontidão estão preenchidas.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {dimensoesComPendencia.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Pendências
          </h3>
          <ul className="flex flex-col gap-2">
            {dimensoesComPendencia.map((dimensao) => (
              <li
                key={dimensao.chave}
                className="flex flex-col gap-1 rounded-xl border border-zinc-200 p-4 text-sm dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between"
              >
                <span>
                  <strong>{ROTULO_DIMENSAO[dimensao.chave]}</strong>: faltam{" "}
                  {dimensao.pendencias.length} de {dimensao.esperados} informações
                  ({dimensao.validos} preenchidas, {dimensao.nota.toFixed(0)}%)
                </span>
                <Link
                  href={`/intake/${processoId}/${FASE_DIMENSAO[dimensao.chave]}#${ancoraDoItemProntidao(dimensao.pendencias[0])}`}
                  className="w-fit shrink-0 text-ink underline dark:text-accent"
                >
                  Completar em {FASE_LABELS[FASE_DIMENSAO[dimensao.chave]]}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {dimensoesComAlerta.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
            Alertas — informações preenchidas, mas que precisam de revisão
          </h3>
          <ul className="flex flex-col gap-2">
            {dimensoesComAlerta.map((dimensao) => (
              <li
                key={`alerta-${dimensao.chave}`}
                className="flex flex-col gap-1 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-900 dark:bg-amber-950 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="text-amber-900 dark:text-amber-200">
                  <strong>{ROTULO_DIMENSAO[dimensao.chave]}</strong>: {dimensao.alertas.length}{" "}
                  {dimensao.alertas.length === 1 ? "informação precisa" : "informações precisam"}{" "}
                  de revisão — {dimensao.alertas.map((a) => a.label).join(", ")}
                </span>
                <Link
                  href={`/intake/${processoId}/${FASE_DIMENSAO[dimensao.chave]}#${ancoraDoItemProntidao(dimensao.alertas[0])}`}
                  className="w-fit shrink-0 text-amber-900 underline dark:text-amber-200"
                >
                  Revisar em {FASE_LABELS[FASE_DIMENSAO[dimensao.chave]]}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
