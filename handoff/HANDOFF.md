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
**v33** (leggila sempre dall'intestazione, riga 3).

---

## 2) Stato git

- Branch **`main`**, working tree **pulita**, allineata a `origin/main`.
- HEAD: **`2757751`**.
- Ultimi commit (dal più recente):

```
2757751 schema: rimosse sauces e sauce_allergens, dismesse con l'unificazione delle salse §30
441026f spec: v33 — migrazione salse applicata e schema da riallineare §30, persistenza carrello §36-40, ordini pending §65, pulizia riletta §66, badge vegetariano risolto §67
16d1cbd migration: dismissione di sauces e sauce_allergens con pre-check di fedeltà §30
e2c3b51 rimosse le compatibilità temporanee kind sauce da checkout, disponibilità e core allergeni §30
a944e6a pannello: salse come categoria nella GET e nella sezione Menu, editor Fase 1 esteso alle salse §30 §63-64
a90220f pannello: cron, disponibilità e core allergeni su products, kind sauce temporaneo §30 §67
1d7e205 menu pubblico: salse lette da products, badge vegetariano dal dato, carrello kind product §30 §67
0e48bfc checkout: salse risolte come prodotti da products, product_id valorizzato §30
7da4117 migration: pre-check rafforzato su id-nome delle salse e cast esplicito della categoria §30
d8e0915 migration: unificazione delle salse in products con pre/post-check in transazione §30
fb4cd5a export: fotografia di sauces e sauce_allergens prima dell'unificazione in products §30
c2003dc spec: v32 — salse unificate in products §30, Fase 2B ridefinita e tendina categorie §63-64, scala piccantezza §34-35, pulizia ordini di test §66
```

---

## 3) ⚠️ ESISTE UN SOLO DATABASE

**Verificato il 28/07/2026**: non c'è un ambiente di test separato dalla
produzione. Il progetto Supabase è **uno solo** e il database su cui si lavora
oggi è **lo stesso che servirà i clienti dal giorno dell'apertura**. L'etichetta
"PRODUCTION" mostrata da Supabase è il nome che quel sistema dà al ramo
principale di qualunque progetto: non significa che il sito sia pubblico.

Conseguenze, tutte in spec (§66):

- **non esiste la condizione di apertura "travaso dati test → produzione"**:
  non c'è nulla da travasare;
- **vanno rimossi i residui di test prima del go-live** (elenco al punto 8);
- **ogni modifica dal pannello tocca dati vivi**, senza rete di protezione. È la
  ragione delle regole "fuori orario di servizio" (§67) e delle conferme
  esplicite (§63-64, §67).

**Su git** (versionato, ri-applicabile): codice, `MASTER_SPEC.md`,
`handoff/HANDOFF.md`, lo schema autorevole `km_direct_schema.sql`, e le
migration in **`sql/`** (9 file):

```
20260723_store_schedule_exceptions.sql
20260727_allergens_public_read.sql
20260727_drop_legacy_contains_flags.sql
20260727_products_is_vegetarian.sql
20260728_allergens_verified_at.sql
20260728_sauces_as_articles.sql
20260728_sauces_export_pre_merge.sql      ← fotografia salse pre-unificazione
20260728_sauces_merge_into_products.sql   ← unificazione (eseguita)
20260729_drop_sauces_tables.sql           ← dismissione (eseguita)
```

**Solo nel database** (non su git): tutti i dati del menu — prodotti, nomi,
descrizioni, prezzi, badge, allergeni, flag dietetici, date di verifica.

**Nota sullo schema autorevole**: `km_direct_schema.sql` è il documento su cui
si ripiega quando il database non è leggibile dal vivo (PostgREST espone solo lo
schema `public`: nullabilità, default, trigger e vincoli non sono raggiungibili
via API). Il 29/07/2026 è stato verificato allineato alla realtà: le 23 tabelle
che descrive esistono tutte, nessuna in più, nessuna in meno.

---

## 4) Metodo di lavoro consolidato (vincolante)

a. **Interlocutore = Andrea**, proprietario **senza competenze tecniche**:
   spiegazioni in **linguaggio semplice**; i tecnicismi vanno **solo dentro i
   comandi** da incollare in Claude Code.
b. **Spec prima del codice**: ogni decisione nuova va **prima** in
   `MASTER_SPEC.md`, poi implementata.
c. **UN COMANDO ALLA VOLTA.** Mai due comandi nello stesso messaggio, mai un
   comando insieme alla richiesta di scaricare un file. Si dà un comando, si
   aspetta l'esito, poi il successivo.
d. Le **verifiche le fa Claude Code da sé**, TRANNE: **login staff** (sempre
   Andrea) e **pagamenti reali**.
e. **Modifiche al DB** con **pre-check e post-check**, filtrando **per id**,
   cautela chirurgica specie sugli **allergeni** (sicurezza alimentare: mai
   dedurli, solo da fonte verificata da Andrea).
f. **Commit**: messaggio di **UNA riga**, **MAI footer `Co-Authored-By`**; push
   incluso. **Un commit per tipo di lavoro**: codice e spec non si mescolano.
g. **Aggiornamenti spec col METODO FILE**: si genera il `MASTER_SPEC.md`
   completo, Andrea lo scarica e lo fa copiare a Code sul repo (con `cp`,
   verbatim), **diff verificato prima del commit**. Controlli standard: riga 3,
   blocco Novità, numero di righe, `numstat` atteso, zone del diff. Il conteggio
   delle zone va dichiarato **come lo conta git** (con le righe di contesto, che
   fondono le zone vicine).
h. **Claude Code NON può eseguire DDL** (solo PostgREST): `ALTER`/`DROP TABLE` li
   esegue **Andrea nel SQL editor Supabase**, con **migration versionata in `sql/`**.
i. **Verifiche dal vivo**: Code avvia `next dev`, Andrea guarda dal browser
   (compreso il login staff, che è solo suo), poi Code **spegne** il server.
j. **Verificare prima di committare.**
k. **Quando Code trova qualcosa fuori perimetro, si ferma e chiede** invece di
   sistemarlo di iniziativa. Vale anche al contrario: quando tocca un file
   vicino ma non vietato, lo **dichiara**.
l. **Lavori delicati in due tempi**: prima il **"cervello"** — il modulo che
   valida e salva, verificato da Code sul codice vero — poi l'**interfaccia**,
   che verifica Andrea dal vivo.

**Metodo delle migrazioni (consolidato nell'unificazione salse, 28-29/07/2026)**

m. **Export di sicurezza prima di toccare i dati**: fotografia versionata in
   `sql/` (DDL + INSERT di ripristino), verificata campo per campo. Database uno
   solo, nessuna rete: l'export è l'unica via di ritorno.
n. **Migrazione in transazione**, con **pre-check e post-check bloccanti dentro
   la stessa transazione**, messaggi d'errore in italiano. O passa tutta o non
   passa niente: non esiste lo stato "a metà".
o. **I pre-check verificano la fedeltà, non solo i conteggi.** Un controllo che
   conta le righe non si accorge di uno scambio: nell'unificazione è servito un
   controllo **id → nome** articolo per articolo, perché una targa attribuita
   all'articolo sbagliato avrebbe lasciato i conteggi corretti.
p. **Prima si scrive il nuovo, poi si dismette il vecchio**, in due esecuzioni
   separate, con le verifiche dal vivo in mezzo. `drop table` **senza
   `cascade`**: un collegamento non mappato deve produrre un errore rumoroso,
   non un danno silenzioso.
q. **Adeguamento del codice a passi separati**, un commit per passo, tenendo
   temporaneamente aperte le "porte di servizio" (compatibilità con il vecchio
   formato) e **dichiarandole con un commento**, così che ogni passo sia
   indipendente. Alla fine si chiudono, e il vecchio formato va **rifiutato con
   errore**, non ignorato.
r. **Gli id non si cambiano mai in migrazione.** È ciò che ha reso banale il
   trasferimento degli allergeni e che ha permesso al carrello di continuare a
   funzionare mentre il codice veniva adeguato un pezzo alla volta.

**Lezioni di verifica (da non ripetere)**

s. **Mai ricostruire un elenco per differenza.** L'elenco dei residui di test è
   stato sbagliato **due volte**, sempre sottraendo conteggi invece di leggere
   le righe. Si legge dal database, uno per uno, con le date.
t. **Quando una verifica non è possibile, va dichiarata, non aggirata.** È
   successo tre volte: nullabilità e vincoli non leggibili via API, `route.js`
   non importabili fuori da Next, interruzione a metà non simulabile. In tutti
   e tre i casi la dichiarazione ha permesso di decidere se il rischio residuo
   era accettabile.
u. **Anche lo strumento di verifica può mentire.** Un probe ha segnalato come
   esistenti due tabelle già cancellate: il difetto era nel probe. Davanti a un
   risultato che contraddice una verifica precedente si indaga il dato grezzo
   prima di concludere.
v. **Attenzione a "verificato sul codice vero".** Se il modulo non è
   importabile, provarne una copia **non dimostra l'instradamento**: dimostra
   solo il calcolo. Vale come verifica parziale e va chiusa da una prova dal
   vivo.

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
  prezzo, form inline e log. **Dal 28/07/2026 copre anche le salse**, senza
  codice dedicato (vedi punto 6).
- **Editor menu — FASE 2A** (§67): modifica di **allergeni e flag dietetici**.
  Core verificato su 14 casi eseguiti sul codice vero; interfaccia verificata
  dal vivo da Andrea.
- **Unificazione delle salse dentro `products`** (§30, v32-v33) — *conclusa il
  29/07/2026*, vedi punto 6.

---

## 6) L'unificazione delle salse (28-29/07/2026) — cosa è cambiato

Fino al 27/07 le salse vivevano in una tabella a parte (`sauces`), con regole
identiche agli altri articoli ma **codice separato**: ogni campo nuovo andava
costruito due volte. La v29 aveva deciso di tenerle distinte, motivandolo con lo
storico ordini; la ricognizione del 28/07 ha mostrato che **le righe d'ordine
non referenziano affatto le salse** e che tutti gli ordini presenti erano di
prova. La v32 ha quindi rovesciato quella decisione.

**Stato finale**: le salse sono righe di `products` con `category = 'salse'`,
con gli **stessi id di prima**; i loro allergeni sono in `product_allergens`; le
tabelle `sauces` e `sauce_allergens` **non esistono più**. Nessun riferimento a
quelle tabelle resta nel codice applicativo.

Numeri al 29/07/2026: **62 prodotti** (55 + 7 salse), **76 righe** in
`product_allergens`, **7** articoli con `category='salse'`, leggibili anche
dalla chiave pubblica del sito.

**File toccati** (un commit per passo): `app/api/checkout/route.js`,
`app/page.js`, `app/api/cron/reset-availability/route.js`,
`app/api/staff/menu/availability/route.js`, `lib/menu-allergens.js`,
`app/api/staff/menu/route.js`, `app/staff/page.js`, `km_direct_schema.sql`.

**Il guadagno**: le salse hanno ricevuto il pulsante "Modifica" e la conferma
sul cambio di prezzo **senza che sia stata scritta una riga di editor per
loro** — la Fase 2B si è in gran parte dissolta. Ed è ricomparso il badge
"Vegetariano" sulle salse, che il menu spegneva a forza per un commento vecchio:
si è risolto da sé perché è sparito il percorso di rendering separato.

**Verifiche dal vivo superate** (Andrea): menu pubblico (salse una volta sola,
ordine e prezzi corretti, badge Vegetariano su Black KM); pannello (pulsante
Modifica, descrizione scritta e ricancellata, conferma sul cambio prezzo);
checkout fino alla pagina di pagamento, in Ritiro e in Delivery sopra il minimo.

---

## 7) Stato dei dati allergeni (29/07/2026)

- **34 prodotti food su 34** hanno `allergens_verified_at`. Di questi, 29 dal
  documento allergeni ufficiale, **5 confermati senza allergeni da Andrea**:
  Patatine, Polpette di agnello, Dolmadakia, Tabulì, Lokum.
- **7 salse su 7** verificate; 2 confermate senza allergeni: Ajvar e Ajvar
  piccante. Le altre: Tzatziki 1, Acuka 1, Black KM 2, Yogurt 1, Salsa
  all'aglio 1.
- **21 bevande** (15 drink + 6 birre) **non verificate**, colonna a NULL: sono
  fuori dal tracciamento (§67) e vanno compilate prima di poterle dichiarare
  senza allergeni.
- **Nota Tabulì**: è senza allergeni e **non è in contraddizione con §21**, che
  cita il glutine del **bulgur** come accompagnamento della Bowl. Il tabulì di KM
  è preparato senza bulgur.
- ⚠️ **2 salse senza flag vegetariano**: **Tzatziki** e **Yogurt** hanno
  `is_vegetarian` a NULL, quindi non mostrano alcun badge dietetico. Si
  riconoscono subito: aprendo il form allergeni, il **selettore dietetico si
  presenta vuoto**. Vanno dichiarate da Andrea, **mai dedotte**.

---

## 8) Residui di test da rimuovere prima del go-live

Il database è uno solo, quindi questi dati staranno in mezzo a quelli veri dal
primo giorno di apertura.

⚠️ **Questo elenco è stato sbagliato due volte** perché ricostruito per
differenza invece che letto. I numeri qui sotto sono letti dal database il
**29/07/2026** e **invecchiano a ogni prova**: prima del go-live vanno riletti,
non ricopiati da qui.

- **`orders`: 6 righe, tutte di prova** (26-28/07/2026), più **8 righe** in
  `order_items`. `KM-0001` (delivery, 29,50 €) è l'unico con pagamento
  `succeeded`, in sandbox; gli altri 5 sono `pending`. `KM-0004`, `KM-0005` e
  `KM-0006` sono le prove di checkout della migrazione salse. **Si azzerano
  entrambe le tabelle.**
- **`staff_action_log`: 47 righe, di cui 28 di test** su tre identificatori —
  `staff:test-fase1` (12), `staff:test-fase2a` (9), `staff:test-merge` (7). Le
  altre **19** (`staff:bologna@kebabmediterraneo.com`) sono azioni vere e **non
  vanno toccate**.

---

## 9) To-do / prossimi passi (in ordine)

### PROSSIMO — piccantezza (ciò che resta della Fase 2B)

Unico pezzo rimasto della Fase 2B, e **non riguarda solo le salse**: va aggiunto
all'editor per tutti gli articoli. Regole in §34-35 (v32):

- `spice_level` vale **0, 1, 2 o 3** (0 = non piccante);
- `spice_label` è una **lista chiusa** — "Poco piccante" (1), "Piccante" (2),
  "Molto piccante" (3) — obbligatoria da 1 in su, vuota a 0;
- **l'editor presenta una sola scelta** e scrive entrambe le colonne insieme:
  livello e dicitura non possono divergere;
- la lista vive nel codice come quella dei badge, `lib/menu-badges.js` è il
  modello;
- su "Ajvar piccante" la ridondanza col nome è **accettata consapevolmente**
  (§30).

Oggi `spice_level` è 0 e `spice_label` vuota su tutti gli articoli.

### Poi — Fase 3 (creazione di articoli semplici)

Prodotti (fritti, sides, dolci, drink) **e salse**, che ora sono la stessa cosa.
Dichiarazione allergeni obbligatoria alla creazione: o gli allergeni, o la
casella "nessuno dei 14".
⚠️ **La tendina delle categorie va compilata a mano** con le **8** categorie
reali, escludendo `menu_combo` (§63-64, v32). *La regola v30 che escludeva anche
`salse` è decaduta con l'unificazione: ora è la categoria giusta.*

### Dopo il go-live (§63-64)

- editing dei **contenuti del combo** — richiede prima la conversione delle label
  a id (§25, residuo noto);
- **Fase 4**: creazione/editing di Roll/Bowl con opzioni;
- **creazione di nuovi tipi di menu combo** (richiede un motore generico di
  composizione: fino ad allora, intervento una tantum sul codice);
- **ruoli/permessi** staff vs admin;
- **gestione delle immagini**: `image_url` esiste su tutti gli articoli ma è
  **vuoto ovunque** e non c'è modo di caricare una foto dal pannello. Lavoro
  autonomo, da fare per tutti gli articoli insieme.

### Condizioni di apertura (aperte)

- **Persistenza del carrello per la durata della visita** (§36-40, v33) —
  **nuova**: oggi tornando indietro dalla pagina di pagamento il carrello si
  svuota. Si salvano id, quantità e configurazione, **mai i prezzi**; articoli
  non più disponibili rimossi con avviso esplicito.
- **Confronto prezzo mostrato vs prezzo addebitato** al checkout (§46).
- **Informativa privacy**: serve il documento, poi link nel checkout (§41-45).
- **Stripe live** (oggi sandbox).
- **Dominio** `ordina.kebabmediterraneo.it`.
- **Analytics** (§65).
- **Pulizia dei residui di test** (punto 8).
- **WhatsApp** (fase 1.1).

---

## 10) Note di attenzione

- **Allergeni = sicurezza alimentare**: mai dedurli, sempre da **fonte verificata
  da Andrea**. Allergeni e flag dietetici si modificano **solo fuori dall'orario
  di servizio**; durante il servizio si tocca **esclusivamente la disponibilità**
  (§67).
- **Roll e Bowl sono indipendenti anche per gli allergeni** (§67). Gli allergeni
  de "Il Turco" e de "Il Turco Bowl" coincidono **di fatto**, non per vincolo.
  Nessun codice deve mai ricavare gli allergeni di un articolo da quelli di un
  altro. *Al 29/07/2026 tutte e 7 le coppie hanno set identici.*
- **Prezzo mostrato vs prezzo addebitato** (§46): chi tiene la pagina già aperta
  durante un cambio prezzo vede il vecchio e paga il nuovo. Lo stesso meccanismo
  vale per gli allergeni, ma lì **non c'è alcun controllo al checkout**: è la
  ragione della regola "fuori orario di servizio".
- **Ordini in sospeso destinati a moltiplicarsi** (§65, v33): ogni arrivo alla
  pagina di pagamento crea un `pending`. Con la persistenza del carrello tornare
  indietro diventerà normale, e ogni giro lascerà un `pending` orfano di un
  cliente che **ha comprato**. Da tenere presente quando si costruirà la pagina
  dei carrelli abbandonati.
- **Modifiche concorrenti** (§63-64): l'ultimo salvataggio sovrascrive il primo
  senza avviso. Accettato.
- **I nomi non si propagano** (§25): il contorno "Patatine KM" del combo e il
  prodotto omonimo dei fritti sono voci indipendenti.
- **Residuo noto del refactoring** (§25): contorno e proteina del combo sono
  ancora matchati per label lato server. Da convertire a id con l'editor combo.
- **Badge**: un prodotto ne porta **uno solo**. "Special del mese" ha una scadenza
  che il sistema non conosce, va tolto a mano. Tenerne accesi pochi per volta.
  Vale anche per le salse.
- Le **birre** risultano senza allergeni perché **escluse dal tracciamento**: da
  compilare se un domani si mostrano le bevande al cliente (glutine, a volte
  solfiti).
- Resta in piedi `product_accompaniments.contains_gluten` (contorno Bulgur): è
  cosa diversa dai flag legacy rimossi da `products`, **non va cancellato**. Nota:
  il glutine vive quindi in **due posti diversi**, e l'editor allergeni copre solo
  `product_allergens`.
- **Esiste un `MEMORY.md` fuori dal repo**, nella cartella di memoria di Claude
  Code. Non è versionato e Andrea non lo vede. La verità sta in `MASTER_SPEC.md`:
  se i due divergono, vince la spec.
