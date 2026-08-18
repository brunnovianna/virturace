-- VirtuRace — schema inicial (Postgres / Neon)
--
-- Como aplicar sem terminal: cole este arquivo inteiro no SQL Editor do Neon
-- (ou em Hasura Console -> Data -> SQL, marcando "Track this").
-- Idempotente: pode rodar mais de uma vez sem quebrar.

create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  distance_km numeric not null check (distance_km > 0),
  start_date date not null,
  end_date date not null,
  created_by uuid not null references public.users (id),
  created_at timestamptz not null default now(),
  constraint events_period_valid check (end_date >= start_date)
);

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  status text not null default 'registered'
    check (status in ('registered', 'completed')),
  registered_at timestamptz not null default now(),
  completed_at timestamptz,
  -- Foto de conclusão como data URL (v1). Se o volume crescer, migrar para
  -- storage de objetos (R2/Blob) guardando aqui só a URL.
  proof_photo text,
  constraint registrations_one_per_event unique (event_id, user_id)
);

create index if not exists registrations_event_idx on public.registrations (event_id);
create index if not exists registrations_user_idx on public.registrations (user_id);
create index if not exists events_start_idx on public.events (start_date);
