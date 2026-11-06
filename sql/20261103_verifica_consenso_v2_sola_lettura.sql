-- ============================================================================
-- VERIFICA DI SOLA LETTURA — IL CONSENSO v2 NEL DATABASE  (03/11/2026)
-- Rifatta il 03/11/2026: la prima stesura, del 12/10, stava in una cartella
-- temporanea ed e' andata persa. Non scrive niente: una sola interrogazione
-- che legge e conta.
-- ⚠️ IL REFERTO DEVE AVERE ESATTAMENTE 16 RIGHE.
--   La prima riga le fa contare al database: se il numero contato non e' 16,
--   o se a schermo ne arrivano meno, il fondo NON e' stato letto.
-- ⚠️ Nessun nome, nessuna email, nessun telefono: solo numeri, date e si/no.
--
-- LE DUE DATE SCRITTE A MANO, e perche':
--   * 12/10/2026 dalla mezzanotte italiana: il giorno in cui e' nata la v2.
--     Prima di allora nessuno poteva acconsentire alla v2.
--   * 13/10/2026 dalla mezzanotte italiana: la fine di quel giorno.
--     ⚠️ Il codice con la v2 NON E' MAI STATO PUBBLICATO (al 03/11 `origin/main`
--     e' fermo al 07/09): l'unico modo di scrivere una v2 e' stato il server di
--     sviluppo del 12/10. Una v2 datata dopo il 12/10 vuol dire che quel codice
--     ha girato di nuovo, o che e' stato pubblicato senza saperlo.
-- ============================================================================
with
nascita_v2 as (
  select timestamp '2026-10-12 00:00:00' at time zone 'Europe/Rome' as t
),
fine_12_ottobre as (
  select timestamp '2026-10-13 00:00:00' at time zone 'Europe/Rome' as t
),
ultimo_v2 as (
  -- Il consenso v2 piu' recente. Di lui escono solo data, ora e un si/no.
  select c.id, c.marketing_opt_in_at, c.email
    from public.customers c
   where c.marketing_opt_in is true
     and c.marketing_text_version = 'v2'
   order by c.marketing_opt_in_at desc nulls last
   limit 1
),
ordine_vicino as (
  -- L'ordine di quel cliente nato piu' vicino al momento del consenso, fra un
  -- minuto prima e dieci minuti dopo: il consenso viene scritto un istante
  -- prima dell'ordine, nello stesso passaggio.
  select o.payment_status,
         o.created_at,
         extract(epoch from (o.created_at - u.marketing_opt_in_at)) as secondi
    from public.orders o
    join ultimo_v2 u on u.id = o.customer_id
   where o.created_at between u.marketing_opt_in_at - interval '1 minute'
                          and u.marketing_opt_in_at + interval '10 minutes'
   order by abs(extract(epoch from (o.created_at - u.marketing_opt_in_at)))
   limit 1
),
referto as (

-- ---------------------------------------------------------------------------
-- PUNTO 1 — LE VERSIONI DEL TESTO FRA CHI HA IL CONSENSO
-- ---------------------------------------------------------------------------
select 10 as ord,
       '1 versioni'::text as punto,
       'consenso SI con versione v2'::text as misura,
       (select count(*) from public.customers
         where marketing_opt_in is true and marketing_text_version = 'v2')::text as esito

union all

select 11, '1 versioni', 'consenso SI con versione v1',
       (select count(*) from public.customers
         where marketing_opt_in is true and marketing_text_version = 'v1')::text

union all

select 12, '1 versioni', 'consenso SI ma SENZA nessuna versione — il numero che tradirebbe un difetto',
       (select count(*) from public.customers
         where marketing_opt_in is true
           and (marketing_text_version is null or btrim(marketing_text_version) = ''))::text
       || ' (atteso 0)'

union all

select 13, '1 versioni', 'consenso SI con una versione che non e ne v1 ne v2, e la somma',
       (select count(*) from public.customers
         where marketing_opt_in is true
           and marketing_text_version is not null
           and btrim(marketing_text_version) <> ''
           and marketing_text_version not in ('v1', 'v2'))::text
       || ' (atteso 0) | consensi in tutto: '
       || (select count(*) from public.customers where marketing_opt_in is true)::text
       || ' | somma delle righe 10, 11, 12 e di questa: '
       || ((select count(*) from public.customers
             where marketing_opt_in is true and marketing_text_version = 'v2')
           + (select count(*) from public.customers
               where marketing_opt_in is true and marketing_text_version = 'v1')
           + (select count(*) from public.customers
               where marketing_opt_in is true
                 and (marketing_text_version is null or btrim(marketing_text_version) = ''))
           + (select count(*) from public.customers
               where marketing_opt_in is true
                 and marketing_text_version is not null
                 and btrim(marketing_text_version) <> ''
                 and marketing_text_version not in ('v1', 'v2')))::text
       || ' (deve essere uguale ai consensi in tutto)'

-- ---------------------------------------------------------------------------
-- PUNTO 2 — IL PIU' RECENTE CON v2: SOLO DATA, ORA, E SE HA UN'EMAIL
-- ---------------------------------------------------------------------------
union all

select 20, '2 il piu recente con v2', 'data e ora del consenso (ora italiana) | ha un''email?',
       coalesce(
         (select to_char(u.marketing_opt_in_at at time zone 'Europe/Rome', 'DD/MM/YYYY HH24:MI:SS')
                 || ' | email registrata: '
                 || case when u.email is not null and btrim(u.email) <> '' then 'SI' else 'NO' end
            from ultimo_v2 u),
         'NESSUN consenso con v2 in tabella')

-- ---------------------------------------------------------------------------
-- PUNTO 3 — L'ORDINE DI QUEL CONSENSO: PAGATO O IN ATTESA?
-- ---------------------------------------------------------------------------
union all

select 30, '3 ordine di quel consenso', 'l''ordine nato piu vicino al consenso',
       coalesce(
         (select 'stato di pagamento: ' || v.payment_status::text
                 || ' | creato il ' || to_char(v.created_at at time zone 'Europe/Rome', 'DD/MM/YYYY HH24:MI:SS')
                 || ' | distanza dal consenso: ' || round(v.secondi::numeric, 1)::text || ' secondi'
            from ordine_vicino v),
         'NESSUN ordine di quel cliente vicino al momento del consenso')

union all

select 31, '3 ordine di quel consenso', 'VERDETTO — pagato o in attesa?',
       case
         when not exists (select 1 from ultimo_v2) then 'non applicabile: nessun consenso v2'
         when not exists (select 1 from ordine_vicino)
           then 'CONSENSO SCRITTO MA NESSUN ORDINE VICINO: da guardare'
         when (select payment_status from ordine_vicino) in ('succeeded', 'refunded', 'partially_refunded')
           then 'ORDINE PAGATO: il pagamento risulta registrato'
         when (select payment_status from ordine_vicino) in ('pending', 'failed')
           then 'ORDINE MAI REGISTRATO COME PAGATO — atteso per un ordine da localhost, dove la conferma di Stripe non arriva: il consenso si scrive alla creazione dell''ordine, non al pagamento'
         else 'stato non previsto: guardare la riga 30'
       end

-- ---------------------------------------------------------------------------
-- PUNTO 4 — I DATI CHE C'ERANO PRIMA SONO STATI TOCCATI?
-- ---------------------------------------------------------------------------
union all

select 40, '4 dati di prima', 'v2 su un consenso datato PRIMA del 12/10 — una riga cambiata senza un consenso nuovo',
       (select count(*) from public.customers c, nascita_v2 n
         where c.marketing_text_version = 'v2'
           and (c.marketing_opt_in_at is null or c.marketing_opt_in_at < n.t))::text
       || ' (atteso 0)'

union all

-- ⚠️ Questa riga sostituisce, il 03/11, quella del 12/10 sui "clienti
-- modificati oggi": vedi la nota alla riga 43.
select 41, '4 dati di prima', 'v2 su un consenso datato DOPO il 12/10 — il codice v2 non e mai stato pubblicato',
       (select count(*) from public.customers c, fine_12_ottobre f
         where c.marketing_text_version = 'v2'
           and c.marketing_opt_in_at >= f.t)::text
       || ' (atteso 0: se non e zero, il codice della v2 ha girato dopo il 12/10)'

union all

select 42, '4 dati di prima', 'clienti che esistevano gia prima del 12/10 e oggi portano v2',
       (select count(*) from public.customers c, nascita_v2 n
         where c.marketing_text_version = 'v2'
           and c.created_at < n.t)::text
       || ' — non e un difetto: e una persona gia nota che il 12/10 ha riordinato spuntando la casella nuova'

union all

-- ⚠️ INFORMAZIONE, NON PIU' UN CONTROLLO CON ATTESO ZERO (03/11/2026).
-- Il 12/10 la finestra era di poche ore e lo zero era plausibile. In tre
-- settimane NON lo e': la rotta del pagamento scrive la riga cliente PRIMA
-- dell'ordine, e un checkout che si ferma dopo quella scrittura — un codice
-- sconto rifiutato, un guasto — lascia un cliente modificato senza ordine.
-- E' il comportamento descritto in spec §65, non un tocco ai dati.
select 43, '4 dati di prima', 'clienti modificati dal 12/10 senza nessun ordine dal 12/10 — SOLO INFORMAZIONE, vedi nota',
       (select count(*) from public.customers c, nascita_v2 n where c.updated_at >= n.t)::text
       || ' clienti modificati | di cui senza ordini dal 12/10: '
       || (select count(*) from public.customers c, nascita_v2 n
            where c.updated_at >= n.t
              and not exists (select 1 from public.orders o
                               where o.customer_id = c.id and o.created_at >= n.t))::text
       || ' — puo non essere zero: un checkout fermato dopo aver scritto il cliente lascia questa traccia'

union all

select 44, '4 dati di prima', 'consensi v1: quanti, e fra quali date',
       (select count(*) from public.customers where marketing_text_version = 'v1')::text
       || ' righe con v1 | di cui col consenso ancora SI: '
       || (select count(*) from public.customers
            where marketing_text_version = 'v1' and marketing_opt_in is true)::text
       || ' | consenso piu vecchio: '
       || coalesce((select to_char(min(marketing_opt_in_at) at time zone 'Europe/Rome', 'DD/MM/YYYY HH24:MI')
                      from public.customers where marketing_text_version = 'v1'), 'nessuno')
       || ' | piu recente: '
       || coalesce((select to_char(max(marketing_opt_in_at) at time zone 'Europe/Rome', 'DD/MM/YYYY HH24:MI')
                      from public.customers where marketing_text_version = 'v1'), 'nessuno')

union all

select 45, '4 dati di prima', 'versione senza data del consenso, e data senza versione',
       'versione senza data: '
       || (select count(*) from public.customers
            where marketing_text_version is not null and marketing_opt_in_at is null)::text
       || ' (atteso 0) | data senza versione: '
       || (select count(*) from public.customers
            where marketing_opt_in_at is not null
              and (marketing_text_version is null or btrim(marketing_text_version) = ''))::text
       || ' (atteso 0)'

union all

select 46, '4 dati di prima', 'clienti in tutto, e col consenso',
       (select count(*) from public.customers)::text || ' clienti | col consenso SI: '
       || (select count(*) from public.customers where marketing_opt_in is true)::text
       || ' — il 05/10 erano 13 e 3'

-- ---------------------------------------------------------------------------
-- LE TRE SETTIMANE DI CUI NESSUNO SA NIENTE: dal 12/10 a oggi
-- ---------------------------------------------------------------------------
union all

select 50, '5 dal 12/10 a oggi', 'ordini e clienti nuovi dal 12/10 (mezzanotte italiana)',
       (select count(*) from public.orders o, nascita_v2 n where o.created_at >= n.t)::text
       || ' ordini | pagati (succeeded, refunded, partially_refunded): '
       || (select count(*) from public.orders o, nascita_v2 n
            where o.created_at >= n.t
              and o.payment_status in ('succeeded', 'refunded', 'partially_refunded'))::text
       || ' | mai pagati (pending, failed): '
       || (select count(*) from public.orders o, nascita_v2 n
            where o.created_at >= n.t
              and o.payment_status in ('pending', 'failed'))::text
       || ' | clienti nuovi: '
       || (select count(*) from public.customers c, nascita_v2 n where c.created_at >= n.t)::text
       || ' | ultimo ordine: '
       || coalesce((select to_char(max(o.created_at) at time zone 'Europe/Rome', 'DD/MM/YYYY HH24:MI')
                      from public.orders o, nascita_v2 n where o.created_at >= n.t), 'nessuno')

)

select 0 as ord,
       'testa'::text as punto,
       ('referto eseguito il ' || to_char(now() at time zone 'Europe/Rome', 'DD/MM/YYYY HH24:MI:SS') || ' ora italiana')::text as misura,
       ('righe che questo referto ha, questa compresa: '
        || (select count(*) + 1 from referto)::text
        || ' | dichiarate a mano in cima: 16 — i due numeri devono coincidere')::text as esito

union all

select ord, punto, misura, esito from referto

 order by ord;
