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

---

## Fase 4 — UX

**D5 (resposta do grupo):** perfil do usuário como dropdown no cabeçalho (não uma página própria).

**4.5 — sidebar vs. stepper (resposta do grupo):** a Fase 0 recomendou evoluir o stepper horizontal em vez de introduzir uma sidebar (heurística de consistência/minimalismo — duas navegações paralelas para o mesmo conjunto de 5 passos). O grupo optou explicitamente por **implementar a sidebar como pedido originalmente na especificação**, mantendo o stepper horizontal só para telas estreitas (`lg:hidden`), onde a sidebar não aparece. Registrado em código (`components/intake/intake-sidebar.tsx`).

### 4.2 — Dashboard

Removida a duplicação e-mail/saudação: `app/(app)/dashboard/page.tsx` agora busca `profile.nome_completo` e usa `nomeParaSaudacao = profile?.nome_completo || user.email` num único `<h1>Bem-vindo, {nomeParaSaudacao}!</h1>`; o e-mail deixou de aparecer solto na página (continua visível no cabeçalho, ver 4.4). Ordem confirmada: "Novo Valuation" antes de "Meus processos".

### 4.3 — Cards de processo e exclusão

- `components/dashboard/processos-lista.tsx` (novo, client component): cada card mostra empresa/status/última atualização/disponibilidade de resultado, com um menu "⋮" (`components/ui/menu.tsx`, novo) para as ações — em vez de vários botões soltos no card, que ficaria poluído com até 3 ações condicionais.
- **Decisão deliberada sobre ARIA do menu:** `menu.tsx` **não** usa `role="menu"`/`role="menuitem"` — esses papéis implicam navegação por setas (contrato ARIA de "menu" completo), que não foi implementada. Usa `<button>`/`<a>` semânticos comuns dentro de um container posicionado, com fechamento por clique-fora e por Esc, e retorno de foco ao botão que abriu — um dropdown simples, não um menu ARIA completo. Registrado em comentário no próprio arquivo para não ser "corrigido" incorretamente no futuro.
- Itens do menu: "Continuar preenchimento" / "Editar dados" (mesmo link, rótulo reflete se o processo já tem dados ou não), "Ver resultado" (só aparece se `completo`, isto é, se já existe um resultado gerado), "Excluir processo" (marcado `destrutivo`, cor vermelha).
- **Exclusão:** `app/(app)/dashboard/actions.ts::excluirProcesso`. Ordem importa: os arquivos do Storage (bucket `documentos-intake`, prefixo `{processoId}/`) são listados e removidos **antes** de apagar a linha de `processos` — porque a policy de RLS do Storage checa `exists (select 1 from processos where id = ... and user_id = auth.uid())`, e essa checagem falharia (silenciosamente, negando a exclusão) se o processo já não existisse mais. `partners`, `intake_data` e `resultados` são tabelas Postgres reais com FK `on delete cascade` já configurada — não precisam de nenhum código extra; só o Storage (que não tem cascade nativo com FKs do Postgres) precisa de exclusão explícita antes.
- Confirmação: `useConfirm()` (`components/confirm-dialog.tsx`, estendido para aceitar `{titulo, mensagem, confirmarLabel}` mantendo compatibilidade com o uso antigo de string simples) com o texto exato da especificação — título "Excluir este processo?", corpo "Esta ação não poderá ser desfeita.", botões "Cancelar"/"Excluir", foco inicial em "Cancelar". Após confirmar, `router.refresh()` + banner de feedback ("'{nome}' foi excluído.") na própria lista.
- **Verificado em produção local:** exclusão de um processo de teste vazio ("Empresa sem nome", 0/5 etapas, sem dados reais) via o fluxo completo — menu → confirmar → banner de sucesso → card removido da lista sem erro no console/rede. Não foi verificado por consulta direta ao banco (sem acesso a um cliente SQL nesta sessão); a garantia de que `intake_data`/`resultados`/`partners` foram removidos vem da FK `on delete cascade` já existente no schema, não de uma nova inspeção.

### D5 / 4.4 — Menu de perfil

`components/perfil-menu.tsx` (novo, dropdown no cabeçalho, acionado clicando no e-mail): nome editável (server action `app/(app)/perfil-actions.ts::atualizarNomeUsuario`, grava em `public.users.nome_completo`), e-mail somente leitura, link "Redefinir senha" reaproveitando a página `/reset-password` já existente (sem fluxo novo), e "Sair" (`LogoutButton` já existente). Nenhuma menção a empresas/pré-cadastros, conforme a exclusão de escopo da especificação.

### 4.5 — Navegação do intake

- **Sidebar desktop** (`components/intake/intake-sidebar.tsx`, `hidden lg:flex`): "← Dashboard" no topo, as 5 etapas (mesmo indicador ✓/!/número do stepper, não só cor — `aria-current="step"` na etapa atual), e um item sempre acessível "Resultado" ao final (não fica desabilitado mesmo com pendências, para não bloquear quem só quer conferir o que já existe).
- **Mobile/tablet:** o `IntakeStepper` horizontal que já existia foi mantido (dentro de um `div.lg:hidden`) — é a "solução mais simples compatível com o código atual" pedida na especificação para telas estreitas, em vez de construir uma segunda navegação responsiva.
- **"← Dashboard" duplicado:** como a sidebar só aparece em `lg+`, um link equivalente foi adicionado no topo da coluna de conteúdo, visível só abaixo de `lg` (`lg:hidden`) — sem duplicação visual em nenhum tamanho de tela.
- **Botão "Voltar para o Dashboard" do fim da página (`VoltarDashboardButton`) — decisão de manter:** ele é o único controle de navegação com consciência do estado do autosave (fica desabilitado enquanto o autosave está em andamento, evitando perda de dados). Os novos links "← Dashboard" (sidebar e mobile) não têm essa trava — são links `<a>` simples. Removê-lo deixaria só a navegação sem essa proteção; portanto foi mantido como o caminho "seguro" recomendado, com os links novos como atalhos adicionais. Documentado também em comentário no código (`components/app-shell.tsx`).

### 4.6 — Propósito de cada etapa

`lib/content/propositos-etapas.ts` (novo) — uma frase por etapa, exibida abaixo do título em `app/(app)/intake/[processoId]/[fase]/page.tsx`. Cada frase foi escrita conferindo o uso real do dado (ex.: Perfil explicitamente diz que não entra em nenhum cálculo; Financeiro menciona EBITDA/patrimônio líquido para o valuation **e** o Índice Financeiro; Operação/Mercado/Documentos mencionam só o Índice, nunca o valuation, porque de fato não entram na fórmula).

### 4.7 — Ajuda contextual "(?)"

- `lib/content/ajuda-campos.ts` (novo) — textos centralizados para os 8 campos prioritários da especificação (EBITDA, Receita Bruta, Patrimônio Líquido, Dívidas, Concentração de clientes, TAM, Sinergias, Documentos), cada um com "O que é?" e "Como influencia a análise?" em 2-3 frases. Cada texto foi conferido contra o código de cálculo real antes de ser escrito — por isso, por exemplo, o texto de "Dívidas" diz explicitamente que a informação **não** entra na fórmula de valuation, só no Índice de Prontidão (é isso que `lib/valuation/calcular.ts` de fato faz).
- `components/ui/ajuda-popover.tsx` (novo) — botão "(?)" reaproveitado nos 8 campos, abre por clique/foco/Enter, fecha com Esc ou perda de foco, `aria-expanded`/`aria-describedby`.
- **Bug encontrado e corrigido durante a verificação manual desta fase:** um clique de mouse no botão "(?)" abria e fechava o popover no mesmo gesto, porque o clique dispara primeiro um evento de foco (que abria o popover via `onFocus`) e em seguida o evento de clique (que alternava o estado via `onClick`, fechando de novo) — resultado líquido: clicar não fazia nada visível. Só o foco por teclado (Tab) funcionava. Corrigido com uma ref (`focoPorMouseRef`) marcada no `onMouseDown` (que sempre ocorre antes do foco) para o handler de foco ceder a vez ao de clique quando a abertura já vai ser tratada pelo clique. Reconfirmado depois: clique abre e fecha corretamente, foco puro por teclado também abre, Esc fecha.
- **Achado à parte, corrigido no caminho:** `components/intake/dividas-fieldset.tsx` tinha uma mensagem de confirmação de remoção de dívida factualmente incorreta ("Ela deixará de entrar no cálculo do valuation" — falso, dívidas não entram no valuation) — corrigida para "Essa informação deixará de contar no Índice de Prontidão."

### 4.8 — Acessibilidade e consistência

Não foi feita como um item isolado de auditoria geral (fora do escopo pedido — "sem redesign estético, sem certificação WCAG completa"); em vez disso, cada componente novo desta fase já nasceu com os atributos pedidos: `aria-label` em todos os botões de ícone (menu "⋮", "(?)"), `aria-current="step"` na sidebar, `aria-expanded`/`aria-describedby` no popover de ajuda, foco inicial e retorno de foco no modal de confirmação e nos menus. Os spans de erro já existentes (`money-input.tsx`, DEF-02) já usavam `role="alert"` e `aria-invalid` desde a Fase 1 — não precisaram de mudança nesta fase. Nenhuma auditoria adicional de contraste/labels foi feita nos componentes que já existiam antes da Fase 0 e não foram tocados por nenhum item desta fase.

### Verificação desta fase

- `npx eslint .`: 0 erros (4 warnings pré-existentes de `watch()`, mesmas de todas as fases anteriores).
- `npx tsc --noEmit` / `npx next build`: limpos, todas as rotas compilando (incluindo depois da correção do bug do popover de ajuda).
- Testado manualmente no navegador (Playwright ad-hoc, conta `augusto_lordano@hotmail.com`): saudação sem duplicação de e-mail; menu "⋮" com os itens corretos e condicionais (processo com resultado mostra "Ver resultado", processo sem mostra só "Editar dados"); Esc fecha o menu de ações; exclusão completa (confirmação com foco em "Cancelar" → "Excluir" → banner de sucesso → card removido) testada de ponta a ponta contra um processo de teste vazio; menu de perfil abre, edição de nome persiste após reload (via `router.refresh()`); sidebar desktop mostra as 5 etapas + "Resultado" com os indicadores corretos; stepper mobile continua funcionando em `lg:hidden`; popover de ajuda testado em EBITDA — abre por clique (após a correção do bug) e por foco de teclado, fecha com Esc.

---

## Fase 5 — PDF do resultado

**D4 (resposta do grupo):** página de impressão — `window.print()` + CSS `@media print`, sem nenhuma biblioteca nova. A própria tela de resultado é o "documento"; o PDF é o que o navegador do usuário gera ao escolher "Salvar como PDF" no diálogo de impressão.

### Por que essa abordagem satisfaz "mesma fonte de dados da tela, sem recálculo"

Não existe rota, página ou componente novo que busque ou recalcule o resultado — o botão "Baixar relatório em PDF" (`components/resultado/baixar-pdf-button.tsx`) só chama `window.print()` na mesma árvore de componentes já renderizada por `app/(app)/processos/[processoId]/resultado/page.tsx`. Qualquer divergência entre tela e PDF estruturalmente não pode existir, porque são o mesmo DOM.

### O que o CSS de impressão faz

- `app/globals.css` ganhou um bloco `@media print` que força tema claro (`--background`/`--foreground` e `color` de todos os elementos com `!important`) independente do `prefers-color-scheme` do sistema operacional — sem isso, texto pensado para fundo escuro (`dark:text-*`) poderia ficar ilegível sobre o fundo branco que a impressão força. Cor de fundo/borda não foi forçada — no pior caso (SO em modo escuro) algum contêiner mantém uma cor de fundo escura, um efeito só estético, não um problema de legibilidade.
- Classes `print:hidden` foram adicionadas a tudo que não faz sentido num documento estático: cabeçalho da aplicação (`components/app-shell.tsx`), o link "← Editar dados do intake", o próprio botão de baixar PDF, a seção inferior de "Recalcular"/pendências obrigatórias, e o componente `GerarResultadoButton` (usado tanto ali quanto no "Tentar novamente" da análise de IA com erro).
- A seção colapsável "Como chegamos a este resultado?" (`components/resultado/como-chegamos.tsx`) precisa aparecer **aberta** no PDF mesmo que o usuário nunca tenha clicado nela na tela. Forçar isso só com CSS (`details:not([open])`) é frágil entre navegadores, então o componente (agora `"use client"`) escuta os eventos globais `beforeprint`/`afterprint`: abre de verdade antes de imprimir e devolve ao estado anterior depois — se o usuário já tinha aberto manualmente, continua aberta após a impressão; se estava fechada, volta a fechar. O texto do `<summary>` (com o indicador "+/−", que só faz sentido como affordance clicável) fica oculto no print e é substituído por um `<h3>` estático com o mesmo título.

### Verificação desta fase

- `npx eslint .`, `npx tsc --noEmit`, `npx next build`: todos limpos.
- Testado com Playwright contra o processo "Empresa Teste Campinas Ltda." (que já tinha um resultado gerado): o texto extraído da tela normal e o texto extraído com `page.emulateMedia({ media: "print" })` são **idênticos** nos números (valuation R$ 2.525.421, Índice Geral 62%, as 4 notas por dimensão, as pendências) — nenhuma segunda fonte de cálculo.
- Confirmado que o cabeçalho da aplicação e o botão "Baixar relatório em PDF" ficam ocultos (`isVisible() === false`) na mídia de impressão.
- Confirmado via `window.dispatchEvent(new Event("beforeprint"))`/`"afterprint"` (os eventos reais de impressão não são emitidos por `emulateMedia` sozinho, só por uma impressão de verdade) que a seção "Como chegamos" abre automaticamente antes de imprimir, fecha depois se estava fechada, e permanece aberta depois se o usuário já a tinha aberto manualmente.
- Gerado um PDF de verdade com `page.pdf()` (motor de impressão real do Chromium, não só emulação de mídia) do mesmo processo: a fórmula (R$ 2.880.000 × 0,50 + R$ 2.618.070 × 0,30 + R$ 1.500.000 × 0,20 = R$ 2.525.421) e o Índice Geral ((27% + 100% + 100% + 20%) / 4 = 62%) aparecem por extenso e conferem exatamente com a tela; nenhum elemento de navegação/ação aparece no documento.

### Pendências

Sem biblioteca de PDF, o layout impresso segue as regras de paginação padrão do navegador (não há controle fino de quebra de página entre seções) — aceitável para um MVP acadêmico; não foi testado em outros motores além do Chromium (o ambiente de desenvolvimento disponível só tinha esse navegador).

---

## Alternador de tema claro/escuro (fora da numeração das Fases 1–6)

Pedido pontual do usuário, fora do plano de evolução — registrado aqui pelo mesmo motivo de tudo mais neste arquivo: envolveu uma mudança estrutural (estratégia de dark mode do Tailwind) e um bug real encontrado durante a verificação.

### O que mudou

- Antes, o tema escuro só seguia `prefers-color-scheme` (preferência do sistema operacional, sem controle manual). Agora `app/globals.css` declara `@custom-variant dark (&:where(.dark, .dark *));` — o `dark:` do Tailwind passa a reagir à classe `.dark` na tag `<html>`, não mais à media query diretamente.
- `components/ui/theme-toggle.tsx` (novo): um botão único (não um seletor de 3 opções) que alterna claro/escuro, salvo em `localStorage` (chave `"tema"`). Antes da primeira escolha explícita, segue a preferência do sistema. Usa `useSyncExternalStore` (não `useState` + `useEffect` lendo `localStorage` no mount) — a primeira tentativa usava esse segundo padrão e o lint (`react-hooks/set-state-in-effect`, regra do React Compiler) reprovou por chamar `setState` diretamente dentro de um efeito; `useSyncExternalStore` é a ferramenta correta para um valor que vem de uma fonte externa ao React (localStorage/`matchMedia`) e evita esse problema por construção, incluindo o `getServerSnapshot` que evita descompasso entre o HTML do servidor e a primeira renderização no cliente.
- Um `<script>` síncrono no início de `<body>` (`app/layout.tsx`) aplica a classe `.dark` antes da primeira pintura, lendo a mesma chave de `localStorage` — sem isso, a página sempre abriria no tema claro por um instante antes do React corrigir.
- Botão adicionado nos três cabeçalhos existentes no app: `components/app-shell.tsx` (área autenticada), `app/(auth)/layout.tsx` (login/cadastro/etc.) e `app/page.tsx` (landing pública) — não foi criado um cabeçalho novo só para isso, o botão foi encaixado nos três já existentes.

### Bug encontrado e corrigido: impressão/PDF com tema escuro ativado

A Fase 5 (PDF) já forçava fundo e texto claros no `@media print`, mas isso foi implementado testando só com o tema claro ativo (única opção que existia até aqui). Ao testar o PDF com o tema escuro ativado antes de imprimir, o card da "Estimativa preliminar de valuation" (`components/resultado/valuation-destaque.tsx`, fundo `dark:bg-zinc-900`) ficou **ilegível** — o CSS de impressão só forçava a cor do texto, não o fundo, e o fundo escuro daquele card (uma classe `dark:bg-*` comum, não específica desse componente) continuava aplicado, resultando em texto escuro sobre fundo escuro.

Corrigido na raiz, não card por card: `components/theme-impressao-clara.tsx` (novo) escuta `beforeprint`/`afterprint` e **remove de verdade a classe `.dark`** da tag `<html>` antes de imprimir (devolvendo depois) — como todas as variantes `dark:` do Tailwind agora dependem dessa classe, removê-la desliga todas de uma vez, igual ao usuário nunca ter ligado o tema escuro. O bloco de CSS do `@media print` em `globals.css` foi simplificado para servir só de reforço (`--background`/`--foreground` e fundo do `body`), já que a correção real é essa remoção de classe em JS.

### Verificação

- `npx eslint .`, `npx tsc --noEmit`, `npx next build`: todos limpos (mesmos 4 warnings pré-existentes de `watch()`).
- Testado com Playwright: clique no botão alterna a classe `.dark` e persiste em `localStorage`; após reload, o tema salvo se mantém (sem piscar tema errado, confirmado visualmente); a página de login e o dashboard refletem o mesmo tema salvo (mesma chave de `localStorage`, compartilhada entre as três áreas do app).
- Testado o bug do PDF em tema escuro especificamente: um PDF real gerado via `page.pdf()` (motor de impressão do Chromium) com o tema escuro ativado ficou **idêntico** ao gerado em tema claro (mesmos números, todo o texto legível); confirmado também que a classe `.dark` é restaurada corretamente na tela depois da impressão (o usuário não perde o tema escuro que tinha escolhido só por ter imprimido/exportado um PDF).

---

## Card do processo clicável no dashboard (fora da numeração das Fases 1–6)

Pedido pontual do usuário: antes, a única forma de abrir um processo era pelo menu "⋮" — o card em si não reagia a clique. `components/dashboard/processos-lista.tsx` ganhou um `<Link>` posicionado em `absolute inset-0` sobre o `<li>` inteiro (técnica de "stretched link": um link invisível do tamanho do card inteiro, com `aria-label` descritivo em vez de texto visível duplicado), levando para `/processos/{id}/resultado` quando o processo já tem resultado gerado, ou para `/intake/{id}/perfil` (continuar preenchimento) quando ainda não tem. O menu "⋮" continua funcionando normalmente porque fica num contêiner com `z-index` mais alto — um clique nele acerta o botão do menu, não o link invisível por baixo.

Verificado com Playwright: clicar em qualquer ponto de um card com resultado navega para o resultado; clicar num card "Em andamento" navega para o intake; clicar no botão "⋮" continua abrindo o menu (incluindo "Excluir processo") sem disparar a navegação do card. `npx eslint .`, `npx tsc --noEmit` e `npx next build` limpos.

---

## Quatro melhorias de UX pontuais (fora da numeração das Fases 1–6)

Discutidas com o usuário como opções antes de implementar; ele pediu pra fazer todas.

1. **Atalho "Resultado" no stepper mobile** (`components/intake/intake-stepper.tsx`) — a sidebar desktop (Fase 4.5) já tinha um link fixo pro Resultado; o stepper horizontal do mobile não tinha equivalente, então no celular só dava pra chegar lá voltando ao dashboard e abrindo o menu "⋮". Adicionado como mais um item (borda tracejada, pra se diferenciar visualmente dos itens numerados/com pendência), sempre acessível, igual à versão desktop.
2. **Nome do processo novo com data** (`app/(app)/intake/page.tsx`) — antes todo processo novo nascia com o literal "Empresa sem nome", ficando indistinguível de outro processo também não preenchido na lista do dashboard. Agora nasce como "Novo processo — DD/MM". Comentários em `components/intake/perfil-form.tsx` e `app/(app)/intake/perfil-actions.ts` que citavam o texto antigo foram atualizados.
3. **Confirmação visual do autosave** (`components/intake/autosave-status.tsx`) — um "✓" verde antes de "Salvo às HH:MM", reforçando visualmente (não só por texto) que os dados foram salvos.
4. **Prévia do resultado no card do dashboard** (`app/(app)/dashboard/page.tsx` + `components/dashboard/processos-lista.tsx`) — antes o card não mostrava nenhum número do resultado, só o status. Adicionado "Estimativa preliminar: R$ X · Prontidão: Y%" quando existe mesmo um resultado gerado (checado por `valuation_final`/`score_total` não nulos em `public.resultados`, buscados na mesma consulta do dashboard — sem recálculo). Risco identificado antes de implementar: expor esses números fora do contexto do disclaimer completo da tela de resultado poderia reforçar a leitura de "nota de qualidade da empresa" que a Fase 2 trabalhou pra evitar — mitigado deixando a linha pequena, no mesmo cinza neutro do resto do card (sem destaque, sem cor, sem barra), com o termo "preliminar" explícito no texto, igual ao vocabulário já usado na tela de resultado.

Verificação: `npx eslint .`, `npx tsc --noEmit`, `npx next build` limpos; testado com Playwright — nome datado do processo novo confirmado, checkmark do autosave visível, atalho "Resultado" visível e funcional no stepper mobile, prévia do card exibindo os valores reais dos 2 processos de teste (conferido visualmente por screenshot).

---

## Âncora por campo nas pendências do Índice de Prontidão (fora da numeração das Fases 1–6)

Retomando a sugestão original da revisão de UX: "O que ainda falta" (Fase 3) e o atalho "Completar em Financeiro" levavam só para o topo da etapa — numa etapa como Financeiro, com até 22 de 30 informações faltando, o usuário não tinha nenhuma indicação de quais campos exatamente precisava preencher.

### O que mudou

- **Todo campo coberto pelos 46 itens do checklist da Fase 2 (`lib/prontidao/checklist.ts`) ganhou um `id` de DOM** nos formulários (`dre-fieldset.tsx`, `financeiro-form.tsx`, `dividas-fieldset.tsx`, `operacao-form.tsx` + seus 3 sub-fieldsets de lista, `mercado-form.tsx` + `concorrentes-fieldset.tsx`, `documentos-form.tsx`), usando a mesma string do `id` do item do checklist (ex.: `financeiro.dre.0.ebitda`, `operacao.numeroClientesAtivos`) — sem uma tabela de tradução separada, o próprio id do item já É o id do campo no HTML. Exceção: os 5 itens documentais (`documentos.arquivo.1..5`) não têm campo individual no DOM (é uma única área de upload, sem um campo "tipo de documento" no schema — limitação já registrada na Fase 2); todos apontam para o mesmo id da área de upload (`documentos.arquivos`). A função `ancoraDoItemProntidao()` (novo export em `checklist.ts`) faz essa tradução id-do-item → id-do-DOM.
- **Unificação com os anchors do DEF-01** (Fase 1): os campos EBITDA e Patrimônio Líquido já tinham um `id` próprio (`dre-ebitda-0`, `patrimonioLiquido`) para as pendências obrigatórias (`lib/valuation/campos-obrigatorios.ts`). Em vez de manter duas convenções de id disputando os mesmos dois campos, esses dois ids foram renomeados para a convenção do checklist (`financeiro.dre.0.ebitda`, `financeiro.balanco.patrimonioLiquido`) — um único id de DOM por campo, ambas as features linkando para o mesmo lugar.
- **Nova seção "X informações desta etapa ainda não contam no Índice de Prontidão"** (`components/intake/pendencias-etapa.tsx`), exibida na própria página da etapa (não na tela de resultado, que manteria o resumo por dimensão como já decidido na Fase 3 — listar os até 22 itens ali "faria a seção virar uma lista enorme", conforme já registrado). Tom neutro (cinza, não âmbar/vermelho): diferente do DEF-01, isso não bloqueia nada. Some completamente quando não há pendências na etapa (incluindo Perfil, que nunca tem, por não entrar no Índice).
- O link "Completar em {Fase}" da tela de resultado (`components/resultado/pendencias-prontidao.tsx`) agora aponta para o primeiro campo pendente daquela dimensão, não só para o topo da etapa.
- `scroll-margin-top: 5rem` global (`[id] { ... }` em `globals.css`) e `scroll-behavior: smooth` (respeitando `prefers-reduced-motion`) — sem isso, o campo-alvo ficava colado na borda de cima da tela, cortando o próprio rótulo do campo (achado durante a verificação, corrigido antes de finalizar).

### Verificação

- `npx eslint .`, `npx tsc --noEmit`, `npx next build`: limpos.
- `npx tsx scripts/testar-prontidao.ts`: as 20 verificações continuam passando (a renomeação dos ids de DOM não mexeu nos ids dos itens do checklist, que são o que o script verifica).
- Testado com Playwright: a lista de pendências da etapa Financeiro mostrou exatamente os 22 campos vazios (excluindo corretamente EBITDA, Patrimônio Líquido e a dívida já preenchidos); clicar em cada link rolou a página até o campo certo, com rótulo e input visíveis (não cortados); os 2 links de pendência do DEF-01 (EBITDA e Patrimônio Líquido, na tela de "Gerar Resultado" bloqueado) continuam funcionando com os ids renomeados.

---

## Transformação visual "premium" — primeira leva (fora da numeração das Fases 1–6)

Pedido explícito do usuário: elevar a execução visual do app ("moderno, profissional, foge do padrão"), usando como referência estrutural o skill instalado `high-end-visual-design`. Decisões alinhadas antes de começar:
- **Identidade mantida**: a paleta grafite (`--color-ink`) + dourado (`--color-accent`) já documentada continua sendo a marca — o skill contribui estrutura (cards, motion, ritmo espacial), não paleta.
- **Sem biblioteca nova**: o skill sugere Framer Motion para as animações; implementado em vez disso com CSS puro (`transition` + `cubic-bezier` customizado) e `IntersectionObserver`, respeitando a regra do projeto de não instalar nada sem aprovação. Ícones "ultra-light" sugeridos pelo skill (Phosphor/Remix) também não foram instalados — mantidos os glifos simples já usados (setas, "+", unicode). A fonte Geist já usada pelo projeto é uma das opções que o próprio skill já aceita como "premium".
- **Escopo desta leva**: landing page, cabeçalho de autenticação + tela de login, dashboard (saudação, CTA, cards de processo) e o cabeçalho compartilhado (`app-shell.tsx`). **Deliberadamente não tocado nesta leva**: os 5 formulários de intake e a tela de resultado — são telas densas em dados com lógica sensível já testada (autosave, âncoras de campo, impressão da Fase 5); alterá-las exige mais cuidado e fica para uma leva seguinte, após o usuário revisar esta primeira.

### O que foi construído

- `components/ui/reveal.tsx` (novo) — fade-up ao entrar na tela via `IntersectionObserver`, só `transform`/`opacity` (sem `blur` animado — o skill sugere blur, mas contradiz sua própria regra de performance de "só transform/opacity"; optei pela regra de performance). Respeita `prefers-reduced-motion` (conteúdo já nasce visível, sem animação).
- `components/ui/premium-card.tsx` (novo) — card "double-bezel" (invólucro externo + núcleo interno com raios concêntricos, técnica do skill), com as cores do projeto.
- `.shadow-premium` (novo, `globals.css`) — sombra difusa mais sofisticada que o `shadow` padrão do Tailwind, com variante para tema escuro.
- Landing page (`app/page.tsx`) reformulada: eyebrow tag, tipografia maior, botões em pílula com ícone aninhado ("button-in-button", técnica do skill), cards de recurso com `PremiumCard` + `Reveal` escalonado. Também corrigido um texto desatualizado: a descrição do índice ainda dizia "financeiro, operação, mercado e **jurídico**" — nome antigo, trocado por "operacional" e "documental" (terminologia da Fase 2/3) desde a Fase 2, nunca corrigido nessa página.
- `app/(auth)/layout.tsx` + `app/(auth)/login/page.tsx`: cabeçalho com hairline refinada; card de login em `PremiumCard` + `Reveal`, inputs com cantos maiores, botão em pílula — lógica de autenticação (`handleSubmit`, estados) inalterada.
- Dashboard (`app/(app)/dashboard/page.tsx`, `components/dashboard/processos-lista.tsx`): saudação com `Reveal`, CTA "Novo Valuation" em pílula com ícone "+" aninhado, cards de processo com cantos maiores, hairline mais sutil e elevação (`shadow-premium` + leve translação) no hover — a estrutura funcional dos cards (link "esticado" cobrindo o card inteiro + menu "⋮" em `z-10` por cima, ambos construídos numa revisão de UX anterior) foi mantida exatamente igual, só as classes visuais mudaram.
- `components/app-shell.tsx`: hairline do cabeçalho compartilhado (dashboard/intake/resultado) alinhada ao mesmo tom mais sutil usado nas telas novas.

### Bugs reais encontrados e corrigidos durante a verificação

- **Cache do Turbopack corrompido**: depois de rodar `next build` (produção) em paralelo com o `next dev` do usuário (mesmo tipo de conflito de `.next` já visto na Fase 5), o `next dev` continuou servindo CSS desatualizado mesmo depois de reiniciado — o hash do arquivo de CSS servido não mudava entre reinícios, sinal de cache persistente em `.next/cache` sobrevivendo ao restart. Corrigido apagando a pasta `.next` inteira antes de subir o servidor de novo (autorizado pelo usuário).
- **Cartão "double-bezel" invisível no tema escuro**: o núcleo interno do `PremiumCard` usava `dark:bg-zinc-950`, quase idêntico ao fundo da própria página no tema escuro (`#0a0a0a`) — o cartão ficava sem nenhum contraste visível. Corrigido para `dark:bg-zinc-900`, perceptivelmente mais claro que o fundo.

### Verificação

- `npx eslint .`, `npx tsc --noEmit`, `npx next build`: limpos.
- Testado com Playwright, tema claro e escuro: landing page, login (fluxo real de autenticação, não só visual), dashboard. Confirmado que o clique no card do processo ainda navega corretamente e o menu "⋮" ainda abre sem disparar a navegação (comportamento construído numa revisão de UX anterior, preservado).
- Confirmado que a tela de resultado e a geração de PDF da Fase 5 continuam funcionando exatamente como antes (não foram tocadas nesta leva) — testado gerando um PDF de verdade após todas as mudanças.

### Pendente (próxima leva, após revisão do usuário)

Os 5 formulários de intake (Perfil, Financeiro, Operação, Mercado, Documentos) e a tela de Resultado continuam com o tratamento visual anterior à esta leva. Se o usuário aprovar a direção desta primeira leva, o mesmo tratamento (cards, motion, ritmo espacial) pode ser estendido a essas telas — com atenção redobrada para não quebrar autosave, âncoras de campo (`id`s usados pelas pendências do Índice de Prontidão) nem a lógica de impressão/PDF da Fase 5.
