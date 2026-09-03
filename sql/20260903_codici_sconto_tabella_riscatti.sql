-- ============================================================================
-- I CODICI SCONTO NOMINATIVI — LA TABELLA DEI RISCATTI E DELLE PRENOTAZIONI
-- Pezzo 2 dei codici sconto. Decisioni di Andrea del 03/09/2026.
-- ============================================================================
--
-- COSA FA (anche per chi non conosce SQL):
--   Crea UNA tabella nuova, `coupon_redemptions`, dove ogni codice della serie
--   nuova occupa UNA riga sola per sempre: prima come PRENOTAZIONE (qualcuno ha
--   avviato un pagamento con quel codice) e poi, se il pagamento riesce, come
--   CONSUMO. Poi chiude i permessi dei due ruoli pubblici: a tutte e tre le
--   tabelle dei codici toglie il permesso di svuotarle di colpo, e alla tabella
--   NUOVA toglie anche quelli di leggerla, di aggiungerci righe, di modificarle
--   e di cancellarle. Infine accende su quella nuova le regole per riga.
--
-- ⚠️ CHE COSA NON TOCCA, E VA DETTO PRIMA DI TUTTO IL RESTO:
--   * `promo_redemptions` NON viene toccata. Nessuna colonna, nessun vincolo,
--     nessun indice. Un controllo bloccante lo verifica prima E dopo.
--   * Il codice storico — quello che vale una volta PER PERSONA e che vive in
--     `promo_redemptions` — non viene toccato. ⚠️ E IL SUO NOME NON COMPARE IN
--     QUESTO FILE NEMMENO UNA VOLTA, nemmeno dentro un commento, ed e' voluto.
--     E' anche il motivo per cui il vincolo nuovo e' PIENO e non parziale: una
--     condizione del tipo "vale per tutti i codici tranne quello" avrebbe
--     scritto quel nome dentro lo schema del database, cioe' in una copia in
--     piu' — e la peggiore di tutte, perche' e' l'unica che non si troverebbe
--     cercando nel codice del sito. Quel nome vive in un modulo solo, dove e'
--     stato portato apposta, e li' deve restare.
--   * `coupons` viene toccata solo nei permessi, mai nella struttura.
--
-- ⚠️ PERCHE' UNA TABELLA A PARTE E NON UN VINCOLO IN PIU' SU QUELLA ESISTENTE.
--   Le due regole sono diverse: `promo_redemptions` dice "una volta PER
--   PERSONA", i codici nuovi dicono "una volta AL MONDO". Su una tabella sola
--   la seconda si sarebbe potuta esprimere solo con un'unicita' condizionata, e
--   ogni condizione possibile dipendeva da un dato che qualcuno doveva
--   ricordarsi di scrivere bene — oppure dal nome del codice, cioe' dalla copia
--   vietata qui sopra. Qui il vincolo e' pieno: non dipende da niente.
--
-- ⚠️ LA PRENOTAZIONE NON SI LIBERA DA SE'. Nessun meccanismo del database la
--   libera allo scadere: a liberarla e' IL PROSSIMO CHE SCRIVE, che sovrascrive
--   una prenotazione scaduta. La ragione e' misurata e non opinabile: la
--   condizione di un indice deve essere IMMUTABILE, e la funzione che dice
--   "adesso" e' soltanto STABILE (misurato il 03/09/2026 su questo database:
--   `now()` risulta `s`). Percio' in questo file NON esiste nessuna regola che
--   dipenda dal tempo, e la scadenza e' un DATO come gli altri.
--
-- ⚠️ LA SCADENZA E' UN TEMPO NOSTRO, non quello di Stripe (Andrea, 03/09/2026).
--   Si prenota PRIMA di mandare il cliente a pagare, quindi nell'istante in cui
--   si scrive la prenotazione la sessione di pagamento non esiste ancora e la
--   sua scadenza nemmeno. Fra due orologi che divergono e una finestra in cui
--   un pagamento e' aperto mentre il codice non e' prenotato, si e' scelto il
--   primo danno: e' quello che non fa perdere soldi.
--
-- ⚠️ IL PERICOLO VERO SU `coupons` NON E' `TRUNCATE`: E' `SELECT`, ED E' GIA'
--   CHIUSO. Fra qualche settimana dentro `coupons` ci saranno 600 codici
--   validi, uno dei quali vale il 20% senza tetto: un ruolo pubblico che sappia
--   leggerli sarebbe un elenco scaricabile. Misurato il 02/09/2026: `anon` e
--   `authenticated` NON hanno `SELECT` su `coupons`, e le regole per riga sono
--   accese con ZERO policy.
--   ⚠️ IL GIORNO CHE IL PANNELLO DOVESSE MOSTRARE I 600 CODICI, LA STRADA E' IL
--   RUOLO DEL SERVER (`service_role`), CHE LEGGE DAL SERVER. Non si aggiunge
--   `SELECT` ad `anon` o `authenticated`, e non si aggiunge una policy
--   permissiva: sono la stessa porta aperta in due modi diversi.
--   Il `TRUNCATE` che questo file revoca e' invece difesa in profondita': il
--   01/09/2026 e' stato misurato che l'API pubblica non sa esprimere quel
--   comando, e che le regole per riga NON lo fermerebbero comunque, perche'
--   valgono su select, insert, update e delete e non sulla truncate.
--
-- ⚠️⚠️ LA PORTA CON CUI NASCE UNA TABELLA NUOVA, E PERCHE' QUI SI CHIUDE.
--   La tabella nuova nasce con i permessi predefiniti dello schema, e il
--   01/09/2026 e' stato misurato che quei predefiniti danno ai due ruoli
--   pubblici TUTTI E OTTO i permessi. Cambiare quei predefiniti e' impossibile:
--   il concedente e' un ruolo di sistema e il database rifiuta con `42501`.
--   ⚠️ Fra gli otto ci sono `INSERT`, `UPDATE` e `DELETE`, e QUELLI L'API
--   PUBBLICA SA ESPRIMERLI DA FUORI — a differenza della `TRUNCATE`, che non
--   sa. E in questa tabella vive la memoria di quali codici sono bruciati.
--   ⚠️ E fra gli otto c'e' `SELECT`: su `coupons` i due ruoli pubblici non ce
--   l'hanno, e non c'e' ragione perche' la tabella dei riscatti sia piu' aperta
--   di quella dei codici.
--   ✅ QUINDI SULLA TABELLA NUOVA SE NE REVOCANO CINQUE: `select`, `insert`,
--   `update`, `delete` e `truncate` (decisione di Andrea, 03/09/2026, che
--   corregge la prima versione del comando). Restano `references` e `trigger`,
--   che sono il predefinito di Supabase e non sono esercitabili attraverso
--   l'API pubblica: stessa scelta e stessa ragione del file del 01/09/2026.
--   ⚠️ SULLE DUE TABELLE CHE ESISTEVANO GIA' NON CAMBIA NIENTE: li' si tocca la
--   sola `truncate`, perche' il resto era gia' chiuso e perche' il `SELECT` di
--   una tabella viva non si tocca senza sapere chi lo sta usando.
--   ⚠️ E le regole per riga restano accese con zero policy: sono la SECONDA
--   serratura, indipendente dalla prima. Se un domani qualcuno accendesse una
--   policy permissiva, i permessi tolti reggerebbero comunque; e se qualcuno
--   riconcedesse un permesso, le regole per riga reggerebbero comunque. Due
--   serrature, non una.
--   **Le RIGHE 30 e 31 del referto in fondo stampano cio' che e' RIMASTO**:
--   adesso servono a dimostrare che quei cinque sono spariti, e portano il
--   conteggio che deve valere zero.
--
--   ⚠️ `MAINTAIN` non viene nominato da nessun comando di questo file, ed e'
--   voluto: e' un permesso che esiste solo dalle versioni recenti di
--   PostgreSQL, e un controllo che lo nominasse andrebbe in errore altrove. Una
--   revoca che non lo nomina non lo puo' toccare.
--
-- ⚠️ CIO' CHE QUESTO FILE NON FA, E CHE QUALCUN ALTRO DEVE FARE.
--   Sono tre cose lasciate fuori APPOSTA, perche' il comando che ha ordinato
--   questo file elencava le cose da fare e diceva "e nessun'altra".
--   Sono registrate qui e non fatte: una cosa lasciata fuori senza scriverlo
--   torna come domanda aperta al primo che riprende il lavoro.
--
--   (1) NESSUN LEGAME FRA `code` E LA TABELLA `coupons`. La colonna `code` e'
--       testo libero: niente impedisce che nasca una riga di riscatto per un
--       codice che in `coupons` non esiste. Il legame sarebbe possibile —
--       `coupons.code` e' gia' unico (`km_direct_schema.sql`, riga 398) — ma
--       aggiungerlo e' una decisione, non un dettaglio, e non era fra le cose
--       ordinate. ⚠️ Da decidere prima di generare i 600 codici.
--
--   (2) LA PULIZIA MENSILE NON SA CHE QUESTA TABELLA ESISTE, E SI FERMERA'.
--       `sql/pulizia_mensile_ordini_mai_pagati.sql` cancella i riscatti vecchi
--       nominando la sola `promo_redemptions` (passo 1c), poi gli ordini
--       (passo 2) e infine le righe cliente (passo 3). Le due chiavi esterne di
--       questa tabella non hanno cancellazione a catena — come quelle della
--       tabella vicina — quindi appena esistera' anche una sola riga che punta
--       a un ordine mai pagato di oltre trenta giorni, quello script si
--       FERMERA' con un errore di vincolo, e si fermera' in DUE punti: al passo
--       2 per l'ordine e al passo 3 per il cliente.
--       ⚠️ E' la direzione giusta in cui rompersi — un errore rumoroso invece
--       di una cancellazione silenziosa — ma va chiuso PRIMA del primo mese in
--       cui esistano riscatti veri. Non e' un lavoro di questo file: quello
--       script e' uno strumento di Andrea e si tocca da solo.
--
--   (3) LE TABELLE DEL DATABASE PASSANO DA 23 A 24. §69 dichiara che ogni
--       tabella e' coperta, perche' le sette toccate dagli script piu' le
--       sedici dichiarate intoccabili fanno esattamente 23. Questa e' la
--       ventiquattresima e non sta in nessuno dei due elenchi: da oggi quella
--       frase e' falsa, e nessun controllo della pulizia mensile sorveglia
--       questa tabella. Va sistemato dove vivono quegli elenchi, non qui.
--
-- SICUREZZA:
--   Tutto sta in una transazione (`begin` ... `commit`) con controlli bloccanti
--   prima e dopo: se anche uno solo non torna viene sollevato un errore e NULLA
--   viene scritto. Non esiste lo stato "a meta'".
--   Gli elenchi delle tabelle e dei ruoli sono dichiarati UNA VOLTA e percorsi
--   in ciclo, sia dalle revoche sia dai controlli, cosi' non possono divergere
--   fra loro (stessa scelta del file del 01/09/2026).
--
-- COME SI ESEGUE:
--   Si incolla tutto nel SQL editor di Supabase e si preme Run.
--   ⚠️ IL REFERTO IN FONDO DEVE AVERE ESATTAMENTE 19 RIGHE.
--   Il numero e' scritto qui a mano E viene contato dal database nella prima
--   riga del referto: se i due non coincidono, o se le righe mostrate sono
--   meno, e' l'editor che taglia e il fondo NON e' stato letto.
--   L'editor mostra solo l'ultima istruzione: e' per questo che il referto sta
--   in fondo e non in mezzo.
-- ============================================================================

begin;

-- ============================================================================
-- PARTE 1 — I CONTROLLI PRIMA DI TOCCARE QUALUNQUE COSA
-- ============================================================================

do $$
declare
  -- I due ruoli pubblici, quelli a cui si tolgono i permessi.
  -- ⚠️ L'elenco delle tabelle NON si dichiara qui: questo blocco non ne ha
  -- bisogno, e una seconda copia di un elenco e' una copia che diverge.
  v_ruoli constant text[] := array['anon', 'authenticated'];

  -- I due ruoli che questo file non deve toccare.
  v_ruoli_intoccabili constant text[] := array['postgres', 'service_role'];

  -- La forma di `promo_redemptions` come e' stata MISURATA sul database vivo
  -- il 02/09/2026, e come la descrive `km_direct_schema.sql` (righe 383-392):
  -- 5 colonne, 4 vincoli (chiave primaria, l'unica su promo_code+customer_id e
  -- le due chiavi esterne), 2 indici (quelli delle prime due).
  -- ⚠️ Due fonti indipendenti che dicono lo stesso numero, non una sola.
  -- ⚠️ Se uno di questi tre numeri non torna, questo file si ferma: vuol dire
  -- che quella tabella non e' piu' quella che crediamo, e allora la domanda da
  -- farsi non e' come far passare il controllo.
  v_pr_colonne_attese constant integer := 5;
  v_pr_vincoli_attesi constant integer := 4;
  v_pr_indici_attesi  constant integer := 2;

  v_tab   text;
  v_ruolo text;
  v_n     integer;
begin

  -- PRE-CHECK 1 — le tabelle a cui questo file si appoggia esistono.
  foreach v_tab in array array['coupons', 'promo_redemptions', 'customers', 'orders'] loop
    if to_regclass('public.' || quote_ident(v_tab)) is null then
      raise exception
        'FERMO — la tabella `public.%` non esiste. Questo file si appoggia a lei e non puo'' proseguire. Non e'' stato scritto nulla.',
        v_tab;
    end if;
  end loop;

  -- PRE-CHECK 2 — la tabella nuova NON esiste ancora.
  -- ⚠️ Serve a fermare una seconda esecuzione. Senza, il `create table`
  -- fallirebbe comunque, ma con un messaggio del database invece che con uno
  -- che dice che cosa sta succedendo.
  if to_regclass('public.coupon_redemptions') is not null then
    raise exception
      'FERMO — `public.coupon_redemptions` esiste gia''. Questa migrazione e'' gia'' stata eseguita, oppure esiste una tabella con lo stesso nome creata per altro. Non si esegue due volte: guardare prima com''e'' fatta. Non e'' stato scritto nulla.';
  end if;

  -- PRE-CHECK 3 — i quattro ruoli nominati esistono davvero.
  foreach v_ruolo in array v_ruoli || v_ruoli_intoccabili loop
    if not exists (select 1 from pg_roles where rolname = v_ruolo) then
      raise exception
        'FERMO — il ruolo `%` non esiste su questo database. Questo file e'' scritto per i ruoli di Supabase: se il nome e'' un altro va corretto qui dentro dopo averlo letto, non indovinato. Non e'' stato scritto nulla.',
        v_ruolo;
    end if;
  end loop;

  -- PRE-CHECK 4 — `promo_redemptions` e' esattamente quella misurata.
  -- ⚠️ Nota sul conteggio dei vincoli: fino a PostgreSQL 17 i vincoli di "non
  -- nullo" NON stanno in questo catalogo. Se un domani il motore venisse
  -- portato a una versione che ce li mette, questo controllo scatterebbe: e'
  -- la direzione giusta in cui sbagliare, perche' si ferma invece di scrivere.
  select count(*) into v_n
    from pg_attribute
   where attrelid = 'public.promo_redemptions'::regclass
     and attnum > 0 and not attisdropped;
  if v_n <> v_pr_colonne_attese then
    raise exception
      'FERMO — `promo_redemptions` ha % colonne invece delle % misurate il 02/09/2026. Non e'' piu'' la tabella che questo file si aspetta di NON toccare. Non e'' stato scritto nulla.',
      v_n, v_pr_colonne_attese;
  end if;

  select count(*) into v_n
    from pg_constraint where conrelid = 'public.promo_redemptions'::regclass;
  if v_n <> v_pr_vincoli_attesi then
    raise exception
      'FERMO — `promo_redemptions` ha % vincoli invece dei % misurati il 02/09/2026. Non e'' stato scritto nulla.',
      v_n, v_pr_vincoli_attesi;
  end if;

  select count(*) into v_n
    from pg_index where indrelid = 'public.promo_redemptions'::regclass;
  if v_n <> v_pr_indici_attesi then
    raise exception
      'FERMO — `promo_redemptions` ha % indici invece dei % misurati il 02/09/2026. Non e'' stato scritto nulla.',
      v_n, v_pr_indici_attesi;
  end if;

  raise notice 'PRE-CHECK superati. promo_redemptions: % colonne, % vincoli, % indici, come misurato.',
    v_pr_colonne_attese, v_pr_vincoli_attesi, v_pr_indici_attesi;

end $$;

-- ============================================================================
-- LA FOTOGRAFIA PRIMA — i permessi delle due tabelle che esistono gia'.
-- Si legge ADESSO per confrontarla dopo: una fotografia rifatta dopo il
-- cambiamento coincide sempre e non dimostra piu' niente (lezione `af`).
-- ⚠️ Della tabella nuova non esiste alcun "prima", perche' non esiste ancora:
-- di lei si potra' solo controllare il "dopo". E' un'asimmetria dichiarata, non
-- una dimenticanza.
-- La tabella temporanea sparisce da sola alla fine della transazione.
-- ============================================================================
create temporary table _permessi_prima on commit drop as
select r.ruolo,
       t.tabella,
       has_table_privilege(r.ruolo, 'public.' || quote_ident(t.tabella), 'SELECT')     as sel,
       has_table_privilege(r.ruolo, 'public.' || quote_ident(t.tabella), 'REFERENCES') as ref,
       has_table_privilege(r.ruolo, 'public.' || quote_ident(t.tabella), 'TRIGGER')    as trg
  from (values ('anon'), ('authenticated'))        as r(ruolo)
 cross join (values ('coupons'), ('promo_redemptions')) as t(tabella);

-- ============================================================================
-- PARTE 2 — LA TABELLA NUOVA
-- ============================================================================
--
-- LE COLONNE, UNA PER UNA E PERCHE':
--   `id`            la chiave della riga, come in tutte le altre tabelle.
--   `code`          quale codice. ⚠️ NON e' una chiave esterna verso `coupons`:
--                   vedi in cima la nota "cio' che questo file NON fa".
--   `customer_id`   chi l'ha preso. Per la regola del progetto il telefono e il
--                   cliente sono la stessa cosa, perche' `customers` e' unica
--                   sul numero: quindi "chi l'ha preso" si scrive cosi'.
--   `order_id`      l'ordine. ⚠️ PUO' ESSERE VUOTO, ed e' la differenza vera da
--                   `promo_redemptions`, dove e' obbligatorio: li' la riga
--                   nasce a pagamento avvenuto, qui nasce PRIMA.
--   `status`        `reserved` mentre il pagamento e' in corso, `consumed`
--                   quando e' andato a buon fine.
--   `reserved_until` fino a quando la prenotazione vale. ⚠️ E' un dato, non una
--                   regola: nessun vincolo di questo file lo guarda, perche'
--                   nessun vincolo puo' guardare l'ora (vedi la testa del
--                   file). A far valere la scadenza e' chi scrive.
--   `created_at`    quando la riga e' nata, cioe' la PRIMA volta che quel
--                   codice e' stato preso da qualcuno.
--   `updated_at`    quando e' stata toccata l'ultima volta. ⚠️ Serve perche' la
--                   riga viene SOVRASCRITTA: senza, `created_at` direbbe quando
--                   il codice fu preso la prima volta e non si saprebbe piu'
--                   quando l'ha preso chi ce l'ha adesso. Lo scrive chi scrive:
--                   in questo database non esiste nessun trigger, e questo file
--                   non ne introduce.
--
-- ⚠️ IL VINCOLO PIENO: `unique (code)`. Un codice, una riga, per sempre. Non e'
--   parziale e non ha condizioni: e' questo che lo rende una difesa che nessuno
--   puo' disattivare scrivendo male un dato.
-- ============================================================================

create table public.coupon_redemptions (
  id             uuid primary key default gen_random_uuid(),
  code           text not null,
  customer_id    uuid not null references customers(id),
  order_id       uuid references orders(id),
  status         text not null check (status in ('reserved', 'consumed')),
  reserved_until timestamptz not null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  -- Un codice della serie nuova vale UNA VOLTA AL MONDO.
  unique (code)
);

comment on table public.coupon_redemptions is 'Un codice della serie nuova occupa una riga sola per sempre: prima prenotato, poi consumato. Il vincolo unico su `code` e'' la difesa vera. La scadenza `reserved_until` e'' un dato e non un vincolo, perche'' nessuna condizione di indice puo'' dipendere dall''ora: a liberare una prenotazione scaduta e'' il prossimo che scrive. ⚠️ Nessun ruolo pubblico deve ricevere SELECT su questa tabella ne'' su `coupons`: se il pannello dovra'' mostrare i codici, si legge dal server con `service_role`.';

-- ============================================================================
-- UN SOLO CODICE PER ORDINE — come vincolo, non come disciplina.
--
-- ⚠️ COME SI ESPRIME SENZA IMPEDIRE LA PRENOTAZIONE. Durante la prenotazione
--   l'ordine non c'e' ancora, quindi `order_id` e' vuoto, e le righe in
--   prenotazione sono molte: un'unicita' secca le bloccherebbe.
--   La regola vale quindi SOLO dove l'ordine c'e'.
--
-- ⚠️ PERCHE' SCRITTA COSI' E NON COME `unique (order_id)` SEMPLICE. In
--   PostgreSQL due valori vuoti sono considerati diversi fra loro, quindi anche
--   un'unicita' semplice lascerebbe passare tutte le prenotazioni: le due forme
--   si comportano in modo identico. E' scritta con la condizione a vista
--   perche' la regola si legga dalla riga invece che dipendere da un
--   comportamento che chi legge deve sapere a memoria.
-- ============================================================================
create unique index coupon_redemptions_un_solo_codice_per_ordine
    on public.coupon_redemptions (order_id)
 where order_id is not null;

-- ============================================================================
-- LE REGOLE PER RIGA — accese, con ZERO policy.
-- E' come stanno `coupons` e `promo_redemptions` oggi, misurato il 02/09/2026.
-- Accese senza alcuna policy significa che nessun ruolo soggetto a quelle
-- regole passa: non e' una porta aperta, e' una porta chiusa.
-- ⚠️ Il ruolo con cui scrive il server non e' soggetto a queste regole, quindi
-- il sito continua a funzionare.
-- ============================================================================
alter table public.coupon_redemptions enable row level security;

-- ============================================================================
-- PARTE 3 — LE REVOCHE E I CONTROLLI DOPO
-- ============================================================================

do $$
declare
  -- ⚠️ Il nome della tabella nuova si scrive UNA VOLTA SOLA, e l'elenco delle
  -- tre lo riusa: due copie dello stesso nome sono due cose che divergono.
  v_tabella_nuova constant text := 'coupon_redemptions';

  -- Le tre tabelle a cui va tolta la `truncate`.
  v_tabelle constant text[] := array[
    'coupons',
    'promo_redemptions',
    v_tabella_nuova
  ];

  -- I quattro permessi IN PIU' che si tolgono alla SOLA tabella nuova, oltre
  -- alla `truncate` del primo giro. Sono i quattro che l'API pubblica sa
  -- esprimere da fuori.
  v_permessi_in_piu constant text[] := array['select', 'insert', 'update', 'delete'];

  v_ruoli             constant text[] := array['anon', 'authenticated'];
  v_ruoli_intoccabili constant text[] := array['postgres', 'service_role'];

  v_i        integer;
  v_j        integer;
  v_revocate integer := 0;
  v_residuo  integer := 0;
  v_nome     text;
  v_ruolo    text;
  v_permesso text;
  v_n        integer;
  v_bool     boolean;
begin

  -- ==========================================================================
  -- LE REVOCHE, IN DUE GIRI E NON IN UNO, PERCHE' LE TRE TABELLE NON SONO
  -- NELLA STESSA CONDIZIONE.
  --
  -- PRIMO GIRO — la sola `truncate`, su tutte e tre. Sulle due che esistevano
  -- gia' e' l'unica cosa che si tocca: il resto era gia' chiuso, e il `select`
  -- di una tabella viva non si tocca senza sapere chi lo sta usando.
  --
  -- SECONDO GIRO — sulla SOLA tabella nuova, anche `select`, `insert`,
  -- `update` e `delete`. Nasce con tutti e otto per via dei predefiniti dello
  -- schema, e quei quattro l'API pubblica sa esprimerli da fuori.
  --
  -- ⚠️ `references`, `trigger` e `maintain` non compaiono in nessuno dei due
  -- giri: un comando che non nomina un permesso non lo puo' togliere. La
  -- garanzia sta nella forma del comando, non in un controllo.
  -- ⚠️ I nomi dei permessi del secondo giro vengono dall'elenco dichiarato qui
  -- sopra e non da un dato: in questi comandi non entra niente che arrivi da
  -- fuori.
  -- ==========================================================================
  for v_i in 1 .. array_length(v_tabelle, 1) loop
    for v_j in 1 .. array_length(v_ruoli, 1) loop
      execute format('revoke truncate on table public.%I from %I',
                     v_tabelle[v_i], v_ruoli[v_j]);
      v_revocate := v_revocate + 1;
    end loop;
  end loop;

  foreach v_permesso in array v_permessi_in_piu loop
    foreach v_ruolo in array v_ruoli loop
      execute format('revoke %s on table public.%I from %I',
                     v_permesso, v_tabella_nuova, v_ruolo);
      v_revocate := v_revocate + 1;
    end loop;
  end loop;

  raise notice 'Eseguite % revoche: % tabelle x % ruoli sulla truncate, piu'' % permessi x % ruoli sulla sola tabella nuova.',
    v_revocate,
    array_length(v_tabelle, 1), array_length(v_ruoli, 1),
    array_length(v_permessi_in_piu, 1), array_length(v_ruoli, 1);

  -- ==========================================================================
  -- POST-CHECK BLOCCANTI
  -- ==========================================================================

  -- POST-CHECK 1 — nessuna delle due parti pubbliche puo' piu' truncare.
  -- ⚠️ Puo' fallire davvero, e la causa piu' probabile e' istruttiva: se il
  -- permesso arrivasse dal gruppo PUBLIC invece che dai due ruoli per nome,
  -- revocarlo per nome non lo toglierebbe. Meglio un arresto rumoroso che un
  -- file che dichiara di aver chiuso una porta rimasta aperta.
  for v_i in 1 .. array_length(v_tabelle, 1) loop
    v_nome := 'public.' || quote_ident(v_tabelle[v_i]);
    for v_j in 1 .. array_length(v_ruoli, 1) loop
      if has_table_privilege(v_ruoli[v_j], v_nome, 'TRUNCATE') then
        v_residuo := v_residuo + 1;
      end if;
    end loop;
  end loop;

  if v_residuo <> 0 then
    raise exception
      'POST-CHECK 1 fallito: dopo le revoche restano % coppie tabella+ruolo che possono ancora eseguire TRUNCATE. Il permesso non arriva dai due ruoli per nome — il caso tipico e'' una concessione al gruppo PUBLIC, che si revoca in un altro modo. Transazione annullata, nulla e'' stato scritto.',
      v_residuo;
  end if;

  -- POST-CHECK 1b — sulla TABELLA NUOVA i due ruoli pubblici non hanno piu'
  -- NESSUNO dei cinque permessi tolti. E' il controllo che sorveglia cio' che
  -- distingue questa tabella dalle altre due: qui non basta che non la si possa
  -- svuotare, non la si deve nemmeno poter leggere.
  -- ⚠️ L'elenco su cui gira e' lo STESSO da cui sono state generate le revoche,
  -- piu' la truncate del primo giro: cosi' il controllo non puo' sorvegliare un
  -- insieme diverso da quello che e' stato toccato.
  v_residuo := 0;
  foreach v_ruolo in array v_ruoli loop
    foreach v_permesso in array v_permessi_in_piu || array['truncate'] loop
      if has_table_privilege(v_ruolo,
                             'public.' || quote_ident(v_tabella_nuova),
                             v_permesso) then
        v_residuo := v_residuo + 1;
      end if;
    end loop;
  end loop;

  if v_residuo <> 0 then
    raise exception
      'POST-CHECK 1b fallito: sulla tabella nuova i due ruoli pubblici hanno ancora % permessi fra select, insert, update, delete e truncate. Quella tabella tiene la memoria di quali codici sono bruciati e non deve essere raggiungibile da fuori. Transazione annullata, nulla e'' stato scritto.',
      v_residuo;
  end if;

  -- POST-CHECK 2 — SELECT, REFERENCES e TRIGGER delle DUE TABELLE CHE
  -- ESISTEVANO GIA' sono identici alla fotografia. E' il controllo che si
  -- accorge di cio' che e' cambiato IN PIU': una revoca che nomina la sola
  -- truncate non dovrebbe poterli toccare, e se un giorno qualcuno allargasse
  -- il comando qui dentro, questo se ne accorge.
  if exists (
    select 1
      from _permessi_prima p
     where p.sel <> has_table_privilege(p.ruolo, 'public.' || quote_ident(p.tabella), 'SELECT')
        or p.ref <> has_table_privilege(p.ruolo, 'public.' || quote_ident(p.tabella), 'REFERENCES')
        or p.trg <> has_table_privilege(p.ruolo, 'public.' || quote_ident(p.tabella), 'TRIGGER')
  ) then
    raise exception
      'POST-CHECK 2 fallito: SELECT, REFERENCES o TRIGGER di un ruolo pubblico su `coupons` o `promo_redemptions` sono cambiati. Questo file doveva toccare la sola TRUNCATE. Transazione annullata, nulla e'' stato scritto.';
  end if;

  -- POST-CHECK 3 — i ruoli del server sono intatti su tutte e tre.
  foreach v_ruolo in array v_ruoli_intoccabili loop
    for v_i in 1 .. array_length(v_tabelle, 1) loop
      v_nome := 'public.' || quote_ident(v_tabelle[v_i]);
      if not has_table_privilege(v_ruolo, v_nome, 'TRUNCATE') then
        raise exception
          'POST-CHECK 3 fallito: il ruolo `%` non ha piu'' TRUNCATE su `%`. Questo file non deve toccare i ruoli del server. Transazione annullata, nulla e'' stato scritto.',
          v_ruolo, v_tabelle[v_i];
      end if;
    end loop;
  end loop;

  -- POST-CHECK 4 — `promo_redemptions` e' ancora esattamente quella di prima.
  -- Si ricontrollano gli stessi tre numeri del PRE-CHECK 4: se uno si e' mosso,
  -- questo file ha toccato una tabella che aveva dichiarato di non toccare.
  select count(*) into v_n
    from pg_attribute
   where attrelid = 'public.promo_redemptions'::regclass
     and attnum > 0 and not attisdropped;
  if v_n <> 5 then
    raise exception
      'POST-CHECK 4 fallito: `promo_redemptions` ha adesso % colonne invece di 5. Doveva restare intatta. Transazione annullata, nulla e'' stato scritto.', v_n;
  end if;

  select count(*) into v_n
    from pg_constraint where conrelid = 'public.promo_redemptions'::regclass;
  if v_n <> 4 then
    raise exception
      'POST-CHECK 4 fallito: `promo_redemptions` ha adesso % vincoli invece di 4. Doveva restare intatta. Transazione annullata, nulla e'' stato scritto.', v_n;
  end if;

  select count(*) into v_n
    from pg_index where indrelid = 'public.promo_redemptions'::regclass;
  if v_n <> 2 then
    raise exception
      'POST-CHECK 4 fallito: `promo_redemptions` ha adesso % indici invece di 2. Doveva restare intatta. Transazione annullata, nulla e'' stato scritto.', v_n;
  end if;

  -- POST-CHECK 5 — l'unicita' sul codice esiste, ed e' PIENA.
  -- ⚠️ Il controllo guarda che NON abbia condizioni: un'unicita' condizionata
  -- proteggerebbe solo una parte delle righe, ed e' esattamente cio' che questa
  -- forma e' stata scelta per non avere.
  if not exists (
    select 1
      from pg_index x
     where x.indrelid = 'public.coupon_redemptions'::regclass
       and x.indisunique
       and x.indpred is null
       and pg_get_indexdef(x.indexrelid) like '%(code)%'
  ) then
    raise exception
      'POST-CHECK 5 fallito: sulla tabella nuova non risulta un''unicita'' PIENA sulla colonna `code`. E'' la difesa principale di tutto il lavoro. Transazione annullata, nulla e'' stato scritto.';
  end if;

  -- POST-CHECK 6 — un solo codice per ordine, e SOLO dove l'ordine c'e'.
  if not exists (
    select 1
      from pg_index x
     where x.indrelid = 'public.coupon_redemptions'::regclass
       and x.indisunique
       and x.indpred is not null
       and pg_get_indexdef(x.indexrelid) like '%(order_id)%'
  ) then
    raise exception
      'POST-CHECK 6 fallito: sulla tabella nuova non risulta l''unicita'' condizionata su `order_id`. Transazione annullata, nulla e'' stato scritto.';
  end if;

  -- POST-CHECK 7 — `order_id` ammette il vuoto. E' la condizione che permette
  -- di prenotare prima che l'ordine esista: se fosse obbligatoria, la
  -- prenotazione non sarebbe scrivibile e il lavoro intero non funzionerebbe.
  select a.attnotnull into v_bool
    from pg_attribute a
   where a.attrelid = 'public.coupon_redemptions'::regclass
     and a.attname = 'order_id';
  if v_bool then
    raise exception
      'POST-CHECK 7 fallito: `order_id` risulta obbligatoria. Si prenota PRIMA che l''ordine esista: cosi'' la prenotazione non si potrebbe scrivere. Transazione annullata, nulla e'' stato scritto.';
  end if;

  -- POST-CHECK 8 — le regole per riga sono accese, e le policy sono zero.
  select c.relrowsecurity into v_bool
    from pg_class c where c.oid = 'public.coupon_redemptions'::regclass;
  if not v_bool then
    raise exception
      'POST-CHECK 8 fallito: le regole per riga NON risultano accese sulla tabella nuova. Transazione annullata, nulla e'' stato scritto.';
  end if;

  select count(*) into v_n
    from pg_policy where polrelid = 'public.coupon_redemptions'::regclass;
  if v_n <> 0 then
    raise exception
      'POST-CHECK 8 fallito: sulla tabella nuova risultano % policy, e dovevano essere zero. Transazione annullata, nulla e'' stato scritto.', v_n;
  end if;

  raise notice 'POST-CHECK superati. Tabella nuova creata, unicita'' piena sul codice, unicita'' condizionata sull''ordine, regole per riga accese con zero policy, cinque permessi tolti ai ruoli pubblici sulla tabella nuova, TRUNCATE tolta anche sulle altre due, promo_redemptions intatta.';
  raise notice 'DA GUARDARE NEL REFERTO QUI SOTTO: le righe 30 e 31 dicono che cosa e'' RIMASTO ai due ruoli pubblici sulla tabella nuova. Dei cinque tolti ne deve risultare ZERO.';

end $$;

commit;

-- ============================================================================
-- REFERTO DI SOLA LETTURA — rilegge com'e' venuta.
-- ⚠️ DEVE AVERE ESATTAMENTE 19 RIGHE:
--    1 di testa
--  + 6 (3 tabelle x 2 ruoli pubblici)
--  + 3 (service_role sulle 3 tabelle)
--  + 2 (cio' che e' RIMASTO ai due ruoli pubblici sulla tabella nuova)
--  + 5 (forma, vincoli, indici, regole per riga, order_id della tabella nuova)
--  + 1 (promo_redemptions invariata)
--  + 1 (verdetto)
--    Il numero e' anche contato dal database nella riga di testa: se i due non
--    coincidono, o se ne arrivano meno, e' troncato e il fondo NON e' letto.
-- ============================================================================
with t(tabella) as (
  values ('coupons'), ('promo_redemptions'), ('coupon_redemptions')
),
r(ruolo) as (
  values ('anon'), ('authenticated')
),
permessi(nome) as (
  values ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE'),
         ('TRUNCATE'), ('REFERENCES'), ('TRIGGER')
),
referto as (

select 10 as ord,
       'i due ruoli pubblici — atteso: TRUNCATE no'::text as sezione,
       (r.ruolo || ' su ' || t.tabella)::text as misura,
       (case when has_table_privilege(r.ruolo, 'public.' || quote_ident(t.tabella), 'TRUNCATE')
             then 'ATTENZIONE - puo ancora truncare'
             else 'truncate: no' end
        || ' | select: '
        || case when has_table_privilege(r.ruolo, 'public.' || quote_ident(t.tabella), 'SELECT')
                then 'SI' else 'no' end)::text as esito
  from t cross join r

union all

select 20,
       'service_role — non doveva essere toccato, atteso SI',
       'service_role su ' || t.tabella,
       case when has_table_privilege('service_role', 'public.' || quote_ident(t.tabella), 'TRUNCATE')
            then 'truncate: SI' else 'ATTENZIONE - truncate: NO' end
  from t

union all

-- ⚠️ LE DUE RIGHE DA GUARDARE. Dicono che cosa e' RIMASTO ai due ruoli
-- pubblici sulla tabella nuova, dopo le revoche. Atteso: soltanto REFERENCES e
-- TRIGGER, e ZERO dei cinque tolti. Il secondo numero non e' una ripetizione
-- del primo: il primo si legge, il secondo si controlla.
select 30,
       'la tabella nuova — i permessi RIMASTI ai ruoli pubblici',
       r.ruolo || ' su coupon_redemptions',
       'rimasti: '
       || coalesce((select string_agg(p.nome, ', ' order by p.nome)
                      from permessi p
                     where has_table_privilege(r.ruolo, 'public.coupon_redemptions', p.nome)),
                   'nessuno')
       || ' | dei cinque tolti ne risultano ancora: '
       || (select count(*)::text
             from permessi p
            where p.nome in ('SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE')
              and has_table_privilege(r.ruolo, 'public.coupon_redemptions', p.nome))
       || ' (deve essere 0)'
  from r

union all

select 40,
       'la tabella nuova — la sua forma',
       'coupon_redemptions: colonne, vincoli, indici',
       (select count(*)::text from pg_attribute
         where attrelid = 'public.coupon_redemptions'::regclass
           and attnum > 0 and not attisdropped) || ' colonne | '
       || (select count(*)::text from pg_constraint
            where conrelid = 'public.coupon_redemptions'::regclass) || ' vincoli | '
       || (select count(*)::text from pg_index
            where indrelid = 'public.coupon_redemptions'::regclass) || ' indici'

union all

select 41,
       'la tabella nuova — i vincoli per intero',
       'coupon_redemptions: vincoli',
       coalesce((select string_agg(conname || ' = ' || pg_get_constraintdef(oid), '  ///  ' order by conname)
                   from pg_constraint
                  where conrelid = 'public.coupon_redemptions'::regclass),
                'ATTENZIONE - nessuno')

union all

select 42,
       'la tabella nuova — gli indici per intero',
       'coupon_redemptions: indici',
       coalesce((select string_agg(indexname || ' = ' || indexdef, '  ///  ' order by indexname)
                   from pg_indexes
                  where schemaname = 'public' and tablename = 'coupon_redemptions'),
                'ATTENZIONE - nessuno')

union all

select 43,
       'la tabella nuova — le regole per riga',
       'coupon_redemptions: accese? quante policy?',
       (select case when c.relrowsecurity then 'accese: SI' else 'ATTENZIONE - accese: NO' end
          from pg_class c where c.oid = 'public.coupon_redemptions'::regclass)
       || ' | policy: '
       || (select count(*)::text from pg_policy
            where polrelid = 'public.coupon_redemptions'::regclass)
       || ' (devono essere zero)'

union all

select 44,
       'la tabella nuova — la colonna che permette di prenotare prima',
       'coupon_redemptions.order_id ammette il vuoto?',
       (select case when a.attnotnull then 'ATTENZIONE - NO, e obbligatoria' else 'SI, come deve essere' end
          from pg_attribute a
         where a.attrelid = 'public.coupon_redemptions'::regclass
           and a.attname = 'order_id')

union all

select 50,
       'promo_redemptions — doveva restare identica',
       'promo_redemptions: colonne, vincoli, indici',
       (select count(*)::text from pg_attribute
         where attrelid = 'public.promo_redemptions'::regclass
           and attnum > 0 and not attisdropped) || ' colonne (attese 5) | '
       || (select count(*)::text from pg_constraint
            where conrelid = 'public.promo_redemptions'::regclass) || ' vincoli (attesi 4) | '
       || (select count(*)::text from pg_index
            where indrelid = 'public.promo_redemptions'::regclass) || ' indici (attesi 2)'

union all

select 60,
       'VERDETTO',
       'coppie tabella+ruolo pubblico che possono ancora truncare',
       (select count(*)::text
          from t cross join r
         where has_table_privilege(r.ruolo, 'public.' || quote_ident(t.tabella), 'TRUNCATE'))
       || ' (deve essere 0)'

)

select 0 as ord,
       'testa'::text as sezione,
       ('referto eseguito il ' || to_char(now(), 'YYYY-MM-DD HH24:MI:SS.USOF'))::text as misura,
       ('righe che questo referto deve avere, questa compresa: '
         || (select count(*) + 1 from referto)::text
         || ' | in cima al referto ne sono dichiarate 19 a mano: i due numeri devono coincidere')::text as esito

union all

select ord, sezione, misura, esito from referto

 order by ord, misura;
