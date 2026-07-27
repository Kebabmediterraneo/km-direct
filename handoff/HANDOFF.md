# KM Direct — HANDOFF

Documento per riprendere il progetto in una nuova sessione senza rileggere la
cronologia. Contiene **stato attuale** e **to-do**. Le decisioni e la loro
motivazione stanno in `MASTER_SPEC.md`; la storia dei tentativi sta nei commit.

---

## 1) Cos'è il progetto

Web app per ordini **delivery e ritiro** di **FAME Srl / KM Kebab Mediterraneo**
(Bologna, store DEV `san-mamolo`). Stack **Next.js 14 + Supabase + Stripe (sandbox)**.
Repo: **github.com/Kebabmediterraneo/km-direct** (branch `main`, push via SSH).
La fonte di verità di tutte le decisioni è **`MASTER_SPEC.md`** — versione attuale
**v24** (leggila sempre dall'intestazione, riga 3).

---

## 2) Stato git

- Branch **`main`**, working tree **pulita**, allineata a `origin/main`.
- Ultimo commit: **`ca2edce`** — *schema: rimozione flag legacy products.contains_gluten/contains_lactose (superati da product_allergens)*.
- Ultimi ~10 commit (lavoro recente):

```
ca2edce schema: rimozione flag legacy products.contains_gluten/contains_lactose (superati da product_allergens)
37107d1 spec: v24 — rendering allergeni al cliente completato §67 (resta solo bonifica flag legacy)
5dbae6f spec: v23 — soia-Planted gestita via nota UI nel configuratore §67
d15e990 configuratore: nota "Alternativa vegetale · contiene soia" sotto l'opzione Planted (Roll/Bowl e Menu Combo), solo UI
9a5a480 menu cliente: rendering allergeni (blocco espandibile) e badge Vegano/Vegetariano dai flag; policy RLS lettura pubblica allergeni tracciata
7a89e7c spec: v22 — tracciamento is_vegetarian §67 (flag di default, vegano implica vegetariano)
13c32ca schema: aggiunta colonna products.is_vegetarian (migration + schema autorevole)
34c1ce5 spec: v21 — allergeni §67 popolati (livello prodotto+salsa, unione gusti, Planted/bevande esclusi); rendering cliente rimandato
31ea80d bowl: accompagnamento obbligatorio (§21) — pulsante disabilitato senza scelta + validazione server-side
85b0290 spec: v20 — etichetta gruppo proteina a schermo "Come preferisci il tuo kebab?" (§19 nota, §31 esempio choice_label)
```

---

## 3) Cosa vive su GIT vs cosa vive SOLO nel DB di test — ⚠️ CRITICO

**Su git** (versionato, ri-applicabile):
- Codice (`app/`, `lib/`, ecc.).
- `MASTER_SPEC.md` (decisioni).
- Migration di schema: cartella **`sql/`** — attuali:
  `20260723_store_schedule_exceptions.sql`, `20260727_products_is_vegetarian.sql`,
  `20260727_allergens_public_read.sql`, `20260727_drop_legacy_contains_flags.sql`.
- Lo schema autorevole completo: `km_direct_schema.sql`.

**Solo nel DB Supabase di TEST** (NON su git):
- Tutti i **dati del menu**: prodotti, nomi, descrizioni, diciture, prezzi, badge.
- **Allergeni popolati**: tabelle `allergens` (14 UE), `product_allergens`,
  `sauce_allergens`.
- Flag **`is_vegan` / `is_vegetarian`** sui prodotti.
- Le **policy RLS di lettura pubblica** sugli allergeni: applicate a mano nel SQL
  editor **ma anche tracciate** in `sql/20260727_allergens_public_read.sql`.
- Il prodotto **"Polpette di agnello"** (fritti) creato a mano.

**Promemoria go-live**: le migration di schema e le policy in `sql/` sono
**ri-applicabili** in produzione; i **DATI del menu no** — andranno esportati dal
DB di test e reinseriti in produzione (serve un piano di travaso test→prod).

---

## 4) Metodo di lavoro consolidato (vincolante)

a. **Interlocutore = Andrea**, proprietario **senza competenze tecniche**:
   spiegazioni in **linguaggio semplice**; i tecnicismi vanno **solo dentro i
   comandi** da incollare in Claude Code.
b. **Spec prima del codice**: ogni decisione nuova va **prima** in
   `MASTER_SPEC.md`, poi implementata.
c. Le **verifiche le fa Claude Code da sé**, TRANNE: **login staff** (sempre
   Andrea) e **pagamenti reali**.
d. **Modifiche al DB** con **pre-check e post-check**, filtrando **per id**,
   cautela chirurgica specie sugli **allergeni** (sicurezza alimentare: mai
   dedurli, solo da fonte verificata da Andrea).
e. **Commit**: messaggio di **UNA riga**, **MAI footer `Co-Authored-By`**; push
   incluso — se il push fallisce lo fa Andrea dal Terminale.
f. **Aggiornamenti spec col METODO FILE**: Claude genera il `MASTER_SPEC.md`
   completo, Andrea lo scarica e lo fa incollare/copiare a Code sul repo, **diff
   verificato prima del commit**.
g. **Claude Code NON può eseguire DDL** (solo PostgREST): `ALTER`/`DROP TABLE` li
   esegue **Andrea nel SQL editor Supabase**, con **migration versionata in
   `sql/`** per tracciarli.
h. **Verifiche dal vivo**: Code avvia `next dev`, Andrea guarda dal browser, poi
   Code **spegne** il server.

---

## 5) Stato funzionale — aree COMPLETE e verificate

- **Ritiro** (§12b): slot, selettore giorno/orario, persistenza, scadenza slot.
- **Slot Delivery che scade** (§12): azzeramento + blocco pagamento, mai spostamento silenzioso.
- **Coda staff ordinata per orario di riferimento** (Task D, §52-56).
- **Revisione testi cliente completa**: semaforo "Siamo chiusi", errori più chiari,
  "Spese di consegna", GIVEMEFIVE, combo (+€ e label), pagina di stato, meta title.
- **Descrizioni menu + diciture**: "Planted Kebab", "Adana di manzo ed agnello",
  "EXTRA DOSE" su KM Special; descrizioni fritti/sides/dolci popolate.
- **Accompagnamento Bowl obbligatorio** (§21): pulsante disabilitato senza scelta +
  validazione server-side.
- **Allergeni end-to-end** (§67): vocabolario 14 UE + `product_allergens` +
  `sauce_allergens`; rendering cliente con **blocco espandibile "Allergeni"** +
  **badge Vegano/Vegetariano dai flag**; **nota soia-Planted** nel configuratore;
  **bonifica flag legacy** `contains_gluten`/`contains_lactose` (colonne rimosse).

---

## 6) To-do / prossimi passi (in ordine)

### IN CORSO — Editor menu nel pannello staff (progetto a fasi)
Obiettivo: dare allo staff **editing + creazione completa** dei prodotti (inclusi
Roll/Bowl con opzioni), oltre al toggle Esaurito già esistente, così Andrea non
deve chiedere per ogni modifica. **Niente controllo accessi sofisticato per ora**
(scelta consapevole: la pagina staff esistente fa da editor, autenticata via
Supabase Auth + `requireStaffSession`; ruoli/permessi rimandati a dopo il go-live).
**Canale di scrittura già esistente da riusare**: route server staff (es.
`/api/staff/menu/availability`) che **verifica la sessione** e **scrive con service
key**; il client non scrive mai diretto sul DB.

### *** PREREQUISITO DELLA FASE 1 — DA FARE PRIMA DELL'EDITOR: refactoring "combo per id" ***
Oggi il sistema combo (`comboPricingByRoll`, drink combo) usa **`products.name`**
come chiave di lookup → **rinominare un prodotto rischia di rompere i prezzi combo**.
Decisione presa con Andrea: la chiave deve diventare **`products.id`** (identità
immutabile), così nome/categoria/prezzo/appartenenza ai combo diventano attributi
liberamente modificabili. Sequenza:
1. Refactoring codice combo da **name→id** + eventuale migrazione dati delle tabelle
   combo se referenziano per nome, con **verifica che ogni prezzo combo resti
   IDENTICO** (casi test: combo con **KM Special +3 €**, combo con **drink premium**,
   **combo base**).
2. Aggiornare la spec col principio **"id = identità immutabile del prodotto"**.
3. **Solo dopo**, Editor Fase 1.

### Fasi Editor previste
- **F1** — editing campi semplici di prodotti esistenti: `name` (ora sicuro grazie
  al refactoring), `description`, `base_price`, `badge` (SOLO valori non-dietetici),
  `sort_order`; `is_available` già c'è.
- **F2** — editing allergeni + flag dietetici: **UI a prova di errore** (selezione
  dai **14 allergeni**, non testo libero).
- **F3** — creazione prodotti semplici (fritti/sides/dolci/drink).
- **F4** — creazione/editing **Roll/Bowl con opzioni** (proteine/variazioni/
  accompagnamenti/prezzi opzione).
- **Vincoli campi noti**: `slug` **NON editabile** (identificatore); `base_price`
  positivo `numeric(6,2)`; `badge` solo **non-dietetici** (i dietetici vengono dai
  flag — evitare doppioni).
- **Pattern UI riusabili** nel pannello staff: `MenuSection` e `ImpostazioniSection`
  (sezioni client autonome con fetch/stato/refetch) + **form inline stile
  `ReasonForm`** che fa `POST` a una route staff.

### Promemoria spec
Al prossimo aggiornamento spec sostanziale, **togliere "bonifica flag legacy"**
dall'elenco "ancora da fare" di §67 (già fatta, colonne rimosse — commit di DROP
`ca2edce`).

### Aperti (input esterni / Andrea o go-live)
- **Informativa privacy**: serve il documento, poi link nel checkout (§41-45).
- **Stripe live** (oggi sandbox).
- **Dominio** `ordina.kebabmediterraneo.it`.
- **Analytics** (§65).
- **WhatsApp** (fase 1.1).
- **Piano di travaso dati** test → produzione.

---

## 7) Note di attenzione

- **Allergeni = sicurezza alimentare**: mai dedurli, sempre da **fonte verificata
  da Andrea**.
- Le **birre** risultano **senza allergeni** (escluse dal tracciamento): da rivedere
  se un domani si mostrano le bevande al cliente (le birre hanno tipicamente glutine
  e a volte solfiti).
- Le **salse** hanno `is_vegan` **ma NON `is_vegetarian`** (scelta consapevole:
  nessun badge "Vegetariano" sulle salse).
- **`products.name` non è più una chiave sicura** dopo il refactoring combo→id, ma
  **verificare che non resti nessun altro punto** che la usa come chiave (oggi:
  carrello prodotti semplici usa `key: product.name`, e i combo la usano come lookup
  — è proprio ciò che il refactoring elimina).
