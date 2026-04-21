-- =============================================================
-- Migração 003 — profiles + aprovação manual + admin
--
-- Cria:
--   * public.profiles (1:1 com auth.users)
--   * trigger que insere profile ao criar usuário
--   * policies de profiles (usuário vê o próprio; admin vê e edita todos)
--   * helper is_admin(uid) — usada nas policies (security definer para
--     quebrar recursão com RLS de profiles)
--   * ajuste das policies de tasks para exigir profile.aprovado = true
--
-- Pré-aprova como admin o usuário já existente do e-mail informado.
--
-- Seguro para rodar múltiplas vezes (idempotente).
-- =============================================================

-- 1. Tabela
create table if not exists public.profiles (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  email         text,
  aprovado      boolean not null default false,
  is_admin      boolean not null default false,
  criado_em     timestamptz not null default now(),
  aprovado_em   timestamptz,
  aprovado_por  uuid references auth.users(id)
);

-- 2. Backfill: cria profile para todo usuário que já existia em auth.users
insert into public.profiles (user_id, email)
select id, email from auth.users
on conflict (user_id) do nothing;

-- 3. Pré-aprova + marca como admin o Ricardo (único usuário pré-existente).
--    Não usa e-mail hardcoded: pega o usuário mais antigo.
update public.profiles
set aprovado    = true,
    is_admin    = true,
    aprovado_em = now()
where user_id = (
  select id from auth.users order by created_at asc limit 1
);

-- 4. Trigger que cria profile quando um novo usuário surge
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, email)
  values (new.id, new.email)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5. Helper: é admin? — security definer para ler profiles sem cair
--    na recursão da própria policy de profiles.
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (select is_admin from public.profiles where user_id = uid),
    false
  );
$$;

-- 6. RLS em profiles
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_self_or_admin" on public.profiles;
create policy "profiles_select_self_or_admin" on public.profiles
  for select using (
    auth.uid() = user_id or public.is_admin(auth.uid())
  );

-- Admin pode atualizar qualquer profile (aprovar / revogar / promover admin).
-- Usuário comum não pode editar o próprio profile (senão se auto-aprovaria).
drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin" on public.profiles
  for update using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- Admin pode deletar (rejeitar / remover usuário do painel).
drop policy if exists "profiles_delete_admin" on public.profiles;
create policy "profiles_delete_admin" on public.profiles
  for delete using (public.is_admin(auth.uid()));

-- Nenhum INSERT via cliente — entra só via trigger (security definer).

-- 7. Ajusta as policies de tasks para exigir profile aprovado
drop policy if exists "tasks_select_own" on public.tasks;
create policy "tasks_select_own" on public.tasks
  for select using (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles
      where user_id = auth.uid() and aprovado = true
    )
  );

drop policy if exists "tasks_insert_own" on public.tasks;
create policy "tasks_insert_own" on public.tasks
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles
      where user_id = auth.uid() and aprovado = true
    )
  );

drop policy if exists "tasks_update_own" on public.tasks;
create policy "tasks_update_own" on public.tasks
  for update using (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles
      where user_id = auth.uid() and aprovado = true
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles
      where user_id = auth.uid() and aprovado = true
    )
  );

drop policy if exists "tasks_delete_own" on public.tasks;
create policy "tasks_delete_own" on public.tasks
  for delete using (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles
      where user_id = auth.uid() and aprovado = true
    )
  );
