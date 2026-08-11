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
// §41-45 (11/08/2026): la frase del telefono storto si importa da dove vive,
// come fa il codice. Una prova che ne tenesse una copia confronterebbe il testo
// vecchio con sé stesso e resterebbe verde mentre il cliente legge altro.
import { PHONE_INVALID_MESSAGE } from "../lib/customer-phone.js";

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

// d-bis) §41-45 (11/08/2026) — LA FORMA DEL TELEFONO, ED È QUI CHE STA LA
// DIFESA. Il sito mostra lo stesso avviso mentre il cliente scrive, ma quella è
// cortesia: una richiesta costruita a mano passa solo di qui.
//
// ⚠️ La regola vive in `lib/customer-phone.js` e questa suite non la riscrive:
// prova che il validatore la CHIAMI e traduca il rifiuto. I casi della regola —
// nove cifre, paesi, spazi — stanno in `tests/customer-phone.test.mjs`.
{
  // ⚠️ La frase si IMPORTA dal modulo, non si ribatte qui: se questa suite ne
  // tenesse una copia, il giorno che la frase cambia le prove resterebbero
  // verdi confrontando il testo vecchio con sé stesso.
  const attesoForma = PHONE_INVALID_MESSAGE;
  const attesoVuoto = "Controlla di aver compilato nome, cognome e telefono.";
  const conTelefono = (phone) => validateCheckoutRequest(delivery({ customer: { ...CLIENTE, phone } }), OPZ);

  assert(
    err(conTelefono("ciao")) === attesoForma,
    '⚠️ d6) "ciao" → RIFIUTATO dal server: prima di oggi passava e arrivava al file del rider come "+39ciao"'
  );
  assert(err(conTelefono("345iii909")) === attesoForma, "d7) lettere in mezzo alle cifre → rifiutato");
  assert(err(conTelefono("111")) === attesoForma, "d8) tre cifre → rifiutato");
  assert(err(conTelefono("33312345678")) === attesoForma, "d9) undici cifre → rifiutato");

  // ⚠️ I NUMERI VERI DEVONO PASSARE, ed è la metà che conta di più: un controllo
  // troppo stretto non fa rumore, fa perdere clienti.
  assert(conTelefono("3331234567").ok === true, "d10) dieci cifre → passa");
  assert(conTelefono("333123456").ok === true, "⚠️ d11) NOVE cifre che iniziano per 3 → passano (correzione di Andrea dell'11/08)");
  assert(conTelefono("051123456").ok === true, "d12) un fisso di nove cifre → passa");
  assert(conTelefono("333 123 4567").ok === true, "d13) e un numero scritto con gli spazi passa: si ripuliscono, non si rifiutano");

  // ⚠️ Il messaggio del campo vuoto NON è cambiato: chi non ha scritto niente
  // si sente dire di compilare, non di controllare quello che non ha scritto.
  assert(err(conTelefono("")) === attesoVuoto, "d14) il campo vuoto dà ancora il messaggio di sempre, non quello nuovo");
  assert(err(conTelefono("   ")) === attesoVuoto, "d15) e così i soli spazi");

  // CONTROPROVA: le due frasi sono davvero diverse? Se coincidessero, d6-d9 e
  // d14 direbbero di sì qualunque cosa succeda.
  assert(attesoForma !== attesoVuoto, "d16) CONTROPROVA: i due messaggi sono distinti, quindi le prove qui sopra distinguono davvero i due casi");

  // -------------------------------------------------------------------------
  // §41-45 (11/08/2026) — IL NUMERO CHE NON PUÒ ESISTERE IN ITALIA.
  //
  // La regola sta in `lib/customer-phone.js` e arriva fin qui **da sé**, perché
  // questo file importa quel modulo: il numero viene rifiutato senza che il
  // validatore sia stato toccato.
  //
  // ⚠️ **d19 È STATA CAPOVOLTA, NON CANCELLATA.** Fino a poche ore fa
  // fotografava un difetto: il numero veniva rifiutato ma il cliente riceveva
  // un messaggio generico invece della frase decisa da Andrea. Ora quella frase
  // arriva, e la stessa prova veglia il verso opposto — che nessuno rimetta il
  // testo vecchio. *Una prova che documenta un difetto non si butta quando il
  // difetto è chiuso: si gira, e continua a lavorare.*
  // -------------------------------------------------------------------------
  assert(conTelefono("1331234567").ok === false, "d17) un numero italiano che inizia per 1 → rifiutato dal server, e la regola è arrivata qui da sé");
  assert(conTelefono("4331234567").ok === false, "d18) come uno che inizia per 4");
  // ⚠️ QUI la frase è scritta per esteso APPOSTA, ed è l'unico punto del
  // progetto in cui lo è oltre alla costante. Confrontarla con
  // `PHONE_INVALID_MESSAGE` — come fa `attesoForma` qui sopra, che verifica
  // un'altra cosa — significherebbe paragonare la costante a sé stessa: la
  // prova resterebbe verde anche se qualcuno riscrivesse il testo deciso da
  // Andrea. *È lo stesso motivo per cui la versione del formato, nella
  // persistenza, si scrive col numero letterale e non con la costante.*
  assert(
    err(conTelefono("1331234567")) ===
      "Controlla il numero, è l'unico modo che abbiamo per contattarti per la consegna",
    "⚠️ d19) e il cliente riceve la frase DECISA, parola per parola — non più il testo generico"
  );
  assert(
    err(conTelefono("ciao")) === err(conTelefono("1331234567")) &&
      err(conTelefono("33312345678")) === err(conTelefono("1331234567")),
    "d19b) ed è la STESSA frase per ogni motivo di rifiuto: lettere, lunghezza, prima cifra"
  );
  // ⚠️ Il testo vecchio non deve sopravvivere da nessuna parte.
  assert(
    err(conTelefono("1331234567")) !== "Controlla il numero di telefono: non sembra un numero valido.",
    "d19c) CONTROPROVA: il messaggio vecchio non torna indietro, e la sonda saprebbe riconoscerlo"
  );
  assert(conTelefono("0511234567").ok === true, "d20) mentre un fisso che inizia per 0 passa, come deve");

  // -------------------------------------------------------------------------
  // §41-45 (11/08/2026, secondo giro) — ⚠️ IL PAESE ARRIVA DAL CORPO DELLA
  // RICHIESTA, ed è `customer.country`.
  //
  // Il sito non lo manda ancora — la tendina dei prefissi è il passo
  // successivo — quindi qui si prova la cosa che conta di più: che l'assenza
  // del paese **non cambi niente**, e che un paese scritto storto non apra una
  // porta invece di chiuderla.
  // -------------------------------------------------------------------------
  const conPaese = (phone, country) =>
    validateCheckoutRequest(delivery({ customer: { ...CLIENTE, phone, country } }), OPZ);

  assert(conPaese("+393331234567", "IT").ok === true, "p1) un numero italiano già composto col prefisso, dichiarato italiano → passa");
  assert(
    err(conPaese("+391331234567", "IT")) === attesoForma,
    "⚠️ p2) mentre lo stesso numero che inizia per 1 → RIFIUTATO anche col +39 davanti: prima il prefisso faceva saltare la regola"
  );
  assert(conPaese("+41791234567", "CH").ok === true, "p3) un numero svizzero dichiarato svizzero → passa");
  assert(
    err(conPaese("+41791234567", "IT")) === attesoForma,
    "p4) lo stesso numero svizzero dichiarato italiano → rifiutato: il prefisso non è quello del paese ricevuto"
  );

  // ⚠️ IL RIPIEGO. Un paese mancante o mai visto vale ITALIA, e la regola
  // italiana arriva fin qui: è ciò che accade oggi e non deve rompersi per una
  // richiesta vecchia.
  assert(conPaese("3331234567", undefined).ok === true, "p5) senza paese, un numero italiano vero passa esattamente come prima");
  assert(
    err(conPaese("791234567", "XX")) === attesoForma,
    "⚠️ p6) con un paese SCONOSCIUTO vale l'Italia, quindi un numero che inizia per 7 viene rifiutato — un country storto non scavalca il controllo"
  );
  assert(conPaese("3331234567", "it").ok === true, "p7) e il codice del paese scritto minuscolo funziona: arriva così da più di un posto");

  // ⚠️ CONTROPROVA: il paese sta davvero arrivando al modulo, o queste prove
  // passerebbero anche se il validatore lo buttasse via? Se lo ignorasse,
  // varrebbe sempre l'Italia — e questo numero svizzero verrebbe rifiutato.
  assert(
    conPaese("+41791234567", "CH").ok === true && err(conPaese("+41791234567", undefined)) === attesoForma,
    "p8) CONTROPROVA: LO STESSO numero passa con paese CH e viene rifiutato senza paese — quindi il paese arriva al modulo, non viene ignorato"
  );
  assert(conTelefono("333123456").ok === true, "d21) e il cellulare di nove cifre pure");
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
