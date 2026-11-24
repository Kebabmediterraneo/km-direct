-- FOTO DEI ROLL NEL MENU (24/11/2026) — collega le 8 foto di public/menu/ agli 8 Roll.
--
-- CHI LO LANCIA: Andrea, nel SQL editor di Supabase. Una parte alla volta, in
-- quest'ordine: A, poi B, poi C. Se una parte non restituisce quello che è
-- scritto qui sotto, ci si ferma e non si lancia la successiva.
--
-- Scrive SOLO la colonna image_url di 8 righe di products con categoria 'roll'.
-- Nessuna cancellazione, nessun DDL. Le Bowl non sono toccate (categoria diversa).
--
-- ⚠️ ORDINE RISPETTO AL SITO: le foto arrivano ai clienti solo con il push che
-- porta public/menu/. Se la parte B si lancia PRIMA del push, il sito online
-- cerca foto che ancora non ci sono: la scheda nasconde il riquadro e resta
-- come oggi (nessun riquadro rotto), finché il push non arriva.
--
-- NOMI: letti il 24/11/2026 dal menu del sito in locale (che legge lo stesso
-- database, in sola lettura). Nella categoria roll ci sono 8 articoli, tutti con
-- image_url vuoto, e i nomi sono esattamente questi:
--   Il turco (⚠️ con la «t» minuscola, a differenza della spec che scrive «Il Turco»),
--   Il Greco, KM Special, Il Libanese, Il Siriano, Il Persiano,
--   L'Egiziano (apostrofo dritto), Il Cipriota.
-- «Il Siriano» non compare né nel codice né nella spec (§19 elenca 7 Roll): c'è
-- nel database, aggiunto dal pannello.
--
-- RESET (se servisse tornare indietro): rimettere image_url a null sulle stesse
-- 8 righe. Non è scritto qui apposta: lo si scrive solo se serve.


-- ===========================================================================
-- A0) SOLA LETTURA — tutti i Roll, per vedere i nomi esatti.
-- Deve restituire 8 RIGHE, con i nomi scritti come nella parte A e image_url
-- vuoto. Se un nome è diverso, fermati.
-- ===========================================================================
select id, name, image_url, is_in_menu
from products
where category = 'roll'
order by sort_order, name;


-- ===========================================================================
-- A) SOLA LETTURA — gli 8 Roll cercati per nome esatto e categoria roll.
-- Deve restituire 8 RIGHE, con image_url vuoto (null). Se sono meno di 8, un
-- nome non corrisponde: fermati e non lanciare la parte B.
-- ===========================================================================
select id, name, image_url
from products
where category = 'roll'
  and name in (
    'Il turco',
    'Il Greco',
    'KM Special',
    'Il Libanese',
    'Il Persiano',
    'L''Egiziano',
    'Il Cipriota',
    'Il Siriano'
  )
order by name;


-- ===========================================================================
-- B) GLI 8 UPDATE — ognuno deve restituire 1 RIGA (returning), con image_url
-- uguale al percorso scritto. ⚠️ Il SQL editor mostra solo il risultato
-- dell'ULTIMA istruzione: lanciandole insieme si vede solo L'Egiziano. Il
-- controllo completo è la parte C.
-- ===========================================================================
update products set image_url = '/menu/il-turco.webp'
where category = 'roll' and name = 'Il turco'
returning id, name, image_url;

update products set image_url = '/menu/il-greco.webp'
where category = 'roll' and name = 'Il Greco'
returning id, name, image_url;

update products set image_url = '/menu/km-special.webp'
where category = 'roll' and name = 'KM Special'
returning id, name, image_url;

update products set image_url = '/menu/il-libanese.webp'
where category = 'roll' and name = 'Il Libanese'
returning id, name, image_url;

update products set image_url = '/menu/il-persiano.webp'
where category = 'roll' and name = 'Il Persiano'
returning id, name, image_url;

update products set image_url = '/menu/il-cipriota.webp'
where category = 'roll' and name = 'Il Cipriota'
returning id, name, image_url;

update products set image_url = '/menu/il-siriano.webp'
where category = 'roll' and name = 'Il Siriano'
returning id, name, image_url;

update products set image_url = '/menu/l-egiziano.webp'
where category = 'roll' and name = 'L''Egiziano'
returning id, name, image_url;


-- ===========================================================================
-- C) SOLA LETTURA — controllo finale. Deve restituire 8 RIGHE, tutte con
-- category = roll, ognuna con il suo percorso /menu/<nome>.webp. Nessun altro
-- articolo deve avere image_url pieno.
-- ===========================================================================
select id, name, category, image_url
from products
where image_url is not null
order by name;
