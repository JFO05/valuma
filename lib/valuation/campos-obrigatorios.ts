import { anosDreComDados, type DadosProcesso } from "./types";
import type { FaseIntake } from "@/lib/intake/fases";

/**
 * Lista mínima de campos exigida para liberar "Gerar Resultado" (DEF-01) —
 * decisão D2 do grupo (docs/PLANO_EVOLUCAO_MVP.md): exatamente o que
 * calcularValuation (./calcular.ts) precisa para produzir um número, mais a
 * identificação básica da empresa (razão social e setor, já obrigatórios no
 * schema do Perfil, mas nunca validados hoje porque nenhum formulário aciona
 * o zodResolver — ver A.4 do plano). Deliberadamente MENOR e mais estrito
 * que o futuro Índice de Prontidão (Fase 2): aqui só entra o que decide se
 * dá para calcular alguma coisa, não tudo que enriquece a análise.
 *
 * `campo` é o slug usado como `id` do input correspondente nos formulários
 * (components/intake/perfil-form.tsx, financeiro-form.tsx), para a tela de
 * resultado linkar direto para o campo faltante via "#slug".
 */
export interface PendenciaObrigatoria {
  fase: FaseIntake;
  campo: string;
  label: string;
}

/**
 * Patrimônio líquido tem valor padrão 0 no formulário (ver
 * lib/intake/schema-financeiro.ts) — o mesmo caso ambíguo entre "não
 * preenchido" e "genuinamente zero" documentado em lib/valuation/score.ts.
 * Aqui tratamos 0 como "não informado", pelo mesmo motivo que
 * anosDreComDados já trata um ano inteiramente zerado do DRE como "não
 * preenchido": o valor padrão de um campo nunca digitado é 0, então exigir
 * "diferente de 0" é a forma prática de distinguir os dois casos sem um
 * campo extra de "toquei nisso". Um patrimônio líquido negativo é aceito
 * como válido (é um dado real possível — ver decisão D1).
 */
function patrimonioLiquidoInformado(dados: DadosProcesso): boolean {
  return dados.financeiro.balanco.patrimonioLiquido !== 0;
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

  // anosDreComDados (mesma função usada por calcularValuation) considera um
  // ano "com dados" se a receita bruta OU o EBITDA forem diferentes de zero
  // — então um ano com receita preenchida mas EBITDA ainda em 0 (o padrão de
  // campo nunca tocado) passaria despercebido se só checássemos a lista.
  // D2 pede especificamente o EBITDA do ano mais recente, por isso o
  // ano-base em si precisa ter EBITDA != 0, não só "algum sinal".
  const anoBase = anosDreComDados(dados.financeiro.dre).at(-1);
  if (!anoBase || anoBase.ebitda === 0) {
    pendencias.push({
      fase: "financeiro",
      campo: "dre-ebitda-0",
      label: "EBITDA de ao menos um ano no DRE",
    });
  }

  if (!patrimonioLiquidoInformado(dados)) {
    pendencias.push({
      fase: "financeiro",
      campo: "patrimonioLiquido",
      label: "Patrimônio líquido",
    });
  }

  return pendencias;
}
