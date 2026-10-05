# Análise de Impacto — Regra de Negócio v1.0 (documento oficial de consolidação)

Nenhum código foi alterado nesta rodada. Análise feita confrontando o documento "VALUM&A — CONSOLIDAÇÃO DAS REGRAS DE NEGÓCIO v1.0" (seções 1–8, conforme recebido) com o estado real do repositório e com `docs/AUDITORIA_REGRAS_NEGOCIO.md` / `docs/ANALISE_IMPACTO_DECISOES_V1.md` (rodada anterior, 20 decisões numeradas).

Legenda usada em cada item: **[Regra de negócio]** · **[Decisão técnica]** · **[UX/UI]** · **[Correção de bug]**.

---

## 0. Observação prévia sobre completude do documento recebido

O documento fornecido termina na seção 8 ("Conversão para Equity Value"), com a página final em branco depois do parágrafo — sem seção de fechamento, sumário ou marca de "fim do documento". Comparado com a rodada anterior (20 decisões), este documento **não restabelece explicitamente**:

- as regras de não-aplicabilidade (EBITDA-base ≤ 0 → Múltiplos/DCF não aplicáveis; patrimônio líquido ≤ 0 → Patrimonial não aplicável ao consolidado — decisões 3 e 4 da rodada anterior);
- a proibição de renormalizar pesos (decisão 5);
- a condição de existência do consolidado (só quando os 3 métodos forem aplicáveis — decisão 6);
- a fórmula de conversão para Equity Value do **DCF** (só a de Múltiplos aparece explícita na seção 8: `Equity_Múltiplos = EV_Múltiplos − Dívida Líquida`);
- confirmação do tratamento do método Patrimonial (decisão 11 da rodada anterior);
- Índice de Prontidão, Documentos/categorias, remoção do motor de score antigo, critério de "Ver resultado" no dashboard, versionamento do modelo, arredondamento (decisões 12–20 da rodada anterior).

**Isso não é necessariamente uma inconsistência** — pode simplesmente significar que o documento continua em páginas não incluídas nesta rodada, ou que a v1.0 está sendo formalizada em lotes (este lote cobrindo só posicionamento + valuation por Múltiplos/DCF/dívida líquida). Mas, como a tarefa desta rodada é justamente **verificar se a v1.0 está completa e internamente consistente**, o achado central desta análise é: **conforme recebido, não está** — falta confirmar se as regras da rodada anterior (decisões 3, 4, 5, 6, 11 e 12–20) continuam valendo como estão, foram revisadas, ou serão formalizadas em um documento complementar. Ver seção 4 (decisões de negócio ainda não resolvidas) para o detalhamento.

---

## 1. Seção por seção — confronto com o repositório

### 1. Posicionamento oficial do produto — **[Regra de negócio]**

Define escopo e não-substituição (contador, advogado, auditoria, due diligence, laudo, parecer jurídico). É uma declaração de posicionamento, não uma regra de cálculo — não tem uma "implementação" própria no motor, mas tem implicação direta de cópia na interface.

**Estado atual do repositório:** a landing page (`app/page.tsx`) já descreve o produto em termos compatíveis ("conduz o dono de uma pequena ou média empresa por um intake estruturado e devolve uma estimativa preliminar de valuation, um índice de prontidão para M&A e uma análise..."), mas **não lista explicitamente** os itens de não-substituição (contador/advogado/auditoria/due diligence/laudo/parecer jurídico) em lugar nenhum da interface hoje.

**Impacto — [UX/UI]:** oportunidade (não obrigação técnica) de expandir a cópia da landing page e/ou de uma seção "sobre" para refletir a lista completa de não-substituição. Não é um bug — é a interface ainda não ter alcançado o nível de detalhe que o posicionamento oficial agora exige.

### 2. Fluxo de responsabilidade da solução — **[Regra de negócio]** (fluxo conceitual) / possível **[conflito a esclarecer]**

Ordem descrita: dados → estruturação/validação → Índice de Prontidão + Estimativa preliminar → **IA gera análise qualitativa** → **ValuM&A aponta pendências** → validação profissional → due diligence.

**Confronto com o repositório:** a tela de resultado hoje (`app/(app)/processos/[processoId]/resultado/page.tsx`, ordem implementada na Fase 3) mostra: (1) valuation, (2) Índice de Prontidão, (3) **"O que ainda falta" (pendências)**, (4) "Como chegamos", (5) **Análise de IA**, (6) PDF, (7) disclaimer — ou seja, **pendências aparecem antes da análise de IA na tela**, e o novo fluxo conceitual descreve a ordem inversa (IA antes de "aponta pendências").

**Isso é um conflito de verdade, ou o diagrama é só conceitual (descrevendo capacidades, não a ordem visual da tela)?** Não dá para saber pela redação do documento. Sinalizado como ponto a esclarecer na seção 4, não corrigido nem assumido como bug.

### 3. Natureza preliminar — **[Regra de negócio]**, com texto obrigatório específico

Duas frases textuais agora oficiais:
1. "O ValuM&A não certifica a empresa, não garante a veracidade das informações fornecidas e não atesta regularidade jurídica, contábil ou financeira."
2. "Esta análise é preliminar e foi produzida com base nas informações fornecidas. Os resultados não substituem avaliação contábil, financeira, jurídica ou due diligence profissional."

**Confronto com o repositório — [Correção de bug de texto / desatualização de cópia], não uma regra nova de comportamento:** a regra "deve haver um disclaimer de análise preliminar" já existe e já está implementada (Fase 3) em `app/(app)/processos/[processoId]/resultado/page.tsx`, com o texto: *"Os resultados apresentados constituem uma análise preliminar baseada nas informações fornecidas e não substituem avaliação financeira, contábil ou jurídica especializada."* — **um texto diferente do agora oficializado** (falta menção a "due diligence profissional"; ordem das palavras mudou; falta a frase 1 inteira, que não existe em nenhum lugar da interface hoje). A regra de negócio (ter disclaimer) está cumprida; **o texto exato não bate mais com o documento oficial** — é uma atualização de cópia pendente, não uma nova funcionalidade.

**Arquivo afetado:** `app/(app)/processos/[processoId]/resultado/page.tsx` (linha do disclaimer). Potencialmente também `components/resultado/como-chegamos.tsx`/PDF (mesma string reaproveitada na impressão, Fase 5 — como o PDF reusa o mesmo DOM, atualizar a string na página já propaga para o PDF automaticamente, sem tocar em `baixar-pdf-button.tsx`).

### 4. Valuation — Múltiplo de EBITDA — **[Regra de negócio]**, ratifica o que já existe

`Enterprise Value por Múltiplos = EBITDA-base × 4`. **Já é exatamente `MULTIPLO_EBITDA_PADRAO = 4` em `lib/valuation/calcular.ts`.** Ponto novo e explícito aqui: o documento **rotula oficialmente o resultado deste método como Enterprise Value** — resolvendo formalmente a ambiguidade C que a auditoria original apontou (seção 1: "EV ou Equity Value? — C, não declarado no código").

**Novo requisito de cópia — [UX/UI], decorrente de uma regra de negócio explícita:** *"O sistema deve deixar claro que 4,0x é uma premissa simplificada do modelo acadêmico, não uma referência universal de mercado."* Não existe hoje, em nenhum lugar da interface (`como-chegamos.tsx`, `lib/content/ajuda-campos.ts`), uma frase com esse teor — é um texto novo a adicionar, não uma correção de algo errado.

### 5. DCF simplificado — **[Regra de negócio]**, ratifica o que já existe + **[UX/UI]** nomenclatura obrigatória

Parâmetros idênticos aos já implementados (`HORIZONTE_PROJECAO_ANOS = 5`, `TAXA_CRESCIMENTO_PROJECAO = 0.03`, `TAXA_DESCONTO_PADRAO = 0.15`, sem valor terminal, sem Gordon Growth) — **nenhuma mudança de fórmula**.

**Requisito novo, explícito e verificável no código:** *"O produto e a documentação devem chamá-lo explicitamente de: DCF simplificado."* **Hoje o rótulo usado na interface é "Fluxo de Caixa Descontado"**, não "DCF simplificado" — em `components/resultado/valuation-breakdown.tsx` (`label: "Fluxo de Caixa Descontado"`) e em `components/resultado/como-chegamos.tsx` ("Fluxo de Caixa Descontado" na fórmula e na lista de contribuição por método). **Isto é uma divergência concreta e acionável** entre a regra de negócio (nome oficial obrigatório) e o texto atual da interface — classificação: **[UX/UI] motivado por uma regra de negócio explícita sobre nomenclatura**, não uma decisão técnica.

### 6. Base econômica do valuation — **[Regra de negócio]**, resolve o achado mais grave da auditoria

Fecha formalmente o que a rodada anterior já havia decidido (decisões 7, 10, 11): os 3 métodos devem estar na mesma base (Equity Value) antes de ponderar; "o resultado principal será: Estimativa preliminar de Equity Value".

**Implicação de nomenclatura a confirmar — não assumida como certa:** o rótulo hoje usado na tela de resultado (`components/resultado/valuation-destaque.tsx`) é **"Estimativa preliminar de valuation"**. O documento nomeia o resultado principal como **"Estimativa preliminar de Equity Value"** — presumivelmente o novo rótulo pretendido, mas o documento não instrui explicitamente "renomeie o rótulo da tela", então isto fica como uma **inferência razoável, não uma certeza**, sinalizada para confirmação (seção 4).

**Nenhuma mudança de fórmula além do já mapeado na rodada anterior** (Bloco B de `docs/ANALISE_IMPACTO_DECISOES_V1.md`) — esta seção só formaliza em linguagem oficial o que já havia sido decidido.

### 7. Dívida líquida — **[Regra de negócio]** + **[Decisão técnica]** (onde/como armazenar)

Fórmulas idênticas às da rodada anterior (decisões 8 e 9): `Dívida financeira total = soma das dívidas informadas`; `Dívida Líquida = Dívida financeira total − Caixa e equivalentes de caixa`; dívida líquida negativa **explicitamente permitida** (mais caixa que dívida) — confirma o ponto técnico que eu já havia sinalizado (não é bug, é o comportamento matematicamente esperado).

**Impacto — [Decisão técnica], já mapeado:** novo campo `caixaEquivalentes` em `lib/intake/schema-financeiro.ts::balancoSchema`. Vive dentro do jsonb já existente de `intake_data` — **sem migration** (mesma conclusão da rodada anterior, reconfirmada).

### 8. Conversão para Equity Value — **[Regra de negócio]**, fórmula explícita

`EV_Múltiplos = EBITDA-base × 4` (idêntico à seção 4) → `Equity_Múltiplos = EV_Múltiplos − Dívida Líquida`.

**Nota de completude:** esta seção só escreve a fórmula para Múltiplos. A rodada anterior (decisão 10) dizia "Múltiplos **e DCF** devem ser convertidos..." — presumo, por simetria e pelo que já está registrado, que `Equity_DCF = EV_DCF − Dívida Líquida` segue a mesma regra, mas **o documento como recebido não formaliza isso explicitamente para o DCF** — ver seção 4 (a confirmar, não assumido como decidido).

---

## 2. Impactos consolidados no código (o que este documento confirma/refina em relação à rodada anterior)

Esta seção **não repete** o mapeamento de arquivos já feito em `docs/ANALISE_IMPACTO_DECISOES_V1.md` (Blocos A e B, que continuam válidos). Lista só o que este documento **acrescenta ou refina**:

| Item | Tipo | Arquivo(s) | Natureza da mudança |
|---|---|---|---|
| Nome oficial "DCF simplificado" em vez de "Fluxo de Caixa Descontado" | [UX/UI] | `components/resultado/valuation-breakdown.tsx`, `components/resultado/como-chegamos.tsx` | Troca de string literal |
| Texto do disclaimer atualizado (2 frases oficiais) | [Correção de bug de texto] | `app/(app)/processos/[processoId]/resultado/page.tsx` | Troca de string literal (propaga ao PDF automaticamente) |
| Aviso "4,0x é premissa simplificada, não referência de mercado" | [UX/UI] novo texto | `components/resultado/como-chegamos.tsx` e/ou `lib/content/ajuda-campos.ts` | Cópia nova, não existe hoje |
| Rótulo "Estimativa preliminar de Equity Value" (a confirmar) | [UX/UI] a confirmar | `components/resultado/valuation-destaque.tsx` | Troca de string literal, condicionada à confirmação da seção 4 |
| Rotulagem explícita EV vs. Equity no detalhamento por método | [UX/UI] | `components/resultado/como-chegamos.tsx`, `components/resultado/valuation-breakdown.tsx` | Hoje os 3 métodos são mostrados sem rótulo de base econômica — como a seção 6 torna isso uma distinção oficial (EV antes do ajuste, Equity depois), a tela de "Como chegamos" precisa deixar essa transformação visível, não só o número final |

---

## 3. Conflitos identificados

1. **Possível conflito de ordem de seções na tela de resultado** (seção 2 do documento vs. Fase 3 implementada) — ver item 2 acima. Não corrigido, não assumido como bug — fica registrado como divergência a esclarecer.
2. **Lacuna de continuidade entre este documento e a rodada anterior**: este documento não repete as regras de não-aplicabilidade (decisões 3, 4, 5, 6 da rodada anterior). Se a equipe pretende que elas continuem valendo, não há conflito — só uma sobreposição de documentos que vale consolidar num único lugar antes da implementação, para quem for programar não precisar cruzar dois documentos manualmente. Se a equipe **revisou** essas regras e este documento as substitui silenciosamente, **isso precisa ser dito explicitamente**, porque a seção 6 ("o resultado principal será: Estimativa preliminar de Equity Value", sem qualificar "quando aplicável") pode ser lida como uma regra **mais permissiva** do que a decisão 6 anterior ("consolidado só existe quando os três métodos forem aplicáveis") — as duas leituras não são a mesma regra.
3. **Nenhum conflito interno encontrado dentro das seções 1–8** propriamente ditas — elas são consistentes entre si.

---

## 4. Decisões de negócio ainda não resolvidas (não técnicas)

1. **A ordem "IA → pendências" da seção 2 deve ser refletida na ordem visual da tela de resultado** (hoje é pendências → IA), **ou o diagrama da seção 2 é só conceitual/de processo, sem implicação de layout?** Não é uma pergunta técnica — é sobre o que a equipe quer que o usuário veja primeiro.
2. **O rótulo "Estimativa preliminar de valuation" deve ser renomeado para "Estimativa preliminar de Equity Value"** (seguindo a nomenclatura da seção 6), **ou o termo "valuation" deve continuar sendo o rótulo voltado ao usuário final**, com "Equity Value" ficando só na documentação técnica/interna? É uma escolha de comunicação com o usuário leigo (o público-alvo do MVP), não uma questão técnica.
3. **A conversão para Equity Value do método DCF segue exatamente a mesma fórmula do Múltiplos** (`Equity_DCF = EV_DCF − Dívida Líquida`), **como já indicava a decisão 10 da rodada anterior — isto continua valendo, ou este documento (que só formaliza a fórmula para Múltiplos) pretende tratar o DCF de outra forma?**
4. **As regras de não-aplicabilidade e não-renormalização (decisões 3, 4, 5, 6 da rodada anterior) continuam em vigor tal como decididas, ou serão revisadas/reemitidas junto com o restante da v1.0** (Patrimonial, Índice de Prontidão, Documentos, score antigo, dashboard, versionamento, arredondamento)? Esta é a pergunta mais importante desta rodada para a v1.0 poder ser considerada "completa" — sem uma resposta, a equipe de implementação não tem uma fonte única e definitiva para os casos de EBITDA/patrimônio não-positivo.
5. **A lista de não-substituição da seção 1** (contador/advogado/auditoria/due diligence/laudo/parecer jurídico) **deve aparecer literalmente em algum lugar da interface** (landing page, disclaimer expandido, página "sobre"), **ou é só uma declaração de posicionamento para fins de documentação/banca, sem exigência de exposição literal ao usuário final?**

---

## 5. Plano técnico de implementação (proposto, não executado)

Ordem pensada para minimizar risco de janelas inconsistentes (ex.: evitar gerar resultados em formato ambíguo entre o "antigo" e o "novo" sem um marcador de versão) — **nenhum destes passos foi executado nesta rodada.**

**Etapa 0 — pré-requisito, decisões de negócio da seção 4 deste documento respondidas**, mais confirmação de que as decisões 3–6 e 12–20 da rodada anterior continuam válidas (ou uma nova versão consolidada única, sem depender de dois documentos).

**Etapa 1 — fundação de dados (sem mudar comportamento visível ainda):**
1. `lib/intake/schema-financeiro.ts`: adicionar `caixaEquivalentes` (jsonb existente, sem migration).
2. Migration (com aprovação explícita antes de rodar): tornar `resultados.valuation_ebitda`, `valuation_dcf`, `valuation_final` nullable.
3. Decidir e implementar o mecanismo de versionamento do modelo (decisão 19 da rodada anterior) — **antes** da etapa 2, para que todo resultado gerado a partir daqui já nasça marcado, evitando a janela de ambiguidade entre EV bruto (regime antigo) e Equity ajustado (regime novo) na mesma coluna.

**Etapa 2 — motor de cálculo:**
4. `lib/valuation/calcular.ts`: implementar dívida líquida, conversão EV→Equity para Múltiplos e DCF, aplicabilidade (EBITDA-base ≤ 0, patrimônio ≤ 0), consolidado só com os 3 aplicáveis, sem renormalização.
5. Atualizar `app/api/processos/[processoId]/gerar-resultado/route.ts`: remover a guarda 422 antiga que tratava `valuationEbitda`/`valuationDcf` nulos como erro (deixam de ser erro, passam a ser "não aplicável", um resultado válido).
6. Resolver a decisão de negócio ainda pendente da rodada anterior (o que fazer quando NENHUM dos 3 métodos é aplicável) antes de fechar esta etapa — ela determina se `verificarCamposObrigatorios` precisa de uma nova condição de bloqueio.

**Etapa 3 — interface do resultado:**
7. `components/resultado/valuation-destaque.tsx`, `valuation-breakdown.tsx`, `como-chegamos.tsx`: estados "não aplicável" por método, rótulo "DCF simplificado", rotulagem EV→Equity visível, texto sobre a premissa do múltiplo fixo.
8. Atualizar o texto do disclaimer (seção 3 deste documento) — mudança isolada e de baixo risco, pode inclusive ser feita antes das etapas 1-2 se a equipe quiser um ganho rápido e independente.
9. Resolver a decisão de negócio sobre a ordem "IA vs. pendências" antes de tocar na ordem das seções da tela.

**Etapa 4 — testes:**
10. `scripts/testar-valuation.ts`: novos casos (EBITDA ≤ 0, patrimônio ≤ 0, caixa maior que dívida, os 3 aplicáveis).
11. Revisão de `scripts/testar-prontidao.ts` só se a etapa de arredondamento (decisão 20, rodada anterior) for feita junto.

**Etapas de Índice de Prontidão, Documentos/categorias, remoção do score antigo, dashboard e arredondamento** seguem o plano já detalhado em `docs/ANALISE_IMPACTO_DECISOES_V1.md` (Blocos C e D) — não repetidas aqui porque este documento não trouxe informação nova sobre elas.

---

## 6. Resposta direta às perguntas de verificação da tarefa

- **A Regra de Negócio v1.0, como recebida (seções 1–8), está completa?** Não — cobre posicionamento, natureza preliminar, e o método de valuation (Múltiplos/DCF/dívida líquida/conversão Equity), mas não repete nem supera explicitamente as regras de aplicabilidade, o método Patrimonial, o Índice de Prontidão, Documentos, o motor antigo, o dashboard, o versionamento ou o arredondamento — todos presentes na rodada de decisões anterior.
- **É internamente consistente (dentro do que foi recebido)?** Sim, as seções 1–8 não se contradizem entre si.
- **É consistente com a rodada de decisões anterior?** Parcialmente — não há contradição direta comprovada, mas há uma tensão de leitura na seção 6 ("o resultado principal será... Equity Value", sem qualificar "quando aplicável") frente à decisão 6 anterior ("consolidado só existe quando os três métodos forem aplicáveis"), que precisa ser esclarecida explicitamente antes da implementação (item 4 da seção 4 acima).
