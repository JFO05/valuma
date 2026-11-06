/**
 * Acordeão em <details>/<summary> nativo — acessível por padrão (teclado,
 * leitor de tela, sem nenhum `aria-*` manual) e sem JS/"use client"
 * nenhum, diferente do padrão de accordion customizado. Ponto fraco real
 * encontrado na Mynr (docs/referencia-mynr.md, item E.1): ela não tem FAQ
 * nenhuma — aqui também corrige a lacuna de ARIA quase inexistente que foi
 * apontada lá, usando semântica nativa em vez de recriar com divs.
 */
const PERGUNTAS = [
  {
    pergunta: "O ValuM&A substitui uma due diligence profissional?",
    resposta:
      "Não. A análise gerada é um ponto de partida estruturado — não substitui avaliação contábil, financeira, jurídica ou due diligence conduzida por profissionais.",
  },
  {
    pergunta: "O que exatamente o Índice de Prontidão mede?",
    resposta:
      "Mede o nível de disponibilidade, estruturação e validade básica das informações financeiras, operacionais, de mercado e documentais — não é uma nota sobre a qualidade da empresa, nem certifica que as informações são verdadeiras.",
  },
  {
    pergunta: "O múltiplo usado no cálculo vem de dados reais do meu setor?",
    resposta:
      "No modelo simplificado, não — o múltiplo de EBITDA usado é um valor fixo, pensado como aproximação inicial, não como dado de mercado calibrado por setor. É por isso que o resultado é chamado de estimativa preliminar, não de laudo.",
  },
  {
    pergunta: "Preciso ter todos os dados prontos para começar?",
    resposta:
      "Não. O fluxo é guiado e salva automaticamente a cada etapa — você pode preencher aos poucos e retomar depois. O próprio Índice de Prontidão existe para mostrar o que ainda falta.",
  },
  {
    pergunta: "Meus dados ficam seguros?",
    resposta:
      "O acesso é isolado por usuário diretamente no banco de dados (Row Level Security), não só por uma checagem na aplicação — cada pessoa só enxerga os próprios processos e documentos.",
  },
  {
    pergunta: "Dá pra importar dados que já tenho em planilha?",
    resposta:
      "Sim, para os dados financeiros (DRE, balanço e dívidas) existe importação direta a partir de uma planilha Excel no formato esperado pelo sistema.",
  },
] as const;

export function SecaoFaq() {
  return (
    <section id="faq" className="mx-auto w-full max-w-3xl px-6 py-24 sm:py-32">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
          Perguntas frequentes
        </span>
        <h2 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl dark:text-zinc-50">
          Antes de você perguntar
        </h2>
      </div>

      <div className="mt-12 flex flex-col divide-y divide-black/10 dark:divide-white/10">
        {PERGUNTAS.map((item) => (
          <details key={item.pergunta} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-sm font-semibold text-ink marker:content-none dark:text-zinc-50">
              {item.pergunta}
              <span
                aria-hidden="true"
                className="shrink-0 text-zinc-400 transition-transform duration-300 group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="mt-3 text-sm text-zinc-500">{item.resposta}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
