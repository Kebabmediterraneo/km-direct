-- ============================================================================
-- MIGRAZIONE — unificazione delle SALSE dentro `products` (§30, MASTER_SPEC v32)
-- Data: 2026-07-28.
-- ============================================================================
--
-- COSA FA (anche per chi non conosce SQL):
--   Fino a oggi le salse vivono in una tabella a parte (`sauces`). La v32 (§30)
--   stabilisce che le salse sono prodotti a tutti gli effetti: questo script
--   COPIA le 7 salse dentro la tabella `products` (categoria 'salse') e i loro
--   allergeni dentro `product_allergens`, mantenendo lo STESSO identificativo
--   (id) di prima. Alla fine ci saranno 7 prodotti in piu'.
--
-- COSA NON FA:
--   - NON cancella la tabella `sauces` ne' `sauce_allergens`: restano intatte.
--     La loro dismissione (DROP TABLE) e' un passo SEPARATO e SUCCESSIVO, da
--     fare solo dopo aver verificato menu pubblico, carrello, checkout e
--     pannello sui dati nuovi (§30, regola 6). Il DROP e' DDL e lo esegue
--     l'utente a mano nel SQL editor.
--   - NON tocca gli ordini: `order_items` non fa alcun riferimento alle salse
--     (§30, §66), quindi nessuna riga d'ordine viene modificata.
--
-- SICUREZZA:
--   Tutto e' avvolto in una transazione (begin ... commit): se anche un solo
--   controllo non torna, viene sollevato un errore e NULLA viene scritto.
--   Prima di eseguire deve essere gia' stato creato l'export di sicurezza
--   `sql/20260728_sauces_export_pre_merge.sql` (§30, regola 7): il database e'
--   uno solo, l'export e' l'unico modo di tornare indietro.
--
-- COME SI ESEGUE:
--   Va incollato ed eseguito nel SQL editor di Supabase (non passa da
--   PostgREST). Claude Code non lo esegue.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1) PRE-CHECK bloccanti — la fotografia attesa PRIMA della migrazione.
--    Se un valore non corrisponde, si ferma tutto senza scrivere niente.
-- ----------------------------------------------------------------------------
do $$
declare
  v_products   int;
  v_pa         int;
  v_sauces     int;
  v_sa         int;
  v_salse      int;
  v_id_coll    int;
  v_slug_coll  int;
  v_map_ok     int;
begin
  select count(*) into v_products from products;
  if v_products <> 55 then
    raise exception 'PRE-CHECK fallito: la tabella products ha % righe, attese 55. Migrazione annullata.', v_products;
  end if;

  select count(*) into v_pa from product_allergens;
  if v_pa <> 70 then
    raise exception 'PRE-CHECK fallito: product_allergens ha % righe, attese 70. Migrazione annullata.', v_pa;
  end if;

  select count(*) into v_sauces from sauces;
  if v_sauces <> 7 then
    raise exception 'PRE-CHECK fallito: la tabella sauces ha % righe, attese 7. Migrazione annullata.', v_sauces;
  end if;

  select count(*) into v_sa from sauce_allergens;
  if v_sa <> 6 then
    raise exception 'PRE-CHECK fallito: sauce_allergens ha % righe, attese 6. Migrazione annullata.', v_sa;
  end if;

  select count(*) into v_salse from products where category = 'salse';
  if v_salse <> 0 then
    raise exception 'PRE-CHECK fallito: esistono gia % prodotti con category=salse, attesi 0. Migrazione annullata.', v_salse;
  end if;

  -- Nessun id di sauces deve gia esistere fra i prodotti (gli id restano uguali, §30.1).
  select count(*) into v_id_coll from products p join sauces s on s.id = p.id;
  if v_id_coll <> 0 then
    raise exception 'PRE-CHECK fallito: % id di sauces sono gia presenti in products. Migrazione annullata.', v_id_coll;
  end if;

  -- Nessuno dei 7 slug proposti deve gia esistere in products, per lo stesso store.
  select count(*) into v_slug_coll
  from products p
  where p.slug in ('ajvar','ajvar-piccante','tzatziki','acuka','black-km','yogurt','salsa-all-aglio')
    and p.store_id in (select distinct store_id from sauces);
  if v_slug_coll <> 0 then
    raise exception 'PRE-CHECK fallito: % degli slug proposti per le salse esistono gia in products per lo stesso store. Migrazione annullata.', v_slug_coll;
  end if;

  -- I 7 id della mappatura esplicita devono esistere davvero in sauces
  -- (protegge la INSERT dal saltare silenziosamente una salsa se un id non torna).
  select count(*) into v_map_ok
  from sauces s
  where s.id in (
    'b892febd-ad4a-4c0d-87bf-f371723a75b2',
    '8efcec18-2994-493c-ba26-8b42ae1a167a',
    '1fb5cbd2-2dc9-421c-958b-dae6fdcfb48a',
    '975fce50-733b-40e2-9394-c33d00b12e28',
    'c699fb9d-30bc-4399-92e4-085bcbc6477a',
    'c9b3486a-1e95-4268-b7dc-bfedebf10605',
    '8a636a99-13e4-43b1-872e-78c1a325aeb5'
  );
  if v_map_ok <> 7 then
    raise exception 'PRE-CHECK fallito: la mappatura id->slug copre % delle 7 salse attese. Migrazione annullata.', v_map_ok;
  end if;

  raise notice 'PRE-CHECK superati: 55 prodotti, 70 allergeni prodotto, 7 salse, 6 allergeni salsa, 0 salse gia in products.';
end $$;

-- ----------------------------------------------------------------------------
-- 2) INSERT in products, leggendo da sauces.
--    - id, store_id, name, description, badge, spice_level, spice_label,
--      image_url, sort_order, is_available, is_vegan, is_vegetarian,
--      allergens_verified_at: invariati.
--    - base_price := price (§30.2).
--    - category := 'salse' (§30.3).
--    - slug: mappatura ESPLICITA id-per-id, scritta a mano qui sotto (§30.4),
--      NON calcolata da una funzione.
--    - created_at / updated_at: non presenti in sauces -> prendono il default now().
-- ----------------------------------------------------------------------------
with slugmap (id, slug) as (
  values
    ('b892febd-ad4a-4c0d-87bf-f371723a75b2'::uuid, 'ajvar'),           -- Ajvar
    ('8efcec18-2994-493c-ba26-8b42ae1a167a'::uuid, 'ajvar-piccante'),  -- Ajvar piccante
    ('1fb5cbd2-2dc9-421c-958b-dae6fdcfb48a'::uuid, 'tzatziki'),        -- Tzatziki
    ('975fce50-733b-40e2-9394-c33d00b12e28'::uuid, 'acuka'),           -- Acuka
    ('c699fb9d-30bc-4399-92e4-085bcbc6477a'::uuid, 'black-km'),        -- Black KM
    ('c9b3486a-1e95-4268-b7dc-bfedebf10605'::uuid, 'yogurt'),          -- Yogurt
    ('8a636a99-13e4-43b1-872e-78c1a325aeb5'::uuid, 'salsa-all-aglio')  -- Salsa all'aglio
)
insert into products (
  id, store_id, category, slug, name, description, base_price, badge,
  spice_level, spice_label, image_url, sort_order, is_available,
  is_vegan, is_vegetarian, allergens_verified_at
)
select
  s.id,
  s.store_id,
  'salse',                 -- category (§30.3)
  m.slug,                  -- slug esplicito (§30.4)
  s.name,
  s.description,
  s.price,                 -- price -> base_price (§30.2)
  s.badge,
  s.spice_level,
  s.spice_label,
  s.image_url,
  s.sort_order,
  s.is_available,
  s.is_vegan,
  s.is_vegetarian,
  s.allergens_verified_at
from sauces s
join slugmap m on m.id = s.id;

-- ----------------------------------------------------------------------------
-- 3) INSERT in product_allergens, leggendo da sauce_allergens.
--    product_id := sauce_id (l'id e' rimasto lo stesso), allergen_id invariato.
--    Va DOPO l'insert dei prodotti: la foreign key richiede che il prodotto esista.
-- ----------------------------------------------------------------------------
insert into product_allergens (product_id, allergen_id)
select sa.sauce_id, sa.allergen_id
from sauce_allergens sa;

-- ----------------------------------------------------------------------------
-- 4) POST-CHECK bloccanti — la fotografia attesa DOPO la migrazione, dentro la
--    STESSA transazione. Se un valore non torna, l'intera transazione viene
--    annullata (rollback) e nulla resta scritto.
-- ----------------------------------------------------------------------------
do $$
declare
  v_products    int;
  v_pa          int;
  v_salse       int;
  v_no_verified int;
  v_price_diff  int;
  v_dup_slug    int;
  v_all_rows    int;
  v_all_sauces  int;
begin
  select count(*) into v_products from products;
  if v_products <> 62 then
    raise exception 'POST-CHECK fallito: products ha % righe, attese 62. Transazione annullata.', v_products;
  end if;

  select count(*) into v_pa from product_allergens;
  if v_pa <> 76 then
    raise exception 'POST-CHECK fallito: product_allergens ha % righe, attese 76. Transazione annullata.', v_pa;
  end if;

  select count(*) into v_salse from products where category = 'salse';
  if v_salse <> 7 then
    raise exception 'POST-CHECK fallito: i prodotti con category=salse sono %, attesi 7. Transazione annullata.', v_salse;
  end if;

  -- Tutte e 7 le salse devono avere allergens_verified_at valorizzato (§67).
  select count(*) into v_no_verified from products where category = 'salse' and allergens_verified_at is null;
  if v_no_verified <> 0 then
    raise exception 'POST-CHECK fallito: % salse migrate hanno allergens_verified_at nullo, atteso 0. Transazione annullata.', v_no_verified;
  end if;

  -- base_price di ogni salsa migrata = price della riga originale in sauces (riga per riga).
  select count(*) into v_price_diff
  from products p join sauces s on s.id = p.id
  where p.category = 'salse' and p.base_price is distinct from s.price;
  if v_price_diff <> 0 then
    raise exception 'POST-CHECK fallito: % salse migrate hanno base_price diverso dal price originale. Transazione annullata.', v_price_diff;
  end if;

  -- Nessuno slug duplicato per store (rispetta unique(store_id, slug)).
  select count(*) into v_dup_slug from (
    select store_id, slug from products group by store_id, slug having count(*) > 1
  ) d;
  if v_dup_slug <> 0 then
    raise exception 'POST-CHECK fallito: esistono % coppie (store, slug) duplicate. Transazione annullata.', v_dup_slug;
  end if;

  -- Allergeni migrati: 6 righe, su 5 salse distinte (join alle salse ancora presenti).
  select count(*) into v_all_rows from product_allergens pa join sauces s on s.id = pa.product_id;
  select count(distinct pa.product_id) into v_all_sauces from product_allergens pa join sauces s on s.id = pa.product_id;
  if v_all_rows <> 6 then
    raise exception 'POST-CHECK fallito: le righe di allergeni delle salse sono %, attese 6. Transazione annullata.', v_all_rows;
  end if;
  if v_all_sauces <> 5 then
    raise exception 'POST-CHECK fallito: le salse con allergeni sono %, attese 5. Transazione annullata.', v_all_sauces;
  end if;

  raise notice 'POST-CHECK superati: 62 prodotti, 76 allergeni prodotto, 7 salse, prezzi identici, nessuno slug duplicato, 6 allergeni su 5 salse.';
end $$;

commit;

-- ============================================================================
-- 5) VERIFICHE MANUALI da rilanciare DOPO l'esecuzione (a scopo di riscontro):
--
--   select count(*) from products;                           -- atteso 62
--   select count(*) from product_allergens;                  -- atteso 76
--   select count(*) from products where category = 'salse';  -- atteso 7
--
--   -- Le 7 salse migrate, con slug e prezzo:
--   select name, slug, base_price, allergens_verified_at
--     from products where category = 'salse' order by sort_order;
--
--   -- Confronto prezzo salsa migrata vs originale (deve dare 0 righe):
--   select p.name, p.base_price, s.price
--     from products p join sauces s on s.id = p.id
--    where p.category = 'salse' and p.base_price is distinct from s.price;
--
--   -- Allergeni delle salse ora in product_allergens (attese 6 righe, 5 salse):
--   select pa.product_id, count(*)
--     from product_allergens pa join sauces s on s.id = pa.product_id
--    group by pa.product_id;
--
-- NOTA: la tabella `sauces` (e `sauce_allergens`) NON viene cancellata da
-- questo script. La sua dismissione (DROP TABLE) e' un passo separato e
-- successivo, da eseguire a mano solo dopo aver verificato che menu pubblico,
-- carrello, checkout e pannello staff funzionino sui dati nuovi (§30, regola 6).
-- ============================================================================
