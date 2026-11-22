-- ============================================================================
-- PULIZIA AUTOMATICA — 4. ACCENSIONE DELL'OROLOGIO
-- (§69, 22/11/2026). Lo lancia ANDREA nell'editor SQL, SOLO quando tutte le
-- prove precedenti sono andate bene.
-- ============================================================================
--
-- Da questo momento, OGNI NOTTE alle 23:01 UTC (00:01 in inverno, 01:01
-- d'estate, ora italiana), il database lancia da solo:
--     select manutenzione.pulizia_ordini_mai_pagati(28, 'automatica');
-- e la funzione scrive una riga nel registro, qualunque cosa succeda.
--
-- Richiede l'estensione pg_cron accesa (passo 1 dei passi di Andrea).
--
-- REFERTO ATTESO: una riga con un numero (il `jobid` dell'orologio).
-- Se il nome esiste già, pg_cron aggiorna quello esistente invece di crearne
-- un secondo: lanciarlo due volte non raddoppia la pulizia.
--
-- PER SPEGNERLO (solo in caso di necessità, e dicendolo):
--     select cron.unschedule('km-pulizia-ordini-mai-pagati');
-- ============================================================================
select cron.schedule(
  'km-pulizia-ordini-mai-pagati',
  '1 23 * * *',
  $$select manutenzione.pulizia_ordini_mai_pagati(28, 'automatica')$$
);
