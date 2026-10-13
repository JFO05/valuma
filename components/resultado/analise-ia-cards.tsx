import type { AnaliseIA } from "@/lib/valuation/types";
import { GerarResultadoButton } from "@/components/resultado/gerar-resultado-button";

const SECOES = [
  { chave: "pontosFortes", titulo: "Pontos fortes" },
  { chave: "riscos", titulo: "Riscos e pontos de atenção" },
  { chave: "recomendacoes", titulo: "Recomendações" },
] as const;

/**
 * Trata como "falhou" tanto o caso explícito (`erro: true`, gravado por
 * lib/ai/analisar.ts) quanto resultados antigos, gerados antes dessa
 * marcação existir, que ficaram com os 3 blocos vazios — uma resposta
 * bem-sucedida da IA sempre tem pelo menos alguns itens (o prompt pede de 3
 * a 5 por bloco), então "tudo vazio" nunca é um resultado válido.
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

/**
 * V2 (prompt de evolução, seção 8): "Análise Estratégica" — não destaca "IA"
 * como produto/título (a IA continua sendo só o mecanismo técnico por trás
 * da interpretação). Visual neutro — graphite/zinc, sem bordas coloridas por
 * seção (emerald/red/blue removidas); separadores discretos no lugar de
 * "três cards coloridos". Conteúdo (pontos fortes/riscos/recomendações)
 * preservado integralmente.
 */
export function AnaliseIaCards({
  analiseIA,
  processoId,
}: {
  analiseIA: AnaliseIA;
  processoId: string;
}) {
  if (analiseFalhou(analiseIA)) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center dark:border-zinc-700 dark:bg-zinc-950">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Análise qualitativa temporariamente indisponível. Os cálculos de
          valuation e Prontidão não foram afetados.
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
    // Essa seção "escapa" da largura normal da página (max-w-3xl) a partir
    // de sm: — 3 colunas dentro de 768px deixava cada card estreito demais,
    // com texto quebrando em muitas linhas (coluna "gigante" de altura, não
    // de largura). Em telas pequenas (mobile) o efeito nem entra em jogo:
    // fica contido e empilhado, igual ao resto da página.
    <div className="sm:ml-[calc(50%-50vw)] sm:mr-[calc(50%-50vw)] sm:w-screen">
      <div className="sm:mx-auto sm:max-w-7xl sm:px-6 lg:px-12">
        <div className="rounded-2xl border border-zinc-900/5 bg-white p-6 dark:border-white/5 dark:bg-zinc-900">
          <p className="mb-5 text-xs text-zinc-500 dark:text-zinc-400">
            Leitura qualitativa com base nos dados fornecidos — não altera
            nenhum número calculado acima.
          </p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-zinc-100 dark:sm:divide-zinc-800">
            {SECOES.map((secao) => (
              <div key={secao.chave} className="flex flex-col gap-2 sm:px-6 first:sm:pl-0 last:sm:pr-0">
                <h3 className="text-sm font-semibold text-ink dark:text-zinc-50">
                  {secao.titulo}
                </h3>
                <ul className="flex flex-col gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                  {analiseIA[secao.chave].map((item, index) => (
                    <li key={index} className="flex gap-2">
                      <span aria-hidden className="text-zinc-300 dark:text-zinc-600">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
