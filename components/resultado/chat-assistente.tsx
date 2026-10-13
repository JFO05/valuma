"use client";

import { useRef, useState } from "react";

interface Mensagem {
  role: "user" | "assistant";
  content: string;
}

const SUGESTOES = [
  "Como o Equity Value foi calculado?",
  "O que é Dívida Líquida?",
  "Quais pendências mais pesam na minha Prontidão?",
];

/**
 * Chat multi-turno sobre o processo — mesma garantia estrutural de
 * lib/ai/analisar.ts (RG-44/RG-45): o contexto enviado ao modelo é só
 * leitura do que já foi calculado/persistido (app/api/processos/
 * [processoId]/chat/route.ts); o componente em si só envia/recebe texto,
 * nunca grava nenhum número de volta. Conversa é efêmera (estado local, se
 * perde ao recarregar a página) — decisão deliberada de manter v1 simples,
 * sem tabela/migration nova só para histórico de chat.
 */
export function ChatAssistente({ processoId }: { processoId: string }) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [input, setInput] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const listaRef = useRef<HTMLDivElement>(null);

  function rolarParaFinal() {
    requestAnimationFrame(() => {
      listaRef.current?.scrollTo({ top: listaRef.current.scrollHeight });
    });
  }

  async function enviar(texto: string) {
    const conteudo = texto.trim();
    if (!conteudo || enviando) return;

    setErro(null);
    setInput("");
    const historico: Mensagem[] = [...mensagens, { role: "user", content: conteudo }];
    setMensagens([...historico, { role: "assistant", content: "" }]);
    setEnviando(true);
    rolarParaFinal();

    try {
      const response = await fetch(`/api/processos/${processoId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensagens: historico }),
      });

      if (!response.ok || !response.body) {
        throw new Error(await response.text());
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;

        const pedaco = decoder.decode(value, { stream: true });
        setMensagens((atual) => {
          const copia = [...atual];
          const ultima = copia[copia.length - 1];
          copia[copia.length - 1] = { ...ultima, content: ultima.content + pedaco };
          return copia;
        });
        rolarParaFinal();
      }
    } catch {
      setErro("Não foi possível obter uma resposta agora. Tente novamente.");
      setMensagens((atual) => atual.slice(0, -1));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="flex flex-col gap-4 py-2">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-ink dark:text-zinc-50">
          Pergunte sobre sua análise
        </h2>
        <p className="mx-auto max-w-md text-xs text-zinc-500 dark:text-zinc-400">
          Assistente de IA — explica a plataforma, as regras usadas e os dados
          do seu negócio. Não recalcula nem altera nenhum número da análise.
        </p>
      </div>

      {mensagens.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-lg text-accent">
            ✦
          </span>
          <p className="max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
            Pergunte qualquer coisa sobre como chegamos nesses números, sobre
            o seu negócio ou sobre a plataforma.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {SUGESTOES.map((sugestao) => (
              <button
                key={sugestao}
                type="button"
                onClick={() => enviar(sugestao)}
                className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-50 dark:hover:border-zinc-600"
              >
                {sugestao}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div
          ref={listaRef}
          className="flex max-h-[28rem] flex-col gap-3 overflow-y-auto p-1"
        >
          {mensagens.map((mensagem, index) => (
            <div
              key={index}
              className={`flex ${mensagem.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
                  mensagem.role === "user"
                    ? "bg-ink text-white dark:bg-white dark:text-black"
                    : "bg-white text-ink dark:bg-zinc-900 dark:text-zinc-50"
                }`}
              >
                {mensagem.content || (
                  <span className="inline-flex gap-1" aria-label="Respondendo">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.2s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:0.2s]" />
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {erro && <p className="text-xs text-red-600">{erro}</p>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          enviar(input);
        }}
        className="flex items-center gap-2 rounded-full border border-zinc-300 bg-white p-1.5 pl-4 dark:border-zinc-700 dark:bg-zinc-900"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={enviando}
          placeholder="Pergunte sobre sua análise..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={enviando || !input.trim()}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-black"
          aria-label="Enviar"
        >
          ↑
        </button>
      </form>
    </section>
  );
}
