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

- Branch **`main`**, working tree **pulita**, allineata a `origin/main`.
- HEAD: **`f433d17`** — la spec v71 (12/08/2026).
- Ultimi commit (dal più recente):

```
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

*Caso del 12/08/2026: distanza **uno** ancora una volta — passa la sola spec
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

**Lezioni di verifica — nove famiglie**

⚠️ **Il 05/08/2026 le 48 lezioni sono state raccolte in nove famiglie più cinque
isolate.** Dicevano in gran parte la stessa cosa da angolazioni diverse: `at`
dichiarava di essere `ak` in altra forma, `bl` di essere `z` "in forma
documentale", e `w` e `av` la stessa regola a undici mesi di distanza.

⚠️ **Le lettere sono conservate tutte**, perché i due documenti vi rimandano per
lettera: chi cerca la lezione `bc` deve trovarla. **Il testo però è uno per
famiglia**, e l'episodio che l'ha generata resta solo dove insegna qualcosa che
la regola generale non dice. *Le versioni per esteso sono nel deposito, ultima
integra al commit `254ffad`.*

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

⚠️ **Il numero di suite qui sotto è stato trovato FERMO A DICIOTTO l'11/08/2026
sera, mentre erano 24**: nessun confronto di zone attese poteva vederlo, perché
non è una zona che il lavoro del giorno prevedeva di toccare (lezione `cm`).
*Chi aggiorna questo documento riguardi SEMPRE questo blocco: è il posto dove
qualcuno va a leggere quante prove ci sono, quindi un numero vecchio qui mente
con l'autorità del documento (lezione `aj`).*

**Ventisette suite** in `tests/`, tutte con estensione **`.mjs`** e non `.js`,
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

**I lavori pre-go-live, nell'ordine deciso da Andrea il 06/08/2026** (⚠️ *la
prima voce è stata aggiunta il 10/08/2026: mancava da questo elenco pur essendo
il lavoro in corso — chi avesse letto solo qui sarebbe ripartito dalla Fase 4*):

- ✅ **I DUE LAVORI CHIESTI DA ANDREA l'11/08 SONO FATTI** il 12/08 e provati
  dal vivo: il **prefisso internazionale** e l'**indirizzo nella scheda
  ordine**. Racconto al punto **31**, decisioni in spec §41-45, §52-56 e
  §57-61.
- ✅ **GIVEMEFIVE nel checkout — CHIUSO l'11/08/2026**, cinque commit, provato
  dal vivo da Andrea. Racconto al punto **29**. *Il testo qui sotto è quello di
  ieri e si legge come storia, non come lavoro da fare.*
- ⬜ *(chiuso, testo storico)* **GIVEMEFIVE nel checkout.** Decisioni per
  intero in **spec §14 v68**, racconto al punto **28**. ⚠️ **La catena è
  obbligata e non è cambiata con il ridisegno**: prima il campo del checkout
  funziona, **poi** il carrello smette di nominare lo sconto. Il pulsante del
  carrello è oggi l'**unico interruttore** che accende GIVEMEFIVE: toglierlo
  prima che il sostituto esista lo spegnerebbe **in silenzio**, senza che
  nessun errore compaia. **Primo mattone: il ricalcolo della soglia lato
  server**, perché è lì che sta tutta la difesa.


- ✅ **"Togli dal menu" — FATTO il 07/08/2026**, sei pezzi, provato dal vivo da
  Andrea in ogni sua parte. Colonna **`is_in_menu`**. Esito e prove in **spec
  §63-64 v63**; racconto della giornata al punto **23** di questo documento.
- ⬜ **Fase 4 — creazione/editing di Roll e Bowl con le loro opzioni**,
  **scegliendo fra le proteine già esistenti**. ⚠️ **Spostata a prima del
  go-live il 06/08/2026** (Andrea): inserire e sospendere Roll è per lui
  attività **frequente**. *Fino alla v58 stava fra i lavori del dopo go-live, su
  una frequenza d'uso presunta e mai chiesta.* **Primo passo obbligato**:
  accertare sul codice se il residuo label→id di §25 tocchi davvero una Fase 4
  ristretta alla scelta da elenco chiuso — verosimile che non la tocchi, **non
  accertato**.
- ⬜ **Tappa 3b di §46** — riverifica del tempo di preparazione e della
  **griglia dei quarti d'ora** (§46b, lavoro registrato), e unificazione delle
  **due costruzioni delle finestre orarie**. *Non era parte della condizione di
  apertura, ma vive nel percorso di pagamento: vale la regola di sempre, non si
  riapre quel file per una cosa sola.* ⚠️ **Da fare senza ancorarlo a una
  scadenza futura**: quella frase è già invecchiata due volte (spec §46b, v51).

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

### FATTA — Fase 3: creazione di articoli semplici

✅ **Chiusa il 06/08/2026**, costruita in tre commit, **provata dal vivo da
Andrea con sette prove a schermo** e ripulita lo stesso giorno. Il racconto sta
al **punto 21**; qui restano le sole correzioni a ciò che questo elenco diceva
quando era un to-do.

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

✅ **Aggiornamento del 10/08/2026 — la FACCIATA è decisa, il SISTEMA no.** Il
campo *"Hai un codice sconto?"* nel checkout si costruisce adesso, ma dietro
c'è la sola regola cablata di GIVEMEFIVE (spec §14 v68). Il giorno dei codici
veri cambia **chi risponde**, non il campo, il gesto, il pedaggio né le frasi:
è per questo che si può partire senza aver deciso il resto. ⚠️ **Le domande
elencate qui sopra restano tutte aperte**, cumulabilità compresa. *E i tre
esempi fatti da Andrea non sono la stessa cosa: 5 € fissi è ciò che il sistema
fa già, una percentuale apre il caso "lo sconto supera il prezzo" qui sopra, e
**un omaggio non è uno sconto** ma una riga in più nell'ordine — tocca
carrello, documento per lo staff e Stripe, ed è un lavoro a sé.*

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

**bh. ⚠️ Un referto che finisce sul numero tondo non è un referto completo.** L'editor SQL della dashboard tronca. ⚠️ **Il numero è cambiato: 500, misurato il 06/08/2026; era 100 quando questa lezione è stata scritta.** *È la lezione stessa applicata a sé: la cifra è un dato dello strumento e invecchia, la diffidenza no.* Il primo giro sulle colonne si è fermato a `orders` colonna 32 e **sembrava una risposta**: mancavano tredici tabelle intere, fra cui proprio quella che serviva. È la lezione `aq` spostata sullo strumento — là una variabile vuota faceva corrispondere tutto, qui un limite silenzioso fa sembrare finito ciò che è a metà. *Rimedio: contare le righe attese prima di leggere il contenuto, e diffidare del numero tondo.*

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

---

## 21) La Fase 3, dalla costruzione alla pulizia (06/08/2026)

### 21a) Cosa è stato costruito

Tre commit, nella forma che §63-64 già imponeva: modulo puro sotto `lib/`, rotta
sottile, form **in linea** nella sezione Menu del pannello.

* `lib/menu-slug.js` — generazione dello slug, con le sue prove;
* `lib/menu-create.js` — il cuore della creazione, con le sue prove; accanto,
  `lib/menu-categories.js` e `lib/menu-dietary.js`, che diventano la **fonte
  unica** di elenco categorie e tabella dietetica;
* `app/api/staff/menu/create/route.js` più il modulo a schermo nel pannello.

⚠️ **Il debito che questa fase ha reso visibile, e che va saputo prima di
toccare Fase 1 o Fase 2A**: `lib/menu-create.js` riceve il client del database
**come parametro** invece di importarlo, ed è questo — non altro — che lo rende
verificabile da una prova automatica. **Fase 1 e Fase 2A non hanno prove proprio
perché importano `supabase-admin.js`**, che crea il client al caricamento del
modulo. *Sistemarlo sbloccherebbe le prove di due fasi già in produzione: non è
un abbellimento.*

### 21b) Le prove dal vivo

Sette, tutte superate, eseguite da Andrea sul server di sviluppo: modulo vuoto
col pulsante spento; comparsa di allergeni e selettore dietetico scegliendo una
categoria di cibo; loro **sparizione** scegliendo una bevanda; **collisione
dello slug rifiutata senza lasciare traccia**; bevanda creata e ritrovata **in
fondo** alla sua categoria; articolo di cibo creato con allergeni e ritrovato
sul sito cliente; riapertura dal modulo allergeni con le caselle come lasciate.

### 21c) Le decisioni nuove di Andrea (tutte del 06/08/2026, tutte in spec v59)

* **La Fase 4 si sposta a prima del go-live** — inserire e sospendere Roll è
  attività frequente. La collocazione precedente nasceva da una frequenza d'uso
  **presunta e mai chiesta**.
* **La Fase 4 sceglie fra le proteine già esistenti**, non ne crea di nuove.
* **Prima della Fase 4 si costruisce "togli dal menu"**, che è indipendente e
  molto più piccolo.
* **Le bevande sono esentate dagli allergeni anche in creazione** — prezzo
  accettato: una birra creata dal pannello non porta l'informazione sul glutine.

### 21d) La pulizia degli articoli di prova

I due articoli creati sono stati cancellati con uno script **usa-e-getta**, in
tre passaggi: ricognizione di sola lettura, anteprima che non scrive,
cancellazione. ⚠️ **Non è stato salvato in `sql/`**, come §69 impone per gli
strumenti che cancellano articoli.

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

### 21e) Due lezioni di metodo

**bp. ⚠️ Fra il riquadro dell'editor SQL e il database, un testo lungo può
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

### 22a) Il difetto, trovato cercando altro

Nato da una domanda di Andrea sulla gestione del combo dal pannello. **Una
bibita segnata esaurita restava scegliibile dentro il menu combo, e il pagamento
la accetta**: la tendina filtrava sulla colonna della tabella del combo — che
**nessuna schermata può scrivere** — invece che sulla disponibilità del
prodotto, che non veniva nemmeno portata al browser. Contorni e Roll erano
invece già a posto.

⚠️ **Il buco era aperto per costruzione, non per una svista su una riga**: sul
database vivo tutte le righe di `combo_drink_options` erano a `is_available =
true`, perché nessuno le scrive mai. Le decisioni e la forma stanno in **spec
§23-26 v60 e v61**.

### 22b) Cosa è stato scritto, e cosa NON è stato provato

Due commit: la correzione nei tre punti — tendina, risolutore del pagamento,
carrello — e la guardia sulle scelte vuote. Provate dal vivo da Andrea con sette
prove a schermo, guardia compresa.

* **Provato dalle prove automatiche**: il solo carrello, che vive in un modulo
  puro. Otto prove nuove.
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

### 22c) Tre cose trovate scrivendo, che il piano non prevedeva

* ⚠️ **Filtrare la lista unica avrebbe rotto il carrello in silenzio.** Il codice
  lo dichiarava già in un commento: il ripristino deve **vedere** gli articoli
  esauriti per toglierli col motivo giusto. Servono due liste, ed è la stessa
  coppia che i Roll usavano già.
* ⚠️ **La posizione della guardia è obbligata dall'ordine degli hook**, non è
  stile: messa dove il comando diceva letteralmente — in cima alla funzione —
  avrebbe prodotto un guasto React peggiore del difetto evitato.
* ⚠️ **Lo shortcut "Fallo combo" non esiste nel codice**, ed era descritto come
  costruito in **due** punti della spec. Cercato, non dedotto. Corretto in v61.

### 22d) Il difetto preesistente che la guardia ha chiuso

⚠️ **Segnare esauriti tutti e sette i Roll rompeva il builder del combo già
prima di questo lavoro.** Non è un danno introdotto dalla correzione della
bibita, ed è scritto qui perché fra un mese lo sembrerebbe. La prova dal vivo del
06/08 — sette Roll esauriti e rimessi — ha verificato **insieme** la guardia
nuova e l'esistenza del guasto che copre.

### 22e) Tre lezioni

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

### 23a) Cosa è stato fatto

**Sei pezzi, cinque commit più la migrazione**, tutti spinti. La colonna è
`is_in_menu` (boolean not null default true su `products`), migrazione eseguita
da Andrea nel SQL editor — 62 articoli nel menu, 0 fuori al momento
dell'esecuzione.

Il cuore è `lib/menu-visibility.js` con la rotta sottile
`app/api/staff/menu/visibility/route.js`, nella forma provabile inaugurata dalla
Fase 3: **il client si passa come parametro**. 37 prove sul solo cuore. Il
pulsante occhio e lo stato spento in `app/staff/page.js`, il sito cliente in
`app/page.js`, il pagamento in `lib/checkout-resolve.js`, il carrello in
`lib/cart-persistence.js`. Prove: da **648** a **669**.

**Decisioni e forma stanno in spec §63-64, §23-26 e §46 v63.** Qui resta solo
ciò che il racconto aggiunge.

### 23b) Le quattro cose cambiate rispetto al piano iniziale

Nessuna delle quattro era nel piano approvato la mattina. Tutte e quattro sono
nate da qualcuno che ha **guardato** invece di ricordare.

* **Il rientro rimette anche `is_available`.** Il piano scriveva una colonna
  sola. Un articolo tolto dal menu **mentre era esaurito** sarebbe rientrato
  esaurito, e col pulsante Disponibile spento nessuna schermata avrebbe più
  potuto cambiarlo.
* ⚠️ **Le birre ricevono la lista PIENA, non la filtrata.** Il comando dato a
  Code diceva il contrario, e veniva da un elenco di sola lettura che
  classificava le birre fra ciò che "non deve vedere un fuori menu". **Code si
  è fermato e ha spiegato prima di eseguire**: quella lista non disegna nulla,
  serve a riconoscere se c'è una birra nel carrello, e da lì dipende la casella
  **«sono maggiorenne»**. Con la filtrata sarebbe sparita da sé sbloccando il
  pagamento.
* **Il messaggio del combo nomina la bibita**, allargamento di perimetro voluto
  da Andrea che tocca anche il comportamento scritto la sera prima.
* **Le due liste nel sito cliente**, contro la strada facile del filtro unico.

### 23c) I due elenchi sbagliati, e come sono venuti fuori

⚠️ **Un referto di sola lettura ha prodotto due verdetti falsi, e le righe erano
giuste.** Lo stesso documento dichiarava prima **cinque** consumatori di una
variabile e poi, eseguendo la ricerca, ne trovava **diciassette**; e in un altro
punto dichiarava **nove** aiuti trovati mentre la tabella ne elencava **sette**.

*Entrambi sono stati scoperti contando, non leggendo. Il rimedio applicato è
diventato regola: quando si chiede un elenco, si chiede **completo** — tutti i
punti, non i soli cambiati — perché è il confronto fra il totale e la tabella a
far cadere l'errore.*

### 23d) Il numero delle prove che è cambiato da solo

⚠️ **Il conteggio è passato da 648 a 664 senza che nessuno avesse scritto una
prova.** La spiegazione data — "è solo un modo diverso di contare" — era falsa:
il comando cercava `PASS` in qualunque punto della riga, e l'ultima riga di ogni
suite è `TUTTI I TEST PASSATI`, che contiene `PASS`. **Sedici suite, sedici
striscioni contati come prove.**

**Il metro, scritto una volta sola:**

```
for f in tests/*.test.mjs; do node "$f"; done 2>/dev/null | grep -c '^PASS — '
```

*Se il numero sale, qualcuno ha scritto prove nuove. Se scende, qualcosa si è
rotto.*

### 23e) La prova che non poteva fallire, due volte in un giorno

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

### 23f) Ciò che questo lavoro NON ha chiuso

* ⚠️ **La finestra del pagamento** (spec §46 v63): dopo che il cliente è su
  Stripe non c'è più alcun controllo, e il webhook non legge `products`. Vale
  identica per `is_available`, quindi **precede questo lavoro**. Da decidere
  prima dell'apertura.
* ⚠️ **Il permesso `TRUNCATE` del ruolo `anon` su `products`**, preesistente,
  trovato per caso. Da accertare se sia raggiungibile da fuori.
* ⚠️ **Il piano di hosting Hobby**, da verificare sulle condizioni di Vercel.
* **Il viewport e lo schermo mobile del sito cliente**, invariato.
* **La Fase 4**, unico lavoro pre-go-live rimasto.

### 23g) Cinque lezioni

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

Giornata su tre fronti: il **font** dell'immagine coordinata, **quattro
ritocchi** nati dall'uso vero del sito, e il **riordino dello sconto**. Le
decisioni e la forma stanno in **spec §6b, §12c, §14 e §52-56 v64**; qui c'è
solo ciò che il racconto aggiunge.

### 24a) Il font

Termina da Adobe Fonts, progetto `jth6flt`, quattro pesi. **Cambiarlo è stata
una riga**, perché un punto unico esisteva già e i `fontFamily: "inherit"`
sparsi erano la toppa che lo rendeva davvero unico: chi le aveva scritte aveva
già fatto il lavoro difficile.

⚠️ **Ma non bastavano.** Coprivano 47 punti su 121: pulsanti, campi e tendine
restavano col carattere di sistema, e **non si notava soltanto perché il font
della pagina *era* quello di sistema**. Il cambio non ha creato il difetto,
l'ha reso visibile. Chiuso con una regola sola.

*Nel commento sopra quella riga c'è scritto «questa riga sembra non fare
niente, e invece regge tre quarti del sito — non toglierla», perché è
esattamente l'errore che farebbe chi la leggesse fra sei mesi.*

**Cinque prove dal vivo di Andrea**, telefono compreso, in questo ordine: se
qualcosa esce dai bordi, se i titoli sono il font vero o un grassetto
fabbricato, se il testo salta al caricamento, se le lettere particolari
mancano — **e solo alla fine se piace**.

### 24b) I quattro ritocchi, e le due voci che non erano difetti

Andrea ha portato sette osservazioni raccolte **usando il sito**. Quattro erano
lavori, **due erano già a posto** e una si è rivelata più grossa di come era
stata descritta.

⚠️ **Le due cadute vengono dallo stesso equivoco: il sito era stato guardato a
locale chiuso**, dove "prima possibile" sparisce e resta la sola programmata.
La lezione non è che l'osservazione fosse sbagliata — è che *guardare il sito
in una condizione e dedurne la regola* produce diagnosi false, e la conferma
costa una lettura.

⚠️ **Un testo proposto per l'invito sull'indirizzo era falso**, e il lavoro si
è fermato prima di scriverlo. Diceva che senza indirizzo non si vedono menu e
tempi: entrambe le letture partono al caricamento della pagina e non sanno
nulla dell'indirizzo. *L'ha scritto chi guida, non chi esegue, e chi esegue si
è fermato perché il comando gli chiedeva di verificarlo. La frase finale è di
Andrea ed è migliore di quelle proposte, perché **consiglia invece di
descrivere**: un consiglio non può essere falso.*

### 24c) Lo sconto: prima la rete, poi lo spostamento

Lo spostamento di GIVEMEFIVE era pronto per essere scritto. **Non è stato
scritto**, e per due ragioni trovate una dopo l'altra.

**La prima: la catena era scoperta.** Una ricognizione ha trovato **108
occorrenze in tredici file**, e il verdetto era che *le prove sapevano solo che
lo sconto non viene salvato male — che venga concesso a chi spetta, tolto a chi
non spetta, contato bene e consumato una volta sola, non lo verificava
nessuno*. Da qui il riordino: cuore in `lib/`, 32 prove, comportamento
verificato identico su **112 casi** contro il codice vecchio **preso da git**.

**La seconda: il freno non esiste**, e senza freno la rotta che dice se un
numero è già cliente non si può aprire. §14 ha il dettaglio.

⚠️ **E l'ordine dei lavori non era libero.** Il comando dato chiedeva di
togliere il pulsante del carrello e di costruire il sostituto. Ma quel pulsante
è **l'unico interruttore** che accende lo sconto in tutto il progetto:
eseguendo nell'ordine scritto, GIVEMEFIVE si sarebbe spento **in silenzio**,
senza un errore da nessuna parte. *Trovato perché il comando chiedeva di
cercare il freno **per primo**, e da lì è emerso che tutto il resto ci passava.*

### 24d) Un comando che diceva due cose opposte

Un blocco conteneva **"non spingere" in testa e "poi spingi" nel corpo** — un
residuo del comando precedente ricopiato senza rileggerlo. Chi eseguiva **si è
fermato e ha chiesto**, invece di scegliere: il push è l'unica azione di quel
giro che esce verso l'esterno, perché ripubblica il sito.

### 24e) Cosa resta di questa giornata

* ⚠️ **Il collegamento Adobe da autorizzare sul dominio vero** (§6b) — la cosa
  più facile da dimenticare, perché quando succederà sembrerà un guasto.
* ✅ **Lo spostamento di GIVEMEFIVE**, deciso e **sbloccato la sera stessa**
  (spec §14 v65, punto **25**). Resta da costruire.
* ⚠️ **Il guasto di lettura che concede lo sconto** invece di negarlo, fissato
  dalla prova `g` (§14).
* ⚠️ **Le due copie delle costanti dello sconto**, che nessuna prova confronta.
* **Il consumo e il rilascio** dello sconto, ancora senza cuore e senza prove.
* **La pulizia dei 17 `fontFamily: "inherit"` ridondanti**, lavoro a sé.
* **La frase del preordine**, scritta e pubblicata ma **mai vista dal vivo**:
  compare solo in Delivery a semaforo non verde.

⚠️ **Questo elenco è la fotografia dell'08/08 e da allora si è mosso** (nota del
10/08/2026, per non farlo mentire con l'autorità del documento): le **due copie
delle costanti** sono chiuse dalla v66 (punto 26), i **17 `fontFamily`** dalla
v67 (punto 27), e lo **spostamento di GIVEMEFIVE** è stato **ridisegnato** il
10/08 — resta da costruire, ma non nella forma scritta qui (spec §14 v68, punto
28). Le altre voci sono ancora vere.

### 24f) Quattro lezioni

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

## 25) La decisione sul freno, e lo stato ritrovato (08/08/2026, sera)

Sessione di **sola decisione**: nessuna riga di codice scritta, nessun commit
di codice. Le decisioni stanno in **spec §14 v65**; qui c'è solo ciò che il
racconto aggiunge.

### 25a) Il freno: deciso di NON costruirlo

Deciso che **non nasce alcun freno a conteggio**. La rotta che dice se lo
sconto spetta **non risponderà su un numero di telefono**, ma solo a un
checkout compilato: non c'è nulla da martellare, quindi non c'è nulla da
contare. Motivo e alternative scartate per intero in spec §14.

⚠️ **La domanda, com'era scritta, era mal posta — ed è questo che ha tenuto
fermo il lavoro, non la difficoltà del problema.** La v64 chiedeva "su cosa si
frena" e nella stessa frase mescolava **due domande diverse**: *su cosa* si
frena, e *dove* si tiene il conto. Delle tre strade che nominava ne demoliva
**due da sola**, lasciandone in piedi una, cara. Chi la leggeva credeva di
avere una scelta a tre e ne aveva una sola.

*Separate le due domande, è comparsa una quarta strada che nessuna delle due
nominava. Non è stata inventata: era già mezza scritta nelle decisioni di
Andrea dell'08/08 — "lo sconto compare solo a dati obbligatori completi".
Portata fino in fondo, quella frase **è** il freno.*

### 25b) Ciò che l'osservazione di Andrea ha aggiunto

Andrea, decidendo: *«non abbiamo un controllo che il numero di telefono sia
reale»*. Vero, e non scritto da nessuna parte in nessuno dei due documenti.

Conseguenza registrata in spec §14 come **"un utilizzo per numero di
telefono"**, su sua indicazione e **senza farne una sezione**: il danno è
limitato per costruzione, perché per prendersi i 5 € bisogna comporre e
**pagare davvero** un ordine da 25 €. È margine perso su una vendita vera, non
denaro che esce.

⚠️ **Il numero non verificato NON toglie il problema di riservatezza, lo
sposta.** I numeri che stanno nel database ci sono finiti perché clienti veri
li hanno scritti per farsi consegnare la cena: sono veri quasi sempre, per
forza. Confermare "questo numero ha già ordinato" resta una fuga. *È il motivo
per cui la porta va chiusa comunque, anche avendo scartato il freno.*

### 25c) La fotografia dello stato, e la sessione che non ha lasciato niente

Una sessione parallela era stata aperta sui **due lavori piccoli** (le costanti
dello sconto, i diciassette `fontFamily`). Andrea l'ha chiusa senza che avesse
finito. Verificato eseguendo: HEAD **`efabb37`**, allineato a `origin/main`,
**albero pulito**, e le impronte `sha256` dei due documenti **identiche** a
quelle in mano al ragionamento — quindi si è lavorato sulla verità, non su una
copia vecchia.

⚠️ **È l'albero pulito a dimostrare che non si è perso nulla**, non la memoria
di nessuno: se quella sessione avesse scritto anche una riga, comparirebbe come
modifica in sospeso. Non c'è. **I due lavori piccoli sono intatti e ancora da
fare**, e il codice conferma il documento: nessun terzo modulo di costanti,
soglia e importo ancora in due posti, diciassette `fontFamily` ancora lì.

*Trovato di passaggio e registrato in spec §14: il **nome** del codice
`GIVEMEFIVE` sta in **tre** copie — il modulo, il webhook di Stripe, la rotta
di annullamento — mentre soglia e importo restano due.*

### 25d) Il conteggio delle prove, e ciò che il conteggio non dice

Rifatto tenendo anche l'errore standard: **17 file**, **701 righe `PASS`**,
**86 righe di esito non-`PASS`**, e **nessuna di queste è un fallimento** —
zero righe `FAIL`, zero `TEST FALLITI`, diciassette `TUTTI I TEST PASSATI`,
zero file con codice di uscita diverso da zero. Il verdetto poggia su quattro
riscontri indipendenti, non su uno.

⚠️ **La ripartizione delle 86 righe NON torna**: le tre voci in cui è stata
spiegata fanno **88**. I tre numeri erano stati eseguiti davvero, uno per uno:
a non tornare sono **le categorie, che si sovrappongono** — una stessa riga può
cadere in due schemi e farsi contare due volte. E "quattro righe per suite" era
una glossa, non una misura: le suite sono diciassette e quelle righe
sessantaquattro. *Non intacca il verdetto, che poggia su altri quattro
riscontri, ma è il tipo di numero che fra un mese viene citato come fatto.*

### 25e) Tre lezioni

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

### 29c) Cosa resta aperto

* ⚠️ **`promo_redemptions` contiene ancora i riscatti di prova**: quei telefoni
  continuano a sentirsi dire *"Hai già utilizzato questo codice sconto."*
  Cancellarli è **DDL, quindi di Andrea nel SQL editor**, con la migrazione in
  `sql/`.
* ⚠️ **Il caso del rientro sotto soglia resta scoperto per scelta** (§14 v69):
  chi torna al carrello, scende sotto i 25 € e rientra non vede alcuna
  spiegazione. **Deciso di non coprirlo.**
* **I due eventi delle statistiche** legati al carrello sparito (§65) e **i sei
  lavori del punto 16**, tutti dove erano.
* **La Fase 4** resta l'ultimo lavoro pre-go-live.

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

### 31g) Cosa resta aperto

* ⚠️ **La tendina non è mai stata vista su un telefono**: le bandiere e la
  larghezza si giudicano lì, e in locale Andrea non può accedere da telefono.
  Da guardare sul sito pubblicato.
* **Lo Storico** (`HistoryRow`) non mostra l'indirizzo: non era chiesto.
* **Gli ordini già in database** hanno il numero senza prefisso: ricaricandone
  uno su Glovo uscirebbe senza `+39`. Sono di prova.
* **La Fase 4** resta l'ultimo lavoro pre-go-live, e **le tre voci di §6c**
  fuori dal codice.
