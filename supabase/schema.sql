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
  fase text not null check (fase in ('perfil', 'financeiro', 'operacao', 'mercado', 'documentos')),
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
-- validada em app/intake/perfil-actions.ts / lib/intake/schema-perfil.ts.

alter table public.partners add column if not exists cargo text;
