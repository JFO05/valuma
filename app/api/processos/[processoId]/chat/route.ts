import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { consolidarDadosProcesso } from "@/lib/valuation/consolidar";
import { calcularProntidao } from "@/lib/prontidao/checklist";
import { mapRowParaResultadoValuation, ehResultadoLegado } from "@/lib/valuation/resultados";
import type { ResultadoValuation } from "@/lib/valuation/types";
import { MODEL } from "@/lib/ai/analisar";
import {
  SYSTEM_PROMPT_CHAT,
  montarContextoChat,
  LIMITE_MENSAGENS_HISTORICO,
  LIMITE_CARACTERES_MENSAGEM,
  type MensagemChat,
} from "@/lib/ai/chat-assistente";

const client = new Anthropic();

/**
 * Chat da tela de Resultado — streaming de texto puro (sem framing SSE: o
 * cliente já é o mesmo app, não precisamos de um protocolo genérico). Mesma
 * garantia estrutural da análise de uma via (RG-44): o contexto enviado à IA
 * é só leitura do que já foi calculado/persistido — nada aqui recalcula ou
 * grava nenhum número.
 */
export async function POST(
  request: Request,
  { params }: RouteContext<"/api/processos/[processoId]/chat">,
) {
  const { processoId } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Não autenticado.", { status: 401 });
  }

  const { data: processo, error: processoError } = await supabase
    .from("processos")
    .select("id")
    .eq("id", processoId)
    .maybeSingle();

  if (processoError || !processo) {
    return new Response("Processo não encontrado.", { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response("Corpo da requisição inválido.", { status: 400 });
  }

  const mensagens = validarMensagens(body);
  if (!mensagens) {
    return new Response(
      "Envie { mensagens: [{ role: 'user' | 'assistant', content: string }] }, terminando em uma mensagem do usuário.",
      { status: 400 },
    );
  }

  const [dados, { data: resultadoRow }] = await Promise.all([
    consolidarDadosProcesso(processoId),
    supabase.from("resultados").select("*").eq("processo_id", processoId).maybeSingle(),
  ]);

  const prontidao = calcularProntidao(dados);
  const resultado: ResultadoValuation | null = resultadoRow
    ? mapRowParaResultadoValuation(resultadoRow)
    : null;
  const resultadoLegado = resultado !== null && ehResultadoLegado(resultado);

  const contexto = montarContextoChat(dados, prontidao, resultado, resultadoLegado);

  let streamAnthropic: ReturnType<typeof client.messages.stream>;
  try {
    streamAnthropic = client.messages.stream({
      model: MODEL,
      max_tokens: 2000,
      system: `${SYSTEM_PROMPT_CHAT}\n\n${contexto}`,
      messages: mensagens,
    });
  } catch (error) {
    console.error("chat route: falha ao iniciar stream da Anthropic", error);
    return new Response("Não foi possível iniciar o assistente agora. Tente novamente.", {
      status: 502,
    });
  }

  const textoUtf8 = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        for await (const evento of streamAnthropic) {
          if (
            evento.type === "content_block_delta" &&
            evento.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(evento.delta.text));
          }
        }
      } catch (error) {
        console.error("chat route: erro durante o streaming da Anthropic", error);
        controller.enqueue(
          encoder.encode("\n\n[Erro ao gerar a resposta. Tente novamente.]"),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(textoUtf8, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

function validarMensagens(body: unknown): MensagemChat[] | null {
  if (
    typeof body !== "object" ||
    body === null ||
    !("mensagens" in body) ||
    !Array.isArray((body as { mensagens: unknown }).mensagens)
  ) {
    return null;
  }

  const bruto = (body as { mensagens: unknown[] }).mensagens;
  if (bruto.length === 0) return null;

  const mensagens: MensagemChat[] = [];
  for (const item of bruto.slice(-LIMITE_MENSAGENS_HISTORICO)) {
    if (
      typeof item !== "object" ||
      item === null ||
      !("role" in item) ||
      !("content" in item) ||
      (item.role !== "user" && item.role !== "assistant") ||
      typeof item.content !== "string" ||
      item.content.trim() === ""
    ) {
      return null;
    }
    mensagens.push({
      role: item.role,
      content: item.content.slice(0, LIMITE_CARACTERES_MENSAGEM),
    });
  }

  if (mensagens.at(-1)?.role !== "user") return null;

  return mensagens;
}
