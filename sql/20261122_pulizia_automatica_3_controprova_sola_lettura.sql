-- ============================================================================
-- PULIZIA AUTOMATICA — 3. CONTROPROVA (SOLA LETTURA)
-- (§69, 22/11/2026). Lo lancia ANDREA nell'editor SQL. Non scrive niente.
-- ============================================================================
--
-- Mette accanto l'ULTIMA riga del registro (qualunque modo) e lo stato del
-- database ADESSO, con la soglia usata da quella riga.
--
-- Il referto deve avere 22 righe: n, voce, valore, atteso.
-- Come si legge:
--   - righe 1-6: quale esecuzione si sta guardando (numero, data, modo,
--     soglia, esito, motivo);
--   - righe 7-15: le righe toccate, da confrontare con le righe 1-13 della
--     SELECT di conteggio (file 2) lanciata PRIMA;
--   - riga 16: ordini mai pagati ancora più vecchi della soglia. Dopo una
--     pulizia «ok» deve essere 0; dopo una «prova» deve essere uguale alla
--     riga 7 (la prova non cancella);
--   - righe 17-22: i totali di adesso accanto a quelli misurati dalla
--     funzione prima di lavorare.
-- ============================================================================
with r as (
  select *
  from manutenzione.pulizia_registro
  order by id desc
  limit 1
)
select * from (
  select 1 as n, 'registro: numero della riga' as voce, (select id::text from r) as valore, 'la riga appena scritta' as atteso
  union all
  select 2, 'registro: eseguita il (UTC)', (select to_char(eseguita_il at time zone 'UTC', 'YYYY-MM-DD HH24:MI:SS') from r), 'pochi istanti fa'
  union all
  select 3, 'registro: modo', (select modo from r), 'automatica, manuale o prova'
  union all
  select 4, 'registro: soglia in giorni', (select soglia_giorni::text from r), '28'
  union all
  select 5, 'registro: esito', (select esito from r), 'ok (o prova)'
  union all
  select 6, 'registro: motivo', (select coalesce(motivo, '(vuoto)') from r), '(vuoto) se ok o prova'
  union all
  select 7, 'registro: ordini cancellati', (select ordini::text from r), 'riga 1 del conteggio'
  union all
  select 8, 'registro: righe d''ordine', (select righe_ordine::text from r), 'riga 2 del conteggio'
  union all
  select 9, 'registro: storico stati', (select storico_stati::text from r), 'riga 3 del conteggio'
  union all
  select 10, 'registro: eventi staccati', (select eventi_staccati::text from r), 'riga 4 del conteggio'
  union all
  select 11, 'registro: registro staff staccato', (select registro_staccato::text from r), 'riga 5 del conteggio'
  union all
  select 12, 'registro: riscatti promo cancellati', (select promo_cancellati::text from r), 'riga 6 del conteggio'
  union all
  select 13, 'registro: prenotazioni tolte dagli ordini', (select coupon_da_ordini::text from r), 'riga 9 del conteggio'
  union all
  select 14, 'registro: prenotazioni tolte dai clienti', (select coupon_da_clienti::text from r), 'riga 13 del conteggio'
  union all
  select 15, 'registro: righe cliente cancellate', (select clienti::text from r), 'riga 10 del conteggio'
  union all
  select 16, 'adesso: ordini mai pagati più vecchi della soglia di quella riga',
         (select count(*)::text from orders o, r
           where o.payment_status in ('pending', 'failed') and o.created_at < r.soglia_istante),
         '0 dopo ok; uguale alla riga 7 dopo prova'
  union all
  select 17, 'registro: ordini pagati o rimborsati, prima', (select pagati_totale::text from r), 'riga 14 del conteggio'
  union all
  select 18, 'adesso: ordini pagati o rimborsati',
         (select count(*)::text from orders where payment_status in ('succeeded', 'refunded', 'partially_refunded')),
         'uguale alla riga 17'
  union all
  select 19, 'registro: codici consumati, prima', (select consumati_totale::text from r), 'riga 19 del conteggio'
  union all
  select 20, 'adesso: codici consumati',
         (select count(*)::text from coupon_redemptions where status = 'consumed'),
         'uguale alla riga 19'
  union all
  select 21, 'adesso: ordini mai pagati in totale',
         (select count(*)::text from orders where payment_status in ('pending', 'failed')),
         'riga 15 del conteggio meno la riga 7 (dopo ok)'
  union all
  select 22, 'adesso: righe cliente in totale',
         (select count(*)::text from customers),
         'riga 16 del conteggio meno la riga 15 (dopo ok)'
) referto
order by n;
