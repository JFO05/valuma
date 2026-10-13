import Image from "next/image";

/**
 * Selo da marca usado na navbar da landing e no cabeçalho do painel. A arte
 * original (`logo.png`) tem a escrita "ValuM&A" numa cor fixa (grafite), que
 * ficaria ilegível direto sobre um fundo escuro — por isso existe uma
 * segunda variante (`logo-dark.png`, gerada a partir da original trocando
 * só os pixels da escrita por branco e preservando o ícone laranja) usada
 * dentro de um chip escuro no tema escuro, e a original dentro de um chip
 * claro no tema claro.
 */
export function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-xl bg-white px-2 py-1 shadow-sm ring-1 ring-black/5 dark:bg-zinc-900 dark:ring-white/10 ${className}`}
    >
      <Image
        src="/brand/logo.png"
        alt="ValuM&amp;A"
        width={1448}
        height={1086}
        priority
        className="h-9 w-auto dark:hidden"
      />
      <Image
        src="/brand/logo-dark.png"
        alt="ValuM&amp;A"
        width={1448}
        height={1086}
        priority
        className="hidden h-9 w-auto dark:block"
      />
    </span>
  );
}
