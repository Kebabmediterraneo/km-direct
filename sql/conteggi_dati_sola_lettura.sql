-- ============================================================================
-- CONTEGGI DEI DATI — sola lettura (§69, MASTER_SPEC v54)
-- ============================================================================
--
-- COSA FA (anche per chi non conosce SQL):
--   Conta le righe di tutte le tabelle toccate dalle due pulizie di §69, piu'
--   i sottoinsiemi che contano (ordini mai pagati, ordini mai pagati oltre i
--   30 giorni, ordini pagati o rimborsati, clienti senza alcun ordine, righe
--   di log collegate a un ordine, righe di log raggruppate per identificatore).
--   Non cambia NULLA: e' solo un elenco di numeri.
--
-- QUANDO SI ESEGUE:
--   PRIMA e DOPO ognuna delle due pulizie — quella del go-live
--   (`ESEGUIRE_UNA_VOLTA_SOLA_prima_del_golive_CANCELLA_TUTTI_GLI_ORDINI.sql`)
--   e quella mensile (`pulizia_mensile_ordini_mai_pagati.sql`).
--   I due referti si mettono
--   affiancati e si confronta riga per riga: cio' che doveva cambiare deve
--   essere cambiato, e cio' che non doveva cambiare deve essere identico.
--
-- COSA NON TOCCA MAI:
--   Niente. Non esiste alcuna scrittura in questo file: nessun insert, nessun
--   update, nessun delete, nessuna transazione. E' un solo `select`.
--
-- QUALE DECISIONE LO GIUSTIFICA:
--   §69 v54, vincolo comune agli script: "i conteggi si rileggono dal database
--   prima e dopo, mai ricopiati da un documento (lezioni `s` e `z`)". Questo
--   file e' lo strumento che rilegge. Nessun numero atteso e' scritto qui
--   dentro: i numeri li produce il database ogni volta che lo si esegue.
--
-- LA PRIMA RIGA DEL REFERTO SERVE A COMPILARE L'ALTRO SCRIPT:
--   La riga della sezione "da copiare nel freno del go-live" riporta la data e
--   ora dell'ordine PIU' RECENTE presente in `orders`. E' il valore che va
--   scritto nel parametro (1) di
--   `ESEGUIRE_UNA_VOLTA_SOLA_prima_del_golive_CANCELLA_TUTTI_GLI_ORDINI.sql`,
--   che senza di essa manderebbe a cercare un dato inesistente — e la
--   scorciatoia piu' probabile sarebbe scrivere l'ora corrente, cioe'
--   precisamente cio' che disattiva il freno.
--   Il valore e' gia' scritto nella forma da incollare — al microsecondo e con
--   il suo scostamento orario — quindi si copia tale e quale fra apici. I
--   microsecondi servono: senza, il freno dell'altro script scatterebbe a
--   torto (la ragione per esteso sta accanto alla riga che lo produce).
--   Se la tabella e' vuota — la situazione normale DOPO la pulizia del go-live
--   — al posto della data compare `NESSUN ORDINE IN TABELLA`: in quel caso non
--   c'e' niente da copiare, e se lo script del go-live viene eseguito lo stesso
--   si fermera' da solo sul suo secondo controllo.
--
-- COME SI LEGGE:
--   Tre colonne piu' una chiave di ordinamento. `sezione` dice a che famiglia
--   appartiene la misura, `misura` dice cosa si sta contando, `valore` e' il
--   numero letto adesso.
--   ⚠️ La colonna `valore` e' numerica e non puo' contenere una data: per la
--   riga del freno la data viaggia quindi dentro `misura`, che e' testo, e in
--   `valore` resta il numero totale degli ordini. E' l'unico modo di aggiungere
--   quella misura senza cambiare la forma del referto.
--   La sezione "non deve cambiare" elenca le tabelle di menu e configurazione
--   (§66): se uno di quei numeri si muove dopo una pulizia, la pulizia ha
--   toccato qualcosa che non doveva, e va indagata prima di proseguire.
--
-- COME SI ESEGUE:
--   Si incolla nel SQL editor di Supabase e si preme Run.
--   ATTENZIONE (§66, limite dello strumento): l'editor mostra al massimo 100
--   righe. Questo referto ne produce molte meno, ma se un giorno la sezione
--   "log per identificatore" crescesse, va verificato che l'elenco non sia
--   stato troncato.
-- ============================================================================

select 10 as ord, 'tabelle toccate'      as sezione, 'orders'                              as misura, count(*)::bigint as valore from orders
union all
select 11, 'tabelle toccate', 'order_items',                    count(*)::bigint from order_items
union all
select 12, 'tabelle toccate', 'order_status_history',           count(*)::bigint from order_status_history
union all
select 13, 'tabelle toccate', 'customers',                      count(*)::bigint from customers
union all
select 14, 'tabelle toccate', 'promo_redemptions',              count(*)::bigint from promo_redemptions
union all
select 15, 'tabelle toccate', 'staff_action_log',               count(*)::bigint from staff_action_log
union all
select 16, 'tabelle toccate', 'analytics_events',               count(*)::bigint from analytics_events

-- Il valore da copiare nel parametro (1) dello script del go-live. Ha `ord` = 1
-- per comparire in cima al referto: e' il dato che si viene a cercare qui.
--
-- Il formato ha tre parti, e tutte e tre servono:
--   `YYYY-MM-DD HH24:MI:SS` la data e l'ora;
--   `.US`                   i MICROSECONDI;
--   `OF`                    lo scostamento orario.
--
-- ⚠️ I MICROSECONDI NON SONO UN DETTAGLIO: senza di essi il freno scatterebbe
-- a torto. `orders.created_at` ha per valore predefinito `now()`, che scrive
-- l'istante al microsecondo; troncando ai secondi il referto stamperebbe un
-- istante leggermente ANTERIORE a quello vero. Il PRE-CHECK 1 dell'altro
-- script confronta con `created_at > v_freno_ultima_prova`, quindi l'ordine
-- piu' recente risulterebbe successivo alla data appena copiata e il freno si
-- fermerebbe pur non essendoci nulla di nuovo. Chi si trovasse davanti a
-- quell'arresto vedrebbe una data identica a quella del referto, e l'unica
-- mossa che sblocca sarebbe spostarla in avanti: cioe' esattamente cio' che
-- l'altro file vieta in maiuscolo. Un freno che scatta a torto insegna ad
-- aggirarlo.
--
-- Lo scostamento (`OF`) serve invece perche' il valore va incollato in un
-- parametro `timestamptz`: senza, cambierebbe significato col fuso della
-- sessione. Se non ci sono ordini, `max()` vale NULL e al suo posto compare la
-- dicitura esplicita.
union all
select 1, 'da copiare nel freno del go-live',
       'ordine piu recente (valore da copiare nel freno): '
         || coalesce(to_char(max(created_at), 'YYYY-MM-DD HH24:MI:SS.USOF'),
                     'NESSUN ORDINE IN TABELLA'),
       count(*)::bigint
       from orders

-- Sottoinsiemi degli ordini. La partizione e' quella di §69 v54 e copre tutti
-- e cinque i valori dell'enum `payment_status`: mai pagati = pending + failed;
-- mai toccati = succeeded + refunded + partially_refunded.
union all
select 20, 'ordini per stato di pagamento', 'mai pagati (pending + failed)',
       count(*)::bigint from orders where payment_status in ('pending', 'failed')
union all
select 21, 'ordini per stato di pagamento', 'mai pagati, creati da oltre 30 giorni',
       count(*)::bigint from orders
       where payment_status in ('pending', 'failed')
         and created_at < now() - interval '30 days'
union all
select 22, 'ordini per stato di pagamento', 'pagati o rimborsati (mai toccati da §69)',
       count(*)::bigint from orders
       where payment_status in ('succeeded', 'refunded', 'partially_refunded')

-- Clienti. §69 vieta di cancellare una riga cliente che abbia almeno un ordine
-- collegato; il database lo impone gia' (orders.customer_id e' not null e non
-- ha cancellazione a catena, §66). Qui si conta quante righe sono libere.
union all
select 30, 'clienti', 'senza alcun ordine collegato',
       count(*)::bigint from customers c
       where not exists (select 1 from orders o where o.customer_id = c.id)
union all
select 31, 'clienti', 'senza alcun ordine e creati da oltre 30 giorni',
       count(*)::bigint from customers c
       where not exists (select 1 from orders o where o.customer_id = c.id)
         and c.created_at < now() - interval '30 days'
union all
select 32, 'clienti', 'con almeno un ordine pagato o rimborsato',
       count(*)::bigint from customers c
       where exists (
         select 1 from orders o
         where o.customer_id = c.id
           and o.payment_status in ('succeeded', 'refunded', 'partially_refunded')
       )

-- Righe di log. §66 impone che le azioni vere sul menu restino: sono l'audit
-- trail. La distinzione fra identificatori di prova e identificatore reale NON
-- e' fissata in spec, quindi qui non si applica alcun criterio: si elencano
-- tutti gli identificatori presenti con il loro conteggio, e la classificazione
-- la fa chi legge, guardando il dato invece di ricordarlo.
union all
select 40, 'log staff', 'righe collegate a un ordine',
       count(*)::bigint from staff_action_log where order_id is not null
union all
select 41, 'log staff', 'righe non collegate ad alcun ordine',
       count(*)::bigint from staff_action_log where order_id is null
union all
select 42, 'log staff — per identificatore', staff_identifier, count(*)::bigint
       from staff_action_log group by staff_identifier

-- Eventi statistici. §69 li stacca invece di cancellarli nella pulizia mensile:
-- il totale non deve calare, deve calare solo il numero dei collegati.
union all
select 50, 'eventi statistici', 'collegati a un ordine',
       count(*)::bigint from analytics_events where order_id is not null
union all
select 51, 'eventi statistici', 'non collegati ad alcun ordine',
       count(*)::bigint from analytics_events where order_id is null

-- Cio' che nessuna delle due pulizie deve toccare (§66, elenco delle tabelle
-- di menu e configurazione). Se uno di questi numeri cambia, fermarsi.
union all
select 60, 'non deve cambiare', 'stores',                  count(*)::bigint from stores
union all
select 61, 'non deve cambiare', 'store_order_windows',     count(*)::bigint from store_order_windows
union all
select 62, 'non deve cambiare', 'store_geofences',         count(*)::bigint from store_geofences
union all
select 63, 'non deve cambiare', 'store_schedule_exceptions', count(*)::bigint from store_schedule_exceptions
union all
select 64, 'non deve cambiare', 'products',                count(*)::bigint from products
union all
select 65, 'non deve cambiare', 'allergens',               count(*)::bigint from allergens
union all
select 66, 'non deve cambiare', 'product_allergens',       count(*)::bigint from product_allergens
union all
select 67, 'non deve cambiare', 'product_choice_options',  count(*)::bigint from product_choice_options
union all
select 68, 'non deve cambiare', 'product_removals',        count(*)::bigint from product_removals
union all
select 69, 'non deve cambiare', 'product_addons',          count(*)::bigint from product_addons
union all
select 70, 'non deve cambiare', 'product_accompaniments',  count(*)::bigint from product_accompaniments
union all
select 71, 'non deve cambiare', 'combo_pricing',           count(*)::bigint from combo_pricing
union all
select 72, 'non deve cambiare', 'combo_side_options',      count(*)::bigint from combo_side_options
union all
select 73, 'non deve cambiare', 'combo_drink_options',     count(*)::bigint from combo_drink_options
union all
select 74, 'non deve cambiare', 'coupons',                 count(*)::bigint from coupons
union all
select 75, 'non deve cambiare', 'staff_settings',          count(*)::bigint from staff_settings

order by ord, misura;
