-- ============================================================================
-- PULIZIA AUTOMATICA DEGLI ORDINI MAI PAGATI — 1. STRUTTURA
-- (§69, decisioni di Andrea del 22/11/2026). Lo lancia ANDREA nell'editor SQL.
-- ============================================================================
--
-- COSA CREA (anche per chi non conosce SQL):
--   1. lo schema `manutenzione`, separato e CHIUSO: l'API pubblica di Supabase
--      non lo vede, e public, anon, authenticated non hanno nessun permesso;
--   2. la tabella `manutenzione.pulizia_registro`: una riga per ogni
--      esecuzione — data, modo, soglia, esito, righe toccate per tabella.
--      Solo numeri, NESSUN dato personale;
--   3. la funzione `manutenzione.pulizia_ordini_mai_pagati(p_giorni, p_modo)`:
--      fa la pulizia con le STESSE regole, gli STESSI freni e gli STESSI
--      controlli finali di `sql/pulizia_mensile_ordini_mai_pagati.sql`
--      (sha c80ea0bb…a55c6d67). Le istruzioni che scrivono sono copiate
--      identiche da lì, nello stesso ordine: lo verifica
--      `tests/pulizia-automatica.test.mjs`;
--   4. la funzione `public.pulizia_stato()`: dice al pannello staff quando è
--      girata l'ultima volta e com'è andata. La può chiamare SOLO il server
--      (service_role); legge solo il registro.
--
-- COSA NON FA:
--   NON accende l'orologio. Dopo questo file non succede niente da solo: la
--   funzione gira solo se qualcuno la chiama. L'orologio è un file a parte
--   (`20261122_pulizia_automatica_4_orologio_accensione.sql`).
--
-- COME SI USA LA FUNZIONE (la riga si scrive nell'editor SQL):
--   select manutenzione.pulizia_ordini_mai_pagati(28, 'prova');
--     → fa tutto, controlla tutto, poi ANNULLA TUTTO e scrive «prova» nel
--       registro con i numeri che avrebbe toccato. Non cancella niente.
--   select manutenzione.pulizia_ordini_mai_pagati(28, 'manuale');
--     → la pulizia vera, lanciata a mano. È anche la procedura d'emergenza.
--   'automatica' è il modo che usa l'orologio.
--   La funzione RESTITUISCE una riga di testo con l'esito: l'editor di
--   Supabase la mostra (gli avvisi `raise notice`, invece, non li mostra).
--
-- LE REGOLE CHE LA PROTEGGONO:
--   - soglia accettata solo fra 20 e 30 giorni: fuori, rifiuta, NON tocca
--     niente e scrive una riga «errore» nel registro;
--   - modi accettati: automatica, manuale, prova. Un modo diverso è un errore
--     di chi scrive la chiamata e viene rifiutato subito (senza riga: il
--     registro accetta solo i tre modi);
--   - un FRENO (codice sconto consumato, o prenotazione ancora viva, sugli
--     ordini o sui clienti da togliere) ANNULLA TUTTO il lavoro e scrive
--     «fermata» nel registro, con il motivo;
--   - un controllo finale fallito o qualunque altro errore ANNULLA TUTTO il
--     lavoro e scrive «errore» nel registro, con il codice e il testo;
--   - due pulizie non possono girare insieme: la seconda si rifiuta e scrive
--     «errore».
--   Il lavoro sta in un blocco protetto (begin … exception … end): quando il
--   blocco fallisce PostgreSQL ne annulla ogni modifica; la riga del registro
--   si scrive DOPO, fuori dal blocco, e quindi resta.
--
-- PERMESSI:
--   La funzione di pulizia non è eseguibile da public, anon, authenticated.
--   La esegue chi la possiede (l'utente `postgres` dell'editor SQL) e
--   l'orologio, che gira come chi lo ha acceso.
--
-- SICUREZZA: tutto il file è una transazione. Se una sola istruzione fallisce,
-- non resta niente a metà.
-- ============================================================================

begin;

-- 1. Lo schema separato, chiuso a chiunque non sia il proprietario.
create schema if not exists manutenzione;
revoke all on schema manutenzione from public, anon, authenticated;

-- 2. Il registro: una riga per esecuzione, solo numeri.
create table if not exists manutenzione.pulizia_registro (
  id                 bigint generated always as identity primary key,
  eseguita_il        timestamptz not null default now(),
  modo               text not null check (modo in ('automatica', 'manuale', 'prova')),
  soglia_giorni      integer,
  soglia_istante     timestamptz,
  esito              text not null check (esito in ('ok', 'fermata', 'errore', 'prova')),
  motivo             text,
  ordini             bigint,
  righe_ordine       bigint,
  storico_stati      bigint,
  eventi_staccati    bigint,
  registro_staccato  bigint,
  promo_cancellati   bigint,
  coupon_da_ordini   bigint,
  coupon_da_clienti  bigint,
  clienti            bigint,
  pagati_totale      bigint,
  consumati_totale   bigint,
  durata_ms          integer
);
revoke all on table manutenzione.pulizia_registro from public, anon, authenticated;
alter table manutenzione.pulizia_registro enable row level security;

-- 3. La funzione di pulizia.
create or replace function manutenzione.pulizia_ordini_mai_pagati(p_giorni integer, p_modo text)
returns text
language plpgsql
set search_path = public, pg_temp
as $$
declare
  -- La soglia la decide CHI CHIAMA (l'orologio: 28). Qui non c'è un numero
  -- fisso: c'è solo l'intervallo ammesso, 20-30, controllato qui sotto.
  v_giorni integer;
  v_soglia timestamptz;
  v_inizio constant timestamptz := clock_timestamp();

  -- Le 16 tabelle che questa funzione non deve toccare (§66): la STESSA lista
  -- dello script manuale, verificata dal POST-CHECK 5.
  v_intoccabili constant text[] := array[
    'stores', 'store_order_windows', 'store_geofences', 'store_schedule_exceptions',
    'products', 'allergens', 'product_allergens', 'product_choice_options',
    'product_removals', 'product_addons', 'product_accompaniments',
    'combo_pricing', 'combo_side_options', 'combo_drink_options',
    'coupons', 'staff_settings'
  ];

  -- Le stesse variabili dello script manuale.
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
  v_consumati_prima       bigint;
  v_consumati_dopo        bigint;
  v_cr_consumate          bigint;
  v_cr_vive               bigint;
  v_cr_tolte_ordini       bigint := 0;
  v_cr_tolte_clienti      bigint := 0;
  v_conteggi_prima        bigint[] := array[]::bigint[];
  v_n                     bigint;
  v_i                     integer;
  v_tabella               text;

  -- In più, per il registro.
  v_righe_ordine          bigint;
  v_storico_stati         bigint;
  v_eventi_staccati       bigint;
  v_log_staccati          bigint;
  v_promo_cancellati      bigint;
  v_esito                 text;
  v_motivo                text;
  v_stato                 text;
  v_messaggio             text;
  v_id                    bigint;
begin

  -- ==========================================================================
  -- CONTROLLI DI CHIAMATA — prima di toccare qualunque cosa.
  -- ==========================================================================
  if p_modo is null or p_modo not in ('automatica', 'manuale', 'prova') then
    raise exception 'Modo non valido: %. I modi ammessi sono automatica, manuale, prova. Nulla e'' stato toccato.',
      coalesce(p_modo, 'vuoto');
  end if;

  if p_giorni is null or p_giorni < 20 or p_giorni > 30 then
    insert into manutenzione.pulizia_registro (modo, soglia_giorni, esito, motivo, durata_ms)
    values (
      p_modo, p_giorni, 'errore',
      format('Soglia rifiutata: %s. Sono ammesse solo soglie fra 20 e 30 giorni. Nulla e'' stato toccato.', coalesce(p_giorni::text, 'vuota')),
      (extract(epoch from clock_timestamp() - v_inizio) * 1000)::integer
    )
    returning id into v_id;
    return format('ERRORE — registro n. %s — soglia %s rifiutata: sono ammesse solo soglie fra 20 e 30 giorni. Nulla e'' stato toccato.',
      v_id, coalesce(p_giorni::text, 'vuota'));
  end if;

  v_giorni := p_giorni;
  v_soglia := now() - (v_giorni || ' days')::interval;

  if not pg_try_advisory_xact_lock(hashtext('km_pulizia_ordini_mai_pagati')) then
    insert into manutenzione.pulizia_registro (modo, soglia_giorni, soglia_istante, esito, motivo, durata_ms)
    values (
      p_modo, v_giorni, v_soglia, 'errore',
      'Un''altra pulizia e'' in corso in questo momento. Nulla e'' stato toccato.',
      (extract(epoch from clock_timestamp() - v_inizio) * 1000)::integer
    )
    returning id into v_id;
    return format('ERRORE — registro n. %s — un''altra pulizia e'' in corso. Nulla e'' stato toccato.', v_id);
  end if;

  -- ==========================================================================
  -- IL LAVORO, in un blocco protetto: se fallisce, PostgreSQL annulla tutto
  -- quello che il blocco ha fatto. Da qui fino ai POST-CHECK il testo è quello
  -- dello script manuale; le sole aggiunte sono i conteggi per il registro
  -- (`get diagnostics` e due letture) e il codice KMF01 sui quattro freni.
  -- ==========================================================================
  begin

    -- PRE-CHECK — fotografia di partenza, letta adesso.

    -- Gli ordini bersaglio: mai pagati (§69: pending E failed) e creati prima
    -- della soglia. Il conteggio parte dalla CREAZIONE.
    select count(*) into v_ordini_bersaglio
    from orders
    where payment_status in ('pending', 'failed')
      and created_at < v_soglia;

    -- Per il registro: le righe che spariranno a catena con quegli ordini.
    select count(*) into v_righe_ordine
    from order_items
    where order_id in (
      select id from orders
      where payment_status in ('pending', 'failed') and created_at < v_soglia
    );

    select count(*) into v_storico_stati
    from order_status_history
    where order_id in (
      select id from orders
      where payment_status in ('pending', 'failed') and created_at < v_soglia
    );

    -- Cio' che NON deve cambiare, misurato prima.
    select count(*) into v_pagati_prima
    from orders where payment_status in ('succeeded', 'refunded', 'partially_refunded');

    select count(*) into v_eventi_prima  from analytics_events;
    select count(*) into v_log_prima     from staff_action_log;
    select count(*) into v_consumati_prima from coupon_redemptions where status = 'consumed';

    select count(*) into v_clienti_prima from customers;

    -- Stima per difetto, come nello script manuale (vedi POST-CHECK 6).
    select count(*) into v_clienti_gia_libere
    from customers c
    where c.created_at < v_soglia
      and not exists (select 1 from orders o where o.customer_id = c.id)
      and not exists (select 1 from promo_redemptions p where p.customer_id = c.id);

    raise notice 'PRE-CHECK. Ordini mai pagati oltre i % giorni: %. Righe cliente gia'' senza ordini e altrettanto vecchie: %. Ordini pagati o rimborsati da preservare: %.',
      v_giorni, v_ordini_bersaglio, v_clienti_gia_libere, v_pagati_prima;

    if v_ordini_bersaglio = 0 and v_clienti_gia_libere = 0 then
      raise notice 'Niente da rimuovere: nessun ordine mai pagato oltre i % giorni e nessuna riga cliente libera altrettanto vecchia.', v_giorni;
    end if;

    -- Fotografia delle 16 tabelle intoccabili.
    foreach v_tabella in array v_intoccabili loop
      execute format('select count(*) from %I', v_tabella) into v_n;
      v_conteggi_prima := array_append(v_conteggi_prima, v_n);
    end loop;

    -- OPERAZIONI — stesso ordine dello script manuale (§66, §69).

    -- 1a. Eventi statistici: perdono il riferimento e RESTANO.
    update analytics_events
       set order_id = null
     where order_id in (
       select id from orders
       where payment_status in ('pending', 'failed') and created_at < v_soglia
     );
    get diagnostics v_eventi_staccati = row_count;

    -- 1b. Registro staff: stesso trattamento.
    update staff_action_log
       set order_id = null
     where order_id in (
       select id from orders
       where payment_status in ('pending', 'failed') and created_at < v_soglia
     );
    get diagnostics v_log_staccati = row_count;

    -- 1c. Riscatti promo: `order_id` obbligatoria, la riga si cancella.
    delete from promo_redemptions
     where order_id in (
       select id from orders
       where payment_status in ('pending', 'failed') and created_at < v_soglia
     );
    get diagnostics v_promo_cancellati = row_count;

    -- 1d. Codici sconto della serie nuova. PRIMA SI GUARDA, POI SI CANCELLA.
    select count(*) filter (where status = 'consumed'),
           count(*) filter (where status = 'reserved' and reserved_until >= now())
      into v_cr_consumate, v_cr_vive
      from coupon_redemptions
     where order_id in (
       select id from orders
       where payment_status in ('pending', 'failed') and created_at < v_soglia
     );

    if v_cr_consumate > 0 then
      raise exception
        'FERMO al passo 1d: % codici sconto risultano CONSUMATI su ordini mai pagati oltre i % giorni. Va capito prima di pulire. Nulla e'' stato scritto.',
        v_cr_consumate, v_giorni
        using errcode = 'KMF01';
    end if;
    if v_cr_vive > 0 then
      raise exception
        'FERMO al passo 1d: % prenotazioni di codici sconto ancora VIVE su ordini mai pagati oltre i % giorni: un pagamento in corso. Nulla e'' stato scritto.',
        v_cr_vive, v_giorni
        using errcode = 'KMF01';
    end if;

    delete from coupon_redemptions
     where status = 'reserved'
       and order_id in (
         select id from orders
         where payment_status in ('pending', 'failed') and created_at < v_soglia
       );
    get diagnostics v_cr_tolte_ordini = row_count;

    -- 2. Gli ordini bersaglio. `order_items` e `order_status_history`
    --    spariscono da soli.
    delete from orders
     where payment_status in ('pending', 'failed')
       and created_at < v_soglia;

    -- 3b. Codici sconto sui CLIENTI che il passo 3 sta per togliere.
    --     ⚠️ La condizione sui clienti e' SCRITTA DUE VOLTE, qui e nel passo
    --     3: se si cambia una, si cambia anche l'altra.
    select count(*) filter (where r.status = 'consumed'),
           count(*) filter (where r.status = 'reserved' and r.reserved_until >= now())
      into v_cr_consumate, v_cr_vive
      from coupon_redemptions r
      join customers c on c.id = r.customer_id
     where c.created_at < v_soglia
       and not exists (select 1 from orders o where o.customer_id = c.id)
       and not exists (select 1 from promo_redemptions p where p.customer_id = c.id);

    if v_cr_consumate > 0 then
      raise exception
        'FERMO al passo 3b: % codici sconto risultano CONSUMATI da clienti che stanno per essere tolti perche'' senza ordini. Va capito prima di pulire. Nulla e'' stato scritto.',
        v_cr_consumate
        using errcode = 'KMF01';
    end if;
    if v_cr_vive > 0 then
      raise exception
        'FERMO al passo 3b: % prenotazioni di codici sconto ancora VIVE su clienti che stanno per essere tolti: qualcuno sta pagando adesso. Nulla e'' stato scritto.',
        v_cr_vive
        using errcode = 'KMF01';
    end if;

    delete from coupon_redemptions r
     using customers c
     where c.id = r.customer_id
       and r.status = 'reserved'
       and c.created_at < v_soglia
       and not exists (select 1 from orders o where o.customer_id = c.id)
       and not exists (select 1 from promo_redemptions p where p.customer_id = c.id);
    get diagnostics v_cr_tolte_clienti = row_count;

    -- 3. Le righe cliente rimaste libere e abbastanza vecchie.
    delete from customers c
     where c.created_at < v_soglia
       and not exists (select 1 from orders o where o.customer_id = c.id)
       and not exists (select 1 from promo_redemptions p where p.customer_id = c.id);

    -- POST-CHECK BLOCCANTI — gli stessi sette dello script manuale.

    -- POST-CHECK 1 — non resta alcun ordine mai pagato oltre la soglia.
    select count(*) into v_residuo
    from orders
    where payment_status in ('pending', 'failed') and created_at < v_soglia;

    if v_residuo <> 0 then
      raise exception
        'POST-CHECK 1 fallito: restano % ordini mai pagati piu'' vecchi di % giorni. Nulla e'' stato scritto.',
        v_residuo, v_giorni;
    end if;

    -- POST-CHECK 2 — GLI ORDINI PAGATI SONO TUTTI ANCORA LI'.
    select count(*) into v_pagati_dopo
    from orders where payment_status in ('succeeded', 'refunded', 'partially_refunded');

    if v_pagati_dopo <> v_pagati_prima then
      raise exception
        'POST-CHECK 2 fallito: gli ordini pagati o rimborsati erano % e ora sono %. Nulla e'' stato scritto.',
        v_pagati_prima, v_pagati_dopo;
    end if;

    -- POST-CHECK 3 — eventi e registro STACCATI, non cancellati.
    select count(*) into v_eventi_dopo from analytics_events;
    if v_eventi_dopo <> v_eventi_prima then
      raise exception
        'POST-CHECK 3 fallito: gli eventi statistici erano % e ora sono %. Nulla e'' stato scritto.',
        v_eventi_prima, v_eventi_dopo;
    end if;

    select count(*) into v_log_dopo from staff_action_log;
    if v_log_dopo <> v_log_prima then
      raise exception
        'POST-CHECK 3 fallito: le righe di registro staff erano % e ora sono %. Nulla e'' stato scritto.',
        v_log_prima, v_log_dopo;
    end if;

    -- POST-CHECK 4 — nessun ordine rimasto senza la sua riga cliente.
    select count(*) into v_orfani
    from orders o
    where not exists (select 1 from customers c where c.id = o.customer_id);

    if v_orfani <> 0 then
      raise exception
        'POST-CHECK 4 fallito: % ordini sono rimasti senza riga cliente. Nulla e'' stato scritto.',
        v_orfani;
    end if;

    -- POST-CHECK 5 — LE 16 TABELLE DI MENU E CONFIGURAZIONE SONO INTATTE.
    for v_i in 1 .. array_length(v_intoccabili, 1) loop
      execute format('select count(*) from %I', v_intoccabili[v_i]) into v_n;
      if v_n <> v_conteggi_prima[v_i] then
        raise exception
          'POST-CHECK 5 fallito: la tabella `%` aveva % righe e ora ne ha %. Nulla e'' stato scritto.',
          v_intoccabili[v_i], v_conteggi_prima[v_i], v_n;
      end if;
    end loop;

    -- POST-CHECK 6 — quante righe cliente sono state rimosse DAVVERO, per
    -- differenza.
    select count(*) into v_clienti_dopo from customers;
    v_clienti_rimossi := v_clienti_prima - v_clienti_dopo;

    if v_clienti_rimossi < 0 then
      raise exception
        'POST-CHECK 6 fallito: le righe cliente erano % e ora sono %. Nulla e'' stato scritto.',
        v_clienti_prima, v_clienti_dopo;
    end if;

    -- POST-CHECK 7 — NESSUN CODICE CONSUMATO E' SPARITO.
    select count(*) into v_consumati_dopo from coupon_redemptions where status = 'consumed';
    if v_consumati_dopo <> v_consumati_prima then
      raise exception
        'POST-CHECK 7 fallito: i codici sconto consumati erano % e ora sono %. Nulla e'' stato scritto.',
        v_consumati_prima, v_consumati_dopo;
    end if;

    -- In modo PROVA, arrivati qui con tutti i controlli superati, si annulla
    -- tutto il lavoro: restano solo i numeri, che vanno nel registro.
    if p_modo = 'prova' then raise exception using errcode = 'KMP01', message = 'Prova: tutto il lavoro e'' stato annullato.';
    end if;

    v_esito := 'ok';

  exception
    when sqlstate 'KMP01' then v_esito := 'prova';
    when sqlstate 'KMF01' then v_esito := 'fermata';
      v_motivo := sqlerrm;
    when others then v_esito := 'errore';
      get stacked diagnostics v_stato = returned_sqlstate, v_messaggio = message_text;
      v_motivo := left(v_stato || ': ' || v_messaggio, 1000);
  end;

  -- ==========================================================================
  -- LA RIGA DEL REGISTRO — fuori dal blocco protetto: resta sempre.
  -- I conteggi si scrivono solo per «ok» e «prova»; per «fermata» ed
  -- «errore» il lavoro è stato annullato e i numeri parziali confonderebbero.
  -- ==========================================================================
  insert into manutenzione.pulizia_registro (
    modo, soglia_giorni, soglia_istante, esito, motivo,
    ordini, righe_ordine, storico_stati, eventi_staccati, registro_staccato,
    promo_cancellati, coupon_da_ordini, coupon_da_clienti, clienti,
    pagati_totale, consumati_totale, durata_ms
  )
  values (
    p_modo, v_giorni, v_soglia, v_esito, v_motivo,
    case when v_esito in ('ok', 'prova') then v_ordini_bersaglio end,
    case when v_esito in ('ok', 'prova') then v_righe_ordine end,
    case when v_esito in ('ok', 'prova') then v_storico_stati end,
    case when v_esito in ('ok', 'prova') then v_eventi_staccati end,
    case when v_esito in ('ok', 'prova') then v_log_staccati end,
    case when v_esito in ('ok', 'prova') then v_promo_cancellati end,
    case when v_esito in ('ok', 'prova') then v_cr_tolte_ordini end,
    case when v_esito in ('ok', 'prova') then v_cr_tolte_clienti end,
    case when v_esito in ('ok', 'prova') then v_clienti_rimossi end,
    v_pagati_prima, v_consumati_prima,
    (extract(epoch from clock_timestamp() - v_inizio) * 1000)::integer
  )
  returning id into v_id;

  return format('%s — registro n. %s — soglia %s giorni, modo %s — ordini %s, righe d''ordine %s, storico %s, eventi staccati %s, registro staccato %s, promo %s, codici da ordini %s, codici da clienti %s, clienti %s%s',
    upper(v_esito), v_id, v_giorni, p_modo,
    coalesce(case when v_esito in ('ok', 'prova') then v_ordini_bersaglio end::text, '-'),
    coalesce(case when v_esito in ('ok', 'prova') then v_righe_ordine end::text, '-'),
    coalesce(case when v_esito in ('ok', 'prova') then v_storico_stati end::text, '-'),
    coalesce(case when v_esito in ('ok', 'prova') then v_eventi_staccati end::text, '-'),
    coalesce(case when v_esito in ('ok', 'prova') then v_log_staccati end::text, '-'),
    coalesce(case when v_esito in ('ok', 'prova') then v_promo_cancellati end::text, '-'),
    coalesce(case when v_esito in ('ok', 'prova') then v_cr_tolte_ordini end::text, '-'),
    coalesce(case when v_esito in ('ok', 'prova') then v_cr_tolte_clienti end::text, '-'),
    coalesce(case when v_esito in ('ok', 'prova') then v_clienti_rimossi end::text, '-'),
    case when v_motivo is not null then ' — ' || v_motivo else '' end);
end;
$$;

revoke execute on function manutenzione.pulizia_ordini_mai_pagati(integer, text) from public, anon, authenticated;

-- 4. Lo stato per il pannello staff: l'ultima esecuzione e l'ultima riuscita,
--    ignorando le prove. Solo data, esito e modo: nessun numero, nessun dato
--    di clienti o ordini.
create or replace function public.pulizia_stato()
returns jsonb
language sql
stable
security definer set search_path = ''
as $$
  select jsonb_build_object(
    'ultima', (
      select jsonb_build_object('eseguita_il', r.eseguita_il, 'esito', r.esito, 'modo', r.modo)
      from manutenzione.pulizia_registro r
      where r.modo in ('automatica', 'manuale')
      order by r.eseguita_il desc, r.id desc
      limit 1
    ),
    'ultima_ok', (
      select jsonb_build_object('eseguita_il', r.eseguita_il, 'modo', r.modo)
      from manutenzione.pulizia_registro r
      where r.modo in ('automatica', 'manuale') and r.esito = 'ok'
      order by r.eseguita_il desc, r.id desc
      limit 1
    )
  );
$$;

revoke execute on function public.pulizia_stato() from public, anon, authenticated;
grant execute on function public.pulizia_stato() to service_role;

commit;

-- ============================================================================
-- REFERTO ATTESO: «Success. No rows returned». Nessun dato viene toccato.
-- Per controllare che ci sia tutto, la riga di verifica è nei passi di Andrea.
-- ============================================================================
