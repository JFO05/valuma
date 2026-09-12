import { createClient } from "@/lib/supabase/server";
import { parsePerfilData } from "@/lib/intake/schema-perfil";
import { parseFinanceiroData } from "@/lib/intake/schema-financeiro";
import { parseOperacaoData } from "@/lib/intake/schema-operacao";
import { parseMercadoData } from "@/lib/intake/schema-mercado";
import { parseDocumentosData } from "@/lib/intake/schema-documentos";
import type { DadosProcesso } from "./types";

/**
 * Busca as 5 fases do intake de um processo (RLS garante que só retorna se o
 * processo pertencer ao usuário da sessão atual) e devolve um objeto único e
 * tipado. Fases não preenchidas (linha inexistente em intake_data, ou jsonb
 * `{}`) viram os valores-padrão de cada schema via as mesmas funções
 * parseXxxData já usadas pelos formulários — nunca `undefined` ou erro —
 * para que calcular.ts e score.ts não precisem checar undefined campo a
 * campo.
 *
 * Só funciona dentro de uma request do Next (Server Component, Server Action
 * ou Route Handler), porque usa o cliente Supabase de lib/supabase/server.ts
 * (que depende de next/headers). Por isso a lógica de cálculo em si
 * (calcular.ts, score.ts) fica em módulos separados que não dependem desta
 * função — só do tipo DadosProcesso, em ./types.ts.
 */
export async function consolidarDadosProcesso(
  processoId: string,
): Promise<DadosProcesso> {
  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from("intake_data")
    .select("fase, dados")
    .eq("processo_id", processoId);

  if (error) {
    throw new Error(
      `Não foi possível carregar os dados do processo: ${error.message}`,
    );
  }

  const porFase = new Map<string, Record<string, unknown>>(
    (rows ?? []).map((row) => [row.fase, (row.dados ?? {}) as Record<string, unknown>]),
  );

  return {
    processoId,
    perfil: parsePerfilData(porFase.get("perfil") ?? {}),
    financeiro: parseFinanceiroData(porFase.get("financeiro") ?? {}),
    operacao: parseOperacaoData(porFase.get("operacao") ?? {}),
    mercado: parseMercadoData(porFase.get("mercado") ?? {}),
    documentos: parseDocumentosData(porFase.get("documentos") ?? {}),
  };
}

export type { DadosProcesso };
export { anosDreComDados } from "./types";
