-- ============================================================================
-- PULIZIA AUTOMATICA — 2. CONTEGGIO IN ANTICIPO (SOLA LETTURA)
-- (§69, 22/11/2026). Lo lancia ANDREA nell'editor SQL. Non scrive niente.
-- ============================================================================
--
-- Conta, tabella per tabella, che cosa toccherebbe ADESSO la pulizia con una
-- soglia data. Riproduce le condizioni della funzione
-- `manutenzione.pulizia_ordini_mai_pagati` (che sono quelle dello script
-- manuale), nello stesso ordine dei passi.
--
-- ⚠️ LA SOGLIA SI SCRIVE IN UN POSTO SOLO: `make_interval(days => 28)`, qui
-- sotto. Per un'altra soglia si cambia solo quel numero.
--
-- Il referto deve avere 20 righe. La colonna «dopo_deve_essere» dice che cosa
-- deve mostrare la stessa SELECT rilanciata DOPO una pulizia vera.
-- Le righe 1-13 devono coincidere con i numeri della riga «prova» o «ok» del
-- registro (vedi la controprova, file 3).
-- ============================================================================
with p as (
  select now() - make_interval(days => 28) as soglia
),
-- Passo 2 dello script: ordini mai pagati (pending o failed) creati prima della soglia.
bersaglio as (
  select o.id
  from orders o, p
  where o.payment_status in ('pending', 'failed')
    and o.created_at < p.soglia
),
-- Passo 3: righe cliente create prima della soglia che, tolti gli ordini
-- bersaglio e i loro riscatti promo, restano senza ordini e senza riscatti.
clienti_tolti as (
  select c.id
  from customers c, p
  where c.created_at < p.soglia
    and not exists (
      select 1 from orders o
      where o.customer_id = c.id
        and not exists (select 1 from bersaglio b where b.id = o.id)
    )
    and not exists (
      select 1 from promo_redemptions pr
      where pr.customer_id = c.id
        and not exists (select 1 from bersaglio b where b.id = pr.order_id)
    )
),
-- Passo 1d: codici sconto legati agli ordini bersaglio.
cr_ordini as (
  select r.status, r.reserved_until
  from coupon_redemptions r
  where exists (select 1 from bersaglio b where b.id = r.order_id)
),
-- Passo 3b: codici sconto legati ai clienti che verranno tolti, ESCLUSE le
-- prenotazioni già tolte al passo 1d.
cr_clienti as (
  select r.status, r.reserved_until
  from coupon_redemptions r
  where exists (select 1 from clienti_tolti ct where ct.id = r.customer_id)
    and not (r.status = 'reserved'
             and exists (select 1 from bersaglio b where b.id = r.order_id))
)
select * from (
  select 1 as n, 'orders' as tabella, 'ordini mai pagati CANCELLATI (passo 2)' as cosa_succede,
         (select count(*) from bersaglio) as righe, '0' as dopo_deve_essere
  union all
  select 2, 'order_items', 'righe d''ordine cancellate a catena (passo 2)',
         (select count(*) from order_items oi where exists (select 1 from bersaglio b where b.id = oi.order_id)), '0'
  union all
  select 3, 'order_status_history', 'storico stati cancellato a catena (passo 2)',
         (select count(*) from order_status_history h where exists (select 1 from bersaglio b where b.id = h.order_id)), '0'
  union all
  select 4, 'analytics_events', 'eventi STACCATI dall''ordine, la riga resta (passo 1a)',
         (select count(*) from analytics_events e where exists (select 1 from bersaglio b where b.id = e.order_id)), '0'
  union all
  select 5, 'staff_action_log', 'registro STACCATO dall''ordine, la riga resta (passo 1b)',
         (select count(*) from staff_action_log l where exists (select 1 from bersaglio b where b.id = l.order_id)), '0'
  union all
  select 6, 'promo_redemptions', 'riscatti promo CANCELLATI (passo 1c)',
         (select count(*) from promo_redemptions pr where exists (select 1 from bersaglio b where b.id = pr.order_id)), '0'
  union all
  select 7, 'coupon_redemptions', 'FRENO 1d: codici CONSUMATI su ordini bersaglio (se > 0 lo script si ferma)',
         (select count(*) from cr_ordini where status = 'consumed'), '0'
  union all
  select 8, 'coupon_redemptions', 'FRENO 1d: prenotazioni VIVE su ordini bersaglio (se > 0 lo script si ferma)',
         (select count(*) from cr_ordini where status = 'reserved' and reserved_until >= now()), '0'
  union all
  select 9, 'coupon_redemptions', 'prenotazioni scadute su ordini bersaglio CANCELLATE (passo 1d)',
         (select count(*) from cr_ordini where status = 'reserved' and reserved_until < now()), '0'
  union all
  select 10, 'customers', 'righe cliente senza ordini CANCELLATE (passo 3)',
         (select count(*) from clienti_tolti), '0'
  union all
  select 11, 'coupon_redemptions', 'FRENO 3b: codici CONSUMATI su clienti da togliere (se > 0 lo script si ferma)',
         (select count(*) from cr_clienti where status = 'consumed'), '0'
  union all
  select 12, 'coupon_redemptions', 'FRENO 3b: prenotazioni VIVE su clienti da togliere (se > 0 lo script si ferma)',
         (select count(*) from cr_clienti where status = 'reserved' and reserved_until >= now()), '0'
  union all
  select 13, 'coupon_redemptions', 'prenotazioni scadute su clienti da togliere CANCELLATE (passo 3b)',
         (select count(*) from cr_clienti where status = 'reserved' and reserved_until < now()), '0'
  union all
  select 14, 'orders', 'TOTALE ordini pagati o rimborsati (non devono cambiare)',
         (select count(*) from orders where payment_status in ('succeeded', 'refunded', 'partially_refunded')), 'uguale a prima'
  union all
  select 15, 'orders', 'TOTALE ordini mai pagati',
         (select count(*) from orders where payment_status in ('pending', 'failed')), 'prima meno riga 1'
  union all
  select 16, 'customers', 'TOTALE righe cliente',
         (select count(*) from customers), 'prima meno riga 10'
  union all
  select 17, 'analytics_events', 'TOTALE eventi (non deve cambiare)',
         (select count(*) from analytics_events), 'uguale a prima'
  union all
  select 18, 'staff_action_log', 'TOTALE registro (non deve cambiare)',
         (select count(*) from staff_action_log), 'uguale a prima'
  union all
  select 19, 'coupon_redemptions', 'TOTALE codici consumati (non deve cambiare)',
         (select count(*) from coupon_redemptions where status = 'consumed'), 'uguale a prima'
  union all
  -- Margine: fra quante ORE il prossimo ordine mai pagato supera la soglia.
  -- Se è piccolo (meno di 3), lo script potrebbe prendere un ordine in più di
  -- quelli contati qui: va detto prima di lanciarlo.
  select 20, 'orders', 'MARGINE: ore prima che il prossimo ordine mai pagato superi la soglia (vuoto = nessuno)',
         (select floor(extract(epoch from (min(o.created_at) - p.soglia)) / 3600)::bigint
            from orders o, p
           where o.payment_status in ('pending', 'failed') and o.created_at >= p.soglia
           group by p.soglia), 'non conta'
) referto
order by n;
