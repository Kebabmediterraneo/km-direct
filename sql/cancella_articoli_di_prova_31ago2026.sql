-- sql/cancella_articoli_di_prova_31ago2026.sql
-- DA ESEGUIRE UNA VOLTA SOLA, da Andrea, nel SQL editor di Supabase.
-- Cancella gli OTTO articoli di prova nati fra il 12/08 e il 28/08/2026 per
-- provare la Fase 4 e i passi 4b, 5, 6, 7 del pannello.
--
-- ⚠️ QUANDO: dopo il PASSO 7, mai prima. Il passo 5 tocca i prezzi e le prove
-- sul prezzo si fanno su questi articoli: cancellarli prima voleva dire
-- ricrearli il giorno dopo (spec §63-64).
--
-- ⚠️ VERIFICATO DA ANDREA SUL DATABASE VIVO, il 31/08/2026, PRIMA di scrivere
-- questo file: gli otto articoli esistono tutti e otto con i nomi esatti, e le
-- righe di `order_items` che li puntano sono ZERO per ognuno. Nessun ordine li
-- contiene, quindi la cancellazione non porta via nulla di reale.
--
-- ⚠️⚠️ `order_items` NON SI TOCCA IN NESSUN MODO: non si cancella e non si
-- azzera `product_id`. Il vincolo `references products(id)` è dichiarato SENZA
-- `on delete`, quindi vale NO ACTION: se una riga d'ordine esistesse, la
-- cancellazione dell'articolo verrebbe RIFIUTATA dal database. **È la
-- protezione giusta e resta in piedi**: quelle righe sono la memoria di un
-- acquisto vero, e toglierle riscriverebbe la storia di un ordine. Se questo
-- script fallisce con un errore di chiave esterna, NON si forza: vuol dire che
-- un ordine contiene uno di questi articoli, e quell'articolo non si cancella.
--
-- ⚠️ LE RIGHE COLLEGATE SI CANCELLANO ESPLICITAMENTE anche se lo schema dice
-- che la cascata le porterebbe via da sola: `km_direct_schema.sql` è del
-- 29/07/2026 e il database vivo può non coincidere. Se le regole automatiche ci
-- sono, queste righe non trovano nulla e non fanno danno. *È la stessa cautela
-- dello script del 12/08, da cui questo copia la forma.*
--
-- ⚠️ DUE TABELLE CHE LO SCRIPT DEL 12/08 NON NOMINAVA — `combo_drink_options` e
-- `combo_pricing` — trovate leggendo lo schema il 31/08: puntano a `products`
-- con colonne dal nome DIVERSO (`drink_product_id` e `roll_product_id`, non
-- `product_id`). Sul `Roll di prova` del 12/08 non c'entravano; qui si nominano
-- perché un articolo di prova legato a un combo le toccherebbe.

begin;

-- ----------------------------------------------------------------------------
-- 1) PRE-CHECK bloccante — gli articoli sono ESATTAMENTE otto.
--
-- ⚠️ PERCHÉ SERVE: `products.name` NON è unico — l'unico vincolo di unicità è
-- `unique (store_id, slug)` (schema, riga 21). Due articoli omonimi sarebbero
-- legittimi per il database, e questo script li porterebbe via entrambi senza
-- che nessuno se ne accorga. Il conteggio atteso è la difesa.
--
-- ⚠️ E se ne trovasse SETTE, vorrebbe dire che uno è già stato cancellato o
-- rinominato: ci si ferma e si guarda, invece di cancellare a metà.
-- ----------------------------------------------------------------------------
do $$
declare
  v_articoli int;
  v_ordini   int;
begin
  select count(*) into v_articoli
  from products
  where name in (
    'Roll di prova',
    'Roll di prova 2',
    'Roll di prova 3',
    'Roll di prova 4',
    'Roll di prova 5',
    'Roll di prova 6',
    'Roll di prova 7',
    'Roll di prova 8'
  );
  if v_articoli <> 8 then
    raise exception 'PRE-CHECK fallito: trovati % articoli di prova, attesi 8. Cancellazione annullata.', v_articoli;
  end if;

  -- ⚠️ Il conteggio delle righe d'ordine si RIFÀ qui, anche se Andrea l'ha già
  -- misurato: fra la misura e l'esecuzione può essere arrivato un ordine.
  -- *Questo è un CONTROLLO, non una cancellazione: `order_items` resta intatta.*
  select count(*) into v_ordini
  from order_items
  where product_id in (
    select id from products
    where name in (
      'Roll di prova',
      'Roll di prova 2',
      'Roll di prova 3',
      'Roll di prova 4',
      'Roll di prova 5',
      'Roll di prova 6',
      'Roll di prova 7',
      'Roll di prova 8'
    )
  );
  if v_ordini <> 0 then
    raise exception 'PRE-CHECK fallito: % righe di order_items puntano agli articoli di prova, attese 0. Un ordine li contiene: NON si cancellano. Cancellazione annullata.', v_ordini;
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- 2) LE RIGHE COLLEGATE, prima della riga di `products`.
--
-- ⚠️ PER NOME ESATTO, MAI per prefisso: «Roll di prova» è prefisso degli altri
-- sette, e un `like 'Roll di prova%'` porterebbe via anche un «Roll di prova 9»
-- creato domani da qualcun altro. La lista chiusa è voluta.
-- ----------------------------------------------------------------------------
delete from product_choice_options where product_id in (
  select id from products where name in (
    'Roll di prova', 'Roll di prova 2', 'Roll di prova 3', 'Roll di prova 4',
    'Roll di prova 5', 'Roll di prova 6', 'Roll di prova 7', 'Roll di prova 8'
  )
);

delete from product_removals where product_id in (
  select id from products where name in (
    'Roll di prova', 'Roll di prova 2', 'Roll di prova 3', 'Roll di prova 4',
    'Roll di prova 5', 'Roll di prova 6', 'Roll di prova 7', 'Roll di prova 8'
  )
);

delete from product_accompaniments where product_id in (
  select id from products where name in (
    'Roll di prova', 'Roll di prova 2', 'Roll di prova 3', 'Roll di prova 4',
    'Roll di prova 5', 'Roll di prova 6', 'Roll di prova 7', 'Roll di prova 8'
  )
);

delete from product_addons where product_id in (
  select id from products where name in (
    'Roll di prova', 'Roll di prova 2', 'Roll di prova 3', 'Roll di prova 4',
    'Roll di prova 5', 'Roll di prova 6', 'Roll di prova 7', 'Roll di prova 8'
  )
);

delete from product_allergens where product_id in (
  select id from products where name in (
    'Roll di prova', 'Roll di prova 2', 'Roll di prova 3', 'Roll di prova 4',
    'Roll di prova 5', 'Roll di prova 6', 'Roll di prova 7', 'Roll di prova 8'
  )
);

-- ⚠️ Le due dei combo: la colonna NON si chiama `product_id`.
delete from combo_drink_options where drink_product_id in (
  select id from products where name in (
    'Roll di prova', 'Roll di prova 2', 'Roll di prova 3', 'Roll di prova 4',
    'Roll di prova 5', 'Roll di prova 6', 'Roll di prova 7', 'Roll di prova 8'
  )
);

delete from combo_pricing where roll_product_id in (
  select id from products where name in (
    'Roll di prova', 'Roll di prova 2', 'Roll di prova 3', 'Roll di prova 4',
    'Roll di prova 5', 'Roll di prova 6', 'Roll di prova 7', 'Roll di prova 8'
  )
);

-- ----------------------------------------------------------------------------
-- 3) E SOLO ADESSO gli articoli.
-- ----------------------------------------------------------------------------
delete from products where name in (
  'Roll di prova',
  'Roll di prova 2',
  'Roll di prova 3',
  'Roll di prova 4',
  'Roll di prova 5',
  'Roll di prova 6',
  'Roll di prova 7',
  'Roll di prova 8'
);

commit;

-- ----------------------------------------------------------------------------
-- REFERTO IN FONDO, perché l'editor di Supabase mostra solo l'ultima
-- istruzione. DEVE restituire una riga sola con `rimasti = 0`.
-- ⚠️ Se restituisse un numero diverso da zero, la cancellazione NON è avvenuta.
-- ----------------------------------------------------------------------------
select count(*) as rimasti
from products
where name in (
  'Roll di prova',
  'Roll di prova 2',
  'Roll di prova 3',
  'Roll di prova 4',
  'Roll di prova 5',
  'Roll di prova 6',
  'Roll di prova 7',
  'Roll di prova 8'
);
