# Decisões Técnicas — Evolução do MVP ValuM&A

Registro incremental das decisões tomadas a cada fase do `docs/PLANO_EVOLUCAO_MVP.md`. Decisões de negócio (D1–D6) ficam registradas onde foram respondidas pelo grupo; aqui entram principalmente as decisões de implementação necessárias para executá-las.

---

## Fase 1 — Correções de qualidade (DEF-01 a DEF-05)

**D2 (resposta do grupo):** lista mínima obrigatória para liberar "Gerar Resultado" = razão social + setor (Perfil, já obrigatórios no schema) + EBITDA do ano mais recente do DRE + Patrimônio Líquido (Financeiro). Operação, Mercado e Documentos ficam livres — só afetam o futuro Índice de Prontidão (Fase 2), não o valuation.

### DEF-01 — Campos obrigatórios e navegação livre

- Novo módulo `lib/valuation/campos-obrigatorios.ts`, função pura `verificarCamposObrigatorios(dados: DadosProcesso): PendenciaObrigatoria[]`. Deliberadamente separado do futuro checklist da Fase 2 (`lib/prontidao/checklist.ts`, ainda não implementado) — este é um checklist bem menor e mais estrito (só o que decide se dá para calcular alguma coisa), não a completude geral do intake.
- **EBITDA do ano mais recente**: reaproveita `anosDreComDados` (a mesma função que `calcularValuation` usa para escolher o ano-base), mas checa explicitamente `anoBase.ebitda !== 0` — não só "existe algum ano com dado". Motivo: `anosDreComDados` considera um ano "com dados" se receita bruta OU EBITDA forem diferentes de zero; um ano com receita preenchida mas EBITDA ainda no padrão (0) passaria despercebido se só checássemos a lista. Descoberto durante o teste manual desta fase (ver evidência abaixo) e corrigido antes do commit.
- **Patrimônio Líquido**: tratado como "não informado" quando o valor é exatamente `0` (o padrão do formulário para um campo nunca tocado — `lib/intake/schema-financeiro.ts`). Mesma lógica de ambiguidade "0 pode ser não-preenchido ou genuinamente zero" já usada em `lib/valuation/score.ts` para outros campos. Um patrimônio líquido **negativo** é aceito como informado (é um dado real possível, especialmente relevante para D1). Isso significa que uma empresa com patrimônio líquido genuinamente zero não consegue gerar um resultado sem alterar esse valor — limitação aceita conscientemente, já que não há hoje um campo "toquei nisso" para desambiguar.
- Indicador no stepper (`components/intake/intake-stepper.tsx`): ícone "!" (não só cor) nas etapas com pendência da lista de D2 — escopo restrito de propósito, não é uma completude geral (isso fica para a Fase 2). Hoje só Perfil e Financeiro podem mostrar "!", porque só eles têm campos na lista de D2.
- Bloqueio em 2 camadas: a tela (`ResultadoVazio` e a seção "Recalcular" de `app/(app)/processos/[processoId]/resultado/page.tsx`) esconde o botão e mostra `PendenciasObrigatorias` com link `#slug` para cada campo faltante; a rota (`app/api/processos/[processoId]/gerar-resultado/route.ts`) faz a mesma verificação de novo antes de calcular, devolvendo 422 com a lista — defesa em profundidade, já que a rota é alcançável por qualquer request.
- Âncoras adicionadas: `id="razaoSocial"`, `id="setor"` (Perfil); `id="patrimonioLiquido"`, `id="dre-ebitda-{index}"` (Financeiro, `dre-fieldset.tsx`). Limitação conhecida: o campo "Ano" de cada bloco do DRE é editável livremente — se o usuário reordenar os anos, o link da pendência de EBITDA (que aponta para o índice 0, o mais recente por padrão) pode não apontar exatamente para a linha com o ano mais recente de fato. Não corrigido nesta fase (fora do escopo do DEF-01); registrado como achado (já estava listado na auditoria de heurísticas, item 14).

### DEF-02 — Input monetário

- Mudança isolada em `components/intake/money-input.tsx` (único componente, já reusado em todos os campos R$). Validação: só aceita dígitos, `.`, `,` e `-` inicial (`CARACTERES_VALIDOS`); qualquer outro caractere já reprova antes do parse.
- Em caso de erro: **não chama `onChange`** (o valor anterior, já salvo, permanece intacto no formulário/autosave) e mostra `<span role="alert">` com a mensagem, embaixo do campo. Enquanto há erro, o campo continua mostrando o texto que o usuário digitou (não reverte silenciosamente para o valor antigo formatado) — ele só volta ao normal quando corrige e sai do campo com um valor válido, ou apaga tudo (campo vazio é aceito como "sem valor", não como erro).

### DEF-03 — IA vazia sem aviso

- `AnaliseIA` (`lib/valuation/types.ts`) ganhou um campo opcional `erro?: boolean`, guardado dentro do próprio jsonb `analise_ia` de `public.resultados` — **sem migration**, exatamente a abordagem (c) descrita como opção em D3 do plano.
- `lib/ai/analisar.ts::FALLBACK_ANALISE_IA` agora inclui `erro: true`.
- `components/resultado/analise-ia-cards.tsx` trata como "falhou" tanto `erro === true` quanto o caso em que os 3 arrays vêm todos vazios (heurística: uma resposta bem-sucedida da IA sempre tem itens, o prompt pede de 3 a 5 por bloco) — isso cobre também resultados **antigos**, gerados antes desta mudança existir, sem precisar recalculá-los (parcialmente resolve a preocupação de compatibilidade da D3 para este campo específico, sem migration).
- O "Tentar novamente" da seção de IA reaproveita o mesmo `GerarResultadoButton`/rota que recalcula tudo (valuation + score + IA) — decisão consciente de simplicidade: as partes determinísticas são baratas de recalcular, e criar uma rota separada só para a IA seria complexidade extra sem benefício claro num MVP acadêmico.

### DEF-04 — Autosave sem rede

- `lib/hooks/useAutosave.ts` reescrito: timeout de 10s (`comTimeout`, corrida entre a chamada real e um `setTimeout` que rejeita), checagem de `navigator.onLine` antes de tentar (se já sabidamente offline, nem tenta — vai direto para "erro", mais rápido que esperar os 10s), retry automático no evento `online` do `window`, e `beforeunload` condicional (avisa só se `status` for `"salvando"` ou `"erro"`).
- Ambos os caminhos testados manualmente e confirmados com tempos diferentes, como esperado: offline real (`navigator.onLine=false`) → erro em ~2s (debounce, sem esperar o timeout); servidor que trava sem cair a rede (simulado via interceptação de rede que nunca responde) → erro em ~11,8s (debounce 1,5s + timeout 10s).
- `dadosRef`/`statusRef` (para o retry e o `beforeunload` sempre lerem o valor mais recente) são atualizados dentro de `useEffect`, não durante o render — escrever `ref.current` no corpo do componente quebra a regra do React Compiler (`react-hooks/refs`), pego pelo lint antes do commit.
- `components/intake/autosave-status.tsx` ganhou `ultimoSalvamento`/`onTentarNovamente` opcionais (mostram "Salvo às HH:MM" e um botão "Tentar novamente" no erro); `documentos-form.tsx` (que não usa `useAutosave`) continua passando só `status`, sem quebrar.

### DEF-05 — Botão preso em loading

Já estava corrigido antes desta fase (`components/resultado/gerar-resultado-button.tsx` já chamava `setCarregando(false)` no sucesso e no erro). Reconfirmado funcionando durante os testes manuais do DEF-03.

### Verificação desta fase

- `npx next build`: sucesso, TypeScript sem erros.
- `npx eslint .`: 0 erros (4 warnings pré-existentes, não relacionados a esta fase — `react-hooks/incompatible-library` sobre `watch()` do react-hook-form, presentes desde antes desta sessão).
- Testes manuais (navegador real, processo de teste "Empresa Teste Campinas Ltda."): os 5 critérios de aceite do plano confirmados um a um, com o processo de teste restaurado ao estado válido (massa M1) ao final.

---

## Fase 2 — Índice de Prontidão para M&A

**D3 (resposta do grupo):** recalcular agora os resultados de teste existentes + guardar um marcador de versão (`versao: "prontidao_v1"`) dentro do jsonb `analise_ia` de `public.resultados`, sem migration.

### Onde vive o motor

`lib/prontidao/checklist.ts` — módulo puro, sem I/O, no mesmo padrão de `lib/valuation/calcular.ts`/`score.ts`. Exporta `CHECKLIST_PRONTIDAO` (lista de itens) e `calcularProntidao(dados: DadosProcesso): ResultadoProntidao`. Deliberadamente **separado** de `lib/valuation/campos-obrigatorios.ts` (Fase 1, DEF-01) — aquele é um checklist bem menor e mais estrito, sobre o que é preciso para gerar QUALQUER número de valuation; este é sobre completude/estruturação geral do intake, sem relação com o motor de cálculo.

### Como cada item foi definido (documentando as decisões de modelagem)

- **DRE (24 itens, financeiro):** cada um dos 8 campos de cada um dos 3 anos vira um item próprio (não "1 item por ano") — dá pendências específicas ("falta Lucro Bruto do ano X") em vez de um "ano incompleto" genérico. Campos que nunca são negativos na vida real (receita bruta, deduções, receita líquida, custos, despesas operacionais) são "preenchidos" quando `> 0`; campos que podem ser negativos (lucro bruto, EBITDA, lucro líquido) são "preenchidos" quando `!== 0` — mesma regra de ambiguidade do zero já usada em `lib/valuation/score.ts` e `lib/valuation/campos-obrigatorios.ts`.
- **Balanço (5 itens, financeiro):** mesma regra — os 4 campos sempre-não-negativos exigem `> 0`; patrimônio líquido (pode ser negativo) exige `!== 0`.
- **Dívidas (1 item, financeiro):** tratada como um único item binário "pelo menos uma dívida informada" (`dividas.length > 0`), não uma dívida por linha (é uma lista de tamanho variável, sem um "esperado" fixo de quantas dívidas deveria haver). **Limitação aceita:** uma empresa genuinamente sem dívidas nunca completa este item — mesmo compromisso que `score.ts` já fazia ao tratar "nenhuma dívida" como ambíguo.
- **Operacional (7 itens):** cada campo escalar (número ou texto) vira 1 item; cada lista (`cargosEquipe`, `clientesPrincipais`, `fornecedoresPrincipais`) vira 1 item binário "tem pelo menos 1 entrada".
- **Mercado (4 itens):** `concorrentes` (lista → binário), `posicionamento` e `sinergiasPotenciais` (texto não vazio), `tamMercado` — este último é o único campo numérico do checklist **sem** a ambiguidade do zero, porque o schema já o define como `number | undefined` (não default 0); qualquer número, incluindo 0, conta como informado.
- **Documental (5 itens):** o formulário de Documentos não categoriza arquivos por tipo (sem campo "tipo de documento" no schema) — não há itens nomeados para reaproveitar. Na ausência disso, cada "slot" de upload (1º ao 5º arquivo) virou um item, reaproveitando o mesmo número de referência (5) que `DOCUMENTOS_ESPERADOS_PADRAO` já usava no score antigo (`lib/valuation/score.ts`, agora sem uso na interface, mas não apagado do repositório — ver abaixo). Isso é o mais próximo de "itens que já existem" que os dados permitem, sem inventar uma taxonomia de documentos nova.
- **Perfil não entra no cálculo** — conforme a própria especificação da Fase 2.

### Persistência (D3)

As colunas `score_total/score_financeiro/score_operacao/score_mercado/score_juridico` de `public.resultados` foram **reaproveitadas** para o Índice de Prontidão (geral/financeiro/operacional/mercado/documental respectivamente) — sem migration. `score_juridico` continua com esse nome no banco, mas agora carrega a dimensão "Documental". Ver comentário detalhado em `lib/valuation/types.ts::ResultadoValuation`.

Um marcador `versao: "prontidao_v1"` foi adicionado dentro do jsonb `analise_ia` (mesmo padrão já usado para o `erro` do DEF-03) — permite no futuro distinguir resultados gerados antes/depois desta mudança, mesmo que os dois processos de teste existentes já tenham sido recalculados (abaixo).

Os 2 processos de teste que já tinham um resultado gerado antes desta fase ("Empresa Teste Campinas Ltda." e "aduhdawhdawuhd", ambos na conta `augusto_lordano@hotmail.com`) foram recalculados manualmente logo após o deploy desta mudança, confirmando visualmente o novo Índice de Prontidão, os novos rótulos de dimensão e a ausência de qualquer traço do score antigo. **Limitação:** só tenho acesso a essa conta — se existirem outros processos com resultado gerado em outras contas, eles continuam com o significado antigo até serem recalculados manualmente (o marcador de versão cobre esse caso: quando a Fase 3 ou uma versão futura precisar diferenciar, o campo `versao` ausente indica "formato anterior").

`lib/valuation/score.ts` (o motor de score de qualidade antigo) **não foi apagado** — só parou de ser chamado pela rota da API. Mantido por baixo risco de remover algo que `scripts/testar-valuation.ts` ainda referencia como demonstração; sem uso em produção.

### Lista completa dos 46 itens do checklist

| Dimensão | Fase | id | Campo de origem | Label |
|---|---|---|---|---|
| financeiro | financeiro | `financeiro.dre.0.receitaBruta` | `financeiro.dre[0].receitaBruta` | Receita bruta — DRE, ano mais recente |
| financeiro | financeiro | `financeiro.dre.0.deducoes` | `financeiro.dre[0].deducoes` | Deduções — DRE, ano mais recente |
| financeiro | financeiro | `financeiro.dre.0.receitaLiquida` | `financeiro.dre[0].receitaLiquida` | Receita líquida — DRE, ano mais recente |
| financeiro | financeiro | `financeiro.dre.0.custos` | `financeiro.dre[0].custos` | Custos — DRE, ano mais recente |
| financeiro | financeiro | `financeiro.dre.0.despesasOperacionais` | `financeiro.dre[0].despesasOperacionais` | Despesas operacionais — DRE, ano mais recente |
| financeiro | financeiro | `financeiro.dre.0.lucroBruto` | `financeiro.dre[0].lucroBruto` | Lucro bruto — DRE, ano mais recente |
| financeiro | financeiro | `financeiro.dre.0.ebitda` | `financeiro.dre[0].ebitda` | EBITDA — DRE, ano mais recente |
| financeiro | financeiro | `financeiro.dre.0.lucroLiquido` | `financeiro.dre[0].lucroLiquido` | Lucro líquido — DRE, ano mais recente |
| financeiro | financeiro | `financeiro.dre.1.receitaBruta` | `financeiro.dre[1].receitaBruta` | Receita bruta — DRE, ano intermediário |
| financeiro | financeiro | `financeiro.dre.1.deducoes` | `financeiro.dre[1].deducoes` | Deduções — DRE, ano intermediário |
| financeiro | financeiro | `financeiro.dre.1.receitaLiquida` | `financeiro.dre[1].receitaLiquida` | Receita líquida — DRE, ano intermediário |
| financeiro | financeiro | `financeiro.dre.1.custos` | `financeiro.dre[1].custos` | Custos — DRE, ano intermediário |
| financeiro | financeiro | `financeiro.dre.1.despesasOperacionais` | `financeiro.dre[1].despesasOperacionais` | Despesas operacionais — DRE, ano intermediário |
| financeiro | financeiro | `financeiro.dre.1.lucroBruto` | `financeiro.dre[1].lucroBruto` | Lucro bruto — DRE, ano intermediário |
| financeiro | financeiro | `financeiro.dre.1.ebitda` | `financeiro.dre[1].ebitda` | EBITDA — DRE, ano intermediário |
| financeiro | financeiro | `financeiro.dre.1.lucroLiquido` | `financeiro.dre[1].lucroLiquido` | Lucro líquido — DRE, ano intermediário |
| financeiro | financeiro | `financeiro.dre.2.receitaBruta` | `financeiro.dre[2].receitaBruta` | Receita bruta — DRE, ano mais antigo |
| financeiro | financeiro | `financeiro.dre.2.deducoes` | `financeiro.dre[2].deducoes` | Deduções — DRE, ano mais antigo |
| financeiro | financeiro | `financeiro.dre.2.receitaLiquida` | `financeiro.dre[2].receitaLiquida` | Receita líquida — DRE, ano mais antigo |
| financeiro | financeiro | `financeiro.dre.2.custos` | `financeiro.dre[2].custos` | Custos — DRE, ano mais antigo |
| financeiro | financeiro | `financeiro.dre.2.despesasOperacionais` | `financeiro.dre[2].despesasOperacionais` | Despesas operacionais — DRE, ano mais antigo |
| financeiro | financeiro | `financeiro.dre.2.lucroBruto` | `financeiro.dre[2].lucroBruto` | Lucro bruto — DRE, ano mais antigo |
| financeiro | financeiro | `financeiro.dre.2.ebitda` | `financeiro.dre[2].ebitda` | EBITDA — DRE, ano mais antigo |
| financeiro | financeiro | `financeiro.dre.2.lucroLiquido` | `financeiro.dre[2].lucroLiquido` | Lucro líquido — DRE, ano mais antigo |
| financeiro | financeiro | `financeiro.balanco.ativoTotal` | `financeiro.balanco.ativoTotal` | Ativo total |
| financeiro | financeiro | `financeiro.balanco.ativoCirculante` | `financeiro.balanco.ativoCirculante` | Ativo circulante |
| financeiro | financeiro | `financeiro.balanco.passivoTotal` | `financeiro.balanco.passivoTotal` | Passivo total |
| financeiro | financeiro | `financeiro.balanco.passivoCirculante` | `financeiro.balanco.passivoCirculante` | Passivo circulante |
| financeiro | financeiro | `financeiro.balanco.patrimonioLiquido` | `financeiro.balanco.patrimonioLiquido` | Patrimônio líquido |
| financeiro | financeiro | `financeiro.dividas` | `financeiro.dividas` | Dívidas e financiamentos informados |
| operacional | operacao | `operacao.numeroFuncionariosTotal` | `operacao.numeroFuncionariosTotal` | Número total de funcionários |
| operacional | operacao | `operacao.cargosEquipe` | `operacao.cargosEquipe` | Principais cargos/áreas informados |
| operacional | operacao | `operacao.numeroClientesAtivos` | `operacao.numeroClientesAtivos` | Número de clientes ativos |
| operacional | operacao | `operacao.concentracaoTop3Clientes` | `operacao.concentracaoTop3Clientes` | Concentração dos 3 maiores clientes |
| operacional | operacao | `operacao.clientesPrincipais` | `operacao.clientesPrincipais` | Principais clientes informados |
| operacional | operacao | `operacao.fornecedoresPrincipais` | `operacao.fornecedoresPrincipais` | Principais fornecedores informados |
| operacional | operacao | `operacao.processosOperacionais` | `operacao.processosOperacionais` | Descrição dos processos operacionais |
| mercado | mercado | `mercado.concorrentes` | `mercado.concorrentes` | Concorrentes mapeados |
| mercado | mercado | `mercado.posicionamento` | `mercado.posicionamento` | Posicionamento descrito |
| mercado | mercado | `mercado.tamMercado` | `mercado.tamMercado` | Tamanho de mercado estimado (TAM) |
| mercado | mercado | `mercado.sinergiasPotenciais` | `mercado.sinergiasPotenciais` | Sinergias potenciais para M&A descritas |
| documental | documentos | `documentos.arquivo.1` | `documentos.arquivos` | 1º documento enviado |
| documental | documentos | `documentos.arquivo.2` | `documentos.arquivos` | 2º documento enviado |
| documental | documentos | `documentos.arquivo.3` | `documentos.arquivos` | 3º documento enviado |
| documental | documentos | `documentos.arquivo.4` | `documentos.arquivos` | 4º documento enviado |
| documental | documentos | `documentos.arquivo.5` | `documentos.arquivos` | 5º documento enviado |

Total: 30 itens (financeiro) + 7 (operacional) + 4 (mercado) + 5 (documental) = **46 itens**.

### Interface

- Seção renomeada de "Score geral" para "Índice de Prontidão para M&A"; número exibido como percentual (`62%`), não mais "X / 100".
- Removido o gradiente vermelho-amarelo-verde e os rótulos "Atenção/Regular/Bom" do `ScoreGauge` (sugeriam julgamento de qualidade) — barra neutra + o texto de esclarecimento exigido pela especificação, exibido literalmente abaixo do número.
- Dimensões renomeadas na interface: "Operação" → "Operacional", "Jurídico" → "Documental" (Financeiro e Mercado mantiveram o nome).
- A seção "O que ainda falta" (pendências por dimensão com link para a etapa) fica para a Fase 3, que já a especifica — os dados (`pendencias` por dimensão) já saem prontos de `calcularProntidao`, só não têm UI própria ainda nesta fase.

### Verificação desta fase

- `npx tsc --noEmit`, `npx next build`, `npx eslint .`: todos limpos (mesmos 4 warnings pré-existentes de `watch()`, não relacionados).
- `npx tsx scripts/testar-prontidao.ts` (novo script, mesmo padrão de `testar-valuation.ts` — sem D6 resolvido ainda, então sem framework de testes formal): 20 verificações, todas passando — configuração (nenhuma dimensão com 0 itens), intake vazio = 0 em tudo, intake completo = 100 em tudo, um caso calculado manualmente no próprio script (Mercado com 3 de 4 itens = 75%), e o ciclo remover-campo/nota cai/pendência aparece → devolver-campo/nota volta/pendência some.
- Testado manualmente no navegador: os 2 processos de teste existentes recalculados com sucesso, Índice Geral batendo com a média manual das 4 dimensões exibidas, terminologia e ausência de rótulos de qualidade confirmadas visualmente.
- Sem framework de testes automatizado ainda (D6 pendente) — os testes desta fase foram manuais, com scripts de apoio descartáveis (Playwright), não incorporados ao repositório.

---

## Fase 3 — Resultado e explicabilidade

### Motor de valuation

Confirmado na Fase 0 e reconfirmado aqui: `lib/valuation/calcular.ts` já expõe `valuationEbitda`, `valuationDcf`, `valuationPatrimonial` e `valuationFinal` separadamente — **nenhuma refatoração foi necessária**. A matemática (50/30/20) não foi alterada. **D1 (EBITDA não positivo) continua sem resposta do grupo** — por isso a especificação "métodos não aplicáveis indicados conforme D1" não foi implementada; a fórmula em `components/resultado/como-chegamos.tsx` sempre mostra os 3 métodos, o que é seguro hoje porque o DEF-01 (Fase 1) já garante que `valuationEbitda`/`valuationDcf` nunca são nulos num resultado salvo — mas não cobre o caso de um EBITDA/patrimônio informado e diferente de zero, porém **negativo** (o cenário exato de D1).

### Nova hierarquia da tela de resultado

Implementada na ordem exata da especificação, em `app/(app)/processos/[processoId]/resultado/page.tsx`:

1. `ValuationDestaque` — rótulo trocado para "Estimativa preliminar de valuation", com "Análise preliminar" logo abaixo do número.
2. Índice de Prontidão (`ScoreGauge` + `ScoreBreakdown`, inalterados desde a Fase 2) — usa os números **salvos** (`resultado`, do último "Gerar/Recalcular Resultado").
3. **Nova seção "O que ainda falta"** (`components/resultado/pendencias-prontidao.tsx`) — resumo por dimensão ("Financeiro: faltam 22 de 30 informações"), cada uma com link para a etapa correspondente. Diferente de `pendencias-obrigatorias.tsx` (DEF-01), que lista campo por campo: aqui são até 46 itens possíveis, então a granularidade é por dimensão, exatamente como a especificação pede ("pendências por dimensão, com link para a etapa correspondente" — sem mencionar campo).
4. **Nova seção colapsável "Como chegamos a este resultado?"** (`components/resultado/como-chegamos.tsx`), usando `<details>`/`<summary>` nativos do HTML — sem nenhuma dependência nova para accordion/modal. Mostra o breakdown por método (reaproveita o `ValuationBreakdown` que antes ficava solto na tela) + a fórmula com os valores reais, e o breakdown "N de M informações → nota" por dimensão + a conta do Índice Geral.
5. Análise de IA (inalterada).
6. Botão de PDF — **não implementado nesta fase**, como a própria especificação já indica (pertence à Fase 5, que depende de D4).
7. Aviso de análise preliminar — texto literal da especificação, sempre visível junto do resultado.

**Importante sobre "O que ainda falta" e "Como chegamos":** usam o Índice de Prontidão calculado **ao vivo** a partir do intake atual (`calcularProntidao(dadosProcesso)`, chamado toda vez que a página carrega), não o valor congelado no último resultado salvo — mesmo raciocínio já usado para as pendências obrigatórias do DEF-01: se o usuário editou o intake depois da última geração, a seção de pendências reflete o estado atual, podendo divergir do índice mostrado na seção 2 (que é o retrato de quando o resultado foi gerado) até o usuário clicar em "Recalcular".

### IA como contexto de leitura

`lib/ai/analisar.ts::analisarComIA` passou a receber um segundo parâmetro, `resultadoNumerico: { valuation, prontidao }` — os mesmos objetos que `app/api/.../gerar-resultado/route.ts` já calculava antes de chamar a IA. O prompt ganhou uma seção final "Resultado já calculado (contexto de leitura — não recalcule)" com os 3 valores de valuation e as 4 dimensões + Índice Geral da prontidão, e o `SYSTEM_PROMPT` ganhou uma regra explícita instruindo a IA a nunca recalcular ou contestar esses números.

**Garantia de que a IA não pode alterar nenhum número exibido** (por construção, não por confiança na obediência do modelo): em `route.ts`, `valuation` e `prontidao` são calculados e usados para montar todos os campos numéricos de `resultado` (`valuationFinal`, `valuationEbitda`, `scoreTotal`, etc.) **antes** de `analisarComIA` ser chamada; o retorno da IA só é usado para popular o campo `analiseIA` (texto), que nunca realimenta nenhum cálculo. Verificado empiricamente na Fase 1 (teste do DEF-03): com a `ANTHROPIC_API_KEY` removida e depois restaurada, o mesmo processo mostrou exatamente os mesmos números de valuation e índice nos dois casos, só a seção de IA mudou de estado. Sem D6 resolvido, não há um teste automatizado de "trocar o mock da IA não muda os números" — a garantia estrutural do código + essa evidência empírica anterior substituem isso por ora.

### Verificação desta fase

- `npx next build`, `npx tsc --noEmit`, `npx eslint .`: todos limpos (mesmos 4 warnings pré-existentes, não relacionados).
- Testado manualmente no navegador (processo "Empresa Teste Campinas Ltda."): a fórmula exibida em "Como chegamos" (R$ 2.880.000 × 0,50 + R$ 2.618.070 × 0,30 + R$ 1.500.000 × 0,20 = R$ 2.525.421) confere exatamente com o número exibido no topo da página; o Índice Geral (27% + 100% + 100% + 20%) / 4 = 62% confere com a seção 2; a seção "O que ainda falta" mostrou corretamente Financeiro e Documental (as duas dimensões incompletas) com link funcional para a etapa; a análise de IA referenciou os números reais do processo sem introduzir valores divergentes.
