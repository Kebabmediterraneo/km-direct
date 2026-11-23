-- ============================================================================
-- REGISTRO DELLE SCELTE DEL BANNER — 5. CANCELLAZIONE DELLE RIGHE DI PROVA
-- (§65b E4, 23/11/2026). Lo lancia ANDREA nell'editor SQL, alla fine delle
-- prove dal vivo. ⚠️ CANCELLA RIGHE.
-- ============================================================================
--
-- Toglie SOLO le righe scritte dai browser di prova, indicate per
-- identificativo (il «Codice della tua scelta» letto in «Preferenze cookie»
-- durante le prove). Si scrivono al posto degli zeri, uno per riga
-- dell'elenco; se i browser di prova sono di più, si aggiungono righe.
--
-- REFERTO ATTESO: l'elenco delle righe tolte (identificativo, data, azione).
-- Il loro numero deve essere quello contato con la SELECT di controllo prima
-- (righe_scelte), se nel frattempo nessun cliente vero ha scritto.
-- ============================================================================
delete from consensi.scelte_banner
where id_browser = any (array[
  '00000000-0000-0000-0000-000000000000'
]::uuid[])
returning id_browser, scelto_il, azione, origine;
