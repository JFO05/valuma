# ValuM&A — Requisitos Funcionais e Não Funcionais

Documento complementar a `docs/PACOTE_MONOGRAFIA_TCC.md` (seções 2 e 3). Levantado por leitura direta do código em 2026-10-14, sobre o estado V2.0 congelado (`docs/REGRAS_NEGOCIO_VALUMA_V2.md`). Todos os itens abaixo estão **implementados** — nenhum requisito planejado/futuro foi incluído aqui (ver roadmap em `docs/REGRAS_NEGOCIO_VALUMA_V1.md`, RG-56, e `docs/REGRAS_NEGOCIO_VALUMA_V2.md`, RG-62, para o que foi deliberadamente deixado de fora).

## Requisitos Funcionais

### Autenticação e conta

**RF-01 — Cadastro de usuário**
Descrição: usuário cria conta informando nome completo, e-mail e senha; recebe e-mail de confirmação antes de poder usar o sistema plenamente.
Evidência: `app/(auth)/signup/page.tsx` (`supabase.auth.signUp`), `app/(auth)/verify-email/page.tsx`.
Status: implementado.

**RF-02 — Login**
Descrição: autenticação por e-mail/senha.
Evidência: `app/(auth)/login/page.tsx`.
Status: implementado.

**RF-03 — Recuperação de senha**
Descrição: solicitação de redefinição de senha por e-mail e posterior troca da senha.
Evidência: `app/(auth)/forgot-password/page.tsx`, `app/(auth)/reset-password/page.tsx`.
Status: implementado.

**RF-04 — Logout**
Descrição: encerramento da sessão a partir de qualquer tela autenticada (menu de perfil no cabeçalho).
Evidência: `components/logout-button.tsx`, usado em `components/perfil-menu.tsx`.
Status: implementado.

**RF-05 — Edição do nome do usuário**
Descrição: alteração do nome completo exibido, sem página própria (dropdown no cabeçalho).
Evidência: `app/(app)/perfil-actions.ts::atualizarNomeUsuario`.
Status: implementado.

### Dashboard e processos

**RF-06 — Criação de processo**
Descrição: acessar `/intake` cria automaticamente um novo processo e redireciona para a primeira etapa (Motor de Análise).
Evidência: `app/(app)/intake/page.tsx`.
Status: implementado.

**RF-07 — Listagem de processos**
Descrição: dashboard lista todos os processos do usuário logado, com status, progresso (quantas das 6 etapas têm dados) e prévia do resultado quando existir.
Evidência: `app/(app)/dashboard/page.tsx`, `components/dashboard/processos-lista.tsx`.
Status: implementado.

**RF-08 — Exclusão de processo**
Descrição: exclui o processo e tudo que depende dele — sócios, dados de intake, resultado (cascata no banco) e arquivos no Storage (removidos explicitamente antes, pois Storage não tem FK).
Evidência: `app/(app)/dashboard/actions.ts::excluirProcesso`.
Status: implementado.

### Motor de Análise

**RF-09 — Seleção do Motor de Análise**
Descrição: antes de preencher qualquer dado da empresa, o usuário escolhe entre Motor Essencial (padrão, premissas fixas) e Motor Configurável. Um terceiro card ("Especialista") é visível, mas não selecionável.
Evidência: `components/intake/motor-form.tsx`, `lib/valuation/motor.ts`.
Status: implementado.

**RF-10 — Configuração do Motor Configurável**
Descrição: ativar/desativar os três métodos de valuation e ajustar múltiplo de EBITDA, crescimento anual, taxa de desconto, horizonte do DCF e peso de cada método ativo (soma obrigatória de 100% entre os ativos).
Evidência: `lib/intake/schema-motor.ts`, `lib/valuation/motor.ts::configuracaoMotorValida`.
Status: implementado.

### Intake

**RF-11 — Preenchimento do Perfil**
Descrição: razão social, setor, porte, data de fundação, localização e lista de sócios (nome, cargo, percentual de participação).
Evidência: `components/intake/perfil-form.tsx`, `lib/intake/schema-perfil.ts`.
Status: implementado.

**RF-12 — Preenchimento Financeiro — DRE dinâmico**
Descrição: Demonstração de Resultado com quantidade de anos variável (mínimo 1), com botões para adicionar/remover exercício; identificação do ano-base por valor do campo `ano`, nunca por posição.
Evidência: `components/intake/dre-fieldset.tsx`, `lib/intake/schema-financeiro.ts`.
Status: implementado.

**RF-13 — Preenchimento Financeiro — balanço, dívidas e caixa**
Descrição: ativo/passivo total e circulante, patrimônio líquido, situação declarada de dívida financeira (sim/não), lista detalhada de dívidas (credor, valor, taxa, vencimento), caixa e equivalentes.
Evidência: `components/intake/financeiro-form.tsx`, `components/intake/dividas-fieldset.tsx`.
Status: implementado.

**RF-14 — Download de modelo de planilha financeira**
Descrição: gera um arquivo `.xlsx` em branco, layout transposto (uma linha por indicador, uma coluna por ano).
Evidência: `app/api/intake/financeiro/template/route.ts`, `lib/intake/excel-financeiro.ts::gerarModeloFinanceiroExcel`.
Status: implementado.

**RF-15 — Importação de planilha financeira**
Descrição: lê um `.xlsx` preenchido pelo usuário, reconhece os anos pelo valor de cada coluna e os indicadores pela mesma lista usada no formulário manual, mesclando por ano (nunca por posição).
Evidência: `lib/intake/excel-financeiro.ts`, `components/intake/importar-excel-financeiro.tsx`, `app/(app)/intake/financeiro-excel-actions.ts`.
Status: implementado.

**RF-16 — Preenchimento Operacional**
Descrição: número de funcionários, cargos/áreas, clientes ativos e principais, concentração dos 3 maiores clientes, fornecedores principais, descrição dos processos operacionais.
Evidência: `components/intake/operacao-form.tsx`, `lib/intake/schema-operacao.ts`.
Status: implementado.

**RF-17 — Preenchimento de Mercado**
Descrição: concorrentes mapeados, posicionamento, tamanho de mercado estimado (TAM), sinergias potenciais para M&A.
Evidência: `components/intake/mercado-form.tsx`, `lib/intake/schema-mercado.ts`.
Status: implementado.

**RF-18 — Upload de documentos por categoria**
Descrição: upload direto em uma de 6 categorias fixas (DRE, Balanço Patrimonial, Endividamento, Societário, Fiscal/Tributário, Contratos relevantes), com badge de status (Disponibilizado/Pendente) por categoria.
Evidência: `components/intake/categoria-documento-card.tsx`, `components/intake/documentos-form.tsx`, `lib/intake/schema-documentos.ts`.
Status: implementado.

**RF-19 — Navegação guiada do intake**
Descrição: botões "Próxima etapa"/"Etapa anterior"; tentar avançar com campo mínimo faltando bloqueia a navegação e destaca o campo (asterisco + borda) em vez de simplesmente desabilitar o botão sem explicação.
Evidência: `components/intake/intake-nav-buttons.tsx`, `lib/intake/navegacao.ts`.
Status: implementado.

**RF-20 — Autosave do intake**
Descrição: cada etapa é salva automaticamente 1,5 segundos após a última alteração, sem botão de salvar manual.
Evidência: `lib/hooks/useAutosave.ts` (`DEBOUNCE_MS = 1500`).
Status: implementado.

### Resultado

**RF-21 — Geração de resultado**
Descrição: calcula e persiste, em uma única operação, a Estimativa de Equity Value, o Índice de Prontidão e a Análise Estratégica do processo.
Evidência: `app/api/processos/[processoId]/gerar-resultado/route.ts`.
Status: implementado.

**RF-22 — Cálculo de Equity Value**
Descrição: três métodos (Múltiplo de EBITDA, DCF simplificado, Patrimonial), convertidos para a mesma base econômica (Equity Value) via dívida líquida, consolidados por média ponderada quando aplicável.
Evidência: `lib/valuation/calcular.ts`.
Status: implementado.

**RF-23 — Cálculo do Índice de Prontidão**
Descrição: checklist determinístico de 48 itens, distribuídos em 4 dimensões de 25% cada (Financeiro 31, Operacional 7, Mercado 4, Documental 6).
Evidência: `lib/prontidao/checklist.ts`.
Status: implementado.

**RF-24 — Geração da Análise Estratégica**
Descrição: IA produz 3 a 5 pontos fortes, riscos e recomendações a partir dos dados do intake e dos números já calculados (nunca o contrário).
Evidência: `lib/ai/analisar.ts`.
Status: implementado.

**RF-25 — Exibição de pendências (Prontidão)**
Descrição: lista o que falta preencher para melhorar o Índice de Prontidão, com link direto para o campo correspondente no intake.
Evidência: `components/resultado/pendencias-prontidao.tsx`.
Status: implementado.

**RF-26 — Exibição de campos obrigatórios faltantes**
Descrição: alerta específico quando um campo mínimo (necessário para sequer gerar um resultado) é removido do intake depois de um resultado já ter sido gerado.
Evidência: `components/resultado/pendencias-obrigatorias.tsx`, `lib/valuation/campos-obrigatorios.ts`.
Status: implementado.

**RF-27 — Detecção de resultado desatualizado**
Descrição: compara o momento da última alteração de qualquer fase do intake com o momento da última geração do resultado; alerta sem apagar o resultado existente.
Evidência: `components/resultado/avisos-resultado.tsx::ResultadoDesatualizadoBanner`.
Status: implementado.

**RF-28 — Detecção de resultado legado**
Descrição: identifica resultados gerados sob uma versão anterior da regra de negócio (`modelo_versao` diferente da atual), incluindo resultados anteriores à existência do Motor de Análise.
Evidência: `lib/valuation/resultados.ts::ehResultadoLegado`, `lib/valuation/motor.ts::MOTOR_SNAPSHOT_LEGADO`.
Status: implementado.

**RF-29 — Explicabilidade do cálculo**
Descrição: seção "Como chegamos a este resultado?" — valor, peso e fórmula literal de cada método; qual Motor (Essencial/Configurável) e quais premissas geraram o resultado; detalhamento item a item do Índice de Prontidão por dimensão.
Evidência: `components/resultado/como-chegamos.tsx`.
Status: implementado.

**RF-30 — Recalcular resultado**
Descrição: repete a geração do resultado a qualquer momento, substituindo o anterior.
Evidência: `components/resultado/gerar-resultado-button.tsx`.
Status: implementado.

**RF-31 — Impressão/exportação em PDF**
Descrição: gera um PDF do resultado via impressão do navegador — nunca tem cálculo ou dado próprio, é sempre um retrato fiel da tela.
Evidência: `components/resultado/baixar-pdf-button.tsx`, regras `@media print` em `app/globals.css`.
Status: implementado.

**RF-32 — Assistente conversacional**
Descrição: chat em linguagem natural sobre o processo e o resultado já gerado; nunca recalcula ou propõe um valor alternativo de valuation.
Evidência: `lib/ai/chat-assistente.ts`, `app/api/processos/[processoId]/chat/route.ts`, `components/resultado/chat-assistente.tsx`.
Status: implementado.

### Apresentação

**RF-33 — Alternância de tema claro/escuro**
Descrição: alternância manual, persistida entre sessões (localStorage), com fallback automático para tema claro ao imprimir, independente da preferência do usuário.
Evidência: `components/ui/theme-toggle.tsx`, `components/theme-impressao-clara.tsx`.
Status: implementado.

---

## Requisitos Não Funcionais

**RNF-01 — Controle de acesso por rota**
Descrição: toda rota sob `/dashboard`, `/intake` e `/processos` exige sessão válida; acesso sem sessão redireciona para `/login` antes de qualquer renderização.
Evidência técnica: `proxy.ts` + `lib/supabase/middleware.ts` (`PROTECTED_PATHS`).

**RNF-02 — Isolamento de dados por usuário (banco)**
Descrição: nenhum usuário consegue ler/escrever dados de outro usuário, garantido no próprio banco (não apenas na aplicação).
Evidência técnica: Row Level Security habilitada e com policies em `users`, `processos`, `partners`, `intake_data`, `resultados` (`supabase/schema.sql`).

**RNF-03 — Isolamento de arquivos (Storage)**
Descrição: arquivos enviados por um usuário não são acessíveis por outro.
Evidência técnica: policies `documentos_intake_*` em `storage.objects`, baseadas no dono do processo (`supabase/schema.sql`).

**RNF-04 — Validação de entrada em duas camadas**
Descrição: todo formulário é validado por schema zod no cliente (UX imediata) e revalidado no servidor antes de qualquer gravação crítica.
Evidência técnica: `lib/intake/schema-*.ts`; revalidação em `app/api/processos/[processoId]/gerar-resultado/route.ts` (campos mínimos e configuração do Motor).

**RNF-05 — Responsividade**
Descrição: a aplicação funciona sem quebra de layout em desktop, tablet e celular, sem rolagem horizontal indevida.
Evidência técnica: verificado via Playwright em 390px/768px/1440px (`scrollWidth === clientWidth`) nas telas de landing e resultado.

**RNF-06 — Tema claro/escuro consistente**
Descrição: preferência de tema persistida por usuário; impressão sempre sai em tema claro, independente da preferência ativa na tela.
Evidência técnica: `components/ui/theme-toggle.tsx`, `components/theme-impressao-clara.tsx` (remove a classe `.dark` da tag `<html>` no evento `beforeprint`).

**RNF-07 — Resiliência a falha do serviço de IA**
Descrição: indisponibilidade ou erro da API da Anthropic não impede a geração do valuation nem do Índice de Prontidão — só a Análise Estratégica mostra um estado de erro, com opção de tentar novamente.
Evidência técnica: `lib/ai/analisar.ts` (`try/catch` + `FALLBACK_ANALISE_IA`), chamada à IA ocorre depois e de forma independente do cálculo determinístico em `gerar-resultado/route.ts`.

**RNF-08 — Limite de upload (tamanho e tipo)**
Descrição: arquivos de documento limitados a 20 MB, restritos a PDF/Word/Excel/JPEG/PNG.
Evidência técnica: `lib/intake/schema-documentos.ts` (`TAMANHO_MAXIMO_BYTES`), reforçado no próprio bucket (`file_size_limit`/`allowed_mime_types`, `supabase/schema.sql`).

**RNF-09 — Precisão numérica**
Descrição: cálculos internos em ponto flutuante completo; arredondamento só ocorre na camada de exibição ao usuário.
Evidência técnica: `lib/valuation/calcular.ts`, `lib/prontidao/checklist.ts`.

**RNF-10 — Versionamento explícito do modelo de negócio**
Descrição: todo resultado carrega um identificador de qual versão da regra de negócio o gerou, independente da resposta da IA.
Evidência técnica: coluna `resultados.modelo_versao`, constante `MODEL_VERSION` (`lib/valuation/types.ts`, valor atual `"valu_ma_v2"`).

**RNF-11 — Compatibilidade retroativa de dados**
Descrição: evoluir a regra de negócio (v1.0 → v2.0) nunca reescreve ou migra silenciosamente resultados já persistidos.
Evidência técnica: `MOTOR_SNAPSHOT_LEGADO` (`lib/valuation/motor.ts`); teste automatizado confirmando que um resultado `"valu_ma_v1"` é corretamente tratado como legado após o avanço de versão (`scripts/testar-regras-negocio.ts`).

**RNF-12 — Segredos fora do controle de versão**
Descrição: credenciais de serviços externos (Supabase, Anthropic) nunca são commitadas no repositório.
Evidência técnica: `.gitignore` cobre `.env*`; variáveis configuradas separadamente no ambiente de produção (Vercel).

**RNF-13 — Disponibilidade web**
Descrição: aplicação publicamente acessível via HTTPS, hospedagem gerenciada.
Evidência técnica: deploy de produção ativo em `https://valuma.vercel.app` (Vercel).
