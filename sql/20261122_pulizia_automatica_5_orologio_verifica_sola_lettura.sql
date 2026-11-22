-- ============================================================================
-- PULIZIA AUTOMATICA — 5. VERIFICA DELL'OROLOGIO (SOLA LETTURA)
-- (§69, 22/11/2026). Lo lancia ANDREA nell'editor SQL. Non scrive niente.
-- ============================================================================
--
-- Due letture:
--   A) l'orologio esiste ed è acceso. Referto atteso: UNA riga, con
--      jobname 'km-pulizia-ordini-mai-pagati', schedule '1 23 * * *',
--      il comando con (28, 'automatica') e active = true;
--   B) le ultime esecuzioni dell'orologio (da guardare la mattina dopo).
--      Prima della prima notte il referto è vuoto. Dopo: status 'succeeded'
--      (vuol dire solo che la chiamata è partita e finita: l'esito vero
--      della pulizia sta nel registro, file 3).
--      Lanciare le due SELECT una alla volta: l'editor mostra il risultato
--      dell'ultima.
-- ============================================================================

-- A) L'orologio.
select jobid, jobname, schedule, command, active
from cron.job
where jobname = 'km-pulizia-ordini-mai-pagati';

-- B) Le ultime esecuzioni dell'orologio (le più recenti in alto).
select d.runid, d.status, d.start_time, d.end_time, d.return_message
from cron.job_run_details d
join cron.job j on j.jobid = d.jobid
where j.jobname = 'km-pulizia-ordini-mai-pagati'
order by d.start_time desc
limit 5;
