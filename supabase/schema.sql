-- ValuM&A - schema inicial (Fase 2: modelagem do banco)
--
-- Decisão de design: intake_data usa uma coluna jsonb genérica por fase
-- (perfil, financeiro, operacao, mercado, documentos) em vez de tabelas
-- normalizadas por campo. Isso evita migration a cada mudança no formulário;
-- o parsing dos campos específicos (EBITDA, dívidas etc.) fica para a Fase 3,
-- quando o motor de valuation for lido.
--
-- Rode este arquivo inteiro no SQL Editor do painel do Supabase (ou via
-- `supabase db push`, se preferir migrations com a CLI).

create extension if not exists "pgcrypto";

-- =============================================================================
-- TABELAS
-- =============================================================================

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  nome_completo text,
  created_at timestamptz not null default now()
);

comment on table public.users is 'Perfil público de cada usuário autenticado, 1:1 com auth.users.';

create table public.processos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  nome_empresa text not null,
  status text not null default 'em_andamento',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.processos is 'Um processo de valuation/M&A para uma empresa, pertencente a um usuário.';
comment on column public.processos.status is 'em_andamento | concluido | arquivado';

create index processos_user_id_idx on public.processos (user_id);

create table public.partners (
  id uuid primary key default gen_random_uuid(),
  processo_id uuid not null references public.processos (id) on delete cascade,
  nome text not null,
  percentual_participacao numeric,
  created_at timestamptz not null default now()
);

comment on table public.partners is 'Sócios da empresa avaliada em um processo.';

create index partners_processo_id_idx on public.partners (processo_id);

create table public.intake_data (
  id uuid primary key default gen_random_uuid(),
  processo_id uuid not null references public.processos (id) on delete cascade,
  fase text not null check (fase in ('motor', 'perfil', 'financeiro', 'operacao', 'mercado', 'documentos')),
  dados jsonb not null default '{}'::jsonb,
  atualizado_em timestamptz not null default now(),
  constraint intake_data_processo_fase_key unique (processo_id, fase)
);

comment on table public.intake_data is 'Respostas do formulário de intake, uma linha por fase por processo (upsert = autosave).';

create index intake_data_processo_id_idx on public.intake_data (processo_id);

-- =============================================================================
-- TRIGGERS: manter updated_at / atualizado_em em dia
-- =============================================================================

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_processos_updated_at
  before update on public.processos
  for each row
  execute function public.set_updated_at();

create function public.set_atualizado_em()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

create trigger set_intake_data_atualizado_em
  before update on public.intake_data
  for each row
  execute function public.set_atualizado_em();

-- =============================================================================
-- TRIGGER: criar public.users automaticamente no signup (auth.users)
-- =============================================================================

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, nome_completo)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

alter table public.users enable row level security;
alter table public.processos enable row level security;
alter table public.partners enable row level security;
alter table public.intake_data enable row level security;

-- users: cada usuário só vê/edita a própria linha de perfil.
-- (insert é feito pelo trigger on_auth_user_created via security definer;
-- delete é feito em cascata quando auth.users é apagado.)

create policy "users_select_own" on public.users
  for select
  using (id = auth.uid());

create policy "users_update_own" on public.users
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- processos: cada usuário só vê/edita os próprios processos.

create policy "processos_select_own" on public.processos
  for select
  using (user_id = auth.uid());

create policy "processos_insert_own" on public.processos
  for insert
  with check (user_id = auth.uid());

create policy "processos_update_own" on public.processos
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "processos_delete_own" on public.processos
  for delete
  using (user_id = auth.uid());

-- partners: acesso liberado apenas se o processo pai pertence ao usuário.

create policy "partners_select_own" on public.partners
  for select
  using (
    exists (
      select 1 from public.processos p
      where p.id = partners.processo_id
        and p.user_id = auth.uid()
    )
  );

create policy "partners_insert_own" on public.partners
  for insert
  with check (
    exists (
      select 1 from public.processos p
      where p.id = partners.processo_id
        and p.user_id = auth.uid()
    )
  );

create policy "partners_update_own" on public.partners
  for update
  using (
    exists (
      select 1 from public.processos p
      where p.id = partners.processo_id
        and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.processos p
      where p.id = partners.processo_id
        and p.user_id = auth.uid()
    )
  );

create policy "partners_delete_own" on public.partners
  for delete
  using (
    exists (
      select 1 from public.processos p
      where p.id = partners.processo_id
        and p.user_id = auth.uid()
    )
  );

-- intake_data: mesmo padrão de partners, via processo_id.

create policy "intake_data_select_own" on public.intake_data
  for select
  using (
    exists (
      select 1 from public.processos p
      where p.id = intake_data.processo_id
        and p.user_id = auth.uid()
    )
  );

create policy "intake_data_insert_own" on public.intake_data
  for insert
  with check (
    exists (
      select 1 from public.processos p
      where p.id = intake_data.processo_id
        and p.user_id = auth.uid()
    )
  );

create policy "intake_data_update_own" on public.intake_data
  for update
  using (
    exists (
      select 1 from public.processos p
      where p.id = intake_data.processo_id
        and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.processos p
      where p.id = intake_data.processo_id
        and p.user_id = auth.uid()
    )
  );

create policy "intake_data_delete_own" on public.intake_data
  for delete
  using (
    exists (
      select 1 from public.processos p
      where p.id = intake_data.processo_id
        and p.user_id = auth.uid()
    )
  );

-- =============================================================================
-- MIGRAÇÃO: cargo/função dos sócios (formulário da etapa Perfil)
-- =============================================================================
-- Nullable de propósito: linhas de partners que já existiam antes desta
-- migração não têm cargo preenchido. A obrigatoriedade desse campo é
-- validada em app/(app)/intake/perfil-actions.ts / lib/intake/schema-perfil.ts.

alter table public.partners add column if not exists cargo text;

-- =============================================================================
-- MIGRAÇÃO: Storage para a etapa "Documentos"
-- =============================================================================
-- Bucket privado. Caminho de cada objeto: {processo_id}/{uuid}-{nome_arquivo}
-- — o primeiro segmento do path é o que a policy usa para achar o processo e
-- confirmar que ele pertence a quem está fazendo a requisição.
--
-- file_size_limit é em bytes (20 MB aqui). Se mudar, atualize também
-- TAMANHO_MAXIMO_BYTES em lib/intake/schema-documentos.ts.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documentos-intake',
  'documentos-intake',
  false,
  20971520,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png'
  ]
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- storage.objects já vem com RLS habilitada por padrão em todo projeto
-- Supabase; só precisamos das policies. storage.foldername(name) quebra o
-- path em segmentos — o primeiro é sempre o processo_id nesse bucket.

create policy "documentos_intake_select_own"
on storage.objects for select
to authenticated
using (
  bucket_id = 'documentos-intake'
  and exists (
    select 1 from public.processos p
    where p.id::text = (storage.foldername(name))[1]
      and p.user_id = auth.uid()
  )
);

create policy "documentos_intake_insert_own"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'documentos-intake'
  and exists (
    select 1 from public.processos p
    where p.id::text = (storage.foldername(name))[1]
      and p.user_id = auth.uid()
  )
);

create policy "documentos_intake_update_own"
on storage.objects for update
to authenticated
using (
  bucket_id = 'documentos-intake'
  and exists (
    select 1 from public.processos p
    where p.id::text = (storage.foldername(name))[1]
      and p.user_id = auth.uid()
  )
)
with check (
  bucket_id = 'documentos-intake'
  and exists (
    select 1 from public.processos p
    where p.id::text = (storage.foldername(name))[1]
      and p.user_id = auth.uid()
  )
);

create policy "documentos_intake_delete_own"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'documentos-intake'
  and exists (
    select 1 from public.processos p
    where p.id::text = (storage.foldername(name))[1]
      and p.user_id = auth.uid()
  )
);

-- =============================================================================
-- MIGRAÇÃO: tabela de resultados (valuation + score + análise de IA)
-- =============================================================================
-- Um resultado por processo (unique em processo_id) — cada "Gerar Resultado"
-- é um upsert que substitui o anterior, não um histórico de versões.

create table public.resultados (
  id uuid primary key default gen_random_uuid(),
  processo_id uuid not null references public.processos (id) on delete cascade,
  valuation_final numeric not null,
  valuation_ebitda numeric not null,
  valuation_dcf numeric not null,
  valuation_patrimonial numeric not null,
  score_total numeric not null,
  score_financeiro numeric not null,
  score_operacao numeric not null,
  score_mercado numeric not null,
  score_juridico numeric not null,
  analise_ia jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint resultados_processo_id_key unique (processo_id)
);

comment on table public.resultados is 'Resultado consolidado (valuation + score + análise de IA) de um processo — um por processo_id, upsert a cada geração.';
comment on column public.resultados.analise_ia is 'jsonb no formato {pontosFortes: string[], riscos: string[], recomendacoes: string[], erro?: boolean, explicabilidade?: {...}}. NÃO contém mais a versão do modelo (ver coluna modelo_versao) — RG-47 exige que o versionamento seja independente do JSON da IA.';

alter table public.resultados enable row level security;

-- Mesmo padrão de partners/intake_data: acesso liberado só se o processo
-- pai pertence ao usuário logado.

create policy "resultados_select_own" on public.resultados
  for select
  using (
    exists (
      select 1 from public.processos p
      where p.id = resultados.processo_id
        and p.user_id = auth.uid()
    )
  );

create policy "resultados_insert_own" on public.resultados
  for insert
  with check (
    exists (
      select 1 from public.processos p
      where p.id = resultados.processo_id
        and p.user_id = auth.uid()
    )
  );

create policy "resultados_update_own" on public.resultados
  for update
  using (
    exists (
      select 1 from public.processos p
      where p.id = resultados.processo_id
        and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.processos p
      where p.id = resultados.processo_id
        and p.user_id = auth.uid()
    )
  );

create policy "resultados_delete_own" on public.resultados
  for delete
  using (
    exists (
      select 1 from public.processos p
      where p.id = resultados.processo_id
        and p.user_id = auth.uid()
    )
  );

-- =============================================================================
-- MIGRAÇÃO: Regra de Negócio v1.0 — valuation nullable + atualizado_em
-- =============================================================================
-- RG-24/RG-25 (docs/REGRAS_NEGOCIO_VALUMA_V1.md): o consolidado e cada
-- método individual agora podem legitimamente não existir (método/consolidado
-- não aplicável) em vez de sempre carregar um número — as 4 colunas abaixo
-- deixam de ser `not null`. `null` nunca é substituído por `0`: 0 é uma
-- estimativa real, null é "não aplicável".

alter table public.resultados alter column valuation_final drop not null;
alter table public.resultados alter column valuation_ebitda drop not null;
alter table public.resultados alter column valuation_dcf drop not null;
alter table public.resultados alter column valuation_patrimonial drop not null;

-- RG-46: "resultado desatualizado" precisa comparar contra o momento em que
-- o resultado foi de fato (re)gerado — `created_at` não serve porque um
-- upsert (Gerar Resultado/Recalcular) NÃO atualiza `created_at` (ele só é
-- setado no insert original). Reaproveita a mesma função de trigger já usada
-- por `intake_data.atualizado_em` (set_atualizado_em, definida acima).

alter table public.resultados add column if not exists atualizado_em timestamptz not null default now();

comment on column public.resultados.atualizado_em is 'Momento da última geração/recálculo — usado para detectar "resultado desatualizado" (RG-46), comparando com o MAX(intake_data.atualizado_em) do mesmo processo.';

drop trigger if exists set_resultados_atualizado_em on public.resultados;

create trigger set_resultados_atualizado_em
  before update on public.resultados
  for each row
  execute function public.set_atualizado_em();

-- =============================================================================
-- MIGRAÇÃO: versionamento do modelo independente da IA (RG-47, DIV-02)
-- =============================================================================
-- A versão da Regra de Negócio que gerou um resultado precisa ser
-- independente do JSON da IA (achado da auditoria pós-implementação:
-- `analise_ia.versao` violava isso, pois vivia dentro do mesmo jsonb da
-- análise qualitativa). Coluna própria, nunca escrita/lida a partir de
-- `analise_ia` — ver lib/valuation/resultados.ts::ehResultadoLegado.
-- NULL = resultado legado (gerado antes desta coluna existir, ou sem
-- versão registrada).

alter table public.resultados add column if not exists modelo_versao text;

comment on column public.resultados.modelo_versao is 'Versão explícita da Regra de Negócio/motor que gerou este resultado (RG-47) — independente de analise_ia (JSON da IA). NULL = resultado legado (gerado antes do versionamento explícito, ou antes desta coluna existir).';

-- =============================================================================
-- MIGRAÇÃO: V2 — Motor de Análise (Essencial/Configurável)
-- =============================================================================
-- Nova etapa "motor" no intake, antes de "perfil" (prompt de evolução V2,
-- seção 1/2). O check constraint de intake_data.fase precisa aceitar o novo
-- valor — recriado em vez de apenas adicionado, porque Postgres não permite
-- alterar um check constraint existente diretamente.

alter table public.intake_data drop constraint if exists intake_data_fase_check;

alter table public.intake_data add constraint intake_data_fase_check
  check (fase in ('motor', 'perfil', 'financeiro', 'operacao', 'mercado', 'documentos'));

-- Snapshot da configuração do Motor usada para gerar ESTE resultado
-- especificamente (seção 4 do prompt de evolução) — nunca lido a partir da
-- fase "motor" do intake atual, pelo mesmo motivo de modelo_versao não ler
-- de analise_ia: se o usuário mudar o Motor depois de gerar um resultado, o
-- resultado antigo não pode silenciosamente passar a "parecer" calculado
-- com a configuração nova. NULL = resultado gerado antes do Motor de
-- Análise existir — tratado como Motor Essencial (lib/valuation/motor.ts::
-- MOTOR_SNAPSHOT_LEGADO), sem alterar nenhum número já persistido.

alter table public.resultados add column if not exists motor_snapshot jsonb;

comment on column public.resultados.motor_snapshot is 'Snapshot {tipo, configuracao} do Motor de Análise usado para gerar este resultado (V2) — independente da fase "motor" atual do intake. NULL = resultado legado (anterior ao Motor de Análise), tratado como Motor Essencial.';
