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

-- Modalidades da corrida: uma prova pode ter várias (caminhada 3km, corrida
-- 10km...). A distância mora aqui, não mais no evento. `events.distance_km`
-- vira legado (ver alteração abaixo) — nada novo escreve nela.
create table if not exists public.event_modalities (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  kind text not null check (kind in ('walk', 'run')),
  distance_km numeric not null check (distance_km > 0),
  created_at timestamptz not null default now()
);

-- Distância deixou de ser do evento; solta o not null para não travar inserts
-- do novo fluxo (sem quebrar linhas antigas, que continuam preenchidas).
alter table public.events alter column distance_km drop not null;

-- Cada inscrição escolhe uma modalidade. Fica anulável de propósito: linhas
-- antigas (e a janela de deploy entre metadata e código) não têm modalidade.
alter table public.registrations
  add column if not exists modality_id uuid
    references public.event_modalities (id) on delete set null;

-- Backfill: todo evento existente ganha uma modalidade 'run' com a distância
-- que tinha, e as inscrições apontam para ela. Idempotente (só age no que falta).
insert into public.event_modalities (event_id, kind, distance_km)
select e.id, 'run', e.distance_km
from public.events e
where e.distance_km is not null
  and not exists (
    select 1 from public.event_modalities m where m.event_id = e.id
  );

update public.registrations r
set modality_id = m.id
from public.event_modalities m
where r.modality_id is null
  and m.event_id = r.event_id;

-- O `event_id` da inscrição é derivado da modalidade: o cliente manda só
-- `modality_id` e o trigger preenche o evento, garantindo que casem. Mantém a
-- unique(event_id, user_id) valendo como "uma pista por corrida por pessoa".
-- Só age quando há modalidade (o fluxo legado, que manda event_id direto,
-- continua funcionando na janela de deploy).
create or replace function public.set_registration_event_id()
returns trigger language plpgsql as $$
begin
  if new.modality_id is not null then
    select event_id into new.event_id
    from public.event_modalities
    where id = new.modality_id;
  end if;
  return new;
end;
$$;

drop trigger if exists registrations_set_event_id on public.registrations;
create trigger registrations_set_event_id
  before insert on public.registrations
  for each row execute function public.set_registration_event_id();

create index if not exists registrations_event_idx on public.registrations (event_id);
create index if not exists registrations_user_idx on public.registrations (user_id);
create index if not exists registrations_modality_idx on public.registrations (modality_id);
create index if not exists event_modalities_event_idx on public.event_modalities (event_id);
create index if not exists events_start_idx on public.events (start_date);
