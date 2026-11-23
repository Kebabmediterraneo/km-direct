-- ============================================================================
-- REGISTRO DELLE SCELTE DEL BANNER — 2. ACCENSIONE DELL'OROLOGIO DELLA PULIZIA
-- (§65b E4, 23/11/2026). Lo lancia ANDREA nell'editor SQL, solo quando le
-- prove precedenti sono andate bene.
-- ============================================================================
--
-- Un secondo lavoro notturno, SEPARATO dalla pulizia degli ordini: ogni notte
-- alle 23:11 UTC (00:11 in inverno, 01:11 d'estate, ora italiana) cancella le
-- righe del registro delle scelte più vecchie di 25 mesi e scrive una riga
-- nel registro di manutenzione (lavoro 'pulizia_scelte_banner').
--
-- REFERTO ATTESO: una riga con un numero (il `jobid` di questo orologio, diverso
-- da quello della pulizia degli ordini, che è 1).
--
-- PER SPEGNERLO (solo in caso di necessità, e dicendolo):
--     select cron.unschedule('km-pulizia-scelte-banner');
-- ============================================================================
select cron.schedule(
  'km-pulizia-scelte-banner',
  '11 23 * * *',
  $$select consensi.pulisci_scelte_banner(25, 'automatica')$$
);
