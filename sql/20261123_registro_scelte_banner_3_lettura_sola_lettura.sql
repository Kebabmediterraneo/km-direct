-- ============================================================================
-- REGISTRO DELLE SCELTE DEL BANNER — 3. LETTURA PER DIMOSTRARE UN CONSENSO
-- (SOLA LETTURA, §65b E4, 23/11/2026). Non scrive niente.
-- ============================================================================
--
-- Il cliente legge il «Codice della tua scelta» in «Preferenze cookie» e ce lo
-- dà. Qui si scrive al posto degli zeri, una volta sola.
-- Il testo della versione (colonna versione_testo) è in docs/banner/<versione>.md.
-- (23/11/2026, file 7) La scelta su Adobe non si registra più.
-- Referto: tutte le scelte di quel browser, dalla più vecchia; vuoto se il
-- codice non c'è o se le righe sono più vecchie di 25 mesi (cancellate).
-- ============================================================================
select scelto_il at time zone 'Europe/Rome' as quando_ora_italiana,
       versione_testo, azione, origine, google, meta
from consensi.scelte_banner
where id_browser = '00000000-0000-0000-0000-000000000000'   -- il codice indicato dal cliente
order by scelto_il;
