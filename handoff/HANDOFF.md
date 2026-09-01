# KM Direct — HANDOFF

Documento per riprendere il progetto in una nuova sessione senza rileggere la
cronologia. Contiene **stato attuale** e **to-do**. Le decisioni e la loro
motivazione stanno in `MASTER_SPEC.md`; la storia dei tentativi sta nei commit.

---

## 1) Cos'è il progetto

Web app per ordini **delivery e ritiro** di **FAME Srl / KM Kebab Mediterraneo**
(Bologna, store `san-mamolo`). Stack **Next.js 14 + Supabase + Stripe (sandbox)**.
Repo: **github.com/Kebabmediterraneo/km-direct** (branch `main`, push via SSH).
La fonte di verità di tutte le decisioni è **`MASTER_SPEC.md`**. ⚠️ **La
versione si legge SEMPRE dalla riga 3 della spec, e non è scritta qui.** *Fino
al 09/08/2026 questa riga ne portava una copia: era rimasta a v64 mentre la
spec era alla v67, tre versioni indietro. Il numero è stato tolto invece che
aggiornato — una copia che va tenuta in pari diverge sempre, perché prima o poi
nessuno se ne ricorda.*

---

## 2) Stato git

- Branch **`main`**, working tree **pulita**.
- HEAD locale: **`e9ad192`**; `origin/main` a **`512d46d`**, cioè **un commit
  indietro** al momento in cui questa riga è stata scritta.
- ⚠️ *Questa riga non può nominare il commit che la contiene, e il push deciso
  per la fine della sfoltitura la rende vecchia di due commit. **Chi la legge
  chieda a git lo stato vero invece di fidarsi di qui**: quello che serve
  ricordare è che i commit sotto ci sono tutti.*
- Ultimi commit (dal più recente):

```
e9ad192 handoff: sfoltite le giornate 18-25 da 714 a 565 righe, la lezione bp doppia sciolta in ee, la verifica della service_role dichiarata scaduta
512d46d handoff: sfoltita 2 - il to-do riscritto, coi lavori chiusi a una riga e i cinque fatti sul codice che vivevano solo dentro il racconto tenuti per intero
9f34b12 handoff: sfoltita 1 - i nove elenchi di cose aperte superati spariscono e ne resta uno solo, con dentro le cinque voci che stavano solo li' e che nessun elenco piu' recente aveva ripreso
f843cce handoff: punto 39, il 4b-2a provato dal vivo sul sito, la giornata spesa a misurare prima di scrivere e le tre lezioni nuove
fc48341 docs: v79 - il 4b-2a col pulsante della conferma prezzo che non guardava canSave, la misura che dice che nessun articolo diventa non salvabile, i controlli che sono cinque e non quattro, e l'ordine di prova del riquadro
f8de6ea prove: le nove sonde che eseguono le espressioni vere dei due pulsanti e li confrontano sugli stessi valori, con la controprova che l'annulla del riquadro non e' sorvegliato da nessuna
8422ef8 pannello: il pulsante conferma e salva guarda canSave come il salva, perche' chiama salvaModifica dritta e la guardia di handleSubmit non sta sulla sua strada
b21cb50 handoff: punto 38, il 4b-1 e le tre prove che non controllavano niente
6918988 spec v78: 4b-1 fatto e provato dal vivo, il 4b in tre passaggi
7acd543 prove 4b-1: sei sonde sul salva spento e cinque sull'avviso
7624498 pannello 4b-1: salva spento finche' le opzioni non sono lette, avviso sulle scelte non disegnabili
4d85965 handoff: punto 37, il 4b letto per intero senza scrivere codice
e788ee1 spec v77: decisioni del passo 4b, misura sui dati veri, dominio e chiave Google
6fca3ba handoff: stato al 26/08 — quattro passi della fusione in un giorno, il guasto evitato leggendo il cuore prima di scrivere la scheda, e le due reti
905c4a0 docs: v76 — i passi 1, 2, 3 e 4a fatti e provati dal vivo, la ragione grave per cui il passo 4 e' spezzato in due, e la decisione LL sulla rotta che legge le opzioni
b22f23e pannello: la scheda mostra le opzioni che l'articolo ha gia', lette dalla rotta nuova, spente e coi tre esiti tenuti distinti a schermo
18388db prove: d1 smette di vietare una parola e sorveglia la regola vera, che il pannello non tocchi il database, con le controprove nei due versi
719cdbb prove: il cuore che legge le opzioni, con la controprova che un guasto di lettura non diventa quattro liste vuote
6c29d4f menu: il cuore e la rotta che leggono le opzioni di un articolo, con la lettura tolta dal cuore che salva e messa in un posto solo
8d3e79c prove: la seconda rete, sugli undici campi che il corpo della modifica manda oggi, con l'assert che sorveglia il confine fra i due ritagli
07b0960 pannello: la scheda unica salva anche gli allergeni, chiamando quella rotta solo se sono stati toccati e spegnendo il salva quando manca il tipo dietetico
ac75ab5 pannello: la scheda unica si apre precompilata su un articolo e ne salva i sei scalari, coi pezzi non ancora salvabili spenti e detti
922024e pannello: la scheda che crea prende il nome del suo ruolo nuovo, ProductForm con onSaved, primo dei sette passi verso la scheda unica
eff8c82 handoff: stato al 25/08 — la giornata delle decisioni, la scheda di modifica che sa sei campi su ventuno e le otto rotte del menu di cui una senza chiamanti
3ac16f6 docs: v75 — la schermata unica con le quattro decisioni nuove, l'ordine di costruzione in sette passi e il salva che chiama solo le rotte dei pezzi toccati
d04a270 handoff: stato al 24/08 — la rete prima della fusione, i dodici campi che il server accetta in silenzio e la schermata lasciata da cominciare da fresca
adbd155 docs: v74 — la rete prima della fusione, coi dodici campi che il server accetta in silenzio e la frase della v72 corretta perche' era troppo larga
477cd00 prove: l'elenco chiuso dei ventuno campi che il modulo di creazione manda oggi, fissato prima della fusione, con le controprove prese dal file che lo fanno diventare rosso nelle due direzioni
718fd18 handoff: stato al 13/08 — la modifica delle opzioni per due terzi, e la lezione che una regola scritta non e' una regola letta
1a54810 docs: v73 — la modifica delle opzioni col suo scudo, e la regola del reset notturno che era scritta da sei giorni e il 12/08 e' stata violata lo stesso
e4ea910 menu: la rotta che espone l'aggiornamento delle opzioni, sottile come le altre e senza logica propria, col catalogo delle proteine letto solo quando servono
d9bec2a menu: la creazione trattiene un articolo incompleto con is_in_menu e non con is_available, che il reset del mattino rimetterebbe in vendita da solo
5cfa3bc menu: il cuore che aggiorna le opzioni di un articolo esistente, con l'articolo tolto dal menu prima di toccarlo e rimesso come ultimo atto
8e44f3e handoff: stato al 12/08 sera — la Fase 4 chiusa in sei commit, il buco della proteina che c'era da sempre, e le dodici decisioni di una giornata sola
59f5a20 docs: v72 — la Fase 4 e' fatta e non resta piu' nessuna fase pre-go-live, col buco della proteina che c'era da sempre e la procedura per aggiungerne una nuova
3b461c9 menu: il pannello crea Roll e Bowl complete di proteine, rimozioni, accompagnamento ed extra, coi due elenchi letti dal database invece che scritti a mano
772a09f sql: la cancellazione del Roll di prova della Fase 4, gia' eseguita da Andrea nel SQL editor con esito zero righe
0a72be1 menu: il catalogo delle proteine si legge dal database e si ferma se una chiave avesse due etichette diverse, perche' sceglierne una attaccherebbe al prodotto nuovo un nome che gli ordini non ritroverebbero
854a8ce menu: il titolo che il cliente legge sopra le proteine si scrive dal pannello, uno per gruppo, e senza vale la frase dei Roll di oggi invece del predefinito del database
746e48b menu: la creazione scrive anche le opzioni, e un articolo che le ha nasce spento e si accende come ultimo atto, cosi' un guasto lo lascia visibile e irraggiungibile dai clienti
4f86ce3 menu: il modulo che valida le opzioni di un articolo — proteine col sovrapprezzo anche zero, rimozioni, accompagnamento obbligatorio sulle bowl ed extra col loro tetto
fb40ed6 proteina: se un prodotto ne ha, sceglierne una diventa obbligatorio, e il sito smette di preselezionare la prima quando nessuna e' indicata
85216ea handoff: stato al 12/08 — il prefisso internazionale e l'indirizzo in scheda, col difetto che si sarebbe aperto in silenzio appena la tendina avesse composto i numeri
f433d17 docs: v71 — il prefisso internazionale con la tendina che comanda, il numero salvato in una forma sola per tutti, e le due righe che erano diventate false corrette
68ae852 pannello: la scheda ordine mostra l'indirizzo di consegna con citofono, piano, scala e note per il rider, saltando le righe che il cliente non ha compilato
dcfdfd3 telefono: la tendina dei prefissi con la bandiera, il numero che parte col +39 davanti in una forma sola per tutti, e il file per il rider che smette di indovinare
b9a1414 telefono: il paese comanda sulla forma del numero, e un +39 davanti non fa piu' saltare le regole italiane come sarebbe successo appena la tendina avesse composto i numeri
ca2fe94 handoff: stato all'11/08 sera — il telefono controllato, la privacy obbligatoria e la rete sul file per il rider, col fuso che si vede solo in produzione e il conteggio delle suite che era rimasto fermo a diciotto
76f9838 docs: v70 — il telefono ora si controlla, con le sette decisioni di Andrea e il perche' di ciascuna, e la scoperta che un fuso ereditato invece che dichiarato si vede solo in produzione
a8402e4 telefono: un modulo unico decide se il numero e' valido, importato dal server e dal sito, con l'Italia a 9 o 10 cifre che iniziano per 0 o 3 e una frase sola che dice al cliente perche' quel numero serve
be068f9 prove: il file che va al rider era completamente scoperto, e la controprova ha trovato che senza il fuso dichiarato l'orario sarebbe sbagliato solo su Vercel mentre in locale tutto resterebbe verde
2ea4a8e privacy: la casella dice (OBBLIGATORIO) perche' non si capiva che il consenso fosse necessario, e una suite nuova veglia quella frase e lo stopPropagation che impediva di spuntarla aprendo l'informativa
d8fe6b7 handoff: stato all'11/08 — GIVEMEFIVE spostato davvero in cinque commit e provato dal vivo, con cio' che la costruzione ha insegnato e che le decisioni non sapevano
e3c7611 docs: v69 — lo spostamento di GIVEMEFIVE e' fatto e provato dal vivo, col guasto che non concede lo sconto, il codice che sopravvive alla riapertura ma riverificato, e il pedaggio scritto per quel che costa davvero
8df6018 sconto: il carrello smette di nominare GIVEMEFIVE e il campo del checkout resta l'unico interruttore, con le prove capovolte a sorvegliare che nessuno lo rimetta
d2ebc41 sconto: il codice scritto sopravvive alla riapertura ma il server lo riverifica quando i dati tornano completi, mai dato per buono e mai verificato all'apertura quando i consensi sono ancora da rifare
b6f6434 sconto: il campo del codice nel checkout, che chiede alla rotta e mostra la frase che riceve, col carrello lasciato acceso perche' si spegne solo dopo
e03bb4c sconto: la rotta che risponde se GIVEMEFIVE spetta, col pedaggio affidato al validatore del pagamento intero, senza guardare gli orari e senza scrivere una riga da nessuna parte
c164b3b sconto: il cuore che dice se GIVEMEFIVE spetta, col subtotale ricalcolato dai lettori ricevuti come parametri e il guasto di lettura che NON concede lo sconto, all'opposto della rotta del pagamento
5b61976 handoff: stato al 10/08 — GIVEMEFIVE ridisegnato col campo del codice sconto nel checkout, la strada B che non riapre la rotta del pagamento, e le due cose lasciate aperte apposta
319feff docs: v68 — GIVEMEFIVE sparisce dal sito e si chiede scrivendo il codice nel checkout, con la verifica che risponde solo a un ordine compilato sopra soglia e le sei risposte del campo fissate parola per parola
972389e docs: l'handoff dichiarava la spec alla v64 mentre era alla v67, numero tolto invece che aggiornato perche' una copia da tenere in pari diverge sempre
ec84ea5 docs: v67 e handoff — i diciassette fontFamily tolti e i commenti del CSS allineati, con la ragione per cui quella pulizia e' sicura senza che nessuna prova guardi lo schermo
f1955af css: i due commenti dicevano che i fontFamily sono sparsi nel codice, ma da f3422b3 nel codice non ce n'e' piu' nessuno
f3422b3 font: via i diciassette fontFamily inherit riga per riga, resi inutili dalla regola in globals.css che riporta tutti i moduli nell'eredita'
7a0f0be docs: v66 e handoff — le costanti dello sconto in un modulo unico con la prova che le sorveglia, e la sezione nuova sulle tre cose fuori dal codice da fare prima di incassare
a7ebbdf prove: una suite verifica che i nomi importati dal modulo delle costanti esistano davvero e che li' dentro non entrino funzioni, perche' next build su un import inesistente compila in silenzio
11b3ce6 sconto: soglia importo e nome di GIVEMEFIVE in un modulo unico importabile anche dal browser, perche' le due copie potevano divergere mostrando al cliente uno sconto che il server non concede
34646c9 docs: v65 e handoff — il freno di GIVEMEFIVE deciso di non costruirlo perche' la rotta non rispondera' piu' su un numero ma solo a un checkout compilato, con la difesa che sta sul ricalcolo della soglia lato server
efabb37 docs: v64 e handoff — il font Termina con la regola che riporta i moduli nell'eredita', i quattro ritocchi al sito, il cuore dello sconto estratto e provato, e lo spostamento di GIVEMEFIVE deciso ma bloccato perche' un freno nel progetto non esiste
770dcf9 sconto: il cuore di GIVEMEFIVE esce dalla rotta in un modulo provabile col client come parametro, comportamento identico verificato su 112 casi contro il codice vecchio preso da git
fd6eeb0 sito: l'indirizzo chiesto prima del carrello perche' ci si arrivava in fondo senza, oggi e domani affiancati cosi' si vede che la tendina vale per entrambi, asterischi sui campi obbligatori letti dalla validazione, e il preordine detto per quello che e'
8689599 font: Termina da Adobe Fonts al posto del sans-serif di sistema, con i moduli riportati nell'eredita' perche' il browser li tiene fuori e tre quarti dei pulsanti restavano col carattere del sistema
4894899 docs: v63 e handoff — togli dal menu chiuso in sei pezzi, il rientro rimette la disponibilita', due liste nel sito cliente e le birre sulla piena perche' la casella dei 18 anni sparirebbe, piu' la finestra del pagamento dopo Stripe che nessuno controlla
f9a8470 carrello: il combo con la bibita non ordinabile nomina la bibita invece del solo Roll, perche' il cliente non sapeva che gli bastava cambiarla
05ac016 pagamento: le tre letture su products rifiutano anche l'articolo fuori menu, accanto al filtro sulla disponibilita' e non al suo posto
200b94d sito: l'articolo fuori menu sparisce dalla vista con due liste e non una, perche' il carrello deve poterlo vedere per dirne il nome e l'upsell per classificare una riga gia' nel carrello
ba05531 menu: il pulsante occhio di togli-dal-menu e lo stato spento, che nel pannello non esisteva e distingueva un tasto disattivato solo dal cursore, assente sul telefono
ec54cc2 menu: cuore e rotta di togli-dal-menu, con is_available rimessa a true al rientro perché un articolo tolto mentre era esaurito non sarebbe più raggiungibile dal pannello
74a3b6b sql: colonna is_in_menu su products per togli dal menu, eseguita il 07/08
2d928bf spec: v62 — togli dal menu con occhio barrato al posto del cestino, pulsante quadrato perché la riga è piena, e lo stato spento da costruire
8c46f2a handoff: stato a fine 06/08 — la bibita del combo corretta e provata, la guardia sulle scelte vuote, tre lezioni nuove
c6392d9 spec: v61 — bibita del combo corretta e provata, guardia sulle scelte vuote col difetto Roll preesistente, lo shortcut Fallo combo non esiste
1a48a93 combo: il builder non si propone se una delle tre scelte è vuota
d8f034d combo: la bibita rispetta la disponibilità del prodotto in menu, checkout e carrello
f750ee2 spec: v60 — la bibita del combo ignora la disponibilità del prodotto, decisa una disponibilità sola e il carrello che si svuota col motivo
```

⚠️ **QUESTO ELENCO VA RIGENERATO DA `git log`, MAI RICOPIATO NÉ RICOSTRUITO A
MEMORIA** — l'avvertenza vale per l'elenco intero e non per singole righe, che è
il rimedio della lezione `br`: marcare le voci che ci si ricorda di aver
inventato lascia le altre affidabili per contrasto. *Il 06/08/2026 questo blocco
è stato riscritto tre volte prima di essere giusto: quattro messaggi ricostruiti
a memoria, poi un quinto che nessuno aveva marcato.*

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

*Caso del 26/08/2026: distanza **uno**, ma ⚠️ **la giornata porta OTTO commit
di codice e prove** prima della spec `905c4a0` — la più piena finora. *Il passo
1 è del **25/08 sera**, dopo che l'handoff di quel giorno era già stato
committato: per questo `922024e` non compare nel registro di ieri.**

*Caso del 25/08/2026: distanza **uno**, e ⚠️ **zero commit di codice**: la
giornata è di sole decisioni e ricognizione, quindi fra la spec `3ac16f6` e
questo documento non c'è nient'altro.*

*Caso del 24/08/2026: distanza **uno**, e il solo commit di codice della
giornata — la sonda `477cd00` — è prima della spec `adbd155`. ⚠️ Ma stavolta
c'era anche una distanza **all'indietro**: `718fd18`, l'handoff del 13/08, non
compariva nel registro perché è il commit che quel registro l'ha scritto. Il
documento arrivava quindi in questa sessione con **due** commit non nominati,
non uno.*

*Caso del 13/08/2026: distanza **uno**, e i tre commit di codice della giornata
sono tutti prima della spec `1a54810`.*

*Caso del 12/08/2026 sera: distanza **uno**, e i sei commit della Fase 4 sono
tutti prima della spec `59f5a20`.*

*Caso del 12/08/2026 mattina: distanza **uno** ancora una volta — passa la sola spec
`f433d17`, e i tre commit di codice della giornata sono tutti prima di lei.*

*Caso dell'11/08/2026 sera: distanza **uno** anche stavolta — fra lo stato
fotografato e questo documento passa la sola spec `76f9838`, e i tre commit di
codice della serata sono tutti prima di lei.*

*Caso dell'11/08/2026 mattina: di nuovo distanza **uno**, e per la stessa ragione — fra
lo stato fotografato e questo documento passa la sola spec `e3c7611`. I cinque
commit di codice della tappa sono tutti PRIMA della spec, non in mezzo.*

*Caso del 10/08/2026: la distanza è di **uno**, e va bene così. Fra lo
stato fotografato e questo documento passa la sola spec `319feff`, perché la
giornata non ha prodotto commit di codice: le decisioni della v68 sono arrivate
prima che si scrivesse una riga. **Non è da correggere.***

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
   *Nota su questo file* — ⚠️ **CORRETTA IL 27/08/2026, DICEVA IL FALSO.**
   Fino a quel giorno qui era scritto che `handoff/HANDOFF.md` **non termina
   con un a capo**. Code ha controllato l'ultimo byte: il file **termina con
   a capo** (`0a`), e ci terminava **anche la versione vecchia già nel repo**.
   *Non è cambiato niente il 27/08: era la nota a descrivere una condizione
   che non si verificava. Resta valido il resto — un editor che "sistemasse"
   un file cambierebbe l'impronta senza cambiare una parola. È la stessa
   famiglia del commento sul pulsante Salva (lezione `de`): un paragrafo che
   diceva il vero in un altro momento e che nessuno rileggeva.*
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

**Lezioni di verifica — nove famiglie**

⚠️ **Il 05/08/2026 le 48 lezioni sono state raccolte in nove famiglie più cinque
isolate.** Dicevano in gran parte la stessa cosa da angolazioni diverse: `at`
dichiarava di essere `ak` in altra forma, `bl` di essere `z` "in forma
documentale", e `w` e `av` la stessa regola a undici mesi di distanza.

⚠️ **Le lettere sono conservate tutte**, perché i due documenti vi rimandano per
lettera: chi cerca la lezione `bc` deve trovarla. **Il testo però è uno per
famiglia**, e l'episodio che l'ha generata resta solo dove insegna qualcosa che
la regola generale non dice. *Le versioni per esteso sono nel deposito, ultima
integra al commit `fce1323`; misurato il 28/08 (vedi 39i).*

---

**1 — `w` `u` `ap` `aq` `av` `an` `bb` `bc` `bh` `bm`: una sonda che non può
fallire non sta controllando, e una che non trova non ha detto "non c'è".**

Ogni risultato negativo va accompagnato da una **controprova** su un caso che
esiste di sicuro: se la stessa sonda, puntata su un bersaglio noto, non lo trova,
lo zero non è una risposta ma una cecità. E la sonda va costruita **sulla forma
vera del file**, letta prima: un filtro tarato su come ci si immagina il testo
misura le proprie aspettative.

*Le forme in cui è già costata:* un `includes` che non conta ciò che il documento
manda a capo dentro la frase (`bc`); una variabile vuota che nel filtro
corrisponde a **tutto** invece che a niente (`aq`); un guard che confrontava
numeri come testo e falliva su un file integro (`an`); un conteggio che non
vedeva le righe vuote, e un altro che saltava le righe di separazione — due
volte lo stesso difetto, entrambe nel dichiarare gli attesi di un diff (`bm`); un
referto troncato a cento righe che sembrava completo (`bh`); un guard che non
poteva fallire come dichiarava (`bb`); e **lo strumento di verifica stesso che
mente** (`u`).

**2 — `at` `ak` `az` `aw` `ay` `bk`: ciò che si può eseguire non si ricorda e non
si rilegge.**

Un conteggio si esegue, non si `grep`a. Ciò che un comando dichiara va letto dal
file, non dalla memoria di chi l'ha scritto. E **quando un documento descrive il
codice, quella descrizione è una supposizione finché il codice non la conferma**
— vale prima di pubblicarla (`ay`) e **anche prima di usarla come premessa di un
ragionamento** (`bk`).

⚠️ *Il caso peggiore, da tenere presente ogni volta:* la **v46 fu pubblicata con
una descrizione falsa della sua regola più pericolosa**. La frase suonava giusta,
era coerente, l'aveva scritta chi il codice l'aveva appena toccato. L'ha smentita
solo l'esecuzione (`aw`).

**3 — `aj` `ah` `am` `ae` `be` `bl` `bf`: una nota di stato lasciata indietro
mente con l'autorità del documento.**

Chi legge non sa che quel punto è vecchio: gli sembra la fonte di verità. Da qui
tre regole operative: **prima di dire che la spec non dice, cercare**; quando
cambia la versione **i punti da correggere sono due**, non uno; e un numero
fornito **a voce** finisce nei documenti e ci resta — chi lo fornisce deve averlo
**eseguito**, non ricordato.

⚠️ *La forma più insidiosa:* **due misure della stessa grandezza, incompatibili,
scritte lo stesso giorno in due documenti** — ciascuna verificata nel proprio
contesto, nessuna che rileggesse l'altra (`bl`). Quando la stessa grandezza
compare in due punti, **il confronto fra i due è esso stesso una verifica**, e
costa una lettura.

**4 — `s` `z` `ao` `x`: un elenco si costruisce leggendo, mai per differenza né a
memoria.**

Non basta rileggere: bisogna sapere **dove**. Le zone di un diff si dichiarano
con la sezione in cui atterrano, perché un totale che torna non dimostra che le
modifiche siano finite nel punto giusto. E una ricognizione fatta a metà lascia
assunzioni che poi nessuno rimette in discussione.

**5 — `bd` `ai` `aa` `bn`: l'identità di un file si verifica dall'impronta, mai
dal nome.**

Righe e byte non identificano: **solo lo `sha256` distingue**. Prima di
riscrivere un file si verifica anche l'impronta di **quello che si sta per
sovrascrivere**, altrimenti il confronto che segue non ha significato.

⚠️ *Perché non è teoria:* il browser **non sovrascrive** i file scaricati, ne
salva accanto uno nuovo con un altro nome. Il 05/08/2026 è successo **tre volte
di fila**, e ogni volta il file col nome più naturale era quello **vietato** —
una volta la versione già committata, una volta una versione difettosa. Chi
avesse copiato "il file dai download" avrebbe riportato indietro il lavoro **in
silenzio**. *E dal fatto "non c'è più" non si conclude chi l'abbia tolto: una
volta l'aveva cancellato Andrea a mano, e la deduzione portava alla conclusione
giusta per il motivo sbagliato.*

**6 — `t` `v` `ar`: una verifica impossibile si dichiara, non si aggira.**

Se si approva su una prova indiretta, va scritto **su cosa poggiava il sì**.
Attenzione alla formula "verificato sul codice vero", che suona come una prova e
spesso è una lettura.

**7 — `ad` `as` `ac` `ab`: una prova di rifiuto vale solo se è attribuibile.**

Due cose cambiate insieme rendono un'anomalia non attribuibile a nessuna delle
due. Una prova va descritta indicando **quale comando premere**, e va verificato
che il rifiuto **non abbia scritto nulla** — e che la prova raggiunga davvero il
punto che crede di raggiungere.

**8 — `ag` `ba`: si identifica dal dato che caratterizza, mai dalla posizione o
dalla forma attesa.**

Una condizione scritta sulla forma che ci si aspetta funziona finché la realtà
ha quella forma, e smette in silenzio quando cambia.

**9 — `al` `bi` `bj`: un difetto che non fa rumore è peggio di uno rumoroso.**

Un freno che scatta a torto **insegna ad aggirarlo**, ed è peggio di un freno
assente. Un'istruzione che manda a leggere un dato che il referto non produce
spinge verso la cosa più a portata di mano, che è quasi sempre quella sbagliata.
E un meccanismo che funziona in un punto **non si trasferisce da solo** a quello
accanto.

---

**Le cinque isolate**

`af`. **Una fotografia di verifica non si rigenera**: rifatta dopo il
cambiamento coincide sempre e non dimostra più nulla.
`ax`. **Le impronte proteggono il trasporto, non il senso**: un file può arrivare
integro e dire una cosa sbagliata. Servono anche controlli sul contenuto.
`au`. **Lo spazio di contesto si controlla prima**, non quando finisce.
`y`. **Il server si spegne dopo ogni verifica**, per non lasciarne due accesi.
`bg`. **Una frase di un fornitore non è un dato da cui calcolare.**

---

**Lezioni aggiunte il 05/08/2026 (la sfoltita dei documenti)**

`bo`. ⚠️ **I più e i meno di un diff dipendono dall'algoritmo; il netto no.**
Dichiarando gli attesi di una copia, la mappa è stata sbagliata **due volte di
fila**. La seconda causa è stata misurata: **cinque algoritmi sullo stesso
identico confronto danno cinque conteggi diversi** — da `+261/−1001` a
`+305/−1045` — e **un solo netto, sempre**. Sul Mac di Andrea `diff` è quello di
FreeBSD, non GNU, quindi "usare lo stesso strumento" non era nemmeno possibile.
*Quindi: si dichiarano **il netto e il conteggio finale delle righe**, che sono
invarianti, più gli **intervalli** in cui ogni zona atterra. I più e i meno per
zona restano utili come indizio, non come blocco.*

`bp`. ⚠️ **Chi taglia per intervalli di righe non legge il contenuto, e cancella
anche gli avvertimenti.** Nella sfoltita del 05/08 la sezione `## 11) Stato dei
dati` è stata cancellata perché compresa in un intervallo di righe etichettato
"diario", mentre è **stato vivo**: dentro c'erano i conteggi validi, due voci
aperte sugli allergeni e una regola di validazione. *La cosa da ricordare non è
l'errore ma la sua forma:* **quella sezione conteneva, dalla sua stesura, la
frase "se questa sezione sparisse, non resterebbe traccia da nessuna parte"** —
l'avvertimento era esatto, era nel posto giusto, ed è stato inutile. Nello stesso
comando l'istruzione diceva **correttamente** di conservarla: istruzione giusta,
taglio sbagliato, e nessuno ha notato la contraddizione.
*Rimedio: un taglio si esegue sull'elenco delle **intestazioni** e del loro
contenuto, mai su un intervallo numerico ricavato da un referto; e chi verifica
riceve l'elenco di ciò che **deve restare**, non solo di ciò che deve sparire.*

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
- **Editor menu — FASE 3** (§63-64): creazione di articoli semplici dal pannello.
- **Il font Termina** (§6b) — *08/08/2026*: famiglia dell'immagine coordinata
  applicata a sito e pannello da un punto solo, più la regola che riporta i
  moduli nell'eredità. Racconto al punto **24**.
- **Il cuore dello sconto** (§14, §46) — *08/08/2026*: la validazione e il
  calcolo del totale escono dalla rotta in un modulo provabile. ⚠️ *Lo
  **spostamento** di GIVEMEFIVE nel checkout è invece deciso e NON fatto —
  e il disegno è **cambiato il 10/08/2026**: niente più sconto che compare da
  solo, ma un **campo dove il cliente scrive il codice**. Le decisioni valide
  sono quelle di **spec §14 v68**; il racconto è al punto **28**. Il punto 24 e
  la v65 restano leggibili ma sono **superati**.*
- **"Togli dal menu"** (§63-64) — *chiuso il 07/08/2026, sei pezzi, provato dal
  vivo*: terzo stato accanto a disponibile ed esaurito, colonna `is_in_menu`,
  pulsante occhio in coda alla riga, stato spento visibile anche sul telefono,
  due liste nel sito cliente, filtro al pagamento e messaggio del carrello che
  nomina la bibita. Racconto al punto **23**.
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
**dodici** sezioni originali — undici giornate più lo Stato dei dati, che è
stato **riscritto e non tolto** — sono nel deposito, ultima versione integra al
commit `254ffad`. ⚠️ **Non `fce1323`**, che è un'altra correzione e riguarda le
lezioni (vedi 39i): verificato il 28/08 contando le dodici intestazioni esatte
su tutti i 298 commit del deposito, con le controprove nei due versi. La
sostituzione sta in `fce1323`, che git data **06/08 01:47**, non il 05/08: sul
05/08 ci sono due commit al file e nessuno dei due tocca il diario.*

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

⚠️ **Il numero di suite qui sotto è stato trovato FERMO A DICIOTTO l'11/08/2026
sera, mentre erano 24**: nessun confronto di zone attese poteva vederlo, perché
non è una zona che il lavoro del giorno prevedeva di toccare (lezione `cm`).
*Chi aggiorna questo documento riguardi SEMPRE questo blocco: è il posto dove
qualcuno va a leggere quante prove ci sono, quindi un numero vecchio qui mente
con l'autorità del documento (lezione `aj`).*

**Trentaquattro suite** in `tests/` e **1658 prove**, verdi al **26/08/2026**,
letti dall'esecuzione e non contati a mano. *Il 26/08 le suite si sono mosse da
33 a 34, ed **era voluto**: la suite nuova è quella del lettore delle opzioni,
che è un modulo nuovo. Le due sonde dei campi invece stanno **dentro suite
esistenti**, e infatti non avevano mosso il conteggio.* Tutte con estensione
**`.mjs`** e non `.js`,
perché vanno eseguite da Node fuori da Next. In `package.json` **non esiste uno
script `test`**: si lanciano una per una con `node tests/<nome>.test.mjs`, o
tutte con
`for t in tests/*.test.mjs; do echo "== $t"; node "$t" || echo "FALLITO: $t"; done`.
⚠️ `tests/checkout-timing.test.mjs` **costa circa 7 secondi**: provoca un guasto
di lettura reale puntando il client a una porta chiusa, e il client impiega quel
tempo ad arrendersi. Non è un blocco.

⚠️ **Com'è fatto un fallimento** (letto dal codice delle prove l'08/08/2026,
non supposto, e **ricontato l'11/08**): tutte le suite usano la stessa funzione
`assert`,
che stampa `PASS — <testo>` oppure **`FAIL — <testo>`**. In fondo a ogni suite
compare `TUTTI I TEST PASSATI` oppure `<n> TEST FALLITI`, e in quel caso il
codice di uscita diventa **1**. *Serve saperlo perché è ciò che rende
verificabile un esito negativo: senza, "zero fallite" è un'opinione.*

⚠️ **CONTARE LE RIGHE `PASS` NON È UN METRO.** Un comando che conta solo i
successi non annuncia un fallimento: lo fa **sparire dal totale**. Se una prova
si rompe dice 700 invece di 701, e se un'intera suite non parte dice 660 e
nient'altro. Funziona solo finché qualcuno ricorda a memoria il numero del
giorno prima. *Il metro buono è quello scritto qui sopra — che segnala il file
fallito — oppure il conteggio delle righe `FAIL`, che di suo può dare esito
negativo.*

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

### ✅ I lavori chiusi — una riga ciascuno, il racconto sta nel punto citato

*⚠️ Fino al 28/08/2026 questa sezione portava per intero il testo che aveva
quando erano lavori DA FARE, comprese due voci marcate «chiuso, testo storico».
Sfoltita: resta ciò che è ancora vero.*

- ✅ **Persistenza del carrello e del checkout** (§36-40, §41-45) — chiusa il
  **30/07/2026**, punti **10** e **10b**. ⚠️ *Due fatti sul codice che vivono
  solo qui:* `classifyScheduledSelection` copriva la **sola Delivery** e la
  validità del Ritiro era calcolata **in linea** dentro `app/page.js`, estratta
  col commit `36218f7`; e la guardia contro il salvataggio prematuro del
  checkout **si fa con uno stato, non con un `useRef`** — il meccanismo del
  carrello **non si trasferisce** (lezione `al`).
- ✅ **§46, il confronto fra prezzo mostrato e prezzo addebitato** — chiusa il
  **02/08/2026**, punti **11b**–**11f**. ⚠️ **Resta aperta la tappa 3b**, che
  non era parte della condizione: tempo di preparazione, **griglia dei quarti
  d'ora** e unificazione delle **due costruzioni delle finestre orarie**. *Vive
  nel percorso di pagamento, e vale la regola di sempre.* ⚠️ *Da fare senza
  ancorarla a una scadenza futura: quella frase è già invecchiata due volte.*
- ✅ **Spec allineata al codice** (v43, 31/07/2026, `d254612`) — manutenzione
  della verità, **nessuna decisione nuova**: sette frasi della spec
  descrivevano uno stato superato. ⚠️ *Due delle sette dichiaravano aperta una
  condizione chiusa il giorno prima — lezione `aj`.*
- ✅ **Fase 3, creazione di articoli semplici** — chiusa il **06/08/2026**,
  punto **21**. ⚠️ *Due fatti da non perdere:* la tendina delle categorie **si
  legge dal database e non si compila a mano** — `products.category` è un tipo
  chiuso, e ricopiarne i valori creerebbe una seconda copia che diverge —
  escludendo `menu_combo`; le regole di **`slug` e collisioni** sono **decise**,
  non osservate, in spec §63-64 v54.
- ✅ **"Togli dal menu"** — fatto il **07/08/2026**, colonna **`is_in_menu`**,
  punto **23**.
- ✅ **GIVEMEFIVE nel checkout** — chiuso l'**11/08/2026**, punto **29**,
  decisioni in spec §14 v68.
- ✅ **Prefisso internazionale e indirizzo nella scheda ordine** — fatti il
  **12/08/2026**, punto **31**.
- ✅ **Fase 4, creazione di Roll e Bowl con le loro opzioni** — fatta il
  **12/08/2026**, punto **32**. ⚠️ **NON RESTA PIÙ NESSUNA FASE PRE-GO-LIVE.**

⚠️ **REGOLA DI ANDREA (01/08/2026), VINCOLANTE: l'aggiornamento dei documenti è
parte della tappa, non un lavoro a parte.** Una tappa non è chiusa finché spec e
handoff non sono aggiornati, e l'ordine è **prima la spec, poi l'handoff**,
perché la spec tiene le decisioni e l'handoff le cita. *Il costo di rimandare
cresce più che proporzionalmente: cinque commit di ritardo non costano cinque
volte uno, perché lo stato va ricostruito a memoria invece che raccontato mentre
è fresco.*

⚠️ **NON SI RIMANEGGIA IL PERCORSO DEL PAGAMENTO INSIEME AD ALTRO**: se si apre,
si apre per **tutti** i lavori registrati al **punto 16**, che è l'unica fonte di
quell'elenco. *Un numero scritto in un posto e un elenco scritto in un altro
divergono sempre: qui il numero è stato tolto e resta il rimando.*

### Da valutare — campo codice sconto generico

*Annotato da Andrea il 30/07/2026.* Oggi il meccanismo è cablato sul solo
**GIVEMEFIVE**, con la regola di §14 (un utilizzo per cliente). Parte
dell'impianto esiste già: la tabella `coupons` (vuota) e `promo_redemptions`.

⚠️ **Va pensato in concomitanza con GIVEMEFIVE, non dopo**: i due meccanismi
coesisterebbero, quindi va deciso se sono **cumulabili** o se si escludono, e con
quale precedenza. Da decidere inoltre: chi crea i codici e da dove, se hanno
scadenza, importo fisso o percentuale, soglia minima, se valgono una volta per
cliente o una volta in assoluto.

*Si incrocia con la regola di §46 v37 sul prezzo di riga negativo*: con codici
liberi accanto a uno sconto fisso, il caso "lo sconto supera il prezzo" smette di
essere teorico. Oggi lo sconto agisce sul **totale del carrello**, non sulla riga.

✅ **Aggiornamento del 10/08/2026 — la FACCIATA è decisa, il SISTEMA no.** Il
campo *"Hai un codice sconto?"* nel checkout è costruito, ma dietro c'è la sola
regola cablata di GIVEMEFIVE (spec §14 v68). Il giorno dei codici veri cambia
**chi risponde**, non il campo né le frasi. ⚠️ **Le domande qui sopra restano
tutte aperte.** *E i tre esempi fatti da Andrea non sono la stessa cosa: 5 €
fissi è ciò che il sistema fa già, una percentuale apre il caso "lo sconto supera
il prezzo", e **un omaggio non è uno sconto** ma una riga in più nell'ordine —
tocca carrello, documento per lo staff e Stripe, ed è un lavoro a sé.*

### Residui minori aperti

- **La nota Planted** (§23) confronta una stringa scritta nel codice
  (`app/page.js`, `protein.id === "planted"`). Ultimo caso del tipo curato in
  v37 e v38 sull'extra carne; meno rischioso perché è un testo informativo.
- ✅ **FATTO il 01/08/2026** — *rendere verificabile il calcolo dentro la route
  di pagamento* estraendolo in `lib/` (§46 v38): da 691 a 332 righe,
  comportamento identico, regole di forma in spec §46 v46. ⚠️ *L'estrazione si è
  fermata alla logica: la **sequenza delle scritture** resta nella route, e
  proseguire richiede prima una decisione in spec (§11d.f).*
- **Il server non riverifica il tempo di preparazione né i quarti d'ora**
  (§46b v40), su **entrambe** le modalità: controlla che l'orario non sia
  passato e che il locale sia aperto, ma non i 15 minuti del Ritiro né i 60
  della Delivery, e **non impone la griglia**, quindi **`12:07` passa**. Una
  richiesta costruita a mano può prenotare un ritiro "fra un minuto".
  **Non è una condizione di apertura** (decisione di Andrea del 30/07/2026): il
  cliente onesto non può raggiungerlo. *Il motivo per cui va comunque chiuso non
  è il furbo di turno — è che il server è la rete sotto agli errori del sito.*
  ⚠️ *La validazione dell'orario è citata **per intero** in spec §46b dalla v43:
  sono **due** righe, non una, e `24:00` e `12:60` non passano. La verità non
  vive più soltanto qui.*
- **Le finestre orarie si costruiscono in due punti** (§46b v40): uno alimenta
  il guard, l'altro genera gli slot offerti al cliente. Confrontati riga per riga
  il 30/07, oggi danno lo stesso risultato. **Non è la doppia implementazione
  vietata da §46b**, ma sono due copie, e due copie divergono. Da unificare
  quando si toccherà una delle due.
- **Il sito non filtra per store** (§46 v38): da fare quando i locali saranno due.

### Dopo il go-live (§63-64)

- editing dei **contenuti del combo** — richiede prima la conversione delle label
  a id (§25, residuo noto);
- **creazione di nuovi tipi di menu combo** (richiede un motore generico di
  composizione: fino ad allora, intervento una tantum sul codice);
- **ruoli/permessi** staff vs admin;
- **gestione delle immagini**: `image_url` esiste su tutti gli articoli ma è
  **vuoto ovunque** e non c'è modo di caricare una foto dal pannello. Lavoro
  autonomo, da fare per tutti gli articoli insieme.

### Condizioni di apertura — **quattro chiuse, cinque aperte**

⚠️ *Questa intestazione va riletta ogni volta che l'elenco cambia: è già rimasta
indietro due volte rispetto alle voci.*

**Chiuse:**

- ✅ **Persistenza** (§36-40): **CHIUSA il 30/07/2026**, carrello e dati del
  checkout, entrambi verificati dal vivo. *La prima che si chiude.*
- ✅ **Confronto prezzo mostrato vs addebitato** (§46): **CHIUSA il 02/08/2026**,
  verificata dal vivo (§11f). *La seconda.*
- ✅ **Informativa privacy** (§41-45): **CHIUSA il 03/08/2026**, commit
  `c69642e` (punto 14). Versione **1.2**, pagina statica su `/privacy`,
  collegata da **tre punti**: la casella del checkout, il fondo della home, il
  fondo della pagina di conferma. *La terza.*
  ⚠️ **Un pezzo è verificato solo per lettura**: l'apertura in scheda nuova è
  accertata negli attributi del DOM, non osservata dal vivo — **da riprovare da
  telefono** (punto 17). ⚠️ *E resta da salvare in database la stringa
  `informativa-v1.2`, che si fa quando si riapre il file del checkout (punto
  16): non è una condizione di apertura, è un lavoro registrato.*
- ✅ **Piano Supabase Pro**: **CHIUSA il 04/08/2026** (punto 18). Piano attivo,
  Spend Cap acceso, backup ripristinabili dal 28/07. *La quarta.*

**Aperte, cinque:**

- **Stripe live** (oggi sandbox).
- **Dominio** `ordina.kebabmediterraneo.it` — ⚠️ **APERTA, MA FATTA A METÀ.**
  ✅ *Il DNS è puntato e funzionante dal **26/08**: il sito risponde sul dominio
  vero, e ogni pubblicazione esce su **due indirizzi**.* ⚠️ **Resta da
  restringere la chiave API di Google**, oggi senza restrizioni, e la voce è
  **scaduta**: la spec dice "contestualmente all'attivazione del dominio vero".
  ⚠️⚠️ *Con due indirizzi vivi, **restringerla al solo dominio nuovo spegne il
  completamento dell'indirizzo sull'altro** — e non con un errore, con un campo
  che smette di suggerire. Vedi spec §66.*
  ⚠️ **Non si chiude col DNS**: si chiude quando il DNS funziona **e** la chiave
  è ristretta. *Sono la stessa voce apposta: separarle vorrebbe dire dichiarare
  chiusa una cosa fatta a metà.*
- **Analytics** (§65). ⚠️ *È **lavoro di codice**, non configurazione: una
  dozzina di eventi da tracciare più la pagina dei carrelli abbandonati.* Coi
  vincoli dell'informativa e il limite dei **30 giorni** (§65, §69).
- **Pulizia dei residui di test** (punto 11) — da **rileggere** dal database,
  mai ricopiare da qui.
- **Procedura mensile di pulizia** degli ordini mai pagati oltre i 30 giorni
  (§69). ⚠️ **Lo strumento esiste**: `sql/pulizia_mensile_ordini_mai_pagati.sql`,
  committato il 04/08 con `f54c29d` e **mai eseguito**. ✅ *Cadenza fissata: il
  primo di ogni mese, prima di aprire il locale (spec §69 v56).* **Resta la sola
  prima esecuzione**, di Andrea. Finché non c'è, il punto 11.2 dell'informativa
  è una promessa senza precedente.

*Delle cinque, **una sola richiede di scrivere codice**: le analytics di §65.*

*Non è una condizione di apertura*: **WhatsApp**, che la spec colloca in
**fase 1.1** (§71) e che §52-56 dichiara fuori dalla specifica attuale.

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

Nessuna riga di codice: configurazione nella dashboard, cinque query di sola
lettura, una ricognizione sul repository. **Le sette decisioni stanno in spec
§63-64, §65, §66 e §69**; qui i fatti e ciò che è rimasto aperto.

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

⚠️ **I conteggi letti quel giorno sono superati dal 05/08** — la rilettura ha
trovato un ordine di prova in più: **i numeri validi stanno al punto 11.**

### 18a) Cosa questo giro NON ha chiuso

* ⚠️ **La chiave `service_role`: verifica FATTA, e SCADUTA.** Scavalca ogni RLS,
  e tutta la protezione regge sul fatto che non finisca nel browser. **Non ci
  finisce**, accertato il 04/08 **per quattro vie** (spec §66, punto 17). Ma la
  spec dichiara che l'esito **vale per il codice di oggi**: va rifatta quando si
  riapre `app/api/checkout/route.js` e **quando si costruisce la Fase 3**. Il
  file del checkout non è mai stato riaperto — al punto 28 è stata scelta la
  strada che non lo tocca, e i sei lavori di chi lo riaprirà stanno al punto 16.
  ⚠️ **La Fase 3 invece è stata costruita il 06/08** (punto 21): la condizione è
  scattata, e **in nessuno dei due documenti risulta che la verifica sia stata
  rifatta**. *Questa voce sostituisce, il 28/08, una riga che dichiarava la
  verifica mai fatta: era falsa già il giorno in cui è stata scritta.*
* **`analytics_events` ha già un elenco chiuso di tipi di evento** nel database,
  mai letto da nessuno. Va confrontato con la dozzina di §65 **prima** di
  scrivere codice.
* **Le altre affermazioni dell'informativa sull'infrastruttura** — hosting,
  cookie, strumenti di analisi — non sono state passate in rassegna una per una,
  come è stato fatto per la regione.

### 18b) Tre lezioni

**bg. ⚠️ Una frase di un fornitore non è un dato da cui calcolare.** La pagina dei backup dice che le copie si prendono "intorno alla mezzanotte della regione del progetto". Gli orari erano le 07:36 UTC, che in Irlanda non è mezzanotte: da lì è nata l'ipotesi che il database fosse negli Stati Uniti, con l'informativa che avrebbe dichiarato il falso in due punti. **Il campo Region diceva Irlanda.** La frase era approssimativa. *È la famiglia delle lezioni `ap` e `av` in forma nuova: là la sonda era costruita sulla forma attesa di un file, qui il calcolo era costruito sulla frase di un'interfaccia. Il rimedio è lo stesso — si legge il campo, non si deduce dall'orario — e il costo è stato due messaggi, perché l'ipotesi era stata dichiarata come ipotesi e non come fatto.*

**bh. ⚠️ Un referto che finisce sul numero tondo non è un referto completo.** L'editor SQL della dashboard tronca. ⚠️ **Il numero è cambiato: 500, misurato il 06/08/2026; era 100 quando questa lezione è stata scritta.** *È la lezione stessa applicata a sé: la cifra è un dato dello strumento e invecchia, la diffidenza no.* Il primo giro sulle colonne si è fermato a `orders` colonna 32 e **sembrava una risposta**: mancavano tredici tabelle intere, fra cui proprio quella che serviva. È la lezione `aq` spostata sullo strumento — là una variabile vuota faceva corrispondere tutto, qui un limite silenzioso fa sembrare finito ciò che è a metà. *Rimedio: contare le righe attese prima di leggere il contenuto, e diffidare del numero tondo.*

**Una terza, dal lato di chi scrive i comandi**: l'elenco delle righe **rimosse** attese nel comando di copia della v54 era sbagliato — dichiarava due zone quando erano quattro, dimenticando che la riga 3 va sostituita e che un `+1` netto si ottiene sostituendo una riga con due. Code l'ha segnalato senza fermarsi, correttamente. *È la lezione `ak`: ciò che un comando dichiara come atteso si ricava dal diff, non a memoria — e chi scriveva aveva il diff davanti.*

---

## 19) Gli script di pulizia dati (04/08/2026, seconda metà)

Con il referto sui collegamenti in mano, §69 si è sbloccata e i tre strumenti
sono stati scritti. Commit **`f54c29d`**. ⚠️ **Nessuno dei tre è mai stato
eseguito.** Decisioni e chiarimenti in **spec §69 e §66**.

| file | cosa fa | quando si esegue |
|---|---|---|
| `sql/conteggi_dati_sola_lettura.sql` | conta e basta | prima e dopo ogni pulizia |
| `sql/ESEGUIRE_UNA_VOLTA_SOLA_prima_del_golive_CANCELLA_TUTTI_GLI_ORDINI.sql` | azzera ordini, clienti, riscatti, eventi | una volta sola, al go-live |
| `sql/pulizia_mensile_ordini_mai_pagati.sql` | rimuove i mai pagati oltre 30 giorni | ogni mese, per sempre |

Il nome in maiuscolo è voluto: fra nove migrazioni datate e minuscole quel file
si stacca da solo. **Il pericolo non è che qualcuno esegua quello sbagliato di
proposito: è che li confonda.**

⚠️ **Lo script del go-live si cancella dal deposito subito dopo l'uso** — passo
5 della sequenza di apertura (spec §66). Non è una buona intenzione: è che il
momento della cancellazione coincide con quello in cui si è stanchi e contenti,
a sito appena aperto.

### 19a) Ciò che gli script NON risolvono

* ⚠️ **La spec non definisce come si riconosce un'azione di prova nel registro
  staff.** `staff_identifier` è testo libero; nel file del go-live il criterio è
  un **parametro compilato a mano**, letto dal referto e non ricordato, con due
  controlli che bloccano se resta vuoto o non corrisponde a nulla. *Limite noto
  e non sanato: quello script si esegue una volta e sparisce, e la pulizia
  mensile non tocca mai il registro per identificatore.*
* **Resta la prima esecuzione della pulizia mensile.** Il **giorno** è stato
  fissato il 05/08 — il primo del mese, prima di aprire (punto 20) — ma nessuno
  dei tre file è mai stato eseguito, e quello del go-live per sua natura si
  prova una volta sola.

### 19b) Due difetti trovati leggendo i file, non il referto che li descriveva

**bi. ⚠️ Un freno che scatta a torto insegna ad aggirarlo.** Il referto dei conteggi stampava la data dell'ultimo ordine **troncata ai secondi**, ma `created_at` ha precisione al microsecondo: copiata nel freno, l'ordine più recente risultava successivo a sé stesso e l'arresto sarebbe scattato al primo tentativo. Chi si fosse trovato davanti a quell'arresto avrebbe visto una data identica al referto, e l'unica mossa che sblocca era proprio quella vietata in maiuscolo — spostare la data in avanti. *Corretto con i microsecondi e **verificato**: su `max(created_at) = 2026-08-04 13:07:01.471525+00`, zero ordini oltre il valore nuovo e uno oltre quello vecchio. Lo zero conta perché la stessa sonda cambia risposta col formato vecchio.*

**bj. ⚠️ Un'istruzione che manda a leggere un dato inesistente produce la scorciatoia peggiore.** Il file del go-live diceva di prendere la data del freno "dal referto dei conteggi", ma quel referto **non la produceva**: contava righe. Chi avesse obbedito non avrebbe trovato il valore, e la cosa più a portata di mano era l'ora corrente — cioè precisamente ciò che spegne il freno. *Aggiunta la misura, e il legame fra i due file ora è scritto in entrambe le direzioni.*

**Una terza, sul metodo di chi legge:** entrambi questi difetti sono stati trovati **leggendo i file**, non i referti che li descrivevano. I referti erano corretti e dettagliati, ma descrivevano controlli, non li mostravano. *Un referto che descrive un file non è il file.*

---

## 20) La ricognizione su §62b e la spec v56 (05/08/2026)

Nessuna riga di codice: una ricognizione di sola lettura, il primo referto dei
conteggi eseguito da Andrea, quattro decisioni, e la spec portata alla **v56**
(commit `1f74e8f`).

### 20a) Il difetto trovato, che era in spec e non nel codice

⚠️ **§62b affermava una cosa falsa sul codice, e ci era stato costruito sopra
un ragionamento** (metodo: lezione `bk`). I fatti, letti sul codice eseguibile e
confermati sul database vivo:

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

### 20b) Le decisioni

**Il motivo si conserva, non si mostra** — nessuna vista del pannello lo
mostrerà, e §65 si intende soddisfatta dalla conservazione, *con la clausola che
impedisce a qualcuno, fra un anno, di costruire la pagina leggendo §65 e
trovandola "mancante"* · **il passaggio obbligato da `problema` resta**: si
corregge la spec, non il codice · **pulizia mensile il primo di ogni mese**,
prima di aprire, perché il primo esiste in tutti i mesi, e **non si prova ora** ·
✅ **i tempi fra le fasi** si leggono da `order_status_history.changed_at`, nome
letto dal database vivo · ✅ **il motivo dell'annullamento non va nel
`payload`**: esiste già in due posti permanenti e la statistica lo legge da
`staff_action_log` filtrando `action`.

⚠️ **Le statistiche non hanno più decisioni bloccanti**: è lavoro da fare, non
da decidere.

⚠️ **Nessun codice scrive in `analytics_events`**, e il no è dimostrato: quattro
sonde indipendenti — la parola, tutti i punti in cui il codice nomina una
tabella (**84 occorrenze, di cui 9 non letterali risolte una per una**), le vie
che scavalcano il client, gli undici nomi degli eventi — ognuna
con la propria controprova su un dato che c'è di sicuro (lezioni `ap`, `aq`,
`av`).

### 20c) Cosa questo giro NON ha chiuso

* **dove è ospitato il sito**, che la spec dichiara essere Vercel senza che
  nessuno l'abbia verificato alla fonte: una delle affermazioni
  dell'informativa ancora non passate in rassegna (punto 18). Va accertata
  prima del passo 2 della sequenza di apertura;
* **l'asimmetria della risoluzione**, che non scrive nel registro azioni mentre
  segnalazione e annullamento sì. Registrata in spec §62b come limite noto,
  fuori dai lavori pre-go-live.

*L'accesso al DNS del dominio, che questa giornata elencava fra le cose aperte,
è stato ottenuto: **lo stato vivo di quella voce è al punto 12**.*

---

## 21) La Fase 3, dalla costruzione alla pulizia (06/08/2026)

Tre commit nella forma che §63-64 imponeva — modulo puro sotto `lib/`, rotta
sottile, form in linea nella sezione Menu: `lib/menu-slug.js`,
`lib/menu-create.js`, e accanto `lib/menu-categories.js` e `lib/menu-dietary.js`
come **fonte unica** di categorie e tabella dietetica, più
`app/api/staff/menu/create/route.js`. **Sette prove dal vivo, tutte superate.**

⚠️ **Il debito che questa fase ha reso visibile, e che va saputo prima di
toccare Fase 1 o Fase 2A**: `lib/menu-create.js` riceve il client del database
**come parametro** invece di importarlo, ed è questo — non altro — che lo rende
verificabile da una prova automatica. **Fase 1 e Fase 2A non hanno prove proprio
perché importano `supabase-admin.js`**, che crea il client al caricamento del
modulo. *Sistemarlo sbloccherebbe le prove di due fasi già in produzione: non è
un abbellimento.*

### 21a) Le decisioni di Andrea (tutte in spec v59)

La **Fase 4 spostata a prima del go-live** — inserire e sospendere Roll è
attività frequente, e la collocazione precedente nasceva da una frequenza
**presunta e mai chiesta** · la Fase 4 **sceglie fra le proteine esistenti** ·
prima della Fase 4 si costruisce **"togli dal menu"** · ⚠️ **le bevande sono
esentate dagli allergeni anche in creazione — prezzo accettato**: una birra
creata dal pannello non porta l'informazione sul glutine.

### 21b) Cosa ha lasciato la pulizia degli articoli di prova

⚠️ Lo script usa-e-getta **non è stato salvato in `sql/`**, come §69 impone per
gli strumenti che cancellano articoli.

* **Gli agganci a `products` sono OTTO, non sei**: ai cinque delle opzioni e
  agli allergeni si aggiungono `combo_drink_options.drink_product_id` e
  `combo_pricing.roll_product_id`. Sette sono in cascata; **`order_items` è
  l'unico `NO ACTION`**, quindi il database rifiuta di cancellare un articolo
  che sia stato ordinato — anche una sola volta, anche per prova.
* **Le righe di `staff_action_log` restano**, e citano articoli che non
  esistono più. È §66 che funziona come deve, non un residuo da pulire.
* ⚠️ **La tabella `product_choice_options` porta un vincolo che si chiama ancora
  `product_protein_options_product_id_fkey`.** Non tocca nulla oggi, ma è la
  traccia di una tabella nata per le sole proteine e poi allargata: *è il primo
  posto da guardare quando si aprirà la Fase 4 e si andrà a cercare il residuo
  label→id.*

### 21c) Tre lezioni

**ee. ⚠️ Fra il riquadro dell'editor SQL e il database, un testo lungo può
arrivare tronco.** Il primo invio dello script di cancellazione è stato
rifiutato per un blocco "mai chiuso": il testo ricevuto si interrompeva a metà
riga, con in coda i commenti che la dashboard aggiunge. Il secondo invio dello
**stesso identico testo** è passato intero. *Causa non accertata. La conseguenza
pratica sì, ed è quella che conta: l'errore arriva prima di qualunque scrittura,
quindi non lascia stati a metà — tranne nel caso in cui il taglio cadesse dopo
il `commit`, dove il lavoro sarebbe fatto e mancherebbe solo il referto. In quel
caso non si rilancia: si guarda.*

**bq. ⚠️ Il file scaricato col nome semplice era quello VECCHIO.** In
`Downloads` convivevano `MASTER_SPEC.md` (la v58, già nel repository) e
`MASTER_SPEC_1.md` (la v59). Ha deciso l'**impronta**, non il nome né la data.
*Se avesse deciso il nome, il `cp` avrebbe ricopiato la v58 su sé stessa e il
diff sarebbe risultato **vuoto** — un esito che si legge come "niente da fare"
invece che come "hai preso il file sbagliato". È il motivo per cui l'impronta
attesa va scritta nel comando, sempre.*

**br. ⚠️ Una dichiarazione di incertezza INCOMPLETA è peggio di nessuna.** L'elenco dei commit del 06/08 marcava [messaggio da rileggere] su quattro righe: i messaggi ricostruiti a memoria erano **cinque**. La quinta, ee402eb, non portava il marcatore e divergeva da git log quanto le altre. *Il danno non è la riga sbagliata: è che marcarne quattro rende le altre **affidabili per contrasto**, e chi legge smette di controllarle. È stata trovata solo perché Code ha verificato tutte e sei le righe invece di fermarsi al perimetro che il comando gli dava. Rimedio: quando un elenco contiene voci non verificate, si marca **l'elenco**, non le voci che si ricorda di aver inventato.*

---

## 22) La disponibilità della bibita nel menu combo (06/08/2026, sera)

Una **bibita esaurita restava scegliibile dentro il menu combo, e il pagamento
la accettava**: la tendina filtrava sulla colonna della tabella del combo — che
**nessuna schermata può scrivere** — invece che sulla disponibilità del
prodotto. Contorni e Roll erano già a posto. ⚠️ **Il buco era aperto per
costruzione, non per una svista**: sul database vivo tutte le righe di
`combo_drink_options` erano a `is_available = true`, perché nessuno le scrive
mai. Decisioni e forma in **spec §23-26**.

### 22a) Cosa NON è stato provato, e perché

* ⚠️ **NON provato, e registrato come tale**: il controllo sul pagamento. È la
  decima lettura da database di un modulo che le prove del progetto dichiarano
  già scoperte. **Un caso finto sarebbe stato peggio di nessun caso**: un
  identificativo inventato produce la stessa identica risposta del caso vero,
  quindi la prova sarebbe passata sempre, anche cancellando la riga da
  verificare. *Scritto un blocco "NON COPERTO" invece di una prova che non può
  fallire (famiglia 1).*
* ⚠️ **Non provata**: la guardia, che è tre confronti dentro un componente React
  in un file da quasi 4000 righe. Verificata **leggendo** la proprietà che conta
  — che stia dopo l'unico hook.

### 22b) Tre cose trovate scrivendo, che il piano non prevedeva

* ⚠️ **Filtrare la lista unica avrebbe rotto il carrello in silenzio.** Il codice
  lo dichiarava già in un commento: il ripristino deve **vedere** gli articoli
  esauriti per toglierli col motivo giusto. Servono due liste, ed è la stessa
  coppia che i Roll usavano già.
* ⚠️ **La posizione della guardia è obbligata dall'ordine degli hook**, non è
  stile: messa dove il comando diceva letteralmente — in cima alla funzione —
  avrebbe prodotto un guasto React peggiore del difetto evitato.
* ⚠️ **Lo shortcut "Fallo combo" non esiste nel codice**, ed era descritto come
  costruito in **due** punti della spec. Cercato, non dedotto. Corretto in v61.

### 22c) Il difetto preesistente che la guardia ha chiuso

⚠️ **Segnare esauriti tutti e sette i Roll rompeva il builder del combo già
prima di questo lavoro.** Non è un danno introdotto dalla correzione della
bibita, ed è scritto qui perché fra un mese lo sembrerebbe. La prova dal vivo del
06/08 — sette Roll esauriti e rimessi — ha verificato **insieme** la guardia
nuova e l'esistenza del guasto che copre.

### 22d) Tre lezioni

**bs. ⚠️ Una prova può ESPLODERE invece di fallire, e nascondere quelle dopo di
sé.** Togliendo il controllo per verificare che le prove nuove potessero
fallire, tre di esse non fallivano: sollevavano un errore leggendo il primo
elemento di un elenco vuoto, interrompendo il file e lasciando le prove
successive **non eseguite**. *Riscritte per fallire in modo pulito. Il rimedio
non è scrivere prove più prudenti: è che la controprova va fatta sempre, perché
è l'unica cosa che distingue una prova che passa da una prova che non può
fallire.*

**bt. ⚠️ Una citazione sbagliata dentro un file pesa più che dentro un
messaggio.** Il riferimento a una lezione era stato scelto per assonanza invece
che letto, ed era **già finito in un file** pronto per il commit. *È la lezione
`br` applicata a sé stessa: una riga scritta a memoria acquista l'autorità del
documento che la contiene. Il rimedio è quello di sempre — si rilegge, non si
ricorda — e vale anche per i rimandi interni, non solo per i fatti.*

**bu. ⚠️ Un commit dev'essere sano DA SOLO, non solo insieme al successivo.**
Separando due lavori in due commit senza gli strumenti comodi, la strada seguita
è stata: salvare il file completo e verificarne l'impronta, togliere la sola
parte del secondo lavoro, **verificare che lo stato intermedio compilasse e
passasse tutte le prove**, committare, rimettere il file dalla copia e
**riverificare l'impronta**. *È quel passaggio finale che dimostra che ciò che
finisce in git è bit per bit quello che è stato approvato, e non una
ricostruzione somigliante. Un commit verde solo insieme al successivo è un punto
in cui non si può tornare.*

---

## 23) "Togli dal menu", dalla migrazione alle prove dal vivo (07/08/2026)

Colonna **`is_in_menu`** (boolean not null default true su `products`),
migrazione eseguita nel SQL editor. Il cuore è `lib/menu-visibility.js` con la
rotta sottile `app/api/staff/menu/visibility/route.js`, nella forma provabile
inaugurata dalla Fase 3: **il client si passa come parametro**. 37 prove sul
solo cuore. Toccati anche `app/staff/page.js`, `app/page.js`,
`lib/checkout-resolve.js` e `lib/cart-persistence.js`; prove da **648** a
**669**. **Decisioni e forma in spec §63-64, §23-26 e §46.**

### 23a) Le quattro cose cambiate rispetto al piano, tutte da chi ha guardato invece di ricordare

* **Il rientro rimette anche `is_available`.** Un articolo tolto dal menu
  **mentre era esaurito** sarebbe rientrato esaurito, e col pulsante Disponibile
  spento **nessuna schermata avrebbe più potuto cambiarlo**.
* ⚠️ **Le birre ricevono la lista PIENA, non la filtrata.** Il comando diceva il
  contrario. Quella lista non disegna nulla: serve a riconoscere se c'è una
  birra nel carrello, e da lì dipende la casella **«sono maggiorenne»**. Con la
  filtrata sarebbe sparita da sé **sbloccando il pagamento**.
* **Il messaggio del combo nomina la bibita**, e **le due liste nel sito
  cliente** contro la strada facile del filtro unico.

### 23b) Il metro delle prove, scritto una volta sola

⚠️ **Il conteggio è passato da 648 a 664 senza che nessuno avesse scritto una
prova.** La spiegazione data — "è solo un modo diverso di contare" — era falsa:
il comando cercava `PASS` in qualunque punto della riga, e l'ultima riga di ogni
suite è `TUTTI I TEST PASSATI`, che contiene `PASS`.

```
for f in tests/*.test.mjs; do node "$f"; done 2>/dev/null | grep -c '^PASS — '
```

*Se il numero sale, qualcuno ha scritto prove nuove. Se scende, qualcosa si è
rotto.*

### 23c) Come si provano dal vivo il sito e il pagamento

* ⚠️ **Guardare il sito cliente con 62 articoli dentro e 0 fuori non è una prova
  blanda: non è una prova.** Le due liste sono identiche e il sito sembra giusto
  qualunque cosa sia stata scritta. Le prove dal vivo del sito vanno fatte
  **dopo** aver tolto qualcosa dal menu, e almeno un articolo dev'essere di una
  delle categorie che l'upsell propone.
* ⚠️ **Un pagamento riuscito non dimostra che un filtro sia rotto.** Andrea ha
  tolto l'articolo dal menu **mentre era già sulla pagina Stripe**, e l'ordine è
  passato. La diagnosi è stata chiusa con la controprova sul caso noto: **anche
  un articolo esaurito passa**, quindi il giro non toccava il filtro. *La causa
  era il comando, che diceva "toglila dal menu e poi prova a pagare" senza dire
  che il controllo gira quando si preme il pulsante, non quando si è già su
  Stripe.*

### 23d) Ciò che questo lavoro NON ha chiuso

* ⚠️ **La finestra del pagamento** (spec §46 v63): dopo che il cliente è su
  Stripe non c'è più alcun controllo, e il webhook non legge `products`. Vale
  identica per `is_available`, quindi **precede questo lavoro**. Da decidere
  prima dell'apertura.
* ⚠️ **Il permesso `TRUNCATE` del ruolo `anon` su `products`**, preesistente,
  trovato per caso. Da accertare se sia raggiungibile da fuori.
* ⚠️ **Il piano di hosting Hobby**, da verificare sulle condizioni di Vercel.
* **Il viewport e lo schermo mobile del sito cliente**, invariato.

### 23e) Cinque lezioni

**bv. ⚠️ Un elenco si chiede COMPLETO, non solo nelle voci che cambiano.** Due
elenchi sbagliati nello stesso giorno sono caduti perché qualcuno ha confrontato
il totale dichiarato con le righe scritte. *Chiedere "solo i punti che cambi"
avrebbe lasciato passare entrambi: è il totale a fare da controprova alla
tabella, e senza di esso una tabella incompleta si legge come completa.*

**bw. ⚠️ Un numero di riscontro che cambia da solo va stabilito, non spiegato.**
Il conteggio delle prove è passato da 648 a 664 con una spiegazione plausibile e
falsa. *Un metro che cambia senza che nessuno lo abbia stabilito smette di
misurare, e "le prove passano tutte" diventa una frase senza niente dietro. Il
comando che produce il numero va scritto una volta sola, in chiaro.*

**bx. ⚠️ Chiudere la shell non spegne il server, e il segnale di errore mente.**
I processi sopravvivono riattaccandosi a `init` e la porta resta occupata,
**mentre il sistema segnala il comando come "fallito"**. Lo stesso segnale è
comparso anche a spegnimento riuscito: non misura nulla. *Lo spegnimento si
dichiara con tre riscontri indipendenti, uno dei quali è una chiamata alla porta
che **prima rispondeva**.*

**by. ⚠️ Il comando che descrive una prova può renderla incapace di fallire.**
Due volte in un giorno: il sito cliente guardato senza articoli fuori menu, e il
pagamento provato togliendo l'articolo dopo essere arrivati su Stripe. *In
entrambi i casi l'errore era in chi ha scritto le istruzioni, non in chi le ha
eseguite. Il rimedio è quello di sempre — la controprova su un caso noto — ed è
ciò che ha smascherato il secondo caso: anche l'esaurito passava.*

**bz. ⚠️ Fermarsi e spiegare vale più che eseguire alla lettera.** Il comando
sulle birre era sbagliato e sarebbe passato: la lista filtrata avrebbe fatto
sparire la casella «sono maggiorenne» al primo ridisegno, sbloccando il
pagamento di una birra senza dichiarazione d'età. *È stato evitato perché chi
scriveva il codice ha seguito la variabile fino a scoprire cosa facesse davvero,
ha passato la lista giusta e **ha spiegato prima di lasciarlo così**, invece di
eseguire o di correggere in silenzio.*

---

## 24) Font, ritocchi al sito e il cuore dello sconto (08/08/2026)

Decisioni e forma in **spec §6b, §12c, §14 e §52-56**.

### 24a) Il font

Termina da Adobe Fonts, progetto **`jth6flt`**, quattro pesi. Cambiarlo è stata
una riga, perché un punto unico esisteva già. ⚠️ **Ma i `fontFamily: "inherit"`
sparsi coprivano 47 punti su 121**: pulsanti, campi e tendine restavano col
carattere di sistema, e **non si notava soltanto perché il font della pagina
*era* quello di sistema**. Il cambio non ha creato il difetto, l'ha reso
visibile. Chiuso con una regola sola. *Nel commento sopra quella riga c'è
scritto «questa riga sembra non fare niente, e invece regge tre quarti del sito
— non toglierla».*

**Cinque prove dal vivo**, telefono compreso, in quest'ordine: se qualcosa esce
dai bordi, se i titoli sono il font vero o un grassetto fabbricato, se il testo
salta al caricamento, se mancano lettere particolari — **e solo alla fine se
piace**.

### 24b) Due fatti emersi dai ritocchi

* ⚠️ **Menu e tempi partono al caricamento della pagina e non sanno nulla
  dell'indirizzo.** Un testo proposto per l'invito sull'indirizzo diceva il
  contrario ed era falso. *La frase finale è di Andrea ed è migliore, perché
  **consiglia invece di descrivere**: un consiglio non può essere falso.*
* ⚠️ **Il push è l'unica azione che esce verso l'esterno**, perché ripubblica il
  sito.

### 24c) Lo sconto: prima la rete, poi lo spostamento

La logica di GIVEMEFIVE è stata estratta in `lib/` e provata **prima** di
toccarla — 32 prove, comportamento identico su **112 casi** contro il codice
vecchio preso da git — perché nessuna prova la copriva (lezione `cd`).

⚠️ **E l'ordine dei lavori non era libero.** Il pulsante del carrello che il
comando chiedeva di togliere per primo era **l'unico interruttore** che accende
lo sconto in tutto il progetto: eseguendo nell'ordine scritto, GIVEMEFIVE si
sarebbe spento **in silenzio**, senza un errore da nessuna parte.

*Il disegno dello spostamento è cambiato il 10/08: questa giornata e la v65
restano leggibili ma sono **superate** (punto 28).*

### 24d) Cosa resta di questa giornata

* ⚠️ **Il collegamento Adobe da autorizzare sul dominio vero** (§6b) — la cosa
  più facile da dimenticare, perché quando succederà sembrerà un guasto.
* ⚠️ **Il guasto di lettura che concede lo sconto** invece di negarlo, fissato
  dalla prova `g` (§14).
* **Il consumo e il rilascio** dello sconto, ancora senza cuore e senza prove.
* ⚠️ **La frase del preordine**, scritta e pubblicata ma **mai vista dal vivo**:
  compare solo in Delivery a semaforo non verde.

*Le due copie delle costanti e i diciassette `fontFamily` ridondanti, aperti
quel giorno, sono chiusi ai punti 26 e 27.*

### 24e) Quattro lezioni

**ca. ⚠️ Un elenco di lavori da fare non è un ordine di esecuzione.** Un
comando in sei punti numerati chiedeva di smontare l'interruttore esistente
prima che il suo sostituto fosse costruibile, e il quinto punto — quello da cui
tutti gli altri dipendevano — era in fondo. *Prima di eseguire una lista, va
chiesto quale voce è **premessa** delle altre: l'ordine in cui le cose vengono
scritte non è quello in cui vanno fatte.*

**cb. ⚠️ Guardare il sistema in una condizione e dedurne la regola produce
diagnosi false.** Due osservazioni su tre riguardavano funzioni che
funzionavano già: erano state viste a locale chiuso, dove metà dell'interfaccia
non si disegna. *Non è colpa di chi guarda — è che una schermata è un caso, non
una regola, e la conferma costa una lettura.*

**cc. ⚠️ Un difetto invisibile perché il valore giusto coincideva con quello
sbagliato.** Tre quarti dei moduli non ereditavano il font, e nessuno poteva
accorgersene finché il font della pagina **era** quello di sistema: le due cose
davano lo stesso risultato. *Cambiare un valore predefinito rivela tutti i
punti che non lo stavano rispettando — e vale la pena aspettarselo, invece di
scambiarli per difetti nuovi.*

**cd. ⚠️ Prima la rete, poi lo spostamento — e la rete va misurata, non
assunta.** La logica dello sconto è stata estratta e provata **prima** di
toccarla, perché una ricognizione aveva accertato che nessuna prova la
copriva. *L'ordine inverso — spostare e poi provare — non avrebbe dato alcun
segnale in caso di rottura: il denaro sbagliato non si vede, si incassa.*

---

## 25) La decisione sul freno, e i numeri dell'08/08 (08/08/2026, sera)

Sessione di **sola decisione**: nessuna riga di codice, nessun commit di codice.

### 25a) Il freno: deciso di NON costruirlo

**Non nasce alcun freno a conteggio.** La rotta che dice se lo sconto spetta
**non risponderà su un numero di telefono**, ma solo a un checkout compilato:
non c'è nulla da martellare, quindi non c'è nulla da contare. Motivo e
alternative scartate per intero in **spec §14**. *La strada è comparsa separando
due domande che la v64 teneva in una sola frase — **su cosa** si frena e
**dove** si tiene il conto: è la lezione `ce`.*

### 25b) Ciò che l'osservazione di Andrea ha aggiunto

⚠️ **Non esiste un controllo che il numero di telefono sia reale**, e non era
scritto da nessuna parte in nessuno dei due documenti. Registrato in spec §14
come **"un utilizzo per numero di telefono"**, senza farne una sezione: il danno
è limitato per costruzione, perché per prendersi i 5 € bisogna comporre e
**pagare davvero** un ordine da 25 €. È margine perso su una vendita vera, non
denaro che esce.

⚠️ **Il numero non verificato NON toglie il problema di riservatezza, lo
sposta.** I numeri che stanno nel database ci sono finiti perché clienti veri
li hanno scritti per farsi consegnare la cena: sono veri quasi sempre, per
forza. Confermare "questo numero ha già ordinato" resta una fuga. *È il motivo
per cui la porta va chiusa comunque, anche avendo scartato il freno.*

### 25c) Due numeri, e ciò che il secondo non dice

* Il **nome** del codice `GIVEMEFIVE` sta in **tre** copie — il modulo, il
  webhook di Stripe, la rotta di annullamento. *Soglia e importo erano due e
  sono stati unificati (punto 26); le **tre copie del nome** non risultano
  misurate dopo.*
* Le prove all'08/08: **17 file**, **701 righe `PASS`**, **86 righe di esito
  non-`PASS`**, e **nessuna è un fallimento**: zero righe `FAIL`, zero
  `TEST FALLITI`, diciassette `TUTTI I TEST PASSATI`, zero file con codice di
  uscita diverso da zero. Quattro riscontri indipendenti, non uno.

⚠️ **La ripartizione delle 86 righe NON torna**: le tre voci in cui è stata
spiegata fanno **88**. I tre numeri erano stati eseguiti davvero: a non tornare
sono **le categorie, che si sovrappongono** — una stessa riga può cadere in due
schemi e farsi contare due volte. E "quattro righe per suite" era una glossa,
non una misura: le suite sono diciassette e quelle righe sessantaquattro. *Non
intacca il verdetto, ma è il tipo di numero che fra un mese viene citato come
fatto.*

### 25d) Tre lezioni

**ce. ⚠️ Una domanda mal posta ferma il lavoro più a lungo di un problema
difficile.** Il freno non è stato bloccato dalla sua difficoltà: è stato
bloccato da una domanda che ne conteneva due e che presentava come scelta a tre
una scelta a una. *Quando una decisione non si riesce a prendere, vale la pena
sospettare della domanda prima che di sé stessi: separarla nelle sue parti fa
comparire le strade che nessuna delle due formulazioni nominava.*

**cf. ⚠️ Contare i successi non è misurare.** Un metro che conta le righe
`PASS` non può dare esito negativo: un fallimento non lo annuncia, lo toglie
dal totale. *Vale la regola generale del progetto — una sonda che non può
fallire non controlla niente — applicata allo strumento con cui si controlla
tutto il resto.*

**cg. ⚠️ In un documento che resta, una sonda va attribuita a CHI l'ha fatta
girare.** Il controllo strutturale sulla spec v65 è stato fatto due volte: la
sonda **del ragionamento** contava i titoli fino a tre cancelletti, diede 84 e
84, ed era cieca al titolo nuovo a quattro che il ragionamento stesso aveva
aggiunto; la sonda **di Code** contava tutti i cancelletti, diede 84 e 85, e il
titolo lo trovò. *La prima stesura di questa lezione raccontava il fatto al
passivo — "è stato annunciato", "contava" — senza dire di chi fosse la sonda
stretta. Il primo che l'ha letta se l'è attribuita e l'ha contestata: non fra
sei mesi, subito. Il fatto era giusto, la frase no. In un documento che
qualcun altro eredita, un soggetto sottinteso non è brevità: è un buco che il
lettore riempie con sé stesso.*

---

## 26) Le costanti dello sconto unificate, e il silenzio di next build (09/08/2026)

### 26a) Il lavoro

Le tre costanti di GIVEMEFIVE vivono ora in **`lib/givemefive.js`**, modulo di
sole costanti importato dai quattro posti che prima le riscrivevano. Dettagli in
**spec §14 v66**. Due commit, spinti: `11b3ce6` il codice, `a7ebbdf` la prova.

⚠️ **CONTROPROVA PRIMA DI TOCCARE, e va rifatta ogni volta.** Prima di
unificare, la soglia è stata spostata di proposito da 25 a 40: **12 prove sono
cadute**, con nome e riga. *Senza quel gesto, "le prove passano ancora" alla
fine del lavoro non avrebbe voluto dire niente — poteva significare che quei
numeri non erano coperti da nessuna prova.* Rifatta dopo, sulla catena nuova:
spostata la soglia **nel modulo unico**, cadono di nuovo 12. È questo che
dimostra che il filo dal punto unico fino alle prove è attaccato.

### 26b) ⚠️ `next build` compila in silenzio su un import che non esiste

**Il fatto più importante della giornata, e non riguarda lo sconto.** Aggiunto
di proposito all'import di `app/page.js` un nome inesistente, `next build` ha
risposto `✓ Compiled successfully`: **nessun errore, nessun avviso, nemmeno una
menzione del nome inventato**.

Il valore sarebbe diventato `undefined` e sarebbe proseguito. Nel caso nostro
avrebbe reso `undefined` una soglia o un importo, e il cliente avrebbe letto
conti privi di senso mentre server e prove restavano verdi. *È il difetto che
si scopre da una recensione, non da un errore.*

⚠️ **Vale per QUALUNQUE import del progetto.** La compilazione dice che il
codice sta in piedi, non che chiede cose che esistono. *Ogni volta che si
sposta qualcosa in un modulo nuovo, "il build passa" non è una verifica: è un
rumore rassicurante.*

### 26c) La prova nuova, e le due prove che sorvegliano sé stessa

`tests/givemefive.test.mjs`, 13 prove, **legge** `app/page.js` come testo
invece di importarlo — senza React non parte. Le suite passano a **diciotto**,
le prove a **714**.

Due difese aggiunte da Code **senza che gli fossero chieste**, ed è il motivo
per cui la prova vale:

* una fallisce **se la riga di import sparisce del tutto**: senza, un file
  senza import passerebbe in silenzio, perché la sonda non troverebbe niente da
  controllare e direbbe di sì. *Un sì per assenza di domande.*
* una verifica **su un caso finto che la sonda sappia riconoscere un import**:
  altrimenti direbbe sempre "nessun import" anche con dieci import dentro.

*È la regola del progetto — una sonda che non può fallire non controlla niente
— applicata alla sonda stessa.*

Provata in tutti e due i versi prima di essere accettata: sporcato l'import,
**2 prove cadono** ed esce con codice 1; aggiunta una funzione dentro il modulo
delle costanti, **2 prove cadono**. Rimesso tutto, verde. *E il ripristino non
è stato dichiarato a memoria ma dimostrato: `git status` non vedeva quei file.*

### 26d) Cosa si è saputo del pannello di pubblicazione

Guardando il pannello, non il codice, sono emerse **tre cose che nessuna prova
può accorgersi che mancano** — piano da portare a Pro, font da autorizzare sul
dominio vero, Stripe da portare in reale. Sono ora in **spec §6c**, sezione
nuova.

⚠️ **E si è scoperto che il sito è già raggiungibile** su
`km-direct.vercel.app`. *Non è mai stato chiuso: era sconosciuto. La differenza
non era registrata da nessuna parte, e tutte le frasi di questi documenti che
dicono "non lo raggiunge nessuno" vanno lette come "nessuno lo conosce".*

### 26e) Due lezioni

**ch. ⚠️ La compilazione non è una verifica, è un rumore rassicurante.**
`next build` non sa distinguere un import giusto da uno che chiede una cosa
inesistente. *Quando si sposta del codice in un modulo nuovo, la domanda da
farsi non è "compila?" ma "chi controlla che i nomi combacino?". Se la risposta
è nessuno, quella è la prova da scrivere prima di committare.*

**ci. ⚠️ Un avvertimento in un commento è una difesa che funziona solo se
qualcuno legge.** In cima al modulo delle costanti c'era scritto di non
aggiungerci funzioni. È diventata una prova che fallisce. *Ogni regola scritta
in un commento è una regola che aspetta di essere violata da chi ha fretta:
quando si può, va trasformata in qualcosa che si arrabbia da solo.*


---

## 27) I font tolti, e i commenti allineati (09/08/2026, sera)

### 27a) Il lavoro

Tolti i diciassette `fontFamily: "inherit"` scritti riga per riga: **`f3422b3`**,
cinque file, **17 righe tolte e zero aggiunte**. Poi **`f1955af`**, che ha
corretto i due commenti in `app/globals.css` rimasti a dire che quelle righe
esistevano ancora. Dettagli in **spec §6b v67**. *Con questo entrambi i lavori
piccoli registrati in v64 sono chiusi.*

⚠️ **Perché la pulizia è sicura, e non è perché compila.** Né `next build` né
le 714 prove guardano lo schermo: un carattere sbagliato non fa fallire nulla.
La garanzia sta **tutta** nel controllo fatto PRIMA di togliere — ogni riga
verificata sull'elemento su cui stava — e in un diff di **sole rimozioni**, che
per costruzione non può cambiare comportamento.

⚠️ **Il punto dove ci si poteva far male erano gli stili condivisi.** Sette
delle diciassette stavano dentro oggetti riusati in più punti: `fieldStyle` su
dieci `<input>`, `inputStyle` su sei e su sette elementi diversi. *Uno stile
usato in dieci punti può finire su un elemento che la regola non copre, e ne
basta uno.* Sono stati seguiti **tutti i consumatori**, non il primo.

### 27b) ⚠️ Due lezioni sulle sonde, dalla stessa giornata

**La prima: un numero sbagliato si corregge cambiando strumento, non il
numero.** Verificando che nessuna riga di CSS fosse stata toccata, la sonda ne
ha contata **una**. Era falsa: la parola italiana *«riga:»* dentro una frase ha
la stessa forma di una proprietà CSS — nome, due punti. *La sonda non è stata
ritoccata per farla tornare: è stata rifatta con un altro criterio*, marcando
ogni riga come dentro o fuori da un blocco `/* … */` e guardando dove cadessero
le otto righe aggiunte. Zero fuori. **E il falso positivo è stato riferito
invece che nascosto**, perché per un momento lo schermo diceva il contrario.

**La seconda: contare non è capire.** Nel comando di spegnimento era scritto
come un fatto che i quattro processi `next` fossero «avanzi di sessioni
precedenti». Non lo erano: i PPID mostrano una sola catena — shell → `npm exec`
→ `next dev` → `next-server`. *Quattro anelli di un server solo. Il numero era
giusto, la lettura no: era una deduzione da un conteggio, presentata come
accertamento.*

### 27c) Lo spegnimento del server

Fatto con i tre riscontri: zero processi, zero in ascolto sulla porta, e la
chiamata a `localhost:3000` che **prima dava 200 e poi non risponde più**. *È il
terzo che chiude la questione: senza, "non trovo processi" è una sonda che non
ha trovato, non una prova che non ci sia niente.*

⚠️ **Il sistema segnala il comando in background come "fallito", codice 144,
mentre lo spegnimento è riuscito.** È il guscio della shell che muore, e non
misura niente. *Chi non lo sa crede che lo spegnimento non sia riuscito e prova
a rifarlo. Registrato il 09/08 perché è già la seconda volta che quel segnale
inganna.*

### 27d) Una lezione

**cl. ⚠️ Quando una frase vive in più copie, correggerne una sola è peggio che
non correggerne nessuna.** La stessa affermazione — che i `fontFamily` fossero
sparsi nel codice — stava in **tre** posti: due commenti nel CSS e la spec.
Corretta in uno solo, gli altri due non sarebbero diventati "vecchi": sarebbero
diventati **una contraddizione**, e chi legge non ha modo di sapere quale delle
tre versioni è quella vera. *È la stessa ragione per cui i valori non si
scrivono due volte — ma vale per le frasi, non solo per i numeri.*


### 27e) La riga che nessun controllo poteva trovare

⚠️ **L'intestazione di questo handoff dichiarava la spec alla v64 mentre era
alla v67.** Ricostruito da git commit per commit: la copia ha smesso di essere
aggiornata dopo `efabb37`, ed è rimasta falsa per tre versioni. *Il danno era
contenuto solo perché la riga stessa rimandava all'intestazione della spec.*
Corretta il 09/08/2026 **togliendo il numero**, non aggiornandolo.

**cm. ⚠️ Un controllo che confronta con una lista trova solo ciò che la lista
nomina.** Ogni verifica di questa giornata chiedeva: *le zone attese ci sono, e
non ce n'è una in più?* Tre volte la risposta è stata sì, ed era vera. Ma una
zona che **doveva** cambiare e non è cambiata **non compare in nessun diff**: è
invisibile per costruzione a quel tipo di verifica. *È lo stesso buco della
sonda che conta i `PASS` — sa dire "non c'è di più", non sa dire "non manca
niente". Quando si aggiorna un documento, alle zone attese va affiancata almeno
una domanda dell'altro tipo: cosa, in questo file, DOVEVA muoversi e non si è
mosso?*

---

## 28) GIVEMEFIVE ridisegnato: il campo del codice sconto (10/08/2026)

Giornata di **sole decisioni**: nessun commit di codice, una sola spec
(`319feff`). Il lavoro è partito per costruire lo spostamento deciso in v65 ed
è finito per **ridisegnarlo**, su proposta di Andrea, in una forma più semplice
e più difendibile.

### 28a) Lo stato ritrovato, e un commit che nessun documento nominava

La sessione è cominciata con `origin/main = 972389e`, un commit che **non
compariva né in spec né in handoff**: il registro in cima a questo documento si
fermava a `ec84ea5`, il cui messaggio annunciava già *"v67 e handoff"*. Non è
stato dedotto: è stato **eseguito**. `git show --stat` ha detto che `972389e`
tocca **un solo file**, `handoff/HANDOFF.md`, +27/−3 — è la correzione della
riga che dichiarava la spec alla v64 (punto 27e), fatta trentanove minuti dopo
`ec84ea5` rileggendo. *Nessun lavoro nascosto: il documento in mano era già
quello giusto, e lo si è verificato dal suo contenuto — il punto 27e esiste solo
dopo `972389e` — non dal nome del file.*

### 28b) Cosa c'era davvero nel codice, prima di decidere

Tre referti di sola lettura, e due sorprese, una per verso.

* ✅ **La parte pesante era già fuori dalla rotta.** `resolveProduct` e
  `resolveCombo` — le letture dei prezzi veri, la disponibilità, il menu, i
  combo — vivono in **`lib/checkout-resolve.js`** dalla v37/v46. Dentro
  `app/api/checkout/route.js` è rimasto **solo il ciclo** che le chiama,
  moltiplica per la quantità e somma.
* ⚠️ **Ma un ricalcolo riusabile NON esiste.** Quel ciclo è saldato dentro
  `POST` (righe 101-414, una delle **due sole** funzioni del file, verificato
  con una sonda che vede anche le funzioni freccia). E
  `resolveDiscountAndTotal` **il subtotale non lo calcola**: se lo fa dare — il
  suo stesso commento dice che *non ha modo di sapere da dove arriva il numero
  che riceve*.
* ⚠️ **`lib/checkout-resolve.js` usa `supabaseAdmin` preso dall'alto**, non
  ricevuto come parametro (`await supabaseAdmin.from("products")`, visibile nel
  corpo). Per la regola scritta in cima a `checkout-discount.js`, un modulo che
  importi `supabase-admin` non è avviabile da una prova. *Questa conseguenza è
  dedotta dalla regola scritta, non eseguita: se un domani conterà, si accerta.*

### 28c) Perché la strada B, e cosa NON risolve

Tirare fuori il ciclo significa **riaprire `app/api/checkout/route.js`**, e per
la regola del punto 16 chi riapre quel file si porta dietro **sei lavori**
insieme. Il primo mattone di GIVEMEFIVE trascinava un pacchetto molto più
grosso di sé.

Andrea ha scelto la **strada B**: la rotta nuova **non tocca** quel file e
rifà per conto suo il giro corto — risolvi ogni riga con gli **stessi**
`resolveProduct` e `resolveCombo`, moltiplica, somma, arrotonda.

⚠️ **I sei lavori del punto 16 NON sono stati rimandati di nascosto: restano
aperti dove sono**, e si faranno quando quel file si riaprirà per un motivo suo.

**Il debito accettato, con la condizione che lo fa scadere**: due cicli invece
di uno. Regge finché quel ciclo resta *chiama, moltiplica, somma* — cioè finché
non prende decisioni proprie. *Il giorno che uno dei due decidesse qualcosa che
l'altro non decide, o servisse un terzo posto che calcola il subtotale, il
debito è scaduto e il ciclo va estratto sul serio.* Le decisioni pericolose —
prezzo, proteina, extra carne, disponibilità, combo — **restano in un posto
solo**, ed è questo che rende la copia sopportabile: non è la copia delle
costanti dello sconto, dove il valore era riscritto a mano.

### 28d) Il ridisegno: le decisioni sono in spec §14 v68, non qui

Non si ricostruiscono a memoria. In sintesi, solo per sapere di cosa si parla:
**dal sito GIVEMEFIVE sparisce** (niente banner, niente progressione, niente
pulsante) e nel checkout compare un campo **"Hai un codice sconto?"**; **il
pedaggio resta intatto** — la verifica risponde solo a checkout compilato e
carrello sopra soglia, mai al solo numero di telefono; **le sei risposte del
campo sono fissate parola per parola**; le due risposte *"non è valido"* e
*"hai già utilizzato"* restano distinte, **come baratto consapevole** e non per
distrazione.

⚠️ **Ciò che il campo NON cambia**: il ricalcolo della soglia lato server resta
il primo mattone e resta tutta la difesa; il **consumo** nel webhook e il
**rilascio** all'annullamento restano dove sono, senza cuore e senza prove.

### 28e) Cosa questo giro NON ha chiuso

* ⚠️ **L'upsell dei 25 € nel carrello** (§36-40): *vicino ai 25 € → suggerisci
  per raggiungere soglia* è rimasto scritto tale e quale, ma **quei 25 € erano
  la soglia di GIVEMEFIVE**, che il carrello ora non nomina più. Va deciso se
  sparisce, se resta con un'altra ragione, o se resta così. **Lasciato in
  evidenza invece che risolto d'ufficio.**
* ⚠️ **Due eventi delle statistiche** (§65) nascevano dal banner:
  `soglia_25_raggiunta` e `givemefive_applicato`. L'elenco dei tipi di evento è
  un **vincolo dentro il database**, quindi cambiarlo è DDL — lavoro di Andrea
  nell'editor SQL, non di Code. *Non toccato: le statistiche non sono ancora
  costruite e non era il momento.*
* **Il sistema di codici** resta un lavoro a sé, con le domande del 30/07 tutte
  aperte.

### 28f) Tre lezioni

**cn. ⚠️ Una difesa non si toglie spostandola su un gesto volontario.** Il campo
del codice sembrava eliminare il pericolo della fuga di informazioni sui
clienti: non lo elimina, lo sposta — chi cerca l'elenco scrive GIVEMEFIVE e
prova i numeri, invece di limitarsi a digitarli. *La proposta iniziale prevedeva
di chiedere il telefono se mancava: sarebbe stato il distributore automatico
chiuso l'08/08, riaperto due giorni dopo da una porta diversa. Il pedaggio va
riaffermato ogni volta che cambia la facciata, perché la facciata sembra
innocua e la difesa non sta lì.*

**co. Una domanda senza risposta buona a volte si scioglie cambiando chi fa la
domanda.** *Prudente o generoso* — se la verifica si guasta, tacere e far
perdere 5 € a chi ne aveva diritto, oppure mostrare uno sconto che su Stripe
sparisce — era una scelta fra due danni, e ci si era arenati sopra. Il campo la
dissolve: **a un gesto si può rispondere *"riprova"***. *La domanda non è stata
risolta, è diventata inutile. Vale la pena accorgersene prima di scegliere il
meno peggio.*

**cp. ⚠️ I messaggi di una sessione possono sparire; il file no.** A metà
giornata la conversazione ha perso i propri messaggi e la spec v68 sembrava mai
generata. **Era sul disco**, prodotta alle 17:17, e a dirlo è stata
**l'impronta**, non il ricordo di nessuno. *Ed è la terza volta che la trappola
del nome scatta: il file buono era `..._r1_1.md`, quello col nome semplice era
il vecchio. Decide sempre lo sha256.*

*Seconda occorrenza della lezione del punto 27b* — **un numero che non torna si
chiude cambiando strumento**: il conteggio delle righe cambiate diceva 212 da
una parte e 214 dall'altra. Rifatto con lo stesso metro di `git`, **166 aggiunte
e 48 tolte** da entrambe le parti. Non era il file: era lo strumento. *Riferito
invece che lasciato cadere, perché uno scarto di due non guardato torna come
dubbio tre giorni dopo.*

---

## 29) GIVEMEFIVE spostato davvero: cinque commit e le prove con gli occhi (10-11/08/2026)

La catena di §14 è **chiusa**, nell'ordine obbligato e senza saltare anelli:
`c164b3b` il cuore, `e03bb4c` la rotta, `b6f6434` il campo nel checkout,
`d2ebc41` la sopravvivenza alla riapertura, `8df6018` il carrello che smette di
nominarlo. Le decisioni per intero stanno in **spec §14 v69**: qui c'è come si è
arrivati, che è ciò che la spec non racconta.

**Le prove sono passate da 714 a 862, le suite da 18 a 21.** Ogni pezzo è stato
committato solo dopo una controprova fatta **sporcando il codice vero** e
rimettendolo dalla copia con l'impronta riverificata — mai una dichiarazione di
aver ripristinato.

### 29a) Cosa la costruzione ha insegnato, che la decisione non sapeva

* ⚠️ **Un ricalcolo riusabile del subtotale non esisteva.** I lettori pesanti
  (`resolveProduct`, `resolveCombo`) erano già in `lib/checkout-resolve.js`, ma
  il ciclo che li chiama e somma era **saldato dentro `POST`**, e
  `resolveDiscountAndTotal` il subtotale non lo calcola: se lo fa dare. Estrarlo
  avrebbe riaperto il file del pagamento e fatto scattare i **sei lavori del
  punto 16** — da qui la **strada B**.
* ⚠️ **`checkout-resolve.js` prende `supabaseAdmin` dall'alto**, quindi nessuna
  prova può importarlo. Il cuore nuovo **riceve i lettori come parametri**: è
  l'unica ragione per cui 53 prove possono verificarlo per davvero.
* ✅ **`canPay` esisteva già** (`app/page.js`): la regola "il cliente ha
  compilato tutto" non è stata costruita, è stata **riusata**. Decisione di
  Andrea (11/08): **un metro solo**, anche al prezzo di una frase imprecisa se
  lo slot scade.
* ⚠️ **La sentinella del guasto si riconosce PER FORMA, non per identità.**
  Importarla avrebbe trascinato dentro il database. La rete larga — *tutto ciò
  che non è `null` e non è un oggetto con `unitPrice` numerico finito è un
  guasto* — cattura il `Symbol` **e anche una sentinella cambiata un domani**, e
  scarta il non-numero **prima** che entri nella somma: la conseguenza vera del
  difetto vecchio (un `NaN` che scavalca ordine minimo e controllo dei 18 anni)
  qui non può prodursi.
* ⚠️ **`giveMeFiveApplied` era conservato, `codiceApplicato` no.** Spegnere il
  carrello senza accorgersene avrebbe fatto sparire **in silenzio** la
  sopravvivenza dello sconto alla riapertura. È il motivo per cui `d2ebc41`
  viene **prima** di `8df6018`, e non è scritto in nessuna decisione precedente:
  è emerso leggendo.

### 29b) Le prove dal vivo — le uniche che contano qui

⚠️ **Nessuna prova automatica di questo progetto guarda lo schermo**, e i referti
di Code dichiarano *"non l'ha visto nessuno con gli occhi"* **due volte**: è
vero dal suo punto di vista, perché **le prove le fa Andrea e le riferisce nella
chat del ragionamento**, non a Code. *Chi legge i soli referti crederebbe che
questi pezzi non siano mai stati provati. Non è così.*

Verificate da Andrea, una per una: dati incompleti → la frase, **senza
interrogare il server**; codice inesistente → la sua frase; GIVEMEFIVE sopra
soglia → campo che sparisce, riga nel riepilogo, **totale che scala di 5 €**;
carrello sceso sotto soglia → sconto che cade; ⚠️ **telefono che aveva già
riscosso → rifiuto col suo messaggio** (è questa a dimostrare che la rotta legge
davvero `promo_redemptions` e non dice sì a chiunque); riapertura del checkout →
codice nella casella e sconto che torna da solo **rimessa la privacy**, ⚠️ **e la
controprova: senza rimetterla non torna**; carrello spento → nessuna traccia
dello sconto lì, suggerimento 20-25 € ancora presente col testo nuovo; e infine
⚠️ **un pagamento vero in sandbox col totale scontato arrivato fino a Stripe** —
l'unico modo per sapere che l'intenzione arriva a destinazione ora che il
carrello non la accende più.

### 29d) Quattro lezioni

**cq. ⚠️ UN DIVIETO SCRITTO IN CIMA NON SI VEDE DAL PUNTO CHE LO CONTRADDICE.**
In sei comandi ci sono state **quattro sviste di chi li scrive**: una regoletta
sbagliata sul nome del file scaricato, un *"non eseguire le prove"* in cima a un
comando il cui punto 3 le eseguiva, un pulsante *"premibile solo se canPay"* che
alla pressione doveva parlare, e una prova impossibile da eseguire (*"restando
nel checkout, torna al carrello"*). Tutte e quattro viste da Code o da Andrea.
**Il rimedio adottato: il divieto sta attaccato al punto a cui si riferisce, mai
in un preambolo generale.** *E le regolette comode sui nomi dei file non si
scrivono affatto: "il file buono è quello col `_1`" si è smentita al primo giro
utile, in silenzio.*

**cr. ⚠️ Una prova che sorveglia una cosa da togliere si CAPOVOLGE, non si
cancella.** Le nove prove che verificavano l'esistenza dell'interruttore del
carrello ora verificano che **nessuno lo rimetta**, e coprono cinque pezzi
invece di tre. *Cancellarle sarebbe stato legittimo e avrebbe lasciato un buco
silenzioso al posto di una difesa.*

**cs. Quando una sonda non reagisce, il sospettato è anche lo strumento.** Tre
volte in due giorni: una sporcatura che non aveva toccato il file (e la sonda
sembrava cieca), un `--include=*.js` mangiato dalla shell, una prova sulla
versione del formato costruita con la funzione che ci scrive **sempre** la
versione corrente — sarebbe stata verde per sempre. Chiusa scrivendo il numero
**letterale**: con la costante, quella prova avrebbe seguito qualunque cambio
senza poter più fallire.

**ct. Una domanda senza risposta buona può sciogliersi cambiando chi la fa.**
Registrata già come lezione `co` il 10/08 e **confermata dalla costruzione**: il
nodo *prudente o generoso* non è stato risolto, è diventato inutile. Un guasto,
a chi ha chiesto, si racconta.

---

## 30) Il telefono, la privacy e la rete su Glovo (11/08/2026, sera)

Tre commit di codice dopo la chiusura di GIVEMEFIVE, e **le prove salgono da
862 a 999**. Le decisioni per intero stanno in **spec §41-45 e §57-61**: qui c'è
come ci si è arrivati.

⚠️ **Due lavori chiesti da Andrea restano aperti**, ed è il primo posto dove
cercarli: il **prefisso internazionale** e l'**indirizzo nella scheda ordine**.

### 30a) L'ordine è cambiato in corsa, e per un motivo

Andrea aveva chiesto **prima il prefisso**. È finito per ultimo, e non per
dimenticanza: leggendo, `lib/generate-glovo-xlsx.js` — l'unico pezzo del
progetto che produce **un documento che va a una persona vera** — è risultato
**senza una sola prova**, e la funzione da modificare per il prefisso è proprio
lì dentro. *Modificarla a mano libera avrebbe voluto dire cambiare il file che
parla ai rider senza che nulla potesse diventare rosso.* Da qui l'ordine
effettivo: **rete su Glovo → controllo del telefono → prefisso**.

### 30b) Cosa la lettura ha trovato, che nessuno sapeva

* ⚠️ **Il telefono non era controllato affatto**: solo "non vuoto". `"ciao"`
  passava e arrivava al rider come `+39ciao`, perché `formatPhone` attacca
  `+39` a **qualunque cosa** non cominci con `+`.
* ⚠️ **E il telefono è la CHIAVE del cliente** — `onConflict: "phone"` al
  pagamento, e §14 che cerca esattamente quella stringa. *Due forme dello stesso
  numero sono due clienti, e lo stesso ordinante potrebbe riprendere GIVEMEFIVE.*
* ✅ **La frase della casella privacy non era sorvegliata da niente.** Le prove
  che nominavano la privacy guardavano il messaggio del **server**, un'altra
  frase in un altro file: chi avesse riscritto quella a schermo non avrebbe
  rotto nulla. Ora una suite veglia anche lo `stopPropagation`, **senza il quale
  aprire l'informativa spunterebbe da solo il consenso**.

### 30c) Le correzioni di Andrea, che il codice non poteva sapere

⚠️ **La regola sui cellulari era sbagliata, e l'ha corretta lui.** La prima
stesura pretendeva **10 cifre** dai numeri che iniziano per 3. Andrea: *ci sono
anche cellulari italiani a 9 cifre*. Vero, e quella regola avrebbe rifiutato
clienti esistenti — un difetto che nessuna prova può trovare, perché il codice
sarebbe stato coerente con sé stesso. *È scritta in spec col motivo e con
l'avvertenza che sembra una svista e non lo è.*

E la sua frase — *"Controlla il numero, è l'unico modo che abbiamo per
contattarti per la consegna"* — è stata scelta da lui e poi **estesa a qualunque
rifiuto**: al cliente non serve sapere quale regola ha violato, gli serve sapere
perché quel numero è necessario.

### 30d) Quattro lezioni

**cu. ⚠️⚠️ UNA PROVA CHE GIRA SU UNA MACCHINA CONFIGURATA COME LA PRODUZIONE
NON DISTINGUE CIÒ CHE È DICHIARATO DA CIÒ CHE È EREDITATO.** Tolto
`timeZone: "Europe/Rome"` dal modulo di Glovo, **nessuna prova cadeva** — perché
il Mac è già su ora italiana. Ma **Vercel è UTC**: là il file per il rider
porterebbe l'orario sbagliato, un'ora d'inverno e due d'estate, e in locale
tutto resterebbe verde. *Chiusa con una sonda che legge il modulo **come
testo** e pretende il fuso dichiarato. La lezione vale per ogni dipendenza
dall'ambiente — fuso, lingua, formato dei numeri: quella prova si scrive
guardando il testo del codice, non il suo risultato.*

**cv. Una sporcatura che non sporca somiglia moltissimo a una sonda cieca.**
Successo **tre volte in due giorni**, e ogni volta risolto verificando invece
che concludendo: una sostituzione che cercava una stringa inesistente nel file,
un `--include=*.js` mangiato dalla shell, una riga sporcata nel blocco
sbagliato. *Quando un controllo non reagisce, il sospettato è anche lo
strumento — e la differenza si vede solo guardando se il file è cambiato
davvero.*

**cw. ⚠️ Un confronto di testo può dire "non c'è" su un testo identico.** La
frase mostrata al cliente esiste sia nel codice sia in spec; nel documento
**va a capo in mezzo**, quindi un `grep` ingenuo l'avrebbe dichiarata assente.
Verificata **eseguendo**, ricomponendo l'a capo da entrambe le parti, con la
controprova di una versione storpiata che infatti non viene trovata.

**cx. Chi legge il documento non è chi l'ha scritto.** Prima del commit della
v70, Code ha proposto — **non richiesto** — di verificare che le sette decisioni
di Andrea fossero davvero nel testo, citandole una per una. *Chi genera il file
può dire solo cosa crede di averci scritto; il testo lo legge chi ce l'ha
davanti. Da ripetere ogni volta che un documento raccoglie decisioni prese a
voce.*

*Riferito da Code e registrato qui perché non si perda: un `next build` lanciato
col server di sviluppo acceso ha danneggiato la cartella `.next`. Da evitare —
prima si spegne il server, poi si costruisce.*

### 30e) Cosa questi lavori NON chiudono

* **I numeri già salvati** in database non sono toccati: chi avesse un numero
  storto da prima resta com'è. Da guardare alla pulizia pre-apertura.
* **`lib/generate-glovo-xlsx.js` continua ad attaccare `+39`** a ciò che trova.
  Oggi riceve solo numeri che hanno passato il controllo, ma **quella riga andrà
  disinnescata quando arriverà il prefisso**: con la tendina, un numero che il
  cliente ha dichiarato francese non deve prendersi un `+39` davanti.
* **La colonna del codice per Glovo può uscire vuota** mentre il commento la
  dichiara «Mai vuota»: regge per costruzione altrove, non per un controllo lì.
* ⚠️ **Nessuna prova dice che il file sia accettato da Glovo**: provano la forma
  prodotta, non che il fornitore la digerisca. Verifica da fare **una volta
  sola**, caricando un file vero.

---

## 31) Il prefisso internazionale e l'indirizzo in scheda (12/08/2026)

Tre commit di codice, **prove da 1104 a 1220** e suite da 25 a 27. Con questi,
**i tre lavori chiesti da Andrea l'11/08 sono tutti chiusi**: la casella
`(OBBLIGATORIO)`, il prefisso, l'indirizzo in scheda. Le decisioni per intero
stanno in **spec §41-45, §52-56 e §57-61**.

### 31a) L'ordine è cambiato ancora, e ancora per un motivo

Andrea aveva chiesto il prefisso **per primo**, ed è arrivato **per ultimo**.
Fra la richiesta e l'esecuzione si sono infilati due lavori che erano sue
premesse, scoperte leggendo: il **file per il rider senza una sola prova** e il
**telefono senza alcun controllo**. *Il prefisso è poi atterrato su un campo
protetto invece che scoperto, ed è il motivo per cui non ha rotto niente.*

### 31b) Il difetto che si sarebbe aperto in silenzio

⚠️ **La cosa più importante della giornata, trovata prima di scrivere codice.**
Fino all'11/08 un numero che cominciava con `+` imboccava la regola larga e
**saltava sia le 9-10 cifre sia il controllo 0/3**. Con la tendina *tutti* i
numeri cominciano con `+`: **le decisioni del giorno prima si sarebbero spente
da sole**, senza un errore, senza una prova rossa, con `+391331234567`
accettato.

*La riga che lo causava era stata scritta con una buona ragione — chi digita
`+39` a mano dichiara lui il paese — e non era diventata sbagliata: era
diventata **cieca**, perché con la tendina "avere il `+`" smette di significare
"l'ha scritto il cliente". È il modo tipico in cui una difesa muore: non viene
tolta, viene svuotata di senso da un cambiamento accanto.*

### 31c) Le decisioni di Andrea del 12/08

* **(P) Comanda la tendina, sempre.** Un `+` scritto a mano non dichiara più il
  paese: il numero viene rifiutato. *Prezzo accettato: chi incolla il proprio
  numero dalla rubrica con il `+39` davanti si vede un rifiuto.*
* **(R) Il numero si salva col prefisso**, `+393331234567`, **una forma sola per
  tutti**. ⚠️ *Si è potuto fare adesso perché **in database non ci sono clienti
  reali** e verrà svuotato prima del go-live — cosa che Andrea ha dovuto
  ripetere tre volte prima che finisse in spec, dove ora sta.*
* **(X) Nella scheda ordine anche citofono, piano, scala e note rider**, con le
  **righe vuote che non si mostrano**.
* **(Y) Via la riga del civico**, decisa **guardando la scheda dal vivo**:
  ridondante, perché l'indirizzo di Google contiene già il numero. *E il caso
  "indirizzo senza civico" non esiste, perché il sito non lascia proseguire
  senza — verificato nel codice prima di scriverlo nel commento.*
* **Il salto dei numeri d'ordine** quando un cliente torna indietro da Stripe:
  ⚠️ **guardato e lasciato com'è**, e Andrea ha chiesto esplicitamente **di non
  scriverlo in spec** — non è cambiato nulla, quindi non c'è nulla da scrivere.
  *Registrato qui solo perché non venga riaperto come se fosse una scoperta.*

### 31d) La tabella dei paesi: un divieto che andava distinto, non aggirato

`lib/phone-countries.js` esiste, con 245 paesi, prefissi e bandiere **emoji**
(nessuna immagine, nessuna libreria). Ma la spec vietava in maiuscolo *"una
tabella dei paesi del mondo"*.

⚠️ **Il divieto riguardava le LUNGHEZZE, non i prefissi**, e la differenza è nel
modo in cui l'errore si manifesta: *una lunghezza sbagliata **rifiuta un cliente
vero in silenzio** — le numerazioni cambiano senza avvisarci e chi non riesce a
ordinare non scrive per dirlo, va altrove; un **prefisso** sbagliato **si vede
subito nel menu**.* La distinzione è ora scritta in spec **e in cima al file**.

✅ *E il commento di `customer-phone.js`, che portava il divieto generico, è
stato corretto nello stesso giro: lasciandolo, il file nuovo sarebbe stato
cancellato da qualcuno che citava la regola sbagliata.*

### 31e) Due difetti trovati dalle PROVE, non dalle letture

1. ⚠️ **`(333) 1234567` veniva rifiutato**, cioè un numero giusto scritto fra
   parentesi — forma che la decisione (D) dice di **ripulire**, non di
   rifiutare. Il prefisso veniva attaccato al testo **grezzo**, e la parentesi
   finiva dove il codice si aspetta una cifra. *Nessuna prova del giro
   precedente poteva vederlo: là il campo non esisteva.* Chiuso facendo
   ripulire il testo **al modulo della regola** invece di riscriverne una copia.
2. **Un conteggio scritto a occhio** in una prova (4 invece di 3): la prova è
   diventata rossa e ha imposto il numero che il codice produce davvero.

### 31f) Tre lezioni

**cy. ⚠️ UNA DIFESA NON MUORE TOLTA, MUORE SVUOTATA DA UN CAMBIAMENTO ACCANTO.**
Il caso del `+` (31b): la riga era giusta ieri e sarebbe stata cieca oggi, senza
che nessuno la toccasse. *Ogni volta che si aggiunge un pezzo, la domanda non è
solo "cosa rompe" ma **"quale condizione, altrove, smette di significare quello
che significava"**.*

**cz. Un divieto scritto in maiuscolo va DISTINTO, non aggirato né ignorato.**
La tabella dei paesi sembrava vietata. La risposta giusta non era né
rinunciarci né farla di nascosto, ma **capire cosa il divieto proteggeva** —
l'errore silenzioso — e scrivere la distinzione dove il divieto viveva.

**da. Chi guarda dal vivo vede cose che nessuna prova vede.** La riga del civico
era ridondante e **1220 prove verdi non potevano dirlo**: l'ha visto Andrea
guardando due righe una sotto l'altra. *Come la regola sui cellulari a 9 cifre
dell'11/08: le prove verificano la coerenza del codice con sé stesso, non con il
mondo.*

---

## 32) La Fase 4: il pannello crea Roll e Bowl complete (12/08/2026, sera)

**Sei commit**, prove da 1331 a **1497**, suite da 28 a 31. Era **l'ultimo
lavoro pre-go-live**: da oggi non ne resta nessuno. Le decisioni per intero
stanno in **spec §63-64 e §17**: qui c'è come ci si è arrivati.

✅ **Il lavoro chiesto da Andrea — la MODIFICA delle opzioni — è stato costruito
il 13/08 per due terzi**: cuore e rotta. Manca la schermata. Racconto al punto
**33**.

### 32a) Il primo passo era accertare, e l'accertamento ha detto più del previsto

I documenti dicevano *"verosimile che il residuo label→id non tocchi la Fase 4,
perché pesca da un elenco chiuso"*. ✅ **Misurato, è più netto: nessun punto del
codice SCRIVE `product_choice_options`** — non un `insert`, non un `update`, non
un `delete`. Il residuo è pericoloso solo dove si può **rinominare**, e quel
potere non ce l'ha nessuno. *Vale finché il pannello fa **scegliere**.*

### 32b) Il buco che c'era da sempre

⚠️ **Il server accettava un ordine SENZA PROTEINA** su un prodotto che le ha.
Non era un difetto nostro: c'era **da sempre**, invisibile perché il sito
preselezionava sempre qualcosa. Lo stesso server pretendeva l'accompagnamento —
per la proteina quel controllo non era mai stato scritto.

**La Fase 4 stava per renderlo raggiungibile**: dal pannello l'ordine delle
proteine lo decide chi crea l'articolo, quindi "la prima" può essere una
proteina **con sovrapprezzo**.

⚠️ **E i punti che ripiegavano sulla prima erano TRE, non due.** Il terzo è
quello che rifà la scelta **cambiando Roll dentro il combo**: lasciarlo avrebbe
significato che aprendo il combo nessuna proteina è scelta ma **cambiando Roll
ne compariva una da sola** — la trappola armata proprio nel percorso che nessuno
riguarda. *Trovato da Code, non era nel comando.*

⚠️ **L'ordine dei tre lavori era obbligato**: server, poi sito, poi il ripiego.
*Invertirlo avrebbe fatto arrivare in cucina un Roll senza proteina senza che
nessuno vedesse un errore: **scambiare un difetto rumoroso con uno silenzioso è
sempre un cattivo affare**.*

### 32c) Due volte fermarsi ha evitato una decisione presa dal codice

* **Il catalogo delle proteine non esisteva.** Le proteine vivono come righe
  attaccate a ogni prodotto, **mescolate con i "Gusto" dei dolci**. Code si è
  fermato: servivano due decisioni — come distinguerle, e **quale etichetta
  vince se due prodotti la scrivono diversa**. ⚠️ *La seconda era la pericolosa:
  scegliere "la prima che capita" avrebbe attaccato al prodotto nuovo un nome
  che il checkout cerca PER NOME, cioè il residuo che rientra dalla porta di
  servizio.* ✅ **Sciolto da una lettura del database fatta da Andrea**: ogni
  chiave ha **una sola etichetta**, quindi la seconda decisione non serviva. *Il
  codice però **si ferma con un errore** se un domani ne trovasse due: non
  dipende dal fatto che oggi vada bene.*
* **Non esisteva un modo di sapere quali categorie prevedono le opzioni**, né
  un elenco delle rimozioni già usate raggiungibile dal pannello. Anche lì Code
  si è fermato invece di inventarli.

### 32d) Le decisioni di Andrea, dodici in una giornata

GG (tutti e quattro i gruppi), CC (proteine col sovrapprezzo, anche zero), DD
(si aggiunge e si toglie, non si rinomina), JJ (elenco costruito da ciò che
esiste), RR (proteina obbligatoria, "nessuna" è una scelta), WW (l'articolo
nasce spento), YY (il titolo si scrive), A (una schermata sola), D (proteine
come caselle), B (lettura a sé) e b (tutte le categorie tranne le bevande) —
più la scelta di **includere le tre colonne** prima escluse, cambiando idea
quando è emerso che senza di esse un KM Special ricreato non sarebbe uguale
all'originale.

⚠️ **La più sottile è WW, realizzata al contrario di come suona.** "Se una
scrittura fallisce l'articolo nasce spento" si farebbe creandolo acceso e
spegnendolo in caso di guasto — ma **quello spegnimento è una scrittura in più
che può fallire a sua volta**, lasciandolo acceso e incompleto. *Così nasce
spento e si accende come ultimo atto: il guasto non ha bisogno che nulla
riesca per essere innocuo.*

### 32e) Tre lezioni

**db. ⚠️ UNA SUITE CHE MUORE ALLA PRIMA PROVA ROSSA MENTE SUL NUMERO, E MENTE
TRANQUILLIZZANDO.** Sporcando il codice cadeva **una** prova e sembravano sonde
deboli: la suite si interrompeva e le altre **non venivano eseguite affatto**.
Corretta, le stesse sporcature ne fanno cadere **diciassette**. *Il difetto si è
ripresentato in un punto nuovo il giorno dopo, ed è stato chiuso in **tutte** le
occorrenze del file, comprese quelle preesistenti che nessuno aveva visto.*

**dc. Fermarsi è una risposta, e va data.** Due volte in una sessione Code non
ha costruito ciò che il comando chiedeva, perché costruirlo era **decidere**:
il catalogo delle proteine e la regola sulle categorie. *In entrambi i casi la
decisione è poi arrivata da Andrea e in un caso — le etichette — da una lettura
del **database**, che solo lui può fare.*

**dd. ⚠️ Ciò che si assomiglia non sempre va accorpato.** Nelle rimozioni,
`"Senza hummus"` e `"Senza  hummus"` (due spazi) restano **due voci** nella
tendina: per il checkout, che cerca per nome, sono due rimozioni diverse, e
accorparle farebbe **sceglierne una credendo di sceglierne un'altra**. *Una
"pulizia" ovvia che sarebbe stata un difetto.*

---

## 33) La modifica delle opzioni: cuore e rotta (13/08/2026)

**Tre commit di codice**, prove da 1497 a **1599**, suite da 31 a 33. Il lavoro
chiesto da Andrea il 12/08 è costruito per due terzi: manca la **schermata**,
che è il passo rischioso — perché fondere modifica e creazione significa toccare
la creazione, che funziona e che Andrea ha provato dal vivo il 12/08.

### 33a) Metà del lavoro era già fatta, e l'abbiamo scoperto invece di supporlo

⚠️ **Il carrello faceva già la cosa giusta.** Prima di costruire, la domanda era:
*cosa succede a chi ha nel carrello un Roll con l'Adana, se togli l'Adana?*
Andrea ha deciso — **via la riga intera, il combo intero se è un combo, mai la
sola proteina** — e la lettura ha mostrato che `lib/cart-persistence.js` fa
**esattamente** quello, per il prodotto singolo e per il combo, dal giorno che è
stato scritto. *Non abbiamo toccato niente.*

*La decisione di Andrea, per esteso: la proteina è **obbligatoria** (regola RR),
quindi togliere la sola proteina lascerebbe una riga d'ordine incompleta — lo
stato che il lavoro del 12/08 ha reso impossibile. Un piatto senza il suo pezzo
non è un piatto con una scelta in meno: non è ordinabile.*

### 33b) Lo scudo, e perché è la prima scrittura

Fra il cancellare le opzioni vecchie e scrivere le nuove, un Roll sarebbe per un
istante **senza proteine e in vendita**. L'articolo viene quindi **tolto dal menu
prima di toccare qualunque riga** e rimesso come ultimo atto.

⚠️ *È il ragionamento **opposto** a quello della creazione (regola WW), e per la
stessa ragione: là spegnere alla fine sarebbe stata "una scrittura in più che può
fallire"; qui, se lo scudo fallisce, **nessuna opzione è ancora stata toccata** e
l'articolo resta intero e in vendita. Ogni volta la domanda è la stessa — **cosa
resta se si spezza qui** — e la risposta cambia col contesto.*

### 33c) ⚠️ IL DIFETTO DEL 12/08, E COSA INSEGNA

Costruendo lo scudo è emerso che **la Fase 4, committata il giorno prima,
trattiene un articolo incompleto con `is_available`** — e
`app/api/cron/reset-availability` **ogni mattina rimette a true tutti i prodotti
esauriti**. Un articolo lasciato a metà da un guasto sarebbe **tornato in vendita
da solo l'indomani**, incompleto, senza che nessuno avesse fatto niente.

⚠️⚠️ **E la regola era già scritta in §63-64 dal 07/08**, nel paragrafo che
spiega perché `is_in_menu` esiste. *Non è stato un fatto ignoto: è stato un
paragrafo non letto da chi ci stava lavorando sopra.*

**Nessuna prova poteva vederlo: le prove non fanno passare la notte.** *È stato
trovato **leggendo il cron** per costruire un'altra cosa. Una classe di difetti
che nessuna suite intercetta — quelli che dipendono dal tempo che passa — e
l'unica difesa è leggere cosa gira quando nessuno guarda.*

### 33d) Due cose accertate che nessuno aveva mai guardato

* ⚠️ **NESSUNA ROTTA DEL PANNELLO VERIFICA CHE L'ARTICOLO SIA DI QUESTO STORE.**
  `create` è la sola che risolve lo store, e lo fa per **assegnarlo** a una riga
  nuova. *Non è un problema con un negozio solo. Il giorno del secondo va chiuso
  **per tutte e sette le porte insieme**: chiuderlo in un punto solo lascerebbe
  le altre sei aperte e darebbe l'impressione che il problema sia risolto. Due
  prove fissano lo stato accertato e diventano rosse se qualcuno lo chiude a
  metà.*
* ⚠️ **L'IDENTITÀ delle righe delle opzioni non serve a nessuno** — nessuna
  chiave esterna, gli ordini copiano chiave, etichetta e prezzo, il carrello
  riaggancia per etichetta, il pagamento cerca per nome. *Per questo si possono
  sostituire per intero a ogni salvataggio: **sostituire non rinomina**, e la
  regola DD resta la difesa.*

### 33e) Tre lezioni

**de. ⚠️⚠️ UNA REGOLA SCRITTA NON È UNA REGOLA LETTA.** Il difetto del 12/08 è
stato commesso da chi aveva quel paragrafo davanti, nello stesso documento su
cui stava lavorando. *Scrivere una regola è necessario e non è sufficiente: la
sua unica difesa vera è che qualcosa diventi rosso quando la si viola. Le prove
non potevano, perché il difetto scattava a otto ore di distanza.*

**df. ⚠️ UNA SUITE MUORE IN DUE MODI, E IL SECONDO NON ERA COPERTO.** Su una
prova rossa prosegue; su una prova che **esplode** si interrompe **senza stampare
il conteggio**, e chi legge vede solo dei PASS e nessun totale. *E c'è un terzo
caso: se l'errore avviene **prima** che le prove partano — un file che non
esiste — nemmeno la protezione per-prova basta. Chiuso in **3 suite su 33** con
una rete che stampa "il numero qui sopra NON è il totale". **Le altre 30 hanno
ancora il difetto**: lavoro registrato, da fare.*

**dg. Prima di costruire, chiedersi se sia già costruito.** Il carrello (33a) è
il secondo caso in due giorni — dopo `canPay` dell'11/08 — in cui la cosa da fare
esisteva già e bastava leggerla. *La domanda "come si fa" viene dopo la domanda
"c'è già".*

*E un fatto di metodo, riferito da Code: uno strumento di modifica automatica
(`perl -0pi`) ha **rovinato la codifica** di un file di prove, storpiando tutti
gli accenti. Riparato riga per riga e verificato. **Da non usare su questo
progetto**: i commenti sono pieni di accenti e di ⚠️.*

---

## 34) La rete prima della fusione: i ventuno campi del corpo di creazione (24/08/2026)

**Un commit di codice**, `477cd00`, prove da 1599 a **1611**, suite **ferme a
33**. Più la spec v74, `adbd155`. ⚠️ **La fusione della schermata NON è stata
cominciata, ed è la decisione della giornata**: prima la rete, poi il lavoro
rischioso.

### 34a) Perché la rete viene prima, e non è prudenza generica

Il rischio della decisione BB non è la modifica: è la **creazione**, che
funziona e che Andrea ha provato dal vivo il 12/08. ⚠️ *E il modo in cui si
rompe non è un errore che si vede — è **un campo che smette di partire**. Il
server risponderebbe come sempre.*

Prima di oggi **niente sapeva dirlo**. Le prove della Fase 4 vegliano il
**cuore**, e il cuore non cambia: cambia il modulo che gli parla. Il difetto
sarebbe vissuto nel pezzo che nessuna prova guardava, e sarebbe emerso solo
rifacendo a mano un Roll intero. *Stessa forma del difetto del 12/08: non un
fatto ignoto, un punto senza sentinella.*

### 34b) ⚠️⚠️ DODICI CAMPI SU VENTUNO IL SERVER LI ACCETTA IN SILENZIO

Accertato leggendo `app/staff/page.js`, `lib/menu-create.js` e
`lib/menu-options.js`. Il modulo di creazione manda **ventuno campi** su quattro
livelli di annidamento. Il server **ne pretende nove** e rifiuta a voce alta se
mancano; **ne accetta dodici in silenzio** e ci mette un ripiego:
`description`, `badge`, `sort_order`, `spice_level`, `noAllergens`, `dietary`,
l'intero `options`, `is_default`, `extra_dose_included`, `choice_label`,
`requires_protein`, `max_quantity`.

⚠️ **Il gruppo "non lo legge affatto" è VUOTO**, verificato campo per campo.
*È un'assenza accertata, non un'assenza di ricerca — la differenza fra le due è
tutta.*

⚠️⚠️ **`extra_dose_included` e `max_quantity` sono le due peggiori**, e per una
ragione in più: le altre dieci hanno almeno un lettore a valle che un giorno
mostrerebbe il valore sbagliato. **Queste due oggi non le legge nessuno.** Se
smettessero di partire, **non lo vedrebbe nemmeno una prova dal vivo** — non c'è
niente, nel sito, che le mostri. Si scoprirebbe il giorno in cui qualcuno
costruisce il calcolo del prezzo, sui dati già scritti male.

### 34c) La sonda, e perché è chiusa nelle due direzioni

`tests/menu-create-form.test.mjs`, esteso e non duplicato. Diventa rossa **se un
campo dell'elenco sparisce** e **anche se nel corpo ne compare uno che l'elenco
non ha**. ⚠️ *Una prova che verificasse solo la presenza troverebbe solo ciò che
nomina: il giorno della fusione un campo **in più** passerebbe inosservato — e
il caso non è teorico, `ProductEditForm` manda già `id: product.id` e la
creazione no.*

⚠️⚠️ **QUANDO DIVENTA ROSSA DURANTE LA FUSIONE, SI AGGIORNA L'ELENCO CON
INTENZIONE**, campo per campo, guardando il corpo vero. **Non si cancella e non
si allarga**: è l'unica cosa che sa dire quali campi partivano prima.

Tre scelte di forma: il blocco si **cerca nel testo** e non si indica per numero
di riga, che al primo ritocco si sposta; è una **sonda di testo** perché il
pannello non è importabile fuori da Next; ed è dentro una **suite esistente**,
così la stessa vigilanza non si spezza in due.

### 34d) ⚠️ CIÒ CHE LA SONDA NON PROTEGGE

`removals` e `accompaniments` **non vengono composti** dentro quel blocco:
passano interi come stanno nello stato, e la forma delle loro righe (`label`,
`contains_gluten`) vive altrove. *Non è urgente — il server pretende entrambi, e
`contains_gluten` come booleano esplicito, quindi la scomparsa sarebbe
**rifiutata a voce alta**. Scritto qui perché non si scopra il giorno che serve.*

### 34e) Tre lezioni

**dh. ⚠️ UN "VERBATIM" CON DEI BUCHI NON È UN VERBATIM.** Il primo referto sul
corpo della creazione presentava 43 righe su 59 come copiate integralmente, e le
sedici mancanti cadevano **dentro** gli oggetti dove stanno i campi. Erano
commenti — *ma non si poteva saperlo prima di guardare*, e l'elenco dei ventuno
sarebbe stato una conclusione tratta da un testo bucato. *Il rimedio che ha
funzionato: far ristampare il blocco con `cat -n` e **pretendere che l'ultimo
numero fosse 59**. Una controprova che il testo non può superare per caso.*

**di. ⚠️ L'ASSENZA DI UNA PAROLA NON È UNA PROVA.** Dopo la spinta, `git status
-sb` non stampa `ahead` quando i rami coincidono — ma non lo stampa neanche in
altri casi. *Verificato invece con due sonde che sanno dire di no: zero commit
in `origin/main..HEAD`, e lo stesso oggetto per HEAD e per `origin/main`.*

**dj. UNA DATA NEL DOCUMENTO NON È LA DATA DEL COMMIT.** `718fd18` porta data
git **21/08** e il suo messaggio dice *"stato al 13/08"*: otto giorni. ⚠️ *I
documenti di questo progetto datano **la giornata di lavoro**, non il
salvataggio. Non è un difetto e non va corretto — ma va saputo da chi confronta
`git log` con questi testi, o li troverà in contraddizione.*

---

## 35) La giornata delle decisioni: la schermata unica prende forma (25/08/2026)

⚠️ **Zero commit di codice.** Uno solo, `3ac16f6`, ed è la **spec v75**. *Spec
prima del codice: le quattro decisioni di Andrea sono scritte prima che qualcuno
tocchi il pannello.* Suite e prove **ferme a 33 e 1611**, non toccate.

**Le decisioni stanno in spec §63-64 e NON si ricostruiscono da qui**: (BB) la
scheda unica, (EE) bevande e salse dentro, (FF) la conferma sul sovrapprezzo a
ogni cambio, (HH) la categoria si cambia ma dopo la fusione, (KK) un Salva solo
che chiama in fila le rotte dei pezzi toccati, più **l'ordine di costruzione in
sette passi**. *Qui c'è solo ciò che la ricognizione ha trovato e che la spec
non racconta.*

### 35a) Cosa sa già fare la scheda di modifica: molto meno del previsto

`ProductEditForm` (`app/staff/page.js`, righe 963-1221) manda **sette campi** a
`/api/staff/menu/product`. ⚠️ *Forma diversa dalla creazione: **non c'è nessuna
variabile `payload`**, il corpo è scritto in linea dentro la `fetch`.*

* **sei in comune** con la creazione — `name`, `description`, `base_price`,
  `badge`, `sort_order`, `spice_level` — **con le stesse tre conversioni** riga
  per riga (`Number()`, `badge` vuoto → `null`, prezzo come stringa). *Per
  questi sei la fusione è meccanica: i due moduli fanno già la stessa cosa.*
* **uno solo suo**: `id`.
* **quindici le mancano**: `category`, i tre degli allergeni, e **undici** che
  sono tutto il mondo delle opzioni.

La rotta `product` è sottile: legge il corpo intero e passa a
`updateProductCore` in `lib/menu-editor.js`, che scrive **sette colonne**
dichiarate in `EDITABLE_FIELDS`. ⚠️ *Se non è cambiato niente **non scrive
affatto**, e `spice_label` **viene ignorata apposta** se arriva: la dicitura la
ricava il server dal livello.*

### 35b) ✅ Gli allergeni si correggevano già — il sospetto era sbagliato

Il 25/08 avevo sospettato che gli allergeni di un articolo esistente non fossero
modificabili da nessuna parte. ⚠️ **Era una deduzione dall'assenza, ed era
falsa**: esiste `AllergensEditForm`, una **scheda separata** che chiama
`/api/staff/menu/allergens` mandando `{ kind, id, allergenIds, noAllergens,
dietary }`. *Registrato perché il sospetto stava per diventare un lavoro.*

### 35c) ⚠️ La categoria invece NON è modificabile, e non è una rotta che manca

Cercando chi scrive `category:` in `lib/` e `app/api/`, gli unici punti sono
l'**inserimento** della creazione e due **letture**. **Nessun percorso del codice
cambia la categoria di un articolo già creato.** *Non è un buco da tappare con
una rotta: è la ragione per cui (HH) è un lavoro a sé, dopo la fusione.*

### 35d) Le rotte del menu sono OTTO, non sette

`ls -R app/api/staff/menu/`: `allergens`, `availability`, `create`, `options`,
`product`, `product-options`, `visibility`, **più `route.js` nella radice** —
`/api/staff/menu`, quella che il pannello usa per leggere l'elenco.

⚠️ **Sette delle otto hanno un chiamante nel pannello. `product-options` è
l'unica che nessuno chiama**: cuore e rotta esistono dal 13/08 e nessun pezzo di
interfaccia li conosce. *Confermato con una ricerca che, sullo stesso metodo,
trova la chiamata a `create` alla riga 1791 — e allargata agli URL composti a
pezzi, che nel menu non ce ne sono.*

⚠️ **DA VERIFICARE, non concluso**: questo documento e la spec parlano in più
punti delle *"sette rotte del pannello"* a proposito dello store non verificato.
Sotto `menu/` ne risultano **otto**. *Può darsi che il conteggio a sette
escludesse di proposito la rotta in radice, che è di sola lettura e non riceve
nessun id di articolo — ma **non l'ho verificato**, e va guardato il giorno in
cui si chiude lo store.*

### 35e) ✅ La conferma sul prezzo esiste già ed è il modello di (FF)

In `ProductEditForm`: `confirmingPrice` acceso da `priceChanged`, che è una
**disuguaglianza** — quindi scatta **in aumento come in diminuzione**. Non è una
finestra: la fila dei pulsanti **si sostituisce** con un riquadro arancione che
mostra i **due prezzi in chiaro**, vecchio e nuovo, e i pulsanti *Conferma e
salva* / *Annulla*. Finché si conferma, **"Salva" non esiste**. Il primo gesto
accende soltanto il riquadro. Si spegne da solo anche se il salvataggio
fallisce. *(FF) si copia da qui: non c'è niente da inventare.*

### 35f) Quattro lezioni

**dk. ⚠️ UNA CONTROPROVA PUÒ PASSARE PER IL MOTIVO SBAGLIATO.** La ricerca sugli
allergeni doveva trovare la rotta di creazione per dimostrare di non essere
cieca, e **l'ha trovata — dentro un commento**. La rotta scrive gli allergeni
**delegando**, senza mai nominarli. *Una rotta che li scrivesse delegando e
senza quel commento sarebbe sfuggita. Il rinforzo che ha funzionato: cercare
chi scrive sulla **tabella**, dove la logica vive davvero.*

**dl. UN ELENCO SI GUARDA, NON SI INTERROGA.** Le rotte del menu sono otto
perché sono state **elencate** con `ls -R`. ⚠️ *Una ricerca per nome trova solo
ciò che il nome indovina: la rotta in radice non si chiama come le altre e
sarebbe sfuggita.* È la stessa forma della lezione già scritta al punto 33.

**dm. ⚠️ UN CONTROLLO SCRITTO ALLA LETTERA CHIEDE LA COSA SBAGLIATA.** Due volte
in due giorni un controllo è stato formulato come *"la parola X non compare da
nessuna parte"* mentre intendeva *"non esiste una dichiarazione autonoma di X"*,
e Code si è dovuto fermare a chiedere. *Il rimedio: chiedere la **forma esatta**
da cercare — per esempio le righe che cominciano con `**Versione `, non la
parola `Versione`.*

**dn. UN NUMERO ATTESO DAL DIFF DIPENDE DALL'ALGORITMO.** Il conto annunciato era
118/30, git ne ha dati 119/31. ⚠️ *Non era il file: l'algoritmo predefinito
(Myers) contava una **riga vuota** come tolta+aggiunta invece di riconoscerla
come contesto. Con `--patience`, `--histogram` o `--minimal` il conto tornava
esatto.* **Un divario di una riga per parte, con contenuto identico, è quasi
sempre questo — ma va verificato, non supposto.**

---

## 36) La fusione cammina: quattro passi in un giorno, e un guasto evitato (25/08 sera – 26/08/2026)

**Otto commit di codice e prove**, più la spec v76 (`905c4a0`). Suite da 33 a
**34**, prove da 1611 a **1658**. ⚠️ **Il passo 4b — il salvataggio delle
opzioni — NON è stato cominciato, ed è una scelta.**

*Le decisioni stanno in spec §63-64 e **non si ricostruiscono da qui**. Questo
punto porta ciò che la costruzione ha insegnato e che le decisioni non
sapevano.*

### 36a) ✅ Le prove dal vivo di Andrea — nessuna prova automatica può darle

*Le suite leggono il pannello **come testo** e non aprono nessun browser. Senza
queste righe i referti direbbero «nessuno l'ha visto».*

* **25/08 sera, passo 1**: la scheda rinominata crea un Roll completo. *Il
  collaudo della rete è passato: la sonda dei ventuno campi è rimasta verde
  **da sola**, senza che nessuno toccasse l'elenco.*
* **26/08, passo 2**: la scheda si apre piena su `Roll prova`, il nome si salva,
  e ⚠️ **la conferma sul prezzo compare in aumento COME IN DIMINUZIONE** — è
  (FF) verificata da una persona, non dedotta dalla disuguaglianza nel codice.
* **26/08, passo 3**: allergeni salvati; su **Tzatziki** senza tipo dietetico il
  Salva si spegne toccando gli allergeni e **non** si spegne cambiando solo il
  prezzo; il blocco c'è sulle **salse** e non c'è sulle **birre**.
* **26/08, passo 4a**: le opzioni compaiono, e ⚠️ **Andrea le ha verificate
  anche su un Roll VERO del menu**, non solo su quelli di prova. *È il controllo
  che contava: i Roll veri esistono da mesi e sono stati scritti in altri modi.*
* ✅ **Chiusa una voce aperta che non era di codice**: Yogurt e Tzatziki hanno
  ora il tipo dietetico, compilato da Andrea dal pannello.

⚠️ *Curiosità utile: il caso provato al passo 3 — il Salva spento perché manca
il tipo dietetico — **non esiste più**, perché Andrea ha poi compilato quei due
flag. La protezione resta per gli articoli futuri, e sappiamo che funziona
perché è stata vista mentre il caso c'era ancora.*

### 36b) ⚠️⚠️ IL GUASTO EVITATO, ed è la cosa più importante della giornata

**Il cuore delle opzioni non aggiusta: SOSTITUISCE.** Un gruppo assente nel
corpo vale come **gruppo vuoto**, quindi diverso dal "prima", quindi quella
tabella viene **cancellata e riscritta**.

⚠️ **Se il passo 4 fosse stato fatto tutto insieme, una scheda che non sapeva
quali rimozioni ed extra ha l'articolo glieli avrebbe AZZERATI.** Proteine e
accompagnamenti sono protetti da un rifiuto rumoroso; **rimozioni ed extra no:
sparirebbero in silenzio, con un 200 in risposta.**

*Non è stato trovato provando: è stato trovato **leggendo il cuore prima di
scrivere la scheda**. Ed è la ragione per cui il 4a — far vedere le opzioni —
non è un abbellimento ma la condizione perché il 4b non distrugga dati.*

### 36c) Il lettore, e la lettura in un posto solo

⚠️ **Nessuna rotta dello staff sapeva dire quali opzioni ha un articolo.**
L'elenco del menu porta gli allergeni ma non le opzioni; la rotta che si chiama
`options` è **un'altra cosa** — i due cataloghi piatti di tutto il menu, senza
nessun `product_id`. *Il nome somigliava, la cosa era diversa: da qui la regola
di non dedurre mai cosa fa una rotta dal suo nome.*

`GET /api/staff/menu/product-options/[id]` + `lib/menu-options-reader.js`.
⚠️ **La lettura è stata TOLTA dal cuore che salva e messa nel lettore**, che il
primo ora importa: *due letture delle stesse tabelle possono divergere, e il
giorno che divergono la scheda mostra una cosa e il salvataggio ne scrive
un'altra.*

⚠️ **E i nomi delle colonne NON coincidono con quelli che il modulo a schermo
usa**: `choice_key` contro la chiave della Map, `price_delta` numerico contro
stringa, `requires_protein` **null** contro stringa vuota, il titolo che in
database sta **su ogni riga** e a schermo è **uno solo**. La conversione sta in
**un punto solo**, e ⚠️ *il lettore fa la `select` **senza `.order()`**: senza
riordinare per `sort_order` le proteine sarebbero comparse alla rinfusa.*

### 36d) Le due reti, e il buco che ne è uscito

* **Ventuno campi** in creazione (`eb`, 24/08) — **undici** in modifica (`et`,
  26/08). *Prima del 26/08 il corpo della modifica non lo guardava nessuno: sei
  campi al passo 2, undici al passo 3, tutti al passo 4b.*
* ⚠️ **Un assert sorveglia il confine fra i due ritagli**, e nasce da un difetto
  della prima rete che nessuno aveva visto: *il ritaglio della creazione tiene
  solo perché la funzione della modifica sta **sopra**. Spostandola sotto, o
  dichiarandovi dentro un `payload`, i due elenchi si guarderebbero a vicenda i
  campi e la sonda diventerebbe rossa per il motivo sbagliato.*

### 36e) `d1` riscritta con intenzione

Da *«il pannello non nomina `product_removals`»* a **«il pannello non fa nessuna
operazione sul database»**. Il 4a ha dovuto nominare quella tabella **per
leggere una chiave della risposta**, non per scrivere.

⚠️ **La decisione (DD) è viva e resta sorvegliata da `d2` e `d3`**: ciò che si è
rotto era il **segnale**, più largo della regola. *La sonda nuova è più severa,
non più permissiva.* E distingue la `delete()` del database da `next.delete(id)`
**dalla forma della chiamata** — senza argomenti contro con argomenti — non da
una lista di eccezioni da tenere aggiornata.

### 36f) Cinque lezioni

**do. ⚠️ UNA PROVA CHE SI AGGIUSTA NON È UNA PROVA — MA UNA CHE SI RESTRINGE
CON INTENZIONE SÌ.** `d1` è stata riscritta, non rilassata: prima vietava una
parola, ora vieta qualunque scrittura. *Il discrimine è che la **regola** non è
cambiata, è cambiato il **segnale** che la sorvegliava. E la decisione l'ha
presa chi ragiona, non chi scrive: Code si è fermato e ha chiesto.*

**dp. ⚠️ UNA SONDA CHE LEGGE IL FILE VERO PUÒ NON POTER FALLIRE.** L'assert sul
confine fra i due ritagli legge il pannello, dove l'intrusione non c'è, e per
farla accadere si sarebbe dovuto spostare codice — che era vietato. *Rimedio:
simulare l'intrusione **incollando il blocco vero della modifica dentro il
blocco vero della creazione**, in memoria. Senza, era un assert che non poteva
diventare rosso, cioè niente.*

**dq. ⚠️ UN DIFETTO PUÒ LASCIARE VERDE TUTTA LA BATTERIA ESISTENTE.** Installato
di proposito il difetto "un guasto di lettura diventa lista vuota", la suite del
cuore che salva è rimasta **verde, 51 su 51**. *È la misura di cosa mancava: non
«le prove passano», ma «quali difetti le prove sanno vedere».*

**dr. ⚠️ LE SONDE DI SISTEMA MENTONO, E SEMPRE ALLO STESSO MODO.** Tre volte in
due giorni: `ps` che conta **la riga del proprio comando** perché la parola
cercata era nel testo stampato; `head -n -2` che **su macOS non esiste** e
produce un blocco vuoto invece di un errore; `diff` e `grep -c` che **escono
con codice 1** trovando qualcosa, troncando la catena `&&` — così un lavoro
sembrava fatto e non lo era. *Famiglia unica: **il silenzio che sembra
successo**.*

**ds. UN NUMERO DI RIGHE ATTESO DAL DIFF VA CHIESTO CON `--patience`.**
Confermato due volte: l'algoritmo predefinito conta **una riga vuota** come
tolta+aggiunta. *Il divario è sempre di uno per parte, e il contenuto è
identico — ma va verificato, non supposto.*

---

## 37) Il giorno in cui non si è scritto niente: il 4b letto per intero (27/08/2026)

**Zero commit di codice. Zero righe scritte.** Quattro ricognizioni di sola
lettura, una misura sui dati veri eseguita da Andrea, e sei decisioni. ⚠️ *Suite
e prove restano **34** e **1658**, misurate eseguendole: **non dovevano
muoversi**, e il fatto che non si siano mosse è il controllo, non un'omissione.*

*Le decisioni stanno in spec §63-64 (blocco della v77) e **non si ricostruiscono
da qui**. Questo punto porta ciò che la lettura ha insegnato.*

### 37a) ✅ Le prove dal vivo di Andrea — nessuna prova automatica può darle

* **Il font sul dominio vero**: Andrea ha guardato il sito su
  `ordina.kebabmediterraneo.it` e le scritte gli sono sembrate a posto.
  ⚠️ **Non chiude la voce di §6c**: un font non autorizzato non dà errori, e il
  confronto a occhio con `km-direct.vercel.app` non distingue i due casi. *La
  prova sta nell'elenco domini del pannello Adobe, non nel sito.*
* **La misura sui dati veri**, eseguita nel SQL editor: referto arrivato intero,
  35 righe su 35 dichiarate, ogni riga con accanto quante righe ha esaminato.
* ⚠️⚠️ **Il difetto del 4a sui dolci, FOTOGRAFATO.** Andrea ha aperto la
  Cheesecake nella scheda e ha mandato lo schermo. *È la scoperta più importante
  della giornata, e non è uscita da un ragionamento: è uscita da uno sguardo.*

### 37b) ⚠️⚠️ IL VUOTO CHE SI PRESENTA COME PIENO

Sulla Cheesecake la scheda scrive **"queste sono le opzioni che l'articolo ha
già"** — frase che compare **solo a lettura riuscita** — e il campo del titolo
contiene **`Gusto`**, che viene dalle righe lette. I dati sono arrivati. Poi
disegna **tre caselle di proteina vuote** e dei quattro gusti veri non c'è
traccia: la scheda sa disegnare soltanto le tre proteine del catalogo.

⚠️ *Oggi non fa danno perché il 4a non salva. Ma è la **stessa famiglia** contro
cui è stato costruito tutto il resto — il vuoto che mente — e nessuno l'aveva
previsto: la ricerca era partita per un'altra domanda.*

Riparazione decisa: **(PP)**, l'avviso, **dentro lo stesso passaggio del 4b**.

### 37c) La riga che oggi ha ragione e domani avrà torto

La condizione del Salva in modifica **non contiene nessuno** dei controlli sulle
opzioni che la creazione ha, e sopra c'è un commento che spiega perché **con un
buon motivo**: il blocco è spento, quindi non deve poter bloccare il
salvataggio. ⚠️ **Il 4b accende quel blocco.**

*Da quel momento il commento descrive una situazione che non esiste più, ma
resta lì a giustificare un'assenza in modo convincente. È **la forma esatta del
difetto del 12/08** (lezione `de`): non un fatto ignoto, ma un paragrafo che
diceva il vero in un altro momento. Controlli e commento vanno rifatti **nello
stesso passaggio della chiamata**, o si ottiene una scheda che salva opzioni
incomplete senza dire niente.*

### 37d) La misura ha tolto un muro e ne ha rivelato un limite

**Nessun ostacolo in database**: zero etichette divergenti su tre chiavi
confrontate, zero valori che il validatore rifiuterebbe, zero Bowl scoperte.
⚠️ *Il "tre" è ciò che rende valido lo "zero": con zero chiavi il confronto non
avrebbe guardato niente.*

**L'unico numero diverso da zero — 4 righe su 2 articoli — sono i gusti dei
dolci**, e da lì è nato tutto il resto: il limite accettato, il difetto del 4a,
e il lavoro registrato sull'inserimento in creazione. *Una misura fatta per
cercare un pericolo ne ha trovato un altro che non stava cercando.*

### 37e) Sei lezioni

**dt. ⚠️⚠️ CHI SCRIVE IL COMANDO PUÒ MANDARE SUL FILE SBAGLIATO, E CHI LO ESEGUE
DEVE FERMARSI.** Il comando del 27/08 chiedeva le chiavi dei quattro gruppi in
`menu-options-editor.js`, dove **non ci sono**: stanno in `menu-options.js`.
*L'errore è nato prendendo la parola "cuore" dei documenti e assumendo che il
cuore contenesse anche la lettura delle chiavi. Code ha dichiarato la
discrepanza, seguito la chiamata fino alla fonte vera, e detto da dove prendeva
i dati. **Se avesse aggiustato in silenzio, il referto sarebbe stato giusto e
inverificabile.***

**du. ⚠️⚠️ UNA LISTA TROVA SOLO CIÒ CHE NOMINA — E VALE ANCHE PER CHI RAGIONA.**
Cercando cosa il dominio vero facesse scattare, §6c è stato letto, ha dato tre
voci, e quelle tre sono state prese per l'elenco completo. **La chiave API di
Google era la quarta**, e viveva in §66 e nell'elenco delle condizioni di
apertura. *L'ha vista Code, non chi ragionava. Rimedio applicato alla spec: la
voce è stata **aggiunta anche a §6c**, che è la lista che si guarda prima di
incassare, e l'intestazione è passata da tre a quattro.*
⚠️ *I punti più vecchi di questo handoff dicono ancora **"le tre voci di §6c"**:
sono datati e non si riscrivono. **Fa fede questo punto e la spec v77.***

**dv. ⚠️ UNA SONDA PUÒ ESSERE CIECA PROPRIO SUL BERSAGLIO CHE LE HAI DATO.**
Cercando i controlli di tipo per **nome del campo**, la sonda ha trovato zero su
**sei campi su otto** — pur essendoci il controllo — perché le funzioni condivise
ribattezzano il valore (`valore`, `tetto`, `legame`). *Code ha misurato la
propria cecità e l'ha dichiarata invece di riferire lo zero. **Riferendolo,
avrebbe detto il falso su sei campi su otto.***

**dw. ⚠️ LA CONCLUSIONE GIUSTA PER LA RAGIONE SBAGLIATA È UN DIFETTO, ANCHE SE
LA CONCLUSIONE REGGE.** *"Trentaquattro `TUTTI I TEST PASSATI`, uno per suite,
quindi nessuna si è interrotta"*: il "uno per suite" non era misurato. La
conclusione era vera per un motivo più forte già disponibile — **le prove passate
erano esattamente 1658**, e una suite troncata avrebbe dato un numero più basso.

**dx. ⚠️ UN TIMORE VA MISURATO, NON ASSUNTO — E PUÒ ESSERE ROVESCIATO.** Il
sospetto era che il salvataggio **riscrivesse in silenzio** l'etichetta di una
proteina. Letto il codice, fa il contrario: su etichette divergenti **si ferma
con un errore**. *Il pericolo silenzioso non esisteva; ne esisteva uno rumoroso,
che era un muro. Sono due lavori diversi, e assumere il primo avrebbe fatto
costruire la difesa sbagliata.*

**dy. LEGGERE TUTTO PRIMA DI SCRIVERE COSTA UNA GIORNATA E NE FA RISPARMIARE
DIVERSE.** Quattro ricognizioni hanno stabilito che le forme combaciano, che i
tipi passano, che un campo di troppo è innocuo e che il database non oppone
ostacoli. *Se il muro delle etichette fosse esistito, sarebbe stato trovato
**dopo** aver scritto il 4b, e sarebbe stato cercato nel codice nuovo — dove non
era.*

---

## 38) Il 4b-1: le difese prima della chiamata, e tre prove che non controllavano niente (sera del 27/08/2026)

**Primo codice del 4b, scritto e pubblicato.** Il Salva spento finché le opzioni
non sono lette **(MM)** e l'avviso sulle scelte non disegnabili **(PP)**.
Commit `7624498` (pannello, `95 4`) e `7acd543` (prove, `138 0`), separati,
pubblicati. ⚠️ *Suite invariate a **34**, prove da 1658 a **1669**: +11, e le
suite **non dovevano** muoversi perché le prove nuove sono andate in una suite
esistente.*

*Le decisioni stanno in spec §63-64 (blocchi v77 e v78). **Non ricostruirle.***

### 38a) ⚠️⚠️ TRE PROVE DAL VIVO CHE NON HANNO CONTROLLATO NIENTE

*È l'errore più istruttivo della giornata, ed è di chi ragiona, non di chi
esegue.*

Il push era stato **trattenuto apposta**, per far provare Andrea prima di
pubblicare. Poi gli è stato chiesto di "provare dal vivo" — **senza dirgli che
quel giorno "dal vivo" significava un altro posto**. Per due giorni "dal vivo"
aveva sempre voluto dire *il sito pubblicato*, perché il codice veniva sempre
pubblicato prima. Andrea ha guardato il sito, che serviva ancora il codice
vecchio, e ha visto una schermata identica a quella della mattina.

⚠️ **Le tre prove non hanno controllato nulla — compresa quella sulla creazione,
che era la più importante di tutte.** *E il costo non è stato solo tempo: un
articolo di prova in più in database.*

**dz. ⚠️⚠️ CHI CHIEDE UNA PROVA DAL VIVO DICHIARA SEMPRE DOVE GUARDARE.** Sito
pubblicato o `localhost`, ogni volta, dentro la richiesta. *Chi chiede ha
un'informazione che chi esegue non ha — in questo caso "il codice non è
pubblicato" — e **cambiare una regola in silenzio e poi stupirsi del risultato**
è la stessa famiglia della lezione `de`: non un fatto ignoto, ma un contesto
cambiato che nessuno ha dichiarato.* **Regola scritta anche in spec §63-64.**

**ea. ⚠️ "OK" NON È UN REFERTO.** Alle tre prove rifatte Andrea ha risposto
*"ok, ok, ok"*. Due dei tre erano ambigui: la mattina, allo stesso punto, "ok"
avrebbe descritto una **schermata sbagliata**. *Le risposte sono state richieste
di nuovo in forma secca prima di scrivere qualunque cosa nei documenti.*
⚠️ **Una verifica dal vivo si scrive solo se è stata raccontata, mai se è stata
dedotta da un assenso.**

### 38b) ✅ Le prove vere, rifatte sul sito dopo la pubblicazione

* ✅ **LA CREAZIONE È INTATTA**: Roll completo creato, **il Salva si è acceso e
  l'articolo si è salvato**. *Era il rischio al primo posto del passo: **(MM)**
  finita anche sul ramo della creazione avrebbe spento quel pulsante per sempre.*
* ✅ **SULLA CHEESECAKE L'AVVISO COMPARE.** *Il difetto fotografato la mattina è
  chiuso nella stessa giornata in cui è stato scoperto.*
* ✅ **La scheda di modifica funziona.** ⚠️ **L'attesa iniziale si vede ed è "un
  po' lenta"** — parole di Andrea. *Oggi innocua. **Dal 4b-2 sarà il tempo in cui
  la scheda è aperta e non si può toccare.** Registrata ora apposta: scoperta
  dopo, sembrerebbe colpa del 4b-2.*

### 38c) Le controprove del 4b-1, e perché sono le migliori finora

Code non ha sporcato una copia in memoria: ha sporcato **il file vero**, visto le
prove diventare rosse, ripristinato dalla copia e **riverificato l'impronta**.
Nei due versi, ed è il verso che conta:

* tolta la condizione dal ramo della modifica → **3 rosse**;
* messa la condizione **anche nel ramo della creazione** → **1 rossa**, che è il
  pericolo messo al primo posto. ⚠️ *Quella prova esiste ed è rossa quando deve:
  il pulsante della creazione è sorvegliato.*

*E le prove **non sono sonde di testo**: ritagliano le espressioni vere dal
pannello e le eseguono con valori finti. È la differenza fra controllare che una
regola sia scritta e controllare che funzioni.*

### 38d) ⚠️ Una misura chiesta in forma sbagliata — di nuovo

Era stato chiesto: *"cerca `product-options` nel pannello, mi aspetto **una
riga sola**"*. Ne trova **due**, e la seconda è un **commento** che c'era già
prima. ⚠️ *È la lezione `az` ripetuta: **una domanda testuale posta per
verificare una cosa sostanziale**. La cosa da sapere era "il salvataggio non
viene chiamato", e la forma giusta è quella che Code ha usato rispondendo: le
righe che **chiamano** sono una sola, e le POST verso quella rotta sono **zero**,
sorvegliate da una sonda che conta le chiamate e non i commenti.*

### 38e) L'iniziativa di Code, dichiarata e approvata

Una riga che spiega **perché** il Salva è spento. *Motivo portato: su una
**bevanda** il blocco delle opzioni non si disegna affatto, quindi senza quella
riga il pulsante resterebbe spento **e muto** — e un pulsante spento senza
spiegazione si legge come un pannello rotto.* ⚠️ **L'ha dichiarata invece di
infilarla di nascosto, ed è il modo giusto di prendersi un'iniziativa.**

E due cose lasciate fuori **per forza, non per omissione**, entrambe con la
fonte citata invece che dedotta: i controlli sulle opzioni (renderebbero **non
salvabile una Bowl esistente**, il caso esatto che il vecchio commento
descriveva) e la seconda metà di **(PP)** (poggia su "opzioni toccate", che
nasce col salvataggio; spegnere sempre contraddirebbe la spec). ✅ *Il commento
che scade è però stato **riscritto subito**: è la metà del lavoro che si poteva
fare, ed è quella che protegge dalla lezione `de`.*

---

## 39) Il 4b-2a: il pulsante che non guardava niente, e una giornata di misure prima di scrivere (28/08/2026)

**Un difetto trovato leggendo, riparato in tre caratteri di sostanza, e provato
dal vivo sul sito.** Prima però quattro ricognizioni e una misura sui dati veri:
il codice è stato l'ultima cosa della giornata, non la prima.

Commit `8422ef8` (pannello, `11 2`) e `f8de6ea` (prove, `125 0`), separati,
pubblicati. ⚠️ *Suite invariate a **34**, prove da 1669 a **1678**: +9, e le
suite **non dovevano** muoversi perché le prove nuove sono andate in una suite
esistente.*

*Le decisioni stanno in spec §63-64 (blocco della v79). **Non ricostruirle.***

### 39a) ✅ Le prove dal vivo di Andrea — sul sito, col deploy verificato

*Fatte prima su `localhost`, poi **rifatte su `ordina.kebabmediterraneo.it`**
dopo aver controllato sulla dashboard Vercel che il deploy fosse concluso.*

1. ✅ **Il pulsante si spegne**: «Conferma e salva» spento col nome svuotato, e
   sopra *«Per salvare manca ancora: il nome»*.
2. ✅ **E torna a funzionare**: rimesso il nome si riaccende, premuto **salva
   davvero** e la modifica c'è. *È la prova che conta di più: storta, la
   conferma sul prezzo sarebbe diventata un vicolo cieco su ogni articolo.*
3. ✅ **La creazione è intatta**: `Roll di prova 7` creato e salvato.

*Le prove sul sito sono state fatte su `Roll di prova 6`.*

### 39b) ⚠️⚠️ IL DIFETTO: DUE PULSANTI CHE SALVANO, UNO SOLO SORVEGLIATO

Il pulsante «Conferma e salva» — quello che **sostituisce** il Salva quando il
riquadro della conferma sul prezzo è aperto — chiama `salvaModifica` **dritta**,
con un `onClick`, e non passa dall'`onSubmit` dove sta la guardia su `canSave`.
⚠️ *Non è una svista: è scritto nel file, con la sua ragione, per non ripassare
dal controllo che ha acceso il riquadro.*

**Fra la pressione e la prima chiamata di rete `canSave` non era guardato in
nessun punto.** *Misurato contando le occorrenze, non concluso dal fatto che la
guardia esistesse altrove.*

E la strada esiste: **mentre il riquadro è aperto il resto della scheda resta
modificabile.** Prezzo cambiato → Salva → riquadro → nome svuotato → partiva.

⚠️ **Era un difetto già vivo, non creato dal 4b.** Ma lasciarlo avrebbe fatto
scrivere in spec che i controlli stanno nel Salva: vero su una strada, falso
sull'altra. *La lezione `de` costruita di nostra mano nel passaggio nato per
evitarla.* Per questo è diventato un passaggio a sé, prima del 4b-2.

### 39c) ⚠️ LA PROVA CHE AVEVO CHIESTO ERA IMPOSSIBILE DA ESEGUIRE

Era stato chiesto: *«cambia il prezzo **e** svuota il nome, poi premi Salva»*.
**Col nome vuoto il Salva è spento**, quindi non si preme, quindi il riquadro non
compare mai.

**L'ordine giusto l'ha trovato Andrea provando**: cambiare il prezzo → premere
Salva → **poi** svuotare il nome. È l'unico che raggiunge quel pulsante nello
stato che serve, e **vale ogni volta che si tocca quel riquadro**.

**eb. ⚠️⚠️ UNA PROVA SI SCRIVE COME PERCORSO, NON COME FOTOGRAFIA DELLO STATO
FINALE.** *Chi la scrive elenca le condizioni che vuole vedere insieme, e non si
chiede se esista una sequenza di gesti che ci arriva. È la quindicesima volta che
un comando contiene una prova non eseguibile, e la forma è sempre questa.*

### 39d) ⚠️ LE PROVE SUL PREZZO SI FANNO SUGLI ARTICOLI DI PROVA

La prima tornata è stata fatta sul **Turco**, un articolo vero del menu. Andrea
ha rimesso il prezzo a mano.

**ec. ⚠️ UNA PROVA SUL PREZZO DI UN ARTICOLO VERO LASCIA IL DATABASE SPORCO
FINCHÉ QUALCUNO NON LO RIMETTE A MANO.** *Con un database solo e il sito
raggiungibile, **niente lo ricorda e nessun controllo lo vede**: un residuo così
si scopre da un cliente. Le prove che toccano il prezzo si fanno sugli articoli
di prova.*

### 39e) ✅ La misura prima di scrivere — otto righe su otto

*Interrogazione di sola lettura, scritta da Code ed eseguita da Andrea nel SQL
editor. Le decisioni e i numeri stanno in spec §63-64.* **Nessuno dei cinque
controlli scatterebbe da solo su nessun articolo esistente.**

⚠️ **I due controlli incrociati che rendono valido il referto**: 98 = 72+21+5 e
50 = 45+5. *Se un'interrogazione avesse guardato nella tabella sbagliata, quelle
somme non tornerebbero.*

⚠️ **Il timore da cui la misura è nata si è sciolto per una ragione più forte
della misura**: `price_delta` è `numeric not null`, quindi `proteineSenzaPrezzo`
non può scattare sui dati letti dal database. *Il ragionamento sulla Cheesecake
era giusto nella forma e sbagliato nel fatto, e il fatto stava in una riga di
schema che nessuno aveva chiesto.*

### 39f) Le tre obiezioni di Code all'interrogazione, tutte accolte

*Nessuna era un dettaglio, e una correggeva un errore di chi ragionava.*

1. **`proteineSenzaPrezzo` non si può tradurre in SQL** e resta fuori: guarda uno
   stato dell'interfaccia, non un dato.
2. **La metà «prezzo» di `extraIncompleti` è sempre falsa** per il tipo della
   colonna, quindi la riga che resta **vale il controllo intero, non una metà.**
3. ⚠️ **Le chiavi del catalogo sono QUATTRO, non tre** — `nessuna` compresa.
   *Chi ragionava aveva preso il «tre» dalla misura del 27/08, dove è una
   **fotografia dei dati**, non la regola. La regola sta in `lib/menu-options.js`
   e Code è andato a leggerla.*

⚠️ **E una asimmetria trovata rileggendo**: Code aveva dichiarato che lo schema
è *il documento, non il database* per pretendere la verifica sulle etichette, e
poi si era fidato dello stesso documento per le due colonne numeriche. *Le due
righe di verifica sono state aggiunte prima di eseguire, così la misura si è
lanciata una volta sola.*

### 39g) ⚠️ Tre cose registrate e NON aperte, tutte sullo stesso riquadro

*Tre facce dello stesso pezzo di scheda: si aprono insieme.*

1. **Il riquadro non si richiude da solo** se si rimette il prezzo com'era, e
   continua a mostrare *«8,50 € → 8,50 €. Confermi?»*.
2. **«Annulla» non ripristina il prezzo**: chiude e lascia il valore nuovo nel
   campo. ⚠️ *È la strada che aggira la conferma di §46.*
3. **«Annulla» non è sorvegliato da nessuna prova.** ⚠️ *Misurato sporcando il
   file vero: mettendogli `!canSave` addosso — che chiuderebbe l'utente dentro
   il riquadro con tutti e due i pulsanti spenti — **nessuna prova su 1678
   diventa rossa**. Oggi è scritto giusto; manca la sorveglianza. E il pulsante
   accanto è appena diventato il modello da cui si copia.*

### 39h) Le controprove del 4b-2a

Sul file vero, con impronta riverificata dopo ogni ripristino, **tre** volte su
tre. ⚠️ *La terza è nata da un errore del comando, che chiedeva di sporcare «un
pulsante della creazione» — che non esiste: il submit è **uno solo** e cambia
soltanto l'etichetta. Code non ha adattato la risposta, ha fatto una sporcatura
in più e ha detto cosa stava al posto di cosa.*

* tolto `!canSave` dal «Conferma e salva» → **5 rosse**;
* tolto dal submit → **2 rosse**;
* messo sull'«Annulla», dove **non** deve stare → **0 rosse**, ed è il punto 39g.3.

⚠️ *E gli ancoraggi del ritaglio sono stati scelti sul dato che caratterizza, non
sulla posizione: nel pannello ci sono **quattro** `type="submit"` e **tre**
«Conferma e salva», sparsi fra tre componenti. Un ancoraggio generico avrebbe
ritagliato il pulsante sbagliato.*

⚠️ **CORRETTA IL 29/08, perché questa frase è vera e fa concludere il falso.**
I tre pulsanti ci sono, ma **i riquadri di conferma SUL PREZZO sono due**: il
terzo, in `AllergensEditForm`, sorveglia la **rimozione degli allergeni**.
*Stessa etichetta, stessa forma, argomento diverso. È la forma d'errore di 42d
— il titolo letto senza la frase — dentro un documento invece che in una spec.*
*E le occorrenze grezze della stringa sono **quattro**: la quarta è in un
commento.*

### 39i) ⚠️ Le sedici lezioni che sembravano perdute NON lo erano

*Errore di chi ragionava, ripetuto tre volte nella stessa giornata, e istruttivo
proprio per questo.*

Contando le lezioni definite nel file con una ricerca costruita **sulla forma che
ci si immaginava**, ne risultavano 66 (sono **88**) e 17 rimandi rotti (erano 16,
poi **zero**). Le lezioni si scrivono in **tre forme diverse** nel file, e ogni
sonda vedeva solo la sua.

**La sfoltita del 06/08 non ha perso niente**: ha raccolto le lettere in **nove
famiglie**, e ogni famiglia porta le proprie lettere nell'intestazione. Chi cerca
`az` la trova nella famiglia 2, con la regola dentro. *Ciò che si è perso è
l'episodio, non la regola, ed era una scelta dichiarata.*

**ed. ⚠️⚠️ UNA SONDA COSTRUITA SU COME CI SI IMMAGINA IL TESTO MISURA LE PROPRIE
ASPETTATIVE — E CHI RAGIONA CI CASCA COME CHI ESEGUE.** *La stessa cosa è
capitata a Code nello stesso giorno, cercando le lezioni nella storia: il primo
giro ne trovava 10 su 17. Non ha riferito il 10: è andato a vedere dove fossero
finite le sette, ha trovato la terza forma e ha rifatto tutto. **È il verso
giusto: uno zero che sorprende si indaga, non si riferisce.***

⚠️ **Una correzione, misurata da Code e APPLICATA il 28/08.** Il documento
diceva che l'ultima versione integra **delle lezioni** è al commit `254ffad`:
**`254ffad` precede `fce1323`**, che è l'ultimo a contenerle. Le contengono
entrambi identiche, ma il puntatore andava a un commit più vecchio del
necessario. Corretto in un punto solo, nel punto 4.

⚠️ **E una che NON andava corretta, misurata il 28/08 prima di toccarla.** La
stessa impronta `254ffad` compare una seconda volta, nel punto 6-11f, e lì
**è giusta**: parla delle sezioni di **diario**, non delle lezioni, e `254ffad`
è davvero l'ultimo commit a contenerle — verificato su tutti i 298 commit del
deposito, con le controprove nei due versi. *Due frasi che puntavano allo stesso
commit per due ragioni diverse, una sbagliata e una esatta: chi avesse contato
le occorrenze della stringa invece di leggere cosa dicevano le due frasi avrebbe
rotto quella giusta. È la famiglia della lezione `bp`.*

### 39j) Cosa resta aperto — ⚠️ L'UNICO ELENCO. I nove blocchi precedenti sono stati tolti il 28/08 e le voci ancora vive sono state portate qui.

* ⚠️⚠️ **4b-2: ACCENDERE IL BLOCCO E RIMETTERE I CONTROLLI**, insieme. I
  controlli sono **cinque, non quattro**; il blocco si accende **su
  `opzioniLette`**, non togliendo il vincolo; e va creata la nozione di
  **opzioni toccate**, che non esiste. Qui va anche la seconda metà di **(PP)**.
  **Non la chiamata: quella è il 4b-3.** *Tutto in spec §63-64 v79.*
* ⚠️ **4b-3: LA CHIAMATA.** Il pezzo pericoloso, con l'impalcatura già provata.
* ⚠️ **IL RIQUADRO DELLA CONFERMA SUL PREZZO — tre difetti, un lavoro solo.**
  Vedi 39g. *Nessuno tocca i dati oggi; il secondo aggira §46.*
* ✅ **LA SFOLTITURA DEI DUE DOCUMENTI — CHIUSA il 28/08 da Andrea, e non
  perché sia finita: perché è stata MISURATA e non rende.** Fatte le giornate
  **18-25**, da **714 a 565** righe (−21%). Poi misurate due prove prima di
  proseguire: le giornate **26-27** danno **169 → 159** (−6%), la giornata
  **39** dà **222 → 198** (−11%). ⚠️ *Le giornate dal 26 in poi sono già
  scritte nella forma stretta: quasi tutto quello che contengono sono lezioni
  con la lettera, avvisi vivi e misure, che il criterio vieta di toccare.
  Continuare valeva circa centocinquanta righe su millecinquecento, in sette
  consegne e sette commit, con ogni consegna un'occasione di perdere una riga
  portante.* **Il documento pesa 3292 righe e il peso NON sta nelle giornate.**
  *Se qualcuno la riaprisse: il criterio è la consolidazione del 06/08, da ~150
  righe a ~30 senza perdere un rimando — si toglie il racconto e si tiene la
  decisione con la sua ragione; **non si toccano** le lezioni, le alternative
  scartate con la loro ragione, i divieti vivi, lo stato dei dati e ciò che è
  dichiarato aperto.* ⚠️ *E va fatta **da sola**: mescolata a un aggiornamento,
  il diff non è più verificabile.*
* ⚠️ **Prima della prova dal vivo del 4b-3, decidere se caricare `Roll prova` di
  rimozioni ed extra dal pannello.** *Ne ha **una sola**.*
* ⚠️ **L'attesa «un po' lenta»** all'apertura della scheda: registrata, non
  aperta. **Diventa visibile col 4b-2**, come blocco grigio.
* ⚠️ **LA CHIAVE API DI GOOGLE — scaduta il 26/08, non fatta.** Intervento di
  Andrea nella console. ⚠️ *Con due indirizzi vivi, la restrizione al singolare
  romperebbe il completamento dell'indirizzo sull'altro.*
* ⚠️ **Il font**: la voce di §6c **non è chiusa**. *La prova sta nell'elenco
  domini del pannello Adobe, non nel sito.*
* **L'inserimento dei gusti in creazione**, registrato e non aperto:
  `lib/menu-create.js` non è mai stato letto.
* **Poi i passi 5, 6 e 7**: conferma sul sovrapprezzo (FF), sparizione di
  `ProductEditForm`, cambio di categoria (HH). ⚠️ *Da tenere per il passo 6:
  `ProductForm` e `ProductEditForm` **stanno nello stesso file**,
  `app/staff/page.js`. ⚠️ **I confini sono stati scritti sbagliati DUE VOLTE.**
  *Prima 1493-2710 e 963-1221; poi 1493-2722 e 963-1210, corretti il 28/08 e
  già scaduti il giorno dopo.* La misura del **29/08**, presa dalla definizione
  alla chiusura: `ProductEditForm` **967-1209**, `ProductForm` **1518-3047**, su
  un file di **3681** righe — e anche questa è invecchiata col passo 5.
  ⚠️ **Non citarli da qui: rileggerli.** *Tre scritture sbagliate di fila sono
  la prova che questi numeri non vanno in un documento; restano solo perché la
  loro storia insegna a non fidarsene.*
* ⚠️ **OTTO ARTICOLI DI PROVA DA CANCELLARE**: `Roll prova`, `Roll di prova 2`,
  `3`, `4`, `5`, `6`, `7`, `8`. ⚠️ **NON PRIMA DEL PASSO 7** *(corretto il
  29/08: qui era scritto «non prima del 4b», e il 4b è chiuso dal 29/08 mentre
  gli otto servono ancora)*. **Il passo 5 tocca i prezzi e le prove sul prezzo
  si fanno su di loro**: `Roll di prova 6` è l'articolo su cui è stato provato
  tutto il passo 5, perché ha le proteine col sovrapprezzo.
* ⚠️ **VOCI RECUPERATE dai vecchi elenchi (28/08)**, che nessun elenco più
  recente aveva ripreso: la **tendina dei prefissi non è mai stata vista su un
  telefono** (bandiere e larghezza si giudicano lì, sul sito pubblicato); lo
  **Storico (`HistoryRow`) non mostra l'indirizzo** (non era chiesto); il
  **rifiuto lato server della proteina non l'ha osservato nessuno**, perché
  `checkout-resolve.js` non è eseguibile senza database; il **contorno del combo
  ha lo stesso ripiego** della proteina, non toccato perché la decisione parlava
  di proteine; ⚠️ **`extra_dose_included` e `max_quantity` non sono lette da
  nessuna riga di codice** — il pannello le scrive, ma perché servano dovrà
  leggerle chi calcola il prezzo.
* ⚠️ **La rete sul conteggio**: **30 suite su 34** non ce l'hanno.
* ⚠️ **La rete dei ventuno campi potrebbe essere cieca alla scorciatoia**
  (`key,` invece di `key: key,`), che è il difetto che è nata per vedere.
* **Lo store** non verificato, e il "nove rotte" è **ereditato**, non misurato.
* **Le CATEGORIE**, discusse il 12/08 e non aperte: crearne di nuove, spegnerle
  quando sono vuote, ordinarle. ⚠️ *Sono **tre facce dello stesso lavoro** —
  tutte e tre richiedono che le categorie escano dal codice e vivano in una
  tabella — e la domanda difficile sarà come una categoria nuova sappia **che
  tipo di categoria è**: le bevande sono esentate dagli allergeni, le Bowl
  pretendono l'accompagnamento.*
* ⚠️ **Il tetto delle righe dell'editor SQL** è stato cambiato il 27/08 e il suo
  valore vero **non è misurato**.

---

## 40) Il 4b-2: il blocco acceso, e la finestra muta che la prova ha aperto (28/08/2026, sera)

**Scritto in due pezzi, provato dal vivo sul sito, pubblicato.** Quattro commit:
`9baa54a` e `34f6dac` la fotografia e il confronto, `d3c371e` e `aa9d825` il
blocco e i controlli. Suite **36**, prove **1760**, zero fallite. *Le decisioni
stanno in spec §63-64 (blocchi v80 e v81). **Non ricostruirle.***

### 40a) ⚠️⚠️ LA FINESTRA MUTA, TROVATA DA ANDREA PROVANDO

Andrea ha aggiunto una rimozione a un Roll di prova, premuto Salva, riaperto la
scheda: **la rimozione non c'era.** Nessun errore, nessun avviso, salvataggio
riuscito.

**È corretto** — il 4b-2 costruisce il ricordo, il 4b-3 fa la chiamata — e il
pannello lo dice, in una riga sopra il blocco. ⚠️ **Ma Andrea, che sapeva come
funziona, non l'ha vista lo stesso.** *È la forma esatta del guasto muto che
questo progetto insegue da settimane, e vive nella finestra fra il 4b-2 e il
4b-3, oggi **aperta sul sito pubblicato**. Si chiude solo col 4b-3: è la ragione
per cui il 4b-3 non si rimanda.*

### 40b) ⚠️ IL PANNELLO HA SERVITO IL CODICE VECCHIO DOPO IL PUSH

La prima apertura della Cheesecake dopo la pubblicazione mostrava **il pannello
di ieri**: nessun avviso di (PP), e la frase *«questo articolo non ha nessuna
opzione»* — falsa su un articolo che due gusti ce li ha. Ricaricando a fondo
tutto era a posto.

⚠️ *Non è un difetto del codice, è la cache del browser. Ma falsa qualunque
prova dal vivo fatta subito dopo un push, ed è la seconda volta che una prova
dal vivo guarda il codice sbagliato — la prima fu il 27/08, quando il push era
stato trattenuto apposta. **Chi chiede una prova dopo un push dica anche di
ricaricare a fondo.***

### 40c) ⚠️ IL SALVA SPENTO SEMBRA ACCESO

Misurato da Code e poi visto da Andrea: il pulsante disabilitato **resta
arancione pieno**, `opacity: 1`, sfondo identico all'acceso. Cambia solo il
cursore in `not-allowed`. *Difetto **preesistente**, non creato dal 4b-2 — ma
tutto il 4b-2 serve a spegnere quel pulsante quando qualcosa non va, e un
pulsante che non si vede spento fa sembrare rotto il pannello.* **Aperto.**

### 40d) La forma delle mancanze, e perché nessun separatore poteva reggere

Con due mancanze la frase concatenava le voci con una virgola ed era
illeggibile. ⚠️ **Il difetto non era la virgola**: le voci contengono già
virgole, due punti, parentesi e virgolette basse, quindi **qualunque segno messo
fra le voci compare anche dentro le voci**. L'unica forma che regge è uscire
dalla riga: un elenco, una voce per riga. *Con una voce sola la frase resta
identica a prima.* Provata dal vivo da Andrea, ed è la prima volta che quella
forma è stata **vista con gli occhi**: Code l'aveva solo letta dal DOM, perché
il suo browser non gli mostrava la figura.

### 40e) Tre cose che Code ha fatto senza che gli fossero chieste

* **Ha azzerato la fotografia al cambio di articolo.** Senza, la fotografia di
  un articolo sarebbe rimasta valida sul successivo.
* **Ha corretto un numero nel messaggio di commit**: erano quarantatré prove,
  non quarantadue. *Il numero sbagliato l'aveva scritto chi ragionava, senza
  averlo contato.*
* **Si è fermato su `Roll di prova 8`**, che non c'era la mattina, ed è andato
  nel registro del server a stabilire che la scrittura non era sua invece di
  presumerlo. *Era la prova sulla creazione fatta da Andrea.*

### 40f) ⚠️ Due sonde troppo larghe, e cosa hanno insegnato

* **Una prova rossa cercava `disabled={inModifica}` in tutto il file** e lo
  trovava ancora: era il **`select` della categoria**, spento in modifica di
  proposito per **(HH)**. Code non ha allargato le maglie: ha ristretto la
  sonda e **ne ha aggiunta una che sorveglia quel `select`**, perché accenderlo
  insieme al blocco sarebbe stato un danno silenzioso.
* **Una suite esistente stava per morire**, non fallire: esegue la condizione
  vera del Salva, e con una variabile nuova non legata sarebbero sparite tutte e
  **92** le sue prove. Aggiunto il solo legame, **nessuna asserzione toccata**.

### 40g) Cose registrate e NON aperte

* ⚠️ **`mostraGruppiOpzioni` ripete la condizione del `fieldset` scritta al
  rovescio**, in un altro punto del file. *Oggi sono d'accordo. È il tipo di
  coppia che un giorno diverge.*
* ⚠️ **Nessuno ha mai osservato il momento dell'attesa** in cui il blocco è
  grigio: in locale è troppo veloce. Andrea l'ha giudicata sul sito e dice che
  **non dà fastidio**. *La voce «un po' lenta», registrata prima che si vedesse
  apposta per non farla sembrare colpa del 4b-2, è chiusa.*
* **`Il turco` è scritto con la t minuscola** nel menu, mentre gli altri Roll
  hanno l'iniziale maiuscola. *Lo vedono i clienti. È un dato, non codice.*

### 40h) ⚠️ Errori di chi ragionava, in questa giornata

* **Una prova chiesta su un articolo che non poteva eseguirla**: svuotare
  l'etichetta di una rimozione su `Roll di prova 6`, che rimozioni non ne ha.
  *È la lezione `eb` un'altra volta, e Code l'ha dichiarato invece di adattare
  la risposta.*
* **Un numero scritto senza averlo contato** nel messaggio di commit.
* **Un atteso misurato con una sonda cieca**: uno zero letto riga per riga su
  una frase che era spezzata da un a-capo. *Il documento diceva il vero; era il
  numero a essere sbagliato, e le due cose vanno tenute separate — altrimenti
  si corregge un testo giusto per far tornare una misura.*
* ⚠️ **Due domande tecniche girate ad Andrea come se fossero sue.** *Andrea non
  scrive codice: le scelte tecniche si prendono e si dichiarano, non si fanno
  approvare. A lui si chiede ciò che solo lui può sapere o decidere — le prove
  dal vivo, le priorità, i costi accettati, e tutto ciò che tocca il locale, il
  database vero o il momento dell'apertura.*

### 40i) ⚠️ myers e `--patience` danno numeri diversi sullo stesso file

Il riepilogo che git stampa dopo un commit usa **myers**. Il 28/08: **128/53**
contro 126/51 sulla spec, **201/350** contro 194/343 sull'handoff, e le zone
cambiano anche con la larghezza del contesto. **Netto identico in tutti i casi.**
*La lezione `bo` diceva che le zone dipendono dall'algoritmo; oggi si è visto che
dipendono anche i più e i meno. Chi legge due numeri diversi non sta guardando
due file diversi.*

---

---

## 41) Il 4b-3: la chiamata, e il 4b chiuso (notte fra il 28 e il 29/08/2026)

**Il pannello salva le opzioni.** Commit `e826380` (pannello) e `21f44d0`
(prove), pubblicati. **37 suite, 1783 prove, zero fallite.** *Le decisioni
stanno in spec §63-64 (blocco v82). **Non ricostruirle.***

⚠️ **La finestra muta aperta dal 4b-2 è chiusa nella stessa giornata in cui era
nata.**

### 41a) ✅ Le quattro prove dal vivo di Andrea, su `Roll di prova 6`

Senza toccare le opzioni la rotta **non parte** · una rimozione scritta e
salvata **si ritrova** riaprendo la scheda · l'articolo **resta nel menu** dopo
il salvataggio · il **titolo cambiato si ritrova**.

⚠️ **La quarta era l'unica verifica possibile di (OO), e nessuna sonda poteva
farla**: col titolo mandato col nome sbagliato la risposta sarebbe stata `200`
lo stesso, le opzioni salvate e il titolo tornato indietro **in silenzio**.
*Solo chi riapre la scheda e guarda può dirlo.*

### 41b) Il registro del server, che nessuno aveva chiesto

Code è andato a leggerlo: **due `POST /product-options`, entrambe `200`**, ~1,4
secondi ciascuna. *È la prima volta che quella rotta viene chiamata dal vivo:
esisteva dal 13/08 e nessuna interfaccia la conosceva.*

E si vede **(KK)** all'opera: **quattro `POST /product` contro due
`POST /product-options`**. Nei due salvataggi in cui le opzioni non erano state
toccate, quella rotta non è partita affatto.

### 41c) ⚠️ Le trappole misurate ESEGUENDO, non lette

* **`requires_protein` vuoto** è accettato e diventa `null`; `max_quantity`
  vuota diventa **1**. *Con la controprova: una proteina inventata è rifiutata,
  quindi il validatore non stava accettando qualunque cosa.*
* **`choice_key` al posto di `key`**: il validatore **rifiuta**.
* **Le rimozioni** sono accettate sia come stringhe nude sia come righe; si
  mandano **come righe**, perché è la forma in cui il cuore le tiene e non
  dipende da una tolleranza che potrebbe stringersi. **Gli accompagnamenti come
  stringhe nude sono invece rifiutati.**

### 41d) Una prova scaduta, sostituita e non tolta

`pp4` sorvegliava il divieto del 4b-1 — *«il salvataggio delle opzioni non è
ancora attaccato»* — che questo passo revoca, ed è diventata rossa **per il
motivo giusto**. Al suo posto **l'asserzione opposta e più stretta**, e la frase
accanto che rimandava a quella scaduta è stata allineata. *Il conteggio della
suite non è cambiato: 92 prima, 92 dopo.*

### 41e) ⚠️ Un errore di chi ragionava, corretto da Andrea

Nella prova sullo scudo era stato scritto di controllare che l'occhio fosse
**non barrato**. È il contrario: **occhio barrato = articolo visibile**, perché
il pulsante mostra l'azione che farebbe e non lo stato in cui l'articolo si
trova.

⚠️ *E il fatto vale oltre l'errore: quel pulsante è ambiguo abbastanza da
ingannare chi ha letto tutti i documenti. Di sabato sera lo guarda qualcuno che
non li ha letti. Registrato in spec accanto al Salva spento: **sono due comandi
che non dicono in che stato sei**.*

### 41f) ⚠️ Il blocco Novità ha quasi mangiato nove voci

Scrivendo la v82 si è scoperto che **nove voci della v81 non erano scritte nel
corpo della spec**: vivevano solo nel blocco Novità, che la disciplina cancella
a ogni versione. *È la **terza volta in un giorno** che quel blocco stava per
far sparire qualcosa — la prima fu la regola sulle prove del prezzo, la seconda
il limite sullo schema che non sta nel repo.* Sono state portate in una sezione
loro, dichiarata come casa definitiva.

**Regola che ne discende: chi scrive una versione nuova controlla il blocco
vecchio voce per voce, prima di sostituirlo.**

### 41g) Cosa resta aperto dopo il 4b

*L'elenco vivo è in spec §63-64, «REGISTRATO E NON APERTO». Qui solo i titoli:*
il Salva spento e l'occhio · l'ordine delle proteine che può cambiare in
silenzio · **lo scudo che non copre gli articoli già fuori dal menu**, che fino
al 4b-3 era teorico e da adesso è raggiungibile · il guasto a metà mai
esercitato · `mostraGruppiOpzioni` · la cache dopo il push.

⚠️ **E gli otto articoli di prova NON si cancellano ancora**, benché il 4b sia
finito: il passo 5 tocca i prezzi e le prove sul prezzo si fanno su di loro.
**Dopo il passo 7.**

---

---

## 42) I due comandi muti, il registro sul guasto, e una riga di spec che era falsa (29/08/2026, notte)

Tre lavori corti dopo il 4b, tutti pubblicati. **38 suite, 1810 prove, zero
fallite.** *Le decisioni stanno in spec §63-64 e §6b (blocco v83). **Non
ricostruirle.***

### 42a) ✅ Il Salva spento si vede spento — `5c1c883`, `4a345d8`

⚠️ **Lo spento esisteva già** — `stileSpento`, lo stesso grigio di «Esaurito» —
e Code è andato a cercarlo prima di inventarne uno, perché il commento sopra
quella funzione lo dice: *«tre copie divergono alla prima modifica»*. **Quattro
pulsanti cambiano aspetto, contati**, e una prova sorveglia il numero.

*Le prove misurano lo **sfondo**, non il cursore: il cursore c'era già e sul
telefono non esiste.* Provato dal vivo da Andrea sul sito: si legge.

⚠️ **Resta il «Salva» di `ProductEditForm`**, copia in linea che non passa da
`confirmBtn`: continua a vedersi arancione da spento. *Non toccato di proposito
— il passo 6 fa sparire quel componente.*

### 42b) ✅ Il pulsante dell'occhio resta com'è — decisione di Andrea

*La ragione vale più della correzione: **è Andrea che lo usa**, da settimane, e
per lui non è ambiguo. Cambiarlo sposterebbe la confusione dall'unica persona
che non ce l'ha all'unica che lo usa.*

⚠️ **La regola che ne discende**: chi chiede una prova su quel pulsante **nomina
lo stato dell'articolo, mai l'icona**. *La notte del 28/08 una richiesta di
prova ha detto «l'occhio non barrato» intendendo il contrario, ed è stato Andrea
a correggerla. L'ambiguità non è del pulsante, è di chi scrive le richieste.*

### 42c) ✅ Un guasto lascia una traccia — `3b86f6f`, `c990b78`

Prima il registro si scriveva **solo a salvataggio riuscito**, e sui rami di
errore c'era un `console.error` che nessuno legge: l'unica traccia era una frase
su uno schermo, che si chiude. Ora **tre** dei quattro punti di uscita per
errore scrivono una riga con la fase e la tabella.

⚠️ **Il quarto è escluso di proposito** — il guasto dello scudo, dove non è stato
scritto niente e il messaggio dice già «NESSUNA MODIFICA». *Scelta di Code,
dichiarata come tale.* E il numero l'ha chiesto al file: **dodici** uscite per
errore in tutto, **quattro** dopo l'inizio delle scritture.

✅ **Verificato da Andrea in Supabase**: quattro righe `modifica_opzioni_prodotto`
dalle sue prove, **zero** di guasto. *La strada del successo non la scrive, e
adesso è misurato sul database vero e non solo col cliente finto.*
✅ **E `action` non ha vincoli sui valori**: due soli vincoli sulla tabella,
chiave primaria e collegamento agli ordini. *Il limite che Code aveva dichiarato
— «potrebbe urtare un vincolo che non posso vedere» — è chiuso con una misura.*

### 42d) ⚠️⚠️ Una riga di spec era falsa, e ha fatto sbagliare

La v82 diceva che lo scudo **non copre** gli articoli già fuori dal menu. **Non
è un buco**: lo scudo serve a impedire che il cliente veda un articolo con le
opzioni a metà, e per un articolo già fuori quella condizione è già vera.

⚠️ *Chi ragionava ha letto **il titolo** della voce invece della frase che lo
reggeva, e ha scritto un comando che chiedeva di costruire una protezione
esistente e un messaggio scritto da tre settimane.* **Code si è fermato prima di
scrivere una riga** e lo ha dimostrato leggendo il cuore, invece di eseguire un
comando sbagliato.

**Regola che ne discende: chi legge una voce dell'elenco dei limiti noti legge
la frase, non il titolo.** *E chi la scrive metta nel titolo ciò che la frase
dice, non il sospetto da cui è nata.*

### 42e) ✅ L'elenco dei suggerimenti delle rimozioni — verificato da Andrea, non dedotto

Una rimozione scritta su un articolo compare nei suggerimenti di tutti gli
altri. ⚠️ *Nessun documento lo diceva.* Andrea ha provato: **cancellata la
rimozione, la parola sparisce dall'elenco.** L'elenco si ricava dalle rimozioni
che esistono.

**Deciso di non toccarlo**, ed è il comportamento giusto: si riusano le stesse
parole invece di riscriverle, e un errore di battitura si corregge cancellando e
riscrivendo, senza residui. *Conseguenza: cancellando gli articoli di prova le
loro rimozioni spariscono da sole — **lo script del go-live non deve toccare
niente in più**.*

### 42f) ⚠️ Le prove del pannello lasciano righe nel registro staff

Quattro `modifica_opzioni_prodotto` al 29/08, e ne nasceranno altre ai passi 5,
6 e 7. *Nel registro **non si distinguono da quelle vere in nessun modo
automatico**: si lega al limite già noto, il criterio è un parametro compilato a
mano il giorno del go-live.*

### 42g) Il codice 144, cinque volte in una giornata

Ogni spegnimento del server di sviluppo ha dichiarato «failed with exit code
144», e ogni volta i tre riscontri della lezione `bx` hanno detto che lo
spegnimento era riuscito. *Cinque casi in un giorno: non è un'anomalia, è come
funziona.*

---

## 43) Il passo 5: la conferma sul sovrapprezzo, e tre difetti chiusi invece che copiati (29/08/2026)

**Passo 5 completo in tutte e quattro le decisioni, pubblicato in cinque commit
più uno di spec.** *Le decisioni stanno in spec §63-64, sezione «IL PASSO 5».
**Non ricostruirle.*** Da **1810** prove a **1872**, suite da 38 a **39**, zero
fallite. HEAD alla chiusura: `4a8550f`.

⚠️ **La giornata si è aperta con tre referti di sola lettura e nessuna riga di
codice**, e non è stato tempo perso: quelle letture hanno rovesciato tre cose
che i documenti davano per assodate, e una di queste avrebbe fatto scrivere il
lavoro nel posto sbagliato.

### 43a) La decisione di Andrea: i tre difetti dentro il passo 5

Il riquadro da cui il passo 5 doveva copiare aveva **tre difetti registrati e
non aperti**. Andrea li ha voluti chiusi **dentro** il passo 5, non dopo.
*Copiare il modello com'era avrebbe messo gli stessi tre difetti in un secondo
posto — ed è il motivo per cui la domanda gli è stata posta prima di scrivere.*

### 43b) ⚠️ Tre cose che i documenti davano per assodate, e non erano

1. **«Tre "Conferma e salva" fra tre componenti»** faceva concludere che i
   riquadri del prezzo fossero tre. **Sono due**: il terzo sorveglia gli
   allergeni. *Corretto al punto 39c.*
2. **`ProductEditForm` era ancora considerato una scheda viva.** Non lo è: dal
   passo 2 «Modifica» apre la scheda unica, e la vecchia **non è raggiungibile
   da nessun gesto**. *Misurato nei due versi, poi sugli usi indiretti, poi su
   tutto il progetto.* ⚠️ **Contava**: senza questa misura il lavoro sarebbe
   stato scritto in una scheda che nessuno apre, o duplicato in due.
3. **La spec diceva che «Annulla» aggirava la conferma**: *«se poi si salva per
   un'altra ragione, si salva anche quel prezzo»*. **Falso**, e l'ha smentito
   Andrea provando: al salvataggio dopo **il riquadro si riapre**.

⚠️ **È la seconda riga falsa in due giorni**, dopo quella sullo scudo del 42d, e
la forma è identica: *la conseguenza che ci si immagina premendo il pulsante,
scritta senza premerlo.* **Chi registra un difetto scriva ciò che ha visto, e
tenga separato ciò che teme.**

### 43c) Dove stava il valore vecchio — e perché non nella fotografia

Per mostrare *«2,00 € → 2,50 €»* serviva il sovrapprezzo com'era all'apertura.
**C'era**, dentro la fotografia delle opzioni — ma **appiattito in una stringa
sola, in tuple posizionali riordinate per chiave**: quella fotografia risponde
sì/no, non *quale* e *da quanto a quanto*. **Scelto `opzioniArticolo`**, la
risposta grezza del server, per la stessa ragione già scritta per **(QQ)**: le
traduzioni all'indietro si scartano quando sono evitabili.

⚠️ **La trappola è stata dichiarata prima di scrivere**, non scoperta dopo: in
database un sovrapprezzo può essere il numero `2`, nel modulo il testo `"2.00"`.
Confrontati senza normalizzare **sembrano diversi**, e la conferma sarebbe
comparsa **senza che nessuno avesse toccato niente**.

### 43d) ⚠️ Il debito delle copie: erano due, poi tre, e ne resta una

Il modulo ha copiato l'espressione di normalizzazione dal pannello, ed è rimasta
**in due posti** fino al 5-2a, che l'ha chiusa. *Code ha **dichiarato il debito
invece di nasconderlo**, e l'ha scritto anche nel modulo.*

Poi ne ha trovata **una terza** che nessuno aveva nominato — dentro il controllo
che spegne il Salva sui sovrapprezzi vuoti — e **l'ha segnalata senza toccarla**,
perché il comando ne nominava due. *È stata chiusa con un comando suo, trattata
con più sospetto: lì l'espressione non produce un valore, **decide una
condizione**.*

**Ne resta una quarta**, in `ProductEditForm`: non toccata di proposito, perché
quel componente muore al passo 6.

### 43e) ⚠️⚠️ Un ordine ineseguibile alla lettera, e Code l'ha detto

Il comando chiedeva di *«dimostrare che le espressioni sono identiche carattere
per carattere»*. **Non possono esserlo mai**: nella funzione l'argomento è il
parametro, nel pannello è il valore vero. *Il criterio era ineseguibile per
costruzione, e chi lo aveva scritto non se n'era accorto.*

Code **non si è adattato in silenzio**: ha isolato lo scarto prima di chiamarlo
scarto, ha misurato che sta **solo nell'argomento**, ha dimostrato con un
comando che gli **involucri** sono identici byte per byte, e **ha dichiarato di
aver interpretato l'ordine invece di eseguirlo**. ⚠️ *È la dichiarazione a
valere, non la deduzione: senza quella sarebbe stata una deviazione muta.*
**Il comando successivo è stato riscritto giusto: ciò che deve essere identico
è l'involucro, non l'espressione intera.**

### 43f) ✅ Il buco che nessuno cercava: `g4` sorvegliava una frase, non un fatto

Chiudendo la terza copia **una prova è diventata rossa**, e Code **si è fermato
senza toccarla**. Era `g4`: una **sonda di testo**, che cercava l'espressione
*scritta alla lettera* dentro il pannello letto come stringa. *Non segnalava un
comportamento cambiato: segnalava che la riga era cambiata.*

⚠️ **E rispondendo alla domanda su cosa la sorvegliasse è emerso il buco vero:
il calcolo che spegne il Salva sui sovrapprezzi vuoti non era esercitato da
nessuna prova.** *Ne esisteva una che verificava come la condizione **usa** il
flag, valutandolo già calcolato — ma la riga che lo **produce** stava fuori.*

**`g4` è stata sostituita, non aggiornata.** *Aggiornarla alla forma nuova
sarebbe stato mettere a tacere una sentinella e tenersi il buco.* Al suo posto
**nove prove che eseguono il calcolo** (`g4`–`g12`), ritagliandolo dal pannello e
valutandolo — la stessa strada già usata altrove nel progetto, non una nuova.

⚠️ **`g8` è il caso che la vecchia `g4` nominava nel proprio messaggio e non
provava**: lo **zero scritto non è un campo vuoto**. *Diceva di proteggerlo, e
non toccava nessuno zero.*

**Controprova**: invertito un operatore, **sei rosse su sette**. *La vecchia `g4`
su quella stessa sporcatura non sarebbe diventata rossa **nemmeno una volta**.*

### 43g) Le quattro decisioni, e come sono state provate

| | | commit |
|---|---|---|
| 1 | un riquadro solo che elenca tutti i cambi | `1e5ea52` |
| 2 | «Annulla» rimette i valori di partenza | `4978387` |
| 3 | il riquadro si spegne da solo | `1e5ea52` |
| 4 | una prova sorveglia «Annulla» | `4a8550f` |

⚠️ **Il verde non copriva niente di ciò che era cambiato, e Code lo ha detto
lui:** tolta la condizione, riscritto ciò che accende il riquadro, cambiato il
disegno — **e le prove sono passate da 1860 a 1860 senza muovere un numero**.
*È la ragione per cui il 5-2b è stato provato dal vivo prima di essere
committato.*

**Il valore vecchio per «Annulla» si legge dall'elenco dei cambi**, cioè dalla
colonna sinistra che il riquadro sta già disegnando: *nessuna seconda memoria
creata, che era la condizione posta nel comando.*

⚠️ **`b48` è la prova meglio costruita del passo**: per sorvegliare *«non tocca
niente che non sia un prezzo»* passa al finto **anche i quattordici setter che
non devono essere chiamati**. *Ometterli avrebbe reso quel difetto impossibile da
commettere nella prova: sarebbe esplosa, sembrando un guasto del ritaglio.*

**Controprova su «Annulla», col difetto vero** — quello che Andrea aveva visto:
`setPrice(c.vecchio)` → `setPrice(c.nuovo)`. **Due rosse, exit 1.**

| «Annulla» sporcato | il 28/08 | il 29/08 |
|---|---|---|
| prove che diventano rosse | **0 su 1678** | **2**, exit 1 |

### 43h) ✅ Le prove dal vivo di Andrea — sette giri, localhost e sito pubblicato

*Tutte su `Roll di prova 6`, mai su un articolo del menu.* Hanno verificato ciò
che nessuna prova automatica copriva: il riquadro **unico** con due righe; lo
spegnimento **da solo** rimettendo i valori; «Conferma e salva» che **salva
davvero**, con l'articolo che resta **visibile nel menu**; «Annulla» che rimette
i prezzi **lasciando intatto il resto della scheda**; il salvataggio senza
cambi di prezzo che **non chiede niente**.

⚠️ **E due cose le ha trovate senza che gliele chiedessi, spuntando una
proteina in più**: che una proteina **aggiunta adesso non entra nell'elenco dei
cambi** — la decisione, vista a schermo invece che dedotta — e che «Conferma e
salva» **si spegne** con la frase delle mancanze, cioè che **la riparazione del
4b-2a regge dentro il riquadro nuovo**. *Quel difetto rinasce ogni volta che il
pulsante viene ricreato, e non è rinato.*

⚠️ **Ogni pezzo è stato provato su localhost PRIMA del commit, e riprovato sul
sito pubblicato DOPO**, con ricaricamento a fondo. *I due giri non sono la
stessa prova: il secondo dice che online gira il codice nuovo.*

### 43i) ⚠️ Due sonde cieche in un giorno, e una era del compagno di ragionamento

* **La sonda che contava undici prove invece di dodici**: cercava col doppio
  apice, e `b48` usa un **backtick** perché il suo messaggio compone i setter
  toccati. *Quarta forma della stessa cecità — la sonda costruita su come ci si
  immagina il testo. Le altre tre: la frase spezzata da un a-capo, la voce nella
  forma aggiornata, la voce col segno di spunta.* **Code ha indagato lo scarto
  invece di riferirlo.**
* **Un atteso dichiarato senza misurarlo, da chi ragiona**: era stato scritto ad
  Andrea che dopo il commit i numeri del diff *«daranno numeri diversi»* da
  `--patience`. **Non era stato misurato**, e su tutti e cinque i commit della
  giornata **hanno coinciso**. *La lezione dice che possono divergere, non che
  divergano. **La stessa regola che si pretende da Code è stata violata da chi
  la scriveva**, ed è la seconda volta in due giorni.*

### 43j) Cosa resta aperto dal passo 5

* ⚠️ **Una frase FALSA si legge nel pannello, e la legge Andrea**: sopra le
  opzioni c'è scritto *«Queste sono le opzioni che l'articolo ha già: si vedono,
  ma da qui non si salvano ancora»*. **Non è più vero dal 4b-3.** *Trovata in
  uno screenshot di Andrea, non da una sonda. **È la prima cosa da chiudere.***
* ⚠️ **Le due sostituzioni del 5-2a restano senza prove di comportamento**:
  prezzo dell'articolo e sovrapprezzi dal server. *Nessuna le sorvegliava prima,
  nessuna adesso — ed è il motivo per cui sostituirle non mosse un numero.*
* **La quarta copia della normalizzazione**, in `ProductEditForm`: muore al
  passo 6 insieme al componente.
* **I tre difetti del riquadro sono chiusi**, ma **solo nella scheda nuova**:
  nella vecchia restano, e nessuno può vederli.

---

## 44) Il passo 6: la vecchia scheda sparisce, e una dipendenza che nessuno aveva cercato (30/08/2026)

**Passo 6 fatto e pubblicato in tre commit, più uno di documenti.** `ProductEditForm`
non esiste più: `app/staff/page.js` da **3813** a **3566** righe. Prove **1873**,
zero fallite. *Le decisioni stanno in spec §63-64, sezione «IL PASSO 6». **Non
ricostruirle.*** HEAD alla chiusura: `540e05d`.

⚠️ **La giornata si è aperta con la frase falsa nel pannello**, chiusa prima di
toccare il passo 6: *un lavoro corto va chiuso prima di aprirne uno grosso,
altrimenti resta lì per giorni.*

### 44a) La frase che il pannello diceva a chi lo usa — `3a30561`

*«Queste sono le opzioni che l'articolo ha già: si vedono, ma da qui non si
salvano ancora»*: falsa dal 4b-3. **Tolta, non riscritta** — *un testo che
racconta a che punto è il lavoro invecchia da solo dentro un pannello che si usa
ogni giorno.*

⚠️ **Una previsione sbagliata, e trattata bene.** Il comando avvertiva che la
frase sarebbe stata *spezzata da un a-capo* e ordinava una sonda robusta. **Non
lo era**: la sonda ingenua dava 1. *Code ha usato lo stesso quella robusta, e ha
detto che non aveva trovato niente in più — è il modo giusto di trattare una
precauzione che si rivela inutile.*

⚠️⚠️ **E il commento che l'ha sostituita, al primo tentativo, stava
ricreando il difetto.** Riportava la frase **per intero**, su una riga che il
filtro `soloCodice` delle suite non avrebbe scartato: *una sonda di testo
l'avrebbe ritrovata nel commento e scambiata per codice vivo.* **Code se n'è
accorto, l'ha corretto e l'ha dichiarato.** *È la lezione della sonda della
rinomina, già scritta — e stava per essere rifatta nell'atto stesso di
riparare.*

✅ **Nessuna prova sorvegliava quella frase**, misurato prima di toccarla, con la
controprova nei due versi: la stessa sonda **trova** due altre frasi del pannello
nelle suite. ⚠️ **E ha scoperto altro: le due frasi sorelle dello stesso
ternario non sono sorvegliate da nessuno.** *Quel blocco di messaggi è scoperto
per intero — registrato, non aperto.*

### 44b) Il primo giro: dove stava il rischio, e dove no

Il componente non lo apriva nessun gesto: **cancellarlo non poteva togliere una
funzione a nessuno**. Il rischio era l'opposto — **un pezzo condiviso nato lì
dentro** e riusato altrove.

✅ **Non c'era, e la risposta non è un campione di sonde ma il perimetro dello
scope**: l'unica cosa definita a livello di modulo fra quelle righe era il
componente stesso. *Tutti i nomi che comparivano fuori erano **omonimi** con la
propria definizione — ventisei usi di uno di essi non c'entravano nulla con
questo componente.*

⚠️ **Due sonde cieche corrette in un giro solo:**
* il ritaglio a graffe che dichiarava la funzione lunga **una riga**, perché
  prendeva la graffa della **destrutturazione dei parametri**;
* una sonda `awk` che dava **zero su tutto, anche dentro**, perché `\<` non
  esiste in awk BSD. *È la forma peggiore: uno zero che non distingue «non c'è»
  da «non guardo».*

⚠️ **E dal primo errore è uscita una fragilità in codice pubblicato il giorno
prima**: `ritagliaFunzione`, scritto per la prova su «Annulla», ha la stessa
debolezza. *Oggi è verde perché quella firma non ha destrutturazione: verde per
caso, non per costruzione.* **Registrato in spec, non aperto.**

### 44c) ⚠️⚠️ La quarta categoria: due prove rosse dopo il taglio

Erano state cercate **tre** categorie di dipendenza — prove che **nominano**,
prove che **contano**, e gli **ancoraggi** — tutte e tre trovate e messe in
salvo. **Ne mancava una quarta:**

> **una prova che prende in prestito una RIGA DI CODICE dal file, senza nominare
> il componente in cui quella riga vive.**

`id: product.id,` non conteneva il nome del componente, non era un ancoraggio,
non era un conteggio. **Nessuna delle tre sonde poteva vederla.**

⚠️ *La mancanza è di tutti e due: i tre giri di ricerca li aveva ordinati chi
ragiona, e nessuno puntava lì. **Code lo ha detto senza attenuanti**: «ho scritto
che nessuna prova sarebbe diventata rossa e mi mancava una categoria».*

✅ **E si è fermato senza toccarle**, elencando tre strade e prendendone
nessuna. *Ripristinare, cancellare o rattoppare erano tutte sbagliate, e la
lettura lo ha mostrato.*

### 44d) ✅ Non avevano perso il materiale: avevano perso l'indirizzo

Un giro di sola lettura sulle due prove, prima di decidere. **La riga esisteva
ancora**: cambiava solo il nome della prop — `product` era diventato `articolo`.

⚠️ **E il rischio che quella controprova descrive È AUMENTATO col passo 6.**
*Prima quella riga viveva in un componente morto che nessuno apriva; adesso vive
**dentro lo stesso componente che fa anche la creazione**, a poche decine di
righe di distanza. I due corpi sono diventati vicini di casa.* **La controprova
serve oggi più di ieri.**

**Ripuntate con intenzione**, che è la parola che quelle prove usano nel proprio
messaggio quando dicono cosa fare se diventano rosse. *Il cuore generico della
controprova non è stato toccato: cambia solo quale riga si va a prendere.*

⚠️ **Di righe identiche adesso ce ne sono TRE, e l'aggancio deve dire quale.**
*Prenderne una a caso funzionerebbe oggi e si romperebbe alla prima modifica di
una delle altre due — che è il modo in cui questo problema è nato.* Scelto
l'aggancio sul **seguito** della riga, con un lookahead per non alterare il
materiale innestato.

✅ **Verificato PER PARTIZIONE, non per successo: 1+1+1 = 3.** *Un `1, 0, 0` non
avrebbe saputo distinguere «le esclude» da «non le vede». È la regola degli
insiemi contro i totali, applicata a un aggancio.* ✅ **E la verifica è stata
messa DENTRO la suite**, non lasciata in un referto: *altrimenti sarebbe una
misura fatta una volta sola.*

⚠️ **Code ha anche detto che una delle due cade *di riflesso*, non di suo**: è
una catena — la prima è la guardia, la seconda il carico. *Poteva contarla come
rossa indipendente e stare zitto.*

### 44e) I tre commit, e i conteggi rimisurati invece che decrementati

| | | commit |
|---|---|---|
| il taglio | 247 righe via, nient'altro | `05c1ad2` |
| le prove | ripuntate, più la controprova sull'aggancio | `74948fd` |
| i commenti | i tre che descrivevano un componente sparito | `540e05d` |

*Tre tipi di lavoro, tre commit: se il pannello si rompe, il diff del taglio si
legge da solo.*

⚠️ **I commenti sono stati riscritti, non cancellati**: la ragione che
spiegavano resta valida — per gli ancoraggi il posto da evitare adesso è uno
solo invece di due. ✅ **E i conteggi dentro di essi sono stati RIMISURATI, non
decrementati a mente**: *il vecchio testo diceva tre «Conferma e salva» quando le
occorrenze grezze erano quattro; sottrarre avrebbe propagato un numero già
impreciso.* **Un conteggio aggiornato per sottrazione è un conteggio non
misurato.**

✅ **In nessuno dei tre commenti è stato riportato il nome del componente
cancellato**, per non farlo ritrovare a una sonda di testo. *Controprova: la
stessa sonda sui documenti dà dieci e dieci, dove il nome deve restare perché è
la storia del progetto.*

### 44f) ✅ Le prove dal vivo di Andrea, e perché erano indispensabili

**Cinque percorsi su localhost, tre sul sito pubblicato**, tutti verdi. ⚠️ *Le
suite leggono `app/staff/page.js` come **testo** e non lo eseguono mai: né il
verde né la compilazione dimostrano che il pannello si apra. Erano state
cancellate 247 righe dal file da cui dipende tutto.*

**Due dei cinque percorsi erano lì apposta** — gli allergeni e la creazione —
*perché sono le strade che col componente cancellato non c'entravano: servivano
a sapere che non fosse caduto niente intorno.*

### 44g) ⚠️ Il 500 che la premessa ha intercettato

Prima dello spegnimento la porta ha risposto **500**, non 200. **La premessa
della lezione `bx` non è una formalità**: senza quel controllo la sessione si
sarebbe chiusa lasciando un errore non spiegato su un pannello appena
pubblicato, e domani qualcuno l'avrebbe attribuito al taglio.

**Causa**: `next build` eseguito **mentre il server di sviluppo girava** — il
build riscrive `.next` sotto i piedi del server, che comincia a rispondere
`MODULE_NOT_FOUND`. ✅ **Non ipotizzata ma dimostrata**, riavviando pulito: 200 e
zero errori.

⚠️ **Lezione operativa: `next build` come compile-check non si esegue mentre il
dev server gira.** *Produce 500 che sembrano difetti del codice appena scritto e
non lo sono.*

### 44h) ⚠️ Il terzo errore di chi ragiona in tre giorni

Per un'intera sessione l'orario è stato **dedotto dagli screenshot notturni** e
mai rimesso in discussione, fino a proporre ad Andrea di fermarsi *«alle quattro
e mezza del mattino»* mentre era il **primo pomeriggio del giorno dopo**.
*L'ha corretto lui.*

⚠️ **È una deduzione spacciata per fatto — esattamente ciò che chi ragiona ha
il compito di smascherare nei referti altrui.** *I tre errori di questi giorni
hanno la stessa forma: **una fotografia presa una volta e mai più rimisurata**.
Il criterio ineseguibile, l'atteso sui numeri del diff, l'orario.*

### 44i) Cosa resta

* **Il passo 7, il cambio di categoria (HH)**: l'ultimo dei sette.
* ⚠️ **`ritagliaFunzione` è fragile su una firma con destrutturazione**, in
  codice pubblicato. Registrato, non aperto.
* ⚠️ **Le due frasi sorelle del pannello non sono sorvegliate da nessuna
  prova.** Registrato, non aperto.
* ⚠️ **Le due normalizzazioni del 5-2a restano senza prove di comportamento.**
* **Gli otto articoli di prova restano in piedi**: si cancellano **dopo il passo
  7**, non prima.

---

## 45) Il passo 7: il cambio di categoria, e i sette passi chiusi (31/08/2026)

*Sessione unica, dalla notte al mattino. **Quattro ricognizioni di sola lettura
prima di una riga di codice**, poi quattro pezzi e cinque commit, ognuno provato
dal vivo da Andrea prima di essere committato. Prove da **1873 a 1988**, zero
fallite, 39 suite invariate.*

### 45a) Quattro letture prima di scrivere

Il passo 7 era diverso dagli altri sei: quelli lavoravano su codice che esisteva,
questo andava scritto da zero, ed era **il primo dei sette a toccare ciò che vede
il cliente**. La spec diceva *che* si faceva e *perché* per ultimo, non *come*.

Le quattro ricognizioni hanno accertato, fra il resto: che oggi la categoria non
arriva al database e **gli sbarramenti sono tre**, il decisivo dei quali è che il
cuore non legge nemmeno `payload.category`; che **i tre cuori leggono la
categoria dal database e mai dal corpo**; che proteine, rimozioni ed extra **non
guardano la categoria** e il server li accetterebbe su una bevanda; e che **in
modifica gli allergeni sono pretesi solo se toccati**, misurato eseguendo le
sette espressioni vere con `new Function` e non ragionandoci sopra.

⚠️ **Il fatto più grave l'ha trovato la quarta domanda del terzo giro, e nessuno
l'aveva mai chiesta**: sul sito cliente una Bowl **senza accompagnamenti non si
rompe**. Il blocco non si disegna, il pulsante resta acceso, e l'articolo si
vende senza che il cliente scelga. *In cucina arriverebbe un ordine incompleto
senza che nessuno veda un errore.* **È la ragione per cui la Regola 2 non si è
ammorbidita**, contro l'ipotesi da cui la domanda era partita.

### 45b) Il nodo: categoria e opzioni si bloccano a vicenda

Scrivendo la categoria per prima, le opzioni sarebbero state giudicate con la
regola nuova — ma la loro chiamata **poteva non partire affatto**, perché salta
se non le hai toccate. Salvando le opzioni per prime, il server avrebbe riletto
dal database la categoria **vecchia** e rifiutato.

Da qui **(D1)**: la categoria viaggia con le opzioni, non con i sei scalari. E da
lì tutto il resto — il campo si chiama `cambioCategoria` e non `category` perché
`v11` sorveglia proprio quell'assenza, e una prova nuova (`k2`) sorveglia il nome
dall'altro lato, così nessuno può «semplificare» rinominandolo e svuotare `v11`.

### 45c) ⚠️ Un buco nella spec, trovato prima del codice — e la lezione

**(D6)** toglieva l'azzeramento al cambio della tendina: sembrava elegante e
realizzava tutte e due le decisioni di Andrea. Ma quell'azzeramento era **anche
l'unica cosa che accendeva `allergeniToccati`**, cioè l'innesco della chiamata
che cancella gli allergeni. Senza, un articolo food spostato in `drink` sarebbe
diventato una bevanda **con gli allergeni ancora attaccati**: lo stato
irreparabile che (D1) esisteva per evitare, rientrato dalla finestra.

⚠️ **La lezione, che vale oltre questo passo: CHI TOGLIE UN AZZERAMENTO DEVE
CHIEDERSI ANCHE CHE COSA QUELL'AZZERAMENTO ACCENDEVA.** *Era stato guardato solo
il danno che faceva, non il lavoro che faceva. La rete era stata messa sulle
opzioni **(D5)** e dimenticata sugli allergeni, che sono la metà più pericolosa.*
Chiuso con **(D8)** prima che una riga di codice fosse scritta.

### 45d) I quattro pezzi

| | commit | |
|---|---|---|
| 7a | `2e8d667` | il cuore impara a cambiare categoria |
| 7b | `eb11c08` | la tendina si accende, il pannello manda il cambio |
| 7c | `08188b2` | il riquadro di conferma |
| 7c-2 | `8eaabf3` | la Regola 1 non si applica diventando bevanda |
| 7d | `c64b794` | il Salva pretende gli allergeni uscendo dalle bevande |

*La spec era stata committata **prima** del codice, in v87, e corretta in v88
dopo l'esecuzione. I documenti sono andati per primi apposta: una misura che
sorprende prima del commit costa una riga, dopo costa un documento pubblicato che
mente.*

### 45e) ⚠️ Cinque cose che la spec diceva e l'esecuzione ha smentito

1. **(D4) era ineseguibile su una parte degli articoli.** «La scrittura finale
   dello scudo» vive dentro `if (scudoAlzato)`: su un articolo **già fuori dal
   menu** lo scudo non si alza e la categoria non sarebbe stata scritta **mai**,
   in silenzio e con un 200 addosso. *La forma vera compone un atto solo.*
2. **Un secondo sbarramento dentro il cuore.** `if (daScrivere.length === 0)
   return {200}` faceva uscire muto un cambio che non tocca nessuna opzione: **il
   caso B→B, 20 passaggi su 56, il più frequente.** *La rete sul pannello non
   serviva a niente finché il cuore usciva prima.*
3. **«L'insieme vuoto» non bastava a svuotare gli allergeni.** Il cuore rifiuta
   zero allergeni senza la casella e pretende il tipo dietetico: il corpo
   sarebbe stato respinto e la bevanda avrebbe tenuto gli allergeni. *Terza
   strada verso lo stesso stato irreparabile.*
4. **La Regola 1 bloccava chi diventa bevanda** — vedi 45f.
5. **La tabella dei 56 passaggi diceva il falso sul caso 1** dopo la decisione di
   Andrea sul food→food.

⚠️ *Le prime tre e la quinta le ha isolate Code eseguendo ordini che non si
potevano eseguire alla lettera, e **dichiarando** invece di adattare in silenzio.*

### 45f) ⚠️⚠️ La Regola 1: l'ha trovata una prova dal vivo, non una misura

Al primo giro di prove del 7c, `Roll di prova 6` non si salvava in `Drink`:
*«ha 1 proteine e non può restare senza»*. `Roll di prova 7`, senza proteine,
passava. **La differenza non era il riquadro: era l'articolo.**

La Regola 1 di Andrea del 13/08 guarda **cosa c'è in database, non la categoria**,
ed era giusta così finché la categoria non si poteva cambiare. Diventare bevanda
è esattamente il caso in cui togliere le proteine **è voluto**.

⚠️ **Era scritta in un referto e non è stata collegata.** La seconda ricognizione
aveva una riga intitolata *«Una regola che sembra dipendere dalla categoria e non
ne dipende»*: letta come una curiosità, non come il blocco che era. *Un fatto
misurato e riferito non è un fatto capito.*

**La correzione è a due condizioni entrambe necessarie**, e ovunque altro la
Regola 1 morde come dal 13/08. ⚠️ *La sporcatura che la «semplificherebbe» —
allargarla a qualunque cambio — fa cadere **una prova sola**, `k32`: la rete lì è
sottile e va saputo.*

### 45g) Le prove: che cosa è stato toccato, e con che criterio

* ⚠️ **`b40` è stata ROVESCIATA, non cancellata.** Sorvegliava lo spegnimento
  della tendina, cioè una protezione che il 7b toglie. Ora verifica che il select
  sia acceso **e** che (D8) sia al suo posto. *Una protezione che si toglie va
  sostituita, non tolta e basta.*
* ⚠️ **Il codice è stato adattato alle prove, non le prove al codice.** Il corpo
  degli allergeni era stato estratto in una variabile e cinque prove erano
  diventate rosse: quelle prove **ritagliano ed eseguono il corpo vero**, e una
  variabile dichiarata fuori dal ritaglio le avrebbe rese cieche **restando
  verdi**. Il corpo è tornato in linea.
* **Riancorate al nome del campo e non al valore**: `pp4`, `v17`, `et9`.
* ⚠️ **La prova che mancava sul `<select>` non era quella che si credeva.**
  Misurando: il campo **non ha nessuno spegnimento** e sta **fuori dal
  `fieldset`**. La rete è altrove — `canSaveModifica` comincia con `opzioniLette`
  — quindi durante l'attesa la categoria si può *scegliere* ma non *salvare*. *È
  quello che `f12`-`f14` sorvegliano. Una prova che avesse ripetuto `b40`
  sarebbe sembrata due reti e ne sarebbe stata una.*

### 45h) ⚠️ Tre verdi che non dimostravano niente

1. **`k11` passava dicendo «posizione 1 su 3»** — su un articolo **senza
   opzioni**, dove l'asserzione sull'ordine era **vera perché l'elenco era
   vuoto**. Riscritta su un articolo che ne ha: «posizione 3 su 5».
2. **`c11`–`c14` valutavano stringhe scritte da chi aveva scritto la prova**, non
   il codice: sporcando il pannello restavano verdi. Riportate sul file vero.
3. **La prova dal vivo del 7d non ha esercitato la rete nuova**: `Roll di prova
   6` aveva già la casella «nessuno dei 14», messa da (D8) quando era diventato
   Drink, quindi il Salva non si è mai spento. *Verde vero, prova non esercitata:
   la rete è coperta dalle 14 prove `f`, non dal vivo. **Registrato così invece
   di segnare tre verdi e andare avanti.***

⚠️ **Famiglia unica: un verde che nasce da un insieme vuoto, da una stringa
inventata o da un caso che non si presenta non misura la cosa che dice di
misurare.**

### 45i) Due misure fatte bene, da riusare

* **Per sapere se dietro un ostacolo ce n'è un altro, l'ostacolo si toglie DAI
  DATI, non dal codice.** Per stabilire che la Regola 1 fosse l'unico blocco, lo
  stesso giro è stato rifatto su un articolo senza proteine — e poi una seconda
  volta **dopo** la correzione, dove un secondo rifiuto sarebbe emerso.
* **Un esito 0 non è più una prova di un esito 144.** Spegnendo il server il
  `kill` ha risposto 0, e non è stato trattato come successo: lo spegnimento è
  stato dimostrato con tre riscontri — porta che non risponde, nessun PID sulla
  3000, nessun processo `next`.

### 45j) ⚠️ Gli errori di chi ragionava, e la loro forma comune

* **`et11` ed `et12` dichiarate rosse** al passo 7. Restano verdi: sorvegliano il
  corpo dei sei scalari, dove la categoria non entra. *Atteso dichiarato senza
  misurarlo.*
* **(D6) scritta senza chiedersi che cosa l'azzeramento accendeva.**
* **(D4) scritta come un criterio che una parte degli articoli non poteva
  soddisfare.**
* **La Regola 1 letta in un referto e non collegata.**
* **Il comando del 7d scritto più largo della spec**: spegneva anche su B→B.
  Code ha eseguito la lettera e l'ha dichiarato; Andrea ha deciso di tenerlo.

⚠️ **Hanno tutti la stessa forma delle tre volte precedenti: una cosa scritta o
letta una volta e mai rimessa in discussione.** *È esattamente ciò che chi ragiona
ha il compito di smascherare nei referti altrui.*

### 45k) Le decisioni di Andrea, e cosa resta

**Quattro decisioni**: il cambio completo fra tutte e otto le categorie (56
passaggi); il riquadro di conferma; il campo dell'accompagnamento vuoto entrando
nelle Bowl; e **la rete sugli allergeni larga anche sui passaggi food→food**,
perché *il caso non si presenta* — un articolo si sposta solo dopo essere stato
salvato. ⚠️ *Quindi il giorno che quella rete scatta, sta segnalando un articolo
che non doveva esistere.*

**E una che chiude un lavoro invece di aprirlo**: creare categorie dal pannello
staff è **fuori dal progetto**.

**Cosa resta:**

* **I cinque commit del passo 7 non sono pubblicati**: decisione di Andrea, si
  aspetta. *Il momento buono era dopo il 7c, quando il riquadro c'è.*
* ⚠️ **Il debito del nome `confermaPrezzo`**, che ora governa anche le
  cancellazioni. Registrato, non aperto.
* ⚠️ **Gli otto articoli di prova si possono finalmente cancellare**: il vincolo
  era «dopo il passo 7», e il passo 7 è finito. *Alcuni sono stati spostati di
  categoria durante le prove.*
* **Le cinque condizioni di apertura ancora aperte**, che non dipendono dal
  codice.

## 46) La pulizia degli articoli di prova, e una domanda aperta dal 09/08 (31/08/2026)

*Coda della stessa sessione del punto 45, dopo la pubblicazione del passo 7.*

### 46a) Prima di cancellare, due cose lette dal database

**Nessuna query di cancellazione è stata scritta prima di sapere che cosa succede
alle righe collegate.** Dallo schema — che ⚠️ **non sta in `sql/` ma in radice**,
`km_direct_schema.sql`, e Code l'ha dichiarato invece di adattare la ricerca —
risultano **otto** tabelle che puntano a `products`. Sette cancellano in cascata,
comprese **`combo_drink_options` e `combo_pricing`**, che nessuno script
precedente nominava e che hanno colonne dal nome **diverso**
(`drink_product_id`, `roll_product_id`).

⚠️ **L'ottava, `order_items`, RIFIUTA.** Il vincolo è dichiarato senza
`on delete`, quindi vale NO ACTION. *La colonna è `nullable` col commento «il
prodotto potrebbe essere eliminato in futuro» — ma **nullable non è
`ON DELETE SET NULL`**: il database non azzera niente da sé, rifiuta e basta.
L'intenzione è nel commento, non nel vincolo.* **È la protezione giusta**: lì c'è
la memoria di un acquisto.

⚠️ **E lo schema è del 29/07, con migrazioni posteriori che toccano `products`.**
*Dichiarato come lettura DAL FILE e non dal database vivo* — per questo la misura
che decideva è stata fatta da Andrea sul database vero: otto articoli, **zero**
righe d'ordine per ognuno.

### 46b) ⚠️ Il nome sbagliato che stava per far sopravvivere un articolo

La spec elencava `Roll prova` **senza il «di»**; il pannello dice
`Roll di prova`. *Chiesto ad Andrea invece di dedurlo, ed era la spec a
sbagliare.* ⚠️ **Una cancellazione per nome non l'avrebbe trovato**, sarebbe
riuscita, avrebbe detto di sì, e avrebbe lasciato un articolo finto in mezzo ai
Roll veri.

**Corollario emerso lì**: `products.name` **non è unico** — l'unicità è su
`slug`. *Due omonimi sarebbero legittimi, e uno script per nome li porterebbe via
entrambi.* Lo script si è difeso con un pre-check che pretende **esattamente
otto** e annulla la transazione altrimenti. **Ed è stato scritto per nomi esatti,
mai per prefisso**: `Roll di prova` è prefisso degli altri sette.

### 46c) La cancellazione

`sql/cancella_articoli_di_prova_31ago2026.sql`, scritto da Code copiando il
modello del 12/08, **eseguito da Andrea** nel SQL editor: referto `rimasti = 0`.
Poi la verifica che conta — menu del cliente e pannello sul **sito pubblicato** —
perché il numero nel SQL editor dice che le righe non ci sono, non che il sito
stia bene.

### 46d) ⚠️ Una decisione già presa, riaperta tre volte

Tre referti di fila hanno chiuso segnalando come **aperta** la decisione sulla
rete degli allergeni nei passaggi food→food. Andrea aveva già risposto — ma
**aveva risposto a chi ragiona, e nel repository non c'era niente che lo
dicesse**.

⚠️ **La lezione: CIÒ CHE È STATO DECISO A VOCE E NON SCRITTO VERRÀ RIAPERTO, e
chi lo riapre non sta insistendo: sta leggendo ciò che c'è.** *Il difetto non era
di Code, era di chi non aveva chiuso la decisione dalla sua parte.* Ora è scritta
in spec **come decisione, non come domanda**.

### 46e) ✅ Tre canali già attivi — una domanda aperta dal 09/08

**KM Direct non sarà l'unico canale**: il locale è attivo da un anno su Glovo,
Deliveroo e JustEat. *La spec era prudente per ignoranza, non per scelta, e lo
dichiarava: «da confermare con Andrea».*

⚠️ **Cambia meno di quanto sembri, e la differenza è precisa: la rete protegge
dal NON INCASSARE, non dal caso peggiore** — un cliente che paga su KM Direct e
in cucina non arriva niente. *Lì il cliente ha già pagato, aspetta, e nessun
canale alternativo lo aiuta.* **Quindi l'ordine vero fatto da Andrea resta
vincolante**; si ammorbidisce il collaudo lungo di Stripe.

### 46f) Cosa resta

* **Le cinque condizioni di apertura**, nella sequenza di §66: dominio **e chiave
  Google ristretta su ENTRAMBI gli indirizzi**; font Termina autorizzato sul
  dominio vero; piano di pubblicazione a Pro; Stripe reale col webhook
  definitivo; ordine vero; pulizia dati; apertura.
* ⚠️ **Non misurato, e serve prima di Stripe**: come il codice sceglie le chiavi.
* ⚠️ **Il permesso `TRUNCATE` del ruolo `anon` su `products`**, mai accertato se
  sia raggiungibile da fuori. *È l'unica cosa aperta che riguarda la sicurezza.*
* **Il debito del nome `confermaPrezzo`.** Registrato, non aperto.

## 47) Il suono che si sente, e tre condizioni chiuse in una mattina (31/08/2026)

*Seconda metà della stessa giornata. Il passo 7 era finito e pubblicato; da qui in
poi si esce dal codice del menu e si entra nelle condizioni di apertura.*

### 47a) ⚠️ Tre affermazioni della spec su tre erano invecchiate

Nel giro di due ore, andando a **guardare** invece che a fidarsi:

* **La chiave Google era già ristretta** dall'11/07 — referrer HTTP e tre API —
  mentre la spec diceva che era senza restrizioni e che *«chiunque la copi
  consuma il credito»*.
* **Il font era già a posto**, perché **Adobe ha eliminato il vincolo sui
  domini**: la spec descriveva un campo che nella pagina non esiste più.
* **Il piano Pro era già stato portato.**

⚠️ **Nessuna delle tre era falsa quando è stata scritta: lo sono diventate.** *È
una forma diversa dall'errore di ragionamento — lì si sbaglia scrivendo, qui si
sbaglia **non rileggendo**.*

### 47b) ⚠️⚠️ Una condizione può morire senza che nessuno la chiuda

Il vincolo dei domini Adobe non è stato risolto: **è decaduto perché è cambiato
il mondo fuori.** La documentazione dice che non serve indicare alcun elenco di
domini, che il codice funziona su qualunque sito e senza limite di numero.

⚠️ **Nessuna nostra misura l'avrebbe mai scoperto.** *L'ha scoperto il fatto che
il campo non c'era più, e solo perché Andrea è andato a cercarlo.* **I documenti
vanno riletti contro la realtà, non solo contro il codice** — la spec chiamava
quella voce «la cosa più facile da dimenticare di tutto il documento», e per anni
è stato vero.

### 47c) La trappola dei due indirizzi, evitata di misura

La chiave Google aveva fra i siti autorizzati solo `localhost` e
`km-direct.vercel.app`: **il dominio dei clienti non c'era**, quindi dal 26/08 il
completamento dell'indirizzo su `ordina.kebabmediterraneo.it` con ogni
probabilità non suggeriva nulla — *e non lo avrebbe detto nessuno, perché non
produce alcun errore.*

⚠️ **E la riga nuova era stata scritta in una forma diversa dalle altre due** —
senza schema e senza `/*` — **corretta prima di salvare**. *Una forma diversa non
è verificabile a colpo d'occhio, e il guasto sarebbe stato invisibile.*

⚠️ **La prova è stata fatta su ENTRAMBI gli indirizzi, non solo su quello che
interessava.** *Guardare solo il sito che ci interessa e dichiarare chiuso è la
forma del verde che non dimostra niente: la seconda prova è quella che dice se
abbiamo rotto invece di aggiustare.*

### 47d) Il suono: una decisione rovesciata, e la leva che non era quella ovvia

**Decisione di Andrea**: il suono si ripete finché non viene accettato, tetto di
un minuto che riparte a ogni nuovo ordine, un suono solo per tutto il pannello,
fermato da un pulsante sulla singola scheda che **non cambia lo stato
dell'ordine**.

⚠️ **La spec del lavoro aveva un buco, trovato scrivendo**: un ordine che **esce**
da «Nuovi» perché qualcuno l'ha fatto avanzare non veniva tolto dalla lista di
quelli da accettare. *Il pannello avrebbe continuato a suonare per un ordine il
cui pulsante non è più a schermo — un suono che non si può fermare.*

**Poi il difetto vero, riferito dal vivo: non si sentiva**, nemmeno col volume del
portatile al massimo. ⚠️ **La leva che contava non era il guadagno, era la forma
d'onda.** *Una `sine` ha solo la fondamentale: alzarla avrebbe fatto un fischio
morbido più forte. Con `square` arrivano le armoniche dispari, cioè energia nella
banda in cui l'orecchio sente meglio — è il timbro delle sveglie.* **0.7 e non
1.0**, perché un'onda quadra da Web Audio supera l'ampiezza nominale di circa il
9%.

⚠️ **Un allarme che non si sente vanifica il lavoro che lo produce**, quindi non è
stato committato niente finché il volume non è stato riprovato dal vivo.

### 47e) Due cose fatte bene, da riusare

* **La prova sul pulsante è stata costruita perché il difetto fosse POSSIBILE.**
  *Nell'ambiente di prova `fetch` e le funzioni di cambio stato **esistono e
  registrano**: non passarle avrebbe reso quel difetto impossibile da commettere
  nella prova invece che visibile.* **Una prova che rende impossibile il difetto
  non lo sorveglia.**
* **I valori del suono sono stati misurati prima di toccarli**, e prima ancora è
  stato verificato che **nessuna prova ne dipendesse** — così il verde di dopo non
  è un verde ottenuto aggiustando le prove.

### 47f) ⚠️ Un conteggio trascinato per versioni, e mai misurato

Fino alla v89 il blocco Novità chiudeva con *«quattro chiuse, cinque aperte»*,
riportato di versione in versione. **Cercato: nel corpo non esiste nessun elenco
numerato a cui quel conto si riferisca.**

⚠️ *Era un numero trascinato senza misura — esattamente ciò che la regola del
progetto vieta, e nessuno l'aveva mai guardato perché stava in fondo a un blocco
che si riscrive ogni volta.* **Tolto.**

### 47g) La pulizia degli articoli di prova, e il nome che stava per salvarne uno

*Vedi il punto 46. La cosa da ricordare: la spec elencava `Roll prova` senza il
«di», il pannello diceva `Roll di prova`, e **una cancellazione per nome non
l'avrebbe trovato**. La domanda è stata fatta ad Andrea invece che dedotta.*

### 47h) Dove siamo

**Chiuse oggi**: passo 7 (cinque commit), articoli di prova cancellati, chiave
Google, font (decaduto), piano Pro, suono. **Documenti alla v90 e al punto 47.**

**Restano DUE cose, ed è tutto:**

1. ⚠️ **STRIPE.** Nessuna modifica al codice — *misurato: non esiste nessun ramo,
   nessun interruttore, nessuna parola «sandbox»; una variabile sola e l'ambiente
   lo decide il suo valore.* **L'ordine è vincolante**: chiave vera su Vercel →
   webhook nuovo sul dominio definitivo → **il suo segreto nuovo** su Vercel →
   **una ripubblicazione**, perché le variabili si leggono al momento della
   pubblicazione. ⚠️ **Il segreto del webhook è un'altra cosa dalla chiave e
   Stripe ne genera uno per ogni endpoint**: dimenticarlo significa clienti che
   pagano e ordini che non arrivano.
   ⚠️ **Da decidere prima**: le due variabili sono su **Production e Preview
   insieme**, quindi con le chiavi vere **anche le anteprime incasserebbero**.
2. **L'ORDINE VERO DI ANDREA**, con la propria carta, fino alla comparsa in
   cucina, poi rimborsato. ⚠️ **Resta vincolante anche con tre canali attivi**:
   la rete protegge dal non incassare, non dal cliente che ha già pagato.

**E poi**: pulizia dati, cancellazione dello script del go-live, apertura.

**Aperto e non toccato**: il permesso `TRUNCATE` di `anon` su `products`, mai
accertato se sia raggiungibile da fuori; il debito del nome `confermaPrezzo`;
`km-direct.vercel.app` da dismettere **dopo** l'apertura, mai durante Stripe.

## 48) Stripe reale, la pulizia dei dati, e le due porte dei permessi (01/09/2026)

*La giornata che chiude tutte le condizioni di apertura. Resta solo aprire.*

### 48a) Stripe, e la ripubblicazione che non era partita

Sequenza eseguita: chiave `sk_live_` in `STRIPE_SECRET_KEY` → endpoint webhook
reale verso `ordina.kebabmediterraneo.it`, **in ascolto su un evento solo**,
`checkout.session.completed` → il suo **segreto nuovo** in
`STRIPE_WEBHOOK_SECRET` → ripubblicazione senza cache.

⚠️⚠️ **LA RIPUBBLICAZIONE NON ERA PARTITA AL PRIMO TENTATIVO.** Il riquadro di
Vercel si era chiuso senza dire niente, e nell'elenco delle pubblicazioni non era
comparsa nessuna riga nuova. *Se non l'avessimo guardato, l'ordine vero sarebbe
stato fatto credendo il sito in modalità reale mentre era ancora in sandbox — e
lo avremmo scoperto nel modo peggiore.*

**È la famiglia già registrata: il silenzio che sembra successo.** ⚠️ *Ma con una
variante nuova: qui il silenzio veniva da un'interfaccia, non da un comando. La
verifica non è stata «non ci sono errori», è stata «c'è una riga nuova in cima
con l'orario di adesso».*

### 48b) L'ordine vero, e cosa ha dimostrato

Ordine piccolo in ritiro, carta vera: **pagato, addebitato dalla banca, pagina
di conferma al cliente, e comparso nel pannello staff.** Poi rimborsato.

⚠️ **L'ultimo punto è quello che vale**: dimostra che il webhook funziona e che
il suo segreto è giusto. *Senza, il cliente paga e in cucina non arriva niente —
ed è per quello che tutta la sequenza esiste.*

**E ha chiuso l'unico punto che era stato letto nel codice e mai visto
funzionare**: l'indirizzo di ritorno dal pagamento, che il codice ricava dalla
richiesta stessa.

⚠️ **Il suono non è stato esercitato**: il pannello era chiuso. *Registrato come
non provato dal vivo su un ordine vero, invece di segnare un verde che non c'è
stato — stessa scelta della prova 1 del 7d.*

### 48c) La pulizia dei dati, e lo strumento che esisteva già

⚠️ **La cosa più utile della ricognizione non era costruire l'elenco: era
scoprire che esisteva già.** Tre script scritti il 04/08, con le tre categorie
— dati, configurazione, incerta — già dentro. *Non c'era da costruire, c'era da
confrontare, e sono uscite tre cose cambiate da allora.*

**I due valori usati, letti dal referto del giorno e non dai documenti:**
freno `2026-09-01 10:49:27.962810+00`; identificatori `staff:test-fase1`,
`staff:test-fase2a`, `staff:test-merge`, `staff:test-spice`.

⚠️ **Quei due valori esistono solo in spec.** La versione dello script con i
parametri compilati **non è mai stata committata**, e `git rm -f` l'ha portata
via: *dal repository non si ricava con quali valori è stato eseguito.* **Chi
compila un file e poi lo cancella, compila qualcosa che non è mai esistito per
il deposito.**

**Esito**: sei tabelle a zero, registro staff da 199 a 156, **le 16 tabelle di
configurazione identiche una per una**, e tre sguardi dal vivo sul sito.

⚠️ **UN LEGAME CHE NESSUN DOCUMENTO NOMINAVA, trovato leggendo il codice**: il
numero dell'ordine è **il conteggio degli ordini più uno**
(`app/api/checkout/route.js:80`), non un contatore salvato. *Svuotando, il primo
ordine di un cliente vero sarà `KM-0001`.* **E `pickup_code` è unico: ripartire
da capo è sicuro solo perché i vecchi spariscono nella stessa transazione.
Cancellare in futuro solo una parte degli ordini produrrebbe collisioni.**

### 48d) ⚠️ La prima porta: il `TRUNCATE` non era quello che credevamo

La voce era aperta dal 07/08 e la spec la chiamava un'anomalia trovata per caso.
**Misurata sul database vivo, era due cose diverse da come era scritta.**

**Il pericolo vero non c'era**: `INSERT`, `UPDATE` e `DELETE` per `anon` su
`products` erano **già assenti** — *e quelli sì che l'API pubblica sa esprimere
da fuori. Per un mese abbiamo guardato la meno pericolosa del gruppo.*

**E non era un'anomalia**: `anon` e `authenticated` avevano gli stessi cinque
permessi, `postgres` e `service_role` otto. **È la configurazione predefinita di
Supabase.**

⚠️⚠️ **LA COSA CHE VALE OLTRE QUESTO CASO: LE REGOLE PER RIGA NON FERMANO UNA
`TRUNCATE`.** *Valgono su `select`, `insert`, `update` e `delete`; la truncate è
governata dal solo permesso di tabella.* **La difesa che su Supabase si dà per
scontata, su questa operazione non esiste — quindi la strada non era aggiungere
una policy, era togliere il permesso.**

*Ciò che la teneva inerte non era una nostra difesa: l'API pubblica non sa
esprimere quel comando.* ✅ Revocata comunque, 18 revoche, verdetto `0`.

### 48e) ⚠️ La seconda porta, e il campo che nessuno aveva mai chiesto

I **permessi predefiniti** — la regola che decide con quali permessi nasce una
tabella creata in futuro — davano ai due ruoli pubblici **tutti e otto**,
`INSERT`, `UPDATE` e `DELETE` compresi.

⚠️ **E qui Code ha fatto la cosa giusta ammettendo di non sapere.** Il concedente
non era mai stato misurato: la query del giorno prima leggeva *a chi* e *che
cosa*, non *chi concede*. **Invece di scriverlo a mano, ha fatto leggere il nome
al database al momento dell'esecuzione** — perché *una revoca scritta per il
ruolo sbagliato non toglie niente e non dà errore*.

**Il concedente è `supabase_admin`**, ruolo di sistema. La revoca è stata
**rifiutata con `42501 permission denied to change default privileges`**, e non
ha scritto niente.

✅ **REGOLA CHE NE DISCENDE, decisione di Andrea: chi crea una tabella nuova le
toglie subito i permessi pubblici che non servono.** ⚠️ *Non è una regola del
database: è un'abitudine, e per questo vive nei documenti e non nel codice.*

### 48f) Due cose di metodo da riusare

* ⚠️ **Un file che sta per essere eseguito non si tocca per correggere due
  commenti.** Lo script dei conteggi aveva due difetti di documentazione, trovati
  leggendolo: sono stati **registrati e non corretti quel giorno**, perché
  toccare un file in procinto di girare aggiunge rischio senza togliere niente.
* **Per sapere se uno strumento scrive, non si legge la sua intestazione.** La
  verifica sullo script dei conteggi è stata una sonda sulle istruzioni di
  scrittura — zero — con la controprova sullo script del go-live, che ne trova
  nove. *Un'intestazione che dice «legge soltanto» è una promessa, non una
  misura.*

### 48g) ⚠️ Una riga orfana sopravvissuta per versioni

In coda al blocco Novità della v90 vivevano tre righe `aperte**.*`, residuo di
una sostituzione precedente. **Nessuno le aveva viste** — *stavano in fondo a un
blocco che si riscrive ogni volta, esattamente come il conteggio «quattro chiuse,
cinque aperte» che era sopravvissuto per versioni senza che nessuno lo
misurasse.* **Quel punto del documento è un angolo cieco strutturale: quando si
sostituisce il blocco, si guardi anche cosa c'era sotto.**

### 48h) Dove siamo

**TUTTE LE CONDIZIONI DI APERTURA SONO CHIUSE.** Dominio e chiave Google, font
(decaduto), piano Pro, Stripe reale, ordine vero, pulizia dei dati, script tolto
dal deposito. ⚠️ **Resta solo aprire, e non è un lavoro: è una decisione di
Andrea.** *Il sito è online, funzionante e in grado di incassare.*

**Aperto e non chiuso:**

* **La porta del futuro** sui permessi predefiniti — da chiedere a Supabase, non
  blocca niente.
* **I permessi predefiniti GLOBALI**, non legati ad alcuno schema, che nessuna
  misura ha mai guardato.
* **I due difetti di documentazione** in `sql/conteggi_dati_sola_lettura.sql`.
* **Il debito del nome `confermaPrezzo`.**
* **`km-direct.vercel.app` da dismettere**, dopo l'apertura e non prima.
* **La condensazione dei documenti** — Decisione, Attuazione, Regole, Trappole —
  da fare **dopo l'apertura**, quando si saprà quali parti sono servite davvero.
