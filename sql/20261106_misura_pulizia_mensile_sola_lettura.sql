-- ============================================================================
-- MISURA DI SOLA LETTURA — LA PULIZIA MENSILE SI FERMEREBBE OGGI?  (06/11/2026)
-- Non scrive niente e NON esegue la pulizia: legge e conta, simulando quello
-- che farebbe `sql/pulizia_mensile_ordini_mai_pagati.sql` se lanciato adesso.
-- ⚠️ IL REFERTO DEVE AVERE ESATTAMENTE 12 RIGHE.
--   La prima riga le fa contare al database: se il numero contato non e' 12,
--   o se a schermo ne arrivano meno, il fondo NON e' stato letto.
-- ⚠️ LA PRIMA RIGA DICE ANCHE SE ESISTE UN CODICE CONSUMATO SU UN ORDINE MAI
--   PAGATO: e' il caso che non deve esistere.
-- ⚠️ Nessun nome, email, telefono o codice sconto: solo numeri e date.
--
-- COME SI FERMA LO SCRIPT DELLA PULIZIA, letto dal file il 06/11/2026:
--   passo 1c  cancella i riscatti GIVEMEFIVE degli ordini bersaglio;
--   passo 2   cancella gli ordini bersaglio — e qui un errore di vincolo se una
--             riga di `coupon_redemptions` punta a uno di loro;
--   passo 3   cancella i clienti rimasti senza ordini — e qui un errore di
--             vincolo se una riga di `coupon_redemptions` punta a uno di loro.
--   Lo script non nomina mai `coupon_redemptions`. Un errore in un punto
--   qualsiasi annulla tutto: non scrive niente, ma non pulisce niente.
-- ============================================================================
with
soglia as (
  -- Lo stesso limite dello script: adesso meno 30 giorni.
  select now() - interval '30 days' as t
),
bersaglio as (
  -- Gli ordini che il passo 2 toglierebbe: mai pagati e oltre 30 giorni.
  select o.id, o.customer_id, o.coupon_code, o.created_at, o.payment_status
    from public.orders o, soglia
   where o.payment_status in ('pending', 'failed')
     and o.created_at < soglia.t
),
clienti_bersaglio as (
  -- I clienti che il passo 3 toglierebbe, valutati come li vede lo script DOPO
  -- i passi 1c e 2: oltre 30 giorni, senza ordini una volta tolti quelli
  -- bersaglio, senza riscatti GIVEMEFIVE una volta tolti quelli degli stessi
  -- ordini.
  select c.id
    from public.customers c, soglia
   where c.created_at < soglia.t
     and not exists (select 1 from public.orders o
                      where o.customer_id = c.id
                        and o.id not in (select id from bersaglio))
     and not exists (select 1 from public.promo_redemptions p
                      where p.customer_id = c.id
                        and p.order_id not in (select id from bersaglio))
),
fk as (
  -- Tutte le chiavi esterne del database che puntano a `orders` o a
  -- `customers`, lette dal catalogo e non dallo schema scritto a mano: se ne
  -- esistesse una che nessun documento nomina, comparirebbe qui.
  select src.relname::text as tabella,
         dst.relname::text as punta_a,
         (select string_agg(a.attname::text, ',')
            from pg_attribute a
           where a.attrelid = k.conrelid and a.attnum = any (k.conkey)) as colonna,
         case k.confdeltype
           when 'c' then 'si cancella con lui'
           when 'n' then 'si stacca'
           when 'a' then 'RIFIUTA'
           when 'r' then 'RIFIUTA'
           when 'd' then 'torna al predefinito'
         end as azione
    from pg_constraint k
    join pg_class src on src.oid = k.conrelid
    join pg_class dst on dst.oid = k.confrelid
    join pg_namespace ns on ns.oid = dst.relnamespace
   where k.contype = 'f'
     and ns.nspname = 'public'
     and dst.relname in ('orders', 'customers')
),
referto as (

-- ---------------------------------------------------------------------------
-- PUNTO 1 — CHE COSA TOGLIEREBBE OGGI
-- ---------------------------------------------------------------------------
select 10 as ord,
       '1 cosa toglierebbe'::text as punto,
       'ordini mai pagati oltre 30 giorni'::text as misura,
       ((select count(*) from bersaglio)::text
        || ' ordini (pending: ' || (select count(*) from bersaglio where payment_status = 'pending')::text
        || ', failed: ' || (select count(*) from bersaglio where payment_status = 'failed')::text
        || ') | il piu vecchio: '
        || coalesce((select to_char(min(created_at) at time zone 'Europe/Rome', 'DD/MM/YYYY HH24:MI') from bersaglio), 'nessuno')
        || ' | il piu recente: '
        || coalesce((select to_char(max(created_at) at time zone 'Europe/Rome', 'DD/MM/YYYY HH24:MI') from bersaglio), 'nessuno')
        || ' | con un codice sconto scritto sull''ordine: '
        || (select count(*) from bersaglio where coupon_code is not null and btrim(coupon_code) <> '')::text)::text as esito

union all

select 11, '1 cosa toglierebbe', 'clienti che il passo 3 toglierebbe',
       (select count(*) from clienti_bersaglio)::text || ' clienti'

union all

select 12, '1 cosa toglierebbe', 'righe collegate agli ordini bersaglio, tabella per tabella',
       'order_items (si cancellano con l''ordine): '
       || (select count(*) from public.order_items x where x.order_id in (select id from bersaglio))::text
       || ' | order_status_history (si cancellano con l''ordine): '
       || (select count(*) from public.order_status_history x where x.order_id in (select id from bersaglio))::text
       || ' | analytics_events (lo script le stacca): '
       || (select count(*) from public.analytics_events x where x.order_id in (select id from bersaglio))::text
       || ' | staff_action_log (lo script le stacca): '
       || (select count(*) from public.staff_action_log x where x.order_id in (select id from bersaglio))::text
       || ' | promo_redemptions (lo script le cancella al passo 1c): '
       || (select count(*) from public.promo_redemptions x where x.order_id in (select id from bersaglio))::text
       || ' | coupon_redemptions (lo script NON le nomina): '
       || (select count(*) from public.coupon_redemptions x where x.order_id in (select id from bersaglio))::text

union all

select 13, '1 cosa toglierebbe', 'chiavi esterne verso orders e customers, lette dal catalogo',
       (select count(*) from fk)::text || ' chiavi: '
       || coalesce((select string_agg(tabella || '.' || colonna || ' -> ' || punta_a || ' (' || azione || ')', ' | '
                                      order by punta_a, tabella, colonna)
                      from fk), 'nessuna')

-- ---------------------------------------------------------------------------
-- PUNTI 2 E 3 — I CODICI SUGLI ORDINI BERSAGLIO, DIVISI PER STATO
-- ---------------------------------------------------------------------------
union all

select 20, '2 codici sugli ordini', 'righe di coupon_redemptions PRENOTATE su un ordine bersaglio',
       (select count(*) from public.coupon_redemptions r
         where r.order_id in (select id from bersaglio) and r.status = 'reserved')::text
       || ' righe | di cui con la prenotazione gia scaduta: '
       || (select count(*) from public.coupon_redemptions r
            where r.order_id in (select id from bersaglio) and r.status = 'reserved'
              and r.reserved_until < now())::text

union all

select 21, '2 codici sugli ordini', 'righe di coupon_redemptions CONSUMATE su un ordine bersaglio — non deve esistere',
       (select count(*) from public.coupon_redemptions r
         where r.order_id in (select id from bersaglio) and r.status = 'consumed')::text
       || ' righe (atteso 0)'

union all

select 22, '3 il caso che non deve esistere', 'righe CONSUMATE su QUALUNQUE ordine mai pagato, anche recente',
       (select count(*) from public.coupon_redemptions r
          join public.orders o on o.id = r.order_id
         where r.status = 'consumed'
           and o.payment_status in ('pending', 'failed'))::text
       || ' righe (atteso 0: un codice speso senza un pagamento registrato)'

union all

select 23, '2 codici sugli ordini', 'ordini bersaglio con un codice scritto: dove sta oggi quel codice',
       (select count(*) from bersaglio b where b.coupon_code is not null and btrim(b.coupon_code) <> '')::text
       || ' ordini con un codice | la riga del codice punta a QUELL''ordine: '
       || (select count(*) from bersaglio b
            where exists (select 1 from public.coupon_redemptions r
                           where r.code = b.coupon_code and r.order_id = b.id))::text
       || ' | la riga del codice punta a un ALTRO ordine o a nessuno: '
       || (select count(*) from bersaglio b
            where exists (select 1 from public.coupon_redemptions r
                           where r.code = b.coupon_code
                             and (r.order_id is null or r.order_id <> b.id)))::text
       || ' | nessuna riga per quel codice (GIVEMEFIVE, oppure liberato): '
       || (select count(*) from bersaglio b
            where b.coupon_code is not null and btrim(b.coupon_code) <> ''
              and not exists (select 1 from public.coupon_redemptions r where r.code = b.coupon_code))::text

-- ---------------------------------------------------------------------------
-- PUNTO 4 — I CODICI SUI CLIENTI CHE IL PASSO 3 TOGLIEREBBE
-- ---------------------------------------------------------------------------
union all

select 30, '4 codici sui clienti', 'righe di coupon_redemptions PRENOTATE su un cliente che toglierebbe',
       (select count(*) from public.coupon_redemptions r
         where r.customer_id in (select id from clienti_bersaglio) and r.status = 'reserved')::text
       || ' righe | di cui senza nessun ordine attaccato: '
       || (select count(*) from public.coupon_redemptions r
            where r.customer_id in (select id from clienti_bersaglio) and r.status = 'reserved'
              and r.order_id is null)::text

union all

select 31, '4 codici sui clienti', 'righe di coupon_redemptions CONSUMATE su un cliente che toglierebbe',
       (select count(*) from public.coupon_redemptions r
         where r.customer_id in (select id from clienti_bersaglio) and r.status = 'consumed')::text
       || ' righe (atteso 0: un cliente con un codice consumato dovrebbe avere un ordine pagato, e allora non sarebbe da togliere)'

-- ---------------------------------------------------------------------------
-- PUNTO 5 — IL VERDETTO
-- ---------------------------------------------------------------------------
union all

select 40, '5 verdetto', 'lanciato oggi cosi com''e, lo script si fermerebbe?',
       case
         when (select count(*) from public.coupon_redemptions r
                where r.order_id in (select id from bersaglio)) > 0
           then 'SI — al PASSO 2, sugli ordini: righe 20 e 21. Non scriverebbe niente e non pulirebbe niente.'
              || case when (select count(*) from public.coupon_redemptions r
                             where r.customer_id in (select id from clienti_bersaglio)) > 0
                      then ' E se il passo 2 passasse, si fermerebbe anche al PASSO 3: righe 30 e 31.'
                      else '' end
         when (select count(*) from public.coupon_redemptions r
                where r.customer_id in (select id from clienti_bersaglio)) > 0
           then 'SI — al PASSO 3, sui clienti: righe 30 e 31. Non scriverebbe niente e non pulirebbe niente.'
         when (select count(*) from bersaglio) = 0 and (select count(*) from clienti_bersaglio) = 0
           then 'NO — e non ci sarebbe nemmeno niente da togliere'
         else 'NO, per coupon_redemptions non si fermerebbe — ma controllare la riga 13: una chiave che RIFIUTA e che lo script non conosce fermerebbe lo stesso'
       end

)

select 0 as ord,
       'testa'::text as punto,
       ('referto eseguito il ' || to_char(now() at time zone 'Europe/Rome', 'DD/MM/YYYY HH24:MI:SS') || ' ora italiana')::text as misura,
       ((case when (select count(*) from public.coupon_redemptions r
                      join public.orders o on o.id = r.order_id
                     where r.status = 'consumed' and o.payment_status in ('pending', 'failed')) > 0
              then '⚠️ ALLARME: ESISTONO CODICI CONSUMATI SU ORDINI MAI PAGATI — riga 22 | '
              else 'nessun codice consumato su ordini mai pagati | ' end)
        || 'righe che questo referto ha, questa compresa: '
        || (select count(*) + 1 from referto)::text
        || ' | dichiarate a mano in cima: 12 — i due numeri devono coincidere')::text as esito

union all

select ord, punto, misura, esito from referto

 order by ord;
