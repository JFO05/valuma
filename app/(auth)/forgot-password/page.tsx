"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo: `${window.location.origin}/auth/callback?next=/reset-password` },
    );

    setLoading(false);

    // O Supabase não informa se o e-mail existe ou não (mesma razão do
    // signup com e-mail já cadastrado — ver ACH-02 do relatório de QA), então
    // sempre mostramos a mesma mensagem de sucesso, exceto em erros de rede
    // ou de limite de tentativas.
    if (resetError) {
      setError("Não foi possível concluir a operação. Tente novamente.");
      return;
    }

    setEnviado(true);
  }

  if (enviado) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
        <h1 className="text-xl font-semibold">Verifique seu e-mail</h1>
        <p className="max-w-sm text-zinc-600 dark:text-zinc-400">
          Se {email} tiver uma conta no ValuM&amp;A, enviamos um link para
          redefinir a senha.
        </p>
        <Link href="/login" className="text-sm font-medium underline">
          Voltar para o login
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-zinc-200 p-6 dark:border-zinc-800"
      >
        <div>
          <h1 className="text-xl font-semibold">Esqueceu sua senha?</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Informe seu e-mail e enviaremos um link para você definir uma
            nova senha.
          </p>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          E-mail
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded bg-ink px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {loading ? "Enviando..." : "Enviar link de redefinição"}
        </button>

        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          <Link href="/login" className="font-medium underline">
            Voltar para o login
          </Link>
        </p>
      </form>
    </div>
  );
}
