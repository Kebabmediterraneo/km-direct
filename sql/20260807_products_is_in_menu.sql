-- ============================================================================
-- MIGRAZIONE — colonna `is_in_menu` su `products` ("togli dal menu").
-- Spec v62, §63-64, decisione di Andrea del 06/08/2026.
-- ============================================================================
--
-- COSA FA (anche per chi non conosce SQL):
--   Aggiunge a `products` una colonna che dice se l'articolo COMPARE NEL MENU
--   del cliente. Non cancella niente, non sposta niente, non tocca nessun'altra
--   colonna e nessun'altra tabella.
--
-- QUANDO SI ESEGUE:
--   Una volta sola, PRIMA di costruire il comando "togli dal menu" nel
--   pannello. E' DDL, quindi la esegue Andrea nel SQL editor di Supabase
--   (§63-64), non Code.
--
-- EFFETTO SUI 62 ARTICOLI ESISTENTI: NESSUNO.
--   Il valore predefinito e' `true`, cioe' "nel menu". Dopo l'esecuzione tutti
--   e 62 restano esattamente come sono adesso: nessun articolo sparisce dal
--   sito per il solo fatto che la colonna e' stata aggiunta. Il referto in
--   fondo lo verifica contando, invece di darlo per scontato.
--
-- PERCHE' UNA COLONNA NUOVA, e perche' non si riusa `is_available`:
--   il reset notturno (`/api/cron/reset-availability`, ogni giorno alle 8:00
--   UTC secondo `vercel.json`) rimette TUTTI i prodotti disponibili. Un
--   articolo "tolto dal menu" segnato con `is_available` tornerebbe a menu da
--   solo dopo poche ore, senza che nessuno se ne accorga.
--
-- IL RESET NON PUO' RAGGIUNGERE QUESTA COLONNA, verificato sul codice:
--   `app/api/cron/reset-availability/route.js` righe 20-23 scrivono
--   `.update({ is_available: true })`, che nomina UNA sola colonna. Le altre
--   non entrano nell'istruzione. Lo stesso vale per ogni altra scrittura su
--   `products` del progetto: la rotta della disponibilita' nomina
--   `is_available`, la Fase 1 nomina i suoi sette campi, la Fase 3 nomina le
--   dieci colonne dell'inserimento piu' `allergens_verified_at` e i flag
--   dietetici. Nessuna nomina `is_in_menu`.
--   ⚠️ Conseguenza voluta: un articolo creato dalla Fase 3 nasce NEL MENU,
--   perche' l'inserimento non nomina questa colonna e prende il predefinito.
--
-- SI PUO' ESEGUIRE DUE VOLTE senza danno:
--   `add column if not exists` non fa nulla se la colonna c'e' gia', e
--   `comment on column` riscrive lo stesso testo. Il referto finale dice
--   com'e' fatta la colonna DAVVERO, letta dal catalogo, non come si suppone:
--   se una prima esecuzione l'avesse creata diversa, si vede li'.
--
-- COME SI ESEGUE:
--   si incolla tutto nel SQL editor di Supabase e si preme Run.
--   ⚠️ L'ultima istruzione e' il referto, ed e' li' apposta: l'editor mostra
--   il risultato dell'ULTIMA istruzione soltanto. Se l'ALTER fallisse, la
--   transazione verrebbe annullata e al posto del referto comparirebbe
--   l'errore — che e' quello che conta leggere.
-- ============================================================================

begin;

alter table products
  add column if not exists is_in_menu boolean not null default true;

comment on column products.is_in_menu is
  'true = l''articolo compare nel menu del cliente. false = TOLTO DAL MENU dal pannello: sparisce dal sito, non compare esaurito. Diverso da is_available, che dice "esaurito oggi" e che il reset notturno rimette a true ogni mattina: questa colonna il reset non la tocca mai. Spec v62, paragrafo 63-64.';

commit;

-- ============================================================================
-- REFERTO — 6 righe attese.
-- ============================================================================
with definizione as (
  select
    format_type(a.atttypid, a.atttypmod)                   as tipo,
    case when a.attnotnull then 'NO' else 'SI' end         as accetta_vuoto,
    coalesce(pg_get_expr(d.adbin, d.adrelid), '(nessuno)') as predefinito
  from pg_attribute a
  left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
  where a.attrelid = 'public.products'::regclass
    and a.attname = 'is_in_menu'
    and not a.attisdropped
),
conteggi as (
  select
    count(*) filter (where is_in_menu)     as dentro,
    count(*) filter (where not is_in_menu) as fuori,
    count(*)                               as totale
  from products
)
select 1 as n,
       'colonna' as voce,
       coalesce((select 'is_in_menu' from definizione), 'ASSENTE') as valore,
       coalesce(
         (select tipo || '  |  accetta il vuoto: ' || accetta_vuoto || '  |  predefinito: ' || predefinito
          from definizione),
         'la migrazione NON ha aggiunto la colonna') as dettaglio
union all
select 2, 'articoli NEL menu',   (select dentro::text from conteggi),
       'subito dopo la migrazione devono esserci tutti'
union all
select 3, 'articoli FUORI menu', (select fuori::text from conteggi),
       'subito dopo la migrazione deve essere 0'
union all
select 4, 'totale articoli',     (select totale::text from conteggi),
       'atteso 62 (55 prodotti + 7 salse, paragrafo 30)'
union all
select 5, 'verdetto',
       case when (select fuori from conteggi) = 0
            then 'OK - nessun articolo e'' sparito dal menu'
            else 'ATTENZIONE - ' || (select fuori::text from conteggi) || ' articoli risultano fuori menu' end,
       'aggiungere la colonna non deve togliere niente dal sito'
union all
select 6, 'la chiave pubblica puo'' leggerla?',
       case when has_column_privilege('anon', 'public.products', 'is_in_menu', 'SELECT')
            then 'SI' else 'NO - il sito non la vedrebbe' end,
       'senza questo permesso il browser non potrebbe nascondere gli articoli tolti'
order by n;
