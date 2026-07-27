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
**v26** (leggila sempre dall'intestazione, riga 3).

---

## 2) Stato git

- Branch **`main`**, working tree **pulita**, allineata a `origin/main`.
- Ultimo commit prima di questo aggiornamento: **`21c955d`** — *handoff: versiona
  HANDOFF.md*.
- Ultimi commit (lavoro recente):

```
21c955d handoff: versiona HANDOFF.md (documento di ripresa progetto in nuova sessione)
39c3a60 spec: v25 — riallineamento completo (blocco Novità, Planted, flag legacy, ruolo admin)
37b8b1f combo: refactoring prezzi combo e chiavi carrello da nome→id (prerequisito editor menu); spec v25
ca2edce schema: rimozione flag legacy products.contains_gluten/contains_lactose (superati da product_allergens)
37107d1 spec: v24 — rendering allergeni al cliente completato §67
```

---

## 3) Cosa vive su GIT vs cosa vive SOLO nel DB di test — ⚠️ CRITICO

**Su git** (versionato, ri-applicabile):
- Codice (`app/`, `lib/`, ecc.).
- `MASTER_SPEC.md` (decisioni) e `handoff/HANDOFF.md` (questo documento).
- Migration di schema: cartella **`sql/`** — attuali:
  `20260723_store_schedule_exceptions.sql`, `20260727_products_is_vegetarian.sql`,
  `20260727_allergens_public_read.sql`, `20260727_drop_legacy_contains_flags.sql`.
- Lo schema autorevole completo: `km_direct_schema.sql`.

**Solo nel DB Supabase di TEST** (NON su git):
- Tutti i **dati del menu**: prodotti, nomi, descrizioni, diciture, prezzi, badge.
- **Allergeni popolati**: `allergens` (14 UE), `product_allergens`, `sauce_allergens`.
- Flag **`is_vegan` / `is_vegetarian`** sui prodotti.
- Le **policy RLS di lettura pubblica** sugli allergeni (tracciate anche in `sql/`).
- Il prodotto **"Polpette di agnello"** (fritti) creato a mano.
- **Ordine di test `KM-0003`** — carrello finto (TEST REFACTORING, 16,50 €), lasciato
  volutamente in `payment_status='pending'`. Serviva a verificare il prezzo
  ricalcolato dal server. Non è un ordine reale: non compare nella coda operativa,
  comparirà tra i carrelli abbandonati (§65).

**Promemoria go-live**: le migration e le policy in `sql/` sono **ri-applicabili** in
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
   completo, Andrea lo scarica e lo fa incollare/copiare a Code sul repo, **diff
   verificato prima del commit**.
g. **Claude Code NON può eseguire DDL** (solo PostgREST): `ALTER`/`DROP TABLE` li
   esegue **Andrea nel SQL editor Supabase**, con **migration versionata in `sql/`**.
h. **Verifiche dal vivo**: Code avvia `next dev`, Andrea guarda dal browser, poi
   Code **spegne** il server.
i. **Verificare prima di committare.** Lezione dell'episodio v25: refactoring e spec
   erano stati committati saltando la verifica prezzi e il blocco Novità, ed è
   servito un recupero. Anche quando l'obiettivo è "fare in fretta", il ciclo resta:
   verifica → spec → commit.

---

## 5) Stato funzionale — aree COMPLETE e verificate

- **Ritiro** (§12b): slot, selettore giorno/orario, persistenza, scadenza slot.
- **Slot Delivery che scade** (§12): azzeramento + blocco pagamento.
- **Coda staff ordinata per orario di riferimento** (Task D, §52-56).
- **Revisione testi cliente completa** (semaforo, errori, spese di consegna,
  GIVEMEFIVE, combo, pagina di stato, meta title).
- **Descrizioni menu + diciture** popolate.
- **Accompagnamento Bowl obbligatorio** (§21).
- **Allergeni end-to-end** (§67): vocabolario 14 UE, `product_allergens`,
  `sauce_allergens`, rendering cliente con blocco espandibile + badge
  Vegano/Vegetariano, nota soia-Planted, flag legacy rimossi. **Capitolo chiuso.**
- **Refactoring combo nome→id** (§25): bibita del combo e chiavi carrello per id.
  Prezzi verificati identici — base 13 €, KM Special 16 €, + drink premium 16,50 € —
  e il **ricalcolo lato server verificato fino alla pagina Stripe** (16,50 €).
- **Casella "18 anni"** (§33): verificata dal vivo nei tre casi + blocco server-side.
  Il server riconosce gli alcolici dalla **categoria letta dal DB**, non dal nome né
  dall'id inviato dal client: un client manomesso non lo aggira.
- **Immutabilità dello storico ordini** (§66): verificata. Le righe `order_items`
  congelano nome, categoria, prezzo e dettagli; storico staff ed export Glovo
  leggono dallo snapshot, mai da `products`. **Prerequisito dell'editor, chiuso.**

---

## 6) To-do / prossimi passi (in ordine)

### PROSSIMO — Editor menu, Fase 1 (campi semplici)

Perimetro deciso in v26 (§63-64): **prima del go-live** si fanno Fase 1, Fase 2
(allergeni/flag) e Fase 3 (creazione prodotti semplici). **Dopo il go-live**:
editing dei contenuti del combo, Fase 4 (Roll/Bowl con opzioni) e creazione di
nuovi tipi di menu combo.

**Fase 1** — editing di `name`, `description`, `base_price`, `badge` (solo non
dietetici), `sort_order` sui prodotti esistenti. `is_available` già c'è.

⚠️ **La Fase 1 non è solo un form: oggi NON esiste alcuna validazione server-side
su questi campi**, e il DB non ha vincoli oltre ai tipi (`base_price numeric(6,2)`
accetta 0 e negativi). Vanno costruite insieme al form, nella route staff (§63-64):
- `name` obbligatorio, max ~60 caratteri; `description` max ~300;
- `base_price` **> 0**, max 9999,99, due decimali;
- `badge` da **lista chiusa non dietetica** (oggi solo "TOP CHOICE") — mai testo
  libero, e mai Vegano/Vegetariano (vengono dai flag, §67);
- `slug` e `id` **non editabili**;
- **conferma esplicita sul cambio prezzo**, con vecchio e nuovo valore a schermo.
- **log in `staff_action_log`** di ogni modifica (campo, prima, dopo) — §66.

**Canale di scrittura da riusare**: route server staff che verifica la sessione con
`requireStaffSession()` e scrive con la secret key (`supabaseAdmin`); il client non
scrive mai diretto sul DB. Modello: `/api/staff/menu/availability`.

**Pattern UI riusabili** nel pannello staff: `MenuSection` (sezione client autonoma
con fetch/stato/refetch), `MenuItemRow` (riga prodotto, punto naturale per un
pulsante "Modifica"), `ReasonForm` (form inline che POSTa a una route staff),
`ImpostazioniSection`.

### Aperti (input esterni / Andrea o go-live)
- **Informativa privacy**: serve il documento, poi link nel checkout (§41-45).
- **Stripe live** (oggi sandbox).
- **Dominio** `ordina.kebabmediterraneo.it`.
- **Analytics** (§65).
- **WhatsApp** (fase 1.1).
- **Piano di travaso dati** test → produzione.
- **Ruoli/permessi** staff vs admin: rimandati a dopo il go-live (§63-64).

---

## 7) Note di attenzione

- **Allergeni = sicurezza alimentare**: mai dedurli, sempre da **fonte verificata
  da Andrea**. Alla creazione di un prodotto nuovo (Fase 3) la dichiarazione
  allergeni è **obbligatoria**.
- **I nomi non si propagano** (§25): il contorno "Patatine KM" del combo e il
  prodotto "Patatine KM" dei fritti sono voci **indipendenti** che condividono il
  testo per coincidenza. Rinominare il prodotto non rinomina il contorno — niente
  si rompe, ma il cliente vedrebbe due nomi diversi. Allineamento manuale finché
  non esisterà l'editor dei contenuti del combo.
- **Residuo noto del refactoring** (§25): contorno e proteina del combo sono ancora
  matchati **per label lato server**. Non tocca la Fase 1 (vivono in tabelle
  diverse da `products`): va convertito a id quando si farà l'editor dei combo,
  dopo il go-live.
- Le **birre** risultano **senza allergeni** (escluse dal tracciamento): da rivedere
  se un domani si mostrano le bevande al cliente (glutine, a volte solfiti).
- Le **salse** hanno `is_vegan` **ma NON `is_vegetarian`** (scelta consapevole).
- Resta in piedi `product_accompaniments.contains_gluten` (contorno Bulgur): è cosa
  diversa dai flag legacy rimossi da `products`, **non va cancellato**.
- **Esiste un `MEMORY.md` fuori dal repo**, nella cartella di memoria di Claude
  Code. Non è versionato e Andrea non lo vede. La verità sta in `MASTER_SPEC.md`:
  se i due divergono, vince la spec.
