-- ============================================================================
-- ESTRAZIONE DEI CONTATTI PER LA MAILING LIST — ⚠️ CONTIENE DATI PERSONALI
-- Richiesta di Andrea del 02/10/2026. Sola lettura: non scrive niente.
-- ============================================================================
--
-- COSA FA (anche per chi non conosce SQL):
--   Elenca le persone che hanno dato il consenso alle comunicazioni E hanno
--   lasciato un'email. Per ciascuna: nome, cognome, email, quando ha dato il
--   consenso e su quale versione del testo, quanti ordini pagati ha fatto e
--   quando ha ordinato l'ultima volta.
--
-- ⚠️ CHI NON HA DATO IL CONSENSO NON PUO' USCIRE DA QUI, PER COSTRUZIONE.
--   Il filtro sul consenso sta DENTRO l'unico blocco da cui escono le righe:
--   non esiste una colonna "consenso si/no" da filtrare dopo, e non esiste un
--   conteggio dei non consenzienti. Chi non l'ha dato non compare in nessuna
--   forma.
--
-- ⚠️ IL CONSENSO CHE CONTA E' L'ULTIMO. Se una persona aveva acconsentito e poi
--   ha riordinato senza spuntare la casella, oggi risulta senza consenso e
--   qui NON esce. La data del consenso che esce e' quella dell'ultimo dato.
--
-- ⚠️ CHI HA DATO IL CONSENSO MA NON HA LASCIATO UN'EMAIL NON ESCE: a una
--   mailing list non serve. Quanti sono lo dice la riga di controllo in cima,
--   e il file dei conteggi del 02/10/2026.
--
-- ⚠️ IL TELEFONO NON ESCE, di proposito. E' la chiave con cui il sito
--   riconosce un cliente: portarlo su una piattaforma esterna per mandare
--   email non serve a niente e sposta fuori il dato piu' delicato.
--
-- "ORDINI PAGATI" vuol dire: succeeded, refunded, partially_refunded — gli
--   stessi tre che il pannello e la pulizia mensile trattano come pagati.
--   Gli ordini mai andati a buon fine (pending, failed) non contano.
--
-- COME SI USA:
--   Si incolla tutto nel SQL editor di Supabase e si preme Run, poi si scarica
--   il risultato.
--   ⚠️ LA PRIMA RIGA E' UNA RIGA DI CONTROLLO, NON UN CONTATTO: dice quanti
--   contatti escono, contati dal database. Se le righe dei contatti a schermo
--   sono meno di quel numero, l'editor ha tagliato e l'elenco e' incompleto.
--   ⚠️ VA TOLTA PRIMA DI CARICARE L'ELENCO nella piattaforma di mailing.
--   ⚠️ Il file scaricato contiene dati personali: non va messo nel deposito
--   e non va lasciato in giro.
-- ============================================================================
with contatti as (
  select c.id,
         c.first_name,
         c.last_name,
         c.email,
         c.marketing_opt_in_at,
         c.marketing_text_version,
         count(o.id)       as ordini_pagati,
         max(o.created_at) as ultimo_ordine_pagato
    from public.customers c
    left join public.orders o
           on o.customer_id = c.id
          and o.payment_status in ('succeeded', 'refunded', 'partially_refunded')
   where c.marketing_opt_in is true
     and c.email is not null
     and btrim(c.email) <> ''
   group by c.id, c.first_name, c.last_name, c.email,
            c.marketing_opt_in_at, c.marketing_text_version
)

select 0 as ord,
       ('RIGA DI CONTROLLO, NON E UN CONTATTO — DA TOGLIERE PRIMA DI CARICARE | contatti che escono: '
        || (select count(*) from contatti)::text
        || ' | righe totali con questa: '
        || (select count(*) + 1 from contatti)::text
        || ' | consenso dato ma senza email, quindi esclusi: '
        || (select count(*) from public.customers
             where marketing_opt_in is true
               and (email is null or btrim(email) = ''))::text
        || ' | estratto il '
        || to_char(now() at time zone 'Europe/Rome', 'DD/MM/YYYY HH24:MI'))::text as nome,
       null::text as cognome,
       null::text as email,
       null::text as consenso_dato_il,
       null::text as versione_testo_consenso,
       null::text as ordini_pagati,
       null::text as ultimo_ordine_pagato

union all

select 1,
       first_name,
       last_name,
       email,
       to_char(marketing_opt_in_at at time zone 'Europe/Rome', 'DD/MM/YYYY HH24:MI'),
       marketing_text_version,
       ordini_pagati::text,
       coalesce(to_char(ultimo_ordine_pagato at time zone 'Europe/Rome', 'DD/MM/YYYY'), 'nessuno')
  from contatti

 order by ord, cognome, nome;
