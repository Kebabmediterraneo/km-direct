// §46b / §41-45 — validazioni di FORMA della richiesta di checkout, estratte
// da `app/api/checkout/route.js` (tappa 2 di §46) a comportamento invariato:
// stesse condizioni, stesso ordine, stessi messaggi copiati carattere per
// carattere. Non c'è alcuna decisione nuova qui dentro: se qualcosa di questo
// modulo si comporta diversamente dalla route, è un difetto del riordino.
//
// Modulo PURO nel senso del progetto: niente Supabase, niente Stripe, niente
// NextResponse, nessun import da `app/` o da Next. È il motivo dell'estrazione
// (§46, lavoro 1): la route non è importabile fuori da Next, questo modulo sì,
// quindi queste otto uscite diventano verificabili da un test ripetibile
// invece che da un campione di richieste HTTP.
//
// **Forma del ritorno.** Il progetto ne ha già due, e questa è la loro unione,
// non una terza: `{ ok, error }` dei validatori puri
// (`validateProductPayload`, `lib/menu-editor.js`) e `{ status, body }` dei
// core che la route mappa su HTTP (`updateProductCore`, `updateAllergensCore`).
// Serve entrambe perché queste validazioni devono restituire un verdetto **e**
// i valori derivati che le fasi successive della route usano. `body` è
// esattamente il JSON che la route passa a NextResponse: chi chiama non
// ricostruisce nulla e non riscrive un messaggio a mano.
//
// ⚠️ **Unica dipendenza non deterministica: l'orologio**, ereditata da
// `computeScheduledDeliveryAt` quando `referenceDate` non viene passata — cioè
// esattamente come si comporta la route oggi. I test la passano sempre, così
// il modulo resta verificabile senza aspettare un orario reale. Dichiarata e
// non nascosta (lezione `t`: una verifica che non si può fare si dichiara).
import { computeScheduledDeliveryAt } from "./scheduled-slots.js";

// §9: ordine minimo di prodotti per la Delivery, la fee non concorre.
// Nella route questa costante è usata SOLO dal controllo estratto qui sotto
// (righe 548 e 550, verificate leggendo): si sposta per intero, non si
// duplica. Nessun'altra costante di modulo della route serve a queste
// validazioni — `DELIVERY_FEE`, i quattro `GIVEMEFIVE_*`,
// `MARKETING_TEXT_VERSION`, `SYSTEM_ERROR_MESSAGE` e `READ_ERROR` vivono tutti
// in fasi che questo modulo non tocca.
export const DELIVERY_MINIMUM_ORDER = 15;

function reject(status, error) {
  return { ok: false, status, body: { error } };
}

// Fasi 1-4 della route (righe 331-394): tutto ciò che si può giudicare
// **prima** di leggere il database. Otto uscite 400, nessuna lettura.
//
// Restituisce, se passa, i quattro valori che la route calcola qui e usa più
// avanti: `isDelivery` (fasi 6, 7, 10, 13, 14), le due coordinate (geofence a
// riga 405 e payload a 622-623) e `scheduledDeliveryAt` (guard orari a 460-465
// e payload a 615).
//
// `body` è il corpo già decodificato della richiesta: la `request.json()`
// resta nella route, dove oggi non è protetta da try/catch — comportamento
// registrato e **non corretto qui**, perché sarebbe una modifica vera e va
// decisa prima in spec.
export function validateCheckoutRequest(body, { referenceDate } = {}) {
  // route 332-342: stesso `?? {}`, così un corpo nullo dà campi indefiniti
  // invece di sollevare.
  const { items, fulfillment, delivery, pickup, customer, privacyAccepted } = body ?? {};

  // route 344-346
  if (!Array.isArray(items) || items.length === 0) {
    return reject(400, "Il carrello è vuoto.");
  }

  // route 347-349
  if (fulfillment !== "delivery" && fulfillment !== "pickup") {
    return reject(400, "Si è verificato un problema con la modalità scelta. Riprova.");
  }

  // route 350-356 — i tre campi obbligatori di §41-45 in un solo messaggio,
  // com'è oggi: il cliente non viene guidato campo per campo.
  if (
    !customer?.firstName?.trim() ||
    !customer?.lastName?.trim() ||
    !customer?.phone?.trim()
  ) {
    return reject(400, "Controlla di aver compilato nome, cognome e telefono.");
  }

  // route 357-359
  if (!privacyAccepted) {
    return reject(400, "Per procedere, accetta l'informativa privacy.");
  }

  // route 361-364
  const isDelivery = fulfillment === "delivery";
  if (isDelivery && (!delivery?.address?.trim() || !delivery?.houseNumber?.trim())) {
    return reject(400, "Manca qualche dato dell'indirizzo. Controlla e riprova.");
  }

  // route 366-370
  //
  // ⚠️ `Number(null)`, `Number("")` e `Number([])` valgono **0**, cioè una
  // coordinata finita: una latitudine vuota supera questo controllo, prosegue,
  // e cade più avanti sul perimetro (riga 406, "fuori zona"). È comportamento
  // scoperto il 31/07/2026, registrato dal caso `riga-406-coordinate-vuote`
  // della fotografia e **deliberatamente non corretto**: nessuno l'ha mai
  // deciso, quindi cambiarlo sarebbe una decisione nuova da mettere prima in
  // spec, non una pulizia da fare di passaggio. Il test lo blocca apposta.
  const deliveryLatitude = isDelivery ? Number(delivery?.latitude) : null;
  const deliveryLongitude = isDelivery ? Number(delivery?.longitude) : null;
  if (isDelivery && (!Number.isFinite(deliveryLatitude) || !Number.isFinite(deliveryLongitude))) {
    return reject(400, "Non siamo riusciti a individuare l'indirizzo. Riprova a inserirlo.");
  }

  // route 372-394 — §12/§12b: il timestamp reale si calcola qui da
  // giorno+orario, mai da un timestamp pronto arrivato dal client (§46).
  // Restano **due `if` separati**, non un if/else: è la forma della route, e
  // per la Delivery ASAP nessuno dei due scrive, quindi il valore resta null.
  let scheduledDeliveryAt = null;
  if (isDelivery && delivery?.timingType === "scheduled") {
    scheduledDeliveryAt = computeScheduledDeliveryAt(
      delivery?.scheduledDay,
      delivery?.scheduledTime,
      referenceDate
    );
    if (!scheduledDeliveryAt) {
      return reject(400, "Orario di consegna programmata non valido.");
    }
  }
  if (!isDelivery) {
    scheduledDeliveryAt = computeScheduledDeliveryAt(
      pickup?.scheduledDay,
      pickup?.scheduledTime,
      referenceDate
    );
    if (!scheduledDeliveryAt) {
      return reject(400, "Orario di ritiro non valido.");
    }
  }

  return { ok: true, isDelivery, deliveryLatitude, deliveryLongitude, scheduledDeliveryAt };
}

// Fase 10 della route (righe 547-560): le due regole che si possono giudicare
// solo **dopo** aver risolto il carrello, perché dipendono dal subtotale
// ricalcolato e dalle categorie vere lette dal database. Nessuna lettura qui:
// riceve i due fatti già stabiliti.
//
// `subtotal` è quello ricalcolato server-side e già arrotondato (route 545),
// mai un importo arrivato dal browser (§46).
export function validateResolvedOrder({ isDelivery, subtotal, hasBeer, ageConfirmed }) {
  // route 547-553 — §9: il minimo vale solo sulla Delivery e si misura sui
  // prodotti, senza la fee, che infatti viene sommata più tardi (riga 606).
  if (isDelivery && subtotal < DELIVERY_MINIMUM_ORDER) {
    return reject(400, `Ordine minimo ${DELIVERY_MINIMUM_ORDER}€ di prodotti per la Delivery.`);
  }

  // route 555-560 — §33: la conferma dei 18 anni è richiesta solo se il
  // carrello contiene birre, e `hasBeer` nasce dalla categoria letta dal
  // database (route 528), mai da ciò che dichiara il client.
  if (hasBeer && !ageConfirmed) {
    return reject(400, "Per ordinare alcolici devi confermare di avere almeno 18 anni.");
  }

  return { ok: true };
}
