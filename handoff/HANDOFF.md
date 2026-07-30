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
**v40** (leggila sempre dall'intestazione, riga 3).

---

## 2) Stato git

- Branch **`main`**, working tree **pulita**, allineata a `origin/main`.
- HEAD: **`f76cf11`**.
- Ultimi commit (dal più recente):

```
f76cf11 spec: v40 — guard Ritiro verificato e stato reale §46b, orizzonte 2 giorni per costruzione, residui e stato editor allineati §66 §63-64 §67
21a3475 handoff: aggiorna a v39 — persistenza del carrello e civico, cache di navigazione chiarita, residui riletti
7a71576 spec: v39 — indirizzo conservato e zona riverificata §36-40 §10, intenzione sconto §14, consensi come atti §41-45
1f36370 checkout: i campi compilati vivono in Home e sopravvivono alla chiusura, consensi esclusi §36-40
2d06a73 indirizzo: avviso quando manca il numero civico e conferma di zona solo con civico §10 §41-45
384c0bf carrello: sopravvive alla visita, ricostruito dal menu fresco e svuotato dopo il pagamento §36-40
2b9cca7 carrello: modulo di persistenza, prepara e ricostruisce dal menu fresco §36-40
70a6130 handoff: aggiorna a v38 — ciclo dei prezzi con calcolo unico, lezioni su prove attribuibili e conclusioni ricorrenti, residui riletti
62d962d spec: v38 — addon identificato dalla proteina §22, extra carne fuori dai combo §25, §46 resta condizione di apertura
a5b434f checkout: l'extra carne non è ammessa nei combo, che contengono solo Roll §22
```

*Nota ricorrente, non un errore*: l'HEAD scritto qui è sempre quello
**precedente** al commit che aggiorna questo documento — l'handoff fotografa
per forza l'istante prima di sé stesso. Va confrontato con `git log`, non
corretto.

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
- **vanno rimossi i residui di test prima del go-live** (elenco al punto 11);
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
descrizioni, prezzi, badge, allergeni, flag dietetici, piccantezza, date di
verifica.

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
   Quando c'è lavoro non committato in corso, il commit va fatto **selettivo**,
   verificando lo stage prima.
g. **Aggiornamenti spec col METODO FILE**: si genera il `MASTER_SPEC.md`
   completo, Andrea lo scarica e lo fa copiare a Code sul repo (con `cp`,
   verbatim), **diff verificato prima del commit**. Controlli standard: riga 3,
   blocco Novità, numero di righe, `numstat` atteso, zone del diff. Il conteggio
   delle zone va dichiarato **come lo conta git** (con le righe di contesto, che
   fondono le zone vicine). Vale anche per l'handoff.
h. **Claude Code NON può eseguire DDL** (solo PostgREST): `ALTER`/`DROP TABLE` li
   esegue **Andrea nel SQL editor Supabase**, con **migration versionata in `sql/`**.
i. **Verifiche dal vivo**: Code avvia **un solo** `next dev` — controllando prima
   che non ce ne siano altri attivi — Andrea guarda dal browser (compreso il
   login staff, che è solo suo), poi Code **spegne** il server e lo conferma.
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
   successo più volte: nullabilità e vincoli non leggibili via API, `route.js`
   non importabili fuori da Next, interruzione a metà non simulabile. La
   dichiarazione permette di decidere se il rischio residuo è accettabile.
u. **Anche lo strumento di verifica può mentire.** Un probe ha segnalato come
   esistenti due tabelle già cancellate: il difetto era nel probe. Davanti a un
   risultato che contraddice una verifica precedente si indaga il dato grezzo
   prima di concludere.
v. **Attenzione a "verificato sul codice vero".** Se il modulo non è
   importabile, provarne una copia **non dimostra l'instradamento**: dimostra
   solo il calcolo. Vale come verifica parziale e va chiusa da una prova dal
   vivo.
w. ⚠️ **Un controllo che non può fallire non sta controllando.** `node --check`
   **non verifica i file JSX**: se il file contiene `import`, Node lo tratta come
   modulo ESM e restituisce esito positivo **anche su JSX palesemente rotto**
   (provato il 29/07/2026). Per i file con JSX — `app/page.js`,
   `app/staff/page.js` — il compile-check si fa con **`next build`**. Per i
   moduli `lib/` resta valido eseguirli davvero.
x. **Una ricognizione lasciata a metà non lascia un buco, lascia assunzioni.**
   Due domande poste il 28/07/2026 e mai riprese hanno prodotto due errori
   distinti in spec, a una settimana di distanza (§34-35, nota di metodo v35).
   Una domanda senza risposta va **riproposta**, non superata.
y. **Spegnere il server dopo ogni verifica dal vivo.** Un `next dev` rimasto
   acceso da una sessione precedente ha fatto perdere tempo a inseguire un 404
   che non c'entrava con il lavoro in corso.

**Lezioni aggiunte il 29/07/2026 (lavoro sul carrello)**

z. **Un elenco si costruisce interrogando tutte le tabelle, non ricordando
   quali si sono toccate.** È il seguito della lezione `s`, e serviva: la v33
   aveva **riletto** i numeri dal database, ma solo dentro le tabelle che
   qualcuno ricordava di aver usato, e ne mancavano **tre intere**
   (`customers`, `order_status_history`, `promo_redemptions`). Rileggere non
   basta se non si sa dove rileggere.
aa. **Prima di riscrivere un documento col metodo file, verificarne
   l'impronta.** La copia dell'handoff caricata all'inizio della sessione del
   29/07 era ferma alla **v33** mentre il repo era alla **v35**: riscriverla
   avrebbe riportato indietro tutto in silenzio, con un diff pieno di modifiche
   che nessuno aveva chiesto. Si confrontano `wc -l`, `wc -c` e `sha256sum`
   prima di partire, e si riparte dal file del repo.
ab. **Una prova dal vivo va descritta indicando esattamente quale comando
   premere.** Una verifica scritta male ("premi −") ha fatto usare ad Andrea un
   pulsante diverso da quello previsto, facendo sembrare fallita una modifica
   riuscita. L'imprecisione era nella prova, non nella risposta — e ha comunque
   fatto emergere un difetto vero (il punto 5 della v36). Quando un esito non
   torna, il primo sospettato è la prova.
ac. **Prima di provare un percorso di rifiuto, verificare sul codice che non
   scriva nulla.** Le tre prove HTTP sulla validazione delle variazioni sono
   state precedute dal controllo che il rifiuto avvenga **prima** di ogni
   scrittura; verificato dopo, il database era intatto. Il percorso
   **positivo**, invece, crea un ordine e va deciso apertamente: costa un
   residuo di prova in più (punto 11).

**Lezioni aggiunte il 30/07/2026 (ciclo dei prezzi)**

ad. ⚠️ **Un rifiuto ottenuto per il motivo sbagliato sembra un successo.**
   Provando che il server rifiutasse l'extra carne con la proteina sbagliata,
   il primo tentativo era privo di accompagnamento e sarebbe stato respinto
   comunque da §21, **prima** di arrivare al controllo cercato. Il 400 sarebbe
   stato scambiato per la prova che la regola funzionava. Una prova di rifiuto
   vale solo se è **attribuibile**: si costruisce partendo da un payload che
   passa e si cambia **un campo solo**, come fatto poi riusando quello di
   `KM-0010` con il solo `extraMeat` aggiunto.
ae. **Una conclusione sbagliata che torna non si corregge ricordandosene.**
   Durante il ciclo dei prezzi la conclusione "i due calcoli ora coincidono,
   quindi §46 è risolto" è ricomparsa **tre volte**, sempre nella stessa forma
   e sempre in buona fede: è una scorciatoia ragionevole che salta un
   passaggio. Correggerla a voce non è servito. È stata chiusa **scrivendola in
   spec** con la frase che toglie l'ambiguità (§46, v38: "va tolto da questo
   elenco solo quando quel confronto sarà implementato e verificato"). Quando
   un errore si ripete, il rimedio è il documento, non l'attenzione.
af. **Una fotografia di verifica non si rigenera dopo la modifica.** La fixture
   dei 609 prezzi vale perché è stata scattata **prima** ed è rimasta ferma:
   rigenerarla dopo un cambiamento la farebbe coincidere sempre, e non
   dimostrerebbe più nulla. Per lo stesso motivo il test non interroga il
   database: un test che rilegge i prezzi vivi fallirebbe al primo cambio dal
   pannello e verrebbe **disattivato invece che ascoltato**.
ag. **Un'opzione si identifica dal dato che la caratterizza, mai dalla sua
   posizione.** È la convenzione già in uso nel server (la label della
   proteina, del contorno, l'id della bibita) ed è stata estesa all'extra carne
   con `requires_protein` (§22, v38). "Prendi la prima riga" funziona finché le
   righe sono una sola, e smette di funzionare in silenzio.

**Lezione aggiunta il 30/07/2026 (persistenza)**

ah. ⚠️ **Le decisioni chiuse si ripresentano come aperte, e vanno richiuse
   ogni volta.** Nel riepilogo di fine lavoro le decisioni già prese
   dall'utente sono state elencate come "in sospeso" **tre volte** (indirizzo,
   sconto, refactoring dello stato del checkout). È il cugino della lezione
   `ae`: là era una conclusione sbagliata che tornava, qui è una decisione
   presa che sparisce. Il rimedio è lo stesso — **scriverla nel documento**, a
   nome di chi l'ha presa e con la data — e il riflesso da tenere è: prima di
   rimettere una cosa nell'elenco degli aperti, cercarla in spec e
   nell'handoff.

**Lezioni aggiunte il 30/07/2026 (allineamento della spec alla v40)**

ai. ⚠️ **Il file da copiare si identifica dall'impronta, mai dal nome.**
   Scaricando la v40, il browser ha salvato `MASTER_SPEC_10.md` e ha lasciato
   in `~/Downloads` un `MASTER_SPEC.md` **del 28/07 fermo a 2277 righe** —
   undici versioni indietro. Un comando che avesse detto "copia
   `MASTER_SPEC.md` dai download" avrebbe riportato indietro tutto in
   silenzio, con un diff enorme che nessuno aveva chiesto. È la lezione `aa`
   un passo più in là: là si verificava l'impronta del documento **prima di
   riscriverlo**, qui quella del file **prima di copiarlo**. Il comando deve
   dare **sha256, `wc -l` e `wc -c` attesi** e ordinare di fermarsi se anche
   uno solo non combacia. *Il file vecchio è ancora lì e la trappola si
   riarma a ogni aggiornamento col metodo file.*
aj. **Una nota di stato lasciata indietro non invecchia in silenzio: mente
   con l'autorità del documento.** §46b dichiarava dalla v14 che il controllo
   server sul Ritiro non esisteva. Era vera quando fu scritta e **falsa dal
   24/07/2026**, quando il guard fu aggiunto; nessuno l'aveva più guardata. Il
   30/07 ha prodotto un sospetto di buco inesistente e un giro di verifica —
   che è il costo *basso*: lo stesso testo, riletto fra un anno, avrebbe
   prodotto un lavoro per costruire una cosa già costruita. Il rimedio non è
   rileggere di più, è **tenere lo stato fuori dalla spec**: la v40 ha
   riscritto quel blocco e ha spostato qui la fotografia dei residui (punto
   11). *La spec tiene le decisioni, l'handoff tiene lo stato.* Le stesse
   note stantie erano in §63-64 e §67, che descrivevano come da fare le Fasi
   2A e 2B già concluse.

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
  codice dedicato (punto 6).
- **Editor menu — FASE 2A** (§67): modifica di **allergeni e flag dietetici**.
- **Unificazione delle salse dentro `products`** (§30) — *conclusa il
  29/07/2026*, punto 6.
- **Editor menu — FASE 2B COMPLETA** (§34-35, §63-64) — *conclusa il
  29/07/2026*, punto 7.
- **Validazione server-side delle variazioni** (§18, §46b) — *29/07/2026*,
  punto 8.
- **Carrello: chiave unica per id e "−" uniformato** (§36-40) — *29/07/2026*,
  punto 8.
- **Calcolo unico del prezzo di riga, sito e server** (§46, §22, §25) —
  *30/07/2026*, punto 9.
- **Persistenza del carrello per la durata della visita** (§36-40) —
  *30/07/2026*, punto 10.
- **Avviso sul numero civico mancante** (§10, §41-45) — *30/07/2026*, punto 10.
- **Campi del checkout che sopravvivono alla chiusura** (§41-45) —
  *30/07/2026*, punto 10.
- **Guard server-side sull'orario di Ritiro** (§46b, §12b) — costruito il
  **24/07/2026** (commit `1e0d6d8`), **verificato il 30/07/2026** leggendo il
  codice: sta nel ramo del pickup, usa la regola della **chiusura inclusa** che
  è propria del Ritiro, e nessun percorso arriva alla scrittura dell'ordine
  saltandolo. ⚠️ **Verifica statica, non dal vivo** — vedi punto 13.

---

## 6) L'unificazione delle salse (28-29/07/2026)

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

Numeri: **62 prodotti** (55 + 7 salse), **76 righe** in `product_allergens`,
**7** articoli con `category='salse'`, leggibili anche dalla chiave pubblica.

**Il guadagno**: le salse hanno ricevuto il pulsante "Modifica" e la conferma
sul cambio di prezzo **senza che sia stata scritta una riga di editor per
loro** — la Fase 2B si è in gran parte dissolta. Ed è ricomparso il badge
"Vegetariano" sulle salse, che il menu spegneva a forza per un commento vecchio.

---

## 7) La piccantezza (29/07/2026) — Fase 2B chiusa

Ultimo pezzo della Fase 2B, costruito in tre passi dopo la migrazione:

1. **`lib/menu-spice.js`** — lista chiusa dei quattro livelli, e
   `lib/menu-editor.js` che valida il livello e **ricava la dicitura dal
   server**. Il client invia **solo `spice_level`**: non esiste un percorso che
   possa far divergere livello e dicitura.
2. **Rendering su tutte le card** (`app/page.js`): fino ad allora la piccantezza
   si disegnava **solo** su Roll e Bowl. Estratto un componente condiviso usato
   da entrambe le card, così non possono divergere.
3. **Pannello**: la GET restituisce i due campi e il form offre la scelta del
   livello, con le diciture importate dal modulo.

**Verificato dal vivo da Andrea**: livello preselezionato corretto,
**Ajvar piccante impostata a 1 e Acuka a 2 dal pannello**, comparse nel menu con
icona e dicitura, valori confermati riaprendo il form e riletti dal database.

**Articoli con piccantezza: 8.** Il Turco e Il Turco Bowl (1, "Leggermente
piccante"); Il Libanese, Il Libanese Bowl, KM Special e KM Special Bowl (2,
"Piccante"); **Ajvar piccante** (1) e **Acuka** (2) — le prime due che non sono
Roll né Bowl, cioè la conferma sul campo che il passo 2 serviva.

⚠️ **Le diciture sono testo di menu**: §19-20 prevale su §34-35. La v32 aveva
fissato "Poco piccante" per il livello 1, in contrasto con §19-20 e con il dato
già in database; corretto in v34. Cambiare una dicitura è una decisione sul
menu, non un dettaglio tecnico.

*Piccolo riordino rimandato*: nella tendina del pannello il livello 0 è
etichettato "Non piccante" direttamente nel form, perché la lista chiusa per
quel livello ha dicitura vuota. Non arriva mai al cliente ed è la formula usata
da §34-35 stessa; da spostare nel modulo quando lo si toccherà di nuovo.

---

## 8) Il carrello e le variazioni (29/07/2026)

Tre lavori, tutti nati dalla ricognizione fatta prima di aprire la persistenza
del carrello. **La persistenza vera e propria non è ancora iniziata**: quanto
segue è il terreno preparato, più ciò che serve sapere per proseguire.

**a. Chiave delle righe di carrello (commit `d7de8cb`)**

Lo stesso articolo aggiunto dal menu e poi dal suggerimento nel carrello finiva
in **due righe separate**: `incrementSimpleProduct` usava l'id come chiave,
`quickAddToCart` il nome. Il prezzo addebitato era comunque corretto (il server
ricalcola), ma il contatore sulla card non vedeva l'articolo e i suggerimenti
continuavano a riproporlo. **Una riga cambiata**, e tre punti si sono allineati
da sé perché usano tutti lo stesso identificatore. Verificato dal vivo.

Contava anche per il seguito: al ritorno da un pagamento le due righe si
sarebbero fuse da sole durante la ricostruzione, e il carrello sarebbe cambiato
forma sotto gli occhi del cliente.

**b. Validazione delle variazioni (commit `5ee101c`, §18 e §46b)**

Le rimozioni erano **l'unica scelta di configurazione non verificata dal
server**: arrivavano dal client e finivano dritte nelle istruzioni per la
cucina, disegnate per giunta nel modo più vistoso possibile (§56, maiuscolo su
etichette rosse). Proteina, accompagnamento, contorno e bibita erano invece
controllati — ma solo perché **spostano il prezzo** e quindi vanno letti
comunque: il controllo era un effetto collaterale del calcolo, e dove il calcolo
non serviva non c'era.

Costruito in due tempi, secondo il metodo `l`:

- **`lib/menu-removals.js`** — funzione **pura**, nessun accesso al database:
  riceve le etichette ammesse per quel prodotto e quelle arrivate dal client, e
  restituisce l'esito. **25 asserzioni** in `tests/menu-removals.test.mjs`,
  eseguibili con `node tests/menu-removals.test.mjs`.
- **Aggancio in `app/api/checkout/route.js`**, nei due punti che non
  controllavano nulla: prodotto singolo (`product_id = ref.id`) e combo
  (`product_id = ref.rollProductId`, cioè il Roll scelto).

Scelte registrate: confronto **esatto** senza normalizzazioni, come le altre
opzioni; **rifiuto dell'intera riga**, non scarto silenzioso del pezzo non
valido; **doppioni scartati**; elenco ammesso mancante trattato come vuoto,
quindi rifiuto — mai accettare al buio.

⚠️ **Un guasto di lettura non è un rifiuto.** `resolveProduct` aveva un solo
canale per dire di no (`null` → 400). Ne è stato aggiunto un secondo, una
sentinella distinta: se la lettura di `product_removals` fallisce si risponde
**500**, mai "variazione non disponibile". Un cliente onesto non deve cambiare
il suo ordine per un guasto nostro.

**Verifiche**: 25/25 sui test; tre richieste HTTP costruite a mano tutte
respinte con 400 — etichetta inventata, etichetta vera **ma di un altro
prodotto** ("Senza feta" su Il Turco), stringa al posto dell'elenco — e database
intatto dopo le prove. Andrea ha poi verificato dal vivo il **percorso normale**,
completando un ordine in sandbox e controllando le variazioni sulla card del
pannello. Resta scoperto da test automatico l'**instradamento** dentro la route
(lezione `t`: `route.js` non è importabile fuori da Next).

*Il caso della stringa al posto dell'elenco era il danno peggiore trovato: il
pannello vi avrebbe fatto sopra un'operazione da lista e la card dell'ordine si
sarebbe rotta. Non un'istruzione sbagliata in cucina, una schermata che non si
disegna.*

**c. Il "−" uniformato (commit `71d9d12`, §36-40)**

Il "−" sulla card rimuoveva l'articolo a quantità 1; quello nel carrello si
fermava a 1 e per togliere serviva "Rimuovi". Due pulsanti uguali, due
comportamenti diversi, **mai decisi da nessuno**. Ora rimuovono entrambi;
"Rimuovi" resta perché su quantità 5 il "−" chiederebbe cinque tocchi. La
condizione di rimozione è scritta **sul valore risultante**, non sul segno del
delta: il "+" non può togliere una riga per costruzione, non per disciplina.

**d. Quello che serve sapere per la persistenza**

Ricognizione del 29/07/2026, tuttora valida:

- **Nessuna persistenza esiste oggi** lato cliente: nessun uso di
  `localStorage`/`sessionStorage`/cookie in `app/page.js` né nelle route del
  checkout. Gli unici usi nel repo sono l'allarme sonoro del pannello staff e i
  cookie di sessione del login staff.
- **Il carrello è una sola variabile di stato React** dentro `Home`
  (`cartItems`), passata come prop ai figli. Nessun context, nessuno store.
  Muore a ogni caricamento.
- **La cosa giusta da salvare esiste già**: ogni riga porta un campo `ref`, che è
  esattamente ciò che viaggia al server al pagamento — **identificativi e
  configurazione, senza prezzi e senza nomi**. È già la forma che §36-40 chiede.
- **Il menu viene caricato da zero al montaggio** della home, senza filtro di
  disponibilità (gli esauriti servono a mostrare l'etichetta). Il campo è
  `is_available` nel database, esposto come `isAvailable`. È il presupposto su
  cui poggia la ricostruzione.
- **Uscita e rientro**: si va a Stripe con una navigazione via dal sito, quindi
  la pagina viene scaricata. `success_url` porta a `/conferma?order_token=…`,
  `cancel_url` alla home. In entrambi i casi è un caricamento da zero.
  *Verificato dal vivo da Andrea*: tornando indietro si perde tutto, carrello e
  dati del checkout.
- ⚠️ **Due ostacoli tecnici veri**, entrambi già registrati in spec:
  1. **il calcolo del prezzo di riga vive dentro i componenti**
     (`ProductConfigurator`, `ComboBuilder`) e non è richiamabile da fuori. Va
     estratto **prima** della persistenza (§36-40 v36, punto 4);
  2. **proteina, contorno, accompagnamento e rimozioni sono identificati per
     label**, non per id (§25, residuo noto). Per il contorno del combo l'id
     esiste già nel client (`sideId`) e semplicemente non viene messo nel `ref`.
     Le rimozioni resteranno label finché non avranno un id proprio.

---

## 9) Il ciclo dei prezzi (29-30/07/2026)

Nato come **prerequisito della persistenza del carrello**: al rientro il
carrello va ricostruito dal menu fresco e i prezzi vanno ricalcolati, perché
§36-40 vieta di salvarli. Il calcolo però viveva **dentro i componenti** che
disegnano le finestre di configurazione, non richiamabile da fuori. Estrarlo ha
aperto una questione più grande, ed è diventato un ciclo di sei commit.

**a. La ricognizione, e cosa ha trovato**

Prezzo mostrato e prezzo addebitato nascevano da **due calcoli diversi**,
scritti in posti diversi. Eseguendoli entrambi su **609 configurazioni reali**:
**zero divergenze**. Nessun cliente ha mai pagato un importo diverso da quello
visto. Ma coincidevano **perché il dato di oggi è benevolo** — un addon per
prodotto tutti a 4 €, nessun supplemento negativo, tutte le righe combo attive,
un solo store — non perché il codice lo impedisse. Cinque strade di divergenza,
tutte inattive e tutte pronte a partire insieme il giorno in cui l'editor
crescesse fino a toccare quei valori.

**b. Le decisioni (v37 e v38)**

- **un solo calcolo**, usato da sito e server: non due che devono coincidere,
  uno che non può divergere;
- il **prezzo dell'extra carne dal database**, non da una costante nel codice;
- i **supplementi si applicano sempre**, qualunque segno: uno sconto è un
  supplemento negativo e va applicato;
- **si arrotonda una volta sola**, a fine riga;
- **gli stessi filtri da entrambe le parti**: il menu non offre ciò che il
  server rifiuterebbe;
- l'**addon si identifica dalla proteina a cui si applica**, non dalla
  posizione — e questo ha chiuso anche §22 lato server;
- l'**extra carne non è ammessa nei combo**: i combo contengono solo Roll,
  l'extra carne esiste solo sulle Bowl (decisione dell'utente).

**c. Il modulo** — `lib/menu-pricing.js` (commit `8a32ef5`)

Puro, senza database e senza React. Due funzioni, `productLinePrice` e
`comboLinePrice`, nella forma `{ ok }` degli altri moduli.

⚠️ **Aritmetica in centesimi interi**: ogni importo diventa un intero, la somma
avviene fra interi, la divisione per 100 avviene **una volta sola alla fine**.
Serve a non ereditare i decimali sporchi della virgola mobile.

Comportamento sui valori mancanti, tutto deciso e coperto da test: **prezzo
base assente → rifiuto** (mai zero, sarebbe un articolo regalato); supplemento
assente → nessun supplemento (caso legittimo: due Roll non hanno scelta
proteina); **qualunque valore presente ma non numerico → rifiuto**; extra carne
applicata senza prezzo → rifiuto, invece di indovinare 4; **prezzo di riga
negativo → rifiuto** (decisione dell'utente: uno sconto che supera il prezzo è
un dato sbagliato, non un'offerta — zero invece è valido).

**La rete**: `tests/menu-pricing-fixture.mjs`, **609 prezzi congelati**,
calcolati con le formule di *prima* della modifica. Il test li ripassa dal
modulo e pretende gli stessi identici numeri. Statica e versionata, **non
interroga il database** (lezione `af`). Ha retto a ogni passo del ciclo:
`differenze: 0` dopo ciascun aggancio.

**d. Gli agganci** — sito (`7e91766`), server (`ef08e0b`), regola sul sito
(`cbea453`), combo (`a5b434f`)

Sul **sito**, tre punti: configuratore, builder del combo e prodotti semplici.
Spariti `EXTRA_MEAT_PRICE` (la costante 4) e `parsePrice` (l'andirivieni
stringa→numero per riottenere un prezzo). Il catalogo ora conserva
`basePriceValue` numerico **accanto** alla stringa da mostrare: convertire
quella stringa avrebbe rotto le card, che si aspettano `"4,50 €"`.

Sul **server**, `resolveProduct` e `resolveCombo` chiamano lo stesso modulo.
Spariti i `+=` e il `round2` sul prezzo unitario; `lineTotal`, `subtotal` e
`total` invariati. Un rifiuto del modulo risponde **500**, non 400: gli input
vengono tutti dal nostro database, quindi è un problema di integrità nostro e
non qualcosa che il cliente possa correggere (regola v36 sul guasto di
lettura).

**Verifiche**: undici punti dal vivo sul sito; quattro ordini via HTTP con gli
attesi **dichiarati prima** di leggerli (4,00 / 15,00 / 13,00 / 21,50 — tutti
combacianti); il rifiuto dell'extra carne con Adana provato in modo
attribuibile.

**e. Cosa NON è chiuso**

⚠️ **§46 resta una condizione di apertura.** L'unificazione ha chiuso le
divergenze **di regola**, non quelle **di dato**: il menu è letto dal browser
una volta sola, quindi chi tiene la pagina aperta mentre un prezzo cambia vede
il vecchio e pagherebbe il nuovo. Manca il confronto fra prezzo mostrato e
prezzo reale, con arresto e avviso. *Questa conclusione è stata sbagliata tre
volte durante il ciclo (lezione `ae`): §46 v38 contiene ora la frase che chiude
la questione.*

Altri tre, registrati in §46 v38 e non fatti:

1. **il calcolo dentro la route non è verificabile da un test** (`route.js` non
   importabile fuori da Next): la strada è estrarre la logica in `lib/`
   lasciando la route sottile sopra, come già fatto altrove. Rinviato
   deliberatamente: non si rimaneggia il percorso di pagamento insieme
   all'unificazione dei prezzi;
2. **il sito non filtra per store** — nessuna sua lettura conosce uno
   `store_id`. Il server filtra comunque al checkout, quindi il vincolo è
   coperto; il sito diventerà consapevole degli store quando i locali saranno
   due;
3. **la nota Planted** (§23) confronta ancora una stringa scritta nel codice
   (`app/page.js`, `protein.id === "planted"`): stesso tipo di problema curato
   sull'extra carne, ma su un testo informativo, non su un prezzo.

## 10) La persistenza del carrello (30/07/2026)

Chiude **metà** della condizione di apertura §36-40: il carrello sopravvive,
i dati del checkout non ancora.

**a. Il modulo** — `lib/cart-persistence.js` (commit `2b9cca7`)

Puro: niente browser, niente React, niente database; importa solo
`lib/menu-pricing.js`. Due responsabilità: **preparare** ciò che si conserva
(solo `ref` + quantità, più un numero di versione del formato — mai prezzi, mai
nomi, mai totali) e **ricostruire** dal catalogo appena caricato, producendo le
righe di carrello **e l'elenco di ciò che è stato tolto, con il motivo**. Il
prezzo di ogni riga si ottiene chiamando `menu-pricing`: nessun secondo calcolo
(§46 v37). **44 asserzioni**, incluso il round-trip.

Regole della ricostruzione, tutte decise: articolo sparito o esaurito → tolto
con motivo; **opzione scelta che non esiste più → la riga si toglie, non si
aggiusta** (non si sostituisce mai una scelta del cliente con un'altra);
versione del formato diversa → si scarta tutto e si riparte da vuoto; struttura
illeggibile o manomessa → stessa cosa, **in silenzio** (non è un cambio di menu
da raccontare al cliente); quantità non valida → riga scartata.

*Nota sull'articolo sparito*: il nome non si conserva, quindi per un articolo
che non è più nel menu l'avviso è generico. Va bene così — **oggi un articolo
non può sparire**: il pannello permette di modificare e segnare esaurito, non
di cancellare. Il caso realistico è l'esaurito, dove il nome fresco c'è.

**b. L'integrazione** (commit `384c0bf`)

Si conserva nella memoria della **singola scheda** (`sessionStorage`, chiave
`km_direct_cart`): dura la visita, sopravvive all'andata e ritorno dal
pagamento perché è la stessa scheda, sparisce chiudendola. Ogni accesso è
protetto: senza quella memoria disponibile il sito funziona come prima, senza
persistenza e senza errori.

⚠️ **La guardia "idratato" è la parte fragile.** Al montaggio il carrello è
vuoto: un salvataggio agganciato ai cambiamenti del carrello, senza guardia,
**cancellerebbe quanto conservato un istante prima che la ricostruzione lo
legga**. Sarebbe sembrato "la persistenza non funziona", senza alcun errore
visibile. Il salvataggio non parte finché la ricostruzione non è stata tentata.

Completano: l'**avviso** di ciò che è stato tolto, mostrato **al rientro** e mai
alla pressione di "Paga ora" (§36-40); e lo **svuotamento** all'arrivo sulla
pagina di conferma, saltato se il pagamento risulta fallito.

**Verificato dal vivo**: andata e ritorno dal pagamento, ricarica della pagina
col carrello pieno, chiusura della scheda (carrello vuoto, come deve),
svuotamento dopo un pagamento completato, e l'avviso provato mettendo un
articolo esaurito dal pannello.

✅ **Il dubbio sulla cache di navigazione del browser è chiuso.** Tornando dal
pagamento con la freccia del browser, **la modalità torna a Delivery**: se la
pagina fosse stata restituita dalla cache con lo stato ancora vivo, sarebbe
rimasta su Ritiro. Quindi la pagina si ricarica davvero, e il carrello che si
ritrova pieno è merito della persistenza.

**c. Il numero civico** (commit `2d06a73`)

Segnalato dall'utente mentre provava il ripristino. Le due protezioni
risultavano **già solide** (pagamento bloccato senza civico, campo non
digitabile, server che rifiuta, zero ordini senza civico in database): mancava
solo **la spiegazione**. Ora un avviso dice cosa manca e cosa fare, e la
conferma "arriviamo fin qui" **non compare senza civico** — il perimetro si
decide sul civico, non sulla via (§10 v39).

**d. Il passo preparatorio ai dati del checkout** (commit `1f36370`)

I dati del checkout erano **spaccati in due**: modalità, indirizzo e orari in
`Home`; **contatti e dettagli di consegna nello stato locale della schermata**,
che sparivano anche solo chiudendo il checkout. Quelli sono stati sollevati in
`Home` — cambiamento a comportamento invariato, tranne il miglioramento voluto:
ora sopravvivono a chiusura e riapertura.

⚠️ **I tre consensi NON sono stati spostati, ed è deliberato** (§36-40 e §41-45
v39): vivendo nello stato locale si azzerano a ogni apertura, e nessuna
persistenza può ripristinarli nemmeno per errore. Nel codice c'è un commento
che lo difende da futuri spostamenti "per simmetria".

**e. Quello che manca** — i dati del checkout

Le regole sono tutte in spec (§36-40 e §41-45, v36 e v39) e le decisioni prese:
si salva ciò che il cliente ha **scritto o scelto**; l'indirizzo si conserva
**con le sue coordinate** e la **zona si ricontrolla** al rientro (le coordinate
non cambiano, cambia il perimetro); gli orari si conservano e si ricontrollano;
l'**intenzione** dello sconto si conserva ma mai l'importo; i **consensi mai**.

Da fare: un **secondo modulo** `lib/checkout-persistence.js` — non un
allargamento di `cart-persistence`, perché il carrello si *ricostruisce* da un
catalogo mentre il checkout si *riverifica*, e tenere i consensi fuori è più
difficile da sbagliare in un modulo che non li conosce. Le funzioni riusabili
per la riverifica esistono già: `isPointInPolygon` (`lib/geo.js`) col poligono
da `/api/geofence`, e `classifyScheduledSelection` contro `/api/service-status`.

## 11) Stato dei dati (30/07/2026)

**Allergeni**

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

**Rimozioni** (rilevante per §18): **70 righe** su **14 prodotti** — i 7 Roll e
le 7 Bowl, nessun altro articolo. Roll e Bowl hanno righe **proprie e
indipendenti**. Le etichette distinte sono **23** e **tutte e 23 sono condivise
da più prodotti**: per questo la validazione va fatta **per `product_id`** e mai
su un elenco globale.

**Residui di test da rimuovere prima del go-live**

⚠️ **Questa è ora l'unica sede di questi numeri.** La v40 li ha tolti dalla
spec, dove restano soltanto la **regola** su come si costruisce l'elenco e
l'eccezione di `staff_action_log` (§66). Motivo: cambiano a ogni verifica dal
vivo, quindi in spec sarebbero sbagliati quasi ogni giorno, e un documento
abitualmente sbagliato in un punto insegna a non fidarsi anche negli altri.
**Se questa sezione sparisse, non resterebbe traccia da nessuna parte.**

Il database è uno solo, quindi questi dati staranno in mezzo a quelli veri dal
primo giorno di apertura. **Decisione di Andrea del 29/07/2026: al go-live si
azzera tutto**, senza tenere nulla "per storico".

⚠️ **Questo elenco era incompleto, non vecchio**: mancavano **tre tabelle
intere**, `customers` compresa. I numeri qui sotto sono letti il **30/07/2026
(sera) interrogando tutte e 23 le tabelle** e **invecchiano a ogni prova**:
prima del go-live vanno riletti così, non ricopiati da qui (lezioni `s` e `z`).
*In una sola giornata sono cambiati tutti: `orders` 8→19, `order_items` 12→29,
`customers` 27→38, `order_status_history` 12→23. Ogni verifica dal vivo che
arriva alla pagina di pagamento ne aggiunge.*

- **`orders`: 19 righe, tutte di prova** (26-30/07/2026), più **29 righe** in
  `order_items`, di cui **4 con rimozioni**. Quattro ordini con pagamento
  `succeeded` in sandbox — `KM-0001`, `KM-0008`, `KM-0015`, `KM-0019` — gli
  altri quindici `pending`. Da `KM-0009` in poi sono tutte verifiche dal vivo
  del ciclo dei prezzi e della persistenza (punti 9 e 10).
- **`customers`: 38 righe, tutte di prova.** Sono **dati personali**, per quanto
  inventati. Diciannove hanno un ordine collegato, **diciannove no**: sono
  passaggi di checkout interrotti, perché il cliente viene scritto **prima**
  dell'ordine. Nessuna ha email o consenso marketing. Anche la riga intestata
  "Andrea Pastore" è una prova, non una persona.
- **`order_status_history`: 23 righe** — venti su `KM-0001`, tre su `KM-0015`.
  Segue gli ordini per cancellazione a catena, ma va **nominata**: una tabella
  che non compare in un elenco non viene riletta. *Sono prove dell'utente sui
  passaggi di stato dal pannello.*
- **`promo_redemptions`: 1 riga** — `GIVEMEFIVE` su `KM-0001`. §14 dà **un solo
  utilizzo per cliente**: finché esiste, quel telefono non può più usare il
  codice.
- **`staff_action_log`: 66 righe, di cui 43 di test** su quattro identificatori
  — `staff:test-spice` (15), `staff:test-fase1` (12), `staff:test-fase2a` (9),
  `staff:test-merge` (7). Le altre **23**
  (`staff:bologna@kebabmediterraneo.com`) sono azioni vere sul menu vero:
  **restano**, sono l'audit trail imposto da §66 e sono **l'unica eccezione**
  all'azzeramento. *Erano 21: le due in più sono la messa e rimessa in
  disponibilità di un articolo durante la verifica dell'avviso (punto 10).*
- **Vuote al 29/07/2026**, da ricontrollare comunque: `analytics_events`,
  `coupons`, `staff_settings`, `store_schedule_exceptions`.

---

## 12) To-do / prossimi passi (in ordine)

### PROSSIMO — Persistenza dei dati del checkout (§36-40, §41-45)

È **la seconda metà** della condizione di apertura §36-40: il carrello
sopravvive già (punto 10), i dati del checkout no. Regole tutte in spec (v36,
v39 e v40), decisioni tutte prese — si può scrivere. *La v40 ha allineato la
spec al codice reale e non ha cambiato nulla di questo lavoro: ha solo aggiunto
**cognome** all'elenco di §36-40, che lo ometteva pur essendo obbligatorio in
§41-45.*

1. **Il cervello**: un secondo modulo `lib/checkout-persistence.js`, con i suoi
   test. Non un allargamento di `cart-persistence`: il carrello si
   *ricostruisce* da un catalogo, il checkout si *riverifica*. Versione del
   formato indipendente.
   - **si salva**: modalità Delivery/Ritiro, indirizzo **con le sue
     coordinate** e civico, citofono, piano, scala, note, nome, cognome,
     telefono, email, giorno e orario richiesti, l'**intenzione** GIVEMEFIVE;
   - **non si salva mai**: prezzi, fee, sconto, totale, esito del controllo di
     zona, disponibilità dello slot — sono conclusioni;
   - **mai i tre consensi**: il modulo non deve nemmeno conoscerli.
2. **L'integrazione**: scrittura e lettura nella memoria della scheda, con la
   **stessa guardia "idratato"** del carrello (punto 10b — è il punto in cui è
   facile introdurre un bug silenzioso), e al rientro la **riverifica**: zona
   contro il perimetro aggiornato (§10), orario contro finestre ed eccezioni
   (§13, §68).
3. **Gli avvisi**: se l'indirizzo non è più in zona o lo slot è scaduto, si dice
   **cosa** e **perché** al rientro, mai alla pressione di "Paga ora". Verifica
   dal vivo di Andrea.

Le funzioni per la riverifica **esistono già** e non vanno riscritte:
`isPointInPolygon` (`lib/geo.js`) col poligono da `/api/geofence`;
`classifyScheduledSelection` (`lib/scheduled-selection.js`) contro
`/api/service-status`. Il meccanismo che rileva uno slot scaduto mentre il
cliente è fermo sulla pagina esiste già e vale anche al caricamento.

*Nota: ogni verifica dal vivo che arriva alla pagina di pagamento crea un ordine
`pending` in più (punto 11).*

### Poi — Fase 3: creazione di articoli semplici

Prodotti (fritti, sides, dolci, drink) **e salse**, che ora sono la stessa cosa.
Dichiarazione allergeni obbligatoria alla creazione: o gli allergeni, o la
casella "nessuno dei 14".

⚠️ **La tendina delle categorie va compilata a mano** con le **8** categorie
reali, escludendo `menu_combo` (§63-64). *La regola v30 che escludeva anche
`salse` è decaduta con l'unificazione: ora è la categoria giusta.*

Da decidere prima di partire: come si genera lo `slug` di un articolo nuovo
(obbligatorio e unico per store) e cosa succede se collide con uno esistente. La
convenzione osservata sui 62 articoli è: minuscolo, accenti tolti, spazi e
apostrofi → trattino, "&" eliminato, numeri e unità invariati.

### Da valutare — campo codice sconto generico

*Annotato dall'utente il 30/07/2026.* Oggi il meccanismo di sconto è cablato
sul solo **GIVEMEFIVE**, con la regola di §14 (un utilizzo per cliente). Parte
dell'impianto esiste già: la tabella `coupons` (vuota) e `promo_redemptions`
che registra gli utilizzi.

⚠️ **Va pensato in concomitanza con GIVEMEFIVE, non dopo**: i due meccanismi
coesisterebbero, quindi va deciso anche se sono **cumulabili** o se si
escludono, e con quale precedenza. Da decidere inoltre: chi crea i codici e da
dove, se hanno scadenza, importo fisso o percentuale, soglia minima, se valgono
una volta per cliente o una volta in assoluto.

*Si incrocia con la regola di §46 v37 sul prezzo di riga negativo*: con codici
liberi accanto a uno sconto fisso, il caso "lo sconto supera il prezzo" smette
di essere teorico. Va verificato dove agisce lo sconto — oggi sul **totale del
carrello**, non sulla riga.

### Residui minori aperti

- **La nota Planted** (§23) confronta una stringa scritta nel codice
  (`app/page.js`, `protein.id === "planted"`). Ultimo caso rimasto del tipo
  curato in v37 e v38 sull'extra carne; meno rischioso perché riguarda un testo
  informativo.
- **Rendere verificabile il calcolo dentro la route di pagamento** estraendolo
  in `lib/` (§46 v38). Lavoro a sé: non si tocca il percorso del pagamento
  insieme ad altro. ⚠️ **Da fare insieme al punto seguente**, perché vivono
  nello stesso file e vale la stessa regola.
- **Il server non riverifica il tempo di preparazione né i quarti d'ora**
  (§46b v40), su **entrambe** le modalità: controlla che l'orario non sia
  passato e che il locale sia aperto, ma non i 15 minuti del Ritiro (§12b) né
  i 60 della Delivery (§12), e accetta un orario in qualunque forma `HH:MM`,
  quindi anche `12:07`. Una richiesta costruita a mano può prenotare un ritiro
  "fra un minuto". **Non è una condizione di apertura** (decisione di Andrea
  del 30/07/2026): il cliente onesto non può raggiungerlo. *Il motivo per cui
  va comunque chiuso non è il furbo di turno — è che il server è la rete sotto
  agli errori del sito: se un domani il client sbagliasse a gestire uno slot
  scaduto, oggi non ci sarebbe nulla a fermarlo.*
- **Le finestre orarie si costruiscono in due punti** (§46b v40): uno alimenta
  il guard, l'altro genera gli slot offerti al cliente. Confrontati riga per
  riga il 30/07/2026, oggi danno lo stesso risultato e l'unica differenza non
  è osservabile. **Non è la doppia implementazione vietata da §46b** — il
  calcolo di finestre ed eccezioni è davvero condiviso — ma sono due copie, e
  due copie divergono. Da unificare quando si toccherà una delle due.
- **Il sito non filtra per store** (§46 v38): da fare quando i locali saranno
  due.

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

- **Persistenza** (§36-40): il **carrello è fatto** (punto 10); restano i
  **dati del checkout**.
- **Confronto prezzo mostrato vs prezzo addebitato** al checkout (§46).
- **Informativa privacy**: serve il documento, poi link nel checkout (§41-45).
- **Stripe live** (oggi sandbox).
- **Dominio** `ordina.kebabmediterraneo.it`.
- **Analytics** (§65).
- **Pulizia dei residui di test** (punto 11).

*Non è una condizione di apertura*: **WhatsApp**, che la spec colloca in
**fase 1.1** (§71) e che §52-56 dichiara esplicitamente fuori dalla specifica
attuale. Compariva in questo elenco fino alla v39, in contraddizione con la
spec; tolto in v40.

---

## 13) Note di attenzione

- **Allergeni = sicurezza alimentare**: mai dedurli, sempre da **fonte verificata
  da Andrea**. Allergeni e flag dietetici si modificano **solo fuori dall'orario
  di servizio**; durante il servizio si tocca **esclusivamente la disponibilità**
  (§67).
- **Roll e Bowl sono indipendenti** — per gli allergeni (§67) **e per le
  rimozioni** (§18). Nessun codice deve mai ricavare i dati di un articolo da
  quelli di un altro. *Al 29/07/2026 tutte e 7 le coppie hanno set di allergeni
  identici, di fatto e non per vincolo.*
- ⚠️ **Prezzo mostrato vs prezzo addebitato** (§46): chi tiene la pagina già
  aperta durante un cambio prezzo vede il vecchio e paga il nuovo. **Il ciclo
  dei prezzi NON ha chiuso questa condizione di apertura**: ha unificato il
  calcolo, quindi sito e server non possono più contare in modo diverso, ma il
  menu resta letto **una volta sola** e il confronto fra prezzo mostrato e
  prezzo reale non esiste ancora. Non dichiararla risolta (lezione `ae`). Lo
  stesso meccanismo vale per gli allergeni, ma lì **non c'è alcun controllo al
  checkout**: è la ragione della regola "fuori orario di servizio".
- **Ordini in sospeso destinati a moltiplicarsi** (§65): ogni arrivo alla pagina
  di pagamento crea un `pending`. Con la persistenza del carrello tornare
  indietro diventerà normale, e ogni giro lascerà un `pending` orfano di un
  cliente che **ha comprato**. Da tenere presente quando si costruirà la pagina
  dei carrelli abbandonati.
- **Anche le righe cliente si moltiplicano** (§65, v36): `customers` viene
  scritta **prima** dell'ordine e resta anche se il checkout non arriva in
  fondo. Al 30/07/2026 sono 38, di cui 19 senza alcun ordine (punto 11). Non è
  un errore, ma vale il divieto d'uso a fini di ricontatto.
- ⚠️ **Il limite dei 2 giorni regge per costruzione, non per controllo**
  (§46b v40). Nessuna riga rifiuta un orario oltre domani: il limite tiene solo
  perché il sito manda un'etichetta (`oggi`/`domani`) e mai una data, e il
  giorno vero lo ricava il server. È una protezione solida ma **silenziosa**:
  chi un domani volesse allungare l'orizzonte del Ritiro — cosa che §12b
  registra come possibile — starebbe togliendo l'unica cosa che oggi impone
  quel limite, **senza che nulla faccia rumore**. Il controllo esplicito va
  aggiunto nello stesso lavoro.
- ⚠️ **Il guard sul Ritiro è verificato staticamente, non dal vivo** (§46b
  v40). È stato seguito il percorso del codice dall'ingresso della route fino
  alla scrittura dell'ordine; **nessuna richiesta è stata costruita per farsi
  respingere davvero**, perché una prova di rifiuto attribuibile (lezione `ad`)
  richiede prima un ordine di prova riuscito, cioè un residuo in più. Vale come
  verifica parziale ai sensi della lezione `v`: se si toccherà quel ramo, è il
  primo punto da riprovare.
- **I consensi non sono dati** (§36-40, v36): privacy, marketing e "18 anni"
  sono **atti** e si rifanno a ogni ordine. Nessun meccanismo di comodità può
  ripristinarli.
- **Quello che l'editor non manda, l'editor non tocca** (§63-64, v34): un campo
  assente dal salvataggio lascia il valore invariato. Senza questa regola un form
  scritto prima che un campo esistesse lo azzererebbe in silenzio.
- **Modifiche concorrenti** (§63-64): l'ultimo salvataggio sovrascrive il primo
  senza avviso. Accettato.
- **I nomi non si propagano** (§25): il contorno "Patatine KM" del combo e il
  prodotto omonimo dei fritti sono voci indipendenti.
- **Residuo noto del refactoring** (§25): contorno e proteina del combo sono
  ancora matchati per label lato server. Da convertire a id con l'editor combo.
  *Con la persistenza del carrello il costo di questo residuo sale: un'etichetta
  rinominata farebbe fallire la ricostruzione di una riga salvata.*
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