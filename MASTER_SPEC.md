# KM DIRECT — MASTER SPECIFICATION

**Versione 51** — sostituisce la v50.

Documento di riferimento definitivo per lo sviluppo. Le decisioni qui
contenute sono approvate: non vanno reinterpretate senza un motivo concreto
(vedi §73). Ogni file di codice del progetto deve rispettare queste regole.

**Novità della v51** (vincolanti):

1. §46 punto 9 — **l'articolo non più ordinabile riceve lo stesso trattamento
   del prezzo cambiato**: rilettura del menu, ritorno al carrello. ⚠️ È il caso
   **più probabile**, non il `409`: il ciclo che risolve gli articoli gira prima
   del confronto prezzi, quindi un `409` è possibile solo se tutte le righe si
   sono risolte un istante prima. Senza questa estensione il vicolo cieco
   restava in piedi proprio dove capita davvero.
2. §46 punto 9 — **la riga non ordinabile viene tolta, e l'avviso già esistente
   dice quale e perché** (decisione di Andrea, 01/08/2026). Si riusa l'avviso
   del rientro, non se ne scrive uno nuovo. ⚠️ **Questa regola SOSTITUISCE
   quella della v49 e vale su entrambi i rami**, `400` e `409`: la prescrizione
   della v49 — la riga resta, segnata e bloccante — **non è costruibile su
   nessuno dei due**, perché il modulo di confronto non dice quale riga ha
   fallito e la rilettura non distingue due righe dello stesso prodotto. *Il
   principio resta giusto e torna applicabile quando il server dirà quale riga:
   una regola sola, non due da armonizzare.*
3. §46 punto 9 — **due decisioni registrate come RIMANDATE, non cancellate**:
   la riga bloccata che non conta nel totale e che non mostra prezzo. Oggi non
   hanno oggetto perché la riga bloccata non si costruisce; *una decisione che
   sparisce torna come domanda aperta al primo che riprende il lavoro.*
4. §46b — ⚠️ **la geofence non superata risponde `400`, non `409`**: l'elenco
   dei codici lo classificava male dalla v14. Finora innocuo, non più da quando
   il sito ragiona sugli status. Allineato il documento al codice.
5. §46 e §46b — **corrette due note di stato invecchiate**: il corpo di §46
   diceva che il confronto "non esiste ancora" (esiste lato server dal 01/08),
   e il lavoro sul tempo di preparazione **aveva una scadenza ancorata a un
   altro lavoro per la seconda volta**. ⚠️ *Il difetto non era la frase, era la
   forma: una scadenza ancorata a un evento futuro scade da sola quando
   l'evento accade senza di lei.* Ora è un lavoro registrato senza ancoraggio.

*La v51 non tocca il codice. Chiude il perimetro del lato sito prima che venga
costruito, registra ciò che resta fuori, e allinea quattro frasi che il
calendario aveva superato. La condizione di apertura §46 resta aperta.*

**Novità della v50** (vincolanti):

1. §46 punto 7 — **corretto il conteggio delle uscite, in due modi.**
   *Aggiornamento*: dopo l'aggancio del confronto prezzi (`05c6bc9`) le
   risposte HTTP possibili sono **27** e non 25, i `return` scritti nella route
   sono **17** e non 15. *Correzione di aritmetica*: la spiegazione diceva
   "dieci uscite accorpate", ma dieci è la **riduzione netta** — le uscite
   assorbite sono **quattordici** in quattro punti di delega — e contava tre
   rifiuti di slot dove il censimento ne conta due, perché una sola uscita
   sceglie fra due messaggi. ⚠️ *Il numero pubblicato era giusto, la
   spiegazione portava a un numero sbagliato: chi avesse ricontrollato avrebbe
   ottenuto 21 e concluso che c'era una regressione.*

*La v50 non tocca il codice e non prende decisioni nuove: allinea un conteggio
al codice di oggi e corregge un'aritmetica che non chiudeva. Il lato sito non è
ancora fatto e la condizione di apertura §46 resta aperta.*

**Novità della v49** (vincolanti):

1. §46 punto 8 — ⚠️ **una riga non più ordinabile NON si toglie dal carrello**
   (decisione di Andrea, 01/08/2026). La rilettura del menu al `409` può
   scoprire un articolo sparito, esaurito, o con un'opzione che non esiste più:
   la riga **resta**, segnata come non disponibile, e **blocca il pagamento**
   finché il cliente non interviene. *Emerso leggendo il codice: lo strumento
   che ricalcola i prezzi è lo stesso che ripristina il carrello dopo una
   chiusura del browser, e quello **toglie** le righe non ordinabili — al `409`
   sarebbe il rifiuto secco davanti al pagamento che §36-40 vieta.*
2. §46 punto 8 — **la riga bloccata deve essere visibile dentro il carrello**:
   l'avviso delle rimozioni è oggi nascosto mentre il checkout è aperto, e non
   basterebbe comunque, perché con questa decisione non ci sono rimozioni da
   spiegare.
3. §46 punto 8 e §46b — **deciso cosa succede se la rilettura del menu
   fallisce**: `Non riusciamo ad aggiornare il menu. Ricarica la pagina.`
   Senza questa riga il cliente resterebbe col messaggio del listino e i prezzi
   vecchi, cioè nel vicolo cieco che la v48 esiste per chiudere.

*La v49 non tocca il codice: chiude i due buchi che la ricognizione del lato
sito ha trovato nel punto 8, prima che venga costruito. Il confronto è
agganciato al server dal 01/08 (`05c6bc9`), il lato sito non è ancora fatto.*

**Novità della v48** (vincolanti):

1. §46 punto 8 — ⚠️ **al `409` il sito deve rileggere il listino**, non
   limitarsi a cambiare schermata. I prezzi del carrello sono congelati da
   quando la riga è stata creata: senza rilettura il cliente tornerebbe al
   carrello vedendo **gli stessi numeri** che hanno causato il rifiuto, e il
   messaggio "controlla il tuo carrello" diventerebbe un **vicolo cieco**.
   *La regola v44 diceva "con prezzi aggiornati" dando per scontato un
   aggiornamento che il sito non fa: emerso leggendo il codice, non provandolo.*
2. §46 punto 8 — **nessuna evidenziazione della differenza di prezzo**
   (decisione di Andrea, 01/08/2026): si mostrano i prezzi nuovi, senza
   indicare quale è cambiato né di quanto.

*La v48 non tocca il codice: precisa cosa deve fare il lato sito prima che
venga costruito. Il confronto è agganciato al server dal 01/08 (`05c6bc9`), il
lato sito non è ancora fatto, e la condizione di apertura §46 resta aperta.*

**Novità della v47** (vincolanti):

1. §46 punto 6 e §46b — **deciso il testo che mancava**: se il prezzo mostrato
   non arriva nella richiesta, il `400` risponde `Si è verificato un problema.
   Ricarica la pagina e riprova.` (decisione di Andrea, 01/08/2026). Fino alla
   v46 quel punto prescriveva il rifiuto **senza fissare alcun testo**, e
   nemmeno l'elenco dei messaggi di §46b lo conteneva: sarebbe stato inventato
   dentro il commit, contro la regola che le decisioni vanno prima in spec.
2. §46b — **corretta una nota di stato rimasta indietro.** Il lavoro sul tempo
   di preparazione e sulla griglia dei quarti d'ora diceva "si chiude insieme
   al lavoro 1 di §46"; quel lavoro **è chiuso dal 01/08/2026** e il controllo
   non è stato costruito. Si chiude ora **con l'aggancio del confronto dei
   prezzi**, che è l'ultima riapertura prevista di quel file. *Seconda
   occorrenza in due giorni della lezione `aj`: le note di stato non
   invecchiano in silenzio.*

*La v47 non tocca il codice né cambia una regola: fissa un testo che mancava e
allinea una promessa che il calendario aveva superato. Il confronto dei prezzi
resta **non agganciato** e la condizione di apertura §46 resta aperta.*

**Novità della v46** (vincolanti):

1. §46 — **il lavoro 1 registrato dalla v38 è chiuso**: la route di pagamento è
   passata da 691 a 332 righe e ciò che decide se un ordine è accettabile vive
   ora in moduli raggiungibili da un test. Resta dentro la sequenza delle
   scritture, e la spec dice perché non si spezza oltre.
2. §46 — **fissata la forma dell'estrazione**: moduli puri per ciò che calcola,
   moduli che possiedono `supabaseAdmin` per ciò che legge, e la **route che
   confeziona sempre la risposta HTTP**. Nessun modulo restituisce
   `NextResponse`.
3. §46b — ⚠️ **la sentinella dei guasti di lettura si importa e non si ricrea
   mai.** È un `Symbol`, e due `Symbol()` distinti non sono mai uguali: una
   copia locale renderebbe il confronto **sempre falso**. La conseguenza è
   stata **verificata eseguendola** e non è quella che si immaginerebbe: nei
   resolver la sentinella estranea prosegue **come una riga valida** — è un
   valore veritiero — corrompe gli importi in `NaN` e **scavalca l'ordine
   minimo e il controllo dei 18 anni** prima di schiantarsi sull'inserimento;
   nel guard degli orari solleva invece un'eccezione non gestita. È la regola
   più pericolosa da violare di tutta la sezione, e **il danno non è uniforme
   fra i due punti di confronto**.
4. §46b — **il testo del guasto di sistema appartiene alla route**, non ai
   moduli: sette uscite lo usano e solo alcune sono estratte. I moduli
   restituiscono la sentinella, la route possiede la parola.
5. §46 — **registrate due rinunce motivate**: `round2` e `needsRemovalCheck`
   restano nella route, con le ragioni, perché una rinuncia non spiegata viene
   "completata" da qualcuno mesi dopo.
6. §46 — **l'asimmetria fra i due resolver è preservata di proposito**:
   `resolveCombo` filtra per store, `resolveProduct` no. Sanarla è una
   decisione, non una pulizia (è il lavoro 2 registrato dalla v38).
7. §46 — **oltre questo punto l'estrazione richiede prima una decisione**: dove
   taglia il confine di ciò che, fallendo a metà, lascia dati incoerenti. Oggi
   quel confine non è scritto da nessuna parte, quindi il lavoro non si apre.

*La v46 non cambia nulla di ciò che il cliente vede né di ciò che il server
addebita: il comportamento è stato verificato identico su 20 casi dopo ognuno
dei cinque passi. Mette per iscritto le decisioni prese mentre si costruiva,
che vivevano nei soli commenti del codice — la stessa ragione della v45.*

**Novità della v45** (vincolanti):

1. §46 — **fissato il contratto del modulo di confronto**, cioè cosa chi lo
   chiama deve garantire e cosa il modulo garantisce in cambio. Le due regole
   sotto erano state decise il 31/07/2026 mentre si costruiva e vivevano nei
   soli commenti del codice: un commento non è un vincolo e nessuno lo rilegge.
2. §46 — **un confronto senza righe da confrontare è `malformato`, mai "ok"**:
   elenchi vuoti, o di lunghezza diversa fra mostrati e reali. "Nessuna riga
   verificata" non deve poter valere come via libera.
3. §46 — **gli esiti restano tre e non quattro.** Il modulo non distingue il
   caso "prezzo reale inutilizzabile" perché **non deve mai riceverlo**: chi lo
   chiama passa solo righe risolte con successo, e un guasto di lettura è già
   `500` per §46b, non un rifiuto addossato al cliente. La garanzia sta a monte,
   e va scritta qui perché chi un domani riusasse il modulo altrove sappia cosa
   deve garantire prima di chiamarlo.

*La v45 non cambia nulla di ciò che il cliente vede né di ciò che il server
addebita: mette per iscritto due decisioni già prese e una garanzia che finora
esisteva solo dentro un commento. Il confronto di §46 resta **non agganciato**
al percorso di pagamento, e la condizione di apertura resta aperta.*

**Novità della v44** (vincolanti):

1. §46 — **deciso come si chiude la condizione di apertura sui prezzi.** Al
   checkout il server confronta il prezzo che il cliente ha davanti con quello
   reale di quel momento e, se differiscono, **si ferma** con `409` e il testo
   `Abbiamo aggiornato il listino, controlla il tuo carrello`. Vale in entrambe
   le direzioni, aumento e ribasso. Regola di sicurezza che non va persa di
   vista: **il prezzo ricevuto dal browser serve solo al confronto e non entra
   mai nel calcolo dell'addebito** (§46, "mai fidarsi del browser").
2. §46 — **se il prezzo mostrato non arriva, la richiesta è malformata**
   (`400`), non un confronto da saltare. Senza questa riga il controllo si
   aggira omettendo un campo.
3. §46 — **il confronto precede la creazione dell'ordine `pending`** e
   qualunque chiamata a Stripe: un tentativo fermato non lascia righe da
   ripulire (§65).
4. §46 — **ambito deciso da Andrea il 31/07/2026: solo i prezzi.** Gli
   allergeni restano fuori **finché resta in piedi** la regola operativa che li
   si modifica fuori dall'orario di servizio (§67). È quella regola a rendere
   impossibile la divergenza, non la scarsità del rischio: se cade, la
   decisione va rifatta prima di toccare gli allergeni durante il servizio.
5. §46b — aggiunto il rimando al testo del nuovo messaggio nell'elenco dei
   testi, che resta l'indice di dove i messaggi vivono.

*La v44 decide, non descrive: al momento in cui è scritta il confronto **non
esiste ancora nel codice**, e la condizione di apertura di §46 resta aperta. Va
tolta dall'elenco solo quando il confronto sarà implementato e verificato dal
vivo, non prima (§46, blocco v38).*

**Novità della v43** (vincolanti):

1. §36-40 — **la persistenza è costruita, e la spec smette di descriverla come
   da fare.** Le frasi che dicevano che il carrello "oggi non sopravvive" e che
   il calcolo del prezzo di riga "va estratto" erano vere quando furono scritte
   e **false dal 30/07/2026**. Tolta anche la riga "Condizione da chiudere
   prima del go-live": quella condizione è chiusa, e lo stato di ciò che è
   costruito vive nell'`HANDOFF.md`.
2. §46b — **corretta una citazione parziale sulla validazione dell'orario.** La
   spec diceva che il server accetta un orario "in qualunque forma `HH:MM`". È
   troppo largo e falso: la validazione sta su **due** righe, e la seconda
   rifiuta le ore oltre 23 e i minuti oltre 59, quindi `24:00` e `12:60` **non
   passano**. Il buco registrato resta vero — `12:07` passa davvero, perché la
   griglia dei quarti d'ora non è imposta — ma va descritto per quello che è.
   *Una citazione parziale è più pericolosa di una sbagliata: non suona falsa.*
3. §63-64 — **aggiornato lo stato dell'editor menu nel corpo della sezione**,
   che lo descriveva ancora come "in sviluppo" e capace del solo
   disponibile/esaurito. Le Fasi 1, 2A e 2B sono complete e verificate dal
   29/07/2026; prima del go-live resta la sola Fase 3. Il blocco di stato più
   sotto lo diceva già dalla v40: le due parti si contraddicevano.
4. §66 — **il toggle disponibile/esaurito è registrato.** La regola sul log si
   chiudeva con "che oggi non viene loggato", in contraddizione con §63-64, che
   dalla v28 registra anche quel comando.
5. §67 — **le salse senza flag dietetico dichiarato sono 2, non 3**: Tzatziki e
   Yogurt. Il "3 salse su 7" era il numero della v30, sopravvissuto alla
   compilazione della terza.
6. §65 e §22 — **tolte due fotografie rimaste indietro**: il conteggio delle
   righe cliente, che ora rimanda all'`HANDOFF.md` come già fatto in v40 per i
   residui di prova, e la frase che descriveva la costante dell'extra carne
   come ancora presente nel codice, dove non c'è più.

*La v43 non prende alcuna decisione di prodotto: allinea il corpo della spec al
codice di oggi e sposta nell'handoff ciò che invecchia. È lo stesso lavoro
della v40, sulle frasi che quella passata non aveva raccolto — segno che una
passata sola non basta, e che queste frasi vanno cercate una per una invece che
ricordate.*

*I blocchi "Novità" delle versioni passate non sono stati toccati: sono il
diario del progetto e raccontano cosa fu deciso allora, non come stanno le cose
adesso. Tutte le correzioni qui sopra riguardano il corpo delle sezioni, che è
ciò che si legge per sapere lo stato di oggi.*

**Novità della v42** (vincolanti):

1. §36-40 — **il ripristino del checkout è parziale, campo per campo, ma
   l'indirizzo è indivisibile.** *Decisione dell'utente del 30/07/2026.* Ciò
   che si legge si tiene; ciò che non si legge si lascia vuoto. **Indirizzo,
   civico e coordinate però si ripristinano tutti insieme o per niente**: sono
   una cosa sola, e ripristinarne un pezzo produrrebbe un indirizzo senza
   coordinate — lo stato che il codice impedisce apposta (§41-45). Diverge
   dalla regola del carrello, che butta tutto: là il costo è un carrello da
   rifare, qui sarebbe **l'indirizzo da rifare**, che §36-40 non tratta come
   una comodità ma come la condizione che decide se possiamo consegnare.
2. §36-40 — **finché i dati su cui poggia una verifica non sono arrivati, non
   si dà alcun verdetto.** *Decisione dell'utente del 30/07/2026.* Zona e
   orario si riverificano contro dati che arrivano dalla rete (il perimetro,
   gli slot); nell'istante in cui non ci sono ancora, rispondere significherebbe
   dire "qui non arriviamo" e "il tuo orario è scaduto" quando la verità è che
   **non lo sappiamo ancora**. È la regola di §46b — un guasto di lettura non è
   un rifiuto — applicata al lato cliente. Nessun avviso, pagamento bloccato
   com'è già prima di ogni verifica, e verdetto solo quando c'è su cosa darlo.

*La v42 non aggiunge dati conservati né cambia comportamenti già costruiti:
fissa due regole che servono a scrivere il modulo di persistenza del checkout e
che, non scritte, sarebbero state decise per inerzia da chi scriveva il codice.*

**Novità della v41** (vincolanti):

1. §36-40 — **si conserva anche la scelta fra "prima possibile" e "orario
   programmato"** (`asap`/`scheduled`). *Decisione dell'utente del 30/07/2026.*
   L'elenco della v36 nominava la modalità e l'orario, ma non questa scelta,
   che è del cliente a tutti gli effetti (§41-45, "momento dell'ordine"). Al
   rientro si riverifica come tutto il resto: se l'ASAP non è più disponibile
   valgono le regole di §12, mai un cambio silenzioso.
2. §36-40 e §12b — **si conserva se l'orario di ritiro è stato scelto dal
   cliente o soltanto preselezionato**, perché da quella distinzione dipende
   un comportamento visibile: lo slot automatico che scade si aggiorna in
   silenzio, quello esplicito azzera e avvisa. *Decisione dell'utente del
   30/07/2026.* **Se il dato manca o è illeggibile si riparte da "scelto dal
   cliente"**: è la direzione prudente, perché il costo è un avviso in più da
   leggere invece di un orario spostato di nascosto, che §12b vieta.
3. §36-40 e §41-45 — **un indirizzo ripristinato che non è più in zona resta
   mostrato**, con l'avviso accanto e il pagamento bloccato finché il cliente
   non ne sceglie un altro. *Decisione dell'utente del 30/07/2026.* Non si
   cancella in silenzio: sparirebbe una cosa che il cliente aveva inserito e
   l'avviso resterebbe senza l'indirizzo a cui si riferisce.
4. §41-45 — **conseguenza vincolante del punto 3**: sul sito l'**esito del
   controllo di zona diventa una condizione per pagare**, accanto a indirizzo,
   civico e coordinate. Fino alla v40 bastava che quei tre fossero presenti,
   ed era sufficiente **solo perché** le coordinate potevano arrivare unicamente
   da una selezione appena verificata. Con il ripristino quel presupposto cade.

*La v41 non cambia nulla di ciò che è già costruito: aggiunge le tre decisioni
che mancavano per poter scrivere la persistenza dei dati del checkout, emerse
dalla ricognizione del 30/07/2026 fatta prima di aprire il modulo.*

**Novità della v40** (vincolanti):

1. §46b — **il controllo server-side sull'orario di Ritiro esiste.** La spec
   affermava il contrario dalla v14, e l'affermazione era **falsa dal
   24/07/2026**: il guard c'è, sta nel ramo del pickup, e usa la regola della
   **chiusura inclusa** propria del Ritiro. La frase vecchia è stata sostituita
   dallo stato reale. *Una nota di stato lasciata indietro aveva fatto
   sospettare un buco inesistente: è la lezione `x` dell'handoff presa dal
   verso opposto.*
2. §46b — registrato fra i **lavori decisi e non fatti**: il server **non
   riverifica il tempo di preparazione né la griglia dei quarti d'ora**, per
   **entrambe** le modalità. Non è una condizione di apertura (decisione
   dell'utente del 30/07/2026); si chiude insieme all'estrazione della route di
   pagamento in `lib/` (§46, lavoro 1).
3. §46b — **il limite dei 2 giorni regge per costruzione, non per controllo**:
   il sito manda un'etichetta (`today`/`tomorrow`), mai una data. È una
   protezione solida ma **silenziosa**, che si romperebbe senza rumore il
   giorno in cui si decidesse di far viaggiare una data vera. Registrata perché
   nessuno la indebolisca per distrazione.
4. §46b — registrata la **doppia costruzione delle finestre orarie**
   (`buildWindowsByDow` per il guard, `buildLinearWindows` per gli slot
   offerti). Oggi danno lo stesso risultato, ma sono due copie.
5. §66 — **la fotografia dei residui di prova esce dalla spec.** Resta qui solo
   la **regola** su come si costruisce l'elenco; i numeri vivono
   nell'`HANDOFF.md`. *Decisione dell'utente del 30/07/2026.* Motivo: quei
   numeri cambiano a ogni verifica dal vivo, quindi la spec sarebbe sbagliata
   in quel punto quasi ogni giorno — e un documento abitualmente sbagliato in
   un punto insegna a non fidarsi anche negli altri. La spec tiene le
   decisioni, l'handoff tiene lo stato.
6. §63-64 e §67 — **aggiornati i blocchi di stato dell'editor menu**: le Fasi
   2A e 2B sono **complete e verificate** dal 29/07/2026. La spec le descriveva
   ancora come da costruire.
7. §36-40 — aggiunto **cognome** all'elenco di ciò che si conserva del
   checkout: c'era in §41-45 e mancava qui, cioè proprio nell'elenco su cui si
   scrive il modulo di persistenza.
8. §34-35 e §63-64 — il conteggio dei prodotti passa da **55 a 62**, superato
   dall'unificazione delle salse (§30).

*La v40 non prende alcuna decisione di prodotto: allinea la spec al codice
reale e sposta nell'handoff ciò che invecchia. L'unica scelta nuova è quella
del punto 2, che stabilisce dove va a finire un buco trovato — registrato, non
fra le condizioni di apertura.*

**Novità della v39** (vincolanti):

1. §36-40 e §10 — **l'indirizzo si conserva con le sue coordinate e la zona si
   ricontrolla al rientro.** *Decisione dell'utente del 30/07/2026.* Corregge
   una formulazione della v36 che diceva di **riottenere la posizione**: le
   coordinate di un indirizzo non cambiano, cambia **il nostro perimetro di
   consegna**. Ciò che va rifatto è il controllo, non la geolocalizzazione.
2. §36-40 e §14 — **lo sconto si ritrova applicato al rientro.** *Decisione
   dell'utente del 30/07/2026.* Si conserva l'**intenzione** del cliente, mai
   l'importo: la soglia viene riverificata dal vivo e il diritto all'utilizzo
   ricontrollato dal server, come già avviene.
3. §10 e §41-45 — **la conferma di consegna si dà solo quando c'è il numero
   civico.** Senza civico il controllo di zona gira su un punto che non è
   quello di consegna, e civici diversi della stessa via possono cadere dentro
   o fuori il perimetro.
4. §36-40 e §41-45 — **i consensi restano stato locale della schermata di
   checkout**, e questo non è un dettaglio implementativo: è **il meccanismo
   che garantisce la regola**. Vivendo lì si azzerano a ogni apertura, e
   nessuna persistenza può ripristinarli nemmeno per errore.
5. §41-45 — **ciò che il cliente ha scritto sopravvive alla chiusura del
   checkout**: contatti e dettagli di consegna non si azzerano più uscendo e
   rientrando.

*Le due protezioni verificate il 30/07/2026 e risultate già solide, registrate
perché non vengano indebolite: un ordine Delivery **non può essere piazzato
senza civico** (bloccato sul sito e rifiutato dal server, e nessuno dei sei
ordini delivery in database ne è privo); e lo sconto **evapora da solo** se il
carrello scende sotto la soglia, nel totale mostrato e nell'addebito.*

**Novità della v38** (vincolanti):

1. §22 — **l'addon si identifica dalla proteina a cui si applica**
   (`requires_protein`), non dalla sua posizione nell'elenco. La regola "extra
   carne solo con Pollo e tacchino" **si legge dal dato da entrambe le parti**:
   il server la fa rispettare, il sito mostra la casella in base alla stessa
   colonna. Chiude i due residui registrati in v37.
2. §22 e §25 — **l'extra carne non è ammessa nei menu combo.** I combo
   contengono solo Roll, l'extra carne esiste solo sulle Bowl: non è un caso
   limite da irrobustire, è **una configurazione che il menu non prevede**.
3. §46 — **ribadito che la condizione di apertura resta aperta.** Unificare il
   calcolo (v37) ha chiuso le divergenze di *regola*, non quelle di *dato*. Il
   confronto fra prezzo mostrato e prezzo addebitato **non esiste ancora**.
4. §46 e §63-64 — registrati tre lavori **decisi ma non fatti**: rendere
   verificabile il calcolo dentro la route di pagamento, il filtro per store
   che il sito non applica, e l'ultima regola di prodotto ancora scritta nel
   codice (nota Planted).
5. §66 — la fotografia dei residui **è di nuovo superata**: il ciclo dei prezzi
   ha lasciato quattro ordini e quattro clienti di prova.

*Con la v38 il ciclo dei prezzi è chiuso nel codice: modulo unico, sito,
server, regola dell'extra carne letta dal dato, combo che la rifiuta. Tutte le
divergenze condizionali trovate nella ricognizione del 29/07/2026 sono state
risolte.*

**Novità della v37** (vincolanti):

1. §46 — **il prezzo di una riga si calcola in un punto solo, usato dal sito
   e dal server.** Non due implementazioni che devono coincidere, ma una sola
   che non può divergere. *Decisione dell'utente del 29/07/2026.* È la strada
   che chiude alla radice la condizione di apertura §46, invece di renderla
   una verifica da rifare per sempre.
2. §22 e §46 — **il prezzo dell'extra carne si legge dal database**, mai da
   una costante nel codice. Oggi il sito mostra +4 € perché il numero è
   scritto nel codice, mentre il server addebita il valore di
   `product_addons.price`: due fonti per lo stesso importo.
3. §25 e §46 — **i supplementi si applicano sempre, qualunque sia il segno.**
   Oggi il combo scarta i supplementi negativi e il configuratore no: lo
   stesso sconto darebbe due esiti diversi a seconda di dove viene scelto.
4. §46 — **si arrotonda ai centesimi una volta sola, alla fine del calcolo di
   riga**, e da lì in poi tutti usano quel valore. Oggi il server arrotonda
   tre volte lungo il percorso e il sito mai.
5. §46 — **il menu non offre opzioni che il server rifiuterebbe**: gli stessi
   filtri di disponibilità, attivazione e store da entrambe le parti.
6. §22 e §46b — registrato che la regola "extra carne solo con Pollo e
   tacchino" **vive solo nell'interfaccia** e non è riverificata dal server:
   stessa famiglia del buco chiuso in v36 sulle variazioni.

*Le divergenze registrate ai punti 2, 3, 5 e 6 non hanno mai prodotto un
addebito sbagliato: verificato il 29/07/2026 su **609 configurazioni reali**,
i due calcoli danno lo stesso identico risultato. Coincidono però per com'è
fatto il dato di oggi — un solo addon per prodotto, tutti a 4 €, nessun delta
negativo, tutte le righe combo attive, un solo store — non perché il codice lo
impedisca. Nessuno di questi valori è oggi modificabile dal pannello; il giorno
in cui l'editor crescerà, lo diventeranno tutti insieme.*

**Novità della v36** (vincolanti):

1. §36-40 — **si conservano anche i dati del checkout**, non solo gli
   articoli, sotto una regola sola: **si salva ciò che il cliente ha scritto
   o scelto, mai ciò che il sistema ha concluso.** Indirizzo, contatti e
   orario richiesto sì; prezzi, esito del geofence e disponibilità dello slot
   no — quelli si riverificano al rientro. *Decisione dell'utente del
   29/07/2026: per il Delivery l'indirizzo non è una comodità, è la
   condizione che decide se la consegna è possibile (§10).*
2. §36-40 — **i consensi non si ripristinano mai.** Privacy, marketing e
   casella "18 anni" sono atti, non dati: vanno rifatti a ogni giro.
3. §36-40 — **dopo un pagamento riuscito il carrello salvato si svuota.**
   Regola assente in v33, dove non serviva: il carrello moriva da sé a ogni
   caricamento.
4. §36-40 — **il prezzo di una riga deve vivere in un punto solo.** Oggi il
   calcolo è chiuso dentro i componenti di configurazione e la ricostruzione
   non può richiamarlo; riscriverlo significherebbe avere due calcoli che
   divergono, cioè rifabbricarsi il problema di §46.
5. §34-35 e §36-40 — **i due "−" si uniformano**: anche nel carrello si
   scende a zero e l'articolo si rimuove. Fino alla v35 il "−" della card
   rimuoveva e quello del carrello si fermava a 1; nessuno l'aveva deciso,
   era venuta così. Il comando "Rimuovi" resta.
6. §18 e §46b — **le variazioni sono validate lato server** contro le
   rimozioni di *quel* prodotto. Implementato e verificato il 29/07/2026: era
   l'unica scelta di configurazione che arrivava in cucina senza controllo.
   **Un guasto di lettura non è un rifiuto**: 500, mai "variazione non
   disponibile".
7. §66 — **il perimetro della pulizia pre-apertura era incompleto, non
   vecchio.** Mancavano tre tabelle intere, `customers` fra queste. Nuova
   regola: l'elenco **si costruisce interrogando tutte le tabelle**, non
   ricordando quali si sono usate. Al go-live **si azzera tutto** (decisione
   dell'utente del 29/07/2026).
8. §65 — con la persistenza non si moltiplicheranno solo gli ordini in
   sospeso, ma anche le **righe cliente**, che vengono scritte prima
   dell'ordine e restano anche se il checkout non arriva in fondo.

**Novità della v35** (vincolanti):

1. §34-35 — **la piccantezza si disegna su tutte le card, non solo su quelle
   con opzioni.** Oggi il rendering esiste solo nella card di Roll e Bowl;
   fritti, sides, salse, dolci e bevande usano la card semplice, che non lo
   prevede. Nessuno se n'era accorto perché tutti e 6 gli articoli piccanti
   sono Roll o Bowl. *Non è una decisione nuova: §30 l'aveva già presa senza
   accorgersene, motivando la ridondanza di "Ajvar piccante" con il bisogno di
   distinguerlo a colpo d'occhio **nell'elenco delle salse** — cosa che
   presuppone che lì la piccantezza si veda.*
2. §30 — **fissati i livelli di piccantezza delle salse**: **Ajvar piccante =
   1** ("Leggermente piccante"), **Acuka = 2** ("Piccante"). Decisione
   dell'utente del 29/07/2026. I valori vanno inseriti dal pannello, non da
   migrazione: la loro compilazione **è** la verifica dal vivo del secondo
   tempo dell'editor.
3. §63-64 — **la piccantezza è modificabile dal pannello su tutti gli
   articoli**, salse comprese, con la scelta del solo livello (§34-35).
4. §34-35 — **nota di metodo: una ricognizione lasciata a metà non lascia un
   buco, lascia assunzioni.** Le due domande poste il 28/07/2026 — quali
   articoli avessero già la piccantezza valorizzata, e se il menu pubblico la
   disegnasse — non hanno mai avuto risposta, perché nello stesso giro il
   lavoro è passato all'unificazione delle salse. Dalla prima è nata la
   dicitura sbagliata corretta in v34; dalla seconda il rendering mancante
   corretto qui. Entrambe erano state **date per risolte** invece che
   riconosciute come aperte.

**Novità della v34** (vincolanti):

1. §34-35 — **corretta la dicitura del livello 1 di piccantezza: "Leggermente
   piccante"**, non "Poco piccante". La lista chiusa scritta in v32
   contraddiceva **§19-20**, che registra il menu reale e descrive da sempre
   "Il Turco 🌶️ Leggermente piccante"; la dicitura sbagliata era già in
   database su 2 articoli visibili al cliente. *La lista era stata scritta
   senza il dato: la ricognizione che doveva riportare i valori di piccantezza
   già presenti sui prodotti non era mai stata completata, e la regola è stata
   scritta lo stesso. Gli altri due livelli combaciavano già.*
2. §34-35 — **§19-20 prevale su §34-35 per le diciture.** La lista chiusa non
   è una convenzione tecnica: è **testo di menu visibile al cliente**.
   Modificarla è una decisione sul menu, da prendere deliberatamente e da
   riflettere in §19-20, mai il contrario.
3. §63-64 — **quello che l'editor non manda, l'editor non tocca.** Un campo
   assente dal salvataggio lascia il valore esistente invariato; non viene
   trattato come "vuoto" e non riceve un valore di default. *Regola emersa
   costruendo la piccantezza: senza di essa il primo salvataggio da un form
   che non conosce ancora un campo lo avrebbe azzerato in silenzio su 6
   articoli, senza errori e senza avvisi.*
4. §66 — aggiunte alla pulizia pre-apertura le **6 righe** di
   `staff:test-spice`.

**Novità della v33** (vincolanti):

1. §30 — **la migrazione delle salse è eseguita e conclusa.** Le salse sono
   prodotti dal 28-29/07/2026: export di sicurezza, migrazione in transazione
   con pre e post-check, codice adeguato in cinque passi separati, verifiche
   dal vivo dell'utente su menu, pannello e checkout, e dismissione delle due
   tabelle vecchie. Il guadagno atteso si è verificato: le salse hanno
   ricevuto il pulsante "Modifica" e la conferma sul cambio di prezzo **senza
   che sia stata scritta una riga di editor per loro**.
2. §30 — **schema autorevole riallineato.** `km_direct_schema.sql` descriveva
   ancora `sauces` e `sauce_allergens`. Le definizioni sono **rimosse**, non
   commentate: quel file deve poter essere eseguito per ricreare il database
   reale, e un commento non si esegue. Resta una riga che ne registra
   l'esistenza e rimanda ai file di `sql/`.
3. §36-40 — **il carrello si conserva per la durata della visita.** Deve
   sopravvivere all'uscita e al rientro dal sito, in particolare al ritorno
   dalla pagina di pagamento. Si salvano identificativi, quantità e
   configurazione, **mai i prezzi**; gli articoli non più disponibili si
   rimuovono con avviso esplicito. **Condizione da chiudere prima del
   go-live.** *Non era una regola disattesa: era assente — vedi §36-40.*
4. §65 — **gli ordini in sospeso sono destinati a moltiplicarsi** una volta
   che il carrello sopravvive: tornare indietro dal pagamento diventerà
   normale, e ogni giro lascerà un `pending` orfano di un cliente che invece
   ha comprato. Va tenuto presente quando si costruirà la pagina dei carrelli
   abbandonati, non quando i numeri sembreranno disastrosi.
5. §66 — **elenco della pulizia pre-apertura riscritto dal database**, ordine
   per ordine. Le due versioni precedenti erano entrambe incomplete, la
   seconda perché ricostruita **per differenza** invece che letta. Stato
   reale: 6 ordini, tutti di prova, e 28 righe di test nel registro azioni su
   tre identificatori.
6. §67 — **il badge "Vegetariano" sulle salse è risolto e verificato dal
   vivo**: la forzatura che lo spegneva è sparita insieme al percorso di
   rendering separato, come previsto dalla v32. Confermato a schermo su Black
   KM il 28/07/2026.

**Novità della v32** (vincolanti):

1. §30 — **le salse diventano prodotti a tutti gli effetti**: righe della
   tabella `products` con `category = 'salse'`, e la tabella `sauces` viene
   dismessa. **Questa decisione rovescia la v29**, che aveva stabilito il
   contrario ("si parifica *cosa si può farci*, non si fondono"). Il rovescio
   è deliberato e la motivazione precedente va considerata **decaduta, non
   sbagliata nel metodo**: si reggeva su due presupposti, e la ricognizione di
   sola lettura del 28/07/2026 li ha fatti cadere entrambi. Il primo era che
   unire le tabelle avrebbe richiesto di rimettere le mani sullo storico
   ordini: `order_items` **non referenzia affatto le salse** — scrive
   `product_id = null` più gli snapshot di nome, categoria e prezzo (§66) —
   quindi non c'è alcuno storico da riscrivere. Il secondo era che esistessero
   ordini da preservare: non ne esistono, le 3 righe presenti sono di prova e
   vanno comunque rimosse prima dell'apertura (§66). Restava il beneficio, che
   la v29 dichiarava nullo: è invece il costo che il progetto stava già
   pagando a ogni fase, perché ogni campo nuovo andava costruito due volte.
   *Decisione presa dall'utente il 28/07/2026, con responsabilità dichiarata e
   con la finestra ancora aperta: prima del go-live è manutenzione, dopo
   sarebbe un intervento su dati di clienti veri.*
2. §30 — **regole della migrazione delle salse**, vincolanti: gli `id`
   restano invariati, `price` diventa `base_price`, gli `slug` mancanti si
   generano, gli allergeni passano in `product_allergens` con lo stesso id, e
   l'ordine delle operazioni è **prima si scrive il nuovo, poi si dismette il
   vecchio** — un'interruzione a metà deve lasciare dati duplicati, mai dati
   persi. Export preventivo obbligatorio: database uno solo, nessuna rete
   (§66).
3. §63-64 — **la Fase 2B si dissolve quasi per intero.** Una volta che le
   salse sono prodotti, l'editor dei campi semplici della Fase 1 le prende in
   carico **senza codice nuovo**. Resta da costruire soltanto la
   **piccantezza**, che non era comunque una faccenda di sole salse: riguarda
   tutti gli articoli.
4. §34-35 — **scala di piccantezza a quattro livelli (0-3) e diciture da
   lista chiusa.** `spice_level` vale 0, 1, 2 o 3; `spice_label` è
   obbligatoria da 1 in su e vuota a 0, scelta fra "Poco piccante",
   "Piccante", "Molto piccante". L'editor presenta **una sola scelta** e
   scrive entrambe le colonne insieme: livello e dicitura non possono
   divergere. È la traduzione operativa della regola "mai la sola icona".
5. §63-64 — **la regola della tendina categorie della Fase 3 si rovescia.**
   La v30 vietava di offrire `salse` perché avrebbe creato una salsa nel posto
   sbagliato; dopo la migrazione quello **è** il posto giusto. Le categorie
   reali diventano **8** e l'unica esclusa resta `menu_combo`.
6. §66 — **la pulizia pre-apertura riguarda tutti gli ordini, non uno solo.**
   L'elenco precedente (il solo `KM-0003`) era incompleto: **tutti** gli
   ordini presenti sono di prova. Si azzerano `orders` e `order_items`, e si
   rimuovono le 21 righe di test di `staff_action_log`.
7. §66 — **precisazione sull'immutabilità dello storico.** La regola descrive
   come si deve comportare il sistema **quando gli ordini saranno veri**, e
   non vincola in alcun modo i dati di prova di oggi, che sono tutti
   modificabili ed eliminabili. *Precisata perché era stata letta come un
   vincolo attuale, arrivando a sconsigliare la migrazione di §30 per un
   motivo inesistente.*
8. §67 — **il badge "Vegetariano" non compare su nessuna salsa**, benché il
   dato esista dalla v29: il menu pubblico lo spegne a forza, con un commento
   anteriore alla v29. L'omissione sbaglia **per difetto** e non è un rischio
   di sicurezza alimentare, ma è un dato dichiarato che non arriva al cliente.
   Si risolve **per costruzione** con la migrazione di §30.

**Novità della v31** (vincolanti):

1. §67 — **avviso non bloccante di incoerenza fra allergeni e flag
   dietetico.** Se la selezione contiene un allergene incompatibile con il
   flag scelto, l'interfaccia lo segnala e **lascia salvare comunque**: uno
   dei due dati è sbagliato, ma quale lo decide solo chi conosce la ricetta.
   Il sistema non corregge nulla da sé — sarebbe dedurre, e §67 lo vieta.
   Incompatibilità: con **Vegano** → Latte, Uova, Pesce, Crostacei,
   Molluschi; con **Vegetariano** → Pesce, Crostacei, Molluschi (Latte e
   Uova restano compatibili). *Regola approvata insieme al selettore a tre
   voci e rimasta fuori dalla v29 e dalla v30 per omissione: recuperata qui
   prima che il form venga costruito.*
2. §67 — **riapertura di un articolo senza allergeni**: la casella "Nessuno
   dei 14" si presenta **già spuntata** se l'articolo ha zero allergeni e
   `allergens_verified_at` valorizzato, **non spuntata** se la data è nulla.
   È l'uso concreto per cui quella colonna esiste: senza questa regola, chi
   riapre una scheda verificata vedrebbe di nuovo tutto vuoto e ricadrebbe
   nell'ambiguità che la casella doveva eliminare.
3. §67 — **stato di verifica visibile nella sezione Menu del pannello**:
   ogni articolo food mostra se e quando gli allergeni sono stati
   verificati, e gli articoli mai verificati sono visibilmente distinti. Le
   bevande non mostrano l'indicatore, come già non mostrano il selettore
   dietetico (§67, fuori dal tracciamento).

**Novità della v30** (vincolanti):

1. §67 — **conferma prima di salvare, solo quando si tolgono allergeni.**
   Aggiungere un allergene è la direzione innocua e non richiede attrito;
   toglierne uno è la direzione pericolosa e richiede una conferma esplicita
   che mostri **quali** allergeni stanno per essere rimossi. Stesso principio
   della conferma sul cambio di prezzo (§63-64): è una protezione
   dell'**interfaccia**, il server non la pretende.
2. §67 — **casella esplicita "Nessuno dei 14 allergeni".** Un articolo si
   dichiara privo di allergeni solo spuntandola, mai lasciando semplicemente
   tutte le caselle vuote. Motivo: "non ho ancora compilato" e "ho verificato
   che non contiene nulla" sarebbero altrimenti lo stesso identico gesto, ed
   è proprio la distinzione per cui esiste `allergens_verified_at`. La
   casella è mutuamente esclusiva con la selezione dei singoli allergeni.
3. §67 — **ordine delle scritture: prima si aggiunge, poi si toglie.** Il
   salvataggio degli allergeni è composto da due operazioni (inserimento
   delle righe nuove, cancellazione di quelle rimosse) che il client
   PostgREST non può raggruppare in una transazione — stesso limite già
   accettato in §68.3. L'ordine è quindi **vincolante**: un'interruzione a
   metà deve lasciare l'articolo con **più** allergeni del vero, mai con
   meno. È lo stesso principio di prudenza già adottato in §67 per i prodotti
   con scelta gusto (si dichiara l'unione).
4. §67 — **nessuna preselezione del flag dietetico quando il dato manca.**
   Sugli articoli food il cui flag è ancora NULL (oggi: 3 salse su 7) il
   selettore a tre voci si presenta **senza nulla di selezionato** e obbliga
   a una scelta esplicita. Non si preseleziona "Nessuno dei due", che sarebbe
   una dichiarazione mai fatta da nessuno.
5. §67 — **registro delle verifiche: applicato.** Le date di verifica del
   28/07/2026 sono state scritte nel database con le migration
   `sql/20260728_allergens_verified_at.sql` e
   `sql/20260728_sauces_as_articles.sql`, post-check verificati.
6. §63-64 — **nota per la Fase 3**: la lista chiusa delle categorie nel
   database ammette **9** valori, due dei quali (`menu_combo` e `salse`) non
   sono usati da alcun prodotto. La tendina delle categorie della Fase 3 va
   perciò compilata **a mano** con le sole 7 categorie reali di §15, mai
   pescando dalla lista del database: offrire "salse" permetterebbe di creare
   una salsa nella tabella sbagliata, invisibile alla sezione salse del menu.
7. §46 / §66 — **esiste un solo database Supabase**, non due. Non c'è un
   ambiente di test separato dalla produzione: il database su cui si lavora
   oggi è quello che servirà i clienti dal giorno dell'apertura. Cade quindi
   la condizione di apertura "piano di travaso dati test → produzione", e
   nascono due conseguenze operative (§66).

**Novità della v29** (vincolanti):

1. §67 — **Roll e Bowl sono voci indipendenti anche per gli allergeni.** La
   formulazione precedente ("Roll e Bowl omonimi condividono gli stessi
   allergeni") poteva essere letta come una regola del sistema, cioè come
   un'autorizzazione a dedurre gli allergeni di una Bowl da quelli del Roll
   omonimo, o a costruire una propagazione automatica. Non lo è: sono **due
   dati distinti** che oggi coincidono di fatto perché descrivono la stessa
   ricetta. Tenerli allineati è una **responsabilità operativa del locale** —
   nessun automatismo, nessun avviso, e **nessun codice deve mai ricavare gli
   allergeni di un articolo da quelli di un altro**.
2. §67 — **regola operativa su quando si modificano allergeni e flag
   dietetici**: soltanto **fuori dall'orario di servizio** (§13). Durante il
   servizio si modifica **esclusivamente la disponibilità**
   (disponibile/esaurito). Nessun avviso e nessun blocco a schermo: è una
   regola di condotta, non un vincolo di codice.
3. §67 — nuovo dato **`allergens_verified_at`** su `products` e `sauces`.
   Registra che gli allergeni di quell'articolo sono stati verificati da
   fonte autorevole, e in che data. Serve a distinguere **"verificato: non
   contiene allergeni"** da **"mai dichiarato"**, due situazioni oggi
   indistinguibili perché entrambe si presentano come lista vuota. **Non
   cambia nulla per il cliente**: un articolo senza allergeni non mostra
   alcun blocco allergeni, in entrambi i casi (§67, rendering). È un dato
   interno, visibile solo nel pannello staff.
4. §67 — il **flag dietetico si presenta come una scelta unica a tre voci**
   (Vegano / Vegetariano / Nessuno dei due). Sotto restano le due colonne
   esistenti e resta il vincolo "vegano implica vegetariano", che l'editor
   fa rispettare (il database non lo impone). Il selettore compare **solo
   sugli articoli food**: drink e birre restano fuori dal tracciamento, con i
   flag a NULL, e non mostrano alcun selettore.
5. §30 / §34-35 / §63-64 / §67 — **le salse diventano articoli a tutti gli
   effetti**, con le stesse possibilità di modifica degli altri prodotti.
   Acquistano i campi `badge`, `is_vegetarian`, piccantezza (`spice_level`,
   `spice_label`) e immagine (`image_url`). Restano nella propria tabella
   `sauces`: si parifica **cosa si può farci**, non si fondono con
   `products`. **Riapre due decisioni precedenti**: §34-35 escludeva le salse
   dal badge, §67 dichiarava consapevole la scelta di non dare loro il flag
   vegetariano. Sono cambi voluti, non sviste.
6. §63-64 — **la Fase 2 dell'editor si divide in 2A e 2B**, entrambe prima
   del go-live: **2A** = allergeni e flag dietetici, su prodotti e salse (il
   blocco di sicurezza alimentare); **2B** = salse portate al pari degli
   altri articoli sui campi semplici. Sono indipendenti: se una si ferma,
   l'altra prosegue. La **Fase 3** (creazione di articoli semplici) comprende
   ora anche la **creazione di salse**.
7. §34-35 / §63-64 — **le immagini degli articoli non sono gestibili da
   nessuna parte, per nessun articolo.** Il campo `image_url` esiste su
   `products` ma è **vuoto su tutti i 55 prodotti**, e non esiste alcun modo
   di caricare una foto dal pannello. La v29 aggiunge il campo anche alle
   salse per uniformità di struttura, ma la **gestione delle immagini resta
   un lavoro autonomo**, fuori dalla Fase 2, da affrontare per tutti gli
   articoli insieme (caricamento file, limite di peso, ridimensionamento,
   spazio di archiviazione). Campo vuoto = scheda disegnata esattamente come
   oggi.
8. §19 — corretta una **formulazione superata**: L'Egiziano e Il Cipriota
   erano descritti con "Badge VEGAN" e "Badge VEGGIE". I badge dietetici non
   esistono come valore del campo `badge` (§63-64, lista chiusa) e derivano
   dai flag (§67). Dicitura riscritta; nessun dato cambia.
9. §63-64 — corretta la **descrizione di dove vive il codice della Fase 1**:
   la spec diceva che validazioni e lista dei badge stanno "nella route
   staff", mentre stanno in `lib/menu-editor.js` e `lib/menu-badges.js`, con
   la route sottile sopra. È la forma da riusare nelle fasi successive.

**Novità della v28** (vincolanti):

1. §46 — **prezzo mostrato vs prezzo addebitato**: rilevata una divergenza
   possibile per i clienti che tengono la pagina già aperta durante un
   cambio di prezzo. Accettata temporaneamente (esposizione nulla finché il
   sito non è pubblico), con **regola operativa** di modificare i prezzi
   fuori orario di servizio e **requisito obbligatorio pre-go-live**: al
   checkout il server deve confrontare prezzo mostrato e prezzo reale e
   fermarsi con un avviso invece di addebitare in silenzio.
2. §34-35 — il **badge promozionale** va mostrato sulle card di **tutte le
   categorie di prodotto**, non solo su Roll e Bowl. Fino alla v27 i
   prodotti semplici lo omettevano per omissione di rendering: un badge
   salvato dall'editor deve sempre produrre un effetto visibile.
3. §63-64 — **modifiche concorrenti**: se due persone salvano lo stesso
   prodotto, l'ultimo sovrascrive il primo senza avviso. Accettato
   consapevolmente, nessun meccanismo di blocco. Registrato anche lo stato
   di avanzamento: **Fase 1 dell'editor realizzata**.

**Novità della v27** (vincolanti):

1. §63-64 — **definita la lista chiusa dei badge** utilizzabili dall'editor
   menu: "TOP CHOICE" (già in uso), "Special del mese", "Best seller",
   "Esclusiva KM", "Scelto per te", "Novità", "I classici", più l'opzione
   "nessun badge". Un prodotto porta **un solo badge alla volta**. Restano
   esclusi i badge dietetici, che derivano dai flag (§67).

**Novità della v26** (vincolanti):

1. §63-64 — **deciso il perimetro dell'editor menu rispetto al go-live.**
   Prima dell'apertura si costruiscono solo: editing dei campi semplici dei
   prodotti esistenti (Fase 1), editing allergeni/flag dietetici (Fase 2) e
   creazione di prodotti semplici (Fase 3). Sono **rimandati a dopo il
   go-live**: l'editing dei **contenuti del combo** (contorni, proteine,
   supplementi), la Fase 4 (Roll/Bowl con opzioni) e la **creazione di nuovi
   tipi di menu combo**. Motivo: inventare tipi di menu nuovi richiede un
   motore generico di composizione che finirebbe sul percorso di ricalcolo
   prezzo del checkout — costo e rischio sproporzionati rispetto a una
   frequenza d'uso reale di poche volte l'anno.
2. §63-64 — **regole di validazione dell'editor** (nuove, obbligatorie).
   Verificato che oggi **non esiste alcuna validazione server-side** sui
   cinque campi della Fase 1 e che il database non ha vincoli oltre ai tipi
   (in particolare `base_price numeric(6,2)` accetta 0 e valori negativi).
   Le validazioni vanno quindi costruite nella route staff dell'editor,
   incluse **lista chiusa per `badge`** e **conferma esplicita sul cambio di
   prezzo**.
3. §66 — **immutabilità dello storico ordini: verificata.** Ogni riga
   `order_items` congela nome, categoria, prezzo unitario, totale riga e
   dettagli (`configuration`) al momento dell'ordine; tutti i punti che
   mostrano un ordine passato leggono lo snapshot e mai una join con
   `products`. Rinominare o riprezzare un prodotto **non altera gli ordini
   già emessi**. Prerequisito dell'editor menu, chiuso.
4. §66 — **log delle modifiche al menu** in `staff_action_log`: finché non
   esistono ruoli distinti (§63-64), ogni modifica fatta dall'editor va
   registrata con campo, valore precedente e valore nuovo.
5. §25 — chiarita una **conseguenza operativa** del modello attuale: i nomi
   **non si propagano** tra prodotti e opzioni del combo. Rinominare il
   prodotto "Patatine KM" (fritti) non rinomina il contorno omonimo dentro
   il combo: sono voci indipendenti che condividono il testo per
   coincidenza.

**Novità della v25** (vincolanti):

1. §25 — **refactoring delle chiavi combo da nome a id.** Il calcolo del prezzo combo (client e server) ora si aggancia all'`id` del prodotto, non al nome. In pratica la scelta della bibita nel combo passa da `name` a `id` (il Roll era già agganciato per id anche prima). Principio stabilito: **l'`id` è l'identità immutabile del prodotto**; nome, categoria, prezzo e appartenenza ai combo sono attributi liberamente modificabili senza rompere i prezzi. Prezzi verificati identici dopo il refactoring (base 13 €, KM Special +3 → 16 €, drink premium +0,50 → 16,50 €). **Residuo noto:** contorno e proteina del combo sono ancora matchati per label (sono opzioni, non prodotti) — da convertire a id quando l'editor menu gestirà creazione/rinomina di quelle opzioni.

**Novità della v24** (vincolanti):

1. §67 — il **rendering degli allergeni e dei flag dietetici al cliente è
   completato** (prima elencato come "da fare"): schede prodotto con blocco
   allergeni espandibile + badge Vegano/Vegetariano dai flag, e sezione
   salse con allergeni + badge "Vegano". Verificato dal vivo. Nell'elenco
   "ancora da fare" di §67 resta solo la bonifica dei flag legacy
   `contains_gluten`/`contains_lactose`.

**Novità della v23** (vincolanti):

1. §67 — la **soia della variante Planted** è ora gestita a livello di UI
   (prima era rimandata al rendering): nel configuratore (Roll/Bowl e Menu
   Combo) l'opzione Planted mostra il sottotesto "Alternativa vegetale ·
   contiene soia". È solo testo nel rendering, riconosciuto dalla chiave
   `planted`, non entra nel carrello/ordine e non crea struttura allergeni
   per-variante. Il punto esce quindi dall'elenco "ancora da fare" di §67.

**Novità della v22** (vincolanti):

1. §67 — aggiunto il tracciamento **`is_vegetarian`** (nuova colonna su
   `products`, vedi migration `sql/20260727_products_is_vegetarian.sql`),
   accanto a `is_vegan`. Regole: il flag riflette il piatto **di default**
   (Roll/Bowl con carne restano non vegetariani nonostante la variante
   Planted); **vegano implica vegetariano** (vincolo di coerenza). Valori
   popolati da dati verificati (23 vegetariani / 11 no). Corretta anche la
   marcatura vegana di **Habibites** (ora vegano → anche vegetariano). Il
   **rendering al cliente** di allergeni e flag dietetici resta il lavoro
   successivo, non ancora fatto.

**Novità della v21** (vincolanti):

1. §67 — gli **allergeni sono ora popolati** (prima solo predisposti), a
   partire dal documento allergeni ufficiale del ristorante integrato e
   verificato con l'utente. Decisioni prese e ora vincolanti: (a) gli
   allergeni si tracciano a livello di **prodotto** e **salsa**, non a
   livello di variante/extra (semplificazione rispetto ai "4 livelli"
   precedenti); (b) per i prodotti con scelta gusto (Cheesecake, Yogurt
   turco) si salva **l'unione** degli allergeni dei due gusti, perché lo
   schema tiene un solo set per prodotto (sovra-dichiarare è più sicuro che
   sotto-dichiarare); (c) la variante **Planted** (soia) e le bevande
   (drink/birre) restano fuori dal tracciamento per ora — vedi §67. Il
   **rendering degli allergeni al cliente** è un lavoro separato non ancora
   fatto: popolare i dati non li mostra ancora nell'interfaccia.

**Novità della v20** (vincolanti):

1. §19 / §31 — l'**etichetta del gruppo di scelta proteina** mostrata al
   cliente è **"Come preferisci il tuo kebab?"** (non "Proteina"). Il valore
   vive nel campo `choice_label` dei dati (per le righe proteina di
   Roll/Bowl); le righe "Gusto" (Cheesecake, Yogurt turco) restano
   "Gusto". Nel catalogo §19 l'etichetta è abbreviata in "Proteina:" per
   compattezza di lettura — vedi nota in testa a §19. Questo completa la
   revisione testi v19 (in cui la modifica era stata applicata solo al combo
   e al fallback del codice, non ancora al dato dei Roll singoli).

**Novità della v19** (revisione testi rivolti al cliente — tutte vincolanti):

1. §7 — lo stato "chiuso" del semaforo mostra ora **"Siamo chiusi"** (prima
   "Chiusi"/"Chiuso", incoerenti tra loro), sia per la chiusura per orario
   sia per la chiusura eccezionale §68.
2. §19 — aggiornate le **diciture** di due opzioni proteina: "Planted" →
   **"Planted Kebab"**, "Adana" → **"Adana di manzo ed agnello"**. I prezzi
   restano invariati (incluso il **+0 € del Planted sul KM Special**, dove
   la label perde il suffisso "(senza extra dose)" ma il prezzo resta 0; e
   l'Adana del KM Special perde il suffisso "(extra dose)", prezzo +4,50 €
   invariato). Sono modifiche di testo del menu (dati), non di listino.
3. §46b — i tre messaggi di errore slot non sono più "provvisori": la
   revisione testi è avvenuta e sono ora **definitivi** (testi invariati).
4. §47-51 — aggiunti alla pagina di stato ordine tre testi: (a) un promemoria
   **sempre visibile in cima** — "Tieni aperta questa pagina per seguire il
   tuo ordine: è il modo per vedere gli aggiornamenti in tempo reale."; (b)
   per il **Ritiro**, "Mostra il codice KM-XXXX al banco per ritirare il tuo
   ordine."; (c) per la **Delivery**, "Codice ordine KM-XXXX. Pensiamo a
   tutto noi: il tuo ordine arriverà all'indirizzo indicato." (mai nominare
   il rider/Glovo al cliente, §57-61). Inoltre "Non troviamo questo ordine."
   → "Non riusciamo a trovare questo ordine.".

Altre modifiche di puro wording nel codice (non citate in spec) fanno parte
della stessa revisione ma non alterano decisioni: non sono elencate qui.

**Note-roadmap aggiunte in v19** (funzionalità future, non ancora costruite):

- **Editor menu nel pannello (ruolo admin)**: §63-64 — un editor che permetta
  di modificare nomi, descrizioni, prezzi e opzioni dei prodotti dal pannello,
  protetto da un livello di accesso **admin distinto dallo staff**. Oggi il
  pannello Menu consente solo di cambiare disponibile/esaurito, quindi ogni
  modifica ai testi/prezzi del menu richiede intervento diretto sui dati. È la
  soluzione strutturale per operare sul menu in sicurezza.
- **Link informativa privacy** (§41-45): il testo "Dichiaro di aver letto
  l'informativa privacy" dovrà rendere "informativa privacy" un link al
  documento, quando l'informativa sarà pronta.
- **Recuperabilità della pagina di stato** (§47-51): oggi la pagina è
  raggiungibile solo tramite il link ricevuto dopo il pagamento; se il
  cliente lo perde non può ritrovarla. Il promemoria "tieni aperta la pagina"
  è un rimedio provvisorio; la soluzione vera è inviare il link via email
  (campo già raccolto, facoltativo) o WhatsApp (fase 1.1).

**Novità della v18** (tutte vincolanti):

1. §41-45 — il **selettore dell'orario è modificabile anche dentro il
   checkout**, non solo nel selettore in cima alla pagina, per entrambe le
   modalità in cui è attiva una selezione di orario (Ritiro sempre; Delivery
   quando `timingType="scheduled"`). Serve a supporto del caso 3 (§12
   Delivery, §12b Ritiro): se lo slot scade durante la compilazione, il
   cliente sceglie un nuovo slot restando nel checkout, senza tornare
   indietro ("una sola pagina"). Per il Ritiro è già implementato; la v18
   estende esplicitamente la stessa cosa alla Delivery.

**Novità della v17** (tutte vincolanti):

1. §12 — definita in modo completo la regola dello **slot di consegna
   programmata che scade mentre il cliente compila il checkout**, che fino
   alla v16 rimandava genericamente a §12b. Sulla Delivery, a differenza del
   Ritiro, **ogni** orario di consegna programmata è trattato come
   **esplicito**: se scade, si azzera, si blocca il pagamento e si mostra il
   messaggio §46b — mai spostamento silenzioso. Vale in ogni modo in cui il
   cliente arriva ad avere un orario programmato (scelto da lui, primo slot
   preselezionato lasciato invariato, o imposto dal sistema perché l'ASAP è
   diventato non disponibile a locale in chiusura). Motivo: sulla Delivery lo
   slot successivo può cadere in un turno diverso (pranzo→cena, o cena→giorno
   dopo), e uno spostamento del genere non va mai fatto di nascosto. Unico
   comportamento silenzioso residuo: **ASAP a locale aperto**, dove non
   esiste un orario da rispettare. È una divergenza **voluta** dal Ritiro
   (dove il primo slot preselezionato-e-non-toccato è invece "automatico").
2. §12b — annotata esplicitamente la divergenza di cui sopra, così la
   differenza tra le due modalità non venga scambiata per una svista da
   uniformare.

**Novità della v16** (tutte vincolanti):

1. §52-56 — **§12b Task D**: definita la regola completa con cui il pannello
   staff **ordina** le code di lavorazione (Nuovi e Attivi) per orario, non
   più per solo ordine di arrivo. Ogni ordine ha un **orario di riferimento**:
   quello concordato per i programmati (ritiro o consegna), e un orario
   **calcolato al volo** (ora di ordinazione + 15 minuti, arrotondato in
   avanti al quarto d'ora) per gli ASAP. A parità di orario di riferimento
   vince chi ha ordinato prima. Lo Storico resta ordinato per data di arrivo.
   L'etichetta dell'orario nella card diventa coerente con la modalità:
   "Ritiro: oggi 20:45" per i ritiri, "Consegna programmata: oggi 20:45" per
   la Delivery (formato "<giorno minuscolo> HH:MM", senza "alle": oggi /
   domani / DD/MM; chiude il wording provvisorio "Consegna" sui ritiri).
2. §12b — messa in spec una precisazione già implicita nel codice: la regola
   della **chiusura inclusa** vale ovunque un ordine di ritiro sia valutato
   contro le finestre operative, non solo negli slot offerti al cliente. È
   già così nella guard server-side del checkout (§46b) e nell'avviso "ordini
   colpiti" (§68.3); la spec ora lo dice esplicitamente.

**Novità della v15** (tutte vincolanti):

1. §12 — messa in spec la regola dell'**ultimo slot Delivery** (l'ultimo
   quarto d'ora prima della chiusura, chiusura esclusa). Era il
   comportamento del codice fin dall'inizio, ma non era scritto da nessuna
   parte, e ora convive con la regola opposta del Ritiro (§12b, chiusura
   inclusa): l'asimmetria va documentata, non lasciata implicita.
2. §12b — nuova regola per lo **slot che scade mentre il cliente compila il
   checkout**, con comportamento diverso a seconda che lo slot sia stato
   preselezionato dal sistema o scelto dal cliente. La stessa regola vale
   per la consegna programmata (§12), dove è ancora da implementare.
3. Correzione di nomenclatura: la colonna del database si chiama
   `delivery_timing`; `delivery_timing_type` è il nome del tipo enumerato,
   non della colonna.

**Novità della v14** (tutte vincolanti):

1. Il **Ritiro acquisisce un orario**: il cliente sceglie sempre giorno e
   slot, come per una consegna programmata. Nuovo §12b, con impatti su §2,
   §7, §11, §13, §41-45, §47-51, §52-56, §68.4, §68.5.
2. Nuovo **§46b**: obbligo di riverifica server-side di tutte le condizioni
   di accettabilità di un ordine, e prima definizione in spec delle
   convenzioni di errore delle route API (status code e formato).
3. Il blocco del checkout di §68.4 vale ora per **entrambe** le modalità.
   Fino alla v13 era descritto in termini di sola consegna e implementato
   solo per la Delivery: un ordine di Ritiro passava anche a locale chiuso.

La Delivery **non** cambia: ASAP e programmata, primo slot a +60 minuti,
restano esattamente come in v13 (§12).

## 1. Visione del progetto

KM Direct è la web app proprietaria di KM Kebab Mediterraneo per raccogliere
ordini delivery e pickup direttamente, senza passare da Glovo/Deliveroo/Just
Eat come canale di vendita. Glovo On-Demand viene usato in fase 1 solo come
ghost rider (logistica invisibile al cliente, inserita manualmente dallo
staff — nessuna integrazione API in questa fase).

Principio guida: MVP semplice da usare, ma con struttura tecnica pronta a
crescere (multi-store, account cliente, automazioni) senza essere rifatta.

## 2. Modello operativo fase 1

Cliente: entra → sceglie Delivery/Ritiro → (se Delivery) indirizzo e
copertura → sceglie il momento (Delivery: ASAP o programmata, §12; Ritiro:
sempre giorno e orario, §12b) → compone ordine → eventuale GIVEMEFIVE →
dati cliente → paga online → conferma → ordine nel pannello staff. Lo staff
inserisce manualmente la consegna su Glovo On-Demand.

## 3. Nome e dominio

Progetto: KM Direct. Dominio previsto: `ordina.kebabmediterraneo.it`. Il
sito vetrina resta `kebabmediterraneo.it`.

## 4. Stack tecnico di riferimento

Next.js (frontend + API/route handlers), Supabase/PostgreSQL (database),
Vercel (hosting), Stripe (pagamenti), Google Maps/Places (geocoding),
Supabase Storage (immagini), Sentry (error tracking, futuro), WhatsApp
Business Cloud API (futuro), Glovo On-Demand API (futuro, fase 2).

## 5. Multi-store

Ogni ordine ha sempre `store_id`, anche con un solo store attivo oggi: **KM
San Mamolo**, Via San Mamolo 25/A, Bologna. Nessun selettore store visibile
al cliente finché esiste un solo store.

## 6. Home/Menu — struttura

La home coincide col menu, mobile-first: header → stato servizio → "ORDINA
ORA" → tab Delivery/Ritiro → dati operativi → banner GIVEMEFIVE → categorie
sticky → menu → carrello sticky (quando non vuoto).

## 7. Stato del servizio

Stati: aperto, chiuso per orario, pausa manuale, indisponibilità globale. Il
menu resta visibile anche fuori orario. Header mostra "● Aperti" o
"● Siamo chiusi · Riapriamo alle HH:MM".

**Logica dinamica del semaforo (aggiunta dopo l'MVP iniziale, vincolante)**:
lo stato va calcolato in tempo reale confrontando l'ora attuale con gli
orari reali di `store_order_windows` (§13), con quattro fasce:

1. **Oltre 30 minuti prima della prossima apertura** → luce rossa,
   "Siamo chiusi", "Apriamo alle [orario prossima apertura]".
2. **Da 30 minuti a 1 minuto prima dell'apertura** → luce gialla,
   "Preordina ora", "Prepareremo il tuo ordine dalle [orario apertura]".
3. **Dall'apertura fino a 15 minuti prima della chiusura** → luce verde,
   "Ordina ora", "Puoi ordinare fino alle [orario chiusura − 15 min]".
4. **Dagli ultimi 15 minuti prima della chiusura fino a 30 minuti prima
   della prossima apertura** → luce rossa, "Siamo chiusi", "Apriamo alle
   [orario prossima apertura]" (stessa fascia del punto 1).

**Importante**: questo stato è puramente informativo. Il checkout NON va
bloccato in base alla sola fascia del semaforo, in nessuna delle quattro
— il cliente può sempre completare un ordine scegliendo un momento futuro
valido, indipendentemente da cosa mostra il semaforo.

Il semaforo determina però **quale sia il primo momento selezionabile**,
sia per la Delivery (§12) sia per il Ritiro (§12b): la fascia verde e le
fasce gialla/rossa producono regole di calcolo diverse.

**Unica eccezione alla regola "mai bloccare"** (esplicitata in v14): il
checkout è bloccato quando, per la modalità scelta dal cliente, non
esiste alcun momento valido nei prossimi 2 giorni — vedi §68.4. Non è un
blocco "per orario": è l'assenza totale di una promessa mantenibile. La
stessa condizione va riverificata lato server (§46b).

## 8. Selettore Delivery/Ritiro

Due tab, Delivery attivo di default. Il cambio tab non ricarica la pagina e
non svuota il carrello; l'indirizzo verificato resta in memoria passando da
Delivery a Ritiro e viceversa.

## 9. Delivery

Fee fissa **2,50 €**. Ordine minimo **15 €** di prodotti (la fee non
concorre al minimo). Serve indirizzo verificato (indirizzo preciso, civico,
lat/long, dentro geofence) prima di poter aggiungere il primo prodotto in
modalità Delivery. Se fuori area: "Qui purtroppo non arriviamo ancora." — il
carrello resta salvo.

## 10. Geofence

Verifica su coordinate precise, mai solo CAP: autocomplete indirizzo, civico
obbligatorio, conversione in coordinate, point-in-polygon, gestione
ambiguità, eventuale pin su mappa.

**La conferma di consegna si dà solo con il civico (v39, vincolante)**

Il messaggio che conferma al cliente di essere in zona **non compare finché
manca il numero civico**, nemmeno se il punto restituito cade dentro il
perimetro. Il messaggio contrario — "qui non arriviamo" — resta invece
mostrato: se il punto di una via è fuori zona, la via lo è quasi certamente,
ed è un'informazione utile subito.

*Motivo (utente, 30/07/2026)*: **il perimetro si decide sul civico, non sulla
via**. Civici diversi della stessa strada possono cadere dentro o fuori, quindi
senza numero il controllo gira su un punto che non è quello di consegna, e
confermare la consegna sarebbe una promessa che non possiamo mantenere.

**Il civico è obbligatorio, e lo è già** (verificato il 30/07/2026): il
pulsante di pagamento resta disabilitato senza, il campo non è digitabile a
mano — deve venire dalla selezione, mai da testo libero (§41-45) — e il server
rifiuta comunque l'ordine. Nessuno dei sei ordini Delivery in database ne è
privo. Quello che mancava era **la spiegazione**: chi sceglieva una via o un
luogo senza numero trovava il pagamento bloccato senza capire perché. Ora un
avviso dice cosa manca e cosa fare.

⚠️ **Limite dichiarato**: quale punto esatto restituisca il servizio di
geocoding per un indirizzo numerato — il portone reale o una stima sul tratto
di via — non è determinato dal nostro codice. Per un civico proprio al confine
del perimetro, la risposta dipende dalla precisione di quel servizio.

## 11. Ritiro/Pickup

"Ritiro da KM, Via San Mamolo 25/A, Bologna". Nessuna fee, nessun minimo,
nessun indirizzo cliente, nessun rider. Stati interni: Nuovo, In
preparazione, Pronto per il ritiro, Ritirato. Stati cliente: Ordine
ricevuto, In preparazione, Pronto per il ritiro.

**Orario di ritiro (aggiunto in v14, vincolante)**: il Ritiro non è più
una modalità "senza tempo". Il cliente deve indicare giorno e orario del
ritiro, con la stessa meccanica di selezione slot della consegna
programmata. Le regole di calcolo sono in §12b. Restano invariati:
nessuna fee, nessun minimo, nessun indirizzo cliente, nessun rider.

## 12. Timing Delivery

Questa sezione vale **solo per la modalità Delivery**. Il Ritiro ha regole
proprie, simmetriche ma non identiche, in §12b. Nulla di §12 è cambiato in
v14.

Colonna `delivery_timing` (di tipo `delivery_timing_type`): `asap`
(default) o `scheduled`. Se programmata:
giorno, orario, solo slot validi, massimo 2 giorni in anticipo. Per gli
ordini Ritiro questo campo vale **sempre** `scheduled` (§12b).

**Decisione definitiva su slot e disponibilità ASAP (sostituisce la
cautela iniziale "non hardcodare 15/30 minuti finché non verificato
Glovo" — scelta consapevole di procedere comunque, accettando il rischio
di dover rivedere questa parte se il comportamento reale di Glovo
divergesse)**:

- Granularità slot: **15 minuti**, sui quarti d'ora (:00, :15, :30, :45).
- **Semaforo verde ("Ordina ora", §7)**: entrambe le opzioni disponibili,
  "PRIMA POSSIBILE" (default) e "CONSEGNA PROGRAMMATA".
- **Semaforo giallo ("Preordina ora") o rosso ("Chiusi"), §7**: "PRIMA
  POSSIBILE" va **rimossa del tutto** dall'interfaccia — resta visibile
  solo "CONSEGNA PROGRAMMATA" (oggi/domani, entro il limite di 2 giorni).
  In questi casi, mostra anche un avviso esplicito vicino al riepilogo/
  pagamento (non solo nell'header) che il locale è chiuso ora e l'ordine
  verrà preparato all'orario scelto.
- **Primo slot selezionabile**, con regola diversa a seconda dello stato
  attuale (§7):
  - **Semaforo verde** (locale già aperto e operativo): primo slot =
    momento attuale + **60 minuti**, arrotondato al quarto d'ora
    successivo. (Era 45 minuti nella prima stesura; alzato a 60 dopo
    aver verificato che Glovo On-Demand accetta preordini solo da 55
    minuti in avanti — 60 dà anche un margine di sicurezza oltre il
    minimo tecnico.) Se questo istante cade fuori dalla finestra di
    apertura corrente (dopo la chiusura, o nella pausa tra pranzo e
    cena), si applica la regola del semaforo giallo/rosso qui sotto,
    calcolata sulla finestra successiva.
  - **Semaforo giallo o rosso** (locale non ancora operativo): primo
    slot = orario di apertura della prossima finestra + **30 minuti**
    (tempo minimo perché la cucina si avvii), non 60 minuti dal momento
    attuale — la cucina non è ancora al lavoro, quindi il riferimento è
    l'apertura, non "adesso".
- **Ultimo slot selezionabile** di una finestra (esplicitato in v15): è
  l'ultimo quarto d'ora **strettamente precedente** la chiusura, cioè la
  chiusura è **esclusa**. Con finestra 12:00–14:30 l'ultimo slot Delivery è
  **14:15**. È il comportamento presente nel codice fin dall'inizio, mai
  messo in spec prima d'ora; viene confermato perché la consegna richiede
  rider e tragitto, quindi promettere una consegna all'orario esatto di
  chiusura significherebbe promettere un arrivo dopo la chiusura.

  **Asimmetria voluta con il Ritiro**: §12b usa la regola opposta (chiusura
  **inclusa**, ultimo slot 14:30), perché il ritiro avviene in negozio e i
  15 minuti previsti da §7 coprono esattamente la preparazione. Le due
  regole devono restare diverse: non vanno uniformate credendo a una
  svista.

- **Slot che scade durante la compilazione (regola Delivery completata in
  v17)**: come per il Ritiro (§12b), il client aggiorna periodicamente lo
  stato del servizio, quindi uno slot di consegna programmata valido al
  momento della selezione può non esserlo più pochi minuti dopo. La regola
  di base è la stessa dei tre casi di §12b, **ma sulla Delivery con una
  differenza sostanziale e voluta**: un orario di consegna programmata è
  trattato **sempre come esplicito**. In concreto:
  1. Cliente su **ASAP a locale aperto** (semaforo verde): non c'è alcun
     orario da rispettare, resta ASAP. Nessun azzeramento, nessun blocco —
     è l'unico comportamento silenzioso residuo sulla Delivery.
  2. Cliente con un **orario di consegna programmata ancora disponibile**:
     non si tocca nulla.
  3. Cliente con un **orario di consegna programmata non più disponibile**:
     la selezione viene azzerata, il pagamento è bloccato finché non ne
     sceglie un altro, e compare il messaggio §46b (`L'orario che hai scelto
     non è più disponibile. Scegline un altro tra quelli proposti.`).

  Il caso 3 vale in **ogni** modo in cui il cliente arriva ad avere un
  orario di consegna programmata: che l'abbia scelto esplicitamente, che
  abbia lasciato invariato il primo slot preselezionato dal sistema, o che
  il sistema ce l'abbia portato d'ufficio perché era su ASAP e il semaforo
  è passato a giallo/rosso rimuovendo l'opzione ASAP (§12, §68.4).

  **Perché la Delivery non ha il caso "automatico/silenzioso" del Ritiro**:
  in §12b, un primo slot preselezionato e mai toccato è "automatico" e, se
  scade, viene aggiornato in silenzio al nuovo primo slot. Sulla Delivery
  questo **non** va fatto, perché lo slot successivo può cadere in una
  finestra operativa diversa: l'ultimo slot di pranzo che scade porterebbe
  a cena, e l'ultimo di cena al pranzo del giorno dopo. Spostare in silenzio
  un ordine attraverso mezza giornata è un tradimento della scelta del
  cliente (chi ordina per pranzo non vuole ritrovarsi una consegna a cena).
  Meglio fermarlo e fargli riscegliere apertamente. La stessa protezione a
  monte del semaforo (§7: negli ultimi 15 minuti prima della chiusura il
  semaforo è già rosso e l'ASAP è già stato rimosso) garantisce che un ASAP
  silenzioso non scavalchi mai una chiusura senza passare per il caso 3.

  Come per il Ritiro, richiede di tenere memoria del fatto che esista una
  selezione di orario programmato attiva; sulla Delivery, dal momento in cui
  il cliente è su "consegna programmata" con uno slot, quello slot è sempre
  esplicito ai fini di questa regola.

## 12b. Timing Ritiro (aggiunto in v14, vincolante)

Simmetrico a §12, ma con costanti proprie: il Ritiro non coinvolge un
rider, quindi il vincolo dei 55 minuti minimi di Glovo On-Demand — la
ragione per cui la Delivery usa 60 minuti — qui non si applica.

**Nessun "PRIMA POSSIBILE" per il Ritiro.** A differenza della Delivery, il
Ritiro non ha un'opzione ASAP: il cliente sceglie **sempre** giorno e
orario in modo esplicito. A locale aperto questo non aggiunge attrito,
perché il primo slot utile è preselezionato e confermarlo è un solo tap. La
scelta rende il momento del ritiro un dato concordato invece che una stima
implicita, ed è ciò che rende possibile il controllo server-side di §46b.

- **Granularità slot**: **15 minuti**, sui quarti d'ora (:00, :15, :30,
  :45). Identica a §12.
- **Orizzonte**: oggi e domani, **massimo 2 giorni**, come in §12. Nota
  esplicita: per il Ritiro questo limite **non** deriva da un vincolo
  Glovo — tecnicamente potremmo accettare ritiri a settimane di distanza.
  È una scelta deliberata, per simmetria con la Delivery e per ridurre gli
  errori del cliente (ordini con data lontana scelta per sbaglio e poi
  dimenticati). Estendere l'orizzonte del solo Ritiro sarà semmai una
  decisione nuova, da mettere prima in spec.
- **Tempo di preparazione**: **15 minuti**. È il tempo cucina di un ordine
  da asporto, senza attesa rider.
- **Primo slot selezionabile**, con regola diversa secondo lo stato del
  semaforo (§7):
  - **Semaforo verde** (locale aperto e operativo): primo slot = momento
    attuale + **15 minuti**, arrotondato **in avanti** al quarto d'ora. Se
    l'istante calcolato cade esattamente su un quarto d'ora, quello è il
    primo slot; altrimenti si prende il quarto d'ora successivo. Esempi:
    ordine alle 12:07 → 12:22 → primo slot **12:30**; ordine alle 12:00 →
    12:15 → primo slot **12:15**. Se l'istante calcolato cade fuori dalla
    finestra corrente (dopo la chiusura, o nella pausa tra pranzo e cena),
    si applica la regola giallo/rosso qui sotto, calcolata sulla finestra
    successiva.
  - **Semaforo giallo o rosso** (locale non ancora aperto): primo slot =
    orario di apertura della prossima finestra utile + **15 minuti**. Il
    riferimento è l'apertura, non "adesso". A differenza della Delivery
    (§12: apertura + 30 minuti) qui bastano 15 minuti, perché la cucina è
    già operativa all'orario di apertura dichiarato in §13 e non c'è da
    attendere un rider.
- **Ultimo slot selezionabile** di una finestra: l'**orario di chiusura
  della finestra, incluso**. È la conseguenza diretta di §7, che consente
  di ordinare fino a 15 minuti prima della chiusura: quei 15 minuti sono
  esattamente il tempo di preparazione, quindi l'ultimo ordine accettabile
  produce un ritiro all'orario di chiusura. Negli ultimi 15 minuti prima
  della chiusura il semaforo è già rosso (§7, fascia 4) e il primo slot
  utile si sposta automaticamente alla finestra successiva.

  **Chiusura inclusa ovunque, non solo negli slot offerti (precisato in
  v16)**: la regola per cui l'orario di chiusura di una finestra è un
  momento di ritiro **valido** non riguarda solo la lista di slot proposta
  al cliente. Vale **ovunque** un ordine di ritiro venga confrontato con le
  finestre operative: la guard server-side del checkout (§46b), che accetta
  un ritiro fino all'orario di chiusura incluso, e l'avviso "ordini colpiti"
  (§68.3), che conteggia tra gli ordini toccati da una chiusura anche i
  ritiri fissati esattamente all'orario di chiusura. In concreto: quando si
  verifica se un orario di ritiro cade dentro o fuori una finestra, il
  confine di chiusura è sempre trattato come **incluso** per il Ritiro. È
  l'opposto della Delivery (§12, chiusura esclusa): l'asimmetria è voluta e
  va mantenuta identica in ogni punto che valuta un ritiro.
- **Preselezione**: all'apertura del selettore, giorno e slot sono
  preselezionati sul primo slot utile. Il cliente può cambiarli, ma non
  può procedere al pagamento senza uno slot valido selezionato.
- **Avviso a semaforo giallo o rosso**: come in §12 per la Delivery,
  mostrare un avviso esplicito vicino al riepilogo/pagamento (non solo
  nell'header), che il locale è chiuso ora e l'ordine sarà pronto
  all'orario scelto.
- **Giorni e slot mostrati**: valgono le regole di §68.4 — solo giorni con
  almeno un turno aperto e, dentro un giorno, solo gli slot dei turni non
  chiusi da eccezioni.
- **Slot che scade mentre il cliente compila il checkout (aggiunto in
  v15)**: il client aggiorna periodicamente lo stato del servizio, quindi
  uno slot valido al momento della selezione può non esserlo più pochi
  minuti dopo (esempio tipico: slot delle 14:15 preselezionato alle 14:10,
  cliente che compila i dati per otto minuti). Il comportamento dipende da
  **chi** ha scelto quello slot:
  1. Il cliente **non ha mai toccato** il selettore, quindi è attiva solo
     la preselezione automatica → il sistema si riposiziona in silenzio sul
     nuovo primo slot utile. Non si sta cambiando una scelta del cliente,
     si sta aggiornando un valore predefinito.
  2. Il cliente **ha scelto esplicitamente** un orario e quell'orario è
     ancora disponibile → non si tocca nulla, in nessun caso.
  3. Il cliente **ha scelto esplicitamente** un orario e quell'orario non è
     più disponibile → la selezione viene azzerata, il pagamento è
     bloccato finché non ne sceglie un altro, e compare il messaggio già
     previsto da §46b: `L'orario che hai scelto non è più disponibile.
     Scegline un altro tra quelli proposti.`

  Il caso 3 non va **mai** risolto spostando automaticamente il cliente su
  un altro orario. Cambiare di nascosto l'orario poco prima del pagamento
  significa fargli comprare una promessa diversa da quella che aveva
  accettato.

  Richiede di tenere memoria del fatto che la selezione corrente sia
  automatica oppure esplicita: è l'unico dato aggiuntivo necessario.

  **Divergenza voluta con la Delivery (precisata in v17)**: questa regola
  a tre casi, con il caso 1 "automatico" che aggiorna in silenzio il primo
  slot preselezionato, vale **così com'è solo per il Ritiro**. Sulla
  Delivery (§12) il primo slot preselezionato-e-non-toccato è invece
  trattato come **esplicito** (quindi, se scade, azzera e blocca invece di
  aggiornare in silenzio), perché sulla Delivery lo slot successivo può
  cadere in una finestra operativa diversa (pranzo→cena, cena→giorno dopo)
  e uno spostamento silenzioso attraverso mezza giornata non è accettabile.
  La differenza è deliberata: non va uniformata credendo a una svista. Nel
  Ritiro l'aggiornamento silenzioso è innocuo perché avviene sempre entro
  la stessa logica di slot ravvicinati e il cliente è comunque in negozio;
  sulla Delivery no.

**Modello dati**: l'orario concordato del Ritiro va salvato nella colonna
**già esistente** `scheduled_delivery_at`, che dalla v14 si legge come
"orario concordato di consegna **o** di ritiro". Il nome della colonna è
storico e non viene cambiato. La riusiamo invece di aggiungerne una nuova
perché tutta la logica che dipende da quel campo — avviso ordini colpiti
(§68.3), ordini in turni che diventano chiusi (§68.5), lettura e
ordinamento nel pannello staff (§52-56), guard server-side (§46b) — vale
identica per le due modalità: un secondo campo significherebbe duplicare
ognuno di quei punti, con il rischio concreto di dimenticarne uno.

**Esclusione esplicita**: l'export Glovo (§57-61) resta riservato agli
ordini Delivery. La colonna `preordered_for` del template continua a
leggere `scheduled_delivery_at`, ma il pulsante di export non compare mai
sugli ordini Ritiro, quindi un orario di ritiro non finisce mai in un CSV
Glovo.

## 13. Orari ordini (Delivery e Ritiro)

**Orari definitivi (aggiunti dopo l'MVP iniziale, risolvono il buco
lasciato aperto all'inizio sulla domenica)**:

Domenica–Giovedì: 12:00–14:30, 19:00–22:30.
Venerdì–Sabato: 12:00–14:30, 19:00–23:00.

Questi orari sono le finestre operative del locale e valgono per
**entrambe** le modalità: sono la fonte unica per il calcolo dinamico dello
stato del servizio (§7), per gli slot di consegna programmata (§12) e per
gli slot di ritiro (§12b). Il titolo originale di questa sezione diceva
"Delivery" per ragioni storiche: dalla v14 non esistono orari separati per
il Ritiro.

## 14. Promo GIVEMEFIVE

Codice `GIVEMEFIVE`, sconto 5 €, valido sul primo ordine diretto da almeno
25 € di prodotti (fee esclusa), sia Delivery sia Ritiro, un utilizzo per
cliente (telefono come identificatore principale, email come controllo
secondario). Consumata solo su ordine valido/completato: mai su pagamento
fallito, ordine abbandonato, o annullato per rider non disponibile. Mantenere
comunque un campo coupon generico per codici futuri.

**Si conserva l'intenzione, mai l'importo (v39, vincolante)**

Se il cliente aveva applicato il codice prima di uscire verso il pagamento, al
rientro lo **ritrova applicato** (§36-40). Si conserva soltanto il fatto che
l'abbia chiesto: l'importo viene **ricalcolato** e la soglia **riverificata dal
vivo**, come già accade.

Il caso che questa regola non deve poter creare — carrello sceso sotto soglia
con lo sconto rimasto attivo — **è già impossibile** (verificato il
30/07/2026): la soglia viene ricontrollata a ogni ricalcolo, quindi lo sconto
**evapora da solo** se il carrello scende, sparisce dal riepilogo e ricompare
se il carrello risale. Il server, dal canto suo, ricontrolla la soglia **sul
subtotale che ricalcola lui**, non su quello ricevuto: dal sito arriva solo
un'intenzione, mai un importo. Registrato qui perché nessuna modifica futura
lo indebolisca.

## 15. Categorie menu (ordine fisso)

ROLL, BOWL, MENU COMBO, FRITTI, SIDES, SALSE, DOLCI, DRINK, BIRRE. La frase
"Tutti i roll sono con patatine" va eliminata ovunque (non è più vera).

**Corrispondenza con la lista chiusa del database (v32)**: queste 9 categorie
sono esattamente i 9 valori ammessi dall'enum `product_category`. Dopo la
migrazione delle salse (§30) **8** di esse sono usate da righe di `products`;
l'unica non usata è `menu_combo`, che non è una categoria di articoli ma la
forma del menu combo (§23-26), costruita a parte. *Fino alla v31 le categorie
usate erano 7, perché anche le salse vivevano fuori da `products`.*

## 16. Roll e Bowl

Articoli separati anche a livello di database — mai un'unica referenza
condivisa. Possono condividere concettualmente la stessa ricetta ma restano
prodotti, prezzi, disponibilità e articoli distinti.

## 17. Regola proteine

Selezione singola, mai multipla (radio/select, non checkbox).

## 18. Regola rimozioni

Rimozioni multiple, guidate, definite prodotto per prodotto. Niente limite
artificiale di 3-4, niente campo note libero sul prodotto.

**Le rimozioni sono validate lato server (v36, vincolante)**

"Definite prodotto per prodotto" è un vincolo sui dati, non solo sulla forma
dell'interfaccia: al checkout ogni variazione ricevuta va confrontata con le
rimozioni **di quel prodotto**, e una che non corrisponde fa rifiutare la riga
esattamente come già accade per proteina, accompagnamento, contorno e bibita
(§46b). Il confronto è **esatto**, senza normalizzazioni di maiuscole, spazi o
accenti: le altre opzioni si confrontano così, e due regole diverse per la
stessa cosa sarebbero peggio del problema.

Il confronto va fatto **per prodotto e mai su un elenco globale di etichette**:
al 29/07/2026 le 70 rimozioni esistenti usano 23 etichette distinte e **tutte e
23 sono condivise da più prodotti** — la coppia Roll+Bowl come minimo, e alcune
fra articoli diversi ("Senza tabulì" sta su Libanese, KM Special ed Egiziano).
Un controllo su elenco globale accetterebbe "Senza feta" su Il Turco.

**Roll e Bowl non si deducono l'uno dall'altro** neanche qui: hanno righe
proprie e indipendenti, e la validazione della Bowl usa l'id della Bowl. È la
stessa regola che §67 impone per gli allergeni. Per il menu combo l'unico
riferimento sensato è il **Roll scelto**, che è già quello usato per validare
la proteina.

*Perché mancava: proteina, accompagnamento, contorno e bibita vengono letti dal
database perché **spostano il prezzo**, e il controllo è nato come effetto
collaterale del calcolo. Le rimozioni sono sempre gratuite — non esiste nemmeno
una colonna prezzo — quindi non venivano lette, quindi non venivano controllate.
Dove il calcolo non serviva, il controllo non c'era.*

## 19. ROLL — catalogo completo

**Nota sull'etichetta del gruppo proteina (v20)**: nella UI cliente, il
titolo del gruppo di scelta della proteina è **"Come preferisci il tuo
kebab?"** (memorizzato nel campo `choice_label`, §31). Nel catalogo qui
sotto quell'etichetta è abbreviata in **"Proteina:"** solo per compattezza
di lettura: dove si legge "Proteina: ..." il cliente vede in realtà "Come
preferisci il tuo kebab?" seguito dalle stesse opzioni. Le altre etichette
di gruppo (es. "Gusto" per Cheesecake e Yogurt turco, §31) non cambiano.

**Il Turco — 8 €** 🌶️ Leggermente piccante. Proteina: Pollo e tacchino
(incluso) / Planted Kebab (+1,50 €) / Adana di manzo ed agnello (+4,50 €).
Rimozioni: Non piccante,
Senza hummus, Senza ajvar, Senza cetriolini, Senza insalata, Senza pomodoro,
Senza yogurt.

**Il Greco — 8 €**. Proteina: Pollo e tacchino / Planted Kebab (+1,50 €) /
Adana di manzo ed agnello (+4,50 €). Rimozioni: Senza cipolla, Senza pomodoro, Senza insalata, Senza
feta, Senza tzatziki, Senza patatine.

**KM Special — 11 €** Badge TOP CHOICE, 🌶️🌶️. Proteina: Pollo e tacchino
extra dose (incluso) / Planted Kebab (+0 €) / Adana di manzo ed agnello
(+4,50 €). Rimozioni: Senza peperoncino, Senza tabulì, Senza salsa
all'aglio, Senza melassa di melagrana.

**Il Libanese — 8,50 €** 🌶️🌶️. Proteina: Pollo e tacchino / Planted Kebab
(+1,50 €) / Adana di manzo ed agnello (+4,50 €). Rimozioni: Senza
peperoncini, Senza yogurt,
Senza tabulì, Senza paté piccante, Senza patate al vapore.

**Il Persiano — 8,50 €**. Proteina: Pollo e tacchino / Planted Kebab
(+1,50 €) / Adana di manzo ed agnello (+4,50 €). Rimozioni: Senza melanzane
grigliate, Senza insalata,
Senza taratour, Senza hummus, Senza crema di verdure arrosto, Senza patate
al vapore.

**L'Egiziano — 8 €** Vegano (dal flag `is_vegan`, §67 — non è un valore del
campo `badge`). Nessuna proteina selezionabile (salsa
all'aglio è vegan). Rimozioni: Senza salsa all'aglio, Senza babaganoush,
Senza tabulì.

**Il Cipriota — 9 €** Vegetariano (dal flag `is_vegetarian`, §67 — non è un
valore del campo `badge`). Nessuna proteina selezionabile.
Rimozioni: Senza melanzane grigliate, Senza cetriolini, Senza crema di
verdure arrosto, Senza hummus alle melanzane.

## 20. BOWL — prezzi

Il Turco 11 €, Il Greco 11 €, KM Special 14 €, Il Libanese 11,50 €, Il
Persiano 11,50 €, L'Egiziano 11 €, Il Cipriota 12 €. Stesse proteine,
supplementi, rimozioni, badge e piccantezza del Roll corrispondente, ma
articolo separato.

**Nome visualizzato al cliente**: la Bowl si chiama "[Nome] Bowl" (es. "Il
Turco Bowl", "KM Special Bowl") per distinguerla chiaramente dal Roll nel
carrello, nella cucina e nello storico ordini. Il Roll resta senza suffisso
(es. "Il Turco").

**Nota tecnica (aggiunta dopo l'MVP iniziale)**: coerentemente col §16,
Roll e Bowl NON vanno implementati come uno derivato dall'altro nel codice
(es. un array che genera l'altro modificando solo il prezzo). Vanno definiti
come due liste/record indipendenti fin dal frontend, anche se all'inizio i
valori coincidono — perché in futuro potranno divergere (disponibilità,
rimozioni, o altro) senza che questo richieda di "rompere" una dipendenza
nascosta tra i due.

## 21. Accompagnamento Bowl

Scelta obbligatoria singola, nessun default preselezionato: Bulgur
(contiene glutine), Riso integrale, No bulgur e no riso.

## 22. Extra carne Bowl

Facoltativo, +100 g di carne (+4 €), disponibile solo con proteina "Pollo e
tacchino" (mai con Planted, Adana, Egiziano, Cipriota). Il KM Special Bowl
può cumulare ulteriori +100 g oltre alla propria extra dose inclusa.

**Il prezzo si legge dal database (v37, vincolante)**: la fonte è
`product_addons.price`, mai un numero scritto nel codice. Fino alla v36 il
sito mostrava +4 € da una costante mentre il server addebitava il valore del
database: due fonti per lo stesso importo, che allora coincidevano e che
nessuno avrebbe potuto tenere allineate, perché la costante non era
modificabile da nessuna schermata. Vale la regola generale di §46, un solo
calcolo e una sola fonte per ogni prezzo.

**L'addon si identifica dalla proteina a cui si applica (v38, vincolante)**

La riga di `product_addons` che fissa il prezzo si sceglie confrontando
`requires_protein` con la proteina scelta, **mai prendendo la prima riga che il
database restituisce**. `requires_protein` vuoto significa "vale per qualunque
proteina". La regola vale identica dalle due parti: il sito mostra la casella
solo quando la colonna combacia, il server rifiuta l'ordine quando non
combacia. **Nessuna proteina va scritta nel codice**, da nessuna delle due
parti: il confronto è fra i valori grezzi del database, senza conversioni
aggiunte.

Questo chiude insieme due cose che la v37 aveva registrato come aperte:

- **la regola di §22 non era fatta rispettare dal server.** Il vincolo "solo
  con Pollo e tacchino" viveva soltanto nell'interfaccia, e una richiesta
  costruita a mano poteva aggiungere l'extra carne a una Bowl con Planted o
  Adana: il prezzo restava coerente, ma a preparare sarebbe arrivata una Bowl
  che il menu non prevede;
- **un secondo addon non era identificato.** Con più righe sullo stesso
  prodotto, quale venisse addebitata dipendeva dall'ordine di lettura.

*Perché `requires_protein` e non `sort_order`*: le altre opzioni del progetto
si identificano dal dato che le caratterizza (la label della proteina, del
contorno, l'id della bibita), mai dalla posizione. Per l'extra carne il tratto
distintivo è **a quale proteina si applica**, che è esattamente quella colonna.
Sceglierla per posizione avrebbe significato "prendi la prima"; sceglierla per
`requires_protein` significa "prendi quella che vale per questa configurazione".

**Se due righe risultassero valide per la stessa scelta**, il prezzo tornerebbe
ambiguo: è un dato sbagliato, non una richiesta del cliente, quindi si risponde
**500** e non un rifiuto (§46b, regola v36 sul guasto di lettura).

**L'extra carne non è ammessa nei menu combo (v38, vincolante)**

I combo contengono **solo Roll**; l'extra carne esiste **solo sulle Bowl**, e
tutte le righe di `product_addons` stanno infatti su Bowl. Un combo con extra
carne non è quindi un caso limite raro: è una **configurazione che il menu non
prevede**, e il server la rifiuta. Dal sito non è raggiungibile — il builder
non la offre — ma una richiesta costruita a mano otterrebbe altrimenti
qualcosa che il menu non contempla.

## 23-26. MENU COMBO

Categoria autonoma. Banner home: "MENU COMBO / Componi il tuo menu KM" / CTA
"COMPONI" — niente foto, pittogrammi, prezzi tecnici o dettagli nel banner.

Builder in 4 step: 1) scegli il Roll (con le sue regole proteina/rimozioni),
2) scegli il contorno (struttura aperta `combo_side_options`, non
hardcodare "patatine": inizialmente Patatine standard incluse / Patatine KM
+0,50 €), 3) scegli il soft drink (solo analcolici, fino a 2,50 € incluso,
oltre +0,50 €, birre escluse), 4) aggiungi al carrello come articolo unico
con componenti figli. Shortcut "Fallo combo" dal dettaglio Roll apre lo
stesso builder col Roll preselezionato, senza duplicare logica.

**Decisione UI (presa dopo l'MVP iniziale, vincolante)**: il builder si
presenta come un **unico pannello con i 3 step di scelta in sequenza
verticale** (Roll → contorno → drink, uno sotto l'altro, si scorre per
completarli), non uno step per schermata con avanti/indietro. Coerente con
lo stesso principio "niente overlay/pop-up" già adottato per la
configurazione prodotto (§34-35).

## 25. Prezzi Combo

Combo standard: 13 €. Questo è il prezzo base "tutto incluso" (Roll con
proteina inclusa + contorno standard + drink incluso), valido per
qualunque Roll scelto NELLA SUA VERSIONE BASE.

**Supplemento KM Special**: se il Roll scelto nel combo è KM Special, si
aggiunge un supplemento esplicito di **+3 €** (13 € + 3 € = 16 €), fedele
alla dicitura del menu fisico ("CON KM SPECIAL +3"). Questo supplemento va
mostrato come riga visibile nel riepilogo prezzo, con lo stesso trattamento
grafico degli altri supplementi (Patatine KM +0,50€, drink premium
+0,50€) — NON va implementato come un semplice cambio silenzioso del
prezzo base da 13€ a 16€.

**Altri supplementi che si sommano**, se scelti dentro il builder:
- proteina Adana sul Roll del combo: stesso supplemento del Roll normale
  (+4,50 €, da §19)
- Patatine KM al posto delle standard: +0,50 €
- soft drink "premium" (oltre 2,50 €, cioè i tè freddi/succhi da 3,50 € del
  §32): +0,50 €

Planted ha un supplemento di +1,50 € sui Roll normali (§19) e +0 € sul KM
Special; lo stesso vale dentro il combo.

**I supplementi si applicano sempre, qualunque sia il segno (v37,
vincolante)**

Un supplemento negativo — cioè "questa scelta costa meno" — è la forma
naturale per esprimere uno sconto su un'opzione, e va **applicato**, non
ignorato. Fino alla v36 il builder del combo scartava i supplementi negativi
mentre il configuratore dei Roll e delle Bowl li sommava: la stessa
promozione avrebbe dato due esiti diversi a seconda che l'articolo fosse
scelto dentro un combo o da solo, e in un caso il cliente avrebbe visto uno
sconto che il conto non applicava. Oggi non esiste alcun delta negativo in
database, quindi la differenza non si vede: è la ragione per cui è rimasta
nascosta fin qui.

**La base del combo è il prezzo di quel Roll (v37, vincolante)**

Il prezzo di partenza si legge dalla riga di `combo_pricing` **del Roll
scelto**, attiva e dello store corrente. Fino alla v36 il sito partiva invece
dal **minimo fra tutte le righe**, senza filtrare né l'attivazione né lo
store: una riga disattivata con prezzo più basso avrebbe abbassato la base
mostrata di **tutti** i combo mentre il server continuava ad addebitare
quella giusta. Il "supplemento Roll" mostrato nel riepilogo (§25, KM Special
+3 €) resta una **scelta di presentazione** e si calcola sulla base standard
delle sole righe attive: è ciò che il cliente legge, non ciò da cui si parte
per contare.

**Identità del prodotto = `id` (immutabile).** Tutti i collegamenti interni
tra prezzi e prodotti — in particolare il prezzo base del combo per ogni Roll
e la bibita scelta nel combo — usano l'`id` del prodotto, mai il suo nome.
Così **nome, categoria, prezzo e appartenenza ai combo restano attributi
liberamente modificabili** (anche dal futuro editor staff) senza rischio di
rompere i prezzi. Il nome resta usato solo come **etichetta da mostrare** a
schermo e nei dettagli dell'ordine. *(Refactoring combo nome→id, prerequisito
dell'editor menu — prezzi verificati identici: base 13 €, KM Special +3, drink
premium +0,50.)*

**Conseguenza operativa: i nomi non si propagano (v26).** Le opzioni del
combo (contorni in `combo_side_options`, proteine in
`product_choice_options`) sono **voci autonome**, senza alcun legame
relazionale con i prodotti del menu. Il contorno "Patatine KM" del combo e
il prodotto "Patatine KM" della categoria fritti (§27) condividono il testo
**per coincidenza**, non perché siano la stessa cosa. Quindi rinominare il
prodotto dall'editor **non** rinomina il contorno omonimo nel combo: niente
si rompe e nessun prezzo sbaglia, ma il cliente vedrebbe due nomi diversi
per la stessa cosa. Chi usa l'editor deve saperlo. L'allineamento dei due
nomi resta manuale finché non esisterà l'editor dei contenuti del combo
(rimandato a dopo il go-live, §63-64).

## 26. Shortcut "Fallo combo"

Vedi §23-26: apre lo stesso builder con il Roll già preselezionato, senza
duplicare la logica.

## 27. FRITTI

Patatine 4 €, Patatine KM 4,50 €, Cicek Bites 6 €, Habibites 6 €, Halloumi
Sticks 6,50 €, Polpette di melanzane con yogurt 6,50 € (yogurt a parte, ma
le polpette contengono lattosio), Falafel 6 €. Nessuna personalizzazione
sulle polpette. Upsell salse dopo l'aggiunta di un fritto, inline, non in
popup invasivo.

## 29. SIDES

Dolmadakia 4 €, Caviale di melanzane 4 €, Babaganoush 5 €, Tabulì 5 €,
Hummus 5 €, Pane lavash 3 €.

## 30. SALSE

Tutte a 1 €: Ajvar, Ajvar piccante, Tzatziki, Acuka (frutta secca +
peperoncino), Black KM (maionese all'aglio nero — **non vegana**), Yogurt,
Salsa all'aglio (vegana).

**Piccantezza delle salse (v35)**: **Ajvar piccante = livello 1**
("Leggermente piccante"), **Acuka = livello 2** ("Piccante"). Le altre cinque
non sono piccanti (livello 0). Decisione dell'utente del 29/07/2026, secondo la
scala di §34-35. I due valori **vanno inseriti dal pannello, non da
migrazione**: la loro compilazione è la verifica dal vivo del secondo tempo
dell'editor, e l'inserimento a mano di un dato che l'editor deve saper scrivere
dimostrerebbe solo che il dato si può scrivere, non che l'editor funziona.

**Le salse sono prodotti a tutti gli effetti (v32, vincolante)**: righe della
tabella `products` con `category = 'salse'`, come qualunque altro articolo.
Nessuna regola separata, nessun campo con nome diverso, nessun percorso di
codice dedicato. La tabella `sauces` viene **dismessa**.

**Questa decisione rovescia la v29**, che stabiliva l'opposto: parificare il
trattamento tenendo però le tabelle distinte. Va letta come una motivazione
**decaduta**, non come un errore di ragionamento: poggiava su due presupposti
che la ricognizione di sola lettura del 28/07/2026 ha smentito.

- *"Fondere le tabelle significherebbe rimettere le mani sullo storico
  ordini."* Falso: `order_items` **non ha alcun riferimento alle salse**.
  Scrive `product_id = null` e conserva nome, categoria e prezzo come
  snapshot congelati (§66). Nessuna riga d'ordine va toccata.
- *"Senza alcun beneficio."* Il beneficio è esattamente il costo che il
  progetto stava pagando: due tabelle significano ogni campo nuovo costruito
  due volte, ogni regola da tenere allineata a mano, e una fase dell'editor
  (2B) che esisteva solo per recuperare il divario.

Restava un terzo motivo, mai scritto ma implicito — la prudenza verso ordini
esistenti. Non ce ne sono: le 3 righe presenti sono di prova e vanno comunque
rimosse prima dell'apertura (§66). La finestra per farlo a costo di
manutenzione è **prima del go-live**; dopo, la stessa operazione toccherebbe
dati di clienti veri.

**Regole della migrazione (v32, vincolanti)**

1. **Gli `id` non cambiano.** Ogni salsa diventa una riga di `products`
   conservando il proprio uuid. L'id è identità (§25) e le due tabelle non
   possono collidere. È ciò che rende banale il trasferimento degli
   allergeni.
2. **`price` diventa `base_price`**, stesso valore. Sparisce la differenza di
   nome che la v29 aveva scelto di conservare.
3. **`category = 'salse'`** per tutte e 7. Il valore esiste già nell'enum e il
   checkout lo scrive già negli snapshot d'ordine (§66): non si introduce
   nulla di nuovo, si completa qualcosa lasciato a metà.
4. **Gli `slug` vanno generati**, perché `products.slug` è obbligatorio e
   unico per store. Si ricavano dal nome — minuscolo, senza accenti, spazi
   sostituiti da trattino — e **si verifica che nessuno collida** con uno slug
   esistente prima di scrivere.
5. **Gli allergeni passano in `product_allergens`**: le righe di
   `sauce_allergens` si riscrivono con lo stesso `allergen_id` e con
   `product_id` uguale all'id della salsa. `allergens_verified_at` passa
   invariato. È la parte di **sicurezza alimentare** dell'operazione e richiede
   pre-check e post-check espliciti (§67): al 28/07/2026 sono **6 righe su 5
   salse**, e le 7 date di verifica devono risultare tutte presenti a
   migrazione conclusa.
6. **Ordine delle operazioni: prima si scrive il nuovo, poi si dismette il
   vecchio.** Stesso principio di §67 per gli allergeni: un'interruzione a metà
   deve lasciare i dati **duplicati**, mai persi. La tabella `sauces` non si
   cancella nello stesso passaggio: si dismette solo dopo che menu pubblico,
   carrello, checkout e pannello sono stati verificati sui dati nuovi. Il
   `DROP TABLE` è DDL e lo esegue l'utente nel SQL editor (§63-64).
7. **Export preventivo obbligatorio.** Prima di iniziare si esportano `sauces`
   e `sauce_allergens` in un file versionato in `sql/`. Il database è uno solo
   e non esiste alcuna rete di protezione (§66): l'export è l'unico modo di
   tornare indietro.
8. **Post-check dichiarati in anticipo**: 7 prodotti con `category='salse'`,
   prezzi identici a prima, 7 `allergens_verified_at` non nulli, 6 righe di
   allergeni sulle 5 salse che ne hanno, zero slug duplicati.

**Applicato — migrazione eseguita e conclusa (v33)**

Le salse sono prodotti dal **28-29/07/2026**. Cronologia, tutta versionata:

- **Export di sicurezza** `sql/20260728_sauces_export_pre_merge.sql`: 13 righe
  fotografate (7 salse + 6 allergeni), confronto campo per campo con il
  database superato prima del commit.
- **Migrazione** `sql/20260728_sauces_merge_into_products.sql`, eseguita
  dall'utente nel SQL editor dentro una transazione, con **8 pre-check** e
  **7 post-check** bloccanti: 55 → 62 prodotti, 70 → 76 righe allergene, 7
  articoli con `category='salse'`, id e prezzi invariati, nessuno slug
  duplicato. Un pre-check verifica la corrispondenza **id → nome** salsa per
  salsa, non la sola esistenza degli id: senza di esso uno scambio di targa
  sarebbe passato in silenzio, perché i conteggi sarebbero tornati lo stesso.
- **Codice adeguato in cinque passi separati**, ciascuno con commit proprio:
  checkout; menu pubblico e carrello; cron di reset, route disponibilità e
  core allergeni; GET e sezione Menu del pannello; rimozione delle
  compatibilità temporanee. Durante il lavoro il vecchio identificatore di
  tipo è rimasto accettato come **porta di servizio dichiarata**, così che
  ogni passo restasse indipendente dagli altri; alla fine è stato rimosso e
  ora viene **rifiutato con errore**, non ignorato.
- **Verifiche dal vivo dell'utente**: menu pubblico (salse una volta sola,
  ordine e prezzi corretti, badge "Vegetariano" su Black KM); pannello
  (pulsante "Modifica" presente sulle salse, descrizione scritta e
  ricancellata, conferma sul cambio di prezzo comparsa con vecchio e nuovo
  valore); checkout fino alla pagina di pagamento, in Ritiro e in Delivery
  sopra il minimo di §9.
- **Dismissione** `sql/20260729_drop_sauces_tables.sql`: pre-check di fedeltà
  **riga per riga e nelle due direzioni** — nessun allergene mancante e
  nessuno di troppo — prima del `drop table`, scritto **senza `cascade`**,
  così che un collegamento non mappato produca un errore rumoroso invece di
  un danno silenzioso.

Stato finale verificato il 29/07/2026: **62 prodotti, 76 righe allergene, 7
salse** leggibili anche dalla chiave pubblica del sito, e **nessun riferimento
a `sauces` nel codice applicativo**.

**Il guadagno atteso si è verificato.** Le salse hanno ricevuto il pulsante
"Modifica" e la conferma sul cambio di prezzo senza che sia stata scritta una
riga di editor per loro: è la ragione per cui la decisione è stata presa.

**Schema autorevole riallineato (v33)**: `km_direct_schema.sql` conteneva
ancora le definizioni di `sauces` e `sauce_allergens`. Sono state **rimosse**,
non commentate — quel file è il documento da cui si ricreerebbe il database, e
lasciarci dentro due tabelle dismesse significherebbe ricrearle vuote. Al loro
posto resta una riga di commento che ne registra l'esistenza e rimanda ai file
di `sql/`. È stata rimossa anche la chiave `sauces` dall'esempio di
`order_items.configuration`, che **non è mai stata popolata** dal checkout:
una documentazione che descrive una cosa inesistente è peggio di nessuna
documentazione.

**Conseguenze sul codice** (mappate il 28/07/2026): sparisce la lettura
separata di `sauces` nel menu pubblico e la forzatura `isVegetarian: false`
(§67); nel carrello sparisce il tipo `sauce` e l'upsell riconosce la categoria;
nel checkout sparisce il percorso dedicato e `order_items.product_id` viene
**valorizzato** anche per le salse, invece di restare vuoto; nel core allergeni
sparisce il parametro che distingueva i due tipi; disponibilità, reset
giornaliero e GET del pannello tornano a leggere una tabella sola. Le policy di
lettura pubblica su `sauces`/`sauce_allergens` diventano morte.

**Piccantezza sulle salse**: vale la regola di §34-35 (testo sempre accanto
all'icona, mai la sola icona) con la scala e le diciture fissate lì. Su "Ajvar
piccante" questo produce una ridondanza — nome del prodotto e indicazione di
piccantezza dicono la stessa cosa — **accettata consapevolmente**: serve a
distinguere a colpo d'occhio l'Ajvar dall'Ajvar piccante nell'elenco.

## 31. DOLCI

Baklava 5 € (miele e frutta secca). Cheesecake 5 € (scelta: Baklava / Dubai
Style). Yogurt turco 5 € (scelta: frutti di bosco / miele e frutta secca).
Kaymak & miele 4,50 €. Lokum 0,50 €. Lokum con frutta secca 1 €.

**Nota tecnica sullo schema (corretta dopo la migrazione a Supabase)**: la
scelta "gusto" di Cheesecake e Yogurt turco NON è una scelta proteina e
non va forzata nella tabella `product_protein_options` (pensata solo per
Pollo/Planted/Adana/nessuna). Lo schema va corretto con una tabella
generica per scelte singole obbligatorie non-proteina (es.
`product_choice_options`, con `choice_label` configurabile — es. "Come
preferisci il tuo kebab?" per il gruppo proteina, "Gusto" per Cheesecake e
Yogurt turco, ecc. — e `option_label` libero, non vincolato a un enum),
oppure rendendo `protein_key` un campo testo libero invece di un enum chiuso.
Questa è una correzione allo schema originale, non una nuova regola di
prodotto.

## 32. DRINK

Coca-Cola / Coca-Cola Zero lattina 33cl 2,50 €, Coca-Cola Zero Zero
Zuccheri Zero Caffeina 33cl 2,50 €, Fanta lattina 33cl 2,50 €, Lemon Soda
33cl 2,50 €, Tè freddo verde Zagara alla menta 3,50 €, Tè freddo al limone
3,50 €, Tè freddo bio alla pesca 3,50 €, Melograno 3,50 €, Chinotto 3,50 €,
Mandarino Bio 3,50 €, Limonata 3,50 €, Acqua frizzante/naturale 50cl 1,50 €,
Ayran 2 €. (Coca-Cola Zero bottiglia 45cl eliminata ovunque.)

## 33. BIRRE

Moretti 66cl 6 €, Mythos 33cl 4 €, Peroncino 25cl 3 €, Moretti 33cl 3,50 €,
Messina Vivace 33cl 4 €, Ichnusa non filtrata 33cl 4 €. Mai nei combo.
Richiedono checkbox "Dichiaro di avere almeno 18 anni" al checkout se il
carrello contiene alcolici.

## 34-35. Card prodotto e piccantezza

Prodotti con scelte: bottone "Scegli" (sempre per Roll/Bowl). Prodotti
semplici: "+ Aggiungi", poi contatore "− 1 +". Piccantezza sempre con testo
oltre all'icona 🌶️, mai solo icona/colore.

**Il "−" a quantità 1 rimuove l'articolo (v36)**: vale sulla card e nel
carrello, con lo stesso comportamento nei due posti. La regola sta in §36-40.

**La piccantezza si disegna su TUTTE le card (v35, vincolante)**

La regola "icona più testo" vale ovunque compaia un articolo, senza eccezioni
per categoria: la card dei prodotti con opzioni (Roll, Bowl) **e** la card
semplice usata da fritti, sides, salse, dolci e bevande. Forma identica nelle
due: l'icona 🌶️ ripetuta quante volte dice il livello, seguita dalla dicitura
della lista chiusa. A livello 0 non si disegna nulla.

*Fino alla v34 il rendering esisteva **solo** nella card con opzioni. Non si
era rotto niente perché tutti e 6 gli articoli con piccantezza valorizzata —
Il Turco, Il Libanese, KM Special e le rispettive Bowl — sono Roll o Bowl. Ma
rendere la piccantezza modificabile su tutti gli articoli senza estendere il
rendering avrebbe prodotto un editor che scrive nel vuoto: valore salvato,
registro aggiornato, e nulla in pagina. Esattamente il guasto silenzioso che la
regola di §63-64 "quello che l'editor non manda, l'editor non tocca" è nata per
evitare, preso dal verso opposto.*

*Non era comunque una decisione nuova: §30 l'aveva già presa senza
accorgersene, accettando la ridondanza fra il nome "Ajvar piccante" e la sua
indicazione di piccantezza perché serve **"a distinguere a colpo d'occhio
l'Ajvar dall'Ajvar piccante nell'elenco delle salse"** — una frase che
presuppone che nell'elenco delle salse la piccantezza si veda. Il precedente
corretto è la v28, che estendendo i badge a tutte le categorie prese la
decisione sul rendering **esplicitamente**, per tutte le card. Per la
piccantezza quell'equivalente non era mai stato scritto.*

**Nota di metodo (v35)**: una ricognizione lasciata a metà non lascia un buco,
lascia **assunzioni**. Le due domande poste il 28/07/2026 — quali articoli
avessero già la piccantezza valorizzata, e se il menu pubblico la disegnasse —
non hanno mai ricevuto risposta, perché nello stesso giro il lavoro è passato
all'unificazione delle salse. Nessuna delle due è stata riaperta: sono state
date per risolte. Dalla prima è nata la dicitura sbagliata di §34-35, corretta
in v34; dalla seconda il rendering mancante, corretto qui. Una domanda di
ricognizione senza risposta va **riproposta**, non superata.

**Decisione UI (presa dopo l'MVP iniziale, vincolante — AGGIORNATA)**: il
click su "Scegli" espande la configurazione del prodotto (proteina §17,
rimozioni §18) **direttamente sotto la card del prodotto stesso**, spingendo
verso il basso gli altri prodotti della lista. Niente overlay, niente
pop-up, niente pannello che scorre da sotto con schermata scurita.

Questa decisione sostituisce una scelta precedente (bottom sheet con
overlay), scartata dopo aver visto il risultato reale: l'overlay
semi-trasparente alterava i colori della pagina sottostante in modo non
coerente con la palette del brand. Vale come nuova regola definitiva per
ogni prodotto configurabile (Roll, Bowl, Menu Combo).

**Badge promozionale su tutte le categorie (v28, vincolante)**: il badge
scelto dall'editor menu (§63-64, lista chiusa) va mostrato sulla card di
**tutti i prodotti**, non solo su quelli configurabili. Fino alla v27 il
chip era disegnato solo dalla card dei prodotti con opzioni (Roll, Bowl),
mentre i prodotti semplici (fritti, sides, dolci, drink, birre) lo
omettevano: era un'omissione di rendering, non una scelta. Poiché l'editor
consente di assegnare un badge a qualunque prodotto, un badge salvato deve
sempre produrre un effetto visibile. Il chip usa lo **stesso stile** su
tutte le card e **convive** con i badge dietetici Vegano/Vegetariano (§67),
che restano derivati dai flag e non dal campo `badge`.

**Salse incluse (v29, confermata e semplificata in v32)**: fino alla v28 le
salse non avevano il campo `badge` ed erano esplicitamente escluse da questa
regola. Dalla v29 portano il badge come gli altri; dalla **v32 sono prodotti a
tutti gli effetti** (§30), quindi la questione non si pone più: non esiste
alcuna regola di rendering che le riguardi separatamente. Vale per loro la
regola della piccantezza col testo e il badge dietetico derivato dai flag,
"Vegetariano" compreso (§67).

**Scala della piccantezza (v32, diciture corrette in v34, vincolante)**: due
colonne, `spice_level` e `spice_label`, presenti su tutti gli articoli.

- `spice_level` vale **0, 1, 2 o 3**: 0 = non piccante, e da 1 in su è il
  numero di 🌶️ mostrati.
- `spice_label` è la dicitura che accompagna sempre l'icona ed è una **lista
  chiusa**: **"Leggermente piccante"** (livello 1), **"Piccante"** (2),
  **"Molto piccante"** (3). A livello 0 la dicitura è vuota (NULL) e non si
  disegna nulla.
- **Il client invia solo il livello; la dicitura la ricava il server** dalla
  lista chiusa, e non viene mai letta dal payload anche se presente. Livello e
  dicitura non possono quindi divergere: non è una regola da rispettare, è un
  percorso che non esiste. La regola "mai la sola icona" diventa così
  impossibile da violare per distrazione.
- La lista chiusa vive nel codice come quella dei badge (§63-64): aggiungere o
  cambiare un livello richiede una modifica al codice, ed è voluto.

**§19-20 prevale su questa sezione per le diciture (v34)**: la lista chiusa non
è una convenzione tecnica, è **testo di menu visibile al cliente**. §19-20
registra il menu reale ed è la fonte da cui le diciture devono derivare;
cambiarne una è una decisione sul menu, da prendere deliberatamente e da
riflettere lì, mai il contrario.

*La v32 fissava "Poco piccante" per il livello 1. Era sbagliato: §19-20
descrive da sempre "Il Turco 🌶️ Leggermente piccante", e quella dicitura era
già in database su Il Turco e Il Turco Bowl, cioè già sotto gli occhi dei
clienti. La lista era stata scritta **senza il dato** — la ricognizione che
doveva riportare i valori di piccantezza già presenti sui prodotti non era mai
stata completata, e la regola è stata scritta lo stesso. Corretta il
29/07/2026, prima che l'editor la riscrivesse sui due articoli. Gli altri due
livelli combaciavano già con il database.*

**Immagini — nessuna, per nessun articolo (v29, conteggio aggiornato in
v40)**: il campo `image_url` esiste su `products` ed è **vuoto su tutti i 62
articoli** — 55 prodotti più le 7 salse, che dalla v32 sono prodotti anch'esse
(§30). Non esiste alcun modo di caricare un'immagine dal
pannello staff, per nessun articolo. Finché il campo è vuoto la card si
disegna esattamente come oggi, senza spazi vuoti né segnaposto. La gestione
delle immagini è un lavoro autonomo, non ancora affrontato (§63-64).

## 36-40. Carrello

Barra sticky quando non vuoto ("N articoli · totale €" + "Vedi carrello").
Nel carrello: progressione ordine minimo (Delivery, 15 €) e GIVEMEFIVE (25
€) con CTA "Applica GIVEMEFIVE" a un tap. Upsell max 3-4 suggerimenti con
regole semplici (no AI): Roll senza fritto → suggerisci fritto; fritto senza
salsa → suggerisci salsa; vicino ai 25 € → suggerisci per raggiungere soglia.

**Persistenza del carrello per la durata della visita (v33, vincolante)**

Il carrello deve **sopravvivere all'uscita e al rientro dal sito**, in
particolare al ritorno dalla pagina di pagamento Stripe. Fino al 30/07/2026 non
sopravviveva: chi arrivava davanti al pagamento, si accorgeva di aver
dimenticato qualcosa e tornava indietro, ritrovava il menu con il **carrello
vuoto** e doveva ricomporre l'ordine. Era il momento peggiore in cui poteva
succedere.

**Non era una regola disattesa: era assente.** Questa spec afferma tre volte
che il carrello non si perde — cambio di tab Delivery/Ritiro (§8), indirizzo
fuori zona (§9), rifiuto del server (§46b) — ma tutti e tre sono casi in cui
la pagina **non si scarica mai**, e il carrello sopravvive da sé perché vive
nella memoria della pagina. Il ritorno da Stripe è il primo caso in cui il
cliente esce davvero dal sito, e ha richiesto una cosa che allora non esisteva:
conservare il carrello fuori dalla pagina.

- **Durata: la sola visita.** Il carrello si conserva finché la scheda del
  browser resta aperta e si perde alla chiusura. Non si conservano carrelli
  per giorni: sarebbe più comodo per il cliente, ma lascerebbe in giro
  carrelli vecchi, moltiplicando le conseguenze del punto seguente.
- **Si salvano identificativi, quantità e configurazione. Mai i prezzi.**
  Salvare un prezzo significherebbe riportarsi in casa il problema di §46 —
  una cifra vecchia conservata e mostrata come se fosse valida. Salvando solo
  *quale* articolo e *quanti*, il carrello va **ricostruito dal menu appena
  caricato**, che al ritorno da Stripe è fresco di quel momento: i prezzi
  mostrati sono per costruzione quelli veri, senza bisogno di controllarli.
- **Articoli non più disponibili: rimossi con avviso esplicito.** Se al
  momento della ricostruzione un articolo non esiste più o è esaurito, non si
  rimette nel carrello e **si dice al cliente quale e perché**, in chiaro. Mai
  farlo sparire in silenzio, mai lasciare che la cosa si scopra al pagamento.
- **Nessuna protezione nuova al pagamento.** Il server rilegge e ricalcola
  tutto comunque (§46, §46b): un carrello ripescato passa esattamente dagli
  stessi controlli di uno appena composto e **non può produrre un addebito
  sbagliato**. La ricostruzione dal menu fresco serve a evitare la *sorpresa*,
  non l'errore — l'errore era già impossibile.

**Che cosa sopravvive, oltre agli articoli (v36, vincolante)**

La v33 parlava solo del carrello. Ma chi torna indietro dal pagamento ha già
inserito indirizzo, citofono, piano, orario e contatti: ritrovare gli articoli
e dover riscrivere tutto il resto lascia in piedi metà del fastidio. E per il
Delivery l'indirizzo non è una comodità, è **la condizione che decide se la
consegna è possibile** (§10): farlo riscrivere significa rimettere il cliente
davanti al rischio di scoprire solo alla fine di essere fuori zona.

Si conservano quindi anche i dati del checkout, sotto una regola sola:

> **Si salva ciò che il cliente ha scritto o scelto. Mai ciò che il sistema ha
> concluso.**

- **Si salva**: modalità Delivery o Ritiro; indirizzo e civico come li ha
  scelti il cliente; citofono, piano, scala e note; nome, **cognome**, telefono
  ed email; la scelta fra **"prima possibile" e "orario programmato"**; giorno
  e orario richiesti; **se l'orario di ritiro è stato scelto dal cliente o
  soltanto preselezionato**; la richiesta di GIVEMEFIVE.
  *Il cognome mancava da questo elenco fino alla v39, pur essendo un dato
  obbligatorio in §41-45: aggiunto in v40, perché è proprio questo elenco a
  guidare il modulo di persistenza. Le due voci sul momento dell'ordine sono
  della v41, per la stessa ragione.*

  **La scelta fra ASAP e programmata è un dato (v41)**, non una conclusione:
  la fa il cliente, e §41-45 la tratta come parte del momento dell'ordine. Si
  conserva e **si riverifica** al rientro: se l'ASAP non è più disponibile,
  valgono le regole di §12 — l'opzione sparisce dall'interfaccia e il cliente
  sceglie un orario, mai uno spostamento silenzioso.

  **"Scelto dal cliente" oppure "solo preselezionato" è un dato (v41)**, e
  serve perché §12b ne fa dipendere due comportamenti diversi: uno slot di
  ritiro **automatico** che scade si aggiorna in silenzio sul primo utile,
  uno **esplicito** azzera la selezione e avvisa. Senza questo dato, al
  rientro bisognerebbe sceglierne uno d'ufficio per tutti.

  ⚠️ **Se manca o è illeggibile, si riparte da "scelto dal cliente".** È la
  direzione prudente: il costo dell'errore in quel verso è **un avviso in più
  da leggere**, mentre nell'altro verso sarebbe **un orario spostato di
  nascosto**, che §12b vieta espressamente. Vale la stessa logica dell'ordine
  delle scritture sugli allergeni (§67): quando si può sbagliare, si sbaglia
  dalla parte che non fa danni.
- **Non si salva mai**: nessun prezzo e nessun totale (§36-40 v33); l'esito
  del geofence; la disponibilità dello slot; il fatto che l'ordine fosse
  accettabile. Sono **conclusioni**, e una conclusione conservata è una
  conclusione vecchia mostrata come se fosse valida — lo stesso identico
  meccanismo per cui non si salvano i prezzi.
- **Al rientro si riverifica**: l'indirizzo si conserva **con le sue
  coordinate** e la **zona si ricontrolla** contro il perimetro aggiornato
  (§10); giorno e orario ricontrollati contro finestre ed eccezioni (§13,
  §68), esattamente come farebbe il server (§46b).

  *Correzione della v36 (v39)*: la v36 diceva che "la posizione va
  riottenuta". È sbagliato nel modo che conta: **le coordinate di un indirizzo
  non cambiano**, e richiederle di nuovo a ogni rientro non aggiungerebbe
  nulla. Ciò che cambia è **il nostro perimetro di consegna**, quindi la cosa
  da rifare è il **controllo**, non la geolocalizzazione. La regola generale
  resta identica: le coordinate sono parte dell'indirizzo che il cliente ha
  scelto (dato), l'essere in zona è una conclusione (§36-40) e non si conserva
  mai.

  ⚠️ **L'indirizzo ripristinato non è testo libero**: §41-45 pretende che
  l'indirizzo al checkout venga da una selezione verificata, mai digitato a
  mano. Un indirizzo ripristinato dalla memoria della visita **è** stato
  selezionato — dal cliente stesso, pochi minuti prima — e viene ricontrollato
  contro il perimetro prima di poter essere usato. Il vincolo è rispettato
  nella sostanza: nessun indirizzo arriva al pagamento senza essere passato dal
  controllo di zona.
- **Se qualcosa non regge più, si dice in chiaro cosa e perché**, al rientro e
  **non alla pressione di "Paga ora"**: stesso trattamento degli articoli non
  più disponibili. Un rifiuto secco davanti al pagamento è il modo peggiore di
  comunicarlo, ed è precisamente ciò che questa sezione esiste per evitare.

  **L'indirizzo fuori zona resta mostrato (v41, vincolante)**

  Se al rientro il controllo di zona non passa, l'indirizzo **non si cancella**:
  resta a schermo, con l'avviso accanto che spiega che lì non arriviamo (§10) e
  il **pagamento bloccato** finché il cliente non ne sceglie un altro dal
  selettore indirizzo, rifacendo la verifica (§41-45).

  *Motivo (utente, 30/07/2026)*: cancellarlo in silenzio farebbe sparire una
  cosa che il cliente aveva inserito, e lascerebbe l'avviso senza l'indirizzo a
  cui si riferisce — il cliente leggerebbe "qui non arriviamo" senza vedere
  *dove*. Tenerlo mostrato non indebolisce nulla, perché ciò che sblocca il
  pagamento non è la presenza dell'indirizzo ma l'**esito** del controllo, che
  non si conserva mai ed è appena stato rifatto.

  *Lo stesso vale per un orario che non regge più*: si azzera la selezione,
  come già impone §12b caso 3, e si dice perché.
- **Restano dati personali** (§41-45): vivono nel browser del cliente, non
  vengono trasmessi a nessuno per il solo fatto di essere conservati, e
  spariscono con la scheda insieme al carrello.

**Se i dati salvati non si leggono: si tiene il leggibile, ma l'indirizzo è
indivisibile (v42, vincolante)**

Può accadere in due casi: un cambio di formato futuro, o una manomissione
della memoria del browser. La regola:

- **Campo per campo**: ciò che si legge si tiene, ciò che non si legge resta
  vuoto. Sono caselle che il cliente ha davanti e può correggere.
- ⚠️ **Indirizzo, civico e coordinate fanno eccezione: tutti insieme o per
  niente.** Non sono tre campi, sono **una cosa sola**. Ripristinarne un pezzo
  produrrebbe un indirizzo senza coordinate, che è precisamente lo stato
  impedito apposta dal codice (§41-45: scrivere a mano azzera i dettagli). Un
  indirizzo senza coordinate non è riverificabile contro il perimetro, quindi
  sarebbe un dato che **non può essere controllato** e che porterebbe il
  cliente fino al rifiuto del server.
- **Se il formato è di una versione che non conosciamo**, si scarta tutto: non
  si indovina il significato di una struttura che non si sa leggere.

*Perché diverge dal carrello (§36-40 v36), che invece butta tutto*: là il
costo di ributtare è **un carrello da rifare**, seccante ma di pochi tocchi.
Qui sarebbe **l'indirizzo da rifare**, che questa stessa sezione non tratta
come una comodità ma come la condizione che decide se possiamo consegnare.
Regole diverse per un motivo, non per disattenzione.

**Finché non si sa, non si risponde (v42, vincolante)**

Zona e orario si riverificano contro dati che arrivano dalla rete: il
perimetro di consegna (§10) e gli slot disponibili (§13, §68). Nell'istante fra
il ripristino e l'arrivo di quei dati **non si sa nulla**, e va trattato come
tale.

- **Nessun verdetto**: non si dice "qui non arriviamo" né "il tuo orario è
  scaduto" finché non è arrivato ciò che serve per dirlo.
- **Nessun avviso** in quella finestra: un avviso ritirato dopo mezzo secondo
  è peggio del silenzio.
- **Il pagamento resta bloccato**, esattamente com'è già prima di ogni
  verifica. Non è un blocco nuovo: è quello che c'è sempre stato, che
  semplicemente non si scioglie prima del tempo.
- La riverifica **parte quando i suoi dati sono arrivati**, come la
  ricostruzione del carrello parte quando è arrivato il menu.

*Motivo*: è la regola di §46b — **un guasto di lettura non è un rifiuto** —
applicata al lato cliente. Un dato che non è ancora arrivato e un dato che dice
"no" sono cose diverse, e confonderle è il modo più facile di respingere un
cliente che poteva ordinare. ⚠️ Il caso non è teorico: la funzione che giudica
uno slot risponde **"scaduto" su un elenco vuoto**, e l'elenco è vuoto anche
mentre la risposta di rete è in viaggio. Chi collega le due cose senza questa
regola introduce il difetto **senza accorgersene**.

**I consensi non si ripristinano mai (v36, vincolante)**

L'accettazione della privacy (§41-45), il consenso marketing (§45) e la
casella "18 anni" (§33) sono **atti, non dati**: si rifanno a ogni giro, senza
eccezioni. Ritrovarli già spuntati al ritorno dal pagamento significherebbe
far pagare qualcuno che in quel passaggio non ha mai acconsentito, e per il
marketing conservare un consenso che il cliente non ha ridato. Sono tre
tocchi, ed è l'unico punto in cui la comodità cede senza discussione.

**Il meccanismo che lo garantisce (v39, vincolante)**: i tre consensi vivono
nello **stato locale della schermata di checkout**, non in quello della pagina.
Vivendo lì si azzerano da soli ogni volta che il checkout si apre, e **nessuna
persistenza può ripristinarli**, nemmeno per errore: il modulo che conserva i
dati del checkout non li conosce affatto. Non è un dettaglio di
implementazione, è la regola resa impossibile da violare — e per questo i tre
consensi **non vanno spostati altrove per simmetria** con gli altri campi,
neanche se un giorno sembrerà più ordinato.

**Dopo un pagamento riuscito il carrello salvato si svuota (v36, vincolante)**

Finora la domanda non si poneva: il carrello moriva da sé a ogni caricamento.
Da quando sopravvive, chi paga e torna sul menu si ritroverebbe dentro
**l'ordine appena pagato**. Lo svuotamento avviene all'arrivo sulla pagina di
conferma (§47-51). Si svuotano gli **articoli**; i dati del checkout possono
restare per il resto della visita, perché un secondo ordine dallo stesso
indirizzo è un caso normale — i consensi no, per la regola qui sopra.

**Il prezzo di una riga deve vivere in un punto solo (v36, vincolante)**

Poiché i prezzi non si salvano, al rientro vanno **ricalcolati**. Per un
articolo semplice è immediato; per Roll, Bowl e combo il totale dipende dalle
opzioni scelte (proteina, extra carne, accompagnamento, contorno, bibita), e
quel calcolo deve vivere in **un punto unico** richiamabile da fuori, usato sia
dalla finestra di configurazione sia dalla ricostruzione del carrello. Fino
alla v36 viveva **dentro i componenti** che disegnano le finestre, dove la
ricostruzione non poteva raggiungerlo.

Riscriverlo una seconda volta per la ricostruzione è **vietato**, per la stessa
ragione per cui §46b lo vieta al server sugli orari: due implementazioni
divergono, sempre. E qui divergerebbero sul prezzo mostrato, cioè
rifabbricherebbero in casa il problema di §46.

**Il "−" a quantità 1 rimuove l'articolo (v36, vincolante)**

Fino alla v35 il "−" sulla card del menu rimuoveva l'articolo quando la
quantità scendeva sotto 1, mentre il "−" dentro il carrello si fermava a 1 e
non toglieva nulla: per rimuovere serviva il comando "Rimuovi". Due pulsanti
con lo stesso segno e due comportamenti diversi. **Nessuno l'aveva deciso**: la
spec non ha mai detto nulla su come si toglie un articolo dal carrello, e la
differenza è semplicemente venuta così.

I due si uniformano sul comportamento della card: **anche nel carrello, "−" a
quantità 1 rimuove la riga**. Il comando **"Rimuovi" resta**, e non diventa
ridondante: su una riga con quantità 5 il "−" richiederebbe cinque tocchi.
Nessuna conferma di sicurezza, coerentemente con "Rimuovi", che già oggi
cancella senza chiedere.

*Vale la pena registrare come è emerso: durante una verifica dal vivo l'utente
ha usato il "−" del carrello mentre la prova, scritta male, descriveva quello
della card. La differenza non l'ha scoperta un'analisi, l'ha scoperta un
malinteso — e un'interfaccia che confonde chi l'ha costruita confonderà anche
il cliente.*

## 41-45. Checkout

Una sola pagina (mai suddivisa in step): fulfillment → momento dell'ordine
(Delivery: ASAP o slot programmato, §12; Ritiro: giorno e slot, sempre
obbligatori, §12b) → dati delivery (se serve) → dati cliente → privacy → marketing → maggiore età (se serve) →
riepilogo → CTA pagamento. Dati cliente obbligatori: nome, cognome,
telefono (email facoltativa). Dati delivery separati in campi distinti:
indirizzo, civico, citofono, piano/interno, edificio/scala, note rider,
coordinate — mai un unico campo disordinato. Privacy: checkbox obbligatoria.
Marketing: checkbox facoltativa, non preselezionata, salvando sì/no +
timestamp + versione testo.

**Selettore orario modificabile nel checkout (aggiunto in v18, vincolante)**:
per entrambe le modalità, quando è attiva una selezione di orario (Ritiro
sempre; Delivery quando `timingType="scheduled"`), il selettore dell'orario è
modificabile **anche all'interno del checkout**, non solo nel selettore in
cima alla pagina. Motivo: se lo slot scelto scade mentre il cliente compila i
dati (§12 per la Delivery, §12b per il Ritiro — caso 3: azzera la selezione,
blocca il pagamento, mostra il messaggio §46b), il cliente deve poter
scegliere un nuovo slot **restando nel checkout**, senza tornare indietro,
coerentemente col principio "una sola pagina". Per il Ritiro è già così
(implementato); la v18 estende esplicitamente la stessa cosa alla Delivery.

**Correzione di integrità (trovata dopo l'MVP iniziale, vincolante)**:
indirizzo e civico mostrati al checkout devono essere quelli GIÀ
verificati con la geofence nel selettore Delivery (§9-10) — **sola
lettura, non un campo libero riscrivibile**. Solo citofono, piano/interno,
edificio/scala e note rider restano campi liberi al checkout (non
influenzano la posizione geografica, quindi non serve verificarli).

**Ciò che il cliente ha scritto sopravvive alla chiusura del checkout (v39,
vincolante)**

Contatti e dettagli di consegna — nome, cognome, telefono, email, citofono,
piano, scala, note per il rider — **non si azzerano** uscendo e rientrando dal
checkout. Fino alla v38 vivevano nello stato locale di quella schermata e
sparivano a ogni chiusura: chi tornava indietro anche solo per correggere il
carrello doveva riscrivere tutto.

**I tre consensi fanno eccezione e restano dove sono** (§36-40 v39): sono atti,
non dati, e il fatto che vivano nello stato locale è ciò che li fa azzerare a
ogni apertura.

Se il cliente vuole un indirizzo diverso, deve tornare al selettore
indirizzo iniziale e rifare la verifica — non può aggirarla scrivendo un
indirizzo diverso direttamente al checkout.

**L'esito del controllo di zona è una condizione per pagare (v41,
vincolante)**

Sul sito il pulsante di pagamento si sblocca quando indirizzo, civico e
coordinate sono presenti **e il controllo di zona è passato**. Fino alla v40
bastavano i primi tre, ed era sufficiente **solo per come stavano le cose**:
le coordinate potevano arrivare unicamente da una selezione appena verificata
nel selettore indirizzo, quindi la loro presenza implicava che il controllo
fosse stato fatto e superato.

Con il ripristino dei dati del checkout (§36-40) quel presupposto **cade**: le
coordinate possono arrivare dalla memoria della visita, e il perimetro nel
frattempo può essere cambiato. Da qui in avanti la condizione va scritta sul
**verdetto**, non sulla presenza dei dati — che è la stessa distinzione fra
dato e conclusione su cui poggia §36-40.

⚠️ **Non sostituisce il controllo del server**, che resta obbligatorio e
invariato (§46b): questa è la protezione dell'interfaccia, e serve a dire al
cliente cosa non va **prima** che prema "Paga ora", invece di fargli incassare
un rifiuto nel momento peggiore.

In aggiunta, coerentemente col principio del §46 ("mai fidarsi del
browser"): la route server-side che crea l'ordine deve ri-verificare essa
stessa che le coordinate dell'indirizzo usato ricadano nella geofence,
non limitarsi a fidarsi del fatto che il client abbia già mostrato
"Perfetto, arriviamo fin qui" in una fase precedente.

## 46. Pagamento

Stripe. Regole non negoziabili: prezzo ricalcolato server-side (mai fidarsi
del browser), webhook, idempotenza, prevenzione doppio ordine, stato
pending, ordine storico con snapshot prezzi immutabile, procedura rimborso.

**Prezzo mostrato vs prezzo addebitato — da chiudere PRIMA del go-live
(v28, vincolante)**

Situazione rilevata durante la Fase 1 dell'editor menu. Il menu del cliente
è letto dal browser a ogni caricamento della pagina, una volta sola, senza
polling e senza cache lato Next/ISR/CDN. Il checkout invece **ricalcola
sempre** il prezzo dal `base_price` vivo del database, come impone questa
sezione. Conseguenza: un cliente che tiene la pagina **già aperta** mentre
il prezzo viene modificato dal pannello continua a vedere il prezzo vecchio
nel menu e nel carrello, ma al pagamento gli viene addebitato quello nuovo.
L'importo su Stripe è corretto e coerente col database — il problema non è
contabile, è di fiducia: la cifra diversa compare nel momento peggiore,
cioè davanti al pagamento.

*Decisione presa in v28*: la situazione si **accetta temporaneamente**,
perché esiste già a prescindere dall'editor, perché finché il sito non è
pubblico l'esposizione è nulla, e perché la correzione vive dentro la route
di pagamento e richiede un ciclo di verifica dedicato, non un intervento
incastrato dentro un altro lavoro. *Regola operativa nel frattempo*: i
prezzi si modificano preferibilmente **fuori dall'orario di servizio**.

*Requisito obbligatorio prima del go-live*: al checkout il server deve
**confrontare il prezzo mostrato al cliente con quello reale** e, se
differiscono, **fermarsi con un avviso comprensibile** invece di addebitare
in silenzio un importo diverso da quello visto. Questa voce va trattata
come le altre condizioni di apertura (informativa privacy, Stripe live,
dominio). *Dalla v30 non figura più fra queste il "travaso dati test →
produzione": esiste un solo database, vedi §66.*

**Un solo calcolo del prezzo di riga (v37, vincolante)**

Il prezzo unitario di una riga di carrello si calcola in **un punto solo**,
usato **sia dal sito sia dal server**. Non due implementazioni che devono
coincidere: una sola, che non può divergere perché non è più doppia. È la
stessa regola che §46b impone già al server per gli orari — riscrivere la
logica in una seconda implementazione è vietato, due implementazioni
divergono, sempre — estesa qui al confine più delicato, quello fra ciò che il
cliente vede e ciò che paga.

Forma: un modulo **puro** in `lib/` (§63-64), senza accesso al database e
senza React, che riceve i valori già letti e restituisce il prezzo. Chi lo
chiama resta responsabile di leggere i dati; il modulo di applicare le regole.

Regole che il calcolo deve applicare:

1. **Prodotto con opzioni**: prezzo base dell'articolo, più il supplemento
   della proteina scelta, più il costo dell'extra carne **letto dal database**
   (§22) quando applicato.
2. **Combo**: prezzo combo del Roll scelto (§25), più i supplementi di
   proteina, contorno e bibita.
3. **Tutti i supplementi si applicano qualunque sia il segno** (§25).
4. **Si arrotonda ai centesimi una volta sola**, alla fine del calcolo di
   riga; da lì in poi tutti — riepilogo a schermo, subtotale, ordine — usano
   quel valore. Fino alla v36 il server arrotondava tre volte lungo il
   percorso e il sito mai, arrotondando solo il numero disegnato: due catene
   diverse che davano lo stesso risultato solo perché tutti i prezzi in
   database hanno esattamente due decimali.
5. **La quantità resta fuori**: il modulo calcola il prezzo di *una* riga.
6. **Le rimozioni non hanno prezzo** (§18) e non entrano nel calcolo, in
   nessun percorso.

**Gli ingressi si leggono con gli stessi filtri da entrambe le parti (v37,
vincolante)**: disponibilità dell'articolo, disponibilità dell'opzione,
attivazione della riga di prezzo, store. Un'opzione che il server rifiuterebbe
**non va offerta dal menu**: fino alla v36 il sito proponeva contorni e
bibite senza filtrare la disponibilità, e il cliente poteva comporre un ordine
che al pagamento veniva respinto.

**Che cosa questo chiude, e che cosa no.** Chiude le divergenze di **regola**:
dopo l'unificazione non è più possibile che sito e server contino in modo
diverso. **Non chiude** le divergenze di **dato**: chi tiene la pagina aperta
mentre un prezzo cambia continua a vedere quello vecchio, perché il menu è
stato letto una volta sola. Il requisito qui sopra — confrontare il prezzo
mostrato con quello reale e fermarsi con un avviso — **resta una condizione di
apertura** e non viene assorbito da questo lavoro.

*Stato di partenza, verificato il 29/07/2026*: le due implementazioni sono
state eseguite su **609 configurazioni reali** — ogni prodotto per ogni
proteina, con e senza extra carne dove ammesso; ogni combo per ogni contorno e
ogni bibita — con **zero divergenze**. Nessun cliente ha mai pagato un importo
diverso da quello mostrato. La verifica ha però confrontato **due formule
riscritte leggendo il codice**, non il codice in esecuzione (`route.js` non è
importabile fuori da Next, i componenti non lo sono fuori da un render):
dimostra che le regole coincidono sui dati di oggi, non l'instradamento.

*Ordine dei lavori deciso il 29/07/2026*: prima il modulo con il sito, poi il
server, in due commit separati — così la persistenza del carrello (§36-40) si
sblocca già dal primo, senza attendere che si tocchi il percorso di pagamento.

⚠️ **La condizione di apertura resta aperta (v38)**

Il lavoro sull'unificazione del calcolo è concluso nel codice — modulo unico,
sito, server — e **non ha chiuso questa sezione**. È stato scambiato per una
chiusura più volte durante il lavoro, quindi va detto senza ambiguità:

- ciò che è stato chiuso sono le divergenze **di regola**: sito e server non
  possono più contare in modo diverso, perché non contano più due volte;
- ciò che resta aperto sono le divergenze **di dato**: il menu è letto dal
  browser **una volta sola** al caricamento della pagina, quindi chi tiene il
  sito aperto mentre un prezzo cambia continua a vedere il vecchio, e al
  pagamento gli verrebbe addebitato il nuovo. Lo stesso modulo, alimentato da
  due fotografie diverse dello stesso database, dà due risultati diversi — ed è
  corretto che li dia.

**Il requisito resta quello scritto sopra**: al checkout il server deve
confrontare il prezzo mostrato al cliente con quello reale e **fermarsi con un
avviso comprensibile**. ⚠️ **Il confronto lato server esiste dal 01/08/2026**
(`05c6bc9`): la route riceve il prezzo mostrato, lo confronta al centesimo e si
ferma con `409`. *Fino alla v50 questo punto diceva "non esiste ancora", e chi
lo leggeva concludeva che non esistesse una riga di codice.* **Manca il lato
sito** — la gestione del rifiuto — quindi la condizione di apertura **resta
aperta** e va tolta da questo elenco solo quando anche quello sarà costruito e
verificato dal vivo, non prima.

**Come si chiude: il confronto prezzo mostrato / prezzo reale (v44,
vincolante)**

Decisione presa il 31/07/2026. Il requisito scritto sopra fin dalla v28 —
"confrontare e fermarsi con un avviso comprensibile" — diceva *cosa* fare e non
*come*. Qui si fissa il come, perché il come contiene le scelte che possono
sbagliarsi in silenzio.

1. **Cosa manda il sito.** Per ogni riga del carrello, insieme alla
   composizione, il **prezzo unitario mostrato** — quello calcolato dal modulo
   unico (v37) sui dati letti al caricamento della pagina — e la quantità.
2. ⚠️ **Il prezzo ricevuto serve solo al confronto.** Non entra **mai** nel
   calcolo di ciò che si addebita, che resta il ricalcolo server-side dal
   database vivo (§46, prima riga). Se questa distinzione si perde, il
   controllo si trasforma nel suo contrario: il browser detterebbe il prezzo.
3. **Cosa fa il server.** Ricalcola ogni riga con lo stesso modulo unico dai
   dati vivi e confronta con il valore ricevuto, **al centesimo**, sui valori
   già arrotondati una volta sola (punto 4 del calcolo di riga). Basta **una**
   riga diversa.
4. **Esito del rifiuto**: `409` con `{ "error": "Abbiamo aggiornato il listino,
   controlla il tuo carrello" }`, secondo le convenzioni di §46b — richiesta
   ben formata ma non accettabile nello stato attuale del servizio.
5. **Vale in entrambe le direzioni.** Anche un prezzo **sceso** ferma il
   checkout: il totale che il cliente sta per pagare sarebbe comunque diverso
   da quello che ha visto, e la sorpresa gradita resta una sorpresa.
6. **Se il prezzo mostrato non arriva, la richiesta è malformata**: `400` con
   il testo `Si è verificato un problema. Ricarica la pagina e riprova.`
   (deciso da Andrea il 01/08/2026), mai un confronto saltato. Una richiesta
   costruita a mano che omette il campo non deve poter aggirare il controllo —
   è lo stesso principio di §46b, un blocco che si può omettere è vero solo per
   i clienti onesti.
   *Perché quel testo*: il caso non è raggiungibile da un cliente che usa il
   sito normalmente — ci arriva solo se qualcosa nel sito si è rotto, o se la
   richiesta è stata costruita a mano. Chi lo vedesse ha davanti **un problema
   nostro**, non un suo errore: il messaggio non lo accusa e gli indica l'unica
   cosa che può fare. ⚠️ *Fino alla v46 questo punto prescriveva il `400` senza
   fissare alcun testo, e nemmeno l'elenco di §46b lo conteneva: il messaggio
   sarebbe stato inventato dentro il commit.*
7. **Quando scatta**: **prima** che venga creato l'ordine `pending` e prima di
   qualunque chiamata a Stripe. Un tentativo fermato non lascia righe da
   ripulire (§65).
8. **Cosa vede il cliente**: il carrello **non viene svuotato** (§9, §46b),
   torna al carrello con prezzi e totale aggiornati, e l'avviso compare **una
   volta sola** — se conferma e nel frattempo nulla è cambiato ancora, prosegue
   senza ulteriori interruzioni.

   ⚠️ **"Aggiornati" richiede una rilettura del listino, e non è automatico**
   (precisazione v48). I prezzi disegnati nel carrello sono **congelati** nel
   momento in cui la riga è stata creata, a partire dal menu letto una volta
   sola all'apertura della pagina: cambiare schermata mostrerebbe **gli stessi
   identici numeri** che hanno appena causato il rifiuto. Senza rilettura il
   messaggio diventa un **vicolo cieco** — il cliente guarda, non vede nulla di
   diverso, ripreme e viene rifiutato di nuovo. **Al `409` il sito rilegge il
   menu e ricalcola i prezzi delle righe** con il modulo unico (v37), poi
   riporta al carrello.

   **Nessuna evidenziazione della differenza** (decisione di Andrea,
   01/08/2026): si mostrano i prezzi nuovi e il totale nuovo, senza indicare
   accanto alla riga quale prezzo è cambiato né di quanto. *Il caso è raro, il
   messaggio invita già a controllare, e ricordare il prezzo precedente per
   mostrarlo aggiungerebbe uno stato in più a un percorso che non ne ha
   bisogno.* Se un domani i carrelli si allungassero al punto che una
   differenza passa inosservata, la decisione va rifatta — non aggirata
   aggiungendo l'evidenziazione di passaggio.

   ⚠️ **Se la rilettura del menu fallisce** (rete assente, database che non
   risponde), il cliente non deve restare col messaggio del listino e i prezzi
   vecchi, che è il vicolo cieco descritto sopra. Si mostra: `Non riusciamo ad
   aggiornare il menu. Ricarica la pagina.` (decisione di Andrea, 01/08/2026).
   *È un guasto nostro e il messaggio lo dice senza accusare il cliente, come
   il `400` di §46 punto 6.*

**9. Stesso trattamento per l'articolo non più ordinabile (v51, vincolante)**

Il rifiuto per **articolo non più ordinabile** — `400`, testo `Un articolo del
carrello non è più disponibile.` — riceve lo **stesso trattamento** del `409`
sui prezzi: rilettura del menu, ricalcolo, ritorno al carrello. *Senza,
resterebbe il vicolo cieco proprio sul caso più probabile.*

⚠️ **Perché è il caso più probabile e non il `409`**: il ciclo che risolve gli
articoli gira **prima** del confronto dei prezzi, quindi un `409` è possibile
**solo se tutte le righe si sono risolte con successo** un istante prima.
Segnare un articolo esaurito è invece l'unica operazione che §67 permette sul
menu **durante il servizio**, ed è quella che la persona che ritocca un prezzo
può fare nello stesso giro.

**La riga non ordinabile viene tolta, e l'avviso già esistente dice quale e
perché** (decisione di Andrea, 01/08/2026). Si riusa l'avviso che il carrello
mostra già al rientro dopo una chiusura del browser — titolo *"Abbiamo
aggiornato il tuo carrello"* e una voce per riga, *"«nome»: «ragione»."* — e
**non se ne scrive uno nuovo**: due testi che dicono la stessa cosa
divergerebbero, ed è la seconda implementazione che §46b vieta.

⚠️ **Questa regola SOSTITUISCE quella che la v49 aveva scritto, e vale su
entrambi i rami — `400` e `409`.** La v49 prescriveva che la riga **restasse**
nel carrello, segnata e bloccante, perché *"il cliente decide cosa fare del
proprio carrello"* e perché §36-40 vieta il rifiuto secco alla pressione di
"Paga ora". **Il principio resta giusto; la prescrizione non è costruibile**, e
non solo sul `400`: gli stessi due ostacoli valgono identici sul `409`.

*Gli ostacoli, verificati sul codice*: il modulo di confronto **si ferma alla
prima riga che non va e deliberatamente non dice quale**, quindi il `409` è un
verdetto sul carrello intero e il sito non riceve — né riceverà — l'indice della
riga; e lo strumento che rilegge il menu restituisce **l'id del prodotto**, non
l'identificatore della riga, quindi con due righe dello stesso prodotto e
proteine diverse non le distingue. **Segnare "questa riga" è oggi impossibile su
entrambi i rami**: si può solo togliere e raccontare.

⚠️ *Non c'è quindi una regola per il `400` e una per il `409`: c'è **una regola
sola**. Chi rilegge non deve cercare due comportamenti né armonizzarli a naso —
la v49 è superata, non affiancata.*

L'attenuante che rende la scelta accettabile: **non è il rifiuto secco che
§36-40 vieta.** Quella sezione prescrive che gli articoli non più disponibili si
tolgano **dicendo quale e perché in chiaro**, ed è esattamente ciò che l'avviso
fa. La differenza fra la regola della v49 e questa non è "spiegato contro
silenzioso", è **"il cliente sceglie" contro "il sistema toglie e racconta"**.

**La regola della v49 torna applicabile quando il server dirà quale riga e
perché** (lavoro registrato più sotto): solo allora il sito potrà segnare la
riga giusta invece di toglierla. È la ragione per cui quel lavoro esiste, e va
fatto insieme al rilascio dell'indice della riga dal modulo di confronto — **uno
senza l'altro non basta**, perché i due rami hanno ciascuno il proprio
ostacolo.

**Decisioni RIMANDATE, non cancellate (v51)**

Due decisioni prese il 01/08/2026 **restano prese ma oggi non hanno oggetto**,
perché presupponevano la riga bloccata che non si costruisce. *Sono registrate
qui e non cancellate: una decisione che sparisce torna come domanda aperta al
primo che riprende il lavoro.*

- **Una riga bloccata non conta nel totale.** Il totale è quello che il cliente
  pagherebbe davvero; contare una riga non ordinabile permetterebbe di superare
  l'ordine minimo grazie a qualcosa che non si può comprare. ⚠️ *Quando si
  costruirà, tocca **tre** calcoli indipendenti del totale e i quindici usi che
  ne discendono — ordine minimo, soglia sconto, upsell, righe mostrate — e vale
  anche su **cosa parte** verso il server, non solo su cosa si somma a schermo.*
- **Una riga bloccata non mostra prezzo**, ma la ragione per cui non è
  ordinabile. *Nota: il precedente del menu va nella direzione opposta — lì il
  prezzo resta ed è l'azione a sparire (pulsante grigio "Esaurito"). Quando si
  costruirà, si prenda da lì il **trattamento grafico del blocco**, non la
  regola sul prezzo.*

**Ambito: solo i prezzi delle righe di carrello (decisione di Andrea,
31/07/2026)**

Gli **allergeni non entrano** in questo confronto. La ragione registrata non è
che il rischio sia basso — un allergene sbagliato fa danni incomparabilmente
peggiori di un prezzo sbagliato — ma che la divergenza è **già resa impossibile
da un'altra regola**: gli allergeni si modificano fuori dall'orario di servizio
(§67). ⚠️ **La decisione dipende da quella regola e cade con lei**: chi un
domani volesse modificare gli allergeni durante il servizio deve rifare questo
ragionamento **prima**, non dopo.

Il confronto copre il prezzo delle righe. Se in futuro altri importi
diventassero modificabili durante il servizio, la stessa domanda va rifatta per
loro invece di essere data per risposta.

**Contratto del modulo di confronto (v45, vincolante)**

Il confronto vive in un **modulo puro** separato dalla route, per la stessa
ragione del calcolo del prezzo (v37): perché sia verificabile da un test senza
passare da Next e senza lasciare ordini di prova. Quello che segue è il patto
fra chi chiama e il modulo, e vale **anche se un domani il modulo verrà usato
da un altro punto del programma**.

**Cosa il modulo garantisce:**

1. **Tre esiti, mai ambigui**: si prosegue, prezzo cambiato (`409`), richiesta
   malformata (`400`). Nessun quarto esito.
2. ⚠️ **Non restituisce mai un importo**, né quello mostrato né quello reale:
   solo un verdetto. Così il punto 2 della v44 — il prezzo del browser non
   entra nell'addebito — non dipende dall'attenzione di chi scriverà la route,
   ma è **impossibile da violare per costruzione**: a valle non c'è nulla da
   addebitare per sbaglio.
3. **La conversione in centesimi è quella di `lib/menu-pricing.js`**, importata,
   non riscritta. Confrontare due valori arrotondati da due implementazioni
   diverse produrrebbe differenze inventate: è la seconda implementazione che
   §46b vieta, nel punto in cui farebbe più danno.

**Cosa chi chiama deve garantire:**

4. **Solo righe risolte con successo.** Se il prezzo reale non è leggibile, il
   caso è già chiuso prima del confronto: è un guasto nostro e vale `500`
   (§46b, "un guasto di lettura non è un rifiuto"), non un `400` che addossa al
   cliente un problema che non ha. Il modulo non distingue quel caso perché non
   deve riceverlo; se malgrado tutto gli arrivasse un valore inutilizzabile,
   l'esito è `malformato` — deterministico e mai silenzioso.
5. **Elenchi coerenti.** Un confronto **senza righe** — elenchi vuoti, o di
   lunghezza diversa fra prezzi mostrati e righe reali — è `malformato`, **mai
   "ok"**: "nessuna riga verificata" non deve poter valere come via libera. Nel
   percorso reale il caso è irraggiungibile, perché il carrello vuoto viene già
   rifiutato prima; la regola vale comunque, perché è il genere di porta che si
   apre da sola quando qualcuno riusa il modulo altrove.

**Forma dell'estrazione della route di pagamento (v46, vincolante)**

Il lavoro 1 qui sotto è stato eseguito il 01/08/2026 in cinque passi
(`5a41b5f`, `0f981e7`, `2ff7225`, `a0114a7`, `4feb96d`): la route è passata da
**691 a 332 righe**. Quello che segue non è la cronaca — quella sta
nell'`HANDOFF.md` — ma le regole che il prossimo lavoro su quel file deve
rispettare.

**1. Tre categorie, tre trattamenti.**

| cosa | dove vive | forma |
|---|---|---|
| calcola, non legge nulla | modulo **puro** in `lib/` | testabile da `node`, nessuna dipendenza |
| legge o scrive sul database | modulo in `lib/` che **possiede** `supabaseAdmin` | come `lib/menu-editor.js` e `lib/menu-allergens.js` |
| confeziona la risposta HTTP | **solo la route** | nessun modulo restituisce `NextResponse` |

La terza riga è la più importante e non ammette eccezioni: un modulo che
restituisse `NextResponse` non sarebbe verificabile fuori da Next, che è
esattamente il difetto per cui questo lavoro è nato. I moduli restituiscono
`{ ok, status, body }` oppure una sentinella; la route traduce.

**2. ⚠️ La sentinella dei guasti di lettura si importa, mai si ricrea.**

`READ_ERROR` distingue il **guasto nostro** (500) dalla **riga rifiutata**
(400). Vive in `lib/checkout-resolve.js` ed è importata da chi la confronta —
oggi la route e `lib/checkout-timing.js`. *Quel legame è semanticamente storto:
il guard degli orari non ha nulla a che vedere con la risoluzione degli
articoli. Con due consumatori aggiungere un file per una costante sarebbe
peggio del difetto; **al terzo, la casa giusta diventa un modulo di vocabolario
condiviso**.*

È un `Symbol`, e questo la rende una trappola particolare: due
`Symbol("read-error")` distinti **non sono mai uguali**. Chi la riscrivesse
invece di importarla otterrebbe un confronto **sempre falso** — e quel che
segue è stato **verificato eseguendolo**, non dedotto, perché la conseguenza
non è quella che verrebbe da immaginare e **non è la stessa nei due punti**:

- **Nei resolver** il ramo successivo è `if (!resolved)`. Un `Symbol` è
  **veritiero**, quindi quel ramo **non scatta**: la sentinella estranea
  prosegue **come se fosse una riga valida**. Il prezzo diventa `NaN`, che
  attraversa il totale e **scavalca in silenzio sia l'ordine minimo sia il
  controllo dei 18 anni** (il confronto con `NaN` è sempre falso, e la
  categoria non è leggibile). L'ordine si schianta solo all'inserimento, contro
  il vincolo `not null` su `subtotal` e `total` — **dopo** che la riga cliente è
  già stata scritta.
- **Nel guard degli orari** il ramo successivo è `if (!timing.ok)`. Un `Symbol`
  non ha `.ok`, quindi il ramo **scatta** e chiama `NextResponse.json` con
  valori indefiniti, che **solleva**: eccezione non gestita, 500 generico di
  Next al posto del nostro messaggio.

*Nessuno dei due produce un rifiuto pulito.* Il primo corrompe gli importi e
salta due controlli prima di fermarsi; il secondo si rompe rumorosamente in un
punto che non c'entra con la causa. **Nessun test dei resolver esercita quel
percorso**, e nemmeno la fotografia: i suoi 20 casi non provocano mai un guasto
di lettura. Il guard degli orari fa eccezione — `tests/checkout-timing.test.mjs`
esercita un guasto **reale** e asserisce l'identità con il `Symbol` importato,
quindi lì una copia locale farebbe fallire un test.

⚠️ **Corollario: la sentinella deve restare veritiera.** È ciò che impedisce a
`if (!resolved)` di inghiottirla. Chi un domani la "semplificasse" in `null`,
`false` o una stringa vuota farebbe crollare l'intera distinzione fra guasto
nostro e riga rifiutata, senza toccare una sola riga dei confronti.

*Fino alla v46 questo punto affermava che il guasto sarebbe degradato in
"articolo non disponibile" con `400`. **Era falso**, e nel modo peggiore: dava
per pulita una conseguenza che invece corrompe gli importi. Chi l'avesse letto
avrebbe cercato il sintomo sbagliato.*

**3. Il testo del guasto di sistema appartiene alla route.**

`SYSTEM_ERROR_MESSAGE` (§46b, scelta della v19) è usato da **sette** uscite,
solo alcune delle quali sono state estratte. Farlo possedere a un modulo lo
metterebbe nel posto sbagliato; copiarlo sarebbe la trappola del punto 2 in
forma di stringa — peggiore, perché due copie **funzionano** finché qualcuno
non ne cambia una sola, e allora lo stesso guasto produce due messaggi diversi.
Il modulo dice "guasto di lettura", la route possiede la parola.

**4. Due rinunce registrate, con la ragione.**

- **`round2` resta nella route.** Non va in `lib/menu-pricing.js`: la regola 5
  della v37 dice che quel modulo calcola il prezzo di **una riga** e la
  quantità resta fuori, mentre i tre usi di `round2` sono aritmetica
  **d'ordine** (riga × quantità, subtotale, totale). Metterlo lì allargherebbe
  di nascosto l'ambito di un modulo verificato, e affiancherebbe due
  arrotondamenti diversi — centesimi interi contro virgola mobile — rendendo
  "quale uso?" una domanda viva a ogni chiamata. Un modulo nuovo che contenesse
  solo lui sarebbe battezzato per un lavoro che non fa, perché il resto
  dell'aritmetica dei totali resta nella route. *Si sposterà insieme a loro, se
  e quando.*
  ⚠️ Nota verificata eseguendola: `round2(1.005)` restituisce **1**, non 1,01,
  perché `1.005 * 100` vale `100.49999999999999`. Oggi è irraggiungibile — i
  prezzi unitari nascono già arrotondati in centesimi — ma va saputo prima di
  usarla altrove.
- **`needsRemovalCheck` resta col suo unico chiamante.** Separarla da
  `resolveRemovals` avrebbe lasciato quattro righe in un file e la funzione che
  le consuma in un altro. *Non tutto ciò che è puro va estratto.*

**5. L'asimmetria fra i due resolver è deliberata.**

`resolveCombo(ref, storeId)` filtra per store su tre tabelle; `resolveProduct(ref)`
**non riceve lo store** e legge `products` per solo `id` e disponibilità. Non è
una svista da sanare per simmetria: è il lavoro 2 registrato qui sotto, e
renderlo simmetrico è una **decisione da prendere prima in spec**, quando i
locali saranno due.

**6. ⚠️ Tre uscite hanno ora uno status dinamico.**

Dove la route delega a un modulo, il codice di risposta arriva dal modulo e non
è più scritto nella route. **Leggendo la sola route non si può più sapere che
codice risponde** in quei tre punti: bisogna aprire il modulo. È il prezzo
accettato dell'estrazione, e va saputo da chi conta le uscite — vedi il punto 7.

**7. Come contare le uscite senza sbagliare.**

Due misure diverse, che vanno sempre dichiarate **insieme**: un numero da solo
fa sospettare una regressione dove non c'è.

| | dopo il riordino (v46) | dopo l'aggancio del confronto prezzi (v50) |
|---|---|---|
| risposte HTTP possibili | 25 | **27** (+1 sul `400`, +1 sul `409`) |
| `return NextResponse.json` scritti nella route | 15 | **17** |

Lo scarto fra le due misure è **dieci**, e resta dieci: le due uscite nuove
sono scritte nella route senza delega, quindi crescono entrambi i conteggi.

**Da dove viene lo scarto.** Le uscite **accorpate** sono **quattordici**,
raccolte in **quattro** punti di delega: le otto validazioni di forma in uno, i
due guasti di lettura degli orari in uno, **i tre rami `409` del guard degli
orari in uno** — i due rifiuti di slot, che valgono **una sola** uscita del
censimento perché scelgono fra due messaggi con un ternario, più l'ASAP: **due
uscite** — e minimo Delivery più i 18 anni in uno. Quattordici assorbite meno i
quattro punti che restano scritti = **dieci** in meno da scrivere. La verifica:
**27 − 14 + 4 = 17**.

⚠️ *Fino alla v49 questo punto diceva "**dieci** uscite accorpate", confondendo
la riduzione netta con il numero di uscite assorbite, e contava "i due rifiuti
slot più l'ASAP" come **tre** dove il censimento ne conta **due** — perché il
rifiuto slot è **una sola uscita che sceglie fra due messaggi** con un ternario.
Con "dieci" il conto darebbe 21, non 17: la spiegazione portava al numero
sbagliato mentre il numero pubblicato era giusto. La prima stesura della v50
azzeccava il numero ma sbagliava il raggruppamento, scrivendo che l'ASAP era
"scritto separatamente": **falso**, e falsificabile con un `grep` — nella route
esiste **un solo** `status: 409` letterale, quello del confronto prezzi, mentre
tutti e tre i rami del guard degli orari passano dall'unico punto di delega. Chi
avesse cercato il `409` dell'ASAP nella route non l'avrebbe trovato e avrebbe
concluso che mancava.* È la stessa doppia convenzione che il censimento tiene
separata dicendo: contando le **uscite** si ottiene 27, contando gli **esiti che
il cliente vede** si ottiene di più, perché una sola uscita può produrre due
messaggi.

**8. Oltre questo punto serve prima una decisione.**

Ciò che resta nella route è la **sequenza delle scritture** — cliente, sconto,
totali, ordine, righe, Stripe, aggiornamento della sessione. Non è un grumo, è
un filo: ogni passo produce il valore che serve al successivo. Spezzarlo non è
riordino, è decidere **dove passa il confine di ciò che, fallendo a metà,
lascia dati incoerenti** — e quel confine oggi non è scritto da nessuna parte.
Finché non lo è, il lavoro non si apre.

**Lavori decisi e non fatti (v38, registrati)**

1. ✅ **FATTO il 01/08/2026** — *Il calcolo dentro la route di pagamento non
   era verificabile da un test.* `app/api/checkout/route.js` non è importabile
   fuori da Next, quindi l'instradamento — che la route chiami davvero il
   modulo — era provato solo da un campione di richieste HTTP, non da un test
   ripetibile. La strada già scelta altrove dal progetto (§63-64) era
   **estrarre la logica in `lib/` lasciando la route sottile sopra**. *Rinviato
   deliberatamente all'epoca*: rimaneggiare il percorso di pagamento insieme
   all'unificazione dei prezzi avrebbe significato cambiare due cose insieme
   nel punto in cui si incassa il denaro.
   **Eseguito in cinque passi, da 691 a 332 righe, con il comportamento
   verificato identico su 20 casi dopo ognuno.** Le regole che ne sono uscite
   sono nel blocco "Forma dell'estrazione" qui sopra; ciò che resta dentro e
   perché non si spezza oltre, al punto 8 dello stesso blocco.
2. **Il sito non filtra per store.** Nessuna lettura del menu lato cliente
   conosce uno `store_id`: l'intero menu poggia sul fatto che il locale è uno
   solo. Il server filtra comunque per store al checkout, quindi il vincolo
   vero è coperto. Aggiungere il filtro in un punto solo darebbe l'illusione di
   una consapevolezza che non c'è: rendere il sito consapevole degli store è un
   lavoro suo, da fare quando i locali saranno due.
3. **Un'ultima regola di prodotto è ancora scritta nel codice**: il sottotesto
   della nota Planted (§23) confronta una stringa scritta a mano invece di
   leggere un dato. È meno rischiosa delle altre — riguarda un testo
   informativo, non un prezzo né una disponibilità — ma è lo stesso tipo di
   problema curato in v37 e v38 sull'extra carne.

## 46b. Validazioni server-side e convenzioni di errore API (aggiunto in v14, vincolante)

§46 impone il ricalcolo del prezzo lato server ("mai fidarsi del browser").
Quel principio non riguarda solo il prezzo: **ogni condizione che rende un
ordine accettabile o meno va riverificata nella route che crea l'ordine**,
indipendentemente da ciò che il client ha già mostrato o disabilitato. Un
blocco presente solo nella UI è vero soltanto per i clienti onesti: una
richiesta HTTP costruita a mano lo aggira.

Condizioni da riverificare obbligatoriamente lato server al checkout:

1. **Prezzo** — ricalcolo completo (§46).
2. **Geofence** — coordinate dentro il poligono; solo Delivery (§41-45).
3. **Momento dell'ordine** — per **entrambe** le modalità:
   - Delivery ASAP: rifiuto se al momento della richiesta non esiste una
     disponibilità ASAP valida (§7, §12).
   - Delivery programmata e Ritiro: rifiuto se l'orario concordato è nel
     passato, se cade fuori da ogni finestra di §13, se cade in un turno
     chiuso da un'eccezione (§68), o se supera l'orizzonte di 2 giorni.
   - Il server non si fida mai dello slot ricevuto dal client: ricalcola
     finestre ed eccezioni dal database usando le **stesse funzioni pure**
     di `/api/service-status`, che resta l'unica fonte di verità.
     Riscrivere la logica di calcolo in una seconda implementazione è
     vietato: due implementazioni divergono, sempre.
4. **Opzioni e variazioni dell'articolo** — proteina, accompagnamento,
   contorno e bibita erano già riverificati; dalla v36 lo sono anche le
   **rimozioni**, contro quelle definite per quel prodotto (§18). Una
   variazione che non corrisponde fa rifiutare la riga, come le altre.

**Un guasto di lettura non è un rifiuto (v36, vincolante)**

Se una verifica non può essere svolta perché la lettura dal database
fallisce, l'esito **non è** "condizione non soddisfatta": è un errore nostro,
e va risposto **500** con il messaggio di errore interno, mai un 400 o un 409
che addossano al cliente un problema che non ha. La differenza è visibile e
conta: un cliente onesto respinto con "questa variazione non è disponibile" per
un guasto momentaneo cambierebbe il suo ordine per una ragione inesistente.
Serve quindi un canale distinto da quello del rifiuto — non basta trattare
l'errore come una lista vuota.

**Convenzioni di errore delle route API** (prima definizione esplicita in
spec — fino alla v13 status code e formato erano convenzioni del codice,
non prescritte):

- Formato di ogni risposta di errore: JSON `{ "error": "<messaggio>" }`.
- **400** — richiesta malformata, dati mancanti o invalidi.
- **409** — richiesta ben formata ma non accettabile nello stato attuale
  del servizio: fuori orario, turno chiuso, slot non più disponibile, **prezzo
  cambiato mentre il cliente ordinava** (§46 v44). È il codice del punto 3 qui
  sopra.
  ⚠️ **La geofence non superata risponde `400`, non `409` (correzione v51).**
  Questo elenco la classificava fra i `409` fin dalla v14 mentre il codice ha
  sempre risposto `400`. Finora non aveva conseguenze pratiche — il client
  mostrava comunque il testo — ma **da quando il sito ragiona sugli status ne
  ha**, e il documento non deve dire il falso su un codice che qualcuno userà
  per decidere cosa fare. *Non si allinea il codice al documento: si allinea il
  documento al codice, perché è il codice a essere in produzione da settimane e
  a essere fotografato dal caso `riga-406`.*
- **500** — errore interno.
- Il client deve mostrare al cliente il contenuto di `error` per qualsiasi
  risposta non-ok, in modo visibile nell'interfaccia e non solo in
  console.
- Su rifiuto il **carrello non viene mai svuotato** (§9) e la selezione
  resta modificabile, così che il cliente possa scegliere un altro slot
  senza ricomporre l'ordine.

**Testi dei messaggi** (definitivi dopo la revisione testi della v19):

- ASAP non più disponibile: `Non possiamo più accettare ordini immediati in
  questo momento. Scegli un orario tra quelli disponibili.`
- Orario nel passato o non più disponibile: `L'orario che hai scelto non è
  più disponibile. Scegline un altro tra quelli proposti.`
- Orario fuori apertura o in un turno chiuso: `In quell'orario siamo
  chiusi. Scegli un altro orario tra quelli proposti.`
- Prezzo cambiato mentre il cliente ordinava: `Abbiamo aggiornato il
  listino, controlla il tuo carrello` — testo e regole in §46 (v44).
- Prezzo mostrato assente o inutilizzabile nella richiesta: `Si è verificato
  un problema. Ricarica la pagina e riprova.` — §46 punto 6 (v47). *È un `400`
  di forma, non un rifiuto del cliente: ci si arriva solo se il sito si è rotto
  o se la richiesta è costruita a mano.*
- Rilettura del menu fallita dopo un `409` sui prezzi: `Non riusciamo ad
  aggiornare il menu. Ricarica la pagina.` — §46 punto 8 (v49). *Non è un
  messaggio del server: nasce nel sito, che non è riuscito a rileggere il menu
  per mostrare i prezzi nuovi.*

**Stato di implementazione (v40, verificato)**

*Sostituisce la nota della v14, che diceva "il guard è implementato per la sola
Delivery" e che un ordine Ritiro poteva essere creato via HTTP anche a locale
chiuso. **Era vera quando è stata scritta e falsa dal 24/07/2026**, quando il
guard del Ritiro è stato aggiunto; non è mai stata aggiornata. Una nota di
stato lasciata indietro non invecchia in silenzio: afferma una cosa falsa con
la stessa autorità del resto del documento, e il 30/07/2026 ha fatto sospettare
un buco che non esisteva.*

Il guard esiste **per entrambe le modalità**. Per il Ritiro copre l'orario nel
passato, le finestre di §13 con la regola della **chiusura inclusa** che gli è
propria (§12b — il flag che la seleziona è passato solo dal ramo pickup), i
turni chiusi da eccezioni (§68) e l'orizzonte di 2 giorni. Un guasto di lettura
risponde **500** e non un rifiuto, come impone il blocco qui sopra. La logica è
quella **condivisa** con `/api/service-status`: dentro la route non esiste
alcun calcolo di finestre riscritto a parte, come §46b vieta.

⚠️ **Verificato leggendo il codice, non con una prova dal vivo** (30/07/2026):
è stato seguito il percorso della route dall'ingresso fino alla scrittura
dell'ordine, verificando che nessun percorso pickup raggiunga la scrittura
saltando il guard. Nessuna richiesta è stata costruita per farsi respingere dal
vivo, perché una prova di rifiuto attribuibile costerebbe prima un ordine di
prova riuscito (lezione `ad` dell'handoff, e un residuo in più). La verifica
vale come **statica** e va dichiarata così: se un domani si toccherà quel ramo,
è il punto da riprovare per primo.

**L'orizzonte di 2 giorni regge per costruzione, non per controllo (v40)**

Non esiste alcuna riga che rifiuti un orario oltre domani. Il limite tiene
perché il sito non manda **mai una data**: manda un'etichetta, `today` o
`tomorrow`, e il giorno vero lo ricava il server dal proprio orologio. Ogni
altro valore viene respinto con 400, quindi non esiste un payload che esprima
un ritiro oltre domani, nemmeno costruito a mano.

È una protezione **solida ma silenziosa**: si romperebbe **senza rumore** il
giorno in cui si decidesse di far viaggiare una data vera dal client — per
esempio estendendo l'orizzonte del Ritiro, che §12b registra come possibile.
Chi lo farà deve sapere che sta togliendo l'unica cosa che oggi impone quel
limite, e deve aggiungere il controllo esplicito nello stesso lavoro.

**Lavori decisi e non fatti (v40, registrati)**

1. **Il tempo di preparazione e la griglia dei quarti d'ora non sono
   riverificati dal server**, per **entrambe** le modalità: §12b prescrive 15
   minuti per il Ritiro e §12 sessanta (o apertura + 30) per la Delivery, e il
   guard non li conosce; **la griglia dei quarti d'ora non è imposta**, quindi
   un orario come `12:07` viene accettato. La **forma** dell'orario è invece
   validata, e su **due** righe, non una: l'espressione regolare
   `^\d{2}:\d{2}$` e, subito dopo, un controllo che rifiuta le ore oltre 23 e i
   minuti oltre 59 — quindi `24:00` e `12:60` **non passano**. Una richiesta
   costruita a mano può prenotare un ritiro "fra un minuto", o alle 12:07,
   purché cada dentro una finestra aperta.

   ⚠️ *Fino alla v42 questo punto diceva che l'orario è accettato "in qualunque
   forma `HH:MM`", tacendo la seconda riga: chi leggeva concludeva
   ragionevolmente il contrario del vero. Il buco descritto resta reale, ma una
   citazione parziale è più pericolosa di una sbagliata, perché non suona
   falsa.*

   *Perché conta, e non per il furbo di turno*: chi volesse sfruttarlo dovrebbe
   costruirsi una richiesta **e pagare davvero**, per ottenere una scocciatura
   in cucina. Il motivo vero è l'altro — **il server è la rete di sicurezza
   sotto agli errori del sito**: se un domani il client sbagliasse a gestire
   uno slot che scade durante la compilazione (§12b, i tre casi), oggi non
   ci sarebbe nulla a fermarlo. È esattamente la famiglia di buchi per cui
   questa sezione esiste.

   **Non è una condizione di apertura** (decisione dell'utente del
   30/07/2026): il cliente onesto non può raggiungerlo, perché il sito offre
   solo gli slot calcolati, e il danno è un orario irrealistico, non un ordine
   a locale chiuso né un prezzo sbagliato.

   ⚠️ **Questo lavoro non ha una scadenza ancorata a un altro lavoro, e non
   deve averne (v51).** Fino alla v46 diceva "si chiude insieme al lavoro 1 di
   §46"; la v47 corresse in "si chiude con l'aggancio del confronto dei
   prezzi". **Entrambi quei lavori sono stati completati senza portarsi dietro
   questo controllo**, e la frase è invecchiata due volte in due giorni. *Il
   difetto non era la frase, era la forma: una scadenza ancorata a un evento
   futuro scade da sola quando l'evento accade senza di lei.* Resta un lavoro
   registrato con la sua ragione, e si chiude quando lo si fa — vale comunque
   la regola di sempre: non si rimaneggia il percorso del pagamento insieme ad
   altro, quindi quando quel file si apre, si apre per tutto ciò che è
   registrato.

2. **Le finestre orarie si costruiscono in due punti**: uno alimenta il guard,
   l'altro genera gli slot **offerti** al cliente. Confrontati il 30/07/2026,
   producono oggi lo stesso risultato — stesso ordinamento, stessa
   denominazione dei turni, stesso insieme di chiusure — e l'unica differenza
   di scrittura non è osservabile, perché riguarda una colonna che non può
   essere nulla. **Non è la seconda implementazione vietata sopra**, che
   riguarda il *calcolo* di finestre ed eccezioni, condiviso davvero. Ma sono
   due copie, e due copie divergono: da unificare quando si toccherà uno dei
   due, non prima.

## 47-51. Conferma e stati ordine

Messaggio cliente: "Ordine ricevuto" / "Ora prepariamo tutto e organizziamo
la consegna." — **mai nominare Glovo lato cliente**. Stati cliente Delivery:
Ordine ricevuto → In preparazione → In consegna (interno: "Consegnato al
rider"). Stati cliente Ritiro: Ordine ricevuto → In preparazione → Pronto
per il ritiro (§11). Nessun ETA promesso all'inizio **per la Delivery
ASAP** (raccogliere prima storico reale). Per il Ritiro e per la Delivery
programmata l'orario concordato è invece un dato esplicito, scelto dal
cliente (§12, §12b): va mostrato in conferma d'ordine, nella pagina di
stato e nelle comunicazioni. Non è una stima, è un impegno preso. Feedback cliente 90 minuti dopo "Consegnato al rider", con
logica quiet hours per non scrivere a tarda notte; mai per ordini annullati
o problemi irrisolti.

**Decisione (presa dopo l'MVP iniziale, vincolante)**: la schermata di
conferma diventa una **pagina di stato persistente**, raggiungibile in
qualsiasi momento con lo stesso link/order_token ricevuto dopo il
pagamento (non solo subito dopo l'acquisto). Si aggiorna da sola (polling,
stesso principio già usato nel pannello staff) riflettendo lo stato reale
dell'ordine:

- `nuovo` → "Ordine ricevuto"
- `in_preparazione` → "In preparazione"
- `pronto` (Ritiro) → "Pronto per il ritiro"
- `pronto`/`consegnato_al_rider` (Delivery) → "In preparazione" fino a
  `consegnato_al_rider`, poi "In consegna"
- `ritirato`/`consegnato_al_rider` → resta sull'ultimo messaggio
  significativo raggiunto ("Pronto per il ritiro"/"In consegna"), con una
  breve chiusura di cortesia (es. "Grazie, buon appetito!"), senza
  inventare nuovi stati non previsti
- `problema` → **testo esatto**: "Stiamo verificando un dettaglio del tuo
  ordine, ti contatteremo a breve se necessario."
- `annullato` → **testo esatto**: "Siamo spiacenti, il tuo ordine è
  stato annullato per un problema tecnico. Riceverai il rimborso
  completo sul metodo di pagamento utilizzato. Eventuali sconti
  utilizzati tornano validi per il tuo prossimo ordine, a presto!"

**Testi aggiunti alla pagina di stato (revisione v19)**:

- **Promemoria sempre visibile in cima** alla pagina di stato, in ogni
  stato dell'ordine: "Tieni aperta questa pagina per seguire il tuo ordine:
  è il modo per vedere gli aggiornamenti in tempo reale." Serve perché oggi
  la pagina si ritrova solo tramite il link ricevuto dopo il pagamento (vedi
  nota-roadmap in testa alla v19 sulla recuperabilità via email/WhatsApp).
- **Istruzione sul codice ordine, diversa per modalità**:
  - **Ritiro**: "Mostra il codice KM-XXXX al banco per ritirare il tuo
    ordine." — qui il codice serve davvero al cliente, per farsi riconoscere.
  - **Delivery**: "Codice ordine KM-XXXX. Pensiamo a tutto noi: il tuo
    ordine arriverà all'indirizzo indicato." Per la Delivery il codice è un
    identificativo interno (§57-61, comunicato dallo staff a Glovo): al
    cliente **non** va chiesto di comunicarlo al rider, coerentemente con la
    regola "mai nominare il rider/Glovo lato cliente".
- **Ordine non trovato**: "Non riusciamo a trovare questo ordine." (era
  "Non troviamo questo ordine.").

## 52-56. Pannello staff/admin

Navigazione: Ordini, Storico, Menu, Impostazioni. Dashboard: Nuovi / Attivi
/ Storico. Stati separati: stato ordine (Nuovo, In preparazione, Pronto,
Consegnato al rider, Ritirato, Problema, Annullato) e stato consegna (Da
richiedere, Rider richiesto, Problema rider, Consegnato al rider) — cucina
e rider procedono in parallelo.

**Correzione critica (trovata dopo l'MVP iniziale, vincolante)**: un
ordine viene creato su database (`status='nuovo'`) PRIMA che il cliente
completi il pagamento su Stripe — se il cliente abbandona il checkout o
il pagamento fallisce, l'ordine resta `payment_status='pending'`
indefinitamente. Il pannello staff (Nuovi, Attivi, Storico — tutte e tre
le sezioni) deve mostrare **esclusivamente ordini realmente pagati in
origine**, cioè `payment_status IN ('succeeded', 'refunded')` — mai
`pending`/`failed`. Il caso `refunded` resta visibile (specialmente in
Storico) perché rappresenta un ordine che è stato davvero pagato e poi
restituito (es. annullamento §62b), non un carrello mai completato — la
distinzione che conta è "mai pagato" vs "pagato, poi eventualmente
rimborsato", non semplicemente lo stato attuale del pagamento.

**Requisito futuro per "Impostazioni" (annotato, non ancora costruito)**:
la sezione Impostazioni dovrà permettere allo staff di modificare gli
orari di apertura/chiusura senza intervento nostro, in due modi:
- **Orari base per giorno della settimana**: editare le finestre già in
  `store_order_windows` (§13) per ciascun giorno, con un checkbox
  "Chiuso tutto il giorno" per disattivare un giorno intero (es. lunedì
  di riposo).
- **Date specifiche/eccezioni**: indicare date singole (Natale, Ferragosto,
  eventi, chiusure straordinarie) che sovrascrivono l'orario base solo per
  quel giorno — richiede una nuova tabella non ancora presente nello
  schema (es. `store_schedule_exceptions`: data, chiuso tutto il giorno
  sì/no, orari alternativi opzionali).

Questo requisito impatta anche il calcolo dinamico del semaforo (§7), gli
slot di consegna programmata (§12) e gli slot di ritiro (§12b), che
dovranno consultare anche le eccezioni quando esisteranno, non solo
`store_order_windows`.

**Orario concordato nella coda ordini (aggiunto in v14, dettagliato come
§12b Task D in v16, vincolante)**: da quando anche il Ritiro ha un orario
(§12b), il pannello deve mostrare `scheduled_delivery_at` su **tutti** gli
ordini che lo valorizzano, con etichetta coerente con la modalità —
"Consegna programmata: oggi HH:MM" per la Delivery, "Ritiro: oggi HH:MM" per
il Ritiro (formato "<giorno minuscolo> HH:MM", senza "alle") — e deve
**ordinare le code di lavorazione per quell'orario**. Un
ritiro concordato per le 20:45 non va preparato alle 19:10 solo perché
quell'ordine è arrivato per primo.

La v16 fissa la regola completa di ordinamento (§12b Task D):

- **Etichetta per modalità**: l'orario nella card di un ordine è etichettato
  "Ritiro: oggi 20:45" per il Ritiro e "Consegna programmata: oggi 20:45" per
  la Delivery. Il giorno+ora usa il formato "<giorno minuscolo> HH:MM" senza
  "alle" (oggi / domani / DD/MM). Questo sostituisce l'etichetta provvisoria
  unica "Consegna programmata:", che fino alla v15 compariva anche sui ritiri
  (l'orario era corretto, la parola no).

- **Orario di riferimento**: ogni ordine ha un "orario di riferimento" usato
  per ordinare la coda, definito così:
  - ordine **programmato** (ritiro o consegna programmata, cioè con
    `scheduled_delivery_at` valorizzato) → orario di riferimento = l'orario
    concordato salvato in `scheduled_delivery_at`.
  - ordine **ASAP** (consegna "PRIMA POSSIBILE", con `scheduled_delivery_at`
    nullo e `delivery_timing="asap"`) → orario di riferimento = **orario di
    creazione dell'ordine (`created_at`) + 15 minuti, arrotondato in avanti
    al quarto d'ora successivo** (:00, :15, :30, :45). Esempio: ordine ASAP
    creato alle 20:10 → 20:25 → arrotondato → orario di riferimento 20:30, e
    in coda si comporta come un programmato delle 20:30.

- **Questo orario di riferimento dell'ASAP è calcolato al volo per la sola
  visualizzazione della coda: non viene MAI scritto in
  `scheduled_delivery_at`.** La colonna resta nulla per gli ASAP. È un
  vincolo, non un dettaglio: la nullità di `scheduled_delivery_at` è ciò che
  distingue un ASAP da un programmato in tutto il resto del sistema — il
  badge orario nella card (che non deve comparire sugli ASAP), l'avviso
  "ordini colpiti" §68.3 (che filtra `scheduled_delivery_at IS NOT NULL` e
  non deve mai includere un ASAP), l'export Glovo. Riempire quella colonna
  con l'orario calcolato farebbe comportare l'ASAP come un programmato in
  tutti quei punti, e sarebbe un errore. Il "+15 minuti arrotondato" è
  solo una chiave di ordinamento della lista a schermo, non un dato salvato.

- **Parità**: se due ordini hanno lo stesso orario di riferimento (per
  esempio un ritiro programmato per le 19:15 e un ASAP che ricade sulle
  19:15), vengono ordinati tra loro per **orario di arrivo** (`created_at`):
  chi ha ordinato prima sta prima.

- **Ambito**: l'ordinamento per orario di riferimento si applica alle
  **code di lavorazione — Nuovi e Attivi**. Lo **Storico non cambia**:
  resta ordinato per data di arrivo (`created_at` discendente, i più
  recenti prima), perché è un registro di ciò che è già stato fatto, non
  una coda da lavorare.

- **Un solo orario, ritiro e consegna trattati uguale**: la coda ordina
  ritiri e consegne sullo stesso orario di riferimento, senza anticipare le
  consegne rispetto ai ritiri. Che una consegna programmata debba uscire
  dalla cucina un po' prima dell'orario concordato (per lasciare tempo al
  rider) mentre un ritiro no, al momento **non** è codificato: con i volumi
  attuali viene gestito operativamente in cucina. Introdurlo sarebbe una
  decisione nuova, da mettere prima in spec.

**Correzione schema (trovata dopo l'MVP iniziale, vincolante)**: l'enum
`order_status` del database inizialmente non prevedeva uno stato finale
per il Ritiro — solo `consegnato_al_rider` per la Delivery. Aggiunto
`ritirato` come stato finale equivalente, esclusivo del Ritiro. Regola
ferrea: `ritirato` è raggiungibile SOLO da ordini con fulfillment=pickup,
`consegnato_al_rider` SOLO da ordini con fulfillment=delivery — mai
mescolati, né nell'enum né nella UI del pannello (che deve mostrare solo
l'azione di stato pertinente alla modalità dell'ordine, come già avviene
per la transizione `pronto`/`consegnato_al_rider`).

Alert nuovo ordine: suono + persistente, idealmente anche WhatsApp a
`staff_notification_phone` configurabile. Vista cucina: modifiche
(rimozioni, "SENZA HUMMUS", "NON PICCANTE") visivamente forti, non
annegate tra gli ingredienti standard.

**Decisione operativa (presa dopo l'MVP iniziale, vincolante)**: ogni
avanzamento di stato ordine deve poter essere annullato con un'azione
"Torna indietro", che riporta allo stato immediatamente precedente
(`in_preparazione`→`nuovo`, `pronto`→`in_preparazione`,
`ritirato`→`pronto` solo Ritiro, `consegnato_al_rider`→`pronto` solo
Delivery) — un click sbagliato al banco è normale ed è meglio poterlo
correggere subito dal pannello che dover intervenire a mano sul database.
Ogni "torna indietro" va comunque registrato in `order_status_history`
(stesso audit trail degli avanzamenti, §66), così resta tracciabile anche
l'inversione. Non si applica a `problema`/`annullato`, che restano gestiti
da un flusso dedicato non ancora costruito (vedi nuova sezione "Gestione
Problema/Annullamento").

**Alert nuovo ordine — specifica operativa (decisione presa dopo l'MVP
iniziale, vincolante)**: espande la menzione iniziale ("suono + persistente,
idealmente anche WhatsApp") con le regole definitive per la fase 1. La
notifica WhatsApp a `staff_notification_phone` resta un futuro possibile
(fase 1.1 / §71), non fa parte di questa specifica.

- **Polling**: il pannello staff controlla ogni **12 secondi esatti** la
  presenza di nuovi ordini nella sezione "Nuovi", usando lo stesso filtro
  `payment_status IN ('succeeded','refunded')` già in uso nel pannello.
  Il polling degli alert è **sempre attivo, indipendentemente dalla tab
  correntemente visualizzata** (Nuovi / Attivi / Storico / Menu): al banco
  lo staff lavora spesso su "Attivi" mentre nuovi ordini continuano ad
  arrivare, quindi gli avvisi non possono essere legati alla tab visibile.
  Costo accettato: quando la tab visibile è "Nuovi", ci sono due fetch
  contemporanei allo stesso endpoint ogni 12 secondi (uno per la lista
  visibile, uno per gli alert) — trascurabile.
- **Alert per ordine mai visto in sessione**: per ogni `id` ordine non
  ancora notificato in questa sessione del browser, vengono emessi
  contestualmente:
  - un **suono**, doppio tono sintetizzato via Web Audio API — nessun file
    audio esterno, nessuna dipendenza da asset scaricati;
  - una **notifica browser nativa** via Notification API, con titolo
    `Nuovo ordine KM-XXXX` e corpo contenente importo e tipo consegna
    (Delivery / Ritiro). La notifica compare anche quando il tab è in
    background.
- **Attivazione (banner al primo caricamento)**: al primo caricamento del
  pannello in una sessione del browser viene mostrato un banner **"Attiva
  avvisi sonori"**. Al click:
  1. viene sbloccato l'audio (gesto utente richiesto dalle policy di
     autoplay dei browser);
  2. viene richiesto il permesso Notification al browser.

  Finché il banner non viene cliccato, i nuovi ordini restano visibili
  normalmente in lista ma **senza suono e senza notifica**. Il banner
  scompare una volta completata l'attivazione, e viene rimostrato
  all'inizio di ogni nuova sessione se l'audio non è ancora sbloccato in
  quella sessione o se il permesso Notification non è `granted`.
- **Nessun silenziamento**: non esiste alcun controllo (pulsante, toggle,
  impostazione) per silenziare o disattivare l'audio dal pannello. Una
  volta sbloccato, resta attivo per tutta la durata della sessione.
- **Ordini preesistenti al mount**: al montaggio del pannello, gli ordini
  "Nuovi" già presenti in lista vengono immediatamente segnati come "già
  visti" **senza generare alert**. L'alert scatta esclusivamente per
  ordini che compaiono in lista *dopo* l'apertura del pannello.
- **Ordini arrivati con banner attivo ma non ancora sbloccato (alert
  cumulativo)**: se uno o più ordini nuovi compaiono in lista tra
  l'apertura del pannello e il click sul banner "Attiva avvisi sonori",
  i loro id vengono comunque tracciati come "in attesa di notifica"
  (distinti dagli "ordini preesistenti al mount", che sono invece già
  visti in modo silenzioso). Al primo click sul banner, se il set di
  ordini "in attesa" non è vuoto, viene emesso **un unico alert
  cumulativo**: doppio tono standard (identico all'alert singolo) + una
  sola notifica browser con titolo `N nuovi ordini in attesa` (o
  `1 nuovo ordine in attesa` se N=1) e corpo elencante i codici KM-XXXX
  degli ordini coinvolti. Dopo questo alert cumulativo, tutti gli id in
  attesa vengono spostati nel set "già notificati" (sessionStorage) e
  non genereranno ulteriori alert. Da quel momento in poi vale il
  comportamento normale: un alert singolo per ogni nuovo ordine che
  compare successivamente.
- **Stato lato client**: nessuna nuova tabella e nessuna nuova colonna nel
  database. Lo stato "ordini già notificati" è interamente lato client, in
  `sessionStorage` del browser. Conseguenze deliberate: un refresh
  accidentale della pagina non ri-notifica gli ordini già visti nella
  stessa sessione; la chiusura del browser (o del tab) chiude la sessione,
  e alla riapertura gli ordini "Nuovi" ancora in lista vengono trattati
  come preesistenti (vedi punto precedente) e non generano alert.
- **Troubleshooting go-live (nota operativa, non è un vincolo di
  codice)**: se al banco l'audio del doppio tono si sente ma la
  notifica non compare a schermo, oppure viceversa non si sente
  nulla nonostante il banner sia stato cliccato e il permesso
  concesso, il problema è quasi sempre a livello di sistema
  operativo o browser, non del codice. Punti da controllare in
  ordine: (a) su macOS, Impostazioni di Sistema → Notifiche → il
  browser in uso deve essere "Consenti notifiche" e non in Focus/
  Non disturbare; (b) su Windows, Impostazioni → Sistema → Notifiche
  → il browser deve essere abilitato e la modalità Assistente
  notifiche disattivata; (c) nel browser stesso, permessi del sito
  su ordina.kebabmediterraneo.it → Notifiche = Consenti, Audio =
  Consenti; (d) volume di sistema alzato e uscita audio corretta
  (non cuffie disconnesse, non uscita HDMI vuota). Il codice
  costruisce correttamente sia `new Notification` sia il tono Web
  Audio; se la costruzione avviene ma nulla arriva a schermo/altoparlanti,
  è uno di questi quattro strati. Verificato durante il collaudo:
  finché macOS bloccava le notifiche di Chrome a livello di sistema,
  il codice funzionava (oggetto Notification istanziato con contenuto
  corretto) ma nulla compariva a schermo — sbloccato il livello
  macOS, tutto ha funzionato immediatamente.

## 57-61. Glovo On-Demand (fase 1, manuale)

Sezione "Dati per la consegna" nel pannello con pulsanti copia singoli
(codice ritiro, indirizzo, piano/interno, note rider, nome, telefono,
dettagli articoli, valore, coordinate) + "Copia tutto". Codice ritiro
formato `KM-0042` salvato come ID interno leggibile; `external_delivery_id`
separato come identificativo univoco comunicato a Glovo (vedi sotto).
Pulsante "Apri Glovo On-Demand" solo interno, mai
visibile al cliente. Prima di annullare un ordine con rider già richiesto,
lo staff deve verificare lo stato su Glovo (dopo accettazione rider la
cancellazione può avere costi). Se nessun rider disponibile: messaggio
cliente senza mai nominare Glovo, GIVEMEFIVE non consumato.

**Indirizzo Glovo On-Demand (confermato dopo l'MVP iniziale)**:
`https://ondemand-it.glovoapp.com/request-a-rider/a-ixqr` — il codice
finale `a-ixqr` è l'identificativo fisso del punto vendita KM San Mamolo
(verificato come permanente, non legato alla sessione). Va salvato nel
campo `stores.glovo_outlet_id` già previsto nello schema (o comunque
letto da database, non scritto fisso nel codice), così un eventuale
secondo store potrà avere il proprio indirizzo senza modifiche al
codice (§64).

**Sostituzione dell'approccio "pulsanti copia" (decisione presa dopo
l'MVP iniziale, vincolante)**: Glovo On-Demand fornisce un template
`.xlsx` per il caricamento degli ordini. Invece dei pulsanti copia
singoli originariamente previsti (§57-58) — lenti e soggetti a errori di
trascrizione campo per campo — il pannello staff genera **direttamente un
file .xlsx già compilato** per l'ordine, tramite un pulsante **"Scarica
dati Glovo"** su ogni ordine Delivery. Lo staff scarica il file e lo
carica su Glovo, senza copiare nulla a mano.

Colonne del template Glovo e relativa origine dei dati:

| Colonna | Origine | Note |
|---|---|---|
| `recipient_name` | nome + cognome cliente | obbligatorio |
| `recipient_phone_number` | telefono cliente | obbligatorio, con prefisso `+39` |
| `latitude` / `longitude` | `delivery_latitude`/`delivery_longitude` | obbligatorio |
| `recipient_address` | indirizzo + civico | obbligatorio |
| `recipient_notes` | citofono, piano/interno, edificio/scala, note rider uniti | opzionale, max 2048 caratteri |
| `payment_method` | sempre `PAID` | il pagamento è sempre online |
| `amount` | totale ordine | obbligatorio |
| `description` | riepilogo articoli | obbligatorio, max 200 caratteri |
| `preordered_for` | `scheduled_delivery_at` se presente | formato `YYYY-MM-DD HH:MM`, solo quarti d'ora; vuoto se ASAP |
| `pickup_code` | `external_delivery_id` se valorizzato, altrimenti `pickup_code` (es. `KM-0042`) | opzionale, max 30 caratteri; è l'identificativo univoco comunicato a Glovo (vedi sotto) |

Il pulsante compare solo sugli ordini Delivery (mai sui Ritiro, nessun
rider coinvolto). Resta il pulsante "Apri Glovo On-Demand" (§59), solo
interno, mai visibile al cliente, e il campo per impostare
l'`external_delivery_id` comunicato a Glovo (vedi sotto).

**`external_delivery_id` — identificativo univoco per Glovo (correzione
di un fraintendimento precedente, vincolante)**: `external_delivery_id`
NON è un codice che Glovo restituisce a noi dopo il caricamento. È
l'identificativo univoco che **KM comunica a Glovo** per la consegna, e
deve essere univoco lato Glovo (Glovo rifiuta identificativi duplicati).

- **Valore di default**: il codice ordine interno (`pickup_code`, es.
  `KM-0001`). Lo staff non deve digitarlo: quando `external_delivery_id`
  è ancora vuoto, il pannello propone già il codice ordine come valore
  iniziale del campo, modificabile.
- **Nessuna scrittura automatica in database**: il valore proposto è solo
  un default dell'interfaccia. La scrittura di `external_delivery_id`
  avviene solo se lo staff modifica il campo e salva esplicitamente.
- **Unico caso d'uso della modifica**: la ri-richiesta di un rider per lo
  stesso ordine (rider annullato, indirizzo errato, ecc.). Poiché Glovo
  rifiuta un identificativo già usato, in quel caso lo staff aggiunge un
  suffisso progressivo (`KM-0001-B`, `KM-0001-C`, …) prima di rigenerare
  e ricaricare il file.
- **Nel file .xlsx**: l'identificativo comunicato a Glovo viene scritto
  nella colonna `pickup_code` del template (l'unica colonna che porta il
  codice KM verso Glovo, §57-61): usa `external_delivery_id` se
  valorizzato, altrimenti il codice ordine (`pickup_code`) come fallback
  — mai vuota.
- **Nessun campo nuovo in database** (`external_delivery_id` esiste già
  nello schema) e **nessun backfill** dei dati esistenti.

## 62b. Gestione Problema/Annullamento ordini (aggiunta dopo l'MVP iniziale)

Due azioni distinte, disponibili sugli ordini attivi dal pannello staff:

**Segnala problema**: segna l'ordine come `problema` con un motivo
(testo libero), registrato in `order_status_history`. Non tocca il
pagamento. Da questo stato, lo staff può risolvere il problema tornando
allo stato immediatamente precedente (stesso meccanismo di "torna
indietro" già esistente) oppure procedere ad annullare l'ordine.

**Annulla ordine**: segna l'ordine come `annullato` con un motivo (testo
libero), registrato in `order_status_history`. Regola sul rimborso,
basata su quanto l'ordine era già stato lavorato:

- Se l'ordine **non ha mai raggiunto lo stato `in_preparazione`**
  (verificabile controllando `order_status_history`: nessuna riga con
  quel valore) → **rimborso automatico e completo via Stripe**
  (`payment_status` diventa `refunded`), perché nessun lavoro/rider è
  stato ancora impegnato.
- Se l'ordine **ha già raggiunto `in_preparazione` o oltre** → **nessun
  rimborso automatico** (`payment_status` resta invariato); il rimborso,
  se dovuto, va gestito manualmente fuori dal sistema (dashboard Stripe,
  altro canale). Il pannello deve mostrare chiaramente che in questo caso
  serve un intervento manuale.

**GIVEMEFIVE**: se l'ordine annullato aveva applicato GIVEMEFIVE, la
riga in `promo_redemptions` va eliminata in ogni caso (indipendentemente
dallo stadio raggiunto) — il cliente deve poter riutilizzare il codice
su un ordine futuro, dato che quello originale non si è concluso.

## 63-64. Menu e multi-store admin

Disponibile/esaurito per articolo, Roll e Bowl indipendenti, niente
propagazioni automatiche in fase 1. Multi-store: predisporre `store_id`,
filtro store, disponibilità/orari/fee/geofence/Glovo outlet ID per store —
ma niente UI multi-store complessa adesso.

**Editor menu nel pannello staff (decisione aggiornata in v25)**: fino alla
v25 il pannello Menu consentiva **solo** di cambiare lo stato
disponibile/esaurito, e nomi, descrizioni, prezzi, allergeni e label opzioni
non erano editabili dall'interfaccia. L'**editor del menu** si costruisce a
fasi (campi semplici → allergeni/flag → creazione prodotti semplici →
creazione/editing Roll/Bowl con opzioni); lo stato di avanzamento delle fasi è
più sotto, in fondo alla sezione. **Decisione: NIENTE ruolo admin
distinto per ora** — l'editor vive nella pagina staff esistente (autenticata
via Supabase Auth + `requireStaffSession`, §66), senza un livello di accesso
separato. L'introduzione di ruoli/permessi admin distinti dallo staff è
**rimandata a dopo il go-live**, quando il sito sarà operativo.

**Perimetro rispetto al go-live (decisione v26, vincolante)**

*Prima del go-live:*
- **Fase 1** — editing dei campi semplici dei prodotti esistenti: `name`,
  `description`, `base_price`, `badge` (solo non dietetici), `sort_order`.
  `is_available` esiste già.
- **Fase 2A** (v29) — editing di **allergeni e flag dietetici**, su
  **prodotti e salse**, con selezione dai 14 allergeni UE (§67), mai testo
  libero. È il blocco di sicurezza alimentare e va verificato come tale.
  Comprende: selezione allergeni, selettore dietetico a tre voci sul solo
  food (§67), scrittura di `allergens_verified_at`, log in
  `staff_action_log`.
- **Fase 2B** (v29, **ridefinita in v32**) — la formulazione originale
  ("salse portate al pari degli altri articoli sui campi semplici") **decade
  quasi per intero**: con la migrazione di §30 le salse diventano prodotti e
  l'editor della Fase 1 le prende in carico su `name`, `description`,
  `base_price`, `badge` e `sort_order` **senza una riga di codice nuovo**. Il
  divario non si colma, sparisce.
  Resta da costruire un solo pezzo, la **piccantezza** (`spice_level` e
  `spice_label`, §34-35), che non era comunque una faccenda di sole salse:
  riguarda tutti gli articoli e va aggiunta all'editor per tutti insieme.
  **Ordine dei lavori**: prima la migrazione di §30, poi la piccantezza.
  Invertirli significherebbe costruire il campo due volte, che è esattamente
  ciò che la migrazione elimina. La conferma sul cambio di prezzo si estende
  alle salse **automaticamente**, perché smette di esistere un percorso
  separato in cui potrebbe mancare.
  **Stato (v40): Fase 2B COMPLETA.** La migrazione di §30 è eseguita e
  verificata, quindi la parte che doveva dissolversi si è dissolta — le salse
  sono modificabili dall'editor sui cinque campi della Fase 1, verificato dal
  vivo il 28/07/2026, e la conferma sul cambio di prezzo scatta anche per loro.
  L'unico pezzo rimasto, la **piccantezza**, è stato costruito il 29/07/2026
  per **tutti** gli articoli: lista chiusa dei livelli in `lib/menu-spice.js`,
  dicitura ricavata dal server, rendering esteso a tutte le card (§34-35), e
  scelta del livello nel form del pannello. Verificato dal vivo da Andrea
  impostando **Ajvar piccante a 1 e Acuka a 2** dal pannello (§30) e
  ritrovandole nel menu con icona e dicitura.
- **Fase 3** — creazione di **articoli semplici**: prodotti (fritti, sides,
  dolci, drink) **e salse**, con **dichiarazione allergeni obbligatoria alla
  creazione**: un articolo nuovo non può nascere senza che gli allergeni
  siano stati dichiarati o esplicitamente confermati come assenti — nel
  secondo caso scegliendo "nessun allergene", che scrive
  `allergens_verified_at` senza creare righe allergene (§67 — sicurezza
  alimentare).
  **Tendina delle categorie da compilare a mano (v30, rovesciata in v32)**: la
  lista chiusa `product_category` ammette **9** valori, che coincidono con le 9
  categorie di §15. Dopo la migrazione delle salse (§30) ne restano **8** usate
  da righe di `products`, e l'unico valore da **non** offrire è `menu_combo`,
  che non è una categoria di articoli ma la forma del menu combo (§23-26): un
  articolo semplice creato lì non avrebbe senso e non comparirebbe da nessuna
  parte. La tendina va comunque costruita **a mano** sulle 8 categorie reali e
  **mai leggendo l'elenco dal database**, perché la lista del database
  descrive cosa è rappresentabile, non cosa è sensato creare.
  *La v30 escludeva anche `salse`, per un motivo che la v32 ha eliminato alla
  radice: allora una salsa creata dentro `products` sarebbe finita nella
  tabella sbagliata e sarebbe stata invisibile; adesso quello è il posto
  giusto, ed è l'unico.*

*Dopo il go-live:*
- editing dei **contenuti del combo** (contorni, proteine, supplementi):
  richiede prima la conversione delle label a id (§25, residuo noto), perché
  sono proprio le etichette che l'editor andrebbe a modificare;
- **Fase 4** — creazione/editing di Roll/Bowl con le loro opzioni;
- **creazione di nuovi tipi di menu combo** (es. "Menu Bowl", "Menu
  famiglia"): oggi il sistema non ha "i combo" ma **un** combo, di forma
  fissa a tre scelte (Roll → contorno → bibita). Renderla libera richiede un
  motore generico di composizione dei menu che il server dovrebbe
  interpretare **dentro il ricalcolo prezzo del checkout**. Costo e rischio
  sproporzionati rispetto alla frequenza d'uso reale. Fino ad allora un
  nuovo tipo di menu si realizza come **intervento una tantum sul codice**.

**Piccantezza modificabile dal pannello (v35, vincolante)**

La piccantezza si modifica dal pannello su **tutti gli articoli**, salse
comprese, con la stessa forma degli altri campi semplici. L'editor presenta la
scelta del **solo livello** (0-3) e non invia mai la dicitura, che il server
ricava dalla lista chiusa (§34-35). Le diciture mostrate nel form servono a far
capire cosa si sta scegliendo e vanno importate dal modulo della lista chiusa,
**mai riscritte a mano nel form**: due copie della stessa lista divergono
sempre, prima o poi.

**Quello che l'editor non manda, l'editor non tocca (v34, vincolante)**

Un campo **assente** dal salvataggio lascia il valore già presente
**invariato**. Non viene interpretato come "vuoto", non riceve un valore di
default, non viene azzerato. Solo un campo **presente** nel payload può
modificare la riga.

Vale per ogni campo modificabile e per ogni fase dell'editor. La ragione è che
i form crescono nel tempo: un'interfaccia scritta prima che un campo esistesse
continuerà a non mandarlo, e la regola opposta le farebbe cancellare in
silenzio un dato che non sa nemmeno di avere. Un errore così non produce
messaggi, non fallisce, non lascia traccia nel registro — semplicemente il
valore sparisce.

*Regola emersa il 29/07/2026 costruendo la piccantezza: il form del pannello
non inviava ancora il livello, e 6 articoli lo avevano valorizzato. Senza
questa regola il primo salvataggio di uno qualsiasi di quegli articoli — anche
solo per correggere una virgola nella descrizione — avrebbe fatto sparire i
peperoncini dal menu.*

**Regole di validazione dell'editor (v26, vincolanti)**

Stato verificato: **non esiste alcuna validazione server-side** sui cinque
campi della Fase 1, e il database non pone vincoli oltre ai tipi — in
particolare `base_price numeric(6,2)` accetterebbe 0 e valori negativi. Le
validazioni vanno quindi costruite **lato server**, sull'unico canale di
scrittura (sessione verificata + secret key, §66; il client non scrive mai
diretto sul DB):

- `name`: obbligatorio, non vuoto, lunghezza massima indicativa **60
  caratteri** (oltre, il layout delle card si rompe);
- `description`: facoltativa, lunghezza massima indicativa **300 caratteri**;
- `base_price`: obbligatorio, numerico, **strettamente maggiore di zero**,
  massimo **9999,99** (limite del tipo), due decimali;
- `badge`: **lista chiusa di valori non dietetici**, mai testo libero. Valori
  ammessi (decisione v27), oltre a **"nessun badge"**:
  **"TOP CHOICE"** (già in uso su 2 prodotti, §19), **"Special del mese"**,
  **"Best seller"**, **"Esclusiva KM"**, **"Scelto per te"**, **"Novità"**,
  **"I classici"**.
  Un prodotto porta **un solo badge alla volta**: il campo ne tiene uno, e due
  etichette sulla stessa card si annullerebbero a vicenda. Aggiungere un valore
  alla lista richiede una **modifica al codice** (la lista vive in
  `lib/menu-badges.js`, condivisa fra server e interfaccia): è voluto,
  impedisce che il campo torni di fatto a essere testo libero.
  I badge dietetici **non sono scrivibili**: Vegano/Vegetariano derivano dai
  flag `is_vegan`/`is_vegetarian` (§67) e una seconda fonte scrivibile a mano
  creerebbe incoerenza su un dato di sicurezza alimentare.
  *Note d'uso (non vincolanti, ma volute)*: i badge vanno tenuti **accesi pochi
  per volta**, altrimenti smettono di distinguere qualcosa; **"Special del
  mese"** ha una scadenza che il sistema non conosce — nessun automatismo lo
  rimuove, va tolto a mano quando il mese finisce — e conviene non usarlo sul
  prodotto **KM Special**, per non leggere "KM Special · Special del mese";
- `sort_order`: numero intero;
- `slug`: **non editabile** (identificatore, `unique(store_id, slug)`);
- `id`: mai modificabile (§25, identità immutabile).

**Conferma esplicita sul cambio di prezzo**: la modifica di `base_price`
deve mostrare **valore precedente e valore nuovo** e richiedere una conferma
prima del salvataggio. Motivo: il checkout ricalcola i prezzi a partire da
`base_price` (§66), quindi un errore di battitura ha effetto **immediato**
su tutti gli ordini successivi e non è visibile finché non si guardano gli
incassi. La conferma è una protezione dell'**interfaccia**: il server non
deve pretenderla, le sue validazioni valgono comunque.

**Modifiche concorrenti — comportamento accettato (v28)**: se due persone
hanno il pannello aperto e salvano lo stesso prodotto, **l'ultimo
salvataggio sovrascrive il primo senza alcun avviso**. Nessun meccanismo di
blocco o di rilevamento del conflitto è stato costruito: è una scelta
consapevole, coerente con una squadra piccola che lavora nello stesso
locale. Il `staff_action_log` (§66) permette comunque di ricostruire chi ha
scritto cosa e quando. Da rivedere solo se il pannello verrà usato da più
persone contemporaneamente e a distanza.

**Stato di avanzamento (v28)**: la **Fase 1 è realizzata**. L'editor
modifica i cinque campi semplici con validazioni server-side complete,
lista chiusa dei badge condivisa tra server e interfaccia, conferma sul
cambio di prezzo, form inline nella sezione Menu del pannello staff
(coerente con §34-35) e registrazione di ogni modifica in
`staff_action_log`, esteso anche al toggle disponibile/esaurito.

**Stato di avanzamento (v40)**: **Fase 1, Fase 2A e Fase 2B sono complete e
verificate dal vivo**. Prima del go-live resta la sola **Fase 3** (creazione di
articoli semplici, con dichiarazione allergeni obbligatoria), che non è ancora
iniziata. *Le formulazioni precedenti di questo blocco e di quello della Fase
2A descrivevano lavori già fatti come da fare: erano note di stato lasciate
indietro, dello stesso tipo corretto in §46b dalla v40.*

**Stato di avanzamento della Fase 2A (v40): COMPLETA.** Il core è
`lib/menu-allergens.js` (validazioni, ordine insert-poi-delete, flag dietetico,
`allergens_verified_at`, log) con la route sottile
`app/api/staff/menu/allergens/route.js`. Una sola funzione gestisce prodotti e
salse, così le regole sono identiche per costruzione e non per disciplina.
L'**interfaccia** è stata costruita con le regole del blocco §67 v31 ed è
verificata: allergeni e flag dietetici si modificano dal pannello.

**Forma del codice da riusare (precisata in v29)**: la Fase 1 non ha messo
validazioni e regole dentro la route HTTP, come diceva la formulazione
precedente di questa sezione, ma le ha isolate in moduli sotto `lib/` —
`lib/menu-editor.js` (validazioni, update, log) e `lib/menu-badges.js` (lista
chiusa dei badge, condivisa fra server e interfaccia) — con la route ridotta
a `requireStaffSession()` più la chiamata al modulo. Il vantaggio è che le
verifiche esercitano il codice vero e non una sua copia. **Le fasi successive
riusano questa forma**, non la reinventano.

**Immagini degli articoli — non gestibili, per nessun articolo (v29)**: il
campo `image_url` esiste su `products`, è **vuoto su tutti i 62 articoli**
(55 prodotti più le 7 salse, che dalla v32 sono prodotti anch'esse, §30 —
conteggio aggiornato in v40). Non
esiste alcun modo di caricare un'immagine dal pannello staff. La gestione
delle immagini **non fa parte di nessuna delle fasi qui elencate**: è un
lavoro autonomo, di natura diversa dagli altri campi dell'editor (caricamento
file, limite di peso, ridimensionamento, spazio di archiviazione su Supabase
Storage), da affrontare **per tutti gli articoli insieme**, prima o dopo il
go-live secondo l'esigenza. Fino ad allora il campo resta vuoto e le card si
disegnano come oggi: aggiungere una colonna che nessuno può riempire non
viola la regola v28 "un valore salvato dall'editor deve produrre un effetto
visibile", perché dal pannello quel valore non è salvabile affatto.

**Decisione operativa (presa dopo l'MVP iniziale, vincolante)**: tutti i
prodotti e le salse segnati "esaurito" tornano automaticamente
"disponibile" una volta al giorno, prima del possibile orario di
apertura (§13: apertura più presto delle 11:45) — non serve intervento
manuale per riattivarli ogni mattina. Implementato con un cron job
giornaliero (compatibile col piano gratuito di Vercel, che supporta
un'esecuzione al giorno), che gira in orario sicuro prima di qualunque
apertura possibile. Lo staff può comunque segnare di nuovo esaurito un
prodotto durante la giornata in qualsiasi momento — questo reset avviene
solo una volta, la mattina.

## 65. Analytics dal giorno 1

Tracciare almeno: visita, indirizzo inserito, servibile/non servibile,
prodotto aggiunto, soglia 15€ raggiunta, soglia 25€ raggiunta, GIVEMEFIVE
applicato, checkout iniziato, pagamento completato, ordine annullato +
motivo, tempi tra le fasi dell'ordine.

**Pagina "Carrelli abbandonati" (decisione presa dopo l'MVP iniziale,
vincolante)**: pagina dedicata nel pannello staff, volutamente **meno in
evidenza** delle sezioni operative (Nuovi/Attivi/Storico/Menu) per non
generare confusione con gli ordini reali da lavorare. Mostra gli ordini
rimasti `payment_status='pending'` (checkout iniziato ma mai completato),
con:
- numeri aggregati: quanti carrelli abbandonati, in che periodo, valore
  medio e totale perso;
- **contenuto dei carrelli**: quali prodotti erano dentro, per capire se
  ci sono prodotti o prezzi che fanno perdere clienti in modo ricorrente.

**Ordini in sospeso: destinati a moltiplicarsi (v33)**

Ogni arrivo alla pagina di pagamento crea un ordine `pending`. Prima della
persistenza tornare indietro era raro, perché chi lo faceva perdeva il carrello
e spesso rinunciava del tutto; con la persistenza del carrello (§36-40) tornare
indietro è **normale** — torno, aggiungo la salsa dimenticata, ripago — e ogni
giro lascia un `pending` orfano di un cliente che invece **ha comprato**.

Non è un errore contabile e non nasce con quella modifica: quegli ordini
esistono già oggi. Ma la pagina qui descritta li conterebbe come rinunce,
gonfiando proprio la statistica che serve a capire dove si perdono i clienti.
Va tenuto presente **quando la pagina verrà costruita**, non quando i numeri
sembreranno disastrosi: un `pending` seguito a pochi minuti da un ordine
completato dallo stesso cliente non è un carrello abbandonato.

**Anche le righe cliente si moltiplicano (v36)**: il cliente viene scritto in
`customers` **prima** dell'ordine e resta lì anche se il checkout non arriva in
fondo. Una parte consistente di quelle righe non ha alcun ordine collegato:
sono passaggi di checkout interrotti, e con la persistenza del carrello ogni
giro in più ne lascia un'altra. Non è un errore — serve a riprendere l'ordine —
ma va saputo prima di leggere quei numeri come "clienti". Vale su di essi lo
stesso divieto d'uso a fini di ricontatto scritto qui sotto. *Il conteggio
aggiornato vive nell'`HANDOFF.md` e non qui, per la stessa ragione dei residui
di prova: cambia a ogni verifica dal vivo (§66).*

**Vincolo legale non negoziabile**: questi dati servono ESCLUSIVAMENTE a
scopo statistico interno. È vietato usarli per ricontattare i clienti a
fini di marketing (SMS, email, WhatsApp, chiamate) — il consenso
marketing (§45) è facoltativo e non spuntato di default, quindi la
maggior parte di queste persone non lo ha dato, e ricontattarle sarebbe
una violazione GDPR. Per questo motivo la pagina **non deve mostrare
nome, cognome, telefono o email** del cliente: solo dati aggregati e
contenuto del carrello. Se in futuro FAME Srl volesse valutare azioni di
ricontatto, servirà prima una validazione legale esplicita e una revisione
di questa regola.

## 66. Sicurezza

URL ordine con token non prevedibile, admin autenticato, snapshot ordine
immutabile, log azioni staff, nessun dato sensibile in URL, validazioni e
prezzi sempre server-side, audit trail minimo.

**Snapshot ordine immutabile — verificato (v26)**: ogni riga `order_items`
**congela** al momento dell'ordine il nome (`product_name_snapshot`), la
categoria (`category_snapshot`), il prezzo unitario
(`unit_price_snapshot`), il totale riga (`line_total`) e i dettagli di
configurazione (`configuration` jsonb: proteina, contorno, bibita,
rimozioni, come testo). Tutti i punti che mostrano un ordine passato —
Storico del pannello staff ed export Glovo — leggono **dallo snapshot** e
mai da una join con `products`; la pagina di stato lato cliente non espone
affatto i nomi dei prodotti. Il campo `order_items.product_id` resta come
semplice riferimento (nullable) e non viene usato per mostrare nome o
prezzo. **Conseguenza vincolante**: rinominare o riprezzare un prodotto
dall'editor menu **non altera gli ordini già emessi**, e questa proprietà va
preservata — nessuna schermata di storico deve mai ricavare nome o prezzo
di un ordine passato dalla tabella `products`.

**Log delle modifiche al menu (v26, vincolante)**: finché non esistono ruoli
distinti (§63-64), chiunque abbia le credenziali staff può modificare il
menu, prezzi inclusi. Il controllo compensativo è la tracciabilità: ogni
scrittura fatta dall'editor menu va registrata in `staff_action_log`
(tabella già esistente, con `order_id` nullable e `action`/`detail` liberi)
indicando **quale prodotto, quale campo, valore precedente e valore nuovo**.
Vale anche per il toggle disponibile/esaurito, che dalla v28 viene registrato
come gli altri campi (§63-64).

**Un solo database, nessun ambiente di test separato (v30, vincolante)**

Verificato in data 28/07/2026: **esiste un solo progetto Supabase**. Il
database su cui si sviluppa oggi è lo stesso che servirà i clienti dal giorno
dell'apertura. L'etichetta "PRODUCTION" mostrata da Supabase è il nome che
quel sistema dà al ramo principale di qualunque progetto e non indica che il
sito sia pubblico.

Conseguenze:

- **Cade la condizione di apertura "piano di travaso dati test →
  produzione"** (§46): non c'è nulla da travasare. I dati del menu, gli
  allergeni e i flag dietetici sono già dove serviranno. È una condizione in
  meno, ed era fra le più laboriose e più esposte a errore.
- **Vanno rimossi i residui dei test prima del go-live.** Al go-live **si
  azzera tutto ciò che è di prova**, senza tenere nulla "per storico"
  (decisione dell'utente del 29/07/2026): oggi è invisibile al cliente e
  innocuo, dal giorno dell'apertura starebbe in mezzo ai dati veri, falsando i
  carrelli abbandonati (§65) e il registro delle azioni staff.

  **Come si costruisce l'elenco (v36, vincolante).** Interrogando **tutte** le
  tabelle dello schema, una per una, non ricordando quali si sono usate e mai
  ricostruendo per differenza. Le tre versioni precedenti di questo elenco
  erano tutte sbagliate, e per due ragioni diverse: la v31 e la v32 avevano
  numeri **dedotti** invece che letti; la v33, che pure li aveva riletti dal
  database, guardava **solo dentro le tabelle che qualcuno si ricordava di aver
  toccato**, e ne mancavano tre intere. Rileggere non basta: bisogna sapere
  *dove* rileggere, e l'unico modo affidabile di saperlo è chiedere a tutte.

  **Che cosa va riletto, e dove vivono i numeri (v40).** L'elenco copre
  **tutte e 23 le tabelle** dello schema, e in particolare quelle che è già
  successo di dimenticare: `orders`, `order_items`, `customers`,
  `order_status_history`, `promo_redemptions`, `staff_action_log`, più quelle
  che risultano vuote — vanno **ricontrollate, non date per vuote**.

  ⚠️ **La fotografia con i numeri non sta più in questo documento**, ed è una
  decisione, non una dimenticanza (utente, 30/07/2026). Quei conteggi cambiano
  a **ogni verifica dal vivo** che arriva alla pagina di pagamento: tenerli qui
  significava avere una spec sbagliata in quel punto quasi ogni giorno, e un
  documento abitualmente sbagliato in un punto insegna a non fidarsi anche
  negli altri. Le quattro versioni precedenti di questo elenco sono state tutte
  superate, e l'ultima nel giro di **una sola giornata**. **La fotografia vive
  ora nell'`HANDOFF.md`**, che è il documento dello stato; qui resta la regola,
  che non invecchia. *La spec tiene le decisioni, l'handoff tiene lo stato.*

  **`staff_action_log` è l'unica eccezione all'azzeramento**: le righe scritte
  dall'identificatore staff reale sono **azioni vere sul menu vero**, cioè
  l'audit trail imposto da questa stessa sezione, e **restano**. Si rimuovono
  solo quelle degli identificatori di test.

  **Non sono residui** e non si toccano: le tabelle di menu e configurazione
  (`stores`, `store_order_windows`, `store_geofences`, `products`,
  `product_choice_options`, `product_removals`, `product_addons`,
  `product_accompaniments`, `combo_side_options`, `combo_drink_options`,
  `combo_pricing`, `allergens`, `product_allergens`), che contengono i dati
  veri già pronti per l'apertura.
- **L'immutabilità dello storico non vincola i dati di oggi (v32).** La regola
  qui sopra descrive come si deve comportare il **sistema** quando gli ordini
  saranno di clienti veri: nessuna schermata deve ricavare nome o prezzo di un
  ordine passato dalla tabella `products`. Non dice nulla sui dati di prova
  attualmente in tabella, che sono **tutti modificabili ed eliminabili**.
  *Precisazione aggiunta perché la distinzione era stata mancata: la regola era
  stata letta come un vincolo attuale, arrivando a sconsigliare la migrazione
  di §30 per un ostacolo che non esisteva.*
- **Dal go-live ogni modifica fatta dal pannello tocca dati vivi**, senza
  rete di protezione: non esiste un posto dove provare prima. È la ragione
  per cui §67 impone di modificare allergeni e flag fuori dall'orario di
  servizio, e §63-64 impone la conferma sul cambio di prezzo.

## 67. Allergeni

**Stato (v21): popolati a livello di prodotto e salsa.** Gli allergeni sono
stati inseriti a partire dal documento allergeni ufficiale del ristorante,
integrato con dati forniti e verificati dall'utente per le voci non coperte
dal documento (KM Special, Polpette di agnello, Dolmadakia, Caviale di
melanzane, Lokum con frutta secca, Kaymak & miele, Black KM) e per le
correzioni emerse in revisione (Lokum con frutta secca → frutta a guscio;
Cheesecake → uova).

**Vocabolario**: i 14 allergeni UE ufficiali (Reg. UE 1169/2011): Glutine,
Crostacei, Uova, Pesce, Arachidi, Soia, Latte, Frutta a guscio, Sedano,
Senape, Sesamo, Anidride solforosa e solfiti, Lupini, Molluschi.

**Modello e livello di tracciamento**:
- Gli allergeni si tracciano a livello di **prodotto** (tabella
  `product_allergens`) e **salsa** (tabella `sauce_allergens`). NON a
  livello di variante proteica o extra — semplificazione voluta rispetto
  ai "4 livelli" (prodotto/variante/salsa/extra) della predisposizione
  originaria: la struttura per variante/extra non è stata creata.
- **Roll e Bowl omonimi sono voci indipendenti (riscritto in v29).** Gli
  allergeni de "Il Turco" e de "Il Turco Bowl" **coincidono di fatto**,
  perché descrivono la stessa ricetta, ma sono **due dati distinti**, su due
  prodotti distinti (§16), senza alcun legame nel database. La formulazione
  precedente ("Roll e Bowl omonimi condividono gli stessi allergeni") poteva
  essere letta come una regola del sistema: non lo è, ed è la lettura
  pericolosa, perché autorizzerebbe a **dedurre** gli allergeni di una Bowl
  da quelli del Roll — cosa che questa sezione vieta.
  **Conseguenze vincolanti:** (a) nessuna propagazione automatica fra Roll e
  Bowl, in nessuna direzione; (b) nessun avviso automatico quando se ne
  modifica uno solo; (c) **nessun codice deve mai ricavare gli allergeni di
  un articolo da quelli di un altro**; (d) tenere allineate le 7 coppie è
  una **responsabilità operativa del locale**, non del software. È la stessa
  natura del problema di §25 ("i nomi non si propagano"), con conseguenze
  molto più serie. *Fotografia al 28/07/2026: tutte e 7 le coppie hanno set
  di allergeni identici.*
- **Prodotti con scelta gusto** (Cheesecake: Baklava/Dubai Style; Yogurt
  turco: frutti di bosco / miele e frutta secca): si salva **l'unione**
  degli allergeni dei due gusti, perché lo schema tiene un solo set per
  prodotto. Principio: sovra-dichiarare è più sicuro che sotto-dichiarare.
- I flag dietetici **`is_vegan`** e **`is_vegetarian`** sul prodotto sono
  distinti dagli allergeni (non sono allergeni) e sono impostati per tutti i
  prodotti food. Regole (v22):
  - **`is_vegetarian`** indica se il piatto è vegetariano **così com'è di
    default**: un Roll/Bowl con proteina di carne di default resta *non*
    vegetariano anche se personalizzabile con la variante vegetale Planted
    (la personalizzazione non cambia il flag del prodotto).
  - **Vegano implica vegetariano**: ogni prodotto con `is_vegan=true` ha
    necessariamente `is_vegetarian=true`. Nessun prodotto può essere vegano
    ma non vegetariano (vincolo di coerenza da mantenere).
  - Valori popolati da dati verificati dall'utente (23 vegetariani / 11 no
    sui 34 food; bevande escluse). In questa occasione è stata corretta
    anche la marcatura di **Habibites** (da non-vegano a vegano, quindi
    anche vegetariano).
  - **Scelta unica a tre voci nell'editor (v29)**: nel pannello il flag
    dietetico si presenta come **una sola scelta fra tre** — *Vegano*,
    *Vegetariano*, *Nessuno dei due* — mai come due caselle da incrociare.
    Sotto restano le due colonne esistenti: scegliere "Vegano" scrive
    `is_vegan=true` **e** `is_vegetarian=true`, perché un piatto vegano è
    vegetariano e deve comparire in qualunque elenco dei vegetariani (filtri,
    liste, risposta al banco). Al cliente continua a comparire **un solo
    badge**, "Vegano", come già previsto dal rendering più sotto: non si vede
    mai "Vegano · Vegetariano".
  - **Il vincolo lo fa rispettare l'editor, non il database (verificato in
    v29)**: su `products` non esiste alcun CHECK che impedisca la
    combinazione `is_vegan=true` con `is_vegetarian=false`. Oggi non ci sono
    righe che la violano, ma da quando i flag diventano scrivibili dal
    pannello la coerenza dipende interamente dalla validazione applicativa.
  - **Solo sugli articoli food (v29)**: il selettore compare esclusivamente
    sugli articoli il cui contenuto è tracciato. **Drink e birre restano
    fuori** (§67, "fuori dal tracciamento"): i loro flag valgono NULL, che
    significa *non applicabile* e non "né vegano né vegetariano", e per loro
    il selettore **non compare affatto**. Mostrarlo costringerebbe a
    rispondere a una domanda che nessuno ha posto. Estendere il tracciamento
    alle bevande sarà semmai una decisione nuova, da mettere prima in spec.
  - **Salse (v29)**: le salse acquistano `is_vegetarian`, che fino alla v28
    non avevano (l'esclusione era dichiarata consapevole: la v29 la riapre,
    §30). Il campo nasce **vuoto** su tutte e 7 e va compilato dal pannello:
    finché è vuoto, il cliente non vede comparire alcun badge "Vegetariano"
    sulle salse — un'informazione che si aggiunge, non una che si perde.
    Anche per le salse vale il vincolo "vegano implica vegetariano".

**Fuori dal tracciamento (per ora, decisioni v21)**:
- **Variante Planted** (a base soia → allergene soia): lo schema non traccia
  allergeni per variante, quindi la soia introdotta scegliendo Planted non
  è rappresentabile a livello prodotto senza sovra-dichiarare su tutti i
  Roll. **Gestita a livello di UI (v23)**: nel configuratore (Roll/Bowl e
  Menu Combo) l'opzione Planted mostra un sottotesto discreto "Alternativa
  vegetale · contiene soia". È solo testo nel rendering del configuratore,
  riconosciuto dalla chiave `planted`; non entra nel carrello/ordine né
  crea una struttura allergeni per-variante.
- **Bevande** (drink e birre): escluse dal tracciamento per ora. Nota: le
  birre contengono tipicamente glutine e a volte solfiti; se in futuro le
  bevande verranno mostrate al cliente con l'informazione allergeni, andrà
  compilato prima di dichiararle "senza allergeni".
- **Flag legacy** `contains_gluten` / `contains_lactose` su `products`:
  erano superati dalla tabella `product_allergens` e sono stati **rimossi**
  dallo schema (colonne eliminate, commit `ca2edce` + migration
  `sql/20260727_drop_legacy_contains_flags.sql`). Nota: resta il flag
  distinto `product_accompaniments.contains_gluten` (contorno Bulgur), che è
  un'altra cosa e non è stato toccato.

**Quando si modificano allergeni e flag dietetici (v29, vincolante)**

Soltanto **fuori dall'orario di servizio** (§13). Durante il servizio si
modifica **esclusivamente la disponibilità** dell'articolo
(disponibile/esaurito).

Il motivo è lo stesso di §46 per i prezzi, con conseguenze più gravi: il menu
è letto dal browser del cliente **una volta sola**, al caricamento della
pagina, senza polling e senza cache. Chi tiene la pagina già aperta mentre
gli allergeni vengono modificati continua a vedere la lista vecchia. Sui
prezzi il checkout almeno ricalcola dal database, quindi l'importo addebitato
è corretto; **sugli allergeni non esiste alcun controllo al checkout**, e una
lista letta sbagliata non viene intercettata da nulla.

La regola è di condotta, non di codice: **nessun avviso e nessun blocco** a
schermo. Il pannello non impedisce di salvare in orario di apertura, perché
il giorno in cui servisse davvero un intervento urgente, impedirlo sarebbe
peggio del rischio che evita. Le ricette e gli ingredienti sono stabili, la
frequenza reale di modifica è bassissima, e l'esposizione è ulteriormente
ridotta dalla possibilità di segnare l'articolo "esaurito" prima di
intervenire.

**Chi può modificarli**: chiunque abbia le credenziali staff, dato che non
esiste un ruolo admin distinto (§63-64, rimandato a dopo il go-live). Vale la
stessa contromisura dei prezzi: la tracciabilità (§66).

**Log delle modifiche agli allergeni (v29)**: ogni modifica va registrata in
`staff_action_log` come impone §66. Poiché gli allergeni non sono un campo
singolo ma un insieme, il log registra la **lista completa prima** e la
**lista completa dopo**, non il singolo allergene aggiunto o tolto: è l'unica
forma che permette di ricostruire lo stato reale di un articolo a una certa
data senza rimontare una catena di differenze.

**Regole dell'editor allergeni (v30, vincolanti)**

Valgono per la Fase 2A (§63-64) e per ogni fase successiva che scriva
allergeni o flag dietetici, su prodotti e su salse.

- **Selezione dai soli 14 allergeni UE**, mai testo libero, mai deduzione.
- **Casella esplicita "Nessuno dei 14 allergeni"**: è l'unico modo di
  dichiarare un articolo privo di allergeni. Salvare con tutte le caselle
  vuote e senza spuntarla **non è un salvataggio valido**: il server rifiuta.
  Motivo: "non ho ancora compilato" e "ho verificato che non contiene nulla"
  sarebbero altrimenti lo stesso gesto, ed è proprio la distinzione per cui
  esiste `allergens_verified_at`. La casella è mutuamente esclusiva con la
  selezione dei singoli allergeni: spuntarla svuota la selezione, e
  selezionare un allergene la disattiva.
- **Conferma solo in rimozione**: se il salvataggio **toglie** uno o più
  allergeni, l'interfaccia chiede una conferma esplicita che elenca **quali**
  stanno per essere rimossi. Se il salvataggio si limita ad aggiungerne,
  nessuna conferma: aggiungere è la direzione innocua e l'attrito inutile fa
  solo evitare le modifiche. Come per il prezzo (§63-64), la conferma è una
  protezione dell'**interfaccia**: il server non la pretende, le sue
  validazioni valgono comunque.
- **Ordine delle scritture: prima si aggiunge, poi si toglie.** Il
  salvataggio è composto da due operazioni distinte — inserimento delle righe
  nuove in `product_allergens` / `sauce_allergens`, cancellazione di quelle
  rimosse — che il client PostgREST **non può raggruppare in una
  transazione** (stesso limite già accettato in §68.3). L'ordine è quindi
  vincolante: se qualcosa si interrompe a metà, l'articolo deve restare con
  **più** allergeni del vero, mai con meno. È lo stesso principio di prudenza
  già adottato per i prodotti con scelta gusto ("sovra-dichiarare è più
  sicuro che sotto-dichiarare"). L'errore resta visibile riaprendo la scheda.
- **Nessuna preselezione del flag dietetico quando il dato manca**: sugli
  articoli food con flag ancora NULL (Tzatziki e Yogurt, vedi in fondo alla
  sezione) il selettore a tre voci si presenta **senza nulla di selezionato**
  e obbliga a una scelta esplicita prima di salvare. Preselezionare "Nessuno
  dei due" produrrebbe una dichiarazione che nessuno ha fatto.
- **Ogni salvataggio scrive `allergens_verified_at`** con la data del
  momento, anche quando la selezione non cambia: la verifica è un atto, non
  un effetto collaterale della modifica.
- **Ogni salvataggio va registrato in `staff_action_log`** con la lista
  completa prima e la lista completa dopo (vedi sopra), mai il singolo
  allergene aggiunto o tolto.

**Regole dell'interfaccia dell'editor allergeni (v31, vincolanti)**

Valgono per il form della Fase 2A e per ogni schermata successiva che
permetta di modificare allergeni o flag dietetici. Sono protezioni
dell'**interfaccia**: il server non le pretende, le sue validazioni (blocco
precedente) valgono comunque.

- **Form inline**, aperto sotto la riga dell'articolo nella sezione Menu,
  senza pop-up né overlay — come la Fase 1 e coerentemente con §34-35.

- **Avviso di incoerenza fra allergeni e flag dietetico — non bloccante.**
  Quando la selezione contiene un allergene incompatibile con il flag
  dietetico scelto, l'interfaccia mostra un avviso che nomina l'allergene e
  il flag e invita a controllare, e **lascia salvare comunque**.
  Incompatibilità:
  - con **Vegano**: Latte, Uova, Pesce, Crostacei, Molluschi;
  - con **Vegetariano**: Pesce, Crostacei, Molluschi. Latte e Uova sono
    compatibili con "vegetariano" e non producono avviso.

  **Non è una correzione automatica**: il sistema non modifica né gli
  allergeni né il flag, e non decide quale dei due sia sbagliato. Dedurre un
  dato di sicurezza alimentare da un altro è vietato (§67): l'avviso segnala
  una contraddizione fra due dichiarazioni, entrambe fatte da una persona,
  e lascia la scelta a chi conosce la ricetta.

  **L'assenza di avviso non è una conferma di coerenza.** Il controllo
  confronta soltanto i 14 allergeni con il flag: un articolo può essere non
  vegano per ingredienti che non sono allergeni — il miele è il caso tipico
  (Baklava, Kaymak & miele) — senza che nulla scatti. L'avviso intercetta
  una contraddizione evidente, non certifica il resto.

- **Riapertura di un articolo senza allergeni**: la casella "Nessuno dei 14"
  si presenta **già spuntata** quando l'articolo ha zero allergeni **e**
  `allergens_verified_at` valorizzato; **non spuntata** quando ha zero
  allergeni e la data è nulla. È la traduzione a schermo della distinzione
  fra "verificato: non contiene nulla" e "mai dichiarato", ed è l'uso
  concreto per cui quella colonna è stata creata.

- **Stato di verifica visibile nella lista**: nella sezione Menu ogni
  articolo food mostra se e quando gli allergeni sono stati verificati, e
  quelli mai verificati sono visibilmente distinti, così che la domanda
  "abbiamo verificato tutto?" si risolva guardando la schermata invece che
  ricordando. Le **bevande non mostrano l'indicatore**: sono fuori dal
  tracciamento per decisione di §67, e segnalarle come "mai verificate"
  produrrebbe 21 avvisi permanenti che non chiedono alcuna azione.

**Dato di verifica degli allergeni — `allergens_verified_at` (v29,
vincolante)**

Nuova colonna, nullable, su **`products`** e su **`sauces`**. Registra che
gli allergeni di quell'articolo sono stati verificati da fonte autorevole, e
in che data.

Serve a distinguere due situazioni che oggi sono **indistinguibili**, perché
entrambe si presentano come lista di allergeni vuota:

- *"verificato: non contiene allergeni"* — un dato dichiarato;
- *"mai dichiarato"* — un'assenza di dato.

Finché gli allergeni sono stati popolati in un'unica occasione a partire dal
documento ufficiale la distinzione non serviva. Serve dalla **Fase 3**, che
impone la dichiarazione allergeni alla creazione di un articolo nuovo
(§63-64): senza un posto dove scrivere "confermato, non ne contiene", quella
regola non è realizzabile e un articolo creato di fretta e lasciato a metà
risulterebbe identico a uno verificato.

- **Al cliente non cambia nulla**, in nessuno dei due casi: un articolo senza
  allergeni non mostra alcun blocco allergeni. Il silenzio è più prudente
  della dicitura "senza allergeni", che sarebbe un'affermazione positiva di
  cui risponde il locale, mentre l'assenza del blocco rimanda al documento
  allergeni ufficiale.
- **È un dato interno**, visibile solo nel pannello staff, dove permette di
  rispondere alla domanda "abbiamo verificato tutto?" guardando invece che
  ricordando.
- Va valorizzata a ogni salvataggio degli allergeni dall'editor, compresa la
  scelta esplicita "nessun allergene" (che scrive la data **senza** creare
  righe in `product_allergens` / `sauce_allergens`).
- La colonna richiede un `ALTER TABLE`: **migration versionata in `sql/`**,
  eseguita da Andrea nel SQL editor Supabase (§63-64: Claude Code non esegue
  DDL).

**Registro delle verifiche al 28/07/2026 (v29)**

Stato di partenza da cui nasce la colonna, ricostruito dall'inventario di
sola lettura del 28/07/2026 e chiuso con le conferme dell'utente in pari
data. Vale come fonte verificata ai sensi di questa sezione.

- **34 prodotti food su 34** → verificati. Di questi, **29** hanno almeno un
  allergene dichiarato e provengono dal documento allergeni ufficiale (§67,
  v21); **5** sono confermati **senza allergeni** dall'utente in data
  28/07/2026: **Patatine** (fritti), **Polpette di agnello** (fritti),
  **Dolmadakia** (sides), **Tabulì** (sides), **Lokum** (dolci).
- **7 salse su 7** → verificate. **5** hanno allergeni dichiarati; **2** sono
  confermate **senza allergeni** dall'utente in data 28/07/2026: **Ajvar** e
  **Ajvar piccante**.
- **21 bevande** (15 drink + 6 birre) → **non** verificate, colonna lasciata
  a NULL: restano fuori dal tracciamento (vedi sopra), e vanno compilate
  prima di poter essere dichiarate senza allergeni.

*Nota sul Tabulì*: risulta senza allergeni e **non è in contraddizione con
§21**, che cita il glutine del **bulgur** come accompagnamento della Bowl. Il
tabulì di KM è preparato **senza bulgur** (confermato dall'utente,
28/07/2026). Sono due voci distinte del menu.

*Tracciabilità di questa verifica iniziale*: non passa dal pannello, quindi
non produce righe in `staff_action_log`. La traccia sta qui e nel file di
migration versionato in `sql/`, che è la forma più solida — resta nella
storia del progetto invece che in un registro applicativo.

*Applicato (v30)*: le date sono state scritte nel database il 28/07/2026 con
le migration `sql/20260728_allergens_verified_at.sql` (colonne di verifica,
`is_vegetarian` sulle salse, backfill del registro) e
`sql/20260728_sauces_as_articles.sql` (badge, piccantezza, immagine sulle
salse). Post-check verificati: 34 prodotti food e 7 salse con data di
verifica, 21 bevande a NULL, 4 salse vegetariane per coerenza col flag vegano
e 3 ancora da compilare, zero incoerenze vegano/vegetariano.

**Effetto della migrazione delle salse (v32)**: con §30 le salse diventano
righe di `products` e i loro allergeni righe di `product_allergens`. Da quel
momento **ogni riferimento a `sauces` e `sauce_allergens` in questa sezione va
letto come `products` e `product_allergens`**, e il parametro che distingueva i
due tipi nel core allergeni sparisce. Le regole non cambiano di una virgola:
cambia il fatto che ne esiste una sola copia invece di due tenute allineate a
mano. Il trasferimento è **sicurezza alimentare** e segue le regole di §30:
stesso id, pre-check e post-check, prima si scrive il nuovo e poi si dismette il
vecchio.

**Badge "Vegetariano" sulle salse — risolto (v33)**: fino al 28/07/2026 il menu
pubblico spegneva a forza il flag vegetariano sulle salse, con un commento
anteriore alla v29 che affermava che quel dato non esistesse in tabella. Dalla
v29 esisteva, ed era valorizzato su 5 salse su 7: una salsa vegetariana ma non
vegana non mostrava alcun badge, pur avendo il dato dichiarato da una persona.
L'omissione sbagliava **per difetto** — non attribuiva all'articolo una
proprietà che non aveva — quindi non è mai stata un rischio di sicurezza
alimentare.

**Si è risolta per costruzione**, come previsto: la migrazione di §30 ha
eliminato il percorso di rendering separato in cui viveva quella forzatura, e
il badge è ricomparso senza che nessuno lo aggiustasse. **Verificato a schermo
su Black KM il 28/07/2026.**

*Restano 2 salse — Tzatziki e Yogurt — con il flag vegetariano a NULL, quindi
senza badge. Vanno dichiarate dall'utente, mai dedotte: si riconoscono perché
aprendo il form allergeni il selettore dietetico si presenta vuoto.*

**Rendering al cliente (fatto, v24)**: gli allergeni e il badge dietetico
sono mostrati al cliente. Ogni scheda prodotto con allergeni mostra un
blocco espandibile "Allergeni" (che al tap elenca gli allergeni; assente se
il prodotto non ne ha) e un badge dietetico unico dai flag ("Vegano" se
`is_vegan`, altrimenti "Vegetariano" se `is_vegetarian`). La **sezione
salse** mostra allergeni e il badge "Vegano" per le salse vegane. *Fino alla
v28 le salse avevano `is_vegan` ma non `is_vegetarian`, per scelta dichiarata
consapevole; la v29 riapre quella decisione e dà loro anche il flag
vegetariano (§30), quindi sulle salse potrà comparire anche il badge
"Vegetariano". Di per sé la v29 non cambia nulla a schermo: le differenze
visibili al cliente compaiono soltanto quando i nuovi campi delle salse
(vegetariano, badge, piccantezza) verranno compilati dal pannello.*
La soia della variante Planted è segnalata nel configuratore (v23).

**Stato (aggiornato in v40)**: i **dati** degli allergeni sono completi e
verificati (registro qui sopra), il **rendering** al cliente è fatto, i flag
legacy sono stati bonificati, e la **modificabilità dal pannello** — Fase 2A
dell'editor menu (§63-64) — è **costruita e verificata**, con le regole di
questa sezione: selezione dai soli 14 allergeni UE, mai testo libero, mai
deduzione, selettore dietetico a tre voci sul solo food, scrittura di
`allergens_verified_at`, log della lista prima/dopo.

**Resta da dichiarare, mai da dedurre**: **2 salse — Tzatziki e Yogurt** —
hanno il flag vegetariano ancora vuoto, quindi non mostrano alcun badge
dietetico. Si riconoscono perché aprendo il form allergeni il selettore
dietetico si presenta vuoto. E le **21 bevande** restano fuori dal
tracciamento, con la colonna di verifica a NULL: vanno compilate prima di
poterle dichiarare senza allergeni.

## 68. Sezione Impostazioni pannello staff — chiusure eccezionali (aggiunta dopo l'MVP iniziale, vincolante)

Prima parte costruita della "Sezione Impostazioni" prevista in §52-56.
Introduce nel pannello staff la nuova tab **Impostazioni** (accessibile
dalla stessa navigazione di Ordini/Storico/Menu). In questa fase la tab
contiene esclusivamente la gestione delle chiusure eccezionali; la
modifica degli orari base per giorno della settimana (§52-56, "Orari
base") resta un requisito futuro non ancora implementato e non fa parte
di questa specifica.

### 68.1. Modello dati

Nuova tabella `store_schedule_exceptions`:

- `id` uuid PK
- `store_id` uuid NOT NULL, FK → `stores.id`
- `exception_group_id` uuid NOT NULL
- `date` date NOT NULL
- `closure_type` text NOT NULL, valori ammessi: `full_day`, `lunch`, `dinner`
- `reason` text NULL
- `created_at` timestamptz DEFAULT `now()`
- `updated_at` timestamptz DEFAULT `now()`
- `created_by` uuid NULL (id staff user, per audit)

Il campo `exception_group_id` è il collante logico dell'eccezione. Tutte
le righe generate da una singola operazione dello staff (es. "Ferie dal
10 al 20 agosto, tutto il giorno" → 11 righe) condividono lo stesso
`exception_group_id`. La UI di gestione (§68.3) mostra e modifica
eccezioni **a livello di gruppo**, non riga per riga; il DB tiene una
riga per giorno per semplicità delle query di calcolo (§68.4). Se lo
staff crea due eccezioni distinte con le stesse date e turni (caso di
scuola, improbabile), esse restano gruppi separati con
`exception_group_id` diversi.

Vincoli:

- `UNIQUE(store_id, date, closure_type)` — impedisce duplicati identici
  anche appartenenti a gruppi diversi.
- Indice su `(store_id, date)` per lookup rapidi nelle query di calcolo
  delle finestre.
- Indice su `(store_id, exception_group_id)` per operazioni di gruppo.
- Regola applicativa (validata a livello API/UI, non come SQL constraint):
  per una stessa coppia `(store_id, date)`, o esiste **una** riga
  `full_day`, oppure esistono **al più due** righe distinte con
  `closure_type` `lunch` e/o `dinner`. Non è mai lecito avere
  contemporaneamente `full_day` e turni parziali per lo stesso giorno.
  Al salvataggio di una nuova eccezione l'API deve rifiutare il caso
  contraddittorio, con motivazione che indichi il giorno o i giorni in
  conflitto e le eccezioni preesistenti.

### 68.2. Tipi di chiusura supportati (basati sui turni di §13)

- **Tutto il giorno** (`full_day`): chiude entrambe le finestre pranzo e
  cena della data.
- **Solo pranzo** (`lunch`): chiude la finestra 12:00–14:30 della data.
- **Solo cena** (`dinner`): chiude la finestra 19:00–22:30 (Dom–Gio) o
  19:00–23:00 (Ven–Sab) della data.

I turni "pranzo" e "cena" corrispondono rispettivamente alla prima e alla
seconda finestra di `store_order_windows` (§13). Se in futuro §13 verrà
esteso a più di due finestre giornaliere, la nomenclatura e i valori
dell'enum andranno rivisti.

### 68.3. UI Impostazioni — gestione eccezioni

**Elenco eccezioni**:

- Le eccezioni sono mostrate **raggruppate per `exception_group_id`**:
  una eccezione multi-giorno appare come **una singola riga**, non come
  N righe distinte. La riga mostra l'intervallo (`data inizio – data
  fine`, oppure singola data se il gruppo copre un solo giorno), tipo
  di chiusura ("Tutto il giorno" / "Solo pranzo" / "Solo cena"), motivo
  se presente, pulsanti Modifica / Elimina.
- Ordinato per `data inizio` crescente, eccezioni future in cima.
- Filtro implicito: eccezioni interamente passate (tutte le righe del
  gruppo con `date < CURRENT_DATE`) nascoste di default, con toggle
  "Mostra passate" per revisione storica.

**Modale "Nuova eccezione"**:

- **Data inizio** obbligatoria, minimo = oggi.
- **Data fine** obbligatoria, default = data inizio, deve essere ≥ data
  inizio.
- **Turno**: radio button "Tutto il giorno" (default) / "Solo pranzo" /
  "Solo cena". La scelta si applica a **tutti** i giorni dell'intervallo
  (es. "solo cena dal 24 al 26 dicembre" → 3 righe, tutte `dinner`,
  stesso motivo, stesso `exception_group_id`).
- **Motivo** opzionale, campo testo libero, visibile **solo allo staff**.
  Il cliente non vede mai il motivo.
- Al salvataggio: creazione di N righe in `store_schedule_exceptions`,
  una per giorno dell'intervallo, con lo stesso `closure_type`, lo
  stesso `reason` e lo stesso `exception_group_id`.

**Avviso ordini colpiti** (obbligatorio, prima di salvare):

- Il sistema controlla se esistono ordini con `scheduled_delivery_at`
  cadente in un turno che verrà chiuso e con
  `payment_status IN ('succeeded','refunded')`.
- Se ne trova, mostra un modale di conferma con la lista degli ordini
  colpiti: codice ordine (`KM-XXXX`), data e ora della consegna
  programmata, importo, nome cliente. Lo staff può:
  1. **Confermare** la creazione dell'eccezione. Gli ordini restano in
     database nel loro stato attuale — vedi §68.5 sulla gestione
     successiva.
  2. **Annullare** la creazione dell'eccezione.

**Modifica eccezione**: opera **a livello di gruppo**
(`exception_group_id`). Consente di cambiare motivo, turno o intervallo
di date dell'intera eccezione con una singola operazione. Se cambia
l'intervallo, le righe DB del gruppo vengono ricreate coerentemente
(cancellazione delle righe fuori dal nuovo intervallo, inserimento
delle nuove, aggiornamento delle rimanenti). Le validazioni sono le
stesse della creazione (regola applicativa §68.1, vincolo UNIQUE), e
il controllo "avviso ordini colpiti" viene rieseguito considerando la
nuova configurazione.

**Nota implementativa sull'atomicità della PATCH (decisione operativa
accettata, non vincolante)**: la riconciliazione delle righe di un
gruppo è implementata validate-first (tutte le validazioni prima di
qualunque scrittura) seguita da una sequenza ordinata di
DELETE → INSERT → UPDATE via client PostgREST — che non supporta
transazioni multi-statement. In condizioni normali (rete stabile, DB
raggiungibile) il risultato è indistinguibile da un'operazione atomica.
In caso di errore intermedio raro (interruzione di rete a metà
sequenza, timeout del DB tra due chiamate) il gruppo può restare
parzialmente riscritto: alcune date cancellate ma non ricreate, oppure
nuove date inserite ma metadati vecchi non ancora aggiornati.
Comportamento accettato: (a) l'errore viene restituito all'UI staff,
(b) al ricaricamento della pagina lo stato reale del gruppo è
visibile, (c) lo staff può correggere manualmente (modifica o
elimina + ricrea). Non c'è impatto sui clienti: il calcolo del
semaforo e degli slot legge sempre lo stato attuale del DB, senza
dipendere dalla "correttezza" logica dell'ultima PATCH. Un upgrade a
funzione RPC Postgres (che porterebbe la riconciliazione lato DB con
transazione garantita) resta un miglioramento futuro se dovessero
mai emergere problemi ricorrenti sul campo.

**Eliminazione eccezione**: opera **a livello di gruppo**
(`exception_group_id`). Rimuove tutte le righe appartenenti al gruppo
con una singola operazione. Nessun impatto retroattivo sugli ordini —
la cancellazione riapre semplicemente la finestra per gli ordini futuri.

### 68.4. Effetti lato cliente durante una chiusura eccezionale

**Semaforo (§7)**:

- Nei turni chiusi da un'eccezione, il semaforo passa a **rosso** con
  testo dedicato:
  - `Siamo chiusi – Riapriremo alle [HH:MM]` se la prossima apertura utile
    cade nella giornata in corso.
  - `Siamo chiusi – Riapriremo [giorno data]` (es. `Siamo chiusi – Riapriremo
    lunedì 25 dicembre`) se la prossima apertura utile cade in un giorno
    successivo. Formato data: nome del giorno + numero + nome del mese in
    italiano, senza anno.
- Il calcolo della "prossima apertura utile" scandaglia in avanti nel
  tempo saltando: i giorni chiusi dagli orari base (§13, es. futuri
  giorni di riposo settimanali quando saranno editabili) e tutti i turni
  chiusi da eccezioni presenti in `store_schedule_exceptions`.
- Nei turni **non** interessati da eccezioni, il semaforo mantiene la
  logica standard di §7. Il cliente non vede alcuna differenza rispetto
  a una giornata normale.
- Il motivo dell'eccezione **non** viene mai mostrato al cliente.

**Consegna ASAP (§12, solo Delivery)**:

- Nei turni chiusi eccezionalmente, l'opzione "PRIMA POSSIBILE" viene
  rimossa dall'interfaccia (stesso comportamento già in vigore per il
  semaforo giallo/rosso, §12). Il Ritiro non ha un'opzione ASAP (§12b),
  quindi non è coinvolto da questo punto.

**Consegna programmata (§12) e Ritiro (§12b)** — regole identiche per le
due modalità, ciascuna applicata ai propri slot:

- Il selettore giorno mostra solo giorni con **almeno un turno aperto**
  nell'arco dei prossimi 2 giorni (§12 per la Delivery, §12b per il
  Ritiro).
- All'interno di un giorno aperto solo parzialmente, gli slot mostrati
  appartengono solo ai turni non chiusi. Esempio: se in un giorno solo
  il pranzo è chiuso, il selettore mostra unicamente slot cena; se solo
  la cena è chiusa, mostra solo slot pranzo.
- Se sia oggi sia domani sono interamente chiusi (per orari base o per
  eccezioni), non esiste alcuno slot disponibile, in nessuna delle due
  modalità.

**Ordine impossibile (checkout bloccato — unico caso previsto)**:

- **Vale per entrambe le modalità** (correzione v14): fino alla v13 questo
  blocco era descritto in termini di sola consegna ed era implementato solo
  per la Delivery, perciò un ordine di Ritiro passava anche a locale
  interamente chiuso.
- **Delivery**: blocco se non è disponibile né ASAP né alcun giorno/turno
  di consegna programmata nei prossimi 2 giorni.
- **Ritiro**: blocco se non è disponibile alcuno slot di ritiro nei
  prossimi 2 giorni (§12b).
- In entrambi i casi il cliente vede un messaggio esplicito nel checkout:
  `Al momento non stiamo ricevendo ordini. La prossima apertura è [giorno
  data] alle [HH:MM].` Il pulsante di pagamento è disabilitato. Il
  carrello resta comunque salvato per quando riapriremo (§9).
- Il blocco lato client non è sufficiente: la stessa condizione va
  riverificata lato server (§46b).
- Questo è l'**unico caso in cui il checkout viene bloccato** in base
  allo stato del servizio. §7 stabilisce che il checkout non venga
  bloccato in base all'orario del semaforo standard: qui la motivazione
  è diversa — non esiste alcun momento possibile, di consegna o di
  ritiro, nel raggio temporale operativo (2 giorni), quindi accettare
  l'ordine sarebbe una promessa che non possiamo mantenere.

### 68.5. Ordini programmati per giorni che diventano chiusi

Come stabilito al momento della creazione dell'eccezione (§68.3, "Avviso
ordini colpiti"), gli ordini con `scheduled_delivery_at` cadente in un
turno chiuso restano in database nel loro stato attuale, **non vengono
annullati automaticamente**. Lo staff dovrà contattare manualmente i
clienti coinvolti (telefono già presente in ordine) e, a seconda del
caso, riprogrammare l'ordine concordando un nuovo orario oppure
annullarlo con la procedura §62b (rimborso automatico se non ancora in
preparazione, GIVEMEFIVE rilasciato).

Dalla v14 la regola vale identica per gli ordini **Ritiro**, che hanno
anch'essi un orario concordato salvato in `scheduled_delivery_at` (§12b):
anche loro restano in database e vanno gestiti con un contatto umano.

Nessun cliente riceve automaticamente comunicazioni: la comunicazione
resta un'azione umana esplicita. La scelta protegge dai casi in cui un
cliente riceverebbe un annullamento algoritmico senza contesto, mentre
in realtà la situazione è recuperabile con un semplice contatto.

## 70. Esplicitamente NON nell'MVP

Account/login cliente, punti/loyalty, referral, app nativa, integrazione
Cassa in Cloud, automazione Glovo API, mappa live rider, CRM avanzato,
dashboard business complessa, AI, reportistica sofisticata — ma il sistema
va predisposto per aggiungerli in futuro.

## 71. Roadmap

Fase 1: web app cliente + Stripe + pannello staff + inserimento manuale
Glovo. Fase 1.1: WhatsApp. Fase 2: integrazione API Glovo. Fase 3: account
cliente, riordina, preferiti, loyalty, CRM. Fase 4: cassa, automazioni,
reporting, multi-store pieno.

## 73. Regola d'oro

Non riaprire decisioni già approvate senza un motivo concreto.
