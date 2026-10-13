import { z } from "zod";
import {
  CONFIGURACAO_ESSENCIAL,
  type ConfiguracaoMotor,
} from "@/lib/valuation/calcular";
import { MOTOR_TIPOS, type MotorTipo } from "@/lib/valuation/motor";

export { MOTOR_TIPOS };
export type { MotorTipo };

/**
 * Formulário da etapa "Motor de Análise" (V2, seção 2 do prompt de
 * evolução) — guarda SÓ o tipo e, se Configurável, a configuração em
 * percentual (mais natural num input de formulário: "15" para 15%). A
 * conversão pra fração (0.15) acontece em `configuracaoMotorParaCalculo`,
 * na fronteira com lib/valuation/calcular.ts.
 */
export const configuracaoMotorFormSchema = z.object({
  metodosAtivos: z.object({
    multiplos: z.boolean(),
    dcf: z.boolean(),
    patrimonial: z.boolean(),
  }),
  /** Percentuais (0 a 100), não frações. */
  pesos: z.object({
    multiplos: z.number().min(0).max(100),
    dcf: z.number().min(0).max(100),
    patrimonial: z.number().min(0).max(100),
  }),
  multiploEbitda: z.number().positive("Informe um múltiplo maior que zero"),
  /** Percentual a.a., não fração. */
  crescimentoAnual: z.number(),
  /** Percentual a.a., não fração. */
  taxaDesconto: z.number(),
  horizonteAnos: z.number().int().positive("Informe um horizonte em anos maior que zero"),
});
export type ConfiguracaoMotorFormValues = z.infer<typeof configuracaoMotorFormSchema>;

export const motorSchema = z.object({
  tipo: z.enum(MOTOR_TIPOS),
  configuracao: configuracaoMotorFormSchema,
});
export type MotorFormValues = z.infer<typeof motorSchema>;

export const CONFIGURACAO_MOTOR_PADRAO: ConfiguracaoMotorFormValues = {
  metodosAtivos: { ...CONFIGURACAO_ESSENCIAL.metodosAtivos },
  pesos: {
    multiplos: CONFIGURACAO_ESSENCIAL.pesos.multiplos * 100,
    dcf: CONFIGURACAO_ESSENCIAL.pesos.dcf * 100,
    patrimonial: CONFIGURACAO_ESSENCIAL.pesos.patrimonial * 100,
  },
  multiploEbitda: CONFIGURACAO_ESSENCIAL.multiploEbitda,
  crescimentoAnual: CONFIGURACAO_ESSENCIAL.crescimentoAnual * 100,
  taxaDesconto: CONFIGURACAO_ESSENCIAL.taxaDesconto * 100,
  horizonteAnos: CONFIGURACAO_ESSENCIAL.horizonteAnos,
};

/**
 * Padrão explícito: todo processo nasce no Motor Essencial (o comportamento
 * v1, já aprovado) — Configurável é uma escolha deliberada do usuário, nunca
 * o ponto de partida.
 */
export const motorDefaultValues: MotorFormValues = {
  tipo: "essencial",
  configuracao: CONFIGURACAO_MOTOR_PADRAO,
};

/** Mesmo padrão de parseFinanceiroData/parsePerfilData — funde com os defaults sem validar, pra nunca descartar progresso parcial. */
export function parseMotorData(dados: Record<string, unknown>): MotorFormValues {
  const mesclado = { ...motorDefaultValues, ...dados } as MotorFormValues;
  return {
    ...mesclado,
    configuracao: { ...motorDefaultValues.configuracao, ...mesclado.configuracao },
  };
}

/** Converte a forma do formulário (percentuais) para a forma que lib/valuation/calcular.ts espera (frações). */
export function configuracaoMotorParaCalculo(config: ConfiguracaoMotorFormValues): ConfiguracaoMotor {
  return {
    metodosAtivos: { ...config.metodosAtivos },
    pesos: {
      multiplos: config.pesos.multiplos / 100,
      dcf: config.pesos.dcf / 100,
      patrimonial: config.pesos.patrimonial / 100,
    },
    multiploEbitda: config.multiploEbitda,
    crescimentoAnual: config.crescimentoAnual / 100,
    taxaDesconto: config.taxaDesconto / 100,
    horizonteAnos: config.horizonteAnos,
  };
}

export function somaPesosAtivosFormulario(config: ConfiguracaoMotorFormValues): number {
  let soma = 0;
  if (config.metodosAtivos.multiplos) soma += config.pesos.multiplos;
  if (config.metodosAtivos.dcf) soma += config.pesos.dcf;
  if (config.metodosAtivos.patrimonial) soma += config.pesos.patrimonial;
  return soma;
}
