-- ============================================================================
-- 20260727_allergens_public_read.sql
-- §67 — Lettura pubblica delle tabelle allergeni per il client del sito.
--
-- Policy GIÀ APPLICATE MANUALMENTE in DEV il 2026-07-27 (SQL editor Supabase);
-- questo file serve per tracciamento/riproducibilità e per il go-live in
-- produzione. Idempotente: "enable rls" è sicuro se già attivo, e ogni policy
-- è preceduta da "drop policy if exists" così può essere rieseguita.
--
-- SOLO SELECT: il client pubblico (anon) può LEGGERE gli allergeni, mai
-- modificarli. Le scritture avvengono solo server-side con la service key.
-- La stessa esposizione in lettura vale già per le tabelle menu (products,
-- sauces): qui la si estende alle tabelle allergeni popolate in §67.
--
-- NON applicare senza verifica; già applicato a DEV.
-- ============================================================================

alter table allergens          enable row level security;
alter table product_allergens  enable row level security;
alter table sauce_allergens    enable row level security;

drop policy if exists "Public read access" on allergens;
drop policy if exists "Public read access" on product_allergens;
drop policy if exists "Public read access" on sauce_allergens;

create policy "Public read access" on allergens
  for select to anon, authenticated using (true);
create policy "Public read access" on product_allergens
  for select to anon, authenticated using (true);
create policy "Public read access" on sauce_allergens
  for select to anon, authenticated using (true);
