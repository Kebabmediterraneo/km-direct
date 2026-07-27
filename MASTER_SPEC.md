# KM DIRECT — MASTER SPECIFICATION

**Versione 25** — sostituisce la v24.

Documento di riferimento definitivo per lo sviluppo. Le decisioni qui
contenute sono approvate: non vanno reinterpretate senza un motivo concreto
(vedi §73). Ogni file di codice del progetto deve rispettare queste regole.

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

## 15. Categorie menu (ordine fisso)

ROLL, BOWL, MENU COMBO, FRITTI, SIDES, SALSE, DOLCI, DRINK, BIRRE. La frase
"Tutti i roll sono con patatine" va eliminata ovunque (non è più vera).

## 16. Roll e Bowl

Articoli separati anche a livello di database — mai un'unica referenza
condivisa. Possono condividere concettualmente la stessa ricetta ma restano
prodotti, prezzi, disponibilità e articoli distinti.

## 17. Regola proteine

Selezione singola, mai multipla (radio/select, non checkbox).

## 18. Regola rimozioni

Rimozioni multiple, guidate, definite prodotto per prodotto. Niente limite
artificiale di 3-4, niente campo note libero sul prodotto.

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

**L'Egiziano — 8 €** Badge VEGAN. Nessuna proteina selezionabile (salsa
all'aglio è vegan). Rimozioni: Senza salsa all'aglio, Senza babaganoush,
Senza tabulì.

**Il Cipriota — 9 €** Badge VEGGIE. Nessuna proteina selezionabile.
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

Planted non ha supplemento sul Roll normale (+1,50 €, da §19) e si applica
allo stesso modo dentro il combo.

**Identità del prodotto = `id` (immutabile).** Tutti i collegamenti interni
tra prezzi e prodotti — in particolare il prezzo base del combo per ogni Roll
e la bibita scelta nel combo — usano l'`id` del prodotto, mai il suo nome.
Così **nome, categoria, prezzo e appartenenza ai combo restano attributi
liberamente modificabili** (anche dal futuro editor staff) senza rischio di
rompere i prezzi. Il nome resta usato solo come **etichetta da mostrare** a
schermo e nei dettagli dell'ordine. *(Refactoring combo nome→id, prerequisito
dell'editor menu — prezzi verificati identici: base 13 €, KM Special +3, drink
premium +0,50.)*

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

## 36-40. Carrello

Barra sticky quando non vuoto ("N articoli · totale €" + "Vedi carrello").
Nel carrello: progressione ordine minimo (Delivery, 15 €) e GIVEMEFIVE (25
€) con CTA "Applica GIVEMEFIVE" a un tap. Upsell max 3-4 suggerimenti con
regole semplici (no AI): Roll senza fritto → suggerisci fritto; fritto senza
salsa → suggerisci salsa; vicino ai 25 € → suggerisci per raggiungere soglia.

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

Se il cliente vuole un indirizzo diverso, deve tornare al selettore
indirizzo iniziale e rifare la verifica — non può aggirarla scrivendo un
indirizzo diverso direttamente al checkout.

In aggiunta, coerentemente col principio del §46 ("mai fidarsi del
browser"): la route server-side che crea l'ordine deve ri-verificare essa
stessa che le coordinate dell'indirizzo usato ricadano nella geofence,
non limitarsi a fidarsi del fatto che il client abbia già mostrato
"Perfetto, arriviamo fin qui" in una fase precedente.

## 46. Pagamento

Stripe. Regole non negoziabili: prezzo ricalcolato server-side (mai fidarsi
del browser), webhook, idempotenza, prevenzione doppio ordine, stato
pending, ordine storico con snapshot prezzi immutabile, procedura rimborso.

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

**Convenzioni di errore delle route API** (prima definizione esplicita in
spec — fino alla v13 status code e formato erano convenzioni del codice,
non prescritte):

- Formato di ogni risposta di errore: JSON `{ "error": "<messaggio>" }`.
- **400** — richiesta malformata, dati mancanti o invalidi.
- **409** — richiesta ben formata ma non accettabile nello stato attuale
  del servizio: fuori orario, turno chiuso, slot non più disponibile,
  geofence non superata. È il codice del punto 3 qui sopra.
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

**Stato di implementazione al momento della v14**: il guard è implementato
per la sola Delivery. Il guard per il Ritiro va implementato insieme a
§12b; finché non esiste, un ordine Ritiro può essere creato via HTTP anche
a locale chiuso.

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

**Editor menu completo con ruolo admin (nota-roadmap, aggiunta in v19, non
ancora costruito)**: oggi il pannello Menu consente **solo** di cambiare lo
stato disponibile/esaurito di un articolo; nomi, descrizioni, prezzi e
label delle opzioni (proteine, contorni, ecc.) non sono editabili
dall'interfaccia e ogni loro modifica richiede un intervento diretto sui
dati. Va costruito un **editor del menu** nel pannello che permetta di
modificare questi campi, protetto da un livello di accesso **admin distinto
dallo staff** (lo staff operativo continua a vedere solo il toggle
disponibile/esaurito; l'admin accede all'editor completo). È la soluzione
strutturale per operare sul menu in sicurezza senza toccare il database a
mano. Richiede l'introduzione di ruoli/permessi, oggi assenti. Da progettare
in dettaglio prima dell'implementazione.

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
- **Roll e Bowl omonimi condividono gli stessi allergeni** (es. Il Turco e
  Il Turco Bowl).
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
  superati dalla tabella `product_allergens`. Restano nello schema ma non
  vanno usati come fonte (doppia fonte = rischio incoerenza); da
  disattivare o allineare in un intervento dedicato.

**Rendering al cliente (fatto, v24)**: gli allergeni e il badge dietetico
sono mostrati al cliente. Ogni scheda prodotto con allergeni mostra un
blocco espandibile "Allergeni" (che al tap elenca gli allergeni; assente se
il prodotto non ne ha) e un badge dietetico unico dai flag ("Vegano" se
`is_vegan`, altrimenti "Vegetariano" se `is_vegetarian`). La **sezione
salse** mostra allergeni e il badge "Vegano" per le salse vegane (le salse
hanno `is_vegan` ma non `is_vegetarian` — scelta consapevole: nessun badge
vegetariano sulle salse per ora). La soia della variante Planted è segnalata
nel configuratore (v23).

**Ancora da fare**:
- Bonifica dei flag legacy `contains_gluten` / `contains_lactose` (doppia
  fonte superata da `product_allergens`, da disattivare/allineare).

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
