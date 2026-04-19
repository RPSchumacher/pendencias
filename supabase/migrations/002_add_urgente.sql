-- =============================================================
-- Migração 002 — adiciona flag "urgente"
-- Rode este SQL no Supabase → SQL Editor → New query.
-- É idempotente (pode rodar mais de uma vez sem quebrar nada).
-- =============================================================

alter table public.tasks
  add column if not exists urgente boolean not null default false;
