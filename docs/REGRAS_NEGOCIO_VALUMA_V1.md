# ValuM&A — Regras de Negócio v1.0

**Versão:** 1.0
**Status:** APROVADA / CONGELADA PARA IMPLEMENTAÇÃO
**Data:** 2026-09-29
**Finalidade:** fonte de verdade funcional para implementação, testes, documentação acadêmica e apresentação do TCC.

Este documento consolida, sem alterar nenhum conteúdo aprovado, as decisões tomadas ao longo de três rodadas de trabalho: a auditoria técnica do estado do sistema (`docs/AUDITORIA_REGRAS_NEGOCIO.md`), a primeira rodada de decisões de produto (`docs/ANALISE_IMPACTO_DECISOES_V1.md`), o documento oficial de consolidação e suas confirmações de terminologia/UX, e o fechamento final das duas decisões que restaram em aberto (`docs/PLANO_IMPLEMENTACAO_V1.0.md`). Nenhuma decisão aprovada foi modificada aqui — este documento só organiza e numera o que já foi decidido.

Cada regra é identificada como **RG-NN**. Quando fizer sentido, traz **Regra**, **Justificativa**, **Impacto esperado no sistema** e **Critério de aceite**. Regras de posicionamento/princípio (sem uma implementação de código direta) trazem Regra e Justificativa, com Impacto/Critério indicando explicitamente que orientam comunicação e cópia, não uma condição testável no motor.

---

## A. Posicionamento e limites do produto

### RG-01 — Posicionamento oficial do produto

**Regra:** o ValuM&A é uma ferramenta de estruturação, preparação e análise preliminar para M&A. Seu objetivo é organizar informações empresariais, verificar disponibilidade e validade estrutural básica dessas informações, gerar uma estimativa preliminar de valuation quando as premissas do modelo forem atendidas, calcular um Índice de Prontidão Informacional para M&A, identificar informações pendentes, gerar pontos fortes/riscos/recomendações por IA, e preparar o material para uma etapa posterior de validação profissional.
**Justificativa:** define o escopo e a expectativa correta do usuário e da banca sobre o que o sistema faz e por quê — evita que o produto seja lido como um substituto de avaliação profissional.
**Impacto esperado:** orienta a cópia da landing page, da documentação e de qualquer material de apresentação do produto.
**Critério de aceite:** a descrição do produto em qualquer material voltado ao usuário (landing page, disclaimer, apresentação) deve ser compatível com esta definição, sem prometer mais do que ela descreve.

### RG-02 — O que o ValuM&A não substitui

**Regra:** o ValuM&A não substitui: contador, advogado, auditoria, due diligence, laudo profissional de valuation, parecer jurídico.
**Justificativa:** delimita explicitamente os limites de responsabilidade da ferramenta frente a etapas profissionais que exigem qualificação formal.
**Impacto esperado:** nenhuma tela do produto pode sugerir, direta ou indiretamente, que substitui qualquer um desses papéis.
**Critério de aceite:** a lista de não-substituição está refletida, ao menos em espírito, no disclaimer oficial (RG-55) e no posicionamento do produto (RG-01).

### RG-03 — Fluxo de responsabilidade da solução

**Regra:** a lógica conceitual do produto é: empresa fornece os dados → ValuM&A estrutura e realiza validações básicas → Índice de Prontidão Informacional e Estimativa preliminar de valuation (quando aplicável) → IA gera análise qualitativa → ValuM&A aponta pendências → validação contábil/financeira por profissional e validação jurídica por advogado → due diligence/negociação/etapas profissionais posteriores. A solução atua principalmente como facilitadora, organizadora e direcionadora do processo inicial.
**Justificativa:** descreve a cadeia de responsabilidade entre o sistema e os agentes humanos envolvidos num processo real de M&A.
**Impacto esperado:** é um fluxo conceitual/de processo — **não determina, por si só, a ordem visual das seções na tela de resultado** (ver RG-53, que resolve isso explicitamente).
**Critério de aceite:** não aplicável a uma condição de código isolada; verificável pela coerência entre a documentação do produto e o que a interface comunica.

### RG-04 — Natureza preliminar de todos os resultados

**Regra:** todos os resultados numéricos e qualitativos do sistema devem ser entendidos como preliminares. O ValuM&A não certifica a empresa, não garante a veracidade das informações fornecidas e não atesta regularidade jurídica, contábil ou financeira.
**Justificativa:** protege o usuário de má interpretação e delimita a responsabilidade legal/acadêmica do sistema.
**Impacto esperado:** toda tela que apresente um número (valuation, Índice de Prontidão) ou uma análise qualitativa deve conviver com essa natureza preliminar, comunicada via o disclaimer oficial (RG-55).
**Critério de aceite:** o disclaimer oficial (RG-55) está presente em toda tela de resultado e no PDF gerado a partir dela.

### RG-05 — Papel posterior de contador/profissional financeiro e advogado

**Regra:** a análise do ValuM&A é preliminar e será posteriormente submetida à validação contábil/financeira por profissional e à validação jurídica por advogado, antes de due diligence, negociação e etapas profissionais posteriores.
**Justificativa:** formaliza que o sistema é uma etapa inicial de um processo maior, não o processo inteiro.
**Impacto esperado:** justifica a existência de uma seção própria de "próximas etapas profissionais" na tela de resultado (RG-53, posição 6).
**Critério de aceite:** a tela de resultado comunica explicitamente a existência de uma etapa posterior de validação profissional.

---

## B. Valuation — Múltiplo de EBITDA

### RG-06 — Múltiplo fixo de EBITDA (4,0x)

**Regra:** manter o múltiplo fixo de 4,0x sobre o EBITDA-base como premissa simplificada do MVP. Não criar, nesta versão, múltiplos setoriais, por porte, por região, nem usar tabelas externas de mercado.
**Justificativa:** simplificação deliberada e assumida do modelo acadêmico — parametrizar por setor/porte/região exigiria uma fonte de dados de mercado que está fora do escopo do MVP.
**Impacto esperado:** nenhuma mudança na constante já usada em `lib/valuation/calcular.ts` (`MULTIPLO_EBITDA_PADRAO = 4`).
**Critério de aceite:** `Enterprise Value por Múltiplos = EBITDA-base × 4`, sempre, para qualquer processo, independentemente de setor/porte/região.

### RG-07 — EBITDA-base utilizado

**Regra:** o EBITDA-base é o EBITDA do último ano com dados reais no DRE (ano em que receita bruta ou EBITDA são diferentes de zero) — não uma média dos anos.
**Justificativa:** ratifica o comportamento já implementado, escolhido para refletir o desempenho mais recente da empresa sem exigir uma série histórica completa.
**Impacto esperado:** nenhum — comportamento já existente, mantido.
**Critério de aceite:** dado um DRE com 3 anos preenchidos, o EBITDA-base usado em qualquer cálculo é sempre o do ano mais recente com dados reais, nunca uma média.

### RG-08 — Comunicação da premissa simplificada do múltiplo

**Regra:** a interface de explicabilidade deve deixar explícito: *"O múltiplo de 4,0x utilizado no MVP é uma premissa simplificada do modelo e não representa uma cotação de mercado ou múltiplo setorial em tempo real."*
**Justificativa:** evita que o usuário confunda uma constante do modelo acadêmico com uma referência real de mercado.
**Impacto esperado:** novo texto na seção de explicabilidade ("Como chegamos a este resultado"), junto ao detalhamento do método de Múltiplos.
**Critério de aceite:** o texto acima (ou equivalente fiel) está visível sempre que o método de Múltiplos é detalhado para o usuário.

---

## C. DCF Simplificado

### RG-09 — Parâmetros do DCF simplificado

**Regra:** manter o modelo atual: horizonte de 5 anos, crescimento de 3% ao ano, taxa de desconto de 15% ao ano, EBITDA-base como proxy simplificada do fluxo de caixa, sem valor terminal, sem Gordon Growth. Não ampliar o DCF nesta versão.
**Justificativa:** ratifica os parâmetros já implementados como premissas fechadas para o MVP, evitando a complexidade de um DCF completo (capex, capital de giro, impostos, perpetuidade).
**Impacto esperado:** nenhuma mudança nas constantes já usadas (`HORIZONTE_PROJECAO_ANOS = 5`, `TAXA_CRESCIMENTO_PROJECAO = 0.03`, `TAXA_DESCONTO_PADRAO = 0.15`).
**Critério de aceite:** o cálculo soma exatamente 5 fluxos anuais, cada um o EBITDA-base composto a 3% a.a. e descontado a 15% a.a., sem nenhuma parcela de valor terminal.

### RG-10 — Nome oficial "DCF simplificado"

**Regra:** o produto e a documentação devem chamar este método explicitamente de "DCF simplificado". Pode haver uma explicação acessível dizendo "Fluxo de Caixa Descontado simplificado", mas o componente não deve apresentá-lo como um DCF profissional completo.
**Justificativa:** nomenclatura precisa evita que o usuário superestime o rigor técnico do método.
**Impacto esperado:** troca de rótulo em qualquer lugar da interface que hoje diga só "Fluxo de Caixa Descontado".
**Critério de aceite:** o rótulo principal exibido ao usuário é "DCF simplificado"; "Fluxo de Caixa Descontado simplificado" pode aparecer só como subtítulo/explicação acessória, nunca como rótulo principal isolado.

---

## D. Base econômica — Enterprise Value × Equity Value

### RG-11 — Distinção conceitual entre Enterprise Value e Equity Value

**Regra:** Múltiplos e DCF produzem inicialmente Enterprise Value (`EV_Múltiplos = EBITDA-base × 4`); o método Patrimonial já representa uma proxy de Equity Value, sem necessidade de conversão. Os três métodos precisam estar na mesma base econômica antes da ponderação.
**Justificativa:** corrige o achado mais grave da auditoria original — os três métodos eram somados diretamente apesar de representarem bases econômicas diferentes.
**Impacto esperado:** o motor de cálculo passa a distinguir explicitamente o valor bruto (EV) do valor ajustado (Equity) para Múltiplos e DCF.
**Critério de aceite:** nenhum valor de Enterprise Value (bruto, antes do ajuste de dívida líquida) é usado diretamente na ponderação final — só os valores já convertidos para Equity Value.

### RG-12 — Resultado principal em Equity Value

**Regra:** o resultado final utiliza os três métodos na mesma base econômica de Equity Value; o resultado principal apresentado ao usuário é a "Estimativa preliminar de Equity Value".
**Justificativa:** Equity Value (valor atribuível aos sócios) é a métrica mais relevante para o dono de uma PME avaliando uma venda ou negociação societária.
**Impacto esperado:** rótulo e cálculo do resultado consolidado, quando existir (ver RG-24), sempre em base Equity.
**Critério de aceite:** o número em destaque na tela de resultado é sempre um valor de Equity Value, nunca um Enterprise Value bruto.

---

## E. Dívida líquida e caixa

### RG-13 — Caixa e equivalentes de caixa

**Regra:** introduzir no intake Financeiro o campo "Caixa e equivalentes de caixa".
**Justificativa:** necessário para calcular a Dívida Líquida (RG-15) e converter Enterprise Value em Equity Value (RG-16/RG-17).
**Impacto esperado:** novo campo no formulário e no schema de dados do Financeiro.
**Critério de aceite:** o campo existe no intake, aceita valores informados (incluindo zero, ver RG-33), e alimenta o cálculo de Dívida Líquida.

### RG-14 — Dívida financeira total

**Regra:** dívida financeira total = soma das dívidas financeiras informadas pelo usuário.
**Justificativa:** a dívida já era coletada no intake, mas não tinha função financeira real até esta versão.
**Impacto esperado:** nenhuma mudança de coleta — apenas passa a ser efetivamente somada e usada no cálculo.
**Critério de aceite:** o valor usado como "dívida financeira total" é exatamente a soma de `financeiro.dividas[].valor`.

### RG-15 — Fórmula da Dívida Líquida

**Regra:** Dívida Líquida = Dívida financeira total − Caixa e equivalentes de caixa. É permitido que a Dívida Líquida seja negativa, quando a empresa possuir mais caixa do que dívida.
**Justificativa:** fórmula padrão de finanças corporativas para o ajuste Enterprise Value → Equity Value.
**Impacto esperado:** nova função de cálculo no motor de valuation.
**Critério de aceite:** dado caixa maior que a dívida total, a Dívida Líquida calculada é um número negativo, e esse valor negativo é usado normalmente na conversão (RG-16/RG-17), sem tratamento de erro.

---

## F. Conversão EV → Equity Value

### RG-16 — Conversão do método de Múltiplos

**Regra:** `Equity_Múltiplos = EV_Múltiplos − Dívida Líquida`, aplicada depois de `EV_Múltiplos = EBITDA-base × 4`.
**Justificativa:** ajusta o valor de Enterprise Value para Equity Value, descontando a dívida líquida da empresa.
**Impacto esperado:** o valor de "Múltiplo de EBITDA" mostrado ao usuário passa a ser o valor já ajustado (Equity), não o bruto (EV).
**Critério de aceite:** o valor exibido para o método de Múltiplos é sempre `(EBITDA-base × 4) − Dívida Líquida`, quando o método for aplicável (RG-20).

### RG-17 — Conversão do método DCF

**Regra:** o mesmo ajuste de Dívida Líquida se aplica ao DCF simplificado: `Equity_DCF = EV_DCF − Dívida Líquida`.
**Justificativa:** mesma lógica de padronização de base econômica do RG-16, aplicada ao segundo método.
**Impacto esperado:** o valor de "DCF simplificado" mostrado ao usuário passa a ser o valor já ajustado (Equity), não o bruto (EV).
**Critério de aceite:** o valor exibido para o DCF é sempre `(soma dos 5 fluxos descontados) − Dívida Líquida`, quando o método for aplicável (RG-20).

### RG-18 — Método Patrimonial já está em base Equity Value

**Regra:** o método Patrimonial (Patrimônio Líquido informado) já representa uma proxy de Equity Value e não precisa de nenhum ajuste de conversão.
**Justificativa:** patrimônio líquido contábil é, por definição, uma medida de valor atribuível aos sócios.
**Impacto esperado:** nenhuma mudança na forma de cálculo deste método.
**Critério de aceite:** o valor do método Patrimonial usado no consolidado é exatamente o Patrimônio Líquido informado, sem nenhum ajuste de dívida líquida aplicado sobre ele.

---

## G. Consolidação e aplicabilidade dos métodos

### RG-19 — Pesos do consolidado

**Regra:** o valuation consolidado é a média ponderada de 50% Múltiplos + 30% DCF + 20% Patrimonial.
**Justificativa:** ratifica a ponderação já implementada e usada desde o início do projeto.
**Impacto esperado:** nenhuma mudança nas constantes já usadas (`PESO_VALUATION_EBITDA = 0.5`, `PESO_VALUATION_DCF = 0.3`, `PESO_VALUATION_PATRIMONIAL = 0.2`).
**Critério de aceite:** quando os três métodos são aplicáveis (RG-24), o consolidado é exatamente essa média ponderada, sobre os valores já em base Equity Value.

### RG-20 — EBITDA-base ≤ 0 torna Múltiplos e DCF não aplicáveis

**Regra:** quando o EBITDA-base for menor ou igual a zero, os métodos de Múltiplos de EBITDA e DCF simplificado ficam não aplicáveis **ao consolidado**.
**Justificativa:** multiplicar ou projetar um EBITDA negativo/zero não produz um valor economicamente interpretável para compor o consolidado por esses métodos.
**Impacto esperado:** os dois métodos passam a poder ser marcados como "não aplicável" em vez de entrar no cálculo do consolidado.
**Critério de aceite:** dado um EBITDA-base ≤ 0, os valores de Múltiplos e DCF não entram no consolidado.
**Nota de fidelidade à fonte:** ao contrário do RG-21 (Patrimonial), as decisões aprovadas não especificam explicitamente se o valor calculado de Múltiplos/DCF deve ou não continuar visível isoladamente quando não aplicável — só que "os métodos válidos podem ser mostrados separadamente" (RG-23). Este documento não resolve essa lacuna pontual por conta própria; ver a checagem de consistência ao final.

### RG-21 — Patrimônio Líquido ≤ 0 torna o método Patrimonial não aplicável ao consolidado

**Regra:** quando o Patrimônio Líquido for menor ou igual a zero, o valor informado permanece visível como informação financeira, mas o método Patrimonial fica não aplicável ao consolidado.
**Justificativa:** um patrimônio líquido negativo é um dado real e relevante, mas não deve ser somado ao consolidado como se fosse um valor de Equity Value diretamente utilizável.
**Impacto esperado:** distinção entre "valor informado" (sempre mostrado) e "aplicável ao consolidado" (condicional ao sinal).
**Critério de aceite:** dado um Patrimônio Líquido ≤ 0, o valor informado continua visível na interface, mas não é somado ao cálculo do consolidado.

### RG-22 — Proibição de renormalização de pesos

**Regra:** quando algum método não for aplicável, os pesos dos métodos restantes não são renormalizados.
**Justificativa:** renormalizar pesos entre métodos restantes produziria a impressão de um consolidado de "3 métodos" que na verdade é baseado em menos, mascarando a limitação da análise.
**Impacto esperado:** remove a lógica atual de recalcular pesos dinamicamente conforme os métodos disponíveis.
**Critério de aceite:** se apenas 1 ou 2 métodos forem aplicáveis, o sistema não produz um "consolidado" com pesos redistribuídos entre eles.

### RG-23 — Métodos válidos mostrados separadamente, sem consolidado alternativo

**Regra:** se algum método não for aplicável, os métodos válidos podem ser mostrados separadamente, mas não deve ser produzido um consolidado alternativo (ex.: uma "média dos métodos disponíveis" apresentada como se fosse o consolidado oficial de 3 métodos).
**Justificativa:** permite que o usuário ainda veja os números que são calculáveis, sem que o sistema disfarce um resultado parcial como se fosse o consolidado 50/30/20 completo.
**Impacto esperado:** a interface pode exibir individualmente cada método aplicável, mesmo quando não há consolidado (RG-24).
**Critério de aceite:** com 1 ou 2 métodos aplicáveis, a tela mostra os valores desses métodos individualmente, sem apresentar nenhum número como "o valuation consolidado".

### RG-24 — O consolidado só existe quando os três métodos são aplicáveis

**Regra:** o valuation consolidado (50/30/20) só existe quando Múltiplos, DCF e Patrimonial forem simultaneamente aplicáveis.
**Justificativa:** consequência direta de RG-20, RG-21 e RG-22 — sem os três métodos, não há uma base válida para aplicar os pesos oficiais.
**Impacto esperado:** o campo de valuation consolidado passa a poder não existir (ser nulo) para um processo, de forma legítima e esperada.
**Critério de aceite:** dado qualquer processo em que nem todos os métodos sejam aplicáveis, nenhum valor de "consolidado" é gerado ou exibido como tal.

### RG-25 — Ausência total de métodos aplicáveis

**Regra:** quando EBITDA-base ≤ 0 **e** Patrimônio Líquido ≤ 0 simultaneamente, nenhum dos três métodos é aplicável. Nessa situação: não gerar valuation consolidado; não renormalizar pesos; não criar um valuation alternativo; apresentar a mensagem **"Estimativa preliminar de Equity Value indisponível pelo modelo simplificado"**; explicar a limitação ao usuário. Este estado não deve ser interpretado nem comunicado como "empresa sem valor" ou "empresa inviável".
**Justificativa:** cobre o caso-limite (real e não raro em PMEs endividadas e deficitárias) em que o modelo simplificado simplesmente não tem base para produzir nenhum número de valuation — sem inventar um substituto nem sugerir um julgamento sobre a viabilidade do negócio.
**Impacto esperado:** novo estado de interface para a seção de valuation, com texto explicativo, cuidadosamente redigido para não sugerir uma leitura negativa sobre o valor real da empresa.
**Critério de aceite:** dado EBITDA-base ≤ 0 e Patrimônio Líquido ≤ 0, a tela de resultado mostra a mensagem oficial de indisponibilidade e uma explicação da limitação, sem nenhum número de valuation, e sem qualquer linguagem que sugira "sem valor" ou "inviável".

### RG-26 — Análise parcial continua sendo gerada

**Regra:** mesmo no cenário do RG-25, o sistema continua gerando uma análise parcial contendo Índice de Prontidão Informacional, pendências, alertas e análise qualitativa da IA, quando houver dados suficientes para isso.
**Justificativa:** a ausência de um valuation numérico não invalida o valor das outras informações estruturadas e da análise qualitativa — o usuário ainda se beneficia de saber sua prontidão e pendências.
**Impacto esperado:** a geração de resultado não é bloqueada pela ausência total de métodos de valuation aplicáveis.
**Critério de aceite:** no cenário do RG-25, "Gerar Resultado" continua funcionando e produz Índice de Prontidão, pendências e análise de IA normalmente, mesmo sem nenhum valuation numérico.

---

## H. Índice de Prontidão Informacional

### RG-27 — Definição e propósito do Índice

**Regra:** o Índice de Prontidão Informacional mede o "percentual de preparação e estruturação das informações necessárias para uma análise preliminar" — não é uma avaliação da qualidade econômica da empresa, mede disponibilidade, estruturação e validade básica da informação fornecida.
**Justificativa:** evita que o usuário confunda o Índice com um julgamento sobre o mérito ou a saúde financeira do negócio.
**Impacto esperado:** todo texto explicativo do Índice na interface reforça essa distinção.
**Critério de aceite:** o texto de esclarecimento (equivalente ao já implementado no `ScoreGauge`) está sempre visível junto ao número do Índice.

### RG-28 — O antigo Score é substituído pelo Índice de Prontidão

**Regra:** o antigo Score deixa de ser a regra oficial e é substituído pelo Índice de Prontidão Informacional para M&A. O motor antigo de Score (`lib/valuation/score.ts`) deve ser removido do código ativo quando a implementação for realizada; sua história é preservada via Git/documentação, não via código em produção.
**Justificativa:** o Score antigo media qualidade percebida do negócio com fórmulas e valores de referência arbitrários (margem de EBITDA, alavancagem, quantidade de concorrentes); o Índice de Prontidão o substitui com um propósito conceitualmente diferente e mais defensável (RG-27).
**Impacto esperado:** remoção do arquivo `lib/valuation/score.ts` e de qualquer ponto do código que ainda o referencie fora de testes/documentação histórica.
**Critério de aceite:** nenhuma rota ativa do sistema chama `calcularScore` ou qualquer função de `score.ts`; a história do motor antigo permanece recuperável via histórico do Git e/ou documentação, não como código executável.

### RG-29 — Quatro dimensões, 25% cada

**Regra:** as dimensões do Índice de Prontidão são Financeiro, Operacional, Mercado e Documental, cada uma valendo 25% do Índice Geral.
**Justificativa:** ratifica a decisão já tomada e implementada na fase anterior de evolução do MVP.
**Impacto esperado:** nenhuma mudança na fórmula já existente (Índice Geral = média simples das 4 notas de dimensão).
**Critério de aceite:** o Índice Geral é sempre a média aritmética simples das 4 notas de dimensão, sem pesos diferenciados entre elas.

### RG-30 — Pesos iguais dentro de cada dimensão

**Regra:** dentro de cada dimensão, todos os itens do checklist têm peso igual entre si.
**Justificativa:** evita reintroduzir avaliação subjetiva sobre "qual campo importa mais", mantendo o Índice simples e auditável.
**Impacto esperado:** nenhuma mudança na fórmula já existente (nota da dimensão = itens válidos / itens esperados × 100).
**Critério de aceite:** nenhum item do checklist de uma dimensão tem peso maior que outro da mesma dimensão.

### RG-31 — Perfil fora da pontuação

**Regra:** a etapa Perfil do intake não pontua para o Índice de Prontidão.
**Justificativa:** dados de Perfil (razão social, setor, sócios etc.) identificam a empresa, mas não representam preparação informacional para M&A no sentido financeiro/operacional/mercadológico/documental medido pelo Índice.
**Impacto esperado:** nenhuma mudança — comportamento já implementado.
**Critério de aceite:** nenhum campo da etapa Perfil aparece no checklist de itens do Índice de Prontidão.

### RG-32 — Estados de validade de um item do Índice

**Regra:** para limitar o escopo técnico da validação, cada item do Índice de Prontidão assume um entre quatro estados: **AUSENTE** (não conta), **INVÁLIDO** (foi fornecido, mas viola uma regra determinística; não conta), **VÁLIDO ESTRUTURALMENTE** (passa nas validações básicas; conta), **VÁLIDO COM ALERTA** (pode contar para a Prontidão, mas possui uma inconsistência que deve ser apresentada ao usuário para revisão).
**Justificativa:** formaliza um modelo simples e finito de validade, em vez de uma checagem binária "presente/ausente" que não distingue "dado presente mas claramente errado" de "dado presente e coerente".
**Impacto esperado:** o checklist do Índice de Prontidão passa a produzir um destes 4 estados por item, não um booleano simples; itens em "válido com alerta" precisam de uma forma de exibição distinta na interface.
**Critério de aceite:** todo item do checklist pode ser classificado num destes 4 estados; itens "inválido" e "ausente" não contam para a nota da dimensão; itens "válido com alerta" contam, mas geram um alerta visível ao usuário.

### RG-33 — Zero como valor informado válido

**Regra:** `null`/`undefined` representa informação não fornecida. Zero, quando permitido pela regra do campo, representa uma resposta válida e conta como informação fornecida — inclusive quando um valor zero ou negativo torna um método de valuation não aplicável (RG-20/RG-21), ele ainda conta como "informado" para fins de Prontidão e de campos mínimos (RG-40/RG-41).
**Justificativa:** corrige a ambiguidade identificada na auditoria original, em que o valor padrão `0` de um campo nunca preenchido era usado como sentinela de "não preenchido" — confundindo silenciosamente "não preenchido" com "preenchido com zero de verdade".
**Impacto esperado:** mudança de convenção em todos os campos numéricos do intake e em toda leitura desses campos pelo motor de cálculo e pelo Índice de Prontidão.
**Critério de aceite:** um campo numérico explicitamente preenchido com zero (quando o campo permite esse valor) é tratado como "informado" em todo o sistema — nunca confundido com um campo nunca tocado.

### RG-34 — Limites da validação automática

**Regra:** a validação de um item, nesta versão, limita-se a: presença; tipo/formato; domínio/faixas objetivas; consistências simples entre campos; categoria/metadados documentais; duplicidade básica. Não transformar a validade em um motor complexo de análise semântica. A IA não decide se um item conta para a Prontidão.
**Justificativa:** mantém o escopo técnico do MVP controlado, evitando um motor de validação sofisticado e de manutenção custosa, e reforça a separação entre validação determinística e análise qualitativa por IA.
**Impacto esperado:** cada item do checklist ganha regras de validação determinística proporcionais a essa lista — nada além dela.
**Critério de aceite:** nenhuma validação de item depende de uma chamada à IA; toda validação é decidida por regras determinísticas de código.

---

## I. Documentos

### RG-35 — Seis categorias documentais fixas

**Regra:** o MVP utiliza seis categorias documentais: (1) Demonstração do Resultado — DRE; (2) Balanço Patrimonial; (3) Documentação/posição de endividamento; (4) Contrato Social ou Estatuto e alterações; (5) Documentação fiscal/tributária relevante; (6) Contratos relevantes.
**Justificativa:** substitui a medição por quantidade bruta de arquivos (limitação identificada na auditoria) por uma categorização mínima e objetiva, sem exigir análise de conteúdo.
**Impacto esperado:** o checklist documental do Índice de Prontidão passa a ser reescrito em torno destas 6 categorias fixas.
**Critério de aceite:** existem exatamente 6 categorias documentais no sistema, com estes nomes/significados.

### RG-36 — Regra de pontuação documental

**Regra:** a dimensão Documental é calculada como categorias atendidas / 6 × 100. Cada categoria conta apenas uma vez para a Prontidão, independentemente da quantidade de arquivos anexados àquela categoria.
**Justificativa:** mede cobertura de categorias essenciais, não volume de upload — um usuário não deveria conseguir "inflar" a nota anexando vários arquivos da mesma categoria.
**Impacto esperado:** nova fórmula de cálculo da dimensão Documental, substituindo a contagem de "slots" genéricos atual.
**Critério de aceite:** anexar 5 arquivos da categoria "Contrato Social" conta como 1 categoria atendida, não como 5 itens.

### RG-37 — Critérios para um documento contar como "disponibilizado"

**Regra:** um documento é considerado disponibilizado (não "validado profissionalmente") quando, no mínimo: tem upload concluído; passa pela validação técnica de formato/tamanho; possui categoria; possui período/exercício quando aplicável; não é arquivo vazio; não é duplicata exata.
**Justificativa:** define um piso mínimo de qualidade estrutural do arquivo, sem exigir nenhuma análise de conteúdo ou julgamento profissional.
**Impacto esperado:** novas checagens no fluxo de upload/checklist documental além das já existentes (formato/tamanho).
**Critério de aceite:** um arquivo vazio, duplicado, ou sem categoria/período (quando aplicável) não conta como disponibilizado, mesmo que o upload técnico tenha sido concluído com sucesso.

### RG-38 — Documento disponibilizado ≠ documento validado profissionalmente

**Regra:** "documento disponibilizado" e "documento validado profissionalmente" são conceitos distintos. A validação profissional (autenticidade, correção contábil, regularidade jurídica) não faz parte do motor automático da v1 — pertence à etapa posterior de contador/advogado.
**Justificativa:** evita que o usuário (ou a interface) confunda "o sistema aceitou o arquivo" com "um profissional confirmou que o documento é válido/autêntico".
**Impacto esperado:** nenhuma tela do produto pode usar linguagem que sugira certificação profissional de um documento.
**Critério de aceite:** em nenhum lugar da interface um documento "disponibilizado" é chamado de "validado", "aprovado" ou "certificado".

### RG-39 — O sistema não certifica documentos

**Regra:** o ValuM&A não certifica autenticidade, correção contábil ou regularidade jurídica dos documentos fornecidos.
**Justificativa:** reforça, no contexto específico de documentos, a mesma limitação de responsabilidade já declarada em RG-04.
**Impacto esperado:** reforça o conteúdo do disclaimer oficial (RG-55) especificamente quanto a documentos.
**Critério de aceite:** o disclaimer oficial cobre explicitamente a não-certificação de documentos.

---

## J. Campos mínimos e geração de resultado

### RG-40 — Campos mínimos para gerar a análise

**Regra:** os campos mínimos para geração da análise são: **Perfil** — razão social, setor; **Financeiro** — EBITDA do exercício-base informado, Patrimônio Líquido informado, situação de dívida financeira declarada, Caixa e Equivalentes de Caixa informado.
**Justificativa:** define o piso mínimo de dados necessário para o sistema produzir qualquer análise (mesmo que parcial, ver RG-26), sem exigir que o intake inteiro esteja completo.
**Impacto esperado:** substitui o conjunto mínimo de campos hoje verificado por `verificarCamposObrigatorios` (que hoje exige só razão social, setor, EBITDA ≠ 0 e patrimônio ≠ 0).
**Critério de aceite:** "Gerar Resultado" só fica disponível quando estes 6 itens estiverem informados (ver RG-41 para o que "informado" significa aqui).

### RG-41 — "Informado" não significa "positivo"

**Regra:** zero e números negativos, quando permitidos pelo campo, representam informação fornecida e podem contar para os campos mínimos e para a Prontidão, embora possam tornar métodos de valuation não aplicáveis (RG-20/RG-21).
**Justificativa:** aplica a mesma distinção do RG-33 especificamente ao gate de campos mínimos — um EBITDA ou Patrimônio Líquido negativo, desde que explicitamente informado, não deve bloquear a geração da análise.
**Impacto esperado:** o gate de campos mínimos passa a verificar "foi informado" (não `undefined`), não mais "é diferente de zero".
**Critério de aceite:** um processo com EBITDA-base = -50.000 explicitamente informado (não deixado em branco) satisfaz o campo mínimo correspondente, mesmo que esse valor torne o método de Múltiplos não aplicável.

### RG-42 — Campos mínimos são diferentes do checklist de Prontidão

**Regra:** os campos mínimos necessários para gerar determinada análise são diferentes dos itens esperados para a Prontidão — são dois conjuntos de exigência distintos, com propósitos diferentes. Não é necessário atingir 100% de Prontidão para gerar uma análise.
**Justificativa:** evita confundir "o mínimo para o sistema calcular algo" com "o conjunto completo de informação que enriquece a análise" — o primeiro é pequeno e bloqueante; o segundo é grande e apenas informativo.
**Impacto esperado:** mantém dois módulos separados no código (o gate de campos mínimos e o checklist de Prontidão), sem fundir os dois em uma única lista.
**Critério de aceite:** é possível gerar uma análise válida com os 6 campos mínimos preenchidos e a maioria dos itens do checklist de Prontidão ainda pendentes, sem exigir 100% de Prontidão.

### RG-43 — Operação, Mercado e Documentos não bloqueiam o valuation financeiro

**Regra:** Operação, Mercado e Documentos não são hard gates para o valuation financeiro nesta versão. Sua ausência reduz a Prontidão e limita a análise qualitativa, mas não impede a geração do resultado.
**Justificativa:** o valuation financeiro depende só de dados financeiros; as outras dimensões enriquecem a leitura, mas não são pré-requisito matemático para o cálculo.
**Impacto esperado:** nenhuma mudança de comportamento — já é assim hoje, ratificado.
**Critério de aceite:** um processo sem nenhum dado de Operação/Mercado/Documentos, mas com os campos mínimos financeiros preenchidos, consegue gerar um resultado.

---

## K. Inteligência Artificial

### RG-44 — Papel exclusivamente qualitativo da IA

**Regra:** a IA gera pontos fortes, riscos e recomendações (análise qualitativa). A IA não decide pontuação de Prontidão e não altera nenhum valor numérico de valuation ou Índice.
**Justificativa:** preserva a separação entre cálculo determinístico (auditável, reproduzível) e análise qualitativa (interpretativa), essencial para a credibilidade acadêmica do modelo.
**Impacto esperado:** nenhuma mudança na garantia estrutural já existente (a IA recebe os números já calculados só como contexto de leitura).
**Critério de aceite:** trocar a resposta da IA por qualquer outro texto qualitativo nunca altera nenhum número exibido na tela de resultado.

### RG-45 — Falha da IA não invalida o restante do resultado

**Regra:** falha da IA (indisponibilidade, erro, resposta inválida) não invalida o valuation, o Índice de Prontidão nem as pendências.
**Justificativa:** a análise qualitativa é um componente adicional, não uma dependência crítica do restante do resultado.
**Impacto esperado:** nenhuma mudança no comportamento já implementado (DEF-03 da fase anterior de evolução).
**Critério de aceite:** com a IA indisponível, o valuation e o Índice de Prontidão continuam sendo calculados e exibidos normalmente; só a seção de análise qualitativa mostra um estado de erro com opção de tentar novamente.

---

## L. Ciclo de vida do resultado

### RG-46 — Resultado desatualizado após alteração do intake

**Regra:** se o intake for alterado depois da geração de um resultado, esse resultado fica desatualizado e deve solicitar recálculo.
**Justificativa:** evita que o usuário veja um resultado que não reflete mais os dados atuais do intake sem ser avisado disso.
**Impacto esperado:** nova comparação entre o momento da última alteração do intake e o momento da geração do resultado.
**Critério de aceite:** ao editar qualquer campo do intake depois de um resultado já ter sido gerado, a tela de resultado passa a indicar que o resultado está desatualizado e oferece recalcular.

### RG-47 — Versionamento explícito do modelo de negócio

**Regra:** o modelo precisa ter versionamento explícito da regra de negócio usada para gerar cada resultado, independente do JSON da análise da IA.
**Justificativa:** sem isso, resultados gerados sob regras de negócio diferentes (ex.: Enterprise Value bruto no regime anterior vs. Equity Value ajustado neste v1.0) ficam indistinguíveis entre si, comprometendo a leitura de dados históricos.
**Impacto esperado:** todo resultado passa a carregar um identificador de qual versão da regra de negócio o gerou.
**Critério de aceite:** é possível, para qualquer resultado salvo, identificar programaticamente qual versão da regra de negócio (ex.: pré-v1.0 ou v1.0) foi usada para produzi-lo.

### RG-48 — Ausência de histórico completo de resultados

**Regra:** não criar histórico completo de resultados no MVP; manter apenas o resultado mais recente por processo.
**Justificativa:** mantém a persistência simples (um registro por processo, substituído a cada geração), evitando a complexidade de um histórico versionado nesta fase do produto.
**Impacto esperado:** nenhuma mudança — já é o comportamento implementado (upsert por `processo_id`).
**Critério de aceite:** gerar um novo resultado para um processo sempre substitui o anterior; não existe uma lista de resultados históricos por processo.

### RG-49 — "Ver resultado" depende da existência real do resultado

**Regra:** a disponibilidade da opção "Ver resultado" no dashboard deve depender da existência real de um resultado gerado, não de uma verificação de completude do intake (`intakeCompleto()`).
**Justificativa:** corrige uma inconsistência identificada na auditoria — hoje um processo pode ter um resultado real gerado e ainda assim não mostrar a opção de vê-lo, por nunca ter visitado todas as etapas do intake.
**Impacto esperado:** o critério de exibição da opção "Ver resultado" muda de "todas as 5 fases do intake têm alguma linha salva" para "existe um resultado salvo para este processo".
**Critério de aceite:** um processo que gerou um resultado usando só os campos mínimos (RG-40), sem nunca visitar Operação/Mercado/Documentos, mostra corretamente a opção "Ver resultado".

---

## M. PDF

### RG-50 — PDF representa só o último resultado válido

**Regra:** o PDF apenas representa o último resultado válido; não possui cálculo independente.
**Justificativa:** garante que o PDF nunca possa divergir da tela de resultado, por não ter uma segunda fonte de dados ou lógica de cálculo própria.
**Impacto esperado:** nenhuma mudança — já é exatamente como a geração de PDF foi implementada (impressão do navegador reaproveitando o mesmo DOM da tela).
**Critério de aceite:** o conteúdo do PDF gerado para um processo é sempre idêntico ao que a tela de resultado mostra no momento da exportação.

---

## N. Arredondamento

### RG-51 — Cálculos em precisão completa

**Regra:** os cálculos usam precisão completa; o arredondamento ocorre somente na apresentação ao usuário, nunca durante o cálculo.
**Justificativa:** evita a perda de precisão acumulada por arredondamentos intermediários, mantendo os números internos auditáveis e exatos.
**Impacto esperado:** qualquer arredondamento intermediário hoje existente no cálculo do Índice de Prontidão deixa de existir; só a camada de exibição arredonda.
**Critério de aceite:** o valor armazenado/calculado internamente de qualquer índice ou nota pode conter casas decimais; só o texto exibido ao usuário é arredondado.

---

## O. Explicabilidade

### RG-52 — Seção "Como chegamos a este resultado"

**Regra:** a tela de resultado inclui uma seção de explicabilidade mostrando o detalhamento por método (valor, peso, contribuição), a fórmula literal com os números reais do processo, e o detalhamento por dimensão do Índice de Prontidão ("N de M informações → nota").
**Justificativa:** essencial para que um usuário sem formação financeira entenda de onde vêm os números, e para a defensabilidade acadêmica do modelo perante a banca.
**Impacto esperado:** ratifica a seção já implementada na fase anterior de evolução do MVP, agora precisando refletir os métodos "não aplicáveis" (RG-20/RG-21/RG-25) e a conversão EV→Equity (RG-16/RG-17).
**Critério de aceite:** para qualquer resultado gerado, é possível ver, nesta seção, o valor e o peso de cada método aplicável, e o motivo de cada método não aplicável estar marcado como tal.

### RG-53 — Ordem visual oficial da tela de resultado

**Regra:** a ordem visual da tela de resultado é: (1) Equity Value/valuation; (2) Índice de Prontidão; (3) Pendências; (4) Explicabilidade; (5) Análise qualitativa da IA; (6) Próximas etapas profissionais. O fluxo conceitual descrito em RG-03 não determina esta ordem.
**Justificativa:** resolve explicitamente a aparente divergência entre o fluxo conceitual de responsabilidade (RG-03) e a ordem de leitura mais útil ao usuário, priorizando os resultados determinísticos antes da análise qualitativa.
**Impacto esperado:** a ordem já implementada (Fase 3 da evolução do MVP) está correta nos itens 1–5; falta acrescentar o item 6 ("Próximas etapas profissionais"), hoje inexistente.
**Critério de aceite:** a tela de resultado apresenta as seções nesta ordem exata, incluindo uma seção final de próximas etapas profissionais.

---

## P. Terminologia oficial

### RG-54 — Glossário de rótulos obrigatórios

**Regra:**
- O método de fluxo de caixa é sempre chamado de **"DCF simplificado"** na interface (RG-10).
- O resultado principal é rotulado **"Estimativa preliminar de Equity Value"**, com explicação acessível **"Estimativa preliminar do valor econômico atribuível aos sócios."**
- O termo **"valuation"** pode continuar aparecendo como conceito geral do produto (ex.: "processo de valuation"), mas não como rótulo do número principal.

**Justificativa:** precisão terminológica evita que o usuário leigo (público-alvo do MVP) superestime o rigor técnico dos métodos ou confunda os conceitos.
**Impacto esperado:** revisão de todos os rótulos hoje usados nos componentes de resultado.
**Critério de aceite:** nenhum componente da tela de resultado usa "Fluxo de Caixa Descontado" isolado ou "Estimativa preliminar de valuation" isolado como rótulo principal.

---

## Q. Disclaimer

### RG-55 — Texto oficial do disclaimer

**Regra:** o texto oficial do disclaimer, presente em toda tela de resultado e no PDF gerado a partir dela, é:

> *"Esta análise é preliminar e foi produzida com base nas informações fornecidas. Os resultados não substituem avaliação contábil, financeira, jurídica ou due diligence profissional. O ValuM&A não certifica a empresa nem garante a veracidade ou regularidade das informações e documentos fornecidos."*

**Justificativa:** consolida, num único texto oficial, a natureza preliminar (RG-04), o papel posterior de profissionais (RG-05) e a não-certificação de documentos (RG-39).
**Impacto esperado:** substitui o texto de disclaimer hoje implementado (mais curto, de uma fase anterior de evolução do MVP).
**Critério de aceite:** o texto exato acima (ou uma tradução fiel, sem omissão de conteúdo) aparece em toda tela de resultado e é reproduzido no PDF.

---

## R. Itens explicitamente fora de escopo

### RG-56 — Fora de escopo do MVP v1.0

**Regra:** os seguintes itens estão explicitamente fora do escopo desta versão do produto: Stripe/pagamentos; white-label; portal de parceiros; portal de revisão profissional; WACC setorial; Gordon Growth; múltiplos por setor; fatores de ajuste; score sofisticado de risco; NDA; Teaser; Information Memorandum; marketplace; matchmaking; "perfil empresarial" (no sentido de um módulo de descoberta/rede); "empresas relacionadas"; pacote ZIP de documentos; assinatura digital.
**Justificativa:** mantém o MVP dentro do escopo acadêmico definido desde o início do projeto, evitando expansão de escopo não solicitada.
**Impacto esperado:** nenhuma dessas funcionalidades deve ser implementada nem proposta durante a implementação da v1.0, mesmo que pareça uma extensão natural de alguma regra acima.
**Critério de aceite:** nenhuma dessas funcionalidades aparece no código, na interface ou na documentação como algo implementado ou planejado para esta versão.

---

## Índice de rastreabilidade

| Tópico pedido | Regra(s) |
|---|---|
| Posicionamento e limites do produto | RG-01, RG-02 |
| Natureza preliminar da análise | RG-04 |
| Papel posterior de contador/profissional financeiro e advogado | RG-03, RG-05 |
| Múltiplo EBITDA 4x | RG-06, RG-07, RG-08 |
| DCF simplificado | RG-09, RG-10 |
| Distinção Enterprise Value × Equity Value | RG-11 |
| Dívida líquida | RG-14, RG-15 |
| Caixa e equivalentes | RG-13 |
| Conversão EV → Equity | RG-16, RG-17, RG-18 |
| Pesos 50/30/20 | RG-19 |
| Aplicabilidade dos métodos | RG-20, RG-21 |
| EBITDA ≤ 0 | RG-20 |
| Patrimônio Líquido ≤ 0 | RG-21 |
| Ausência total de métodos aplicáveis | RG-25, RG-26 |
| Proibição de renormalização | RG-22, RG-23 |
| Análise parcial | RG-26 |
| Índice de Prontidão Informacional | RG-27, RG-28 |
| Quatro dimensões de 25% | RG-29 |
| Pesos iguais dentro de cada dimensão | RG-30 |
| Perfil fora da pontuação | RG-31 |
| Ausência / invalidade / validade estrutural / validade com alerta | RG-32 |
| Zero como valor informado válido | RG-33, RG-41 |
| Limites da validação automática | RG-34 |
| Seis categorias documentais | RG-35 |
| Regra de pontuação documental | RG-36 |
| Documento disponibilizado × validado profissionalmente | RG-37, RG-38, RG-39 |
| Campos mínimos para análise | RG-40 |
| Diferença entre campos mínimos e checklist de Prontidão | RG-42, RG-43 |
| Papel exclusivamente qualitativo da IA | RG-44 |
| Falha da IA | RG-45 |
| Resultado desatualizado | RG-46 |
| Versionamento do modelo | RG-47 |
| Dashboard e existência real do resultado | RG-49 |
| PDF | RG-50 |
| Arredondamento | RG-51 |
| Explicabilidade | RG-52, RG-53 |
| Terminologia oficial | RG-54 |
| Disclaimer | RG-55 |
| Itens explicitamente fora do escopo | RG-56 |
