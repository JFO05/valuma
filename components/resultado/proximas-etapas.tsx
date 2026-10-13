const ETAPAS = [
  "Validação contábil/financeira por um profissional habilitado.",
  "Validação jurídica por um advogado.",
  "Due diligence e negociação.",
];

/**
 * Seção nova (RG-53, posição 6) — só comunica que existe uma etapa
 * posterior de validação profissional (RG-05), sem criar nenhum workflow,
 * portal ou integração para isso (fora de escopo — RG-56). Visual
 * consistente com "Como funciona" da landing (número + texto).
 */
export function ProximasEtapas() {
  return (
    <section className="rounded-2xl border border-zinc-900/5 bg-white p-6 dark:border-white/5 dark:bg-zinc-900">
      <h2 className="text-lg font-semibold text-ink dark:text-zinc-50">
        Próximas etapas recomendadas
      </h2>
      <ol className="mt-4 flex flex-col gap-3">
        {ETAPAS.map((etapa, index) => (
          <li key={etapa} className="flex items-start gap-3 text-sm text-zinc-600 dark:text-zinc-400">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-semibold text-accent">
              {index + 1}
            </span>
            <span className="pt-0.5">{etapa}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
