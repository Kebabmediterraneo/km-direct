// §46b / §41-45 — test delle validazioni di forma estratte da
// `app/api/checkout/route.js` (tappa 2 di §46, passo 1).
// Esegui con: node tests/checkout-validation.test.mjs   (exit code 0 = tutti PASS)
//
// Cosa dimostra: che il modulo estratto rifiuta e lascia passare **esattamente
// negli stessi casi** della route, con gli stessi messaggi. I messaggi sono
// scritti qui per intero e a mano apposta: se un domani qualcuno li "sistema"
// nel modulo, questo file fallisce invece di lasciar passare una fotografia
// diversa (§46, il riordino non deve cambiare nulla).
//
// ⚠️ Ogni caso dichiara l'esito atteso e lo confronta: una prova che non
// raggiunge il punto che crede di provare è peggio di una prova assente
// (lezione `as`). Per questo si asserisce **il messaggio**, non solo `ok:false`
// — tre uscite diverse della route rispondono lo stesso testo, e un test che
// guardasse solo il verdetto non le distinguerebbe.
import {
  validateCheckoutRequest,
  validateResolvedOrder,
  DELIVERY_MINIMUM_ORDER,
} from "../lib/checkout-validation.js";

let failures = 0;
function assert(cond, msg) {
  console.log(`${cond ? "PASS" : "FAIL"} — ${msg}`);
  if (!cond) failures++;
}

// Orologio fisso: agosto, nessun cambio d'ora fra oggi e domani, quindi i due
// giorni distano esattamente 24 ore. Rome è UTC+2 in questa data, e i valori
// attesi qui sotto sono stati letti eseguendo `computeScheduledDeliveryAt`,
// non dedotti a mente.
const REF = new Date("2026-08-01T10:00:00Z"); // = 12:00 a Roma
const OPZ = { referenceDate: REF };

// Corpo minimo che PASSA, da cui derivare i casi di rifiuto cambiando un
// campo solo: è l'unico modo di ottenere un rifiuto attribuibile (lezione `ad`).
const CLIENTE = { firstName: "Mario", lastName: "Rossi", phone: "3331234567" };
const INDIRIZZO = {
  address: "Via San Mamolo 25",
  houseNumber: "25/A",
  latitude: 44.4855346,
  longitude: 11.3384,
};

function delivery(over = {}, deliveryOver = {}) {
  return {
    items: [{ quantity: 1, ref: { kind: "product", id: "x" } }],
    fulfillment: "delivery",
    delivery: { ...INDIRIZZO, ...deliveryOver },
    customer: { ...CLIENTE },
    privacyAccepted: true,
    ...over,
  };
}

function pickup(over = {}, pickupOver = {}) {
  return {
    items: [{ quantity: 1, ref: { kind: "product", id: "x" } }],
    fulfillment: "pickup",
    pickup: { scheduledDay: "today", scheduledTime: "13:00", ...pickupOver },
    customer: { ...CLIENTE },
    privacyAccepted: true,
    ...over,
  };
}

const err = (res) => res?.body?.error;

// ---------------------------------------------------------------------------
// Prima le due basi che passano: senza queste, ogni rifiuto qui sotto potrebbe
// essere causato dal payload di partenza invece che dal campo cambiato.
// ---------------------------------------------------------------------------

// a) i due percorsi normali passano
{
  const d = validateCheckoutRequest(delivery(), OPZ);
  assert(d.ok === true, "a1) Delivery ASAP completa → passa");
  const p = validateCheckoutRequest(pickup(), OPZ);
  assert(p.ok === true, "a2) Ritiro con giorno e orario validi → passa");
}

// b) carrello vuoto (route 344-346)
{
  assert(
    err(validateCheckoutRequest(delivery({ items: [] }), OPZ)) === "Il carrello è vuoto.",
    "b1) items array vuoto → 'Il carrello è vuoto.'"
  );
  assert(
    err(validateCheckoutRequest(delivery({ items: undefined }), OPZ)) === "Il carrello è vuoto.",
    "b2) items assente → stesso messaggio"
  );
  assert(
    err(validateCheckoutRequest(delivery({ items: "due panini" }), OPZ)) === "Il carrello è vuoto.",
    "b3) items non è un array → stesso messaggio (non un errore diverso)"
  );
  assert(err(validateCheckoutRequest(null, OPZ)) === "Il carrello è vuoto.", "b4) corpo nullo → non solleva, rifiuta");
  assert(err(validateCheckoutRequest(undefined, OPZ)) === "Il carrello è vuoto.", "b5) corpo assente → non solleva, rifiuta");
  assert(validateCheckoutRequest(delivery({ items: [] }), OPZ).status === 400, "b6) lo stato è 400");
}

// c) modalità non valida (route 347-349)
{
  const atteso = "Si è verificato un problema con la modalità scelta. Riprova.";
  assert(err(validateCheckoutRequest(delivery({ fulfillment: "take_away" }), OPZ)) === atteso, "c1) modalità inventata → rifiuto");
  assert(err(validateCheckoutRequest(delivery({ fulfillment: undefined }), OPZ)) === atteso, "c2) modalità assente → rifiuto");
  assert(err(validateCheckoutRequest(delivery({ fulfillment: "Delivery" }), OPZ)) === atteso, "c3) maiuscola diversa → rifiuto (confronto esatto)");
}

// d) contatti obbligatori (route 350-356) — §41-45: nome, cognome, telefono
{
  const atteso = "Controlla di aver compilato nome, cognome e telefono.";
  assert(
    err(validateCheckoutRequest(delivery({ customer: { ...CLIENTE, firstName: "" } }), OPZ)) === atteso,
    "d1) nome vuoto → rifiuto"
  );
  assert(
    err(validateCheckoutRequest(delivery({ customer: { ...CLIENTE, lastName: "" } }), OPZ)) === atteso,
    "d2) cognome vuoto → rifiuto"
  );
  assert(
    err(validateCheckoutRequest(delivery({ customer: { ...CLIENTE, phone: "" } }), OPZ)) === atteso,
    "d3) telefono vuoto → rifiuto"
  );
  assert(
    err(validateCheckoutRequest(delivery({ customer: { ...CLIENTE, firstName: "   " } }), OPZ)) === atteso,
    "d4) nome di soli spazi → rifiuto (il trim conta)"
  );
  assert(
    err(validateCheckoutRequest(delivery({ customer: undefined }), OPZ)) === atteso,
    "d5) cliente assente → rifiuto, non un errore di lettura"
  );
}

// e) privacy (route 357-359) — §36-40: è un atto, si rifà a ogni ordine
{
  const atteso = "Per procedere, accetta l'informativa privacy.";
  assert(err(validateCheckoutRequest(delivery({ privacyAccepted: false }), OPZ)) === atteso, "e1) privacy a false → rifiuto");
  assert(err(validateCheckoutRequest(delivery({ privacyAccepted: undefined }), OPZ)) === atteso, "e2) privacy assente → rifiuto");
}

// f) indirizzo e civico, solo Delivery (route 361-364)
{
  const atteso = "Manca qualche dato dell'indirizzo. Controlla e riprova.";
  assert(err(validateCheckoutRequest(delivery({}, { address: "" }), OPZ)) === atteso, "f1) indirizzo vuoto → rifiuto");
  assert(err(validateCheckoutRequest(delivery({}, { houseNumber: "" }), OPZ)) === atteso, "f2) civico vuoto → rifiuto (§10: il perimetro si decide sul civico)");
  assert(err(validateCheckoutRequest(delivery({}, { houseNumber: "  " }), OPZ)) === atteso, "f3) civico di soli spazi → rifiuto");
  assert(err(validateCheckoutRequest(delivery({ delivery: undefined }), OPZ)) === atteso, "f4) blocco delivery assente → rifiuto");
  assert(
    validateCheckoutRequest(pickup({ delivery: undefined }), OPZ).ok === true,
    "f5) il Ritiro non chiede indirizzo: passa senza"
  );
}

// g) coordinate (route 366-370)
{
  const atteso = "Non siamo riusciti a individuare l'indirizzo. Riprova a inserirlo.";
  assert(err(validateCheckoutRequest(delivery({}, { latitude: undefined }), OPZ)) === atteso, "g1) latitudine assente → rifiuto");
  assert(err(validateCheckoutRequest(delivery({}, { longitude: undefined }), OPZ)) === atteso, "g2) longitudine assente → rifiuto");
  assert(err(validateCheckoutRequest(delivery({}, { latitude: "quarantaquattro" }), OPZ)) === atteso, "g3) testo non convertibile → rifiuto");
  assert(err(validateCheckoutRequest(delivery({}, { latitude: NaN }), OPZ)) === atteso, "g4) NaN → rifiuto");
  assert(err(validateCheckoutRequest(delivery({}, { latitude: Infinity }), OPZ)) === atteso, "g5) Infinity → rifiuto (Number.isFinite, non isNaN)");

  // ⚠️ Comportamento REGISTRATO e volutamente non corretto: `Number()` di
  // null, "" e [] vale 0, cioè una coordinata finita. Questi tre casi
  // PASSANO qui e cadono più avanti sul perimetro (riga 406, "fuori zona").
  // È il caso `riga-406-coordinate-vuote` della fotografia: se un giorno lo
  // si vorrà cambiare, è una decisione da mettere prima in spec, e questi tre
  // test devono fallire per ricordarlo.
  assert(validateCheckoutRequest(delivery({}, { latitude: null }), OPZ).ok === true, "g6) latitudine null → PASSA (Number(null)=0, registrato)");
  assert(validateCheckoutRequest(delivery({}, { latitude: "" }), OPZ).ok === true, "g7) latitudine stringa vuota → PASSA (registrato)");
  assert(validateCheckoutRequest(delivery({}, { latitude: [] }), OPZ).ok === true, "g8) latitudine array vuoto → PASSA (registrato)");
  assert(
    validateCheckoutRequest(delivery({}, { latitude: null }), OPZ).deliveryLatitude === 0,
    "g9) e il valore che prosegue è 0, non null"
  );

  // La route non guarda il tipo: applica Number(). Una stringa numerica passa
  // — è il difetto che ha fatto mancare il bersaglio al caso dell'uscita 369
  // (lezione `as`), qui bloccato perché non torni a sorpresa.
  assert(
    validateCheckoutRequest(delivery({}, { latitude: "44.4855346" }), OPZ).ok === true,
    "g10) stringa numerica → PASSA: il tipo non viene guardato"
  );
}

// h) orario di consegna programmata (route 372-385)
{
  const atteso = "Orario di consegna programmata non valido.";
  const prog = (over) => delivery({}, { timingType: "scheduled", scheduledDay: "today", scheduledTime: "13:00", ...over });

  assert(validateCheckoutRequest(prog(), OPZ).ok === true, "h1) programmata valida → passa");
  assert(err(validateCheckoutRequest(prog({ scheduledDay: "oggi" }), OPZ)) === atteso, "h2) giorno in italiano → rifiuto (solo today/tomorrow)");
  assert(err(validateCheckoutRequest(prog({ scheduledDay: undefined }), OPZ)) === atteso, "h3) giorno assente → rifiuto");
  assert(err(validateCheckoutRequest(prog({ scheduledTime: "24:00" }), OPZ)) === atteso, "h4) 24:00 → rifiuto (la validazione è su due righe, non solo la regex)");
  assert(err(validateCheckoutRequest(prog({ scheduledTime: "12:60" }), OPZ)) === atteso, "h5) 12:60 → rifiuto");
  assert(err(validateCheckoutRequest(prog({ scheduledTime: "1:00" }), OPZ)) === atteso, "h6) ora a una cifra → rifiuto");
  assert(err(validateCheckoutRequest(prog({ scheduledTime: 1300 }), OPZ)) === atteso, "h7) orario numerico → rifiuto");

  // ⚠️ Buco registrato in §46b: la griglia dei quarti d'ora NON è imposta,
  // quindi 12:07 passa. Vero oggi, e va bloccato qui perché il riordino non
  // lo cambi per distrazione — chiuderlo è un lavoro dichiarato, non di
  // passaggio.
  assert(validateCheckoutRequest(prog({ scheduledTime: "12:07" }), OPZ).ok === true, "h8) 12:07 → PASSA (quarti d'ora non imposti, §46b registrato)");

  // ASAP: nessuno dei due rami scrive, il valore resta nullo.
  const asap = validateCheckoutRequest(delivery({}, { timingType: "asap" }), OPZ);
  assert(asap.ok === true && asap.scheduledDeliveryAt === null, "h9) Delivery ASAP → nessun orario calcolato");
  const senzaTiming = validateCheckoutRequest(delivery(), OPZ);
  assert(senzaTiming.scheduledDeliveryAt === null, "h10) timingType assente → trattato come ASAP, orario nullo");
}

// i) orario di ritiro (route 386-394) — §12b: il Ritiro è SEMPRE programmato
{
  const atteso = "Orario di ritiro non valido.";
  assert(err(validateCheckoutRequest(pickup({ pickup: undefined }), OPZ)) === atteso, "i1) blocco pickup assente → rifiuto");
  assert(err(validateCheckoutRequest(pickup({}, { scheduledDay: "oggi" }), OPZ)) === atteso, "i2) giorno non valido → rifiuto");
  assert(err(validateCheckoutRequest(pickup({}, { scheduledTime: "24:00" }), OPZ)) === atteso, "i3) 24:00 → rifiuto");
  assert(
    err(validateCheckoutRequest(pickup({}, { scheduledTime: "13:00" }), OPZ)) === undefined,
    "i4) orario valido → nessun errore"
  );
  // Il messaggio del Ritiro è DIVERSO da quello della Delivery: sono due
  // uscite distinte e non vanno confuse.
  assert(
    err(validateCheckoutRequest(pickup({}, { scheduledDay: "oggi" }), OPZ)) !==
      "Orario di consegna programmata non valido.",
    "i5) il Ritiro non usa il messaggio della Delivery"
  );
}

// j) i valori derivati che le fasi successive della route useranno
{
  const d = validateCheckoutRequest(delivery(), OPZ);
  assert(d.isDelivery === true, "j1) Delivery → isDelivery true");
  assert(d.deliveryLatitude === 44.4855346 && d.deliveryLongitude === 11.3384, "j2) coordinate convertite in numero");

  const p = validateCheckoutRequest(pickup(), OPZ);
  assert(p.isDelivery === false, "j3) Ritiro → isDelivery false");
  assert(p.deliveryLatitude === null && p.deliveryLongitude === null, "j4) Ritiro → coordinate nulle, non 0");

  // Istanti letti eseguendo computeScheduledDeliveryAt con REF, non dedotti.
  assert(
    p.scheduledDeliveryAt instanceof Date && p.scheduledDeliveryAt.toISOString() === "2026-08-01T11:00:00.000Z",
    "j5) ritiro oggi 13:00 (Roma) → 2026-08-01T11:00:00.000Z"
  );
  const domani = validateCheckoutRequest(pickup({}, { scheduledDay: "tomorrow" }), OPZ);
  assert(
    domani.scheduledDeliveryAt.toISOString() === "2026-08-02T11:00:00.000Z",
    "j6) ritiro domani 13:00 → 2026-08-02T11:00:00.000Z"
  );
  assert(
    domani.scheduledDeliveryAt - p.scheduledDeliveryAt === 24 * 3600000,
    "j7) oggi e domani distano 24 ore esatte (agosto, nessun cambio d'ora)"
  );
}

// k) ORDINE dei controlli: un corpo sbagliato in due modi deve produrre il
// messaggio del controllo che nella route viene PRIMA. È ciò che rende un
// rifiuto attribuibile: se l'ordine cambiasse, la fotografia mostrerebbe un
// messaggio diverso a parità di richiesta.
{
  assert(
    err(validateCheckoutRequest(delivery({ items: [], fulfillment: "boh" }), OPZ)) === "Il carrello è vuoto.",
    "k1) carrello vuoto + modalità invalida → vince il carrello (344 prima di 347)"
  );
  assert(
    err(validateCheckoutRequest(delivery({ privacyAccepted: false }, { address: "" }), OPZ)) ===
      "Per procedere, accetta l'informativa privacy.",
    "k2) privacy + indirizzo → vince la privacy (357 prima di 362)"
  );
  assert(
    err(validateCheckoutRequest(delivery({}, { address: "", latitude: "boh" }), OPZ)) ===
      "Manca qualche dato dell'indirizzo. Controlla e riprova.",
    "k3) indirizzo + coordinate → vince l'indirizzo (362 prima di 368)"
  );
  assert(
    err(validateCheckoutRequest(delivery({ customer: undefined, privacyAccepted: false }), OPZ)) ===
      "Controlla di aver compilato nome, cognome e telefono.",
    "k4) contatti + privacy → vincono i contatti (350 prima di 357)"
  );
}

// l) validateResolvedOrder — ordine minimo (route 547-553)
{
  const atteso = `Ordine minimo ${DELIVERY_MINIMUM_ORDER}€ di prodotti per la Delivery.`;
  assert(atteso === "Ordine minimo 15€ di prodotti per la Delivery.", "l1) il messaggio interpolato è quello della route, carattere per carattere");
  assert(
    err(validateResolvedOrder({ isDelivery: true, subtotal: 14.99, hasBeer: false, ageConfirmed: false })) === atteso,
    "l2) Delivery sotto soglia → rifiuto"
  );
  assert(
    validateResolvedOrder({ isDelivery: true, subtotal: 15, hasBeer: false, ageConfirmed: false }).ok === true,
    "l3) esattamente 15 → passa (il confronto è <, non <=)"
  );
  assert(
    validateResolvedOrder({ isDelivery: false, subtotal: 1, hasBeer: false, ageConfirmed: false }).ok === true,
    "l4) il Ritiro non ha minimo (§11): 1€ passa"
  );
  assert(
    validateResolvedOrder({ isDelivery: true, subtotal: 14.99, hasBeer: false, ageConfirmed: false }).status === 400,
    "l5) lo stato è 400"
  );
}

// m) validateResolvedOrder — maggiore età (route 555-560), §33
{
  const atteso = "Per ordinare alcolici devi confermare di avere almeno 18 anni.";
  assert(
    err(validateResolvedOrder({ isDelivery: false, subtotal: 20, hasBeer: true, ageConfirmed: false })) === atteso,
    "m1) birra senza conferma → rifiuto"
  );
  assert(
    validateResolvedOrder({ isDelivery: false, subtotal: 20, hasBeer: true, ageConfirmed: true }).ok === true,
    "m2) birra con conferma → passa"
  );
  assert(
    validateResolvedOrder({ isDelivery: false, subtotal: 20, hasBeer: false, ageConfirmed: false }).ok === true,
    "m3) niente birra e niente conferma → passa"
  );
  // Ordine: il minimo viene prima dei 18 anni (548 prima di 555).
  assert(
    err(validateResolvedOrder({ isDelivery: true, subtotal: 5, hasBeer: true, ageConfirmed: false })) ===
      "Ordine minimo 15€ di prodotti per la Delivery.",
    "m4) sotto soglia + birra senza conferma → vince il minimo"
  );
}

// n) forma del ritorno e purezza
{
  const r = validateCheckoutRequest(delivery({ items: [] }), OPZ);
  assert(r.ok === false && typeof r.status === "number" && typeof r.body === "object", "n1) rifiuto = { ok:false, status, body }");
  assert(Object.keys(r.body).length === 1 && "error" in r.body, "n2) body contiene solo `error`: è il JSON che la route passa a NextResponse");
  assert(!("error" in r), "n3) il messaggio NON sta anche fuori da body: una sola fonte");

  // Nessuna mutazione dell'ingresso: la route continua a usare `body` dopo.
  const corpo = delivery();
  const prima = JSON.stringify(corpo);
  validateCheckoutRequest(corpo, OPZ);
  assert(JSON.stringify(corpo) === prima, "n4) il corpo ricevuto non viene modificato");

  // Determinismo a orologio fissato.
  const a = validateCheckoutRequest(pickup(), OPZ);
  const b = validateCheckoutRequest(pickup(), OPZ);
  assert(
    a.scheduledDeliveryAt.getTime() === b.scheduledDeliveryAt.getTime() && a.isDelivery === b.isDelivery,
    "n5) stesso ingresso + stessa data di riferimento → stesso esito"
  );
}

console.log(failures === 0 ? "\nTUTTI I TEST PASSATI" : `\n${failures} TEST FALLITI`);
process.exitCode = failures === 0 ? 0 : 1;
