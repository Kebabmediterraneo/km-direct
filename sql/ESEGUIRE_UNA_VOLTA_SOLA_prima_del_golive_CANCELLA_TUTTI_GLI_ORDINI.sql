-- ############################################################################
-- #                                                                          #
-- #   ATTENZIONE — LEGGERE QUESTE RIGHE PRIMA DI TUTTO IL RESTO              #
-- #                                                                          #
-- #   QUESTO SCRIPT CANCELLA **TUTTI** GLI ORDINI E **TUTTI** I CLIENTI.     #
-- #   Tutti. Non una parte, non "quelli vecchi", non "quelli fino a una      #
-- #   certa data": TUTTI QUELLI CHE TROVA, qualunque sia la loro data.       #
-- #                                                                          #
-- #   LA DATA CHE SI SCRIVE PIU' SOTTO NON E' UN FILTRO.                     #
-- #   Non seleziona che cosa cancellare. E' soltanto un FRENO che decide     #
-- #   SE lo script parte oppure no. Se parte, cancella tutto.                #
-- #                                                                          #
-- ############################################################################
--
-- ============================================================================
-- AZZERAMENTO DEI DATI DI PROVA — una sola volta, PRIMA del go-live
-- (§66 e §69, MASTER_SPEC v54).
-- ============================================================================
--
-- COSA FA (anche per chi non conosce SQL):
--   Svuota completamente le tabelle degli ordini e dei clienti, insieme ai
--   riscatti di codici promo, agli eventi statistici e alle righe di registro
--   scritte dagli identificatori di prova. Al termine il database contiene il
--   menu vero e nient'altro, pronto per i primi clienti veri.
--
-- QUANDO SI ESEGUE:
--   UNA SOLA VOLTA, il giorno del go-live, prima di aprire al pubblico.
--   Prima e dopo va eseguito `conteggi_dati_sola_lettura.sql` e i due referti
--   vanno confrontati.
--
-- ⚠️ DOPO L'ESECUZIONE, QUESTO FILE VA CANCELLATO DAL DEPOSITO.
--   Decisione di Andrea del 04/08/2026. Non e' un consiglio: e' l'ultimo passo
--   della procedura. Finche' questo file resta in `sql/`, resta anche la
--   possibilita' che qualcuno lo esegua per sbaglio su un database pieno di
--   ordini veri — ed e' proprio questo il pericolo che §69 descrive: "il
--   pericolo dello script del go-live non e' il giorno in cui si esegue, e'
--   che resti nel repository dopo". Eseguito una volta ha finito il suo lavoro
--   per sempre: si cancella, e la sua storia resta nei commit.
--
-- COSA NON TOCCA MAI — le 16 tabelle di menu e configurazione (§66, "non sono
--   residui e non si toccano"):
--     stores, store_order_windows, store_geofences, store_schedule_exceptions,
--     products, allergens, product_allergens, product_choice_options,
--     product_removals, product_addons, product_accompaniments, combo_pricing,
--     combo_side_options, combo_drink_options, coupons, staff_settings.
--   Sono le stesse 16 verificate una per una dal POST-CHECK 4: l'elenco qui
--   sopra e quello dei controlli coincidono. Insieme alle 7 tabelle che questo
--   script svuota coprono tutte e 23 le tabelle dello schema: non resta fuori
--   nulla.
--
--   Non tocca inoltre le righe di `staff_action_log` scritte dall'identificatore
--   staff REALE: sono le azioni vere sul menu vero, cioe' l'audit trail imposto
--   da §66, e sono l'UNICA eccezione all'azzeramento. Se una di quelle righe
--   cita un ordine che sta per sparire, la riga NON viene cancellata: perde
--   soltanto il riferimento all'ordine e resta (vedi SCELTA 2 in fondo).
--
-- QUALE DECISIONE LO GIUSTIFICA:
--   §69 v54, "Strumento: DUE script separati, non uno": la pulizia del go-live
--   cancella tutto una volta sola e non deve mai piu' essere eseguita, quella
--   mensile cancella una parte in base all'eta' e gira per anni. Un file unico
--   avrebbe per forza un interruttore, e un interruttore su uno strumento che
--   cancella e' il modo in cui si esegue la cosa sbagliata.
--
-- SICUREZZA:
--   Tutto e' avvolto in una transazione (begin ... commit): se anche un solo
--   controllo non torna, viene sollevato un errore e NULLA viene scritto.
--   Non esiste lo stato "a meta'".
--
-- COME SI ESEGUE:
--   1) si esegue `conteggi_dati_sola_lettura.sql` e si conserva il referto;
--   2) si compilano i DUE parametri qui sotto, leggendoli da quel referto;
--   3) si incolla tutto nel SQL editor di Supabase e si preme Run;
--   4) si riesegue `conteggi_dati_sola_lettura.sql` e si confrontano i referti;
--   5) SI CANCELLA QUESTO FILE dal deposito.
-- ============================================================================

begin;

do $$
declare
  -- ==========================================================================
  -- PARAMETRI DA COMPILARE A MANO A OGNI ESECUZIONE
  -- ==========================================================================

  -- (1) IL FRENO. Non e' un filtro: non decide che cosa viene cancellato, ma
  --     soltanto se lo script parte. Se parte, cancella tutto.
  --
  --     CHE COSA SCRIVERE QUI: la data e ora dell'ULTIMA PROVA DI SVILUPPO,
  --     cioe' dell'ordine di prova piu' recente presente in database. Si LEGGE
  --     dal referto di `conteggi_dati_sola_lettura.sql`; non si indovina.
  --
  --     ⚠️ NON scrivere qui l'istante in cui si sta eseguendo lo script.
  --     Sarebbe il modo piu' rapido di spegnere il freno senza accorgersene:
  --     nessun ordine puo' essere piu' recente di "adesso", quindi il controllo
  --     non troverebbe mai nulla, darebbe sempre il via libera e cancellerebbe
  --     tutto anche il giorno in cui il database fosse pieno di ordini veri.
  --     Il freno funziona solo se la data e' quella dell'ultima prova NOTA:
  --     e' cosi' che un ordine arrivato dopo — cioe' un ordine che non
  --     conoscevamo, quindi forse un ordine VERO — fa scattare l'arresto.
  --
  --     ⚠️ SE IL FRENO SCATTA, NON SI AGGIORNA LA DATA PER FARLO PASSARE.
  --     Un arresto significa che in database c'e' qualcosa che non ci
  --     aspettavamo. Spostare la data in avanti non risolve il problema: lo
  --     nasconde, e manda a cancellare proprio le righe che il freno aveva
  --     intercettato. Ci si ferma e si guarda che ordini sono (metodo `k`).
  v_freno_ultima_prova constant timestamptz := '2026-08-04 00:00:00+02';

  -- (2) GLI IDENTIFICATORI DI PROVA di `staff_action_log`.
  --     ⚠️ §66 dice che restano "le righe scritte dall'identificatore staff
  --     reale" e che si rimuovono "solo quelle degli identificatori di test",
  --     ma NON fissa in alcun punto come si riconosce un identificatore di
  --     prova: la colonna `staff_identifier` e' testo libero e non esiste
  --     alcun contrassegno. Il criterio va quindi fornito qui, a mano, e va
  --     ricavato LEGGENDO la sezione "log staff — per identificatore" del
  --     referto dei conteggi, non ricordandolo. Elencare solo gli
  --     identificatori di prova: tutto cio' che non e' elencato resta.
  v_identificatori_di_prova constant text[] := array[
    'staff:sostituire-con-i-valori-letti-dal-referto-dei-conteggi'
  ];

  -- ==========================================================================
  -- Le 16 tabelle che questo script non deve toccare (§66). L'elenco e' lo
  -- stesso scritto in testa al file, ed e' quello verificato dal POST-CHECK 4.
  -- ==========================================================================
  v_intoccabili constant text[] := array[
    'stores', 'store_order_windows', 'store_geofences', 'store_schedule_exceptions',
    'products', 'allergens', 'product_allergens', 'product_choice_options',
    'product_removals', 'product_addons', 'product_accompaniments',
    'combo_pricing', 'combo_side_options', 'combo_drink_options',
    'coupons', 'staff_settings'
  ];

  -- ==========================================================================
  -- Variabili di lavoro: tutti i numeri sono LETTI dal database, mai scritti
  -- qui dentro (§69, lezioni `s` e `z`).
  -- ==========================================================================
  v_ordini_dopo_freno     bigint;
  v_da_cancellare         bigint;
  v_log_di_prova_prima    bigint;
  v_log_da_tenere_prima   bigint;
  v_log_da_tenere_dopo    bigint;
  v_residuo               bigint;
  v_conteggi_prima        bigint[] := array[]::bigint[];
  v_n                     bigint;
  v_i                     integer;
  v_tabella               text;
begin

  -- ==========================================================================
  -- PRE-CHECK BLOCCANTI
  -- ==========================================================================

  -- PRE-CHECK 1 — IL FRENO. E' il controllo per cui questo file esiste.
  select count(*) into v_ordini_dopo_freno
  from orders where created_at > v_freno_ultima_prova;

  if v_ordini_dopo_freno <> 0 then
    raise exception
      'FERMO — IL FRENO HA BLOCCATO LA CANCELLAZIONE. Esistono % ordini creati dopo il %, che e'' la data dell''ultima prova di sviluppo indicata in cima allo script. Questo file cancella TUTTI gli ordini e TUTTI i clienti, senza guardare alcuna data: e'' scritto per essere eseguito UNA SOLA VOLTA prima dell''apertura, quando in database ci sono solo dati di prova. Un ordine piu'' recente della data indicata e'' un ordine che non conoscevamo, e potrebbe essere di un cliente VERO. NON spostare la data in avanti per far passare il controllo: manderebbe a cancellare proprio le righe che il freno ha appena intercettato. Fermarsi e guardare che ordini sono. Non e'' stato cancellato nulla.',
      v_ordini_dopo_freno, v_freno_ultima_prova;
  end if;

  -- PRE-CHECK 2 — c'e' davvero qualcosa da cancellare?
  select (select count(*) from orders)
       + (select count(*) from customers)
       + (select count(*) from promo_redemptions)
       + (select count(*) from analytics_events)
    into v_da_cancellare;

  if v_da_cancellare = 0 then
    raise exception
      'FERMO — NON C''E'' NULLA DA CANCELLARE. Ordini, clienti, riscatti promo ed eventi statistici sono gia'' tutti a zero. Le due spiegazioni possibili sono: questo script e'' GIA'' STATO ESEGUITO (e allora non andava conservato, andava cancellato dal deposito), oppure e'' stato lanciato sul DATABASE SBAGLIATO. In entrambi i casi ci si ferma e si verifica prima di riprovare. Non e'' stato cancellato nulla.';
  end if;

  -- PRE-CHECK 3 — il criterio degli identificatori di prova non e' vuoto.
  -- Una lista vuota corrisponderebbe a "nessuna riga", ma il pericolo vero e'
  -- il suo gemello: un filtro costruito male che corrisponde a TUTTO
  -- (lezione `aq`).
  if v_identificatori_di_prova is null or array_length(v_identificatori_di_prova, 1) is null then
    raise exception
      'FERMO — L''ELENCO DEGLI IDENTIFICATORI DI PROVA E'' VUOTO. Va compilato a mano nel parametro (2) in cima allo script, leggendo la sezione "log staff — per identificatore" del referto dei conteggi. Non e'' stato cancellato nulla.';
  end if;

  select count(*) into v_log_di_prova_prima
  from staff_action_log where staff_identifier = any(v_identificatori_di_prova);

  select count(*) into v_log_da_tenere_prima
  from staff_action_log where staff_identifier <> all(v_identificatori_di_prova);

  -- PRE-CHECK 4 — l'elenco corrisponde a qualcosa di reale.
  if v_log_di_prova_prima = 0 then
    raise exception
      'FERMO — NESSUNA RIGA DI REGISTRO CORRISPONDE AGLI IDENTIFICATORI INDICATI. L''elenco del parametro (2) non combacia con alcun valore realmente presente in `staff_action_log`: quasi certamente e'' stato copiato da un documento invece che letto dal referto. Un filtro che non trova nulla non e'' una risposta. Non e'' stato cancellato nulla.';
  end if;

  raise notice 'PRE-CHECK superati. Righe di registro classificate come di prova: %, da conservare: %.',
    v_log_di_prova_prima, v_log_da_tenere_prima;

  -- Fotografia delle 16 tabelle intoccabili, letta adesso per confrontarla
  -- dopo (§69: "i post-check verificano anche cio' che non doveva cambiare").
  foreach v_tabella in array v_intoccabili loop
    execute format('select count(*) from %I', v_tabella) into v_n;
    v_conteggi_prima := array_append(v_conteggi_prima, v_n);
  end loop;

  -- ==========================================================================
  -- CANCELLAZIONI — l'ordine e' imposto dai collegamenti verificati il
  -- 04/08/2026 (§66, referto) e NON e' modificabile a piacere (§69).
  --   1. cio' che punta agli ordini SENZA cancellazione a catena;
  --   2. gli ordini, che si portano dietro da soli `order_items` e
  --      `order_status_history` (entrambi `on delete cascade`);
  --   3. le righe cliente, rimaste senza ordini.
  -- ==========================================================================

  -- 1a. Eventi statistici: al go-live sono tutti di prova e vanno via interi.
  delete from analytics_events;

  -- 1b. Riscatti promo: il riferimento all'ordine e' obbligatorio (`not null`),
  --     quindi non si puo' staccare e la riga si cancella (§69).
  delete from promo_redemptions;

  -- 1c. Registro staff, righe DI PROVA: si cancellano.
  delete from staff_action_log
  where staff_identifier = any(v_identificatori_di_prova);

  -- 1d. Registro staff, righe DA CONSERVARE che citano un ordine: si STACCA il
  --     riferimento e la riga resta (§66: l'audit trail e' l'unica eccezione
  --     all'azzeramento). La colonna e' facoltativa, quindi e' possibile.
  update staff_action_log
     set order_id = null
   where order_id is not null
     and staff_identifier <> all(v_identificatori_di_prova);

  -- 2. Gli ordini. `order_items` e `order_status_history` spariscono da soli.
  delete from orders;

  -- 3. Le righe cliente, ora tutte senza ordini.
  delete from customers;

  -- ==========================================================================
  -- POST-CHECK BLOCCANTI
  -- ==========================================================================

  -- POST-CHECK 1 — cio' che doveva sparire e' sparito.
  select (select count(*) from orders)
       + (select count(*) from order_items)
       + (select count(*) from order_status_history)
       + (select count(*) from customers)
       + (select count(*) from promo_redemptions)
       + (select count(*) from analytics_events)
    into v_residuo;

  if v_residuo <> 0 then
    raise exception
      'POST-CHECK fallito: dopo la cancellazione restano ancora % righe fra ordini, righe d''ordine, storico stati, clienti, riscatti promo ed eventi statistici. Transazione annullata, nulla e'' stato scritto.',
      v_residuo;
  end if;

  -- POST-CHECK 2 — le righe di registro da conservare sono TUTTE ancora li'.
  -- E' il controllo che si accorge di cio' che e' sparito IN PIU'.
  select count(*) into v_log_da_tenere_dopo
  from staff_action_log where staff_identifier <> all(v_identificatori_di_prova);

  if v_log_da_tenere_dopo <> v_log_da_tenere_prima then
    raise exception
      'POST-CHECK fallito: le righe di registro da conservare erano % e ora sono %. L''audit trail delle azioni vere sul menu e'' l''unica eccezione all''azzeramento (§66) e non deve calare di una sola riga. Transazione annullata.',
      v_log_da_tenere_prima, v_log_da_tenere_dopo;
  end if;

  -- POST-CHECK 3 — le righe di prova del registro sono sparite.
  select count(*) into v_residuo
  from staff_action_log where staff_identifier = any(v_identificatori_di_prova);

  if v_residuo <> 0 then
    raise exception
      'POST-CHECK fallito: restano % righe di registro con un identificatore di prova. Transazione annullata.',
      v_residuo;
  end if;

  -- POST-CHECK 4 — LE 16 TABELLE DI MENU E CONFIGURAZIONE SONO INTATTE.
  -- Sono esattamente quelle elencate in testa al file: le due liste coincidono.
  for v_i in 1 .. array_length(v_intoccabili, 1) loop
    execute format('select count(*) from %I', v_intoccabili[v_i]) into v_n;
    if v_n <> v_conteggi_prima[v_i] then
      raise exception
        'POST-CHECK fallito: la tabella `%` aveva % righe e ora ne ha %. Questo script non deve toccare il menu ne'' la configurazione (§66). Transazione annullata, nulla e'' stato scritto.',
        v_intoccabili[v_i], v_conteggi_prima[v_i], v_n;
    end if;
  end loop;

  raise notice 'POST-CHECK superati. Ordini, righe d''ordine, storico stati, clienti, riscatti promo ed eventi statistici azzerati; % righe di registro di prova rimosse; % righe di registro conservate; tutte e % le tabelle di menu e configurazione invariate.',
    v_log_di_prova_prima, v_log_da_tenere_dopo, array_length(v_intoccabili, 1);

  raise notice 'ULTIMO PASSO, DA FARE A MANO: cancellare questo file dal deposito (§69, decisione del 04/08/2026).';

end $$;

commit;

-- ============================================================================
-- SCELTE FATTE QUI DENTRO CHE LA SPEC NON FISSA — dichiarate, non nascoste.
--
-- SCELTA 1 — Gli eventi statistici al go-live si cancellano interi.
--   §69 stabilisce di "staccare invece di cancellare" per `analytics_events`,
--   ma lo dice esplicitamente "nella pulizia mensile"; per il go-live nomina
--   la regola opposta solo a proposito del registro. Poiche' §66 prescrive che
--   al go-live "si azzera tutto cio' che e' di prova" e quelle righe sarebbero
--   statistiche di prova, qui si cancellano. Se la si vuole diversa, e' una
--   decisione da mettere prima in spec.
--
-- SCELTA 2 — Le righe di registro DA CONSERVARE che citano un ordine vengono
--   staccate, non cancellate.
--   `staff_action_log.order_id` non ha cancellazione a catena (§66): finche'
--   una riga cita un ordine, quell'ordine non si puo' cancellare. Se una riga
--   da conservare citasse un ordine, lo script si troverebbe fra due regole di
--   §66 che si contraddicono — cancellare la riga (vietato: e' audit trail) o
--   non cancellare l'ordine (vietato: si azzera tutto). Staccando il
--   riferimento si rispettano entrambe. Al 04/08/2026 il referto di §66 dice
--   che nessuna riga di registro punta a un ordine, quindi oggi questa `update`
--   non tocca nulla: c'e' perche' lo script non deve dipendere da un conteggio
--   fotografato in un documento.
--
-- SCELTA 3 — Il criterio per riconoscere un identificatore di prova e' un
--   parametro compilato a mano, non una regola scritta nel file.
--   §66 impone la distinzione ma non dice come si fa, e la colonna e' testo
--   libero. Incorporare qui un elenco preso da un documento avrebbe messo nel
--   file un dato che invecchia, esattamente cio' che §69 vieta. Il parametro
--   si compila leggendo il referto dei conteggi.
-- ============================================================================
