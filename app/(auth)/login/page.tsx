"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { mapAuthError } from "@/lib/supabase/auth-errors";
import { PremiumCard } from "@/components/ui/premium-card";
import { Reveal } from "@/components/ui/reveal";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    setLoading(false);

    if (signInError) {
      setError(mapAuthError(signInError.message));
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <Reveal className="w-full max-w-sm">
        <PremiumCard>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-8">
            <h1 className="text-xl font-semibold text-ink dark:text-zinc-50">
              Entrar
            </h1>

            <label className="flex flex-col gap-1 text-sm">
              E-mail
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl border border-zinc-200 px-3.5 py-2.5 transition-colors focus:border-ink focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-zinc-100"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="flex items-center justify-between">
                Senha
                <Link
                  href="/forgot-password"
                  className="text-xs font-medium text-zinc-500 underline"
                >
                  Esqueceu a senha?
                </Link>
              </span>
              <input
                type="password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="rounded-xl border border-zinc-200 px-3.5 py-2.5 transition-colors focus:border-ink focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-zinc-100"
              />
            </label>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 rounded-full bg-ink px-5 py-3 text-sm font-medium text-white transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] disabled:opacity-50 dark:bg-white dark:text-black"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>

            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Não tem conta?{" "}
              <Link href="/signup" className="font-medium underline">
                Criar conta
              </Link>
            </p>
          </form>
        </PremiumCard>
      </Reveal>
    </div>
  );
}
