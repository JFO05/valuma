import Link from "next/link";

export default function VerifyEmailPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-xl font-semibold">Confirme seu e-mail</h1>
      <p className="max-w-sm text-zinc-600 dark:text-zinc-400">
        Enviamos um link de confirmação para o e-mail informado. Abra sua
        caixa de entrada e clique no link para ativar sua conta.
      </p>
      <Link href="/login" className="text-sm font-medium underline">
        Voltar para o login
      </Link>
    </div>
  );
}
