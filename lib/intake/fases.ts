/**
 * As 5 fases do intake, na ordem em que aparecem no stepper. Precisa ficar em
 * sincronia manual com o `check (fase in (...))` de public.intake_data em
 * supabase/schema.sql.
 */
// V2 (prompt de evolução, seção 1): "motor" entra ANTES de "perfil" — o
// usuário escolhe como o ValuM&A vai calcular antes de preencher os dados.
// Precisa ficar em sincronia manual com o `check (fase in (...))` de
// public.intake_data em supabase/schema.sql.
export const FASES_INTAKE = [
  "motor",
  "perfil",
  "financeiro",
  "operacao",
  "mercado",
  "documentos",
] as const;

export type FaseIntake = (typeof FASES_INTAKE)[number];

export const FASE_LABELS: Record<FaseIntake, string> = {
  motor: "Motor de Análise",
  perfil: "Perfil",
  financeiro: "Financeiro",
  operacao: "Operação",
  mercado: "Mercado",
  documentos: "Documentos",
};

export function isFaseIntake(value: string): value is FaseIntake {
  return (FASES_INTAKE as readonly string[]).includes(value);
}
