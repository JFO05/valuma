/**
 * As 5 fases do intake, na ordem em que aparecem no stepper. Precisa ficar em
 * sincronia manual com o `check (fase in (...))` de public.intake_data em
 * supabase/schema.sql.
 */
export const FASES_INTAKE = [
  "perfil",
  "financeiro",
  "operacao",
  "mercado",
  "documentos",
] as const;

export type FaseIntake = (typeof FASES_INTAKE)[number];

export const FASE_LABELS: Record<FaseIntake, string> = {
  perfil: "Perfil",
  financeiro: "Financeiro",
  operacao: "Operação",
  mercado: "Mercado",
  documentos: "Documentos",
};

export function isFaseIntake(value: string): value is FaseIntake {
  return (FASES_INTAKE as readonly string[]).includes(value);
}
