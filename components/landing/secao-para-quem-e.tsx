import { Reveal } from "@/components/ui/reveal";

/**
 * Segmentação por SITUAÇÃO do dono de PME, não por setor/faturamento
 * (decisão registrada em docs/plano-landing-valuma.md, Dúvida 3): não
 * existe pesquisa de mercado real com perfis documentados, então em vez de
 * inventar personas, listo as situações que o próprio fluxo do produto já
 * resolve de fato (venda, captação, sucessão, autoavaliação).
 *
 * Corrige também um id de âncora que antes apontava pro lugar errado:
 * o link "Para quem é" do navbar caía na seção do Índice de Prontidão
 * (components/landing/secao-prontidao.tsx tinha id="para-quem-e"); agora
 * aponta pra esta seção, que é a que realmente responde a essa pergunta.
 */
const SITUACOES = [
  {
    titulo: "Quer vender a empresa, total ou parcialmente",
    descricao:
      "Organize as informações antes de procurar compradores ou investidores, com uma estimativa de valor como ponto de partida.",
  },
  {
    titulo: "Está buscando um investidor",
    descricao:
      "Chegue a uma conversa de captação com dados estruturados, não com planilhas soltas reunidas às pressas.",
  },
  {
    titulo: "Está planejando uma sucessão",
    descricao:
      "Entenda o que falta documentar antes de formalizar a saída de um sócio ou a entrada de um herdeiro na gestão.",
  },
  {
    titulo: "Só quer entender se está pronto",
    descricao:
      "Sem compromisso de negociar agora — descubra o que organizar antes de decidir o próximo passo.",
  },
];

export function SecaoParaQuemE() {
  return (
    <section id="para-quem-e" className="py-24 sm:py-32">
      <div className="mx-auto w-full max-w-5xl px-6">
        <Reveal className="flex flex-col items-center gap-3 text-center">
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
            Para quem é
          </span>
          <h2 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl dark:text-zinc-50">
            Feito para quem está diante de uma decisão, não só curioso
          </h2>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {SITUACOES.map((situacao) => (
            <Reveal key={situacao.titulo}>
              <div className="flex h-full flex-col gap-2 rounded-2xl border border-black/10 bg-black/[0.03] p-6 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
                <h3 className="text-base font-semibold text-ink dark:text-zinc-50">
                  {situacao.titulo}
                </h3>
                <p className="text-sm text-zinc-500">{situacao.descricao}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
