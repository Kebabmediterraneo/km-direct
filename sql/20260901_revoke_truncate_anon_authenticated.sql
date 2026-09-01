-- ============================================================================
-- TOGLIE IL PERMESSO `TRUNCATE` AI DUE RUOLI PUBBLICI
-- (§66, "Cio' che governa il progetto e non sta in nessun file", v63).
-- Decisione di Andrea del 01/09/2026.
-- ============================================================================
--
-- COSA FA (anche per chi non conosce SQL):
--   Toglie ai due ruoli pubblici — `anon`, con cui il browser dei clienti
--   legge il menu, e `authenticated`, quello di chi ha fatto il login — il
--   permesso di SVUOTARE di colpo una tabella (`TRUNCATE`). Lo toglie su
--   `products` e sulle otto tabelle che la referenziano, perche' una svuotata
--   "a cascata" le porterebbe via insieme.
--
-- COSA NON TOCCA, E PERCHE':
--   * `SELECT` — resta. E' come il menu arriva ai clienti: toglierlo
--     spegnerebbe il sito. Un POST-CHECK verifica che sia rimasto identico.
--   * `REFERENCES`, `TRIGGER`, `MAINTAIN` — restano. Sono il predefinito di
--     Supabase, non sono esercitabili attraverso l'API pubblica, e cambiarli
--     senza motivo e' piu' rischioso che lasciarli.
--     ⚠️ Su `MAINTAIN` non c'e' alcun controllo qui dentro, ed e' voluto: e'
--     un permesso che esiste solo dalle versioni recenti di PostgreSQL, e una
--     verifica che va in errore sulle altre sarebbe un difetto, non una rete.
--     Una `revoke` che nomina la sola `truncate` non puo' toccarlo: la
--     garanzia sta nella forma del comando, non in un controllo.
--   * i ruoli `postgres` e `service_role` — restano interi. `service_role` e'
--     quello con cui il server scrive: togliergli qualcosa romperebbe il
--     pannello staff. Un POST-CHECK verifica che abbia ancora `TRUNCATE`.
--
-- ⚠️ QUELLO CHE QUESTO FILE NON CHIUDE — LA PORTA DEL FUTURO.
--   Il quadro misurato il 01/09/2026 dice che questo permesso NON e' stato
--   concesso per sbaglio: e' la configurazione predefinita di Supabase, uguale
--   per `anon` e `authenticated`. Se quel predefinito e' scritto anche come
--   "permesso predefinito per le tabelle che verranno create in futuro"
--   (`alter default privileges`), allora una tabella nuova NASCEREBBE con lo
--   stesso permesso, e questo file avrebbe chiuso il caso di oggi lasciando
--   aperta la stessa porta domani.
--   ⚠️ IL REPOSITORY NON PUO' DIRLO: cercate `default privileges`,
--   `pg_default_acl` e `defaclacl` in tutti i file, danno ZERO. Questo file
--   quindi NON tocca i permessi predefiniti: li MISURA soltanto, nella riga
--   30 del referto in fondo. Se li' compare `TRUNCATE`, serve una seconda
--   migrazione, ed e' una decisione di Andrea, non una conseguenza automatica.
--
-- SICUREZZA:
--   Tutto e' avvolto in una transazione (begin ... commit) con controlli
--   bloccanti: se anche uno solo non torna, viene sollevato un errore e NULLA
--   viene scritto. Non esiste lo stato "a meta'".
--   L'elenco delle nove tabelle e quello dei due ruoli sono dichiarati UNA
--   VOLTA e percorsi in ciclo, sia dalle revoche sia dai controlli: cosi' non
--   possono divergere fra loro (stessa scelta dello script del go-live).
--
-- COME SI ESEGUE:
--   Si incolla tutto nel SQL editor di Supabase e si preme Run.
--   ⚠️ IL REFERTO IN FONDO DEVE AVERE ESATTAMENTE 29 RIGHE.
--   Se ne arrivano meno, e' l'editor che taglia: le ultime righe NON sono
--   state lette, e non vanno considerate "a posto".
--   L'editor mostra solo l'ultima istruzione, ed e' per questo che il referto
--   sta in fondo e non in mezzo.
-- ============================================================================

begin;

do $$
declare
  -- ==========================================================================
  -- `products` piu' le OTTO tabelle che la referenziano (km_direct_schema.sql,
  -- righe 151, 164, 172, 183, 211, 220, 238, 339). Sono le stesse otto delle
  -- righe 30-37 del referto letto da Andrea il 01/09/2026.
  -- ==========================================================================
  v_tabelle constant text[] := array[
    'products',
    'product_choice_options',
    'product_removals',
    'product_addons',
    'product_accompaniments',
    'combo_drink_options',
    'combo_pricing',
    'product_allergens',
    'order_items'
  ];

  -- I due ruoli pubblici, quelli a cui si toglie il permesso.
  v_ruoli constant text[] := array['anon', 'authenticated'];

  -- I due ruoli che questo file non deve toccare, verificati dal POST-CHECK 4.
  v_ruoli_intoccabili constant text[] := array['postgres', 'service_role'];

  -- Fotografia dei permessi che NON devono cambiare, letta prima di agire.
  v_select_prima     boolean[] := array[]::boolean[];
  v_references_prima boolean[] := array[]::boolean[];
  v_trigger_prima    boolean[] := array[]::boolean[];

  v_truncate_prima   integer := 0;
  v_residuo          integer := 0;
  v_revocate         integer := 0;

  v_i        integer;
  v_j        integer;
  v_k        integer;
  v_tab      text;
  v_ruolo    text;
  v_nome     text;
begin

  -- ==========================================================================
  -- PRE-CHECK BLOCCANTI
  -- ==========================================================================

  -- PRE-CHECK 1 — le nove tabelle esistono tutte.
  foreach v_tab in array v_tabelle loop
    if to_regclass('public.' || quote_ident(v_tab)) is null then
      raise exception
        'FERMO — la tabella `public.%` non esiste. L''elenco in cima a questo file non corrisponde al database: fermarsi e guardare, invece di togliere l''elenco la voce che da'' fastidio. Non e'' stato revocato nulla.',
        v_tab;
    end if;
  end loop;

  -- PRE-CHECK 2 — i quattro ruoli nominati esistono davvero.
  foreach v_ruolo in array v_ruoli || v_ruoli_intoccabili loop
    if not exists (select 1 from pg_roles where rolname = v_ruolo) then
      raise exception
        'FERMO — il ruolo `%` non esiste su questo database. Questo file e'' scritto per i ruoli di Supabase: se il nome e'' un altro, va corretto qui dentro dopo averlo letto, non indovinato. Non e'' stato revocato nulla.',
        v_ruolo;
    end if;
  end loop;

  -- ==========================================================================
  -- FOTOGRAFIA PRIMA — i permessi che devono restare identici.
  -- Si legge adesso per confrontarla dopo: una fotografia rifatta dopo il
  -- cambiamento coincide sempre e non dimostra piu' nulla (lezione `af`).
  -- ==========================================================================
  for v_i in 1 .. array_length(v_tabelle, 1) loop
    v_nome := 'public.' || quote_ident(v_tabelle[v_i]);
    for v_j in 1 .. array_length(v_ruoli, 1) loop
      v_select_prima     := array_append(v_select_prima,
                              has_table_privilege(v_ruoli[v_j], v_nome, 'SELECT'));
      v_references_prima := array_append(v_references_prima,
                              has_table_privilege(v_ruoli[v_j], v_nome, 'REFERENCES'));
      v_trigger_prima    := array_append(v_trigger_prima,
                              has_table_privilege(v_ruoli[v_j], v_nome, 'TRIGGER'));
      if has_table_privilege(v_ruoli[v_j], v_nome, 'TRUNCATE') then
        v_truncate_prima := v_truncate_prima + 1;
      end if;
    end loop;
  end loop;

  raise notice 'PRIMA: % coppie tabella+ruolo su % hanno TRUNCATE.',
    v_truncate_prima,
    array_length(v_tabelle, 1) * array_length(v_ruoli, 1);

  -- ==========================================================================
  -- LA REVOCA — una istruzione per ogni coppia tabella+ruolo, generata dai due
  -- elenchi dichiarati sopra. Nomina la sola `truncate`: nessun altro permesso
  -- puo' essere toccato da un comando che non lo nomina.
  -- ==========================================================================
  for v_i in 1 .. array_length(v_tabelle, 1) loop
    for v_j in 1 .. array_length(v_ruoli, 1) loop
      execute format('revoke truncate on table public.%I from %I',
                     v_tabelle[v_i], v_ruoli[v_j]);
      v_revocate := v_revocate + 1;
    end loop;
  end loop;

  raise notice 'Eseguite % revoche (% tabelle x % ruoli).',
    v_revocate, array_length(v_tabelle, 1), array_length(v_ruoli, 1);

  -- ==========================================================================
  -- POST-CHECK BLOCCANTI
  -- ==========================================================================

  -- POST-CHECK 1 — nessuna delle due parti pubbliche puo' piu' truncare.
  -- ⚠️ Questo controllo puo' fallire davvero, e la causa piu' probabile e'
  -- istruttiva: se il permesso fosse stato concesso al gruppo `PUBLIC` invece
  -- che ai due ruoli per nome, revocarlo per nome non lo toglierebbe, e questo
  -- controllo se ne accorgerebbe annullando tutto. Meglio un arresto rumoroso
  -- che un file che dichiara di aver chiuso una porta rimasta aperta.
  for v_i in 1 .. array_length(v_tabelle, 1) loop
    v_nome := 'public.' || quote_ident(v_tabelle[v_i]);
    for v_j in 1 .. array_length(v_ruoli, 1) loop
      if has_table_privilege(v_ruoli[v_j], v_nome, 'TRUNCATE') then
        v_residuo := v_residuo + 1;
      end if;
    end loop;
  end loop;

  if v_residuo <> 0 then
    raise exception
      'POST-CHECK 1 fallito: dopo le revoche restano % coppie tabella+ruolo che possono ancora eseguire TRUNCATE. Il permesso non arriva dai due ruoli per nome — il caso tipico e'' una concessione al gruppo PUBLIC, che si revoca in un altro modo. Transazione annullata, nulla e'' stato scritto.',
      v_residuo;
  end if;

  -- POST-CHECK 2, 3 — SELECT, REFERENCES e TRIGGER sono rimasti identici alla
  -- fotografia. E' il controllo che si accorge di cio' che e' cambiato IN PIU':
  -- una `revoke` che nomina la sola `truncate` non dovrebbe poterli toccare, e
  -- se un giorno qualcuno allargasse il comando qui dentro, questo si accorge.
  v_k := 0;
  for v_i in 1 .. array_length(v_tabelle, 1) loop
    v_nome := 'public.' || quote_ident(v_tabelle[v_i]);
    for v_j in 1 .. array_length(v_ruoli, 1) loop
      v_k := v_k + 1;

      if has_table_privilege(v_ruoli[v_j], v_nome, 'SELECT') <> v_select_prima[v_k] then
        raise exception
          'POST-CHECK 2 fallito: il permesso SELECT di `%` su `%` e'' cambiato. E'' come il menu arriva ai clienti e non doveva essere toccato. Transazione annullata, nulla e'' stato scritto.',
          v_ruoli[v_j], v_tabelle[v_i];
      end if;

      if has_table_privilege(v_ruoli[v_j], v_nome, 'REFERENCES') <> v_references_prima[v_k]
         or has_table_privilege(v_ruoli[v_j], v_nome, 'TRIGGER') <> v_trigger_prima[v_k] then
        raise exception
          'POST-CHECK 3 fallito: REFERENCES o TRIGGER di `%` su `%` sono cambiati. Questo file doveva toccare la sola TRUNCATE. Transazione annullata, nulla e'' stato scritto.',
          v_ruoli[v_j], v_tabelle[v_i];
      end if;
    end loop;
  end loop;

  -- POST-CHECK 4 — i ruoli del server sono intatti. Se `service_role` perdesse
  -- TRUNCATE il pannello staff resterebbe in piedi lo stesso, ma il segnale
  -- sarebbe che questo file ha colpito piu' largo di quanto dichiara.
  foreach v_ruolo in array v_ruoli_intoccabili loop
    for v_i in 1 .. array_length(v_tabelle, 1) loop
      v_nome := 'public.' || quote_ident(v_tabelle[v_i]);
      if not has_table_privilege(v_ruolo, v_nome, 'TRUNCATE') then
        raise exception
          'POST-CHECK 4 fallito: il ruolo `%` non ha piu'' TRUNCATE su `%`. Questo file non deve toccare i ruoli del server. Transazione annullata, nulla e'' stato scritto.',
          v_ruolo, v_tabelle[v_i];
      end if;
    end loop;
  end loop;

  raise notice 'POST-CHECK superati. TRUNCATE tolto a % e % su tutte e % le tabelle; SELECT, REFERENCES e TRIGGER invariati; % e % intatti.',
    v_ruoli[1], v_ruoli[2], array_length(v_tabelle, 1),
    v_ruoli_intoccabili[1], v_ruoli_intoccabili[2];

  raise notice 'DA GUARDARE NEL REFERTO QUI SOTTO: la riga 30 dice se le TABELLE NUOVE nascerebbero ancora con questo permesso.';

end $$;

commit;

-- ============================================================================
-- REFERTO DI SOLA LETTURA — rilegge i permessi DOPO le revoche.
-- ⚠️ DEVE AVERE ESATTAMENTE 29 RIGHE: 18 (9 tabelle x 2 ruoli pubblici)
--    + 9 (service_role) + 1 (permessi predefiniti) + 1 (verdetto).
--    Se ne arrivano meno, e' troncato e le ultime NON sono state lette.
-- ============================================================================
with t(tabella) as (
  values ('products'),
         ('product_choice_options'),
         ('product_removals'),
         ('product_addons'),
         ('product_accompaniments'),
         ('combo_drink_options'),
         ('combo_pricing'),
         ('product_allergens'),
         ('order_items')
),
r(ruolo) as (
  values ('anon'), ('authenticated')
)
select 10 as ord,
       'i due ruoli pubblici — atteso: TRUNCATE no, SELECT SI' as sezione,
       r.ruolo || ' su ' || t.tabella as misura,
       case when has_table_privilege(r.ruolo, 'public.' || quote_ident(t.tabella), 'TRUNCATE')
            then 'ATTENZIONE - ancora SI' else 'no' end as truncate_adesso,
       case when has_table_privilege(r.ruolo, 'public.' || quote_ident(t.tabella), 'SELECT')
            then 'SI' else 'ATTENZIONE - NO' end as select_adesso
  from t cross join r
union all
select 20,
       'service_role — non doveva essere toccato, atteso SI',
       'service_role su ' || t.tabella,
       case when has_table_privilege('service_role', 'public.' || quote_ident(t.tabella), 'TRUNCATE')
            then 'SI' else 'ATTENZIONE - NO' end,
       '-'
  from t
union all
select 30,
       'LA PORTA DEL FUTURO — le tabelle che verranno create dopo',
       'permessi predefiniti sulle tabelle nuove dello schema public',
       coalesce(
         (select string_agg(distinct
                   (case when a.grantee = 0 then 'PUBLIC'
                         else a.grantee::regrole::text end) || '=' || a.privilege_type,
                   '; ')
            from pg_default_acl d, aclexplode(d.defaclacl) a
           where d.defaclnamespace = 'public'::regnamespace
             and d.defaclobjtype = 'r'),
         'nessun permesso predefinito impostato'),
       'se qui compare TRUNCATE per anon o authenticated, una tabella nuova nascera con lo stesso difetto'
union all
select 40,
       'VERDETTO',
       'coppie tabella+ruolo pubblico che possono ancora truncare',
       (select count(*)::text
          from t cross join r
         where has_table_privilege(r.ruolo, 'public.' || quote_ident(t.tabella), 'TRUNCATE')),
       'deve essere 0'
order by ord, misura;
