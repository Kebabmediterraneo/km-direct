-- ============================================================================
-- PULIZIA MENSILE — ordini mai pagati e righe cliente senza ordini
-- (§69, MASTER_SPEC v54).
-- ============================================================================
--
-- COSA FA (anche per chi non conosce SQL):
--   Rimuove gli ordini che non sono mai stati pagati e sono piu' vecchi di 30
--   giorni, e le righe cliente che restano senza alcun ordine collegato ed
--   erano state create piu' di 30 giorni fa. Serve a mantenere la promessa
--   scritta nell'informativa privacy: i dati di chi non ha mai concluso un
--   ordine non restano in casa nostra oltre un mese.
--
-- QUANDO SI ESEGUE:
--   Una volta al mese, in un giorno fisso da stabilire (§69: "Fissare il giorno
--   del mese"). E' una procedura MANUALE, non automatica.
--   Si puo' eseguire anche a sito aperto: agisce solo su cio' che e' vecchio e
--   mai pagato, quindi non esiste una riga in lavorazione che possa toccare.
--   Prima e dopo va eseguito `conteggi_dati_sola_lettura.sql` e i due referti
--   vanno confrontati.
--
-- COSA NON TOCCA MAI:
--   - gli ordini PAGATI, RIMBORSATI o PARZIALMENTE RIMBORSATI: sono conservati
--     per gli obblighi amministrativi, contabili e fiscali (§69). Nessuna delle
--     istruzioni qui sotto li puo' raggiungere;
--   - gli ordini mai pagati piu' RECENTI di 30 giorni: servono ancora, sia al
--     cliente che potrebbe tornare a pagare, sia alla pagina dei carrelli
--     abbandonati (§65);
--   - le righe cliente che hanno ANCORA un ordine collegato, di qualunque tipo
--     (§69: "Non cancellare mai una riga cliente che abbia almeno un ordine
--     collegato"). Il database lo impone gia' da solo: `orders.customer_id` e'
--     obbligatoria e non ha cancellazione a catena (§66);
--   - le righe di `staff_action_log` e di `analytics_events`: NON vengono mai
--     cancellate da questo script. Se citano un ordine che sta per sparire,
--     perdono soltanto il riferimento e restano (§69, "staccare invece di
--     cancellare"). Il POST-CHECK 3 verifica che il loro totale non cali;
--   - le 16 tabelle di menu e configurazione (§66, "non sono residui e non si
--     toccano"):
--       stores, store_order_windows, store_geofences, store_schedule_exceptions,
--       products, allergens, product_allergens, product_choice_options,
--       product_removals, product_addons, product_accompaniments, combo_pricing,
--       combo_side_options, combo_drink_options, coupons, staff_settings.
--     Sono le stesse 16 verificate una per una dal POST-CHECK 5: l'elenco qui
--     sopra e quello dei controlli coincidono.
--
-- QUALE DECISIONE LA GIUSTIFICA:
--   §69 v54: "Ordini mai pagati e righe cliente senza ordine pagato: massimo
--   30 giorni. La rimozione e' una procedura manuale a cadenza almeno mensile,
--   non un processo automatico." E la decisione di Andrea del 04/08/2026 che
--   fissa quali ordini sono "mai pagati": `pending` E `failed`.
--
-- UNA CONSEGUENZA VOLUTA, DA CONOSCERE (§69):
--   Chi aveva applicato un codice promo a un ordine mai pagato potra' riusarlo
--   dopo trenta giorni, perche' in `promo_redemptions` il riferimento
--   all'ordine e' obbligatorio e la riga si cancella insieme all'ordine. Non e'
--   una falla di §14: chi ha davvero goduto dello sconto ha un ordine pagato,
--   quell'ordine non viene mai cancellato, quindi il suo riscatto resta e il
--   codice resta bruciato. Si libera solo per chi dello sconto non ha mai
--   goduto.
--
-- SICUREZZA:
--   Tutto e' avvolto in una transazione (begin ... commit): se anche un solo
--   controllo non torna, viene sollevato un errore e NULLA viene scritto.
--   Non esiste lo stato "a meta'".
--
-- COME SI ESEGUE:
--   1) si esegue `conteggi_dati_sola_lettura.sql` e si conserva il referto;
--   2) si incolla tutto nel SQL editor di Supabase e si preme Run;
--   3) si riesegue `conteggi_dati_sola_lettura.sql` e si confrontano i referti.
--   Non ci sono parametri da compilare.
-- ============================================================================

begin;

do $$
declare
  -- Il limite dei 30 giorni e' una REGOLA di §69, non un conteggio letto da un
  -- documento: sta qui come costante e non va cambiato senza cambiare prima la
  -- spec e l'informativa privacy, che dichiara lo stesso termine.
  v_giorni constant integer := 30;
  v_soglia constant timestamptz := now() - (v_giorni || ' days')::interval;

  -- Le 16 tabelle che questo script non deve toccare (§66). L'elenco e' lo
  -- stesso scritto in testa al file, ed e' quello verificato dal POST-CHECK 5.
  v_intoccabili constant text[] := array[
    'stores', 'store_order_windows', 'store_geofences', 'store_schedule_exceptions',
    'products', 'allergens', 'product_allergens', 'product_choice_options',
    'product_removals', 'product_addons', 'product_accompaniments',
    'combo_pricing', 'combo_side_options', 'combo_drink_options',
    'coupons', 'staff_settings'
  ];

  -- Tutti i numeri sono LETTI dal database, prima e dopo (§69, lezioni `s`/`z`).
  v_ordini_bersaglio      bigint;
  v_pagati_prima          bigint;
  v_pagati_dopo           bigint;
  v_eventi_prima          bigint;
  v_eventi_dopo           bigint;
  v_log_prima             bigint;
  v_log_dopo              bigint;
  v_clienti_prima         bigint;
  v_clienti_dopo          bigint;
  v_clienti_rimossi       bigint;
  v_clienti_gia_libere    bigint;
  v_residuo               bigint;
  v_orfani                bigint;
  v_conteggi_prima        bigint[] := array[]::bigint[];
  v_n                     bigint;
  v_i                     integer;
  v_tabella               text;
begin

  -- ==========================================================================
  -- PRE-CHECK — fotografia di partenza, letta adesso.
  -- ==========================================================================

  -- Gli ordini bersaglio: mai pagati (§69: pending E failed) e creati da oltre
  -- 30 giorni. Il conteggio parte dalla CREAZIONE, perche' non esiste un evento
  -- "pagamento fallito" che qualcuno scriva: un ordine non pagato resta (§69).
  select count(*) into v_ordini_bersaglio
  from orders
  where payment_status in ('pending', 'failed')
    and created_at < v_soglia;

  -- Cio' che NON deve cambiare, misurato prima.
  select count(*) into v_pagati_prima
  from orders where payment_status in ('succeeded', 'refunded', 'partially_refunded');

  select count(*) into v_eventi_prima  from analytics_events;
  select count(*) into v_log_prima     from staff_action_log;

  -- Il totale delle righe cliente PRIMA. Serve a contare quante ne vengono
  -- rimosse davvero: vedi la nota al POST-CHECK 6.
  select count(*) into v_clienti_prima from customers;

  -- Le righe cliente GIA' libere adesso: nessun ordine collegato in questo
  -- momento ed eta' oltre la soglia.
  -- ⚠️ Questo numero e' una STIMA PER DIFETTO di quante ne verranno rimosse, e
  -- non va usato per raccontare l'esito. Chi ha solo ordini mai pagati e vecchi
  -- risulta ancora "cliente con ordini" adesso, quindi non e' contato qui, ma
  -- quegli ordini spariscono poche righe piu' sotto e la sua riga diventa
  -- rimovibile nella stessa transazione. Il numero vero si ottiene solo dopo,
  -- per differenza (POST-CHECK 6).
  select count(*) into v_clienti_gia_libere
  from customers c
  where c.created_at < v_soglia
    and not exists (select 1 from orders o where o.customer_id = c.id)
    and not exists (select 1 from promo_redemptions p where p.customer_id = c.id);

  raise notice 'PRE-CHECK. Ordini mai pagati oltre i % giorni: %. Righe cliente gia'' senza ordini e altrettanto vecchie: % (stima per difetto: altre potrebbero liberarsi cancellando gli ordini). Ordini pagati o rimborsati da preservare: %.',
    v_giorni, v_ordini_bersaglio, v_clienti_gia_libere, v_pagati_prima;

  if v_ordini_bersaglio = 0 and v_clienti_gia_libere = 0 then
    raise notice 'Niente da rimuovere questo mese: nessun ordine mai pagato oltre i % giorni e nessuna riga cliente libera altrettanto vecchia. La transazione si chiude senza modifiche.', v_giorni;
  end if;

  -- Fotografia delle 16 tabelle intoccabili, letta adesso per confrontarla dopo
  -- (§69: "i post-check verificano anche cio' che non doveva cambiare").
  foreach v_tabella in array v_intoccabili loop
    execute format('select count(*) from %I', v_tabella) into v_n;
    v_conteggi_prima := array_append(v_conteggi_prima, v_n);
  end loop;

  -- ==========================================================================
  -- OPERAZIONI — l'ordine e' imposto dai collegamenti verificati il 04/08/2026
  -- (§66, referto) e NON e' modificabile a piacere (§69):
  --   1. cio' che punta agli ordini SENZA cancellazione a catena — qui si
  --      STACCA dove la colonna e' facoltativa e si CANCELLA dove e'
  --      obbligatoria;
  --   2. gli ordini, che si portano dietro da soli `order_items` e
  --      `order_status_history` (entrambi `on delete cascade`);
  --   3. le righe cliente rimaste senza ordini.
  -- ==========================================================================

  -- 1a. Eventi statistici: perdono il riferimento e RESTANO (§69). Cancellarli
  --     eroderebbe i dati di §65 per un collegamento che, sparito l'ordine, non
  --     serve piu' a nessuno.
  update analytics_events
     set order_id = null
   where order_id in (
     select id from orders
     where payment_status in ('pending', 'failed') and created_at < v_soglia
   );

  -- 1b. Registro staff: stesso trattamento. E' l'audit trail che §66 dichiara
  --     intoccabile.
  update staff_action_log
     set order_id = null
   where order_id in (
     select id from orders
     where payment_status in ('pending', 'failed') and created_at < v_soglia
   );

  -- 1c. Riscatti promo: qui staccare NON si puo', perche' `order_id` e'
  --     obbligatoria (§69, "Dove staccare non si puo': i codici promo"). La
  --     riga si cancella, con la conseguenza dichiarata in testa al file.
  delete from promo_redemptions
   where order_id in (
     select id from orders
     where payment_status in ('pending', 'failed') and created_at < v_soglia
   );

  -- 2. Gli ordini bersaglio. `order_items` e `order_status_history` spariscono
  --    da soli. Gli ordini pagati non sono raggiungibili da questa istruzione.
  delete from orders
   where payment_status in ('pending', 'failed')
     and created_at < v_soglia;

  -- 3. Le righe cliente rimaste libere e abbastanza vecchie. Qui rientrano
  --    anche quelle che sono diventate libere un istante fa, perche' i loro
  --    unici ordini erano fra quelli appena cancellati.
  delete from customers c
   where c.created_at < v_soglia
     and not exists (select 1 from orders o where o.customer_id = c.id)
     and not exists (select 1 from promo_redemptions p where p.customer_id = c.id);

  -- ==========================================================================
  -- POST-CHECK BLOCCANTI
  -- ==========================================================================

  -- POST-CHECK 1 — non resta alcun ordine mai pagato oltre la soglia.
  select count(*) into v_residuo
  from orders
  where payment_status in ('pending', 'failed') and created_at < v_soglia;

  if v_residuo <> 0 then
    raise exception
      'POST-CHECK fallito: restano % ordini mai pagati piu'' vecchi di % giorni. Transazione annullata, nulla e'' stato scritto.',
      v_residuo, v_giorni;
  end if;

  -- POST-CHECK 2 — GLI ORDINI PAGATI SONO TUTTI ANCORA LI'.
  -- E' il controllo che si accorge di cio' che e' sparito IN PIU'.
  select count(*) into v_pagati_dopo
  from orders where payment_status in ('succeeded', 'refunded', 'partially_refunded');

  if v_pagati_dopo <> v_pagati_prima then
    raise exception
      'POST-CHECK fallito: gli ordini pagati o rimborsati erano % e ora sono %. Questo script non deve poterli toccare (§69). Transazione annullata.',
      v_pagati_prima, v_pagati_dopo;
  end if;

  -- POST-CHECK 3 — eventi statistici e registro sono stati STACCATI, non
  -- cancellati: il totale non deve essere calato di una sola riga.
  select count(*) into v_eventi_dopo from analytics_events;
  if v_eventi_dopo <> v_eventi_prima then
    raise exception
      'POST-CHECK fallito: gli eventi statistici erano % e ora sono %. §69 impone di staccare il riferimento, mai di cancellare la riga. Transazione annullata.',
      v_eventi_prima, v_eventi_dopo;
  end if;

  select count(*) into v_log_dopo from staff_action_log;
  if v_log_dopo <> v_log_prima then
    raise exception
      'POST-CHECK fallito: le righe di registro erano % e ora sono %. L''audit trail di §66 non si cancella: si stacca soltanto il riferimento all''ordine. Transazione annullata.',
      v_log_prima, v_log_dopo;
  end if;

  -- POST-CHECK 4 — nessun ordine rimasto senza la sua riga cliente.
  select count(*) into v_orfani
  from orders o
  where not exists (select 1 from customers c where c.id = o.customer_id);

  if v_orfani <> 0 then
    raise exception
      'POST-CHECK fallito: % ordini sono rimasti senza riga cliente. Transazione annullata.',
      v_orfani;
  end if;

  -- POST-CHECK 5 — LE 16 TABELLE DI MENU E CONFIGURAZIONE SONO INTATTE.
  -- Sono esattamente quelle elencate in testa al file: le due liste coincidono.
  for v_i in 1 .. array_length(v_intoccabili, 1) loop
    execute format('select count(*) from %I', v_intoccabili[v_i]) into v_n;
    if v_n <> v_conteggi_prima[v_i] then
      raise exception
        'POST-CHECK fallito: la tabella `%` aveva % righe e ora ne ha %. Questo script non deve toccare il menu ne'' la configurazione (§66). Transazione annullata, nulla e'' stato scritto.',
        v_intoccabili[v_i], v_conteggi_prima[v_i], v_n;
    end if;
  end loop;

  -- POST-CHECK 6 — quante righe cliente sono state rimosse DAVVERO.
  -- Si conta per DIFFERENZA fra il totale prima e il totale dopo, non con la
  -- stima del pre-check: quella e' per difetto, perche' misurata quando gli
  -- ordini mai pagati erano ancora in tabella e tenevano occupate righe cliente
  -- che sono state rimosse un istante dopo. E' proprio questo il numero che si
  -- confronta con i due referti di `conteggi_dati_sola_lettura.sql`, quindi
  -- deve essere quello vero.
  select count(*) into v_clienti_dopo from customers;
  v_clienti_rimossi := v_clienti_prima - v_clienti_dopo;

  if v_clienti_rimossi < 0 then
    raise exception
      'POST-CHECK fallito: le righe cliente erano % e ora sono %, cioe'' sono aumentate durante una pulizia. Transazione annullata.',
      v_clienti_prima, v_clienti_dopo;
  end if;

  raise notice 'POST-CHECK superati. Rimossi % ordini mai pagati e % righe cliente (da % a %); % ordini pagati o rimborsati intatti; eventi statistici e registro staccati ma integri (% e % righe); tutte e % le tabelle di menu e configurazione invariate.',
    v_ordini_bersaglio, v_clienti_rimossi, v_clienti_prima, v_clienti_dopo,
    v_pagati_dopo, v_eventi_dopo, v_log_dopo, array_length(v_intoccabili, 1);

end $$;

commit;

-- ============================================================================
-- SCELTE FATTE QUI DENTRO CHE LA SPEC NON FISSA — dichiarate, non nascoste.
--
-- SCELTA 1 — Da quale data si contano i 30 giorni per una riga CLIENTE.
--   §69 fissa esplicitamente che per gli ORDINI il conteggio parte dalla
--   creazione, ma non dice da quando parte per una riga cliente che non ha mai
--   avuto un ordine (un checkout interrotto prima della scrittura dell'ordine).
--   Qui si usa `customers.created_at`, che e' l'unica data disponibile su
--   quella riga ed e' la stessa convenzione degli ordini.
--
-- SCELTA 2 — Come si combinano le due frasi di §69 sulle righe cliente.
--   Il documento dice sia "righe cliente senza ordine PAGATO: massimo 30
--   giorni" sia "non cancellare mai una riga cliente che abbia almeno un
--   ordine collegato". Prese alla lettera insieme, la seconda e' piu' stretta.
--   Qui si applica la piu' stretta: si cancellano solo le righe rimaste con
--   ZERO ordini di qualunque tipo. L'effetto pratico coincide comunque con la
--   prima frase, perche' gli ordini mai pagati vengono rimossi poco sopra nella
--   stessa transazione: chi aveva solo quelli resta senza ordini e viene
--   rimosso; chi ha un ordine pagato conserva l'ordine e quindi la riga.
--
-- SCELTA 3 — Si esclude anche chi e' citato da un riscatto promo.
--   §69 nomina i soli ordini come motivo per non cancellare un cliente, ma
--   `promo_redemptions.customer_id` e' obbligatoria e senza cancellazione a
--   catena (§66): una riga cliente citata da un riscatto non e' cancellabile e
--   il database rifiuterebbe l'operazione. Escluderla qui trasforma un errore
--   di vincolo in un caso previsto. Nella pratica la condizione non si verifica
--   — un riscatto cita sempre un ordine, e se l'ordine e' sparito il riscatto
--   e' sparito con lui — ma il controllo non costa nulla e non dipende da un
--   conteggio fotografato in un documento.
--
-- SCELTA 4 — Se non c'e' nulla da rimuovere, lo script NON si ferma.
--   A differenza di quello del go-live, qui il caso "niente da fare" e' il
--   risultato normale di un mese tranquillo: viene annunciato con un avviso e
--   la transazione si chiude senza modifiche. Fermarsi con un errore
--   insegnerebbe a ignorare gli errori.
-- ============================================================================
