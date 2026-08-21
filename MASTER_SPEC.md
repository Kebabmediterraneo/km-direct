# KM DIRECT — MASTER SPECIFICATION

**Versione 73** — sostituisce la v72.

Documento di riferimento definitivo per lo sviluppo. Le decisioni qui
contenute sono approvate: non vanno reinterpretate senza un motivo concreto
(vedi §73). Ogni file di codice del progetto deve rispettare queste regole.

⚠️ **CHE COSA È E CHE COSA NON È QUESTO DOCUMENTO** (v57). Questo documento e
l'`HANDOFF.md` **coprono il progetto dal 24/07/2026 in poi**. Il repository
nasce il 10/07/2026 e i primi **78 commit — quattordici giorni — non sono
nominati da nessuno dei due**: in quei giorni sono nate cinque pagine su sei e
diciotto rotte su venti. **Ciò che questi documenti non nominano può esistere lo
stesso**, e va verificato sul codice, non qui. *Il silenzio di un documento non è
la prova che una cosa non esista: il 05/08/2026 la pagina dei carrelli
abbandonati è stata data per "da costruire" da entrambi i documenti mentre
esisteva e funzionava dal 19/07.*

⚠️ **Disciplina del blocco Novità, dalla v57**: sopravvive **solo il blocco della
versione corrente**. I precedenti vivono in `git log`, che è fatto per quello.
*Fino alla v56 se ne erano accumulati 43, milleottantacinque righe — un quarto
del documento prima che cominciasse a parlare del progetto — e dentro c'erano
istruzioni rovesciate che nessuno rileggeva.*

**Novità della v73** (vincolanti, dal lavoro del 13/08/2026):

1. §63-64 — ⚠️ **CORRETTO UN DIFETTO INTRODOTTO IL 12/08**: un articolo creato
   a metà era trattenuto da `is_available`, che **il reset del mattino rimette a
   true ogni giorno**. Sarebbe tornato in vendita da solo, incompleto. Ora è
   `is_in_menu`, che il reset non tocca mai.
   ⚠️ *§63-64 lo diceva dal 07/08 ed è il motivo per cui quella colonna esiste:
   la regola era scritta e non è stata letta.*
2. §63-64 — ✅ **il cuore che MODIFICA le opzioni di un articolo esistente**,
   con **lo scudo**: l'articolo esce dal menu **prima** che si tocchi una riga e
   ci rientra come ultimo atto.
3. §63-64 — le regole di Andrea: **un articolo che ha proteine non può restare
   senza**, una **Bowl non può restare senza accompagnamenti**, e il **titolo**
   ripiega sulla frase della creazione invece di rifiutare.
4. §36-40 — ✅ **il carrello faceva già la cosa giusta** e non è stato toccato:
   se la proteina scelta non c'è più, toglie **la riga intera** — il combo
   intero se è un combo. Verificato leggendo, non supposto.
5. §63-64 — ⚠️ **NESSUNA ROTTA DEL PANNELLO VERIFICA CHE L'ARTICOLO SIA DI
   QUESTO STORE.** Non è un problema con un negozio solo; il giorno del secondo
   va chiuso **per tutte e sette insieme**.
6. ⚠️ **Le suite di prove MUOIONO senza dirlo** quando una prova esplode: il
   conteggio non arriva e sembra che sia andata. Chiuso in 3 suite su 33.

*Il conteggio delle condizioni di apertura non cambia: **quattro chiuse, cinque
aperte**. ✅ **La Fase 4 esce da questo elenco: è fatta il 12/08.** Il lavoro
pre-go-live che resta è il **viewport**, le tre verifiche registrate in v63 e le
**tre voci di §6c**.*

⚠️ *Fuori dall'elenco perché non è una condizione di apertura, ma **chiesto da
Andrea il 12/08 e da fare**: la **modifica** delle opzioni di un articolo già
creato. Oggi il pannello sa crearle e non correggerle — un prezzo di proteina
sbagliato costringe a rifare l'articolo.*

✅ *I due lavori chiesti da Andrea l'11/08 — il **prefisso internazionale** e
l'**indirizzo nella scheda ordine** — sono **fatti** il 12/08 e provati dal vivo.
Vedi §41-45 e §52-56.*

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
sempre giorno e orario, §12b) → compone ordine → dati cliente →
**eventuale codice sconto, dentro il checkout e a dati completi** (§14, v68) →
paga online → conferma → ordine nel pannello staff. Lo staff
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
ORA" → tab Delivery/Ritiro → dati operativi → categorie
sticky → menu → carrello sticky (quando non vuoto).

⚠️ **Il banner GIVEMEFIVE non c'è più (v68).** Stava fra i dati operativi e le
categorie. Lo sconto si chiede nel checkout, scrivendo il codice (§14). *Chi
arriva sul sito senza aver visto il codice altrove non sa che esiste: è la
conseguenza voluta della scelta, non un effetto collaterale.*

## 6b. Font e tipografia (aggiunta in v64, vincolante)

**Il font del progetto è Termina**, da Adobe Fonts, ed è quello dell'immagine
coordinata del locale. Scelto da Andrea l'08/08/2026 per ragioni di marchio,
non di leggibilità: nessun problema di visibilità era stato rilevato.

**Progetto Adobe `jth6flt`**, nome tecnico da usare nel codice **`termina`**
(minuscolo), con `sans-serif` come riserva se Adobe non risponde. Il
collegamento è un foglio di stile nel `<head>`, **non uno script**: un foglio
deve arrivare prima del primo disegno.

⚠️ **QUATTRO PESI SOLI: 400, 600, 700, 800.** Il sito può usare **solo**
quelli. *Se una riga chiedesse un peso non attivato — un 500, per esempio — non
comparirebbe nessun errore: il browser lo fabbrica deformando il più vicino, e
il risultato non è Termina, cioè l'opposto esatto del motivo per cui il font è
stato cambiato.* Alla data della scelta il sito usava 600 (×31), 700 (×32) e
800 (×5), più il 400 implicito di tutto ciò che non dichiara nulla. Termina ne
ha nove disponibili: gli altri cinque **non sono stati attivati di proposito**,
perché ogni peso è un file che il cliente scarica prima di vedere il testo.

**Set di caratteri completo**, non il predefinito: il menu contiene *Kaymak*,
nomi turchi e greci, lettere accentate. Con l'insieme ridotto un carattere
mancante verrebbe preso da un altro font, e in mezzo a una parola si vede.

⚠️ **IL COLLEGAMENTO È LEGATO AL DOMINIO.** Oggi è autorizzato per `localhost`.
**Il giorno del dominio vero va aggiunto nel pannello Adobe**, o il sito
pubblicato mostrerà il carattere di riserva. *È la cosa più facile da
dimenticare di tutto questo documento: quando succederà sembrerà un guasto del
sito, e non lo sarà.*

### La regola che riporta i moduli nell'eredità (v64, vincolante)

```css
button, input, select, textarea, option { font-family: inherit; }
```

⚠️ **Questa riga sembra non fare niente e invece regge tre quarti del sito.**
Il browser tiene gli elementi di modulo **fuori** dall'eredità del font della
pagina e usa un carattere proprio del sistema. Senza questa regola, **74 punti
su 121** — pulsanti, campi, tendine — restano col font sbagliato.

*Prima esistevano diciassette `fontFamily: "inherit"` scritti riga per riga,
che ne coprivano 47. Non era abbastanza, e soprattutto era un lavoro che ogni
pulsante nuovo avrebbe dovuto rifare. Il difetto non è nato col cambio di font:
c'era già, ma finché il font della pagina **era** quello di sistema nessuno
poteva accorgersene.*

✅ **I DICIASSETTE SONO STATI TOLTI (v67, 09/08/2026, commit `f3422b3`).** Nel
codice non ne resta **nessuno**: diciassette righe tolte, **zero aggiunte,
zero modificate**. *Il commit successivo `f1955af` ha corretto i due commenti
in `app/globals.css` che li davano ancora per esistenti — la stessa frase viveva
in tre posti, e correggerne uno solo li avrebbe lasciati a raccontare cose
diverse.*

⚠️ **QUELLA PULIZIA NON È GARANTITA DAL FATTO CHE IL PROGETTO COMPILI.** Né
`next build` né le 714 prove guardano lo schermo: un carattere sbagliato non fa
fallire niente. Regge perché **prima** di togliere si è verificato, riga per
riga, che ognuna stesse su un `button`, `input`, `select`, `textarea` o
`option` — cioè dentro i cinque tipi che la regola copre — e perché per i sette
che stavano in **oggetti di stile condivisi** si è seguito **ogni consumatore,
non il primo**. *Uno stile usato in dieci punti può finire su un elemento che
la regola non tocca: ne basta uno per cambiare il carattere in un angolo che
nessuno guarda.* Verifica a schermo del pannello staff fatta da Andrea il
09/08: nessuna differenza.

⚠️ **`option` è incluso di proposito, con una riserva**: su alcuni sistemi —
Windows in particolare — le tendine sono disegnate dal sistema operativo e la
regola potrebbe non avere effetto. **Non è verificabile da qui** e non è un
difetto del progetto: è un limite noto.

### Cosa il font ha reso visibile

Le **120 misure** del sito sono numeri fissi, senza alcuna regola di schermo
(§66). Un font con un disegno diverso cambia la resa di **tutte**, non di
alcune: dopo un cambio di famiglia la cosa da guardare per prima **non è se
piace**, ma se qualche scritta esce dai bordi o va a capo, sul telefono
soprattutto. Provato dal vivo l'08/08: nessuna rottura.

## 6c. Prima del go-live, fuori dal codice (aggiunta in v66, vincolante)

⚠️ **Questa sezione non riguarda il repository.** Sono cose che nessun comando
e nessuna prova possono accorgersi che mancano: il codice sarà verde lo stesso.
*Emerse il 09/08/2026 guardando il pannello di pubblicazione, non il codice.*

**L'indirizzo pubblico sarà `ordina.kebabmediterraneo.it`** — deciso il
09/08/2026, **in attesa che il DNS venga creato**. Il valore da configurare è
un record `CNAME` **specifico di questo progetto**, che si legge dal pannello e
**non si ricopia da nessuna guida**: i valori generici che circolano possono
non valere. *Va copiato con il pulsante, non ribattuto a mano: contiene cifre e
lettere che sullo schermo si assomigliano.*

⚠️ **IL SITO È GIÀ RAGGIUNGIBILE**, accertato il 09/08: `km-direct.vercel.app`
risponde e risulta configurato. *Non è mai stato chiuso — era solo sconosciuto,
che è un'altra cosa. Ogni frase di questo progetto che dice "non lo raggiunge
nessuno" va letta come "nessuno lo conosce".*

### Le tre cose da fare prima di incassare

**1. ⚠️ IL PIANO DI PUBBLICAZIONE VA PORTATO A PRO.** Il progetto sta oggi sul
piano gratuito, che le condizioni del fornitore riservano all'uso **personale e
non commerciale**, e la loro definizione di uso commerciale include
esplicitamente **qualunque forma di richiesta o incasso di pagamenti dai
visitatori**. KM Direct incassa ordini. *Le stesse condizioni si riservano di
disattivare un progetto sul piano gratuito **senza preavviso**: non è una
multa, è il sito che smette di rispondere, potenzialmente di sabato sera.*
Finché non si incassa nulla non succede niente, ma **è una condizione di
apertura a tutti gli effetti**, e costa circa venti dollari al mese.

**2. ⚠️ IL FONT VA AUTORIZZATO SUL DOMINIO VERO.** Vedi §6b: il collegamento a
Termina è legato al dominio ed è oggi autorizzato per `localhost`. Il giorno in
cui il sottodominio risponde, va aggiunto `ordina.kebabmediterraneo.it` fra i
domini del progetto Adobe `jth6flt`. *§6b la definisce la cosa più facile da
dimenticare di tutto il documento, e aggiunge la ragione: quando succederà
sembrerà un guasto del sito, e non lo sarà.*

**3. ⚠️ STRIPE VA PORTATO FUORI DALLA SANDBOX.** Oggi il pagamento è in
ambiente di prova. Passare al reale non è un interruttore: cambiano le chiavi,
e **cambia l'indirizzo a cui Stripe manda le conferme di pagamento** — cioè il
webhook, che è il pezzo da cui dipende se un ordine pagato risulta pagato.
*Fino a quel momento nessun euro si muove davvero, quindi il passaggio è anche
il primo momento in cui un errore costa soldi veri.*

⚠️ **Il passaggio a Stripe reale va provato a fondo prima dell'apertura, non il
giorno stesso.** *Scritto nella forma prudente: alla data della stesura non è
confermato se KM Direct sarà il primo canale d'ordine o se se ne aggiunge ad
altri già attivi. Se fosse il primo, il giorno dell'apertura non esiste una
rete sotto e questa riga è vincolante; se ce ne sono altri, si può ammorbidire.
**Da confermare con Andrea.***

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

## 12c. Ritocchi al sito cliente dell'08/08/2026 (v64)

Quattro correzioni nate dall'uso vero del sito da parte di Andrea, non da una
lettura del codice. *Il primo punto in particolare nessuna prova automatica
avrebbe potuto trovarlo: è emerso perché usandolo lui stesso dimenticava
l'indirizzo più volte e se ne accorgeva solo alla fine.*

* ✅ **L'invito a mettere l'indirizzo prima del carrello**, sopra il campo:
  *"Inserisci il tuo indirizzo prima di riempire il tuo carrello"*.
  ⚠️ **È un consiglio, non una descrizione di come funziona il sito**, e questo
  è il punto. Un primo testo proposto diceva che senza indirizzo non si vedono
  menu e tempi: **era falso** — entrambe le letture partono al caricamento
  della pagina e non sanno nulla dell'indirizzo — e il lavoro si è fermato
  prima di scriverlo. *Una scritta falsa insegna al cliente che le nostre
  scritte non sono affidabili.* L'indirizzo serve davvero a due cose, entrambe
  più avanti: sbloccare il pagamento e stabilire se si è in zona.
* ✅ **"Oggi" e "Domani" affiancati su una riga**, non incolonnati, perché la
  tendina degli orari sta sotto entrambi e incolonnati sembrava appartenesse
  solo al secondo. La disposizione regge anche quando una sola delle due
  compare, e va a capo su schermo stretto invece di uscire dal bordo.
* ✅ **Asterisco sui campi obbligatori** del checkout, con la legenda *"I campi
  con * sono obbligatori."* ⚠️ *Quali campi non è stato deciso a mano: è stato
  **letto dalla validazione esistente**.* Nome, Cognome e Telefono sempre;
  Indirizzo e Civico **solo in Delivery**, e il loro asterisco si comporta da
  sé perché i due campi vivono già dentro il blocco del Delivery. *I campi non
  hanno etichette — il loro nome è il testo dentro il campo — quindi
  l'asterisco è andato lì.* La casella dell'informativa **non è marcata**: è un
  obbligo ma non un campo, e una casella di consenso con l'asterisco si legge
  male.
* ✅ **Il preordine detto per quello che è**, nel riquadro sopra il pulsante di
  pagamento: *"Questo è un preordine: il tuo ordine sarà preparato per l'orario
  richiesto"*, al posto di una frase che prometteva un orario di inizio
  preparazione. ⚠️ **Le due frasi del semaforo in testa alla pagina NON sono
  state toccate**, di proposito: quel riquadro è **l'unico posto** dove il
  cliente legge l'orario di apertura, e il testo nuovo non lo contiene.

### Due cose che sembravano difetti ed erano già a posto (v64)

⚠️ Registrate perché non vengano "risolte" di nuovo. In entrambi i casi la
causa dell'equivoco è la stessa: **il sito era stato guardato a locale chiuso**.

* **"PRIMA POSSIBILE" esiste, ed è la scelta predefinita del Delivery.** Non è
  mai stata tolta. La struttura è a due livelli: *prima possibile* oppure
  *consegna programmata*, e **solo dentro la programmata** compaiono Oggi e
  Domani. Le due scelte del momento si disegnano **solo a semaforo verde**: a
  giallo o rosso spariscono e il cliente viene portato sulla programmata col
  primo slot utile. **Ad Andrea sta bene così** (08/08) e non va aggiunta
  alcuna frase in loro assenza. *Il Ritiro non ha il prima possibile per
  decisione, §12b.*
* **La tendina dell'orario è già una sola e condivisa.** Non è legata a un
  giorno: si riempie con gli orari del giorno scelto e sta sotto entrambe le
  radio. *Sembrava legata a "Domani" perché "Oggi" aveva zero slot — e in quel
  caso la sua radio non era spenta, era **assente**.* Duplicarla avrebbe creato
  due tendine dove ne basta una: il problema era la **disposizione**, ed è
  stato risolto affiancandole.

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
numero di telefono (identificatore principale; email come controllo
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

### Lo sconto dopo il riordino dell'08/08/2026 (v64)

✅ **Il cuore è uscito dalla rotta** in `lib/checkout-discount.js`, con il
client del database come **parametro obbligatorio** — la stessa forma di
`menu-create` e `menu-visibility`. Contiene le costanti, il controllo della
soglia **sul subtotale ricalcolato**, il controllo su `promo_redemptions` per
`customer_id`, e il calcolo del totale. Restituisce **cosa è successo**, mai
una risposta al cliente: la parola verso il cliente resta della rotta.
**32 prove nuove.**

*Il comportamento è stato verificato **identico su 112 casi** — sette subtotali
per tutte le combinazioni — facendo girare il codice vecchio **preso da git**
accanto al nuovo. Non è stato riletto né ricopiato: è stato eseguito.*

⚠️ **SE LA LETTURA DI `promo_redemptions` FALLISCE, LO SCONTO VIENE CONCESSO.**
L'errore non viene guardato: il nulla si legge come "nessun riscatto trovato".
È il verso **opposto** a quello prudente di §46b — là un guasto blocca, qui
regala. **Conservato alla lettera** perché quel giro era un riordino e cambiare
comportamento di nascosto sarebbe stato peggio, e **fissato dalla prova `g`**
con un commento che dice perché sta lì. *Il giorno che si deciderà di
cambiarlo, quella prova cadrà: sarà una decisione, non una svista. Prima
dell'08/08 quel comportamento non era scritto da nessuna parte e nessuno lo
avrebbe scoperto se non incontrandolo.*

✅ **LE COSTANTI VIVONO IN UN POSTO SOLO (v66, 09/08/2026).** Soglia, importo e
nome del codice stanno in **`lib/givemefive.js`**, modulo di **sole costanti**,
importato da `lib/checkout-discount.js` — che le ri-esporta per chi le prendeva
da lui — da `app/page.js`, dal webhook di Stripe e dalla rotta di
annullamento. *Prima soglia e importo erano in due copie e il nome in tre, e
nessuna prova le confrontava: cambiarne una sola avrebbe mostrato al cliente
uno sconto che il server non concede, in silenzio.*

⚠️ **`app/page.js` NON deve MAI importare `lib/checkout-discount.js`**: quel
modulo contiene `resolveDiscountAndTotal`, che interroga il database, e nel
browser non deve girare. È l'intero motivo per cui esiste un terzo modulo
invece della scorciatoia.

⚠️ **E NEL MODULO DELLE COSTANTI NON DEVE ENTRARE UNA FUNZIONE.** La prima che
entrasse lo renderebbe di nuovo pericoloso da aprire nel browser, **senza che
nulla lo segnali**. *Fino al 09/08 era un avvertimento scritto nel commento in
cima al file, cioè una difesa che funziona solo se qualcuno legge.*

**La prova che sorveglia tutto questo è `tests/givemefive.test.mjs`** (v66,
13 prove): controlla che il modulo esporti le tre costanti e nient'altro, che
ogni nome importato da `app/page.js` esista davvero e non valga `undefined`, e
che `app/page.js` non torni a riscriverle a mano. **Legge** `app/page.js` come
testo invece di importarlo, perché senza React non parte. *Contiene anche due
prove che sorvegliano sé stessa: una fallisce se la riga di import sparisce —
un file senza import passerebbe altrimenti in silenzio — e una verifica su un
caso finto che la sonda sappia riconoscere un import.*

⚠️ **`next build` NON È UNA RETE CONTRO GLI IMPORT SBAGLIATI**, accertato il
09/08 con controprova: aggiunto di proposito un nome inesistente all'import di
`app/page.js`, la compilazione è riuscita **senza un errore né un avviso**. Il
valore sarebbe diventato `undefined` e il cliente avrebbe visto conti privi di
senso, mentre server e prove restavano verdi. *Questo vale per QUALUNQUE import
del progetto, non solo per lo sconto: la compilazione dice che il codice sta in
piedi, non che chiede cose che esistono.*

**Restano scoperti**: il **consumo** nel webhook e il **rilascio**
all'annullamento, entrambi ancora dentro le rispettive rotte senza cuore in
`lib/`. Il riordino ha coperto **chi offre** lo sconto, non chi lo consuma. La
difesa vera resta il vincolo `unique (promo_code, customer_id)` del database,
che nessuna prova automatica tocca ma che nessun errore di codice può aggirare.

### Lo spostamento nel checkout — RIDISEGNATO in v68, ✅ REALIZZATO in v69

**Il difetto da cui nasce.** Il carrello mostra e scala i 5 € **prima di sapere
chi è il cliente**. Chi ha già usato GIVEMEFIVE lo applica, vede il totale
scalato, e **su Stripe si trova 5 € in più** senza che nessuna schermata glielo
spieghi. Il server ha ragione — controlla e toglie — ma il cliente non lo sa.
*È lo stesso scollamento della finestra del pagamento registrata in v63: il
sito promette prima di poter sapere a chi sta promettendo.*

**⚠️ LE DECISIONI DELL'08/08 SONO STATE SUPERATE IL 10/08/2026.** Fino alla v67
lo sconto doveva **comparire da solo** nel checkout, e il carrello doveva
conservare due messaggi su GIVEMEFIVE — *"ti mancano X €"* sotto soglia e
*"GIVEMEFIVE sbloccato … Conferma al checkout"* sopra. Nessuna di quelle frasi
va più scritta. *Restano leggibili in `git log`, versione v65: non si
ricostruiscono a memoria.*

**Le decisioni di Andrea (10/08/2026), tutte prese:**

* **DAL SITO GIVEMEFIVE SPARISCE.** Niente banner in home (§6), niente
  progressione della soglia né pulsante "Applica" nel carrello (§36-40),
  nessuna riga di sconto e nessun totale scalato prima del checkout. Il codice
  si comunica **fuori dal sito** — volantino, negozio, social.
* **Nel checkout c'è un campo "Hai un codice sconto?"**, dove il cliente
  scrive. Per ora accetta il solo GIVEMEFIVE.
* ✅ **È il cliente a chiedere, e questo è il motivo vero della scelta**, più
  del lavoro risparmiato. Uno sconto che compare da solo, quando la verifica si
  guasta, può solo tacere (e chi ne aveva diritto perde 5 € **senza saperlo**)
  o mostrarsi lo stesso (e allora su Stripe si trova 5 € in più, cioè
  esattamente il difetto che questa sezione sta chiudendo). **A un gesto si può
  rispondere "riprova".** *La scelta fra il verso prudente e quello generoso —
  la domanda su cui la v67 si era fermata — non va più fatta: il campo la
  dissolve.*
* ⚠️ **IL PEDAGGIO RESTA, INTATTO.** Il campo **non toglie** il pericolo
  descritto qui sotto, lo sposta su un gesto volontario: chi cerca l'elenco dei
  clienti scrive GIVEMEFIVE e prova i numeri. Quindi la verifica risponde
  **solo a checkout compilato e carrello sopra soglia** — tutti i dati
  obbligatori, **non il solo numero di telefono** — e restituisce **solo un
  esito**, mai dati del cliente. *Chiedere il telefono per rispondere, se manca,
  riaprirebbe il distributore automatico che l'08/08 era stato chiuso.*
* **Le due risposte restano distinte, ed è un baratto consapevole**: a chi ha
  già riscosso si dice *"hai già utilizzato questo codice sconto"*, a un codice
  inesistente *"questo codice non è valido"*. ⚠️ **Quella prima frase, detta a
  un numero di telefono, dice che quel numero ha già ordinato.** Il pedaggio
  regge da solo; Andrea ha scelto di non aggiungerci sopra anche l'ambiguità
  delle risposte, in cambio di un cliente onesto che capisce cosa gli succede.
  *Scritto come baratto e non come dettaglio, perché una decisione senza il suo
  motivo viene disfatta dal primo che passa credendo di correggere una svista.*

**Le sei risposte del campo, parola per parola (10/08/2026):**

| quando | frase |
| --- | --- |
| dati obbligatori incompleti (il server **non** viene interrogato) | *"Completa i dati dell'ordine per applicare il codice."* |
| carrello sotto i 25 € (il server **non** viene interrogato) | *"Ti mancano X € per usare questo codice."* |
| codice inesistente | *"Questo codice non è valido."* |
| già riscosso da questo cliente | *"Hai già utilizzato questo codice sconto."* |
| lettura fallita | *"Non siamo riusciti a verificare il codice. Riprova fra qualche istante."* |
| applicato | riga nel riepilogo: `GIVEMEFIVE −5,00 €` |

⚠️ **E la settima situazione, che non è una risposta ma un ritiro: lo sconto
applicato DECADE se il carrello scende sotto soglia** — *"Il carrello è sceso
sotto i 25 €: il codice non è più applicato."* È la regola v39 di questa stessa
sezione — la soglia si riverifica a ogni ricalcolo e lo sconto **evapora da
solo** — portata dal carrello al checkout. *Non è un caso di fantasia: applicare
a 30 €, tornare indietro, togliere un panino.*

⚠️ **Il campo NON è un sistema di codici.** Quello è un lavoro a sé, con le
domande ancora aperte annotate il 30/07 (chi crea i codici, se scadono, fisso o
percentuale, soglia, una volta per cliente o in assoluto, **cumulabilità con
GIVEMEFIVE**) e con la tabella `coupons` già esistente e vuota. **Si costruisce
oggi la facciata definitiva e solo la regola cablata dietro**: il giorno dei
codici veri cambia **chi risponde**, non il campo, il gesto, il pedaggio né le
frasi. *I tre esempi di Andrea non sono la stessa cosa: 5 € fissi è ciò che il
sistema fa già, una percentuale apre il caso "lo sconto supera il prezzo" (§46
v37), e un omaggio non è uno sconto ma **una riga in più nell'ordine**, che
tocca carrello, staff e Stripe.*

#### ✅ COM'È FATTO OGGI (11/08/2026) — cinque commit, provato dal vivo

**I pezzi, e chi fa cosa.** `lib/discount-eligibility.js` è **il cuore**: riceve
i lettori come parametri, ricalcola il subtotale riga per riga, controlla la
soglia su quel numero, cerca il cliente in sola lettura e restituisce **uno di
sei esiti**, mai un testo e mai un dato del cliente (53 prove).
`app/api/checkout/discount/route.js` è **la rotta**: applica il pedaggio,
traduce l'esito in una delle sette frasi, e non scrive nulla da nessuna parte.
Il **campo** vive in `CheckoutScreen` dentro `app/page.js`. *La rotta del
pagamento non è stata toccata: riceve `giveMeFiveRequested` come ha sempre
fatto, ora alimentato dal solo `codiceApplicato`.*

⚠️ **IL GUASTO DI LETTURA NON CONCEDE LO SCONTO**, ed è la decisione **opposta**
a quella di `lib/checkout-discount.js`, dove una lettura fallita di
`promo_redemptions` fa **concedere** perché il nulla si legge come "nessun
riscatto". Là è comportamento vecchio conservato alla lettera in un riordino, e
una prova lo fissa; qui è codice nuovo. *Le due regole convivono di proposito e
non vanno "uniformate" da chi passa: la differenza non è fra due file, è fra uno
sconto che si offre da sé e uno che il cliente ha chiesto — e a un gesto si può
rispondere "riprova".*

⚠️ **LO SCONTO NON GUARDA GLI ORARI** (Andrea, 10/08/2026). Locale chiuso o slot
scaduto non riguardano il codice: a fermarli è il pagamento, che ha già il suo
guard (`lib/checkout-timing.js`), e duplicarlo qui creerebbe due copie della
stessa regola. *Distinzione da non perdere: `validateCheckoutRequest` controlla
che giorno e ora **ci siano** — è un dato obbligatorio come il cognome — e quel
controllo la rotta dello sconto lo usa. Ciò che non usa è il giudizio su
apertura e scadenza.*

**Il pedaggio si verifica dove serve, due volte e per due motivi diversi.** Nel
sito il pulsante si appoggia a `canPay` (Andrea, 10/08: **un metro solo**, non
una seconda regola accanto alla prima), che decide solo *quando il pulsante è
premibile* e **non è una difesa**. La difesa è nella rotta, che ricontrolla con
`validateCheckoutRequest` **intero** invece di credere al sito. *Conseguenza
accettata di `canPay`: se lo slot scade mentre il cliente compila, il campo dice
"completa i dati" pur avendoli lui compilati — caso raro in cui comunque tutta la
schermata gli chiede di risistemare l'orario.*

⚠️ **QUANTO COSTA DAVVERO IL BIGLIETTO, scritto com'è e non come si sperava.**
Col **Ritiro non serve alcun indirizzo**: bastano carrello, nome, cognome,
telefono, privacy e un orario. E una coordinata vuota vale zero, che è un numero
finito e supera il controllo di forma (difetto noto dal 31/07, deliberatamente
non corretto). **Il pedaggio è quindi il carrello, non i dati**: chi cerca
l'elenco dei clienti deve comporre ogni volta un carrello vero e risolvibile
sopra i 25 €. *Resta coerente con la scelta dell'08/08 — "un pedaggio, non un
muro" — ma il prezzo è più basso di come lo si era immaginato.*

**La settima frase** (Andrea, 11/08): a una riga non più risolvibile — articolo
esaurito o tolto dal menu mentre il cliente compilava — il campo risponde con la
frase che il pagamento ha **già**, *"Un articolo del carrello non è più
disponibile."* **Non ne nasce una nuova.** *Quella stringa vive già in
`app/page.js` come seconda copia dichiarata e sorvegliata: una prova che ne
pretendeva l'assenza è diventata rossa e aveva ragione lei.*

**La sopravvivenza alla riapertura** (Andrea, 11/08 — "C3"): si conserva **il
codice scritto**, mai lo sconto ottenuto — è la dottrina di §36-40, *l'intenzione
sì, la conclusione no* — e alla riapertura il server **lo riverifica**.
⚠️ **La riverifica NON parte alla comparsa della schermata**: i tre consensi non
si conservano, quindi lì la privacy non è spuntata, `canPay` è falso e la
risposta sarebbe sempre *"Completa i dati dell'ordine"* — un errore a ogni
apertura, per sempre. Parte **quando `canPay` torna vero**, una volta sola.
*`FORMAT_VERSION` non è stata alzata: alzarla avrebbe buttato via il checkout
conservato di chi stava ordinando in quel momento.*

⚠️ **UN CASO RESTA SCOPERTO, PER DECISIONE DI ANDREA (11/08).** La frase *"Il
carrello è sceso sotto i 25 €…"* compare solo per la caduta che avviene **mentre
il checkout è aperto**. Se il cliente torna al carrello, scende sotto soglia e
**rientra**, lo sconto non c'è più e **nessuna frase glielo spiega**: la
schermata si riapre da zero. *È una scelta, non una dimenticanza — il cliente
quel panino l'ha tolto lui, e il carrello glielo ha già detto. Scritto qui
perché chi leggesse la sola tabella delle frasi proverebbe il rientro, non
vedrebbe niente e lo chiamerebbe difetto.*

**Provato dal vivo da Andrea** (10-11/08), e non solo dalle suite: dati
incompleti, codice inesistente, applicazione col totale che scala di 5 €,
caduta sotto soglia, **rifiuto a un telefono che aveva già riscosso**,
sopravvivenza alla riapertura **e la sua controprova** (senza rimettere la
privacy lo sconto non torna), e infine **un pagamento vero in sandbox** col
totale scontato arrivato fino a Stripe. *Nessuna prova automatica di questo
progetto guarda lo schermo: le prove che contano su questa sezione le ha fatte
Andrea con gli occhi, e sono elencate qui perché altrove non risultano.*

⚠️ **`promo_redemptions` contiene ancora i riscatti delle prove**, quindi quei
numeri di telefono continuano a sentirsi rispondere *"Hai già utilizzato questo
codice sconto."* finché quelle righe non vengono cancellate — **cancellazione
che è DDL e spetta ad Andrea nel SQL editor**, non a Code. *Registrato perché,
non scritto, sembrerebbe un difetto della rotta appena costruita.*

#### Il freno: deciso che NON si costruisce (Andrea, 08/08/2026, sera)

**Il pericolo non erano i soldi.** Nessuno può prendersi due volte i 5 €
attraverso quella rotta: il server ricontrolla al pagamento e il vincolo
`unique (promo_code, customer_id)` rende il doppio riscatto materialmente
impossibile. Il pericolo era **un'altra cosa**: una rotta che risponde sì/no su
un numero di telefono è un distributore automatico di risposte, e chi ne provi
molti si ricostruisce **l'elenco di chi ha ordinato**. Non è un furto, è una
fuga di informazioni sui clienti.

**Le tre strade a conteggio, tutte scartate:**

* **sul numero chiesto** — non scatta mai, perché chi abusa prova numeri
  diversi;
* **su chi chiede**, riconosciuto dall'indirizzo di rete — funziona a metà, e
  costa **la riapertura dell'informativa privacy già pubblicata**, perché
  l'indirizzo di rete è un dato personale da conservare, dichiarare e
  cancellare;
* **contando in memoria del server** — **non funziona su Vercel**: le funzioni
  sono senza stato e il conteggio si azzera da solo. Sarebbe un freno che
  sembra esserci e non c'è, il peggiore dei casi.

**La strada scelta è la quarta: non costruire una cosa da martellare.** La
risposta arriva **solo insieme a un ordine intero e plausibile**. Per
ricostruire quell'elenco non basta più digitare numeri: bisogna comporre ordini
finti completi, uno per numero. È **un pedaggio, non un muro** — e in cambio non
si conserva alcun dato nuovo, non nasce alcuna tabella, non si tocca
l'informativa.

⚠️ **LA DIFESA STA O CADE SUL RICALCOLO DELLA SOGLIA.** Il subtotale va
ricalcolato **dal server sul contenuto del carrello**, mai ricevuto dal sito. È
la stessa regola che questa sezione applica già al pagamento — *dal sito arriva
solo un'intenzione, mai un importo* — ed è ciò che rende il pedaggio reale: se
il server si fidasse di un subtotale dichiarato, chi vuole l'elenco scriverebbe
"il mio carrello vale 30 €" e la porta tornerebbe aperta com'era, con in più
l'illusione di averla chiusa.

*Se un domani si osservasse un abuso vero, il freno a conteggio si potrà
aggiungere **sopra** questa scelta. Il contrario — tornare indietro da
un'informativa riaperta — è più difficile: è questo, e non la robustezza, il
motivo dell'ordine.*

#### Come si costruisce (Andrea, 10/08/2026 — "strada B")

⚠️ **LA ROTTA NUOVA NON TOCCA `app/api/checkout/route.js`.** Si ricalcola il
subtotale per conto suo, importando `resolveProduct` e `resolveCombo` da
`lib/checkout-resolve.js` — **gli stessi** che usa il pagamento — e rifacendo il
giro corto: risolvi la riga, moltiplica per la quantità, somma, arrotonda.

*Il motivo è una regola di Andrea, non una preferenza tecnica: il **punto 16
dell'handoff** dice che quel file non si riapre per una cosa sola, e chi lo
riapre si porta dietro sei lavori in sospeso. Estrarre il ciclo avrebbe fatto
scattare quel pacchetto sopra al lavoro dello sconto, nel punto in cui si
incassa il denaro. **I sei lavori restano aperti dove sono**: rimandati per
scelta, non dimenticati.*

⚠️ **IL DEBITO CHE QUESTA SCELTA ACCETTA, E LA CONDIZIONE CHE LO FA SCADERE.**
Due cicli invece di uno. Regge finché quel ciclo resta *chiama, moltiplica,
somma* — le decisioni vere (prezzo, proteina, extra carne, disponibilità,
combo) stanno **dentro i resolver, che restano condivisi**, ed è da lì che
passerebbe la divergenza pericolosa. **Il giorno che uno dei due cicli
decidesse qualcosa che l'altro non decide, o servisse un terzo posto che
calcola il subtotale, il debito è scaduto e il ciclo va estratto davvero.**

⚠️ **E IL CLIENTE SI CERCA IN SOLA LETTURA, MAI SCRIVENDOLO.** Oggi la rotta
del pagamento, per sapere chi è il cliente, fa un `upsert` su `customers` —
nome, cognome, email, marketing e `privacy_accepted_at` — e **solo dopo** può
chiedere a `promo_redemptions` se ha già riscosso. La rotta nuova non può fare
così: riempirebbe il database di clienti che non hanno mai ordinato, ognuno con
una privacy segnata come accettata **per un gesto che accettazione non è**.
Cerca il telefono in `customers` in sola lettura; se non lo trova, l'esito è
"spetta" **senza scrivere una riga da nessuna parte** — chi non esiste non può
aver già riscosso. *Il telefono va cercato nella stessa forma in cui il
pagamento lo salva, ripulito dagli spazi: se le due forme divergessero, chi ha
già usato il codice risulterebbe sconosciuto e la difesa si aprirebbe da sola.*

⚠️ **E l'ordine dei lavori non è stato libero** *(scritto prima di costruire, e
rispettato: oggi l'unico interruttore è il campo del checkout, il pulsante del
carrello non esiste più).* Fino all'11/08 l'unico interruttore che accendeva lo
sconto era **il pulsante del carrello**. Toglierlo prima che il suo sostituto
esistesse
**spegnerebbe GIVEMEFIVE in silenzio**: nessuno lo prenderebbe più, e nessun
errore comparirebbe da nessuna parte. Caduto il freno come lavoro a sé, la
catena obbligata è: **prima il ricalcolo della soglia lato server, poi il campo
nel checkout, poi il carrello smette di nominarlo**. *Un comando che chiedeva
l'ordine inverso è stato fermato prima di essere eseguito.*

⚠️ **DA DECIDERE quando si costruiranno le analytics (§65), non prima**: due
degli undici eventi ammessi nascono dal carrello che oggi sparisce —
`soglia_25_raggiunta` e `givemefive_applicato`. Il secondo cambia solo momento
e luogo (ora è il checkout); il primo perde la schermata che gli dava senso.
**L'elenco degli eventi è un vincolo chiuso nel database**, quindi la decisione
non è libera e va presa lì, non qui.

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


### ✅ La proteina è obbligatoria, e prima non lo era (v72, 12/08/2026)

⚠️ **Fino al 12/08 il server ACCETTAVA un ordine senza proteina** su un prodotto
che le ha. Non era un difetto introdotto: c'era **da sempre**, ed era invisibile
perché il sito preselezionava sempre qualcosa. Lo stesso server pretendeva
l'accompagnamento — se manca, l'ordine è rifiutato — ma per la proteina quel
controllo **non era mai stato scritto**. *È il buco gemello di uno già chiuso:
la stessa regola applicata a una scelta e non all'altra.*

**Decisione di Andrea (RR)**: se un prodotto ha proteine, sceglierne una è
obbligatorio; chi non vuole carne sceglie **"nessuna"**.

⚠️ **E il sito non indovina più.** Se nessuna proteina è preselezionata, nessuna
risulta scelta. Erano **TRE** i punti che ripiegavano sulla prima, non due: il
terzo è quello che rifà la scelta **quando si cambia Roll dentro il combo** —
lasciarlo avrebbe significato che aprendo il combo nessuna proteina è scelta ma
**cambiando Roll ne compariva una da sola**, cioè la trappola armata proprio nel
percorso che nessuno riguarda.

*Il pericolo non era teorico: dal pannello l'ordine delle proteine lo decide chi
crea l'articolo, quindi "la prima" può essere una proteina **con
sovrapprezzo**, e il cliente si troverebbe preselezionata una scelta che costa.*

⚠️ **L'ordine dei tre lavori era obbligato**: prima la difesa del server, poi
quella del sito, e **solo alla fine** il ripiego. *Invertirlo avrebbe reso
raggiungibile lo stato "nessuna proteina" prima che esistessero le difese: in
cucina sarebbe arrivato un Roll senza proteina, senza che nessuno vedesse un
errore.* **Scambiare un difetto rumoroso con uno silenzioso è sempre un cattivo
affare.**

⚠️ *Il contorno del combo ha lo **stesso ripiego** e non è stato toccato: la
decisione parlava di proteine. Da decidere a parte.*

⚠️ *Il rifiuto lato server **non l'ha osservato nessuno**: `checkout-resolve.js`
non è eseguibile senza database, quindi le prove leggono il testo del codice.
La verifica naturale sarà il primo articolo creato senza preselezione.*

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
stesso builder col Roll preselezionato, senza duplicare logica. ⚠️ **Lo
shortcut NON è stato costruito: vedi §26.**

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

**La disponibilità dentro il combo — difetto e decisione (06/08/2026, vincolante)**

⚠️ **Il difetto, letto sul codice.** La tendina delle bibite del builder filtra su `combo_drink_options.is_available`, cioè sulla colonna **di quella tabella**; il join verso `products` porta nome e prezzo e **non** `is_available`, quindi il browser non ha nemmeno il dato per accorgersene. Al pagamento vale lo stesso: il risolutore filtra la disponibilità del prodotto singolo e del Roll del combo, e **non quella della bibita**. ⚠️ **E la colonna che viene controllata non è scrivibile da nessuna schermata**: la rotta della disponibilità del pannello mappa il solo `products`. *Conseguenza: una bibita segnata esaurita mostra il pulsante spento sulla sua card e resta selezionabile nel combo, dove viene venduta — con il supplemento, se è una di quelle che ce l'hanno.* **Contorni e Roll non hanno questo difetto**: i contorni non sono prodotti e hanno una disponibilità propria, filtrata sia nel browser sia sul server; il Roll è filtrato su `products` in entrambi i punti.

✅ **La decisione (Andrea, 06/08/2026): una sola disponibilità, quella del PRODOTTO.** La tendina del combo e il risolutore del pagamento guardano `products.is_available`. Il controllo va messo **in entrambi i punti**: il browser perché il cliente non veda ciò che non può avere, il server perché è la rete sotto agli errori del browser — ed è già la forma che il risolutore usa per prodotto singolo e Roll. ⚠️ *Si rinuncia a poter esprimere "questa bibita c'è, ma non nel combo". **Alternativa scartata**: un secondo comando nel pannello per governare la presenza nel combo. Sarebbe più espressivo e sarebbe una cosa in più da ricordare a ogni esaurimento: il giorno che qualcuno se ne dimentica, il difetto è di nuovo qui, con in più uno strumento che dava l'impressione di averlo risolto. Con un interruttore solo, dimenticarsi non è possibile.*

✅ **Il carrello (Andrea, 06/08/2026):** un combo già nel carrello la cui bibita diventa non disponibile viene **tolto, con il motivo scritto**, esattamente come già accade per gli articoli semplici. *⚠️ **Correzione della v63**: la v61 giustificava questa regola scrivendo che il carrello sopravvive alla chiusura del browser. **È falso**, e §36-40 dice il contrario dalla v33 — il carrello si conserva finché la scheda resta aperta e si perde alla chiusura. La regola resta valida, ma per un motivo diverso e più stretto: il carrello viene ricostruito dal menu fresco al **ritorno da Stripe**, che è l'unico caso reale in cui la pagina si ricarica nella stessa scheda, ed è per la spec stessa "il momento peggiore in cui poteva succedere". Il caso non è teorico: è raro e capita nel punto peggiore.*

⚠️ **La bibita del combo, nella riga d'ordine, esiste solo come NOME.** `order_items.product_id` di una riga di combo punta al **Roll**; la bibita sta dentro `configuration` come stringa. **Il commento di `km_direct_schema.sql` dichiara un `product_id` che il codice non scrive**, e vince il codice: è quello che ha prodotto i dati esistenti. *Va saputo prima di provare a rispondere a domande sugli ordini passati: l'aggancio è per nome, e un articolo rinominato dopo l'ordine non si aggancia più. Non è in contraddizione con la regola dell'identità qui sopra, che governa i **collegamenti** fra prezzi e prodotti — quelli usano l'`id` davvero — ma la fotografia scritta nell'ordine no.*

✅ **ESEGUITA il 06/08/2026, e provata dal vivo** (sette prove a schermo: tutte le bibite presenti nel caso normale, sparizione della sola bibita esaurita, combo tolto dal carrello col motivo giusto, ritorno dopo il ripristino della disponibilità, e la prova della guardia qui sotto). Le prove automatiche coprono per intero il **carrello**, che vive in un modulo puro; la tendina e il pagamento no, per i motivi scritti sotto.

⚠️ **La forma è vincolante: DUE liste, non una filtrata.** La lista filtrata alimenta il builder; quella **piena** continua ad alimentare il ripristino del carrello. *Il motivo era già scritto in un commento del codice, ed è il tipo di regola che si viola per semplificare: il ripristino deve poter **vedere** un articolo esaurito per toglierlo dicendo "non è più disponibile" invece di "non è più nel menu". Filtrare la lista unica avrebbe corretto la tendina rompendo il messaggio del carrello, in silenzio. È la stessa coppia che i Roll usano già.*

**La guardia sulle scelte vuote (06/08/2026, vincolante)**

✅ **Se una qualsiasi delle tre liste del builder — Roll, contorni, bibite — è vuota, il menu combo NON si propone**: banner, testo e pulsante spariscono, e ricompaiono da soli quando torna disponibile qualcosa. *Motivo: il builder parte dal **primo elemento** di ciascuna lista, e su una lista vuota la pagina si rompe. Copre tutte e tre anche se oggi una sola è svuotabile dal pannello, perché la fragilità sta nella forma del builder e non in quale lista si svuota.*

⚠️ **Il difetto coperto era PREESISTENTE.** Segnare esauriti tutti e sette i Roll rompeva il builder **già prima** di questo lavoro: la lista dei Roll era filtrata sulla disponibilità da molto tempo. *Va scritto qui perché fra un mese sembrerebbe un danno introdotto dalla correzione della bibita. Provato dal vivo il 06/08/2026 esaurendo tutti e sette i Roll: la stessa prova ha verificato la guardia nuova **e** l'esistenza del guasto che copre.*

⚠️ **La posizione della guardia è obbligata**: sta **dopo** l'unica chiamata a hook del componente. Un ritorno anticipato messo prima cambierebbe il numero di hook fra un disegno e l'altro, e React fallisce — un guasto peggiore di quello evitato. *Non è una preferenza di stile: chi toccherà quel componente deve saperlo prima, non scoprirlo.*

## 26. Shortcut "Fallo combo"

⚠️ **NON ESISTE NEL CODICE, e questo documento lo dava per costruito** (accertato il 06/08/2026 cercandolo, non dedotto dal silenzio). Il builder del combo si raggiunge da **un punto solo**, il banner del menu combo, e **non sa ricevere un Roll preselezionato**: non ha un parametro per farlo. *La descrizione qui sotto è quindi una funzione **da costruire**, non una che si può usare. Non è una nota invecchiata su un lavoro fatto: è un lavoro mai iniziato che due punti del documento davano per finito.*

⚠️ **Il giorno che verrà costruito**, dovrà passare dallo stesso punto che porta la guardia sulle scelte vuote, oppure portarsela dietro: altrimenti riaprirà da quella strada il difetto appena chiuso.

*Descrizione della funzione, quando si farà:* apre lo stesso builder con il Roll già preselezionato, senza duplicare la logica.

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
Nel carrello: progressione ordine minimo (Delivery, 15 €). Upsell max 3-4
suggerimenti con regole semplici (no AI): Roll senza fritto → suggerisci
fritto; fritto senza salsa → suggerisci salsa; vicino ai 25 € → suggerisci per
raggiungere soglia.

⚠️ **Dalla v68 il carrello non nomina più GIVEMEFIVE**: via la progressione
della soglia dei 25 €, via il pulsante "Applica GIVEMEFIVE", via la riga dello
sconto, e il totale non scala nulla. Lo sconto vive solo nel checkout (§14).

✅ **DECISO in v69 (Andrea, 11/08)**: l'ultimo suggerimento dell'upsell —
*vicino ai 25 €* — **resta e scatta alla stessa soglia**, ma il suo testo non
nomina più lo sconto: *"Aggiungi qualcosa al tuo ordine"*. La costante della
soglia resta importata nel sito **per questa sola regola**. *Quella regola
vendeva anche prima che GIVEMEFIVE le desse un pretesto: è spinta a salire di
scontrino, non promozione.*

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
  soltanto preselezionato**; **il codice sconto scritto dal cliente** (v68:
  era "la richiesta di GIVEMEFIVE", quando lo sconto si chiedeva dal carrello).
  ⚠️ Si salva **il codice scritto, mai lo sconto ottenuto**: al rientro va
  riverificato dal vivo, come già impone la regola di §14 sull'intenzione.
  ✅ *Realizzato in v69: `giveMeFiveApplied` è uscito dalle chiavi conservate —
  non lo accende più nessuno — e `codiceScritto` ne ha preso il posto.
  `FORMAT_VERSION` è rimasta **1**: una chiave in più in una struttura vecchia
  viene ignorata, mentre alzarla avrebbe buttato via il checkout conservato di
  chi stava ordinando in quel momento.*
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
**campo codice sconto** (v68, §14) → riepilogo → CTA pagamento. Dati cliente obbligatori: nome, cognome,
telefono (email facoltativa). Dati delivery separati in campi distinti:
indirizzo, civico, citofono, piano/interno, edificio/scala, note rider,
coordinate — mai un unico campo disordinato. Privacy: checkbox obbligatoria,
con le parole "informativa privacy" rese collegamento alla pagina `/privacy`
(v53). Marketing: checkbox facoltativa, non preselezionata, salvando sì/no +
timestamp + versione testo.

### ✅ Il controllo del telefono (v70, 11/08/2026)

⚠️ **PRIMA DI OGGI IL TELEFONO NON ERA CONTROLLATO.** `lib/checkout-validation.js`
verificava soltanto che il campo non fosse **vuoto**: `"ciao"` passava, `"111"`
passava, e arrivavano fino al file del rider come `+39ciao`. *Il difetto era
registrato da un'osservazione di Andrea dell'08/08 e fotografato dalle prove di
`be068f9` prima di essere chiuso.*

⚠️ **E il telefono non è un dato di contatto: è LA CHIAVE con cui un cliente
viene riconosciuto.** Il pagamento salva con `onConflict: "phone"` — stesso
telefono, stesso cliente — e §14 cerca **esattamente quella stringa** per sapere
se lo sconto è già stato riscosso. *Due forme diverse dello stesso numero sono
due clienti diversi, e lo stesso ordinante potrebbe riprendere GIVEMEFIVE.*

**La regola vive in `lib/customer-phone.js`, modulo puro**, ed è **importata**
dal server (`checkout-validation.js`, dov'è la difesa) e dal sito
(`app/page.js`, dov'è la cortesia). ⚠️ *Mai copiata: la controprova l'ha
dimostrato eseguendo — sporcando il modulo cade anche una prova del validatore,
che quindi lo usa davvero.*

**Le decisioni di Andrea (11/08/2026), tutte prese:**

* **Italia: 9 o 10 cifre.** ⚠️ **NESSUNA REGOLA SPECIALE PER I CELLULARI.** Una
  prima stesura pretendeva 10 cifre dai numeri che iniziano per 3; **Andrea l'ha
  corretta dalla conoscenza dei clienti veri** — esistono cellulari italiani a 9
  cifre, e quella regola li avrebbe rifiutati. *Non reintrodurla: sembra una
  svista e non lo è.*
* **Italia: la prima cifra è 0 o 3.** Sono le uniche esistenti — fissi e
  cellulari — quindi la regola **non rifiuta nessun numero italiano vero**.
  Scelto il **rifiuto** e non un avviso ignorabile: *"un avviso si legge
  distrattamente e il prezzo lo paga il rider"*.
* ⚠️ **Fuori dall'Italia nessuna delle due vale**: 6-15 cifre e basta. **Non
  esiste una tabella dei paesi del mondo** — sarebbe la seconda copia che questo
  progetto ha già pagato tre volte, e il giorno che un paese cambia numerazione
  rifiuterebbe clienti veri in silenzio.
  ⚠️ *Fino all'11/08 qui c'era scritto che chi scrive il `+` **dichiara lui il
  paese** e imbocca la regola larga. **DAL 12/08 NON È PIÙ VERO** (decisione P):
  comanda la tendina, e un `+` battuto a mano fa rifiutare il numero. La riga
  vecchia è tolta e non va rimessa.*
* **Spazi, punti, trattini e parentesi si TOLGONO, non si rifiutano**: il
  cliente scrive `333 123 4567` e il sistema salva `3331234567`, senza che se ne
  accorga. *Ogni rifiuto in più è un carrello abbandonato.*
* **Una frase sola per qualunque rifiuto**, importata e non riscritta:
  *"Controlla il numero, è l'unico modo che abbiamo per contattarti per la
  consegna"*. ⚠️ *Al cliente non serve sapere QUALE regola ha violato: gli serve
  sapere perché quel numero è necessario.* Il messaggio del **campo vuoto**
  resta quello di prima: è un caso diverso.
* **Il pulsante Paga resta premibile** anche con un numero rifiutato. *La difesa
  è nel server e scatta prima che venga creato qualsiasi ordine e prima di
  Stripe; un pulsante che si accende e si spegne mentre il cliente digita è
  peggio di un avviso scritto.*

✅ **Il paese è un PARAMETRO, e il 12/08 la scommessa ha pagato**: il menu dei
prefissi è arrivato e **il modulo della regola non si è riaperto** — è cambiato
solo chi gli dice il paese, più il trattamento del `+` qui sotto.

⚠️ **Ciò che questo lavoro non chiudeva**: i numeri **già salvati** nel database
restano com'erano *(irrilevante: non ci sono clienti reali e il database viene
svuotato prima del go-live)*, e `lib/generate-glovo-xlsx.js` continuava ad
attaccare `+39` a ciò che trovava — ✅ **disinnescato il 12/08**, vedi §57-61.

### ✅ Il prefisso internazionale (v71, 12/08/2026)

Nel checkout, accanto al campo del telefono, un **menu a tendina** con tutti i
paesi: **bandiera, nome, prefisso**, preselezionato Italia. Il cliente scrive
solo il numero. *Le bandiere sono **caratteri emoji** ricavati dal codice del
paese: nessuna immagine, nessuna libreria da mantenere.*

⚠️ **COMANDA LA TENDINA, SEMPRE** (decisione di Andrea del 12/08, "P"). Un `+`
scritto o incollato nel campo **non dichiara più il paese**: il `+` lo mette il
sistema, quindi nel campo è un carattere che non ci va e il numero viene
rifiutato. *Non è una regola nuova da mantenere, è una conseguenza: chi batte
`+39…` con l'Italia scelta compone `+39+39…`, e il `+` in mezzo cade come una
lettera.*

⚠️ **IL NUMERO SI SALVA COL PREFISSO** (decisione "R"): al pagamento parte
`+393331234567`, e **una forma sola vale per tutti**, italiani compresi. È la
chiave con cui il cliente viene riconosciuto (`onConflict: "phone"`, §14): due
forme diverse dello stesso numero sarebbero due clienti. *Si è potuto fare
adesso perché **in database non ci sono clienti reali** e verrà svuotato prima
del go-live; dopo il go-live avrebbe richiesto una conversione, cioè DDL.*

⚠️ **E LE REGOLE ITALIANE NON SI SPENGONO PIÙ DAVANTI A UN `+`.** Fino all'11/08
un numero che cominciava con `+` imboccava la regola larga e **saltava sia le
9-10 cifre sia il controllo 0/3**. Con la tendina *tutti* i numeri cominciano
con `+`: le decisioni del giorno prima si sarebbero spente **in silenzio**,
senza un errore e senza una prova rossa. *Il modulo ora toglie il prefisso del
paese ricevuto e applica le regole nazionali a ciò che resta.*

**Una tabella dei paesi esiste, in `lib/phone-countries.js`, ed è AMMESSA.**
⚠️ *Il divieto di §41-45 riguarda le **lunghezze** per paese, non i prefissi, e
la differenza è il modo in cui l'errore si manifesta: una lunghezza sbagliata
**rifiuta un cliente vero in silenzio** — le numerazioni cambiano senza
avvisarci e chi non riesce a ordinare non scrive per dirlo, va altrove; un
**prefisso** sbagliato **si vede subito nel menu**. La distinzione è scritta
anche in cima al file, o qualcuno lo cancellerà citando la regola sbagliata.*

**Provato dal vivo da Andrea** (12/08): tendina e bandiere, numero con spazi
accettato, `+` scritto a mano rifiutato, `(333) 1234567` accettato, un numero
straniero col suo paese accettato, e **un pagamento vero in sandbox** col numero
che arriva nel pannello come `+39…`.

⚠️ *Un difetto trovato **da una prova** e non da una lettura: alla prima stesura
il prefisso veniva attaccato al testo **grezzo**, e chi scriveva `(333) 1234567`
si vedeva rifiutare un numero giusto, perché la parentesi finiva attaccata al
prefisso. Chiuso facendo ripulire il testo al modulo della regola invece di
riscriverne una seconda.*

### La casella privacy dice (OBBLIGATORIO) (v70, 11/08/2026)

Il testo è ora *"Dichiaro di aver letto l'informativa privacy. (OBBLIGATORIO)"*.
**Andrea: non si capiva che il consenso fosse necessario per proseguire.**
⚠️ *La parola aggiunta dice che il campo è necessario, **non modifica ciò che il
cliente dichiara**: l'informativa pubblicata non è stata toccata e
`MARKETING_TEXT_VERSION` non è stata alzata.*

⚠️ **E quella frase non era sorvegliata da niente** fino a `2ea4a8e`: le prove
che nominavano la privacy riguardavano il messaggio del **server**, un'altra
frase in un altro file. Ora una suite veglia il testo, il collegamento
all'informativa e — la più importante — lo `stopPropagation`, **senza il quale
aprire l'informativa spunterebbe da solo il consenso**, cioè un atto raccolto
senza atto.

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

### Informativa privacy — pubblicazione, collegamenti, versionamento (v53)

**Il documento esiste ed è pubblicato.** Versione **1.2 del 3 agosto 2026**, servita alla rotta statica `/privacy` (`app/privacy/page.js`).

**Collegamenti:**
* nella casella privacy del checkout, le sole parole "informativa privacy" sono un collegamento a `/privacy`, aperto in scheda nuova (`target="_blank"`, `rel="noopener noreferrer"`), con propagazione bloccata perché il clic **non deve** cambiare lo stato della casella;
* collegamento discreto "Informativa privacy" in fondo a home e pagina di conferma (`app/privacy-footer.js`). **Non** nel pannello staff.

**Cosa registra il codice oggi:** `customers.privacy_accepted_at` e `orders.privacy_accepted_at` (data e ora, su cliente **e** ordine). **Non** registra la versione del testo.

**Da fare quando si riaprirà `app/api/checkout/route.js`:** introdurre una costante `PRIVACY_TEXT_VERSION`, sul modello di `MARKETING_TEXT_VERSION` (riga 48), con valore **`informativa-v1.2`**, e salvarla accanto alla data.

**Regola di versionamento, vincolante:** l'informativa descrive il sistema. Ogni modifica al codice che cambia ciò che il documento afferma comporta una nuova versione del documento **nello stesso passaggio**, e il numero di versione salvato in database cambia di conseguenza. Il primo caso già noto è lo spostamento del caricamento di Google Maps (vedi sotto): comporta la riscrittura del punto 5 e il passaggio a v1.3.

**La casella marketing resta com'è** ("novità, offerte e comunicazioni", nessun canale nominato). I canali — e-mail, SMS, WhatsApp — sono elencati nel punto 3.5 dell'informativa, che la casella collega. Se un domani cambiano i canali, si aggiorna il punto 3.5 e la versione.

---

### Prova del consenso marketing — correzione decisa, non ancora fatta (v53)

**Difetto accertato** (`app/api/checkout/route.js` 289-303, `onConflict: "phone"`): a ogni riordino l'`upsert` sovrascrive la riga cliente. Chi ha consentito una volta e riordina senza spuntare produce `marketing_opt_in = false`, `marketing_opt_in_at = null`, `marketing_text_version = null`. **La prova del consenso precedente viene cancellata**, e non esiste storico né funzione di revoca.

**Decisione:** la prova va conservata. L'art. 7 GDPR impone di poter dimostrare il consenso prestato; l'informativa al punto 11.4 lo dichiara. Correzione minima accettabile: l'`upsert` non azzera `marketing_opt_in_at` e `marketing_text_version` quando il nuovo valore è `false` — il consenso corrente resta l'ultimo, ma resta traccia di quello precedente e della sua data.

---

## 46. Pagamento

Stripe. Regole non negoziabili: prezzo ricalcolato server-side (mai fidarsi
del browser), webhook, idempotenza, prevenzione doppio ordine, stato
pending, ordine storico con snapshot prezzi immutabile, procedura rimborso.

⚠️ **LA FINESTRA DEL PAGAMENTO — trovata il 07/08/2026, da decidere prima
dell'apertura (v63)**

**Dal momento in cui il cliente arriva sulla pagina Stripe, nessun controllo
viene più eseguito.** Il risolutore — l'unico punto che verifica
`is_available` e `is_in_menu` — gira **una volta sola**, quando il sito prepara
la sessione di pagamento, **187 righe prima** che la sessione esista. Quando il
cliente vede Stripe, la verifica è già finita e l'ordine è già scritto in
tabella come `pending`.

**Un secondo controllo dopo il pagamento NON esiste**, e va detto
esplicitamente. Il webhook fa tre cose e nessun'altra: verifica la firma
dell'evento, porta il pagamento da `pending` a riuscito, e consuma GIVEMEFIVE
se c'era. **Non legge `products`**: né la disponibilità, né la presenza a menu,
né i prezzi. Non c'è alcun punto in cui un ordine possa essere rifiutato dopo
che il cliente ha pagato.

*Conseguenza concreta: un articolo che diventa esaurito, o che viene tolto dal
menu, mentre il cliente è già su Stripe, produce **un ordine pagato che lo
staff non può preparare**. Si gestisce col telefono.*

⚠️ **Non è un difetto di "togli dal menu" e non è stato introdotto dal lavoro
del 07/08**: vale identico per `is_available`, cioè da mesi, perché le due
colonne stanno nella medesima query chiamata nel medesimo istante e ne
condividono il destino. *Trovata da Andrea sbagliando l'ordine di una prova —
aveva tolto l'articolo dal menu **dopo** essere arrivato su Stripe, e il
pagamento era passato. La diagnosi è stata chiusa con la controprova sul caso
noto: **anche l'esaurito passa**, quindi non era il filtro nuovo a essere
rotto, era il giro a non toccarlo.*

**Da decidere prima dell'apertura**, come lavoro a sé: se chiudere la finestra
significa aggiungere una rilettura nel webhook — una strada mai aperta — e
decidere cosa fare di un ordine già incassato che non si può servire.

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

✅ *Requisito obbligatorio prima del go-live — **soddisfatto il 02/08/2026***:
al checkout il server **confronta il prezzo mostrato al cliente con quello
reale** e, se differiscono, **si ferma con un avviso comprensibile** invece di
addebitare in silenzio un importo diverso da quello visto. Il dettaglio della
chiusura è più sotto, nel blocco "La condizione di apertura è CHIUSA".
*Dalla v30 non figura più fra le condizioni di apertura il "travaso dati test →
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

✅ **La condizione di apertura è CHIUSA (v52, 02/08/2026)**

Il lavoro sull'unificazione del calcolo aveva concluso solo metà del problema, e
va ricordato perché la distinzione resta utile:

- le divergenze **di regola** erano già chiuse: sito e server non possono
  contare in modo diverso, perché non contano più due volte;
- restavano aperte le divergenze **di dato**: il menu è letto dal browser **una
  volta sola** al caricamento, quindi chi teneva il sito aperto mentre un prezzo
  cambiava continuava a vedere il vecchio, e al pagamento gli sarebbe stato
  addebitato il nuovo. Lo stesso modulo, alimentato da due fotografie diverse
  dello stesso database, dà due risultati diversi — ed è corretto che li dia.

**Quel divario è ora coperto**: il server confronta il prezzo mostrato con
quello reale e si ferma (`05c6bc9`, 01/08); il sito manda il prezzo mostrato
(`9705d4a`), riconosce il rifiuto, rilegge il listino e riporta al carrello
(`4304910`, `dade165`, 02/08).

**Verificato dal vivo il 02/08/2026** da Andrea, su due rami: prezzo cambiato
dal pannello mentre il carrello era pieno, e articolo messo esaurito nella
stessa situazione. Entrambi si comportano come deciso. *La prova non ha lasciato
alcun residuo — né ordini né righe cliente — perché entrambi i rifiuti cadono
prima di qualunque scrittura: è la conferma pratica del punto 7.*

⚠️ **Un ramo non è stato provato dal vivo**: lo **slot scaduto**, che risponde
`409` con un testo diverso. È verificato solo leggendo il codice, più un test
automatico che impedisce di riconoscere il rifiuto dal solo status. *Non
appartiene a §46 — si comporta oggi come si comportava prima di questo lavoro —
ma è il primo punto da riprovare se qualcuno tocca quel ramo.*

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
   volta sola** — se conferma e nel frattempo nulla è cambiato ancora, il
   pagamento non viene più fermato.

   ⚠️ **"Non fermato" non vuol dire "senza passaggi" (correzione v52).** Fino
   alla v51 questo punto diceva *"prosegue senza ulteriori interruzioni"*, ed
   **era falso**: tornare al carrello chiude il checkout, e i tre consensi
   vivono nel suo stato locale **apposta perché si azzerino** (§36-40 v39: sono
   **atti**, non dati). Rientrando, il cliente deve **rispuntare la privacy** —
   e i 18 anni se il carrello contiene birre — prima di poter ripagare; il
   consenso di marketing si azzera anch'esso ma non blocca, perché è
   facoltativo. *Vale su entrambi i rami, `409` e `400`, perché entrambi passano
   dal carrello.* **Non è un difetto da correggere: è la regola dei consensi che
   funziona come deve**, ed è la frase di §46 che andava allineata al codice.

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
mostra già al rientro da Stripe — ⚠️ *la v62 scriveva qui "dopo una chiusura
del browser", ed era falso: §36-40 dice dalla v33 che il carrello si perde alla
chiusura. Corretto in v63* — titolo *"Abbiamo
aggiornato il tuo carrello"* e una voce per riga, *"«nome»: «ragione»."* — e
**non se ne scrive uno nuovo**: due testi che dicono la stessa cosa
divergerebbero, ed è la seconda implementazione che §46b vieta.

⚠️ **Fatto registrato nella v49 e mai più verificato — da accertare prima di
scrivere il codice di questa regola**: *"l'avviso delle rimozioni è oggi nascosto
mentre il checkout è aperto"*. Se è ancora così, **la regola qui sopra non è
realizzabile come scritta**, perché manda a riusare un avviso che in quel momento
non si vede. *Questa frase viveva solo nel blocco Novità della v49 ed è stata
portata nel corpo con la sfoltita del 05/08/2026; non è una decisione ma un fatto
sul codice, e come tale va verificato invece che creduto (lezione `ay`).*

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
  la pagina si ritrova solo tramite il link ricevuto dopo il pagamento.

  ⚠️ **Voce di roadmap ancora aperta — recuperabilità della pagina di stato**:
  oggi la pagina è raggiungibile **solo** tramite il link ricevuto dopo il
  pagamento; se il cliente lo perde, non può ritrovarla. Il promemoria "tieni
  aperta la pagina" è **un rimedio provvisorio**, non la soluzione: quella vera è
  inviare il link via **email** (campo già raccolto, facoltativo) o **WhatsApp**
  (fase 1.1). *Questa voce viveva solo nel blocco Novità della v19, e il testo
  qui sopra ci rimandava: con la sfoltita del 05/08/2026 è stata portata nel
  corpo, dove il rimando non può più puntare al vuoto.*
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

### Il "valore perso" dei carrelli abbandonati è già scontato (v64)

Il numero mostrato nel pannello — totale di ogni carrello, *valore totale
perso* e *valore medio* — nasce da `orders.total`, che è **il totale già
scontato**: la riga d'ordine viene scritta prima che il cliente paghi, con lo
sconto già sottratto. Quindi quando un cliente eleggibile abbandona, il valore
perso che si legge è **5 € più basso** del valore del carrello.

✅ **Ad Andrea va bene così** (08/08/2026): quel numero serve a capire quanto si
perde in ordini non conclusi, e cinque euro non cambiano quella lettura.
⚠️ *Registrato come **scelta** e non come difetto rimasto lì. La differenza
conta: una scelta scritta resta una scelta, un difetto ignorato torna a galla
fra sei mesi come sorpresa.*

*Nota coerente: gli abbandonati sono ordini mai pagati, e la promo si consuma
solo a pagamento riuscito — quindi un carrello abbandonato **non brucia** lo
sconto.*

### ✅ L'indirizzo nella scheda ordine (v71, 12/08/2026)

Fino al 12/08 la scheda mostrava **solo nome, cognome e telefono**: l'indirizzo
esisteva in database ma **la rotta che alimenta il pannello non lo leggeva
affatto** — a leggerlo era un'altra rotta, quella che genera il file per Glovo.
Ora la scheda mostra, per i soli ordini **Delivery**: indirizzo, citofono,
piano/interno, edificio/scala e note per il rider.

⚠️ **Una riga vuota non si mostra**: la scheda cresce solo quando c'è qualcosa
da dire, e su un ordine di **Ritiro** non compare nulla. *Le etichette sono le
stesse parole che il file per il rider usa in `formatNotes`, così lo staff legge
la stessa cosa nei due posti — e una prova le **estrae da quel file** invece di
confrontarle con sé stesse.*

⚠️ **La riga del civico NON c'è, ed è una decisione di Andrea del 12/08 presa
guardando la scheda dal vivo**: `delivery_address` è l'indirizzo completo di
Google e **il civico è già dentro**. *E il caso "indirizzo senza civico" non è
da temere — che è il pensiero per cui qualcuno la rimetterebbe: il sito non
lascia premere Paga senza civico e il server rifiuta comunque la richiesta.*
⚠️ *Il campo `delivery_civico` resta però nel `select` della rotta: serve alla
verifica del perimetro, e toglierlo "perché non si mostra più" romperebbe altro.
Una prova lo sorveglia.*

⚠️ *Lo **Storico** non è stato toccato e resta nella forma compatta di prima.*

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
| `recipient_phone_number` | telefono cliente | obbligatorio, **il numero così com'è** (v71: arriva già col prefisso dal checkout, il modulo non aggiunge più nulla) |
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

### ✅ Il modulo è sotto rete, e la controprova ha trovato più della suite (v70, 11/08/2026)

⚠️ **Fino all'11/08 `lib/generate-glovo-xlsx.js` non aveva NESSUNA prova**, ed è
l'unico pezzo del progetto che produce **un documento che esce e va a una
persona vera**. Una delle cinque funzioni di formattazione poteva sbagliare e
lo si sarebbe scoperto dalla telefonata di un cliente. Ora ha **39 prove**
(`be068f9`), che generano il file vero e lo rileggono — le funzioni non sono
esportate, quindi riscriverle nella prova avrebbe provato la copia e non il
codice che gira.

⚠️⚠️ **IL FUSO CHE SI VEDE SOLO IN PRODUZIONE — la scoperta più importante
della giornata.** Togliendo `timeZone: "Europe/Rome"` dal modulo, **nessuna
prova diventava rossa**. Non era una sporcatura fallita: senza fuso dichiarato
il codice eredita quello di sistema, e **la macchina di sviluppo è già su ora
italiana**. Ma **il sito gira su Vercel, dove l'orologio di sistema è UTC**: là
il file per il rider porterebbe l'orario sbagliato — un'ora d'inverno, due
d'estate — e in locale tutto resterebbe verde. *Un preordine per le 20:00
arriverebbe a Glovo come le 18:00.*

**La difesa aggiunta**: una sonda che legge il modulo **come testo** e pretende
che il fuso sia dichiarato — l'unica che, su una macchina italiana, sa dire di
no.

⚠️ **E la lezione vale ben oltre questo file**: *una prova che gira su una
macchina configurata come la produzione non distingue ciò che è **dichiarato**
da ciò che è **ereditato**.* Ogni volta che il codice dipende da una
configurazione dell'ambiente — fuso, lingua, formato dei numeri — la prova che
la verifica va scritta guardando **il testo del codice**, non il suo risultato.

**Due difetti fotografati e NON corretti** (registrati nei commenti delle
prove): un telefono malformato usciva alterato — chiuso poi da `a8402e4`, che
impedisce a monte che arrivi fin qui — e la colonna del codice per Glovo **può**
uscire vuota, mentre il commento del modulo la dichiara «Mai vuota»: oggi non
capita perché `pickup_code` è sempre generato, ma è una promessa che regge per
costruzione altrove, non per un controllo lì.

⚠️ *Ciò che queste prove **non** dicono: che il file sia accettato da Glovo.
Provano la forma che il modulo produce, non che il fornitore la digerisca —
verifica che si fa una volta sola, caricando un file vero.*

### ✅ Il `+39` che indovinava è stato disinnescato (v71, 12/08/2026)

Fino al 12/08 `formatPhone` faceva: *se il numero non comincia con `+`,
attaccagli `+39`*. Era una supposizione ragionevole finché il campo non offriva
alternative. ⚠️ **Con la tendina sarebbe diventata una seconda regola che
contraddice il cliente**: chi sceglie la Francia si sarebbe visto attaccare un
`+39` davanti, e **il rider avrebbe chiamato un numero italiano inesistente**.

Ora il modulo **restituisce il numero così com'è**: arriva già completo dal
checkout (§41-45, decisione R) e qui non si indovina più niente. *Le prove che
fotografavano il comportamento vecchio sono state **capovolte**, non cancellate:
ora sorvegliano che nessuno rimetta quella riga, col caso francese che la
vecchia rovinava.*

⚠️ *Gli **ordini già in database** hanno il numero senza prefisso: ricaricando
su Glovo uno di quelli, ora uscirebbe senza `+39`. Sono ordini di prova e
spariranno con la pulizia pre-apertura.*

## 62b. Gestione Problema/Annullamento ordini (aggiunta dopo l'MVP iniziale)

Due azioni **in sequenza obbligata**, disponibili sugli ordini della sezione
Attivi del pannello staff. ⚠️ **Fino alla v55 questa riga diceva "due azioni
distinte"**, lasciando intendere che si potesse annullare un ordine
direttamente: **non si può, e non è un difetto.** Il codice ammette `problema`
solo da `nuovo`, `in_preparazione` e `pronto`, e ammette `annullato` **solo da
`problema`. Decisione di Andrea del 05/08/2026: si corregge la spec, il codice
resta com'è** — il passaggio intermedio è un fermo prima di un'azione che
rimborsa e chiude, e vale il secondo motivo che costa scrivere.

**Segnala problema**: segna l'ordine come `problema` con un motivo
(testo libero, **obbligatorio**). Non tocca il
pagamento. Da questo stato, lo staff può risolvere il problema tornando
allo stato immediatamente precedente (stesso meccanismo di "torna
indietro" già esistente) oppure procedere ad annullare l'ordine.

**Annulla ordine**: segna l'ordine come `annullato` con un motivo (testo
libero, **obbligatorio**, distinto da quello del problema). Regola sul rimborso,
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

### Dove finiscono i due motivi (correzione della v56, letta dal codice)

⚠️ **Fino alla v55 questa sezione dichiarava, per entrambe le azioni, che il
motivo è "registrato in `order_status_history`". È falso, e non lo è mai stato**:
l'`insert` su quella tabella scrive `order_id`, `status_type`, `status_value` e
`changed_by`, e la tabella **non ha alcuna colonna che possa ospitare un testo di
motivo**. Un lettore che avesse costruito una statistica su quel presupposto
avrebbe cercato un dato inesistente. *Come si falsifica l'errore corretto, se
tornasse: `git grep -n "cancellation_reason"` deve restituire **due** righe in
tutto il repository — la scrittura e la definizione dello schema — e nessuna
dentro le rotte che scrivono `order_status_history`.*

Le destinazioni vere, verificate sul codice il 05/08/2026 e sul database vivo
lo stesso giorno:

| motivo | dove finisce | nome |
|---|---|---|
| annullamento | riga dell'ordine | `orders.cancellation_reason` (colonna dedicata, `text`) |
| annullamento | registro azioni staff | `staff_action_log.detail`, chiave `reason`, con `action: "annulla_ordine"` |
| problema | registro azioni staff | `staff_action_log.detail`, chiave `reason`, con `action: "segnala_problema"` |

Ne discendono tre fatti vincolanti:

* la colonna `orders.cancellation_reason` è **esclusiva dell'annullamento**: il
  motivo del problema non ha alcuna casella sulla riga dell'ordine, e vive nel
  solo registro azioni;
* le due righe di registro si distinguono **unicamente** per il valore di
  `action`. Chi legge quei dati deve filtrare per `action`, mai per la sola
  presenza della chiave `reason`;
* il registro azioni **non si cancella mai** (§66, §69): entrambi i motivi sono
  quindi conservati in modo permanente, anche quando l'ordine viene rimosso
  dalla pulizia mensile e la riga perde il riferimento.

**Il motivo si conserva, non si mostra (decisione di Andrea, 05/08/2026).**
Oggi `orders.cancellation_reason` è **scritta e mai riletta**: nessun punto del
pannello la richiede, nemmeno lo Storico. È una scelta, non una dimenticanza da
sanare — il pannello resta leggero, e il dato c'è se un giorno servirà. ⚠️ **Se
un giorno servirà, si va a leggerlo una volta; non si costruisce una pagina.**
*Questa riga esiste perché senza di essa, fra un anno, qualcuno leggerebbe §65
— che chiede fra le statistiche "ordine annullato + motivo" — e costruirebbe
una vista che nessuno ha mai voluto.*

⚠️ **Asimmetria registrata e non sanata:** la **risoluzione** di un problema
scrive una riga in `order_status_history` ma **nessuna** riga nel registro
azioni. Segnalazione e annullamento lasciano traccia di chi li ha fatti, la
risoluzione no. *Registrato come limite noto: non incide su alcuna decisione
presa, e sanarlo è lavoro sul pannello staff, fuori dai lavori pre-go-live.*

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
  **Tendina delle categorie**: la lista chiusa `product_category` ammette **9**
  valori, di cui l'unico da **non** offrire è `menu_combo`, che non è una
  categoria di articoli ma la forma del menu combo (§23-26): un articolo
  semplice creato lì non comparirebbe da nessuna parte. Le **salse** invece si
  creano, dalla v32: prima sarebbero finite nella tabella sbagliata, ora
  `products` è il posto giusto ed è l'unico.
  ⚠️ **La regola operativa è una sola e sta nel blocco della Fase 3 più sotto**:
  non si legge dal database e non si ricopia. *Fino alla v56 questa sezione
  portava due istruzioni opposte a centottanta righe di distanza, più una terza
  nel blocco Novità della v30 che nessuno rileggeva: tre posizioni per la stessa
  tendina, e quella che il documento faceva incontrare per prima era sbagliata.
  Con la v57 ne resta una.*
  ✅ **COMPLETA e verificata dal vivo il 06/08/2026** (§63-64, blocco d'esito più
  sotto).

*Prima del go-live, in quest'ordine (Andrea, 06/08/2026):*
- ✅ **"togli dal menu" — FATTO il 07/08/2026**, sei pezzi, provato dal vivo:
  vedi il blocco dell'esito più sotto. Forma completa nel blocco dedicato. In
  breve:
  terzo stato accanto a disponibile ed esaurito, per
  l'articolo che esce dal menu senza essere esaurito. **Un solo tasto che fa e
  disfa**, come l'esaurito; premuto, l'articolo **sparisce** dal sito cliente
  invece di comparire spento; ripremuto, torna **disponibile e visibile**, senza
  memoria dello stato precedente. **Non cancella**: un articolo già ordinato non
  è cancellabile dal database (§69), mentre nasconderlo funziona sempre ed è
  reversibile. Gli ordini vecchi non ne risentono, perché congelano nome e
  prezzo. Richiede **una colonna nuova** — DDL, quindi migrazione in `sql/` da
  eseguire nel SQL editor (§63-64) — e una modifica al percorso di lettura del
  menu cliente, che è la parte delicata;
- ✅ **Fase 4 — FATTA il 12/08/2026**, in sei commit. Il blocco completo sta
  poco più sotto, "La Fase 4 com'è stata costruita". ⚠️ *Il testo qui sotto è
  quello di prima e si legge come storia: il rapporto col residuo label→id
  **è stato accertato** e non tocca la Fase 4.*
- *(testo storico)* **Fase 4** — creazione/editing di Roll/Bowl con le loro opzioni,
  **scegliendo fra le proteine già esistenti** e senza crearne di nuove. ⚠️ *Il
  rapporto fra questo lavoro e il residuo label→id di §25 va **accertato sul
  codice come primo passo**: il residuo è pericoloso dove qualcuno può scrivere
  o rinominare un'etichetta, e un pannello che pesca da un elenco chiuso
  potrebbe non ricadere in quel caso. Verosimile non è accertato.* Una proteina
  nuova resta un intervento una tantum sul codice.

*Dopo il go-live:*
- editing dei **contenuti del combo** (contorni, proteine, supplementi):
  richiede prima la conversione delle label a id (§25, residuo noto), perché
  sono proprio le etichette che l'editor andrebbe a modificare;
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
- `slug`: **non editabile** (identificatore, `unique(store_id, slug)`). Regole di
  **generazione** alla creazione: v54, blocco qui sotto;
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

### ✅ La Fase 4 com'è stata costruita (v72, 12/08/2026)

**Sei commit**, e le prove passano da 1331 a **1497**. Il pannello crea ora Roll
e Bowl **complete e ordinabili**; prima creava articoli senza opzioni, che
nessun cliente poteva comprare.

**Il primo passo obbligato, accertato sul codice invece che supposto.** I
documenti dicevano *"verosimile che il residuo label→id non tocchi la Fase 4"*.
La verità misurata è più netta: ⚠️ **oggi nessun punto del codice SCRIVE
`product_choice_options`** — non un `insert`, non un `update`, non un `delete`.
Il residuo è pericoloso solo dove si può **rinominare** un'etichetta, e quel
potere non ce l'ha nessuno. **Vale finché la Fase 4 fa SCEGLIERE e non
RINOMINARE**: il giorno che qualcuno desse quel potere, il residuo si sveglia e
il danno sarebbe **rifiutare al pagamento i carrelli già composti**.

**Le decisioni di Andrea (12/08/2026), tutte prese:**

* **(GG) Tutti e quattro i gruppi insieme** — proteine, rimozioni,
  accompagnamento, extra. *Senza l'accompagnamento una Bowl nascerebbe
  impossibile da ordinare.*
* **(CC) Le proteine col loro sovrapprezzo, che può essere ZERO** ed è
  obbligatorio indicarlo. ⚠️ *Zero è un valore, non un campo mancante: un
  modulo che lo trattasse come assente farebbe pagare un supplemento mai
  deciso.*
* **(DD) Le rimozioni si aggiungono e si tolgono, NON SI RINOMINANO.** ⚠️ *È la
  regola che tiene chiuso il residuo: `checkout-resolve.js` cerca quelle
  etichette PER NOME, quindi rinominarne una farebbe rifiutare al pagamento i
  carrelli già composti. Chi sbaglia a scrivere toglie e riscrive.*
* **(JJ) L'elenco delle rimozioni si costruisce da quelle già usate**, non da
  una tabella nuova. *Un refuso sparisce dalla tendina appena nessuno lo usa
  più: si autopulisce.* ⚠️ *E due etichette che differiscono per uno spazio
  restano **due voci**: accorparle farebbe scegliere una rimozione credendo di
  sceglierne un'altra.*
* **(RR) Se un prodotto ha proteine, sceglierne una è OBBLIGATORIO.** Chi non
  vuole carne sceglie **"nessuna"**, che è già fra i valori ammessi. ⚠️ *In
  cucina un ordine senza proteina non si distingue da un dato perso; "nessuna"
  si distingue.* *Nota: "nessuna" oggi non compare in nessuna riga — nessun
  prodotto la offre ancora.*
* **(WW) Se una scrittura delle opzioni fallisce, l'articolo nasce SPENTO.**
  ⚠️ *Realizzato al contrario di come suona: l'articolo con opzioni **nasce
  spento e si accende come ultimo atto**, invece di nascere acceso e venire
  spento in caso di guasto — perché quello spegnimento sarebbe **una scrittura
  in più che può fallire a sua volta**, lasciandolo acceso e incompleto. Il
  guasto non ha bisogno che nulla riesca per essere innocuo.*
* **(YY) Il titolo sopra le proteine si scrive**, precompilato con *"Come
  preferisci il tuo kebab?"*. *Senza, il predefinito del database è "Proteina" e
  un Roll nuovo mostrerebbe al cliente un titolo diverso da tutti gli altri.*
  ⚠️ *Questa etichetta NON è come le rimozioni: il checkout la **copia** e non
  la cerca mai, quindi rinominarla non rompe nessun carrello.*
* **(A) Tutto in una schermata sola**; **(D) le proteine come caselle da
  spuntare**, non righe da aggiungere — sono tre e fisse, ed è la forma che il
  pannello usa già per i 14 allergeni.
* **(b) I gruppi si mostrano su tutte le categorie tranne le bevande.** ⚠️ *Una
  regola "solo roll e bowl" andrebbe aggiornata a mano il giorno che nasce una
  categoria nuova, e chi la dimenticasse se ne accorgerebbe solo vedendo il
  primo articolo nato senza proteine — cioè tardi. Prezzo accettato: creando una
  salsa si vedono campi vuoti che non servono.*
* **Le tre colonne prima escluse sono state incluse**: proteina preselezionata,
  dose inclusa (§19) e dosi cumulabili (§22). *Senza, un KM Special ricreato dal
  pannello non sarebbe uguale all'originale.* ⚠️ *`extra_dose_included` e
  `max_quantity` oggi **non sono lette da nessuna riga di codice**: il pannello
  le scrive, ma perché servano dovrà leggerle chi calcola il prezzo.*

**Il catalogo delle proteine** si legge dal database filtrando sull'enum
`protein_key`, che è la lista chiusa che il database già dichiara. ⚠️ **Si ferma
con un errore se una chiave avesse due etichette diverse**: sceglierne una
attaccherebbe al prodotto nuovo un nome che il checkout non ritroverebbe. *Al
12/08 la lettura del database di Andrea ha dato **una sola etichetta per ogni
chiave**, quindi il caso non si presenta — ma il codice non dipende dal fatto che
oggi vada bene.* *Si legge **solo se l'articolo ha proteine**: leggendolo sempre,
una divergenza bloccherebbe la creazione di una salsa o di una birra.*

⚠️ **AGGIUNGERE UNA PROTEINA NUOVA: TRE PASSAGGI, TUTTI DA SQL EDITOR.** Non si
fa dal pannello (decisione del 06/08: la Fase 4 sceglie fra le esistenti).
1. **allargare l'enum `protein_key`** — è DDL;
2. **aggiungere la proteina come riga su almeno un prodotto**, perché il
   catalogo vede solo ciò che esiste: una chiave dichiarata e mai usata **non
   compare** fra le caselle del pannello;
3. **solo se serve legarci un extra**, un terzo intervento, perché anche
   `requires_protein` usa lo stesso enum chiuso.
*Scritto qui perché è una cosa che si fa una volta ogni sei mesi e che, non
scritta, costa un pomeriggio a ricostruirla.*

**Provata dal vivo da Andrea** (12/08): un Roll creato dal pannello con tre
proteine, sovrapprezzi a zero e a 4,50, preselezione, due rimozioni — una dalla
tendina e una scritta a mano — e **aperto dal lato cliente**, dove il titolo, le
rimozioni e il prezzo con l'Adana risultano corretti. *Il Roll di prova è stato
poi cancellato con la migrazione `sql/cancella_roll_prova_12ago2026.sql`,
eseguita dopo aver verificato che nessun ordine lo contenesse.*

⚠️ **Cosa NON è chiuso**: la **modifica** delle opzioni di un articolo esistente
(chiesta da Andrea il 12/08), e la verifica del **rifiuto lato server** della
proteina obbligatoria — le prove leggono il testo del codice, e osservarlo
richiede la fotografia della route, che crea ordini veri.

### ✅ La MODIFICA delle opzioni — il cuore e la rotta (v73, 13/08/2026)

La Fase 4 sapeva **creare** Roll e Bowl complete ma non **correggerle**: un
prezzo di proteina sbagliato costringeva a rifare l'articolo. *Chiesto da Andrea
il 12/08 e costruito in tre commit; la schermata è il passo che resta.*

⚠️ **LO SCUDO, ed è il cuore della soluzione.** Fra il cancellare le opzioni
vecchie e scrivere le nuove, un Roll sarebbe per un istante **senza proteine e
in vendita** — lo stato che le regole di §17 esistono per impedire. L'articolo
viene quindi **tolto dal menu PRIMA di toccare qualunque riga** e rimesso come
**ultimo atto**.

⚠️ *Perché lo scudo è la **prima** scrittura e non l'ultima: se fallisce,
**nessuna opzione è ancora stata toccata**, quindi l'articolo resta intero e in
vendita e il guasto costa zero. È l'unico ordine in cui il fallimento dello
scudo non lascia macerie. E se la sequenza si spezza nel mezzo, **l'articolo
resta fuori dal menu e non si tenta di rimettercelo**: rimettercelo è proprio la
scrittura che può fallire.*

**Le regole di Andrea (13/08/2026):**

* ⚠️ **Un articolo che HA proteine non può restare senza.** *Guarda cosa
  l'articolo ha oggi, non la sua categoria: un prodotto che nasce senza proteine
  resta legittimo — l'Egiziano e il Cipriota non ne hanno.* Andrea: *"non
  succederà mai che un Roll con scelta di carne diventi senza"* — ed è
  precisamente per questo che il pannello lo impedisce.
* **Una Bowl non può restare senza accompagnamenti**, come già in creazione:
  senza, diventa **non ordinabile da nessun cliente**.
* **Il titolo sopra le proteine RIPIEGA invece di rifiutare**, sulla stessa
  frase della creazione — *esportata e non ricopiata*. ⚠️ *Mai sul predefinito
  del database (`'Proteina'`), che è diverso da quello che i clienti leggono su
  tutti gli altri articoli. Un titolo esistente si **conserva**: il ripiego vale
  solo quando non c'è niente da conservare.*
* **Il sovrapprezzo di una proteina avrà la conferma esplicita** come il prezzo
  dell'articolo (da realizzare con la schermata).

**Le opzioni si sostituiscono per intero a ogni salvataggio**, e non è una
scelta di comodo: ⚠️ *accertato che l'**identità** di quelle righe non serva a
nessuno — nessuna chiave esterna la usa, gli ordini copiano chiave, etichetta e
prezzo, il carrello riaggancia per etichetta, il pagamento cerca per nome.
Sostituire le righe **non rinomina niente**: un'etichetta uguale rinasce uguale,
e la regola DD resta la difesa.*

✅ **Il CARRELLO non è stato toccato, perché faceva già la cosa giusta**
(verificato leggendo il 13/08): se la proteina scelta non è più fra quelle del
prodotto, toglie **la riga intera** — e per un combo **il combo intero**, non il
solo Roll — col motivo *"una scelta non è più disponibile"*. **Andrea ha deciso
di lasciare quella frase invariata**: a differenza della bibita, che è una parte
sostituibile, qui l'articolo va rifatto comunque, quindi sapere quale scelta è
saltata non farebbe risparmiare niente.
⚠️ *Tre casi finiscono lì, e il terzo non era previsto: **aggiungere** proteine a
un articolo che non ne aveva svuota di quella riga i carrelli che lo contengono.
È corretto — quella riga non è più valida — ma è un effetto dell'aggiunta, non
della rimozione.*
⚠️ *E il controllo gira **solo** quando il cliente rientra sul sito o dopo un
rifiuto del listino: un carrello aperto in questo momento non riverifica nulla,
e a fermarlo sarà il pagamento.*

**La rotta si chiama `product-options`**, accanto a `product` come le opzioni
stanno all'articolo. ⚠️ *Non è stata infilata dentro `options`, che è una GET e
restituisce il catalogo per il modulo di creazione: sono due mestieri con
permessi e conseguenze diverse, e una prova veglia che restino separati.*

⚠️ **NESSUNA ROTTA DEL PANNELLO VERIFICA CHE L'ARTICOLO SIA DI QUESTO STORE**
(accertato il 13/08 su tutte e sei le rotte e i quattro cuori: `create` è la
sola che risolve lo store, e lo fa per **assegnarlo** a una riga nuova). *Non è
un problema finché il negozio è uno solo. Il giorno del secondo va chiuso **per
tutte e sette insieme**: chiuderlo in un punto solo lascerebbe le altre sei
porte aperte e darebbe l'impressione che il problema sia risolto. Due prove
fissano lo stato accertato e diventano rosse se qualcuno lo chiude a metà.*

**Stato di avanzamento (aggiornato in v72)**: ✅ **Fase 1, 2A, 2B, 3, "togli dal
menu" e FASE 4 sono complete e verificate dal vivo.** **Non resta più nessuna
fase pre-go-live.** ⚠️ *Resta però la **modifica** delle opzioni di un articolo
esistente, chiesta da Andrea il 12/08: il pannello sa crearle, non correggerle.*

*(formulazione precedente, superata)*: Prima del go-live
resta la sola **Fase 4**. *"Togli dal menu" è stato chiuso il 07/08/2026 in sei
pezzi — esito e prove nel blocco dedicato più sotto. Fino alla v58 né esso né la
Fase 4 erano pre-go-live.* *La formulazione precedente diceva che restava la
sola Fase 3.* *Le formulazioni precedenti di questo blocco e di quello della Fase
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

### Fase 3 — generazione dello `slug` (decisioni di Andrea del 04/08/2026, vincolanti)

**Perché serviva una decisione.** `products.slug` è **obbligatorio e senza generazione automatica**: verificato il 04/08/2026 sul database — nessun valore predefinito, nessuna colonna calcolata, nessun trigger di inserimento. Se il pannello non lo produce, la creazione di un articolo **fallisce**. Non è un dettaglio di forma, è un blocco della Fase 3.

⚠️ **Non c'era nulla da riusare.** Una ricognizione di sola lettura sul repository (04/08/2026) ha accertato che **non esiste alcun codice che costruisca uno slug a partire da un nome**: né una funzione, né una trasformazione in SQL, né una dipendenza esterna. L'unico precedente è la migrazione delle salse del 28/07, dove i sette slug sono una **mappatura letterale scritta a mano**, con nome e slug come due elenchi indipendenti accostati per id. *Il file contiene l'esito di sette scelte, non la regola.*

⚠️ **La convenzione descritta finora era un'osservazione, non una regola.** Le sette salse esercitano tre comportamenti — minuscolo, spazio → trattino, apostrofo → trattino — e **non ne esercitano altri tre**: accenti, `&`, numeri. Nessun nome delle sette li contiene. Con la v54 tutti e sei diventano **decisi**, non osservati (distinzione della lezione `ay`).

**Le regole, vincolanti:**

1. tutto **minuscolo**;
2. **accenti tolti** (`è` → `e`);
3. **spazi** → trattino;
4. **apostrofi** → trattino;
5. **`&` eliminata**;
6. **numeri e unità invariati**;
7. **nessun trattino doppio e nessun trattino ai bordi** (aggiunta il
   06/08/2026, scritto il codice). ⚠️ *Serve dove una regola precedente ne
   incontra un'altra: un apostrofo accanto a uno spazio, o un nome che comincia
   o finisce con spazio, `&` o apostrofo. Scoperta con un esperimento, non per
   ragionamento: senza di essa un nome fatto del solo apostrofo produce lo slug
   `-`, che il database accetterebbe. **Non** serve per un nome come "Kaymak &
   miele", già coperto dalla riduzione degli spazi.*

⚠️ **Un carattere per cui non esiste una regola fa RIFIUTARE il nome** — barre,
parentesi e simili — invece di essere eliminato in silenzio. L'apostrofo
tipografico dei Mac (`’`) è trattato come quello dritto: è lo stesso carattere
per chi scrive, e sulla tastiera di Andrea è quello che esce.

**Lo slug si genera dal nome, in automatico.** Nessun campo da compilare nel form: Andrea scrive il nome e basta. Un campo in più è un campo in cui sbagliare, su un valore che non arriva mai al cliente.

**In collisione il pannello si ferma.** Se lo slug calcolato esiste già per quello store, il salvataggio viene rifiutato con un messaggio che dice di **cambiare il nome**. ⚠️ **Non si aggiunge un numero in coda in automatico**: due articoli con lo stesso nome sono quasi sempre un doppione creato per errore, e un sistema che lo aggiusta in silenzio lo lascia nel menu senza che nessuno se ne accorga. *Il rifiuto deve arrivare dal nostro controllo con un messaggio comprensibile, non dall'errore di vincolo del database.*

**La regola vive in un modulo unico** sotto `lib/`, non dentro l'interfaccia, come `menu-badges` e `menu-spice`. Oggi **nessun percorso del codice crea prodotti** — tutti gli accessi a `products` sono letture o modifiche — quindi la Fase 3 sarà il primo, e sarà il momento in cui la convenzione passa da ciò che si osserva a ciò che il sistema impone. Sparsa nell'interfaccia, il secondo punto che un giorno creerà articoli ne avrebbe una copia diversa.

⚠️ **La tendina delle categorie NON si legge dal database, e NON si compila a mano una quarta volta** (decisione di Andrea, 05/08/2026, sostituisce la v54).

*Perché non si legge dal database*: `product_category` è un **tipo del catalogo di Postgres**, non una tabella. Verificato il 05/08/2026 sul sorgente della libreria installata: il client offre `.from()` per tabelle e viste, `.rpc()` per funzioni, e nient'altro; non esiste alcuna funzione che restituisca quelle etichette, e crearla sarebbe una migrazione da eseguire a mano. **La prescrizione della v54 era irrealizzabile, non solo scomoda.** *Si sarebbe scoperto scrivendo il codice.*

*Perché non si ricopia*: le copie **sono già tre**, tutte scritte a mano e nessuna che importi dalle altre — `PRODUCT_CATEGORY_LABEL` e `PRODUCT_CATEGORY_ORDER` nel pannello, più la mappa del sito cliente. Aggiungerne una quarta peggiorerebbe il problema che la v54 voleva risolvere.

**La regola**: la tendina **usa l'elenco che il pannello già possiede**, escludendo `menu_combo`, e si aggiunge **una prova automatica che confronta le copie fra loro** e fallisce se divergono.

✅ **Aggiornamento del 06/08/2026, scritto il codice: le copie sono scese da tre a due.** L'elenco vive ora in un modulo unico sotto `lib/`, che il pannello **importa** invece di riscrivere: le due copie del pannello sono diventate una sola fonte. Restano da confrontare **quella sotto `lib/` e la mappa del sito cliente**. *La prova decisa qui sopra va scritta su due copie, non su tre; il fatto storico — che al 06/08 fossero tre e coincidessero — resta vero e resta scritto sotto.* Con lo stesso criterio la tabella dei valori dietetici è stata portata in `lib/menu-dietary.js`.

⚠️ **Rischio residuo, dichiarato**: la prova **non** protegge dall'aggiunta di una categoria al database, perché il confronto col database non è costruibile. Protegge dal caso molto più probabile — qualcuno che la aggiunge in un posto e dimentica gli altri due. *Il giorno che servisse chiudere anche l'altro caso, la strada è una funzione lato database creata da migrazione, esattamente come nacque `set_updated_at()`.*

✅ **Letto il 04/08/2026**: i valori ammessi sono **nove** — `roll`, `bowl`, `menu_combo`, `fritti`, `sides`, `salse`, `dolci`, `drink`, `birre` — quindi **otto** nella tendina, tolto `menu_combo`. *Riletto dal database vivo il 06/08/2026 con lo stesso esito: due letture indipendenti, stesso risultato.*

✅ **Le tre copie coincidono davvero — verificato sul codice il 06/08/2026.** Tutte e tre portano gli stessi **otto** valori, nello stesso ordine: `PRODUCT_CATEGORY_LABEL` (chiave → etichetta) e `PRODUCT_CATEGORY_ORDER` (array di sole chiavi) nel pannello, `CATEGORY_DB_KEY` (chiave dell'interfaccia → chiave del database) sul sito cliente. *Era una premessa mai controllata: se avessero divergiuto, la prova decisa in v57 sarebbe nata rossa, e un controllo che fallisce il primo giorno insegna ad ammorbidirlo (lezione `bi`). Non è successo.*

⚠️ **Le liste vicine che la prova NON deve confrontare.** Sul sito cliente ne esistono **altre due**, entrambe da **nove** voci perché comprendono `menu_combo`: quella delle linguette del menu e quella delle categorie apribili. **Sono giustamente diverse** — Menu Combo è una forma di menu e non ha righe proprie in `products` — e chi scriverà la prova le troverà lì accanto. Vanno nominate qui perché il rischio è concreto: o le si include e la prova fallisce senza un difetto, o la si allarga finché smette di controllare qualcosa.

**Quale copia alimenta cosa, letto dal codice il 06/08/2026**: la sezione Menu del pannello usa `PRODUCT_CATEGORY_ORDER` per l'ordine e il filtro e `PRODUCT_CATEGORY_LABEL` per il titolo; il raggruppamento avviene invece sul valore grezzo di `products.category`. La tendina della Fase 3 segue la stessa coppia.

⚠️ **Una categoria fuori da `PRODUCT_CATEGORY_ORDER` non verrebbe disegnata, e in silenzio.** Il filtro scorre quell'array: una riga con una categoria assente finirebbe raggruppata in memoria e **mai resa a schermo**, senza errore e senza messaggio. Il salvataggio direbbe che è andato tutto bene e l'articolo sparirebbe dalla lista. ✅ **Oggi è latente, non attivo**: `menu_combo` ha **zero righe**, contato sul database vivo il 06/08/2026. Diventerebbe attivo solo se quella categoria entrasse nella tendina.

**Conseguenza sulla prova (decisione del 06/08/2026):** la prova che confronta le copie verifica **anche** che `menu_combo` sia assente da tutte. Costa una riga dentro un controllo che si sta già scrivendo, e impedisce che qualcuno lo rimetta in mezzo "per simmetria" con le liste del sito cliente.

### Fase 3 — le tre decisioni di creazione (Andrea, 05/08/2026, vincolanti)

**1. Il salvataggio è possibile solo a modulo completo.** Il pulsante resta disattivato finché tutti i campi obbligatori non sono compilati, **allergeni compresi** — dichiarati oppure con "nessuno dei 14" spuntato, che è la casella che rende la regola applicabile anche a una lattina.

**2. L'articolo nasce disponibile**, come qualunque altro. ⚠️ **Rischio accettato, con nome e data: Andrea, 05/08/2026.** Creare un articolo sono **due scritture separate** — prima la riga in `products`, poi le righe in `product_allergens` — e il client **non può raggrupparle in transazione** (§66). Se la seconda fallisce, resta in menu un articolo **senza allergeni dichiarati**, e nulla lo segnala. *La contromisura accettata è organizzativa e non tecnica: si creano articoli fuori dall'orario di servizio (§67) e si guarda il menu subito dopo. Alternativa scartata: farlo nascere esaurito, che riduce il danno ma non lo elimina, perché un articolo esaurito resta comunque in vetrina.*

**3. La tendina** segue la regola qui sopra.

⚠️ **Il fatto che dà la misura del rischio al punto 2**, verificato sul codice il 05/08/2026 e da conoscere prima di toccare la Fase 3: su un articolo **senza righe in `product_allergens`, il blocco allergeni della pagina cliente sparisce del tutto** — nessuna scritta, nessuno spazio vuoto, zero pixel. **Non esiste in tutto il file cliente un testo del tipo "nessun allergene" o "non disponibili".** E `allergens_verified_at`, che distinguerebbe *"verificato: non ne ha"* da *"nessuno ha mai dichiarato"*, **arriva al browser e viene scartata** prima di raggiungere la card: i due casi appaiono identici al cliente. *Poiché tutti gli articoli di oggi mostrano il blocco, un articolo che non lo mostra si legge come "non ne ha". Il sito non lo afferma, ma lo lascia capire.*

*Nota di direzione opposta, verificata lo stesso giorno*: i badge **Vegano/Vegetariano** si comportano bene — richiedono un `true` scritto in tabella, quindi un articolo non compilato **non riceve** il badge, e mai quello sbagliato. Su questa materia l'omissione sbaglia per difetto, che è la direzione giusta.

### Fase 3 — le quattro decisioni operative (Andrea, 06/08/2026, vincolanti)

Precedute da una ricognizione di sola lettura su codice e database vivo. **I valori che il pannello deve fornire per creare una riga sono cinque e cinque soltanto** — `store_id`, `category`, `slug`, `name`, `base_price` — letti dal database il 06/08/2026 e coincidenti con `km_direct_schema.sql` su tutte e 18 le colonne, nome per nome, obbligo per obbligo, valore predefinito per valore predefinito. Tutto il resto o accetta il vuoto o ha un valore predefinito.

**1. `allergens_verified_at` si scrive PER ULTIMA.** L'ordine vincolante della creazione è: riga in `products` **senza** la data di verifica → righe in `product_allergens` → aggiornamento dei flag dietetici e della data → riga di log. ⚠️ *Motivo: la creazione sono scritture separate che il client non può raggruppare in transazione (§66), e il rischio dell'interruzione è accettato (decisione 2 del 05/08). Con quest'ordine un articolo lasciato a metà resta segnato **"mai verificato"** e si vede nella lista del pannello, dove §67 mostra lo stato di verifica. Con l'ordine opposto risulterebbe **verificato e senza allergeni**, che è la bugia peggiore possibile su un dato di sicurezza alimentare.* **Non riapre la decisione del 05/08**: l'articolo nasce comunque disponibile e il rischio resta accettato. Cambia solo che smette di essere invisibile. *È lo stesso ordine che la Fase 2A già esegue: prima le righe allergene, poi flag e data.*

**2. `sort_order` sta nel modulo, con una proposta.** Il pannello propone il posto **dopo l'ultimo della categoria scelta** e lascia cambiare il valore. ⚠️ *Motivo: il valore predefinito del database è **`0`**, cioè il **primo** posto. Un modulo che non chiedesse quel numero farebbe scavalcare in silenzio tutti gli altri articoli della sezione, nel pannello e nel menu del cliente, a ogni creazione.* Il numero da proporre si calcola su dati che il pannello ha già in mano.

**3. Il modulo cambia in base alla categoria.** Il selettore dietetico a tre voci **non compare su `drink` e `birre`**, coerentemente con §67 che le tiene fuori dal tracciamento.

⚠️ **Correzione del 06/08/2026 (Andrea), che rovescia la seconda metà di questa decisione: anche gli ALLERGENI sono esentati su `drink` e `birre`, in creazione come in modifica.** *Motivo accertato sul codice: `updateAllergensCore` rifiuta in blocco quelle due categorie. Una bevanda creata **con** allergeni non sarebbe mai più modificabile dal pannello — nascerebbe in uno stato che nessuna schermata sa più raggiungere.* Nasce quindi senza allergeni, come le bevande già a menu. **Prezzo accettato, con nome e data: Andrea, 06/08/2026** — una birra creata dal pannello non porta l'informazione sul glutine. *La formulazione precedente diceva che gli allergeni si dichiarano sempre, lattina compresa: era coerente con §67 sulla carta e incompatibile col codice che §67 stesso descrive.*

*Resta vero il punto generale: scegliere la categoria cambia quali campi il modulo pretende prima di sbloccare il salvataggio — è una conseguenza da conoscere prima di progettare il modulo, non da scoprire a metà.* *Quindi scegliere la categoria cambia quali campi il modulo pretende prima di sbloccare il salvataggio: è una conseguenza da conoscere prima di progettare il modulo, non da scoprire a metà.*

**4. Il selettore dietetico c'è ma non blocca il salvataggio**, e non produce alcun avviso. Si compila dopo, dal modulo allergeni esistente, che è lo stesso blocco. ⚠️ **Conseguenza accettata, con nome e data: Andrea, 06/08/2026 — nulla segnalerà che manca.** *La direzione dell'errore è però quella sicura, ed è la ragione per cui la decisione regge: un flag non compilato non produce il badge sbagliato, non produce **nessun** badge (nota qui sopra). Il costo reale è misurato: Tzatziki e Yogurt sono rimasti senza badge dal 28/07 al 06/08 — nove giorni — e sono stati ritrovati perché scritti in un documento, non perché il pannello lo dicesse. Un articolo creato fra sei mesi non sarà scritto da nessuna parte.* **Alternativa scartata**: un avviso non bloccante nel modulo e nella lista del Menu.

**Riuso, non costruzione.** Il blocco allergeni del pannello contiene **già** le quattordici caselle, la casella "nessuno dei 14" e il selettore dietetico, e li salva in un colpo solo. La Fase 3 lo riusa intero: toglierne il selettore sarebbe lavoro in più, non in meno. ⚠️ *Del precedente di creazione che esiste nel pannello — le chiusure eccezionali di §68 — si riusa la **forma lato server**, non quella a schermo: quella apre una finestra sopra la pagina, mentre la sezione Menu impone il modulo **in linea, sotto la riga** (§63-64, §67, §34-35).*

**La tendina delle categorie parte VUOTA** (decisione del 06/08/2026, scritto il codice). ⚠️ *Motivo: una preselezione su "Roll" renderebbe **naturale** creare un Roll privo di opzioni, che è esattamente ciò che la Fase 3 non sa fare. `roll` e `bowl` restano nell'elenco — toglierli renderebbe la tendina diversa dal menu vero — si toglie solo la preselezione.* **Non basta**: il 06/08 un Roll senza scelte è stato creato lo stesso, provando la Fase 3. La tendina vuota alza il costo dell'errore, non lo impedisce; a impedirlo sarà la Fase 4. ✅ *E dal 12/08 lo impedisce davvero: una Bowl senza accompagnamenti non è più salvabile, e un Roll con proteine le pretende.*

⚠️ **Non esistono articoli in bozza, e non potrebbero esistere.** La decisione del 05/08 li esclude già — l'articolo nasce disponibile — ma va registrato che non sarebbero realizzabili nemmeno volendo: la regola di lettura pubblica su `products` è **senza condizioni** (§66), quindi una bozza sarebbe visibile al sito cliente dall'istante del salvataggio. Non per una svista del sito: perché il database dice di sì a tutto. Renderla possibile significherebbe **cambiare la regola sul database**, non il codice.

### "Togli dal menu" — forma decisa il 06/08/2026 (vincolante)

**Il comando.** Un pulsante **quadrato, con la sola icona**, in **coda** alla riga dell'articolo, dopo Disponibile — gli altri scalano a sinistra. Icona: **occhio barrato, rosso**. Premuto, l'articolo **sparisce dal sito cliente** (non compare spento: proprio assente) e la riga nel pannello resta, **tutta grigia**; l'icona diventa un **occhio aperto verde**, così si capisce che premendo lì l'articolo torna. Ripremuto, torna **disponibile e visibile subito**, senza memoria dello stato precedente.

⚠️ **Il cestino è stato scartato, e il motivo va conservato**: significa "cancella" per chiunque, e questo comando **non cancella**. *Userebbe il simbolo che servirà il giorno che si vorrà cancellare davvero, e chi lo preme potrebbe credere di aver eliminato l'articolo per sempre — agendo su una convinzione falsa. Proposto da Andrea il 06/08, scartato dopo aver discusso il rischio, sostituito con l'occhio barrato.*

⚠️ **Perché quadrato e con la sola icona, e non un quarto pulsante di testo.** Non è gusto: i tre pulsanti attuali sono di solo testo con `whiteSpace: nowrap`, la riga **non ha `flexWrap`** e quindi non va mai a capo, e Andrea ha verificato **dal telefono** che gli articoli ci stanno su una riga ma che per un altro pulsante non c'è posto. Un quadrato occupa circa un terzo di uno di testo. *È la scelta che rende possibile il quarto comando, non un abbellimento.*

**Tutti gli altri pulsanti si spengono** quando l'articolo è fuori menu (Andrea, 06/08/2026): Modifica, Allergeni e Disponibile/Esaurito. *Alternativa scartata: lasciare attivi Modifica e Allergeni per poter sistemare un articolo mentre è nascosto. Andrea ha scelto di spegnere tutto — se l'articolo non è nel menu, l'unica cosa sensata da fargli è rimetterlo.*

⚠️ **LO STATO SPENTO VA COSTRUITO, e sarà il primo del pannello.** Accertato il 06/08/2026: oggi un pulsante disattivato **non si distingue visivamente** da uno attivo — `disabled` è usato in una ventina di punti, ma gli stili cambiano **solo il cursore**, e alcuni tengono perfino `cursor: pointer` fisso. ⚠️ *Sul telefono il cursore non esiste: un pulsante spento sarebbe indistinguibile da uno acceso proprio sul dispositivo dove il pannello si usa di più, e verrebbe premuto aspettandosi un effetto. Va reso **visibile**: grigio, testo scolorito, non premibile. La coppia di colori più vicina già in tavolozza è quella che il toggle usa per "Esaurito".*

⚠️ **Non esiste nessun pulsante con sola icona in tutto il pannello**: l'occhio barrato sarà il primo, e **non c'è una forma da cui copiare**. Va disegnato con l'altezza dei tre esistenti, così la riga resta allineata.

**Il carrello.** Un articolo tolto dal menu che si trovi in un carrello viene rimosso con il motivo **"non è più nel menu"** (Andrea, 06/08/2026) — non "non è più disponibile". *Sono due messaggi che il carrello già distingue, ed è la verità: l'articolo non è esaurito, è stato ritirato. È lo stesso meccanismo usato per la bibita del combo (§23-26), con l'altro motivo.*

**Il database.** Serve una **colonna nuova** — è **`is_in_menu`**, boolean not null default true su `products`, migrazione eseguita da Andrea il 07/08/2026, commit `74a3b6b` — e non si può riusare `is_available`: ⚠️ *il reset notturno rimette **tutti** i prodotti disponibili ogni giorno, quindi un articolo "tolto dal menu" tornerebbe a menu da solo dopo poche ore.* È DDL: migrazione in `sql/`, eseguita da Andrea nel SQL editor (§63-64), non da Code.

⚠️⚠️ **E QUESTA REGOLA È STATA VIOLATA IL 12/08, DA CHI AVEVA QUESTO PARAGRAFO
DAVANTI.** La Fase 4 faceva nascere con `is_available: false` l'articolo le cui
opzioni non erano state scritte tutte: sarebbe **tornato in vendita da solo la
mattina dopo**, incompleto, senza che nessuno avesse fatto niente. *Corretto il
13/08 usando `is_in_menu`. Il difetto è stato trovato **leggendo il cron** per
costruire un'altra cosa, non da una prova: **le prove non fanno passare la
notte**, e nessuna avrebbe potuto vederlo.*

**Dove si applica il nascondere.** Nel browser, nel punto unico che legge il menu del cliente, dove già si nascondono l'upsell delle salse e i Roll non disponibili del combo. ⚠️ **Ma il pagamento va coperto lo stesso**, per la stessa ragione della bibita del combo: il browser è ciò che si vede, il server è ciò che vale.

⚠️ **NESSUNA REGOLA DI SCHERMO ESISTE NEL PROGETTO, e il viewport non è dichiarato** (accertato il 06/08/2026 con controprova: zero `@media` ovunque, un solo file `.css` di 32 righe, nessun `viewport` nel layout). *Senza quella dichiarazione un browser mobile può disegnare la pagina come se lo schermo fosse largo quasi mille punti e poi rimpicciolire tutto. Il **pannello** si legge lo stesso — Andrea l'ha verificato dal telefono — ma il **sito del cliente** non è mai stato guardato con questa lente. Da valutare prima dell'apertura, come lavoro a sé: non fa parte di "togli dal menu" e non è condizione di apertura.*

✅ **La riga dell'articolo è una sola**, usata per tutte le categorie, salse comprese: il lavoro si fa in un punto solo del pannello.

### "Togli dal menu" — esito della costruzione e delle prove dal vivo (07/08/2026)

✅ **COMPLETO in sei pezzi, tutti provati dal vivo da Andrea.** Il cuore è
`lib/menu-visibility.js` con la rotta sottile
`app/api/staff/menu/visibility/route.js`, nella forma provabile che la Fase 3
aveva inaugurato: **il client del database si passa come parametro, non si
importa**. Il pulsante e lo stato spento vivono in `app/staff/page.js`, il sito
cliente in `app/page.js`, il pagamento in `lib/checkout-resolve.js`, il carrello
in `lib/cart-persistence.js`.

**Il rientro rimette anche la disponibilità (Andrea, 07/08/2026, vincolante).**
`setInMenuCore` con `isInMenu` vero scrive `is_in_menu` **e** `is_available` a
`true` in **una sola scrittura**; con `isInMenu` falso scrive solo
`is_in_menu` e non tocca la disponibilità. ⚠️ *Motivo: mentre l'articolo è
fuori menu il pulsante Disponibile è spento, quindi un articolo tolto **mentre
era esaurito** rientrerebbe esaurito e nessuna schermata potrebbe più
cambiarlo. Una sola scrittura e non due, perché un guasto in mezzo lascerebbe
l'articolo visibile ma esaurito: esattamente il vicolo cieco che la regola
esiste per evitare.* Il registro scrive **una voce per colonna cambiata**, col
valore precedente letto prima della scrittura, e **nessuna riga** se non cambia
niente. *Il reset notturno non interferisce e va nella stessa direzione:
rimette a `true` ciò che è esaurito e nomina una sola colonna, quindi un
articolo fuori menu resta fuori.*

⚠️ **LE DUE LISTE DEL SITO CLIENTE — MAI UNA FILTRATA (Andrea, 07/08/2026,
vincolante).** Accanto all'elenco pieno dei prodotti per categoria ne esiste
uno **filtrato** su `is_in_menu`. La **filtrata** alimenta ciò che si vede:
griglia delle card, upsell che **propone**, Roll del combo. La **piena**
alimenta chi deve **vedere** l'articolo per nominarlo o classificarlo: la
ricostruzione del carrello e la funzione che risale la categoria di una riga
già nel carrello. *Filtrare nel punto unico avrebbe coperto quattro consumatori
in un colpo solo e ne avrebbe rotti due **in silenzio**: il carrello avrebbe
detto "Un articolo: non è più nel menu" senza il nome, e una riga già nel
carrello sarebbe sparita dai gruppi dell'upsell. È lo stesso difetto che §23-26
vieta per le bibite, riaperto su un altro ramo il giorno dopo averlo chiuso.*
✅ **Nel codice c'è il commento che lo spiega, e la prova `t5` di
`tests/cart-persistence.test.mjs` cade se qualcuno unifica le due liste**: è
una sentinella del sito cliente piazzata dentro le prove del carrello, e cade
senza che nulla si rompa a schermo.

⚠️ **LE BIRRE RICEVONO LA LISTA PIENA, ed è una regola di sicurezza.** La lista
delle birre non disegna nulla: serve solo a riconoscere se nel carrello c'è una
birra, e quel riconoscimento è **ricalcolato a ogni disegno**, mai conservato.
Da esso dipendono la casella **«sono maggiorenne»**, lo sblocco del pagamento e
il dato mandato al server. *Con la lista filtrata, una birra tolta dal menu
mentre è già in un carrello smetterebbe di essere riconosciuta al primo
ridisegno: la casella sparirebbe e la condizione "non c'è birra, oppure l'età è
confermata" diventerebbe vera da sé. Le birre che si **vedono** nel menu sono
già filtrate dalla griglia, come tutte le altre categorie.* ✅ *Verificato lo
stesso giorno che i tre consensi — privacy, marketing e **conferma dell'età** —
restano fuori dal salvataggio, e due volte: non stanno nella lista chiusa delle
chiavi che il modulo copia, e non sono nemmeno raggiungibili dal punto in cui
il salvataggio avviene. La prova è stata **eseguita**, non descritta: passando
al modulo uno stato che li conteneva, in uscita non compaiono.*

**Il messaggio del combo nomina la bibita (Andrea, 07/08/2026, vincolante).**
Quando la bibita di un combo non è ordinabile, l'avviso del carrello dice che
è **la bibita**, con il motivo "non è più disponibile", **sia** che sia
esaurita **sia** che sia fuori menu. ⚠️ *Questo cambia anche il comportamento
deciso il 06/08 per la bibita esaurita: è allargamento di perimetro voluto.
Prima i tre casi del combo — Roll esaurito, prezzo combo spento, bibita
esaurita — producevano a schermo la **stessa identica frase**, che nominava il
Roll: il cliente non poteva sapere che gli bastava cambiare bibita e credeva
fosse saltato il combo intero. **Motivo per cui non si usa "non è più nel
menu"**: la frase nomina il combo, e il combo nel menu c'è ancora — sarebbe
l'unica delle quattro frasi a essere falsa.* Una prova esistente si opponeva al
comportamento nuovo ed è stata **riscritta e dichiarata**, non aggirata.

**Un quinto caso, deciso scrivendo il codice**: un articolo tolto dal menu
**mentre era esaurito** — vere entrambe le cose insieme — legge **"non è più
nel menu"**, perché il controllo del ritiro sta prima di quello della
disponibilità. *È il più vero dei due: spiega anche perché non tornerà domani
col reset notturno.*

**Il pagamento.** Le **tre** letture su `products` in `lib/checkout-resolve.js`
— prodotto singolo, Roll del combo, bibita del combo — hanno il filtro su
`is_in_menu` **accanto** a quello sulla disponibilità, non al suo posto: i due
si sommano. *Il commit che le ha aggiunte è **+17 −0**, e lo zero è la prova
contabile che nessun filtro è stato sostituito.* ⚠️ **Nessuna delle tre è
coperta da prove automatiche**, come le altre letture di quel modulo: leggono
dal database e simularle proverebbe la simulazione. La loro rete dichiarata è
la fotografia della rotta, che richiede server e dati veri.

✅ **Prove dal vivo di Andrea, 07/08/2026.** Sul pannello, sette: la riga sta su
una riga sola; occhio barrato e occhio aperto distinguibili; l'articolo diventa
grigio con la scritta *· fuori menu*; i tre pulsanti non rispondono; si vede a
occhio che sono spenti, **telefono compreso**; il rientro funziona; e un
articolo segnato **esaurito**, tolto dal menu e rimesso, **torna disponibile**.
Sul sito cliente, cinque, fatte **dopo aver tolto due articoli dal menu** —
⚠️ *con 62 articoli dentro e zero fuori le due liste sono identiche e la prova
non può fallire: guardare il sito prima di togliere qualcosa non è una prova
blanda, non è una prova.* Sul carrello e sul pagamento, tre, con un giro
completo fino a Stripe e ritorno, che è l'unico modo per far comparire
l'avviso.

⚠️ **Un fatto sul metodo, dalla stessa giornata: chiudere la shell non spegne
il server.** I processi sopravvivono riattaccandosi a `init`, la porta resta
occupata, **e il sistema segnala il comando come "fallito" mentre il server è
vivo**. Lo stesso segnale è comparso anche a spegnimento riuscito: non misura
nulla. Lo spegnimento si dichiara con tre riscontri indipendenti — nessun
processo, nessun ascolto sulla porta, e una chiamata alla porta che **prima
rispondeva** e ora no.

### Il percorso di lettura del menu cliente (ricognizione del 06/08/2026)

✅ **Il menu del cliente si legge da UN SOLO punto**, una funzione nella pagina cliente che legge nove tabelle in parallelo. Tutti gli altri percorsi che leggono `products` servono il pannello staff, il pagamento o il reset notturno, **non** la pagina del cliente.

⚠️ **Nessuna query filtra `products.is_available` sul server, per il menu**: arriva tutto al browser, e ciò che si vede è disegno — la card resta, il pulsante si spegne. L'unico filtro server sulla disponibilità dei prodotti è **al pagamento**. *Fatto che serve a "togli dal menu": far sparire un articolo si fa nel browser, dove già si nascondono l'upsell delle salse e i Roll non disponibili del combo, senza toccare il server.* ⚠️ **Ma il pagamento va comunque coperto**, con la stessa logica per cui la bibita del combo lo è: il browser è ciò che si vede, il server è ciò che vale.

⚠️ **La rotta della disponibilità è l'unica delle quattro rotte del menu senza cuore sotto `lib/`**: la logica sta tutta nella rotta, e non è quindi verificabile da una prova automatica. Fase 1, 2A e 3 hanno il modulo separato. *Chi costruirà "togli dal menu" copi la forma lato server da lì, ma la **provabilità** dalla Fase 3.*

### Fase 3 — esito della costruzione e della prova dal vivo (06/08/2026)

✅ **COMPLETA.** Il cuore è `lib/menu-create.js` con la rotta sottile
`app/api/staff/menu/create/route.js` e il modulo in linea nella sezione Menu del
pannello, nella forma che §63-64 già imponeva. La generazione dello slug vive in
`lib/menu-slug.js`, l'elenco delle categorie e la tabella dietetica in
`lib/menu-categories.js` e `lib/menu-dietary.js`.

✅ **Verificata dal vivo da Andrea**, sette prove a schermo: modulo vuoto col
pulsante spento; comparsa del blocco allergeni e del selettore dietetico
scegliendo una categoria di cibo; loro **sparizione** scegliendo una bevanda, con
la riga che ne spiega il motivo; **collisione dello slug rifiutata senza lasciare
traccia**; creazione di una bevanda vera, ritrovata **in fondo** alla sua
categoria; creazione di un articolo di cibo con allergeni, ritrovato sul sito
cliente; riapertura dal modulo allergeni con le caselle come lasciate. Gli
articoli di prova sono stati poi cancellati (§69).

⚠️ **Il debito che questa fase ha reso visibile: il client del database si passa
come parametro, non si importa.** È ciò che rende `lib/menu-create.js`
verificabile da una prova automatica. **Fase 1 e Fase 2A non hanno prove proprio
perché importano `supabase-admin.js`**, che crea il client al caricamento del
modulo. *Sistemarlo non è un abbellimento: sbloccherebbe le prove di due fasi già
in produzione.*

## 65. Analytics dal giorno 1

Tracciare almeno: visita, indirizzo inserito, servibile/non servibile,
prodotto aggiunto, soglia 15€ raggiunta, soglia 25€ raggiunta, GIVEMEFIVE
applicato, checkout iniziato, pagamento completato, ordine annullato +
motivo, tempi tra le fasi dell'ordine.

✅ **Pagina "Carrelli abbandonati" — ESISTE, FUNZIONA, E NON VA COSTRUITA** (accertato sul codice il 05/08/2026). `app/staff/abbandonati/page.js` e la sua rotta `app/api/staff/abandoned-carts/route.js` sono nate insieme il **19/07/2026** e non sono mai più state toccate. ⚠️ **Fino alla v56 questo documento la dava da costruire**, e su quella premessa era stata stimata una parte importante del lavoro di §65: la stima era gonfia perché il lavoro era già in casa.

Cosa fa, letto dal codice: collegamento discreto in fondo al pannello, presente in tutte le sezioni; tre filtri — oggi, 7 giorni, 30 giorni; aggregati calcolati lato server (quanti, valore totale, valore medio); contenuto di ogni carrello riga per riga. Prende i soli `payment_status = "pending"` — **non** i `failed` — ed esclude i carrelli più giovani di **30 minuti**, che sono probabilmente checkout ancora in corso.

✅ **Rispetta §69 alla radice, non a schermo**: la sua query **non chiede** `customers` né alcun dato personale — non nome, non telefono, non e-mail, e nemmeno il codice ordine. Non è che non li mostri: non li ha. *È la forma giusta di quella promessa, ed è il modello per qualunque vista statistica futura.*

⚠️ **Da conoscere, non da sanare**: nessun test automatico la nomina, e nessuno ha mai verificato che si disegni senza errori. Due colonne vengono chieste al database e mai usate.

**Il resto delle statistiche si legge con un referto mensile, non con schermate nuove** (decisione di Andrea, 05/08/2026). Un file di sola lettura sul modello di `sql/conteggi_dati_sola_lettura.sql`, lanciato nell'editor SQL insieme alla procedura di §69. *Motivo: con i volumi di un locale singolo una schermata dedicata costa molto e si guarda una volta al mese. Se un giorno il volume la giustificasse, si costruirà **sopra dati già raccolti** — ed è questa la ragione per cui la raccolta non si rimanda: la lettura si aggiunge quando serve, i fatti non passati dal quaderno non si recuperano.*

⚠️ **Il referto è cieco sui dati personali come lo è la pagina**: niente nome, cognome, telefono, e-mail. Il vincolo di §69 era scritto pensando a una schermata e vale identico per un file che resta nel deposito.

Per storico, la specifica originale della pagina — oggi soddisfatta da ciò che esiste: pagina dedicata volutamente **meno in evidenza** delle sezioni operative (Nuovi/Attivi/Storico/Menu) per non generare confusione con gli ordini reali da lavorare, che mostra gli ordini rimasti `payment_status='pending'` con:
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

### Vincoli dall'informativa privacy (v53)

Le statistiche sono ora **dichiarate nell'informativa** (punto 3.4, legittimo interesse). Da questo discendono tre vincoli che il codice dovrà rispettare, e che sono ora impegni verso il cliente e non solo scelte di progetto:

1. l'analisi avviene **solo dentro i sistemi del progetto**: nessuna piattaforma di analisi o pubblicità di terze parti;
2. la pagina dei carrelli abbandonati e ogni vista statistica sono **prive di nome, cognome, telefono ed e-mail**;
3. nessun uso per ricontattare i clienti, in nessuna forma.

**Vincolo di durata**, conseguenza di §11.2 dell'informativa: le statistiche sugli ordini non completati possono guardare **al massimo 30 giorni**, perché oltre quel termine i dati non esistono più.

**Se le statistiche non arrivassero prima dell'apertura**, il punto 3.4 dell'informativa va tolto e il punto 11.2 perde uno dei motivi di conservazione: i due si muovono insieme.

### Vincoli dalla struttura del database (v54, verificati il 04/08/2026)

Tre fatti letti dal database, non dedotti, che vincolano il lavoro **prima** che cominci:

1. ⚠️ **Gli eventi non possono essere scritti dal browser.** La tabella `analytics_events` ha la protezione RLS attiva e **nessuna regola di scrittura**, come tutte le tabelle che non sono menu (§66). La chiave pubblica non può inserirvi nulla. Gli eventi dovranno quindi passare da una rotta sul server, che è anche la forma coerente con §66 — nessuna scrittura dal client — ma va saputo prima di progettare, non a metà del lavoro.
2. ✅ **Il tipo di evento è un elenco chiuso nel database, ed è stato letto il 04/08/2026: coincide con §65, uno a uno.** Gli undici valori ammessi sono `visita`, `indirizzo_inserito`, `servibile`, `non_servibile`, `prodotto_aggiunto`, `soglia_15_raggiunta`, `soglia_25_raggiunta`, `givemefive_applicato`, `checkout_iniziato`, `pagamento_completato`, `ordine_annullato`. Chi ha creato la tabella ha seguito la spec alla lettera: **non c'è alcuna divergenza da arbitrare**, e la decisione temuta in v54 non serve.

   ⚠️ **Due cose che l'elenco non copre. Entrambe erano decisioni aperte fino alla v55: ora sono chiuse (v56).**

   ✅ **I tempi fra le fasi dell'ordine non sono un tipo di evento e non devono diventarlo**: si ricavano da `order_status_history`, che registra ogni cambio di stato con l'ora nella colonna **`changed_at`** — nome letto dal database vivo il 05/08/2026. Chi cercasse un evento dedicato cercherebbe una cosa che non deve esistere. *Fino alla v55 la frase "registra già ogni cambio di stato con l'ora" era una convinzione mai controllata, ed era la fondazione di tutto il calcolo dei tempi: ora è un fatto con una fonte e una data.*

   ✅ **Il motivo dell'annullamento NON va nel `payload`.** `ordine_annullato` dice che è successo, e basta: il motivo esiste già in due posti permanenti — `orders.cancellation_reason` e il registro azioni staff — e la statistica sui motivi **si legge da `staff_action_log`, filtrando `action = "annulla_ordine"`**, che non viene mai cancellato (§69). ⚠️ **Decade quindi l'istruzione della v54** — *"come si chiama quella voce va deciso prima di scrivere il primo evento"* — perché poggiava sull'affermazione falsa di §62b, corretta in v56: il motivo non è mai stato in `order_status_history`, e non c'è alcuna voce da nominare. *Copiarlo nel `payload` significherebbe avere la stessa frase in tre posti, ed è precisamente ciò che questo documento vieta altrove: due copie divergono.*

   ⚠️ **Conseguenza della decisione di Andrea del 05/08/2026** (§62b): poiché nessuna vista del pannello mostra il motivo, la voce *"ordine annullato + motivo"* di questa sezione **si intende soddisfatta dalla conservazione, non da una schermata**. Non va costruita alcuna pagina che li elenchi.
3. **La tabella porta anche `session_id` obbligatorio e un `payload` libero.** Non è un foglio bianco: una forma esiste già e va letta prima di inventarne un'altra.

**Rapporto con la pulizia (§69):** gli eventi puntano agli ordini **senza cancellazione a catena**, quindi un evento collegato impedirebbe di rimuovere il suo ordine. La decisione presa il 04/08/2026 è che nella pulizia mensile l'evento **resti perdendo il riferimento**: il dato statistico non ha bisogno di sapere quale ordine, ha bisogno di esistere. *Oggi la tabella è vuota, quindi il problema è futuro — ma nasce il giorno stesso in cui le statistiche entrano in funzione, e la prima pulizia mensile successiva si bloccherebbe senza questa regola.*

---

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

### Rilievi dell'audit del 02-03/08/2026, non ancora sanati (v53)

* **Tre `console.error` in `app/api/checkout/route.js`** (righe 308, 364, 372) stampano oggetti errore Supabase interi su un percorso che tratta telefono ed e-mail. Poiché `customers.phone` è `unique`, il campo `details` di un errore di vincolo può contenere il numero. Da ridurre ai soli campi necessari, come già fatto per l'errore Stripe (401-405). *Rischio dedotto, non osservato.*
* **`km_direct_checkout`** (`sessionStorage`) contiene nome, cognome, telefono, e-mail, indirizzo, coordinate e note, e **non viene mai cancellato dal codice**, nemmeno a ordine concluso. La pagina di conferma cancella il carrello: va cancellato anche questo, accanto.
* **Google Maps + Places è caricato in `app/layout.js` con `beforeInteractive`**, quindi su ogni pagina e prima di ogni interazione — `/privacy`, `/conferma` e pannello staff compresi. Verificato dal vivo che **non installa cookie né identificatori**: non serve un banner cookie. Spostarlo al momento in cui il cliente tocca il campo indirizzo resta buona pratica; comporta la v1.3 dell'informativa.
* **Nessuna `Referrer-Policy`** configurata (`next.config.mjs` vuoto) su un sito che mette il token dell'ordine in query string. Rischio basso — i browser moderni non inviano l'URL completo a terze parti — ma è una garanzia del browser, non del sito.
* **Nessun rate limiting** sulla rotta pubblica del token. Rischio basso: 128 bit di entropia.

---

### Infrastruttura — decisioni del 03/08/2026 (v53)

**Piano Supabase Pro — ✅ ATTIVATO il 04/08/2026 (aggiornamento v54).** Fino a quel giorno il progetto era su piano Free, che **non include alcun backup**: l'informativa al punto 11.7 dichiarava copie giornaliere conservate 7 giorni, e la frase era **falsa**. Con il piano Pro è vera, senza toccare il documento.

Verificato dalla dashboard, non dedotto: organizzazione **Kebab Mediterraneo** in piano Pro, progetto **KM Delivery**, **Spend Cap acceso**. Nella pagina dei backup risultano **copie ripristinabili dal 28/07 al 04/08/2026**, quindi la protezione copre già una settimana all'indietro — le copie venivano prese anche prima, ma senza il piano non erano né visibili né ripristinabili.

⚠️ **Due limiti dichiarati, non aggirati:**
* nell'elenco **mancano il 1° e il 2 agosto**. Il motivo non è accertabile da qui. La promessa dell'informativa parla di copie **giornaliere**: se i buchi si ripetessero, quella frase andrebbe ammorbidita alla versione successiva del documento. **Da riguardare dopo una settimana di esercizio;**
* **i file caricati tramite lo Storage non sono compresi nel backup.** Oggi non costa nulla — `image_url` è vuoto su tutti i 62 articoli e non esiste modo di caricare foto — ma il giorno in cui la gestione delle immagini esisterà (§63-64, lavoro post-go-live), quelle foto **non saranno protette**. Va ripreso in quel lavoro, non ricordato a memoria.

**Un backup giornaliero non è un annulla: è lo stato di ieri.** Una cancellazione sbagliata si recupera perdendo la giornata. È il motivo per cui gli script di §69 restano obbligati ai pre-check e post-check in transazione: la rete serve a non perdere tutto, non a permettersi di sbagliare.

**Taglia di calcolo — Micro dal 04/08/2026.** L'aggiornamento a Pro non cambia da solo la taglia: il progetto era rimasto su Nano ed è stato portato a Micro, coperto dal credito incluso nel piano. ⚠️ **Il ridimensionamento comporta un riavvio del database**, cioè un intervallo in cui il sito non risponde. Il 04/08 non è costato nulla perché non c'erano clienti; **dopo l'apertura va fatto fuori dall'orario di servizio**, come le modifiche agli allergeni (§67).

⚠️ **La percentuale di memoria non è un riscontro del cambio di taglia.** Passando da Nano a Micro è scesa dal 53% al 48%, non alla metà: Postgres dimensiona le proprie aree di lavoro in proporzione alla memoria disponibile, quindi la percentuale resta simile. Il riscontro valido è la **taglia dichiarata** nel riquadro del database.

**Regione del database: Irlanda, `eu-west-1` — verificata il 04/08/2026.** I punti 9 e 12 dell'informativa la dichiarano, e dicono il vero. *Va registrato che fino a quel giorno **nessuno l'aveva controllata**: la parola "regione" non compariva né in spec né nell'handoff, e l'affermazione era finita in un documento pubblicato senza fonte. È la lezione `ay` applicata a un caso nuovo — là era la spec che descriveva il codice, qui è l'informativa che descrive l'infrastruttura, e vale la stessa regola: una descrizione ha una fonte esterna e va confrontata con quella prima di essere pubblicata.*

⚠️ **Regola che ne discende, vincolante:** ogni affermazione dell'informativa che descrive **come è fatto il sistema** — regione, hosting, backup, cookie, strumenti di analisi — va verificata alla fonte e la verifica va **datata in questo documento**. Le restanti affermazioni di quel tipo non sono ancora state passate in rassegna una per una.

**Account staff unico e condiviso.** Non esistono account nominali e non è previsto introdurli: il locale è piccolo. Conseguenze registrate:
* `staff_action_log` identifica l'**account**, non la persona: resta utile per sapere cosa è successo e quando, non chi;
* cade la necessità di un'informativa separata per i dipendenti e la questione dell'art. 4 dello Statuto dei Lavoratori;
* una credenziale condivisa non si revoca per singola persona: quando qualcuno lascia il locale, **si cambia la password a tutti**, quel giorno.

**Chiave API di Google da restringere al dominio** nella console Google Cloud, contestualmente all'attivazione del dominio vero. Oggi è una variabile `NEXT_PUBLIC_` visibile nel sorgente e senza restrizioni: chiunque la copi consuma il credito.

---

### Il referto di audit sul database — 04/08/2026 (v54)

Eseguito da Andrea nell'editor SQL della dashboard con query di sola lettura sul catalogo di Postgres, perché **le RLS non sono verificabili né dal repository né dalle API**: PostgREST espone il solo schema `public`. Chiude la voce "stato delle RLS ignoto" e sblocca §69.

**Protezione RLS: attiva su tutte e 23 le tabelle.** Nessuna eccezione. Il conteggio conferma anche, da fonte indipendente, che le tabelle sono esattamente le 23 dello schema autorevole.

* **Dieci in lettura pubblica**, con una regola `SELECT` per `anon` e `authenticated` senza condizioni: `products`, `allergens`, `product_allergens`, `product_addons`, `product_removals`, `product_accompaniments`, `product_choice_options`, `combo_pricing`, `combo_drink_options`, `combo_side_options`. Sono tutte e sole le tabelle del **menu**, cioè ciò che il sito mostra a chiunque.
* **Tredici senza alcuna regola**, quindi **chiuse**: `customers`, `orders`, `order_items`, `order_status_history`, `promo_redemptions`, `staff_action_log`, `staff_settings`, `analytics_events`, `coupons`, `stores`, `store_geofences`, `store_order_windows`, `store_schedule_exceptions`. Tutti i dati personali stanno qui.
* **Nessuna regola di scrittura esiste, da nessuna parte.** Tutte e dieci sono di sola lettura: la chiave pubblica non può scrivere niente.

✅ **Confermato per `products` da fonte indipendente il 06/08/2026**, con una query di sola lettura sui cataloghi eseguita da Andrea a due giorni di distanza: protezione **attiva**, non forzata al proprietario, e **una sola** regola — `Public read access`, permissiva, comando `SELECT`, ruoli `anon` e `authenticated`, senza condizioni. Nessuna regola per inserimento, modifica o cancellazione. *Due letture indipendenti dello stesso fatto, a due giorni di distanza: è il confronto che vale come verifica (lezione `bl`).*

⚠️ **La regola di `products` non esiste in nessun file del repository**, accertato il 06/08/2026: l'unico file SQL versionato che crea protezioni è `sql/20260727_allergens_public_read.sql`, che copre `allergens`, `product_allergens` e `sauce_allergens`. La protezione del menu è stata **applicata a mano sul database** e **non è ricostruibile da git**: un database rifatto dai soli file versionati ripartirebbe senza quella regola. *Registrato, non sanato: sanarlo significa una migrazione che la dichiari, ed è lavoro fuori dal perimetro pre-go-live.*

⚠️ **`km_direct_schema.sql` è muto sulle protezioni, e lo è per tutte e 23 le tabelle.** Non è incompleto su una: **non le contiene mai**. Cercare lì lo stato delle RLS non può funzionare nemmeno in linea di principio, e l'assenza della parola in quel file non dice nulla. *Il 05/08/2026 quella deduzione è stata fatta e presentata come fatto — "su `products` non c'è protezione" — su una tabella che invece è protetta. Lo schema autorevole è autorevole su tabelle e colonne, non su chi può leggerle: la fonte sono le query sul catalogo, sempre.*

✅ **La condizione da cui dipende tutto è verificata (04/08/2026, v55).** La chiave `service_role` **scavalca interamente le RLS**: tutta la protezione descritta qui regge sul fatto che non finisca mai nel browser. **Non ci finisce**, accertato per quattro vie: la variabile che la contiene si chiama `SUPABASE_SECRET_KEY` e non porta il prefisso `NEXT_PUBLIC_` (che in Next.js significa "spediscila al client"); nessuno dei ventitré file che la usano dichiara `"use client"`; la chiusura transitiva dai sei componenti che girano nel browser raggiunge diciannove file e `lib/supabase-admin.js` **non è fra questi**; e la ricerca del **valore vero** della chiave dentro una build di produzione — sia nei file statici sia nell'HTML servito — la trova in zero file, mentre nello stesso giro trova la chiave pubblica, che è ciò che rende quello zero una risposta e non un'assenza di risposta.

⚠️ **Vale per il codice di oggi, non per sempre.** I due modi in cui si romperebbe sono entrambi falsificabili in un comando: la chiusura transitiva dai componenti client, e la ricerca del valore nella build più l'HTML servito. **La verifica va rifatta quando si riapre `app/api/checkout/route.js` e quando si costruisce la Fase 3**: sono i due momenti in cui qualcuno tocca il confine fra server e browser.

**Collegamenti fra tabelle e cancellazioni a catena** (fonte di §69):

* **seguono l'ordine e spariscono con lui**: `order_items` e `order_status_history`;
* **bloccano la cancellazione dell'ordine**: `analytics_events`, `promo_redemptions`, `staff_action_log`. È il comportamento voluto — un collegamento non previsto deve fare rumore (metodo `p`) — ma va saputo scrivendo gli script;
* **la riga cliente è protetta dal database**: `orders` punta a `customers` senza cancellazione a catena, quindi finché esiste un ordine quel cliente non si può cancellare. La prima regola di §69 è imposta dalla struttura, non dalla disciplina;
* ⚠️ **`stores` è la riga più pericolosa del database**: quasi tutto vi punta **con** cancellazione a catena. Cancellarla porterebbe via menu, perimetro, orari e impostazioni in un colpo solo.

**Trigger: sei, tutti dello stesso tipo**, che aggiornano `updated_at` su `customers`, `orders`, `products`, `store_geofences`, `store_schedule_exceptions`, `stores`. ⚠️ **Nessun trigger impedisce di modificare un ordine già scritto**: l'immutabilità dello storico dichiarata da §66 è garantita dal **codice**, non dal database.

**Fatti verificati che confermano affermazioni finora non controllate:**

* `orders.order_token` ha come valore predefinito `encode(gen_random_bytes(16), 'hex')`: i 16 byte casuali generati dal database sono **verificati**, non più solo dichiarati;
* `orders.privacy_accepted_at` è **obbligatoria e senza valore predefinito**: nessun ordine può essere scritto senza il consenso privacy, e lo impone il database. *Sulla tabella `customers` la stessa colonna è invece facoltativa: asimmetria mai decisa apertamente, registrata e non sanata;*
* lo stato `failed` **esiste fra i valori ammessi ma non è mai stato usato**: conferma alla lettera la frase di §69 sul fatto che un pagamento fallito non produce alcun evento;
* **nessuna riga di `staff_action_log` punta a un ordine.** Il conflitto temuto fra l'eccezione di §66 e la pulizia del go-live **non esiste**: le azioni conservate sono tutte sul menu.

**Conteggi al 05/08/2026**, letti eseguendo il referto di sola lettura di §69: `orders` **31** (26 mai pagati, **5** pagati o rimborsati), `customers` **41**, `promo_redemptions` **2**, `analytics_events` **0**, `staff_action_log` **70** di cui **43** di prova su quattro identificatori di fantasia e **27** sull'identificatore reale. *Il conteggio aggiornato vive nell'`HANDOFF.md`, non qui: questi numeri invecchiano a ogni verifica dal vivo e prima del go-live vanno riletti dal database, mai ricopiati (lezioni `s` e `z`).*

⚠️ **Un ordine di prova completo del 04/08/2026 non era stato annotato da nessuno.** Fino alla v55 questo blocco dichiarava 30 ordini "identici a quelli del 30/07", e l'handoff dava per più recente `KM-0030` del 01/08. La rilettura del 05/08 mostra un ordine creato il **04/08 alle 13:07:01.471525+00** con carrello, riga cliente, codice promo applicato e pagamento riuscito, più cinque righe di storico di stato: un giro completo del percorso, dal sito fino alla lavorazione dal pannello. **Confermato da Andrea come proprio.** *Nessun danno — sono dati di prova che spariranno al go-live — ma il fatto istruttivo è un altro: la giornata del 04/08 è stata dichiarata "senza una riga di codice applicativo" e i conteggi sono stati riscritti come invariati, mentre nello stesso documento la prova del freno citava un `max(created_at)` che li smentiva. **Due affermazioni incompatibili scritte lo stesso giorno**, e nessuna delle due rileggeva l'altra. È la lezione `az` nella sua forma più semplice: un conteggio che finisce in un documento si esegue, e si riesegue quando un altro numero dello stesso documento lo contraddice.*

**Due residui minori registrati e non sanati:** `orders.idempotency_key` esiste ma non è descritta in alcun documento e non si sa se il codice la usi; il vincolo di `product_choice_options` porta ancora il nome della tabella precedente (`product_protein_options_…`), senza alcun effetto.

### Regola generale sui dati fino all'apertura (decisione di Andrea, 04/08/2026)

**Fino al go-live dichiarato da Andrea, ogni ordine presente nel database è una prova.** Non esiste alcun ordine reale e non ne esisterà finché lui non lo dichiara. È la premessa che rende sicuro lo script di azzeramento di §69, che infatti cancella senza distinguere. ⚠️ **Smette di valere nell'istante esatto dell'apertura**, e da quel momento la stessa operazione diventa distruttiva.

### La sequenza di apertura (v55) — l'ordine ha una ragione

1. **dominio**, e con esso la restrizione della chiave API di Google;
2. **Stripe in modalità reale**, con il webhook puntato al dominio **definitivo**. ⚠️ Non è un interruttore: sandbox e reale sono due ambienti separati con chiavi e webhook diversi, e ci sono cose che in sandbox non esistono e quindi non si possono provare — che il conto incassi davvero, che l'antifrode non blocchi i primi pagamenti, e soprattutto che l'avviso di pagamento arrivi al sito. Se quel pezzo non funziona **i clienti pagano e in cucina non arriva niente**;
3. **un ordine vero fatto da Andrea**, pagato con carta propria, che percorra tutta la catena fino alla comparsa in cucina, e poi rimborsato dalla dashboard. Costa le commissioni di un caffè ed è l'unica prova che vale;
4. **pulizia dei dati** — dopo l'ordine vero, non prima, altrimenti resterebbe dentro un ordine pagato con denaro reale;
5. **cancellazione dello script del go-live** dal deposito (§69);
6. **apertura**.

*Il dominio va per primo perché l'indirizzo del webhook deve puntare al sito definitivo: attivandolo su quello provvisorio andrebbe rifatto.*

⚠️ **Da verificare prima del passo 2, e non ancora verificato:** come il codice sceglie le chiavi di Stripe. Se sono lette da variabili d'ambiente il passaggio è cambiare quei valori; se da qualche parte è scritto "sandbox" è un lavoro diverso.

⚠️ **Limite dello strumento, da ricordare:** l'editor SQL della dashboard restituisce **al massimo 500 righe** (misurato il 06/08/2026; fino alla v58 questo documento diceva 100, ed era il limite di allora). Un referto che finisce sul numero tondo non va mai considerato completo — il primo giro sulle colonne si era interrotto così, e sembrava una risposta. *Il numero cambia con lo strumento senza avvisare: è la diffidenza verso il numero tondo che va conservata, non la cifra.*

---

### Accertato dall'audit e chiuso — non riaprire (v53)

* **La pagina di stato non espone dati personali.** La rotta `app/api/orders/[token]/route.js` seleziona in query quattro sole colonne (`pickup_code, payment_status, status, fulfillment`): la protezione è nella query, non nella resa grafica. Il token è generato dal database con 16 byte casuali, non è derivabile dall'id dell'ordine, non scade, è di sola lettura. Chi riceve il link inoltrato vede uno stato, non un ordine.
* **Nessun cookie sulle pagine cliente**, né del progetto né di terze parti. Verificato dal vivo in finestra pulita.
* **Nessuno strumento di analytics, error tracking o session recording** nel progetto.
* **Glovo non invia alcun collegamento di tracking al cliente.** I riferimenti in spec sono desideri di fase futura: non vanno mai nell'informativa finché non esistono.

### Ciò che governa il progetto e non sta in nessun file (v63, 07/08/2026)

⚠️ **Quattro cose decidono come il progetto si comporta e non sono leggibili
dal repository.** Registrate qui perché il silenzio dei file non le rendeva
false, solo invisibili — ed è la stessa forma del limite dichiarato in testa a
questo documento.

* **Le regole di lettura e scrittura del database** vivono su Supabase. La più
  citata è quella di lettura pubblica su `products`, **senza condizioni**, che
  è il motivo per cui gli articoli in bozza non sarebbero realizzabili.
* ⚠️ **Il ruolo pubblico `anon` ha il permesso `TRUNCATE` su `products`.**
  Trovato per caso da Andrea, **preesistente a tutto il lavoro di agosto**, e
  fino alla v63 non scritto da nessuna parte. **Da accertare se sia davvero
  raggiungibile da fuori**: il permesso concesso e il permesso esercitabile
  attraverso l'API pubblica non sono la stessa cosa, e la differenza va
  stabilita, non supposta.
* ⚠️ **L'integrazione Git di Vercel: ogni push su `main` pubblica il sito**,
  **compresi i commit di soli documenti**. Verificato da Andrea il 07/08
  guardando le distribuzioni: tutte marcate come produzione, `spec:` e
  `handoff:` incluse. *Nessun file del repository lo dichiara — `vercel.json`
  contiene solo la pianificazione del reset notturno — ed è un'impostazione del
  pannello Vercel. Oggi è innocuo perché il sito non è raggiungibile; dal
  giorno dell'apertura ogni push diventa una pubblicazione.*
* ⚠️ **Il piano di hosting è Hobby.** Da verificare sulle condizioni di Vercel
  se sia adatto a un sito che incassa ordini per una società: **non è stato
  accertato**, è un dubbio sollevato il 07/08 e va chiuso leggendo le loro
  condizioni, non fidandosi di questa riga. Potenziale condizione di apertura.

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
- **Nessuna preselezione del flag dietetico quando il dato manca**: su un
  articolo food con flag ancora NULL il selettore a tre voci si presenta
  **senza nulla di selezionato** e obbliga a una scelta esplicita prima di
  salvare. Preselezionare "Nessuno dei due" produrrebbe una dichiarazione che
  nessuno ha fatto.
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

✅ *Le 2 salse che restavano — Tzatziki e Yogurt — sono state dichiarate
vegetariane da Andrea il 06/08/2026, verificato a schermo.*

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

✅ **CHIUSO il 06/08/2026: Tzatziki e Yogurt sono dichiarati.** *Il gesto che
questi documenti descrivevano da luglio — "si riconoscono perché aprendo il form
allergeni il selettore dietetico si presenta vuoto" — è stato eseguito per la
prima volta quel giorno ed è risultato esatto: il selettore c'era, stava nel
modulo degli allergeni e non in quello dei campi semplici. **La descrizione era
vera; nessuno l'aveva mai messa alla prova.***

Le **21 bevande** restano fuori dal tracciamento, con la colonna di verifica a
NULL: vanno compilate prima di poterle dichiarare senza allergeni.

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

## 69. Conservazione e cancellazione dei dati (aggiunta in v53, vincolante)

Non esisteva nulla in spec. Ora esiste.

**Ordini completati e pagati:** conservati per gli obblighi amministrativi, contabili e fiscali. Le durate esatte le fissa il commercialista.

**Ordini mai pagati e righe cliente senza ordine pagato: massimo 30 giorni.** La rimozione è una **procedura manuale a cadenza almeno mensile**, non un processo automatico. L'informativa la descrive così: è una promessa organizzativa e vale quanto la disciplina con cui viene eseguita.

✅ **Il giorno è fissato: il primo di ogni mese, prima di aprire il locale** (decisione di Andrea, 05/08/2026). Il primo perché **esiste in tutti i mesi** — un giorno che qualche mese non c'è è un giorno che prima o poi salta — e a saracinesca chiusa perché la procedura scrive sul database che serve i clienti. *La sequenza completa di ogni esecuzione è: referto dei conteggi, pulizia, referto dei conteggi di nuovo.*

⚠️ **Il referto delle statistiche di §65 si lancia PRIMA della pulizia, non dopo.** Nel caso normale non cambia nulla — la pulizia tocca solo ciò che ha più di trenta giorni — ma l'ordine giusto costa zero a scriverlo ed evita di doverci ragionare ogni volta. *Ne esce un'abitudine sola invece di tre: il primo del mese, tre file in fila nella stessa schermata — statistiche, conteggi, pulizia. Una procedura mensile si ricorda; tre sparse si dimenticano, ed è esattamente il rischio che questa sezione dichiara su sé stessa.* ⚠️ **Resta aperta la sola prima esecuzione**, che è ciò che tiene aperta questa condizione: finché non è stata fatta una volta, il punto 11.2 dell'informativa è una promessa senza precedente.

**Quali ordini sono "mai pagati" (decisione di Andrea del 04/08/2026):** `pending` **e** `failed`. La v53 nominava i soli `pending`, perché `failed` non è mai stato usato da nessun ordine; ma la regola è la stessa e scriverla oggi costa una riga, mentre scoprirla quando quello stato inizierà a popolarsi — per esempio agganciando i webhook di Stripe — costa una decisione presa di fretta. **Mai toccati**, in nessun caso: `succeeded`, `refunded`, `partially_refunded`.

**Strumento: DUE script separati, non uno (decisione di Andrea del 04/08/2026).** Rovescia la formulazione della v53, che ne prevedeva uno solo riusato due volte. Le due pulizie non sono la stessa operazione: quella del go-live cancella **tutto** una volta sola e non deve mai più essere eseguita, quella mensile cancella **una parte** in base all'età e deve girare per anni. Un file unico avrebbe per forza un interruttore, e un interruttore su uno strumento che cancella è il modo in cui si esegue la cosa sbagliata.

⚠️ **Il pericolo dello script del go-live non è il giorno in cui si esegue: è che resti nel repository dopo.** Deve portare in cima una **data scritta a mano a ogni esecuzione** e fermarsi se esiste anche un solo ordine più recente. Se la guardia scatta, il file non è sbagliato: sono i dati a non essere quelli attesi, e non si aggira (metodo `k`).

**Vincoli comuni alla scrittura di entrambi**, dal referto di audit del 04/08/2026:

* **la regola sulle righe cliente, in una formulazione sola (v55).** La v54 ne conteneva due che non coincidevano — "senza ordine **pagato**" e "che abbia almeno **un ordine**" — e vanno lette così: **si cancella una riga cliente solo se, a cancellazione degli ordini avvenuta, non le resta collegato alcun ordine di alcun tipo**, ed è anch'essa più vecchia di trenta giorni. È la più stretta delle due, e l'effetto pratico coincide con l'altra, perché gli ordini mai pagati spariscono poche righe prima nella stessa transazione: chi aveva solo quelli resta senza ordini e viene rimosso, chi ha un ordine pagato conserva l'ordine e quindi la riga. *La riga cliente è condivisa: un ordine mai pagato seguito da un ordine pagato dalla stessa persona è il caso normale.*
* **da quale data si contano i trenta giorni per una riga cliente**: da `customers.created_at`. Serve per chi non ha mai avuto un ordine — un checkout interrotto prima della scrittura — ed è l'unica data disponibile su quella riga;
* **non esiste** un evento "pagamento fallito" che qualcuno scriva: un ordine non pagato semplicemente resta. Il conteggio dei 30 giorni parte dalla **creazione**;
* **pre-check e post-check bloccanti dentro la stessa transazione** (metodo `n`), con messaggi in italiano. I post-check verificano anche ciò che **non** doveva cambiare — il numero di ordini pagati, la presenza del menu, del perimetro e del log staff — perché un controllo che guarda solo ciò che è sparito non si accorge di ciò che è sparito in più;
* i conteggi si **rileggono dal database** prima e dopo, mai ricopiati da un documento (lezioni `s` e `z`).

**Staccare invece di cancellare, dove la struttura lo consente (decisione di Andrea del 04/08/2026, estesa in v55).** Nella pulizia mensile, le righe di `staff_action_log` e di `analytics_events` che citano un ordine rimosso **perdono il riferimento e restano**: entrambe le colonne sono facoltative, quindi è possibile. Cancellarle eroderebbe l'audit trail che §66 dichiara intoccabile e i dati statistici di §65, per un collegamento che dopo la rimozione dell'ordine non serve più a nessuno. **Al go-live la regola vale allo stesso modo, per le sole righe da conservare (chiarimento v55).** Là le righe di prova del registro vanno via e gli eventi statistici si cancellano interi, perché sono tutti di prova; ma una riga di registro **da conservare** che citasse un ordine metterebbe §66 contro sé stessa — cancellarla è vietato perché è audit trail, non cancellare l'ordine è vietato perché si azzera tutto. Si stacca il riferimento e la riga resta: è l'unica via che rispetta entrambe. *Al 04/08/2026 nessuna riga di registro punta a un ordine, quindi oggi non tocca nulla — ma la regola non deve dipendere da un conteggio fotografato in un documento.*

⚠️ **Un limite noto, registrato e non sanato: la spec non definisce come si riconosce un'azione di prova.** §66 dice che restano le righe dell'identificatore reale e vanno via quelle di prova, ma `staff_action_log.staff_identifier` è **testo libero**, senza contrassegno né convenzione dichiarata. Nello script del go-live il criterio è quindi un **parametro compilato a mano**, letto dal referto dei conteggi e non ricordato — con due controlli che bloccano se resta vuoto o se non corrisponde ad alcuna riga reale. *Non serve sanarlo: quello script si esegue una volta e poi si cancella, e la pulizia mensile non tocca mai il registro per identificatore. Se un giorno servisse renderlo automatico, la strada pulita è smettere di usare identificatori di fantasia — ed è una decisione, non un dettaglio tecnico.*

**Dove staccare non si può: i codici promo.** In `promo_redemptions` il riferimento all'ordine è **obbligatorio**, quindi la riga si cancella. **Conseguenza voluta e accettata da Andrea il 04/08/2026:** chi aveva applicato un codice a un ordine **mai pagato** potrà riusarlo dopo trenta giorni. Non è una falla in §14: chi ha davvero usato lo sconto ha un ordine pagato, e quell'ordine non viene mai cancellato, quindi il suo riscatto resta e il codice resta bruciato. Si libera solo per chi dello sconto non ha mai goduto.

**Ordine delle cancellazioni**, imposto dai collegamenti verificati il 04/08/2026 e non modificabile a piacere: prima ciò che punta agli ordini senza cancellazione a catena — eventi statistici, riscatti promo, righe di log — poi gli ordini, che si portano dietro da soli righe d'ordine e storico di stato, e infine le righe cliente rimaste senza ordini. *Cambiare l'ordine produce un errore di vincolo, non un danno silenzioso: è la stessa scelta del `drop table` senza `cascade` del metodo `p`.*

**Precondizione, soddisfatta:** non era scrivibile prima che il referto di audit restituisse foreign key e comportamenti `ON DELETE`. Il referto è del **04/08/2026** ed è registrato in §66.

---

### I tre file — scritti e committati il 04/08/2026 (v55)

Non sono più un lavoro da fare: esistono, sono in `sql/`, e nessuno dei tre è mai stato eseguito.

| file | cosa fa | quando |
|---|---|---|
| `sql/conteggi_dati_sola_lettura.sql` | conta e basta, non scrive nulla | **prima e dopo** ognuna delle due pulizie |
| `sql/ESEGUIRE_UNA_VOLTA_SOLA_prima_del_golive_CANCELLA_TUTTI_GLI_ORDINI.sql` | azzera ordini, clienti, riscatti ed eventi | **una volta sola**, al go-live |
| `sql/pulizia_mensile_ordini_mai_pagati.sql` | rimuove ordini mai pagati oltre i 30 giorni | **ogni mese**, per sempre |

**I nomi sono la prima protezione**, quella che agisce prima che qualcuno apra il file: il maiuscolo è voluto, perché nell'elenco della cartella — fra nove migrazioni datate tutte minuscole — quel file si stacca a colpo d'occhio. I due strumenti si somigliano e stanno nella stessa cartella: il pericolo non è che qualcuno esegua quello sbagliato di proposito, è che li confonda. *Le date sono uscite dai nomi: il primo verrà cancellato e non ordina niente, gli altri due non sono di agosto ma di sempre.*

⚠️ **Lo script del go-live si cancella dal deposito subito dopo l'unica esecuzione (decisione di Andrea, 04/08/2026).** È il **passo 5 della sequenza di apertura** di §66, non una buona intenzione da onorare "domani": il momento in cui si cancella è anche quello in cui si è stanchi e contenti, con il sito appena aperto. Un file che non c'è non si esegue per sbaglio, e la sua storia resta nei commit se un giorno servisse ripescarlo. *L'istruzione è scritta in tre punti dentro il file stesso, così viaggia con lo strumento invece di vivere solo qui.*

**Il freno dello script del go-live.** Non è un filtro: quello script cancella **tutti** gli ordini, senza guardare alcuna data. La data in cima decide soltanto **se** partire. Ci va la data e ora dell'**ultima prova di sviluppo**, che il referto dei conteggi stampa in cima apposta — ⚠️ **mai l'ora corrente**, che è il valore che spegne il freno senza che nessuno se ne accorga, perché nulla può essere più recente di adesso. Se il freno scatta **non si sposta la data in avanti**: significa che in database c'è qualcosa che non ci si aspettava (metodo `k`).

✅ **Prova eseguita il 04/08/2026.** Il valore stampato dal referto include i **microsecondi**, e serve: `orders.created_at` ha per predefinito `now()`, quindi troncare ai secondi produrrebbe un istante anteriore a quello vero e **il freno scatterebbe a torto** — insegnando ad aggirarlo, che è peggio di un freno assente. Verificato nella dashboard su `max(created_at) = 2026-08-04 13:07:01.471525+00`: con il formato corretto gli ordini successivi sono **zero**, con quello troncato sono **uno**. *Lo zero conta perché la stessa sonda, alimentata col formato vecchio, cambia risposta.*

✅ **Confermato da una fonte indipendente il 05/08/2026 (v56).** Il referto dei conteggi, eseguito da Andrea in una sessione diversa e a un giorno di distanza, stampa **esattamente lo stesso valore** al microsecondo. La prova non poggiava quindi su un numero ricordato o costruito: il dato esiste nel database ed è quello. ⚠️ *Il controllo era necessario perché altre affermazioni della stessa giornata erano invecchiate senza che nessuno se ne accorgesse (§66, conteggi): quando un documento si contraddice in un punto, le sue altre misure non sono automaticamente sospette — ma vanno riverificate una per una, non assolte in blocco.*

**Stato del freno al 05/08/2026**: il valore committato nel file è anteriore all'ordine più recente, quindi **oggi il freno fermerebbe l'esecuzione**. È il comportamento voluto, ed è la direzione sicura.

**Ogni tabella del database è coperta.** Le **sette** che gli script toccano più le **sedici** dichiarate intoccabili fanno esattamente le 23 dello schema: nessuna resta fuori: o è dichiarata come toccata, o è misurata come intatta dai post-check. *Le sedici non sono un elenco copiato a mano nei controlli: è la stessa lista, dichiarata una volta e percorsa in ciclo, così intestazione e verifica non possono divergere.* ⚠️ *`staff_action_log` è fra le sette ma non viene mai svuotato: le righe vere restano sempre, ed è l'eccezione di §66.*

---

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
