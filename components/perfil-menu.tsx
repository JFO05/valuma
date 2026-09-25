"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogoutButton } from "@/components/logout-button";
import { atualizarNomeUsuario } from "@/app/(app)/perfil-actions";

/**
 * Menu de perfil do usuário (Fase 4.4, decisão D5: dropdown no cabeçalho, não
 * página própria) — nome editável, e-mail somente leitura, redefinir senha e
 * sair, tudo a partir do e-mail que já aparecia no AppShell.
 */
export function PerfilMenu({
  email,
  nomeCompleto,
}: {
  email: string;
  nomeCompleto: string | null;
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState(nomeCompleto ?? "");
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const botaoRef = useRef<HTMLButtonElement>(null);
  const painelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;

    function aoClicarFora(evento: MouseEvent) {
      const alvo = evento.target as Node;
      if (!painelRef.current?.contains(alvo) && !botaoRef.current?.contains(alvo)) {
        setAberto(false);
      }
    }
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        setAberto(false);
        botaoRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", aoClicarFora);
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("mousedown", aoClicarFora);
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [aberto]);

  async function handleSalvarNome(evento: React.FormEvent) {
    evento.preventDefault();
    setSalvando(true);
    setMensagem(null);
    const resultado = await atualizarNomeUsuario(nome);
    setSalvando(false);

    if (!resultado.success) {
      setMensagem(resultado.error);
      return;
    }

    setMensagem("Nome atualizado.");
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        ref={botaoRef}
        type="button"
        aria-haspopup="true"
        aria-expanded={aberto}
        aria-label="Abrir menu de perfil"
        onClick={() => setAberto((valor) => !valor)}
        className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
      >
        {email}
      </button>

      {aberto && (
        <div
          ref={painelRef}
          className="absolute right-0 z-20 mt-2 w-72 rounded-lg border border-zinc-200 bg-white p-4 shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
        >
          <form onSubmit={handleSalvarNome} className="flex flex-col gap-1">
            <label htmlFor="perfil-menu-nome" className="text-xs font-medium text-zinc-500">
              Nome
            </label>
            <div className="flex gap-2">
              <input
                id="perfil-menu-nome"
                value={nome}
                onChange={(evento) => setNome(evento.target.value)}
                className="w-full min-w-0 flex-1 rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
              <button
                type="submit"
                disabled={salvando}
                className="shrink-0 rounded border border-zinc-300 px-2 py-1 text-xs font-medium disabled:opacity-50 dark:border-zinc-700"
              >
                {salvando ? "..." : "Salvar"}
              </button>
            </div>
          </form>
          {mensagem && <p className="mt-1 text-xs text-zinc-500">{mensagem}</p>}

          <div className="mt-3 flex flex-col gap-1 border-t border-zinc-200 pt-3 dark:border-zinc-800">
            <span className="text-xs font-medium text-zinc-500">E-mail</span>
            <span className="text-sm">{email}</span>
          </div>

          <Link
            href="/reset-password"
            className="mt-3 block text-sm text-ink underline dark:text-accent"
          >
            Redefinir senha
          </Link>

          <div className="mt-3 border-t border-zinc-200 pt-3 dark:border-zinc-800">
            <LogoutButton />
          </div>
        </div>
      )}
    </div>
  );
}
