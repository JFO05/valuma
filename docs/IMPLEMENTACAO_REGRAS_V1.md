# Implementação da Regra de Negócio v1.0 — ValuM&A

Registro técnico da implementação de `docs/REGRAS_NEGOCIO_VALUMA_V1.md`. Não altera nenhuma decisão de negócio — só documenta como cada regra foi traduzida em código, banco, UX e testes.

## O que foi implementado

- Motor de valuation reescrito (`lib/valuation/calcular.ts`): Enterprise Value → Equity Value via Dívida Líquida (dívida financeira total − caixa e equivalentes), aplicabilidade por método (EBITDA-base ≤ 0 e/ou Patrimônio Líquido ≤ 0), sem renormalização de pesos, consolidado só com os 3 métodos aplicáveis.
- Ambiguidade do zero corrigida para EBITDA (por ano do DRE), Patrimônio Líquido e o novo campo Caixa e Equivalentes de Caixa — `undefined` = não informado, qualquer número definido (incluindo 0/negativo) = informado.
- Novo campo "Situação de dívida financeira declarada" (Sim/Não) no intake Financeiro.
- Campos mínimos para gerar análise redefinidos (RG-40): razão social, setor, EBITDA-base informado, Patrimônio Líquido informado, situação de dívida declarada, caixa informado — zero conta, ausência não.
- Índice de Prontidão Informacional reescrito (`lib/prontidao/checklist.ts`): modelo de 4 estados (AUSENTE/INVÁLIDO/VÁLIDO ESTRUTURALMENTE/VÁLIDO COM ALERTA), validações de domínio (percentuais 0–100) e de texto (rejeita vazio/trivial/só símbolos), dimensão Documental reescrita para 6 categorias fixas.
- Documentos: 6 categorias fixas, período de referência opcional, hash de conteúdo (Web Crypto, client-side) para detectar duplicidade por categoria com aviso ao usuário (substituir/manter complementar/cancelar).
- Motor de score antigo (`lib/valuation/score.ts`) removido do código ativo.
- IA: prompt/system prompt atualizados com a lista explícita de proibições (RG-42/RG-43) e o novo contexto de aplicabilidade/Equity Value; nunca infere dado ausente.
- Ciclo de vida do resultado: versionamento explícito (`MODEL_VERSION = "valu_ma_v1"`, guardado em `analise_ia.versao`), resultados antigos identificáveis e nunca reinterpretados silenciosamente, "resultado desatualizado" comparando `resultados.atualizado_em` com o intake, dashboard usando existência real de resultado (não completude do intake).
- Tela de resultado reordenada (Equity Value → Prontidão → Pendências/alertas → Explicabilidade → IA → Próximas etapas → Disclaimer), terminologia oficial ("DCF simplificado", "Estimativa preliminar de Equity Value"), disclaimer oficial, seção nova "Próximas etapas recomendadas", avisos de resultado desatualizado/legado (visíveis também no PDF).

## Arquivos principais

- `lib/valuation/types.ts` — `informadoExplicitamente`, `MODEL_VERSION`, `AplicabilidadeMetodos`, `ExplicabilidadeValuation`, `ResultadoValuation` nullable.
- `lib/valuation/calcular.ts` — motor reescrito (EV, dívida líquida, Equity, aplicabilidade).
- `lib/valuation/campos-obrigatorios.ts` — gate de 6 campos mínimos.
- `lib/valuation/resultados.ts` — mapper + `ehResultadoLegado` + `derivarAplicabilidade`.
- `lib/prontidao/checklist.ts` — checklist reescrito (4 estados, documental por categoria).
- `lib/intake/schema-financeiro.ts` — `caixaEquivalentes`, `possuiDividas`, EBITDA/PL opcionais.
- `lib/intake/schema-documentos.ts` — categorias, período, hash, `documentoDisponibilizado`, `encontrarDuplicata`.
- `lib/ai/analisar.ts` — prompt/contexto atualizados.
- `app/api/processos/[processoId]/gerar-resultado/route.ts` — persiste nullable + versão + explicabilidade, nunca bloqueia por ausência total de métodos.
- `app/(app)/processos/[processoId]/resultado/page.tsx` — reordenada, avisos, disclaimer oficial.
- `app/(app)/dashboard/page.tsx`, `components/dashboard/processos-lista.tsx` — critério de "Ver resultado" corrigido.
- `components/intake/financeiro-form.tsx`, `documentos-form.tsx`, `documento-list-item.tsx` — novos campos/UX.
- `components/resultado/*` — `valuation-destaque.tsx`, `valuation-breakdown.tsx`, `como-chegamos.tsx`, `pendencias-prontidao.tsx`, `score-gauge.tsx`, `analise-ia-cards.tsx`, `proximas-etapas.tsx` (novo), `avisos-resultado.tsx` (novo).
- `supabase/schema.sql` — migration (ver abaixo).
- `scripts/testar-valuation.ts`, `scripts/testar-prontidao.ts`, `scripts/testar-regras-negocio.ts` (novo).

## Banco de dados

Migration adicionada ao final de `supabase/schema.sql` (idempotente, mesmo padrão das migrations anteriores do arquivo):

1. `valuation_final`, `valuation_ebitda`, `valuation_dcf`, `valuation_patrimonial` deixam de ser `not null` — método/consolidado não aplicável agora é `null`, nunca `0`.
2. Nova coluna `resultados.atualizado_em` (+ trigger reaproveitando `set_atualizado_em`, já existente para `intake_data`) — necessária porque um upsert de "Gerar/Recalcular Resultado" **não** atualiza `created_at`, e `processos.updated_at` é atualizado pela própria geração do resultado (não serviria para detectar "desatualizado" sem um falso "sempre em dia").

Nenhuma migration foi necessária para: caixa e equivalentes, situação de dívida, categoria/período/hash de documento — todos cabem no `jsonb` já existente de `intake_data`. A versão do modelo e o detalhamento de explicabilidade (EV, dívida líquida) também não exigiram coluna nova — reaproveitam o `jsonb` `analise_ia`, mesmo padrão já usado pelo campo `versao` antes desta versão.

## Valuation — exemplo numérico manual

Dados: EBITDA-base = R$ 200.000; dívidas = R$ 100.000; caixa = R$ 20.000; Patrimônio Líquido = R$ 1.100.000.

```
Dívida Líquida = 100.000 − 20.000 = 80.000

EV_Múltiplos = 200.000 × 4,0 = 800.000
Equity_Múltiplos = 800.000 − 80.000 = 720.000

Fluxo ano 1 = 200.000 × 1,03 = 206.000 → VP = 206.000 / 1,15^1 = 179.130,43
Fluxo ano 2 = 206.000 × 1,03 = 212.180 → VP = 212.180 / 1,15^2 = 160.462,20
Fluxo ano 3 = 212.180 × 1,03 = 218.545,40 → VP = 218.545,40 / 1,15^3 = 143.716,84
Fluxo ano 4 = 218.545,40 × 1,03 = 225.101,76 → VP = 225.101,76 / 1,15^4 = 128.687,88
Fluxo ano 5 = 225.101,76 × 1,03 = 231.854,82 → VP = 231.854,82 / 1,15^5 = 115.244,29
EV_DCF = soma dos 5 VPs ≈ 727.241,63
Equity_DCF = 727.241,63 − 80.000 ≈ 647.241,63

Equity_Patrimonial = 1.100.000 (sem conversão)

Estimativa preliminar de Equity Value
  = 720.000 × 0,50 + 647.241,63 × 0,30 + 1.100.000 × 0,20
  = 360.000 + 194.172,49 + 220.000
  = 774.172,49
```

Confirmado via `npm run valuation:test` (mesmos parâmetros, valores conferem).

## Prontidão

Cada dimensão (Financeiro/Operacional/Mercado/Documental) vale 25% do Índice Geral. Nota da dimensão = itens VÁLIDO_ESTRUTURALMENTE ou VÁLIDO_COM_ALERTA / itens esperados × 100, com precisão completa (arredondamento só na apresentação). Financeiro tem 31 itens (24 do DRE × 3 anos + 7 do balanço/caixa/dívida); Documental tem exatamente 6 itens, um por categoria fixa.

## Documentos

6 categorias fixas (`CATEGORIAS_DOCUMENTO`); um documento só conta para uma categoria se tiver `categoria` atribuída e `tamanho > 0` (`documentoDisponibilizado`). Nota documental = categorias atendidas / 6 × 100 — múltiplos documentos na mesma categoria contam 1 vez (verificado em teste). Duplicidade é avaliada por hash de conteúdo (SHA-256, calculado no navegador) + mesma categoria; some ao usuário só no momento em que ele categoriza o documento (é quando o par hash+categoria passa a existir).

## IA

Isolamento estrutural preservado e reforçado: a IA recebe `ResultadoCalculoValuation`/`ResultadoProntidao` já calculados como parâmetro somente-leitura, depois de `calcularValuation`/`calcularProntidao` já terem rodado; seu schema de retorno (Structured Output) não tem nenhum campo numérico. O `SYSTEM_PROMPT` lista explicitamente as proibições (não recalcular, não propor valor alternativo, não alterar pesos/Prontidão, não afirmar validação profissional) e instrui a nunca inferir dado ausente.

## Resultados antigos

Resultados sem `analise_ia.versao === "valu_ma_v1"` são tratados como legados (`ehResultadoLegado`) — inclui os sem nenhum campo `versao` e os com o marcador anterior (`"prontidao_v1"`). A tela de resultado mostra um aviso permanente (também impresso no PDF) em vez de reinterpretar os números antigos como Equity Value da v1.0.

## Resultado desatualizado

Comparação entre `resultados.atualizado_em` (atualizado pelo trigger a cada upsert) e o `MAX(intake_data.atualizado_em)` do processo — nunca `processos.updated_at`, que é escrito pela própria rota de geração de resultado logo depois de salvar o resultado (usá-lo criaria um falso "nunca desatualizado").

## Testes

`npm run valuation:test`, `npm run prontidao:test` e `npm run regras:test` (ou `npm test` para os três) — scripts com asserts simples (sem framework de testes, mesmo padrão já estabelecido no projeto), cobrindo:

- Motor de valuation: EV, dívida líquida (incl. negativa), conversão para Equity, consolidado 50/30/20, ausência de renormalização.
- Aplicabilidade: EBITDA/PL em zero, positivo, negativo e as combinações cruzadas; ausência total (nenhum método aplicável); métodos individuais disponíveis sem consolidado.
- Campos mínimos: zero informado passa, ausência bloqueia, para os 4 campos financeiros novos/alterados.
- Prontidão: 4 estados de validade, domínio de percentuais, texto trivial, zero informado, categorias documentais (incluindo duplicidade e ausência de categoria), arredondamento só na apresentação.

Todos os três scripts passam (saída "TODAS AS VERIFICAÇÕES PASSARAM").

Não cobertos por script (dependem de Supabase/rota Next, mesma limitação já documentada para `consolidarDadosProcesso` antes desta versão): geração de resultado ponta a ponta, upload/duplicidade de documentos contra o Storage real, resultado desatualizado/legado na tela real, chamada real à IA, exportação de PDF. Verificados por leitura de código e pelo build de produção (que renderiza estaticamente as rotas não-dinâmicas e type-checka todas).

## Build

- `npx tsc --noEmit`: sem erros.
- `npx eslint .`: sem erros (4 warnings pré-existentes de `react-hooks/incompatible-library` em formulários que usam `watch()`, não relacionados a esta implementação).
- `npx next build`: sucesso.

## Limitações conhecidas

- **Compatibilidade retroativa da ambiguidade do zero**: processos criados antes desta versão já tinham `patrimonioLiquido`/`ebitda` persistidos como `0` no jsonb (o default antigo) mesmo quando nunca preenchidos pelo usuário. A partir desta versão, `0` explícito é tratado como "informado" — não há como diferenciar, para dados já salvos, um `0` antigo genuinamente digitado de um `0` antigo apenas herdado do default. Não há backfill possível sem inventar uma informação que não existe; o efeito prático é que processos antigos podem passar a satisfazer o gate de campos mínimos/Prontidão para esses 2 campos um pouco mais cedo do que fariam se tivessem sido criados sob esta regra desde o início.
- **Hash de duplicidade depende de contexto seguro do navegador** (`crypto.subtle` exige HTTPS/localhost) — em contexto inseguro, documentos são salvos sem hash e nunca participam da checagem de duplicidade (apenas essa verificação de conveniência é afetada; upload, categorização e pontuação continuam funcionando normalmente).
- **Categorização de documentos é manual** — o sistema não tenta inferir a categoria a partir do conteúdo/nome do arquivo (fora de escopo, RG-56 exclui OCR/leitura semântica).
- Validação de obrigatoriedade dos schemas Zod dos formulários continua não bloqueando a navegação entre etapas (comportamento intencional desta rodada — Fase 10 do prompt de implementação pede exatamente isso, não uma correção).

## Pendências

Nenhuma pendência de negócio. Duas pendências técnicas de baixo risco, deixadas para uma rodada futura de UX (não bloqueiam a Regra de Negócio v1.0):

1. O checklist de Prontidão por etapa (`components/intake/pendencias-etapa.tsx`) ainda não distingue visualmente pendências "ausente" de "válido com alerta" — a tela de resultado já faz essa distinção (`components/resultado/pendencias-prontidao.tsx`).
2. `zodResolver`/`errors` dos formulários de intake continuam parcialmente conectados à UI (ex.: só a lista de dívidas exibe `errors` hoje) — sem impacto funcional, já que a obrigatoriedade real é toda decidida pelo gate central (RG-40), não pelos schemas Zod dos formulários.

## Check final das regras

| Regra | Implementada? | Testada? | Observação |
|---|---|---|---|
| RG-06/RG-07 (múltiplo fixo 4x, EBITDA-base) | Sim | Sim (regras:test) | Sem mudança de comportamento, ratificado |
| RG-09/RG-10 (DCF simplificado) | Sim | Sim (regras:test) | Nome oficial nas telas |
| RG-11/RG-12 (EV × Equity) | Sim | Sim (regras:test) | Conversão via dívida líquida |
| RG-13/RG-14/RG-15 (caixa, dívida, dívida líquida) | Sim | Sim (regras:test) | Novo campo no intake |
| RG-16/RG-17/RG-18 (conversão por método) | Sim | Sim (regras:test) | |
| RG-19 (pesos 50/30/20) | Sim | Sim (regras:test) | Sem mudança |
| RG-20/RG-21 (aplicabilidade) | Sim | Sim (regras:test) | |
| RG-22/RG-23 (sem renormalização) | Sim | Sim (regras:test) | |
| RG-24/RG-25/RG-26 (consolidado condicional, análise parcial) | Sim | Sim (regras:test) | Rota nunca mais retorna 422 por ausência de métodos |
| RG-27 a RG-32 (Prontidão, 4 estados) | Sim | Sim (prontidao:test) | |
| RG-33 (zero informado) | Sim | Sim (prontidao:test + regras:test) | Ver limitação de retroatividade acima |
| RG-34 (limites da validação automática) | Sim | Sim (prontidao:test) | Percentual e texto |
| RG-35 a RG-39 (documentos, categorias) | Sim | Sim (prontidao:test) | |
| RG-40/RG-41 (campos mínimos) | Sim | Sim (regras:test) | |
| RG-42/RG-43 (IA isolada) | Sim | Verificado por leitura de código | Requer chamada real à API para teste ponta a ponta |
| RG-44 (resultado desatualizado) | Sim | Verificado por leitura de código | Requer Supabase para teste ponta a ponta |
| RG-45/RG-47 (versionamento) | Sim | Verificado por leitura de código | `MODEL_VERSION`/`ehResultadoLegado` |
| RG-46 | Sim | Verificado por leitura de código | Não `processos.updated_at` |
| RG-48 (sem histórico completo) | Sim | Sem mudança | Upsert único, já existente |
| RG-49 (dashboard) | Sim | Verificado por leitura de código | `temResultado` substitui `intakeCompleto` na gate |
| RG-50 (PDF) | Sim | Verificado por leitura de código | Avisos visíveis também no impresso |
| RG-51 (arredondamento) | Sim | Sim (prontidao:test) | |
| RG-52/RG-53 (explicabilidade, ordem) | Sim | Verificado por leitura de código | |
| RG-54 (terminologia) | Sim | Verificado por leitura de código | |
| RG-55 (disclaimer) | Sim | Verificado por leitura de código | Texto oficial exato |
| RG-56 (fora de escopo) | Sim | N/A | Nada da lista foi implementado |
