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
**v52** (leggila sempre dall'intestazione, riga 3).

---

## 2) Stato git

- Branch **`main`**, working tree **pulita**, allineata a `origin/main`.
- HEAD: **`c69642e`** — pubblicazione dell'informativa privacy (03/08/2026).
- Ultimi commit (dal più recente):

```
c69642e privacy: informativa pubblicata su /privacy, collegata dalla casella del checkout e dal fondo delle pagine cliente §41-45
be7324b spec: v52 — condizione di apertura sui prezzi chiusa e verificata dal vivo, e corretta la frase sui consensi che si azzerano tornando al carrello §46
dade165 checkout: la rilettura del menu fallita mostra il testo deciso invece dell'errore tecnico §46
4304910 checkout: il sito riconosce i due rifiuti che riguardano il menu da status e testo, rilegge il listino e riporta al carrello §46
3f9403f spec: v51 — stesso trattamento per l'articolo non ordinabile con la riga tolta e spiegata, decisioni sulla riga bloccata rimandate, geofence 400 e scadenze senza ancoraggio §46 §46b
9705d4a checkout: il sito manda il prezzo unitario mostrato per ogni riga, dallo stesso calcolo del server §46
b5a6f7f handoff: aggiorna a v50 — aggancio del confronto prezzi registrato, criterio nuovo della fotografia, conteggi spostati in spec e lezioni su descrizioni del codice e conteggi eseguiti
fe4bcc2 spec: v50 — conteggio delle uscite aggiornato a 27 e 17, e aritmetica dello scarto corretta con il raggruppamento vero dei rami 409 §46
98d8f0a spec: v49 — la riga non piu' ordinabile resta nel carrello e blocca il pagamento, e testo per la rilettura del menu fallita §46 §46b
d5876e7 spec: v48 — al 409 il sito rilegge il listino prima di riportare al carrello, e nessuna evidenziazione della differenza di prezzo §46
05c6bc9 checkout: confronto fra prezzo mostrato e reale agganciato prima di ogni scrittura, e casi della fotografia estesi ai tre esiti del guard §46 §46b
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

## 10b) La persistenza dei dati del checkout (30/07/2026)

**Chiude la condizione di apertura §36-40**, di cui il carrello (punto 10) era
la prima metà. Tre commit, in tre passi deliberatamente separati.

**Perché in tre passi.** I primi due non cambiano nulla di visibile: se
sbagliano, sbagliano dove non si vede. Il terzo non è stato spezzato **apposta**
— un giro intermedio che ripristinasse l'indirizzo *senza* il controllo di zona
avrebbe prodotto un sito **più fragile di prima**, dove un indirizzo torna dalla
memoria e arriva al pagamento senza che nessuno lo ricontrolli.

1. **`36218f7` — la funzione pura per lo slot di Ritiro.** Non esisteva: per la
   Delivery c'era `classifyScheduledSelection`, per il Ritiro la stessa cosa era
   calcolata **in linea** dentro `app/page.js`. Estratta come
   `classifyPickupSelection` accanto alla gemella, con 17 asserzioni. Nello
   stesso commit è sparita anche la duplicazione di `firstAvailableSlot` su una
   riga. *Risultato netto: in `app/page.js` non resta alcun calcolo in linea su
   validità o preselezione degli slot di ritiro.*
2. **`04343e7` — il cervello.** `lib/checkout-persistence.js`,
   `prepareCheckout(state)` e `restoreCheckout(persisted) -> { fields, dropped }`,
   **110 asserzioni**. Puro, zero dipendenze, non tocca la memoria del browser e
   **non giudica niente**: non verifica la zona, non giudica gli slot.
3. **`8561504` — l'integrazione**, più la modifica a `canPay` che la v41 rende
   vincolante. Verificata dal vivo da Andrea.

**I tre consensi sono impossibili da salvare, non solo vietati.** Il modulo non
fa mai lo spread dello stato: copia una **lista chiusa di chiavi dichiarate**,
quindi una chiave non dichiarata non attraversa il modulo nemmeno passandogli
l'intera schermata. È verificato da due asserzioni, una delle quali gli passa
uno stato pieno di roba estranea.

**Il verdetto di zona è derivato, non scritto.** Non è uno stato che qualcuno
aggiorna: è una funzione di *(coordinate, perimetro)*, quindi **non esiste un
istante** in cui valga "fuori zona" mentre il perimetro è ancora nullo — in
quel caso vale "non ancora verificato", che non è un rifiuto (§36-40 v42). La
garanzia è nella **forma**, non in un controllo che qualcuno potrebbe
dimenticare.

⚠️ **Lo stato della zona ha tre valori, non due**: non ancora verificato /
in zona / fuori zona. Chi un domani lo riducesse a un booleano
riaprirebbe esattamente il difetto che la v42 esiste per impedire.

**Le sei prove dal vivo di Andrea, tutte superate**: campi ripristinati; i tre
consensi vuoti; pagamento bloccato prima di rispuntarli; **nessun avviso che
compare e sparisce** nel primo istante del rientro; carrello svuotato dopo un
pagamento vero, con i dati personali ancora presenti; ritiro con l'orario
scelto. Log del server pulito, nessun errore.

**Cosa NON è stato provato dal vivo, e perché (dichiarato, non nascosto)**

- **Un indirizzo ripristinato che non è più in zona.** Richiederebbe di
  **restringere il perimetro** in `store_geofences`, dato di configurazione
  vivo sull'unico database. ⚠️ **Decisione di Andrea del 30/07/2026: il
  perimetro non si tocca, nemmeno temporaneamente** — la finestra in cui il
  caso potrebbe verificarsi è di pochi minuti e il perimetro cambia solo se lo
  cambiamo noi.
- **Un orario che scade mentre il cliente è via.** Richiederebbe di restare
  fermi finché uno slot passa.

*Perché l'assenza di queste due prove pesa poco*: entrambe riguardano la
direzione **innocua**. Il pericolo vero è l'opposto — un indirizzo **buono**
giudicato fuori zona per un difetto nostro, che bloccherebbe un cliente onesto
— e quella direzione **è coperta dalla prova 1**: se la riverifica avesse un
errore (per esempio le coordinate passate nell'ordine sbagliato, facile in
quella funzione), l'indirizzo buono verrebbe rifiutato e il pagamento
resterebbe bloccato senza motivo. Restano inoltre coperte dai test del modulo.

**Un cambiamento di comportamento dichiarato**: prima, se il perimetro non era
ancora arrivato quando il cliente sceglieva l'indirizzo, il verdetto **non
compariva mai più** finché non ne sceglieva un altro. Ora compare appena il
perimetro arriva. Discende dall'aver reso il verdetto derivato, ed è nella
direzione che §36-40 v42 chiede.

**Dopo un ordine completato i dati del checkout restano**, e non è una
dimenticanza: §36-40 (v36) lo dice esplicitamente — si svuotano gli
**articoli**, i dati del checkout possono restare per il resto della visita,
perché un secondo ordine dallo stesso indirizzo è normale. I **consensi** no,
per la regola separata. *Questa domanda è stata posta come aperta due volte in
un giorno: vedi lezione `am`.*

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

⚠️ **GIÀ SUPERATI DALLE PROVE DEL PASSO 3 (punto 10b).** Il log del server
mostra **quattro `POST /api/checkout`** andati a buon fine durante le sei
prove, quindi almeno **quattro ordini in più** e le righe collegate in
`order_items`, `customers` e `order_status_history`. **I totali qui sotto non
sono stati aggiornati di proposito**: aggiornarli a mente è precisamente
l'errore delle lezioni `s` e `z`, commesso già quattro volte su questo stesso
elenco. Vanno **riletti dal database**, mai ricalcolati per somma — il numero
di `POST` visto nel log è un indizio, non un conteggio.

- **`orders`: 30 righe, tutte di prova** (26/07 → 01/08/2026), più **52 righe**
  in `order_items`. Quattro ordini con pagamento `succeeded` in sandbox —
  `KM-0001`, `KM-0008`, `KM-0015`, `KM-0019` — gli altri **26** `pending`.
  *Gli undici dopo `KM-0019` sono le verifiche del 31/07-01/08: quattro scatti
  della fotografia durante il riordino, gli altri della sessione precedente.
  L'ultimo è `KM-0030`, 01/08.*
- **`customers`: 40 righe, tutte di prova.** Sono **dati personali**, per quanto
  inventati. Ventuno hanno un ordine collegato, **diciannove no**: sono
  passaggi di checkout interrotti, perché il cliente viene scritto **prima**
  dell'ordine. Nessuna ha email o consenso marketing. Anche la riga intestata
  "Andrea Pastore" è una prova, non una persona.

⚠️ **La verifica dal vivo di §46 del 02/08 non ha aggiunto nulla** — né ordini
né righe cliente — e lo confermano due fonti indipendenti: il log del server
(solo un `400` e un `409`, nessun `200`) e il database (l'ordine più recente
resta `KM-0030` del 01/08). *È la prima verifica dal vivo che non lascia
residui, ed è la conferma pratica di §46 punto 7: entrambi i rifiuti cadono
prima di qualunque scrittura, riga cliente compresa.*
- **`order_status_history`: 23 righe** — venti su `KM-0001`, tre su `KM-0015`.
  Segue gli ordini per cancellazione a catena, ma va **nominata**: una tabella
  che non compare in un elenco non viene riletta. *Sono prove dell'utente sui
  passaggi di stato dal pannello.*
- **`promo_redemptions`: 1 riga** — `GIVEMEFIVE` su `KM-0001`. §14 dà **un solo
  utilizzo per cliente**: finché esiste, quel telefono non può più usare il
  codice.
- **`staff_action_log`: 70 righe, di cui 43 di test** su quattro identificatori
  — `staff:test-spice` (15), `staff:test-fase1` (12), `staff:test-fase2a` (9),
  `staff:test-merge` (7). Le altre **27**
  (`staff:bologna@kebabmediterraneo.com`) sono azioni vere sul menu vero:
  **restano**, sono l'audit trail imposto da §66 e sono **l'unica eccezione**
  all'azzeramento. *Le quattro più recenti sono la verifica di §46 del 02/08:
  prezzo di un articolo 8→9 e poi 9→8, disponibilità tolta e rimessa. Il menu è
  tornato allo stato di partenza, e il valore precedente non va ricordato a
  memoria — §66 lo registra in ogni riga.*
- **Vuote al 29/07/2026**, da ricontrollare comunque: `analytics_events`,
  `coupons`, `staff_settings`, `store_schedule_exceptions`.

---

## 11b) Il confronto dei prezzi — §46, primo tempo (31/07/2026)

**a. Cosa è stato costruito** — `lib/price-guard.js` (108 righe) e
`tests/price-guard.test.mjs` (104), commit `0e3495a`.

Modulo **puro**: niente database, niente React, niente import da `app/` o da
Next. Importa solo `lib/menu-pricing.js`. Confronta i prezzi **mostrati** al
cliente con quelli **reali** ricalcolati e restituisce uno di tre esiti —
`OK`, `CHANGED` (→ 409), `MALFORMED` (→ 400) — esportati come costanti, così
chi chiama non riscrive le stringhe a mano.

⚠️ **Non restituisce mai un importo**, né mostrato né reale: solo un verdetto.
Verificato scorrendo tutti i `return`. È il punto 2 della v44 reso impossibile
da violare **per costruzione**, non per disciplina: a valle non c'è nulla da
addebitare per sbaglio.

La conversione in centesimi (`centsOf`) è stata inizialmente **duplicata** dal
modulo dei prezzi e poi unificata nello stesso commit: ora è esportata da
`lib/menu-pricing.js` e importata qui. Due arrotondamenti diversi avrebbero
prodotto differenze inventate proprio sul confine fra ciò che il cliente vede e
ciò che paga.

**b. Come è stato verificato** — 31 asserzioni, tutte passate, su 13 casi
**dichiarati prima** di vedere il codice: prezzo identico, salito, sceso,
differenza di un centesimo, mostrato assente/null/stringa/NaN/negativo, più
righe tutte uguali, più righe con una sola diversa, lunghezze diverse, e il
caso `0.1 + 0.2` contro `0.30` che dimostra che il confronto avviene davvero in
centesimi interi.

Rieseguite **tutte e nove** le suite dopo la modifica a `menu-pricing`: tutte
passate, inclusa la fotografia dei **609 prezzi congelati** con `differenze: 0`
— la prova che aggiungere un nome all'export non ha spostato un centesimo.

⚠️ **c. Su cosa poggia l'approvazione** — il modulo è stato approvato **sui
test e sull'elenco dei suoi punti di uscita, non sulla lettura diretta del
codice**: il file è stato chiesto due volte e non è mai arrivato nella
conversazione, e si è deciso di procedere invece di insistere una terza. Chi
rilegge deve saperlo: se un giorno qualcosa non tornasse in questo modulo, il
"va bene" non era fondato su una lettura riga per riga. *Le prove restano
robuste — i 13 casi erano stati scritti prima — ma la distinzione va detta e
non nascosta.*

**d. Cosa NON è stato fatto, ed è deliberato** — **nessun aggancio**.
`lib/price-guard.js` non è importato da nessun file e
`app/api/checkout/route.js` è rimasto identico. Il sito si comporta come prima
e nessun cliente può accorgersi di nulla. È un lavoro **fermato al punto
giusto**, non lasciato a metà: riprendere da qui è sicuro anche fra settimane.

**e. La ricognizione della route, per non rifarla** — verificata il
31/07/2026 su `app/api/checkout/route.js`, **691 righe**, un solo export
(`POST`, riga 330):

⚠️ **Questa ricognizione è SUPERATA dalla tappa 2 (§11d).** Descriveva la route
com'era a 691 righe, prima dell'estrazione: **ogni numero di riga è cambiato**.
La mappa valida è quella di §11d, scritta per fasi proprio perché i numeri
invecchiano da soli. *Il testo resta qui come cronaca del punto di partenza,
non come riferimento.*

| riga (ALLORA) | cosa c'era |
|---|---|
| 332-342 | destrutturazione del corpo della richiesta — **nessun campo di prezzo** |
| 344 | rifiuto se `items` non è un array o è vuoto |
| 188, 288 | gli **unici due** punti che calcolavano un prezzo di riga (`menu-pricing`) |
| 488-490 | `resolvedItems` e il ciclo `for (const item of items)` |
| 490-543 | la regione del ricalcolo: forma del `ref`, lettura, 500 vs 400, totale di riga |
| 545 | si chiudeva il `subtotal` |
| 631 | `payment_status: "pending"` nel payload |
| **638** | **l'ordine veniva scritto in database** |
| 645 | insert delle righe `order_items` |
| 656 | `stripe.checkout.sessions.create` |

⚠️ **Il confronto deve cadere prima che l'ordine `pending` venga scritto**
(§46 v44, punto 7): dopo quel punto un rifiuto lascerebbe comunque un ordine,
cioè un residuo in più per ogni cliente respinto. Il posto naturale è **dentro
o subito dopo il ciclo degli articoli**, dove il prezzo reale di ogni riga
esiste già. *Righe attuali in §11d.*

Dentro ogni `item` arrivano oggi **due soli campi**: `quantity` e `ref`.
Nessun prezzo. Il campo nuovo dovrà entrare in **due** posti: la
destrutturazione del corpo e il ciclo.

**f. Come si eseguono i test** — **tredici** suite, tutte in
`tests/` e con estensione **`.mjs`** (non `.js`), perché vanno eseguite da Node
fuori da Next. In `package.json` **non esiste uno script `test`**: si lanciano
uno per uno con `node tests/<nome>.test.mjs`, oppure tutti con
`for t in tests/*.test.mjs; do echo "== $t"; node "$t" || echo "FALLITO: $t"; done`.
⚠️ `tests/checkout-timing.test.mjs` **costa ~7 secondi** — provoca un guasto di
lettura reale puntando il client a una porta chiusa, e il client Supabase
impiega quel tempo ad arrendersi. Non è un blocco.

## 11c) La fotografia del comportamento della route (01/08/2026)

⚠️ **I numeri di riga di questa sezione sono SUPERATI**, come quelli di §11b.e:
descrivono la route a 691 righe, prima del riordino della tappa 2 e prima
dell'aggancio del confronto prezzi. *I **fatti** restano validi e importanti —
le uscite scoperte, il buco dei tre messaggi identici, il caso delle coordinate
vuote da lasciare identico — i **numeri di riga** no.* La mappa valida è §11d.b,
scritta per fasi proprio perché i numeri invecchiano da soli.

⚠️ **Anche il criterio di lettura è cambiato dopo l'aggancio**: "zero
differenze" non è più un esito possibile. Le regole correnti vivono **in testa a
`tests/route-snapshot.mjs`**, dove chi lo esegue le trova senza dover aprire
questo documento — vedi §11e.

**a. A cosa serve** — la route di pagamento va riordinata (tappa 2 di §46), e
un riordino **non deve cambiare nulla**. Ma quel file non è raggiungibile dai
test, che è il motivo stesso per cui lo si riordina: mancava un modo di
dimostrare che dopo sia rimasto identico. La fotografia è quel modo — si scatta
prima, si riordina, si riscatta, e le due devono coincidere.

Commit `f1bf533`: `tests/route-snapshot-cases.mjs` (338 righe),
`tests/route-snapshot.mjs` (301), `tests/snapshot-prima.json` (446).

```
node tests/route-snapshot.mjs --scatta <uscita.json>       # server acceso
node tests/route-snapshot.mjs --confronta <prima> <dopo>   # esce ≠0 se differisce
```

**b. Le uscite della route, contate leggendo** — `app/api/checkout/route.js`,
**691 righe**, **25 uscite** (`return NextResponse.json`, `new Response` non è
mai usato):

| status | quante | note |
|---|---|---|
| 400 | 15 | forma della richiesta o riga non accettabile |
| 500 | 7 | `SYSTEM_ERROR_MESSAGE`, la scelta della v19 |
| 409 | 2 | riga 93 (`scheduledRejection`) e 473 (ASAP non più possibile) |
| 200 | 1 | riga 690 |

⚠️ **Una sola uscita può produrre due messaggi**: la riga 93 sceglie con un
ternario fra "orario non più disponibile" e "in quell'orario siamo chiusi".
Contando le uscite si ottiene 25; contando gli **esiti che il cliente vede**,
sono **17 messaggi distinti**.

**c. Copertura reale: 18 uscite su 25, con 20 casi.** Le **sette scoperte**
sono tutte quelle che richiedono di rompere o sporcare qualcosa: 427, 447, 585,
649 (guasti Supabase), 682 (Stripe), e le vie non provocabili di 518 e 641.
*Sono dichiarate nei commenti dei due file: dopo il riordino restano verificate
solo dalla lettura del codice, e va detto invece di lasciar credere che la rete
copra tutto.*

⚠️ **Un buco dentro la copertura**: le uscite **495, 498 e 501** rispondono con
lo **stesso identico messaggio** ("Articolo non valido."). Se il riordino le
scambiasse fra loro, la fotografia tornerebbe identica senza accorgersene. Sono
distinguibili solo dal payload inviato, non dall'esito (lezione `ad`).

**d. Perché i casi usano slot programmati** — il controllo degli orari
(righe 419-482) sta **prima** del ciclo sugli articoli: a locale chiuso e senza
uno slot valido, nessuna uscita da 495 in poi è raggiungibile, e la fotografia
sarebbe piena di risposte tutte uguali. Ma §12 prevede che a semaforo giallo o
rosso il sito accetti comunque **preordini programmati**: usando uno slot
programmato la fotografia è scattabile **a qualunque ora**. Il primo scatto è
avvenuto a `phase: red` — locale chiuso, preordini aperti — e ha funzionato.

⚠️ **Lo slot non è scritto fisso nei casi**: un "13:00" domani sarebbe già
passato. Viene calcolato allo scatto da `/api/service-status` e registrato nella
fotografia. E sono **due**, non uno: Ritiro e Delivery hanno tempi di
preparazione diversi (§12b: 15 minuti; §12: 60), quindi il primo slot utile
differisce — con uno solo, metà dei casi sarebbe caduta sul guard degli orari
invece che dove previsto. Il caso della birra (556) è in **Ritiro**: in Delivery
sarebbe caduto prima sull'ordine minimo, e quel 400 sarebbe stato scambiato per
la prova che il controllo dei 18 anni funziona.

**e. Cosa la rete ha già trovato, prima ancora di servire** — il caso costruito
per l'uscita 369 non la raggiungeva. Era stato scritto mandando la latitudine
come **stringa numerica**, ma la route non guarda il tipo: applica `Number()`,
e `Number("44.4855346")` è finito, quindi passa. La richiesta proseguiva fino
all'ordine minimo. *Un'uscita che si credeva coperta e non lo era: il buco
peggiore, perché sembra colmato.* Corretto con un valore non convertibile.

⚠️ **Comportamento non documentato, scoperto e NON corretto**: latitudine
`null`, `""` o `[]` diventa **0** con `Number()`, cioè una coordinata valida in
mezzo all'Atlantico. La richiesta supera il controllo di riga 369 e cade sul
perimetro (406, "fuori zona"). Il messaggio al cliente resta sensato, quindi
non è un guasto — ma nessuno l'aveva deciso. È registrato dal caso
`riga-406-coordinate-vuote`, **da lasciare identico** attraverso il riordino.
Cambiarlo sarebbe una decisione nuova, da mettere prima in spec.

**f. Lo scatto crea ordini di prova** — il caso 690 arriva fino in fondo:
crea un `pending` e una sessione Stripe. È voluto e autorizzato (§11): con
Stripe in sandbox non esistono ordini veri, e la pulizia pre-apertura è già una
condizione di §46. *Il conteggio degli scatti e degli ordini che ne derivano
sta in §11d.g, in un punto solo: erano due al momento in cui questa sezione è
stata scritta, e sono cresciuti con il riordino.*

⚠️ **Se lo stato del servizio differisce fra i due scatti**, il confronto lo
dichiara **in testa**, prima delle differenze: a locale aperto il caso 473
risponde 200 invece di 409, e senza quell'avviso lo si attribuirebbe al
riordino.

## 11d) Il riordino della route — §46 tappa 2, chiusa (01/08/2026)

**a. Cosa è successo** — `app/api/checkout/route.js` è passata da **691 a 332
righe** (−52%) in cinque commit, tutti fra le 05:34 e le 06:45 del 01/08/2026:

| commit | cosa | route dopo |
|---|---|---|
| `5a41b5f` | `lib/checkout-validation.js` (156 righe) + 73 asserzioni, **non agganciato** | 691 |
| `0f981e7` | la route lo usa | 651 |
| `2ff7225` | `scheduledRejectionMessage` in `lib/schedule-exceptions.js` | 645 |
| `a0114a7` | `lib/checkout-resolve.js` (301) — i resolver degli articoli | 389 |
| `4feb96d` | `lib/checkout-timing.js` (121) — il guard degli orari | 332 |

⚠️ **Il comportamento non è mai cambiato**, e non è un'opinione: la fotografia
(§11c) è stata riscattata **quattro volte**, sempre con **zero differenze** sui
20 casi. Le decisioni di forma che ne sono uscite stanno in **spec §46, blocco
"Forma dell'estrazione"** (v46) — non qui: qui c'è lo stato.

Suite: **9 → 12**, asserzioni **345 → 449**. *Numeri di allora: dopo la tappa 4
sono **13** e **461** (§11f).*

**b. La mappa della route, per fasi** — *scritta per fasi e non per numeri di
riga, perché i numeri invecchiano da soli: quelli di §11b.e sono diventati
falsi in tre ore. I pochi numeri qui sotto vanno riverificati prima dell'uso.*

| # | fase | dove vive ora |
|---|---|---|
| 1 | lettura del corpo (`request.json`, **non protetto**) | route |
| 2 | validazioni di forma — 8 uscite 400 | `checkout-validation` |
| 3 | store attivo e geofence | `get-active-store`, `get-store-geofence` |
| 4 | guard degli orari — 2×500, 3×409 | `checkout-timing` |
| 5 | ciclo articoli: forma del `ref`, risoluzione, prezzo di riga | route + `checkout-resolve` |
| 6 | minimo Delivery e 18 anni — 2 uscite 400 | `checkout-validation` |
| 7 | cliente (upsert), sconto, totali, payload | route |
| 8 | **scrittura dell'ordine**, righe, Stripe, aggiornamento sessione | route |

Nella route restano tre funzioni: `round2`, `insertOrderWithPickupCode`, `POST`.

⚠️ **Il confronto dei prezzi (tappa 3) va agganciato nella fase 5**, dove il
prezzo reale di ogni riga esiste già e si è ancora **prima** della scrittura
dell'ordine (fase 8) — che è il vincolo di §46 v44 punto 7.

**c. Contare le uscite senza spaventarsi** — ci sono **due misure diverse** e
vanno sempre dichiarate insieme, o un numero da solo fa sospettare una
regressione: le **risposte HTTP possibili** e i **`return NextResponse.json`
scritti nella route**, che non coincidono perché le uscite delegate ai moduli
si accorpano in un punto solo. ⚠️ **Tre uscite hanno uno status dinamico**:
leggendo la sola route non si sa che codice rispondono, bisogna aprire il
modulo. *I numeri correnti e l'aritmetica che li lega stanno in **spec §46,
punto 7**, in un punto solo: qui non si ripetono, perché cambiano a ogni lavoro
sul file — questa riga li ha già portati sbagliati una volta.*

**d. Cosa NON è stato toccato, di proposito** — i tre casi noti restano
identici e sono **decisioni rinviate, non dimenticanze**: l'uscita non censita
di `getActiveStore` (un 404 o un 500 confezionati dentro quel modulo, fuori
dalle 25 e fuori dalla fotografia), il `request.json()` **non protetto** (un
corpo non-JSON non produce nessuna delle 25 uscite), e l'update della sessione
Stripe **senza controllo d'errore** (se fallisce, il cliente riceve comunque il
200). Cambiarli è modificare il comportamento: prima la decisione in spec.

**e. Cosa la tappa 2 ha guadagnato in copertura** — una delle sette uscite
scoperte non lo è più: `tests/checkout-timing.test.mjs` esercita un **guasto di
lettura reale** puntando il client Supabase a una porta chiusa, e verifica che
il modulo risponda con la sentinella importata. *È la prima volta che uno dei
rami di guasto passa sotto un test automatico, e la strada esiste anche per gli
altri.*

⚠️ **Un ramo resta scoperto e va saputo**: il **rifiuto** della Delivery
programmata. Tutti i casi Delivery della fotografia usano uno slot valido e
attraversano quel ramo senza fermarsi, quindi nessuno lo fa rifiutare. Il
gemello del Ritiro — stessa funzione, cambia solo il flag della chiusura
inclusa — è invece provato due volte.

**f. Perché ci si è fermati qui** — ciò che resta è la **sequenza delle
scritture**: cliente, sconto, totali, ordine, righe, Stripe. *Non è un grumo, è
un filo*: ogni passo produce il valore che serve al successivo. Spezzarlo non è
riordino, è decidere dove passa il confine di ciò che, fallendo a metà, lascia
dati incoerenti — e per metodo quella decisione va **prima in spec** (§46,
punto 8 del blocco v46).

**g. Costo** — **quattro** scatti della fotografia, tutti la mattina del
01/08/2026 fra le 05:42 e le 06:43 = **quattro ordini `pending` di prova** in
più, con le relative sessioni Stripe sandbox: **uno dopo ciascuno dei quattro
commit che hanno toccato la route** (`0f981e7`, `2ff7225`, `a0114a7`,
`4feb96d`). *Nessuno scatto dopo `5a41b5f`, che costruiva solo il modulo e il
suo test: la route era intatta e non c'era nulla da confrontare.* La base di
confronto `tests/snapshot-prima.json` viene dalla sessione precedente, ed è
quella che §11c contava a parte.
*Contati dai log dei quattro server avviati — 20 POST ciascuno, di cui una sola
200 — non a memoria: la prima stesura di questa riga diceva "tre" e
contraddiceva il punto (a) trenta righe sopra; la seconda aveva il numero
giusto ma lo scomponeva in tre passi invece di quattro, cioè offriva a chi
volesse ricontrollarlo una strada che porta al numero sbagliato.*
Vanno nel conto della pulizia pre-apertura, che si rilegge dal database e non
si ricopia da qui.

## 11e) Il confronto dei prezzi agganciato al server — §46 tappa 3, passo 1 (01/08/2026)

**a. Cosa è stato fatto** — commit `05c6bc9`. La route riceve, per ogni riga
del carrello, il prezzo unitario che il cliente ha davanti, e lo confronta con
quello ricalcolato dai dati vivi. Se differiscono si ferma; se il campo non
arriva, rifiuta la richiesta.

Route: **332 → 415 righe**. Import del guard a riga 40, raccolta del campo
dentro il ciclo degli articoli, confronto subito dopo, le due uscite nuove poco
sotto. *Numeri di riga verificati il 01/08 — da riverificare prima dell'uso.*

⚠️ **Il confronto scatta prima di QUALUNQUE scrittura**, non solo prima
dell'ordine: sta prima anche della riga cliente. §46 v44 punto 7 chiede solo
"prima dell'ordine `pending`", ma anche la riga cliente è un residuo (§65) e
fermarsi prima non costa nulla. *Verificato: lo scatto in cui tutti i casi
cadevano sul guard non ha creato né ordini né clienti.*

**b. Il campo si chiama `items[].unitPriceShown`** — dentro la riga, accanto a
`ref` e `quantity`, non in un elenco parallelo a livello di corpo: un elenco a
parte identificherebbe i prezzi **per posizione**, con due liste da tenere
allineate. *Questo diverge dal preventivo di §11b.e, che diceva "due posti": con
il campo dentro la riga il posto è **uno**, il ciclo.*

⚠️ **Il prezzo ricevuto non entra mai nel calcolo dell'addebito**, e non per
disciplina: `lib/price-guard.js` restituisce un verdetto e mai un importo, per
costruzione (§46 v45).

**c. Sito e server usano lo STESSO calcolo** — verificato leggendo tutte e
cinque le strade che creano una riga di carrello: chiamano `productLinePrice` /
`comboLinePrice`, gli stessi che usa il server. *Se le due formule fossero
diverse, il confronto fallirebbe sempre e avremmo costruito una trappola invece
di un controllo.* Un `409` significa quindi "il listino si è mosso", mai "le due
formule non coincidono": il sito calcola su un menu letto **una volta sola**
all'apertura della pagina, il server sui dati vivi.

**d. Come si legge il confronto adesso** — ⚠️ **"zero differenze" non è più un
esito possibile**, ed è voluto: il catalogo è passato da 20 a **23 casi**, e i
tre nuovi (`guard-prezzo-salito`, `guard-prezzo-sceso`, `guard-prezzo-assente`)
non esistono in `snapshot-prima.json`, quindi ogni confronto futuro mostrerà per
sempre tre righe di "presenza".

**La base NON si rigenera** (lezione `af`): una fotografia rifatta dopo il
cambiamento coincide sempre e non dimostra più nulla. Le regole correnti stanno
**in testa a `tests/route-snapshot.mjs`**, dove chi lo esegue le trova: tre
righe di presenza attese e permanenti, ogni altra differenza da spiegare prima
di accettarla, e il confronto da leggere insieme all'avviso sullo stato del
servizio. *Tre righe sono previste; la quarta è una domanda.*

**e. La previsione va scritta PRIMA dello scatto** — è il metodo che ha
funzionato qui e che vale per ogni cambiamento voluto: si dichiara caso per
caso cosa deve cambiare, poi si scatta, poi si confronta la realtà **con la
previsione** e non con la fotografia vecchia. *Guardare le differenze e
convincersi a posteriori che tornano è troppo facile.*

⚠️ **Una lezione dal primo scatto**: la previsione diceva "3 differenze,
nessun'altra", ma un quarto caso era stato dichiarato **condizionato allo stato
del servizio** senza scriverne l'esito — e il semaforo era cambiato. Il
meccanismo era previsto, **il numero no**. Un numero dichiarato è un impegno: se
una condizione può spostarlo, va sciolta prima, non annotata a margine.

**f. Copertura: 20 uscite su 27.** Le sette scoperte sono le stesse di sempre.
Per la prima volta il **`409` è provato attraverso la route vera** e non solo
sul modulo: senza i due casi nuovi, la regola che dà il nome a tutta la tappa
non sarebbe esercitata da nulla.

**g. Costo** — due scatti in questa fase: il primo **zero ordini** (tutti i casi
cadevano sul guard), il secondo **un ordine**, da `riga-690`. *Contati dai log,
non a memoria.*

✅ **h. Il disallineamento è chiuso** (`9705d4a`, 01/08 23:38). *Fino a quel
commit il sito non mandava `unitPriceShown` e un ordine dal browser riceveva un
`400`; questa sezione lo dichiarava e la frase è stata vera per poche ore.*
Dal `9705d4a` sito e server sono in passo, e dal 02/08 l'ordine dal browser è
stato composto e verificato dal vivo (§11f).

## 11f) Il lato sito e la chiusura di §46 — tappa 4 (01-02/08/2026)

**a. I tre commit di codice**

| commit | quando | cosa |
|---|---|---|
| `9705d4a` | 01/08 23:38 | il sito manda `items[].unitPriceShown`, dallo **stesso calcolo del server** |
| `4304910` | 02/08 10:38 | riconosce i due rifiuti che riguardano il menu, rilegge il listino, riporta al carrello |
| `dade165` | 02/08 10:50 | il testo deciso quando la rilettura fallisce |

Dimensioni dopo: `app/page.js` **3827 righe**, `route.js` **415** (non toccata).
**13 suite, 461 asserzioni** — contate eseguendo, non con `grep` (lezione `az`).

**b. ⚠️ Il rifiuto si riconosce dal TESTO, non dallo status.** È il punto più
insidioso dell'intera tappa. I testi distinti che il cliente può ricevere sono
**quattordici** con `400` e **quattro** con `409`; **due soli** riguardano il
menu. Riconoscerli dal solo codice numerico significherebbe buttare fuori dal
checkout un cliente a cui manca la spunta della privacy, o uno a cui è scaduto
lo slot — e quest'ultimo si ritroverebbe nel carrello, **dove il selettore
dell'orario non c'è**, contro §41-45 v18.

*Il difetto è stato scritto e poi trovato prima del commit: la prima stesura
agganciava il `400` al testo e il `409` al solo status. È emerso **contando le
uscite `409` nel codice**, non rileggendo il ragionamento.* Oggi la condizione è
simmetrica e `tests/checkout-messages.test.mjs` tiene allineate le due copie dei
testi fra sito e route, con guard verificati capaci di fallire.

**c. Cosa fa il sito al rifiuto** — rilegge il menu con `fetchMenuData`,
ricalcola le righe con `restoreCart` e lo **stesso** adattatore del rientro
(estratto in `buildRestoreCatalog`, perché due copie divergerebbero), posa
righe, avviso e messaggio, **poi** cambia schermata. L'ordine conta: le
assegnazioni stanno tutte prima del passaggio al carrello.

Le assegnazioni sono **incondizionate**, al contrario di quelle del rientro:
così il carrello si svuota davvero se tutte le righe cadono, e l'avviso si
azzera davvero invece di lasciare a schermo quello vecchio — che sembrerebbe la
spiegazione di questo rifiuto.

**d. Chi mostra cosa** — al `409` compare sopra il carrello il messaggio del
listino; al `400` **no**, e di proposito: là parla l'avviso delle righe tolte,
che dice **quale** articolo e **perché**, mentre il testo del server non lo dice.

⚠️ **La gestione è rimasta in `CheckoutScreen` con una funzione passata
dall'alto**, non spostata in `Home`. La ragione non è comodità: i tre consensi
vivono nello stato locale del checkout **apposta perché si azzerino** (§36-40
v39), e portare su la richiesta li avrebbe trascinati con sé.

**e. ✅ Verificato dal vivo da Andrea il 02/08/2026**, su due rami:
prezzo cambiato dal pannello a carrello pieno, e articolo messo esaurito nella
stessa situazione. Entrambi si comportano come deciso.

⚠️ **Un ramo NON è stato provato dal vivo: lo slot scaduto.** È verificato solo
leggendo il percorso, più il controllo automatico che impedisce di riconoscere
il rifiuto dal solo status. *Non appartiene a §46 e si comporta come prima di
questo lavoro — ma è il **primo punto da riprovare** se qualcuno tocca quel
ramo. Non era impossibile da provare: bastava aspettare che uno slot scadesse.*

**f. La prova non ha lasciato residui**, per la prima volta (dettaglio al punto
11). Il menu è tornato allo stato di partenza.

**g. Cosa resta registrato e non fatto** — sta in **spec §46**, non qui: il
server che dica **quale riga** e perché (una frase sola copre dodici cause) e
il rilascio dell'indice dal modulo di confronto, che vanno insieme perché i due
rami hanno ciascuno il proprio ostacolo; la protezione dal **guasto parziale**
di `fetchMenuData`, dove sette query su nove falliscono in silenzio; le due
cause che la rilettura non vede (filtro store, extra carne nel combo); e le due
decisioni **rimandate** sulla riga bloccata.

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

Con §46 chiusa restano **cinque** condizioni di apertura (elenco più sotto).
⚠️ **Almeno due richiedono ancora di scrivere codice**: le analytics di §65 —
una dozzina di eventi da tracciare, più la pagina dei carrelli abbandonati — e
il **collegamento** all'informativa privacy nel checkout, che va scritto anche
se il documento si procura altrove. Le altre tre — Stripe live, dominio,
pulizia dei dati di prova — sono da procurare o configurare, e possono
camminare in parallelo.

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
apre per tutti e quattro i lavori registrati.*

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

### Condizioni di apertura — **tre chiuse, sei aperte**

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

⚠️ **Restano sei voci aperte in tutto**: le **quattro** dell'elenco storico —
Stripe live, dominio, analytics, pulizia dei residui — più le **due** aggiunte
qui sotto dal giro privacy. *Delle sei, una sola richiede di scrivere codice: le
analytics di §65. §46 era però l'unica che richiedesse di **costruire una
funzione nuova**.*

⚠️ *Questa intestazione e questo conteggio vanno riletti ogni volta che
l'elenco cambia: è la seconda volta che restano indietro rispetto alle voci.*

**Le due voci nuove**, fuori dall'elenco storico ma prima dell'apertura, nate
dal giro privacy (punto 14):

- **Piano Supabase Pro**, da attivare **prima dei primi ordini veri**: oggi il
  piano è Free e **non include alcun backup**. Senza, il punto 11.7
  dell'informativa è falso e non esiste ritorno da un errore di cancellazione o
  da un guasto.
- **Procedura mensile di pulizia** degli ordini `pending` oltre i 30 giorni
  (§69), con lo stesso script SQL della pulizia dei residui.

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

---

## 14) Il giro privacy (02-03/08/2026)

Sessione **fuori dal codice** per la quasi totalità: due audit di sola lettura, la stesura dell'informativa e un solo intervento sul repository alla fine.

### 14a) I due audit

**Primo blocco** — Supabase, struttura dei dati personali, persistenza, cancellazione. **Secondo blocco** — consensi, pagina di stato, cookie e memoria del browser, logging. Entrambi con regola obbligatoria sulle fonti (`file:righe`, comando eseguito, `deduzione`, `non verificabile`) e con divieto esplicito di usare spec, handoff o commenti come prova.

Due lezioni di metodo da conservare:

* le **policy RLS non sono verificabili** né dal repository né dalle normali API: PostgREST espone solo `public`. Vanno lette con query eseguite a mano nella dashboard. Non dedurle mai dal codice;
* una domanda che chiede *"confermi che X?"* invita a rispondere di sì. Chiedere il valore, non la conferma.

### 14b) Cosa è risultato

**Buono e chiuso:** nessun cookie sulle pagine cliente (verificato dal vivo in finestra pulita); nessun analytics o error tracking; la pagina di stato non invia al browser alcun dato personale, perché la `select` prende quattro colonne; nessun `console.log` nel codice applicativo, tutti i 45 punti sono `console.error`.

**Da sanare, registrato in spec:** la prova del consenso marketing viene azzerata a ogni riordino; manca la costante di versione del testo privacy; tre `console.error` del checkout stampano oggetti errore interi; `km_direct_checkout` non viene mai cancellato; Google Maps caricato su ogni pagina prima dell'interattività.

**Scoperta con conseguenza fuori dal codice:** il progetto Supabase è su **piano Free, che non include backup**. Nessuna copia di sicurezza esiste oggi.

### 14c) L'unico intervento sul codice

Pubblicazione dell'informativa. **Quattro file toccati**, nessun altro:

| file | intervento |
|---|---|
| `app/privacy/page.js` | nuovo, 848 righe — la pagina, statica (`○ prerendered`) |
| `app/privacy-footer.js` | nuovo, 33 righe — collegamento condiviso in fondo |
| `app/page.js` | +37 / −1 — collegamento nella casella, footer prima della barra sticky |
| `app/conferma/page.js` | +5 / −0 — footer prima di `</main>` |

`app/layout.js`, `app/api/checkout/route.js` e tutto ciò che riguarda il salvataggio dei consensi sono **intatti**.

Verifiche: testo servito identico al sorgente carattere per carattere (21285 su entrambi i lati, 18 h2 · 13 h3 · 98 voci); clic sul collegamento **non** cambia lo stato della casella, con prova di controllo che dimostra che il rilevatore scattava; dati del modulo intatti dopo la navigazione; footer presente su home e conferma, assente dal pannello staff; pagamento ancora bloccato senza spunta; rifiuto lato server `400`, prima di qualunque scrittura; 13 suite, 461 asserzioni, zero fallimenti.

⚠️ **Due limiti dichiarati dall'ambiente di prova, da chiudere con un dito su un telefono vero:** l'apertura in scheda nuova è stata verificata negli attributi ma non nell'effetto; i clic per coordinate non atterravano, quindi le prove usano eventi dispatchati.

Committato il 03/08/2026 come `c69642e`.

---

## 15) Condizioni di apertura — aggiornamento

Delle cinque aperte in `HANDOFF_2.md` §12:

* **Informativa privacy — CHIUSA il 03/08/2026** (commit `c69642e`). Terza condizione a chiudersi. Resta la stringa `informativa-v1.2` da salvare in database, che si fa quando si riapre il file del checkout: è un lavoro registrato, non una condizione.
* **Statistiche (§65) — aperta**, ora con i vincoli dell'informativa (vedi aggiornamento spec).
* **Stripe live, dominio, pulizia dei residui — aperte**, invariate. Col dominio va ristretta la chiave API di Google.

**Nuove, nate da questo giro:**

* **piano Supabase Pro** da attivare prima dei primi ordini veri: senza, il punto 11.7 dell'informativa è falso e non esiste alcun ritorno da un errore;
* **procedura mensile di pulizia** degli ordini `pending` oltre i 30 giorni, con lo script SQL condiviso con la pulizia dei residui;
* **chiave API Google da restringere** al dominio, contestualmente al dominio vero.

Fuori elenco ma prima dell'apertura resta la **Fase 3** (creazione di articoli dal pannello), con la decisione ancora da prendere su generazione dello `slug` e collisioni.

---

## 16) Il prossimo passaggio su `app/api/checkout/route.js`

Vale la regola: **non si riapre quel file per una cosa sola.** Quando si riapre, ci vanno insieme:

1. costante `PRIVACY_TEXT_VERSION` = `informativa-v1.2`, salvata accanto alla data;
2. `upsert` che non azzera la prova del consenso marketing precedente;
3. i tre `console.error` (308, 364, 372) ridotti ai soli campi necessari;
4. gli eventi delle statistiche che ricadono su quel percorso;
5. la **tappa 3b di §46**, se l'incrocio con il punto 4 si conferma — da verificare prima di scegliere l'ordine.

Analogamente su `app/page.js`: cancellazione di `km_direct_checkout` a ordine concluso, eventi statistici lato cliente, ed eventuale spostamento del caricamento di Google Maps — che però comporta la **v1.3 dell'informativa** nello stesso passaggio.

---

## 17) Verifiche ancora da fare a mano

* le due prove dal telefono sul collegamento nella casella (scheda nuova, dati del modulo intatti);
* le query di sola lettura preparate nel primo blocco di audit — RLS, foreign key, `ON DELETE`, trigger — da eseguire nell'editor SQL della dashboard e riportare a Code per l'interpretazione. **Finché non sono state eseguite, lo stato delle RLS è ignoto.**