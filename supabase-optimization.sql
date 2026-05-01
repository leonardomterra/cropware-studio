-- Cropware Studio — otimização de IO Supabase
-- Execute no SQL Editor do Supabase depois de migrar imagens antigas para R2.

-- 1) RLS otimizado: auth.uid() é avaliado uma vez por statement.
drop policy if exists "Users manage own posts" on public.cropware_posts;
create policy "Users manage own posts"
  on public.cropware_posts
  for all
  using      (session_id = (select auth.uid())::text)
  with check (session_id = (select auth.uid())::text);

drop policy if exists "Users manage own config" on public.cropware_design_config;
create policy "Users manage own config"
  on public.cropware_design_config
  for all
  using      (session_id = (select auth.uid())::text)
  with check (session_id = (select auth.uid())::text);

-- 2) Remove índices duplicados/não usados e mantém um índice simples por usuário.
drop index if exists public.cropware_posts_session_idx;
drop index if exists public.idx_posts_session;

create index if not exists cropware_posts_session_id_idx
  on public.cropware_posts (session_id);

-- 3) Trava para impedir que base64 volte para o banco.
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

-- 4) Verificação de tamanho após migração + VACUUM FULL.
select
  pg_size_pretty(pg_relation_size('public.cropware_posts')) as table_size,
  pg_size_pretty(
    pg_total_relation_size('public.cropware_posts')
    - pg_relation_size('public.cropware_posts')
    - pg_indexes_size('public.cropware_posts')
  ) as toast_size,
  pg_size_pretty(pg_indexes_size('public.cropware_posts')) as indexes_size,
  pg_size_pretty(pg_total_relation_size('public.cropware_posts')) as total;
