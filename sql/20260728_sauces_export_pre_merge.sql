-- ============================================================================
-- EXPORT DI SICUREZZA — fotografia di `sauces` e `sauce_allergens`
-- PRIMA dell'unificazione delle salse dentro `products` (§30, MASTER_SPEC v32).
-- Data: 2026-07-28.
-- ============================================================================
--
-- A COSA SERVE (anche per chi non conosce SQL):
--   Le salse stanno oggi in due tabelle separate (`sauces` e la tabella-ponte
--   degli allergeni `sauce_allergens`). La v32 (§30, punto 7) prevede di
--   spostarle dentro `products`. Questo file e' una FOTOGRAFIA di com'erano
--   quelle due tabelle un attimo prima dello spostamento: se qualcosa nella
--   migrazione andasse storto, da qui si possono ricreare le tabelle e
--   rimettere dentro esattamente le stesse righe. Non modifica nulla di per se':
--   va eseguito a mano solo se serve ripristinare.
--
-- LE 7 SALSE FOTOGRAFATE (nome | prezzo | numero di allergeni):
--   1. Ajvar            | 1,00 € | 0 allergeni
--   2. Ajvar piccante   | 1,00 € | 0 allergeni
--   3. Tzatziki         | 1,00 € | 1 allergene
--   4. Acuka            | 1,00 € | 1 allergene
--   5. Black KM         | 1,00 € | 2 allergeni
--   6. Yogurt           | 1,00 € | 1 allergene
--   7. Salsa all'aglio  | 1,00 € | 1 allergene
--
-- CONTEGGI DI RIFERIMENTO letti dal database il 2026-07-28
-- (servono come POST-CHECK dopo la migrazione — vanno riscontrati a mano):
--   - `sauces`                      : 7 righe
--   - `sauce_allergens`             : 6 righe
--   - `products`                    : 55 righe
--   - `product_allergens`           : 70 righe
--   - `products` con category='salse': 0 righe (atteso 0, oggi nessuna salsa e' un prodotto)
--
-- Query per rileggere gli stessi conteggi:
--   select count(*) from sauces;                              -- atteso 7
--   select count(*) from sauce_allergens;                     -- atteso 6
--   select count(*) from products;                            -- atteso 55
--   select count(*) from product_allergens;                   -- atteso 70
--   select count(*) from products where category = 'salse';   -- atteso 0
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1) DDL — ricrea le due tabelle (verbatim da km_direct_schema.sql, con
--    `if not exists` per non fallire se esistono gia'). Chiavi e foreign key
--    incluse.
-- ----------------------------------------------------------------------------

create table if not exists sauces (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id) on delete cascade,
  name text not null,
  description text,
  price numeric(6,2) not null default 1.00,
  is_vegan boolean not null,
  is_available boolean not null default true,
  sort_order integer not null default 0,
  allergens_verified_at timestamptz,
  is_vegetarian boolean,
  badge text,
  spice_level smallint not null default 0,
  spice_label text,
  image_url text
);

create table if not exists sauce_allergens (
  sauce_id uuid not null references sauces(id) on delete cascade,
  allergen_id uuid not null references allergens(id) on delete cascade,
  primary key (sauce_id, allergen_id)
);


-- ----------------------------------------------------------------------------
-- 2) DATI — ripristino di tutte le righe, con elenco esplicito delle colonne,
--    tutti i campi (id, store_id e timestamp compresi), NULL dove il valore e'
--    nullo, timestamp nel formato originale del database.
-- ----------------------------------------------------------------------------

-- 7 righe di `sauces`:
insert into sauces (id, store_id, name, description, price, is_vegan, is_available, sort_order, allergens_verified_at, is_vegetarian, badge, spice_level, spice_label, image_url) values ('b892febd-ad4a-4c0d-87bf-f371723a75b2', 'f2124c1c-1155-4e6b-8e3f-cbe0e42b7e3c', 'Ajvar', NULL, 1, true, true, 0, '2026-07-27T22:00:00+00:00', true, NULL, 0, NULL, NULL);
insert into sauces (id, store_id, name, description, price, is_vegan, is_available, sort_order, allergens_verified_at, is_vegetarian, badge, spice_level, spice_label, image_url) values ('8efcec18-2994-493c-ba26-8b42ae1a167a', 'f2124c1c-1155-4e6b-8e3f-cbe0e42b7e3c', 'Ajvar piccante', NULL, 1, true, true, 1, '2026-07-27T22:00:00+00:00', true, NULL, 0, NULL, NULL);
insert into sauces (id, store_id, name, description, price, is_vegan, is_available, sort_order, allergens_verified_at, is_vegetarian, badge, spice_level, spice_label, image_url) values ('1fb5cbd2-2dc9-421c-958b-dae6fdcfb48a', 'f2124c1c-1155-4e6b-8e3f-cbe0e42b7e3c', 'Tzatziki', NULL, 1, false, true, 2, '2026-07-27T22:00:00+00:00', NULL, NULL, 0, NULL, NULL);
insert into sauces (id, store_id, name, description, price, is_vegan, is_available, sort_order, allergens_verified_at, is_vegetarian, badge, spice_level, spice_label, image_url) values ('975fce50-733b-40e2-9394-c33d00b12e28', 'f2124c1c-1155-4e6b-8e3f-cbe0e42b7e3c', 'Acuka', NULL, 1, true, true, 3, '2026-07-27T22:00:00+00:00', true, NULL, 0, NULL, NULL);
insert into sauces (id, store_id, name, description, price, is_vegan, is_available, sort_order, allergens_verified_at, is_vegetarian, badge, spice_level, spice_label, image_url) values ('c699fb9d-30bc-4399-92e4-085bcbc6477a', 'f2124c1c-1155-4e6b-8e3f-cbe0e42b7e3c', 'Black KM', NULL, 1, false, true, 4, '2026-07-28T17:01:36.956+00:00', true, NULL, 0, NULL, NULL);
insert into sauces (id, store_id, name, description, price, is_vegan, is_available, sort_order, allergens_verified_at, is_vegetarian, badge, spice_level, spice_label, image_url) values ('c9b3486a-1e95-4268-b7dc-bfedebf10605', 'f2124c1c-1155-4e6b-8e3f-cbe0e42b7e3c', 'Yogurt', NULL, 1, false, true, 5, '2026-07-27T22:00:00+00:00', NULL, NULL, 0, NULL, NULL);
insert into sauces (id, store_id, name, description, price, is_vegan, is_available, sort_order, allergens_verified_at, is_vegetarian, badge, spice_level, spice_label, image_url) values ('8a636a99-13e4-43b1-872e-78c1a325aeb5', 'f2124c1c-1155-4e6b-8e3f-cbe0e42b7e3c', 'Salsa all''aglio', NULL, 1, true, true, 6, '2026-07-27T22:00:00+00:00', true, NULL, 0, NULL, NULL);

-- 6 righe di `sauce_allergens`:
insert into sauce_allergens (sauce_id, allergen_id) values ('1fb5cbd2-2dc9-421c-958b-dae6fdcfb48a', 'b4b9b93c-f8cb-41a8-8801-f984318110f4');
insert into sauce_allergens (sauce_id, allergen_id) values ('8a636a99-13e4-43b1-872e-78c1a325aeb5', '96ed3fe8-9e8e-422b-b5aa-0b9f85586653');
insert into sauce_allergens (sauce_id, allergen_id) values ('975fce50-733b-40e2-9394-c33d00b12e28', 'b85b0096-f3c2-40ab-9a43-00e0593c8824');
insert into sauce_allergens (sauce_id, allergen_id) values ('c699fb9d-30bc-4399-92e4-085bcbc6477a', '96ed3fe8-9e8e-422b-b5aa-0b9f85586653');
insert into sauce_allergens (sauce_id, allergen_id) values ('c699fb9d-30bc-4399-92e4-085bcbc6477a', 'b0783754-a0b2-4d11-a66f-64c11d19767f');
insert into sauce_allergens (sauce_id, allergen_id) values ('c9b3486a-1e95-4268-b7dc-bfedebf10605', 'b4b9b93c-f8cb-41a8-8801-f984318110f4');
