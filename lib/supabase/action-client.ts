import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente Supabase para Server Actions chamadas com muita frequência (ex:
 * o autosave do intake, a cada ~1.5s por campo alterado).
 *
 * Diferente de lib/supabase/server.ts: aqui `setAll` é intencionalmente um
 * no-op — nunca regrava cookies. Motivo: no Next.js, quando uma Server
 * Action escreve um cookie (via `cookies().set()`), a página atual é
 * re-renderizada automaticamente. Como o cliente padrão regrava o cookie de
 * sessão sempre que o Supabase decide sincronizar/renovar o token, isso
 * criava um loop infinito nas actions de autosave: salvar -> cookie
 * regravado -> página re-renderiza -> `watch()` do formulário devolve um
 * objeto novo -> useAutosave dispara de novo -> salvar de novo, sem parar
 * (foi isso que quebrou o autosave da etapa Perfil e o salvamento dos
 * metadados de upload da etapa Documentos).
 *
 * A sessão continua sendo lida normalmente (getAll) e a query autenticada
 * funciona igual — só não persistimos um eventual refresh de token feito
 * aqui dentro. Isso é seguro porque o proxy.ts (middleware, roda em toda
 * navegação/request) já é o responsável por manter o cookie de sessão
 * atualizado; esta action não precisa fazer esse papel de novo.
 */
export async function createActionClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // Intencional: ver comentário acima.
        },
      },
    },
  );
}
