# KM Direct — HANDOFF

Documento per riprendere il progetto in una nuova sessione senza rileggere la
cronologia. Contiene **stato attuale** e **to-do**. Le decisioni e la loro
motivazione stanno in `MASTER_SPEC.md`; la storia dei tentativi sta nei commit.

---

## 1) Cos'è il progetto

Web app per ordini **delivery e ritiro** di **FAME Srl / KM Kebab Mediterraneo**
(Bologna, store `san-mamolo`). Stack **Next.js 14 + Supabase + Stripe (sandbox)**.
Repo: **github.com/Kebabmediterraneo/km-direct** (branch `main`, push via SSH).
La fonte di verità di tutte le decisioni è **`MASTER_SPEC.md`** — versione attuale
**v31** (leggila sempre dall'intestazione, riga 3).

---

## 2) Stato git

- Branch **`main`**, working tree **pulita**, allineata a `origin/main`.
- HEAD: **`6dd9362`**.
- Ultimi commit:

```
6dd9362 editor menu Fase 2A: form allergeni e flag dietetici nel pannello, avviso incoerenza e conferma in rimozione §67
29e80d4 spec: v31 — avviso non bloccante incoerenza allergeni/flag dietetico, casella nessun allergene alla riapertura, stato verifica nel pannello §67
6061724 editor menu Fase 2A: core allergeni e flag dietetici con validazioni, ordine insert-poi-delete e log §67
c8ffee1 spec: v30 — regole editor allergeni §67, conferma in rimozione e casella nessun allergene, un solo database §66, tendina categorie Fase 3 §63-64
4c1e64a migration v29: allergens_verified_at su products e sauces, salse allineate agli articoli, schema aggiornato §30/§34-35/§67
d7eec66 spec: v29 — roll e bowl indipendenti §67, allergens_verified_at e registro verifiche, selettore dietetico a tre voci, salse come articoli §30/§34-35, editor Fase 2A/2B §63-64
30fcb37 handoff: aggiorna a v28 — Fase 1 editor realizzata, prossimo Fase 2, note prezzo/concorrenza
92a45ea spec: v28 — badge su tutte le categorie §34-35, prezzo mostrato vs addebitato §46, modifiche concorrenti + Fase 1 realizzata §63-64
```

---

## 3) ⚠️ ESISTE UN SOLO DATABASE — cambia tutto rispetto a prima

**Verificato il 28/07/2026**: non c'è un ambiente di test separato dalla
produzione. Il progetto Supabase è **uno solo** e il database su cui si lavora
oggi è **lo stesso che servirà i clienti dal giorno dell'apertura**. L'etichetta
"PRODUCTION" mostrata da Supabase è il nome che quel sistema dà al ramo
principale di qualunque progetto: non significa che il sito sia pubblico.

Le versioni precedenti di questo documento parlavano di "DB di TEST": era
sbagliato. Conseguenze, tutte in spec (§66):

- **Cade la condizione di apertura "piano di travaso dati test → produzione"**
  (§46). Non c'è nulla da travasare: menu, allergeni e flag sono già dove
  serviranno. Una condizione in meno, ed era fra le più laboriose.
- **Vanno rimossi i residui di test prima del go-live** (elenco al punto 8).
- **Ogni modifica dal pannello tocca dati vivi**, senza rete di protezione. È la
  ragione delle regole "fuori orario di servizio" (§67) e delle conferme
  esplicite (§63-64, §67).

**Su git** (versionato, ri-applicabile): codice, `MASTER_SPEC.md`,
`handoff/HANDOFF.md`, lo schema autorevole `km_direct_schema.sql`, e le
migration in **`sql/`** (6 file):

```
20260723_store_schedule_exceptions.sql
20260727_allergens_public_read.sql
20260727_drop_legacy_contains_flags.sql
20260727_products_is_vegetarian.sql
20260728_allergens_verified_at.sql
20260728_sauces_as_articles.sql
```

**Solo nel database** (non su git): tutti i dati del menu — prodotti, nomi,
descrizioni, prezzi, badge, allergeni, flag dietetici, date di verifica.

---

## 4) Metodo di lavoro consolidato (vincolante)

a. **Interlocutore = Andrea**, proprietario **senza competenze tecniche**:
   spiegazioni in **linguaggio semplice**; i tecnicismi vanno **solo dentro i
   comandi** da incollare in Claude Code.
b. **Spec prima del codice**: ogni decisione nuova va **prima** in
   `MASTER_SPEC.md`, poi implementata.
c. **UN COMANDO ALLA VOLTA** (aggiunto il 28/07/2026). Mai due comandi nello
   stesso messaggio, mai un comando insieme alla richiesta di scaricare un file.
   Si dà un comando, si aspetta l'esito, poi il successivo. Motivo: mettendone
   due insieme è successo che uno partisse e l'altro restasse indietro — la spec
   v31 è rimasta fuori dal repo per un giro proprio così, e Claude Code ha
   continuato a lavorare sulla versione vecchia senza accorgersene.
d. Le **verifiche le fa Claude Code da sé**, TRANNE: **login staff** (sempre
   Andrea) e **pagamenti reali**.
e. **Modifiche al DB** con **pre-check e post-check**, filtrando **per id**,
   cautela chirurgica specie sugli **allergeni** (sicurezza alimentare: mai
   dedurli, solo da fonte verificata da Andrea).
f. **Commit**: messaggio di **UNA riga**, **MAI footer `Co-Authored-By`**; push
   incluso — se il push fallisce lo fa Andrea dal Terminale. **Un commit per
   tipo di lavoro**: codice e spec non si mescolano nello stesso commit.
g. **Aggiornamenti spec col METODO FILE**: si genera il `MASTER_SPEC.md`
   completo, Andrea lo scarica e lo fa copiare a Code sul repo (con `cp`,
   verbatim), **diff verificato prima del commit**. Controlli standard: riga 3,
   blocco Novità, numero di righe, `numstat` atteso, zone del diff. Il conteggio
   delle zone va dichiarato **come lo conta git** (con le righe di contesto, che
   fondono le zone vicine), altrimenti il numero non torna e si perde tempo.
h. **Claude Code NON può eseguire DDL** (solo PostgREST): `ALTER`/`DROP TABLE` li
   esegue **Andrea nel SQL editor Supabase**, con **migration versionata in `sql/`**.
i. **Verifiche dal vivo**: Code avvia `next dev`, Andrea guarda dal browser
   (compreso il login staff, che è solo suo), poi Code **spegne** il server.
j. **Verificare prima di committare.** Lezione dell'episodio v25.
k. **Quando Code trova qualcosa fuori perimetro, si ferma e chiede** invece di
   sistemarlo di iniziativa. Vale anche al contrario: quando tocca un file
   vicino ma non vietato, lo **dichiara** (è successo con la GET del menu in
   Fase 2A, ed è stato corretto).
l. **Lavori delicati in due tempi** (metodo emerso nella Fase 2A e da riusare):
   **prima il "cervello"** — il modulo che valida e salva, verificato da Code sul
   codice vero — **poi l'interfaccia**, che verifica Andrea dal vivo. Così quando
   Andrea guarda la schermata non sta verificando se il sistema è sicuro (già
   dimostrato), ma se è comoda al banco, che è ciò che sa giudicare lui.

---

## 5) Stato funzionale — aree COMPLETE e verificate

- **Ritiro** (§12b) e **slot Delivery che scade** (§12).
- **Coda staff ordinata per orario di riferimento** (§52-56).
- **Revisione testi cliente completa**; descrizioni menu e diciture popolate.
- **Accompagnamento Bowl obbligatorio** (§21).
- **Allergeni end-to-end lato cliente** (§67): 14 allergeni UE, blocco
  espandibile, badge Vegano/Vegetariano dai flag, nota soia-Planted.
- **Refactoring combo nome→id** (§25), prezzi verificati e ricalcolo server fino
  alla pagina Stripe.
- **Casella "18 anni"** (§33), con blocco server basato sulla categoria dal DB.
- **Immutabilità dello storico ordini** (§66).
- **Editor menu — FASE 1** (§63-64): `name`, `description`, `base_price`,
  `badge`, `sort_order`, con validazioni server-side, conferma sul cambio
  prezzo, form inline e log.
- **Editor menu — FASE 2A** (§67) — *completata il 28/07/2026*: modifica di
  **allergeni e flag dietetici**, su **prodotti food e salse**. Core verificato
  su 14 casi eseguiti sul codice vero; interfaccia verificata dal vivo da Andrea
  su 6 punti.

**File della Fase 2A** (per orientarsi subito):
- `lib/menu-allergens.js` — `updateAllergensCore({ user, payload })`: validazioni,
  ordine di scrittura, flag dietetico, `allergens_verified_at`, log. **Una sola
  funzione per prodotti e salse** (parametro `kind`): le regole sono identiche
  **per costruzione**, non per disciplina. Isolata dall'HTTP, quindi i test
  esercitano il codice vero.
- `app/api/staff/menu/allergens/route.js` — route sottile: `requireStaffSession()`
  + core. Scrittura solo con secret key.
- `app/api/staff/menu/route.js` — la GET dell'elenco, estesa: restituisce i 14
  allergeni (id, label, **code**), gli allergeni correnti di ogni articolo, i
  flag e `allergens_verified_at`.
- `app/staff/page.js` — pulsante "Allergeni", `AllergensEditForm` inline,
  indicatore di verifica nella lista.

**Comportamenti da conoscere** (tutti in §67, v30 e v31):
- il payload **non accetta** `is_vegan`/`is_vegetarian` grezzi, solo
  `dietary: vegan|vegetarian|none` — la combinazione vietata "vegano ma non
  vegetariano" è **impossibile da esprimere**, non solo controllata;
- **ordine di scrittura vincolante**: prima si inserisce, poi si cancella. Se
  qualcosa si interrompe a metà, l'articolo resta con **più** allergeni del vero,
  mai con meno;
- `allergens_verified_at` è l'**ultima** scrittura, e solo se inserimento e
  cancellazione sono entrambi riusciti;
- **drink e birre sono rifiutati dal server** e il form non compare nemmeno;
- l'**avviso di incoerenza** allergeni/flag è dell'interfaccia, non bloccante, e
  confronta i **codici** degli allergeni, non le etichette.

---

## 6) Stato dei dati allergeni (28/07/2026)

- **34 prodotti food su 34** hanno `allergens_verified_at`. Di questi, 29 dal
  documento allergeni ufficiale, **5 confermati senza allergeni da Andrea**:
  Patatine, Polpette di agnello, Dolmadakia, Tabulì, Lokum.
- **7 salse su 7** verificate; 2 confermate senza allergeni: Ajvar e Ajvar
  piccante.
- **21 bevande** (15 drink + 6 birre) **non verificate**, colonna a NULL: sono
  fuori dal tracciamento (§67) e vanno compilate prima di poterle dichiarare
  senza allergeni.
- **Nota Tabulì**: è senza allergeni e **non è in contraddizione con §21**, che
  cita il glutine del **bulgur** come accompagnamento della Bowl. Il tabulì di KM
  è preparato senza bulgur.
- **Salse senza flag vegetariano**: erano 3 (Tzatziki, Black KM, Yogurt); una è
  stata compilata da Andrea durante la verifica del 28/07. Le restanti si
  riconoscono subito: aprendo il form allergeni, il **selettore dietetico si
  presenta vuoto**. Vanno dichiarate da Andrea, non dedotte.

---

## 7) To-do / prossimi passi (in ordine)

### PROSSIMO — Fase 2B (salse al pari sui campi semplici)

Portare le salse allo stesso livello degli altri articoli su `name`,
`description`, `price`, `sort_order`, `badge` e piccantezza. Le colonne
**esistono già** (migration `20260728_sauces_as_articles.sql`). Note:
- il prezzo delle salse si chiama **`price`**, non `base_price`: l'editor deve
  gestirlo, non uniformarlo (§30);
- le salse non hanno `slug` e non entrano nei combo;
- la piccantezza va sempre con il testo accanto all'icona (§34-35); su "Ajvar
  piccante" produce una ridondanza **accettata consapevolmente**, serve a
  distinguerlo dall'Ajvar a colpo d'occhio.

### Poi — Fase 3 (creazione di articoli semplici)
Prodotti (fritti, sides, dolci, drink) **e salse**. Dichiarazione allergeni
obbligatoria alla creazione: o gli allergeni, o la casella "nessuno dei 14".
⚠️ **La tendina delle categorie va compilata a mano** con le sole 7 categorie di
§15: la lista chiusa nel database ne ammette 9, e le due inutilizzate
(`menu_combo`, `salse`) permetterebbero di creare una salsa nella tabella
sbagliata, invisibile alla sezione salse (§63-64, v30).

### Dopo il go-live (§63-64)
- editing dei **contenuti del combo** — richiede prima la conversione delle label
  a id (§25, residuo noto);
- **Fase 4**: creazione/editing di Roll/Bowl con opzioni;
- **creazione di nuovi tipi di menu combo** (richiede un motore generico di
  composizione: fino ad allora, intervento una tantum sul codice);
- **ruoli/permessi** staff vs admin;
- **gestione delle immagini**: il campo `image_url` esiste su prodotti e salse ma
  è **vuoto ovunque** e non c'è modo di caricare una foto dal pannello. È un
  lavoro autonomo, da fare per tutti gli articoli insieme (caricamento file,
  limite di peso, ridimensionamento, archiviazione). Prima o dopo il go-live
  secondo l'esigenza.

### Condizioni di apertura (aperte)
- **Confronto prezzo mostrato vs prezzo addebitato** al checkout (§46) —
  **obbligatorio prima del go-live**.
- **Informativa privacy**: serve il documento, poi link nel checkout (§41-45).
- **Stripe live** (oggi sandbox).
- **Dominio** `ordina.kebabmediterraneo.it`.
- **Analytics** (§65).
- **Pulizia dei residui di test** (punto 8).
- **WhatsApp** (fase 1.1).

*(Il "piano di travaso dati test → produzione" NON è più una condizione: vedi
punto 3.)*

---

## 8) Residui di test da rimuovere prima del go-live

Il database è uno solo, quindi questi dati staranno in mezzo a quelli veri dal
primo giorno di apertura. Sono tutti etichettati e riconoscibili:

- **Ordine `KM-0003`** — carrello finto (TEST REFACTORING, 16,50 €), lasciato in
  `payment_status='pending'`. Non compare nella coda operativa, ma comparirebbe
  fra i carrelli abbandonati (§65) falsandone le statistiche.
- **`staff_action_log`, 21 righe di test su 38 totali**: 12 con
  `staff_identifier = "staff:test-fase1"` e 9 con `"staff:test-fase2a"`. Le
  altre 17 righe (`staff:bologna@kebabmediterraneo.com`) sono azioni vere e
  **non vanno toccate**.

Si tolgono tutte insieme con una ricerca sui due identificatori di test.

---

## 9) Note di attenzione

- **Allergeni = sicurezza alimentare**: mai dedurli, sempre da **fonte verificata
  da Andrea**. Allergeni e flag dietetici si modificano **solo fuori dall'orario
  di servizio**; durante il servizio si tocca **esclusivamente la disponibilità**
  (§67, v30).
- **Roll e Bowl sono indipendenti anche per gli allergeni** (§67, v29). Gli
  allergeni de "Il Turco" e de "Il Turco Bowl" coincidono **di fatto**, non per
  vincolo: sono due dati distinti, senza legame nel database. Tenerli allineati
  è **responsabilità operativa del locale**. Nessun codice deve mai ricavare gli
  allergeni di un articolo da quelli di un altro. *Al 28/07/2026 tutte e 7 le
  coppie hanno set identici.*
- **Prezzo mostrato vs prezzo addebitato** (§46): chi tiene la pagina già aperta
  durante un cambio prezzo vede il vecchio e paga il nuovo. Accettato per ora,
  **da chiudere prima del go-live**. Lo stesso meccanismo vale per gli allergeni,
  ma lì **non c'è alcun controllo al checkout**: è la ragione della regola "fuori
  orario di servizio".
- **Modifiche concorrenti** (§63-64): l'ultimo salvataggio sovrascrive il primo
  senza avviso. Accettato.
- **I nomi non si propagano** (§25): il contorno "Patatine KM" del combo e il
  prodotto omonimo dei fritti sono voci indipendenti.
- **Residuo noto del refactoring** (§25): contorno e proteina del combo sono
  ancora matchati per label lato server. Da convertire a id con l'editor combo.
- **Badge**: un prodotto ne porta **uno solo**. "Special del mese" ha una scadenza
  che il sistema non conosce, va tolto a mano. Tenerne accesi pochi per volta.
  Dalla v29 anche **le salse** hanno il badge.
- Le **birre** risultano senza allergeni perché **escluse dal tracciamento**: da
  compilare se un domani si mostrano le bevande al cliente (glutine, a volte
  solfiti).
- Resta in piedi `product_accompaniments.contains_gluten` (contorno Bulgur): è
  cosa diversa dai flag legacy rimossi da `products`, **non va cancellato**. Nota:
  il glutine vive quindi in **due posti diversi**, e l'editor allergeni copre solo
  `product_allergens` / `sauce_allergens`.
- **Esiste un `MEMORY.md` fuori dal repo**, nella cartella di memoria di Claude
  Code. Non è versionato e Andrea non lo vede. La verità sta in `MASTER_SPEC.md`:
  se i due divergono, vince la spec.
