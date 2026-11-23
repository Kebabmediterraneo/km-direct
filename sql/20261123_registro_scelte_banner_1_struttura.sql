-- ============================================================================
-- REGISTRO DELLE SCELTE DEL BANNER — 1. STRUTTURA
-- (§65b E4, decisioni di Andrea del 23/11/2026). Lo lancia ANDREA nell'editor SQL.
-- ============================================================================
--
-- COSA CREA (anche per chi non conosce SQL):
--   1. lo schema `consensi`, separato e CHIUSO (l'API pubblica di Supabase non
--      lo vede; public, anon, authenticated senza nessun permesso);
--   2. la tabella `consensi.scelte_banner`: una riga a ogni SALVATAGGIO di una
--      scelta nel banner. Identificativo casuale del browser, data e ora (le
--      mette il database), versione del testo, le scelte per Google, Meta e
--      Adobe Fonts, il pulsante usato e da dove. NIENTE IP, niente dati
--      d'ordine o di cliente. ⚠️ L'identificativo è uno pseudonimo, non è
--      anonimo;
--   3. `public.registra_scelta_banner(...)`: l'unica via di scrittura. La può
--      chiamare SOLO il server (service_role). Applica i limiti: al massimo 20
--      righe per identificativo nelle 24 ore e 120 righe al minuto in tutto;
--      oltre, la riga non si scrive (e il browser non lo sa);
--   4. `consensi.pulisci_scelte_banner(p_mesi, p_modo)`: cancella le righe più
--      vecchie della durata (ammessi solo 7, 13, 25 mesi; quella decisa è 25)
--      e scrive una riga nel registro di manutenzione, come la pulizia degli
--      ordini (modi automatica, manuale, prova; freno o errore = niente
--      cancellato + riga nel registro).
--
-- ⚠️ OGGETTI GIÀ ONLINE CHE QUESTO FILE CAMBIA (la pulizia degli ordini del
-- 22/11, `sql/20261122_pulizia_automatica_1_struttura.sql`):
--   A. `manutenzione.pulizia_registro`: si AGGIUNGONO tre colonne, nient'altro:
--        `lavoro` (obbligatoria, predefinita 'pulizia_ordini': le righe di
--        oggi e quelle che la pulizia degli ordini scriverà la prendono da
--        sola), `soglia_mesi`, `righe_cancellate` (vuote per la pulizia degli
--        ordini). Nessuna colonna tolta o cambiata, nessun vincolo toccato.
--   B. `public.pulizia_stato()`: le due chiavi di oggi (`ultima`, `ultima_ok`)
--      restano con lo stesso contenuto, filtrate sul solo lavoro
--      'pulizia_ordini' (oggi tutte le righe lo sono); se ne aggiungono due
--      (`scelte_ultima`, `scelte_ultima_ok`) per il lavoro nuovo. Stessi
--      permessi. Il sito pubblicato legge solo le due chiavi di oggi.
--   La funzione `manutenzione.pulizia_ordini_mai_pagati` NON si tocca.
--
-- COSA NON FA: NON accende l'orologio della pulizia del registro (file 2).
--
-- SICUREZZA: tutto il file è una transazione.
-- ============================================================================

begin;

-- 1. Lo schema separato, chiuso.
create schema if not exists consensi;
revoke all on schema consensi from public, anon, authenticated;

-- 2. La tabella delle scelte.
create table if not exists consensi.scelte_banner (
  id              bigint generated always as identity primary key,
  scelto_il       timestamptz not null default now(),
  id_browser      uuid not null,
  versione_testo  text not null check (versione_testo ~ '^v[0-9]+$'),
  google          boolean not null,
  meta            boolean not null,
  adobe_fonts     boolean not null,
  azione          text not null check (azione in ('accetta_tutti', 'rifiuta_tutti', 'chiudi_x', 'personalizza')),
  origine         text not null check (origine in ('banner', 'preferenze'))
);
create index if not exists scelte_banner_browser_quando on consensi.scelte_banner (id_browser, scelto_il);
create index if not exists scelte_banner_quando on consensi.scelte_banner (scelto_il);
revoke all on table consensi.scelte_banner from public, anon, authenticated;
alter table consensi.scelte_banner enable row level security;

-- 3. L'unica via di scrittura, con i limiti.
create or replace function public.registra_scelta_banner(
  p_id_browser uuid, p_versione_testo text, p_google boolean, p_meta boolean,
  p_adobe_fonts boolean, p_azione text, p_origine text
)
returns text
language plpgsql
security definer set search_path = ''
as $$
declare
  v_n bigint;
begin
  if p_id_browser is null or p_versione_testo is null or p_google is null or p_meta is null
     or p_adobe_fonts is null or p_azione is null or p_origine is null then
    return 'rifiutata: dati mancanti';
  end if;

  -- Le scritture si mettono in fila: così i due limiti sono esatti anche con
  -- richieste che arrivano insieme.
  perform pg_advisory_xact_lock(hashtext('km_registro_scelte_banner'));

  select count(*) into v_n
  from consensi.scelte_banner
  where id_browser = p_id_browser and scelto_il > now() - interval '24 hours';
  if v_n >= 20 then
    return 'ignorata: limite per browser';
  end if;

  select count(*) into v_n
  from consensi.scelte_banner
  where scelto_il > now() - interval '1 minute';
  if v_n >= 120 then
    return 'ignorata: limite totale';
  end if;

  insert into consensi.scelte_banner (id_browser, versione_testo, google, meta, adobe_fonts, azione, origine)
  values (p_id_browser, p_versione_testo, p_google, p_meta, p_adobe_fonts, p_azione, p_origine);
  return 'scritta';
end;
$$;

revoke execute on function public.registra_scelta_banner(uuid, text, boolean, boolean, boolean, text, text) from public, anon, authenticated;
grant execute on function public.registra_scelta_banner(uuid, text, boolean, boolean, boolean, text, text) to service_role;

-- 4. Il registro di manutenzione si ALLARGA (oggetto già online, vedi A).
alter table manutenzione.pulizia_registro add column if not exists lavoro text not null default 'pulizia_ordini' check (lavoro in ('pulizia_ordini', 'pulizia_scelte_banner'));
alter table manutenzione.pulizia_registro add column if not exists soglia_mesi integer;
alter table manutenzione.pulizia_registro add column if not exists righe_cancellate bigint;

-- 5. La pulizia del registro delle scelte.
create or replace function consensi.pulisci_scelte_banner(p_mesi integer, p_modo text)
returns text
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_inizio constant timestamptz := clock_timestamp();
  v_soglia timestamptz;
  v_bersaglio bigint;
  v_cancellate bigint;
  v_residuo bigint;
  v_esito text;
  v_motivo text;
  v_stato text;
  v_messaggio text;
  v_id bigint;
begin
  if p_modo is null or p_modo not in ('automatica', 'manuale', 'prova') then
    raise exception 'Modo non valido: %. I modi ammessi sono automatica, manuale, prova. Nulla e'' stato toccato.',
      coalesce(p_modo, 'vuoto');
  end if;

  if p_mesi is null or p_mesi not in (7, 13, 25) then
    insert into manutenzione.pulizia_registro (lavoro, modo, soglia_mesi, esito, motivo, durata_ms)
    values (
      'pulizia_scelte_banner', p_modo, p_mesi, 'errore',
      format('Durata rifiutata: %s mesi. Sono ammessi solo 7, 13 o 25 mesi. Nulla e'' stato toccato.', coalesce(p_mesi::text, 'vuota')),
      (extract(epoch from clock_timestamp() - v_inizio) * 1000)::integer
    )
    returning id into v_id;
    return format('ERRORE — registro n. %s — durata %s mesi rifiutata: sono ammessi solo 7, 13 o 25 mesi. Nulla e'' stato toccato.',
      v_id, coalesce(p_mesi::text, 'vuota'));
  end if;

  v_soglia := now() - make_interval(months => p_mesi);

  if not pg_try_advisory_xact_lock(hashtext('km_pulizia_scelte_banner')) then
    insert into manutenzione.pulizia_registro (lavoro, modo, soglia_mesi, soglia_istante, esito, motivo, durata_ms)
    values (
      'pulizia_scelte_banner', p_modo, p_mesi, v_soglia, 'errore',
      'Un''altra pulizia del registro delle scelte e'' in corso. Nulla e'' stato toccato.',
      (extract(epoch from clock_timestamp() - v_inizio) * 1000)::integer
    )
    returning id into v_id;
    return format('ERRORE — registro n. %s — un''altra pulizia e'' in corso. Nulla e'' stato toccato.', v_id);
  end if;

  begin
    select count(*) into v_bersaglio from consensi.scelte_banner where scelto_il < v_soglia;

    delete from consensi.scelte_banner where scelto_il < v_soglia;
    get diagnostics v_cancellate = row_count;

    -- Controllo finale: niente resta oltre la soglia, e si è cancellato
    -- esattamente quanto contato.
    select count(*) into v_residuo from consensi.scelte_banner where scelto_il < v_soglia;
    if v_residuo <> 0 or v_cancellate <> v_bersaglio then
      raise exception 'Controllo finale fallito: contate %, cancellate %, rimaste oltre la soglia %. Nulla e'' stato scritto.',
        v_bersaglio, v_cancellate, v_residuo;
    end if;

    if p_modo = 'prova' then raise exception using errcode = 'KMP01', message = 'Prova: tutto il lavoro e'' stato annullato.';
    end if;

    v_esito := 'ok';
  exception
    when sqlstate 'KMP01' then v_esito := 'prova';
    when others then v_esito := 'errore';
      get stacked diagnostics v_stato = returned_sqlstate, v_messaggio = message_text;
      v_motivo := left(v_stato || ': ' || v_messaggio, 1000);
  end;

  insert into manutenzione.pulizia_registro (lavoro, modo, soglia_mesi, soglia_istante, esito, motivo, righe_cancellate, durata_ms)
  values (
    'pulizia_scelte_banner', p_modo, p_mesi, v_soglia, v_esito, v_motivo,
    case when v_esito in ('ok', 'prova') then v_cancellate end,
    (extract(epoch from clock_timestamp() - v_inizio) * 1000)::integer
  )
  returning id into v_id;

  return format('%s — registro n. %s — lavoro pulizia_scelte_banner, durata %s mesi, modo %s — righe cancellate %s%s',
    upper(v_esito), v_id, p_mesi, p_modo,
    coalesce(case when v_esito in ('ok', 'prova') then v_cancellate end::text, '-'),
    case when v_motivo is not null then ' — ' || v_motivo else '' end);
end;
$$;

revoke execute on function consensi.pulisci_scelte_banner(integer, text) from public, anon, authenticated;

-- 6. Lo stato per il pannello (oggetto già online, vedi B): le due chiavi di
--    oggi, con lo stesso contenuto, sul solo lavoro pulizia_ordini; più le due
--    del lavoro nuovo.
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
      where r.modo in ('automatica', 'manuale') and r.lavoro = 'pulizia_ordini'
      order by r.eseguita_il desc, r.id desc
      limit 1
    ),
    'ultima_ok', (
      select jsonb_build_object('eseguita_il', r.eseguita_il, 'modo', r.modo)
      from manutenzione.pulizia_registro r
      where r.modo in ('automatica', 'manuale') and r.esito = 'ok' and r.lavoro = 'pulizia_ordini'
      order by r.eseguita_il desc, r.id desc
      limit 1
    ),
    'scelte_ultima', (
      select jsonb_build_object('eseguita_il', r.eseguita_il, 'esito', r.esito, 'modo', r.modo)
      from manutenzione.pulizia_registro r
      where r.modo in ('automatica', 'manuale') and r.lavoro = 'pulizia_scelte_banner'
      order by r.eseguita_il desc, r.id desc
      limit 1
    ),
    'scelte_ultima_ok', (
      select jsonb_build_object('eseguita_il', r.eseguita_il, 'modo', r.modo)
      from manutenzione.pulizia_registro r
      where r.modo in ('automatica', 'manuale') and r.esito = 'ok' and r.lavoro = 'pulizia_scelte_banner'
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
-- ============================================================================
