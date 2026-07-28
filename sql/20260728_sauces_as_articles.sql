-- KM Direct — MASTER_SPEC v29, §30 e §34-35
-- Le salse diventano articoli a tutti gli effetti.
-- Tipi identici a quelli di products, verificati su km_direct_schema.sql.

alter table sauces add column if not exists badge        text;
alter table sauces add column if not exists spice_level  smallint not null default 0;
alter table sauces add column if not exists spice_label  text;
alter table sauces add column if not exists image_url    text;

-- POST-CHECK --------------------------------------------------------------
select column_name, data_type, is_nullable, column_default
  from information_schema.columns
 where table_name = 'sauces'
 order by ordinal_position;
select count(*) from sauces where spice_level = 0;       -- atteso 7
select count(*) from sauces where badge is not null;     -- atteso 0
select count(*) from sauces where image_url is not null; -- atteso 0
