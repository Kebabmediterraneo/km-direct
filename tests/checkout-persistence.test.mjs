// §36-40 (v41, v42) — test del modulo puro di conservazione e ripristino dei
// dati del checkout.
// Esegui: node tests/checkout-persistence.test.mjs   (exit 0 = tutti PASS)
import {
  FORMAT_VERSION,
  DROP_INVALID,
  DROP_ADDRESS_INCOMPLETE,
  prepareCheckout,
  restoreCheckout,
} from "../lib/checkout-persistence.js";

let failures = 0;
function assert(cond, msg) {
  console.log(`${cond ? "PASS" : "FAIL"} — ${msg}`);
  if (!cond) failures++;
}

// Stato del checkout come vive in Home: una Delivery programmata, compilata
// per intero. È la base da cui i casi seguenti si allontanano di un campo alla
// volta, così ogni esito è attribuibile.
const STATO_PIENO = {
  fulfillmentMode: "delivery",
  deliveryAddress: "Via San Mamolo 12, Bologna",
  deliveryAddressDetails: { civico: "12", lat: 44.4869, lng: 11.3426 },
  deliveryDetails: {
    intercom: "Pastore",
    floorInterior: "2",
    buildingStaircase: "B",
    riderNotes: "Citofono rotto, chiamare",
  },
  customerDetails: {
    firstName: "Andrea",
    lastName: "Pastore",
    phone: "3331234567",
    email: "",
  },
  timingType: "scheduled",
  scheduledDay: "tomorrow",
  scheduledTime: "20:15",
  pickupDay: "today",
  pickupTime: null,
  pickupTimeExplicit: false,
  // ⚠️ `giveMeFiveApplied` è rimasto qui APPOSTA dopo la v68, benché il modulo
  // non lo conservi più: è ciò che rende questo stato uguale a quello di un
  // cliente che ha la pagina aperta da prima della rimozione. Toglierlo
  // renderebbe le prove più pulite e più cieche.
  giveMeFiveApplied: true,
  codiceScritto: "GIVEMEFIVE",
};

const dropOf = (dropped, field) => dropped.find((d) => d.field === field);
const hasDrop = (dropped, field) => dropOf(dropped, field) !== undefined;

// a) giro completo: si prepara, si ricostruisce, si ritrova tutto identico
{
  const saved = prepareCheckout(STATO_PIENO);
  const { fields, dropped } = restoreCheckout(saved);

  assert(saved.v === FORMAT_VERSION, "a1) la struttura conservata porta il numero di versione in `v`");
  assert(dropped.length === 0, "a2) round-trip su stato pieno → niente scartato");
  assert(fields.fulfillmentMode === "delivery", "a3) modalità ritrovata");
  assert(fields.deliveryAddress === STATO_PIENO.deliveryAddress, "a4) indirizzo ritrovato");
  assert(
    fields.deliveryAddressDetails.civico === "12" &&
      fields.deliveryAddressDetails.lat === 44.4869 &&
      fields.deliveryAddressDetails.lng === 11.3426,
    "a5) civico e coordinate ritrovati (le coordinate sono parte dell'indirizzo)"
  );
  assert(fields.deliveryDetails.riderNotes === "Citofono rotto, chiamare", "a6) dettagli di consegna ritrovati");
  assert(fields.customerDetails.firstName === "Andrea" && fields.customerDetails.lastName === "Pastore", "a7) nome e cognome ritrovati");
  assert(fields.customerDetails.email === "", "a8) l'email vuota è un valore, non un'assenza");
  assert(fields.timingType === "scheduled" && fields.scheduledDay === "tomorrow" && fields.scheduledTime === "20:15", "a9) momento dell'ordine ritrovato");
  assert(fields.pickupDay === "today" && fields.pickupTime === null, "a10) stato Ritiro ritrovato, orario nullo compreso");
  assert(fields.pickupTimeExplicit === false, "a11) il `false` salvato si ripristina com'è (il ripiego vale solo se manca)");
  // §14 (v68): `giveMeFiveApplied` non si conserva più — il pulsante del
  // carrello che lo accendeva non esiste. Lo `STATO_PIENO` lo porta ancora
  // apposta, per esercitare il caso di chi ha la pagina aperta da prima.
  assert(fields.giveMeFiveApplied === undefined, "a12) il vecchio sì/no dello sconto NON si ripristina più: il pulsante che lo accendeva non c'è");
  assert(fields.codiceScritto === "GIVEMEFIVE", "a13) al suo posto torna il codice SCRITTO, che il server riverificherà");
}

// b) NIENTE CONCLUSIONI, NIENTE IMPORTI, NIENTE CHIAVI ESTRANEE.
//    La struttura conservata contiene esattamente le chiavi previste: è la
//    garanzia meccanica che nulla di non dichiarato attraversi il modulo.
{
  const saved = prepareCheckout({
    ...STATO_PIENO,
    subtotal: 32.5,
    total: 30,
    deliveryFee: 2.5,
    discountAmount: 5,
    geofenceStatus: "inside",
    pickupSlotExpired: false,
    canPay: true,
    qualcosaDiNonPrevisto: "x",
  });

  const attese = [
    "v",
    "fulfillmentMode",
    "deliveryAddress",
    "timingType",
    "scheduledDay",
    "scheduledTime",
    "pickupDay",
    "pickupTime",
    "pickupTimeExplicit",
    "codiceScritto",
    "deliveryAddressDetails",
    "deliveryDetails",
    "customerDetails",
  ].sort();
  const trovate = Object.keys(saved).sort();

  assert(
    trovate.length === attese.length && trovate.every((k, i) => k === attese[i]),
    "b1) la struttura conservata ha esattamente le chiavi dichiarate, nessuna in più"
  );
  assert(saved.subtotal === undefined && saved.total === undefined && saved.deliveryFee === undefined && saved.discountAmount === undefined, "b2) nessun prezzo, nessuna fee, nessun totale (§36-40)");
  // §14 (v68): l'intenzione di sconto non è più un sì/no ma il TESTO battuto
  // dal cliente, e l'importo non si è mai conservato né mai si conserverà.
  assert(
    saved.discountAmount === undefined && saved.giveMeFiveApplied === undefined,
    "b3) né l'importo né il vecchio sì/no dello sconto attraversano il modulo"
  );
  assert(saved.codiceScritto === "GIVEMEFIVE", "b3b) mentre il codice SCRITTO sì: è un dato, non una conclusione");
  assert(saved.geofenceStatus === undefined && saved.pickupSlotExpired === undefined && saved.canPay === undefined, "b4) nessuna conclusione: zona, scadenza slot, pagabilità");
  assert(saved.qualcosaDiNonPrevisto === undefined, "b5) una chiave non dichiarata non attraversa il modulo, nemmeno passandogli l'intera schermata");
}

// b-bis) la stessa garanzia sui due gruppi annidati
{
  const saved = prepareCheckout({
    deliveryDetails: { intercom: "Pastore", extra: "non dichiarato" },
    customerDetails: { firstName: "Andrea", extra: "non dichiarato" },
  });
  assert(saved.deliveryDetails.extra === undefined && saved.deliveryDetails.intercom === "Pastore", "b6) dettagli di consegna: copiate solo le chiavi dichiarate");
  assert(saved.customerDetails.extra === undefined && saved.customerDetails.firstName === "Andrea", "b7) contatti: copiate solo le chiavi dichiarate");
}

// c) REGOLA 1 — versione sconosciuta o struttura illeggibile: si scarta tutto
{
  const saved = prepareCheckout(STATO_PIENO);

  const altraVersione = restoreCheckout({ ...saved, v: FORMAT_VERSION + 1 });
  assert(Object.keys(altraVersione.fields).length === 0, "c1) versione più alta → nessun campo ripristinato");
  assert(altraVersione.dropped.length === 0, "c2) versione più alta → nessuno scarto da raccontare, si riparte da vuoto");

  assert(Object.keys(restoreCheckout({ ...saved, v: 0 }).fields).length === 0, "c3) versione più bassa → tutto scartato");
  assert(Object.keys(restoreCheckout({ ...saved, v: "1" }).fields).length === 0, "c4) versione di tipo sbagliato → tutto scartato");
  assert(Object.keys(restoreCheckout({ ...saved, v: undefined }).fields).length === 0, "c5) versione assente → tutto scartato");

  for (const [nome, valore] of [
    ["null", null],
    ["undefined", undefined],
    ["stringa", "manomesso"],
    ["numero", 7],
    ["array", [1, 2]],
  ]) {
    const res = restoreCheckout(valore);
    assert(
      Object.keys(res.fields).length === 0 && res.dropped.length === 0,
      `c6) struttura illeggibile (${nome}) → vuoto, senza errori`
    );
  }
}

// c-bis) scartare tutto significa DAVVERO tutto: nemmeno i valori di ripiego
{
  const res = restoreCheckout({ v: 99, pickupTimeExplicit: true, giveMeFiveApplied: true });
  assert(res.fields.pickupTimeExplicit === undefined, "c7) versione ignota → nemmeno il ripiego di pickupTimeExplicit");
  assert(res.fields.giveMeFiveApplied === undefined, "c8) versione ignota → nemmeno il ripiego di giveMeFiveApplied");
}

// d) REGOLA 2 — campo per campo: il leggibile si tiene, l'illeggibile si
//    scarta e si registra, senza trascinare i vicini
{
  const { fields, dropped } = restoreCheckout({
    v: FORMAT_VERSION,
    fulfillmentMode: "pickup",
    timingType: 42,
    scheduledDay: "today",
    pickupDay: { non: "una stringa" },
  });

  assert(fields.fulfillmentMode === "pickup", "d1) campo valido tenuto");
  assert(fields.timingType === undefined && hasDrop(dropped, "timingType"), "d2) campo di tipo sbagliato scartato e registrato");
  assert(fields.scheduledDay === "today", "d3) il campo accanto a uno scartato resta");
  assert(fields.pickupDay === undefined && hasDrop(dropped, "pickupDay"), "d4) oggetto al posto di una stringa → scartato");
  assert(dropOf(dropped, "timingType").reason === DROP_INVALID, "d5) il motivo dello scarto è il codice previsto");
}

// d-bis) l'assenza NON è uno scarto: non c'era nulla da scartare
{
  const { fields, dropped } = restoreCheckout({ v: FORMAT_VERSION, fulfillmentMode: "delivery" });
  assert(fields.fulfillmentMode === "delivery", "d6) l'unico campo salvato si ripristina");
  assert(dropped.length === 0, "d7) i campi mai salvati non compaiono fra gli scartati");
  assert(fields.deliveryAddress === undefined && fields.customerDetails === undefined, "d8) `fields` è parziale: contiene solo ciò che c'era");
}

// d-ter) i gruppi di caselle si ripristinano casella per casella
{
  const { fields, dropped } = restoreCheckout({
    v: FORMAT_VERSION,
    customerDetails: { firstName: "Andrea", lastName: 7, phone: "3331234567" },
    deliveryDetails: "manomesso",
  });

  assert(fields.customerDetails.firstName === "Andrea" && fields.customerDetails.phone === "3331234567", "d9) le caselle leggibili del gruppo restano");
  assert(fields.customerDetails.lastName === undefined && hasDrop(dropped, "customerDetails.lastName"), "d10) una casella illeggibile non trascina il gruppo, ed è registrata col suo nome");
  assert(fields.deliveryDetails === undefined && hasDrop(dropped, "deliveryDetails"), "d11) gruppo che non è un oggetto → scartato per intero");
}

// e) REGOLA 3 — ⚠️ L'INDIRIZZO È INDIVISIBILE: tutti insieme o per niente.
//    Ogni modo in cui può rompersi, uno per uno.
{
  const INDIRIZZO = "Via San Mamolo 12, Bologna";
  const DETTAGLI = { civico: "12", lat: 44.4869, lng: 11.3426 };

  const casi = [
    ["indirizzo senza dettagli", { deliveryAddress: INDIRIZZO }],
    ["indirizzo con dettagli null", { deliveryAddress: INDIRIZZO, deliveryAddressDetails: null }],
    ["dettagli senza indirizzo", { deliveryAddressDetails: DETTAGLI }],
    ["dettagli con indirizzo vuoto", { deliveryAddress: "", deliveryAddressDetails: DETTAGLI }],
    ["dettagli con indirizzo di soli spazi", { deliveryAddress: "   ", deliveryAddressDetails: DETTAGLI }],
    ["indirizzo non stringa", { deliveryAddress: 12, deliveryAddressDetails: DETTAGLI }],
    ["lat non numerica", { deliveryAddress: INDIRIZZO, deliveryAddressDetails: { ...DETTAGLI, lat: "44.4869" } }],
    ["lng non numerica", { deliveryAddress: INDIRIZZO, deliveryAddressDetails: { ...DETTAGLI, lng: null } }],
    ["lat assente", { deliveryAddress: INDIRIZZO, deliveryAddressDetails: { civico: "12", lng: 11.3426 } }],
    ["lng assente", { deliveryAddress: INDIRIZZO, deliveryAddressDetails: { civico: "12", lat: 44.4869 } }],
    ["lat e lng assenti", { deliveryAddress: INDIRIZZO, deliveryAddressDetails: { civico: "12" } }],
    ["lat NaN", { deliveryAddress: INDIRIZZO, deliveryAddressDetails: { ...DETTAGLI, lat: NaN } }],
    ["lng infinita", { deliveryAddress: INDIRIZZO, deliveryAddressDetails: { ...DETTAGLI, lng: Infinity } }],
    ["civico non stringa", { deliveryAddress: INDIRIZZO, deliveryAddressDetails: { ...DETTAGLI, civico: 12 } }],
    ["civico assente", { deliveryAddress: INDIRIZZO, deliveryAddressDetails: { lat: 44.4869, lng: 11.3426 } }],
    ["dettagli non oggetto", { deliveryAddress: INDIRIZZO, deliveryAddressDetails: "12" }],
  ];

  for (const [nome, pezzo] of casi) {
    const { fields, dropped } = restoreCheckout({ v: FORMAT_VERSION, ...pezzo });
    const nessunPezzo =
      fields.deliveryAddress === undefined && fields.deliveryAddressDetails === undefined;
    assert(
      nessunPezzo && dropOf(dropped, "address")?.reason === DROP_ADDRESS_INCOMPLETE,
      `e) indirizzo indivisibile — ${nome} → scartato tutto, mai un pezzo`
    );
  }
}

// e-bis) l'indirizzo completo passa, e il civico vuoto è uno stato legittimo
//        (indirizzo scelto senza numero: il sito avvisa e blocca, §41-45)
{
  const { fields, dropped } = restoreCheckout({
    v: FORMAT_VERSION,
    deliveryAddress: "Piazza Maggiore, Bologna",
    deliveryAddressDetails: { civico: "", lat: 44.4938, lng: 11.3426 },
  });
  assert(fields.deliveryAddress === "Piazza Maggiore, Bologna", "e17) indirizzo completo ripristinato");
  assert(fields.deliveryAddressDetails.civico === "", "e18) civico vuoto conservato: è uno stato reale, non una struttura rotta");
  assert(dropped.length === 0, "e19) civico vuoto non è uno scarto");
}

// e-ter) indirizzo mai inserito: non è uno scarto, semplicemente non c'era
{
  const a = restoreCheckout({ v: FORMAT_VERSION, fulfillmentMode: "pickup" });
  assert(!hasDrop(a.dropped, "address"), "e20) nessun dato di indirizzo → nessuno scarto");

  const b = restoreCheckout({ v: FORMAT_VERSION, deliveryAddress: "", deliveryAddressDetails: null });
  assert(!hasDrop(b.dropped, "address"), "e21) indirizzo vuoto e dettagli nulli (stato iniziale) → nessuno scarto");
}

// e-quater) le coordinate non si ripristinano MAI senza il loro indirizzo:
//           un punto senza indirizzo sarebbe invisibile al cliente
{
  const { fields } = restoreCheckout({
    v: FORMAT_VERSION,
    deliveryAddressDetails: { civico: "12", lat: 44.4869, lng: 11.3426 },
  });
  assert(fields.deliveryAddressDetails === undefined, "e22) coordinate senza indirizzo → scartate");
}

// f) REGOLA 4 — pickupTimeExplicit: nel dubbio "scelto dal cliente"
{
  const assente = restoreCheckout({ v: FORMAT_VERSION, pickupTime: "12:30" });
  assert(assente.fields.pickupTimeExplicit === true, "f1) assente → true (direzione prudente: mai spostare un orario di nascosto)");
  assert(!hasDrop(assente.dropped, "pickupTimeExplicit"), "f2) assente non è uno scarto");

  const sbagliato = restoreCheckout({ v: FORMAT_VERSION, pickupTimeExplicit: "sì" });
  assert(sbagliato.fields.pickupTimeExplicit === true, "f3) non booleano → true");
  assert(hasDrop(sbagliato.dropped, "pickupTimeExplicit"), "f4) non booleano → registrato fra gli scartati (c'era ed era sbagliato)");

  assert(restoreCheckout({ v: FORMAT_VERSION, pickupTimeExplicit: false }).fields.pickupTimeExplicit === false, "f5) false salvato → false (non lo si sovrascrive col ripiego)");
  assert(restoreCheckout({ v: FORMAT_VERSION, pickupTimeExplicit: 0 }).fields.pickupTimeExplicit === true, "f6) 0 non è false: non booleano → ripiego prudente");
}

// g) REGOLA 5 — liste chiuse e forma dell'orario
{
  assert(restoreCheckout({ v: FORMAT_VERSION, fulfillmentMode: "ritiro" }).fields.fulfillmentMode === undefined, "g1) modalità fuori lista → scartata");
  assert(restoreCheckout({ v: FORMAT_VERSION, timingType: "programmato" }).fields.timingType === undefined, "g2) timingType fuori lista → scartato");
  assert(restoreCheckout({ v: FORMAT_VERSION, scheduledDay: "dopodomani" }).fields.scheduledDay === undefined, "g3) giorno fuori lista → scartato");
  assert(restoreCheckout({ v: FORMAT_VERSION, pickupDay: "domani" }).fields.pickupDay === undefined, "g4) giorno in italiano → scartato (la lista è today/tomorrow)");
  assert(restoreCheckout({ v: FORMAT_VERSION, timingType: "asap" }).fields.timingType === "asap", "g5) asap è ammesso");

  const orariBuoni = ["00:00", "09:15", "12:07", "23:59"];
  for (const t of orariBuoni) {
    assert(restoreCheckout({ v: FORMAT_VERSION, pickupTime: t }).fields.pickupTime === t, `g6) orario di forma valida accettato — ${t}`);
  }
  assert(restoreCheckout({ v: FORMAT_VERSION, pickupTime: "12:07" }).fields.pickupTime === "12:07", "g7) i quarti d'ora NON si controllano qui: 12:07 passa la forma");

  const orariRotti = ["9:00", "12:5", "24:00", "12:60", "12.30", "12:30:00", "", "  12:30", 1230, true, {}];
  for (const t of orariRotti) {
    const { fields, dropped } = restoreCheckout({ v: FORMAT_VERSION, scheduledTime: t });
    assert(fields.scheduledTime === undefined && hasDrop(dropped, "scheduledTime"), `g8) orario di forma non valida scartato — ${JSON.stringify(t)}`);
  }

  const nullo = restoreCheckout({ v: FORMAT_VERSION, scheduledTime: null, pickupTime: null });
  assert(nullo.fields.scheduledTime === null && nullo.fields.pickupTime === null, "g9) null è un valore ammesso: nessun orario scelto");
  assert(nullo.dropped.length === 0, "g10) null non è uno scarto");
}

// h) §14 (v68) — LA CHIAVE VECCHIA DELLO SCONTO VIENE IGNORATA, NON SCARTATA.
//
// ⚠️ Qui c'erano sei prove sul ripiego prudente di `giveMeFiveApplied`. Non
// sono state cancellate perché "non servivano più": sono state **capovolte**,
// perché la cosa da sorvegliare è cambiata. Prima si vegliava che nel dubbio
// non si regalasse uno sconto; ora si veglia che una chiave rimasta nelle
// strutture già conservate non faccia danni a chi ha la pagina aperta.
{
  const vecchia = { v: 1, giveMeFiveApplied: true, pickupTimeExplicit: false };
  const { fields, dropped } = restoreCheckout(vecchia);

  assert(fields.giveMeFiveApplied === undefined, "h1) la chiave vecchia non si ripristina: il pulsante che l'accendeva non esiste più");
  assert(!hasDrop(dropped, "giveMeFiveApplied"), "h2) e non viene nemmeno registrata fra gli scarti: è ignorata, non rifiutata");
  assert(dropped.length === 0, `h3) una struttura vecchia con quella chiave dentro non produce ALCUNO scarto (ne ha ${dropped.length})`);
  assert(fields.pickupTimeExplicit === false, "h4) e tutto il resto della struttura vecchia si ripristina normalmente");

  // Nemmeno un valore malformato la fa rientrare da una porta di servizio.
  const malformata = restoreCheckout({ v: 1, giveMeFiveApplied: "true" });
  assert(malformata.fields.giveMeFiveApplied === undefined, "h5) e nemmeno un valore sbagliato la fa ricomparire");
  assert(malformata.dropped.length === 0, "h6) né la fa contare come errore");

  // ⚠️ CONTROPROVA: la sonda degli scarti sa ancora dire di sì? Se non lo
  // facesse, h3) e h6) sarebbero due zeri che non hanno guardato niente.
  const conErroreVero = restoreCheckout({ v: 1, pickupDay: "lunedì" });
  assert(
    conErroreVero.dropped.length === 1,
    `h7) CONTROPROVA: su un campo davvero illeggibile la stessa sonda conta uno scarto (ne conta ${conErroreVero.dropped.length})`
  );
}

// i) il modulo non tocca ciò che riceve né restituisce riferimenti condivisi
{
  const stato = JSON.parse(JSON.stringify(STATO_PIENO));
  const saved = prepareCheckout(stato);
  const { fields } = restoreCheckout(saved);

  assert(saved.deliveryAddressDetails !== stato.deliveryAddressDetails, "i1) la struttura conservata non riusa l'oggetto dello stato");
  assert(fields.deliveryAddressDetails !== saved.deliveryAddressDetails, "i2) i campi ripristinati non riusano l'oggetto conservato");
  assert(fields.customerDetails !== saved.customerDetails, "i3) idem per i contatti");

  fields.customerDetails.firstName = "Altro";
  assert(stato.customerDetails.firstName === "Andrea", "i4) modificare l'esito non modifica lo stato di partenza");
}

// j) uno stato appena aperto (tutto vuoto) attraversa il giro senza scarti
{
  const vuoto = {
    fulfillmentMode: "delivery",
    deliveryAddress: "",
    deliveryAddressDetails: null,
    deliveryDetails: { intercom: "", floorInterior: "", buildingStaircase: "", riderNotes: "" },
    customerDetails: { firstName: "", lastName: "", phone: "", email: "" },
    timingType: "asap",
    scheduledDay: "today",
    scheduledTime: null,
    pickupDay: "today",
    pickupTime: null,
    pickupTimeExplicit: false,
    giveMeFiveApplied: false,
  };
  const { fields, dropped } = restoreCheckout(prepareCheckout(vuoto));
  assert(dropped.length === 0, "j1) stato iniziale → nessuno scarto");
  assert(fields.deliveryAddress === undefined, "j2) indirizzo vuoto non si ripristina: non c'era nulla da ripristinare");
  assert(fields.customerDetails.firstName === "" && fields.deliveryDetails.intercom === "", "j3) le caselle vuote restano valori validi");
}

// k) prepareCheckout regge un ingresso non plausibile senza esplodere
{
  for (const [nome, valore] of [["null", null], ["undefined", undefined], ["stringa", "x"], ["numero", 3]]) {
    const saved = prepareCheckout(valore);
    assert(saved.v === FORMAT_VERSION && Object.keys(saved).length === 1, `k) ingresso non plausibile (${nome}) → sola versione, nessun campo`);
  }
}

// ---------------------------------------------------------------------------
// l) §14 (v68) — IL CODICE SCONTO SCRITTO NELLA CASELLA.
//
// Si conserva ciò che il cliente ha BATTUTO. L'esito della verifica no: è una
// conclusione, e questo modulo dichiara di non conservarne mai.
// ---------------------------------------------------------------------------
{
  // ⚠️ LA PROVA CHE PROTEGGE CHI STA ORDINANDO IN QUESTO MOMENTO: una struttura
  // conservata PRIMA della v68 non ha la chiave nuova. Deve ripristinarsi
  // intera e senza scarti — se `FORMAT_VERSION` fosse stata alzata, o se
  // l'assenza contasse come errore, il checkout di chi ha la pagina aperta
  // verrebbe buttato via: indirizzo, contatti e orario, per una chiave in più.
  // ⚠️ La versione si scrive col NUMERO LETTERALE, non con la costante
  // importata: usando la costante questa prova seguirebbe qualunque cambio e
  // non potrebbe più fallire — direbbe sempre di sì. È **1** che sta scritto
  // nelle strutture conservate dai clienti che hanno la pagina aperta adesso.
  assert(
    FORMAT_VERSION === 1,
    `l0) FORMAT_VERSION vale ancora 1: alzarla butterebbe via il checkout già conservato di chi sta ordinando (vale ${FORMAT_VERSION})`
  );

  const vecchia = prepareCheckout(STATO_PIENO);
  delete vecchia.codiceScritto;
  vecchia.v = 1;
  assert(
    vecchia.codiceScritto === undefined,
    "l1) la struttura 'vecchia' è davvero senza la chiave nuova (senza, le prove qui sotto non proverebbero niente)"
  );

  const ripristinata = restoreCheckout(vecchia);
  assert(ripristinata.dropped.length === 0, `l2) struttura conservata prima della v68 → ZERO scarti (ne ha ${ripristinata.dropped.length})`);
  assert(ripristinata.fields.codiceScritto === undefined, "l3) e il codice semplicemente non si ripristina: l'assenza non è un errore");
  assert(
    ripristinata.fields.deliveryAddress === STATO_PIENO.deliveryAddress &&
      ripristinata.fields.customerDetails.phone === STATO_PIENO.customerDetails.phone &&
      ripristinata.fields.scheduledTime === "20:15",
    "l4) mentre tutto il resto torna intero: indirizzo, telefono e orario"
  );

  // Il giro normale: si conserva e si ritrova.
  const conCodice = prepareCheckout({ ...STATO_PIENO, codiceScritto: "GIVEMEFIVE" });
  assert(conCodice.codiceScritto === "GIVEMEFIVE", "l5) il codice scritto si conserva");
  assert(restoreCheckout(conCodice).fields.codiceScritto === "GIVEMEFIVE", "l6) e si ripristina identico");

  // ⚠️ L'ESITO NON PASSA. `codiceApplicato` non è nella lista chiusa, quindi non
  // attraversa il modulo nemmeno se glielo si passa esplicitamente — è la
  // stessa difesa per costruzione dei tre consensi.
  const conEsito = prepareCheckout({
    ...STATO_PIENO,
    codiceScritto: "GIVEMEFIVE",
    codiceApplicato: true,
  });
  assert(conEsito.codiceApplicato === undefined, "l7) 'codiceApplicato' NON si conserva: è una conclusione, non un dato scritto");
  assert(conEsito.codiceScritto === "GIVEMEFIVE", "l8) e nello stesso giro il codice scritto invece c'è: la lista chiusa distingue i due");
  assert(restoreCheckout(conEsito).fields.codiceApplicato === undefined, "l9) e non ricompare nemmeno al ripristino");

  // Non stringa → scartato col suo motivo, e la casella resta vuota.
  const sbagliato = restoreCheckout({ v: FORMAT_VERSION, codiceScritto: 5 });
  assert(sbagliato.fields.codiceScritto === undefined, "l10) codice non stringa → non si ripristina");
  assert(
    dropOf(sbagliato.dropped, "codiceScritto")?.reason === DROP_INVALID,
    `l11) e viene registrato fra gli scartati col motivo giusto (${dropOf(sbagliato.dropped, "codiceScritto")?.reason})`
  );
  assert(
    restoreCheckout({ v: FORMAT_VERSION, codiceScritto: { testo: "GIVEMEFIVE" } }).fields.codiceScritto === undefined,
    "l12) e nemmeno una struttura al posto del testo passa"
  );

  // La casella vuota è un valore vero, non un errore: il cliente ha cancellato
  // quello che aveva scritto.
  const vuoto = restoreCheckout({ v: FORMAT_VERSION, codiceScritto: "" });
  assert(vuoto.fields.codiceScritto === "" && vuoto.dropped.length === 0, "l13) casella svuotata dal cliente → si conserva vuota, senza scarti");

  // ⚠️ CONTROPROVA: queste sonde sanno dire di no? Si sporca di proposito il
  // valore atteso e si verifica che il confronto cambi esito. Senza, "zero
  // scarti" e "il codice torna" potrebbero essere veri per caso.
  const controprova1 = restoreCheckout({ v: FORMAT_VERSION, codiceScritto: 5 }).dropped.length;
  assert(controprova1 > 0, `l14) CONTROPROVA: su un valore illeggibile la sonda degli scarti NON dice zero (dice ${controprova1})`);
  assert(
    restoreCheckout(conCodice).fields.codiceScritto !== "SCONTO10",
    "l15) CONTROPROVA: la sonda del ripristino confronta il valore vero, non passa con un codice qualunque"
  );
}

console.log(failures === 0 ? "\nTUTTI I TEST PASSATI" : `\n${failures} TEST FALLITI`);
process.exitCode = failures === 0 ? 0 : 1;
