// §65b (D2, D6, D7, D8) — quando un ordine si conta su Google Ads e Meta, e
// come. Modulo puro: niente browser, niente database. Lo usano la rotta
// `app/api/orders/[token]` (il server decide), la pagina di conferma (la
// cadenza dei controlli) e il banner (l'invio). Le prove stanno in
// `tests/order-conversion.test.mjs`.
//
// ⚠️⚠️ L'IDENTIFICATIVO MANDATO A GOOGLE (`transaction_id`) E A META (`eventID`)
// È IL CODICE RITIRO (`KM-0042`), MAI IL TOKEN DELL'ORDINE (D2). Il codice
// ritiro di un ordine pagato non viene mai riusato (§69 v94).

// D6: le tre ore si contano dalla nascita dell'ordine (`orders.created_at`).
export const COUNT_WINDOW_MS = 3 * 60 * 60 * 1000;

// D8: finché il pagamento non risulta confermato, ogni 3 secondi per i primi 2
// minuti; poi, e comunque a pagamento confermato, i 20 secondi di sempre.
export const FAST_POLL_MS = 3000;
export const FAST_POLL_WINDOW_MS = 2 * 60 * 1000;
export const NORMAL_POLL_MS = 20000;

// I codici già contati, nel browser e solo dopo il consenso: gli ultimi 20.
export const COUNTED_KEY = "km_conversioni_contate";
export const COUNTED_MAX = 20;

// D7: il server decide, la pagina esegue. Vero SOLO se l'ordine è pagato
// (`succeeded`) E nato da meno di tre ore. Rimborsato, fallito, in attesa: no.
// ⚠️ Riceve la data e restituisce un booleano: la data non esce dal server.
export function isCountable({ payment_status, created_at } = {}, now = Date.now()) {
  if (payment_status !== "succeeded") return false;
  const nato = typeof created_at === "string" || typeof created_at === "number" ? new Date(created_at).getTime() : NaN;
  if (!Number.isFinite(nato)) return false;
  return now - nato < COUNT_WINDOW_MS;
}

// Il totale come numero, o null se non è un numero utilizzabile.
export function orderTotal(total) {
  const n = typeof total === "number" ? total : Number(total);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
}

// D8: quanto aspettare prima del prossimo controllo dello stato.
export function nextPollDelay({ paymentStatus, elapsedMs }) {
  if (paymentStatus === "succeeded") return NORMAL_POLL_MS;
  return elapsedMs < FAST_POLL_WINDOW_MS ? FAST_POLL_MS : NORMAL_POLL_MS;
}

// `send_to` di Google: «ID/etichetta». L'etichetta può arrivare già nella forma
// completa (`AW-…/…`) o da sola: in entrambi i casi esce la forma completa.
export function googleSendTo(googleAdsId, label) {
  const etichetta = typeof label === "string" ? label.trim() : "";
  if (etichetta === "") return null;
  if (etichetta.includes("/")) return etichetta;
  const id = typeof googleAdsId === "string" ? googleAdsId.trim() : "";
  return id === "" ? null : `${id}/${etichetta}`;
}

export function googleConversionCommand(sendTo, pickupCode, total) {
  return ["event", "conversion", { send_to: sendTo, value: total, currency: "EUR", transaction_id: pickupCode }];
}

export function metaPurchaseCommand(pickupCode, total) {
  return ["track", "Purchase", { value: total, currency: "EUR" }, { eventID: pickupCode }];
}

function leggiContati(storage) {
  try {
    const grezzo = storage.getItem(COUNTED_KEY);
    const lista = grezzo ? JSON.parse(grezzo) : [];
    return Array.isArray(lista) ? lista.filter((v) => typeof v === "string") : [];
  } catch {
    return null; // memoria che non risponde: si veda `conversionsToSend`
  }
}

// Ogni voce è «fornitore:codice», così chi concede Meta dopo aver già contato
// su Google non resta escluso per sempre su Meta.
function voce(fornitore, codice) {
  return `${fornitore}:${codice}`;
}

// Quali invii fare adesso. Nessuno senza consenso, nessuno se il server non ha
// detto «da contare», nessuno senza codice ritiro o totale, nessuno già fatto.
// ⚠️ Se la memoria non risponde NON si invia: non potendo ricordarlo, ogni
// ricaricamento conterebbe di nuovo. Google e Meta scarterebbero i doppioni con
// lo stesso identificativo, ma è meglio non affidarsi a loro.
export function conversionsToSend({ order, consent, ids = {}, storage }) {
  if (!order || order.daContare !== true) return [];
  const codice = typeof order.pickupCode === "string" ? order.pickupCode.trim() : "";
  const totale = orderTotal(order.total);
  if (codice === "" || totale === null) return [];
  if (!consent) return [];

  const contati = leggiContati(storage);
  if (contati === null) return [];

  const out = [];
  if (consent.google === true) {
    const sendTo = googleSendTo(ids.googleAdsId, ids.googleAdsConversionLabel);
    if (sendTo && typeof ids.googleAdsId === "string" && ids.googleAdsId.trim() !== "" && !contati.includes(voce("google", codice))) {
      out.push({ provider: "google", command: googleConversionCommand(sendTo, codice, totale), key: voce("google", codice) });
    }
  }
  if (consent.meta === true) {
    const metaId = typeof ids.metaPixelId === "string" ? ids.metaPixelId.trim() : "";
    if (metaId !== "" && !contati.includes(voce("meta", codice))) {
      out.push({ provider: "meta", command: metaPurchaseCommand(codice, totale), key: voce("meta", codice) });
    }
  }
  return out;
}

// Ricorda gli invii fatti: in coda, senza doppioni, solo gli ultimi 20.
export function markCounted(storage, chiavi) {
  const contati = leggiContati(storage);
  if (contati === null) return false;
  const lista = [...contati.filter((k) => !chiavi.includes(k)), ...chiavi].slice(-COUNTED_MAX);
  try {
    storage.setItem(COUNTED_KEY, JSON.stringify(lista));
    return true;
  } catch {
    return false;
  }
}
