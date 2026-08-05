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
**v57** (leggila sempre dall'intestazione, riga 3).

---

## 2) Stato git

- Branch **`main`**, working tree **pulita**, allineata a `origin/main`.
- HEAD: **`254ffad`** — la spec v57 (05/08/2026).
- Ultimi commit (dal più recente):

```
254ffad spec: v57 — tendina categorie con una regola sola perché leggerle dal database non è possibile, tre decisioni della Fase 3 con il rischio allergeni accettato, la pagina carrelli abbandonati esiste e non va costruita, referto mensile e perimetro dei documenti §63-64 §65 §69
0411db5 spec: sfoltita passo 1 — via i 42 blocchi Novità dalla v14 alla v55, resta il solo blocco corrente; portate nel corpo le due voci che vivevano solo lì
91f055f handoff: stato al 05/08 — conteggi riletti e ordine di prova del 04/08 registrato, puntatore alla v56 e HEAD allineati, quattro imprecisioni corrette, quattro lezioni nuove e la sezione 20
1f74e8f spec: v56 — corretta la destinazione dei motivi di problema e annullamento, annullamento in sequenza da problema, due decisioni di §65 chiuse
f5e9e8b handoff: giro sugli script di pulizia dati del 04/08 e stato dopo la v55
1686c93 spec: v55 — i tre script di pulizia esistono, staccare invece di cancellare anche al go-live, sequenza di apertura fissata e chiave service_role verificata §65 §66 §69
f54c29d sql: script di pulizia dati — azzeramento pre-go-live con freno sull'ultima prova, pulizia mensile degli ordini mai pagati, e referto dei conteggi di sola lettura §66 §69
```

*Nota ricorrente, non un errore*: l'HEAD scritto qui è sempre quello
**precedente** al commit che aggiorna questo documento — l'handoff fotografa
per forza l'istante prima di sé stesso. Va confrontato con `git log`, non
corretto.

⚠️ **Correzione della formulazione (05/08/2026)**: la frase qui sopra descrive
una distanza di **uno**, ma la distanza normale è di **due**, perché fra lo
stato fotografato e il commit di questo documento passa quasi sempre anche la
spec — la regola "prima la spec, poi l'handoff" la mette in mezzo per
costruzione. *Rilevato da Code il 05/08 confrontando `git log` con questo
blocco: l'HEAD dichiarato era giusto, era la spiegazione a non coprire il caso
normale della coppia spec+handoff.*

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

⚠️ **Nella stessa cartella stanno anche i tre script di pulizia dati** (commit
`f54c29d`, 04/08/2026), che **non sono migrazioni** e non vanno confusi con
esse: `conteggi_dati_sola_lettura.sql`,
`ESEGUIRE_UNA_VOLTA_SOLA_prima_del_golive_CANCELLA_TUTTI_GLI_ORDINI.sql` e
`pulizia_mensile_ordini_mai_pagati.sql` (punto 19). *Fino al 05/08/2026 questo
elenco diceva "le migration in `sql/` (9 file)" senza nominarli: chi leggesse
solo questo punto avrebbe una fotografia incompleta della cartella. I file veri
sono dodici.*

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
   fondono le zone vicine), e **insieme alla mappa zona → sezione** con la
   dimensione di ciascuna: un numero da solo non è un riscontro (lezione `ao`).
   Ogni misura confrontata dentro un comando va ripulita con `| tr -d ' '`
   (lezione `an`). Vale anche per l'handoff.
   *Nota su questo file*: `handoff/HANDOFF.md` **non termina con un a capo**,
   a differenza di `MASTER_SPEC.md`. È una caratteristica di come viene
   generato, non del repo: un editor che lo riaprisse e lo "sistemasse"
   aggiungendolo cambierebbe l'impronta senza cambiare una sola parola. Da
   sapere al prossimo confronto, non da correggere.
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

**Lezioni aggiunte il 30/07/2026 (persistenza del checkout)**

ak. ⚠️ **Ciò che un comando dichiara come atteso va letto dal file, mai
   ricordato — e va citato per intero.** In una sola giornata lo stesso
   difetto si è presentato **quattro volte**, sempre da parte di chi scriveva
   i comandi e mai del codice: l'elenco delle zone attese di un diff ricavato
   a memoria (due zone collocate male); la forma `{ ok }` attribuita a
   `cart-persistence`, che invece la consuma soltanto; due righe rimosse
   descritte come "voci dell'elenco" quando una era la coda di una nota. La
   quarta è la più insidiosa perché **il fatto citato era vero**: la
   validazione dell'orario in `computeScheduledDeliveryAt` è stata citata
   riportando la sola regex di riga 243 e tacendo la riga 246, che rifiuta
   `24:00` e `12:60` — chi legge conclude ragionevolmente il contrario del
   vero. *Una citazione parziale è più pericolosa di una sbagliata: non
   suona falsa.* Il rimedio è meccanico: l'elenco delle zone si ricava dal
   diff, la forma di un modulo si legge dal modulo, e una validazione si cita
   tutta o non si cita.
al. **Il modo in cui il carrello si difende dal salvataggio prematuro NON si
   trasferisce al checkout.** Il carrello usa un `useRef`; copiarlo per il
   checkout ha prodotto un difetto che non dava alcun errore. Al montaggio
   girano **tutte** le effect: il ref risultava già armato quando partiva il
   salvataggio, che però vedeva lo stato **prima** del ripristino e riscriveva
   la memoria con i campi vuoti un istante dopo averla letta. Il carrello ne è
   immune solo perché il suo ripristino **attende `menuData`**, e quell'attesa
   sposta l'ordine dei giri. La soluzione è uno **stato** invece di un ref, che
   arma il salvataggio al render successivo. *Sarebbe sembrato "la persistenza
   ogni tanto non funziona": nessun errore a schermo, nessuno nel log.*
am. **Prima di dichiarare che la spec non dice, cercare.** La domanda "i dati
   del checkout spariscono dopo un ordine completato?" è stata posta come
   aperta **due volte** nella stessa sessione. §36-40 (v36) la chiude da mesi:
   si svuotano gli **articoli**, i dati del checkout **possono restare** per
   il resto della visita. È il gemello opposto della lezione `aj`: là si era
   creduto a una frase vecchia, qui si era data per assente una frase che
   c'è. *Stesso rimedio: cercare nel documento prima di concludere, in
   entrambe le direzioni.*
an. ⚠️ **Un guard che confronta numeri come testo si rompe sugli spazi.** Il
   comando di copia della v43 confrontava righe e byte con `[ "$L" != "$RIGHE" ]`.
   Su macOS `wc` allinea l'output a destra, quindi `L` valeva `" 3731"` e non
   `"3731"`: stringhe diverse, blocco scattato su un file perfettamente
   integro. Gli attesi erano stati calcolati su Linux, dove gli spazi non ci
   sono. **Rimedio: `| tr -d ' '` su ogni misura prima di confrontarla.** La
   spia, nell'output, è il divario di spaziatura fra i due numeri stampati
   accanto. *Code ha fatto la cosa giusta a non aggirare il blocco (metodo
   `k`): che il difetto fosse del guard e non del file non autorizza a
   scavalcarlo.*
ao. **Le zone attese di un diff vanno dichiarate con la sezione, non come
   numero.** Per la v43 era stato dichiarato "10 zone": Code le ha trovate
   dieci, ma ha dovuto costruirsi da solo la mappa zona → sezione, che non
   aveva un atteso contro cui rompersi. Un numero solo verifica che il
   **totale** torni, non che le modifiche siano atterrate dove dovevano: dieci
   zone giuste in punti sbagliati darebbero lo stesso "10". **D'ora in poi
   l'elenco va dichiarato prima, con sezione e dimensione di ciascuna zona.**
ap. ⚠️ **Una sonda che cerca ciò che ci si aspetta, quando non trova, sembra
   dire "non c'è".** Il 31/07/2026 tre comandi di ricognizione hanno mancato il
   bersaglio nello stesso modo: cercavano test chiamati `*.test.js` mentre qui
   sono `.mjs` (otto suite esistenti diventate zero), leggevano la richiesta con
   `req.json` mentre la route usa `request` e destruttura in blocco, e
   estraevano gli export con `export function|const` mentre `menu-pricing` usa
   un blocco `export { … }` finale. **Un filtro vuoto non è una risposta
   vuota**: è "ho guardato nel posto sbagliato", e va distinto. *Rimedio: la
   sonda si costruisce dalla forma reale del file — che si legge — non da come
   ci si aspetta che sia fatto.*
aq. ⚠️ **Una variabile vuota dentro un filtro corrisponde a TUTTO.** Caso
   peggiore del precedente, stesso giorno: `NAMES` è rimasto vuoto e
   `grep -nE "$NAMES"` ha stampato 34 KB, cioè il file intero, dando
   l'impressione di aver risposto. Il calcolo successivo, che cercava la "prima
   occorrenza", ha risposto riga 1. **Una sonda che non trova insospettisce;
   una che trova tutto sembra un risultato.** *Rimedio: ogni comando che
   costruisce un filtro al volo deve fermarsi se il filtro è vuoto, prima di
   usarlo.*
ar. **Se si approva su prova indiretta, va scritto su cosa poggiava il sì.** Il
   modulo `price-guard` è stato approvato sui suoi 31 test e sull'elenco dei
   punti di uscita, **non sulla lettura diretta**: il file era stato chiesto due
   volte e non era mai arrivato nella conversazione. Procedere è stata una
   scelta ragionevole — i 13 casi erano stati scritti prima di vedere il codice
   — ma la differenza fra "l'ho letto" e "ho letto le prove che lo riguardano"
   non va lasciata implicita, perché fra sei mesi nessuno la ricostruisce.
as. ⚠️ **Una prova che non raggiunge il punto che crede di provare è peggio di
   una prova assente.** Il caso costruito per l'uscita 369 mandava la
   latitudine come stringa numerica; la route non guarda il tipo, applica
   `Number()`, e `Number("44.48")` è finito, quindi passava oltre e cadeva
   sull'ordine minimo. La fotografia dichiarava coperta un'uscita che non
   toccava mai. *Un buco dichiarato si può colmare; uno che sembra colmato no.*
   **Rimedio: ogni caso deve dichiarare l'esito atteso, e uno scatto vale solo
   se ogni caso ci arriva davvero** — è così che il difetto è emerso.
at. **La rete ha smentito un'affermazione, non del codice.** Il difetto di `as`
   stava in una frase scritta nella tabella delle "forme minime", non in un
   file: "basta mandare la latitudine come stringa" *suona* giusto e nessuna
   rilettura l'avrebbe smentita. Solo l'esecuzione l'ha fatto. *È la forma più
   pura della lezione `ak`: ciò che si può eseguire non si ricorda.*
au. **Lo spazio di contesto è una risorsa da controllare PRIMA di aprire un
   lavoro lungo, non quando finisce.** Il 31/07 il riordino della route è stato
   rinviato a sessione nuova con la finestra al 51%: non per stanchezza, ma
   perché quella tappa non si può interrompere a metà, e perché una finestra
   che si riempie inizia a perdere i vincoli dati all'inizio — è lì che
   compaiono le modifiche a file che si era detto di non toccare. *Chiudere a
   punto pulito e ripartire costa nulla quando spec e handoff sono aggiornati:
   è precisamente ciò per cui esistono.*
av. ⚠️ **Sei sonde sbagliate in una sola sessione, tutte della stessa
   famiglia.** Il 01/08/2026: `\<`/`\>` non supportati dall'awk di macOS (zero
   risultati per **tutte** le variabili, comprese quelle certamente usate);
   `grep … | head -20 || echo "nessuna"` — l'exit code del pipe è quello di
   `head`, sempre 0, quindi il ramo di allarme **non può scattare** e "vuoto"
   significa *non lo so*; `grep -A3` su JSON caduto sul ramo "verifica
   manuale"; un apostrofo che ha chiuso la stringa della shell; `grep
   "supabase"` che ha classificato come dipendente dal database un file la cui
   unica occorrenza era **un commento che dichiara il contrario**;
   `^const NOME = ` che ha contato sei costanti invece di sette, perché una ha
   il valore sulla riga dopo.
   **Rimedio, in tre regole**: la sonda si costruisce sulla forma **vera** del
   file, che si legge prima; un guard che non può fallire non sta controllando
   (lezione `w`); e un risultato vuoto va distinto da un filtro che non ha
   funzionato — se conta, si ricontrolla con un metodo diverso.
aw. ⚠️ **La v46 è stata pubblicata con una descrizione FALSA della sua regola
   più pericolosa.** Il punto sulla sentinella affermava che una copia locale
   avrebbe degradato il guasto in *"articolo non disponibile"* con 400. Falso:
   un `Symbol` è **veritiero**, quindi `if (!resolved)` non scatta, la
   sentinella estranea prosegue **come riga valida**, il prezzo diventa `NaN`,
   e **scavalca ordine minimo e controllo dei 18 anni** prima di schiantarsi
   sull'insert — dopo che la riga cliente è già scritta. Nel guard degli orari
   la conseguenza è ancora diversa: solleva. *Il danno vero era peggiore di
   quello descritto, e non uniforme fra i due punti.*
   La frase **suonava giusta**, era coerente col resto del blocco ed era stata
   scritta da chi il codice l'aveva appena spostato: **nessuna rilettura
   l'avrebbe smentita**. L'ha smentita l'esecuzione, richiesta apposta prima
   del commit. **Rimedio: le affermazioni della spec su cosa succede se una
   regola viene violata si verificano eseguendole, non rileggendole** —
   soprattutto quando la spec stessa le definisce le più pericolose.
ax. **Le impronte proteggono il trasporto, non il senso.** La v46 sbagliata era
   già copiata nel repo con tutte e tre le misure combacianti: erano giuste,
   perché il file era arrivato integro — era il **contenuto** a essere
   sbagliato. Nessun guard automatico poteva accorgersene, dato che gli attesi
   li calcola chi ha scritto il file. *Il controllo del contenuto resta un
   lavoro di lettura, e va fatto prima del commit: dopo, è cronaca.*
ay. ⚠️ **Quando la spec DESCRIVE com'è fatto il codice, i fatti si verificano
   prima di scrivere, non dopo.** Il 01/08 il punto 7 di §46 ha richiesto **tre
   stesure**: la prima sbagliava il numero di uscite di un gruppo, la seconda
   azzeccava il numero e affermava che un `409` fosse "scritto separatamente"
   nella route, dove non c'è. Entrambe suonavano giuste ed erano coerenti col
   resto del blocco. *La distinzione che serve: **le regole si decidono, le
   descrizioni si controllano**. Una regola nasce da una scelta e la spec è la
   sua fonte; una descrizione del codice ha una fonte esterna — il codice — e
   va confrontata con quella prima di essere pubblicata.*
   **Rimedio operativo**: prima di scrivere un blocco che descrive il codice,
   farsi dare i fatti da Code; e includere nella nota storica **come si
   falsifica** l'errore corretto — nel caso del `409`, un `grep` su
   `status: 409` nella route. *Un errore descritto insieme al modo di smentirlo
   non torna una terza volta.*
az. **I conteggi si eseguono, non si `grep`ano.** Stesso giorno: `grep -c 'id: '`
   sul catalogo dei casi dava **28** contando anche `storeId:` e gli uuid delle
   fixture; `grep -n 'status: [a-zA-Z]'` dava **4** status dinamici contando un
   campo dell'ordine (`delivery_status: isDelivery ? …`) come una risposta HTTP.
   I numeri veri — **23** casi e **3** status — si ottengono **eseguendo** il
   catalogo (`CASI.length`) e **leggendo** le righe trovate una per una.
   *Un conteggio testuale su codice conta stringhe, non cose: se il numero
   finisce in un documento, va preso da un'esecuzione o da una lettura.*
ba. ⚠️ **Una condizione scritta sulla forma attesa invece che su quella vera:
   la stessa lezione, per la terza volta in due giorni.** Il 02/08 il ramo del
   sito riconosceva il rifiuto per articolo dal **testo** (giusto: i `400`
   distinti sono quattordici) e quello per prezzo dal **solo status** (sbagliato:
   i `409` sono quattro). Il caso concreto: uno slot scaduto sarebbe finito nel
   carrello, **dove il selettore dell'orario non esiste**, contro §41-45 v18.
   *È emerso contando le uscite `409` nel codice, non rileggendo il
   ragionamento — e la parte istruttiva è che era già stato evitato sull'altro
   lato dello stesso `if`.*
bb. ⚠️ **Un guard di test che non poteva fallire nel modo che dichiarava.** Il
   controllo doveva verificare che un testo nella route fosse **codice e non un
   commento**; usava `includes` sull'intero file, quindi commentando la riga la
   sottostringa restava trovabile e il test continuava a passare. *Scoperto
   **mutando il file in memoria** per vedere se scattava, non rileggendolo.*
   È la lezione `w` in forma nuova: **ogni guard nuovo va provato a fallire**,
   e la prova va fatta sul caso che il guard dichiara di coprire, non su uno
   più facile.
bc. **Un `includes` su un documento non conta le occorrenze che vanno a capo.**
   Un conteggio del testo di un messaggio nella spec dava **1** invece di **3**,
   perché il documento manda a capo dentro i backtick. *Le tre lezioni `ba`,
   `bb` e `bc` sono la stessa cosa in tre forme, e sono tornate tutte nello
   stesso giro: **quello che si può eseguire non si rilegge — si esegue, e poi
   si guarda se il controllo poteva davvero fallire**.*
bd. ⚠️ **Righe e byte non sono un'impronta.** Il 04/08/2026 due versioni
   dell'handoff da copiare avevano **le stesse identiche righe (1894) e gli
   stessi byte (114184)**: la correzione era `v52`→`v53`, che non cambia la
   lunghezza. Un guard che confronta solo quelle due misure — la forma di
   quasi tutti gli script usati finora — **sarebbe passato su entrambi i file
   dicendo OK**, e avrebbe potuto ricopiare quello sbagliato senza che nulla
   facesse rumore. *È la lezione `ai` un passo più in là: là il pericolo era
   identificare il file dal nome, qui è credere che due misure di dimensione
   siano un'identità. **Solo lo `sha256` distingue**; righe e byte sono un
   indizio, e su una modifica di un carattere non distinguono nulla.*
be. **Quando cambia la versione della spec, nell'handoff i punti da
   correggere sono due, non uno.** La riga 15, che dichiara quale versione
   della spec è quella corrente, e l'HEAD del §2. Il 04/08/2026 la v53 è stata
   committata con la riga 15 ferma alla **v52**: il controllo era stato fatto
   sull'HEAD e non sul puntatore. *Il documento è stato salvato dalla propria
   parentesi — "leggila sempre dall'intestazione, riga 3" — che dice al lettore
   di non fidarsi di quella riga; ma una nota di stato falsa resta falsa, ed è
   la lezione `aj`. La verifica dopo una copia va fatta su **entrambi**.*
bf. **Un numero fornito a voce finisce nei documenti.** Nello stesso giorno la
   dimensione di `app/privacy/page.js` è stata riportata come **848 righe** in
   un riepilogo di fine lavoro, stimata invece che misurata; da lì è entrata
   nella tabella dei file di questo handoff ed è stata committata. Le righe
   vere sono **995**, e le dice il `numstat` del commit `c69642e`. *Chi scrive
   il documento si fida del numero che riceve: chi lo fornisce deve averlo
   **eseguito**, non ricordato — è la lezione `az`, presa dal lato di chi passa
   il dato invece che di chi lo scrive.*

**Lezioni aggiunte il 05/08/2026 (ricognizione su §62b e spec v56)**

bk. ⚠️ **Una descrizione del codice creduta, e usata come fondamenta di un
   ragionamento intero.** §62b dichiarava dalla sua stesura che il motivo del
   problema e quello dell'annullamento sono "registrati in
   `order_status_history`". È **falso**: quella tabella non ha una colonna che
   possa ospitare un testo di motivo. Sopra quella frase era stata costruita una
   raccomandazione articolata — copiare il motivo nel `payload` degli eventi
   statistici perché la pulizia mensile l'avrebbe altrimenti perso — che era
   **coerente, motivata e interamente sbagliata**, e che si è sciolta appena la
   ricognizione ha detto dove il motivo finisce davvero. *È la lezione `ay` dal
   lato di chi legge: là si diceva che una descrizione del codice va confrontata
   con il codice **prima di essere pubblicata**; qui si aggiunge che va
   confrontata anche **prima di essere usata come premessa**. Il costo è stato
   nullo solo perché la ricognizione è stata chiesta prima di scrivere in spec;
   fatta dopo, sarebbe stata una decisione da disfare.*
bl. ⚠️ **Due misure dello stesso oggetto, incompatibili, scritte lo stesso
   giorno in due documenti.** Il 04/08 i conteggi dichiaravano `orders` 30 con
   l'ultimo ordine al 01/08, mentre la prova del freno di §69 citava un
   `max(created_at)` del **04/08 alle 13:07**. Non potevano essere vere
   entrambe, ed erano a poche righe di distanza in file che vengono committati
   insieme. Nessuno le ha messe a confronto perché **ciascuna era stata scritta
   nel proprio contesto e verificata lì**. *Rimedio: quando la stessa grandezza
   compare in due punti — un conteggio e un massimo, un totale e un elenco — il
   confronto fra i due è esso stesso una verifica, e costa una lettura. È la
   forma documentale della lezione `z`: non basta rileggere, bisogna sapere
   dove.*
bm. **Un conteggio delle righe di un diff che non vede le righe vuote.**
   Preparando gli attesi della v56, `grep -c '^+[^+]'` ha dato **107** righe
   aggiunte invece di **125**: il filtro escludeva le righe aggiunte **vuote**,
   che nel diff sono un `+` solo. Il numero sbagliato era diretto al comando di
   copia, dove avrebbe fatto scattare il guard su un file perfettamente
   integro — cioè avrebbe insegnato a diffidare del controllo (lezione `bi`).
   *Scoperto perché il netto non tornava con la differenza fra le righe dei due
   file: 4704 → 4813 sono +109, e +107/−16 ne dà +91. **La contro-misura non è
   una sonda migliore, è tenere due strade che devono coincidere.***
bn. **Il browser non sovrascrive da solo i file scaricati** (nota rimasta in
   coda dal 04/08/2026). Quel giorno in `~/Downloads` è rimasta una sola copia
   dell'handoff, e da lì era stato dedotto che il browser avesse sovrascritto la
   precedente: l'aveva invece **cancellata Andrea a mano**. La deduzione portava
   alla conclusione giusta per il motivo sbagliato, ed è il tipo di falsa
   sicurezza che rilassa un controllo. *Confermato il 05/08: il file della v56 è
   stato salvato come `MASTER_SPEC_2.md` accanto al vecchio `MASTER_SPEC.md`,
   esattamente la trappola della lezione `ai`. **La regola resta: si cerca per
   impronta, sempre**, e il comando di copia deve dichiarare gli attesi del
   sorgente e ordinare di fermarsi.*

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
- **Persistenza dei dati del checkout** (§36-40, §41-45) — *30/07/2026*, punto
  10b. **Verificata dal vivo da Andrea su sei prove, tutte superate.** Chiude
  la condizione di apertura §36-40. ⚠️ Due strade restano **non provate dal
  vivo** per scelta: vedi punto 10b.
- **Confronto fra prezzo mostrato e prezzo addebitato** (§46) — *01-02/08/2026*,
  punti 11b-11f. Server e sito: il prezzo mostrato viaggia con la richiesta, il
  server confronta al centesimo e si ferma prima di qualunque scrittura, il sito
  rilegge il listino e riporta al carrello. **Verificato dal vivo da Andrea su
  due rami** — prezzo cambiato e articolo esaurito, entrambi a carrello pieno.
  Chiude la condizione di apertura §46. ⚠️ **Il ramo dello slot scaduto è
  verificato solo leggendo**: vedi §11f.e.
- **Route di pagamento riordinata** (§46, v46) — *01/08/2026*, punto 11d: da
  **691 a 332 righe**, con il comportamento verificato identico su 20 casi dopo
  ognuno dei quattro passi. *Non è una funzione per il cliente: è ciò che rende
  verificabile tutto il resto.*

---

## 6-11f) Le giornate dal 28/07 al 02/08/2026 — ciò che sopravvive al racconto

⚠️ **Questa sezione ha sostituito, il 05/08/2026, milleundici righe di diario.**
Il racconto giorno per giorno vive in `git log` e nei messaggi di commit. Qui
resta ciò che serve a chi lavora domani: **cosa è chiuso, i divieti, i limiti
noti, ciò che è stato verificato solo leggendo.** *Nulla è andato perso: le
sedici sezioni originali sono nel deposito, ultima versione integra al commit
`254ffad`.*

### Cosa è stato chiuso, in una riga per giornata

| quando | cosa | esito |
|---|---|---|
| 28-29/07 | **unificazione salse** — le salse sono righe di `products` con `category='salse'`, **stessi id di prima**; `sauces` e `sauce_allergens` non esistono più | 62 prodotti, 76 righe in `product_allergens`, 7 salse |
| 29/07 | **piccantezza** — Fase 2B chiusa; il client invia **solo `spice_level`**, la dicitura la ricava il server | 8 articoli con piccantezza, verificati dal vivo |
| 29/07 | **carrello e variazioni** — chiave delle righe unificata, rimozioni validate dal server, il "−" uniformato | 25 asserzioni + prove HTTP |
| 29-30/07 | **ciclo dei prezzi** — un solo modulo `lib/menu-pricing.js` per sito e server | 609 prezzi congelati, `differenze: 0` |
| 30/07 | **persistenza carrello e checkout** — §36-40 **CHIUSA**, verificata dal vivo su sei prove | `cart-persistence` 44 asserzioni, `checkout-persistence` 110 |
| 31/07-02/08 | **confronto prezzi §46 — CHIUSA**, in quattro tappe: modulo, fotografia della route, aggancio al server, lato sito | 13 suite, 461 asserzioni |

✅ **La chiusura di §46 è stata verificata dal vivo da Andrea il 02/08/2026 su due
rami**: prezzo cambiato dal pannello a carrello pieno, e articolo messo esaurito
nella stessa situazione. Entrambi si comportano come deciso, e **la prova non ha
lasciato residui** — per la prima volta.

### I divieti — regole che sembrano dettagli e non lo sono

⚠️ **Un guasto nostro non diventa mai un rifiuto al cliente.** Se la lettura di
un dato fallisce si risponde **500**, mai un messaggio che dica al cliente che la
sua scelta non è disponibile. *Vale per `product_removals` (§8) e per il modulo
dei prezzi (§9): gli input vengono dal nostro database, quindi un problema lì è
nostro e il cliente non può correggerlo cambiando il suo ordine.*

⚠️ **Le diciture della piccantezza sono testo di menu**: §19-20 prevale su
§34-35. Cambiarne una è una decisione sul menu, non un dettaglio tecnico. *La
v32 aveva fissato "Poco piccante" per il livello 1 contro §19-20 e contro il dato
già in database; corretto in v34.*

⚠️ **Il modulo del confronto prezzi non restituisce mai un importo**, né mostrato
né reale: solo un verdetto fra `OK`, `CHANGED` (409) e `MALFORMED` (400). È reso
impossibile da violare **per costruzione**: a valle non c'è nulla da addebitare
per sbaglio.

⚠️ **Il confronto dei prezzi scatta prima di QUALUNQUE scrittura**, non solo
prima dell'ordine `pending`: sta prima anche della riga cliente, che è comunque
un residuo (§65).

⚠️ **Lo stato della zona ha tre valori, non due**: *non ancora verificato / in
zona / fuori zona*. Chi lo riducesse a un sì-o-no riaprirebbe il difetto che
§36-40 v42 esiste per impedire — un indirizzo dichiarato fuori zona mentre il
perimetro non è ancora arrivato. Il verdetto è **derivato** da coordinate e
perimetro, non uno stato che qualcuno aggiorna.

⚠️ **I tre consensi non si salvano, e sono impossibili da salvare per
costruzione**: il modulo copia una lista chiusa di chiavi dichiarate e non fa
mai lo spread dello stato, quindi una chiave non dichiarata non lo attraversa
nemmeno passandogli l'intera schermata. Vivono nello stato locale del checkout
**apposta perché si azzerino**, e nel codice c'è un commento che li difende da
futuri spostamenti "per simmetria" (§36-40 e §41-45 v39).

⚠️ **La gestione del rifiuto è rimasta in `CheckoutScreen`** con una funzione
passata dall'alto, e non è comodità: portarla in `Home` avrebbe trascinato su i
tre consensi.

⚠️ **Il rifiuto del server si riconosce dal TESTO, non dallo status.** È il punto
più insidioso di tutta §46: i testi distinti sono **quattordici** con `400` e
**quattro** con `409`, e **due soli** riguardano il menu. Riconoscerli dal solo
numero butterebbe fuori dal checkout un cliente a cui manca la spunta della
privacy, o uno a cui è scaduto lo slot — e quest'ultimo finirebbe nel carrello,
**dove il selettore dell'orario non c'è**. *Il difetto era stato scritto e fu
trovato **contando le uscite `409` nel codice**, non rileggendo il ragionamento.
`tests/checkout-messages.test.mjs` tiene allineate le due copie dei testi.*

⚠️ **Nella ricostruzione del carrello, un'opzione che non esiste più fa togliere
la riga, non aggiustarla**: non si sostituisce mai una scelta del cliente con
un'altra. Struttura illeggibile o manomessa → si riparte da vuoto **in silenzio**,
perché non è un cambio di menu da raccontare.

⚠️ **La fotografia dei prezzi e quella della route non si rigenerano** (lezione
`af`): una base rifatta dopo il cambiamento coincide sempre e non dimostra più
nulla.

⚠️ **La previsione va scritta PRIMA dello scatto**, caso per caso, e poi si
confronta la realtà con la previsione — non con la fotografia vecchia.
*Guardare le differenze e convincersi a posteriori che tornano è troppo facile.
Al primo scatto la previsione diceva "3 differenze e nessun'altra" mentre un
quarto caso era stato dichiarato condizionato allo stato del servizio senza
scriverne l'esito: il meccanismo era previsto, **il numero no**. Un numero
dichiarato è un impegno.*

### I limiti noti — cose vere che vanno sapute, non sanate

⚠️ **`lib/price-guard.js` è stato approvato sui suoi 31 test e sull'elenco dei
punti di uscita, NON sulla lettura riga per riga.** Il file fu chiesto due volte
e non arrivò mai. Se un giorno qualcosa non tornasse in quel modulo, il "va bene"
non poggiava su una lettura diretta. *Le prove restano robuste — i 13 casi erano
stati scritti prima — ma la distinzione va detta.*

⚠️ **L'instradamento dentro `app/api/checkout/route.js` non è coperto da alcun
test automatico**: quel file non è importabile fuori da Next (lezione `t`). È il
motivo per cui esiste la fotografia della route, ed è anche il motivo per cui
ogni passaggio su quel file costa un giro di verifiche a mano.

⚠️ **Sette uscite su ventisette della route restano scoperte**: sono tutte quelle
che richiedono di rompere o sporcare qualcosa — guasti Supabase, guasto Stripe, e
due vie non provocabili. Dopo il riordino sono verificate **solo dalla lettura
del codice**, ed è dichiarato nei commenti dei due file di prova.

⚠️ **Un buco dentro la copertura**: tre uscite rispondono con lo **stesso identico
messaggio** ("Articolo non valido."). Un riordino potrebbe scambiarle fra loro
senza che la fotografia se ne accorga.

⚠️ **"Zero differenze" non è più un esito possibile** nella fotografia della
route, ed è voluto: tre casi nuovi non esistono nella base, quindi ogni confronto
futuro mostrerà per sempre tre righe di presenza. **Le regole correnti stanno in
testa a `tests/route-snapshot.mjs`**, dove chi lo esegue le trova senza aprire
questo documento. *Tre righe sono previste; la quarta è una domanda.*

⚠️ **La sequenza delle scritture del checkout è un filo, non un grumo** — cliente,
sconto, totali, ordine, righe, Stripe: ogni passo produce il valore che serve al
successivo. Spezzarlo non è riordino, è **decidere dove passa il confine di ciò
che, fallendo a metà, lascia dati incoerenti** — e per metodo quella decisione va
prima in spec (§46 punto 8).

⚠️ **Il sito non filtra per store**: nessuna sua lettura conosce uno `store_id`.
Il server filtra comunque al checkout, quindi il vincolo è coperto; il sito
diventerà consapevole degli store quando i locali saranno due.

⚠️ **La nota Planted (§23) confronta ancora una stringa scritta nel codice**
(`protein.id === "planted"` in `app/page.js`): stesso tipo di problema curato
sull'extra carne, ma su un testo informativo e non su un prezzo.

⚠️ **`fetchMenuData` non è protetta dal guasto parziale**: sette query su nove
possono fallire **in silenzio**. È il limite più pesante rimasto su quel
percorso, perché un menu incompleto non si distingue da un menu vero.

⚠️ **La rilettura del listino non vede due cause di divergenza**: il filtro per
store e l'extra carne dentro il combo. *Registrate in spec §46, insieme al
server che dica **quale** riga e perché — oggi una frase sola copre dodici
cause — e al rilascio dell'indice dal modulo di confronto, che vanno fatti
insieme perché i due rami hanno ciascuno il proprio ostacolo.*

⚠️ **Due decisioni sulla riga bloccata restano rimandate** (§46). *Una di esse è
quella su cui la spec v57 porta ora un avvertimento: l'avviso delle rimozioni
risulta nascosto mentre il checkout è aperto, e se è ancora vero la regola
scritta non è realizzabile.*

**Oggi un articolo non può sparire dal menu**: il pannello permette di
modificare e di segnare esaurito, non di cancellare. *Da qui discende che
l'avviso generico per "articolo sparito" nella ricostruzione del carrello è
accettabile: il caso realistico è l'esaurito, dove il nome fresco c'è.*
⚠️ **La Fase 3 non cambia questo**: crea articoli, non li cancella.

**Nella tendina del pannello il livello 0 di piccantezza è etichettato "Non
piccante" dentro il form** invece che nel modulo, perché la lista chiusa per quel
livello ha dicitura vuota. Non arriva mai al cliente; da spostare nel modulo
quando lo si toccherà di nuovo.

### Verificato solo leggendo, mai dal vivo

Sono le cose di cui **non ci si può ancora fidare come di una prova**. Elenco
completo, da rifare per prime se si tocca il ramo relativo:

1. **Guard server-side sull'orario di Ritiro** (§46b): percorso seguito nel
   codice, **nessuna richiesta costruita per farsi respingere**;
2. **Il ramo dello slot scaduto** in §46: verificato leggendo, e non era
   impossibile da provare — bastava aspettare;
3. **Il rifiuto della Delivery programmata**: nessun caso della fotografia lo fa
   scattare; il gemello del Ritiro è provato due volte;
4. **`lib/price-guard.js`**: vedi il limite qui sopra;
5. **L'apertura in scheda nuova** del collegamento privacy: accertata negli
   attributi del DOM servito, **non nell'effetto**. Da riprovare da telefono
   (punto 17), insieme alla prova che i dati del modulo restino intatti.

**Due casi non provati dal vivo, con la ragione dichiarata:**

- **un indirizzo ripristinato che non è più in zona** — richiederebbe di
  restringere il perimetro in `store_geofences`, dato di configurazione vivo
  sull'unico database. ⚠️ **Decisione di Andrea del 30/07/2026: il perimetro non
  si tocca, nemmeno temporaneamente**;
- **un orario che scade mentre il cliente è via** — richiederebbe di restare
  fermi finché uno slot passa.

*Perché la loro assenza pesa poco*: entrambi riguardano la direzione **innocua**.
Il pericolo vero è l'opposto — un indirizzo **buono** giudicato fuori zona per un
difetto nostro, che bloccherebbe un cliente onesto — e quella direzione è coperta
dalle prove fatte e dai test del modulo.

### Comportamenti registrati, da non scambiare per difetti

- **Dopo un ordine completato i dati del checkout restano**, e non è una
  dimenticanza: §36-40 lo dice esplicitamente — si svuotano gli **articoli**, i
  dati possono restare per il resto della visita, perché un secondo ordine dallo
  stesso indirizzo è normale. I consensi no, per la regola separata. *Questa
  domanda è stata posta come aperta due volte in un giorno: lezione `am`.*
- **Il verdetto di zona ora compare appena il perimetro arriva**, mentre prima
  non compariva più finché il cliente non cambiava indirizzo. È voluto.
- **La guardia "idratato" è la parte fragile della persistenza**: senza di essa
  un salvataggio agganciato ai cambiamenti del carrello cancellerebbe quanto
  conservato un istante prima che la ricostruzione lo legga — e sarebbe sembrato
  "la persistenza non funziona", **senza alcun errore visibile**.
- ✅ **Il dubbio sulla cache di navigazione del browser è chiuso**: tornando dal
  pagamento con la freccia, la modalità torna a Delivery. Se la pagina venisse
  dalla cache resterebbe su Ritiro. Quindi si ricarica davvero, e il carrello
  pieno è merito della persistenza.

### Come si eseguono le prove

**Diciassette suite** in `tests/`, tutte con estensione **`.mjs`** e non `.js`,
perché vanno eseguite da Node fuori da Next. In `package.json` **non esiste uno
script `test`**: si lanciano una per una con `node tests/<nome>.test.mjs`, o
tutte con
`for t in tests/*.test.mjs; do echo "== $t"; node "$t" || echo "FALLITO: $t"; done`.
⚠️ `tests/checkout-timing.test.mjs` **costa circa 7 secondi**: provoca un guasto
di lettura reale puntando il client a una porta chiusa, e il client impiega quel
tempo ad arrendersi. Non è un blocco.

⚠️ **Ogni scatto della fotografia della route crea ordini `pending` di prova**
con le relative sessioni Stripe — quattro scatti nella sola tappa 2. Vanno nel
conto della pulizia pre-apertura, **che si rilegge dal database e non si ricopia
da qui**.

---

## 11) Stato dei dati (aggiornato al 05/08/2026)

⚠️ **Questa NON è una sezione di diario e non va compressa insieme a quelle**:
è lo stato vivo dei dati. Il 05/08/2026 è stata cancellata per errore durante la
sfoltita e ripristinata prima del commit. *Conteneva già, dalla sua stesura, la
frase che avrebbe dovuto impedirlo: "se questa sezione sparisse, non resterebbe
traccia da nessuna parte". Chi taglia legge l'avvertimento solo se legge — ed è
il motivo per cui l'estrazione di ciò che sopravvive non si delega a una sonda.*

### Allergeni

- **34 prodotti food su 34** hanno `allergens_verified_at`: 29 dal documento
  ufficiale, **5 confermati senza allergeni da Andrea** (Patatine, Polpette di
  agnello, Dolmadakia, Tabulì, Lokum).
- **7 salse su 7** verificate; 2 senza allergeni (Ajvar, Ajvar piccante).
- ⚠️ **21 bevande** (15 drink + 6 birre) **non verificate**, colonna a `NULL`:
  sono fuori dal tracciamento (§67) e vanno compilate prima di poterle
  dichiarare senza allergeni. **Voce aperta.**
- ⚠️ **2 salse senza flag vegetariano — voce aperta**: **Tzatziki** e **Yogurt**
  hanno `is_vegetarian` a `NULL`, quindi non mostrano alcun badge dietetico. Si
  riconoscono aprendo il form allergeni, dove il **selettore dietetico si
  presenta vuoto**. Vanno dichiarate da Andrea, **mai dedotte**.
- *Nota Tabulì*: è senza allergeni e **non** contraddice §21, che cita il glutine
  del **bulgur** come accompagnamento della Bowl. Il tabulì di KM è senza bulgur.

### Rimozioni (rilevante per §18)

**70 righe** su **14 prodotti** — i 7 Roll e le 7 Bowl, nessun altro articolo,
con righe **proprie e indipendenti**. Le etichette distinte sono **23** e **tutte
e 23 sono condivise da più prodotti**: ⚠️ **per questo la validazione va fatta
per `product_id` e mai su un elenco globale.**

### Residui di test da rimuovere prima del go-live

⚠️ **Questa è l'unica sede di questi numeri.** La v40 li ha tolti dalla spec,
dove restano solo la **regola** su come si costruisce l'elenco e l'eccezione di
`staff_action_log` (§66): cambiano a ogni verifica dal vivo, e un documento
abitualmente sbagliato in un punto insegna a non fidarsi anche negli altri.

Il database è **uno solo**, quindi questi dati staranno in mezzo a quelli veri
dal primo giorno. **Decisione di Andrea del 29/07/2026: al go-live si azzera
tutto**, senza tenere nulla "per storico".

**Conteggi al 05/08/2026**, letti eseguendo il referto di §69 — prima esecuzione
in assoluto dello strumento:

| tabella | 30/07 e 04/08 | **05/08 (valido)** |
|---|---|---|
| `orders` | 30 | **31** |
| `order_items` | 52 | **57** |
| `order_status_history` | 23 | **28** |
| `customers` | 40 | **41** |
| `promo_redemptions` | 1 | **2** |
| `staff_action_log` | 70 | **70** (invariato) |
| `analytics_events` | 0 | **0** |

La differenza è **un ordine di prova completo creato il 04/08/2026 alle
`13:07:01.471525+00`**, confermato da Andrea come proprio: carrello, riga
cliente, codice promo, pagamento riuscito e cinque righe di storico di stato —
un giro intero dal sito fino alla lavorazione dal pannello. *Che
`staff_action_log` sia rimasto a 70 mentre lo storico cresceva di cinque righe
**conferma il codice**, che scrive nel registro azioni solo su "segnala
problema" e "annulla ordine" (punto 20): due misure che si confermano a vicenda.*

**Ripartizioni al 05/08**: ordini **mai pagati** (`pending` + `failed`) **26**;
**pagati o rimborsati 5**, mai toccati da §69. Clienti **senza alcun ordine 19**;
con almeno un ordine pagato **5**. ⚠️ **Ordini mai pagati più vecchi di 30
giorni: ZERO**, e clienti nelle stesse condizioni: **zero** — la pulizia mensile,
eseguita oggi, non cancellerebbe nulla: il dato più vecchio è del 26/07.

**Registro azioni staff, per identificatore**: **27** su
`staff:bologna@kebabmediterraneo.com` (reale) e **43 di prova** su quattro di
fantasia — `staff:test-spice` 15, `staff:test-fase1` 12, `staff:test-fase2a` 9,
`staff:test-merge` 7. Le 27 vere **restano**: sono l'audit trail imposto da §66 e
sono **l'unica eccezione** all'azzeramento del go-live. *È il dato che serve al
parametro compilato a mano dello script del go-live (punto 19): **non va copiato
da qui il giorno dell'apertura**, va riletto dal referto di quel giorno.*

⚠️ **Avvertenza dal 05/08 in poi**: le azioni fatte dal pannello con il login
vero **non sono più distinguibili dalle prove**, perché portano l'identificatore
reale. Chi volesse fare altre prove sul pannello lo sappia prima, non dopo.

⚠️ **Questi numeri invecchiano**: ogni verifica dal vivo che arriva alla pagina
di pagamento ne aggiunge. Prima del go-live vanno **riletti dal database**, mai
ricopiati da qui (lezioni `s` e `z`).

**Composizione dei residui**, per sapere cosa si sta cancellando: gli ordini sono
tutti di prova, dal 26/07; `customers` porta **dati personali per quanto
inventati** e nessuna riga ha email o consenso marketing — anche quella
intestata "Andrea Pastore" è una prova, non una persona; `promo_redemptions`
tiene `GIVEMEFIVE`, e §14 dà **un solo utilizzo per cliente**, quindi finché
quelle righe esistono quei telefoni non possono più usare il codice. **Vuote e da
ricontrollare comunque**: `analytics_events`, `coupons`, `staff_settings`,
`store_schedule_exceptions`.

---

## 12) To-do / prossimi passi (in ordine)

### FATTA — §46, il confronto fra prezzo mostrato e prezzo addebitato

**Chiusa il 02/08/2026**, verificata dal vivo. È la **seconda** condizione di
apertura che si chiude, dopo Persistenza (§36-40) il 30/07. Il racconto sta ai
punti **11b** (il modulo), **11c** (la fotografia), **11d** (il riordino della
route), **11e** (l'aggancio al server) e **11f** (il lato sito).

Cinque tappe, tutte chiuse: il modulo che decide · la rete di sicurezza · il
riordino della route da 691 a 332 righe · l'aggancio al server · il lato sito.
⚠️ **Resta aperta la tappa 3b**, che non era parte della condizione: tempo di
preparazione, griglia dei quarti d'ora, e unificazione delle due costruzioni
delle finestre orarie. *Vive nel percorso di pagamento, e vale la regola di
sempre: non si riapre quel file per una cosa sola.*

⚠️ **Ciò che questo lavoro NON ha chiuso** è elencato in §11f.g e vive in spec
§46, non qui.

### FATTA — Persistenza dei dati del checkout (§36-40, §41-45)

**Chiusa il 30/07/2026**, tre commit, sei prove dal vivo superate. Il racconto
completo è al **punto 10b**; qui restano solo le correzioni a ciò che questo
elenco diceva quando era un to-do, perché sono errori del tipo che si ripete:

⚠️ **"Le funzioni per la riverifica esistono già e non vanno riscritte" era
vero a metà.** Vero per la zona (`isPointInPolygon`). **Falso per l'orario di
Ritiro**: `classifyScheduledSelection` copriva la sola Delivery, e per il
Ritiro la validità era calcolata **in linea** dentro `app/page.js`. È stato il
passo 1 del lavoro (`36218f7`) a estrarla, ed era lavoro che nessuno dei due
documenti aveva previsto.

⚠️ **"La stessa guardia idratato del carrello" era sbagliato**, ed è diventato
la lezione `al`: quel meccanismo **non si trasferisce**. Serve una guardia
indipendente, e va fatta con uno **stato**, non con un `useRef`.

### FATTA — Spec allineata al codice (v43, 31/07/2026, `d254612`)

Lavoro di sola manutenzione della verità: **nessuna decisione nuova**. Sette
frasi del corpo della spec descrivevano uno stato superato e sono state
riscritte — il carrello che "non sopravvive" e il calcolo del prezzo "da
estrarre" (§36-40, entrambi fatti il 30/07), l'editor menu dato ancora "in
sviluppo" mentre venti righe più sotto la stessa sezione lo dichiarava alle
Fasi 1-2B (§63-64), il toggle disponibile/esaurito dato per non loggato mentre
lo è dalla v28 (§66), le salse senza flag dietetico contate 3 invece di 2
(§67), il conteggio delle righe cliente uscito dalla spec per finire qui (§65)
e la costante dell'extra carne descritta come ancora nel codice (§22). In più
§46b cita ora **per intero** la validazione dell'orario, invece della sola
prima riga.

⚠️ **Due delle sette frasi dichiaravano aperta una condizione di apertura
chiusa il giorno prima**: chi avesse contato le condizioni leggendo la sola
spec ne avrebbe trovate otto invece di sei. È la lezione `aj` vista una seconda
volta, ed è il motivo per cui questo lavoro è stato fatto prima del resto.

*I blocchi "Novità" delle versioni passate non sono stati toccati: sono il
diario delle decisioni di allora, non affermazioni sull'oggi.*

### PROSSIMO — a scelta fra i due qui sotto

Restano **cinque** condizioni di apertura (elenco più sotto): quattro dell'elenco
storico — Stripe live, dominio, analytics §65, pulizia dei residui — più la
procedura mensile di §69. ⚠️ **Una sola richiede di scrivere codice**: le
analytics di §65, cioè una dozzina di eventi da tracciare più la pagina dei
carrelli abbandonati. Le altre sono da procurare, configurare o eseguire, e
possono camminare in parallelo.

⚠️ **Questo blocco è stato trovato falso il 04/08/2026 e riscritto.** Diceva
"cinque condizioni" quando erano sei, e dava per **ancora da scrivere** il
collegamento all'informativa privacy nel checkout — che era stato committato il
03/08 con `c69642e`, cioè il lavoro appena concluso quando quella frase è stata
riletta. *È la lezione `aj` per la terza volta: una nota di stato lasciata
indietro non invecchia in silenzio, mente con l'autorità del documento. Chi
avesse letto solo questo blocco sarebbe ripartito a costruire una cosa già
costruita.*

*§46 era però l'unica che richiedesse di **costruire una funzione nuova**, ed è
questa la differenza che contava. ⚠️ Fino alla v50 questa riga diceva "§46 è
l'unica che richieda di scrivere codice": era imprecisa, ed è la seconda volta
che questo punto viene scritto male — fino alla v42 diceva "le prime due sono
lavoro di codice", in contraddizione con la frase successiva.*

**I due lavori fra cui scegliere:**

- ⬜ **Tappa 3b di §46** — riverifica del tempo di preparazione e della
  **griglia dei quarti d'ora** (§46b, lavoro registrato), e unificazione delle
  **due costruzioni delle finestre orarie**. *Non era parte della condizione di
  apertura, ma vive nel percorso di pagamento: vale la regola di sempre, non si
  riapre quel file per una cosa sola.* ⚠️ **Da fare senza ancorarlo a una
  scadenza futura**: quella frase è già invecchiata due volte (spec §46b, v51).
- ⬜ **Fase 3 — creazione di articoli semplici** (blocco più sotto).

⚠️ **L'aggiornamento dei documenti è parte della tappa, non un lavoro a parte**
(regola di Andrea, 01/08/2026): una tappa non è chiusa finché spec e handoff non
sono aggiornati, e l'ordine è **prima la spec, poi l'handoff**, perché la spec
tiene le decisioni e l'handoff le cita. *Il costo di rimandare cresce più che
proporzionalmente: cinque commit di ritardo non costano cinque volte uno, perché
lo stato va ricostruito a memoria invece che raccontato mentre è fresco — è da
lì che sono usciti gli errori sui numeri del 01/08.*

*Non si rimaneggia il percorso del pagamento insieme ad altro: se si apre, si
apre per **tutti** i lavori registrati al punto 16.* ⚠️ **Fino al 05/08/2026
questa riga diceva "tutti e quattro"**, mentre il punto 16 ne elenca **cinque**
(la quinta condizionata) **più la ri-verifica della chiave `service_role`**, che
in quell'elenco mancava del tutto. Il conto tornava solo escludendo la voce
condizionale, cosa che nessuna delle due frasi diceva. *Un numero scritto in un
posto e un elenco scritto in un altro divergono sempre: qui il numero è stato
tolto e resta il rimando all'elenco, che è l'unica fonte.*

⚠️ **Perché prima della Fase 3**, motivo registrato: §46 è l'unica delle sei
condizioni che dipenda da noi e non da terzi, ed è il punto in cui si incassa
il denaro — quello che meno di tutti va fatto sotto la pressione dell'apertura.
In più la Fase 3 crea articoli, e un articolo ha un prezzo: costruire il modo
di aggiungere prezzi nuovi prima del controllo che il prezzo mostrato sia
quello addebitato è l'ordine sbagliato.

### Poi — Fase 3: creazione di articoli semplici

⚠️ **Non è un extra rimandabile.** Non è una *condizione di apertura* — non è
in quell'elenco — ma §63-64 la colloca fra i lavori **pre-go-live**, e il
blocco di stato della v40 lo dice testualmente: prima del go-live resta la sola
Fase 3, che non è ancora iniziata. Letto da solo, fino alla v42 questo
documento la faceva sembrare facoltativa. **Va fatta prima di aprire**, subito
dopo §46.

Prodotti (fritti, sides, dolci, drink) **e salse**, che ora sono la stessa cosa.
Dichiarazione allergeni obbligatoria alla creazione: o gli allergeni, o la
casella "nessuno dei 14".

⚠️ **La tendina delle categorie NON si compila a mano.** `products.category` è
un **tipo chiuso nel database**: ricopiarne i valori nel form creerebbe una
seconda copia di un elenco che esiste già, e due copie divergono. L'elenco va
**letto**, escludendo `menu_combo` (§63-64 v54). *Fino al 04/08/2026 questo
blocco diceva l'opposto — "va compilata a mano con le 8 categorie reali" — ed è
stato corretto perché era un'istruzione rovesciata, non una nota invecchiata.
Anche il numero 8 va verificato leggendo, non ripreso da qui.* *La regola v30
che escludeva anche `salse` è decaduta con l'unificazione: ora è la categoria
giusta.*

✅ **Dal 05/08/2026 anche la spec è allineata (v56).** Fino alla v55 §63-64
conteneva **entrambe** le istruzioni, opposte, a centottanta righe di distanza:
quella vecchia in alto e quella corretta della v54 in basso. Chi avesse letto la
sezione dall'alto avrebbe incontrato per prima la sbagliata. *La correzione del
04/08 era stata portata qui e non nella fonte di verità: è la lezione `aj`
arrivata dentro la spec, ed è stata trovata da Code confrontando le due
occorrenze, non rileggendo il ragionamento.*

✅ **Le decisioni su `slug` e collisioni sono PRESE il 04/08/2026** e stanno in
**spec §63-64 v54**: lo slug si genera dal nome con sei regole dichiarate, in
collisione il pannello si ferma invece di aggiungere un numero, e la regola vive
in un modulo unico sotto `lib/`. ⚠️ *La convenzione "osservata sui 62 articoli"
che stava scritta qui era per metà non verificata: le sette salse esercitano
minuscolo, spazi e apostrofi, ma **accenti, "&" e numeri non erano esercitati da
nulla**, e nessun codice del repository ha mai generato uno slug (ricognizione
del 04/08). Con la v54 tutte e sei sono decise, non osservate.*

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
- ✅ **FATTO il 01/08/2026** — *Rendere verificabile il calcolo dentro la route
  di pagamento* estraendolo in `lib/` (§46 v38). Eseguito in cinque commit
  (§11d): da 691 a 332 righe, comportamento verificato identico. Le regole di
  forma sono in **spec §46 v46**. ⚠️ *L'estrazione si è fermata alla logica:
  la sequenza delle scritture resta nella route e proseguire richiede prima una
  decisione in spec (§11d.f).*
- **Il server non riverifica il tempo di preparazione né i quarti d'ora**
  (§46b v40), su **entrambe** le modalità: controlla che l'orario non sia
  passato e che il locale sia aperto, ma non i 15 minuti del Ritiro (§12b) né
  i 60 della Delivery (§12), e **non impone la griglia dei quarti d'ora**,
  quindi `12:07` passa. Una richiesta costruita a mano può prenotare un ritiro
  "fra un minuto". **Non è una condizione di apertura** (decisione di Andrea
  del 30/07/2026): il cliente onesto non può raggiungerlo. *Il motivo per cui
  va comunque chiuso non è il furbo di turno — è che il server è la rete sotto
  agli errori del sito: se un domani il client sbagliasse a gestire uno slot
  scaduto, oggi non ci sarebbe nulla a fermarlo.*

  ⚠️ **Correzione del 30/07/2026 (lezione `ak`), ora in spec**: questo punto
  diceva che il server accetta un orario **"in qualunque forma `HH:MM`"**. È
  troppo largo e **falso**. La validazione sta su **due** righe, non una: alla
  regex `/^\\d{2}:\\d{2}$/` segue un controllo che rifiuta ore oltre 23 e minuti
  oltre 59, quindi `24:00` e `12:60` **non passano**. Verificato eseguendo le
  due funzioni su tredici ingressi: zero divergenze rispetto al modulo di
  persistenza. *Il buco registrato resta vero — `12:07` passa davvero — ma
  nasceva da una citazione parziale della sola prima riga.* **La v43 ha portato
  la citazione per intero dentro §46b**: la verità non vive più soltanto qui.
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

### Condizioni di apertura — **quattro chiuse, cinque aperte**

- ✅ **Persistenza** (§36-40): **CHIUSA il 30/07/2026.** Carrello (punto 10) e
  dati del checkout (punto 10b), entrambi verificati dal vivo. *È la prima
  condizione di apertura che si chiude.*
- ✅ **Confronto prezzo mostrato vs prezzo addebitato** al checkout (§46):
  **CHIUSA il 02/08/2026**, verificata dal vivo (§11f). *È la **seconda** che si
  chiude.* Cinque tappe: il modulo, la rete di sicurezza, il riordino della
  route, l'aggancio al server, il lato sito.
- ✅ **Informativa privacy** (§41-45): **CHIUSA il 03/08/2026**, commit
  `c69642e` (punto 14). Documento in versione **1.2**, pubblicato come pagina
  statica su `/privacy` e collegato da **tre punti**: le parole "informativa
  privacy" nella casella del checkout, il fondo della home, il fondo della
  pagina di conferma. *È la **terza** che si chiude.*
  ⚠️ **Un pezzo è verificato solo per lettura**: l'apertura in scheda nuova è
  accertata negli attributi del DOM servito, non osservata dal vivo — l'ambiente
  di prova non onora `target="_blank"`. **Da riprovare da telefono** (punto 17).
  ⚠️ Resta inoltre da salvare in database la stringa `informativa-v1.2`, che si
  fa quando si riapre il file del checkout (punto 16): **non è una condizione di
  apertura**, è un lavoro registrato.
- **Stripe live** (oggi sandbox).
- **Dominio** `ordina.kebabmediterraneo.it`. ⚠️ *Contestualmente va **ristretta
  al dominio la chiave API di Google**, oggi senza restrizioni.*
- **Analytics** (§65). ⚠️ *È **lavoro di codice**, non configurazione: una
  dozzina di eventi da tracciare più la pagina dei carrelli abbandonati nel
  pannello staff.* Ora con i vincoli dichiarati nell'informativa e il limite dei
  **30 giorni** (§65, §69).
- **Pulizia dei residui di test** (punto 11) — da **rileggere** dal database,
  mai ricopiare da qui.

⚠️ **Restano cinque voci aperte in tutto**: le **quattro** dell'elenco storico —
Stripe live, dominio, analytics, pulizia dei residui — più la **procedura
mensile** di §69. La sesta, il piano Supabase Pro, è chiusa il 04/08/2026.
*Delle cinque, una sola richiede di scrivere codice: le analytics di §65. §46 era
però l'unica che richiedesse di **costruire una funzione nuova**.*

⚠️ *Questa intestazione e questo conteggio vanno riletti ogni volta che
l'elenco cambia: è la seconda volta che restano indietro rispetto alle voci.*

**Le due voci nate dal giro privacy** (punto 14), fuori dall'elenco storico ma
prima dell'apertura — la prima ora chiusa:

- ✅ **Piano Supabase Pro**: **CHIUSA il 04/08/2026** (punto 18). Il piano è
  attivo, lo Spend Cap è acceso e i backup sono ripristinabili dal 28/07. Il
  punto 11.7 dell'informativa, che era falso, è ora vero senza toccare il
  documento. *È la **quarta** condizione che si chiude.*
- **Procedura mensile di pulizia** degli ordini mai pagati oltre i 30 giorni
  (§69). ⚠️ **Lo strumento esiste**: `sql/pulizia_mensile_ordini_mai_pagati.sql`,
  committato il 04/08 con `f54c29d` e mai eseguito. ✅ **La cadenza è fissata il
  05/08/2026: il primo di ogni mese, prima di aprire il locale** (spec §69 v56).
  **Resta la sola prima esecuzione**, di Andrea. Finché non c'è, il punto 11.2
  dell'informativa è una promessa senza precedente.
  *Al 05/08 quello strumento non avrebbe nulla da cancellare — zero ordini e
  zero clienti oltre i trenta giorni — il che rende questo il momento più sicuro
  possibile per provarlo, con il limite dichiarato che dimostrerebbe che parte,
  non che cancella le cose giuste. Andrea ha deciso il 05/08 di non farlo ora.*

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
- ✅ **Prezzo mostrato vs prezzo addebitato** (§46): **chiuso il 02/08/2026**
  (§11f). Chi tiene la pagina aperta durante un cambio prezzo continua a vedere
  il vecchio — il menu resta letto **una volta sola** — ma al pagamento **non
  viene più addebitato il nuovo in silenzio**: il server confronta e si ferma,
  il sito rilegge il listino e riporta al carrello. *Fino alla v50 questo punto
  diceva che il confronto "non esiste ancora", contraddicendo §11e dello stesso
  documento.*
  ⚠️ **Lo stesso meccanismo vale per gli allergeni, e lì resta scoperto**: non
  c'è alcun controllo al checkout, ed è la ragione della regola "gli allergeni
  si modificano fuori dall'orario di servizio". *Decisione di Andrea del 31/07:
  restano fuori dal confronto **finché quella regola regge** — se cade, la
  decisione va rifatta prima, non dopo (spec §46).*
- **Ordini in sospeso destinati a moltiplicarsi** (§65): ogni arrivo alla pagina
  di pagamento crea un `pending`. Con la persistenza del carrello tornare
  indietro diventerà normale, e ogni giro lascerà un `pending` orfano di un
  cliente che **ha comprato**. Da tenere presente quando si costruirà la pagina
  dei carrelli abbandonati.
- **Anche le righe cliente si moltiplicano** (§65, v36): `customers` viene
  scritta **prima** dell'ordine e resta anche se il checkout non arriva in
  fondo. Al 05/08/2026 sono **41**, di cui **19** senza alcun ordine (punto 11).
  Non è un errore, ma vale il divieto d'uso a fini di ricontatto.
  ⚠️ *Fino al 05/08 questa riga diceva **38**, citando come fonte il punto 11 —
  che nello stesso documento ne dichiarava 40. Era il numero della mattina del
  30/07, rimasto indietro quando il punto 11 fu riletto la sera. Una nota che
  cita come fonte il blocco che la smentisce è la lezione `aj` nella sua forma
  più economica da evitare: bastava aprire il punto a cui rimandava.*
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

---

## 14) Il giro privacy (02-03/08/2026)

Sessione **fuori dal codice** per la quasi totalità: due audit di sola lettura, la stesura dell'informativa e un solo intervento sul repository — la pubblicazione dell'informativa, commit `c69642e`, quattro file toccati (`app/privacy/page.js` **995 righe**, `app/privacy-footer.js` 34, `app/page.js` +37/−1, `app/conferma/page.js` +5). `app/layout.js`, la route del checkout e tutto ciò che riguarda il salvataggio dei consensi sono **intatti**.

**Cosa è risultato buono e chiuso**: nessun cookie sulle pagine cliente, verificato dal vivo in finestra pulita; nessun analytics né error tracking; la pagina di stato non manda al browser alcun dato personale, perché la sua `select` prende quattro colonne; nessun `console.log` nel codice applicativo — tutti i 45 punti sono `console.error`.

**Cosa è risultato da sanare**: sta tutto nel punto 16, che è l'elenco vivo. *Fra queste, la scoperta con conseguenza fuori dal codice — il progetto era su piano Free, che non include backup — è stata sanata il 04/08 (punto 18).*

⚠️ **Due limiti dell'ambiente di prova, da chiudere con un dito su un telefono vero**: l'apertura in scheda nuova è stata verificata **negli attributi e non nell'effetto**, e i clic per coordinate non atterravano, quindi le prove usano eventi dispatchati.

⚠️ **Due regole di metodo nate qui, valide sempre**: le **policy RLS non sono verificabili** né dal repository né dalle normali API — PostgREST espone solo `public` — e vanno lette con query eseguite a mano nella dashboard, mai dedotte dal codice; e una domanda che chiede *"confermi che X?"* invita a rispondere di sì: **si chiede il valore, non la conferma.**

---

## 15) Condizioni di apertura — aggiornamento

Delle cinque condizioni che risultavano aperte prima del giro privacy (elenco storico del punto 12): ⚠️ *fino al 05/08/2026 questa riga rimandava a un `HANDOFF_2.md` che **non esiste**, né nella cartella né fra i file tracciati da git — riferimento morto a un documento precedente, tolto.*

* **Informativa privacy — CHIUSA il 03/08/2026** (commit `c69642e`). Terza condizione a chiudersi. Resta la stringa `informativa-v1.2` da salvare in database, che si fa quando si riapre il file del checkout: è un lavoro registrato, non una condizione.
* **Statistiche (§65) — aperta**, ora con i vincoli dell'informativa (vedi aggiornamento spec).
* **Stripe live, dominio, pulizia dei residui — aperte**, invariate. Col dominio va ristretta la chiave API di Google.

**Nuove, nate da questo giro:**

* **piano Supabase Pro — ✅ CHIUSA il 04/08/2026** (punto 18). Quarta condizione a chiudersi;
* **procedura mensile di pulizia** degli ordini mai pagati oltre i 30 giorni — **lo strumento c'è** (`sql/pulizia_mensile_ordini_mai_pagati.sql`, `f54c29d`), ✅ **la cadenza è fissata il 05/08/2026** (il primo del mese, prima di aprire — spec §69 v56), **manca la prima esecuzione**. Sono due file separati da quello del go-live, per decisione del 04/08 (spec §69);
* **chiave API Google da restringere** al dominio, contestualmente al dominio vero.

Fuori elenco ma prima dell'apertura resta la **Fase 3** (creazione di articoli dal pannello). ⚠️ **Le decisioni su `slug` e collisioni sono state prese il 04/08/2026** e stanno in spec §63-64 v54: non è più un lavoro con decisioni aperte.

---

## 16) Il prossimo passaggio su `app/api/checkout/route.js`

Vale la regola: **non si riapre quel file per una cosa sola.** Quando si riapre, ci vanno insieme:

1. costante `PRIVACY_TEXT_VERSION` = `informativa-v1.2`, salvata accanto alla data;
2. `upsert` che non azzera la prova del consenso marketing precedente;
3. i tre `console.error` (308, 364, 372) ridotti ai soli campi necessari;
4. gli eventi delle statistiche che ricadono su quel percorso;
5. la **tappa 3b di §46**, se l'incrocio con il punto 4 si conferma — da verificare prima di scegliere l'ordine;
6. ⚠️ **la ri-verifica della chiave `service_role`** (spec §66 v55, punto 17): riaprire questo file significa toccare il confine fra server e browser, ed è uno dei due momenti in cui quella verifica va rifatta. *Fino al 05/08/2026 questa voce non era in elenco, benché spec e punto 17 la legassero esattamente a questa riapertura: chi avesse seguito solo questo elenco l'avrebbe saltata.*

Analogamente su `app/page.js`: cancellazione di `km_direct_checkout` a ordine concluso, eventi statistici lato cliente, ed eventuale spostamento del caricamento di Google Maps — che però comporta la **v1.3 dell'informativa** nello stesso passaggio.

---

## 17) Verifiche ancora da fare a mano

* le due prove dal telefono sul collegamento nella casella (scheda nuova, dati del modulo intatti);
* ✅ **FATTO il 04/08/2026** — le query di sola lettura su RLS, foreign key, `ON DELETE`, colonne e trigger, eseguite da Andrea nell'editor SQL. Lo stato delle RLS **non è più ignoto**: il referto sta in spec §66 v54 e i conteggi al punto 18;
* **da riguardare dopo una settimana di esercizio**: la pagina dei backup Supabase, dove mancano il 1° e il 2 agosto. Se i buchi si ripetono, la frase dell'informativa sulle copie "giornaliere" va ammorbidita (punto 18);
* ✅ **FATTO il 04/08/2026** — la verifica sulla chiave `service_role`: non finisce nel browser, accertato per quattro vie (spec §66 v55, punto 19). ⚠️ **Vale per il codice di oggi**: va rifatta quando si riapre `route.js` del checkout e quando si costruisce la Fase 3;
* ✅ **FATTA il 04/08/2026** — la prova sui microsecondi del freno: zero ordini oltre il valore nuovo, uno oltre quello vecchio (punto 19);
* **da fare da Andrea, senza codice**: ✅ il **giorno del mese** è fissato il 05/08/2026 — il primo, prima di aprire (spec §69 v56); **resta la prima esecuzione**. ✅ **FATTO il 05/08/2026** — il referto dei conteggi di sola lettura è stato eseguito per la prima volta: lo strumento funziona e ha già smentito due numeri dei documenti (punto 11).

---

## 18) Il giro su infrastruttura e database (04/08/2026)

Sessione **senza una riga di codice applicativo**: acquisti e configurazione nella dashboard, cinque query di sola lettura eseguite da Andrea, una ricognizione di Code sul repository, e l'aggiornamento dei due documenti. Le decisioni stanno in **spec §63-64, §65, §66 e §69 v54**; qui c'è lo stato.

### 18a) Cosa è stato fatto, e da chi

Tutto quanto segue è **di Andrea**, nella dashboard: attivazione del piano **Pro** sull'organizzazione *Kebab Mediterraneo*, passaggio della taglia di calcolo da **Nano a Micro**, e l'esecuzione delle query. Code è intervenuto una volta sola, per la ricognizione sugli slug, e una seconda per la copia della spec.

### 18b) I fatti verificati, con la fonte

| fatto | fonte |
|---|---|
| piano **Pro** attivo, Spend Cap acceso, 25 $/mese | pagina Billing |
| **backup ripristinabili dal 28/07 al 04/08**, ⚠️ mancano 01 e 02/08 | pagina Database Backups |
| regione **West EU (Ireland), `eu-west-1`** | riquadro Primary Database |
| taglia **`t3a.micro`** dopo l'aggiornamento | riquadro Primary Database |
| **RLS attiva su tutte e 23 le tabelle**, 10 in lettura pubblica e 13 chiuse, **nessuna regola di scrittura** | query sul catalogo |
| collegamenti, cancellazioni a catena e **sei trigger** `updated_at` | query sul catalogo |
| `orders.order_token` generato dal database con **16 byte casuali** | valore predefinito della colonna |
| `orders.privacy_accepted_at` **obbligatoria**: nessun ordine senza consenso | definizione della colonna |
| **nessuno slug è mai stato generato da codice** | ricognizione di Code |

**Conteggi al 04/08/2026**, letti dal database: `orders` **30** (26 mai pagati, 4 `succeeded` in sandbox), `customers` **40**, `promo_redemptions` **1**, `analytics_events` **0**, `staff_action_log` **70** di cui **43** di prova. ⚠️ **SUPERATI il 05/08**: la rilettura ha trovato un ordine di prova in più, creato lo stesso 04/08 alle 13:07. **I numeri validi stanno al punto 11**, e questi restano solo come fotografia di quel momento.

### 18c) Le sette decisioni prese

Pulizia in **due strumenti separati** invece di uno (rovescia §69 v53) · ordini **`failed` trattati come i `pending`** · nella pulizia mensile log staff ed eventi statistici **perdono il riferimento, non la riga** · i **codici promo tornano utilizzabili** solo a chi non ha mai pagato · lo **slug si genera dal nome** con sei regole dichiarate · in **collisione il pannello si ferma** invece di aggiungere un numero · la regola vive in un **modulo unico**.

### 18d) Cosa questo giro NON ha chiuso

* ⚠️ **La chiave `service_role` scavalca ogni RLS**, e nessuno ha verificato che non finisca nel browser. È una domanda sul codice, ed è la prima da fare a Code.
* **`analytics_events` ha già un elenco chiuso di tipi di evento** nel database, mai letto da nessuno. Va confrontato con la dozzina di §65 **prima** di scrivere codice.
* **Gli script di pulizia non esistono ancora.** Le regole ci sono, il codice no.
* **Le altre affermazioni dell'informativa sull'infrastruttura** — hosting, cookie, strumenti di analisi — non sono state passate in rassegna una per una, come è stato fatto per la regione.

### 18e) Due lezioni di metodo

**bg. ⚠️ Una frase di un fornitore non è un dato da cui calcolare.** La pagina dei backup dice che le copie si prendono "intorno alla mezzanotte della regione del progetto". Gli orari erano le 07:36 UTC, che in Irlanda non è mezzanotte: da lì è nata l'ipotesi che il database fosse negli Stati Uniti, con l'informativa che avrebbe dichiarato il falso in due punti. **Il campo Region diceva Irlanda.** La frase era approssimativa. *È la famiglia delle lezioni `ap` e `av` in forma nuova: là la sonda era costruita sulla forma attesa di un file, qui il calcolo era costruito sulla frase di un'interfaccia. Il rimedio è lo stesso — si legge il campo, non si deduce dall'orario — e il costo è stato due messaggi, perché l'ipotesi era stata dichiarata come ipotesi e non come fatto.*

**bh. ⚠️ Un referto che finisce a 100 righe esatte non è un referto completo.** L'editor SQL della dashboard tronca a 100. Il primo giro sulle colonne si è fermato a `orders` colonna 32 e **sembrava una risposta**: mancavano tredici tabelle intere, fra cui proprio quella che serviva. È la lezione `aq` spostata sullo strumento — là una variabile vuota faceva corrispondere tutto, qui un limite silenzioso fa sembrare finito ciò che è a metà. *Rimedio: contare le righe attese prima di leggere il contenuto, e diffidare del numero tondo.*

**Una terza, dal lato di chi scrive i comandi**: l'elenco delle righe **rimosse** attese nel comando di copia della v54 era sbagliato — dichiarava due zone quando erano quattro, dimenticando che la riga 3 va sostituita e che un `+1` netto si ottiene sostituendo una riga con due. Code l'ha segnalato senza fermarsi, correttamente. *È la lezione `ak`: ciò che un comando dichiara come atteso si ricava dal diff, non a memoria — e chi scriveva aveva il diff davanti.*

---

## 19) Gli script di pulizia dati (04/08/2026, seconda metà)

Seguito diretto del punto 18: con il referto sui collegamenti in mano, §69 si è sbloccata e i tre strumenti sono stati scritti. Commit **`f54c29d`**. **Nessuno dei tre è mai stato eseguito.**

### 19a) I tre file

| file | cosa fa | quando si esegue |
|---|---|---|
| `sql/conteggi_dati_sola_lettura.sql` | conta e basta | prima e dopo ogni pulizia |
| `sql/ESEGUIRE_UNA_VOLTA_SOLA_prima_del_golive_CANCELLA_TUTTI_GLI_ORDINI.sql` | azzera ordini, clienti, riscatti, eventi | una volta sola, al go-live |
| `sql/pulizia_mensile_ordini_mai_pagati.sql` | rimuove i mai pagati oltre 30 giorni | ogni mese, per sempre |

Il nome in maiuscolo è voluto: nell'elenco della cartella, fra nove migrazioni datate e minuscole, quel file si stacca da solo. **Il pericolo non è che qualcuno esegua quello sbagliato di proposito: è che li confonda.**

⚠️ **Lo script del go-live si cancella dal deposito subito dopo l'uso** — passo 5 della sequenza di apertura (spec §66 v55). Non è una buona intenzione: è che il momento della cancellazione coincide con quello in cui si è stanchi e contenti, a sito appena aperto.

### 19b) Le sette decisioni e i chiarimenti della v55

Due strumenti separati · `failed` come `pending` · staccare invece di cancellare, **anche al go-live** per le sole righe da conservare · codici promo riutilizzabili solo da chi non ha mai pagato · **le due frasi contraddittorie di §69 v54 sulle righe cliente sono state unificate** nella più stretta · i trenta giorni di una riga cliente si contano da `customers.created_at` · **fino al go-live dichiarato da Andrea ogni ordine è una prova** (regola generale, spec §66).

### 19c) Due errori trovati leggendo i file, non il referto che li descriveva

**bi. ⚠️ Un freno che scatta a torto insegna ad aggirarlo.** Il referto dei conteggi stampava la data dell'ultimo ordine **troncata ai secondi**, ma `created_at` ha precisione al microsecondo: copiata nel freno, l'ordine più recente risultava successivo a sé stesso e l'arresto sarebbe scattato al primo tentativo. Chi si fosse trovato davanti a quell'arresto avrebbe visto una data identica al referto, e l'unica mossa che sblocca era proprio quella vietata in maiuscolo — spostare la data in avanti. *Corretto con i microsecondi e **verificato**: su `max(created_at) = 2026-08-04 13:07:01.471525+00`, zero ordini oltre il valore nuovo e uno oltre quello vecchio. Lo zero conta perché la stessa sonda cambia risposta col formato vecchio.*

**bj. ⚠️ Un'istruzione che manda a leggere un dato inesistente produce la scorciatoia peggiore.** Il file del go-live diceva di prendere la data del freno "dal referto dei conteggi", ma quel referto **non la produceva**: contava righe. Chi avesse obbedito non avrebbe trovato il valore, e la cosa più a portata di mano era l'ora corrente — cioè precisamente ciò che spegne il freno. *Aggiunta la misura, e il legame fra i due file ora è scritto in entrambe le direzioni.*

**Una terza, sul metodo di chi legge:** entrambi questi difetti sono stati trovati **leggendo i file**, non i referti che li descrivevano. I referti erano corretti e dettagliati, ma descrivevano controlli, non li mostravano. *Un referto che descrive un file non è il file.*

### 19d) Ciò che gli script NON risolvono, e va saputo

* ⚠️ **La spec non definisce come si riconosce un'azione di prova nel registro staff.** `staff_identifier` è testo libero. Nel file del go-live il criterio è un **parametro compilato a mano**, letto dal referto e non ricordato, con due controlli che bloccano se resta vuoto o non corrisponde a nulla. *Registrato come limite noto e non sanato: quello script si esegue una volta e sparisce, e la pulizia mensile non tocca mai il registro per identificatore.*
* **La cadenza mensile non esiste ancora.** Lo strumento c'è, il giorno del mese no.
* **Nessuno dei tre file è stato eseguito**, e quello del go-live per sua natura si prova una volta sola.

### 19e) Note di metodo rimaste in coda — ✅ inserite il 05/08/2026

Erano due, e **non sono più in coda**: la prima è diventata la lezione `bn`
(il browser non sovrascrive da solo i file scaricati, e la trappola si è
riarmata puntualmente con la v56), la seconda era la lezione `ak` vista dal
lato di chi scrive i comandi ed è ora citata al punto 18e, dove il caso è
raccontato per esteso. *Nulla è andato perso, ed è la ragione per cui questo
blocco è stato scritto invece di fidarsi della memoria.*

---

## 20) La ricognizione su §62b e la spec v56 (05/08/2026)

Giornata **senza una riga di codice applicativo**: una ricognizione di sola
lettura di Code sul repository, il primo referto dei conteggi eseguito da
Andrea, quattro decisioni, e la spec portata alla **v56** (commit `1f74e8f`).

### 20a) Il difetto trovato, che era in spec e non nel codice

⚠️ **§62b affermava una cosa falsa sul codice, e ci era stato costruito sopra
un ragionamento.** Vedi la lezione `bk` per il metodo; qui i fatti, letti da
Code sul codice eseguibile e confermati da Andrea sul database vivo:

| motivo | dove finisce davvero |
|---|---|
| annullamento | `orders.cancellation_reason` (colonna dedicata) **e** `staff_action_log.detail`, chiave `reason`, `action: "annulla_ordine"` |
| problema | **solo** `staff_action_log.detail`, chiave `reason`, `action: "segnala_problema"` |

In `order_status_history` non finisce **nessuno dei due**, e non c'è una colonna
che potrebbe ospitarli.

Due fatti collaterali emersi dalla stessa lettura:

* ⚠️ **`orders.cancellation_reason` è scritta e mai riletta.** `git grep` ne
  trova **due sole occorrenze in tutto il repository** — la scrittura e la
  definizione dello schema — e la `select` che alimenta il pannello non la
  chiede. Il motivo che lo staff scrive **oggi non è visibile da nessuna parte**;
* **l'annullamento non è raggiungibile direttamente**: il codice ammette
  `annullato` solo a partire da `problema`, mentre la spec descriveva due
  azioni indipendenti.

### 20b) Le quattro decisioni di Andrea

1. **Il motivo si conserva, non si mostra.** Nessuna vista del pannello lo
   mostrerà, e §65 si intende soddisfatta dalla conservazione. *Scritto in spec
   con la clausola che impedisce a qualcuno, fra un anno, di costruire la pagina
   leggendo §65 e trovandola "mancante".*
2. **Il passaggio obbligato da `problema` resta**: si corregge la spec, non il
   codice.
3. **Pulizia mensile il primo di ogni mese, prima di aprire il locale.** Il
   primo perché esiste in tutti i mesi.
4. **La pulizia mensile non si prova ora**, benché oggi non avrebbe nulla da
   cancellare.

### 20c) Le due decisioni di §65 — chiuse

* ✅ **i tempi fra le fasi** si ricavano da `order_status_history`, colonna
  **`changed_at`**, nome letto dal database vivo. Prima era una convinzione;
* ✅ **il motivo dell'annullamento non va nel `payload`**: esiste già in due
  posti permanenti e la statistica lo legge da `staff_action_log` filtrando
  `action`. **L'istruzione della v54 di "decidere come si chiama quella voce"
  decade**, perché poggiava sull'errore di §62b.

⚠️ **Le statistiche non hanno più decisioni bloccanti**: è lavoro da fare, non
da decidere.

### 20d) Ciò che questo giro ha verificato con quattro sonde

La domanda "esiste già codice che scrive in `analytics_events`?" ha risposta
**no**, ed è un no dimostrato: quattro sonde indipendenti — la parola, tutti i
punti in cui il codice nomina una tabella (84 occorrenze, di cui 9 non
letterali risolte una per una), le vie che scavalcano il client, e gli undici
nomi degli eventi — ognuna con la propria controprova su un dato che c'è di
sicuro. *È il modo in cui un risultato vuoto smette di essere ambiguo (lezioni
`ap`, `aq`, `av`).*

### 20e) Cosa questo giro NON ha chiuso

* **la prima esecuzione della pulizia mensile**, decisa e rimandata;
* **l'accesso al DNS del dominio `kebabmediterraneo.it`**: il dominio è di
  proprietà, ma nessuno del progetto ha accesso al pannello. `ordina.` è un
  **sottodominio**, non si acquista e non costa nulla: serve solo chi ha le
  chiavi. ⚠️ *Va preso l'accesso, non chiesto il favore: la sequenza di apertura
  (§66) mette il dominio al primo posto proprio perché il webhook di Stripe
  deve puntare all'indirizzo definitivo, e dipendere da terzi in quel momento
  significa sito fermo. In quello stesso pannello vivono anche i record della
  posta elettronica del locale: chi ci mette le mani aggiunge una riga e non
  tocca il resto;*
* **dove è ospitato il sito**, che la spec dichiara essere Vercel senza che
  nessuno l'abbia verificato alla fonte — è una delle affermazioni
  dell'informativa sull'infrastruttura ancora non passate in rassegna (punto
  18d). Va accertata prima del passo 2 della sequenza di apertura;
* **l'asimmetria della risoluzione**, che non scrive nel registro azioni
  mentre segnalazione e annullamento sì. Registrata in spec §62b v56 come
  limite noto, fuori dai lavori pre-go-live.