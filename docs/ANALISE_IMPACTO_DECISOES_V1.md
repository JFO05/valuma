# Análise de Impacto — Decisões de Negócio v1 (ValuM&A)

Baseada na auditoria em `docs/AUDITORIA_REGRAS_NEGOCIO.md`. Nenhum código foi alterado nesta análise — só leitura e mapeamento de impacto, para orientar a implementação futura.

As 20 decisões estão numeradas como no pedido original. Agrupo em 4 blocos temáticos porque a maioria depende de mudanças na mesma função (`calcularValuation`).

---

## Bloco A — Método de valuation e aplicabilidade (decisões 1, 2, 3, 4, 5, 6)

**Arquivo central afetado:** `lib/valuation/calcular.ts` (função `calcularValuation` + `calcularDcfSimplificado`).

- **Decisões 1 e 2** (múltiplo fixo 4x; DCF 5 anos/3%/15%/sem terminal) **ratificam o comportamento já implementado hoje** (`MULTIPLO_EBITDA_PADRAO`, `HORIZONTE_PROJECAO_ANOS`, `TAXA_CRESCIMENTO_PROJECAO`, `TAXA_DESCONTO_PADRAO`, todas já com esses valores exatos). **Nenhuma mudança de código necessária** — só remover a linguagem de "premissa simplificada, a rever" dos comentários e tratá-la como regra fechada.
- **Decisão 3** (EBITDA-base ≤ 0 → Múltiplos e DCF não aplicáveis): muda a condição de guarda de `ebitdaBase !== null` (hoje) para `ebitdaBase !== null && ebitdaBase > 0`. Isso significa que **um EBITDA-base negativo, que hoje é calculado normalmente**, passa a produzir `valuationEbitda = null` e `valuationDcf = null` (mesmo tratamento que "ausente" hoje já recebe).
- **Decisão 4** (patrimônio ≤ 0 → Patrimonial não aplicável ao consolidado, mas valor visível): hoje `valuationPatrimonial` é sempre incluído no consolidado. Passa a existir uma distinção entre "o valor informado" (sempre calculado e exposto, mesmo negativo) e "aplicável ao consolidado" (`patrimonioLiquido > 0`). É um **campo derivado**, não precisa ser armazenado separadamente — a aplicabilidade é sempre recomputável a partir do próprio sinal do valor.
- **Decisão 5** (não renormalizar pesos): remove o bloco de código que hoje monta o array `componentes` dinamicamente e recalcula `pesoTotal`. A lógica nova é binária: ou os 3 pesos (50/30/20) se aplicam porque os 3 métodos são aplicáveis, ou não existe consolidado.
- **Decisão 6** (consolidado só existe se os 3 forem aplicáveis): `valuationFinal` deixa de ser "sempre calculável" (como é hoje, mesmo que o tipo já permitisse `null`) para **genuinamente poder ser `null`** com frequência real — não mais um caso teórico nunca exercido.

**Mudança de tipo necessária** — `ResultadoCalculoValuation` (mesmo arquivo):
```ts
interface ResultadoCalculoValuation {
  valuationEbitda: number | null;        // já era nullable, mas agora null também quando negativo
  valuationDcf: number | null;           // idem
  valuationPatrimonial: number;          // continua sempre presente (decisão 4: "valor visível")
  valuationFinal: number | null;         // agora null com frequência real (decisão 6)
  anoBaseUtilizado: number | null;
  ebitdaBaseUtilizado: number | null;
}
```

**Impacto na UI (não pedido para implementar, só mapeado):**
- `components/resultado/valuation-destaque.tsx` (`valor: number`) precisa de um estado para "sem estimativa consolidada disponível".
- `components/resultado/valuation-breakdown.tsx` assume hoje que os 3 valores são sempre `number` (usa `Math.max(...)` e uma barra de progresso para cada) — precisa de um estado visual "não aplicável" por método, sem quebrar ao receber `null`.
- `components/resultado/como-chegamos.tsx` monta a string da fórmula (`{'{'}formatBRL(...) × 0,50 + ...{'}'}`) assumindo os 3 números — precisa de um texto condicional quando algum método não é aplicável (ex.: "Múltiplo de EBITDA não aplicável — EBITDA-base negativo").
- `app/api/processos/[processoId]/gerar-resultado/route.ts`: a guarda defensiva atual (`if (valuation.valuationEbitda === null || valuation.valuationDcf === null) return 422`) **precisa ser removida ou reescrita** — hoje ela bloqueia a geração inteira se EBITDA for `null`; com as novas regras, `null` passa a ser um resultado válido e esperado (método não aplicável), não mais um erro que impede tudo.

---

## Bloco B — Equity Value e dívida líquida (decisões 7, 8, 9, 10, 11)

**Arquivos afetados:** `lib/intake/schema-financeiro.ts` (novo campo), `lib/valuation/calcular.ts` (fórmula), `lib/ai/analisar.ts` (prompt), `components/intake/financeiro-form.tsx` (novo input), `lib/prontidao/checklist.ts` (novo item no checklist, se a equipe quiser que caixa conte para o Índice).

- **Decisão 8** (novo campo Caixa e Equivalentes): adicionar `caixaEquivalentes` a `balancoSchema` em `schema-financeiro.ts`, com valor numérico. **Fica no mesmo jsonb de `financeiro` já existente em `intake_data`** — ver seção de banco abaixo, não exige migration.
- **Decisão 9** (dívida líquida = soma das dívidas − caixa): nova função pura, ex. `calcularDividaLiquida(dados)`, somando `financeiro.dividas[].valor` e subtraindo `caixaEquivalentes`.
- **Decisão 10** (converter Múltiplos/DCF de EV para Equity subtraindo a dívida líquida antes de ponderar): a fórmula em `calcularValuation` passa a ser, para os métodos aplicáveis: `valuationEbitdaEquity = (ebitdaBase × 4) − dividaLiquida`, `valuationDcfEquity = calcularDcfSimplificado(ebitdaBase) − dividaLiquida`. Isso muda o **significado** dos campos `valuationEbitda`/`valuationDcf` de "Enterprise Value bruto" para "já ajustado para Equity Value" — importante para quem for reler resultados antigos (ver compatibilidade abaixo).
- **Decisão 11** (Patrimonial já é proxy de Equity Value): ratifica o comportamento atual — **nenhuma mudança**, só uma afirmação explícita de que esse método não precisa de ajuste.

**Ponto de atenção (não é ambiguidade de negócio, é técnica):** se `dividaLiquida` for negativa (caixa maior que a dívida — situação real e comum em empresas com caixa acumulado), o ajuste EV→Equity **aumenta** o valor em vez de diminuir. Isso é matematicamente correto (dívida líquida negativa = "caixa líquido", que soma valor ao equity), só registrando que não é um bug, é o comportamento esperado da fórmula padrão.

**IA (`lib/ai/analisar.ts`):** `montarSecaoFinanceiro` precisa incluir o novo campo (caixa) no resumo enviado à IA, e `montarSecaoResultadoCalculado` precisa refletir a nova semântica (ex.: mencionar que os valores já são "Equity Value" e citar a dívida líquida usada, para a análise qualitativa não soar inconsistente com os números).

---

## Bloco C — Índice de Prontidão e Documentos (decisões 12, 13, 14, 15)

- **Decisões 12 e 13** (pesos 25%/25%/25%/25%, itens iguais dentro da dimensão, prontidão ≠ qualidade econômica): **já é exatamente o que `lib/prontidao/checklist.ts::calcularProntidao` faz hoje** (`indiceGeral` = média simples das 4 notas; cada nota = validos/esperados×100, sem peso por item). **Nenhuma mudança funcional necessária** — essas decisões fecham/ratificam a modelagem da Fase 2, sem alterar código.

- **Decisão 14** (null/undefined = não informado; zero é resposta válida quando a regra do campo permite): **a mudança de maior alcance de toda a lista**, tecnicamente falando — embora seja uma decisão só sobre semântica de dados, ela invalida a convenção usada hoje em praticamente todo o motor (documentada e aceita repetidamente como limitação: "o valor padrão de um campo nunca tocado é 0"). Passa a exigir:
  - **Schemas** (`lib/intake/schema-financeiro.ts`, `schema-operacao.ts`, `schema-mercado.ts`): trocar o default de `0` para `undefined` em todo campo numérico onde zero é uma resposta real e distinta de "não preenchido" — isto é, praticamente todos os campos do DRE, do balanço, `numeroFuncionariosTotal`, `numeroClientesAtivos`, `concentracaoTop3Clientes` etc. Campos como `dre[].ano` (que não faz sentido ficar "não informado") ficam de fora.
  - **Tipos TypeScript**: `FinanceiroFormValues`, `OperacaoFormValues` etc. passam a ter vários campos `number | undefined` em vez de `number`.
  - **Toda leitura desses campos** em `lib/valuation/calcular.ts`, `lib/valuation/campos-obrigatorios.ts`, `lib/prontidao/checklist.ts` precisa trocar os testes `!== 0` / `> 0` (usados hoje exatamente para contornar essa ambiguidade) por `!== undefined` — isso na prática **remove** a necessidade de todas as funções auxiliares tipo `numeroInformado()` (`checklist.ts`) e `patrimonioLiquidoInformado()` (`campos-obrigatorios.ts`) na forma atual, simplificando essas checagens, mas exigindo tocar em quase toda regra de validação existente.
  - **Formulários**: `MoneyInput` já lida bem com `undefined` (mostra campo vazio) — **sem mudança**. Já os `<input type="number">` simples (`operacao-form.tsx`, `dividas-fieldset.tsx` taxa de juros, `perfil-form.tsx` número de funcionários) usam `register(..., {valueAsNumber: true})`, que converte campo vazio em `NaN`, não em `undefined` — precisa de tratamento explícito (ex.: `setValueAs` customizado) para não gravar `NaN` no jsonb.
  - **`parseXxxData`** (merge com defaults): hoje funciona por `{...defaults, ...dados}` — continua funcionando com defaults `undefined`, mas **precisa ser reconferido campo a campo**, porque um campo salvo explicitamente como `0` no banco (documento antigo) precisa continuar sendo lido como `0` (informado), não confundido com "ausente".

- **Decisão 15** (categorias documentais, sem análise jurídica de conteúdo): ver seção dedicada abaixo (pedido explícito de verificação de JSONB).

---

## Bloco D — Persistência, dashboard e versionamento (decisões 16, 17, 18, 19, 20)

- **Decisão 16** (remover motor antigo de score do código ativo, preservar via Git/documentação): **já não é chamado pela rota ativa** — a remoção é literal: apagar `lib/valuation/score.ts`. Isso quebra a importação em `scripts/testar-valuation.ts` (`import { calcularScore } from "../lib/valuation/score"`), que precisa ser editado para remover essa parte do teste (ou o script inteiro ser revisado, já que hoje mistura teste de `calcularValuation` — que continua válido — com teste de `calcularScore` — que deixa de existir). O `package.json`'s `"valuation:test"` continua apontando para o mesmo arquivo, só o conteúdo interno muda.
- **Decisão 17** ("Ver resultado" depende da existência real do resultado): **acerta exatamente o achado C da auditoria** (seção 11 / DEC-11). Arquivos: `app/(app)/dashboard/page.tsx` (trocar o critério de `intakeCompleto()` para checar `status === "concluido"` — já disponível na mesma query que já busca `processos`, sem nova consulta — ou, mais robusto, verificar a existência de linha em `resultados`) e `components/dashboard/processos-lista.tsx` (o campo `completo: boolean` de `ProcessoResumo` passa a significar "tem resultado", não "intake completo" — o nome do campo deveria mudar para algo como `temResultado` para não confundir os dois conceitos no código).
- **Decisão 18** (intake alterado após geração torna o resultado desatualizado): **funcionalidade nova**, não existe hoje. Precisa de uma comparação de timestamp: `resultados.created_at` (quando o resultado foi gerado) vs. o mais recente `intake_data.atualizado_em` entre as 5 fases do processo. **Ponto técnico de atenção**: comparar contra `processos.updated_at` seria mais simples (já é uma coluna existente), mas essa coluna é atualizada pelo próprio trigger `set_processos_updated_at` **no mesmo request que gera o resultado** (a rota atualiza `processos.status` logo após salvar `resultados`) — usar `processos.updated_at` como referência criaria uma condição de corrida onde o resultado apareceria "desatualizado" imediatamente após ser gerado. A referência correta é o `MAX(intake_data.atualizado_em)` das 5 fases, comparado com `resultados.created_at`. Arquivos afetados: a tela de resultado (nova consulta ou junção), possivelmente um pequeno utilitário novo em `lib/valuation/`.
- **Decisão 19** (versionamento do modelo de negócio, independente do JSON da IA): hoje o único marcador de versão (`versao: "prontidao_v1"`) vive dentro do jsonb `analise_ia` — que é conceitualmente "a saída da IA", não do motor determinístico. Duas rotas possíveis, com implicações diferentes (ver seção de banco abaixo).
- **Decisão 20** (arredondar só na apresentação): `lib/prontidao/checklist.ts::calcularProntidao` hoje faz `Math.round(...)` na nota de **cada dimensão** antes de calcular `indiceGeral` como a média dessas notas já arredondadas — precisa remover esse `Math.round` e manter os números fracionários até a camada de exibição (que já faz `.toFixed(0)` em todo lugar que mostra o índice, então a mudança visual para o usuário final é praticamente nula, mas os números armazenados em `score_financeiro`/`score_operacao`/`score_mercado`/`score_juridico`/`score_total` passam a ter casas decimais).

---

## Arquivos afetados (lista consolidada)

| Arquivo | Motivo |
|---|---|
| `lib/valuation/calcular.ts` | Decisões 3, 4, 5, 6, 7, 9, 10 — reescrita da lógica de aplicabilidade e do ajuste EV→Equity |
| `lib/valuation/types.ts` | `ResultadoValuation`/`AnaliseIA` — campos nullable, remoção do texto de "score antigo" |
| `lib/valuation/score.ts` | Decisão 16 — remover o arquivo |
| `lib/valuation/campos-obrigatorios.ts` | Decisão 14 (troca de `!== 0` por `!== undefined`); revisão da guarda de EBITDA/patrimônio à luz das decisões 3/4 |
| `lib/prontidao/checklist.ts` | Decisão 14 (ambiguidade do zero), decisão 15 (categorias, se afetar o item documental), decisão 20 (remover `Math.round` interno) |
| `lib/intake/schema-financeiro.ts` | Decisão 8 (campo caixa), decisão 14 (defaults `undefined`) |
| `lib/intake/schema-operacao.ts` | Decisão 14 (defaults `undefined`) |
| `lib/intake/schema-mercado.ts` | Decisão 14 (defaults `undefined`, campo `tamMercado` já está correto) |
| `lib/intake/schema-documentos.ts` | Decisão 15 (campo categoria) |
| `lib/ai/analisar.ts` | Decisões 8, 9, 10 (novo campo no prompt, nova semântica Equity Value), decisão 19 (separar versionamento do jsonb da IA) |
| `app/api/processos/[processoId]/gerar-resultado/route.ts` | Decisões 3, 4, 5, 6 (remover guarda 422 antiga), 17 (não é o arquivo do dashboard, mas define `status`), 19 (persistir versão do modelo) |
| `components/intake/financeiro-form.tsx` | Decisão 8 (novo input de caixa) |
| `components/intake/documentos-form.tsx`, `components/intake/documento-list-item.tsx` | Decisão 15 (seletor/exibição de categoria) |
| `components/resultado/valuation-destaque.tsx` | Decisão 6 (estado "sem consolidado") |
| `components/resultado/valuation-breakdown.tsx` | Decisões 3, 4 (estado "não aplicável" por método) |
| `components/resultado/como-chegamos.tsx` | Decisões 3, 4, 6, 10 (fórmula condicional, mostrar dívida líquida) |
| `components/resultado/score-gauge.tsx`, `score-breakdown.tsx` | Decisão 20 (continuam usando `.toFixed(0)`, sem mudança funcional, só confirmação) |
| `app/(app)/processos/[processoId]/resultado/page.tsx` | Decisão 18 (estado "desatualizado") |
| `app/(app)/dashboard/page.tsx`, `components/dashboard/processos-lista.tsx` | Decisão 17 |
| `scripts/testar-valuation.ts` | Decisão 16 (remove uso de `calcularScore`); decisões 3–10 (novos casos de teste) |
| `scripts/testar-prontidao.ts` | Decisão 20 (asserções de igualdade exata podem precisar de tolerância/recalculo) |
| `supabase/schema.sql` | Ver seção de banco abaixo |

---

## Mudanças de schema/tipos

- `FinanceiroFormValues.balanco.caixaEquivalentes: number | undefined` (novo campo — decisão 8).
- Praticamente todo campo numérico de `FinanceiroFormValues`, `OperacaoFormValues`, parte de `MercadoFormValues` passa de `number` para `number | undefined` (decisão 14).
- `DocumentoArquivo` ganha `categoria: string | undefined` ou um enum fechado, dependendo de como a equipe decidir a lista de categorias (decisão 15 — ver ambiguidade abaixo).
- `ResultadoCalculoValuation.valuationEbitda`/`valuationDcf`/`valuationFinal` continuam `number | null`, mas agora **exercidos de verdade** (hoje o `null` é teoricamente possível mas nunca ocorre na prática, conforme achado da auditoria).
- `ResultadoValuation` (o formato persistido/lido de `resultados`) precisa passar de `valuationEbitda: number` / `valuationDcf: number` / `valuationFinal: number` para **`number | null`** — esse é o ponto que se propaga para o banco (próxima seção).
- Novo campo de versionamento do modelo (decisão 19) — shape a definir junto com a decisão de onde ele mora (ver banco).

---

## Mudanças de banco realmente necessárias

1. **`resultados.valuation_ebitda`, `valuation_dcf`, `valuation_final`: precisam se tornar nullable** (`alter table ... alter column ... drop not null`). Isso é uma consequência direta e inevitável das decisões 3/5/6 — não há como representar "método não aplicável" ou "consolidado inexistente" numa coluna `numeric not null` sem recorrer a um valor-sentinela (ex.: gravar `0` para "não aplicável"), o que reintroduziria exatamente o tipo de ambiguidade do zero que a decisão 14 acabou de proibir. **Recomendação: migration simples, sem perda de dado, só relaxando a constraint.**
2. **`resultados.valuation_patrimonial` não precisa mudar** — continua sempre presente (decisão 4: "valor informado continua visível"), a aplicabilidade é derivada do próprio sinal na hora de exibir, não precisa de uma coluna própria.
3. **Caixa e Equivalentes (decisão 8) e categoria de documento (decisão 15) NÃO exigem migration** — ambos vivem dentro de colunas jsonb já existentes (`intake_data.dados`). Detalhado na próxima seção.
4. **Versionamento do modelo (decisão 19)** — duas opções, com trade-offs diferentes:
   - **Opção sem migration**: manter dentro do jsonb `analise_ia`, mas reestruturado para não se misturar com o conteúdo da IA — ex. `analise_ia: { ia: { pontosFortes, riscos, recomendacoes, erro }, modelo: { versao: "v2", geradoEm: ... } }`. Satisfaz "independente do JSON da IA" no sentido estrutural (chaves separadas), mas ainda fisicamente dentro da mesma coluna cujo nome (`analise_ia`) sugere só a IA.
   - **Opção com migration**: nova coluna dedicada, ex. `resultados.versao_modelo text not null default 'v1'`. Mais correta semanticamente e mais fácil de consultar/filtrar no futuro, mas é uma migration de verdade — **precisa da aprovação explícita já exigida pelas regras de trabalho do projeto antes de ser feita**, não é uma decisão que esta análise toma sozinha.

---

## Compatibilidade com processos/resultados antigos

- **Resultados gerados antes desta mudança** (regime atual: sempre EV bruto sem ajuste de dívida, sempre com os 3 métodos "aplicáveis" por definição, sem o campo de versão de modelo, ou com `versao: "prontidao_v1"` só) continuam com `valuation_ebitda`/`valuation_dcf` representando **Enterprise Value**, não Equity Value — um significado diferente do que as novas gerações vão produzir na mesma coluna. **Sem um marcador de versão do modelo (decisão 19), não há como a interface (ou a própria equipe, revisando dados depois) diferenciar um resultado "EV bruto" antigo de um "Equity Value ajustado" novo, ambos com o mesmo formato de coluna.** Isso reforça a importância prática da decisão 19 — ela deixa de ser só um nice-to-have de rastreabilidade e passa a ser **necessária para a correção da leitura de dados históricos**.
- **Documentos enviados antes da decisão 15** não têm campo `categoria` no jsonb armazenado. O parser (`parseDocumentosData`) precisa continuar aceitando esses registros sem quebrar — ver próxima seção.
- **Processos com Índice de Prontidão calculado antes da decisão 20** (notas de dimensão já arredondadas na gravação) continuam com valores inteiros armazenados; não há uma forma de "desarredondar" retroativamente — na prática, resultados antigos ficam com uma precisão menor que os novos, sem impacto funcional (a exibição já arredonda igual nos dois casos).
- **Processos com `intakeCompleto()` hoje `true` mas sem resultado real, ou com resultado real mas `intakeCompleto()` `false`** (o próprio achado da auditoria, seção 11): ao trocar o critério do dashboard (decisão 17), o comportamento visível **muda para alguns processos existentes** — um processo que hoje mostra "Ver resultado" escondido (porque nunca visitou Operação/Mercado/Documentos, apesar de ter um resultado real) passa a mostrar corretamente após a correção. É uma correção, não uma regressão, mas vale comunicar que o comportamento de processos já existentes vai mudar visivelmente.

---

## Testes que precisarão mudar

- `scripts/testar-valuation.ts`: remove a importação/uso de `calcularScore` (decisão 16); precisa de novos casos de exemplo cobrindo EBITDA-base negativo (métodos não aplicáveis), patrimônio líquido negativo (Patrimonial não aplicável ao consolidado), e o caso extremo de ambos não aplicáveis simultaneamente (ver ambiguidade aberta abaixo). Precisa também de um exemplo com caixa e equivalentes preenchido, validando a dívida líquida e o ajuste EV→Equity.
- `scripts/testar-prontidao.ts`: as asserções de igualdade exata (ex.: "Mercado com 3 de 4 itens = 75") continuam válidas onde a fração já é exata, mas **qualquer teste que compare uma nota de dimensão fracionária precisa de ajuste** depois da decisão 20 remover o arredondamento interno — hoje o script não parece ter casos com fração não-exata, mas isso deve ser reconferido ao implementar.
- Novo(s) teste(s) para `verificarCamposObrigatorios` refletindo a decisão 14 (campos `undefined` em vez de `0` como sentinela) e para a nova função de dívida líquida.
- Novo teste para a comparação de "resultado desatualizado" (decisão 18), incluindo o caso de borda descrito acima (não usar `processos.updated_at` como referência).

---

## Riscos de regressão

1. **O maior risco de toda a lista**: a decisão 14 (ambiguidade do zero) toca dezenas de pontos de leitura espalhados por `calcular.ts`, `campos-obrigatorios.ts`, `checklist.ts` e todos os formulários — um esquecimento em qualquer um desses pontos (ex.: uma checagem que continua comparando `=== 0` em vez de `=== undefined`) reintroduz silenciosamente a ambiguidade antiga só naquele ponto, de um jeito difícil de notar em revisão de código.
2. Tornar colunas do banco nullable e mudar o significado de `valuation_ebitda`/`valuation_dcf` (EV → Equity) sem o marcador de versão (decisão 19) implementado **ao mesmo tempo** cria uma janela onde resultados antigos e novos são indistinguíveis mas semanticamente diferentes — recomendação: implementar a decisão 19 **antes ou junto** das decisões 7–10, nunca depois.
3. Remover `lib/valuation/score.ts` (decisão 16) sem antes ajustar `scripts/testar-valuation.ts` quebra o `npm run valuation:test` imediatamente.
4. A tela de resultado (`resultado/page.tsx`, `como-chegamos.tsx`, `valuation-breakdown.tsx`, `valuation-destaque.tsx`) tem hoje várias suposições implícitas de que os 3 valores de valuation são sempre números presentes — o risco de regressão visual/de runtime (ex.: `NaN%` numa barra de progresso, ou `R$ NaN` num texto) é alto se cada componente não for revisado individualmente para os novos estados nulos.
5. A comparação de "resultado desatualizado" (decisão 18) tem uma armadilha de implementação já identificada (uso de `processos.updated_at`) que, se não observada, gera falsos positivos logo após toda geração de resultado.

---

## Verificação pedida: categorização de documentos no JSONB existente

**Sim — confirmado, não exige migration estrutural de banco.**

`intake_data.dados` é `jsonb not null default '{}'::jsonb` (`supabase/schema.sql`), sem nenhum shape fixo em nível de Postgres — o formato é imposto só pela aplicação (`documentoArquivoSchema`, em `lib/intake/schema-documentos.ts`). Adicionar uma nova chave `categoria` a cada objeto de `arquivos[]` é uma mudança inteiramente dentro do jsonb já existente, sem alterar nenhuma coluna, tabela ou policy do Supabase.

**Dois cuidados de compatibilidade, não de banco:**
- O campo `categoria` precisa ser **opcional no schema Zod** (`categoria: z.string().optional()`, ou com um valor-fallback como `"outro"`), porque documentos já enviados antes dessa mudança não têm essa chave no jsonb salvo. Se o campo fosse obrigatório sem default, `documentosSchema.safeParse` falharia para esses registros antigos, e `parseDocumentosData` cairia no fallback `documentosDefaultValues` — **descartando silenciosamente a lista inteira de documentos já enviados** (o mesmo tipo de bug que os outros `parseXxxData` já evitam de propósito, documentado no próprio código).
- O Índice de Prontidão documental (`lib/prontidao/checklist.ts::itensDocumentais`) hoje mede "quantidade de slots preenchidos" — se a equipe quiser que ele passe a medir "quais categorias esperadas foram cobertas" (o ganho real de ter categorias), essa função precisa ser reescrita para iterar sobre uma lista de categorias esperadas em vez de um número de slots. Isso **não é uma mudança de banco**, só de lógica de aplicação — mas depende de uma lista de categorias que a decisão 15 ainda não define (ver próxima seção).

---

## Pontos que permanecem ambíguos (técnicos, não de negócio)

Estes não são decisões de negócio em aberto — são detalhes de implementação que a análise não pôde fechar sozinha porque dependem de escolhas dentro do já decidido, e ficam registrados para não serem esquecidos:

- Exatamente qual referência de timestamp usar para "intake alterado após geração" (decisão 18) — recomendação já dada acima (`MAX(intake_data.atualizado_em)`, não `processos.updated_at`), mas é uma escolha de implementação, não uma nova pergunta à equipe.
- Onde fisicamente gravar o versionamento do modelo (decisão 19) — dentro do jsonb existente vs. nova coluna — é uma escolha técnica que só precisa da aprovação padrão de migration já exigida pelas regras do projeto, não uma nova decisão de negócio.

---

## Ainda existe decisão de NEGÓCIO não resolvida?

**Sim, uma.** As 20 decisões fecham a modelagem financeira e de dados quase por completo, mas deixam uma pergunta de produto sem resposta, que é uma consequência direta de combinar as decisões 3, 4 e 6:

> **O que o sistema deve fazer/mostrar quando NENHUM dos três métodos for aplicável ao mesmo tempo** (EBITDA-base ≤ 0 **e** patrimônio líquido ≤ 0 no mesmo processo) — um cenário real e não raro para uma PME endividada e deficitária, exatamente o perfil que mais precisaria de uma leitura preliminar antes de uma negociação de M&A?

As decisões atuais dizem o que acontece com *cada método* isoladamente (fica "não aplicável", mas visível), mas não dizem se, nesse cenário-limite:
- (a) "Gerar Resultado" deve continuar permitido, produzindo uma tela sem nenhuma "Estimativa preliminar de valuation" (só a análise de IA e o Índice de Prontidão, sem nenhum número de valuation); ou
- (b) o mínimo de campos obrigatórios (`lib/valuation/campos-obrigatorios.ts`, hoje exige só EBITDA ≠ 0 e patrimônio ≠ 0) deve ser reforçado para também exigir que **pelo menos um** dos três métodos seja aplicável (isto é, EBITDA > 0 **ou** patrimônio > 0), bloqueando a geração nesse caso-limite com uma mensagem explicando o motivo.

Essa pergunta não estava entre as 20 decisões e não pode ser respondida por dedução técnica — é uma decisão de produto sobre a experiência do usuário nesse caso-limite, e fica pendente para a equipe.
