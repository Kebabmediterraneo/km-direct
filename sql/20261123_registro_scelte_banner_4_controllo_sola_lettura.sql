-- ============================================================================
-- REGISTRO DELLE SCELTE DEL BANNER — 4. CONTROLLO (SOLA LETTURA)
-- (§65b E4, 23/11/2026). Non scrive niente. Si lancia dopo il file 1, e di
-- nuovo quando serve.
-- ============================================================================
--
-- Referto atteso: UNA riga.
--   oggetti creati (schema, tabella, due funzioni, tre colonne nuove) → true;
--   permessi: anon e authenticated → false ovunque; service_role → true solo
--   su registra_scelta_banner e pulizia_stato;
--   righe_registro_senza_lavoro_ordini → 0 (le righe di oggi della pulizia
--   degli ordini hanno preso lavoro = 'pulizia_ordini');
--   regola_revoca_attiva → true dopo il file 6 (false prima);
--   stato_pannello → il json di pulizia_stato(): «ultima» e «ultima_ok» come
--   prima, più «scelte_ultima» e «scelte_ultima_ok» (vuote finché il lavoro
--   nuovo non gira).
-- ============================================================================
select
  to_regnamespace('consensi') is not null                                                         as schema_creato,
  to_regclass('consensi.scelte_banner') is not null                                                as tabella_creata,
  to_regprocedure('public.registra_scelta_banner(uuid,text,boolean,boolean,boolean,text,text)') is not null as scrittura_creata,
  to_regprocedure('consensi.pulisci_scelte_banner(integer,text)') is not null                     as pulizia_creata,
  (select count(*) from information_schema.columns
    where table_schema = 'manutenzione' and table_name = 'pulizia_registro'
      and column_name in ('lavoro', 'soglia_mesi', 'righe_cancellate'))                             as colonne_nuove_registro,
  has_function_privilege('anon', 'public.registra_scelta_banner(uuid,text,boolean,boolean,boolean,text,text)', 'execute')          as scrittura_anon,
  has_function_privilege('authenticated', 'public.registra_scelta_banner(uuid,text,boolean,boolean,boolean,text,text)', 'execute') as scrittura_authenticated,
  has_function_privilege('service_role', 'public.registra_scelta_banner(uuid,text,boolean,boolean,boolean,text,text)', 'execute')  as scrittura_service_role,
  has_function_privilege('anon', 'consensi.pulisci_scelte_banner(integer,text)', 'execute')          as pulizia_anon,
  has_function_privilege('authenticated', 'consensi.pulisci_scelte_banner(integer,text)', 'execute') as pulizia_authenticated,
  has_schema_privilege('anon', 'consensi', 'usage')                                                as schema_anon,
  has_schema_privilege('authenticated', 'consensi', 'usage')                                       as schema_authenticated,
  has_function_privilege('anon', 'public.pulizia_stato()', 'execute')                              as stato_anon,
  has_function_privilege('service_role', 'public.pulizia_stato()', 'execute')                      as stato_service_role,
  (select count(*) from manutenzione.pulizia_registro where lavoro <> 'pulizia_ordini')            as righe_registro_senza_lavoro_ordini,
  (select count(*) from consensi.scelte_banner)                                                    as righe_scelte,
  -- (23/11/2026, file 6) true se la funzione di scrittura ha la regola «solo consensi e revoche».
  pg_get_functiondef('public.registra_scelta_banner(uuid,text,boolean,boolean,boolean,text,text)'::regprocedure)
    like '%nessun consenso da revocare%'                                                          as regola_revoca_attiva,
  public.pulizia_stato()                                                                           as stato_pannello;
