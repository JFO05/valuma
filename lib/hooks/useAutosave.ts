"use client";

import { useEffect, useRef, useState } from "react";
import { saveIntakeData } from "@/app/(app)/intake/actions";
import type { FaseIntake } from "@/lib/intake/fases";

export type AutosaveStatus = "idle" | "salvando" | "salvo" | "erro";

const DEBOUNCE_MS = 1500;
const TIMEOUT_MS = 10000;

function comTimeout<T>(promessa: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const temporizador = setTimeout(
      () => reject(new Error("Tempo esgotado ao salvar.")),
      ms,
    );
    promessa.then(
      (valor) => {
        clearTimeout(temporizador);
        resolve(valor);
      },
      (erro) => {
        clearTimeout(temporizador);
        reject(erro);
      },
    );
  });
}

/**
 * Autosave genérico para as etapas do intake. Observa o objeto `dados` e,
 * 1.5s depois da última mudança, faz upsert em intake_data via Server Action
 * (processo_id + fase definem a linha; ver app/(app)/intake/actions.ts).
 *
 * NÃO salva no primeiro render (evita reescrever o banco com os dados que
 * acabaram de ser carregados dele mesmo).
 *
 * DEF-04 (docs/PLANO_EVOLUCAO_MVP.md): antes desta versão, sem rede, o save
 * ficava pendurado para sempre em "salvando" — o `fetch` da Server Action
 * nunca resolvia nem rejeitava sozinho enquanto offline. Agora: (1) um
 * timeout de 10s força o estado "erro" mesmo que a chamada nunca volte; (2)
 * se `navigator.onLine` já indica offline, nem tenta a chamada, só marca erro
 * direto; (3) ao reconectar (evento `online`), tenta salvar de novo sozinho,
 * sempre com os dados mais recentes (via ref, não um valor capturado no
 * momento do erro); (4) um `beforeunload` avisa o usuário se ele tentar
 * fechar/recarregar a aba com um save em andamento ou com erro pendente.
 */
export function useAutosave(
  processoId: string,
  fase: FaseIntake,
  dados: Record<string, unknown>,
) {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const [ultimoSalvamento, setUltimoSalvamento] = useState<Date | null>(null);
  const isFirstRender = useRef(true);

  // Sempre o valor mais recente de `dados`/`status`, para o retry ao
  // reconectar e o `beforeunload` (que podem disparar bem depois do render
  // que os originou) nunca lerem um valor antigo. Atualizado em efeito, não
  // durante o render — escrever ref.current no corpo do componente quebra a
  // regra do React Compiler (mesmo motivo documentado em
  // lib/hooks/useFreshDadosIniciais.ts).
  const dadosRef = useRef(dados);
  useEffect(() => {
    dadosRef.current = dados;
  }, [dados]);

  const statusRef = useRef(status);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  async function tentarSalvar() {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setStatus("erro");
      return;
    }

    setStatus("salvando");

    try {
      const result = await comTimeout(
        saveIntakeData(processoId, fase, dadosRef.current),
        TIMEOUT_MS,
      );
      setStatus(result.success ? "salvo" : "erro");
      if (result.success) setUltimoSalvamento(new Date());
    } catch {
      setStatus("erro");
    }
  }

  // Dependência por CONTEÚDO (string), não por referência do objeto: watch()
  // devolve um objeto novo a cada render — inclusive nos renders causados
  // pelo próprio setStatus abaixo. Usar `dados` direto no array de
  // dependências reagendava um novo save toda vez que o status mudava
  // (salvando -> re-render -> "dados" novo -> agenda de novo -> ...),
  // criando um loop infinito que nunca parava de salvar. Com a versão
  // serializada, o efeito só dispara quando o conteúdo realmente muda.
  const dadosSerializados = JSON.stringify(dados);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timeoutId = setTimeout(tentarSalvar, DEBOUNCE_MS);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dadosSerializados, processoId, fase]);

  useEffect(() => {
    function aoReconectar() {
      if (statusRef.current === "erro") tentarSalvar();
    }
    window.addEventListener("online", aoReconectar);
    return () => window.removeEventListener("online", aoReconectar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processoId, fase]);

  useEffect(() => {
    function aoTentarSair(event: BeforeUnloadEvent) {
      if (statusRef.current === "salvando" || statusRef.current === "erro") {
        event.preventDefault();
        event.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", aoTentarSair);
    return () => window.removeEventListener("beforeunload", aoTentarSair);
  }, []);

  return { status, ultimoSalvamento, tentarNovamente: tentarSalvar };
}
