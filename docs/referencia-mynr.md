# Auditoria de referência — mynr.com.br

> **Nota de método**: este ambiente não tem uma ferramenta de browser com captura visual (sem Chrome/computer-use habilitado aqui). A auditoria foi feita com duas fontes complementares: (1) leitura do conteúdo renderizado via fetch+IA para estrutura e textos, e (2) leitura direta do HTML/CSS real que o Framer entrega no primeiro carregamento (grep sobre o HTML cru) para cores, tipografia, espaçamento, bordas, sombras e animações — por isso os valores de cor/tipografia abaixo são **reais, extraídos do CSS do site**, não estimados visualmente. O que não dá pra confirmar sem renderização visual de verdade (ex.: comportamento exato em 390/768/1440px lado a lado, timing percebido de uma animação) está marcado como **inferido**, não como fato.

---

## A. Estrutura e narrativa

Ordem completa das seções, do topo ao rodapé, com o objetivo de cada uma na jornada:

| # | Seção | Objetivo na jornada |
|---|---|---|
| — | Header fixo (logo, Home / Soluções / Segmentos, Login, CTA "Iniciar demo") | Orientação + CTA sempre acessível |
| 1 | Hero — "O núcleo de toda a sua operação" | Atenção — promessa central + prova ao vivo (mockup) |
| 2 | Problema — "O lucro se perde no meio do caminho" (4 blocos de dor) | Problema — gerar identificação/desconforto |
| 3 | "Tudo o que a sua operação precisa, em um só núcleo" (4 cards + bloco fiscal) | Solução — visão geral dos módulos |
| 4 | "Como a Mynr lê a sua operação" (diagrama de convergência de fontes) | Solução — explicar o mecanismo |
| 5 | "Veja a operação inteira em um só lugar" (mockup do painel "Grupo Aurora") | Prova — produto real, dados simulados plausíveis |
| 6 | "Agentes de IA que pensam, executam e respondem" (mockup de chat) | Solução — diferencial de IA em ação |
| 7 | "Conexão MCP" (ChatGPT/Claude/Gemini) | Confiança/diferencial técnico — interoperabilidade |
| 8 | "Alguns agentes que já entregamos" (6 cards) | Prova — catálogo concreto |
| 9 | "Feita para empresas que são indústria, varejo e distribuidora ao mesmo tempo" | Prova — caso de uso composto, com aviso "exemplo ilustrativo" |
| 10 | "Feita para operações complexas" (5 segmentos) | Segmentação — ajudar o visitante a se reconhecer |
| 11 | Faixa de integração com marketplaces (logos) | Confiança — compatibilidade |
| 12 | "O impacto da Mynr em números" (6 métricas) | Prova quantitativa (rotuladas como metas, não resultados reais de cliente) |
| 13 | "Segurança e governança em primeiro lugar" | Confiança — segurança/compliance |
| 14 | "Como começar" (Integração vs. Migração assistida) | Redução de fricção/objeção |
| 15 | "Projetos personalizáveis" (4 etapas) + CTA "Falar com um especialista" | Processo — o que esperar depois do contato |
| 16 | "Integrações com o que você já usa" (filtros + cards) | Confiança — ecossistema |
| 17 | Citação sem autor + CTA "Proteger minha margem" | Reforço emocional antes da conversão final |
| 18 | CTA final — "Quer enxergar onde o dinheiro se perde?" | Conversão |
| — | Footer (razão social, endereço, e-mail, colunas de links, copyright) | Institucional/legal |

**Como o hero funciona:**
- Headline: "O núcleo de toda a sua operação" (Space Grotesk 700, 40px no HTML base, provavelmente maior em desktop via breakpoint).
- Subtítulo: fala em gestão completa, inteligência de margem e agentes de IA — resume os 3 pilares do produto já na primeira dobra.
- Banner secundário acima da headline: "Conheça os agentes de IA da Mynr" com link-âncora "Saiba mais" (`#agentes`) — um teaser de feature nova, não o CTA principal.
- CTA primário: "Conhecer o Ecossistema" (âncora `#ecossistema`, **não** leva direto ao formulário — a conversão principal é adiada para depois de educar).
- Elemento visual: mockup de painel "ao vivo" com contador "12.847 eventos lidos hoje", fontes de dados conectadas e cards de agentes/previsão de caixa — mostra o produto funcionando, não uma ilustração abstrata.

**Como apresenta o problema → transição pra solução:**
A seção de problema usa 4 blocos, cada um com um mockup realista de uma dor específica (números divergentes entre sistemas, planilha com fórmula quebrada `#REF!`, margem sem responsável, time decidindo "olhando pra trás"). Cada bloco é visual primeiro, texto de apoio depois — a dor é *mostrada*, não só descrita. A transição pra solução vem na seção seguinte ("Tudo o que a sua operação precisa, em um só núcleo"), que já nomeia os módulos que resolvem exatamente os 4 problemas mostrados — link direto dor→solução, sem seção de transição genérica no meio.

**Frequência e destino dos CTAs:**
CTAs aparecem **7 vezes**: "Conhecer o Ecossistema" (hero, âncora interna), "Ver o módulo Fiscal →" (seção 3, âncora interna), "Proteger minha margem" (seção 4 e seção 17, ambos para `/forms`), "Falar com um especialista" (seção 15, `/forms`), "Falar com a Mynr" (CTA final, `/forms`), mais o CTA fixo do header "Iniciar demo" (`/forms`). Padrão: CTAs do **meio da página** levam a âncoras internas (mantêm o visitante lendo); só os CTAs de **fim de seção temática** e o **CTA final** levam ao formulário de contato — a página não tenta converter cedo demais.

---

## B. UI (visual)

### Paleta real (hex, extraída do CSS do site)

| Cor | Uso aparente |
|---|---|
| `#0f2723`, `#0c4239`, `#06231e`, `#03110f`, `#0b2e28` | Fundos escuros (seções "ink", mockups de produto, header) — uma família de verde-petróleo quase preto, não azul-marinho nem cinza puro |
| `#1da68f`, `#25d2b5`, `#167a69` | Verde-água/teal — a cor de marca/acento, usada em ícones, bordas ativas, destaques de texto |
| `#dce5e2`, `#e3eae8`, `#f3f6f5`, `#f0f4f4`, `#e6ecea`, `#f5f8f7` | Família de cinza-esverdeado claro (quase-branco com tom sage) — fundos de seção clara e cards |
| `#6b7f7b`, `#7fa19b`, `#93a5a1`, `#9db7b2`, `#9bb5b0` | Texto secundário/muted, sempre com tom esverdeado, nunca cinza neutro |
| `#d9534f`, `#e8908d` | Vermelho/coral — usado nos blocos de "problema" (números negativos, divergências) |
| `#e0a100` | Âmbar — estados de alerta/atenção (ex.: "sinais abertos") |
| `#ffffff` | Texto sobre fundo escuro, fundos de card isolados |
| `#34c759`, `#08b962`, `#ff2d55`, `#fabc12`, `#f94543` | Pequenos pontos de status semânticos (verde/âmbar/vermelho) em mockups de UI — cores de sistema operacional (sucesso/alerta/erro), não cores de marca |

**Conclusão de paleta:** é uma paleta **verde-petróleo + teal + sage**, não azul corporativo nem preto puro — foge do "SaaS blue" genérico. Vermelho e âmbar aparecem só como semântica (erro/alerta), nunca como decoração.

### Tipografia (famílias, pesos, escala real)
- **Headlines (h2)**: `Space Grotesk`, peso **700**, `letter-spacing: -0.02em`, `line-height: 110%`. Tamanhos confirmados: **40px** (destaque principal de seção) e **30px** (subsções) no HTML base — single-column mobile-first, provavelmente escalam para cima via `@media (min-width: 1440px)`.
- **Corpo/UI**: `Inter Tight` como primária, com fallback `Inter, sans-serif`. Pesos usados: 400 (texto corrido), 500 (labels/UI), 600 (ênfase), 700 (números grandes em mockups).
- **Mockups de produto**: `Space Grotesk` também aparece em números grandes de destaque (ex.: valores de caixa) — reforça que a fonte de display é a mesma dentro e fora dos mockups, dá consistência.
- Escala de `font-size` observada no CSS real: 10, 11, 12, 13, 14, 15, 16, 17, 18, 20, 22, 24, 28, 30, 32, 40, 48px — uma escala bem granular (típica de export automático do Framer, não um design system de poucos steps).
- `letter-spacing` tem 3 valores dominantes: `-0.02em` (headlines), `-0.01em` (textos médios), `0.4px`/`0.08em` (uppercase/labels pequenos — rastreamento positivo em caixa alta, padrão correto).

### Espaçamento, raio, sombra
- **Breakpoints reais** (únicos dois encontrados no CSS): `min-width: 810px` (tablet) e `min-width: 1440px` (desktop). Ou seja, o Framer usa 3 faixas: mobile (base, <810px), tablet (810–1439px), desktop (≥1440px) — bate com os 3 tamanhos que você pediu pra testar (390/768/1440), com a ressalva de que o breakpoint real de tablet é 810px, não 768px.
- **Container**: só um `max-width: 640px` explícito foi encontrado no CSS global (provavelmente de um bloco de texto/citação central) — o grid principal do Framer usa containers por seção/breakpoint, não um único max-width global como no Tailwind.
- **`gap`**: valores mais comuns `10px`, `16px`, `8px`, `12px`, `24px`, depois saltos maiores em `32px`/`40px`/`60px` para espaçamento entre blocos maiores — ritmo vertical cresce em degraus, não é um único valor de "section padding" repetido.
- **`border-radius`**: `3px`/`5px`/`6px`/`7px`/`8px` dominam (inputs, badges pequenos, cantos de card internos), `12px`/`16px` para cards de conteúdo, `100px` para pills (botões CTA, badges arredondados), `100%` para avatares/pontos.
- **`box-shadow`**: dois padrões claros — sombra **suave de elevação** em cards (`0 6px 18px rgba(3,17,15,0.06)` até `0 30px 80px rgba(3,17,15,0.18–0.35)`, sempre tingida da própria cor escura de marca, nunca preto puro) e sombra **inset** usada dentro de barrinhas/indicadores pequenos nos mockups (`inset 0 Npx Mpx #167a69`) — dá um efeito de "luz entrando" na barra, não é decorativo aleatório.
- **Bordas**: `1px solid #DCE5E2`/`#E3EAE8` em cards claros (hairline quase invisível), `1px solid rgba(255,255,255,0.08–0.12)` em cards escuros, `1px solid rgba(37,210,181,0.25–0.4)` para estado "ativo/destacado" em teal, e um `2px solid #1DA68F` sólido — provavelmente indicador de etapa ativa ou elemento selecionado.
- **`backdrop-filter: blur()`** aparece (blur de 1px a 16px) — efeito de vidro fosco em elementos sobrepostos (provavelmente o header fixo e/ou camadas dos mockups), reforçando profundidade sem precisar de nova sombra.

### Botões, badges, cards (padrão, não pixel-perfect sem visual)
- CTA principal: pill (`border-radius: 100px`), presumivelmente fundo escuro/teal com texto claro dado o contraste da marca — **inferido pela paleta**, não confirmado pixel a pixel sem screenshot.
- Cards claros usam fundo da família sage (`#f3f6f5`/`#f0f4f4`) com hairline `#dce5e2`/`#e3eae8` e sombra suave — nunca fundo branco puro, reforçando que mesmo o "claro" do site é tingido.
- Cards escuros (mockups de produto) usam a família `#0f2723`/`#0c4239`/`#03110f` com borda branca translúcida — o padrão de profundidade é por **tom + sombra tingida**, não por borda forte.

---

## C. UX e microinterações

- **Header**: fixo (`position: sticky`/`fixed` típico de Framer com esse padrão de navegação), com provável `backdrop-filter: blur()` ao rolar (consistente com os valores de blur encontrados). Menu mobile: não verificável sem renderização — **inferido** que existe hambúrguer dado o breakpoint de 810px, mas não confirmado.
- **Âncoras/scroll suave**: confirmado — hero e vários CTAs usam `href="#id"` (`#agentes`, `#ecossistema`), indicando scroll-to-section em vez de navegação de página cheia para esses pontos.
- **Animações reais encontradas no CSS** (nomes de `@keyframes`, o que confirma que são animações **customizadas e nomeadas por mockup**, não uma lib genérica tipo AOS):
  - `mynrFade`, `mynrIn`, `mynrGrow`, `mynrDraw`, `mynrRipple` — família de animações de entrada/desenho, prováveis no mockup do hero e nos diagramas (fade + crescimento + "desenho" de linha, ex. o diagrama de convergência de dados).
  - `auIn` (`.45s both`), `auOpen`, `auPulse` (`1.4s infinite`), `auRipple` — família "au" (auditoria/áudio?), provavelmente a seção de trilha de auditoria ao vivo (pulso contínuo = indicador "ao vivo").
  - `hcIn` (`.5s both`), `hcBlink` (variações de `1.2s` a `2.1s infinite`), `hcRing` (`2.2s infinite`) — família do mockup de **chat/agente de IA** (`hc` = "human/chat"?): blink de cursor de digitação e ring de notificação, com delays levemente diferentes por elemento pra não ficarem sincronizados (dá sensação orgânica/"ao vivo").
  - `pvBlink`, `pvDrop` — provavelmente "painel vivo" (hero), o contador "12.847 eventos lidos hoje" piscando e "caindo" (efeito de novo evento chegando).
  - **Easing**: `cubic-bezier(.45,0,.2,1)` em transições de posição (`left`/`top`, `.9s`) — curva customizada, não o `ease`/`ease-in-out` padrão do browser.
  - **Padrão geral**: durações curtas pra entrada (`.3–.7s`), loops lentos pra "vida" (`1.2–2.2s infinite`) — a sensação de "produto vivo" vem de poucos elementos pulsando devagar, não de muita coisa se movendo ao mesmo tempo.
- **Filtro por categoria**: confirmado na seção 16 (Integrações) — "Todas, Bancos, Pagamentos, Operações, ERPs" como tabs de filtro, mais botão "Ver mais" (provável paginação/expansão, não link externo).
- **Formulário de captura**: a página em si **não tem formulário embutido** — todo CTA leva pra `/forms`, uma página separada. Não dá pra auditar campos/validação/estados sem abrir essa página (fora do escopo pedido, que era a landing `/`).
- **Responsivo**: confirmado por CSS que existem 3 faixas de layout (mobile base / ≥810px / ≥1440px); o comportamento exato de cada seção nessas faixas (quantas colunas, o que empilha) não é verificável com certeza sem uma renderização visual real lado a lado — tratar como **a confirmar visualmente antes de clonar o padrão de grid**.

---

## D. Funcionalidade e performance

- **Interativo de verdade**: filtro por categoria (Integrações), navegação por âncora com scroll suave, estados de hover/focus em botões e inputs (`--framer-input-focused-transition`, `transition: outline .2s`), e os mockups com micro-animação contínua (pulso/blink) — mas os **dados mostrados nos mockups são estáticos/fictícios**, não uma automação real conectada a backend (esperado pra uma landing).
- **Acessibilidade — pontos fracos reais**:
  - **Zero ocorrências de `prefers-reduced-motion`** no CSS — todas as animações (incluindo loops infinitos de 1.2–2.2s) rodam sempre, sem respeitar a preferência do usuário. Isso é uma falha real de acessibilidade, não um ponto a replicar.
  - Uso de `aria-*` extremamente baixo (2 ocorrências em toda a página) e nenhum `role=""` encontrado — semântica provavelmente apoiada quase só em `<h2>`/texto visual, não em landmarks ARIA.
  - Contraste: não verificável com precisão sem renderização visual real, mas a combinação de texto `#6b7f7b`/`#7fa19b` (muted) sobre fundos claros `#f3f6f5` tende a ficar **abaixo de AA** para texto pequeno — ponto de atenção, não copiar esse padrão de contraste sem testar.
- **SEO**: `<title>` é só **"Mynr"** (sem palavra-chave, sem proposta de valor no title — fraco para SEO). `meta description` e as tags `og:title`/`og:description`/`og:url`/`og:type` estão presentes e bem escritas. Só **12 `<h2>`** na página inteira e nenhum `<h1>` encontrado na varredura — estrutura de heading hierárquica provavelmente fraca (sem H1 claro, hierarquia toda em H2).
- **Peso/performance**: o HTML inicial já tem ~870KB (sem contar JS/imagens carregados depois) — pesado pra um primeiro payload, típico de exports Framer com CSS inline extenso e muitos componentes únicos por seção (explica a profusão de `font-size`/cores quase-duplicadas encontrada acima). Não foi possível medir Lighthouse real sem abrir o site num browser de verdade.

---

## E. O que NÃO copiar / pontos fracos

1. **Sem `prefers-reduced-motion`** — todas as animações (incluindo loops infinitos) ignoram a preferência de movimento reduzido. Confirmado no CSS (zero ocorrências).
2. **`<title>` fraco** ("Mynr", sem proposta de valor) e aparente ausência de `<h1>` — hierarquia de heading ruim para SEO/acessibilidade.
3. **ARIA quase inexistente** (2 ocorrências na página inteira) — acessibilidade por leitor de tela provavelmente comprometida.
4. **Sem FAQ** — você já identificou isso; reforça a lacuna real.
5. **Sem depoimentos nominais, sem logos de clientes nomeados, sem preços** — toda prova social é número-meta ("−50% tempo de conciliação") ou mockup fictício rotulado como ilustrativo. Funciona para uma marca nova sem cases públicos ainda, mas é uma prova social fraca — não é algo a replicar como "padrão de ouro", é uma limitação da Mynr hoje.
6. **CTA principal do hero não vai para conversão** (vai para âncora interna) — atrasa a conversão em favor de educação; correto para um produto complexo B2B, mas precisa ser uma escolha consciente, não cópia automática.
7. **Payload inicial pesado** (~870KB de HTML só na primeira carga) — sintoma de export automático de página builder; não é um padrão de performance a perseguir.
8. **Contraste de texto muted sobre fundo claro** potencialmente abaixo de AA — ponto de atenção antes de reutilizar a mesma relação de cor.
9. **Granularidade excessiva de tokens** (17 tamanhos de fonte distintos, dezenas de cores quase-idênticas) — sintoma de builder visual sem design system real; a ValuM&A já tem tokens mais enxutos (`app/globals.css`) e deve continuar assim, não replicar essa fragmentação.

---

## Os 10 padrões de maior valor para a ValuM&A

1. **Mockup de produto real como hero visual**, com um indicador "ao vivo" sutil (contador pulsando) — em vez de ilustração genérica, mostrar a própria tela de resultado da ValuM&A (Equity Value + Índice de Prontidão), já é o padrão que a landing atual começou a usar no `HeroMockup`.
2. **Seção de problema com mockups de dor, não só texto** — 3–4 blocos, cada um mostrando visualmente a dor (ex.: planilha desorganizada, campo vazio, prazo perdido) antes de qualquer frase de marketing.
3. **Ponte direta dor→solução**: a seção seguinte ao problema nomeia explicitamente o que resolve cada dor mostrada — nada de seção de transição vaga no meio.
4. **CTAs de meio de página levam a âncoras internas; só CTAs de fim de seção/CTA final levam à conversão real** — evita pedir demais cedo demais, relevante pro funil de cadastro da ValuM&A.
5. **Seção de transparência/mecanismo** ("como a Mynr lê sua operação") — aplicável 1:1 à exigência que a banca já fez: explicar como o cálculo e o Índice de Prontidão funcionam, de forma visual (diagrama), não só em texto corrido.
6. **Números de impacto rotulados como meta/ilustrativo, nunca como resultado de cliente real** — essencial pra ValuM&A manter honestidade (mesma disciplina já seguida nos documentos da banca), evita prova social fabricada.
7. **Microanimações discretas e lentas (1.2–2.2s, loop infinito) em 1–2 elementos por seção**, não em tudo — dá sensação de "sistema vivo" sem poluição visual; implementável com CSS puro + `IntersectionObserver`, sem lib nova.
8. **Paleta tingida e coerente em vez de cinza/branco neutro** — a Mynr usa verde-petróleo+teal em vez de SaaS-blue; a ValuM&A já tem sua própria identidade (grafite-navy `#101a2e` + dourado `#a9812f`) e deve manter esse mesmo princípio: cor de marca infiltrada até no "branco" (cream `#fafaf9` já faz isso).
9. **Seção "como começar" com 2 caminhos claros** (integração vs. migração assistida) — adaptável para "criar conta e simular agora" vs. "já tenho dados prontos, importar Excel" (recurso que a ValuM&A já tem implementado).
10. **FAQ e `prefers-reduced-motion` — exatamente os 2 pontos fracos reais da Mynr — devem ser feitos certo na ValuM&A desde o início**, não repetir essas duas omissões.

---

**Pronto. Aguardando aprovação para seguir para a ETAPA 2 (plano de adaptação).**
