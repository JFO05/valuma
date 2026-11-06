# Plano de adaptação — landing page ValuM&A (inspirada em mynr.com.br)

> Baseado em [docs/referencia-mynr.md](./referencia-mynr.md) (Etapa 1) e na leitura da landing atual (`app/page.tsx` + `components/landing/*`), `app/globals.css` e `components/ui/reveal.tsx`. Não encontrei nenhum arquivo de Figma/design system no repositório — os tokens propostos abaixo partem do que já existe em `app/globals.css`, não de um arquivo externo.

## Diagnóstico rápido da landing atual

A landing já cobre bem mais do que eu esperava antes de ler o código — não é um retrofit do zero, é um refinamento:

| Já existe e funciona | Falta / fraco |
|---|---|
| Hero com mockup real do produto (`HeroMockup`) | Seção de problema é 4 badges de categoria, não mockups de dor como a Mynr |
| "Como funciona" com 4 etapas numeradas | São 4 etapas genéricas, não as 6 fases reais do intake (`lib/intake/fases.ts`: motor, perfil, financeiro, operação, mercado, documentos) |
| "Não entregamos apenas um número" (`SecaoExplicabilidade`) — já é a seção de transparência metodológica, inclusive em bloco escuro "ink" | Não mostra o mockup do relatório com as 3 metodologias (EBITDA/DCF/Patrimonial) |
| "Índice de Prontidão" com as 4 dimensões (`SecaoProntidao`) | OK, mas sem explicar com profundidade o que cada dimensão mede |
| "O ValuM&A prepara. Profissionais validam." (`SecaoProfissionais`) | Não existe "para quem é" (segmentos de PME) nem seção de segurança |
| Navbar fixa com âncoras + toggle de tema | **Sem menu mobile** — os links somem em `md:` e não há hambúrguer nenhum; é uma lacuna real, não só uma escolha de design |
| CTA final com imagem hero + botão para `/signup` | Sem FAQ, sem roadmap, footer é uma linha só |
| `Reveal` existe como componente | **É um no-op hoje** — o comentário no arquivo diz que o fade-up ao rolar foi removido a pedido explícito porque "estava incomodando". Isso é uma decisão de UX já tomada pela equipe, não uma omissão — ver Risco 1 abaixo antes de eu reintroduzir qualquer animação de entrada. |

Conclusão: a estratégia não é "reescrever a landing", é **reorganizar/enriquecer seções existentes + acrescentar 4 seções novas** (resultado/metodologia visual, para quem é, segurança, roadmap, FAQ) + consertar o menu mobile + fazer o footer de verdade.

---

## 1. Mapa de seções — padrão Mynr → equivalente ValuM&A

| # | Padrão da Mynr (Etapa 1) | Equivalente ValuM&A proposto | Status |
|---|---|---|---|
| — | Header fixo + CTA | Navbar atual, **+ menu mobile** | Alterar |
| 1 | Hero com mockup "ao vivo" | Hero atual — manter estrutura, trocar só o ponto verde "ao vivo" do `HeroMockup` por um indicador sutil pulsante (CSS puro) no card de resultado | Pequeno ajuste |
| 2 | Problema — 4 blocos com mockup de dor | `SecaoProblema` reconstruída: trocar os 4 badges simples por 3–4 cards com um mini-mockup HTML/CSS de dor real do dono de PME (ex.: planilha com uma célula vazia destacada, um "valor estimado: —" por falta de dado, um documento "pendente" piscando) | Reconstruir |
| 3 | "Como a Mynr lê sua operação" (mecanismo) | `SecaoComoFunciona` → vira o **stepper visual das etapas do intake**, usando os nomes reais (Motor de Análise, Perfil, Financeiro, Operação, Mercado, Documentos — 6, não 5, ver Dúvida 1) | Reconstruir |
| 5 | Mockup de painel com métricas reais | **Nova seção "O resultado"**: mockup HTML/CSS do relatório com as 3 metodologias (múltiplo de EBITDA, DCF simplificado, patrimonial) lado a lado + o Índice de Prontidão com as 4 dimensões — reaproveitando a linguagem visual de `components/resultado/valuation-breakdown.tsx` e `score-gauge.tsx` sem copiar o componente, construindo uma versão "mockup" estática pra landing (como o `HeroMockup` já faz) | Criar |
| 4 | Seção de mecanismo/transparência | `SecaoExplicabilidade` ("Não entregamos apenas um número") — **já é exatamente isso**. Só enriquecer o texto explicando o que o Índice mede (não é nota de qualidade) — resposta direta ao questionamento da banca | Enriquecer |
| 9/10 | Segmentação por tipo de empresa | **Nova seção "Para quem é"** — cards de perfil de PME. Preciso que você confirme os segmentos reais (ver Dúvida 2) | Criar — depende de você |
| 13 | Segurança e governança | **Nova seção "Segurança e privacidade"** — só reivindicações verificáveis: Supabase Auth, Row Level Security (isolamento por usuário), armazenamento de documentos em bucket protegido por RLS. Nada de "criptografia militar"/"SOC2" sem prova | Criar |
| 14 | "Como começar" (2 caminhos) | `SecaoProfissionais` já tem o fluxo ValuM&A → validação contábil → jurídica → due diligence. Pode ganhar 2 blocos de entrada: "Começar do zero" vs. "Já tenho os dados — importar Excel" (recurso real, `importar-excel-financeiro.tsx`) | Enriquecer |
| — | — | **Nova seção "Roadmap — em breve"** com o que foi cortado do MVP, **rotulado como roadmap pós-TCC**, não como disponível. Depende da sua decisão — ver Risco 2 | Criar — depende de você |
| — | FAQ (a Mynr não tem) | **Nova seção FAQ**, acordeão acessível, 6–8 perguntas reais (o que o índice mede, substitui due diligence?, dados são seguros?, quanto tempo leva, etc.) | Criar |
| 18 | CTA final | `CtaFinal` atual — manter, só linkar certo para `/signup` (sem formulário novo embutido, sem backend novo) | Manter |
| — | Footer institucional | Footer atual (1 linha) → footer de verdade com colunas (Produto: âncoras da própria landing; Conta: Entrar/Criar conta) — **sem inventar links pra páginas que não existem** (Termos/Privacidade só entram se você confirmar que serão criadas — ver Dúvida 3) | Reconstruir — parcialmente depende de você |
| 12 | Métricas de impacto | **Não vou criar uma seção de métricas numéricas** (−50%, +2 p.p. etc.) — a Mynr rotula como "meta", mas no nosso caso não temos nem meta validada publicamente; inventar números, mesmo rotulados "ilustrativo", arrisca contradizer a postura de honestidade que vocês já adotaram nos documentos da banca | **Não criar** |

---

## 2. Design tokens propostos

Partindo do que já existe em `app/globals.css` (ink `#101a2e`/`#e8ecf5` no escuro, accent dourado `#a9812f`/`#c9a24a`, zinc neutro, cream `#fafaf9` / quase-preto `#0a0a0a`):

- **Não introduzir uma terceira cor de marca.** O maior aprendizado da Mynr aplicável aqui é "cor tingida até no neutro" — a ValuM&A já faz isso (cream, não branco puro). Não vou importar o teal da Mynr nem criar um novo hue.
- **Formalizar os semânticos que já aparecem no app mas não estão nomeados em `globals.css`**: verde (sucesso/"Resultado gerado"), âmbar (atenção/"Desatualizado"), ambos já usados em `components/intake/intake-sidebar.tsx` e no dashboard via classes Tailwind soltas (`amber-500`, etc.). Proponho adicionar 3 tokens novos no `@theme inline`:
  ```css
  --color-success: #16a34a;   /* ou tom já usado no dashboard, a confirmar */
  --color-warning: #a9812f;   /* reaproveita o próprio accent dourado — já é usado como "Desatualizado" */
  --color-danger:  #c64545;
  ```
  Isso é consolidação, não invenção — só nomeio o que já está espalhado em classes Tailwind cruas.
- **Raio e sombra**: já há um vocabulário implícito nos componentes (`rounded-2xl`, `rounded-[1.75rem]`, `rounded-[2rem]`, `.shadow-premium`). Vou padronizar: `rounded-2xl` (1rem) para cards de conteúdo, `rounded-[1.75rem]` para cards de destaque (resultado/CTA), mantendo `.shadow-premium` já definida — **sem criar nova classe de sombra**.
- **Tipografia**: manter Geist Sans (já carregada via `next/font` em `app/layout.tsx`, não vou trocar fonte) — a "voz" Mynr (Space Grotesk bold nos headlines) vira, pra nós, só um reforço do peso/tracking que a landing atual já usa (`font-semibold tracking-tight`), sem trocar de família.

---

## 3. Componentes a criar/alterar

| Arquivo | Ação |
|---|---|
| `components/landing/landing-navbar.tsx` | Alterar — adicionar menu mobile (`"use client"` já existe) |
| `components/landing/secao-problema.tsx` | Reescrever — mockups de dor em vez de badges |
| `components/landing/secao-como-funciona.tsx` | Reescrever — stepper das 6 fases reais do intake |
| `components/landing/secao-resultado.tsx` | **Novo** — mockup do relatório (3 metodologias + Índice de Prontidão) |
| `components/landing/secao-explicabilidade.tsx` | Alterar — enriquecer texto |
| `components/landing/secao-para-quem-e.tsx` | **Novo** — depende da Dúvida 2 |
| `components/landing/secao-seguranca.tsx` | **Novo** |
| `components/landing/secao-roadmap.tsx` | **Novo** — depende do Risco 2 |
| `components/landing/secao-faq.tsx` | **Novo** — acordeão, `"use client"` só pro estado aberto/fechado |
| `components/landing/secao-profissionais.tsx` | Alterar — enriquecer com 2 blocos de entrada |
| `components/landing/cta-final.tsx` | Manter como está |
| `components/landing/landing-footer.tsx` | **Novo** (extrair do inline atual em `app/page.tsx`) |
| `app/page.tsx` | Alterar — nova ordem de seções |
| `app/globals.css` | Alterar — 3 tokens semânticos novos |

Nenhuma rota, middleware ou fluxo de auth é tocado — `/signup`, `/login`, `/dashboard`, `/intake` ficam intactos, só reaproveitados via `<Link>`.

---

## 4. Animações

Proposta: **só CSS + `IntersectionObserver` nativo, zero biblioteca nova** (confirmei no `package.json` — não há `framer-motion`, `gsap` nem lib de ícones hoje; o projeto usa glifos/emoji inline, ex. `✓`, `🔒`, `↗`). Isso responde à sua regra 3 sem precisar de decisão seguida — mas **preciso da sua decisão sobre o Risco 1 abaixo antes de reativar qualquer animação de entrada**.

Se aprovado, o padrão seria:
- Indicador "ao vivo" sutil (ponto pulsando, `@keyframes` + `animation: pulse 2s infinite`, 1 elemento só, igual ao padrão Mynr de "poucos elementos pulsando devagar").
- Barra de progresso (Índice de Prontidão no mockup) anima a largura de 0% até o valor real só uma vez, ao entrar na viewport (`IntersectionObserver` + `transition: width`), reaproveitando o mesmo `cubic-bezier(0.32,0.72,0,1)` que `score-gauge.tsx` já usa — fica consistente com o app de verdade.
- `@media (prefers-reduced-motion: reduce)` desativando tudo isso — é exatamente o ponto fraco real da Mynr (Etapa 1, item E.1) que vamos fazer certo.
- **Sem fade-up genérico disparado por scroll em todo bloco** — é justamente o que foi removido antes por incomodar.

---

## 5. Riscos e dúvidas — preciso da sua resposta antes da Etapa 3

1. **Animação de entrada**: o `Reveal` foi deliberadamente zerado porque o fade-up ao rolar "estava incomodando" (comentário no próprio código). Meu plano acima só propõe 2 micro-animações pontuais (pulso + barra de progresso), nunca fade-up em bloco inteiro. **Confirma que esse nível é aceitável, ou prefere manter 100% estático como está hoje (nem o pulso nem a barra animada)?**
2. **Roadmap "em breve"**: publicar publicamente, na landing, os itens cortados do MVP (contador/advogado, documentos automáticos, pagamentos, white-label, matchmaking, due diligence automatizada) pode levantar a mesma pergunta que a banca já fez sobre complexidade/viabilidade — só que agora pública, antes mesmo da apresentação. **Quer mesmo essa seção agora (antes da banca de novembro), ou prefere adicionar só depois de dezembro, quando o escopo completo volta a ser o foco real?** Se quiser manter, também preciso saber quais itens específicos entram nessa lista pública (nem tudo que está em `[[valuma-escopo-mvp-vs-produto-final]]` precisa virar promessa pública).
3. **Segmentos de "Para quem é"**: não tenho uma lista real de segmentos-alvo (setor, porte, faturamento) documentada em nenhum arquivo do projeto. Preciso que você me diga quais 3–5 perfis de PME vocês realmente têm em mente, pra eu não inventar personas.
4. **Footer — Termos de Uso / Política de Privacidade**: não existem essas páginas no projeto hoje. Posso (a) deixar o footer sem esses links por enquanto, ou (b) criar páginas simples de Termos/Privacidade como parte da Etapa 3. Qual prefere? (Criar essas páginas de verdade é mais trabalho e sai um pouco do escopo "landing", por isso pergunto antes.)
5. **Cores semânticas (sucesso/alerta)**: proponho formalizar 3 tokens (`--color-success`, `--color-warning`, `--color-danger`) em `globals.css`. O `--color-warning` reaproveita o dourado já existente (mesma cor do "Desatualizado" no dashboard) — **confirma esse reaproveitamento, ou prefere uma cor de alerta separada do dourado de marca** (já que hoje o dourado faz dupla função de "acento de marca" e "alerta")?
6. **"Como funciona" com 6 etapas**: você mencionou "as 5 etapas do intake" no seu pedido original, mas o código tem 6 fases (`motor`, `perfil`, `financeiro`, `operacao`, `mercado`, `documentos`). **Mostro as 6 reais, ou tem uma agrupamento em mente (ex.: fundir "Motor" dentro de "Perfil" visualmente pra ficar 5 blocos)?**

Nenhuma biblioteca nova é necessária para nada do que está proposto acima — se alguma dúvida acima mudar isso (ex. se quiser ícones de verdade em vez de glifos), aviso antes de instalar qualquer coisa, como combinado.

**Aguardando sua aprovação (e respostas às 6 dúvidas) antes de começar a Etapa 3.**

---

## Decisões tomadas (você pediu para seguir como eu achasse melhor)

Critério usado em todas: menor risco, nada inventado, consistência com o que o código já faz.

1. **Animação** → aprovado o nível mínimo já proposto: pulso sutil (1 elemento) + barra de progresso animando uma vez ao entrar na viewport, sempre com `prefers-reduced-motion` respeitado. **Sem** fade-up em bloco — é o padrão que a equipe já removeu por incomodar.
2. **Roadmap "em breve"** → **não vou criar essa seção agora**. Publicar publicamente, antes da banca de novembro, uma lista dos itens cortados do MVP arrisca contradizer a própria narrativa de "corte consciente de escopo" que vocês vão defender — ver [[valuma-escopo-mvp-vs-produto-final]]. Fica fora da landing até depois de dezembro, quando reavaliamos junto com o escopo completo.
3. **"Para quem é"** → em vez de inventar segmentos por setor/faturamento (dado que não existe), vou segmentar por **situação real do dono de PME** (quer vender, quer captar investidor, está organizando sucessão, quer só entender se está pronto) — isso é derivável do que o produto de fato faz, não é pesquisa de mercado fabricada.
4. **Footer / Termos / Privacidade** → **não vou criar** essas páginas nem linkar pra elas. Escrever texto legal de verdade (privacidade, tratamento de dados) tem risco real se for impreciso; fica fora do escopo "landing" e deve ser uma decisão separada, feita com calma, não encaixada aqui.
5. **Cor de alerta/sucesso** → revisado: o projeto **já tem** `components/ui/badge.tsx` com variantes `sucesso` (emerald), `atencao` (amber), `erro` (red), `destaque` (dourado da marca) e `neutro` — é o padrão real já usado no dashboard. Vou reaproveitar esse componente nas seções novas em vez de criar tokens CSS novos em `globals.css` (minha proposta original na seção 2 estava redundante com algo que já existe — corrigido).
6. **"Como funciona" com 6 etapas** → vou mostrar as **6 fases reais** (Motor de Análise, Perfil, Financeiro, Operação, Mercado, Documentos), sem fundir nada — representar errado o próprio fluxo do produto não vale a troca por um número "mais redondo".
