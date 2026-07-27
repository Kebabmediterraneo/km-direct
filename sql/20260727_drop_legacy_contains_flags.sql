-- ============================================================================
-- 20260727_drop_legacy_contains_flags.sql
-- §67 — Bonifica: rimozione dei flag dietetici legacy da products.
--
-- `contains_gluten` e `contains_lactose` su products erano il vecchio modo di
-- indicare glutine/lattosio, ora superati dalla tabella product_allergens
-- (allergeni "Glutine"/"Latte"). Non sono usati da alcun punto del codice
-- (client o server) e sono quasi interamente NULL. Si rimuovono per evitare
-- una doppia fonte di verità.
--
-- ATTENZIONE: NON tocca product_accompaniments.contains_gluten, che è un flag
-- DISTINTO (indica il contorno "Bulgur (contiene glutine)") e resta valido.
--
-- Migrazione manuale da applicare nel SQL editor del progetto Supabase DEV.
-- Idempotente: "drop column if exists" può essere rieseguito senza errori.
-- La stessa rimozione è riflessa in km_direct_schema.sql (tabella products).
--
-- NON applicare a produzione senza verifica.
-- ============================================================================

alter table products drop column if exists contains_gluten;
alter table products drop column if exists contains_lactose;
