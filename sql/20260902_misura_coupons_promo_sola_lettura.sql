-- ============================================================================
-- MISURA SU coupons E promo_redemptions — SOLA LETTURA
-- Pezzo 1 dei codici sconto nominativi — 02/09/2026
-- ============================================================================
--
-- COSA FA (anche per chi non conosce SQL):
--   Guarda com'e' fatto il database VIVO nel punto in cui nasceranno i codici
--   sconto: le due tabelle `coupons` e `promo_redemptions`. Dice quali colonne
--   hanno, quali vincoli e quali indici, se le regole per riga sono accese,
--   CHI le puo' leggere e scrivere, quante righe contengono e cosa c'e' dentro.
--   Non cambia NULLA: e' una sola interrogazione che legge.
--
-- ⚠️ NON E' STATO ESEGUITO DA CODE, E NON POTEVA ESSERLO.
--   Code arriva al database solo attraverso l'API pubblica, che espone i DATI
--   dello schema `public` ma non la sua FORMA: vincoli, indici, regole per
--   riga, permessi e trigger da li' non si vedono (HANDOFF punto 3, e la
--   regola nata dal giro privacy al punto 14). Questo file e' quindi scritto e
--   NON PROVATO. La prima esecuzione in assoluto e' quella di Andrea nel SQL
--   editor.
--   ⚠️ Se si ferma con un errore, l'errore E' UN DATO: va riportato tale e
--   quale, senza aggiustare niente per farlo passare.
--
-- COSA NON TOCCA MAI:
--   Niente. In questo file non esiste alcuna istruzione che scrive: nessun
--   inserimento, nessuna modifica, nessuna cancellazione, nessuno svuotamento,
--   nessun cambio di struttura, nessuna concessione ne' revoca di permessi.
--   ⚠️ Quelle parole compaiono in questi commenti e possono comparire nei
--   RISULTATI (la sezione F elenca i permessi che i ruoli hanno, e li' dentro
--   c'e' scritto per esempio che qualcuno puo' cancellare): sono cio' che il
--   referto RACCONTA, non cio' che il file FA.
--
-- QUANTE RIGHE DEVE AVERE IL REFERTO (§66, riga 6271: un'interrogazione lunga
-- lo dichiara in cima):
--   ⚠️ Il numero esatto non si puo' scrivere qui, perche' dipende da quante
--   colonne, vincoli, indici, policy, ruoli e righe il database ha davvero —
--   che e' precisamente cio' che questa misura va a scoprire. Per questo il
--   numero NON e' scritto a mano: LO CONTA IL DATABASE al momento
--   dell'esecuzione e lo stampa nella PRIMA riga del referto.
--   Si legge cosi': se le righe che compaiono a schermo sono MENO del numero
--   dichiarato in quella prima riga, l'elenco e' stato TAGLIATO dallo
--   strumento e il fondo NON e' stato letto (§66, righe 6269-6271: il tetto
--   dell'editor esiste, il suo valore vero non e' misurato, e un referto che
--   finisce su un numero tondo non va mai creduto completo).
--   Ordine di grandezza atteso, per accorgersi di un risultato assurdo prima
--   ancora di contare: qualche decina di righe, ben sotto il centinaio.
--   ⚠️ NON e' stato messo alcun `LIMIT`: §66 lo vieta espressamente, perche' e'
--   il modo piu' facile per rimettere di nascosto il problema che si sta
--   evitando.
--
-- COME SI LEGGE:
--   Tre colonne. `ord` e' solo la chiave con cui le righe si mettono in fila.
--   `sezione` dice a quale delle nove domande la riga risponde, con la sua
--   lettera davanti. `dettaglio` e' la risposta, in testo.
--   ⚠️ Le sezioni che elencano cose (vincoli, indici, policy, trigger) possono
--   non produrre NESSUNA riga, e l'assenza di righe non e' una risposta. Per
--   questo c'e' la sezione di riepilogo `D-E-I`, che di quelle cose stampa il
--   NUMERO, zero compreso: uno zero detto vale, uno zero taciuto no.
--
-- COME SI ESEGUE:
--   Si incolla nel SQL editor di Supabase e si preme Run. Non serve altro.
-- ============================================================================

with referto as (

-- ---------------------------------------------------------------------------
-- B) L'ELENCO DELLE TABELLE DELLO SCHEMA public, IN UNA RIGA SOLA.
--    Serve come controprova che dal 29/07 non sia nata ne' sparita una
--    tabella: lo schema autorevole `km_direct_schema.sql` ne descriveva 23.
--    ⚠️ L'elenco si legge dal catalogo interno e non da `information_schema`,
--    che mostra soltanto le tabelle su cui chi esegue ha dei permessi: una
--    tabella nuova e inaccessibile sparirebbe dal conteggio invece di
--    comparire, ed e' il verso sbagliato in cui sbagliare.
-- ---------------------------------------------------------------------------
select 10 as ord,
       'B) tabelle dello schema public'::text as sezione,
       ('quante: ' || count(*)::text || ' — '
         || string_agg(c.relname, ', ' order by c.relname))::text as dettaglio
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public'
   and c.relkind in ('r', 'p')

union all

-- ---------------------------------------------------------------------------
-- C) LE COLONNE DELLE DUE TABELLE, UNA RIGA PER COLONNA.
--    Nome, tipo con la sua precisione, se ammette il nullo, valore
--    predefinito. `format_type` scrive il tipo come lo scrive il database:
--    per esempio `numeric(10,2)` e non il solo `numeric`.
-- ---------------------------------------------------------------------------
select 20,
       'C) colonne — ' || c.relname,
       'posizione ' || lpad(a.attnum::text, 2, '0')
         || ' | ' || a.attname
         || ' | tipo: ' || format_type(a.atttypid, a.atttypmod)
         || ' | ammette il nullo: ' || case when a.attnotnull then 'NO' else 'SI' end
         || ' | predefinito: ' || coalesce(pg_get_expr(d.adbin, d.adrelid), '(nessuno)')
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  join pg_attribute a on a.attrelid = c.oid
  left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
 where n.nspname = 'public'
   and c.relname in ('coupons', 'promo_redemptions')
   and a.attnum > 0
   and not a.attisdropped

union all

-- ---------------------------------------------------------------------------
-- RIEPILOGO DEI CONTEGGI — la difesa contro lo zero taciuto.
--    Le sezioni D, E e I elencano; se non c'e' niente da elencare non
--    producono righe, e un elenco vuoto ha la stessa faccia di una domanda mai
--    fatta. Qui i numeri si dicono comunque, zero compreso.
-- ---------------------------------------------------------------------------
select 25,
       'D-E-I) riepilogo dei conteggi — ' || c.relname,
       'colonne: '
         || (select count(*) from pg_attribute a
              where a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped)::text
         || ' | vincoli: '
         || (select count(*) from pg_constraint k where k.conrelid = c.oid)::text
         || ' | indici: '
         || (select count(*) from pg_index i where i.indrelid = c.oid)::text
         || ' | policy: '
         || (select count(*) from pg_policy p where p.polrelid = c.oid)::text
         || ' | trigger non interni: '
         || (select count(*) from pg_trigger g
              where g.tgrelid = c.oid and not g.tgisinternal)::text
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public'
   and c.relname in ('coupons', 'promo_redemptions')

union all

-- ---------------------------------------------------------------------------
-- D) I VINCOLI, CON LA DEFINIZIONE PER INTERO COME LA SCRIVE IL DATABASE.
--    ⚠️ La domanda vera e' quella dell'attuazione (A4): se il vincolo unico su
--    (promo_code, customer_id) esista DAVVERO nel database vivo, con quale
--    nome e su quali colonne. Non si prende per buono da `km_direct_schema.sql`,
--    che e' del 29/07. Qui non si cerca quel vincolo: si elencano TUTTI quelli
--    che ci sono e si guarda se e' fra loro — una sonda che cerca cio' che si
--    aspetta trova solo cio' che si aspetta.
--    `pg_get_constraintdef` restituisce il testo esatto, comprese le
--    condizioni parziali che un `where` puo' portarsi dietro.
-- ---------------------------------------------------------------------------
select 30,
       'D) vincoli — ' || c.relname,
       k.conname
         || ' | genere: '
         || case k.contype
              when 'p' then 'chiave primaria'
              when 'u' then 'unico'
              when 'f' then 'chiave esterna'
              when 'c' then 'controllo'
              when 'x' then 'esclusione'
              else k.contype::text
            end
         || ' | definizione: ' || pg_get_constraintdef(k.oid)
  from pg_constraint k
  join pg_class c on c.oid = k.conrelid
  join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public'
   and c.relname in ('coupons', 'promo_redemptions')

union all

-- ---------------------------------------------------------------------------
-- D) GLI INDICI, CON LA DEFINIZIONE PER INTERO.
--    ⚠️ Vanno chiesti INSIEME ai vincoli e non al loro posto: un'unicita' puo'
--    vivere come indice unico senza essere un vincolo, e in quel caso la
--    sezione dei vincoli non la nomina affatto. Guardare una sola delle due
--    liste vuol dire poter concludere che non c'e' una cosa che c'e'.
--    E' anche il posto dove si vedrebbe un indice unico PARZIALE, cioe' una
--    delle tre forme che l'attuazione (A4) mette in campo per far convivere
--    "una volta per persona" e "una volta al mondo".
-- ---------------------------------------------------------------------------
select 31,
       'D) indici — ' || i.tablename,
       i.indexname || ' | definizione: ' || i.indexdef
  from pg_indexes i
 where i.schemaname = 'public'
   and i.tablename in ('coupons', 'promo_redemptions')

union all

-- ---------------------------------------------------------------------------
-- E) LE REGOLE PER RIGA: se sono accese, e quante policy ci sono.
--    Due valori distinti e non uno: una tabella puo' avere le regole accese e
--    zero policy, che significa "nessuno passa" — non "tutti passano".
--    ⚠️ E le regole per riga NON governano lo svuotamento di una tabella, che
--    dipende dal solo permesso della sezione F: e' la scoperta del 01/09,
--    scritta qui perche' e' il punto in cui verrebbe da fidarsene.
-- ---------------------------------------------------------------------------
select 40,
       'E) regole per riga — ' || c.relname,
       'accese: ' || case when c.relrowsecurity then 'SI' else 'NO' end
         || ' | imposte anche al proprietario: '
         || case when c.relforcerowsecurity then 'SI' else 'NO' end
         || ' | quante policy: '
         || (select count(*) from pg_policy p where p.polrelid = c.oid)::text
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public'
   and c.relname in ('coupons', 'promo_redemptions')

union all

-- ---------------------------------------------------------------------------
-- E) LE POLICY, UNA PER RIGA, COL COMANDO SU CUI VALGONO.
--    Oltre al comando si stampano i ruoli a cui si applicano e le due
--    condizioni, quella di lettura e quella di scrittura: una policy senza
--    sapere su chi e su cosa vale non dice niente.
-- ---------------------------------------------------------------------------
select 41,
       'E) policy — ' || p.tablename,
       p.policyname
         || ' | comando: ' || p.cmd
         || ' | genere: ' || p.permissive
         || ' | ruoli: ' || array_to_string(p.roles, ', ')
         || ' | condizione di lettura: ' || coalesce(p.qual, '(nessuna)')
         || ' | condizione di scrittura: ' || coalesce(p.with_check, '(nessuna)')
  from pg_policies p
 where p.schemaname = 'public'
   and p.tablename in ('coupons', 'promo_redemptions')

union all

-- ---------------------------------------------------------------------------
-- F) I PERMESSI DI TABELLA, UNA RIGA PER RUOLO.
--    ⚠️ E' la domanda che oggi sembra fuori tema e fra qualche settimana non lo
--    sara' piu': quando dentro `coupons` ci saranno 600 codici validi, uno dei
--    quali vale il 20% senza tetto, un ruolo pubblico che la sa leggere e' un
--    elenco scaricabile.
--    Tre scelte, e la ragione di ciascuna:
--    (1) i permessi si leggono dal catalogo interno e non dalle viste di
--        `information_schema`, che mostrano solo cio' che riguarda chi esegue:
--        cosi' compaiono TUTTI i ruoli che risultano davvero, non quelli che ci
--        si aspetta di trovare;
--    (2) quando una tabella non ha mai ricevuto alcun permesso esplicito, il
--        catalogo tiene il nulla invece dell'elenco. Preso alla lettera darebbe
--        "nessun permesso a nessuno", che e' falso: il proprietario li ha tutti.
--        Al posto del nulla si mette quindi l'elenco predefinito che il
--        database userebbe, chiesto al database stesso;
--    (3) si stampa anche CHI HA CONCESSO. Il 01/09 la revoca dei permessi
--        predefiniti e' stata rifiutata perche' il concedente era un ruolo di
--        sistema: chi scrivera' la migrazione deve saperlo prima, non dopo.
-- ---------------------------------------------------------------------------
select 50,
       'F) permessi di tabella — ' || c.relname,
       'ruolo: '
         || case when acl.grantee = 0 then 'PUBLIC'
                 else pg_get_userbyid(acl.grantee) end
         || ' | permessi: ' || string_agg(acl.privilege_type, ', ' order by acl.privilege_type)
         || ' | concessi da: ' || pg_get_userbyid(acl.grantor)
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  cross join lateral aclexplode(coalesce(c.relacl, acldefault('r'::"char", c.relowner))) as acl
 where n.nspname = 'public'
   and c.relname in ('coupons', 'promo_redemptions')
 group by c.relname, acl.grantee, acl.grantor

union all

-- ---------------------------------------------------------------------------
-- G) QUANTE RIGHE HANNO LE DUE TABELLE.
--    ⚠️ Il numero di `promo_redemptions` decide una contraddizione interna alla
--    spec v91: §14 (riga 1050) dice che la tabella "contiene ancora i riscatti
--    delle prove", §69 (riga 6953) dice che il 01/09 sono passati da 4 a zero.
--    Le due frasi stanno nello stesso documento e non possono essere vere
--    insieme. Questa riga e' la misura che le separa.
-- ---------------------------------------------------------------------------
select 60, 'G) quante righe',
       'coupons: ' || (select count(*) from public.coupons)::text

union all

select 60, 'G) quante righe',
       'promo_redemptions: ' || (select count(*) from public.promo_redemptions)::text

union all

-- ---------------------------------------------------------------------------
-- G) IL CONTENUTO DI coupons PER INTERO, SE NON E' VUOTA.
--    Se e' vuota, questa sezione non produce nessuna riga: a dirlo e' il
--    conteggio qui sopra, che stampa lo zero.
--    Ogni riga viene resa nella sua interezza, colonna per colonna, senza che
--    questo file nomini una sola colonna: cosi' il referto resta giusto
--    qualunque cosa `coupons` contenga, comprese eventuali colonne che nessun
--    documento nomina.
--    ⚠️ Nessun tetto e' stato messo al numero di righe: §66 (riga 6271) vieta
--    di aggiungere un `LIMIT` per stare sicuri. Se un giorno la tabella fosse
--    piena, il referto sarebbe lungo — e a dirlo sarebbe il numero della prima
--    riga, che e' esattamente il suo mestiere.
-- ---------------------------------------------------------------------------
select 61, 'G) contenuto di coupons', to_jsonb(t)::text
  from public.coupons t

union all

-- ---------------------------------------------------------------------------
-- H) I CODICI DISTINTI IN promo_redemptions, E QUANTE VOLTE COMPARE CIASCUNO.
--    ⚠️ Il codice NON viene chiesto per nome di colonna ma per chiave, ed e'
--    voluto. La sezione D vieta di dare per esistente cio' che oggi si legge
--    solo in uno schema del 29/07; se qui fosse scritto il nome della colonna e
--    quella colonna non esistesse, il database rifiuterebbe l'INTERA
--    interrogazione e tutte e nove le domande morirebbero insieme per colpa
--    dell'ultima. Chiesto per chiave, un nome che non c'e' restituisce il nulla
--    e il referto prosegue, dicendolo.
--    La sezione C, poco sopra, elenca i nomi veri delle colonne: e' li' che si
--    distingue un valore nullo da una colonna assente.
-- ---------------------------------------------------------------------------
select 70, 'H) promo_redemptions per codice',
       'codici distinti: '
         || count(distinct coalesce(to_jsonb(t) ->> 'promo_code', '(assente o nullo)'))::text
  from public.promo_redemptions t

union all

select 71, 'H) promo_redemptions per codice',
       coalesce(to_jsonb(t) ->> 'promo_code',
                '(colonna promo_code assente, oppure valore nullo — vedi sezione C)')
         || ' | quante volte: ' || count(*)::text
  from public.promo_redemptions t
 group by coalesce(to_jsonb(t) ->> 'promo_code',
                   '(colonna promo_code assente, oppure valore nullo — vedi sezione C)')

union all

-- ---------------------------------------------------------------------------
-- I) I TRIGGER SULLE DUE TABELLE, CON LA DEFINIZIONE PER INTERO.
--    Si escludono quelli interni, che il database crea da solo per far
--    rispettare le chiavi esterne: non sono comportamento nostro e
--    riempirebbero il referto nascondendo cio' che conta.
--    Se non ne compare nessuno, il numero e' nel riepilogo `D-E-I`.
-- ---------------------------------------------------------------------------
select 80,
       'I) trigger — ' || c.relname,
       g.tgname || ' | definizione: ' || pg_get_triggerdef(g.oid)
  from pg_trigger g
  join pg_class c on c.oid = g.tgrelid
  join pg_namespace n on n.oid = c.relnamespace
 where n.nspname = 'public'
   and c.relname in ('coupons', 'promo_redemptions')
   and not g.tgisinternal

)

-- ---------------------------------------------------------------------------
-- A) LA RIGA DI TESTA.
--    Data e ora lette dal database, non dal computer di chi esegue, e il
--    numero di righe che il referto produce — questa compresa.
--    ⚠️ Quel numero non e' scritto a mano da nessuno: e' il database che conta
--    le proprie righe mentre le produce. Serve a una cosa sola, ed e' la piu'
--    importante di tutto il file: accorgersi di un TRONCAMENTO. Un elenco
--    tagliato ha la stessa faccia di un elenco finito.
-- ---------------------------------------------------------------------------
select 0 as ord,
       'A) testa'::text as sezione,
       ('referto eseguito il ' || to_char(now(), 'YYYY-MM-DD HH24:MI:SS.USOF')
         || ' | righe che questo referto deve avere, questa compresa: '
         || (select count(*) + 1 from referto)::text
         || ' | se le righe mostrate sono meno di questo numero, il referto e stato troncato')::text as dettaglio

union all

select ord, sezione, dettaglio from referto

 order by ord, sezione, dettaglio;
