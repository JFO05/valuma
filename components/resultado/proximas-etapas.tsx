/**
 * Seção nova (RG-53, posição 6 da ordem oficial da tela de resultado) — só
 * comunica que existe uma etapa posterior de validação profissional (RG-05),
 * sem criar nenhum workflow, portal ou integração para isso (fora de
 * escopo — RG-56).
 */
export function ProximasEtapas() {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Próximas etapas recomendadas</h2>
      <ol className="flex flex-col gap-2 text-sm text-zinc-700 dark:text-zinc-300">
        <li className="flex gap-2">
          <span className="font-semibold text-zinc-400">1.</span>
          Validação contábil/financeira por um profissional habilitado.
        </li>
        <li className="flex gap-2">
          <span className="font-semibold text-zinc-400">2.</span>
          Validação jurídica por um advogado.
        </li>
        <li className="flex gap-2">
          <span className="font-semibold text-zinc-400">3.</span>
          Due diligence e negociação.
        </li>
      </ol>
    </section>
  );
}
