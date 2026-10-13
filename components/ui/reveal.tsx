/**
 * Mantido como componente só pra não precisar editar cada tela que já
 * importa `<Reveal>` — o fade-up disparado por scroll (IntersectionObserver)
 * foi removido a pedido explícito (o efeito estava incomodando); o conteúdo
 * agora já nasce visível, sem nenhuma animação ligada ao scroll.
 */
export function Reveal({
  children,
  className = "",
}: {
  children: React.ReactNode;
  delayMs?: number;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}
