-- sql/cancella_roll_prova_12ago2026.sql
-- ESEGUITA DA ANDREA il 12/08/2026 nel SQL editor Supabase, esito: zero righe.
-- Cancella l'articolo di prova creato lo stesso giorno per verificare la Fase 4.
-- Verificato PRIMA di eseguire: righe_ordine = 0, quindi nessun ordine lo
-- conteneva e la cancellazione non ha portato via nulla di reale.
-- Le cancellazioni delle opzioni sono ESPLICITE anche se lo schema
-- probabilmente le porterebbe via da solo: se le regole automatiche ci sono,
-- queste righe non trovano nulla e non fanno danno.

begin;

delete from product_choice_options where product_id = '8a2e9d4e-c959-43a6-8c54-71acce10b6df';
delete from product_removals        where product_id = '8a2e9d4e-c959-43a6-8c54-71acce10b6df';
delete from product_accompaniments  where product_id = '8a2e9d4e-c959-43a6-8c54-71acce10b6df';
delete from product_addons          where product_id = '8a2e9d4e-c959-43a6-8c54-71acce10b6df';
delete from product_allergens       where product_id = '8a2e9d4e-c959-43a6-8c54-71acce10b6df';
delete from products                where id         = '8a2e9d4e-c959-43a6-8c54-71acce10b6df';

commit;

-- REFERTO IN FONDO, perche' l'editor mostra solo l'ultima istruzione.
-- Deve restituire ZERO RIGHE: se ne restituisse una, la cancellazione
-- non e' avvenuta.
select id, name, slug from products
where id = '8a2e9d4e-c959-43a6-8c54-71acce10b6df';
