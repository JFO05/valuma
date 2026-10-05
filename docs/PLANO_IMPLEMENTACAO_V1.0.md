# Regra de Negócio v1.0 — Fechamento da Análise de Impacto

Atualiza `docs/ANALISE_IMPACTO_REGRAS_V1.0.md` à luz das decisões 1–32 e das confirmações de terminologia/UX A–E, recebidas na íntegra (o documento anterior estava truncado na seção 8; estas decisões continuam válidas as regras não repetidas nele). Nenhum código foi alterado nesta rodada. Conforme pedido, apresenta só os 4 itens solicitados.

> **Atualização final:** DEC-A (nenhum método aplicável) e DEC-B (categorias documentais) foram resolvidas pela equipe — ver `## Fechamento final` ao fim deste documento. As seções abaixo (1–4) ficam como registro histórico de como a análise evoluiu; a seção final é a que vale para a implementação.

---

## 1. Conflitos reais ainda existentes

**Nenhum.** Os dois pontos que a rodada anterior deixou como "possível conflito" foram fechados pelas confirmações agora recebidas:

- **Ordem visual "IA vs. pendências"** (item E): confirmado explicitamente que o fluxo conceitual "IA → pendências" **não** determina a ordem da tela — a ordem visual oficial (1. Equity Value/valuation, 2. Prontidão, 3. Pendências, 4. Explicabilidade, 5. IA, 6. Próximas etapas profissionais) **já corresponde, nos itens 1–5, exatamente à ordem hoje implementada** em `app/(app)/processos/[processoId]/resultado/page.tsx` (Fase 3). Não há conflito — só falta o item 6, que é uma seção nova (ver Impacto técnico).
- **Tensão entre "consolidado só existe se os 3 forem aplicáveis" (decisão 4) e "resultado final na mesma base de Equity Value" (decisão 6)**: não são regras concorrentes — a decisão 6 define a *base de comparação* (Equity, não Enterprise Value) quando o consolidado existe; a decisão 4 define *quando* ele existe. Compatíveis.

Nenhuma outra divergência entre as decisões 1–32/A–E e o código foi encontrada — o conjunto é internamente consistente.

---

## 2. Decisões de negócio realmente pendentes

Apenas **duas**, ambas específicas e não cobertas por nenhuma das 32 decisões nem pelas confirmações A–E:

### DEC-A — O que fazer quando NENHUM dos três métodos de valuation é aplicável

EBITDA-base ≤ 0 **e** Patrimônio Líquido ≤ 0 no mesmo processo (empresa deficitária e com patrimônio negativo — perfil real e não raro de PME em dificuldade, exatamente o público que mais buscaria uma leitura preliminar antes de negociar). A decisão 5 diz que "os métodos válidos podem ser mostrados separadamente" — mas nesse cenário-limite **não há nenhum método válido para mostrar**. Falta decidir:
- (a) "Gerar Resultado" continua permitido, produzindo uma tela sem nenhuma seção de valuation (só Prontidão, pendências, análise de IA); ou
- (b) os campos mínimos (`lib/valuation/campos-obrigatorios.ts`, hoje exige só EBITDA ≠ 0 e Patrimônio ≠ 0) passam a exigir que **pelo menos um** dos dois seja positivo, bloqueando a geração nesse caso com uma mensagem explicando o motivo.

### DEC-B — Quais são as categorias documentais

As decisões 18–19 definem o **mecanismo** (avaliar por categoria; vários arquivos da mesma categoria contam uma vez), mas não definem **a lista de categorias em si** (quantas são, quais os nomes — ex.: "Contrato social", "Balanço patrimonial", "Certidões negativas"...). Sem essa lista, `lib/prontidao/checklist.ts::itensDocumentais` não pode ser reescrita — é um dado de entrada que só a equipe pode fornecer, não algo dedutível do código ou das regras já dadas.

Nenhuma outra pendência de negócio restou identificada.

---

## 3. Impacto técnico

Organizado por área. Reaproveita o mapeamento de arquivos já feito em `docs/ANALISE_IMPACTO_DECISOES_V1.md` (que continua válido) e acrescenta o que mudou/ficou mais preciso com as decisões 1–32/A–E.

### 3.1 Motor de valuation — `lib/valuation/calcular.ts`

Confirmado sem ambiguidade (decisões 1–9): aplicabilidade por método, sem renormalização, consolidado condicional, conversão EV→Equity via dívida líquida para Múltiplos **e** DCF (decisão 7 resolve explicitamente a simetria que antes era só inferida). Mudança de tipo em `ResultadoCalculoValuation` (nullable em `valuationEbitda`/`valuationDcf`/`valuationFinal`) — já detalhada na análise anterior, mantida.

### 3.2 Guarda de geração — `lib/valuation/campos-obrigatorios.ts` + `app/api/processos/[processoId]/gerar-resultado/route.ts`

A guarda 422 atual (que trata `valuationEbitda`/`valuationDcf` nulos como erro técnico) precisa ser removida — "não aplicável" deixa de ser erro. **Depende da resposta a DEC-A** para saber se uma nova condição de bloqueio (mínimo 1 método aplicável) entra aqui ou não.

### 3.3 Índice de Prontidão — `lib/prontidao/checklist.ts` — maior expansão de escopo desta rodada

A decisão 16 ("um item só conta se passar por validações determinísticas de presença, **formato, domínio e consistência**") é tecnicamente mais exigente do que tudo mapeado até aqui. Hoje, cada um dos 46 itens do checklist é uma checagem simples de presença (`> 0`, `.length > 0`, `!== undefined`). A nova regra pede, além disso:
- **Formato**: ex. CNPJ (`perfilSchema` já tem a regex, mas nunca é executada em runtime — ver achado da auditoria original sobre `zodResolver` nunca acionado), datas de vencimento/fundação em formato válido.
- **Domínio**: ex. UF dentro da lista de estados, porte/nível de dependência dentro dos enums — hoje protegido só porque os campos são `<select>` (o HTML já restringe fisicamente a escolha), não por validação de dado.
- **Consistência**: checagens novas, que não existem hoje em nenhuma forma — ex. receita líquida coerente com receita bruta menos deduções, soma dos percentuais de participação dos sócios ≤ 100%, os 3 anos do DRE serem anos distintos e plausíveis.

**Isto não é uma decisão de negócio em aberto** (a regra já está definida na decisão 16) — é um item de escopo técnico grande, que precisa de um desenho próprio (provavelmente reaproveitando os schemas Zod já existentes para format/domínio, e escrevendo checagens de consistência novas por grupo de campos) antes da implementação. Recomendo tratá-lo como uma sub-etapa própria no plano abaixo, não como um ajuste pontual dentro da tarefa geral do Índice.

### 3.4 Documentos por categoria — `lib/intake/schema-documentos.ts`, `components/intake/documentos-form.tsx`, `components/intake/documento-list-item.tsx`, `lib/prontidao/checklist.ts`

Confirmado sem migration (campo `categoria` no jsonb já existente de `intake_data`, com o mesmo cuidado de compatibilidade já apontado: campo opcional/com fallback para não descartar documentos antigos sem categoria). `itensDocumentais()` passa de "N slots genéricos" para "1 item por categoria esperada, satisfeito se ≥ 1 documento daquela categoria foi enviado" (decisão 19) — **implementável assim que DEC-B for respondida**.

### 3.5 Terminologia e cópia obrigatória (A–D) — `components/resultado/valuation-destaque.tsx`, `valuation-breakdown.tsx`, `como-chegamos.tsx`, `resultado/page.tsx`

Agora com o texto exato definido, sem inferência:
- **A**: rótulo "DCF simplificado" (hoje "Fluxo de Caixa Descontado" em `valuation-breakdown.tsx` e `como-chegamos.tsx`), podendo manter "Fluxo de Caixa Descontado simplificado" como subtítulo explicativo.
- **B**: rótulo principal "Estimativa preliminar de Equity Value" + subtexto "Estimativa preliminar do valor econômico atribuível aos sócios." (hoje `valuation-destaque.tsx` mostra "Estimativa preliminar de valuation" + "Análise preliminar").
- **C**: nova frase obrigatória sobre a premissa do múltiplo 4x, ainda sem lugar próprio na interface — melhor encaixe é dentro de `como-chegamos.tsx`, junto do detalhamento do método de Múltiplos.
- **D**: substituir o disclaimer atual (`resultado/page.tsx`) pelo texto definitivo de 3 frases — propaga automaticamente ao PDF (Fase 5 reusa o mesmo DOM).

### 3.6 Nova seção "Próximas etapas profissionais" (item E, posição 6)

Não existe hoje em nenhuma forma na tela de resultado. Precisa de um componente novo, com conteúdo alinhado às decisões 1/21/D (apontar para validação contábil/financeira e jurídica por profissionais, due diligence). O texto exato dessa seção não foi definido nas decisões recebidas — é copy a escrever durante a implementação, não uma decisão de negócio em aberto (o *conteúdo conceitual* já está definido; falta só redigir).

### 3.7 Demais itens — sem mudança em relação ao já mapeado

Dívida líquida/caixa (decisões 8–9), remoção do score antigo (32), critério de "Ver resultado" (30), resultado desatualizado após alteração do intake (26), versionamento do modelo (28, ainda como decisão técnica de onde persistir — jsonb reestruturado vs. coluna nova via migration aprovada), arredondamento só na apresentação (29), ausência de histórico completo — manter só o mais recente (27, confirma que o `upsert` atual já é o comportamento certo, sem mudança de persistência) — todos exatamente como detalhados em `docs/ANALISE_IMPACTO_DECISOES_V1.md`, sem alteração nesta rodada.

**Achado positivo, sem impacto**: a decisão 31 (PDF representa só o último resultado válido, sem cálculo independente) **já é exatamente como a Fase 5 foi implementada** (`window.print()`, mesmo DOM da tela, sem segunda fonte de dados) — nenhuma mudança necessária aqui.

---

## 4. Plano de implementação (proposto, não executado)

**Etapa 0 — decisões de negócio pendentes.** DEC-A e DEC-B respondidas antes de iniciar (ambas bloqueiam etapas concretas abaixo).

**Etapa 1 — fundação de dados** (sem mudança de comportamento visível):
1. `caixaEquivalentes` em `schema-financeiro.ts` (jsonb existente, sem migration).
2. `categoria` em `schema-documentos.ts`, opcional/com fallback (jsonb existente, sem migration) — implementável mesmo antes de DEC-B, mas a reescrita de `itensDocumentais()` espera a lista de categorias.
3. Migration aprovada: `resultados.valuation_ebitda/valuation_dcf/valuation_final` nullable.
4. Mecanismo de versionamento do modelo (decisão 28) implementado **antes** da etapa 2, para todo resultado novo já nascer marcado.

**Etapa 2 — motor de cálculo:**
5. Dívida líquida + conversão EV→Equity (Múltiplos e DCF) + aplicabilidade + consolidado condicional + não-renormalização, em `lib/valuation/calcular.ts`.
6. Resposta de DEC-A aplicada em `lib/valuation/campos-obrigatorios.ts` (se necessário) e na rota de geração (remoção da guarda 422 antiga).
7. Remoção de `lib/valuation/score.ts` (decisão 32) + ajuste de `scripts/testar-valuation.ts`.

**Etapa 3 — Índice de Prontidão:**
8. Desenho e implementação das validações de formato/domínio/consistência por item (decisão 16) em `lib/prontidao/checklist.ts` — maior esforço técnico desta rodada, tratar como sub-etapa própria com revisão antes de seguir.
9. Ambiguidade do zero (decisão 15) propagada nos schemas/tipos/funções de leitura (`schema-financeiro.ts`, `schema-operacao.ts`, `schema-mercado.ts`, `calcular.ts`, `campos-obrigatorios.ts`, `checklist.ts`).
10. Remoção do arredondamento interno (`Math.round`) em `calcularProntidao` (decisão 29).
11. Reescrita de `itensDocumentais()` por categoria, assim que DEC-B for respondida.

**Etapa 4 — interface do resultado:**
12. Textos obrigatórios A–D (rótulos, premissa do 4x, disclaimer) e nova seção "Próximas etapas profissionais" (item E, posição 6).
13. Estados "não aplicável" por método em `valuation-destaque.tsx`, `valuation-breakdown.tsx`, `como-chegamos.tsx` — incluindo o estado do cenário de DEC-A, se a resposta for "continua permitido gerar".

**Etapa 5 — dashboard e ciclo de vida do resultado:**
14. Critério real de "Ver resultado" (decisão 30) em `app/(app)/dashboard/page.tsx` / `components/dashboard/processos-lista.tsx`.
15. Estado "resultado desatualizado" (decisão 26) — usar `MAX(intake_data.atualizado_em)` como referência, não `processos.updated_at` (evita o falso positivo já identificado, já que essa segunda coluna é tocada pelo mesmo request que gera o resultado).

**Etapa 6 — testes:**
16. `scripts/testar-valuation.ts`: casos de EBITDA ≤ 0, patrimônio ≤ 0, ambos ≤ 0 (conforme resposta de DEC-A), caixa maior que dívida.
17. Novo(s) teste(s) para as validações de formato/domínio/consistência (decisão 16) e para o checklist documental por categoria (assim que DEC-B for respondida).
18. Revisão de `scripts/testar-prontidao.ts` para asserções fracionárias (decisão 29).

---

## Fechamento final

DEC-A e DEC-B foram resolvidas pela equipe na íntegra (nenhum método aplicável → não consolidar, não renormalizar, não inventar alternativa, apresentar "Estimativa preliminar de Equity Value indisponível pelo modelo simplificado" com explicação, continuar gerando análise parcial — Prontidão, pendências, alertas, qualitativa; seis categorias documentais fixas, contagem única por categoria, modelo de validade em 4 estados AUSENTE/INVÁLIDO/VÁLIDO ESTRUTURALMENTE/VÁLIDO COM ALERTA, campos mínimos redefinidos incluindo dívida financeira declarada e caixa informado).

### 1. Existe alguma decisão de negócio ainda não resolvida?

**Não.** Revisando as 32 decisões, as 5 confirmações de terminologia/UX (A–E) e agora DEC-A/DEC-B contra o estado real do repositório, não restou nenhuma pergunta de negócio sem resposta. O que sobra são só **escolhas técnicas de implementação** — normais em qualquer construção de software, não decisões de produto pendentes:

- Onde persistir o versionamento do modelo (jsonb reestruturado vs. coluna nova) — depende só da aprovação padrão de migration já exigida pelas regras do projeto, não de uma nova decisão de negócio.
- Mecanismo exato de "duplicata exata" de documento (hash de conteúdo vs. heurística nome+tamanho) — a regra de negócio ("não contar duplicata") já está definida; só a técnica de detecção fica a critério da implementação.
- Quais categorias documentais exigem "período/exercício" (a própria regra já diz "quando aplicável", delegando esse julgamento pontual à implementação — ex.: DRE/Balanço/posição de endividamento fazem sentido com período; Contrato Social, tipicamente não).
- Nome exato do novo campo que representa "dívida financeira declarada" (`possuiDividasFinanceiras` ou equivalente) e o texto da nova seção "Próximas etapas profissionais" — nomenclatura/copy de implementação, não pendência de negócio.

Nenhum desses itens é reaberto como decisão de negócio — são apontados aqui só para transparência de que existem, e serão resolvidos durante a implementação, não antes dela.

### 2. A Regra de Negócio v1.0 está suficientemente fechada para implementação?

**SIM.**

### 3. Sequência final de implementação por fases

**Fase 1 — Fundação de dados** (sem mudança de comportamento visível; tudo dentro de jsonb já existente, exceto o item de migration explicitamente marcado):
1. `caixaEquivalentes` no schema Financeiro.
2. Novo campo de declaração de dívida financeira (ex.: `possuiDividasFinanceiras: boolean | undefined`) — necessário porque hoje uma lista de dívidas vazia não distingue "sem dívida" de "ainda não preenchido", e o novo gate mínimo exige essa distinção.
3. No schema de Documentos: `categoria` (uma das 6 fixas), `periodoReferencia` (quando aplicável) e um identificador de conteúdo para detecção de duplicata exata (ex.: hash), todos opcionais/com fallback para não descartar documentos já enviados antes desta mudança.
4. **Migration aprovada**: `resultados.valuation_ebitda` / `valuation_dcf` / `valuation_final` nullable.
5. Mecanismo de versionamento explícito do modelo de negócio, implementado **antes** da Fase 2 — todo resultado gerado a partir daqui já nasce marcado, evitando ambiguidade entre Enterprise Value bruto (regime antigo) e Equity Value ajustado (regime novo) na mesma coluna.

**Fase 2 — Motor de valuation** (`lib/valuation/calcular.ts`, `lib/valuation/campos-obrigatorios.ts`, `app/api/processos/[processoId]/gerar-resultado/route.ts`):
6. Dívida líquida, conversão EV→Equity (Múltiplos e DCF), aplicabilidade por método, consolidado condicional, sem renormalização.
7. Estado "nenhum método aplicável" (DEC-A): remover a guarda 422 antiga; novo gate mínimo (razão social, setor, EBITDA informado, Patrimônio Líquido informado, dívida financeira declarada, caixa informado — "informado" ≠ "positivo") permite gerar mesmo nesse cenário, produzindo uma análise parcial.
8. Remoção de `lib/valuation/score.ts` e ajuste de `scripts/testar-valuation.ts`.

**Fase 3 — Índice de Prontidão** (`lib/prontidao/checklist.ts`):
9. Modelo de validade em 4 estados (AUSENTE / INVÁLIDO / VÁLIDO ESTRUTURALMENTE / VÁLIDO COM ALERTA) substituindo o `isValido: boolean` atual — maior refatoração desta fase.
10. Validações de presença/formato/domínio/consistência por item, reaproveitando os schemas Zod já existentes onde possível.
11. Ambiguidade do zero propagada nos schemas e nas funções de leitura.
12. Remoção do arredondamento interno (`Math.round`) — só na apresentação.
13. `itensDocumentais()` reescrito para as 6 categorias fixas (`categorias atendidas / 6 × 100`), com as checagens de disponibilização (upload concluído, formato/tamanho, categoria, período quando aplicável, não vazio, não duplicata).

**Fase 4 — Interface do resultado:**
14. Textos obrigatórios definitivos: "DCF simplificado", "Estimativa preliminar de Equity Value" + subtítulo acessível, premissa do múltiplo 4x, disclaimer final.
15. Estado "Estimativa preliminar de Equity Value indisponível pelo modelo simplificado" com explicação da limitação, com cuidado explícito de copy para não sugerir "empresa sem valor" ou "inviável".
16. Exibição de itens em estado "VÁLIDO COM ALERTA" (distinto de "ausente") nas seções de pendências/prontidão.
17. Seletor de categoria no formulário de Documentos, com feedback de arquivo vazio/duplicata.
18. Nova seção "Próximas etapas profissionais" (posição 6 da ordem oficial).

**Fase 5 — Dashboard e ciclo de vida do resultado:**
19. Critério real de "Ver resultado" (existência do resultado, não `intakeCompleto()`).
20. Estado "resultado desatualizado" após alteração do intake, comparando com `MAX(intake_data.atualizado_em)` — não com `processos.updated_at` (evita o falso positivo já identificado nessa coluna).

**Fase 6 — Testes:**
21. `scripts/testar-valuation.ts`: EBITDA ≤ 0, patrimônio ≤ 0, ambos ≤ 0 (estado "indisponível"), dívida líquida negativa.
22. Novos testes para o modelo de 4 estados de validade e para o checklist documental por categoria.
23. Ajuste de `scripts/testar-prontidao.ts` para notas fracionárias (sem arredondamento interno).

**Nota de dependência:** as Fases 2 e 3 são módulos independentes entre si (motor de valuation vs. Índice de Prontidão) e poderiam ser trabalhadas em paralelo por pessoas diferentes; ambas dependem só da Fase 1 estar concluída.
