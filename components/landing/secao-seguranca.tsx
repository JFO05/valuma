import { Reveal } from "@/components/ui/reveal";

/**
 * Só reivindicações verificáveis no próprio código (decisão registrada em
 * docs/plano-landing-valuma.md): Supabase Auth, Row Level Security em
 * todas as tabelas (supabase/schema.sql tem 21 políticas, nenhuma usa a
 * chave de serviço — só a anon key, confirmado por grep no projeto),
 * isolamento de documentos por processo via storage.foldername(). Nada de
 * selo/certificação que o projeto não tem.
 */
const ITENS = [
  {
    titulo: "Autenticação via Supabase Auth",
    descricao:
      "Cadastro com e-mail e senha, com verificação de e-mail antes do primeiro acesso.",
  },
  {
    titulo: "Isolamento por usuário no banco",
    descricao:
      "Row Level Security garante, no próprio banco de dados — não só no código da aplicação — que cada usuário só acessa os próprios processos.",
  },
  {
    titulo: "Documentos protegidos por processo",
    descricao:
      "Cada arquivo enviado fica vinculado ao processo do usuário que o enviou; o controle de acesso aplica a mesma regra de isolamento do banco.",
  },
  {
    titulo: "Conexão sempre criptografada",
    descricao:
      "Toda comunicação entre o navegador e o servidor acontece sobre HTTPS.",
  },
];

export function SecaoSeguranca() {
  return (
    <section id="seguranca" className="mx-auto w-full max-w-5xl px-6 py-24 sm:py-32">
      <Reveal className="flex flex-col items-center gap-3 text-center">
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
          Segurança
        </span>
        <h2 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl dark:text-zinc-50">
          Seus dados, isolados dos de qualquer outro usuário
        </h2>
      </Reveal>

      <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {ITENS.map((item) => (
          <Reveal key={item.titulo}>
            <div className="flex h-full flex-col gap-2 rounded-2xl border border-black/10 bg-black/[0.03] p-6 backdrop-blur-sm dark:border-white/10 dark:bg-white/5">
              <h3 className="text-sm font-semibold text-ink dark:text-zinc-50">
                {item.titulo}
              </h3>
              <p className="text-sm text-zinc-500">{item.descricao}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
