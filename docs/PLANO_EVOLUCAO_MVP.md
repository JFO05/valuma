# Plano de Evolução do MVP — ValuM&A

**Fase 0 — Auditoria.** Nenhum código foi alterado para produzir este documento. Todas as afirmações abaixo foram verificadas lendo o código-fonte atual do repositório e, quando indicado, navegando a aplicação rodando localmente (`next dev`, `http://localhost:3000`) com a conta real `augusto_lordano@hotmail.com` e um processo de teste já preenchido ("Empresa Teste Campinas Ltda."). Onde a verificação foi só por leitura de código (sem rodar), isso está dito explicitamente.

Stack confirmada no código (não presumida): Next.js 16.3.4 (App Router, Turbopack, TypeScript), Supabase (`@supabase/ssr` + `@supabase/supabase-js`, Postgres com RLS, Auth nativo, Storage), Tailwind CSS v4 (config via `@theme` em `app/globals.css`, sem `tailwind.config.js`), `react-hook-form` + `zod` v3, deploy na Vercel. `@anthropic-ai/sdk` para a IA. Não há framework de testes instalado, nem biblioteca de geração de PDF, nem biblioteca de UI (Radix, shadcn, etc.) — confirmado em `package.json`.

---

## A. Diagnóstico do estado atual

### A.1 Autenticação (login, cadastro, recuperação de senha)

- **Cadastro** (`app/(auth)/signup/page.tsx`): formulário client-side (nome, e-mail, senha, `minLength={6}` nativo do HTML) chamando `supabase.auth.signUp()` com `emailRedirectTo: /auth/callback`. Redireciona para `/verify-email` (`app/(auth)/verify-email/page.tsx`, estático, só texto + link de volta ao login).
- **Login** (`app/(auth)/login/page.tsx`): `signInWithPassword`, erros traduzidos por `lib/supabase/auth-errors.ts::mapAuthError` (só 4 mensagens conhecidas; qualquer outro erro cai em "Não foi possível concluir a operação. Tente novamente.").
- **Recuperação de senha**: **já existe** — `app/(auth)/forgot-password/page.tsx` (`resetPasswordForEmail` com `redirectTo` para `/auth/callback?next=/reset-password`, mensagem neutra que não revela se o e-mail existe) e `app/(auth)/reset-password/page.tsx` (`updateUser({ password })`). Link "Esqueceu a senha?" já está no formulário de login, ao lado do rótulo "Senha". Isso foi implementado numa sessão anterior a este documento; o pedido de Fase 4.1 já está resolvido no código atual.
- **Sessão**: `lib/supabase/middleware.ts` protege `/dashboard`, `/intake` e `/processos` (allowlist `PROTECTED_PATHS`), redirecionando para `/login` se `getUser()` não retornar usuário. `proxy.ts` (equivalente ao antigo `middleware.ts` no Next 16) chama isso em todas as rotas exceto assets estáticos.
- **Logout**: `components/logout-button.tsx`, `signOut()` + `router.push("/login")` + `router.refresh()`.

### A.2 Dashboard e listagem de processos

`app/(app)/dashboard/page.tsx` (Server Component). Busca `users.nome_completo`, `processos` (ordenados por `created_at desc`) e `intake_data` de todos os processos do usuário para calcular quantas fases cada um já tem. Estado atual (já evoluído de uma sessão anterior a este documento):

- Saudação "Bem-vindo, {nome ou nada}!" com o e-mail do usuário logo abaixo (**duplicado** com o e-mail que já aparece no cabeçalho global — ver heurística 4.2 abaixo).
- Botão "Novo Valuation" cria um processo em branco (`/intake` faz `insert` direto e redireciona) e leva para `/intake/[id]/perfil`.
- Cada processo aparece num card com: nome da empresa, um selo de status (`components/status-badge.tsx`, já existe — mapeia `em_andamento`→"Em andamento" âmbar, `concluido`→"Resultado gerado" verde, `arquivado`→cinza), e — só quando incompleto — "X de 5 etapas preenchidas". As ações são dois botões lado a lado, sempre visíveis (não um menu `⋮`): "Continuar intake" ou "Editar intake" (o texto já reflete se o intake está completo) e, só quando há resultado, "Ver Resultado".
- **Não existe**: menu de ações `⋮`, exclusão de processo (nem botão, nem rota, nem confirmação), página de perfil do usuário.

### A.3 Shell do intake e stepper

`app/(app)/intake/[processoId]/[fase]/page.tsx` busca o processo e as linhas de `intake_data` já salvas, monta `fasesComDados` (quais fases têm QUALQUER linha salva, mesmo vazia) e renderiza `IntakeStepper` + o formulário da fase.

`components/intake/intake-stepper.tsx`: uma fileira horizontal de 5 pílulas (`<Link>`), cada uma com um círculo mostrando `✓` se a fase está em `fasesComDados`, ou o número da posição (1–5) caso contrário. **Isso é uma navegação totalmente livre** — cada pílula é um link normal, sem nenhum bloqueio.

Achado importante para o DEF-01 e para a Fase 4.5: o `✓` significa **"existe uma linha salva para essa fase"**, não **"os campos obrigatórios dessa fase estão preenchidos"**. Como o autosave grava a cada 1,5s mesmo com o formulário parcialmente vazio (decisão deliberada, documentada em `lib/intake/schema-perfil.ts` e equivalentes — ver A.4), basta tocar em qualquer campo de uma etapa para ela ganhar o `✓`, mesmo estando incompleta. Confirmado navegando: um processo com Perfil, Financeiro, Operação, Mercado e Documentos "visitados" mostra os 5 `✓`, independentemente de quantos campos obrigatórios foram de fato preenchidos.

Não existe sidebar, não existe indicação de "propósito da etapa", não existe link fixo "Resultado" no stepper (só aparece via `/dashboard` → "Ver Resultado", ou pelo link "← Editar dados do intake" na própria tela de resultado).

`components/intake/voltar-dashboard-button.tsx` (existente): fica desabilitado (com `title` explicando por quê) enquanto o autosave da etapa atual está em `"salvando"`; do contrário é um link normal para `/dashboard`. Aparece no rodapé de cada etapa. Desde a introdução do `AppShell` (ver A.9), o logo "ValuM&A" no cabeçalho **também** linka para `/dashboard`, mas sem essa trava — ou seja, hoje há dois caminhos para o Dashboard com comportamentos ligeiramente diferentes (isso está registrado como achado de consistência na auditoria de heurísticas, C).

### A.4 Formulários de cada etapa

Todos os 5 formulários seguem o mesmo padrão: `useForm` com `zodResolver`, `watch()` alimentando `useAutosave(processoId, fase, dados)`, e `useFreshDadosIniciais` para recarregar dados salvos ao voltar pela navegação do navegador. **Nenhum formulário tem botão de submit real** — o `<form onSubmit={(e) => e.preventDefault()}>` nunca dispara a validação do `zodResolver`; ela existe no código mas não é acionada por nenhuma interação do usuário hoje. Isso é a causa raiz do DEF-01.

Cada schema (`lib/intake/schema-*.ts`) tem uma função `parseXxxData()` que faz merge raso com os valores-padrão **sem validar contra o zod** — comentado explicitamente em todos os arquivos como decisão deliberada: uma validação estrita descartaria progresso parcial digitado pelo usuário. Isso está correto para o autosave, mas significa que **não existe hoje nenhum ponto em que os dados obrigatórios sejam de fato verificados antes de gerar um resultado** (ver B, DEF-01 e D2).

**Perfil** (`schema-perfil.ts` / `perfil-form.tsx`): razão social, nome fantasia, CNPJ (regex opcional), data de fundação, setor, porte (enum), número de funcionários, cidade, UF, lista de sócios (nome, % participação, cargo). Ao salvar, sincroniza `partners` (tabela normalizada) e atualiza `processos.nome_empresa` a partir da razão social.

**Financeiro** (`schema-financeiro.ts` / `financeiro-form.tsx`): **este é o formulário mais denso do app.** DRE de 3 anos fixos, 8 campos monetários cada (receita bruta, deduções, receita líquida, custos, lucro bruto, despesas operacionais, EBITDA, lucro líquido) = 24 campos monetários só no DRE; balanço patrimonial resumido (5 campos monetários); lista de dívidas (credor, valor, taxa, vencimento). **Achado crítico, verificado em `lib/valuation/calcular.ts` e `lib/valuation/score.ts`: dos 24 campos do DRE, só 2 por ano (receita bruta e EBITDA) alimentam qualquer cálculo — e só do ano mais recente com dado.** Deduções, receita líquida, custos, lucro bruto, despesas operacionais e lucro líquido **não são lidos em nenhum lugar do motor determinístico** (só apareceriam, em texto, no prompt da IA, via `lib/ai/analisar.ts::montarSecaoFinanceiro`). Do balanço, só `patrimonioLiquido` é usado; ativo total, ativo circulante, passivo total e passivo circulante não alimentam nada. Isso é o achado central para D2 e para a Fase 4.6/4.7 — hoje o formulário pede ~30 campos monetários e o motor usa 4.

**Operação** (`schema-operacao.ts` / `operacao-form.tsx`): número total de funcionários (**duplicado** com "Número de funcionários" do Perfil — dois campos parecidos em duas telas diferentes, nenhum deles ligado ao outro), cargos/áreas, número de clientes ativos, concentração dos 3 maiores clientes (%), clientes principais, fornecedores principais (com nível de dependência), descrição textual dos processos operacionais. Do que é pedido aqui, `calcularScoreOperacao` usa: `concentracaoTop3Clientes`, `numeroClientesAtivos` (só para decidir se há "sinal" ou não), `clientesPrincipais.length`, `fornecedoresPrincipais` (nível de dependência). `numeroFuncionariosTotal`, `cargosEquipe` e `processosOperacionais` não entram em nenhum cálculo hoje.

**Mercado** (`schema-mercado.ts` / `mercado-form.tsx`): concorrentes (nome, porte, diferencial), posicionamento (texto livre), TAM estimado, sinergias potenciais. `calcularScoreMercado` usa `concorrentes.length` e o **tamanho em caracteres** do texto de posicionamento (proxy simples, não analisa conteúdo). TAM, sinergias e os campos `porteEstimado`/`diferencialPercebido` de cada concorrente não entram em nenhum cálculo — só aparecem no prompt da IA.

**Documentos** (`schema-documentos.ts` / `documentos-form.tsx`): upload via `XMLHttpRequest` direto para o Storage (para ter progresso, que `fetch` não expõe), validação de tipo/tamanho no cliente (`validarArquivo`) espelhando as policies do bucket. `calcularScoreJuridico` usa só a **quantidade** de arquivos enviados (0 a 5 = 0 a 100), não o tipo nem o conteúdo. Remoção de arquivo já tem confirmação modal (`components/confirm-dialog.tsx`, adicionado numa sessão anterior) e erros já aparecem inline (não há mais `window.alert`).

### A.5 Autosave

`lib/hooks/useAutosave.ts`: debounce de 1500ms, estados `idle | salvando | salvo | erro`. **Não existe timeout de rede**, **não existe detecção de `navigator.onLine`/eventos `online`/`offline`**, e **não existe retry automático**. Comportamento real observado (via QA anterior, com DevTools → Network → Offline): o estado fica preso em `"Salvando..."` indefinidamente enquanto a rede está fora, porque o `fetch` da Server Action simplesmente não resolve nem rejeita até a rede voltar — não há `AbortController`/timeout no código para forçar um estado de erro. Isso é o DEF-04. Não há aviso de "sair com alterações não salvas" (`beforeunload`) em nenhum lugar.

`components/intake/autosave-status.tsx` mostra só texto (`"Salvando..."`, `"Todas as alterações salvas"`, `"Erro ao salvar. Ajuste algo para tentar de novo."`), sem hora do último salvamento (a especificação da Fase 1 pede "Salvo às HH:MM").

### A.6 Motor de valuation

`lib/valuation/calcular.ts`, função pura `calcularValuation(dados: DadosProcesso)`. Já expõe os 3 métodos separadamente no retorno (`valuationEbitda`, `valuationDcf`, `valuationPatrimonial`, mais `valuationFinal`) — **não é necessário refatorar para "expor os valores por método"; isso já existe.** Fórmula, com as constantes nomeadas no próprio arquivo:

- `valuationEbitda = ebitdaBase × 4` (múltiplo fixo, `MULTIPLO_EBITDA_PADRAO`).
- `valuationDcf`: projeta o EBITDA do último ano como proxy de fluxo de caixa livre, 5 anos, crescimento de 3% a.a., desconto de 15% a.a., **sem valor terminal** (soma só os 5 fluxos descontados).
- `valuationPatrimonial = financeiro.balanco.patrimonioLiquido` (posição mais recente informada, sem versionar por ano).
- `valuationFinal`: média ponderada 0,5×EBITDA + 0,3×DCF + 0,2×Patrimonial, com **renormalização dos pesos** se EBITDA/DCF não puderem ser calculados (nenhum ano do DRE com `receitaBruta > 0` ou `ebitda != 0`) — nesse caso o patrimonial sozinho vira o resultado. Isso já está implementado, não é uma decisão nova.
- **`ebitdaBase` pode ser negativo, e o código não trata esse caso**: `valuationEbitda` e `valuationDcf` saem negativos sem nenhum aviso, sem piso em zero, sem bloqueio. Verificado na QA anterior com um caso real: EBITDA de -R$ 120.000 no ano mais recente gerou consolidado de -R$ 70.903, exibido normalmente na tela como se fosse um resultado válido. Isso é exatamente o D1.
- `valuationPatrimonial` (= patrimônio líquido) também pode ser negativo — é só o número informado no balanço, sem nenhum tratamento especial; se negativo, entra direto na média ponderada como um valor negativo.

### A.7 Score atual (a ser substituído pelo Índice de Prontidão)

`lib/valuation/score.ts`, função pura `calcularScore(dados)`. 4 dimensões, 0–100, média simples para o total. Cada dimensão de hoje é uma **nota de qualidade/atratividade heurística** (ex.: margem EBITDA vs. referência de 30%, alavancagem vs. limiar de 1,5×, concentração de clientes, diversificação de fornecedores, concorrentes mapeados, tamanho do texto de posicionamento, quantidade de documentos) — **não** é "percentual de campos preenchidos". Isso é conceitualmente diferente do Índice de Prontidão pedido na Fase 2, que é puramente sobre completude, não sobre qualidade do negócio. As fórmulas atuais estão bem documentadas em comentários no próprio arquivo (ver citação completa nas mensagens anteriores desta conversa), incluindo a regra de "nota neutra 50" para campos ambíguos entre "não preenchido" e "genuinamente zero".

Persistido em `public.resultados`: colunas `score_total`, `score_financeiro`, `score_operacao`, `score_mercado`, `score_juridico` (todas `numeric not null`). **Não existe nenhuma coluna de versão/formato** nessa tabela — é um retrato relevante para D3.

### A.8 Integração com IA

`lib/ai/analisar.ts`, função `analisarComIA(dados)`, chamada só a partir de `app/api/processos/[processoId]/gerar-resultado/route.ts` (Route Handler, roda no servidor). `new Anthropic()` lê `ANTHROPIC_API_KEY` do `process.env` automaticamente (SDK oficial) — **confirmado por busca no repositório: essa variável só é referenciada em `lib/ai/analisar.ts` e no route handler acima, nenhum componente `"use client"` a importa, então ela já não vaza para o navegador hoje.** O bundle do cliente nunca inclui esse arquivo porque nada client-side importa `lib/ai/analisar.ts`.

O `try/catch` em `analisarComIA` já diferencia `AuthenticationError`, `RateLimitError` e `APIError` do SDK, com `console.error` específico para cada — **mas nunca loga a própria chave** (só `error.status`/`error.message`), então esse ponto do DEF-03 já está atendido. O problema real do DEF-03 é o que acontece depois: em qualquer erro, a função devolve `FALLBACK_ANALISE_IA = { pontosFortes: [], riscos: [], recomendacoes: [] }`, e a tela (`components/resultado/analise-ia-cards.tsx`) renderiza os 3 cards normalmente, só que vazios — sem nenhuma indicação de que algo falhou, sem botão de "tentar novamente" específico para a análise (existe um "Recalcular Resultado" geral, que recalcula TUDO, não só a IA). **Causa raiz confirmada em produção nesta auditoria anterior: a variável `ANTHROPIC_API_KEY` está ausente no ambiente de Produção da Vercel** (`vercel env ls` mostrou só as duas chaves do Supabase) — a chamada falha em ~1,1s com `AuthenticationError`, cai no fallback, e a tela mostra os 3 cards vazios como se a análise tivesse rodado e não tivesse nada a dizer.

### A.9 Tela de resultado

`app/(app)/processos/[processoId]/resultado/page.tsx` (Server Component): busca `processos.nome_empresa` e a linha de `public.resultados` (mapeada por `lib/valuation/resultados.ts::mapRowParaResultadoValuation`). Se não existe resultado, mostra `ResultadoVazio` (CTA "Gerar Resultado"). Se existe, mostra nessa ordem: `ValuationDestaque` (número grande), `ValuationBreakdown` (3 cards com método + peso), `ScoreGauge` (nota geral 0-100 com faixa de cor + rótulos "Atenção/Regular/Bom") + `ScoreBreakdown` (4 barras), `AnaliseIaCards` (3 colunas: Pontos Fortes/Riscos/Recomendações), e por fim "Recalcular Resultado". **Não existe hoje**: seção "o que ainda falta" com pendências, seção expansível "como chegamos a este resultado" com a fórmula por extenso, aviso de "análise preliminar" em texto completo, nem botão de exportar PDF.

`components/resultado/gerar-resultado-button.tsx`: chama `POST /api/processos/[id]/gerar-resultado`, e no sucesso já chama `setCarregando(false)` **antes** de retornar (corrigido numa sessão anterior — o DEF-05 já está resolvido no código atual: o `finally` efetivo já existe, embora não estruturado como bloco `finally` literal).

O endpoint (`app/api/processos/[processoId]/gerar-resultado/route.ts`) já: autentica, confirma que o processo pertence ao usuário, consolida os dados (`consolidarDadosProcesso`), calcula valuation e score, chama a IA, faz upsert em `public.resultados` (`onConflict: "processo_id"`) e, desde uma sessão anterior, também marca `processos.status = "concluido"` (melhor esforço, não falha a request se isso não gravar). **Bloqueio existente hoje**: se `valuationEbitda`/`valuationDcf` vierem `null` (nenhum ano do DRE preenchido), a rota responde 422 com uma mensagem — mas essa mensagem só aparece se o usuário clicar em "Gerar Resultado"; não há nada na tela do intake avisando disso antes.

### A.10 Schema do banco (`supabase/schema.sql`)

Tabelas: `users` (1:1 com `auth.users`, criada por trigger `handle_new_user`), `processos` (`status text default 'em_andamento'`, comentário diz `em_andamento | concluido | arquivado`), `partners` (sócios, normalizado, espelha o array `socios` do jsonb de Perfil), `intake_data` (uma linha por `processo_id` + `fase`, `dados jsonb`, `unique(processo_id, fase)`), `resultados` (uma linha por `processo_id`, `unique(processo_id)`, upsert a cada geração — **não há histórico de versões do resultado**). RLS em todas as tabelas, sempre pelo padrão "o processo pai pertence a `auth.uid()`". Bucket de Storage `documentos-intake` (privado, 20MB, tipos MIME específicos), com policies equivalentes.

**Achado relevante para a Fase 4.3 (exclusão de processo)**: `processos` tem `on delete cascade` para `partners`, `intake_data` e `resultados` — apagar uma linha de `processos` já limpa essas três tabelas automaticamente, sem precisar de código adicional. **Mas os arquivos no bucket `documentos-intake` NÃO são apagados em cascata** (Storage não é uma tabela Postgres com FK) — excluir um processo hoje deixaria os arquivos órfãos no bucket para sempre, a menos que o código de exclusão liste e remova explicitamente os objetos sob o prefixo `{processoId}/` antes ou depois de apagar a linha de `processos`.

---

## B. Gap analysis

Legenda de estado: 🟢 Já existe · 🟡 Existe parcialmente · 🔴 Não existe.

### Fase 1 — Correções de qualidade

| Item | Estado | Problema | Solução proposta | Arquivos impactados | Risco | Critério de aceite |
|---|---|---|---|---|---|---|
| DEF-01 (obrigatórios + navegação livre) | 🔴 | Nenhum formulário aciona a validação zod já configurada; o `✓` do stepper significa "tem linha salva", não "está completo"; "Gerar Resultado" só bloqueia no caso extremo (nenhum DRE preenchido), via erro 422 pós-clique | Ver Fase 1 da spec + depende de **D2** (lista mínima de campos) | `intake-stepper.tsx`, os 5 `*-form.tsx`, novo módulo de "completude por fase", `gerar-resultado-button.tsx`/rota da API | Médio — toca todos os formulários, mas sem mudar schema nem motor | Navegar com campos vazios continua possível; "Gerar Resultado" fica desabilitado com lista exata de pendências (etapa + campo) até D2 ser respondida |
| DEF-02 (input monetário) | 🔴 | `components/intake/money-input.tsx` já existe mas: (1) o parse no `onBlur` que falha vira `undefined` **silenciosamente**, sem mensagem; (2) não há um "único" utilitário de parse — a lógica de parse/format está duplicada dentro do próprio componente | Adicionar validação explícita com mensagem inline dentro do `MoneyInput` existente (não recriar do zero — o componente já é único e já é reusado em todos os campos monetários dos 4 formulários que têm valores em R$) | `components/intake/money-input.tsx` | Baixo — é um componente já centralizado, a mudança é local | Digitar "abc" mostra erro no campo, não apaga o valor anterior; "1.234,56" salva como `1234.56` |
| DEF-03 (IA vazia sem aviso) | 🟡 | A chave já não vaza pro cliente e o erro já não loga a chave (confirmado em A.8). Falta: (1) a rota devolver ao cliente que a IA falhou (hoje `analisarComIA` engole o erro internamente e a rota nunca sabe que houve fallback); (2) a tela mostrar um estado de erro específico da seção de IA, com retry só daquela seção | `analisarComIA` passar a devolver também um indicador de sucesso/falha (ex.: `{ ok: boolean, analise: AnaliseIA }` em vez de só o fallback silencioso); a rota repassar isso; `AnaliseIaCards` (ou um novo wrapper) mostrar "Análise qualitativa indisponível no momento" + botão "Tentar novamente" que re-chama só a análise | `lib/ai/analisar.ts`, `app/api/processos/[processoId]/gerar-resultado/route.ts`, `components/resultado/analise-ia-cards.tsx`, schema de `resultados` (precisa de um jeito de marcar "IA falhou" — ver observação abaixo) | Médio — muda o contrato de retorno da rota; precisa decidir onde guardar "a IA falhou nesta geração" (proposta: um campo dentro do próprio jsonb `analise_ia`, ex. `{ pontosFortes: [], riscos: [], recomendacoes: [], erro: true }`, sem migration) | Sem a chave, valuation e índice aparecem normalmente; a seção de IA mostra erro + retry, nunca 3 cards vazios silenciosos |
| DEF-04 (autosave preso em "Salvando...") | 🔴 | Sem timeout, sem `navigator.onLine`, sem retry, sem `beforeunload` (ver A.5) | Adicionar timeout (~10s) via `AbortController` na Server Action ou no wrapper cliente, listeners de `online`/`offline`, retry ao reconectar, e `beforeunload` condicional a haver alterações pendentes | `lib/hooks/useAutosave.ts`, `components/intake/autosave-status.tsx` (para mostrar "Salvo às HH:MM") | Médio — mexe num hook usado por todos os formulários; testar bem os 4 formulários que o usam | Rede desligada → estado de erro em ~10s; rede volta → salva sozinho |
| DEF-05 (botão preso em loading) | 🟢 | Já corrigido: `handleClick` em `gerar-resultado-button.tsx` já chama `setCarregando(false)` tanto no sucesso quanto no `catch` | Nenhuma ação necessária além de, ao mexer no contrato da rota para o DEF-03, garantir que esse reset continua acontecendo | `components/resultado/gerar-resultado-button.tsx` (só revisar, não recriar) | Baixo | Já atendido; reconfirmar após as mudanças do DEF-03 |

### Fase 2 — Índice de Prontidão

| Item | Estado | Observação |
|---|---|---|
| Módulo de checklist determinístico | 🔴 | Não existe nada parecido hoje; `score.ts` é heurístico de qualidade, não de completude |
| Persistência sem migration | 🟡 possível | As colunas `score_financeiro/operacao/mercado/juridico` já existem, `not null`, 0-100 — dá para reaproveitá-las semanticamente para as 4 dimensões do Índice (Financeiro/Operacional/Mercado/Documental), sem alterar o schema, desde que D3 defina o que fazer com os resultados antigos que têm o significado antigo guardado nessas mesmas colunas |
| Remoção do "score" genérico da interface | 🔴 | `ScoreGauge`/`ScoreBreakdown` mostram o score de qualidade atual; precisam ser reescritos para mostrar o Índice de Prontidão (rótulos, tom e, no rodapé, a frase de esclarecimento obrigatória) |

### Fase 3 — Resultado e explicabilidade

| Item | Estado | Observação |
|---|---|---|
| Motor exposto por método | 🟢 | Já retorna `valuationEbitda`, `valuationDcf`, `valuationPatrimonial`, `valuationFinal` separadamente — **nenhuma refatoração de `calcular.ts` é necessária** para a Fase 3 em si (só depende de D1 para o tratamento de EBITDA negativo) |
| Terminologia "Estimativa preliminar de valuation" | 🔴 | Hoje o rótulo é "Valuation estimado" (`components/resultado/valuation-destaque.tsx`) |
| Seção "o que ainda falta" | 🔴 | Depende do mesmo checklist da Fase 2 (reaproveitar pendências, não criar um segundo motor) |
| Seção expansível "como chegamos a este resultado" | 🔴 | Não existe nenhuma progressive disclosure hoje; `ValuationBreakdown` já mostra valor+peso por método, mas não a fórmula por extenso com números reais nem fica escondida por padrão |
| Aviso de análise preliminar (texto completo) | 🔴 | Não existe texto de disclaimer nenhum na tela hoje |
| IA só como contexto de leitura | 🟢 | Já é assim: `analisarComIA` recebe `DadosProcesso` (não os números calculados, mas os dados brutos) e retorna só texto qualitativo; a rota calcula valuation/score ANTES de chamar a IA e nunca usa nada da resposta da IA nos campos numéricos |

Nota: a spec pede que a IA receba "os números já calculados, apenas como contexto de leitura" — hoje ela recebe os **dados de entrada**, não os números de valuation/prontidão calculados. Isso já satisfaz a garantia de segurança (a IA não pode influenciar os números porque nunca é chamada antes do cálculo, nem o resultado da IA é lido de volta para nada numérico), mas é uma pequena divergência de escopo: enriquecer o prompt com os números finais é uma mudança de conteúdo do prompt, não de arquitetura, e fica registrada aqui para decisão na Fase 3 (não é uma das perguntas D1–D6, mas sinalizo para não presumir).

### Fase 4 — UX

| Item | Estado | Observação |
|---|---|---|
| 4.1 Esqueci a senha | 🟢 | Já existe por completo (ver A.1) |
| 4.2 Dashboard sem e-mail duplicado | 🔴 | E-mail aparece duas vezes: no `AppShell` (cabeçalho) e abaixo da saudação |
| 4.3 Cards de processo com menu ⋮ e exclusão | 🔴 | Hoje são 2 botões sempre visíveis, sem menu, sem exclusão nenhuma |
| 4.4 Perfil do usuário | 🔴 (depende de D5) | Não existe rota nem componente |
| 4.5 Navegação do intake (sidebar) | 🟡 | O "← Dashboard" já existe (no `AppShell`, todas as telas) — falta decidir sidebar vs. melhorar o stepper horizontal existente (ver seção C, avaliação crítica) e o indicador de completude não depender só de cor |
| 4.6 Propósito de cada etapa | 🔴 | Nenhuma etapa tem frase de contexto hoje |
| 4.7 Ajuda contextual "(?)" | 🔴 | Não existe nenhum componente de ajuda nem arquivo de conteúdo centralizado |
| 4.8 Acessibilidade/consistência | 🟡 | Labels existem (todos os `<label>` envolvem o `<input>`), mas: sem `aria-invalid`/`aria-describedby` nos erros, sem padrão único de botão (ver D) |

### Fase 5 — PDF

🔴 Não existe nada — nem dependência instalada, nem rota, nem página de impressão. Depende de D4.

---

## C. Auditoria de UX pelas 10 heurísticas de Nielsen

Auditoria feita **navegando a aplicação de verdade**, rodando localmente (`next dev`, porta 3000) com a conta `augusto_lordano@hotmail.com` e um processo real com massa de dados completa, usando automação de navegador para capturar cada tela (login, cadastro, esqueci senha, dashboard, as 5 etapas do intake, resultado, diálogo de confirmação de exclusão de documento). Não foi uma auditoria só de componentes — o fluxo de ponta a ponta foi percorrido e observado.

### Problemas por severidade

| # | Tela/Componente | Heurística violada | Problema concreto | Impacto para o usuário | Severidade | Correção recomendada |
|---|---|---|---|---|---|---|
| 1 | Intake → Financeiro | 8 (Estética e design minimalista) / 1 (Visibilidade do status do sistema, no sentido de "o que importa aqui") | 24 campos monetários de DRE + 5 de balanço aparecem todos com o mesmo peso visual; só 4 desses ~30 campos (receita bruta e EBITDA do ano mais recente, patrimônio líquido, dívidas) alimentam qualquer cálculo, e nada na tela diferencia isso | Um empresário sem formação financeira não tem como saber que preencher "Lucro bruto" ou "Ativo circulante" não muda nada no resultado — gasta tempo e pode desistir no meio | **4 (P0)** | Fase 4.6/4.7: marcar visualmente (ou ao menos explicar via "(?)") quais campos afetam o quê; considerar (fora do escopo desta rodada, só registrado) reduzir os campos pedidos aos que o motor realmente usa |
| 2 | Todo o intake | 1 (Visibilidade do status do sistema) | O `✓` no stepper aparece assim que qualquer campo é tocado, mesmo com a etapa longe de completa (ver A.3) | O usuário pensa que já "terminou" uma etapa que na verdade está incompleta, e só descobre isso ao tentar gerar o resultado (ou nem descobre, se o resultado sair com números baixos sem explicação) | **4 (P0)** | DEF-01: indicador de completude real (não só "tem linha salva"), sem depender só de cor |
| 3 | Resultado | 1 e 6 (Reconhecimento em vez de memorização) | "Múltiplo de EBITDA", "Fluxo de Caixa Descontado", "Score geral" aparecem sem nenhuma explicação; o usuário precisa lembrar/saber o que cada termo significa | Público-alvo declarado (empresário sem formação em finanças) não entende de onde vêm os números nem o que fazer com eles | **4 (P0)** | Fase 3 (explicabilidade) + Fase 4.7 (ajuda contextual) |
| 4 | Resultado | 9 (Ajudar o usuário a reconhecer e corrigir erros) | Quando a IA falha (hoje, sempre, por causa do DEF-03), os 3 cards de "Pontos Fortes/Riscos/Recomendações" aparecem vazios, sem título de erro nem ação — parecem "a IA não teve nada a dizer" | Interpretação errada do resultado: o usuário pode achar que a empresa não tem pontos fortes nem riscos, quando na verdade a análise simplesmente falhou | **4 (P0)** | DEF-03 |
| 5 | Dashboard, cards de processo | 4 (Consistência e padrões) | E-mail do usuário aparece duas vezes na mesma tela (cabeçalho + abaixo da saudação) | Redundância que não ajuda e ocupa espaço | **1 (P1)** | Fase 4.2 |
| 6 | Perfil + Operação | 4 (Consistência e padrões) | "Número de funcionários" (Perfil) e "Número total de funcionários" (Operação) são dois campos parecidos, sem relação entre si, em duas telas diferentes; nenhum dos dois é usado no motor de cálculo hoje | Trabalho duplicado, gera dúvida sobre qual preencher/atualizar | **2 (P1)** | Registrar como achado; decisão de unificar fica fora do escopo desta rodada (mudaria o schema/formulário) — mencionar explicitamente no relatório para o grupo decidir depois |
| 7 | Intake, todas as etapas | 6 (Reconhecimento em vez de memorização) | Nenhuma etapa explica por que os dados são pedidos | O usuário preenche "no escuro", sem entender a relação com o resultado final | **3 (P0)** | Fase 4.6 |
| 8 | Dashboard | 2 (Correspondência entre o sistema e o mundo real) / carga cognitiva | Não existe forma de excluir um processo de teste/errado — um usuário que criou um processo por engano (ex.: "aduhdawhdawuhd", presente nos dados reais de teste) fica com ele para sempre na lista | Poluição visual, ansiedade de "não consigo limpar meus dados" | **3 (P0)** | Fase 4.3 |
| 9 | Autosave (todas as etapas) | 1 (Visibilidade do status do sistema) | Sem rede, o indicador fica preso em "Salvando..." (nunca vira "Erro"), então o usuário pode fechar a aba achando que salvou | Perda de dados sem aviso — o pior tipo de falha de confiabilidade | **4 (P0)** | DEF-04 |
| 10 | `money-input.tsx` (todos os campos R$) | 9 (Ajudar a reconhecer e corrigir erros) | Digitar algo não numérico é aceito na hora e só vira erro (silencioso, viram "R$ 0,00") ao perder o foco, sem nenhuma mensagem | O usuário acha que salvou um valor e na verdade salvou zero, distorcendo o cálculo sem aviso | **4 (P0)** | DEF-02 |
| 11 | Resultado, `ScoreGauge` | 2 (Correspondência com o mundo real) | Rótulos "Atenção / Regular / Bom" sugerem uma nota de qualidade da empresa — o texto oficial do Índice de Prontidão (Fase 2) deixa claro que NÃO é isso | Interpretação errada e potencialmente ofensiva ("meu negócio é só 'regular'?") quando na verdade é só completude de dados | **3 (P0)** | Fase 2 — trocar rótulos e adicionar a frase de esclarecimento obrigatória |
| 12 | Botões em geral | 4 (Consistência) | Não existe um componente de botão único — cada arquivo repete classes Tailwind ligeiramente diferentes (`bg-black` vs `bg-ink`, por exemplo, ainda coexistem em partes do código) | Pequenas inconsistências visuais (cor, espaçamento) entre telas | **1 (P2)** | Seção D — design system mínimo |
| 13 | Financeiro, DRE | 7 (Flexibilidade e eficiência de uso) | Os 3 blocos de ano são idênticos e repetidos verticalmente; em telas menores a rolagem é longa | Cansaço para preencher, especialmente em notebooks pequenos | **2 (P1)** | Fora do escopo desta rodada (mudaria o layout do formulário) — registrado como melhoria futura |
| 14 | Intake, campo "Ano" do DRE | 5 (Prevenção de erros) | O campo "Ano" é um número livre editável, sem trava — dá para os 3 blocos ficarem com anos repetidos ou fora de ordem | Silenciosamente muda qual ano é considerado "mais recente" pelo motor (`anosDreComDados` ordena por `ano`), afetando o resultado sem que o usuário perceba | **3 (P1)** | Fora do escopo direto das 6 fases pedidas, mas registrado — poderia virar um item da Fase 1 se o grupo concordar |

### Problemas de navegação
- Dois caminhos para "voltar ao Dashboard" com comportamentos diferentes (logo do `AppShell`, sempre ativo; botão de rodapé, trava durante o autosave) — ver item 2 acima e a decisão da Fase 4.5.
- Não há como chegar em "Resultado" a partir de dentro do intake sem passar pelo Dashboard (só existe o link inverso, resultado→intake).
- O stepper não indica progresso relativo (ex.: "etapa 3 de 5"), só a posição visual das pílulas.

### Problemas de carga cognitiva
- Financeiro: ~30 campos numa tela só, sem seções colapsáveis (item 1 e 13).
- Operação: 5 blocos diferentes (equipe, cargos, clientes, clientes principais, fornecedores, texto livre) numa página só, sem agrupamento visual além de `<fieldset>`.

### Problemas de terminologia
- "Múltiplo de EBITDA", "Fluxo de Caixa Descontado", "Patrimonial", "EBITDA", "TAM" aparecem sem glossário (item 3).
- "Score geral" / "Atenção-Regular-Bom" conflita com o significado pretendido do Índice de Prontidão (item 11).
- "Continuar intake" vs. "Editar intake" já foi implementado corretamente (o texto já reflete o estado real) — ver avaliação crítica abaixo sobre a sugestão da spec.

### Problemas de consistência visual
- `bg-black` (herança do scaffold original) ainda aparece em alguns componentes junto com o novo token `bg-ink` introduzido numa sessão anterior — não é incorreto visualmente (ambos são bem próximos), mas é uma inconsistência de manutenção que vale unificar quando os componentes forem tocados nas próximas fases.
- Bordas, raios e sombras seguem o padrão Tailwind default de forma consistente hoje (não há problema de inconsistência aqui).

### Melhorias recomendadas (por prioridade)

**P0 (essencial antes da banca):**
- DEF-01 a DEF-04 completos (itens 1, 2, 4, 9, 10 da tabela).
- Índice de Prontidão substituindo o score de qualidade, com rótulos e disclaimer corretos (item 11).
- Explicabilidade mínima do resultado (item 3).
- Exclusão de processo (item 8).

**P1 (importante, esforço razoável):**
- Remover e-mail duplicado do dashboard (item 5).
- Indicador de completude por campo/etapa não depender só de cor.
- Ajuda contextual "(?)" nos termos prioritários listados na Fase 4.7.

**P2 (desejável, pode esperar):**
- Design system unificado de botões (item 12).
- Reorganização do formulário Financeiro em seções colapsáveis (item 13) — mudança de layout maior, fora do escopo atual.
- Trava de duplicidade de "Ano" no DRE (item 14).

### Mudanças que NÃO valem o custo neste MVP
- Unificar "Número de funcionários" do Perfil com o da Operação: exigiria decidir qual tela é a fonte da verdade e migrar dados de processos já criados — desproporcional para um MVP acadêmico com poucos processos de teste. Registrado como achado (item 6), não como tarefa desta rodada.
- Reduzir os ~26 campos do DRE/balanço que não alimentam nenhum cálculo: mudaria o formulário e o schema do jsonb; mais seguro resolver por explicação (Fase 4.6/4.7) do que por remoção de campos nesta rodada.
- Responsividade mobile completa: já era escopo explicitamente excluído no plano de testes de QA anterior; mantenho a mesma linha aqui — só a "solução mais simples" pedida em 4.5 para mobile, sem redesenho geral.
- Certificação WCAG completa (a própria spec já exclui isso em 4.8).

### Avaliação crítica das sugestões da própria especificação

**Sidebar no desktop (4.5).** Não recomendo a sidebar como está proposta. Motivos concretos: (1) o intake tem só 5 etapas + Resultado — uma lista fixa de 6 itens não precisa da escalabilidade que uma sidebar oferece; (2) o formulário mais pesado do fluxo (Financeiro, DRE de 3 anos) já é bem largo — uma coluna lateral fixa reduziria a largura útil exatamente na tela que mais precisa dela; (3) o app já tem uma stepper horizontal funcionando, com `aria-current="step"` implementável sem trocar o padrão de interação, e o `AppShell` já cobre o "← Dashboard" pedido. **Proposta alternativa**: manter o stepper horizontal existente, mas (a) adicionar um indicador de completude real por pílula (ícone, não só cor — ex. um traço/contorno diferente para "incompleta"), (b) acrescentar uma 6ª pílula "Resultado" ao final do stepper, sempre visível mas desabilitada/com tooltip até existir um resultado, e (c) no mobile, reduzir para um `<select>` de etapa (mais simples que tentar espremer 6 pílulas). Isso atende a todos os requisitos funcionais de 4.5 (saber onde está, navegar, ver completude, chegar ao Resultado) com uma fração do código de uma sidebar nova, e sem competir por largura com o formulário Financeiro. Apresento isso como recomendação; se o grupo preferir a sidebar mesmo assim, também é viável — só custa mais.

**Ordem da tela de resultado (proposta da Fase 3).** A ordem sugerida (valuation → Índice de Prontidão → pendências → "como chegamos" → IA → aviso) faz sentido e eu a manteria: primeiro o que o usuário veio buscar (o número), depois o que precisa melhorar (índice + pendências, que são acionáveis), só depois o "porquê" (que é opcional/progressive disclosure) e a IA por último, já que é a camada mais qualitativa e menos determinística. Não vejo uma ordem melhor a propor — concordo com a spec aqui.

**"Continuar" vs. "Editar" (4.3).** Já implementado corretamente no código atual (ver A.2): o texto do botão já reflete `intakeCompleto(processo.id)`. Nenhuma ação necessária aqui além de replicar esse mesmo texto dentro do novo menu `⋮` da Fase 4.3.

---

## D. Design system mínimo

Estado atual: **não existe um design system**, no sentido de componentes reutilizáveis com variantes documentadas. O que existe:

| Padrão | Existe? | Onde | Observação |
|---|---|---|---|
| Botão primário | 🟡 | Classes Tailwind repetidas em cada arquivo (`rounded bg-ink px-4 py-2 text-sm font-medium text-white ...`) | Funciona, mas não é um componente — qualquer ajuste futuro precisa tocar múltiplos arquivos |
| Botão secundário | 🟡 | Idem, com `border border-zinc-300` | Mesma observação |
| Botão destrutivo | 🟡 | Só existe dentro de `components/confirm-dialog.tsx` (`bg-red-600`) | Não há um botão destrutivo "solto" fora do modal ainda |
| Campo + label + erro | 🟡 | Padrão manual repetido em cada formulário (`<label className="flex flex-col gap-1 text-sm">texto<input/></label>`) | Sem `aria-invalid`/`aria-describedby` |
| Tooltip/Popover | 🔴 | Não existe | Necessário para 4.7 |
| Modal | 🟢 (mínimo) | `components/confirm-dialog.tsx` (`useConfirm()` — hook + JSX, `role="alertdialog"`, fecha com Esc, foco inicial no botão seguro) | Já é genérico o suficiente para reaproveitar no modal de exclusão de processo (4.3) sem mudanças |
| Menu (dropdown) | 🔴 | Não existe | Necessário para o menu `⋮` de 4.3 |
| Card | 🟡 | Padrão ad-hoc (`rounded-lg border border-zinc-200 p-4`) repetido, nunca extraído em componente | Suficiente para reaproveitar como classe utilitária, não precisa virar componente agora |
| Status (selo) | 🟢 | `components/status-badge.tsx` | Já cobre `em_andamento`/`concluido`/`arquivado`; pode ganhar mais variantes se necessário |
| Loading (spinner) | 🟡 | Só embutido dentro de `gerar-resultado-button.tsx` (`div` com `animate-spin`) | Vale extrair para reaproveitar (ex.: num futuro botão de retry da IA) |
| Feedback de sucesso/erro inline | 🟡 | Padrão ad-hoc (`erroGeral` state + `<p className="border-red-200 bg-red-50 ...">`) em `documentos-form.tsx` | Funciona, não está extraído em componente |

**Proposta mínima para as próximas fases**, só com Tailwind (sem biblioteca nova):

1. `components/ui/button.tsx` — um componente com `variant: "primario" | "secundario" | "destrutivo"` e os estados `hover`/`focus-visible`/`disabled` centralizados, para substituir as classes repetidas.
2. `components/ui/field.tsx` — wrapper de campo com `label`, slot de erro (`aria-invalid`, `aria-describedby` automáticos), usado nos formulários que forem tocados nas próximas fases.
3. `components/ui/popover-ajuda.tsx` — o botão "(?)" de 4.7, generalizando o que já aprendemos com `confirm-dialog.tsx` (abre por clique/foco/Enter, fecha com Esc).
4. `components/ui/menu.tsx` — menu de ações `⋮` de 4.3 (abre/fecha, `Esc`, foco retorna ao botão que abriu).
5. Generalizar `components/confirm-dialog.tsx` (já existe) para aceitar título/texto/rótulo do botão de confirmação customizados — hoje o texto do botão de confirmar é fixo em "Remover"; a Fase 4.3 pede "Excluir".

Nenhum desses precisa de biblioteca externa — são padrões de composição de componentes React + Tailwind, do mesmo tamanho e estilo do que já existe em `confirm-dialog.tsx` e `status-badge.tsx`.

---

## E. Mapa de navegação proposto

```
/ (landing pública)
 └─ Entrar → /login ──────────────┐
 └─ Criar conta → /signup         │
      └─ /verify-email            │
 └─ Esqueceu a senha → /forgot-password → (e-mail) → /reset-password
                                   │
                                   ▼
                            /dashboard
                            [Cabeçalho: marca ValuM&A | menu do usuário (Fase 4.4) | Sair]
                            [Novo Valuation] → cria processo → /intake/[id]/perfil
                            [Card de processo] → menu ⋮:
                                 ├─ Continuar preenchimento | Editar dados → /intake/[id]/perfil
                                 ├─ Ver resultado (só se existir) → /processos/[id]/resultado
                                 └─ Excluir processo → modal de confirmação → (permanece no /dashboard)
                                   │
                                   ▼
        /intake/[id]/perfil ⇄ financeiro ⇄ operacao ⇄ mercado ⇄ documentos
        [Navegação: "← Dashboard" sempre visível; stepper com 5 etapas + item "Resultado"]
        [Bloqueio: "Gerar Resultado" desabilitado até completar os campos mínimos (D2)]
                                   │
                                   ▼
                     /processos/[id]/resultado
                     [Estimativa preliminar → Índice de Prontidão → Pendências →
                      Como chegamos a este resultado (expansível) → Análise de IA →
                      Baixar PDF → Aviso de análise preliminar]
                     [← Editar dados do intake]
```

O menu do usuário (Fase 4.4, dependente de D5) pode viver dentro do próprio `AppShell` (dropdown ao clicar no e-mail/nome no cabeçalho) ou como página própria em `/perfil` — ambas as opções cabem no mapa acima sem mudar o restante da navegação; a escolha entre as duas é exatamente o D5.

---

## F. Decisões que precisamos de vocês

*(preenchidas com o que encontrei no código — nenhuma delas foi decidida por conta própria)*

**D1 — EBITDA não positivo e Patrimônio Líquido negativo.**
Comportamento atual, com exemplo real testado nesta auditoria anterior: EBITDA do ano mais recente = -R$ 120.000 (demais dados da massa de teste M1) → `valuationEbitda` = -R$ 480.000, `valuationDcf` = -R$ 436.345 (projeta o EBITDA negativo por 5 anos), `valuationPatrimonial` = R$ 1.500.000 (positivo, sem relação com o EBITDA) → `valuationFinal` = -R$ 70.903, exibido na tela normalmente, sem nenhum aviso. Patrimônio Líquido negativo tem o mesmo problema: `valuationPatrimonial` seria negativo e entraria direto na média ponderada, sem tratamento algum — **não testei esse segundo caso na prática ainda porque não tenho aprovação para gerar dados/rodar código nesta fase**, mas a leitura do código (`calcularValuation` usa `financeiro.balanco.patrimonioLiquido` diretamente, sem `Math.max(0, ...)` nem checagem de sinal) confirma que o mesmo problema existe.
Opções, sem redistribuir os pesos 50/30/20:
- **(a)** Marcar Múltiplos e/ou DCF como "não aplicável" quando o EBITDA base for ≤ 0, e não exibir o consolidado nesse caso — mostrar só os métodos aplicáveis (ex.: só o Patrimonial) com um aviso explícito de que os demais não puderam ser calculados. Mesma lógica para Patrimonial ≤ 0 (marcar como "não aplicável").
- **(b)** Bloquear a geração do resultado inteiro quando EBITDA base ou Patrimônio Líquido forem ≤ 0, explicando o motivo antes de calcular qualquer coisa.
- **(c)** Exibir o valor negativo, mas com um aviso destacado (banner) explicando que o resultado indica uma limitação do método simplificado, sem impedir a visualização — mantém a transparência total dos dados, ao custo de mostrar um número "estranho" para o usuário.
Aguardo a escolha do grupo/orientação antes de tocar em `lib/valuation/calcular.ts`.

**D2 — Critério mínimo para gerar o resultado.**
Com base no que `calcularValuation` e `calcularScore` realmente leem (ver A.4 e A.6), a lista mínima **hoje tecnicamente necessária** seria: pelo menos 1 ano do DRE com `receitaBruta > 0` ou `ebitda != 0` (idealmente o ano mais recente preenchido, para evitar ambiguidade), e `financeiro.balanco.patrimonioLiquido` informado (hoje aceita 0 como padrão, o que é tecnicamente "válido" mas financeiramente pouco significativo). Proponho, para a Fase 1, que "obrigatório" cubra também um mínimo de identificação (razão social, setor — já obrigatórios no schema do Perfil) e pelo menos o EBITDA do ano mais recente do DRE, já que é o único valor que sozinho decide se Múltiplos/DCF existem ou não. Não incluí por conta própria o restante dos ~30 campos do Financeiro nem os campos de Operação/Mercado (que só afetam o Índice de Prontidão, não o valuation) como "obrigatórios para gerar resultado" — isso misturaria "obrigatório para ter uma estimativa numérica" com "obrigatório para ter um Índice de Prontidão alto", que são coisas diferentes. Peço confirmação do grupo sobre onde traçar essa linha.

**D3 — Compatibilidade do score antigo.**
`public.resultados` não tem coluna de versão. As colunas `score_financeiro/operacao/mercado/juridico` já existem e podem ser reaproveitadas para as 4 dimensões do Índice de Prontidão sem migration — mas processos que já têm um resultado gerado (hoje, no ambiente de teste, existem pelo menos 2: "Empresa Teste Campinas Ltda." e "aduhdawhdawuhd") teriam essas colunas com o **significado antigo** (score de qualidade) até serem recalculados. Opções:
- **(a)** Recalcular sob demanda: a próxima vez que alguém abrir ou clicar em "Recalcular Resultado" naquele processo, os números viram o novo Índice automaticamente (upsert já faz isso); até lá, o processo mostraria números do formato antigo sob os rótulos novos, o que seria enganoso por um tempo.
- **(b)** Recalcular todos os resultados existentes de uma vez (script único, sem migration de schema) no momento do deploy da Fase 2 — mais seguro, dado que hoje são só processos de teste.
- **(c)** Guardar um marcador de versão dentro do jsonb `analise_ia` (que já é `jsonb`, flexível, sem precisar de migration) e mostrar um aviso "resultado em formato anterior, recalcule para atualizar" enquanto esse marcador não existir ou for antigo.
Recomendo (b) combinado com (c) — como são poucos processos de teste hoje, recalcular tudo de uma vez é barato, e o marcador em (c) protege contra o mesmo problema se aparecerem mais processos entre a aprovação deste plano e a implementação da Fase 2. Aguardo confirmação.

**D4 — PDF.**
Nenhuma biblioteca de PDF está instalada hoje. Duas abordagens, comparadas:
- **(a) Página de impressão + `window.print()` com CSS `@media print`.** Sem dependência nova, reaproveita os mesmos componentes React da tela de resultado (só com uma folha de estilo de impressão), risco baixo, mas o controle sobre paginação/quebras é limitado (o navegador decide onde cortar a página) e o "download" na prática é "imprimir → salvar como PDF", um passo a mais para o usuário.
- **(b) Biblioteca de geração de PDF** (ex. `@react-pdf/renderer` ou `pdfmake`, ambas rodando no servidor ou no cliente). Dá controle total de layout e um botão "Baixar" literal, mas é uma dependência nova (proibida sem aprovação, regra 2) e exige recriar o layout do relatório numa API própria da biblioteca (não reaproveita os componentes React da tela).
Recomendo (a) para este MVP acadêmico, dado o princípio de "baixo aumento de complexidade" e a regra de não instalar bibliotecas sem aprovação — mas aguardo a escolha do grupo, como pedido.

**D5 — Perfil do usuário: página própria ou dropdown no cabeçalho?**
Hoje não existe nenhum dos dois. Do ponto de vista de esforço, um dropdown no `AppShell` (que já existe e já mostra o e-mail) é menor: os 4 itens pedidos (nome editável, e-mail somente leitura, redefinir senha, sair) cabem num painel simples sem nova rota. Uma página própria (`/perfil`) é mais alinhada ao padrão "cada coisa importante tem sua URL", mas exige uma rota nova protegida + link de acesso a partir do cabeçalho de qualquer forma. Não tenho uma preferência forte — as duas são de baixa complexidade; aguardo a escolha do grupo.

**D6 — Framework de testes.**
Não há nenhum instalado hoje (`package.json` confirmado). Proponho **Vitest**: suporte nativo a ESM/TypeScript sem configuração pesada, rápido, e é exatamente adequado ao tipo de teste que a Fase 6 pede primeiro (funções puras — checklist de prontidão, motor de valuation, parse monetário) sem precisar rodar um navegador. Alternativa mais pesada seria Jest (mais configuração com Next.js 16 + Turbopack); não vejo motivo para preferi-lo aqui. Isso conta como nova dependência — aguardo aprovação explícita antes de instalar (regra 2), mesmo sendo `devDependency`.

---

## Observações finais desta fase

- Nenhum arquivo de código foi alterado para produzir este documento — só leitura e navegação da aplicação já rodando localmente.
- Os itens **DEF-05** (Fase 1) e **4.1** (Fase 4) já estão implementados no código atual, de uma sessão de trabalho anterior a este pedido; eles aparecem aqui como "🟢 Já existe" para não serem refeitos.
- Este plano não cobre a Fase 6 (testes) em detalhe além do que já está nas tabelas de cada fase — o roteiro de testes específico será feito quando cada fase for implementada, como a própria especificação pede.

**Aguardando aprovação deste plano e as respostas de D1 a D6 antes de iniciar a Fase 1.**
