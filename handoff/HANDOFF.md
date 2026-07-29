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
**v36** (leggila sempre dall'intestazione, riga 3).

---

## 2) Stato git

- Branch **`main`**, working tree **pulita**, allineata a `origin/main`.
- HEAD: **`71d9d12`**.
- Ultimi commit (dal più recente):

```
71d9d12 carrello: il "−" rimuove la riga a quantità 1, uniformato alla card §36-40
1b52a8b spec: v36 — persistenza carrello e dati checkout §36-40, variazioni validate §18 §46b, pulizia riscritta §66
5ee101c checkout: variazioni validate contro le rimozioni del prodotto, modulo puro con test §46b
d7de8cb carrello: chiave per id sulle righe aggiunte dai suggerimenti, fusione e contatore allineati
2e8dc4e handoff: aggiorna a v35 — Fase 2B chiusa con la piccantezza, lezioni su next build e ricognizioni incomplete
6359e6c pannello: scelta della piccantezza nel form e campi nella GET §34-35 §63-64
aebac0e menu pubblico: piccantezza disegnata anche sulla card semplice, componente condiviso §34-35
55c42e7 spec: v35 — piccantezza disegnata su tutte le card §34-35, livelli delle salse §30, modifica dal pannello §63-64
2438d12 handoff: corregge la dicitura della piccantezza e i 6 articoli già valorizzati
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
- **vanno rimossi i residui di test prima del go-live** (elenco al punto 9);
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
   residuo di prova in più (punto 9).

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

## 9) Stato dei dati (29/07/2026)

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

Il database è uno solo, quindi questi dati staranno in mezzo a quelli veri dal
primo giorno di apertura. **Decisione di Andrea del 29/07/2026: al go-live si
azzera tutto**, senza tenere nulla "per storico".

⚠️ **Questo elenco era incompleto, non vecchio**: mancavano **tre tabelle
intere**, `customers` compresa. I numeri qui sotto sono letti il **29/07/2026
interrogando tutte e 23 le tabelle** e **invecchiano a ogni prova**: prima del
go-live vanno riletti così, non ricopiati da qui (lezioni `s` e `z`).

- **`orders`: 8 righe, tutte di prova** (26-29/07/2026), più **12 righe** in
  `order_items`, di cui **2 con rimozioni** (le prime da quando il progetto
  esiste, dalla verifica di §18). Due ordini con pagamento `succeeded` in
  sandbox — `KM-0001` (29,50 €) e `KM-0008` (23,50 €) — gli altri sei `pending`.
- **`customers`: 27 righe, tutte di prova.** Sono **dati personali**, per quanto
  inventati. Solo 8 hanno un ordine collegato: le altre 19 sono passaggi di
  checkout interrotti, perché il cliente viene scritto **prima** dell'ordine.
  Nessuna ha email o consenso marketing. Anche la riga intestata "Andrea
  Pastore" è una prova, non una persona.
- **`order_status_history`: 12 righe**, tutte su `KM-0001`. Segue gli ordini per
  cancellazione a catena, ma va **nominata**: una tabella che non compare in un
  elenco non viene riletta.
- **`promo_redemptions`: 1 riga** — `GIVEMEFIVE` su `KM-0001`. §14 dà **un solo
  utilizzo per cliente**: finché esiste, quel telefono non può più usare il
  codice.
- **`staff_action_log`: 64 righe, di cui 43 di test** su quattro identificatori
  — `staff:test-spice` (15), `staff:test-fase1` (12), `staff:test-fase2a` (9),
  `staff:test-merge` (7). Le altre **21**
  (`staff:bologna@kebabmediterraneo.com`) sono azioni vere sul menu vero:
  **restano**, sono l'audit trail imposto da §66 e sono **l'unica eccezione**
  all'azzeramento.
- **Vuote al 29/07/2026**, da ricontrollare comunque: `analytics_events`,
  `coupons`, `staff_settings`, `store_schedule_exceptions`.

---

## 10) To-do / prossimi passi (in ordine)

### PROSSIMO — Persistenza del carrello (§36-40), in tre passi

Chiude una **condizione di apertura**. Le regole sono già tutte in spec (v36).

1. **Estrarre il calcolo del prezzo di riga in un punto solo** (§36-40 v36,
   punto 4). È il prerequisito: al rientro i prezzi vanno **ricalcolati**
   perché non si salvano, e oggi il calcolo è chiuso dentro
   `ProductConfigurator` e `ComboBuilder`. Riscriverlo una seconda volta è
   vietato — due implementazioni divergono, sempre (§46).
2. **Il cervello**: salvataggio e ricostruzione, verificati da Code, con le
   regole della v36 — si salva ciò che il cliente ha **scritto o scelto**, mai
   ciò che il sistema ha **concluso**; indirizzo e orario **riverificati** al
   rientro; **consensi mai ripristinati**; carrello svuotato dopo un pagamento
   riuscito.
3. **L'interfaccia**: gli avvisi di ciò che è stato tolto o non regge più,
   mostrati **al rientro** e non alla pressione di "Paga ora". Verifica dal vivo
   di Andrea.

*Nota: ogni verifica dal vivo che arriva alla pagina di pagamento crea un ordine
`pending` in più (punto 9).*

*Rimasta non verificata*: se il **tasto Indietro del browser** si comporti come
il ritorno da Stripe o restituisca la pagina con lo stato ancora vivo (cache di
navigazione). Da chiarire con una prova durante il passo 3.

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

- **Persistenza del carrello** (§36-40, regole complete in v36).
- **Confronto prezzo mostrato vs prezzo addebitato** al checkout (§46).
- **Informativa privacy**: serve il documento, poi link nel checkout (§41-45).
- **Stripe live** (oggi sandbox).
- **Dominio** `ordina.kebabmediterraneo.it`.
- **Analytics** (§65).
- **Pulizia dei residui di test** (punto 9).
- **WhatsApp** (fase 1.1).

---

## 11) Note di attenzione

- **Allergeni = sicurezza alimentare**: mai dedurli, sempre da **fonte verificata
  da Andrea**. Allergeni e flag dietetici si modificano **solo fuori dall'orario
  di servizio**; durante il servizio si tocca **esclusivamente la disponibilità**
  (§67).
- **Roll e Bowl sono indipendenti** — per gli allergeni (§67) **e per le
  rimozioni** (§18). Nessun codice deve mai ricavare i dati di un articolo da
  quelli di un altro. *Al 29/07/2026 tutte e 7 le coppie hanno set di allergeni
  identici, di fatto e non per vincolo.*
- **Prezzo mostrato vs prezzo addebitato** (§46): chi tiene la pagina già aperta
  durante un cambio prezzo vede il vecchio e paga il nuovo. Lo stesso meccanismo
  vale per gli allergeni, ma lì **non c'è alcun controllo al checkout**: è la
  ragione della regola "fuori orario di servizio".
- **Ordini in sospeso destinati a moltiplicarsi** (§65): ogni arrivo alla pagina
  di pagamento crea un `pending`. Con la persistenza del carrello tornare
  indietro diventerà normale, e ogni giro lascerà un `pending` orfano di un
  cliente che **ha comprato**. Da tenere presente quando si costruirà la pagina
  dei carrelli abbandonati.
- **Anche le righe cliente si moltiplicano** (§65, v36): `customers` viene
  scritta **prima** dell'ordine e resta anche se il checkout non arriva in
  fondo. Al 29/07/2026 sono 27, di cui 19 senza alcun ordine. Non è un errore,
  ma vale il divieto d'uso a fini di ricontatto.
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