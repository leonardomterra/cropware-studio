-- ──────────────────────────────────────────────────────────────
-- Cropware Studio — schema Supabase (com Auth + RLS)
--
-- Como usar:
--   1. Abra o projeto no Supabase
--   2. Vá em SQL Editor → New query
--   3. Cole TODO este arquivo e clique em "Run"
--
-- Isso cria as 2 tabelas e habilita RLS para que cada
-- usuário autenticado acesse apenas seus próprios dados.
-- ──────────────────────────────────────────────────────────────

-- Posts gerados pela IA (histórico rolante, máx 6)
create table if not exists public.cropware_posts (
  id          text primary key,
  session_id  text not null,
  post_data   jsonb not null,
  legend      text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Mantemos um único índice leve para consultas por usuário.
-- Índices antigos/duplicados são removidos mais abaixo.

-- Design config (diretrizes de marca/voz que entram no prompt do Gemini)
create table if not exists public.cropware_design_config (
  session_id  text primary key,
  config      jsonb not null,
  updated_at  timestamptz not null default now()
);

-- Habilita RLS
alter table public.cropware_posts         enable row level security;
alter table public.cropware_design_config enable row level security;

-- Policies: cada usuário acessa apenas seus dados (session_id = user id)
drop policy if exists "Users manage own posts" on public.cropware_posts;
create policy "Users manage own posts" on public.cropware_posts
  for all
  using (session_id = (select auth.uid())::text)
  with check (session_id = (select auth.uid())::text);

drop policy if exists "Users manage own config" on public.cropware_design_config;
create policy "Users manage own config" on public.cropware_design_config
  for all
  using (session_id = (select auth.uid())::text)
  with check (session_id = (select auth.uid())::text);

-- Remove índices antigos/duplicados apontados pelo Advisor e recria apenas um.
drop index if exists public.cropware_posts_session_idx;
drop index if exists public.idx_posts_session;

create index if not exists cropware_posts_session_id_idx
  on public.cropware_posts (session_id);

-- Trava anti-base64: depois da migração para R2, o banco rejeita blobs no jsonb.
create or replace function public.cropware_posts_no_base64() returns trigger as $$
begin
  if new.post_data::text ~* 'data:image/[a-z0-9.+-]+;base64,' then
    raise exception 'cropware_posts.post_data must reference R2 URLs, not base64 blobs';
  end if;
  return new;
end $$ language plpgsql;

drop trigger if exists cropware_posts_no_base64_trg on public.cropware_posts;
create trigger cropware_posts_no_base64_trg
  before insert or update on public.cropware_posts
  for each row execute function public.cropware_posts_no_base64();

-- Garante acesso para authenticated (RLS filtra por user)
grant select, insert, update, delete on public.cropware_posts         to authenticated;
grant select, insert, update, delete on public.cropware_design_config to authenticated;
