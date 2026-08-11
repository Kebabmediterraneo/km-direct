// §36-40 (v41, v42) — conservazione e ripristino dei DATI DEL CHECKOUT per la
// durata della visita. Modulo gemello di `lib/cart-persistence.js` e scritto
// sulla sua stessa forma, ma **separato di proposito**: il carrello si
// *ricostruisce* da un catalogo fresco, il checkout si *rilegge e basta*.
//
// Puro e senza dipendenze: nessun browser, nessun React, nessun database,
// nessuna rete. A differenza del gemello non importa nemmeno `menu-pricing`:
// qui non si calcola niente. Leggere e scrivere la memoria della scheda è
// compito dell'integrazione, non di questo file.
//
// Due responsabilità:
//  - prepareCheckout(state): dallo stato del checkout produce la struttura da
//    conservare — solo ciò che il cliente ha SCRITTO o SCELTO, più un numero
//    di versione del formato.
//  - restoreCheckout(persisted): dalla struttura conservata produce i campi
//    ripristinabili e l'elenco di ciò che è stato scartato, con il motivo.
//
// ⚠️ **QUESTO MODULO NON SA NULLA DEI TRE CONSENSI** (§36-40 v39), e non deve
// impararlo: sono ATTI e si rifanno a ogni giro, quindi vivono nello stato
// locale del checkout, dove si azzerano da soli. La garanzia qui non è la
// buona volontà di chi scrive: `prepareCheckout` **non fa mai lo spread dello
// stato**, copia una lista chiusa di chiavi dichiarate qui sotto. Una chiave
// che non è in quella lista non può attraversare il modulo nemmeno se le
// venisse passata l'intera schermata.
//
// ⚠️ **Non si conserva nessuna CONCLUSIONE** (§36-40): nessun prezzo, nessun
// totale, nessuno sconto calcolato, nessun esito del controllo di zona,
// nessun giudizio sulla disponibilità di uno slot. Per lo stesso motivo il
// modulo **non verifica la zona e non giudica gli orari**: non conosce
// `isPointInPolygon` né `classifyPickupSelection`. Chi ripristina non
// conclude; concludere tocca a chi ha i dati di rete, e solo dopo che sono
// arrivati (§36-40 v42, "finché non si sa, non si risponde").

// Numero di versione del formato conservato, con la stessa convenzione del
// carrello: scritto nella struttura come chiave `v`, e una `v` diversa fa
// scartare tutto. È **indipendente** da quello di `cart-persistence`: le due
// strutture cambiano forma per ragioni diverse e in momenti diversi.
const FORMAT_VERSION = 1;

// Motivi con cui un campo può essere scartato. Sono **codici interni**, non
// testo per il cliente — ed è l'unica differenza voluta rispetto al gemello,
// dove i motivi sono frasi in italiano perché compongono l'avviso sugli
// articoli tolti. Qui non c'è alcun avviso da comporre: §36-40 v42 tratta i
// campi scartati come "caselle che il cliente ha davanti e può correggere",
// quindi questo elenco serve a chi sviluppa, non a chi ordina.
const DROP_INVALID = "valore-non-leggibile";
const DROP_ADDRESS_INCOMPLETE = "indirizzo-incompleto";

// Valori ammessi. Fuori da questi elenchi il campo è "non leggibile" e va
// scartato: sono scelte a lista chiusa, non testo libero.
const FULFILLMENT_MODES = ["delivery", "pickup"];
const TIMING_TYPES = ["asap", "scheduled"];
const DAYS = ["today", "tomorrow"];

// Le due liste chiuse di sotto-campi. Sono anche la ragione per cui i consensi
// non possono entrare: si copia da qui, mai dall'oggetto di partenza.
const DELIVERY_DETAIL_KEYS = ["intercom", "floorInterior", "buildingStaircase", "riderNotes"];
const CUSTOMER_DETAIL_KEYS = ["firstName", "lastName", "phone", "email"];

// Campi scalari conservati alla lettera. Anche questa è una lista chiusa.
const SCALAR_KEYS = [
  "fulfillmentMode",
  "deliveryAddress",
  "timingType",
  "scheduledDay",
  "scheduledTime",
  "pickupDay",
  "pickupTime",
  "pickupTimeExplicit",
  // §14 (v68) — ⚠️ `giveMeFiveApplied` NON È PIÙ IN QUESTA LISTA: il pulsante
  // del carrello che lo accendeva non esiste più, quindi non c'è più niente da
  // conservare. Al suo posto c'è `codiceScritto` qui sotto.
  //
  // ⚠️ Una struttura conservata PRIMA di questa rimozione porta ancora quella
  // chiave: viene semplicemente **ignorata**, perché `prepareCheckout` copia da
  // questa lista e `restoreCheckout` legge solo ciò che nomina. Non è uno
  // scarto e non fa perdere nient'altro — c'è una prova che lo verifica su una
  // struttura vecchia intera.
  // §14 (v68) — IL CODICE SCONTO SCRITTO NELLA CASELLA DEL CHECKOUT.
  //
  // ⚠️ Si conserva ciò che il cliente ha BATTUTO, non l'esito. `codiceApplicato`
  // è una CONCLUSIONE — l'ha stabilita il server, guardando chi è il cliente e
  // quanto vale il carrello — e questo modulo dichiara in cima di non
  // conservarne mai nessuna. Un "applicato" ripristinato mostrerebbe uno sconto
  // che nessuno ha appena verificato, cioè esattamente il difetto che §14
  // chiude: il sito promette prima di sapere a chi sta promettendo.
  //
  // Chi ripristina questa stringa deve **richiedere la verifica da capo**. Qui
  // non c'è nulla che lo imponga, ed è il limite di questo modulo: non conosce
  // la rete e non può controllare chi lo usa (§36-40, "concludere tocca a chi
  // ha i dati di rete").
  //
  // ⚠️ `FORMAT_VERSION` NON è stata alzata, ed è una decisione: alzarla farebbe
  // scartare per intero il checkout già conservato di chi sta ordinando in
  // questo momento — indirizzo, contatti, orario — per una chiave in più. Una
  // chiave nuova assente in una struttura vecchia semplicemente non si
  // ripristina, che è il comportamento voluto e ha la sua prova.
  "codiceScritto",
];

const isObject = (v) => !!v && typeof v === "object" && !Array.isArray(v);
const isString = (v) => typeof v === "string";
const isBoolean = (v) => typeof v === "boolean";
const isFiniteNumber = (v) => typeof v === "number" && Number.isFinite(v);

// Forma di un orario: "HH:MM" a due cifre, ore 00-23 e minuti 00-59. È la
// stessa accettazione di `computeScheduledDeliveryAt` (lib/scheduled-slots.js),
// che è chi trasformerà davvero quell'orario in un istante.
//
// ⚠️ **Solo la forma.** Non si controlla che cada su un quarto d'ora, né che
// sia ancora disponibile, né che il locale sia aperto: sono giudizi che
// richiedono dati di rete e non appartengono a questo modulo.
function isTimeShape(v) {
  if (!isString(v) || !/^\d{2}:\d{2}$/.test(v)) return false;
  const [hour, minute] = v.split(":").map(Number);
  return hour <= 23 && minute <= 59;
}

// ---------------------------------------------------------------------------
// PREPARAZIONE
// ---------------------------------------------------------------------------

// Copia i soli sotto-campi dichiarati, saltando quelli assenti. Il valore non
// viene giudicato qui: la validazione vive tutta nel ripristino, come nel
// gemello, dove `prepareCart` è sottile e `restoreCart` è severo.
function pickKnownKeys(source, keys) {
  const out = {};
  if (!isObject(source)) return out;
  for (const key of keys) {
    if (source[key] !== undefined) out[key] = source[key];
  }
  return out;
}

// Dallo stato del checkout alla struttura da conservare. Copia **solo** le
// chiavi delle tre liste chiuse qui sopra: mai uno spread, mai una chiave
// arrivata dal chiamante. `undefined` non si conserva; `null` sì, perché per
// `scheduledTime`, `pickupTime` e `deliveryAddressDetails` è un valore vero
// ("nessuna scelta", "nessun indirizzo") e non l'assenza del campo.
function prepareCheckout(state) {
  const source = isObject(state) ? state : {};
  const out = { v: FORMAT_VERSION };

  for (const key of SCALAR_KEYS) {
    if (source[key] !== undefined) out[key] = source[key];
  }

  // Le coordinate viaggiano con l'indirizzo (§36-40 v39): sono parte del dato
  // scelto dal cliente, non una conclusione. Ciò che è una conclusione — se
  // quel punto sia dentro il perimetro — non si conserva e si ricontrolla.
  const details = source.deliveryAddressDetails;
  if (details === null) {
    out.deliveryAddressDetails = null;
  } else if (details !== undefined) {
    out.deliveryAddressDetails = pickKnownKeys(details, ["civico", "lat", "lng"]);
  }

  if (source.deliveryDetails !== undefined) {
    out.deliveryDetails = pickKnownKeys(source.deliveryDetails, DELIVERY_DETAIL_KEYS);
  }
  if (source.customerDetails !== undefined) {
    out.customerDetails = pickKnownKeys(source.customerDetails, CUSTOMER_DETAIL_KEYS);
  }

  return out;
}

// ---------------------------------------------------------------------------
// RIPRISTINO
// ---------------------------------------------------------------------------

// Un campo si registra fra gli scartati solo se **c'era ed era sbagliato**.
// L'assenza non è uno scarto: non c'era nulla da scartare, e il campo resta
// semplicemente vuoto come all'apertura.
function restoreValue(persisted, key, isValid, fields, dropped) {
  const value = persisted[key];
  if (value === undefined) return;
  if (isValid(value)) fields[key] = value;
  else dropped.push({ field: key, reason: DROP_INVALID });
}

// Gruppo di caselle di testo (dettagli di consegna, contatti). Il gruppo si
// ripristina campo per campo: una casella illeggibile non trascina le altre.
function restoreStringGroup(persisted, key, keys, fields, dropped) {
  const source = persisted[key];
  if (source === undefined) return;
  if (!isObject(source)) {
    dropped.push({ field: key, reason: DROP_INVALID });
    return;
  }
  const out = {};
  for (const sub of keys) {
    const value = source[sub];
    if (value === undefined) continue;
    if (isString(value)) out[sub] = value;
    else dropped.push({ field: `${key}.${sub}`, reason: DROP_INVALID });
  }
  if (Object.keys(out).length > 0) fields[key] = out;
}

// ⚠️ **La regola più importante del modulo** (§36-40 v42). Indirizzo, civico e
// coordinate non sono tre campi: sono **una cosa sola**, e si ripristinano
// tutti insieme o per niente. Un indirizzo senza coordinate non è
// riverificabile contro il perimetro (§10): sarebbe un dato che non può essere
// controllato e che porterebbe il cliente fino al rifiuto del server.
//
// Il civico può essere stringa vuota: è lo stato reale di un indirizzo scelto
// senza numero civico (§41-45), dove il sito mostra l'avviso e blocca il
// pagamento. È un dato legittimo da conservare, non una struttura rotta.
//
// Se dell'indirizzo non c'è **nulla**, non è uno scarto: il cliente non lo
// aveva ancora inserito.
function restoreAddress(persisted, fields, dropped) {
  const address = persisted.deliveryAddress;
  const details = persisted.deliveryAddressDetails;

  const complete =
    isString(address) &&
    address.trim() !== "" &&
    isObject(details) &&
    isString(details.civico) &&
    isFiniteNumber(details.lat) &&
    isFiniteNumber(details.lng);

  if (complete) {
    fields.deliveryAddress = address;
    fields.deliveryAddressDetails = { civico: details.civico, lat: details.lat, lng: details.lng };
    return;
  }

  const anythingSaved =
    (address !== undefined && address !== null && address !== "") ||
    (details !== undefined && details !== null);

  if (anythingSaved) dropped.push({ field: "address", reason: DROP_ADDRESS_INCOMPLETE });
}

// Ripristina i dati del checkout. Ritorna { fields, dropped }:
//  - fields: oggetto **parziale**, con le sole chiavi ripristinabili, nei nomi
//    dello stato di partenza. Chi chiama lo fonde con lo stato che ha già;
//  - dropped: [{ field, reason }] di ciò che c'era e non si è potuto leggere.
//
// Versione sconosciuta, o struttura non leggibile: si scarta **tutto** e si
// riparte da vuoto (§36-40 v42) — nemmeno i valori di ripiego dei due booleani,
// perché senza nulla di ripristinato non c'è niente da proteggere: valgono i
// valori iniziali di chi chiama. Non si indovina il significato di una
// struttura che non si sa leggere.
function restoreCheckout(persisted) {
  if (!isObject(persisted) || persisted.v !== FORMAT_VERSION) {
    return { fields: {}, dropped: [] };
  }

  const fields = {};
  const dropped = [];

  restoreValue(persisted, "fulfillmentMode", (v) => FULFILLMENT_MODES.includes(v), fields, dropped);
  restoreValue(persisted, "timingType", (v) => TIMING_TYPES.includes(v), fields, dropped);
  restoreValue(persisted, "scheduledDay", (v) => DAYS.includes(v), fields, dropped);
  restoreValue(persisted, "pickupDay", (v) => DAYS.includes(v), fields, dropped);
  restoreValue(persisted, "scheduledTime", (v) => v === null || isTimeShape(v), fields, dropped);
  restoreValue(persisted, "pickupTime", (v) => v === null || isTimeShape(v), fields, dropped);

  // §14 (v68): il codice scritto è testo libero e si ripristina come tale — non
  // si giudica se sia un codice esistente, perché a dirlo è il server e non
  // questo modulo. Se non è una stringa, si scarta come ogni altro campo
  // illeggibile: la casella resta vuota e il cliente può riscriverlo.
  //
  // ⚠️ Se la chiave manca — struttura conservata prima della v68 — `restoreValue`
  // non fa nulla e non registra alcuno scarto: l'assenza non è un errore, e un
  // checkout salvato ieri si ripristina intero come prima.
  restoreValue(persisted, "codiceScritto", isString, fields, dropped);

  restoreAddress(persisted, fields, dropped);
  restoreStringGroup(persisted, "deliveryDetails", DELIVERY_DETAIL_KEYS, fields, dropped);
  restoreStringGroup(persisted, "customerDetails", CUSTOMER_DETAIL_KEYS, fields, dropped);

  // ⚠️ Ripiego **prudente** (§36-40 v41): un orario di ritiro di cui non
  // sappiamo più se il cliente l'aveva scelto va trattato come scelto. Nel
  // verso prudente il costo è un avviso in più; nell'altro è un orario
  // spostato di nascosto sotto gli occhi del cliente, che §12b vieta.
  if (isBoolean(persisted.pickupTimeExplicit)) {
    fields.pickupTimeExplicit = persisted.pickupTimeExplicit;
  } else {
    fields.pickupTimeExplicit = true;
    if (persisted.pickupTimeExplicit !== undefined) {
      dropped.push({ field: "pickupTimeExplicit", reason: DROP_INVALID });
    }
  }

  // §14 (v68): qui stava il ripristino di `giveMeFiveApplied`, con il suo
  // ripiego prudente a "non richiesto". È stato tolto insieme al pulsante del
  // carrello che quel campo accendeva. ⚠️ La chiave, se una struttura vecchia
  // la porta ancora, non viene né ripristinata né scartata: passa inosservata,
  // ed è il comportamento voluto — un cliente che ha la pagina aperta da ieri
  // non deve perdere indirizzo e contatti per una chiave che non ci serve più.
  //
  // *L'intenzione di sconto oggi vive come `codiceScritto`: non più un sì/no,
  // ma il testo che il cliente ha battuto, che al ritorno viene **riverificato
  // dal server** invece che dato per buono.*

  return { fields, dropped };
}

export {
  FORMAT_VERSION,
  DROP_INVALID,
  DROP_ADDRESS_INCOMPLETE,
  prepareCheckout,
  restoreCheckout,
};
