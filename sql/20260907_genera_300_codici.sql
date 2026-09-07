-- ============================================================================
-- LA GENERAZIONE DEI 300 CODICI SCONTO
-- Pezzo 5 dei codici sconto. Decisioni di Andrea del 07/09/2026.
-- ============================================================================
--
-- COSA FA (anche per chi non conosce SQL):
--   Fabbrica 300 codici sconto e li scrive in `coupons`: 100 per ciascuna delle
--   tre serie. Ogni codice porta la propria regola nelle colonne della sua riga,
--   e il sito la legge da li' — non c'e' nessuna regola scritta nel codice del
--   sito, ed e' il motivo per cui una serie nuova, domani, non richiedera' di
--   toccare una riga di programma.
--
-- ⚠️⚠️ QUESTO FILE SI ESEGUE UNA VOLTA SOLA.
--   Non e' una migrazione che si puo' rifare: la seconda esecuzione trova la
--   tabella piena e si ferma da sola (PRE-CHECK 1). E' anche il motivo per cui
--   la lettura dei codici sta in un ALTRO file: quello si rilegge quando si
--   vuole, e chi vuole solo guardare non deve aprire il file che scrive.
--
-- LE TRE SERIE, come da decisione:
--   A   5 euro fissi, ma solo su ordini da almeno 25 euro
--   B   10 per cento, nessuna soglia
--   C   20 per cento, nessuna soglia
--   ⚠️ NESSUN TETTO sulle percentuali, e NESSUNA SCADENZA: sono decisioni gia'
--   prese e registrate. Un codice al 20 per cento su un ordine da 150 euro
--   sconta 30 euro, e va bene cosi'.
--   ⚠️ `valid_from` e `valid_until` restano VUOTE, ed e' cosi' che si dice "non
--   scade": la tabella prevede le date, questi codici non le usano.
--
-- ⚠️ CENTO PER SERIE E NON DUECENTO. Decisione di Andrea: si comincia con meno
--   per poter cambiare idea. Questi codici non scadono, quindi restano in giro
--   per sempre — e trecento gia' dati via non si richiamano indietro.
--
-- ---------------------------------------------------------------------------
-- ⚠️ NESSUN CODICE DICE A QUALE SERIE APPARTIENE
-- ---------------------------------------------------------------------------
-- Niente prefissi, niente lettere iniziali diverse, niente lunghezze diverse.
-- Chi riceve un codice da 10 per cento non deve poter capire che ne esistono da
-- 20: da un prefisso lo capirebbe in un pomeriggio, e comincerebbe a provare.
-- ⚠️ Conseguenza da sapere: **la serie di un codice si riconosce solo dalla sua
-- regola** — importo, percentuale, soglia — e non dal suo nome. E' cosi' che la
-- riconosce il file che li estrae, ed e' l'unico modo giusto: si identifica dal
-- dato che caratterizza, mai dalla forma.
--
-- ---------------------------------------------------------------------------
-- L'ALFABETO, E PERCHE' E' SCRITTO DUE VOLTE
-- ---------------------------------------------------------------------------
-- Trentadue caratteri: le ventisei lettere maiuscole meno `O` e `I`, le dieci
-- cifre meno `0` e `1`. Sono le coppie che si confondono quando un codice si
-- detta al telefono o si copia da un foglio scritto a mano.
-- ⚠️ La `L` resta: una `L` maiuscola non somiglia a niente. E' la `l` minuscola
-- a somigliare a `1`, e nei codici di minuscole non ce ne sono.
--
-- ⚠️ LO STESSO IDENTICO ALFABETO VIVE ANCHE IN `lib/coupon-code.js`, e la copia
-- e' INEVITABILE: un file SQL non puo' importare un modulo JavaScript. Non e'
-- una svista e non e' pigrizia — e per questo esiste una prova, in
-- `tests/checkout-coupon-field.test.mjs`, che legge QUESTO file e pretende che i
-- due alfabeti coincidano carattere per carattere. Chi ne cambia uno solo la fa
-- diventare rossa.
--
-- ---------------------------------------------------------------------------
-- I DOPPIONI, E PERCHE' NON BASTA SPERARE
-- ---------------------------------------------------------------------------
-- Sei caratteri su trentadue fanno 1.073.741.824 combinazioni, e trecento
-- codici su un miliardo si scontrano molto di rado — circa una volta su
-- ventiquattromila generazioni. **Ma "molto di rado" non e' "mai".**
--
-- ⚠️ E il modo in cui fallirebbe e' il peggiore: il database rifiuterebbe il
-- codice doppione per via dell'unicita' sulla colonna, e resterebbero 299 righe
-- invece di 300 **senza che nessuno se ne accorga**. Percio' qui non si generano
-- trecento codici sperando che siano distinti: si generano finche' non ne sono
-- entrati davvero cento per serie, contando quelli che il database ACCETTA e non
-- quelli che si provano.
-- ⚠️ E c'e' un tetto ai tentativi: un ciclo che non puo' finire e' peggio di un
-- errore. Se lo supera si ferma e lo dice.
--
-- COSA NON TOCCA:
--   Nessun'altra tabella. Non tocca `coupon_redemptions`, non tocca
--   `promo_redemptions`, non tocca i permessi, non tocca le regole per riga.
--   ⚠️ La colonna `max_redemptions_per_customer` esiste in tabella e nasce col
--   suo valore predefinito, ma NESSUNO LA LEGGE: il sito non la interroga
--   nemmeno, perche' questi codici valgono una volta AL MONDO e non una volta
--   per persona. Registrato qui perche' chi guardera' la tabella la vedra' e
--   potrebbe crederla in uso.
--
-- SICUREZZA:
--   Tutto sta in una transazione con controlli bloccanti prima e dopo: se anche
--   uno solo non torna viene sollevato un errore e NULLA viene scritto. Non
--   esiste lo stato "trecento a meta'".
--
-- COME SI ESEGUE:
--   Si incolla tutto nel SQL editor di Supabase e si preme Run.
--   ⚠️ IL REFERTO IN FONDO DEVE AVERE ESATTAMENTE 9 RIGHE.
--   Il numero e' scritto qui a mano E viene contato dal database nella prima
--   riga: se i due non coincidono, o se ne arrivano meno, e' l'editor che taglia
--   e il fondo NON e' stato letto.
-- ============================================================================

begin;

do $$
declare
  -- ⚠️ La copia dichiarata. Sorvegliata da una prova, vedi la testa del file.
  v_alfabeto        constant text    := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_lunghezza       constant integer := 6;
  v_per_serie       constant integer := 100;

  -- Il tetto ai tentativi. Con trecento codici su un miliardo di combinazioni
  -- ne servono trecento e qualcosa: centomila e' un tetto che non si raggiunge
  -- mai per caso, e che si raggiunge subito se qualcosa e' rotto.
  v_tetto_tentativi constant integer := 100000;

  -- Le tre serie, in tre elenchi paralleli. ⚠️ Un elenco solo per ciascuna
  -- grandezza, percorsi insieme: cosi' non possono divergere fra loro.
  v_nomi        constant text[]    := array['A', 'B', 'C'];
  v_importi     constant numeric[] := array[5.00, null, null];
  v_percentuali constant numeric[] := array[null, 10.00, 20.00];
  v_soglie      constant numeric[] := array[25.00, null, null];

  v_i          integer;
  v_k          integer;
  v_code       text;
  v_fatti      integer;
  v_tentativi  integer;
  v_inserite   integer;
  v_n          integer;
begin

  -- ==========================================================================
  -- PRE-CHECK 1 — LA TABELLA DEVE ESSERE VUOTA.
  -- ⚠️ Se non lo fosse, qualcuno ha gia' generato qualcosa e va saputo PRIMA:
  -- la domanda non e' come far passare il controllo, e' che cosa c'e' dentro e
  -- chi ce l'ha messo. Aggiungere trecento codici sopra a quelli che ci sono
  -- gia' e' un errore che non si disfa: i codici non si richiamano indietro.
  -- ==========================================================================
  select count(*) into v_n from public.coupons;
  if v_n <> 0 then
    raise exception
      'FERMO — `coupons` contiene gia'' % righe e doveva essere vuota. Questo file si esegue UNA VOLTA SOLA. Guardare che cosa c''e'' dentro prima di decidere qualunque cosa: non e'' stato scritto nulla.',
      v_n;
  end if;

  -- PRE-CHECK 2 — l'alfabeto e' quello che diciamo che sia.
  -- ⚠️ Non e' una formalita': se qualcuno lo modificasse lasciandoci dentro uno
  -- dei caratteri ambigui, i codici uscirebbero sbagliati e li scopriremmo al
  -- telefono, un cliente alla volta.
  if length(v_alfabeto) <> 32 then
    raise exception
      'FERMO — l''alfabeto ha % caratteri invece di 32. Non e'' stato scritto nulla.',
      length(v_alfabeto);
  end if;
  if v_alfabeto ~ '[O0I1l]' then
    raise exception
      'FERMO — l''alfabeto contiene uno dei caratteri che si confondono (O, zero, I, uno, elle minuscola). Non e'' stato scritto nulla.';
  end if;

  -- ==========================================================================
  -- LA GENERAZIONE. Per ogni serie, si continua finche' non ne sono ENTRATI
  -- cento — non finche' non se ne sono PROVATI cento.
  -- ==========================================================================
  for v_i in 1 .. array_length(v_nomi, 1) loop
    v_fatti := 0;
    v_tentativi := 0;

    while v_fatti < v_per_serie loop
      -- Un codice, un carattere alla volta, pescato dall'alfabeto.
      v_code := '';
      for v_k in 1 .. v_lunghezza loop
        v_code := v_code || substr(v_alfabeto, 1 + floor(random() * length(v_alfabeto))::integer, 1);
      end loop;

      -- ⚠️ `do nothing` sul conflitto: se quel codice esiste gia' non si scrive
      -- niente e non si solleva niente. E' il database a dire se e' entrato, e
      -- lo dice col numero di righe toccate — non un controllo nostro fatto
      -- prima, che fra il guardare e lo scrivere lascerebbe passare un altro.
      insert into public.coupons
        (code, discount_amount, discount_percent, min_order_amount, is_active)
      values
        (v_code, v_importi[v_i], v_percentuali[v_i], v_soglie[v_i], true)
      on conflict (code) do nothing;

      get diagnostics v_inserite = row_count;
      if v_inserite = 1 then
        v_fatti := v_fatti + 1;
      end if;

      v_tentativi := v_tentativi + 1;
      if v_tentativi > v_tetto_tentativi then
        raise exception
          'FERMO — dopo % tentativi la serie % ne ha entrati solo % su %. Non e'' sfortuna: qualcosa non funziona come crediamo. Transazione annullata, nulla e'' stato scritto.',
          v_tentativi, v_nomi[v_i], v_fatti, v_per_serie;
      end if;
    end loop;

    raise notice 'Serie %: % codici entrati in % tentativi.', v_nomi[v_i], v_fatti, v_tentativi;
  end loop;

  -- ==========================================================================
  -- POST-CHECK BLOCCANTI
  -- ==========================================================================

  -- 1 — trecento righe, non 299.
  select count(*) into v_n from public.coupons;
  if v_n <> v_per_serie * array_length(v_nomi, 1) then
    raise exception
      'POST-CHECK 1 fallito: in tabella ci sono % codici invece di %. Transazione annullata, nulla e'' stato scritto.',
      v_n, v_per_serie * array_length(v_nomi, 1);
  end if;

  -- 2 — tutti distinti. ⚠️ L'unicita' della colonna lo garantisce gia', e questo
  -- controllo sembra quindi inutile: e' li' apposta. Se un domani quel vincolo
  -- sparisse, questa riga se ne accorgerebbe; e un controllo che non puo'
  -- fallire oggi non costa niente e diventa l'unica rete domani.
  select count(distinct code) into v_n from public.coupons;
  if v_n <> v_per_serie * array_length(v_nomi, 1) then
    raise exception
      'POST-CHECK 2 fallito: i codici distinti sono % invece di %. Transazione annullata, nulla e'' stato scritto.',
      v_n, v_per_serie * array_length(v_nomi, 1);
  end if;

  -- 3 — tutti di sei caratteri.
  select count(*) into v_n from public.coupons where length(code) <> v_lunghezza;
  if v_n <> 0 then
    raise exception
      'POST-CHECK 3 fallito: % codici non hanno % caratteri. Transazione annullata, nulla e'' stato scritto.',
      v_n, v_lunghezza;
  end if;

  -- 4 — nessuno contiene i caratteri che si confondono.
  select count(*) into v_n from public.coupons where code ~ '[O0I1l]';
  if v_n <> 0 then
    raise exception
      'POST-CHECK 4 fallito: % codici contengono uno fra O, zero, I, uno o elle minuscola. Transazione annullata, nulla e'' stato scritto.',
      v_n;
  end if;

  -- 5 — e piu' in generale nessuno contiene un carattere fuori dall'alfabeto.
  -- ⚠️ E' un secondo strumento sulla stessa domanda del controllo 4, non una
  -- ripetizione: quello elenca cinque caratteri, questo pretende che ci siano
  -- SOLO quelli ammessi. Il primo si accorge di un carattere ambiguo, il secondo
  -- anche di uno che nessuno aveva previsto.
  select count(*) into v_n
    from public.coupons
   where code !~ ('^[' || v_alfabeto || ']{' || v_lunghezza || '}$');
  if v_n <> 0 then
    raise exception
      'POST-CHECK 5 fallito: % codici contengono caratteri fuori dall''alfabeto. Transazione annullata, nulla e'' stato scritto.',
      v_n;
  end if;

  -- 6 — cento per serie, e la regola giusta in ciascuna.
  -- ⚠️ La serie si riconosce dalla REGOLA e non da un nome, perche' un nome nei
  -- codici non c'e' apposta.
  select count(*) into v_n
    from public.coupons
   where discount_amount = 5.00 and discount_percent is null and min_order_amount = 25.00;
  if v_n <> v_per_serie then
    raise exception
      'POST-CHECK 6 fallito: la serie da 5 euro con soglia 25 ha % codici invece di %. Transazione annullata, nulla e'' stato scritto.',
      v_n, v_per_serie;
  end if;

  select count(*) into v_n
    from public.coupons
   where discount_percent = 10.00 and discount_amount is null and min_order_amount is null;
  if v_n <> v_per_serie then
    raise exception
      'POST-CHECK 6 fallito: la serie al 10 per cento ha % codici invece di %. Transazione annullata, nulla e'' stato scritto.',
      v_n, v_per_serie;
  end if;

  select count(*) into v_n
    from public.coupons
   where discount_percent = 20.00 and discount_amount is null and min_order_amount is null;
  if v_n <> v_per_serie then
    raise exception
      'POST-CHECK 6 fallito: la serie al 20 per cento ha % codici invece di %. Transazione annullata, nulla e'' stato scritto.',
      v_n, v_per_serie;
  end if;

  -- 7 — tutti accesi, e nessuno con una scadenza.
  select count(*) into v_n from public.coupons where is_active is not true;
  if v_n <> 0 then
    raise exception
      'POST-CHECK 7 fallito: % codici non risultano attivi. Transazione annullata, nulla e'' stato scritto.', v_n;
  end if;

  select count(*) into v_n
    from public.coupons where valid_from is not null or valid_until is not null;
  if v_n <> 0 then
    raise exception
      'POST-CHECK 7 fallito: % codici portano una data di validita'', e questi codici NON scadono. Transazione annullata, nulla e'' stato scritto.',
      v_n;
  end if;

  raise notice 'POST-CHECK superati. 300 codici distinti, 100 per serie, sei caratteri, nessun carattere ambiguo, nessuna scadenza.';

end $$;

commit;

-- ============================================================================
-- REFERTO DI SOLA LETTURA — rilegge com'e' andata.
-- ⚠️ DEVE AVERE ESATTAMENTE 9 RIGHE:
--    1 di testa
--  + 1 (quanti codici in tutto)
--  + 3 (una per serie, col conteggio e la regola)
--  + 3 (i controlli di forma: distinti, lunghezza, alfabeto)
--  + 1 (verdetto)
--    Il numero e' anche contato dal database nella riga di testa: se i due non
--    coincidono, o se ne arrivano meno, e' troncato e il fondo NON e' letto.
--
-- ⚠️ QUI NON COMPARE NESSUN CODICE, ed e' voluto: per leggerli c'e' l'altro
--    file. Questo dice se la generazione e' riuscita, non che cosa ha prodotto.
-- ============================================================================
with referto as (

select 10 as ord,
       'quanti codici'::text as sezione,
       ('in tabella: ' || (select count(*) from public.coupons)::text || ' (attesi 300)')::text as dettaglio

union all

select 20, 'serie da 5 euro con soglia 25',
       (select count(*) from public.coupons
         where discount_amount = 5.00 and discount_percent is null and min_order_amount = 25.00)::text
       || ' codici (attesi 100)'

union all

select 21, 'serie al 10 per cento, nessuna soglia',
       (select count(*) from public.coupons
         where discount_percent = 10.00 and discount_amount is null and min_order_amount is null)::text
       || ' codici (attesi 100)'

union all

select 22, 'serie al 20 per cento, nessuna soglia',
       (select count(*) from public.coupons
         where discount_percent = 20.00 and discount_amount is null and min_order_amount is null)::text
       || ' codici (attesi 100)'

union all

select 30, 'tutti distinti',
       (select count(distinct code) from public.coupons)::text || ' codici distinti (attesi 300)'

union all

select 31, 'tutti di sei caratteri',
       (select count(*) from public.coupons where length(code) <> 6)::text
       || ' codici con una lunghezza diversa (atteso 0)'

union all

select 32, 'nessun carattere ambiguo ne fuori alfabeto',
       (select count(*) from public.coupons where code ~ '[O0I1l]')::text
       || ' con caratteri ambigui (atteso 0) | '
       || (select count(*) from public.coupons
            where code !~ '^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$')::text
       || ' fuori alfabeto (atteso 0)'

union all

select 40, 'VERDETTO',
       case when (select count(*) from public.coupons) = 300
             and (select count(distinct code) from public.coupons) = 300
             and (select count(*) from public.coupons
                   where code !~ '^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$') = 0
            then 'TRECENTO CODICI DISTINTI, TUTTI NELLA FORMA GIUSTA'
            else 'ATTENZIONE - qualcosa non torna: guardare le righe qui sopra'
       end

)

select 0 as ord,
       'testa'::text as sezione,
       ('referto eseguito il ' || to_char(now(), 'YYYY-MM-DD HH24:MI:SS.USOF')
         || ' | righe che questo referto deve avere, questa compresa: '
         || (select count(*) + 1 from referto)::text
         || ' | in cima ne sono dichiarate 9 a mano: i due numeri devono coincidere')::text as dettaglio

union all

select ord, sezione, dettaglio from referto

 order by ord, sezione;
