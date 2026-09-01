# ValuM&A

Plataforma de valuation e M&A para pequenas e médias empresas. O usuário preenche um
formulário (intake) sobre a empresa e o sistema gera valuation, score e análise de IA.

> Status atual: apenas a fundação técnica do projeto (Next.js + Supabase configurados).
> Ainda não há telas de autenticação, formulários de intake, tabelas no banco ou lógica
> de valuation — isso será implementado nas próximas etapas.

## Stack

- [Next.js](https://nextjs.org) (App Router, TypeScript)
- [Supabase](https://supabase.com) (Postgres + Auth nativo)
- [Tailwind CSS](https://tailwindcss.com)
- Deploy: [Vercel](https://vercel.com)

## Como rodar localmente

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Crie o arquivo de variáveis de ambiente a partir do template:

   ```bash
   cp .env.local.example .env.local
   ```

3. Preencha `.env.local` com as credenciais do seu projeto Supabase (veja abaixo).

4. Rode o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

5. Abra [http://localhost:3000](http://localhost:3000) no navegador.

## Variáveis de ambiente

Definidas em `.env.local` (não commitado — veja `.env.local.example` para o template):

| Variável | Descrição |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase (Project Settings → API). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública (anon/public) do projeto Supabase (Project Settings → API). |

## Estrutura de pastas

```
app/                        Rotas (App Router)
components/                 Componentes reutilizáveis (vazio por enquanto)
lib/supabase/
  client.ts                 Cliente Supabase para uso em Client Components (browser)
  server.ts                 Cliente Supabase para Server Components / Route Handlers
  middleware.ts             Helper de sessão usado pelo proxy.ts da raiz
proxy.ts                    Proxy/middleware do Next.js que mantém a sessão Supabase atualizada
.env.local.example          Template das variáveis de ambiente necessárias
```

Os clientes em `lib/supabase/` seguem o padrão oficial do `@supabase/ssr` e servem de base
para quem for implementar autenticação (login, cadastro, proteção de rotas) nas próximas
etapas.
