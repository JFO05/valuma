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
- Sem framework de testes automatizado ainda (D6 pendente) — os testes desta fase foram manuais, com scripts de apoio descartáveis (Playwright), não incorporados ao repositório.
