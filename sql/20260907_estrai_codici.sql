-- ============================================================================
-- I CODICI SCONTO DA DARE VIA — SOLA LETTURA
-- Pezzo 5 dei codici sconto. 07/09/2026.
-- ============================================================================
--
-- COSA FA (anche per chi non conosce SQL):
--   Tira fuori i codici gia' generati, divisi per serie, e soprattutto divisi
--   per STATO: quali si possono ancora dare via, quali sono in mano a qualcuno
--   proprio adesso, e quali sono gia' stati usati e non valgono piu'.
--   Non cambia NULLA: e' una sola interrogazione che legge.
--
-- ⚠️ QUESTO FILE SI RILEGGE QUANDO SI VUOLE, ed e' il motivo per cui e' separato
--   da quello che genera. Quello si esegue una volta sola nella vita; questo
--   ogni volta che serve sapere quali codici restano. Tenerli insieme avrebbe
--   voluto dire riaprire il file che SCRIVE ogni volta che si vuole solo
--   guardare — ed e' il modo in cui prima o poi si esegue la cosa sbagliata.
--
-- ---------------------------------------------------------------------------
-- ⚠️ PERCHE' I CODICI ESCONO RAGGRUPPATI E NON UNO PER RIGA
-- ---------------------------------------------------------------------------
-- La forma ovvia sarebbe una riga per codice: trecento righe, ordinate. E'
-- stata scartata, per una ragione precisa e una utile.
--
--   LA RAGIONE PRECISA. L'editor SQL taglia i referti lunghi, e ⚠️ **quanto
--   lunghi non e' misurato**: il pannello ha detto 100, poi 500, poi ha smesso
--   di dirlo. Trecento righe cadono esattamente nella fascia in cui non si sa.
--   Un elenco tagliato ha la stessa faccia di un elenco finito: si crederebbe di
--   avere tutti i codici e se ne avrebbero due terzi, **senza un errore da
--   nessuna parte**. Raggruppati, le righe sono quattordici e il problema non
--   esiste.
--
--   LA RAGIONE UTILE. Chi deve mandare i codici per email o scriverli a mano non
--   legge trecento righe: **copia un blocco**. I codici escono separati da
--   virgola e spazio, che e' la forma che si incolla in un foglio di calcolo (si
--   divide da sola in colonne), in una email, o in un documento da stampare. E
--   per scriverne a mano tre o quattro, si leggono dallo stesso blocco.
--
-- ⚠️ E il conteggio esce accanto a ogni gruppo: se un giorno un blocco venisse
--   troncato, il numero accanto non tornerebbe. **E' il numero a proteggere il
--   blocco**, non la speranza che ci stia tutto.
--
-- ---------------------------------------------------------------------------
-- I TRE STATI, E PERCHE' NON SONO DUE
-- ---------------------------------------------------------------------------
--   DA DARE VIA   nessuno l'ha mai preso, oppure l'aveva preso qualcuno che poi
--                 non ha pagato e la sua finestra e' scaduta. ⚠️ Un codice con
--                 una prenotazione SCADUTA torna disponibile: nessun meccanismo
--                 del database lo libera, lo sovrascrive il prossimo che scrive.
--   IN MANO ORA   qualcuno ha avviato un pagamento con quel codice in questo
--                 momento e la sua finestra e' ancora aperta. ⚠️ NON e' ancora
--                 usato, ma NON va dato a nessun altro: fra qualche minuto
--                 potrebbe essere consumato.
--   GIA' USATO    qualcuno ha pagato con quel codice. E' bruciato per chiunque,
--                 per sempre, anche per chi l'ha usato.
--
-- ⚠️ Due stati soli non basterebbero: chi guardasse un elenco "liberi / usati"
--   darebbe via un codice che qualcun altro sta pagando in quel secondo, e quel
--   qualcuno se lo vedrebbe rifiutare dopo averlo scritto.
--
-- ---------------------------------------------------------------------------
-- LA SERIE SI RICONOSCE DALLA REGOLA, NON DAL NOME
-- ---------------------------------------------------------------------------
-- I codici non portano nessun prefisso che dica quanto valgono, ed e' voluto:
-- chi ne riceve uno da 10 per cento non deve poter capire che ne esistono da 20.
-- ⚠️ Conseguenza: qui la serie si ricava dall'importo, dalla percentuale e dalla
-- soglia — cioe' dal dato che caratterizza, mai dalla forma del nome.
--
-- COSA NON TOCCA MAI:
--   Niente. In questo file non esiste alcuna istruzione che scrive.
--
-- COME SI ESEGUE:
--   Si incolla nel SQL editor di Supabase e si preme Run.
--   ⚠️ IL REFERTO DEVE AVERE ESATTAMENTE 14 RIGHE:
--     1 di testa + 3 di riepilogo + 3 di codici da dare via + 3 in mano ora
--     + 3 gia' usati + 1 di verdetto.
--   Il numero e' anche contato dal database nella prima riga: se i due non
--   coincidono, o se ne arrivano meno, e' l'editor che taglia.
-- ============================================================================

with
-- Ogni codice con la sua serie e il suo stato, calcolati una volta sola.
-- ⚠️ `stato` si decide guardando la riga dei riscatti, se c'e'. Nessuna riga
-- significa mai preso; una riga consumata significa bruciato; una riga prenotata
-- vale solo finche' la sua finestra e' aperta.
codici as (
  select c.code,
         case
           when c.discount_amount = 5.00 and c.min_order_amount = 25.00 then 'A - 5 euro, da 25 euro in su'
           when c.discount_percent = 10.00 then 'B - 10 per cento'
           when c.discount_percent = 20.00 then 'C - 20 per cento'
           else 'SERIE SCONOSCIUTA - guardare la riga in tabella'
         end as serie,
         case
           when r.code is null then 'da dare via'
           when r.status = 'consumed' then 'gia usato'
           when r.reserved_until > now() then 'in mano ora'
           else 'da dare via'
         end as stato
    from public.coupons c
    left join public.coupon_redemptions r on r.code = c.code
),
serie(nome) as (
  values ('A - 5 euro, da 25 euro in su'), ('B - 10 per cento'), ('C - 20 per cento')
),
referto as (

-- ── IL RIEPILOGO, una riga per serie ────────────────────────────────────────
select 10 as ord,
       s.nome::text as serie,
       'quanti sono'::text as cosa,
       ((select count(*) from codici k where k.serie = s.nome)::text || ' in tutto  |  '
        || (select count(*) from codici k where k.serie = s.nome and k.stato = 'da dare via')::text || ' da dare via  |  '
        || (select count(*) from codici k where k.serie = s.nome and k.stato = 'in mano ora')::text || ' in mano ora  |  '
        || (select count(*) from codici k where k.serie = s.nome and k.stato = 'gia usato')::text || ' gia usati')::text as dettaglio
  from serie s

union all

-- ── I CODICI DA DARE VIA ────────────────────────────────────────────────────
select 20,
       s.nome,
       'DA DARE VIA (' ||
         (select count(*) from codici k where k.serie = s.nome and k.stato = 'da dare via')::text
         || ') — il numero fra parentesi protegge il blocco: se non torna, e stato tagliato',
       coalesce(
         (select string_agg(k.code, ', ' order by k.code)
            from codici k where k.serie = s.nome and k.stato = 'da dare via'),
         'nessuno')
  from serie s

union all

-- ── QUELLI IN MANO A QUALCUNO PROPRIO ADESSO ────────────────────────────────
select 30,
       s.nome,
       'IN MANO ORA, NON DARLI (' ||
         (select count(*) from codici k where k.serie = s.nome and k.stato = 'in mano ora')::text || ')',
       coalesce(
         (select string_agg(k.code, ', ' order by k.code)
            from codici k where k.serie = s.nome and k.stato = 'in mano ora'),
         'nessuno')
  from serie s

union all

-- ── QUELLI GIA' USATI ───────────────────────────────────────────────────────
select 40,
       s.nome,
       'GIA USATI, non valgono piu (' ||
         (select count(*) from codici k where k.serie = s.nome and k.stato = 'gia usato')::text || ')',
       coalesce(
         (select string_agg(k.code, ', ' order by k.code)
            from codici k where k.serie = s.nome and k.stato = 'gia usato'),
         'nessuno')
  from serie s

union all

-- ── IL VERDETTO ─────────────────────────────────────────────────────────────
-- ⚠️ Serve a una cosa sola: accorgersi di un codice che non appartiene a nessuna
-- delle tre serie. Se ne comparisse uno, vorrebbe dire che in `coupons` c'e' una
-- riga che nessuno di questi documenti prevede, e va guardata prima di dare via
-- qualunque cosa.
select 50,
       'TUTTE',
       'codici che non appartengono a nessuna delle tre serie',
       (select count(*) from codici k where k.serie like 'SERIE SCONOSCIUTA%')::text
       || ' (deve essere 0)  |  totale in tabella: '
       || (select count(*) from public.coupons)::text

)

select 0 as ord,
       'testa'::text as serie,
       ('referto eseguito il ' || to_char(now(), 'YYYY-MM-DD HH24:MI:SS.USOF'))::text as cosa,
       ('righe che questo referto deve avere, questa compresa: '
         || (select count(*) + 1 from referto)::text
         || ' | in cima ne sono dichiarate 14 a mano: i due numeri devono coincidere')::text as dettaglio

union all

select ord, serie, cosa, dettaglio from referto

 order by ord, serie;
