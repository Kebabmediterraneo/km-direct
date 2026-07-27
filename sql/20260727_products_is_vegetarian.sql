-- ============================================================================
-- 20260727_products_is_vegetarian.sql
-- §67/§35 — Flag "vegetariano" sui prodotti (parallelo a is_vegan).
--
-- Migrazione manuale da applicare nel SQL editor del progetto Supabase DEV.
-- Idempotente: usa "add column if not exists" così può essere rieseguita
-- senza errori. La stessa definizione è anche in km_direct_schema.sql
-- (fonte autorevole dello schema completo), tabella products.
--
-- NON applicare a produzione.
-- ============================================================================

-- Coerente con is_vegan: boolean nullable, nessun default. Il valore è
-- popolato a parte via dati (ogni prodotto vegano è anche vegetariano;
-- vedi §67). Le bevande (drink/birre) restano NULL (non food).
alter table products
  add column if not exists is_vegetarian boolean;
