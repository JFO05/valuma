import { FASES_INTAKE, type FaseIntake } from "@/lib/intake/fases";

/**
 * Índice da primeira etapa (na ordem de FASES_INTAKE) que ainda tem
 * pendência na lista de campos mínimos (RG-40) — usado para travar a
 * navegação direta (sidebar/stepper) para etapas futuras enquanto uma etapa
 * anterior não está com os campos mínimos preenchidos. Quando nenhuma etapa
 * tem pendência, retorna `FASES_INTAKE.length` (nada travado).
 */
export function indiceFaseLimite(fasesComPendencia: Set<FaseIntake>): number {
  const indice = FASES_INTAKE.findIndex((fase) => fasesComPendencia.has(fase));
  return indice === -1 ? FASES_INTAKE.length : indice;
}

/**
 * Uma etapa fica bloqueada (não navegável diretamente pela sidebar/stepper)
 * quando está DEPOIS da primeira etapa com pendência — a própria etapa com
 * pendência e todas as anteriores continuam acessíveis (o usuário precisa
 * poder voltar a ela para corrigir).
 */
export function faseBloqueada(
  fase: FaseIntake,
  fasesComPendencia: Set<FaseIntake>,
): boolean {
  return FASES_INTAKE.indexOf(fase) > indiceFaseLimite(fasesComPendencia);
}
