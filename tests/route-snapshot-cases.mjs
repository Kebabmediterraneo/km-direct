// §46 / §46b — CATALOGO DEI CASI per la fotografia del comportamento di
// `app/api/checkout/route.js`. Non esegue nulla: descrive soltanto che cosa
// mandare e che cosa ci si aspetta. Lo scatto lo fa `tests/route-snapshot.mjs`.
//
// A COSA SERVE. La route non è importabile fuori da Next (lezione `t`), quindi
// il suo instradamento non è coperto da alcun test. Prima di riordinarla —
// estrarne la logica in `lib/`, §46 "lavori decisi e non fatti" — si è scattata
// questa fotografia; dopo il riordino si è riscattata e le due sono risultate
// identiche. È la stessa idea della fixture dei 609 prezzi: vale perché è
// scattata PRIMA e non si rigenera dopo (lezione `af`).
//
// ⚠️ GLI ID DEI CASI SONO NOMI, NON INDIRIZZI. "riga-549" significa "il caso
// dell'ordine minimo": i numeri vengono dalla route com'era a 691 righe, e dopo
// l'estrazione (§46 v46) sono **tutti falsi**. Non si rinominano perché sono la
// chiave con cui `snapshot-prima.json` si confronta: cambiarli spezzerebbe il
// metro. I casi nuovi non ne usano, e si chiamano per quello che provano.
//
// ┌─ COSA COPRE: 20 uscite su 27, più un comportamento non documentato ───────
// │ 345, 348, 355, 358, 363, 369, 380, 389, 406, 93 (due casi: "past" e
// │ "closed"), 473, 495, 498, 501, 522, 549, 556, 690.
// │ Dal 01/08/2026, con l'aggancio del confronto dei prezzi (§46 v44), le
// │ uscite possibili passano da 25 a 27 e le due nuove sono coperte:
// │  - il 409 `CHANGED`   → `guard-prezzo-salito` e `guard-prezzo-sceso`;
// │  - il 400 `MALFORMED` → `guard-prezzo-assente`.
// │ ⚠️ I primi due sono l'**unica** prova che il 409 esista: nessun altro caso
// │ manda un prezzo diverso da quello vero.
// │
// │ In più `riga-406-coordinate-vuote`, che non aggiunge un'uscita ma registra
// │ una STRADA per arrivarci che nessuno aveva scritto: una latitudine `null`
// │ diventa 0 e supera il controllo di riga 369 invece di fermarsi lì. Scoperto
// │ dal primo scatto del 31/07/2026. Non è un difetto e non va corretto: dopo
// │ il riordino deve comportarsi esattamente come oggi.
// └───────────────────────────────────────────────────────────────────────────
//
// ⚠️ OGNI RIGA DI CARRELLO DEVE PORTARE `unitPriceShown` (§46 v44 punto 1), col
// prezzo REALE dell'articolo. Non è un dettaglio dei casi nuovi: senza quel
// campo la richiesta è malformata e **ogni** caso che arriva al ciclo cade sul
// guard con un 400, invece che dove il caso vuole andare. Provato il
// 01/08/2026: senza il campo, `riga-549`, `riga-556` e `riga-690` smettevano di
// esercitare ordine minimo, diciotto anni e percorso completo, e la rete si
// assottigliava di tre uscite senza che nulla sembrasse rotto.
//
// ┌─ COSA NON COPRE: 7 uscite ────────────────────────────────────────────────
// │ Non sono raggiungibili da una richiesta HTTP ben formata:
// │  - 427, 447, 585, 649 → guasto di lettura/scrittura Supabase;
// │  - 682              → guasto di Stripe o chiave mal configurata;
// │  - 518              → nelle vie non provocabili (errore di lettura di
// │                       `product_removals`/`product_addons`). ⚠️ Le altre due
// │                       vie SÌ sarebbero provocabili, ma solo sporcando i
// │                       dati veri — un addon ambiguo, un prezzo non numerico
// │                       — e non si sporcano i dati per una prova;
// │  - 641              → fallimento dell'insert, o cinque collisioni
// │                       consecutive su `pickup_code`.
// │ Restano scoperte di proposito: provocarle richiederebbe di rompere
// │ qualcosa, e ciò che si rompe per una prova resta rotto (§66, un solo DB).
// └───────────────────────────────────────────────────────────────────────────
//
// ⚠️ LIMITE NOTO DI QUESTA RETE. Le uscite 495, 498 e 501 restituiscono lo
// STESSO messaggio ("Articolo non valido.") con lo stesso status. Uno scambio
// fra loro — per esempio due condizioni invertite durante il riordino — NON
// sarebbe visibile qui: le tre fotografie resterebbero identiche. Distinguerle
// richiederebbe messaggi diversi, cioè un cambiamento di comportamento, che è
// esattamente ciò che questa rete deve impedire. Chi tocca quelle tre righe lo
// deve sapere e verificarle a mano.
//
// ⚠️ GLI ORARI NON SONO SCRITTI QUI. Uno slot fisso sarebbe già passato al
// secondo scatto. Ogni caso riceve `slot`, calcolato allo scatto da
// /api/service-status, nella forma:
//   { delivery: { day, time }, pickup: { day, time } }
// I due non coincidono: il Ritiro ha preparazione di 15 minuti e chiusura
// inclusa (§12b), la Delivery 60/30 e chiusura esclusa (§12).
//
// ⚠️ PERCHÉ SLOT PROGRAMMATI E NON "PRIMA POSSIBILE". A locale chiuso il sito
// accetta comunque preordini programmati (§12: a semaforo giallo o rosso resta
// solo "CONSEGNA PROGRAMMATA"). Usando slot programmati la fotografia si può
// scattare a qualunque ora. Le uniche tre eccezioni sono marcate
// `dipendeDalMomento`: il 473 esiste solo a locale chiuso, e i due casi del 93
// dipendono per costruzione da dove cade l'orario.

// ---------------------------------------------------------------------------
// FIXTURES — id reali, letti dal database il 31/07/2026
// ---------------------------------------------------------------------------
// Letti UNA VOLTA con la chiave secret su PostgREST e scritti qui letterali:
// una fotografia non deve interrogare il database, o cambierebbe insieme ai
// dati e smetterebbe di dimostrare qualcosa (lezione `af`).
//
// ⚠️ VANNO RICONTROLLATI SE I DATI CAMBIANO. In particolare: se un articolo
// viene segnato esaurito dal pannello, i casi che lo usano cadrebbero su
// riga 522 invece che dove previsto, e la fotografia sembrerebbe "cambiata"
// senza che nessuno abbia toccato la route. Prima di dare la colpa al
// riordino, rileggere questi id.
//
// ⚠️ ANCHE I PREZZI SONO FIXTURE, dal 01/08/2026: `prezzo` è il prezzo di riga
// che il sito mostrerebbe, e viaggia nei casi come `unitPriceShown`. **Riletti
// dal database il 01/08/2026** su PostgREST con la chiave secret, insieme alle
// tre tabelle che potrebbero spostarlo:
//
//   products                (base_price, is_available)
//   product_choice_options  (supplemento della scelta)
//   product_addons          (extra carne)
//   product_accompaniments  (accompagnamento Bowl)
//
// Esito: L'Egiziano 8,00 · Il Greco 8,00 · Peroncino 25cl 3,00 · Yogurt 1,00,
// tutti disponibili, e **zero righe** nelle tre tabelle di opzione per tutti e
// quattro tranne Il Greco (3 proteine: +0 / +1,50 / +4,50). Il prezzo di riga
// coincide quindi col prezzo base, senza supplementi da sommare.
//
// ⚠️ Un centesimo sbagliato qui NON produce l'errore che si penserebbe: il caso
// cadrebbe sul 409 del guard invece che dove deve andare, e sembrerebbe una
// rottura della route. Se un prezzo cambia dal pannello, si rileggono questi
// quattro numeri prima di dare la colpa al codice.
const FIXTURES = {
  // KM San Mamolo, l'unico store attivo.
  storeId: "f2124c1c-1155-4e6b-8e3f-cbe0e42b7e3c",

  // L'Egiziano — Roll disponibile SENZA scelta proteina, SENZA accompagnamento
  // e SENZA extra carne (verificato: le tre tabelle non hanno righe per lui).
  // È il prodotto più semplice da ordinare: serve al caso 690, dove qualunque
  // opzione mancante produrrebbe un rifiuto invece del successo atteso.
  prodottoSemplice: { id: "5c29adb5-354f-4b2a-a1d7-f350758736b5", nome: "L'Egiziano", prezzo: 8.0 },

  // Il Greco — Roll CON scelta proteina ("Pollo e tacchino"). Serve al caso
  // 522: gli si manda una proteina che non esiste.
  prodottoConProteina: {
    id: "544b92bd-8e88-4ea2-a216-065b7273ace1",
    nome: "Il Greco",
    // 8,00 = base_price + il supplemento di "Pollo e tacchino", che è +0.
    // ⚠️ Nel caso `riga-522` questo valore non viene mai confrontato: la riga è
    // rifiutata dentro il ciclo, prima del guard. Sta qui per non lasciare una
    // riga di carrello senza prezzo, che sarebbe l'unica del catalogo.
    prezzo: 8.0,
    proteinaValida: "Pollo e tacchino",
    proteinaInesistente: "Pollo e struzzo",
  },

  // Peroncino 25cl — la birra più economica disponibile. Serve al caso 556
  // (categoria `birre` → `hasBeer`), in Ritiro per non incappare prima
  // nell'ordine minimo Delivery.
  birra: { id: "c99b1c1d-f5b6-49d7-b6e2-a3733db3d183", nome: "Peroncino 25cl", prezzo: 3.0 },

  // Yogurt — salsa da 1,00 €. Serve al caso 549: da sola sta sotto i 15 € di
  // ordine minimo Delivery.
  salsaEconomica: { id: "c9b3486a-1e95-4268-b7dc-bfedebf10605", nome: "Yogurt", prezzo: 1.0 },

  // Coordinate verificate contro il poligono vero (22 vertici) con
  // isPointInPolygon, non stimate guardando una mappa.
  dentroZona: { address: "Via San Mamolo 1, Bologna", houseNumber: "1", latitude: 44.4855346, longitude: 11.3393718 },
  fuoriZona: { address: "Piazza del Duomo, Milano", houseNumber: "1", latitude: 45.4642, longitude: 9.19 },
};

// Cliente valido, riusato ovunque: i casi devono fallire per la ragione che
// stanno provando, non perché mancano nome e telefono (lezione `ad`: una prova
// di rifiuto vale solo se è attribuibile).
const CLIENTE = { firstName: "Prova", lastName: "Fotografia", phone: "3330000000", email: "" };

const CONSENSI = { privacyAccepted: true, marketingOptIn: false, ageConfirmed: true };

// ⚠️ `unitPriceShown` è obbligatorio e sta **dentro la riga**, accanto a `ref` e
// `quantity` (§46 v44 punto 1). È un parametro esplicito e non un default,
// perché un default sarebbe un prezzo indovinato: chi aggiunge un caso deve
// dichiarare quanto costa la riga che sta componendo.
const rigaProdotto = (id, prezzoMostrato, extra = {}) => ({
  quantity: 1,
  unitPriceShown: prezzoMostrato,
  ref: { kind: "product", id, ...extra },
});

// Ritiro valido: la base su cui si cambia UN campo solo per volta.
const baseRitiro = (slot) => ({
  items: [rigaProdotto(FIXTURES.prodottoSemplice.id, FIXTURES.prodottoSemplice.prezzo)],
  fulfillment: "pickup",
  delivery: null,
  pickup: { scheduledDay: slot.pickup.day, scheduledTime: slot.pickup.time },
  customer: { ...CLIENTE },
  ...CONSENSI,
  giveMeFiveRequested: false,
});

// Delivery valida e programmata, indirizzo dentro zona.
const baseDelivery = (slot) => ({
  items: [rigaProdotto(FIXTURES.prodottoSemplice.id, FIXTURES.prodottoSemplice.prezzo)],
  fulfillment: "delivery",
  delivery: {
    ...FIXTURES.dentroZona,
    intercom: "",
    floorInterior: "",
    buildingStaircase: "",
    riderNotes: "",
    timingType: "scheduled",
    scheduledDay: slot.delivery.day,
    scheduledTime: slot.delivery.time,
  },
  pickup: null,
  customer: { ...CLIENTE },
  ...CONSENSI,
  giveMeFiveRequested: false,
});

// ---------------------------------------------------------------------------
// I CASI. `error` è copiato dal file, non riscritto a memoria.
// ---------------------------------------------------------------------------
const CASI = [
  {
    id: "riga-345",
    descrizione: "carrello vuoto",
    attesa: { status: 400, error: "Il carrello è vuoto." },
    body: (slot) => ({ ...baseRitiro(slot), items: [] }),
  },
  {
    id: "riga-348",
    descrizione: "modalità fuori dai due valori ammessi",
    attesa: { status: 400, error: "Si è verificato un problema con la modalità scelta. Riprova." },
    body: (slot) => ({ ...baseRitiro(slot), fulfillment: "asporto" }),
  },
  {
    id: "riga-355",
    descrizione: "telefono vuoto",
    attesa: { status: 400, error: "Controlla di aver compilato nome, cognome e telefono." },
    body: (slot) => ({ ...baseRitiro(slot), customer: { ...CLIENTE, phone: "" } }),
  },
  {
    id: "riga-358",
    descrizione: "privacy non accettata",
    attesa: { status: 400, error: "Per procedere, accetta l'informativa privacy." },
    body: (slot) => ({ ...baseRitiro(slot), privacyAccepted: false }),
  },
  {
    id: "riga-363",
    descrizione: "Delivery senza numero civico",
    attesa: { status: 400, error: "Manca qualche dato dell'indirizzo. Controlla e riprova." },
    body: (slot) => {
      const b = baseDelivery(slot);
      return { ...b, delivery: { ...b.delivery, houseNumber: "" } };
    },
  },
  {
    id: "riga-369",
    descrizione: "Delivery con latitudine che Number() non sa convertire",
    attesa: { status: 400, error: "Non siamo riusciti a individuare l'indirizzo. Riprova a inserirlo." },
    // ⚠️ NON basta mandare la latitudine "come stringa", ed è l'errore in cui
    // era caduto il primo scatto: la route non guarda il tipo, applica
    // `Number(delivery?.latitude)` e poi `Number.isFinite`. `Number("44.4855346")`
    // vale 44.4855346, cioè un numero finito, quindi una stringa NUMERICA passa
    // il controllo indisturbata e la richiesta prosegue oltre. Serve un valore
    // che diventi NaN: una stringa non numerica, oppure il campo omesso.
    // (Anche "44,48" con la virgola andrebbe bene: Number lo rifiuta.)
    body: (slot) => {
      const b = baseDelivery(slot);
      return { ...b, delivery: { ...b.delivery, latitude: "quarantaquattro" } };
    },
  },
  {
    id: "riga-406-coordinate-vuote",
    descrizione: "Delivery con latitudine null — supera il controllo di riga 369 e cade sul geofence",
    // ⚠️ NON È UN DIFETTO DA CORREGGERE: è comportamento reale, scoperto dal
    // primo scatto e registrato qui perché dopo il riordino deve restare
    // IDENTICO. `Number(null)` vale 0 — e 0 è un numero finito, quindi una
    // coordinata formalmente valida, in mezzo all'Atlantico al largo del golfo
    // di Guinea. La richiesta supera quindi il controllo di riga 369 e arriva
    // al perimetro, che la respinge come "fuori zona". Vale lo stesso per la
    // stringa vuota e per l'array vuoto, che pure diventano 0.
    //
    // Il messaggio che il cliente vede resta sensato, ed è la ragione per cui
    // nessuno se n'era accorto: il comportamento non era scritto da nessuna
    // parte, ma non produce danno. Qui serve solo a fissarlo.
    attesa: { status: 400, error: "Questo indirizzo è fuori dalla nostra zona di consegna." },
    body: (slot) => {
      const b = baseDelivery(slot);
      return { ...b, delivery: { ...b.delivery, latitude: null } };
    },
  },
  {
    id: "riga-380",
    descrizione: "Delivery programmata con orario di forma non valida (24:00)",
    attesa: { status: 400, error: "Orario di consegna programmata non valido." },
    body: (slot) => {
      const b = baseDelivery(slot);
      return { ...b, delivery: { ...b.delivery, scheduledTime: "24:00" } };
    },
  },
  {
    id: "riga-389",
    descrizione: "Ritiro con orario di forma non valida (9:00 senza zero)",
    attesa: { status: 400, error: "Orario di ritiro non valido." },
    body: (slot) => ({ ...baseRitiro(slot), pickup: { scheduledDay: slot.pickup.day, scheduledTime: "9:00" } }),
  },
  {
    id: "riga-406",
    descrizione: "Delivery con coordinate fuori dal perimetro (Milano)",
    attesa: { status: 400, error: "Questo indirizzo è fuori dalla nostra zona di consegna." },
    body: (slot) => {
      const b = baseDelivery(slot);
      return { ...b, delivery: { ...b.delivery, ...FIXTURES.fuoriZona } };
    },
  },
  {
    id: "riga-93-past",
    descrizione: "Ritiro con orario nel passato (oggi alle 00:00) → verdetto 'past'",
    dipendeDalMomento: true,
    attesa: {
      status: 409,
      error: "L'orario che hai scelto non è più disponibile. Scegline un altro tra quelli proposti.",
    },
    // ⚠️ Unico istante in cui questo caso cambierebbe esito: uno scatto fatto
    // esattamente a mezzanotte, quando 00:00 non è ancora passato.
    body: (slot) => ({ ...baseRitiro(slot), pickup: { scheduledDay: "today", scheduledTime: "00:00" } }),
  },
  {
    id: "riga-93-closed",
    descrizione: "Ritiro domani alle 05:00, fuori da ogni finestra → verdetto 'closed'",
    dipendeDalMomento: true,
    attesa: { status: 409, error: "In quell'orario siamo chiusi. Scegli un altro orario tra quelli proposti." },
    body: (slot) => ({ ...baseRitiro(slot), pickup: { scheduledDay: "tomorrow", scheduledTime: "05:00" } }),
  },
  {
    id: "riga-473",
    descrizione: "Delivery ASAP — 409 solo a locale chiuso, 200 se aperto",
    dipendeDalMomento: true,
    attesa: {
      status: 409,
      error:
        "Non possiamo più accettare ordini immediati in questo momento. Scegli un orario tra quelli disponibili.",
    },
    // ⚠️ A locale APERTO questo caso NON arriva in fondo e NON crea un ordine:
    // è una Delivery con un solo Roll da 8,00 €, cioè **sotto l'ordine minimo
    // di 15 €** (§9), quindi supera il guard degli orari e cade sul minimo con
    // un 400. L'esito scritto qui sopra è quello a locale CHIUSO, dove si ferma
    // prima. Il confronto fra due fotografie resta valido solo se lo stato del
    // servizio è lo stesso, ed è la ragione dell'avviso in testa al confronto.
    //
    // *Fino al 01/08/2026 questo commento affermava che a locale aperto il caso
    // "arriva fino in fondo e crea un ordine". Era falso, e nessuna rilettura
    // l'avrebbe smentito: lo smentisce l'aritmetica delle fixture qui sopra
    // (8 < 15). La frase suonava giusta perché il caso è costruito sulla base
    // Delivery, che in un altro contesto arriva davvero in fondo.*
    body: (slot) => {
      const b = baseDelivery(slot);
      return { ...b, delivery: { ...b.delivery, timingType: "asap" } };
    },
  },
  {
    id: "riga-495",
    descrizione: "ref con kind sconosciuto",
    attesa: { status: 400, error: "Articolo non valido." },
    body: (slot) => ({ ...baseRitiro(slot), items: [{ quantity: 1, ref: { kind: "pizza" } }] }),
  },
  {
    id: "riga-498",
    descrizione: "ref prodotto senza id",
    attesa: { status: 400, error: "Articolo non valido." },
    body: (slot) => ({ ...baseRitiro(slot), items: [{ quantity: 1, ref: { kind: "product" } }] }),
  },
  {
    id: "riga-501",
    descrizione: "ref combo senza rollProductId",
    attesa: { status: 400, error: "Articolo non valido." },
    body: (slot) => ({ ...baseRitiro(slot), items: [{ quantity: 1, ref: { kind: "combo" } }] }),
  },
  {
    id: "riga-522",
    descrizione: "proteina che non esiste per quel prodotto",
    attesa: { status: 400, error: "Un articolo del carrello non è più disponibile." },
    body: (slot) => ({
      ...baseRitiro(slot),
      items: [
        rigaProdotto(FIXTURES.prodottoConProteina.id, FIXTURES.prodottoConProteina.prezzo, {
          proteinLabel: FIXTURES.prodottoConProteina.proteinaInesistente,
        }),
      ],
    }),
  },
  {
    id: "riga-549",
    descrizione: "Delivery sotto l'ordine minimo (una salsa da 1 €)",
    attesa: { status: 400, error: "Ordine minimo 15€ di prodotti per la Delivery." },
    body: (slot) => ({
      ...baseDelivery(slot),
      items: [rigaProdotto(FIXTURES.salsaEconomica.id, FIXTURES.salsaEconomica.prezzo)],
    }),
  },
  {
    id: "riga-556",
    descrizione: "birra senza conferma dei 18 anni (in Ritiro: la Delivery cadrebbe prima sull'ordine minimo)",
    attesa: { status: 400, error: "Per ordinare alcolici devi confermare di avere almeno 18 anni." },
    body: (slot) => ({
      ...baseRitiro(slot),
      items: [rigaProdotto(FIXTURES.birra.id, FIXTURES.birra.prezzo)],
      ageConfirmed: false,
    }),
  },
  {
    id: "riga-690",
    descrizione: "Ritiro valido fino in fondo — ⚠️ crea un ordine pending e una sessione Stripe",
    creaOrdine: true,
    // L'url di Stripe cambia a ogni chiamata: il confronto verifica che ci sia
    // un url, non che sia lo stesso.
    attesa: { status: 200, urlPresente: true },
    body: (slot) => baseRitiro(slot),
  },

  // -------------------------------------------------------------------------
  // I TRE CASI DEL GUARD DEI PREZZI (§46 v44, aggiunti il 01/08/2026)
  //
  // Tutti e tre in RITIRO e con L'Egiziano: nessun ordine minimo da superare
  // (§11), nessuna birra, nessuna opzione che sposti il prezzo. Devono fallire
  // per il prezzo e per nient'altro (lezione `ad`: una prova di rifiuto vale
  // solo se è attribuibile), quindi si parte da `baseRitiro` — che arriva al
  // 200 — e si cambia **un campo solo**.
  //
  // ⚠️ Nessuno dei tre crea un ordine: il guard sta prima di ogni scrittura,
  // compresa la riga cliente. È l'opposto del caso 690 qui sopra.
  // -------------------------------------------------------------------------
  {
    id: "guard-prezzo-salito",
    descrizione: "prezzo mostrato più ALTO del reale — il listino si è mosso mentre il cliente guardava",
    attesa: { status: 409, error: "Abbiamo aggiornato il listino, controlla il tuo carrello" },
    // Scritto come `prezzo + 1` e non come "9.00": se un domani il prezzo vero
    // cambiasse, questo resterebbe comunque diverso da quello reale, che è la
    // condizione che il caso vuole provare. Un letterale smetterebbe di
    // provarla nel silenzio più totale.
    // *La differenza da UN CENTESIMO — cioè che il confronto avvenga davvero in
    // centesimi interi e non con una tolleranza — è coperta da
    // `tests/price-guard.test.mjs`, che la esercita sul modulo. Qui serve
    // dimostrare l'INSTRADAMENTO: che la route chiami il guard e ne traduca
    // l'esito in 409.*
    body: (slot) => ({
      ...baseRitiro(slot),
      items: [rigaProdotto(FIXTURES.prodottoSemplice.id, FIXTURES.prodottoSemplice.prezzo + 1)],
    }),
  },
  {
    id: "guard-prezzo-sceso",
    descrizione: "prezzo mostrato più BASSO del reale — §46 v44 punto 5: vale in entrambe le direzioni",
    // ⚠️ Stesso esito del caso qui sopra, e non è una svista: anche un prezzo
    // SCESO ferma il checkout, perché il totale che il cliente pagherebbe
    // sarebbe comunque diverso da quello che ha visto. Chi un domani trovasse
    // "strano" fermare un ribasso sta guardando la regola che questo caso
    // esiste per proteggere.
    attesa: { status: 409, error: "Abbiamo aggiornato il listino, controlla il tuo carrello" },
    body: (slot) => ({
      ...baseRitiro(slot),
      items: [rigaProdotto(FIXTURES.prodottoSemplice.id, FIXTURES.prodottoSemplice.prezzo - 1)],
    }),
  },
  {
    id: "guard-prezzo-assente",
    descrizione: "riga di carrello senza `unitPriceShown` — richiesta malformata, mai un confronto saltato",
    attesa: { status: 400, error: "Si è verificato un problema. Ricarica la pagina e riprova." },
    // ⚠️ La riga si costruisce a mano invece di usare `rigaProdotto`, ed è il
    // punto: il campo dev'essere ASSENTE. È la richiesta costruita a mano che
    // §46 v44 punto 6 vuole fermare — un blocco che si può aggirare omettendo
    // un campo è vero solo per i clienti onesti.
    body: (slot) => ({
      ...baseRitiro(slot),
      items: [{ quantity: 1, ref: { kind: "product", id: FIXTURES.prodottoSemplice.id } }],
    }),
  },
];

export { FIXTURES, CASI };
