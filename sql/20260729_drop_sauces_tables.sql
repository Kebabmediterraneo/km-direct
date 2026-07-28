-- ============================================================================
-- DISMISSIONE — cancella le tabelle `sauce_allergens` e `sauces`
-- dopo l'unificazione delle salse in `products` (§30, MASTER_SPEC v32, regola 6).
-- Data: 2026-07-29.
-- ============================================================================
--
-- COSA FA (anche per chi non conosce SQL):
--   La migrazione del 28/07/2026 ha COPIATO le 7 salse dentro `products` e i
--   loro allergeni dentro `product_allergens`, lasciando intatte le due vecchie
--   tabelle (`sauces` e `sauce_allergens`) come rete di sicurezza. Ora che menu
--   pubblico, carrello, checkout e pannello staff sono stati verificati dal vivo
--   sui dati nuovi (§30, regola 6), le due vecchie tabelle non servono più e
--   questo script le ELIMINA.
--
-- ATTENZIONE — OPERAZIONE IRREVERSIBILE:
--   `drop table` distrugge le tabelle e il loro contenuto. Non c'è "annulla".
--   La sola via di ritorno è ricreare tabelle e righe dal file di export:
--   `sql/20260728_sauces_export_pre_merge.sql` (DDL + INSERT di ripristino).
--   Prima di eseguire, assicurarsi che quell'export sia versionato nel repo.
--
-- SICUREZZA:
--   Tutto è avvolto in una transazione (begin ... commit) e preceduto da
--   PRE-CHECK bloccanti: se la copia in `products`/`product_allergens` non è
--   FEDELE all'originale, viene sollevato un errore e NULLA viene cancellato.
--   Si distrugge l'originale solo dopo aver dimostrato che la copia è completa.
--
-- COME SI ESEGUE:
--   Va incollato ed eseguito nel SQL editor di Supabase (è DDL, non passa da
--   PostgREST). Claude Code non lo esegue.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1) PRE-CHECK bloccanti — la copia deve essere completa e fedele PRIMA di
--    distruggere l'originale. Se un solo controllo non torna, si ferma tutto.
-- ----------------------------------------------------------------------------
do $$
declare
  v_products   int;
  v_pa         int;
  v_salse      int;
  v_sauces     int;
  v_sa         int;
  v_mismatch   int;
  v_missing    int;
  v_extra      int;
begin
  -- Conteggi attesi dopo la migrazione.
  select count(*) into v_products from products;
  if v_products <> 62 then
    raise exception 'PRE-CHECK fallito: products ha % righe, attese 62. Dismissione annullata.', v_products;
  end if;

  select count(*) into v_pa from product_allergens;
  if v_pa <> 76 then
    raise exception 'PRE-CHECK fallito: product_allergens ha % righe, attese 76. Dismissione annullata.', v_pa;
  end if;

  select count(*) into v_salse from products where category = 'salse';
  if v_salse <> 7 then
    raise exception 'PRE-CHECK fallito: i prodotti con category=salse sono %, attesi 7. Dismissione annullata.', v_salse;
  end if;

  -- Sanità delle tabelle di origine ancora presenti.
  select count(*) into v_sauces from sauces;
  if v_sauces <> 7 then
    raise exception 'PRE-CHECK fallito: sauces ha % righe, attese 7. Dismissione annullata.', v_sauces;
  end if;

  select count(*) into v_sa from sauce_allergens;
  if v_sa <> 6 then
    raise exception 'PRE-CHECK fallito: sauce_allergens ha % righe, attese 6. Dismissione annullata.', v_sa;
  end if;

  -- FEDELTÀ riga per riga: ogni salsa deve avere in products una riga con lo
  -- STESSO id e tutti i campi corrispondenti (price -> base_price). `is distinct
  -- from` tratta correttamente i NULL (es. is_vegetarian nullo su 2 salse).
  select count(*) into v_mismatch
  from sauces s
  left join products p on p.id = s.id and p.category = 'salse'
  where p.id is null
     or p.name is distinct from s.name
     or p.base_price is distinct from s.price
     or p.sort_order is distinct from s.sort_order
     or p.is_available is distinct from s.is_available
     or p.is_vegan is distinct from s.is_vegan
     or p.is_vegetarian is distinct from s.is_vegetarian
     or p.allergens_verified_at is distinct from s.allergens_verified_at;
  if v_mismatch <> 0 then
    raise exception 'PRE-CHECK fallito: % salse non combaciano campo per campo con la copia in products. Dismissione annullata.', v_mismatch;
  end if;

  -- FEDELTÀ allergeni, direzione 1: ogni riga di sauce_allergens ha la
  -- corrispondente in product_allergens (stesso id articolo, stesso allergene).
  select count(*) into v_missing
  from sauce_allergens sa
  where not exists (
    select 1 from product_allergens pa
    where pa.product_id = sa.sauce_id and pa.allergen_id = sa.allergen_id
  );
  if v_missing <> 0 then
    raise exception 'PRE-CHECK fallito: % righe di sauce_allergens non hanno corrispondenza in product_allergens. Dismissione annullata.', v_missing;
  end if;

  -- FEDELTÀ allergeni, direzione 2: nessuna riga di allergene IN PIÙ su una
  -- salsa in product_allergens rispetto a sauce_allergens.
  select count(*) into v_extra
  from product_allergens pa
  where pa.product_id in (select id from sauces)
    and not exists (
      select 1 from sauce_allergens sa
      where sa.sauce_id = pa.product_id and sa.allergen_id = pa.allergen_id
    );
  if v_extra <> 0 then
    raise exception 'PRE-CHECK fallito: % righe di allergene in product_allergens non hanno riscontro in sauce_allergens per le salse. Dismissione annullata.', v_extra;
  end if;

  raise notice 'PRE-CHECK superati: copia fedele (62 prodotti, 76 allergeni, 7 salse, 6 allergeni salsa corrispondenti). Procedo con la dismissione.';
end $$;

-- ----------------------------------------------------------------------------
-- 2) DROP — prima la tabella-ponte, poi la tabella: `sauce_allergens` ha una
--    foreign key verso `sauces`, quindi va eliminata per prima.
-- ----------------------------------------------------------------------------
drop table sauce_allergens;
drop table sauces;

commit;

-- ============================================================================
-- 3) VERIFICHE MANUALI da rilanciare DOPO l'esecuzione (a scopo di riscontro):
--
--   -- le due tabelle non devono più esistere (queste query devono dare ERRORE
--   -- "relation ... does not exist"):
--   select count(*) from sauces;
--   select count(*) from sauce_allergens;
--
--   -- i dati delle salse restano in products/product_allergens, invariati:
--   select count(*) from products;                           -- atteso 62
--   select count(*) from product_allergens;                  -- atteso 76
--   select count(*) from products where category = 'salse';  -- atteso 7
--
-- RIPRISTINO: se servisse tornare indietro, le tabelle e le loro righe si
-- ricreano dal file di export versionato
-- `sql/20260728_sauces_export_pre_merge.sql`. È l'unica via: il drop è
-- irreversibile.
-- ============================================================================
