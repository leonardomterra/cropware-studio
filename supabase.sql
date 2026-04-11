-- ──────────────────────────────────────────────────────────────
-- Cropware Studio — schema Supabase (uso solo, sem RLS)
--
-- Como usar:
--   1. Abra o projeto no Supabase
--   2. Vá em SQL Editor → New query
--   3. Cole TODO este arquivo e clique em "Run"
--
-- Isso cria as 2 tabelas usadas pelo index.html e desliga RLS
-- (studio usado só por você — nada sensível nessas tabelas).
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

create index if not exists cropware_posts_session_idx
  on public.cropware_posts (session_id, created_at);

-- Perfil de estilo aprendido (culturas, vocabulário, exemplos de hook)
create table if not exists public.cropware_style (
  session_id  text primary key,
  profile     jsonb not null,
  updated_at  timestamptz not null default now()
);

-- Desliga RLS: uso solo, tudo acessível via anon key do index.html
alter table public.cropware_posts  disable row level security;
alter table public.cropware_style  disable row level security;

-- Garante que o role `anon` tem acesso (default do Supabase já dá,
-- mas deixamos explícito pra não depender de default privileges).
grant select, insert, update, delete on public.cropware_posts to anon;
grant select, insert, update, delete on public.cropware_style to anon;
