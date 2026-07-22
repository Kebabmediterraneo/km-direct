-- ============================================================================
-- KM DIRECT — DATABASE SCHEMA (PostgreSQL / Supabase)
-- ============================================================================
-- Basato su: KM Direct Master Specification
-- Principi guida applicati in questo schema:
--   - store_id obbligatorio ovunque, anche con un solo store attivo (§5, §64)
--   - Roll e Bowl sono articoli distinti anche a livello di database (§16)
--   - Prezzi ricalcolati e congelati server-side, snapshot immutabile (§46, §66)
--   - Stato ordine e stato consegna separati (§54)
--   - GIVEMEFIVE con anti-abuso: un utilizzo per cliente, solo su ordine
--     valido/completato (§14, §62)
--   - Dati Glovo predisposti ma NON integrati via API in fase 1 (§57-§61)
--   - Allergeni predisposti, elenco da completare prima del go-live (§67)
-- ============================================================================

create extension if not exists "pgcrypto";

-- ============================================================================
-- 1. ENUM TYPES
-- ============================================================================

create type fulfillment_type as enum ('delivery', 'pickup');

create type delivery_timing_type as enum ('asap', 'scheduled');

create type service_status as enum ('open', 'closed_hours', 'paused_manual', 'unavailable');

create type product_category as enum (
  'roll', 'bowl', 'menu_combo', 'fritti', 'sides', 'salse', 'dolci', 'drink', 'birre'
);

-- 'ritirato' è lo stato finale esclusivo del Ritiro (raggiungibile solo da
-- ordini con fulfillment='pickup'), parallelo a 'consegnato_al_rider' che
-- resta esclusivo della Delivery — mai mescolati (§52-56, correzione spec).
create type order_status as enum (
  'nuovo', 'in_preparazione', 'pronto', 'ritirato', 'consegnato_al_rider', 'problema', 'annullato'
);

-- Rilevante solo per ordini Delivery. Per Ritiro lo stato "delivery" resta NULL.
create type delivery_status as enum (
  'da_richiedere', 'rider_richiesto', 'problema_rider', 'consegnato_al_rider'
);

create type payment_status as enum (
  'pending', 'succeeded', 'failed', 'refunded', 'partially_refunded'
);

create type protein_key as enum (
  'pollo_tacchino', 'planted', 'adana', 'nessuna'
);

create type analytics_event_type as enum (
  'visita', 'indirizzo_inserito', 'servibile', 'non_servibile', 'prodotto_aggiunto',
  'soglia_15_raggiunta', 'soglia_25_raggiunta', 'givemefive_applicato',
  'checkout_iniziato', 'pagamento_completato', 'ordine_annullato'
);

-- ============================================================================
-- 2. STORE (§5, §64 — predisposizione multi-store dal giorno 1)
-- ============================================================================

create table stores (
  id uuid primary key default gen_random_uuid(),
  name text not null,                          -- es. "KM San Mamolo"
  slug text not null unique,                    -- es. "san-mamolo"
  address text not null,
  latitude numeric(10, 7) not null,
  longitude numeric(10, 7) not null,
  is_active boolean not null default true,

  -- Fee e soglie — predisposte per store (§64), oggi identiche per l'unico store
  delivery_fee numeric(6,2) not null default 2.50,
  delivery_min_order numeric(6,2) not null default 15.00,

  -- Stato servizio (§7)
  service_status service_status not null default 'open',
  paused_reason text,                           -- usato quando service_status = 'paused_manual'

  -- Riferimento Glovo On-Demand (§61, §64) — predisposto, non integrato via API
  glovo_outlet_id text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table stores is 'Un solo store attivo oggi (KM San Mamolo). Nessun selettore store va mostrato al cliente finché ne esiste uno solo (§5).';

-- Orari di apertura ordini Delivery, per giorno della settimana (§13)
-- day_of_week: 0 = domenica ... 6 = sabato (convenzione ISO opzionale, va fissata in app)
create table store_order_windows (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  opens_at time not null,
  closes_at time not null,
  is_defined boolean not null default true,     -- false per la domenica finché non viene definita (§13)
  created_at timestamptz not null default now()
);

-- Geofence di consegna, verificata su coordinate e non su CAP (§10)
-- geography(Polygon) richiede l'estensione postgis; in alternativa si può
-- salvare come GeoJSON in jsonb se postgis non è disponibile su Supabase.
create table store_geofences (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  polygon jsonb not null,                       -- GeoJSON Polygon
  is_active boolean not null default true,
  source text default 'manuale',                -- es. 'manuale' | 'calibrato_da_glovo'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 3. MENU: PRODOTTI E CONFIGURAZIONI
-- ============================================================================

create table products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  category product_category not null,
  slug text not null,                           -- es. "il-turco-roll", "il-turco-bowl"
  name text not null,                           -- es. "Il Turco"
  description text,
  base_price numeric(6,2) not null,
  badge text,                                   -- es. "TOP CHOICE", "VEGAN", "VEGGIE"
  spice_level smallint not null default 0,      -- 0 = non piccante, conteggio 🌶️
  spice_label text,                             -- es. "Leggermente piccante" (§35 — mai solo icone)
  image_url text,
  sort_order integer not null default 0,
  is_available boolean not null default true,   -- disponibile/esaurito, indipendente per Roll/Bowl (§63)
  contains_gluten boolean,
  contains_lactose boolean,
  is_vegan boolean,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (store_id, slug)
);

comment on table products is 'Roll e Bowl sono righe separate (category = roll / bowl), anche per la stessa ricetta concettuale (§16, §20).';

-- Scelta singola obbligatoria, mai multipla (§17), generica: copre sia la
-- proteina (Roll/Bowl, §17) sia altre scelte non-proteina come il "Gusto"
-- di Cheesecake/Yogurt turco (§31). choice_key è testo libero apposta:
-- un enum chiuso pensato solo per Pollo/Planted/Adana non può rappresentare
-- "baklava"/"dubai-style" senza forzature (§31, nota tecnica).
-- Non tutti i prodotti hanno questa scelta (es. L''Egiziano e Il Cipriota
-- non hanno scelta proteina, §19).
create table product_choice_options (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  choice_label text not null default 'Proteina', -- es. "Proteina", "Gusto"
  choice_key text not null,                     -- es. "pollo_tacchino", "baklava"
  label text not null,                          -- es. "Adana"
  price_delta numeric(6,2) not null default 0,  -- es. +4.50
  is_default boolean not null default false,
  extra_dose_included boolean not null default false, -- es. KM Special: incluso con Pollo/Adana, non con Planted (§19)
  sort_order integer not null default 0
);

-- Rimozioni multiple, guidate, definite prodotto per prodotto (§18)
create table product_removals (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  label text not null,                          -- es. "Senza hummus"
  sort_order integer not null default 0
);

-- Extra facoltativi condizionati (es. +100g carne solo con Pollo e tacchino, §22)
create table product_addons (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  label text not null,                          -- es. "+100 g di carne"
  price numeric(6,2) not null,
  requires_protein protein_key,                 -- NULL = sempre disponibile; altrimenti condizionato
  max_quantity smallint default 1,              -- KM Special Bowl può avere più extra dosi cumulate (§22)
  sort_order integer not null default 0
);

-- Accompagnamento Bowl: scelta obbligatoria singola, nessun default preselezionato (§21)
create table product_accompaniments (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade, -- solo per category = 'bowl'
  label text not null,                          -- "Bulgur" | "Riso integrale" | "No bulgur e no riso"
  contains_gluten boolean not null default false,
  sort_order integer not null default 0
);

-- Salse — categoria autonoma, tutte a 1€, con flag vegano esplicito (§30)
-- Black KM è l'unica NON vegana: il flag va sempre valorizzato esplicitamente,
-- mai assunto per default.
create table sauces (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  name text not null,
  description text,
  price numeric(6,2) not null default 1.00,
  is_vegan boolean not null,
  is_available boolean not null default true,
  sort_order integer not null default 0
);

-- ============================================================================
-- 4. MENU COMBO (§23-§26)
-- ============================================================================
-- Struttura aperta: non hardcodare "patatine" come unico contorno possibile,
-- né i soft drink come lista fissa (§24).

create table combo_side_options (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  label text not null,                          -- es. "Patatine standard", "Patatine KM"
  price_delta numeric(6,2) not null default 0,  -- 0 = incluso
  is_default boolean not null default false,
  is_available boolean not null default true,
  sort_order integer not null default 0
);

-- Soft drink ammessi nel combo, con soglia di prezzo incluso (§24: fino a 2.50€ incluse)
create table combo_drink_options (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  drink_product_id uuid not null references products(id) on delete cascade, -- deve appartenere a category='drink'
  price_delta numeric(6,2) not null default 0,  -- calcolato da regola soglia, ma salvato esplicito
  is_available boolean not null default true,
  sort_order integer not null default 0
);

create table combo_pricing (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  roll_product_id uuid not null references products(id) on delete cascade,
  combo_base_price numeric(6,2) not null,       -- 13.00 standard, 16.00 KM Special (§25)
  is_active boolean not null default true,

  unique (store_id, roll_product_id)
);

-- ============================================================================
-- 5. ALLERGENI (§67 — predisposto, elenco da completare prima del go-live)
-- ============================================================================

create table allergens (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,                    -- es. "glutine", "lattosio", "frutta_secca"
  label text not null
);

create table product_allergens (
  product_id uuid not null references products(id) on delete cascade,
  allergen_id uuid not null references allergens(id) on delete cascade,
  primary key (product_id, allergen_id)
);

create table sauce_allergens (
  sauce_id uuid not null references sauces(id) on delete cascade,
  allergen_id uuid not null references allergens(id) on delete cascade,
  primary key (sauce_id, allergen_id)
);

-- ============================================================================
-- 6. CLIENTI
-- ============================================================================
-- Nessun account/login in fase 1 (§70). Il record customers serve solo per
-- identificare il cliente su più ordini (es. anti-abuso GIVEMEFIVE, §14) e
-- per predisporre la futura Fase 3 (account, riordina, loyalty).

create table customers (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  phone text not null,                          -- identificatore principale (§14, §42)
  email text,                                    -- controllo secondario, facoltativo
  marketing_opt_in boolean not null default false,
  marketing_opt_in_at timestamptz,
  marketing_text_version text,                  -- versione del testo di consenso mostrato (§45)
  privacy_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (phone)
);

-- ============================================================================
-- 7. ORDINI
-- ============================================================================

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_token text not null unique default encode(gen_random_bytes(16), 'hex'), -- URL non prevedibile (§66)
  store_id uuid not null references stores(id),
  customer_id uuid not null references customers(id),

  fulfillment fulfillment_type not null,
  pickup_code text unique,                      -- es. "KM-0042" (§58)

  -- Delivery
  delivery_timing delivery_timing_type,
  scheduled_delivery_at timestamptz,
  delivery_address text,
  delivery_civico text,
  delivery_citofono text,
  delivery_piano_interno text,
  delivery_edificio_scala text,
  delivery_note_rider text,
  delivery_latitude numeric(10,7),
  delivery_longitude numeric(10,7),

  -- Stati separati cucina / consegna (§54)
  status order_status not null default 'nuovo',
  delivery_status delivery_status,              -- NULL per ordini pickup

  -- Dati Glovo (§57, §58) — inseriti manualmente in fase 1, nessuna automazione API
  external_delivery_id text,                    -- ID assegnato da Glovo On-Demand

  -- Pricing — snapshot immutabile server-side (§46, §66)
  subtotal numeric(8,2) not null,
  delivery_fee numeric(6,2) not null default 0,
  discount_amount numeric(6,2) not null default 0,
  total numeric(8,2) not null,

  -- Promo
  coupon_code text,                             -- es. "GIVEMEFIVE" o codice futuro generico

  -- Pagamento (§46)
  payment_status payment_status not null default 'pending',
  stripe_payment_intent_id text,
  stripe_checkout_session_id text,

  -- Compliance
  age_declared_18 boolean not null default false, -- obbligatorio solo se carrello contiene alcolici (§33)
  privacy_accepted_at timestamptz not null,

  -- Motivo annullamento (§65 analytics + §62 nessun rider disponibile)
  cancellation_reason text,

  idempotency_key text unique,                  -- prevenzione doppio ordine (§46)

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column orders.order_token is 'Usato nell''URL di conferma/stato ordine lato cliente. Non deve essere prevedibile né sequenziale (§66).';
comment on column orders.pickup_code is 'Doppio uso: ID interno leggibile e pickup code Glovo, per allineare i sistemi (§58).';

create index idx_orders_store_status on orders(store_id, status);
create index idx_orders_customer on orders(customer_id);

-- Righe ordine, con configurazione "congelata" al momento dell'acquisto.
-- La configurazione (proteina, rimozioni, addon, accompagnamento, salse,
-- eventuali componenti combo) viene salvata come snapshot in jsonb: anche se
-- il prodotto o le sue opzioni cambiano in futuro, lo storico ordine resta
-- fedele a ciò che il cliente ha effettivamente ordinato (§66).
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id),     -- nullable: il prodotto potrebbe essere eliminato in futuro
  product_name_snapshot text not null,
  category_snapshot product_category not null,
  quantity smallint not null default 1 check (quantity > 0),
  unit_price_snapshot numeric(6,2) not null,
  line_total numeric(8,2) not null,

  is_combo boolean not null default false,
  configuration jsonb not null default '{}'::jsonb,
  -- Esempio configuration per un Roll:
  -- {
  --   "protein": {"key": "adana", "label": "Adana", "price_delta": 4.50},
  --   "removals": ["Senza hummus", "Non piccante"],
  --   "addons": [],
  --   "accompaniment": null,
  --   "sauces": []
  -- }
  -- Esempio configuration per un Menu Combo:
  -- {
  --   "roll": {"product_id": "...", "name": "Il Greco", "protein": {...}, "removals": [...]},
  --   "side": {"label": "Patatine KM", "price_delta": 0.50},
  --   "drink": {"product_id": "...", "name": "Tè al limone", "price_delta": 0}
  -- }

  created_at timestamptz not null default now()
);

create index idx_order_items_order on order_items(order_id);

-- Storico stati, per audit trail e analytics tempi (§65, §66)
create table order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  status_type text not null check (status_type in ('order_status', 'delivery_status')),
  status_value text not null,
  changed_by text,                              -- 'staff:<user>' oppure 'system'
  changed_at timestamptz not null default now()
);

create index idx_order_status_history_order on order_status_history(order_id);

-- ============================================================================
-- 8. PROMOZIONI (§14, §62)
-- ============================================================================

create table promo_redemptions (
  id uuid primary key default gen_random_uuid(),
  promo_code text not null,                     -- "GIVEMEFIVE"
  customer_id uuid not null references customers(id),
  order_id uuid not null references orders(id),
  redeemed_at timestamptz not null default now(),

  -- Un solo utilizzo per cliente (identificato per telefono); l'unicità va
  -- garantita qui e ri-verificata server-side prima di applicare lo sconto.
  unique (promo_code, customer_id)
);

comment on table promo_redemptions is 'Riga inserita SOLO quando l''ordine è valido/completato. Non va creata per pagamento fallito, ordine abbandonato o annullato per rider non disponibile (§14, §62).';

-- Coupon generico per codici futuri, oltre a GIVEMEFIVE (§14)
create table coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_amount numeric(6,2),
  discount_percent numeric(5,2),
  min_order_amount numeric(6,2),
  applies_to_delivery boolean not null default true,
  applies_to_pickup boolean not null default true,
  valid_from timestamptz,
  valid_until timestamptz,
  max_redemptions_per_customer smallint default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 9. IMPOSTAZIONI STAFF (§55)
-- ============================================================================

create table staff_settings (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  staff_notification_phone text,                -- numero WhatsApp operativo per alert nuovo ordine
  quiet_hours_start time,                        -- per logica feedback Calton (§51)
  quiet_hours_end time,
  feedback_delay_minutes integer not null default 90, -- 90 minuti dopo "Consegnato al rider" (§51)

  unique (store_id)
);

-- ============================================================================
-- 10. ANALYTICS (§65)
-- ============================================================================

create table analytics_events (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references stores(id),
  session_id text not null,
  event_type analytics_event_type not null,
  order_id uuid references orders(id),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_analytics_events_session on analytics_events(session_id);
create index idx_analytics_events_type_created on analytics_events(event_type, created_at);

-- ============================================================================
-- 11. LOG AZIONI STAFF (§66 — audit trail minimo)
-- ============================================================================

create table staff_action_log (
  id uuid primary key default gen_random_uuid(),
  staff_identifier text not null,               -- utente/admin autenticato che ha eseguito l'azione
  order_id uuid references orders(id),
  action text not null,                         -- es. "annulla_ordine", "richiedi_rider", "modifica_stato"
  detail jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 12. TRIGGER updated_at
-- ============================================================================

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_stores_updated_at before update on stores
  for each row execute function set_updated_at();
create trigger trg_products_updated_at before update on products
  for each row execute function set_updated_at();
create trigger trg_customers_updated_at before update on customers
  for each row execute function set_updated_at();
create trigger trg_orders_updated_at before update on orders
  for each row execute function set_updated_at();
create trigger trg_geofences_updated_at before update on store_geofences
  for each row execute function set_updated_at();

-- ============================================================================
-- 13. SEED MINIMO — store unico (§5)
-- ============================================================================

insert into stores (name, slug, address, latitude, longitude)
values ('KM San Mamolo', 'san-mamolo', 'Via San Mamolo 25/A, Bologna', 44.4900, 11.3350);
-- NB: latitude/longitude segnaposto, da sostituire con le coordinate esatte
-- del locale prima del go-live (necessarie per il calcolo geofence, §10).

-- ============================================================================
-- 14. CHIUSURE ECCEZIONALI PROGRAMMATE (§68)
-- ============================================================================
-- Turni chiusi per data specifica (ferie, festività, eventi). Una riga per
-- giorno/turno; tutte le righe generate da una singola operazione dello staff
-- condividono lo stesso exception_group_id (collante logico, §68.1). La UI
-- (§68.3) gestisce le eccezioni a livello di gruppo; il DB tiene una riga per
-- giorno per semplicità delle query di calcolo finestre (§68.4).

create table store_schedule_exceptions (
  id                  uuid primary key default gen_random_uuid(),
  store_id            uuid not null references stores(id) on delete cascade,
  exception_group_id  uuid not null,
  date                date not null,
  closure_type        text not null check (closure_type in ('full_day', 'lunch', 'dinner')),
  reason              text,                          -- visibile solo allo staff, mai al cliente (§68.3)
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  created_by          uuid,                          -- id staff user (auth.users), per audit
  unique (store_id, date, closure_type)              -- §68.1: no duplicati identici, anche fra gruppi
);

create index idx_store_schedule_exceptions_store_date
  on store_schedule_exceptions (store_id, date);
create index idx_store_schedule_exceptions_store_group
  on store_schedule_exceptions (store_id, exception_group_id);

create trigger trg_store_schedule_exceptions_updated_at before update on store_schedule_exceptions
  for each row execute function set_updated_at();
