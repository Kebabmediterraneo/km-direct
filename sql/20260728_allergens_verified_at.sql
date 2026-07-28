-- KM Direct — MASTER_SPEC v29, §67 e §30
-- Prerequisito della Fase 2A dell'editor menu.
-- Da eseguire nel SQL editor di Supabase: Claude Code non esegue DDL.

-- PRE-CHECK ---------------------------------------------------------------
select count(*) as prodotti_totali from products;                                -- atteso 55
select count(*) as salse_totali    from sauces;                                  -- atteso 7
select count(*) as food from products where category not in ('drink','birre');   -- atteso 34
select count(*) as salse_vegane from sauces where is_vegan = true;               -- atteso 4

-- DDL ---------------------------------------------------------------------
alter table products add column if not exists allergens_verified_at timestamptz;
alter table sauces   add column if not exists allergens_verified_at timestamptz;
alter table sauces   add column if not exists is_vegetarian boolean;

-- BACKFILL: registro delle verifiche al 28/07/2026 (§67) -------------------
-- Data fissa e non now(): è la data delle conferme registrate in spec,
-- indipendente da quando questa migration viene eseguita.
update products
   set allergens_verified_at = timestamptz '2026-07-28 00:00:00+02'
 where category not in ('drink','birre')
   and allergens_verified_at is null;

update sauces
   set allergens_verified_at = timestamptz '2026-07-28 00:00:00+02'
 where allergens_verified_at is null;

-- Coerenza §67: vegano implica vegetariano. Applicata alle sole salse
-- gia' dichiarate vegane. Le altre restano NULL, da compilare dal pannello.
update sauces
   set is_vegetarian = true
 where is_vegan = true
   and is_vegetarian is null;

-- POST-CHECK --------------------------------------------------------------
select count(*) from products where allergens_verified_at is not null;  -- atteso 34
select count(*) from products where allergens_verified_at is null;      -- atteso 21
select category, count(*) from products
 where allergens_verified_at is null group by category;                 -- atteso drink 15, birre 6
select count(*) from sauces where allergens_verified_at is not null;    -- atteso 7
select count(*) from sauces where is_vegetarian = true;                 -- atteso 4
select count(*) from sauces where is_vegetarian is null;                -- atteso 3
select count(*) from sauces where is_vegan = true and is_vegetarian is not true; -- atteso 0
