-- ============================================================================
-- IL LEGAME FRA I RISCATTI E I CODICI
-- Pezzo 2b dei codici sconto. Decisione di Andrea del 04/09/2026.
-- ============================================================================
--
-- COSA FA (anche per chi non conosce SQL):
--   Aggiunge UNA COSA SOLA: il legame fra la colonna `code` di
--   `coupon_redemptions` e la colonna `code` di `coupons`. Da qui in poi non
--   puo' piu' nascere un riscatto per un codice che non esiste, e non si puo'
--   piu' cancellare un codice che qualcuno ha usato.
--   Non crea tabelle, non aggiunge colonne, non tocca permessi, non tocca le
--   regole per riga. Una cosa sola.
--
-- ⚠️ PERCHE' ADESSO E NON DOPO.
--   Le due tabelle sono VUOTE. Aggiungere questo legame su una tabella gia'
--   piena costerebbe prima trovare le righe che non lo rispettano e decidere
--   cosa farne. Fatto oggi, non c'e' niente da sistemare — ed e' anche il
--   motivo per cui il file, fra i controlli, pretende che siano ancora vuote.
--
-- ⚠️⚠️ ALLA CANCELLAZIONE DI UN CODICE IL DATABASE RIFIUTA (Andrea, 04/09/2026).
--   Non si porta via il riscatto, e non lo azzera.
--   LA RAGIONE, che e' la parte importante: il riscatto e' LA MEMORIA che
--   qualcuno ha usato quel codice. Portarselo via vorrebbe dire che il codice,
--   se ricreato, tornerebbe utilizzabile — e quella memoria sparirebbe IN
--   SILENZIO, insieme a una cancellazione che a chi la fa sembra innocua.
--   Un rifiuto rumoroso costa una domanda; una cascata silenziosa costa uno
--   sconto regalato due volte e nessuno che se ne accorga.
--
-- ⚠️ IL PRECEDENTE, LETTO E NON RICORDATO — e non e' identico nella forma.
--   `order_items.product_id` punta a `products(id)` SENZA alcuna clausola
--   (`km_direct_schema.sql`, riga 339): la protezione c'e', ma e' implicita,
--   perche' quando non si dice niente il predefinito e' gia' il rifiuto.
--   In tutto quello schema le clausole `on delete` scritte a mano sono 18 e
--   sono tutte `cascade`; le occorrenze di `on update` sono ZERO.
--   Qui la protezione e' la stessa, ma SCRITTA invece che lasciata implicita.
--
-- ⚠️ PERCHE' SCRITTA, VISTO CHE IL PREDEFINITO FAREBBE LO STESSO.
--   Perche' il database, quando si fa raccontare un vincolo, stampa SOLTANTO
--   le azioni diverse dal predefinito. Lasciandole implicite, il referto in
--   fondo direbbe soltanto "FOREIGN KEY (code) REFERENCES coupons(code)" e il
--   comportamento alla cancellazione — che e' la decisione di oggi — non si
--   vedrebbe da nessuna parte. Scritto, si legge.
--   ⚠️ E COSA CAMBIA DAVVERO SCRIVERLO: nulla di osservabile qui. Tutte e due
--   le forme rifiutano. L'unica differenza e' QUANDO avviene il controllo
--   dentro un singolo comando — subito con `restrict`, a fine istruzione col
--   predefinito — e si vedrebbe solo se un comando solo cancellasse il codice e
--   lo rimettesse al suo posto nello stesso atto. Togliere le quattro parole
--   non cambierebbe il comportamento.
--
-- ⚠️ E ALL'AGGIORNAMENTO, cioe' se qualcuno cambiasse il TESTO di un codice.
--   Anche li' il predefinito e' gia' il rifiuto: finche' esiste un riscatto che
--   punta a quel codice, cambiarne il testo NON passa, e il riscatto non puo'
--   restare a puntare al nulla. Anche questa e' scritta a vista, per la stessa
--   ragione di sopra e non perche' cambi il comportamento.
--
-- ⚠️ COSA QUESTO FILE NON PUO' VERIFICARE DA SOLO, e chi lo verifica al posto
--   suo. Che `coupons.code` porti davvero un'unicita' sul database VIVO non e'
--   stato accertato da chi ha scritto questo file: lo schema in radice e' del
--   29/07 e li' quella riga e' la 400, ma un file non e' una misura. A dirlo e'
--   il PRE-CHECK 2 qui sotto, che lo legge dal database al momento
--   dell'esecuzione e si ferma se non lo trova. ⚠️ Senza quell'unicita' il
--   legame non e' nemmeno costruibile, e il database rifiuterebbe comunque: il
--   controllo serve a dare una frase leggibile invece di un errore di sistema.
--
-- COSA NON DEVE CAMBIARE, ED E' CONTROLLATO:
--   * `coupon_redemptions`: 8 colonne e 3 indici, misurati il 03/09/2026 nel
--     referto della migrazione precedente. I VINCOLI aumentano di UNO, che e'
--     questo, e il controllo verifica proprio "uno in piu'", non un numero
--     scritto a mano.
--   * `coupons`: 12 colonne e 2 indici, misurati il 02 e il 03/09/2026. Vincoli
--     invariati: il legame nasce sull'altra tabella, non su questa.
--   * `promo_redemptions`: non e' nemmeno nominata dalle modifiche, ma entra
--     nei controlli sui permessi e sulle regole per riga.
--   * NESSUN permesso e NESSUNA regola per riga cambiano, su nessuna delle tre
--     tabelle: se ne prende la fotografia prima e la si riconfronta dopo.
--
-- ⚠️ CIO' CHE QUESTO FILE NON FA, e che resta aperto da prima:
--   la pulizia mensile continua a non sapere che `coupon_redemptions` esiste, e
--   le tabelle del database restano 24 contro le 23 dichiarate. Sono le due
--   voci gia' registrate in testa alla migrazione del 03/09/2026: questo file
--   non le chiude e non le peggiora.
--
-- SICUREZZA:
--   Tutto sta in una transazione con controlli bloccanti prima e dopo: se anche
--   uno solo non torna viene sollevato un errore e NULLA viene scritto. Non
--   esiste lo stato "a meta'".
--
-- COME SI ESEGUE:
--   Si incolla tutto nel SQL editor di Supabase e si preme Run.
--   ⚠️ IL REFERTO IN FONDO DEVE AVERE ESATTAMENTE 8 RIGHE.
--   Il numero e' scritto qui a mano E viene contato dal database nella prima
--   riga del referto: se i due non coincidono, o se ne arrivano meno, e'
--   l'editor che taglia e il fondo NON e' stato letto.
--   L'editor mostra solo l'ultima istruzione: e' per questo che il referto sta
--   in fondo e non in mezzo.
-- ============================================================================

begin;

-- ============================================================================
-- PARTE 1 — I CONTROLLI PRIMA DI TOCCARE QUALUNQUE COSA
-- ============================================================================

do $$
declare
  -- I numeri misurati, e da dove vengono. ⚠️ Non sono ricordati: stanno nei
  -- referti che Andrea ha eseguito il 02 e il 03/09/2026.
  v_cr_colonne_attese constant integer := 8;   -- coupon_redemptions
  v_cr_indici_attesi  constant integer := 3;
  v_co_colonne_attese constant integer := 12;  -- coupons
  v_co_indici_attesi  constant integer := 2;

  v_tab text;
  v_n   integer;
begin

  -- PRE-CHECK 1 — le due tabelle esistono.
  foreach v_tab in array array['coupons', 'coupon_redemptions'] loop
    if to_regclass('public.' || quote_ident(v_tab)) is null then
      raise exception
        'FERMO — la tabella `public.%` non esiste. Questo file collega quelle due e non puo'' proseguire. Non e'' stato scritto nulla.',
        v_tab;
    end if;
  end loop;

  -- PRE-CHECK 2 — ⚠️ `coupons.code` porta davvero un'unicita', LETTA QUI DAL
  -- DATABASE VIVO e non presa dallo schema in radice, che e' del 29/07.
  -- Si cerca un indice unico, NON parziale, su quella sola colonna: e' la
  -- condizione che il database richiede per poter costruire il legame.
  -- ⚠️ Non si cerca per nome: un nome e' come qualcuno l'ha chiamato, la forma
  -- e' cio' che quel vincolo fa.
  if not exists (
    select 1
      from pg_index x
      join pg_attribute a
        on a.attrelid = x.indrelid
       and a.attnum = x.indkey[0]
     where x.indrelid = 'public.coupons'::regclass
       and x.indisunique
       and x.indpred is null
       and x.indnkeyatts = 1
       and a.attname = 'code'
  ) then
    raise exception
      'FERMO — su `coupons` non risulta un''unicita'' piena sulla sola colonna `code`. Senza, questo legame non e'' costruibile: il database lo rifiuterebbe comunque, ma con un errore di sistema invece che con questa frase. Guardare com''e'' fatta quella tabella prima di riprovare. Non e'' stato scritto nulla.';
  end if;

  -- PRE-CHECK 3 — il legame non esiste gia'. Ferma una seconda esecuzione con
  -- una frase invece che con un errore del database.
  select count(*) into v_n
    from pg_constraint k
   where k.conrelid = 'public.coupon_redemptions'::regclass
     and k.contype = 'f'
     and k.confrelid = 'public.coupons'::regclass;
  if v_n <> 0 then
    raise exception
      'FERMO — fra `coupon_redemptions` e `coupons` esiste gia'' % legame. Questa migrazione e'' gia'' stata eseguita, oppure qualcuno ne ha aggiunto uno per altro: guardarlo prima di rifarne un altro. Non e'' stato scritto nulla.',
      v_n;
  end if;

  -- PRE-CHECK 4 — le due tabelle sono ancora VUOTE.
  -- ⚠️ E' la condizione che rende questo lavoro banale. Se non lo fossero, e'
  -- successo qualcosa che nessuno sa, e la domanda da farsi non e' come far
  -- passare il controllo: e' che cosa c'e' dentro e chi ce l'ha messo.
  select count(*) into v_n from public.coupon_redemptions;
  if v_n <> 0 then
    raise exception
      'FERMO — `coupon_redemptions` contiene % righe e doveva essere vuota. Non e'' stato scritto nulla: guardare che cosa c''e'' dentro prima di proseguire.',
      v_n;
  end if;

  select count(*) into v_n from public.coupons;
  if v_n <> 0 then
    raise exception
      'FERMO — `coupons` contiene % righe e doveva essere vuota. I 600 codici non sono ancora stati generati: se ce ne sono, qualcuno li ha messi e va saputo prima. Non e'' stato scritto nulla.',
      v_n;
  end if;

  -- PRE-CHECK 5 — la forma delle due tabelle e' quella misurata.
  select count(*) into v_n
    from pg_attribute
   where attrelid = 'public.coupon_redemptions'::regclass
     and attnum > 0 and not attisdropped;
  if v_n <> v_cr_colonne_attese then
    raise exception
      'FERMO — `coupon_redemptions` ha % colonne invece delle % misurate il 03/09/2026. Non e'' la tabella che questo file si aspetta. Non e'' stato scritto nulla.',
      v_n, v_cr_colonne_attese;
  end if;

  select count(*) into v_n
    from pg_index where indrelid = 'public.coupon_redemptions'::regclass;
  if v_n <> v_cr_indici_attesi then
    raise exception
      'FERMO — `coupon_redemptions` ha % indici invece dei % misurati il 03/09/2026. Non e'' stato scritto nulla.',
      v_n, v_cr_indici_attesi;
  end if;

  select count(*) into v_n
    from pg_attribute
   where attrelid = 'public.coupons'::regclass
     and attnum > 0 and not attisdropped;
  if v_n <> v_co_colonne_attese then
    raise exception
      'FERMO — `coupons` ha % colonne invece delle % misurate. Non e'' stato scritto nulla.',
      v_n, v_co_colonne_attese;
  end if;

  select count(*) into v_n
    from pg_index where indrelid = 'public.coupons'::regclass;
  if v_n <> v_co_indici_attesi then
    raise exception
      'FERMO — `coupons` ha % indici invece dei % misurati. Non e'' stato scritto nulla.',
      v_n, v_co_indici_attesi;
  end if;

  raise notice 'PRE-CHECK superati. Le due tabelle esistono, sono vuote, hanno la forma misurata, `coupons.code` e'' unica e il legame non c''e'' ancora.';

end $$;

-- ============================================================================
-- LE DUE FOTOGRAFIE, PRESE ADESSO PER ESSERE RICONFRONTATE DOPO.
-- Una fotografia rifatta dopo il cambiamento coincide sempre e non dimostra
-- piu' niente (lezione `af`): vanno lette PRIMA.
-- Spariscono da sole alla fine della transazione.
-- ============================================================================

-- La forma e le regole per riga delle TRE tabelle dei codici.
create temporary table _stato_prima on commit drop as
select t.tabella,
       (select count(*) from pg_attribute a
         where a.attrelid = ('public.' || quote_ident(t.tabella))::regclass
           and a.attnum > 0 and not a.attisdropped)                        as colonne,
       (select count(*) from pg_constraint k
         where k.conrelid = ('public.' || quote_ident(t.tabella))::regclass) as vincoli,
       (select count(*) from pg_index i
         where i.indrelid = ('public.' || quote_ident(t.tabella))::regclass) as indici,
       (select count(*) from pg_policy p
         where p.polrelid = ('public.' || quote_ident(t.tabella))::regclass) as policy_n,
       (select c.relrowsecurity from pg_class c
         where c.oid = ('public.' || quote_ident(t.tabella))::regclass)      as rls
  from (values ('coupons'), ('promo_redemptions'), ('coupon_redemptions')) as t(tabella);

-- I permessi dei QUATTRO ruoli sulle TRE tabelle, uno per uno.
-- ⚠️ Ci sono anche `postgres` e `service_role`: un controllo che guarda solo i
-- ruoli pubblici non si accorgerebbe di un permesso tolto al server.
-- ⚠️ `MAINTAIN` non e' nell'elenco, ed e' voluto: esiste solo dalle versioni
-- recenti di PostgreSQL, e un controllo che lo nominasse andrebbe in errore
-- altrove. Nessun comando di questo file tocca i permessi, quindi la garanzia
-- vera sta nella forma di cio' che si esegue, non in questo elenco.
create temporary table _permessi_prima on commit drop as
select r.ruolo,
       t.tabella,
       p.nome,
       has_table_privilege(r.ruolo, 'public.' || quote_ident(t.tabella), p.nome) as ha
  from (values ('anon'), ('authenticated'), ('postgres'), ('service_role')) as r(ruolo)
 cross join (values ('coupons'), ('promo_redemptions'), ('coupon_redemptions')) as t(tabella)
 cross join (values ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE'),
                    ('TRUNCATE'), ('REFERENCES'), ('TRIGGER')) as p(nome);

-- ============================================================================
-- PARTE 2 — L'UNICA COSA CHE QUESTO FILE AGGIUNGE
-- ============================================================================
--
-- `restrict` da una parte e dall'altra: alla cancellazione di un codice e al
-- cambio del suo testo, il database RIFIUTA. La ragione per esteso sta in cima.
-- ============================================================================
alter table public.coupon_redemptions
  add constraint coupon_redemptions_code_fkey
  foreign key (code) references public.coupons(code)
  on delete restrict
  on update restrict;

-- ============================================================================
-- PARTE 3 — I CONTROLLI DOPO
-- ============================================================================

do $$
declare
  v_conkey  smallint[];
  v_confkey smallint[];
  v_del     "char";
  v_upd     "char";
  v_nome    text;
  v_n       integer;
begin

  -- POST-CHECK 1 — il legame esiste, ed e' UNO SOLO.
  -- ⚠️ Si cerca per FORMA — da quale tabella a quale tabella — e non per nome:
  -- il nome e' come qualcuno l'ha chiamato, la forma e' cio' che fa.
  select count(*) into v_n
    from pg_constraint k
   where k.conrelid = 'public.coupon_redemptions'::regclass
     and k.contype = 'f'
     and k.confrelid = 'public.coupons'::regclass;
  if v_n <> 1 then
    raise exception
      'POST-CHECK 1 fallito: fra le due tabelle risultano % legami invece di uno. Transazione annullata, nulla e'' stato scritto.', v_n;
  end if;

  select k.conkey, k.confkey, k.confdeltype, k.confupdtype
    into v_conkey, v_confkey, v_del, v_upd
    from pg_constraint k
   where k.conrelid = 'public.coupon_redemptions'::regclass
     and k.contype = 'f'
     and k.confrelid = 'public.coupons'::regclass;

  -- POST-CHECK 2 — collega UNA colonna a UNA colonna, e sono le due `code`.
  if array_length(v_conkey, 1) <> 1 or array_length(v_confkey, 1) <> 1 then
    raise exception
      'POST-CHECK 2 fallito: il legame non collega una sola colonna a una sola colonna. Transazione annullata, nulla e'' stato scritto.';
  end if;

  select a.attname into v_nome from pg_attribute a
   where a.attrelid = 'public.coupon_redemptions'::regclass and a.attnum = v_conkey[1];
  if v_nome is distinct from 'code' then
    raise exception
      'POST-CHECK 2 fallito: dalla parte dei riscatti il legame parte da `%` invece che da `code`. Transazione annullata, nulla e'' stato scritto.', v_nome;
  end if;

  select a.attname into v_nome from pg_attribute a
   where a.attrelid = 'public.coupons'::regclass and a.attnum = v_confkey[1];
  if v_nome is distinct from 'code' then
    raise exception
      'POST-CHECK 2 fallito: dalla parte dei codici il legame arriva a `%` invece che a `code`. Transazione annullata, nulla e'' stato scritto.', v_nome;
  end if;

  -- POST-CHECK 3 — ⚠️ IL CONTROLLO CHE VALE PIU' DI TUTTI: alla cancellazione
  -- il database RIFIUTA. Si legge la lettera che il catalogo tiene, non il
  -- testo del comando che l'ha creata: `r` vuole dire rifiuta, `c` si porta via
  -- la riga, `n` la azzera. Se qui comparisse `c` o `n`, la memoria di chi ha
  -- usato un codice sparirebbe insieme al codice, ed e' esattamente la cosa che
  -- questa migrazione esiste per impedire.
  if v_del <> 'r' then
    raise exception
      'POST-CHECK 3 fallito: alla cancellazione di un codice il legame vale `%` invece di `r`. Doveva RIFIUTARE. Transazione annullata, nulla e'' stato scritto.', v_del;
  end if;
  if v_upd <> 'r' then
    raise exception
      'POST-CHECK 3 fallito: al cambio del testo di un codice il legame vale `%` invece di `r`. Doveva RIFIUTARE. Transazione annullata, nulla e'' stato scritto.', v_upd;
  end if;

  -- POST-CHECK 4 — le colonne e gli indici NON sono cambiati, su nessuna delle
  -- tre; i vincoli sono cresciuti di UNO sui riscatti e di ZERO sulle altre
  -- due. ⚠️ Il confronto e' con la fotografia presa prima, non con un numero
  -- scritto a mano: "uno in piu'" e' una relazione, e regge anche se domani i
  -- vincoli di partenza fossero altri.
  if exists (
    select 1 from _stato_prima s
     where s.colonne <> (select count(*) from pg_attribute a
                          where a.attrelid = ('public.' || quote_ident(s.tabella))::regclass
                            and a.attnum > 0 and not a.attisdropped)
        or s.indici  <> (select count(*) from pg_index i
                          where i.indrelid = ('public.' || quote_ident(s.tabella))::regclass)
  ) then
    raise exception
      'POST-CHECK 4 fallito: le colonne o gli indici di una delle tre tabelle sono cambiati. Questo file doveva aggiungere un legame e nient''altro. Transazione annullata, nulla e'' stato scritto.';
  end if;

  if exists (
    select 1 from _stato_prima s
     where (select count(*) from pg_constraint k
             where k.conrelid = ('public.' || quote_ident(s.tabella))::regclass)
           <> s.vincoli + (case when s.tabella = 'coupon_redemptions' then 1 else 0 end)
  ) then
    raise exception
      'POST-CHECK 4 fallito: i vincoli non sono cresciuti esattamente di uno sui riscatti e di zero sulle altre due. Transazione annullata, nulla e'' stato scritto.';
  end if;

  -- POST-CHECK 5 — le regole per riga sono quelle di prima: accese dove erano
  -- accese, e con lo stesso numero di policy. Un legame non le tocca, e questo
  -- controllo e' cio' che lo dimostra invece di darlo per scontato.
  if exists (
    select 1 from _stato_prima s
     where s.rls is distinct from (select c.relrowsecurity from pg_class c
                                    where c.oid = ('public.' || quote_ident(s.tabella))::regclass)
        or s.policy_n <> (select count(*) from pg_policy p
                           where p.polrelid = ('public.' || quote_ident(s.tabella))::regclass)
  ) then
    raise exception
      'POST-CHECK 5 fallito: le regole per riga o il numero di policy di una delle tre tabelle sono cambiati. Transazione annullata, nulla e'' stato scritto.';
  end if;

  -- POST-CHECK 6 — NESSUN permesso e' cambiato, per nessuno dei quattro ruoli
  -- su nessuna delle tre tabelle.
  if exists (
    select 1 from _permessi_prima p
     where p.ha <> has_table_privilege(p.ruolo, 'public.' || quote_ident(p.tabella), p.nome)
  ) then
    raise exception
      'POST-CHECK 6 fallito: un permesso di un ruolo su una delle tre tabelle e'' cambiato. Questo file non doveva toccarne nessuno. Transazione annullata, nulla e'' stato scritto.';
  end if;

  -- POST-CHECK 7 — le due tabelle sono ancora vuote: questo file non scrive
  -- righe, e questo e' il controllo che lo dimostra.
  select count(*) into v_n from public.coupon_redemptions;
  if v_n <> 0 then
    raise exception
      'POST-CHECK 7 fallito: `coupon_redemptions` contiene % righe. Questo file non doveva scriverne nessuna. Transazione annullata, nulla e'' stato scritto.', v_n;
  end if;
  select count(*) into v_n from public.coupons;
  if v_n <> 0 then
    raise exception
      'POST-CHECK 7 fallito: `coupons` contiene % righe. Questo file non doveva scriverne nessuna. Transazione annullata, nulla e'' stato scritto.', v_n;
  end if;

  raise notice 'POST-CHECK superati. Il legame esiste, collega `code` a `code`, RIFIUTA sia alla cancellazione sia al cambio del testo, e nient''altro e'' cambiato: colonne, indici, regole per riga e permessi sono quelli di prima su tutte e tre le tabelle.';

end $$;

commit;

-- ============================================================================
-- REFERTO DI SOLA LETTURA — rilegge com'e' venuto il legame.
-- ⚠️ DEVE AVERE ESATTAMENTE 8 RIGHE:
--    1 di testa
--  + 1 (il legame, con la definizione per intero come la scrive il database)
--  + 1 (che cosa fa alla cancellazione e al cambio del testo, letto dal catalogo)
--  + 1 (la forma di coupon_redemptions)
--  + 1 (la forma di coupons)
--  + 1 (tutti i vincoli dei riscatti, per intero)
--  + 1 (le due tabelle sono ancora vuote)
--  + 1 (verdetto)
--    Il numero e' anche contato dal database nella riga di testa: se i due non
--    coincidono, o se ne arrivano meno, e' troncato e il fondo NON e' letto.
--
-- ⚠️ LE RIGHE 10 E 11 DICONO LA STESSA COSA CON DUE STRUMENTI DIVERSI, ED E'
--    VOLUTO. La 10 e' il TESTO che il database scrive quando gli si chiede di
--    raccontare il vincolo; la 11 sono le LETTERE che tiene nel catalogo,
--    tradotte in parole. Se le due righe si contraddicessero, una delle due
--    letture e' sbagliata e il verdetto non vale.
-- ============================================================================
with legame as (
  select k.oid, k.conname, pg_get_constraintdef(k.oid) as definizione,
         k.confdeltype, k.confupdtype
    from pg_constraint k
   where k.conrelid = 'public.coupon_redemptions'::regclass
     and k.contype = 'f'
     and k.confrelid = 'public.coupons'::regclass
),
referto as (

select 10 as ord,
       'il legame — come lo scrive il database'::text as sezione,
       'coupon_redemptions verso coupons'::text as misura,
       coalesce((select l.conname || ' = ' || l.definizione from legame l),
                'ATTENZIONE - nessun legame trovato')::text as esito

union all

select 11,
       'il legame — che cosa fa, letto dal catalogo',
       'alla cancellazione di un codice, e al cambio del suo testo',
       coalesce((select
           'alla cancellazione: '
           || case l.confdeltype
                when 'r' then 'RIFIUTA (restrict)'
                when 'a' then 'RIFIUTA (nessuna azione)'
                when 'c' then 'ATTENZIONE - si porta via il riscatto (cascade)'
                when 'n' then 'ATTENZIONE - azzera il riferimento (set null)'
                when 'd' then 'ATTENZIONE - rimette il predefinito (set default)'
                else 'ATTENZIONE - valore sconosciuto: ' || l.confdeltype::text
              end
           || ' | al cambio del testo: '
           || case l.confupdtype
                when 'r' then 'RIFIUTA (restrict)'
                when 'a' then 'RIFIUTA (nessuna azione)'
                when 'c' then 'ATTENZIONE - riscrive il riscatto (cascade)'
                when 'n' then 'ATTENZIONE - azzera il riferimento (set null)'
                when 'd' then 'ATTENZIONE - rimette il predefinito (set default)'
                else 'ATTENZIONE - valore sconosciuto: ' || l.confupdtype::text
              end
         from legame l),
         'ATTENZIONE - nessun legame trovato')

union all

select 20,
       'coupon_redemptions — doveva cambiare solo nei vincoli',
       'colonne, vincoli, indici',
       (select count(*)::text from pg_attribute
         where attrelid = 'public.coupon_redemptions'::regclass
           and attnum > 0 and not attisdropped) || ' colonne (attese 8) | '
       || (select count(*)::text from pg_constraint
            where conrelid = 'public.coupon_redemptions'::regclass) || ' vincoli (uno in piu di prima) | '
       || (select count(*)::text from pg_index
            where indrelid = 'public.coupon_redemptions'::regclass) || ' indici (attesi 3)'

union all

select 21,
       'coupons — non doveva cambiare per niente',
       'colonne, vincoli, indici',
       (select count(*)::text from pg_attribute
         where attrelid = 'public.coupons'::regclass
           and attnum > 0 and not attisdropped) || ' colonne (attese 12) | '
       || (select count(*)::text from pg_constraint
            where conrelid = 'public.coupons'::regclass) || ' vincoli | '
       || (select count(*)::text from pg_index
            where indrelid = 'public.coupons'::regclass) || ' indici (attesi 2)'

union all

select 22,
       'coupon_redemptions — tutti i vincoli per intero',
       'cosi si vede il legame nuovo accanto a quelli di prima',
       coalesce((select string_agg(conname || ' = ' || pg_get_constraintdef(oid), '  ///  ' order by conname)
                   from pg_constraint
                  where conrelid = 'public.coupon_redemptions'::regclass),
                'ATTENZIONE - nessuno')

union all

select 30,
       'le due tabelle sono ancora vuote',
       'righe in coupon_redemptions e in coupons',
       (select count(*)::text from public.coupon_redemptions) || ' e '
       || (select count(*)::text from public.coupons)
       || ' (devono essere zero e zero)'

union all

select 40,
       'VERDETTO',
       'il legame che rifiuta la cancellazione di un codice usato',
       case when exists (select 1 from legame l
                          where l.confdeltype = 'r' and l.confupdtype = 'r')
            then 'C E, E RIFIUTA IN TUTTI E DUE I VERSI'
            else 'ATTENZIONE - non e come deciso: guardare le righe 10 e 11'
       end

)

select 0 as ord,
       'testa'::text as sezione,
       ('referto eseguito il ' || to_char(now(), 'YYYY-MM-DD HH24:MI:SS.USOF'))::text as misura,
       ('righe che questo referto deve avere, questa compresa: '
         || (select count(*) + 1 from referto)::text
         || ' | in cima al referto ne sono dichiarate 8 a mano: i due numeri devono coincidere')::text as esito

union all

select ord, sezione, misura, esito from referto

 order by ord, misura;
