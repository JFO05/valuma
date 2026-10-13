import { CONFIGURACAO_ESSENCIAL, type ConfiguracaoMotor } from "./calcular";

/**
 * Motor de Análise (V2 do produto — prompt de evolução, seções 2/3/11) —
 * "o ValuM&A não força uma fórmula a funcionar em qualquer empresa; cada
 * método possui premissas e condições de aplicabilidade." Os tipos de
 * configuração (ConfiguracaoMotor) vivem em calcular.ts para evitar import
 * circular; este arquivo só reexporta e acrescenta as regras de validação
 * do Motor Configurável.
 */
export const MOTOR_TIPOS = ["essencial", "configuravel"] as const;
export type MotorTipo = (typeof MOTOR_TIPOS)[number];

export type { ConfiguracaoMotor, MetodosAtivos } from "./calcular";
export { CONFIGURACAO_ESSENCIAL } from "./calcular";

export function somaPesosAtivos(config: ConfiguracaoMotor): number {
  let soma = 0;
  if (config.metodosAtivos.multiplos) soma += config.pesos.multiplos;
  if (config.metodosAtivos.dcf) soma += config.pesos.dcf;
  if (config.metodosAtivos.patrimonial) soma += config.pesos.patrimonial;
  return soma;
}

const EPSILON_SOMA_PESOS = 0.001;

/**
 * O Motor Essencial é sempre válido (não passa por esta checagem — os pesos
 * fixos 50/30/20 já somam 100% por construção). O Motor Configurável exige
 * (seção 2.2 do prompt de evolução): pelo menos 1 método ativo, e os pesos
 * dos métodos ativos somando exatamente 100%.
 */
export function configuracaoMotorValida(tipo: MotorTipo, config: ConfiguracaoMotor): boolean {
  if (tipo === "essencial") return true;
  const algumAtivo =
    config.metodosAtivos.multiplos || config.metodosAtivos.dcf || config.metodosAtivos.patrimonial;
  if (!algumAtivo) return false;
  return Math.abs(somaPesosAtivos(config) - 1) < EPSILON_SOMA_PESOS;
}

/** Snapshot persistido junto com cada resultado (seção 4 do prompt de evolução) — nunca recalculado a partir da configuração ATUAL do intake. */
export interface MotorSnapshot {
  tipo: MotorTipo;
  configuracao: ConfiguracaoMotor;
}

/** Resultado gerado antes do Motor de Análise existir (ou de um processo sem fase "motor" no intake) é tratado como Motor Essencial, sem alterar nenhum número já calculado. */
export const MOTOR_SNAPSHOT_LEGADO: MotorSnapshot = {
  tipo: "essencial",
  configuracao: CONFIGURACAO_ESSENCIAL,
};
