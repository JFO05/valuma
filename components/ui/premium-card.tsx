/**
 * Card "double-bezel" (invólucro externo + núcleo interno com raios
 * concêntricos) — técnica do skill high-end-visual-design, com as cores da
 * identidade já estabelecida do projeto (zinc/tinta), não a paleta sugerida
 * pelo skill. Usado nas telas "de vitrine" redesenhadas; os formulários de
 * intake mantêm o cartão simples atual (essa moldura dupla adiciona uma
 * camada visual que não ajuda em telas densas de campos).
 */
export function PremiumCard({
  children,
  className = "",
  innerClassName = "",
}: {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
}) {
  return (
    <div
      className={`rounded-[2rem] bg-zinc-900/[0.04] p-1.5 ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/10 ${className}`}
    >
      <div
        className={`shadow-premium rounded-[calc(2rem-0.375rem)] bg-white dark:bg-zinc-900 ${innerClassName}`}
      >
        {children}
      </div>
    </div>
  );
}
