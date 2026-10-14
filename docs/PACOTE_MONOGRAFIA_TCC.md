# Pacote Técnico — ValuM&A (Monografia e Banca)

**Versão do sistema documentada:** V2.0 (congelada — `docs/REGRAS_NEGOCIO_VALUMA_V2.md`, RG-57 a RG-71, estendendo `docs/REGRAS_NEGOCIO_VALUMA_V1.md`, RG-01 a RG-56).
**Data desta auditoria:** 2026-10-14.
**Método:** leitura direta do código-fonte, do schema SQL (`supabase/schema.sql`) e dos scripts de teste existentes no repositório `JFO05/valuma`, branch `main`. Nenhuma funcionalidade, requisito, entidade, fluxo, perfil ou tecnologia foi suposto — onde não há evidência no repositório, isso é dito explicitamente como lacuna (seção 16 do relatório final, enviado em separado).
**Esta rodada de trabalho é exclusivamente documental** — nenhum código, banco, migration, regra de negócio ou comportamento da aplicação foi alterado para produzir este pacote.

Este documento substitui a versão anterior de `docs/PACOTE_MONOGRAFIA_TCC.md` (que cobria só o estado da v1.0) por uma versão única, consolidada, cobrindo V1+V2 — a evolução v1.0 → v2.0 continua registrada como fato histórico na seção 1.4 e no Git, não foi apagada.

---

## Sumário

1. Visão geral técnica
2. Requisitos funcionais (RF)
3. Requisitos não funcionais (RNF)
4. DER / modelo de banco
5. Arquitetura da solução
6. Fluxograma funcional
7. Autenticação, autorização e perfis
8. Integração front-end × back-end
9. Relatórios, consultas e indicadores
10. Testes e qualidade
11. Bugs relevantes encontrados durante o desenvolvimento
12. Segurança e proteção de dados
13. Implantação
14. Estrutura para demonstração da banca
15. Arquivos importantes para a monografia

---

## 1. Visão geral técnica

### 1.1 Objetivo técnico do ValuM&A

O ValuM&A é uma aplicação web que conduz o usuário (dono ou representante de uma pequena/média empresa) por um fluxo guiado de coleta de informações ("intake") sobre essa empresa e, a partir dela, produz três saídas determinísticas ou semi-determinísticas:

1. uma **estimativa preliminar de Equity Value** (quando os dados informados tornam algum método de valuation aplicável);
2. um **Índice de Prontidão Informacional para M&A** (0–100%, quatro dimensões): mede a completude/estruturação da informação fornecida, não a qualidade do negócio;
3. uma **Análise Estratégica** qualitativa (pontos fortes, riscos, recomendações), gerada por IA a partir dos dados e dos números já calculados — nunca o contrário.

O sistema explicitamente **não** substitui avaliação contábil, financeira ou jurídica profissional, nem due diligence — isso é um texto de disclaimer fixo em toda tela de resultado e no PDF gerado a partir dela (ver `docs/REGRAS_NEGOCIO_VALUMA_V1.md`, RG-04/RG-55).

### 1.2 Principais módulos

| Módulo | Responsabilidade | Localização principal |
|---|---|---|
| Autenticação | Cadastro, login, recuperação de senha, sessão | `app/(auth)/*`, `lib/supabase/*` |
| Dashboard | Listagem/criação/exclusão de processos | `app/(app)/dashboard/*` |
| Intake | Coleta de dados em 6 etapas (Motor, Perfil, Financeiro, Operação, Mercado, Documentos) | `app/(app)/intake/*`, `components/intake/*` |
| Motor de Análise | Escolha e configuração do modelo de cálculo (Essencial/Configurável) | `lib/valuation/motor.ts`, `lib/intake/schema-motor.ts`, `components/intake/motor-form.tsx` |
| Motor de Valuation | Cálculo de Equity Value por 3 métodos + consolidado ponderado | `lib/valuation/calcular.ts` |
| Índice de Prontidão | Checklist determinístico de completude por dimensão | `lib/prontidao/checklist.ts` |
| Análise Estratégica (IA) | Geração de pontos fortes/riscos/recomendações qualitativos | `lib/ai/analisar.ts` |
| Assistente conversacional | Chat de contexto isolado sobre um resultado já gerado | `lib/ai/chat-assistente.ts`, `app/api/processos/[processoId]/chat/route.ts` |
| Resultado | Tela consolidada (valuation, prontidão, explicabilidade, pendências, análise, chat, PDF) | `app/(app)/processos/[processoId]/resultado/page.tsx` |
| Importação Excel | Preenchimento financeiro em lote via planilha | `lib/intake/excel-financeiro.ts`, `app/api/intake/financeiro/template/route.ts` |
| Landing page | Apresentação pública do produto | `app/page.tsx`, `components/landing/*` |

### 1.3 Fluxo geral da aplicação

Usuário não autenticado acessa a landing (`/`) → cria conta ou entra (`/signup`, `/login`, autenticação Supabase) → é redirecionado ao Dashboard (`/dashboard`) → cria um novo processo (`/intake`, que já cria a linha em `processos` e redireciona para a primeira etapa) → percorre as 6 etapas do intake (autosave a cada 1,5s de inatividade, RG implícita de UX) → gera o Resultado (`/processos/[id]/resultado`, aciona o cálculo de valuation + prontidão + IA) → consulta explicabilidade, pendências, conversa com o assistente e/ou imprime o PDF. Alterar qualquer etapa do intake depois de um resultado já gerado marca esse resultado como desatualizado (RG-46), sem apagá-lo.

### 1.4 Evolução do sistema (V1 → V2)

A V1.0 (regras RG-01 a RG-56, `docs/REGRAS_NEGOCIO_VALUMA_V1.md`) consolidou o motor de valuation (Enterprise Value → Equity Value via dívida líquida), o Índice de Prontidão (substituindo um "Score" antigo removido do código ativo) e a categorização documental. A V2.0 (RG-57 a RG-71, `docs/REGRAS_NEGOCIO_VALUMA_V2.md`) estendeu isso sem alterar nenhuma fórmula da v1.0: introduziu o Motor de Análise (Essencial/Configurável), anos financeiros dinâmicos no DRE, importação via Excel, o assistente conversacional e renomeou a seção de análise qualitativa para "Análise Estratégica". O Motor Essencial é, por construção e por teste automatizado, numericamente idêntico ao comportamento da v1.0.

### 1.5 Stack completa realmente utilizada

| Camada | Tecnologia | Evidência |
|---|---|---|
| Framework web | Next.js 16.3.4 (App Router, Turbopack, convenção `proxy.ts` no lugar de `middleware.ts`) | `package.json`, `proxy.ts` |
| Linguagem | TypeScript 5 | `package.json`, `tsconfig.json` |
| UI | React 19.2.8 + Tailwind CSS v4 | `package.json`, `app/globals.css` |
| Formulários | react-hook-form 7 + zod 3 (`@hookform/resolvers`) | `package.json`, `lib/intake/schema-*.ts` |
| Backend/dados | Supabase (PostgreSQL + Auth + Storage), via `@supabase/supabase-js` e `@supabase/ssr` | `lib/supabase/*`, `supabase/schema.sql` |
| IA | Anthropic API (`@anthropic-ai/sdk`), modelo `claude-opus-5` | `lib/ai/analisar.ts` (constante `MODEL`) |
| Planilhas | `exceljs` (parsing/geração de `.xlsx`, 100% server-side) | `lib/intake/excel-financeiro.ts` |
| Hospedagem | Vercel (deploy de produção confirmado, projeto `jfo05/valuma`) | `.vercel/project.json`, deploy ao vivo |
| Testes | `tsx` rodando scripts próprios (sem framework de teste externo) | `scripts/testar-*.ts`, `package.json` |

### 1.6 Como as camadas se relacionam

O front-end é majoritariamente **Server Components** do Next.js: a maioria das páginas (`dashboard`, `intake/[fase]`, `resultado`) busca dados diretamente do Supabase no servidor, a cada requisição, usando o cookie de sessão do usuário (via `@supabase/ssr`). Formulários interativos são Client Components (`"use client"`) que chamam Server Actions (`"use server"`, ex.: `excluirProcesso`, `atualizarNomeUsuario`, `syncPartners`) ou endpoints de API (`app/api/**/route.ts`) para mutações mais complexas (gerar resultado, chat, template Excel). A autenticação e o isolamento de dados por usuário não dependem de nenhuma checagem manual espalhada pelo código — são garantidos estruturalmente pelo Supabase Auth (sessão) e pelo Postgres Row Level Security (RLS) em toda tabela e no bucket de Storage (seção 7). A IA (Anthropic) é chamada só a partir de rotas de servidor (nunca do navegador), e só recebe os números já calculados como contexto de leitura — nunca os calcula ela mesma (RG-44).

---

## 2. Requisitos funcionais

Convenção: cada RF lista código, nome, descrição, evidência (arquivo principal) e status — todos **implementado**, confirmado por leitura direta do código nesta auditoria. Regras internas de cálculo (ex.: "múltiplo fixo de 4,0x") não viraram RFs separados — elas são regras de negócio, documentadas em `docs/REGRAS_NEGOCIO_VALUMA_V1.md`/`V2.md`, não requisitos funcionais do sistema.

| RF | Nome | Descrição | Evidência principal |
|---|---|---|---|
| RF-01 | Cadastro de usuário | Criação de conta por e-mail/senha, com confirmação por e-mail antes do primeiro acesso | `app/(auth)/signup/page.tsx`, `app/(auth)/verify-email/page.tsx` |
| RF-02 | Login | Autenticação por e-mail/senha | `app/(auth)/login/page.tsx` |
| RF-03 | Recuperação de senha | Solicitação de redefinição por e-mail e troca da senha | `app/(auth)/forgot-password/page.tsx`, `app/(auth)/reset-password/page.tsx` |
| RF-04 | Logout | Encerramento de sessão a partir de qualquer tela autenticada | `components/logout-button.tsx` |
| RF-05 | Edição do nome do usuário | Alteração do nome exibido, a partir do menu de perfil no cabeçalho | `app/(app)/perfil-actions.ts`, `components/perfil-menu.tsx` |
| RF-06 | Criação de processo | Acessar `/intake` cria um novo processo (nome padrão "Novo processo — DD/MM") e inicia o fluxo | `app/(app)/intake/page.tsx` |
| RF-07 | Listagem de processos | Dashboard lista os processos do usuário logado, com status/progresso/prévia do resultado | `app/(app)/dashboard/page.tsx` |
| RF-08 | Exclusão de processo | Exclui o processo e tudo que depende dele (sócios, intake, resultado, documentos no Storage) | `app/(app)/dashboard/actions.ts` |
| RF-09 | Seleção do Motor de Análise | Escolha entre Motor Essencial (padrão) e Motor Configurável antes de preencher dados da empresa | `components/intake/motor-form.tsx`, `lib/valuation/motor.ts` |
| RF-10 | Configuração do Motor Configurável | Ativar/desativar métodos de valuation e ajustar múltiplo, crescimento, taxa de desconto, horizonte e pesos | `lib/intake/schema-motor.ts` |
| RF-11 | Preenchimento do Perfil | Razão social, setor, porte, fundação, sócios (nome/cargo/participação) | `components/intake/perfil-form.tsx` |
| RF-12 | Preenchimento Financeiro (DRE dinâmico) | DRE com quantidade de anos variável (mínimo 1), adicionar/remover exercício | `components/intake/dre-fieldset.tsx`, `components/intake/financeiro-form.tsx` |
| RF-13 | Preenchimento Financeiro (balanço/dívidas/caixa) | Ativo/passivo, patrimônio líquido, situação de dívida, lista de dívidas, caixa e equivalentes | `components/intake/financeiro-form.tsx`, `components/intake/dividas-fieldset.tsx` |
| RF-14 | Download de modelo de planilha financeira | Gera um `.xlsx` em branco, layout transposto (indicador × ano) | `app/api/intake/financeiro/template/route.ts` |
| RF-15 | Importação de planilha financeira | Lê um `.xlsx` preenchido e mescla os dados ao formulário, por valor de ano (nunca por posição) | `lib/intake/excel-financeiro.ts`, `components/intake/importar-excel-financeiro.tsx` |
| RF-16 | Preenchimento Operacional | Funcionários, cargos, clientes, fornecedores, processos operacionais | `components/intake/operacao-form.tsx` |
| RF-17 | Preenchimento de Mercado | Concorrentes, posicionamento, TAM, sinergias | `components/intake/mercado-form.tsx` |
| RF-18 | Upload de documentos por categoria | Upload direto em uma de 6 categorias fixas, com badge de status por categoria | `components/intake/categoria-documento-card.tsx`, `components/intake/documentos-form.tsx` |
| RF-19 | Navegação guiada do intake | Botões Próximo/Voltar; bloqueio de avanço com destaque visual quando campos mínimos faltam | `components/intake/intake-nav-buttons.tsx`, `lib/intake/navegacao.ts` |
| RF-20 | Autosave do intake | Salva automaticamente cada etapa 1,5s após a última alteração, sem botão de salvar manual | `lib/hooks/useAutosave.ts` |
| RF-21 | Geração de resultado | Calcula e persiste Equity Value, Índice de Prontidão e Análise Estratégica para o processo | `app/api/processos/[processoId]/gerar-resultado/route.ts` |
| RF-22 | Cálculo de Equity Value | Três métodos (Múltiplo de EBITDA, DCF simplificado, Patrimonial) + consolidado ponderado, condicionado a aplicabilidade | `lib/valuation/calcular.ts` |
| RF-23 | Cálculo do Índice de Prontidão | Checklist determinístico de 48 itens em 4 dimensões (25% cada) | `lib/prontidao/checklist.ts` |
| RF-24 | Geração da Análise Estratégica | IA produz pontos fortes/riscos/recomendações a partir dos dados e dos números já calculados | `lib/ai/analisar.ts` |
| RF-25 | Exibição de pendências | Lista o que falta preencher para melhorar a Prontidão, com link direto ao campo | `components/resultado/pendencias-prontidao.tsx` |
| RF-26 | Exibição de campos obrigatórios faltantes | Alerta específico quando um campo mínimo (RG-40) some do intake depois de um resultado já gerado | `components/resultado/pendencias-obrigatorias.tsx` |
| RF-27 | Detecção de resultado desatualizado | Compara a última alteração do intake com o momento da última geração do resultado | `components/resultado/avisos-resultado.tsx` |
| RF-28 | Detecção de resultado legado | Identifica resultados gerados sob uma versão anterior do modelo de negócio | `lib/valuation/resultados.ts` (`ehResultadoLegado`) |
| RF-29 | Explicabilidade do cálculo | Seção "Como chegamos a este resultado": valor/peso/fórmula por método, motor utilizado, detalhamento da Prontidão | `components/resultado/como-chegamos.tsx` |
| RF-30 | Recalcular resultado | Repete a geração do resultado a qualquer momento | `components/resultado/gerar-resultado-button.tsx` |
| RF-31 | Impressão/exportação em PDF | Gera um PDF do resultado via impressão do navegador, sem motor de cálculo próprio | `components/resultado/baixar-pdf-button.tsx`, CSS `@media print` |
| RF-32 | Assistente conversacional | Chat em linguagem natural sobre o resultado já gerado, nunca recalcula valores | `components/resultado/chat-assistente.tsx`, `app/api/processos/[processoId]/chat/route.ts` |
| RF-33 | Alternância de tema claro/escuro | Troca manual, persistida, com fallback automático para impressão sempre em tema claro | `components/ui/theme-toggle.tsx`, `components/theme-impressao-clara.tsx` |

---

## 3. Requisitos não funcionais

| RNF | Descrição | Evidência técnica |
|---|---|---|
| RNF-01 | Toda área privada (`/dashboard`, `/intake`, `/processos`) exige sessão válida; acesso sem sessão redireciona para `/login` | `proxy.ts` + `lib/supabase/middleware.ts` (`PROTECTED_PATHS`) |
| RNF-02 | Isolamento de dados entre usuários garantido no nível do banco (RLS), não apenas na aplicação | `supabase/schema.sql` — policies `*_select_own`/`*_insert_own`/`*_update_own`/`*_delete_own` em `users`, `processos`, `partners`, `intake_data`, `resultados` |
| RNF-03 | Isolamento de arquivos enviados (Storage) entre usuários, via policy baseada no dono do processo | `supabase/schema.sql` — policies `documentos_intake_*` em `storage.objects` |
| RNF-04 | Validação de entrada em formulários, do lado do cliente e do servidor, antes de qualquer gravação | `lib/intake/schema-*.ts` (zod), reaplicada nas rotas de API (`gerar-resultado/route.ts`) |
| RNF-05 | Campos mínimos para gerar um resultado são sempre checados de novo no servidor, independente da UI | `lib/valuation/campos-obrigatorios.ts`, checado em `gerar-resultado/route.ts` (HTTP 422 se faltar algo) |
| RNF-06 | Responsividade (desktop/tablet/mobile), sem overflow horizontal | Verificado nesta e em sessões anteriores via Playwright (`scrollWidth === clientWidth` em 390/768/1440px) |
| RNF-07 | Tema claro/escuro persistido por usuário, com impressão sempre em tema claro independente da preferência | `components/ui/theme-toggle.tsx`, `components/theme-impressao-clara.tsx` |
| RNF-08 | Resiliência a falha do serviço de IA — indisponibilidade não derruba valuation nem Índice de Prontidão | `lib/ai/analisar.ts` (`try/catch` + `FALLBACK_ANALISE_IA`), `lib/prontidao` e `lib/valuation` calculados antes e independentemente da chamada à IA |
| RNF-09 | Upload de documentos limitado em tamanho e tipo de arquivo | `lib/intake/schema-documentos.ts` (`TAMANHO_MAXIMO_BYTES = 20MB`, allowlist de MIME types), reforçado por `file_size_limit`/`allowed_mime_types` no bucket (`supabase/schema.sql`) |
| RNF-10 | Precisão numérica: cálculos em ponto flutuante completo, arredondamento só na exibição | `lib/valuation/calcular.ts`, `lib/prontidao/checklist.ts` (RG-51 da v1.0) |
| RNF-11 | Versionamento explícito da regra de negócio que gerou cada resultado, independente da resposta da IA | Coluna `resultados.modelo_versao`, constante `MODEL_VERSION` (`lib/valuation/types.ts`) |
| RNF-12 | Compatibilidade retroativa — resultados antigos nunca são reescritos/migrados ao evoluir a regra de negócio | `lib/valuation/motor.ts` (`MOTOR_SNAPSHOT_LEGADO`), `scripts/testar-regras-negocio.ts` (caso de resultado v1 histórico) |
| RNF-13 | Disponibilidade web via hospedagem gerenciada (Vercel), HTTPS por padrão | Deploy de produção confirmado (`https://valuma.vercel.app`) |

---

## 4. DER / modelo de banco

Ver documento dedicado **`docs/MODELO_BANCO_DER.md`** para o detalhamento completo (atributos, PKs, FKs, políticas RLS por tabela) e o diagrama Mermaid pronto para a monografia. Resumo das tabelas:

| Tabela | Função |
|---|---|
| `auth.users` | Gerenciada pelo Supabase Auth — credenciais e metadados de autenticação. Não editável diretamente pela aplicação. |
| `public.users` | Perfil público 1:1 com `auth.users` (nome completo), criado automaticamente por trigger no cadastro. |
| `public.processos` | Um processo de valuation por empresa, pertencente a um usuário. |
| `public.partners` | Sócios de uma empresa avaliada (N:1 com `processos`). |
| `public.intake_data` | Uma linha por fase do intake por processo (jsonb genérico — RF-20, autosave). |
| `public.resultados` | Um resultado consolidado por processo (upsert a cada geração — não é histórico). |
| `storage.objects` (bucket `documentos-intake`) | Arquivos enviados na etapa Documentos, isolados por processo via path (`{processo_id}/{arquivo}`). |

---

## 5. Arquitetura da solução

Ver documento dedicado **`docs/ARQUITETURA_VALUMA.md`** para o diagrama Mermaid completo e a explicação camada a camada.

---

## 6. Fluxograma funcional

Ver documento dedicado **`docs/FLUXO_SISTEMA.md`** para o fluxograma Mermaid completo do fluxo principal.

---

## 7. Autenticação, autorização e perfis

**Como o login funciona:** autenticação por e-mail/senha via Supabase Auth (`supabase.auth.signUp`/`signInWithPassword`, chamados do lado do cliente em `app/(auth)/signup/page.tsx` e `app/(auth)/login/page.tsx`). O cadastro exige confirmação por e-mail antes do primeiro acesso completo (`emailRedirectTo` aponta para `/auth/callback`, que troca o código por uma sessão via `exchangeCodeForSession`). A sessão vive em cookies HTTP, sincronizados a cada requisição por `proxy.ts` (a convenção de middleware do Next.js 16) chamando `lib/supabase/middleware.ts::updateSession`.

**Perfis de usuário:** **não existe** nenhum perfil diferenciado (Admin, moderador, equipe interna etc.) — confirmado por leitura de `supabase/schema.sql` (a tabela `public.users` não tem nenhuma coluna de papel/role) e de todo o código de autorização (nenhuma checagem de `role` em nenhum lugar). Todo usuário autenticado tem exatamente o mesmo conjunto de permissões sobre os próprios dados. Não há também nenhum conceito de "organização"/multi-tenant com vários usuários compartilhando um processo — cada processo pertence a exatamente um `user_id`.

**Permissões existentes:** o único "controle de acesso" é "dono do recurso": um usuário só enxerga/edita/apaga os próprios registros. Isso não é implementado como uma checagem de código espalhada pela aplicação — é garantido pelo Postgres via Row Level Security, no próprio banco, então mesmo uma falha de lógica na aplicação (ex.: esquecer um `.eq("user_id", ...)`) não vazaria dado de outro usuário.

**Como RLS protege os dados:** toda tabela de dados de usuário (`users`, `processos`, `partners`, `intake_data`, `resultados`) tem RLS habilitada (`alter table ... enable row level security`) e policies que comparam `user_id = auth.uid()` diretamente (`processos`) ou via `exists (select 1 from processos where ... and user_id = auth.uid())` para tabelas-filhas (`partners`, `intake_data`, `resultados` — todas dependentes de `processos`). O bucket de Storage (`documentos-intake`) segue o mesmo padrão, usando o primeiro segmento do caminho do arquivo (`storage.foldername(name)[1]`) como o `processo_id` a verificar.

**Comportamento autenticado × não autenticado:** usuário sem sessão que tenta acessar `/dashboard`, `/intake` ou `/processos/*` é redirecionado para `/login` antes mesmo de qualquer página renderizar (checagem no `proxy.ts`, nível de rede/middleware). Além disso, cada Server Component dessas páginas confirma de novo a sessão (`supabase.auth.getUser()`) e redireciona se necessário — uma segunda camada, redundante de propósito.

**Um usuário pode acessar dados de outro?** Não, por dois motivos independentes: (1) toda query do servidor já é automaticamente filtrada pelo RLS do Postgres usando o `auth.uid()` da sessão atual, mesmo que o código da aplicação não adicione nenhum filtro explícito; (2) onde a aplicação adiciona um filtro explícito (ex.: `.eq("id", processoId)`), ele é redundante com o RLS, não uma substituição dele. Isso foi verificado nesta sessão (e em sessões anteriores) tentando abrir, pela UI real, um resultado pertencente a outro usuário — o sistema respondeu com 404 ("Processo não encontrado"), nunca com um 403 que revelasse a existência do recurso.

---

## 8. Integração front-end × back-end

Cinco fluxos completos, do clique na interface até a gravação no banco e volta:

### 8.1 Geração de resultado
Usuário clica "Gerar Resultado" (`components/resultado/gerar-resultado-button.tsx`) → `POST /api/processos/[processoId]/gerar-resultado` → rota confirma sessão (`supabase.auth.getUser()`) e dono do processo → `consolidarDadosProcesso` busca as 6 linhas de `intake_data` do processo → `verificarCamposObrigatorios` valida campos mínimos (HTTP 422 se faltar algo) → `configuracaoMotorValida` valida a configuração do Motor (HTTP 422 se inválida) → `calcularValuation` + `calcularProntidao` (puros, síncronos) → `analisarComIA` (assíncrono, chamada à Anthropic, com fallback se falhar) → `upsert` em `public.resultados` (RLS confirma o dono na gravação) → resposta JSON → página de resultado re-renderiza (Server Component, nova busca ao banco) mostrando Equity Value, Prontidão e Análise Estratégica atualizados.

### 8.2 Motor de Análise (Configurável)
Usuário marca "Motor Configurável" (`components/intake/motor-form.tsx`) → ativa/desativa métodos e ajusta pesos (estado local do `react-hook-form`) → `configuracaoMotorValida` roda **no cliente**, a cada alteração, para habilitar/bloquear o botão "Próxima etapa" (`lib/intake/navegacao.ts`) → autosave (`useAutosave`, debounce 1,5s) grava o formulário inteiro como jsonb em `intake_data` (fase `motor`) → ao gerar um resultado depois, a mesma validação roda de novo **no servidor** (seção 8.1) antes de calcular qualquer coisa — a UI nunca é a única barreira.

### 8.3 Importação de planilha Excel
Usuário baixa o modelo (`GET /api/intake/financeiro/template`, gera um `.xlsx` em memória com `exceljs` e devolve como download) → preenche a planilha → envia o arquivo (`components/intake/importar-excel-financeiro.tsx`) → Server Action lê o arquivo com `exceljs` (`lib/intake/excel-financeiro.ts`), reconhece os anos pelo valor da coluna (não pela posição) e os campos pela mesma lista usada no formulário manual (`lib/intake/campos-financeiros.ts`, fonte única) → devolve os valores reconhecidos para o cliente → `aplicarImportacaoExcel` (em `financeiro-form.tsx`) mescla ano a ano no estado do formulário (`setValue`/`insert` do react-hook-form) → autosave grava o resultado da mescla normalmente, como se tivesse sido digitado.

### 8.4 Alteração de intake tornando o resultado desatualizado
Usuário já tem um resultado gerado → volta a uma etapa do intake e altera um campo → autosave grava, atualizando `intake_data.atualizado_em` daquela fase → próxima vez que a tela de Resultado é aberta (Server Component), ela compara `MAX(intake_data.atualizado_em)` de todas as fases do processo com `resultados.atualizado_em` → se o intake for mais recente, `components/resultado/avisos-resultado.tsx` exibe o banner "Os dados foram alterados após a última análise. Recalcule o resultado para atualizar os valores." — sem apagar o resultado antigo, que continua visível até o usuário recalcular.

### 8.5 Criação/edição de processo
Usuário acessa `/intake` (sem `processoId`) → Server Component insere uma linha em `processos` (`nome_empresa` padrão "Novo processo — DD/MM") → redireciona para `/intake/{id}/motor` → cada etapa seguinte é uma rota dinâmica (`app/(app)/intake/[processoId]/[fase]/page.tsx`) que busca a linha de `intake_data` daquela fase (se existir) e renderiza o formulário correspondente, pré-preenchido. Editar o nome da empresa na etapa Perfil atualiza `processos.nome_empresa` em paralelo (`app/(app)/intake/perfil-actions.ts::atualizarNomeEmpresa`), para o card do dashboard refletir o nome real assim que preenchido.

---

## 9. Relatórios, consultas e indicadores

| Item | Tipo | Descrição |
|---|---|---|
| Dashboard (lista de processos) | Consulta | Lista todos os processos do usuário com status, progresso (N de 6 etapas) e prévia do resultado (Equity Value + Índice) |
| Estimativa preliminar de Equity Value | Indicador | Número único, resultado do consolidado ponderado (ou "indisponível", estado de negócio válido) |
| Detalhamento por método (Múltiplo/DCF/Patrimonial) | Relatório | Valor, peso e fórmula literal de cada método, na seção "Como chegamos a este resultado" |
| Índice de Prontidão Informacional | Indicador | Percentual geral + quebra por 4 dimensões (Financeiro, Operacional, Mercado, Documental) |
| Pendências | Consulta | Lista do que falta preencher para melhorar a Prontidão, com link direto ao campo |
| Explicabilidade da Dívida Líquida | Relatório | Enterprise Value por método, dívida financeira total, caixa, dívida líquida — como o ajuste EV→Equity foi feito |
| Análise Estratégica | Relatório | Texto qualitativo (pontos fortes/riscos/recomendações), gerado por IA |
| Impressão/PDF do resultado | Relatório | Reaproveita a mesma tela de resultado via impressão do navegador — nunca diverge dela, por não ter cálculo próprio |
| Assistente conversacional | Consulta ad-hoc | Perguntas livres sobre o processo já calculado, respondidas com base no mesmo contexto da Análise Estratégica |

**Diferenciação:** "indicador" = um número/percentual isolado (Equity Value, Índice geral); "relatório" = uma apresentação estruturada e mais longa de vários dados relacionados (explicabilidade, Análise Estratégica, PDF); "consulta" = uma busca/filtro sobre dados já existentes, sem produzir um documento novo (dashboard, pendências, chat).

---

## 10. Testes e qualidade

| Suíte | Comando | O que valida |
|---|---|---|
| `testar-valuation.ts` | `npm run valuation:test` | Script de demonstração/conferência manual: calcula `calcularValuation` com um `DadosProcesso` fictício e imprime os valores — não usa asserções automáticas, serve para conferência visual de um cenário de referência. |
| `testar-prontidao.ts` | `npm run prontidao:test` | 37 asserções automáticas sobre `lib/prontidao/checklist.ts`: contagem de itens por dimensão, os 4 estados de validade (ausente/inválido/válido/válido com alerta), zero como valor informado, textos triviais, percentuais fora do domínio, remoção/retorno de campo afetando a nota. |
| `testar-regras-negocio.ts` | `npm run regras:test` | 42 asserções sobre `docs/REGRAS_NEGOCIO_VALUMA_V1.md`: aplicabilidade por sinal de EBITDA/Patrimônio Líquido, Enterprise Value → Equity Value, dívida líquida negativa, proibição de renormalização de pesos, campos mínimos (RG-40/RG-41), versionamento do modelo (incluindo o caso de um resultado v1 histórico sendo corretamente identificado como legado após o avanço para v2). |
| `testar-motor.ts` | `npm run motor:test` | 22 asserções sobre o Motor de Análise: Essencial com os três métodos, Essencial com EBITDA negativo, Configurável com 1 e com 2 métodos ativos, pesos inválidos (< 100%, > 100%, 0 métodos), método ativo que se torna inaplicável, múltiplo configurável alterando o Enterprise Value sem alterar a regra de aplicabilidade. |
| TypeScript | `npx tsc --noEmit` | Tipagem estática de todo o projeto, zero erros na última execução. |
| ESLint | `npx eslint .` | Lint de todo o projeto; só alertas conhecidos e aceitos (incompatibilidade do React Compiler com `watch()` do react-hook-form), zero erros. |
| Build de produção | `npx next build` | Compilação completa (Turbopack) de todas as rotas, zero erros na última execução. |
| E2E (Playwright) | Scripts ad-hoc em sessões de trabalho (não versionados no repositório) | Fluxos reais em navegador: criação de processo, Motor Essencial/Configurável (bloqueio e liberação de navegação), anos dinâmicos (adicionar/remover/duplicidade), importação de Excel, geração de resultado, stale após alterar o motor, resultado legado, chatbot respondendo, 3 viewports (390/768/1440px) sem overflow horizontal. |

**Cenários críticos cobertos** (resumo, evidenciado pelas suítes acima): EBITDA/Patrimônio Líquido positivos (os 3 métodos aplicáveis); EBITDA ≤ 0 (Múltiplo/DCF inaplicáveis); Patrimônio Líquido ≤ 0 (Patrimonial inaplicável ao consolidado); ambos ≤ 0 (nenhum método aplicável, análise parcial continua); dívida líquida negativa (mais caixa que dívida); zero explicitamente informado vs. campo nunca preenchido; Motor Configurável com subconjuntos de métodos; resultado desatualizado; resultado legado (v1 histórico e sem Motor de Análise).

---

## 11. Bugs relevantes encontrados durante o desenvolvimento

Apenas bugs reais, com evidência direta no histórico desta sessão de trabalho (não inferidos por possibilidade teórica):

### 11.1 Validação de ano duplicado no DRE nunca aparecia na tela
**Problema:** ao introduzir anos financeiros dinâmicos (V2), a regra de zod que proíbe repetir um ano no DRE (`.refine` no array inteiro) nunca chegava a disparar visualmente.
**Efeito:** o usuário podia duplicar um ano no DRE sem ver nenhum aviso.
**Causa:** o react-hook-form, em modo `onBlur`, só revalida o campo-folha que perdeu o foco — um `.refine` aplicado ao array inteiro (não a um campo específico) nunca era re-executado por esse mecanismo automático.
**Correção:** chamada explícita de `trigger("dre")` no evento de blur do campo "Ano" (`components/intake/dre-fieldset.tsx`), forçando a revalidação do array inteiro.
**Aprendizado:** validações de zod a nível de array, combinadas com modo `onBlur` do react-hook-form, exigem um `trigger()` manual — o mecanismo automático da biblioteca não cobre esse caso.

### 11.2 Duas instâncias de `useFieldArray` para o mesmo campo dessincronizavam
**Problema:** ao dividir um fieldset (dívidas, depois DRE) entre componente pai e filho, cada um chamando `useFieldArray` para o mesmo nome de campo.
**Efeito:** chamadas de `insert()`/`replace()` feitas a partir de uma instância (ex.: a importação de Excel) não refletiam na lista renderizada pela outra instância (o fieldset visual).
**Causa:** `useFieldArray` não garante sincronia entre instâncias distintas para o mesmo campo, mesmo compartilhando o mesmo `control`.
**Correção:** uma única instância de `useFieldArray`, criada no componente pai, repassando `fields`/`insert`/`remove` como props para o filho — nunca deixando o filho criar sua própria instância.
**Aprendizado:** campos de array compartilhados entre componentes precisam de uma fonte única de verdade explícita; não basta compartilhar o `control`.

### 11.3 Botão "Remover" sobreposto ao badge de status no card de documento
**Problema:** no redesign dos cards de documento por categoria, o botão de remover arquivo ficava posicionado com `items-center` relativo ao bloco inteiro (nome + badge + metadados), não à primeira linha.
**Efeito:** em cards estreitos (um por categoria), o botão acabava visualmente sobreposto ao badge "Disponibilizado" abaixo do nome do arquivo.
**Causa:** alinhamento vertical (`items-center`) pensado para um bloco de uma linha só, mas aplicado a um bloco que podia crescer para várias linhas.
**Correção:** `items-start` no lugar de `items-center`, ancorando o botão à primeira linha (nome do arquivo) independentemente de quantas linhas o restante do card ocupe.
**Aprendizado:** alinhamento vertical relativo a um bloco de altura variável é frágil; ancorar ao elemento de referência (a primeira linha) é mais robusto que centralizar o bloco inteiro.

### 11.4 `MODEL_VERSION` desatualizado após o fechamento da V2
**Problema:** mesmo depois de toda a V2 implementada, a constante `MODEL_VERSION` (`lib/valuation/types.ts`) continuava gravando `"valu_ma_v1"` em resultados novos.
**Efeito:** resultados gerados já sob a arquitetura V2 ficavam indistinguíveis de resultados genuinamente antigos pela própria versão do modelo.
**Causa:** a constante nunca tinha sido revisada como parte do trabalho de V2, só o comportamento de cálculo.
**Correção:** `MODEL_VERSION` avançado para `"valu_ma_v2"`; resultados já persistidos com `"valu_ma_v1"` não foram migrados (permanecem como estavam, agora corretamente identificados como legados pelo mesmo mecanismo já existente).
**Aprendizado:** um identificador de versão "esquecido" não quebra nada visivelmente (o sistema continua funcionando), por isso só é descoberto por auditoria explícita, não por um erro em tempo de execução.

---

## 12. Segurança e proteção de dados

- **Autenticação:** Supabase Auth (e-mail/senha), sessão via cookies HTTP sincronizados a cada requisição (`proxy.ts`/`lib/supabase/middleware.ts`). Nenhuma senha é manipulada/armazenada pelo código da aplicação.
- **RLS (Row Level Security):** habilitada em 100% das tabelas de dados de usuário (`users`, `processos`, `partners`, `intake_data`, `resultados`) e no bucket de Storage — nenhuma tabela de dados sensíveis depende só de filtro no código da aplicação.
- **Isolamento entre usuários:** garantido no banco (seção 7), verificado nesta e em sessões anteriores tentando acesso cruzado real via UI (resultado: 404, nunca vazamento de dado).
- **Upload/Storage:** bucket privado (`public: false`), limite de 20 MB por arquivo, allowlist de tipos MIME (PDF, Word, Excel, JPEG, PNG) tanto no cliente (`lib/intake/schema-documentos.ts`) quanto no próprio bucket (`file_size_limit`/`allowed_mime_types` em `supabase/schema.sql`) — dupla barreira.
- **Validação de entrada:** todo formulário usa schema zod, validado no cliente (UX) e reaplicado no servidor antes de qualquer gravação crítica (ex.: campos mínimos e configuração do Motor revalidados em `gerar-resultado/route.ts`, independente do que a UI já checou).
- **Tratamento de dados sensíveis:** variáveis de ambiente (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY`) nunca commitadas no repositório (`.gitignore` cobre `.env*`); a chave da Anthropic só é lida no servidor (nunca exposta ao navegador — todas as chamadas à IA partem de rotas de servidor).
- **Disclaimer e não certificação:** o sistema declara explicitamente, em toda tela de resultado e no PDF, que não certifica a empresa nem garante a veracidade das informações/documentos fornecidos (RG-04/RG-39/RG-55 da v1.0).

---

## 13. Implantação

- **Hospedagem da aplicação:** Vercel (projeto `jfo05/valuma`), deploy de produção confirmado e publicamente acessível em `https://valuma.vercel.app`.
- **Front-end e back-end:** disponibilizados juntos, pelo mesmo deploy — o Next.js App Router serve tanto as páginas (Server Components) quanto as rotas de API (`app/api/**`) a partir da mesma aplicação, sem um backend separado.
- **Banco de dados:** Supabase (PostgreSQL gerenciado), hospedado pela própria Supabase (região `sa-east-1`), acessado via `@supabase/supabase-js`/`@supabase/ssr` com as credenciais do projeto (URL + chave anônima, variáveis de ambiente).
- **Como o sistema é acessado:** HTTPS público, autenticação própria (não há VPN/rede interna) — qualquer pessoa pode criar conta e usar o produto a partir do link de produção.
- **Dependências externas relevantes:** Supabase (Auth + Postgres + Storage) e Anthropic API (Análise Estratégica + assistente) — ambas são serviços de terceiros; indisponibilidade da Anthropic não derruba o restante do sistema (seção RNF-08), indisponibilidade do Supabase derrubaria (dependência estrutural, sem fallback).

---

## 14. Estrutura para demonstração da banca

| # | Critério | Evidência disponível hoje |
|---|---|---|
| 1 | Requisitos | RF-01 a RF-33 e RNF-01 a RNF-13 (seções 2 e 3), todos com evidência de código. **Não existe** documento de requisitos assinado por um cliente/empresa parceira real — isso depende do grupo, não do sistema. |
| 2 | Banco | Schema real (`supabase/schema.sql`), DER em Mermaid (`docs/MODELO_BANCO_DER.md`), RLS ativa em 100% das tabelas de dados de usuário. |
| 3 | Backend | Rotas de API (`app/api/**`), Server Actions, motor de cálculo puro e testável (`lib/valuation/calcular.ts`), 101 asserções automáticas somadas (37+42+22) nas 3 suítes de teste com asserção. |
| 4 | Frontend | Aplicação completa navegável (landing, auth, dashboard, intake em 6 etapas, resultado), responsiva, com tema claro/escuro. |
| 5 | Integração | 5 fluxos completos documentados na seção 8, demonstráveis ao vivo (geração de resultado, Motor de Análise, Excel, stale, criação de processo). |
| 6 | UX | Autosave, bloqueio de navegação com destaque de campo faltante, explicabilidade, estados vazios tratados (sem erro cru), responsivo. |
| 7 | Autenticação/perfis | Seção 7 — autenticação real via Supabase, isolamento por RLS; **não existem** perfis diferenciados (nem foi inventado nenhum para esta documentação). |
| 8 | Relatórios/consultas | Seção 9 — indicadores, relatórios e consultas reais, diferenciados. |
| 9 | Disponibilidade | Deploy de produção ao vivo, publicamente acessível (seção 13). |
| 10 | Validação do cliente | **Não existe**, no repositório, nenhuma evidência de validação formal por um cliente/empresa real (pesquisa de satisfação, ata de aceite, etc.) — isso depende do grupo/orientador, é uma lacuna explícita, não inventada aqui. |

---

## 15. Arquivos importantes para a monografia

| Tema | Arquivo(s) |
|---|---|
| Regras de negócio (fonte da verdade) | `docs/REGRAS_NEGOCIO_VALUMA_V1.md`, `docs/REGRAS_NEGOCIO_VALUMA_V2.md` |
| Arquitetura | `docs/ARQUITETURA_VALUMA.md`, `proxy.ts`, `lib/supabase/middleware.ts` |
| Banco | `supabase/schema.sql`, `docs/MODELO_BANCO_DER.md` |
| Valuation | `lib/valuation/calcular.ts`, `lib/valuation/motor.ts`, `lib/valuation/types.ts` |
| Prontidão | `lib/prontidao/checklist.ts` |
| Motor de Análise | `lib/valuation/motor.ts`, `lib/intake/schema-motor.ts`, `components/intake/motor-form.tsx` |
| IA (Análise Estratégica) | `lib/ai/analisar.ts` |
| IA (assistente) | `lib/ai/chat-assistente.ts`, `app/api/processos/[processoId]/chat/route.ts` |
| Autenticação | `lib/supabase/server.ts`, `lib/supabase/client.ts`, `lib/supabase/middleware.ts`, `proxy.ts` |
| Excel | `lib/intake/excel-financeiro.ts`, `lib/intake/campos-financeiros.ts` |
| Resultado (tela) | `app/(app)/processos/[processoId]/resultado/page.tsx`, `components/resultado/como-chegamos.tsx` |
| Testes | `scripts/testar-valuation.ts`, `scripts/testar-prontidao.ts`, `scripts/testar-regras-negocio.ts`, `scripts/testar-motor.ts` |

---

*Documentos complementares desta mesma entrega: `docs/REQUISITOS_FUNCIONAIS_NAO_FUNCIONAIS.md`, `docs/ARQUITETURA_VALUMA.md`, `docs/MODELO_BANCO_DER.md`, `docs/FLUXO_SISTEMA.md`.*
