-- ============================================================================
-- 20260723_store_schedule_exceptions.sql
-- §68 — Chiusure eccezionali del punto vendita (turni chiusi per data).
--
-- Migrazione manuale da applicare nel SQL editor del progetto Supabase DEV.
-- Idempotente: usa "if not exists" / "drop ... if exists" così può essere
-- rieseguita senza errori. La stessa definizione è anche in coda a
-- km_direct_schema.sql (fonte autorevole dello schema completo).
--
-- NON applicare a produzione.
-- ============================================================================

create table if not exists store_schedule_exceptions (
  id                  uuid primary key default gen_random_uuid(),
  store_id            uuid not null references stores(id) on delete cascade,
  exception_group_id  uuid not null,                -- collante logico dell'eccezione (§68.1)
  date                date not null,
  closure_type        text not null check (closure_type in ('full_day', 'lunch', 'dinner')),
  reason              text,                          -- visibile solo allo staff, mai al cliente (§68.3)
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  created_by          uuid,                          -- id staff user (auth.users), per audit
  unique (store_id, date, closure_type)              -- vincolo §68.1 (anche fra gruppi diversi)
);

-- Indici per le query di calcolo finestre (§68.4) e per le operazioni di gruppo (§68.3).
create index if not exists idx_store_schedule_exceptions_store_date
  on store_schedule_exceptions (store_id, date);
create index if not exists idx_store_schedule_exceptions_store_group
  on store_schedule_exceptions (store_id, exception_group_id);

-- set_updated_at() è già definita dallo schema principale (km_direct_schema.sql,
-- sezione 12). Ridichiarata qui con "create or replace" solo per rendere questo
-- file autoconsistente e idempotente — è la stessa identica funzione, non un
-- pattern nuovo.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_store_schedule_exceptions_updated_at on store_schedule_exceptions;
create trigger trg_store_schedule_exceptions_updated_at
  before update on store_schedule_exceptions
  for each row execute function set_updated_at();
