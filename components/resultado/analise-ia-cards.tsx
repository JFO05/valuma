import type { AnaliseIA } from "@/lib/valuation/types";

const SECOES = [
  {
    chave: "pontosFortes",
    titulo: "Pontos Fortes",
    cor: "border-green-300 dark:border-green-800",
  },
  {
    chave: "riscos",
    titulo: "Riscos",
    cor: "border-red-300 dark:border-red-800",
  },
  {
    chave: "recomendacoes",
    titulo: "Recomendações",
    cor: "border-blue-300 dark:border-blue-800",
  },
] as const;

export function AnaliseIaCards({ analiseIA }: { analiseIA: AnaliseIA }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {SECOES.map((secao) => (
        <div
          key={secao.chave}
          className={`flex flex-col gap-2 rounded-lg border p-4 ${secao.cor}`}
        >
          <h3 className="font-semibold">{secao.titulo}</h3>
          <ul className="flex flex-col gap-2 text-sm text-zinc-700 dark:text-zinc-300">
            {analiseIA[secao.chave].map((item, index) => (
              <li key={index} className="flex gap-2">
                <span aria-hidden>•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
