-- ============================================================================
-- I CONTEGGI DELLA MAILING LIST — SENZA DATI PERSONALI
-- Richiesta di Andrea del 02/10/2026. Sola lettura: non scrive niente.
-- ============================================================================
--
-- COSA FA (anche per chi non conosce SQL):
--   Conta, e basta. Serve a guardare quanto cresce l'elenco dei contatti senza
--   aprire l'elenco: qui non esce nessun nome, nessuna email, nessun telefono.
--
-- ⚠️ La riga 12 deve dare LO STESSO numero di contatti che esce dal file
--   `20261002_mailing_list_estrazione_DATI_PERSONALI.sql`: le due condizioni
--   sono scritte uguali nei due file. Se un giorno ne cambia una, va cambiata
--   anche l'altra — e il confronto dei due numeri e' il controllo.
--
-- "ORDINI PAGATI" vuol dire: succeeded, refunded, partially_refunded.
--
-- COME SI ESEGUE:
--   Si incolla tutto nel SQL editor di Supabase e si preme Run.
--   ⚠️ IL REFERTO DEVE AVERE ESATTAMENTE 9 RIGHE. La prima le fa contare al
--   database: se i due numeri non coincidono, o a schermo ne arrivano meno, il
--   fondo NON e' stato letto.
-- ============================================================================
with consenzienti as (
  select c.id, c.email, c.marketing_opt_in_at
    from public.customers c
   where c.marketing_opt_in is true
),
con_email as (
  select k.id, k.email
    from consenzienti k
   where k.email is not null
     and btrim(k.email) <> ''
),
referto as (

select 10 as ord,
       'clienti in tutto'::text as misura,
       (select count(*) from public.customers)::text as numero

union all

select 11,
       'col consenso alle comunicazioni',
       (select count(*) from consenzienti)::text

union all

select 12,
       'col consenso E con email — sono i contatti dell''estrazione',
       (select count(*) from con_email)::text

union all

select 13,
       'col consenso ma SENZA email — esclusi dall''estrazione',
       (select count(*) from consenzienti)::text
       || ' meno ' || (select count(*) from con_email)::text
       || ' = ' || ((select count(*) from consenzienti) - (select count(*) from con_email))::text

union all

select 14,
       'contatti dell''estrazione che non hanno nessun ordine pagato',
       (select count(*) from con_email e
         where not exists (select 1 from public.orders o
                            where o.customer_id = e.id
                              and o.payment_status in ('succeeded', 'refunded', 'partially_refunded')))::text

union all

select 15,
       'email che compaiono su piu di un contatto (stessa email, persone diverse)',
       (select count(*) from (select lower(btrim(email)) from con_email
                               group by lower(btrim(email)) having count(*) > 1) d)::text
       || ' email ripetute'

union all

select 16,
       'contatti con un''email senza la chiocciola',
       (select count(*) from con_email where position('@' in email) = 0)::text

union all

select 17,
       'consenso SI ma senza la data del consenso (atteso 0)',
       (select count(*) from consenzienti where marketing_opt_in_at is null)::text

)

select 0 as ord,
       ('referto eseguito il ' || to_char(now() at time zone 'Europe/Rome', 'DD/MM/YYYY HH24:MI') || ' ora italiana')::text as misura,
       ('righe di questo referto, questa compresa: '
        || (select count(*) + 1 from referto)::text
        || ' — dichiarate a mano in cima: 9')::text as numero

union all

select ord, misura, numero from referto

 order by ord;
