-- ============================================================================
-- REGISTRO DELLE SCELTE DEL BANNER — 7. SENZA LA SCELTA SU ADOBE FONTS
-- (§65b, decisione 21a di Andrea, 23/11/2026). Lo lancia ANDREA nell'editor SQL.
-- ============================================================================
--
-- PERCHÉ: la scelta sul carattere del marchio non serve a dimostrare nessun
-- consenso (Adobe Fonts è a legittimo interesse): il registro non la salva più.
--
-- OGGETTI GIÀ ONLINE CHE QUESTO FILE CAMBIA:
--   A. `consensi.scelte_banner`: si TOGLIE la colonna `adobe_fonts`.
--      ⚠️ Prima si controlla che la tabella sia VUOTA: se c'è anche una sola
--      riga il file si ferma e non tocca niente.
--   B. `public.registra_scelta_banner`: la versione a 7 parametri (con
--      p_adobe_fonts) si TOGLIE e si ricrea a 6. Il corpo è quello del file 6
--      con Adobe tolta in tre punti: stessi controlli, stessi limiti (20 per
--      codice nelle 24 ore, 120 al minuto), stessa regola «solo consensi e
--      revoche», stessa protezione, stessi permessi.
--      Nessuno chiama la versione vecchia: il banner non è pubblicato.
-- NON TOCCA: la funzione di pulizia (25 mesi), l'orologio, il registro di
-- manutenzione, pulizia_stato(), la pulizia degli ordini.
--
-- SICUREZZA: tutto il file è una transazione.
-- REFERTO ATTESO: «Success. No rows returned». Se compare «FERMO: …» la
-- tabella non era vuota e non è cambiato niente.
-- ============================================================================

begin;

-- 0. Il freno: si procede solo con la tabella vuota.
do $$
begin
  if exists (select 1 from consensi.scelte_banner) then
    raise exception 'FERMO: consensi.scelte_banner non e'' vuota. Togliere la colonna cancellerebbe dati veri. Nulla e'' stato toccato.';
  end if;
end $$;

-- A. La colonna.
alter table consensi.scelte_banner drop column adobe_fonts;

-- B. La funzione di scrittura, da 7 a 6 parametri.
drop function public.registra_scelta_banner(uuid, text, boolean, boolean, boolean, text, text);

create function public.registra_scelta_banner(
  p_id_browser uuid, p_versione_testo text, p_google boolean, p_meta boolean,
  p_azione text, p_origine text
)
returns text
language plpgsql
security definer set search_path = ''
as $$
declare
  v_n bigint;
  v_ultima_con_consenso boolean;
begin
  if p_id_browser is null or p_versione_testo is null or p_google is null or p_meta is null or p_azione is null or p_origine is null then
    return 'rifiutata: dati mancanti';
  end if;

  -- Le scritture si mettono in fila: così i due limiti sono esatti anche con
  -- richieste che arrivano insieme.
  perform pg_advisory_xact_lock(hashtext('km_registro_scelte_banner'));

  -- (decisioni 15a e 18, 23/11/2026) SOLO CONSENSI E REVOCHE. Una riga senza
  -- consensi passa solo se l'ultima riga di questo codice aveva almeno un
  -- consenso: è una revoca. Un rifiuto puro, o una seconda revoca di fila, non
  -- si scrive. ⚠️ «is not true» e non «= false»: senza righe precedenti il
  -- valore è NULL, e anche quello va rifiutato.
  if not (p_google or p_meta) then
    select (s.google or s.meta) into v_ultima_con_consenso
    from consensi.scelte_banner s
    where s.id_browser = p_id_browser
    order by s.scelto_il desc, s.id desc
    limit 1;
    if v_ultima_con_consenso is not true then
      return 'ignorata: nessun consenso da revocare';
    end if;
  end if;

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

  insert into consensi.scelte_banner (id_browser, versione_testo, google, meta, azione, origine)
  values (p_id_browser, p_versione_testo, p_google, p_meta, p_azione, p_origine);
  return 'scritta';
end;
$$;

revoke execute on function public.registra_scelta_banner(uuid, text, boolean, boolean, text, text) from public, anon, authenticated;
grant execute on function public.registra_scelta_banner(uuid, text, boolean, boolean, text, text) to service_role;

commit;
