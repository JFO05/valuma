import { anosDreComDados, informadoExplicitamente, type DadosProcesso } from "./types";
import type { FaseIntake } from "@/lib/intake/fases";

/**
 * Campos mínimos para gerar qualquer análise (RG-40 de
 * docs/REGRAS_NEGOCIO_VALUMA_V1.md) — deliberadamente MENOR e mais estrito
 * que o Índice de Prontidão (lib/prontidao/checklist.ts, RG-42): aqui só
 * entra o que decide se o sistema consegue produzir alguma análise (ainda
 * que parcial, sem nenhum método de valuation aplicável — RG-25/RG-26), não
 * tudo que enriquece a leitura.
 *
 * `campo` é o slug usado como `id` do input correspondente nos formulários,
 * para a tela de resultado linkar direto para o campo faltante via "#slug".
 */
export interface PendenciaObrigatoria {
  fase: FaseIntake;
  campo: string;
  label: string;
}

export function verificarCamposObrigatorios(
  dados: DadosProcesso,
): PendenciaObrigatoria[] {
  const pendencias: PendenciaObrigatoria[] = [];

  if (!dados.perfil.razaoSocial.trim()) {
    pendencias.push({
      fase: "perfil",
      campo: "razaoSocial",
      label: "Razão social",
    });
  }

  if (!dados.perfil.setor.trim()) {
    pendencias.push({
      fase: "perfil",
      campo: "setor",
      label: "Setor/segmento de atuação",
    });
  }

  // RG-41: "informado" não significa "positivo" — zero e negativo contam,
  // desde que explicitamente digitados (ver informadoExplicitamente em
  // ./types.ts). anosDreComDados escolhe o mesmo ano-base usado por
  // calcularValuation; aqui só checamos se o EBITDA desse ano foi
  // informado, não seu sinal.
  const anoBase = anosDreComDados(dados.financeiro.dre).at(-1);
  if (!anoBase || !informadoExplicitamente(anoBase.ebitda)) {
    pendencias.push({
      fase: "financeiro",
      campo: "financeiro.dre.0.ebitda",
      label: "EBITDA do exercício-base",
    });
  }

  if (!informadoExplicitamente(dados.financeiro.balanco.patrimonioLiquido)) {
    pendencias.push({
      fase: "financeiro",
      campo: "financeiro.balanco.patrimonioLiquido",
      label: "Patrimônio líquido",
    });
  }

  // Situação de dívida declarada (RG-14): "Não" já conta como informado —
  // só a ausência de resposta (nem Sim, nem Não) é pendência.
  if (dados.financeiro.possuiDividas === undefined) {
    pendencias.push({
      fase: "financeiro",
      campo: "financeiro.possuiDividas",
      label: "Situação de dívida financeira (possui dívidas?)",
    });
  }

  if (!informadoExplicitamente(dados.financeiro.caixaEquivalentes)) {
    pendencias.push({
      fase: "financeiro",
      campo: "financeiro.caixaEquivalentes",
      label: "Caixa e equivalentes de caixa",
    });
  }

  return pendencias;
}
