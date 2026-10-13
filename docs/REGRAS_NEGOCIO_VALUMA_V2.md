# ValuM&A — Regras de Negócio v2.0 (extensão da v1.0)

**Versão:** 2.0
**Status:** IMPLEMENTADA E CONGELADA PARA A MONOGRAFIA
**Data:** 2026-10-06
**Finalidade:** registrar as regras **novas** introduzidas pela evolução V2 do produto (Motor de Análise com modelo Essencial/Configurável, anos financeiros dinâmicos, reposicionamento visual da análise qualitativa). Este documento **estende** `docs/REGRAS_NEGOCIO_VALUMA_V1.md` — nenhuma regra da v1.0 foi alterada, revogada ou reinterpretada. Onde a v2.0 refina o comportamento de uma regra v1 (ex.: RG-07, RG-40, RG-54), isso é dito explicitamente, mas a regra original permanece válida e vigente. Onde a v2.0 **substitui** o efeito prático de uma regra v1 sob uma condição específica (Motor Configurável selecionado), isso também é declarado explicitamente, com a condição de ativação — nunca como uma revogação geral.

A numeração continua a sequência da v1.0 (que terminou em RG-56): esta versão começa em **RG-57**.

---

## F. Motor de Análise

### RG-57 — Dois motores disponíveis: Essencial e Configurável

**Regra:** todo processo tem um Motor de Análise associado, escolhido na primeira etapa do intake (antes de Perfil). Existem dois motores selecionáveis — **Essencial** (padrão) e **Configurável** — e um terceiro, **Especialista**, visível na interface como "em evolução" mas **não selecionável** e sem nenhuma fórmula avançada implementada (ver RG-62).
**Justificativa:** requisito de produto da V2 — tornar o motor de cálculo configurável sem forçar todo usuário a entender parâmetros financeiros; o Essencial preserva a simplicidade do MVP original para quem só quer uma estimativa rápida.
**Impacto esperado:** nova fase `"motor"` em `lib/intake/fases.ts`, primeira do fluxo; `components/intake/motor-form.tsx`.
**Critério de aceite:** criar um processo novo sempre aterrissa em `/intake/{id}/motor`, com Essencial pré-selecionado.

### RG-58 — Motor Essencial é numericamente e funcionalmente equivalente ao comportamento v1

**Regra:** o Motor Essencial usa exatamente as premissas congeladas da v1.0: múltiplo de EBITDA 4,0x, DCF simplificado com crescimento 3% a.a., taxa de desconto 15% a.a., horizonte de 5 anos, e consolidado ponderado 50% Múltiplos / 30% DCF / 20% Patrimonial. Nenhum destes valores é alterável no Essencial.
**Justificativa:** requisito explícito da V2 — a introdução do Motor Configurável não pode, por efeito colateral, mudar o resultado de quem não pediu para configurar nada.
**Impacto esperado:** `CONFIGURACAO_ESSENCIAL` (`lib/valuation/calcular.ts`) é construída a partir das mesmas constantes que já existiam; `calcularValuation(dados, config = CONFIGURACAO_ESSENCIAL)`.
**Critério de aceite:** com o Motor Essencial, `calcularValuation` produz o mesmo resultado numérico que a versão pré-V2 para os mesmos dados de entrada (verificado em `scripts/testar-valuation.ts` e `scripts/testar-motor.ts`, cenário "três métodos aplicáveis").

### RG-59 — Motor Configurável: o que pode e o que não pode ser ajustado

**Regra:** no Motor Configurável, o usuário escolhe quais dos três métodos (Múltiplos, DCF, Patrimonial) participam do consolidado, e pode ajustar: múltiplo de EBITDA, crescimento anual do DCF, taxa de desconto do DCF, horizonte do DCF (anos), e o peso (%) de cada método ativo. As **condições de aplicabilidade de cada método não são configuráveis e nunca são removidas**:
- Múltiplos e DCF continuam exigindo EBITDA-base > 0 (RG-20 da v1.0);
- Patrimonial continua exigindo Patrimônio Líquido > 0 (RG-21 da v1.0);
- a proibição de renormalizar pesos entre métodos que se tornem inaplicáveis por dado (RG-22 da v1.0) também continua valendo dentro do Motor Configurável: se um método **ativo** ficar inaplicável (ex.: EBITDA-base ≤ 0), seu peso configurado não é redistribuído entre os métodos restantes — o consolidado simplesmente fica indisponível.

Estas três regras (RG-20, RG-21, RG-22) valem da mesma forma nos dois motores e não são afetadas pela escolha de nenhum deles.
**Justificativa:** decisão de produto da V2, enunciada como princípio orientador do Motor Configurável: "tornar os parâmetros configuráveis não elimina as condições de aplicabilidade de cada método". Configurabilidade é sobre premissas numéricas, não sobre as regras que dizem quando um método faz sentido.
**Impacto esperado:** `aplicabilidade.consolidadoDisponivel` em `calcularValuation` combina "método ativo" E "método aplicável" para cada um dos três métodos antes de formar o consolidado; nenhuma renormalização de peso é aplicada em nenhum caminho de código.
**Critério de aceite:** com EBITDA-base ≤ 0, ativar e configurar Múltiplos ou DCF no motor Configurável continua produzindo `null` para aquele método, e o consolidado fica indisponível sem redistribuir o peso configurado para os demais métodos ativos — verificado em `scripts/testar-motor.ts` ("EBITDA negativo com Múltiplos selecionado", "... com DCF selecionado", "Método desativado não participa do consolidado").

### RG-60 — Precedência do Motor Configurável sobre RG-19/RG-23/RG-24 da v1.0, condicionada à seleção desse motor

**Regra:** as regras a seguir da v1.0 têm seu efeito prático substituído **exclusivamente enquanto o Motor Configurável estiver selecionado** para aquele processo — nunca no Motor Essencial, onde continuam valendo exatamente como escritas na v1.0:

| Regra v1.0 | Efeito na v1.0 (e no Motor Essencial) | Efeito no Motor Configurável |
|---|---|---|
| RG-19 — Pesos do consolidado | Fixos em 50% Múltiplos / 30% DCF / 20% Patrimonial | Os pesos configurados pelo usuário para os métodos ativos (RG-59), desde que somem 100% (RG-61) |
| RG-23 — Vedação a um consolidado "alternativo" com menos de três métodos | Com 1 ou 2 métodos aplicáveis, nenhum valor pode ser apresentado como "o consolidado" | Um consolidado formado só pelos métodos que o usuário ativou (podendo ser 1, 2 ou 3) é o consolidado oficial daquela configuração — deixa de ser uma "alternativa não oficial" |
| RG-24 — O consolidado só existe quando os três métodos são aplicáveis | Exige Múltiplos, DCF **e** Patrimonial simultaneamente aplicáveis | Exige que todos os métodos **ativados** pelo usuário (não necessariamente os três) estejam simultaneamente aplicáveis |

**Justificativa:** o Motor Configurável, por definição, permite operar com um subconjunto dos três métodos — isso entraria em contradição direta com RG-19/RG-23/RG-24 se essas regras fossem lidas como absolutas e não condicionadas ao motor em uso. Declarar a precedência por escrito, com a condição de ativação explícita, evita tanto a leitura de que o Configurável "viola" a v1.0 quanto a leitura oposta de que RG-19/RG-23/RG-24 teriam sido revogadas de forma geral — elas não foram: continuam em vigor integralmente para o Motor Essencial.
**Impacto esperado:** nenhuma mudança de código adicional além da já descrita em RG-59/RG-61 — esta regra formaliza por escrito uma relação de precedência que a implementação de `calcularValuation`/`configuracaoMotorValida` já expressa estruturalmente (o motor determina qual `ConfiguracaoMotor` é usada).
**Critério de aceite:** para qualquer processo com Motor Essencial, o comportamento observado é idêntico ao de RG-19/RG-23/RG-24 da v1.0, sem exceção. Para qualquer processo com Motor Configurável, o comportamento observado segue a coluna "Motor Configurável" da tabela acima, nunca os valores fixos da v1.0.

### RG-61 — Pesos dos métodos ativos devem somar exatamente 100%

**Regra:** no Motor Configurável, a soma dos pesos dos métodos **ativos** deve ser exatamente 100% (tolerância de 0,1 ponto percentual para arredondamento) e pelo menos um método deve estar ativo. Enquanto essa condição não for satisfeita, a configuração é inválida.
**Justificativa:** um consolidado ponderado sem soma de pesos = 100% não tem leitura econômica coerente (não é nem uma média ponderada válida).
**Impacto esperado:** `configuracaoMotorValida(tipo, config)` em `lib/valuation/motor.ts`; usada tanto no front-end (bloqueio de navegação) quanto no backend (`gerar-resultado/route.ts`, retorna 422 se inválida).
**Critério de aceite:** com pesos somando 80% ou 120%, ou com 0 métodos ativos, a navegação para a próxima etapa do intake fica bloqueada (mensagem "Ative pelo menos 1 método e ajuste os pesos para totalizar 100% antes de continuar") e a tentativa de gerar resultado via API retorna HTTP 422. Verificado em `scripts/testar-motor.ts` (casos de soma < 100%, > 100% e 0 métodos ativos) e em revisão funcional em navegador (desativar um método sem reajustar peso bloqueia o avanço; reajustar para 100% libera).

### RG-62 — Motor Especialista: reservado, não implementado

**Regra:** a opção "Especialista" aparece na tela de seleção do motor como presente no roadmap do produto, visivelmente desabilitada ("em evolução"), sem nenhuma fórmula avançada (WACC completo, Gordon Growth, valor terminal, múltiplos setoriais automáticos, parser de fórmulas arbitrárias, integração com APIs financeiras externas) implementada nesta versão.
**Justificativa:** requisito explícito da V2 — comunicar a existência do roadmap sem prometer uma funcionalidade que não existe.
**Impacto esperado:** `CardMotorDesabilitado` em `components/intake/motor-form.tsx`, `aria-disabled="true"`, sem `onClick`.
**Critério de aceite:** não existe nenhum caminho de código que permita selecionar "Especialista" como `tipo` do motor (o schema `motorSchema` só aceita `"essencial" | "configuravel"`).

### RG-63 — Snapshot do motor é persistido por resultado, não lido ao vivo

**Regra:** ao gerar um resultado, a configuração do motor usada no cálculo (tipo + premissas numéricas efetivamente aplicadas) é congelada em `resultados.motor_snapshot` (jsonb). A tela de resultado sempre exibe o motor que **gerou aquele resultado específico**, não o estado atual (possivelmente já alterado) da etapa "Motor de Análise" do intake.
**Justificativa:** sem isso, mudar o motor depois de gerar um resultado reescreveria silenciosamente a explicação de como aquele número foi calculado.
**Impacto esperado:** `ResultadoValuation.motorSnapshot`; `ComoChegamos` usa `resultado.motorSnapshot`, nunca a etapa "motor" do intake ao vivo, para montar a seção "Motor utilizado".
**Critério de aceite:** mudar o motor na etapa de intake após gerar um resultado não altera o texto da seção "Motor utilizado" do resultado já existente — apenas marca esse resultado como desatualizado (RG-46 da v1.0, mecanismo de stale já existente, sem código novo: qualquer alteração em qualquer fase do intake, "motor" incluída, já atualiza `intake_data.atualizado_em`).
**Verificado:** sim — revisão funcional em navegador confirmou que alternar o motor marca o resultado existente como desatualizado (banner "Os dados foram alterados após a última análise").

### RG-64 — Resultados anteriores ao Motor de Análise são tratados como Motor Essencial

**Regra:** resultados gerados antes da existência do Motor de Análise (sem `motor_snapshot` gravado) são interpretados, para fins de exibição, como se tivessem sido gerados pelo Motor Essencial — nunca reinterpretados como "Configurável" nem perdem a possibilidade de visualização.
**Justificativa:** compatibilidade retroativa explícita exigida como requisito da V2 — nenhum resultado antigo pode quebrar ou exibir informação incorreta por causa da nova coluna.
**Impacto esperado:** `MOTOR_SNAPSHOT_LEGADO` (`lib/valuation/motor.ts`); usado como fallback em `ComoChegamos` e em `ValuationDestaque` (prop `motorTipo` default `"essencial"`), com uma nota textual explícita informando que o resultado foi gerado antes do Motor de Análise existir.
**Critério de aceite:** abrir a tela de resultado de um processo cujo `resultados.motor_snapshot` é `null` não lança erro, exibe "Motor Essencial" na seção "Motor utilizado", e mostra a nota de compatibilidade.
**Verificado:** sim — testado ao vivo contra um resultado real do banco de produção (`modelo_versao = 'valu_ma_v1'`, `motor_snapshot = null`) pertencente a outro usuário (bloqueado corretamente por RLS, 404) e, de forma controlada, contra um resultado de teste descartável com `motor_snapshot` zerado manualmente — renderizou corretamente em ambos os aspectos checáveis.

---

## G. Dados financeiros — anos dinâmicos e ano-base

### RG-65 — Quantidade de anos no DRE é dinâmica (mínimo 1)

**Regra:** a etapa Financeiro deixa de exigir exatamente 3 exercícios de DRE. O usuário pode adicionar quantos anos quiser e remover qualquer um, respeitado o mínimo de 1 ano. Não é permitido repetir o mesmo ano dentro do mesmo processo.
**Justificativa:** decisão de produto da V2 — flexibilizar o preenchimento financeiro, já que nem toda empresa tem (ou quer informar) exatamente 3 anos de histórico.
**Impacto esperado:** `financeiroSchema.dre` passa de `.length(3)` para `.min(1)` + `.refine` de unicidade de ano; `DreFieldset` ganha os controles "+ Adicionar outro ano" / "Remover ano".
**Critério de aceite:** é possível gerar um resultado com 1, 2, 4 ou qualquer outro número de anos de DRE, desde que o ano-base (RG-66) tenha EBITDA informado (RG-40 da v1.0, inalterada).
**Verificado:** sim — adicionar, remover e tentar duplicar um ano foram testados em navegador contra o servidor de desenvolvimento.

### RG-66 — Definição formal do "ano-base" sob anos financeiros dinâmicos

**Regra:** o **ano-base** é o exercício do DRE — dentre todos os anos cadastrados no processo, independentemente de quantos existirem — com o maior valor do campo `ano` que satisfaça pelo menos uma destas condições: receita bruta estritamente positiva (`> 0`), ou EBITDA explicitamente informado (qualquer valor, incluindo zero ou negativo). O ano-base é identificado **pelo valor do campo `ano`, nunca por posição/índice no array**.

Quanto ao EBITDA, esta definição **prevalece sobre a redação literal da RG-07 da v1.0** ("receita bruta ou EBITDA diferentes de zero"): um ano cujo EBITDA foi explicitamente informado como zero, ou como um valor negativo, conta como ano com dado real para fins de ano-base — não se exige que o EBITDA seja "diferente de zero", apenas que tenha sido informado. Isso está em coerência com RG-33/RG-41 da v1.0 (zero e negativo explicitamente informados são informação fornecida, nunca ausência). A condição de receita bruta, por outro lado, continua sendo avaliada por valor estritamente positivo — receita bruta igual a zero, isoladamente, não torna um ano candidato a ano-base; só um EBITDA explicitamente informado (de qualquer sinal) ou uma receita bruta positiva fazem isso.

Quando nenhum ano cadastrado satisfaz nenhuma das duas condições, **não existe ano-base**.

**Justificativa:** a RG-07 da v1.0 foi escrita sob um DRE de 3 posições fixas e não previa, na sua redação, a distinção entre "diferente de zero" e "informado" que a própria v1.0 já consagrava para outros campos via RG-33/RG-41. Esta regra fecha essa lacuna de coerência interna, alinhando a identificação do ano-base à mesma convenção de "informado" usada no resto do produto — sem alterar nenhum comportamento de código (a implementação já seguia esta convenção antes mesmo desta redação existir).
**Impacto esperado:** `anosDreComDados()` em `lib/valuation/types.ts`: `dre.filter((ano) => ano.receitaBruta > 0 || informadoExplicitamente(ano.ebitda)).sort((a, b) => a.ano - b.ano)`; o ano-base é o último elemento (`.at(-1)`) desse resultado ordenado por `.ano` crescente.
**Critério de aceite:** um ano com receita bruta = 0 e EBITDA = 0 explicitamente informado é reconhecido como tendo dado real (candidato a ano-base); um ano com todos os campos do DRE em branco (nunca preenchidos) não é.
**Verificado:** sim — comportamento coberto indiretamente por `scripts/testar-regras-negocio.ts` (casos de EBITDA = 0 explicitamente informado) e confirmado por leitura direta do código de `anosDreComDados`.

### RG-67 — Ano-base no preenchimento manual

**Regra:** na etapa Financeiro, o ano-base (RG-66) é recalculado ao vivo a partir do estado atual do formulário a cada alteração de campo — nunca fixado no momento em que o processo foi criado, nem amarrado à posição em que o ano aparece na tela.
**Justificativa:** decisão de produto da V2 — anos dinâmicos (RG-65) tornam a posição de um ano no formulário mutável (adicionar ou remover um ano desloca os demais); o ano-base precisa ser recalculado a cada alteração para continuar correto.
**Impacto esperado:** `components/intake/financeiro-form.tsx` deriva `anoBase = anosDreComDados(dados.dre ?? []).at(-1)` a partir do `watch()` do formulário a cada render, não de um valor memorizado na criação do processo.
**Critério de aceite:** preencher o EBITDA de um ano que não está na primeira posição da lista faz esse ano, se for o mais recente com dado, ser reconhecido como ano-base.
**Verificado:** sim — revisão funcional em navegador (edição de ano fora da posição 0 do array).

### RG-68 — Ano-base na importação via Excel

**Regra:** cada ano importado de uma planilha Excel carrega seu próprio campo `ano` — a importação não é posicional. Ao mesclar com os anos já existentes no formulário, o casamento é feito por **valor de `ano`**: um ano importado cujo valor já existe no formulário atualiza os campos daquele ano existente; um ano importado cujo valor não existe no formulário é inserido como um novo ano, na posição ordenada correta (mais recente → mais antigo). O ano-base após a importação segue a mesma RG-66, aplicada ao conjunto já mesclado.
**Justificativa:** decisão de produto da V2 — o modelo de planilha usa um layout transposto (Indicador × colunas de ano) em vez de 3 colunas fixas; a importação precisa reconhecer anos pelo valor declarado na planilha, não pela posição da coluna.
**Impacto esperado:** `aplicarImportacaoExcel` em `components/intake/financeiro-form.tsx` usa `getValues("dre").findIndex((a) => a.ano === anoImportado.ano)` para decidir entre atualizar um ano existente (`setValue` campo a campo) ou inserir um ano novo (`insert` na posição ordenada).
**Critério de aceite:** importar uma planilha com anos que não coincidem com os já existentes insere esses anos preservando seus próprios valores de `ano`, sem sobrescrever um ano existente só por ocupar a mesma linha/posição no arquivo.
**Verificado:** sim — revisão funcional em navegador (download do modelo, inspeção do layout transposto) e leitura direta do código de `aplicarImportacaoExcel`.

### RG-69 — Ano-base na navegação do intake

**Regra:** o gate de campos mínimos (RG-40/RG-41 da v1.0) que bloqueia o avanço para a próxima etapa até o EBITDA do ano-base estar informado identifica esse ano-base pela RG-66, recalculado a cada tentativa de avanço — nunca um campo de índice fixo (ex.: "sempre o primeiro ano da lista"). Quando existe um ano-base, o campo de EBITDA daquele ano específico é destacado (asterisco + borda vermelha ao tentar avançar sem preenchê-lo). Quando não existe ano-base, o destaque recai sobre o fieldset inteiro do DRE (`financeiro.dre`), por não haver um campo individual para apontar.
**Justificativa:** decisão de produto da V2 — com anos dinâmicos, não existe mais um índice de array que seja sempre "o ano-base"; o destaque do campo obrigatório precisa ser recalculado com a mesma regra usada pelo cálculo (RG-66), nunca fixado por posição.
**Impacto esperado:** `lib/valuation/campos-obrigatorios.ts`: `const anoBase = anosDreComDados(dados.financeiro.dre).at(-1)`; `const indiceAnoBase = anoBase ? dados.financeiro.dre.indexOf(anoBase) : -1`; a pendência aponta para `financeiro.dre.${indiceAnoBase}.ebitda` quando há ano-base, ou para `financeiro.dre` (fieldset inteiro) quando não há.
**Critério de aceite:** com nenhum ano tendo dado real informado, a pendência de EBITDA aponta para o fieldset `financeiro.dre` inteiro, não para um campo inexistente ou arbitrariamente escolhido (ex.: sempre índice 0).
**Verificado:** sim — `scripts/testar-regras-negocio.ts` cobre o caso de ausência de ano-base (campo de pendência esperado = `"financeiro.dre"`).

### RG-70 — Anos adicionais não alteram a contagem de itens de Prontidão

**Regra:** dentro da dimensão Financeiro do Índice de Prontidão (**31 itens no total**), **24 itens correspondem ao DRE** — calculados sobre os 3 anos mais recentes **por valor do campo `ano`** (nunca por posição no array), independentemente de quantos anos existirem no total. Os outros **7 itens** da dimensão Financeiro (ativo total, ativo circulante, passivo total, passivo circulante, patrimônio líquido, caixa e equivalentes de caixa, situação de dívida financeira) não dependem da quantidade de anos do DRE. Anos financeiros adicionais além dos 3 mais recentes não criam itens extras em nenhum dos dois grupos — as contagens de 24 (DRE) e 31 (Financeiro total) são fixas.
**Justificativa:** sem essa regra, um usuário que cadastrasse 10 anos de DRE teria uma pontuação de Prontidão artificialmente diferente de quem cadastrasse 3 — o índice mediria quantidade de dados, não qualidade/completude do essencial.
**Impacto esperado:** `itensDre()` em `lib/prontidao/checklist.ts` usa um helper `anoNoSlot(dre, slot)` que ordena por `.ano` decrescente e considera só os 3 anos de maior valor (`CAMPOS_DRE_NAO_NEGATIVOS`: 5 campos + `CAMPOS_DRE_COM_SINAL`: 2 campos + EBITDA: 1 campo = 8 itens por slot × 3 slots = 24); `ITENS_BALANCO` (7 itens) não varia com a quantidade de anos do DRE. O link ("âncora") de uma pendência de DRE aponta para o fieldset inteiro (`financeiro.dre`), não mais para um campo específico — uma simplificação deliberada, documentada no código, aceita como trade-off.
**Critério de aceite:** gerar Prontidão para um processo com 5 anos de DRE preenchidos produz a mesma contagem de itens (24 de DRE, 31 no total da dimensão Financeiro) que um processo com 3 anos.
**Verificado:** sim — suíte automatizada `scripts/testar-prontidao.ts` (todas as asserções passando); contagem de 24 + 7 = 31 conferida diretamente no código de `lib/prontidao/checklist.ts`.

---

## H. Terminologia e apresentação da análise qualitativa

### RG-71 — "Análise Estratégica" substitui "Análise de IA" na interface

**Regra:** nenhuma tela do produto usa os termos "Análise de IA", "Chat com IA" ou expressões equivalentes que apresentem "IA" como o produto/título de uma seção. A seção de interpretação qualitativa é chamada de **"Análise Estratégica"**; o rótulo do chat já usava "Pergunte sobre sua análise" e foi mantido. A IA continua sendo o mecanismo técnico por trás da interpretação — isso não é escondido do usuário, apenas não é usado como nome de produto/seção. Esta regra estende o glossário de rótulos obrigatórios da v1.0 (RG-54).
**Justificativa:** decisão de produto da V2 sobre terminologia da interface — marcar a tecnologia como "IA" no nome da seção soa mais como rótulo de marketing do que como comunicação do que a seção realmente entrega (leitura qualitativa sobre os dados fornecidos).
**Impacto esperado:** `app/(app)/processos/[processoId]/resultado/page.tsx` (heading renomeado), `components/resultado/analise-ia-cards.tsx` (texto de apoio neutralizado, bordas coloridas por seção removidas — visual agora é graphite/zinc neutro com separadores discretos em vez de três cards coloridos).
**Critério de aceite:** nenhuma ocorrência de "Análise de IA" ou do nome anterior "Nossa Visão sobre o seu negócio" em `app/` ou `components/`.
**Verificado:** sim — `grep` confirmado vazio para os termos antigos, e checagem visual em navegador confirmando o heading "Análise Estratégica".

---

## Observação final

Esta extensão não modifica nenhuma constante, fórmula ou condição de aplicabilidade herdada da v1.0 — ela adiciona uma camada de configuração em torno delas (Motor Configurável, sob a precedência explícita e condicionada de RG-60) e uma camada de flexibilidade de entrada (anos dinâmicos, sob a definição formal de ano-base de RG-66 e sua aplicação por canal em RG-67/RG-68/RG-69), mantendo o Motor Essencial como ponto de partida padrão e numericamente e funcionalmente equivalente ao comportamento original.
