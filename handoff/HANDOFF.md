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
**v28** (leggila sempre dall'intestazione, riga 3).

---

## 2) Stato git

- Branch **`main`**, working tree **pulita**, allineata a `origin/main`.
- HEAD: **`92a45ea`**.
- Ultimi commit:

```
92a45ea spec: v28 — badge su tutte le categorie §34-35, prezzo mostrato vs addebitato §46, modifiche concorrenti + Fase 1 realizzata §63-64
8e8d261 editor menu Fase 1: modifica campi prodotto con validazioni e log §63-64/§66; badge visibile su tutte le categorie
4b933f6 spec: v27 — lista chiusa dei badge per l'editor menu §63-64
d417419 spec: v26 — perimetro editor menu vs go-live, regole validazione §63-64, snapshot ordini §66, nomi non propagati §25; handoff aggiornato
21c955d handoff: versiona HANDOFF.md
39c3a60 spec: v25 — riallineamento completo
37b8b1f combo: refactoring prezzi combo e chiavi carrello da nome→id
```

---

## 3) Cosa vive su GIT vs cosa vive SOLO nel DB di test — ⚠️ CRITICO

**Su git** (versionato, ri-applicabile):
- Codice (`app/`, `lib/`, ecc.).
- `MASTER_SPEC.md` (decisioni) e `handoff/HANDOFF.md` (questo documento).
- Migration di schema in **`sql/`**: `20260723_store_schedule_exceptions.sql`,
  `20260727_products_is_vegetarian.sql`, `20260727_allergens_public_read.sql`,
  `20260727_drop_legacy_contains_flags.sql`.
- Lo schema autorevole completo: `km_direct_schema.sql`.

**Solo nel DB Supabase di TEST** (NON su git):
- Tutti i **dati del menu**: prodotti, nomi, descrizioni, prezzi, badge.
- **Allergeni popolati**: `allergens` (14 UE), `product_allergens`, `sauce_allergens`.
- Flag **`is_vegan` / `is_vegetarian`** sui prodotti.
- Le **policy RLS di lettura pubblica** sugli allergeni (tracciate anche in `sql/`).
- Il prodotto **"Polpette di agnello"** (fritti) creato a mano.
- **Ordine di test `KM-0003`** — carrello finto (TEST REFACTORING, 16,50 €), lasciato
  volutamente in `payment_status='pending'`. Serviva a verificare il prezzo
  ricalcolato dal server fino alla pagina Stripe. Non compare nella coda operativa;
  comparirà tra i carrelli abbandonati (§65).
- **12 righe in `staff_action_log`** con `staff_identifier = "staff:test-fase1"`,
  generate dai test della Fase 1 sul prodotto "Pane lavash". Lasciate apposta.
- **Badge attualmente assegnati**: solo "TOP CHOICE", su KM Special (Roll) e KM
  Special (Bowl). Gli altri 6 badge sono disponibili ma non usati.

**Promemoria go-live**: migration e policy in `sql/` sono **ri-applicabili** in
produzione; i **DATI del menu no** — vanno esportati dal DB di test e reinseriti in
produzione (serve un piano di travaso test→prod).

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
f. **Aggiornamenti spec col METODO FILE**: si genera il `MASTER_SPEC.md`
   completo, Andrea lo scarica e lo fa copiare a Code sul repo (con `cp`,
   verbatim), **diff verificato prima del commit**. Controlli standard: riga 3,
   blocco Novità, numero di righe, `numstat` atteso, zone del diff.
g. **Claude Code NON può eseguire DDL** (solo PostgREST): `ALTER`/`DROP TABLE` li
   esegue **Andrea nel SQL editor Supabase**, con **migration versionata in `sql/`**.
h. **Verifiche dal vivo**: Code avvia `next dev`, Andrea guarda dal browser
   (compreso il login staff, che è solo suo), poi Code **spegne** il server.
i. **Verificare prima di committare.** Lezione dell'episodio v25: refactoring e spec
   erano stati committati saltando la verifica prezzi e il blocco Novità, ed è
   servito un recupero. Anche quando l'obiettivo è "fare in fretta", il ciclo resta:
   verifica → spec → commit.
j. **Quando Code trova qualcosa fuori perimetro, si ferma e chiede** invece di
   sistemarlo di iniziativa. Ha funzionato: è così che è emersa la divergenza
   prezzo mostrato/addebitato (§46).

---

## 5) Stato funzionale — aree COMPLETE e verificate

- **Ritiro** (§12b) e **slot Delivery che scade** (§12).
- **Coda staff ordinata per orario di riferimento** (Task D, §52-56).
- **Revisione testi cliente completa**; **descrizioni menu + diciture** popolate.
- **Accompagnamento Bowl obbligatorio** (§21).
- **Allergeni end-to-end** (§67): 14 allergeni UE, `product_allergens`,
  `sauce_allergens`, blocco espandibile lato cliente, badge Vegano/Vegetariano dai
  flag, nota soia-Planted, flag legacy rimossi. **Capitolo chiuso.**
- **Refactoring combo nome→id** (§25): bibita del combo e chiavi carrello per id.
  Prezzi verificati identici (base 13 €, KM Special 16 €, + drink premium 16,50 €)
  e **ricalcolo server verificato fino alla pagina Stripe**.
- **Casella "18 anni"** (§33): verificata dal vivo nei tre casi + blocco server.
  Il server riconosce gli alcolici dalla **categoria letta dal DB**: un client
  manomesso non lo aggira.
- **Immutabilità dello storico ordini** (§66): verificata. Le righe `order_items`
  congelano nome, categoria, prezzo e dettagli; storico staff ed export Glovo
  leggono dallo snapshot, mai da `products`.
- **Editor menu — FASE 1** (§63-64): editing di `name`, `description`,
  `base_price`, `badge`, `sort_order` sui prodotti esistenti, con validazioni
  server-side complete, conferma sul cambio prezzo, form inline nel pannello staff
  e log di ogni modifica. Verificata lato server da Code e **dal vivo da Andrea**.

**File della Fase 1** (per orientarsi subito):
- `lib/menu-badges.js` — lista chiusa `BADGE_OPTIONS` (7 badge), condivisa tra
  server e interfaccia. Aggiungere un badge = modificare questo file.
- `lib/menu-editor.js` — `updateProductCore` e `validateProductPayload`: validazioni,
  update e log. **Isolata dal livello HTTP**, quindi i test esercitano il codice
  vero e non una copia. Riusare questo schema nelle fasi successive.
- `app/api/staff/menu/product/route.js` — route sottile: `requireStaffSession()` +
  core. Scrittura solo con secret key.
- `app/api/staff/menu/route.js` — il GET restituisce anche `description`, `badge`,
  `sort_order`.
- `app/api/staff/menu/availability/route.js` — toggle esaurito, ora **loggato**.
- `app/staff/page.js` — pulsante "Modifica" su `MenuItemRow`, form inline
  `ProductEditForm`, tendina badge, conferma prezzo.
- `app/page.js` — badge disegnato anche da `SimpleProductCard` (§34-35).

---

## 6) To-do / prossimi passi (in ordine)

### PROSSIMO — Editor menu, Fase 2 (allergeni e flag dietetici)

Editing degli **allergeni** e dei flag `is_vegan`/`is_vegetarian` dal pannello.
Vincoli dalla spec:
- selezione **dai 14 allergeni UE** (§67), **mai testo libero**;
- **UI a prova di errore**: gli allergeni sono sicurezza alimentare, mai dedotti,
  solo da fonte verificata da Andrea;
- i badge dietetici restano **derivati dai flag**, mai scrivibili come `badge`
  (§63-64: doppia fonte vietata);
- riusare lo schema della Fase 1: core testabile in `lib/`, route sottile, log in
  `staff_action_log`, form inline.

### Poi — Fase 3 (creazione prodotti semplici)
Fritti, sides, dolci, drink. **Dichiarazione allergeni obbligatoria alla
creazione**: un prodotto nuovo non può nascere senza che gli allergeni siano
dichiarati o esplicitamente confermati come assenti.

### Dopo il go-live (§63-64)
- editing dei **contenuti del combo** (contorni, proteine, supplementi) — richiede
  prima la conversione delle label a id (§25, residuo noto);
- **Fase 4**: creazione/editing di Roll/Bowl con opzioni;
- **creazione di nuovi tipi di menu combo**: richiede un motore generico di
  composizione che finirebbe sul percorso di ricalcolo prezzo. Fino ad allora un
  nuovo tipo di menu si fa come intervento una tantum sul codice;
- **ruoli/permessi** staff vs admin.

### Condizioni di apertura (aperte)
- **Confronto prezzo mostrato vs prezzo addebitato al checkout** (§46) —
  **obbligatorio prima del go-live**, vedi §7.
- **Informativa privacy**: serve il documento, poi link nel checkout (§41-45).
- **Stripe live** (oggi sandbox).
- **Dominio** `ordina.kebabmediterraneo.it`.
- **Analytics** (§65).
- **Piano di travaso dati** test → produzione.
- **WhatsApp** (fase 1.1).

---

## 7) Note di attenzione

- **Allergeni = sicurezza alimentare**: mai dedurli, sempre da **fonte verificata
  da Andrea**.
- **Prezzo mostrato vs prezzo addebitato** (§46): il menu è letto dal browser una
  volta sola al caricamento (nessun polling, nessuna cache Next/ISR), il checkout
  ricalcola dal `base_price` vivo. Chi tiene la pagina **già aperta** durante un
  cambio prezzo vede il vecchio e paga il nuovo. Accettato per ora (sito non
  pubblico). **Regola operativa: cambiare i prezzi fuori orario di servizio.**
  **Da chiudere prima del go-live.**
- **Modifiche concorrenti** (§63-64): due persone che salvano lo stesso prodotto —
  l'ultimo sovrascrive il primo senza avviso. Accettato, nessun blocco.
- **I nomi non si propagano** (§25): il contorno "Patatine KM" del combo e il
  prodotto "Patatine KM" dei fritti sono voci **indipendenti** che condividono il
  testo per coincidenza. Rinominare il prodotto non rinomina il contorno.
- **Residuo noto del refactoring** (§25): contorno e proteina del combo sono ancora
  matchati **per label lato server**. Non tocca le Fasi 1-3 (vivono in tabelle
  diverse da `products`): da convertire a id quando si farà l'editor dei combo.
- **Badge**: un prodotto ne porta **uno solo**. "Special del mese" ha una scadenza
  che il sistema non conosce, va tolto a mano. I badge si tengono accesi **pochi
  per volta**, altrimenti smettono di distinguere.
- Le **birre** risultano **senza allergeni** (escluse dal tracciamento): da rivedere
  se un domani si mostrano le bevande al cliente (glutine, a volte solfiti).
- Le **salse** hanno `is_vegan` **ma NON `is_vegetarian`** (scelta consapevole), e
  non hanno campo `badge`.
- Resta in piedi `product_accompaniments.contains_gluten` (contorno Bulgur): è cosa
  diversa dai flag legacy rimossi da `products`, **non va cancellato**.
- **Esiste un `MEMORY.md` fuori dal repo**, nella cartella di memoria di Claude
  Code. Non è versionato e Andrea non lo vede. La verità sta in `MASTER_SPEC.md`:
  se i due divergono, vince la spec.
