import type { AnaliseIA } from "@/lib/valuation/types";
import { GerarResultadoButton } from "@/components/resultado/gerar-resultado-button";

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

/**
 * Trata como "falhou" tanto o caso explícito (`erro: true`, gravado por
 * lib/ai/analisar.ts desde o DEF-03) quanto resultados antigos, gerados
 * antes dessa marcação existir, que ficaram com os 3 blocos vazios — uma
 * resposta bem-sucedida da IA sempre tem pelo menos alguns itens (o prompt
 * pede de 3 a 5 por bloco), então "tudo vazio" nunca é um resultado válido.
 */
function analiseFalhou(analiseIA: AnaliseIA): boolean {
  return (
    analiseIA.erro === true ||
    analiseIA.pontosFortes.length +
      analiseIA.riscos.length +
      analiseIA.recomendacoes.length ===
      0
  );
}

export function AnaliseIaCards({
  analiseIA,
  processoId,
}: {
  analiseIA: AnaliseIA;
  processoId: string;
}) {
  if (analiseFalhou(analiseIA)) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-zinc-300 p-6 text-center dark:border-zinc-700">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Análise qualitativa indisponível no momento.
        </p>
        <GerarResultadoButton
          processoId={processoId}
          label="Tentar novamente"
          variante="secundario"
        />
      </div>
    );
  }

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
