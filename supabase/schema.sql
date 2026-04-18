-- =============================================================
-- Pendências — schema inicial
-- Rode este SQL inteiro no Supabase → SQL Editor → New query.
-- =============================================================

create extension if not exists pgcrypto;

create table if not exists public.tasks (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  titulo          text not null,
  responsavel     text not null default 'eu',
  cliente         text,
  prazo           date,
  notas           text,
  finalizado      boolean not null default false,
  finalizado_em   timestamptz,
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now()
);

-- Trigger: toda vez que a linha for atualizada, refresca atualizado_em.
-- Isso é o que faz o contador de "dias sem movimento" funcionar — quando
-- você troca o responsável (ou qualquer coisa), o timer reinicia.
create or replace function public.touch_atualizado_em()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_atualizado_em on public.tasks;
create trigger trg_touch_atualizado_em
  before update on public.tasks
  for each row
  execute function public.touch_atualizado_em();

-- Row Level Security: garante que cada usuário só enxerga suas próprias
-- tarefas. Como o app tem um único usuário, isso também protege contra
-- qualquer chamada anônima acessar os dados.
alter table public.tasks enable row level security;

drop policy if exists "tasks_select_own" on public.tasks;
create policy "tasks_select_own" on public.tasks
  for select using (auth.uid() = user_id);

drop policy if exists "tasks_insert_own" on public.tasks;
create policy "tasks_insert_own" on public.tasks
  for insert with check (auth.uid() = user_id);

drop policy if exists "tasks_update_own" on public.tasks;
create policy "tasks_update_own" on public.tasks
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "tasks_delete_own" on public.tasks;
create policy "tasks_delete_own" on public.tasks
  for delete using (auth.uid() = user_id);

-- Índices úteis para o dashboard.
create index if not exists idx_tasks_user_finalizado
  on public.tasks (user_id, finalizado);

create index if not exists idx_tasks_user_atualizado
  on public.tasks (user_id, atualizado_em desc);

create index if not exists idx_tasks_user_prazo
  on public.tasks (user_id, prazo);
