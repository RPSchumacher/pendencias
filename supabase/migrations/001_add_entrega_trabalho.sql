-- =============================================================
-- Migração 001 — adiciona flag "acompanhamento de entrega de trabalho"
-- Rode este SQL no Supabase → SQL Editor → New query.
-- É idempotente (pode rodar mais de uma vez sem quebrar nada).
-- =============================================================

alter table public.tasks
  add column if not exists entrega_trabalho boolean not null default false;
