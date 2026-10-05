# Auditoria Técnica das Regras de Negócio — ValuM&A (TCC)

Auditoria de estado atual, sem nenhuma alteração de código. Classificação usada em cada resposta:

- **A — Regra documentada**: existe comentário/decisão registrada explicitamente no código ou em `docs/DECISOES_MVP.md`/`docs/PLANO_EVOLUCAO_MVP.md`.
- **B — Comportamento existente no código**: é o que o código faz hoje, mas não há uma "regra de negócio" declarada para isso — é consequência da implementação.
- **C — Comportamento não definido/ambíguo**: o código não trata esse caso explicitamente, ou o tratamento é uma decisão implícita não discutida.
- **D — Decisão que ainda precisa ser tomada pela equipe**: remetido ao Bloco 4, ao final.

---

## 1. Valuation por Múltiplos

**Arquivo:** `lib/valuation/calcular.ts`, função `calcularValuation`.

- **Qual EBITDA é utilizado hoje** — **B.** O EBITDA do **último ano com dados reais no DRE** (`anosDreComDados(dados.financeiro.dre).at(-1)`, em `lib/valuation/types.ts`). "Com dados reais" = receita bruta OU EBITDA diferente de zero; um ano inteiramente zerado é tratado como "não preenchido". Não é média dos anos.
- **Qual múltiplo é utilizado** — **A** (documentado no cabeçalho do arquivo). `MULTIPLO_EBITDA_PADRAO = 4` (4x), constante fixa.
- **Fixo ou depende de alguma informação** — **B.** Fixo. Não varia por setor, porte, região ou qualquer outro campo do intake. O próprio comentário do arquivo já assume isso como simplificação: *"múltiplos de EBITDA variam MUITO por setor, porte, momento de mercado e risco específico do negócio... aqui foi simplificado para um valor único"*.
- **Enterprise Value ou Equity Value** — **C.** O código não rotula/declara isso em nenhum lugar. Multiplicar EBITDA por um múltiplo é, na literatura padrão, uma aproximação de **Enterprise Value** (valor da operação, antes da dívida) — mas o sistema não faz nenhum ajuste depois disso (ver item 13) nem documenta essa interpretação.
- **Ajuste de dívida ou caixa** — **B.** Não existe nenhum ajuste. A dívida informada no intake (`financeiro.dividas`) não é lida em nenhum ponto de `calcular.ts`. Não existe campo de "caixa disponível" no schema atual (`lib/intake/schema-financeiro.ts`).
- **EBITDA = 0** — **B.** Tratado como "ano sem dados" por `anosDreComDados` (um ano com `receitaBruta === 0 && ebitda === 0` é filtrado fora da lista). Se **todos** os 3 anos estiverem zerados, `anoBase` é `null`, `ebitdaBase` é `null`, e `valuationEbitda`/`valuationDcf` ficam `null` — o método é excluído do consolidado (ver item 4). Se **apenas o ano mais recente** tiver EBITDA zero mas receita bruta > 0, esse ano ainda conta como "com dados" (é considerado ano-base) e o cálculo prossegue com `ebitdaBase = 0` — múltiplo de 0 = valuationEbitda = 0 literal, entrando no consolidado com peso cheio (50%). **C** para este sub-caso específico (zero em receita > 0 e ebitda = 0 simultâneos) — não é tratado como "ausente", é um valuationEbitda = 0 de verdade participando da média.
- **EBITDA negativo** — **B/C.** Nenhum tratamento especial. `ebitdaBase * 4` com `ebitdaBase < 0` produz um `valuationEbitda` negativo, que entra normalmente no consolidado com peso 50%. Não há lógica de "método não aplicável" para EBITDA negativo hoje — comportamento não discutido/decidido (**C**, e é exatamente o que a decisão pendente **D1** do plano de evolução, `docs/PLANO_EVOLUCAO_MVP.md`, cobre).
- **EBITDA ausente** (nenhum ano do DRE preenchido) — **A.** `valuationEbitda = null`. Documentado no comentário do arquivo e tratado explicitamente no consolidado (peso renormalizado, ver item 4). Além disso, `lib/valuation/campos-obrigatorios.ts::verificarCamposObrigatorios` **bloqueia** a geração do resultado nesse caso (DEF-01/D2) — na prática, esse `null` nunca chega a ser persistido, porque a rota de geração devolve 422 antes.

## 2. DCF simplificado

**Arquivo:** `lib/valuation/calcular.ts`, função `calcularDcfSimplificado`.

- **Fórmula atual** — **A** (documentada no cabeçalho do arquivo):
  ```
  fluxo = ebitdaBase
  para ano de 1 a 5:
    fluxo = fluxo * (1 + 0.03)
    valorPresente += fluxo / (1 + 0.15) ^ ano
  ```
  Ou seja: soma de 5 fluxos, cada um o EBITDA-base crescido a 3% a.a. composto e descontado a 15% a.a., **sem valor terminal**.
- **Quais anos entram no cálculo** — **B.** Só o `ebitdaBase` (o mesmo EBITDA do ano mais recente usado no método de múltiplos) — os outros dois anos históricos do DRE **não são usados** no DCF (não há projeção baseada em série histórica, é só EBITDA-base composto por uma taxa fixa).
- **Como é calculada a taxa de crescimento** — **B.** Não é calculada — é uma constante fixa, `TAXA_CRESCIMENTO_PROJECAO = 0.03` (3% a.a.), igual para qualquer empresa. Não usa nenhum dado histórico (ex.: CAGR real da receita) para derivá-la.
- **EBITDA histórico zero** — igual ao item 1: se o EBITDA-base (do ano mais recente) for zero, o DCF roda normalmente com `fluxo inicial = 0`, resultando em `valuationDcf = 0`. Os outros dois anos históricos não entram na conta, então seus valores são irrelevantes para esta fórmula (**B**).
- **EBITDA histórico negativo** — mesmo comportamento do item 1: sem tratamento especial, `fluxo` negativo é composto e descontado normalmente, gerando um `valuationDcf` negativo (**B/C**, mesma pendência **D1**).
- **Taxa de desconto usada** — **A.** `TAXA_DESCONTO_PADRAO = 0.15` (15% a.a.), documentada como "proxy simplificado de uma taxa de desconto/WACC para PMEs brasileiras de risco moderado-alto".
- **Fixa, configurável ou calculada** — **B.** Fixa (constante `TAXA_DESCONTO_PADRAO`, não lida de nenhum campo do intake nem de configuração de setor/risco).
- **Valor terminal** — **A/B.** **Não existe.** O comentário do arquivo já reconhece isso: *"NÃO inclui valor terminal/perpetuidade — soma só os 5 fluxos descontados. Isso SUBESTIMA o valor de uma empresa em continuidade; foi uma escolha deliberada"*.
- **Enterprise Value ou Equity Value** — **C**, mesma observação do item 1 (nenhum rótulo declarado; um DCF de fluxo de caixa livre sem ajuste de dívida é convencionalmente uma aproximação de Enterprise Value).
- **Ajuste por dívida ou caixa** — **B.** Nenhum, igual ao método de múltiplos.
- **Campos indispensáveis para o DCF funcionar** — **B.** Só o EBITDA do ano-base (que por sua vez depende de pelo menos 1 ano do DRE ter `receitaBruta > 0` ou `ebitda !== 0`). Não depende de nenhum outro campo do Financeiro, Operação, Mercado ou Documentos.

## 3. Método Patrimonial

**Arquivo:** `lib/valuation/calcular.ts`, linha `valuationPatrimonial = dados.financeiro.balanco.patrimonioLiquido`.

- **Campo que alimenta o método** — **B.** `financeiro.balanco.patrimonioLiquido` (schema em `lib/intake/schema-financeiro.ts::balancoSchema`), um valor único (snapshot), não uma série histórica.
- **É simplesmente o patrimônio líquido** — **A/B.** Sim, literalmente — não há nenhum ajuste (ex.: reavaliação de ativos, ativos intangíveis) sobre o valor informado.
- **Patrimônio líquido = 0** — **B/C.** Entra no consolidado como `0`, com peso 20%, puxando a média para baixo. Não há tratamento de "método não aplicável" para esse caso (mesma pendência **D1**, que trata "EBITDA/patrimônio não positivo").
- **Patrimônio líquido negativo** — **B/C.** Idem: entra normalmente, podendo tornar o `valuationFinal` bem baixo ou negativo. Sem tratamento especial (**D1**).
- **Representa Equity Value** — **C.** Não é declarado no código, mas patrimônio líquido contábil é, conceitualmente, uma aproximação (frequentemente distante do valor de mercado) de Equity Value — o que já evidencia a mistura de bases com os outros dois métodos (ver item 13/Bloco 3).

## 4. Valuation consolidado

**Arquivo:** `lib/valuation/calcular.ts`, função `calcularValuation` (bloco final).

- **Confirmação da fórmula 50/30/20** — **A.** Confirmado: `PESO_VALUATION_EBITDA = 0.5`, `PESO_VALUATION_DCF = 0.3`, `PESO_VALUATION_PATRIMONIAL = 0.2`.
- **Os três valores representam a mesma base econômica** — **C, achado desta auditoria.** Não. Múltiplo de EBITDA e DCF simplificado são, na convenção usual, proxies de Enterprise Value; o Patrimonial é uma proxy de Equity Value. O sistema soma os três diretamente, sem nenhuma conversão. Ver detalhamento no item 13.
- **Mistura de Enterprise Value com Equity Value** — **C**, mesmo achado acima. Sim, na prática — sem nenhum ajuste declarado ou intencional.
- **Dívida informada participa de algum cálculo** — **B.** Não. `financeiro.dividas` não é lido em nenhuma linha de `calcular.ts`. É usado apenas (a) no Índice de Prontidão, como item binário "pelo menos 1 dívida cadastrada" (`lib/prontidao/checklist.ts`), e (b) no antigo `score.ts` (não mais chamado pela rota ativa, ver item 5).
- **Existe caixa disponível como campo? Participa?** — **B.** Não existe nenhum campo "caixa disponível" em `schema-financeiro.ts` (existe `ativoCirculante`, que é um agregado contábil mais amplo, não uma proxy direta de caixa). Não participa de nada.
- **Condições para gerar o consolidado hoje** — **A/B.** Formalizadas em `lib/valuation/campos-obrigatorios.ts::verificarCamposObrigatorios` (chamada tanto na tela quanto na API, `app/api/processos/[processoId]/gerar-resultado/route.ts`): razão social preenchida, setor preenchido, EBITDA do ano mais recente do DRE ≠ 0, patrimônio líquido ≠ 0. Sem essas 4 condições, a rota devolve HTTP 422 antes de calcular qualquer coisa.
- **Se um método falhar ou não for aplicável** — **A/B.** O código **renormaliza os pesos** entre os métodos disponíveis (não zera, não recusa). Trecho relevante: `componentes` só inclui EBITDA/DCF se não forem `null`; `pesoTotal` é a soma dos pesos realmente presentes; a média final divide pela soma dos pesos presentes, não por 1. Patrimonial está **sempre** presente no array `componentes` (empurrado incondicionalmente antes do `if`), então `pesoTotal` nunca é zero na prática — ou seja, **o `valuationFinal` do motor nunca é `null` de fato hoje**, apesar do tipo `ResultadoCalculoValuation.valuationFinal` declarar `number | null` (achado técnico, ver Bloco 2/3). Isso também torna o fallback `resultado.valuationFinal ?? valuation.valuationPatrimonial` em `route.ts` (linha 85) código morto/defensivo — nunca é exercido no fluxo atual.

## 5. Score atual (motor antigo, `lib/valuation/score.ts`)

**Importante:** este motor **não é mais chamado pela rota ativa** (`app/api/processos/[processoId]/gerar-resultado/route.ts` usa `calcularProntidao`, não `calcularScore`, desde a Fase 2 do plano de evolução — decisão registrada em `docs/DECISOES_MVP.md`). Mantido no repositório só como referência/dependência de `scripts/testar-valuation.ts`. Respondido porque foi perguntado explicitamente.

- **Fórmula de Financeiro** (`calcularScoreFinanceiro`) — **A** (documentada no cabeçalho do arquivo): média de 2 critérios — (1) margem EBITDA do ano-base (`ebitda / receitaBruta`), escala linear de 0% a 30% (`MARGEM_EBITDA_REFERENCIA`) → nota 0 a 100, ou nota neutra 50 se não houver ano com dados; (2) alavancagem (`soma das dívidas / patrimônio líquido`), escala linear de 0x a 1.5x (`ALAVANCAGEM_LIMIAR`) invertida (0x = nota 100), com regras especiais para patrimônio ≤ 0.
- **Fórmula de Operação** (`calcularScoreOperacao`) — **A**: média de 2 critérios — (1) concentração dos 3 maiores clientes (`concentracaoTop3Clientes`), 0% → 100, 100% → 0, linear; nota neutra 50 se não houver nenhum sinal de clientes; (2) média do "nível de dependência" de cada fornecedor cadastrado (baixa=100, média=60, alta=20), nota neutra 50 se nenhum fornecedor cadastrado.
- **Fórmula de Mercado** (`calcularScoreMercado`) — **A**: média de 2 critérios — (1) quantidade de concorrentes mapeados, 0 → 0, 5 (`CONCORRENTES_REFERENCIA`) ou mais → 100, linear; (2) tamanho do texto de "posicionamento" (proxy de "clareza", só por volume de caracteres, sem análise de conteúdo), 0 → 0, 120 caracteres (`POSICIONAMENTO_CARACTERES_REFERENCIA`) ou mais → 100, linear.
- **Fórmula de "Jurídico"** (`calcularScoreJuridico`) — **A**: não existe etapa jurídica no intake — usa como proxy a **quantidade** de documentos enviados na etapa Documentos, 0 → 0, 5 (`DOCUMENTOS_ESPERADOS_PADRAO`) ou mais → 100, linear. Não valida quais documentos, só quantidade.
- **Campos que influenciam cada dimensão** — listados nos itens acima, extraídos diretamente da leitura do código de `calcularScoreFinanceiro/Operacao/Mercado/Juridico`.
- **Pesos internos existentes** — **A.** Dentro de cada dimensão, os 2 critérios têm peso igual (média simples). Entre as 4 dimensões, `scoreTotal = média simples das 4` (25% cada) — o próprio comentário do arquivo diz *"não havia outra definição de pesos no momento da implementação"*, ou seja, o peso igual não é uma decisão de negócio deliberada, é o padrão adotado por ausência de uma.
- **Avaliação subjetiva ou valor arbitrário existente** — **A/B**, todos documentados como constantes no topo do arquivo, mas sem justificativa de origem (não citam uma fonte/benchmark setorial): `MARGEM_EBITDA_REFERENCIA = 30%`, `ALAVANCAGEM_LIMIAR = 1.5x`, `CONCORRENTES_REFERENCIA = 5`, `POSICIONAMENTO_CARACTERES_REFERENCIA = 120 caracteres`, `DOCUMENTOS_ESPERADOS_PADRAO = 5`, e a tabela `NOTA_DEPENDENCIA` (baixa=100/média=60/alta=20). Todos são "chutes" razoáveis de MVP, não valores derivados de alguma referência externa citável na banca.

## 6. Novo Índice de Prontidão — campos existentes hoje no intake

**Arquivos:** `lib/prontidao/checklist.ts` (o próprio Índice, já com pesos iguais — ver `docs/DECISOES_MVP.md`, Fase 2), `lib/intake/schema-financeiro.ts`, `schema-operacao.ts`, `schema-mercado.ts`, `schema-documentos.ts` (os schemas Zod que definem tipo/formato).

**Importante sobre "obrigatoriedade atual" — achado transversal desta auditoria (C):** os schemas Zod (`financeiroSchema`, `operacaoSchema`, `mercadoSchema`) declaram campos obrigatórios (`.min(1)`, sem `.optional()`), mas **nenhum formulário de intake efetivamente aciona essa validação** — todos usam `onSubmit={(e) => e.preventDefault()}` (não chamam `handleSubmit` do react-hook-form) e persistem via autosave (`useAutosave`/`watch()`), que salva o estado bruto do formulário direto no jsonb, sem passar pelo `zodResolver`. Isso já está documentado explicitamente em `lib/intake/schema-perfil.ts::parsePerfilData` e replicado nos outros `parseXxxData`: *"NÃO valida contra [x]Schema aqui de propósito... um `safeParse` aqui descartaria TODO o progresso parcial"*. Ou seja: **a obrigatoriedade "de schema" existe só como tipo/inferência TypeScript, não como validação de fato em tempo de preenchimento.** A única obrigatoriedade realmente aplicada hoje é a checklist ad-hoc de `campos-obrigatorios.ts` (DEF-01, 4 campos) e a lista do Índice de Prontidão (`checklist.ts`, 46 itens, mas sem bloquear nada — só informa completude).

### Financeiro (`schema-financeiro.ts`)

| Campo | Tipo | Obrigatório no schema Zod | Validação Zod | Observação |
|---|---|---|---|---|
| `dre[].ano` | number int | sim (2000–2100) | `.int().min(2000).max(2100)` | Lista fixa de 3 anos (`financeiroSchema.dre: z.array(...).length(3)`) — **campo composto/lista de tamanho fixo**. |
| `dre[].receitaBruta` | number | sim | `.min(0)` (não-negativo) | |
| `dre[].deducoes` | number | sim | `.min(0)` | |
| `dre[].receitaLiquida` | number | sim | `.min(0)` | |
| `dre[].custos` | number | sim | `.min(0)` | |
| `dre[].lucroBruto` | number | sim | sem `.min()` (aceita negativo) | |
| `dre[].despesasOperacionais` | number | sim | `.min(0)` | |
| `dre[].ebitda` | number | sim | sem `.min()` (aceita negativo) | Campo mais crítico do motor. |
| `dre[].lucroLiquido` | number | sim | sem `.min()` (aceita negativo) | |
| `balanco.ativoTotal` | number | sim | `.min(0)` | |
| `balanco.ativoCirculante` | number | sim | `.min(0)` | |
| `balanco.passivoTotal` | number | sim | `.min(0)` | |
| `balanco.passivoCirculante` | number | sim | `.min(0)` | |
| `balanco.patrimonioLiquido` | number | sim | sem `.min()` (aceita negativo) | |
| `dividas[]` | array de objeto | não (lista pode ser vazia) | cada item: `credor` (string, min 1), `valor` (≥0), `taxaJurosAnual` (≥0), `vencimento` (string, min 1) | **Campo composto/lista de tamanho variável.** |

**Campos "tecnicamente preenchidos mas potencialmente sem significado" (ambiguidade do zero — C):** todo campo numérico acima cujo default é `0` (ex.: `receitaBruta`, `ebitda`, `patrimonioLiquido`, todos os campos do balanço) — o valor `0` pode significar "usuário nunca tocou o campo" OU "valor real igual a zero" (ex.: uma empresa pré-operacional com receita zero de verdade). O sistema não distingue os dois casos porque não há um campo de "toquei aqui" — documentado repetidamente em `lib/valuation/score.ts`, `campos-obrigatorios.ts` e `lib/prontidao/checklist.ts` como limitação aceita. Único campo numérico **sem** essa ambiguidade no restante do intake: `mercado.tamMercado` (ver abaixo), porque seu default é `undefined`, não `0`.

### Operação (`schema-operacao.ts`)

| Campo | Tipo | Obrigatório no Zod | Observação |
|---|---|---|---|
| `numeroFuncionariosTotal` | number int | sim, `.min(0)` | Ambíguo no zero. |
| `cargosEquipe[]` | array de objeto (`cargo`, `quantidade`) | lista, pode ser vazia | **Composto/lista.** |
| `numeroClientesAtivos` | number int | sim, `.min(0)` | Ambíguo no zero. |
| `concentracaoTop3Clientes` | number | sim, `.min(0).max(100)` | Ambíguo no zero (0% pode ser "não concentrado" real ou "não preenchido"). |
| `clientesPrincipais[]` | array de objeto (`nome`, `percentualReceita`) | lista, pode ser vazia | **Composto/lista.** |
| `fornecedoresPrincipais[]` | array de objeto (`nome`, `tipoInsumo`, `nivelDependencia` enum baixa/média/alta) | lista, pode ser vazia | **Composto/lista.** |
| `processosOperacionais` | string | sim no tipo, mas `z.string()` sem `.min(1)` — **aceita string vazia** | Texto livre; "preenchido" no Índice de Prontidão = não-vazio depois de `trim()`. |

### Mercado (`schema-mercado.ts`)

| Campo | Tipo | Obrigatório no Zod | Observação |
|---|---|---|---|
| `concorrentes[]` | array de objeto (`nome`, `porteEstimado` enum, `diferencialPercebido` string livre) | lista, pode ser vazia | **Composto/lista.** |
| `posicionamento` | string | `z.string()`, aceita vazio | Texto livre. |
| `tamMercado` | number, **opcional de verdade** (`.optional()`, default `undefined`) | não | **Único campo numérico sem ambiguidade do zero** — `0` é um valor real e distinto de "não informado" (`undefined`). |
| `sinergiasPotenciais` | string | `z.string()`, aceita vazio | Texto livre. |

### Documentos (`schema-documentos.ts`)

| Campo | Tipo | Obrigatório no Zod | Observação |
|---|---|---|---|
| `arquivos[]` | array de objeto (`nome`, `path`, `tamanho`, `tipo` (MIME), `enviadoEm`) | lista, pode ser vazia | **Composto/lista.** Sem campo de categoria/tipo de documento (ver item 7). |

## 7. Documentos

**Arquivo:** `lib/intake/schema-documentos.ts`, `supabase/schema.sql` (bucket `documentos-intake`).

- **Tipos de documentos aceitos hoje** — **A/B.** Por MIME type e extensão: PDF, DOC/DOCX, XLS/XLSX, JPG, PNG (`TIPOS_PERMITIDOS`/`EXTENSOES_PERMITIDAS`), até 20 MB por arquivo (`TAMANHO_MAXIMO_BYTES`, espelhado no `file_size_limit` do bucket no Supabase). Validado tanto no cliente (`validarArquivo`, feedback rápido) quanto no servidor (policy do bucket, que é quem realmente barra).
- **Classificação por categoria/tipo ou só quantidade** — **B.** Só quantidade/lista de arquivos. Não existe nenhum campo "tipo de documento" (ex.: "contrato social", "balanço patrimonial") no schema.
- **Dados armazenados por documento** — **B.** `nome`, `path` (Storage), `tamanho` (bytes), `tipo` (MIME), `enviadoEm` (timestamp ISO). Nenhuma outra metadata.
- **Definição atual de quais documentos são esperados** — **B.** Não existe uma lista nomeada de documentos esperados. O único "número esperado" que existe é genérico: 5 slots no Índice de Prontidão (`QUANTIDADE_SLOTS_DOCUMENTOS = 5`, em `lib/prontidao/checklist.ts`), reaproveitando o mesmo número de referência que o antigo `score.ts` já usava (`DOCUMENTOS_ESPERADOS_PADRAO`) — não é uma lista de "quais" documentos, só "quantos".
- **O sistema consegue identificar "faltam 3 de 5 categorias"?** — **B.** Não, tecnicamente não é possível hoje, porque não existe o conceito de categoria no dado armazenado. O que existe é "faltam N de 5 **slots de upload**" (documentos genéricos, não nomeados) — mudar para categorias reais exigiria alterar o schema (`documentoArquivoSchema`, adicionando um campo `tipo_documento` ou equivalente) e, portanto, uma migration em `intake_data` (ou uma tabela dedicada) — decisão de negócio, ver **DEC-10**.

## 8. Geração do resultado

**Arquivos:** `lib/valuation/campos-obrigatorios.ts`, `app/api/processos/[processoId]/gerar-resultado/route.ts`.

- **Validação central antes de "Gerar Resultado"** — **A.** Sim: `verificarCamposObrigatorios(dados)`, chamada tanto na tela (para esconder o botão) quanto na própria rota da API (defesa em profundidade — a rota é alcançável por qualquer request HTTP, não só pelo clique do botão).
- **Campos obrigatórios de fato** (os únicos que realmente bloqueiam a geração) — **A**, exatamente 4: `perfil.razaoSocial` (não vazio), `perfil.setor` (não vazio), `financeiro.dre` → EBITDA do ano mais recente ≠ 0, `financeiro.balanco.patrimonioLiquido` ≠ 0.
- **Gerar com Perfil incompleto** (exceto razão social/setor) — **B.** Sim, é possível — `numeroFuncionarios`, `cnpj`, `dataFundacao`, `cidade`, `uf`, `socios[]` não são checados por `verificarCamposObrigatorios`.
- **Gerar com Financeiro incompleto** (exceto EBITDA do ano-base e patrimônio líquido) — **B.** Sim — os outros 2 anos do DRE inteiros, o resto do balanço (ativo/passivo total e circulante) e as dívidas não são exigidos.
- **Gerar sem Operação / sem Mercado / sem Documentos** — **B.** Sim, plenamente possível — nenhum campo dessas 3 fases entra em `verificarCamposObrigatorios`. Um processo pode ter resultado gerado sem NUNCA ter uma linha em `intake_data` para essas 3 fases.
- **Ausências que causam erro técnico vs. que só reduzem o resultado** — **A/B:**
  - **Causam erro técnico** (HTTP 422, nenhum resultado é calculado nem salvo): faltar razão social, setor, EBITDA do ano-base, ou patrimônio líquido.
  - **Só reduzem/afetam o resultado, sem erro**: qualquer outro campo ausente das 46 do Índice de Prontidão (reduz a nota da dimensão correspondente, sem impedir a geração) — e, no valuation, um DRE incompleto (só o ano-base preenchido) não afeta a fórmula em si (que só usa o ano-base mesmo), só reduz a nota "Financeiro" do Índice de Prontidão.
  - **Achado desta auditoria (C), relacionado ao item 11**: um processo gerado com sucesso usando só os 4 campos mínimos (sem nunca visitar Operação/Mercado/Documentos) tem `intakeCompleto() === false` no dashboard, o que esconde o link "Ver resultado" mesmo já existindo um resultado real salvo — ver **DEC-11**.

## 9. IA

**Arquivo:** `lib/ai/analisar.ts`, chamada em `app/api/processos/[processoId]/gerar-resultado/route.ts`.

- **Dados enviados hoje para a IA** — **A/B.** Um resumo textual estruturado com: Perfil (razão social, setor, porte, fundação, funcionários, localização, sócios), Financeiro (DRE dos anos com dados, balanço patrimonial completo, dívidas), Operação (funcionários, cargos, clientes ativos, concentração, clientes principais, fornecedores, processos), Mercado (concorrentes, posicionamento, TAM, sinergias), e uma seção final "Resultado já calculado" com os números de valuation e Índice de Prontidão. Documentos **não** são enviados à IA (nem metadados nem conteúdo).
- **Formato exato do prompt** — **A.** Montado em `montarPrompt`/`montarSecaoPerfil`/`montarSecaoFinanceiro`/`montarSecaoOperacao`/`montarSecaoMercado`/`montarSecaoResultadoCalculado` — texto em português, markdown simples (`##` por seção), sem JSON. A resposta esperada da IA, por sua vez, é validada por Structured Outputs (`zodOutputFormat(analiseIaSchema)`), não por instrução textual de "responda em JSON".
- **A IA recebe valuation e Índice de Prontidão já calculados** — **A.** Sim, explicitamente, na seção "Resultado já calculado (contexto de leitura — não recalcule)" do prompt, com uma regra equivalente reforçada no `SYSTEM_PROMPT` ("NUNCA recalcule, conteste ou proponha um valor numérico diferente").
- **A resposta da IA pode alterar números?** — **A/B, estruturalmente não.** `analisarComIA` é chamada **depois** de `calcularValuation`/`calcularProntidao` já terem rodado (`route.ts`, ordem das linhas 59–78); o retorno da IA só popula o campo `analiseIA` (tipado como `{pontosFortes: string[], riscos: string[], recomendacoes: string[]}` — sem nenhum campo numérico possível pelo próprio schema Zod usado no Structured Output). Não há nenhum caminho de código onde a resposta da IA reatribua `valuationFinal`, `scoreTotal` ou qualquer outro campo numérico de `ResultadoValuation`.
- **Tratamento de erro / API indisponível** — **A.** `try/catch` em `analisarComIA` distinguindo `AuthenticationError`, `RateLimitError`, `APIError` genérico e erro inesperado — todos caem no mesmo `FALLBACK_ANALISE_IA` (`{pontosFortes: [], riscos: [], recomendacoes: [], erro: true}`). A geração do valuation/Índice **não é bloqueada** por uma falha da IA — o resultado é salvo normalmente, só a seção de análise qualitativa fica em estado de erro (com botão "Tentar novamente" na interface, que só re-chama a mesma rota).
- **Onde alterar para deixar "cálculo determinístico" e "análise qualitativa" ainda mais claramente separados** — **B**, já é uma separação estrutural (não apenas por convenção) hoje: a IA recebe os números como parâmetro somente-leitura (`ResultadoNumericoParaContexto`) depois de já calculados, e seu tipo de retorno não tem campos numéricos. Se a equipe quiser reforçar ainda mais (não é necessário para a separação já existir), os pontos de extensão seriam: (a) o `SYSTEM_PROMPT` em `lib/ai/analisar.ts`, (b) o schema `analiseIaSchema` (garantir que nunca ganhe um campo numérico no futuro), e (c) a linha 78/84–94 de `route.ts`, onde os dois resultados (`valuation`/`prontidao` vs. `analiseIA`) são explicitamente montados em objetos separados antes do upsert.

## 10. Persistência do resultado

**Arquivos:** `supabase/schema.sql` (tabela `resultados`), `lib/valuation/resultados.ts`, `app/api/processos/[processoId]/gerar-resultado/route.ts`.

- **Valuation é persistido ou recalculado?** — **A/B.** Persistido. `public.resultados.valuation_final/valuation_ebitda/valuation_dcf/valuation_patrimonial`, colunas `numeric not null`. A tela de resultado (`app/(app)/processos/[processoId]/resultado/page.tsx`) lê essas colunas via `mapRowParaResultadoValuation` — não recalcula o valuation ao reabrir a tela. Recalcula só quando o usuário clica em "Gerar Resultado"/"Recalcular Resultado" de novo (mesma rota POST).
- **Score/Índice é persistido?** — **A/B.** Sim, nas colunas `score_total/score_financeiro/score_operacao/score_mercado/score_juridico` — **reaproveitadas** (Fase 2, decisão D3 documentada em `docs/DECISOES_MVP.md`) para guardar o Índice de Prontidão em vez do score antigo. Os nomes das colunas no banco não mudaram; só o significado.
- **Análise da IA é persistida?** — **A/B.** Sim, coluna `analise_ia jsonb`.
- **Se o Score virar Índice de Prontidão, quais dados antigos são afetados?** — **A**, já resolvido/registrado como decisão D3 (Fase 2): resultados gerados **antes** dessa mudança têm as mesmas colunas `score_*` preenchidas com o significado antigo (nota de qualidade 0–100 por dimensão, algoritmo de `score.ts`), sem nenhum marcador que os diferencie automaticamente das colunas, exceto o campo `versao` dentro do jsonb `analise_ia` (ver próximo ponto). Processos com resultado gerado antes da Fase 2 e nunca recalculados depois continuam mostrando, na interface atual (que já foi trocada para os rótulos/textos do Índice de Prontidão), números que na verdade vêm da fórmula antiga — a interface não sabe diferenciar visualmente os dois casos além do que o campo `versao` permite (ver abaixo).
- **Existe versionamento do resultado?** — **B.** Só um marcador simples: `analise_ia.versao === "prontidao_v1"` (campo opcional dentro do jsonb, ver `lib/valuation/types.ts::AnaliseIA`) indica "este resultado foi gerado depois da Fase 2". Não é um histórico de versões — cada "Gerar Resultado" é um `upsert` que **substitui** o resultado anterior (`resultados_processo_id_key unique`), não mantém um log/histórico.
- **É possível diferenciar um resultado antigo de um novo?** — **B.** Só programaticamente, checando se `analise_ia.versao === "prontidao_v1"` está ausente (resultado antigo) ou presente (resultado novo). **Não há nenhuma indicação disso na interface hoje** — a tela de resultado não exibe nem checa esse campo para avisar o usuário "este resultado foi calculado com uma versão anterior do Índice, recalcule para atualizar" (achado desta auditoria, C).

## 11. Processo / intake

**Arquivos:** `supabase/schema.sql` (coluna `processos.status`), `app/(app)/dashboard/page.tsx`, `components/dashboard/processos-lista.tsx`, `app/(app)/dashboard/actions.ts`, `components/status-badge.tsx`.

- **Existe status de processo?** — **A.** Sim, coluna `processos.status text not null default 'em_andamento'`, comentada no schema como `'em_andamento | concluido | arquivado'`.
- **Existe conceito de rascunho/completo/resultado gerado?** — **B, com uma inconsistência real (achado desta auditoria).** Existem **dois conceitos paralelos, não sincronizados entre si**:
  1. `processos.status` (`em_andamento`/`concluido`/`arquivado`) — atualizado para `"concluido"` **só** quando uma geração de resultado tem sucesso (`route.ts`, linha 130, "melhor esforço", não bloqueia a resposta se falhar). É o que alimenta o `StatusBadge` ("Resultado gerado" vs. "Em andamento" vs. "Arquivado").
  2. `intakeCompleto()` (`app/(app)/dashboard/page.tsx`) — **calculado no dashboard, sem relação com `status` ou com a existência de um resultado** — verifica se existe **alguma linha** em `intake_data` para **cada uma das 5 fases** (`FASES_INTAKE.every(...)`), mesmo que essa linha seja um jsonb vazio ou incompleto.
- **Como o dashboard sabe se "Ver resultado" deve estar disponível?** — **B, achado desta auditoria (C na prática).** Usa `intakeCompleto()` (conceito 2 acima), **não** `status === "concluido"` nem uma consulta a `public.resultados`. Isso significa que um processo pode ter um resultado de verdade gerado e salvo (bastam os 4 campos mínimos do DEF-01 — perfil e financeiro apenas) sem nunca ter uma linha de Operação/Mercado/Documentos em `intake_data`; nesse caso `intakeCompleto()` retorna `false`, e o link "Ver resultado" **fica escondido** mesmo existindo um resultado real. O mesmo booleano (`processo.completo`) também decide o destino do clique no card inteiro (`components/dashboard/processos-lista.tsx`) — nesse cenário, clicar no card manda o usuário para "continuar preenchimento" em vez de "ver resultado". Ver **DEC-11**.
- **O que acontece tecnicamente ao excluir um processo?** — **A/B**, documentado em `app/(app)/dashboard/actions.ts::excluirProcesso`: (1) lista e remove os arquivos do bucket `documentos-intake` associados ao `processoId` — **antes** de apagar a linha de `processos`, porque a policy de exclusão do Storage confirma o dono via `exists (select ... from processos where id = ... and user_id = auth.uid())`, que deixaria de autorizar a remoção se o processo já não existisse; (2) apaga a linha de `processos`.
- **Há cascade de dados/documentos/resultados?** — **A.** Sim para as tabelas Postgres: `partners`, `intake_data` e `resultados` têm `on delete cascade` para `processos` (`supabase/schema.sql`) — apagar a linha de `processos` já limpa essas três automaticamente. **Não** para o Storage (não é uma tabela com FK) — por isso a remoção explícita dos arquivos precisa acontecer antes, em código de aplicação (ver ponto anterior).

## 12. PDF

**Arquivos:** `components/resultado/baixar-pdf-button.tsx`, `components/resultado/como-chegamos.tsx`, `components/theme-impressao-clara.tsx`, `app/globals.css`.

Esta seção já tem uma decisão tomada e implementada (Fase 5 do plano de evolução, decisão **D4**, registrada em `docs/DECISOES_MVP.md`) — respondida abaixo como estado atual, não como pergunta em aberto.

- **Maneira mais simples de gerar um PDF com a arquitetura existente** — **A.** Página de impressão: o botão "Baixar relatório em PDF" só chama `window.print()` (`baixar-pdf-button.tsx`), reaproveitando a própria árvore de componentes já renderizada da tela de resultado, com CSS `@media print` (`globals.css`) controlando o que aparece/some (`print:hidden` nos elementos de navegação/ação). O "PDF" é o que o navegador do usuário gera ao escolher salvar como PDF no diálogo de impressão — sem nenhuma biblioteca de geração de PDF.
- **Reutiliza exatamente os dados da tela?** — **A.** Sim, por construção: não existe rota, cálculo ou busca de dados separada para o PDF — é literalmente o mesmo DOM.
- **Necessidade de alterar banco/schema?** — **A.** Não, nenhuma.
- **Opção com menos dependências e risco** — **A.** Já é a escolhida (impressão do navegador). O trade-off aceito: sem controle fino de quebra de página entre seções (documentado como limitação aceita), e só testado no motor Chromium.

## 13. Consistência financeira (revisão, sem correção)

- **Mistura de Enterprise Value e Equity Value** — **Confirmado.** Múltiplo de EBITDA e DCF simplificado (convencionalmente Enterprise Value) são somados diretamente com o Patrimonial (Equity Value) em `calcularValuation`, sem nenhum ajuste de dívida líquida. Nenhum dos três métodos, nem o consolidado, declara ou trata essa distinção.
- **Dívida coletada mas não utilizada** — **Confirmado.** `financeiro.dividas` é coletada no intake, exibida na interface, e conta como 1 item binário no Índice de Prontidão (`lib/prontidao/checklist.ts`) — mas não entra em nenhuma fórmula de valuation (`calcular.ts` nunca lê esse campo).
- **Crescimento calculado sobre números negativos** — **Confirmado, e composto.** Se `ebitdaBase` for negativo, `calcularDcfSimplificado` multiplica esse valor negativo por `(1.03)^n` (crescendo o valor absoluto de um número negativo, tornando-o "mais negativo" a cada ano) e desconta a 15% a.a. — o resultado é sempre mais negativo quanto maior o horizonte, o oposto do que "crescimento" deveria significar semanticamente para uma empresa deficitária.
- **Valores ausentes convertidos silenciosamente para zero** — **Confirmado, e generalizado.** Todo campo numérico do intake cujo default é `0` (a maioria) carrega essa ambiguidade — documentada repetidas vezes no próprio código (`score.ts`, `campos-obrigatorios.ts`, `checklist.ts`) como limitação aceita, não como bug desconhecido. Exceção conhecida: `mercado.tamMercado`, que usa `undefined` como default.
- **Pesos aplicados a métodos não aplicáveis** — **Parcialmente mitigado, não eliminado.** Quando EBITDA/DCF são `null` (nenhum ano de DRE com dados), o consolidado renormaliza os pesos corretamente (item 4). Mas quando EBITDA é tecnicamente presente e **negativo** (não `null`), ele participa do consolidado com peso cheio (50%) mesmo sendo, na prática, um método sem sentido econômico nesse cenário (múltiplo de EBITDA negativo) — o mecanismo de "método não aplicável" só existe hoje para ausência de dado, não para negatividade (**D1**, ainda pendente desde a Fase 0 do plano de evolução).
- **Arredondamentos** — **Achado desta auditoria.** `lib/prontidao/checklist.ts::calcularProntidao` arredonda cada nota de dimensão individualmente (`Math.round(...)`) antes de calcular `indiceGeral` como a média dessas notas já arredondadas — mas o próprio `indiceGeral` **não é arredondado** antes de ser persistido em `score_total` (coluna `numeric`, aceita qualquer casa decimal). A interface exibe `indiceGeral.toFixed(0)` só na hora de mostrar, então o número exibido é sempre um inteiro, mas o valor armazenado no banco pode ter casas decimais (ex.: `61.5`) — pequena inconsistência entre "o que é salvo" e "o que é mostrado", sem impacto funcional hoje porque nada mais lê `score_total` bruto para exibir sem re-arredondar.
- **Outras premissas implícitas identificadas:**
  - O ano-base do DRE é sempre o **índice 0** do array (mais recente por convenção de preenchimento, não por comparação real do campo `ano`) em pelo menos um ponto do sistema: o link de pendência do DEF-01 para EBITDA aponta sempre para `financeiro.dre.0.ebitda` — se o usuário reordenar os anos no formulário (o campo "Ano" é livre), esse link pode não apontar de fato para o ano mais recente. Limitação já registrada em `docs/DECISOES_MVP.md` (Fase 1).
  - O balanço patrimonial é um **snapshot único**, não versionado por ano (diferente do DRE, que tem 3 anos) — o método patrimonial sempre usa esse único valor como "mais recente", sem forma de conferir a qual ano ele de fato se refere.
  - A concentração de clientes (`concentracaoTop3Clientes`) e outros percentuais são campos digitados livremente pelo usuário — não há checagem cruzada (ex.: comparar com `numeroClientesAtivos` ou com a soma de `clientesPrincipais[].percentualReceita`) para consistência interna dos dados informados.

---

## Bloco 1 — O que o sistema realmente faz hoje

Um processo de M&A é conduzido por um intake em 5 etapas (Perfil, Financeiro, Operação, Mercado, Documentos), salvo em `intake_data` (jsonb por fase, autosave, sem validação de schema efetivamente aplicada). Ao clicar em "Gerar Resultado", uma checklist mínima de 4 campos (razão social, setor, EBITDA do ano mais recente, patrimônio líquido) é conferida; se passar, três métodos de valuation são calculados a partir de um único EBITDA-base e do patrimônio líquido — múltiplo fixo de 4x, DCF simplificado sem valor terminal a taxas fixas (crescimento 3%, desconto 15%), e o patrimônio líquido em si — combinados numa média ponderada fixa (50/30/20), sem qualquer ajuste de dívida, caixa, ou conversão entre Enterprise/Equity Value. Em paralelo, um Índice de Prontidão (0–100% por dimensão: Financeiro, Operacional, Mercado, Documental, 46 itens binários de "preenchido/não preenchido", pesos iguais) mede a completude do intake — não a qualidade do negócio. Uma IA recebe os dados do intake e os números já calculados como contexto de leitura, e devolve pontos fortes/riscos/recomendações em texto, sem poder alterar nenhum número (isolamento estrutural, não só por instrução). Tudo é persistido em `resultados` (upsert, sem histórico) e pode ser reaberto ou reimpresso como PDF via `window.print()`, reaproveitando a mesma tela sem recálculo. O dashboard mostra o status real do processo via uma coluna própria, mas decide se libera "Ver resultado" por um critério diferente (completude do intake, não existência de resultado) — os dois podem divergir.

## Bloco 2 — Pontos tecnicamente coerentes que podemos preservar

- A separação entre motor de cálculo puro (`lib/valuation/calcular.ts`, `lib/prontidao/checklist.ts` — sem I/O, testável isoladamente) e a camada que busca dados (`lib/valuation/consolidar.ts`) é limpa e vale manter.
- O isolamento estrutural entre "cálculo determinístico" e "análise de IA" (route.ts calcula tudo antes de chamar a IA; o tipo de retorno da IA não tem campos numéricos) é uma garantia real, não apenas uma convenção de prompt — ponto forte para defender na banca.
- O bloqueio de geração via `verificarCamposObrigatorios`, checado tanto na tela quanto na API (defesa em profundidade), é uma prática correta.
- A reutilização de colunas existentes (`score_*`) para o Índice de Prontidão, com um marcador de versão (`versao` no jsonb) em vez de uma migration, foi uma solução pragmática e documentada para o MVP.
- O PDF via impressão do navegador, sem biblioteca nova e sem segunda fonte de dados, elimina por construção o risco de "PDF diferente da tela".
- A cascata de exclusão (`on delete cascade` no Postgres + remoção explícita do Storage, na ordem certa por causa da RLS) está correta e testada.

## Bloco 3 — Regras ambíguas ou conceitualmente frágeis

1. **Mistura de Enterprise Value e Equity Value** no consolidado, sem ajuste de dívida/caixa — a fragilidade conceitual mais séria encontrada (ver item 13, DEC-05).
2. **EBITDA e patrimônio líquido negativos** entram nos cálculos sem tratamento especial, podendo gerar valuations negativos ou "crescimento" que na verdade aprofunda um número negativo (item 1/2/3, DEC-03/DEC-04 — é a decisão **D1** já pendente desde a Fase 0 do plano de evolução).
3. **Dívida coletada e nunca usada** em nenhum cálculo (DEC-06).
4. **"Ver resultado" no dashboard não usa a existência real de um resultado**, e sim a completude do intake — os dois podem divergir (item 11, DEC-11).
5. **Ambiguidade generalizada do valor zero** em quase todo campo numérico do intake — aceita e documentada em vários lugares do código, mas nunca resolvida na raiz (nenhum campo "toquei aqui").
6. **Documentos sem categorização** — o Índice de Prontidão Documental mede quantidade, não "quais documentos" (item 7, DEC-10).
7. **Sem indicação na interface de qual "versão" de regra gerou um resultado antigo** (campo `versao` existe no banco, mas não é lido/exibido em lugar nenhum da tela) — item 10.
8. **Validação de obrigatoriedade dos schemas Zod nunca é efetivamente aplicada** nos formulários (nenhum aciona `handleSubmit`/`zodResolver`) — a "obrigatoriedade" real do sistema hoje vive inteiramente em `campos-obrigatorios.ts` (4 campos) e no Índice de Prontidão (informativo, não bloqueante), não nos schemas declarados — item 6.
9. **`valuationFinal` do motor nunca é `null` na prática** apesar do tipo permitir — o fallback em `route.ts` é código morto (item 4).
10. **Arredondamento do Índice Geral persistido em casas decimais**, exibido sempre como inteiro (item 13).

## Bloco 4 — Decisões de negócio que a equipe precisa tomar hoje

**DEC-01 — O múltiplo de EBITDA deve continuar fixo (4x) para qualquer empresa, ou ser parametrizado por setor/porte?**
Opção A: manter fixo — simples, mas ignora diferenças reais de risco/setor entre empresas.
Opção B: parametrizar por setor/porte — mais realista, mas exige definir uma tabela de referência de múltiplos (dado novo a coletar/decidir) e aumenta a complexidade do motor.
Consequência de cada opção: A mantém o MVP simples, mas é uma limitação fácil de questionar na banca (resposta pronta: "simplificação deliberada de escopo"); B fortalece a defesa técnica, mas exige mais tempo de implementação e uma fonte de dados de múltiplos setoriais.

**DEC-02 — O DCF simplificado (sem valor terminal, com EBITDA bruto como proxy de fluxo de caixa) deve continuar assim, ou ganhar um valor terminal (Gordon Growth)?**
Opção A: manter como está — sem perpetuidade, simples, já documentado como premissa deliberada; subestima empresas em continuidade.
Opção B: adicionar valor terminal — mais correto financeiramente, mas exige definir uma taxa de crescimento perpétuo (menor que a taxa de desconto) e mais uma constante a justificar.
Consequência de cada opção: A é rápido, mas o número final tende a ser mais conservador que o "correto"; B fortalece a defesa técnica, mas é mais trabalho e mais uma decisão de negócio (a taxa de perpetuidade).

**DEC-03 — Métodos baseados em EBITDA (Múltiplo, DCF) devem tratar EBITDA-base negativo como "método não aplicável", ou continuar calculando literalmente (podendo gerar valuation negativo)?**
Opção A: manter o cálculo literal — zero esforço, mas produz números difíceis de interpretar para empresas deficitárias (comuns em PME).
Opção B: tratar EBITDA-base ≤ 0 como "não aplicável", excluindo o método do consolidado e renormalizando os pesos entre os métodos restantes (o mecanismo de renormalização já existe no código para o caso de ausência total de dados — bastaria estender a condição).
Consequência de cada opção: A não exige nenhuma mudança, mas é a fragilidade mais visível do motor; B é mais correto e tecnicamente barato de implementar (a lógica de renormalização já existe), mas muda o resultado apresentado para todo processo com EBITDA negativo. **Esta decisão corresponde à decisão D1, já pendente desde a Fase 0 do plano de evolução do MVP.**

**DEC-04 — O método Patrimonial deve continuar aceitando patrimônio líquido negativo/zero literalmente, ou também ser tratado como "não aplicável" nesses casos?**
Opção A: manter — reflete a realidade contábil informada, mesmo que gere valuation final baixo/negativo.
Opção B: excluir do consolidado quando ≤ 0, renormalizando entre EBITDA/DCF.
Consequência de cada opção: A é tecnicamente honesto sobre a fragilidade patrimonial real; B evita um "valuation negativo" confuso de apresentar, mas some com essa informação do número final. **Também parte da decisão D1.**

**DEC-05 — Os três métodos devem continuar sendo somados diretamente (ignorando que Múltiplo/DCF aproximam Enterprise Value e o Patrimonial aproxima Equity Value), ou o motor deve fazer um ajuste de dívida líquida antes de consolidar?**
Opção A: manter como está — simples, mas é a inconsistência conceitual mais séria encontrada nesta auditoria, e uma pergunta plausível de banca.
Opção B: padronizar numa base só (ex.: subtrair dívida líquida de Múltiplo/DCF antes de ponderar) — tecnicamente correto, mas "dívida líquida" exige uma noção de caixa disponível, que não existe como campo hoje (o mais próximo é `ativoCirculante`, que não é a mesma coisa).
Consequência de cada opção: A não exige nenhuma mudança; B corrige a fragilidade mais séria, mas exige decidir como aproximar "caixa disponível" sem um campo dedicado — uma nova pergunta de produto, não só técnica.

**DEC-06 — A dívida informada no intake deve continuar sem uso em nenhum cálculo de valuation, ou passar a ser usada (ligada a DEC-05, ou reativando algo como o score de endividamento do motor antigo)?**
Opção A: manter só informativa/documental (conta apenas para o Índice de Prontidão).
Opção B: usar no ajuste de Equity Value (DEC-05) e/ou reintroduzir uma leitura de endividamento no Índice ou em algum indicador da tela de resultado.
Consequência de cada opção: A é o estado atual; B dá uso real a um dado já coletado pelo usuário, mas depende de resolver DEC-05 primeiro (ou de uma modelagem própria, independente).

**DEC-07 — Quando restar só 1 de 3 métodos de valuation disponíveis (renormalização extrema), o sistema deve continuar apresentando isso como se fosse uma "média ponderada de 3 métodos", ou sinalizar isso de forma diferente na interface (ou recusar gerar)?**
Opção A: manter a renormalização silenciosa — sempre gera um número, sem aviso especial.
Opção B: detectar esse caso extremo e mudar a comunicação na tela (ex.: "baseado em 1 de 3 métodos") ou bloquear a geração.
Consequência de cada opção: A é o comportamento atual — hoje raramente ocorre porque o DEF-01 já garante EBITDA presente, mas passaria a ocorrer com mais frequência se DEC-03/DEC-04 (D1) resultarem em excluir métodos com base negativa; B exige nova lógica de interface, mas evita comunicar um "consolidado de 3 métodos" que na prática é só 1.

**DEC-08 — O motor de score antigo (`lib/valuation/score.ts`, com pesos e valores de referência arbitrários) deve ser apagado do repositório, ou mantido como registro histórico da evolução da modelagem?**
Opção A: apagar — reduz código morto/confuso; exigiria também ajustar ou remover `scripts/testar-valuation.ts` (que ainda o referencia).
Opção B: manter como está (não chamado pela rota ativa) — serve de evidência da evolução da modelagem (1ª versão → Índice de Prontidão) para a documentação do TCC.
Consequência de cada opção: A é mais limpo tecnicamente; B preserva histórico narrativo, sem custo de manutenção real (já está desligado).

**DEC-09 — O Índice de Prontidão deve continuar com pesos iguais entre os 46 itens (decisão já tomada na Fase 2), ou a equipe quer revisitar pesos diferenciados agora que todos os campos foram listados nesta auditoria?**
Opção A: manter pesos iguais — já implementado, simples, auditável, sem juízo de valor sobre "qual campo importa mais".
Opção B: dar pesos diferentes por campo/dimensão — mais sofisticado, mas reintroduz o tipo de decisão subjetiva que a Fase 2 pediu para evitar, e é uma mudança estrutural no checklist.
Consequência de cada opção: A não exige nenhuma mudança; B exige redefinir a estrutura de `ItemChecklistProntidao` e justificar uma tabela de pesos na banca.

**DEC-10 — Documentos devem continuar sendo medidos só por quantidade (5 slots genéricos), ou a equipe quer introduzir categorização real (ex.: "contrato social", "balanço auditado")?**
Opção A: manter por quantidade — nenhuma mudança de schema/migration necessária.
Opção B: adicionar um campo de tipo/categoria de documento — permite um checklist real ("falta o contrato social"), mas exige migration em `intake_data` ou numa tabela dedicada de documentos — o tipo de mudança estrutural que as regras de trabalho do projeto pedem aprovação explícita antes de fazer.
Consequência de cada opção: A é o estado atual, zero risco; B é mais valioso para o usuário final, mas é a mudança de maior escopo entre todas as decisões deste bloco.

**DEC-11 — "Ver resultado" no dashboard deve continuar usando a completude do intake (`intakeCompleto`) como critério, ou passar a usar a existência real de um resultado (`status === "concluido"` ou consulta a `resultados`)?**
Opção A: manter como está — nenhuma mudança; mantém a inconsistência descrita no item 11/Bloco 3 (processo com resultado real pode aparecer sem a opção "Ver resultado").
Opção B: corrigir o critério para refletir a existência real do resultado — mudança pequena e localizada (`app/(app)/dashboard/page.tsx` + `components/dashboard/processos-lista.tsx`), sem necessidade de migration.
Consequência de cada opção: A deixa uma inconsistência real e observável no dashboard; B é uma correção de baixo risco técnico, mas ainda assim é uma alteração de código — não foi feita nesta auditoria porque a instrução explícita desta rodada foi não alterar nada.
