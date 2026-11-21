// §65b (D5, E1) — il token dell'ordine sulla pagina di conferma. Modulo puro:
// la query, la memoria e l'ora arrivano da fuori, così una prova lo esegue
// (`tests/order-conversion.test.mjs`).
//
// ===========================================================================
// PERCHÉ ESISTE
// ===========================================================================
// La conferma si apre come `/conferma?order_token=<token>`, e i tag di Google e
// Meta mandano ai loro server l'indirizzo della pagina. ⚠️⚠️ IL TOKEN NON DEVE
// MAI ARRIVARE AI TAG (D5): è la chiave della pagina di stato dell'ordine.
// Quindi la pagina lo legge, lo conserva e lo toglie dalla barra; ricaricando,
// lo ritrova da dove l'ha conservato. Il link del cliente resta valido.
//
// ⚠️ L'ORDINE «PRIMA IL TOKEN, POI I TAG» NON SI AFFIDA AI TEMPI (proposta del
// 16/11/2026, approvata): la pagina, finito il lavoro, segnala «conferma
// pronta»; il banner su /conferma carica i tag solo con quel segnale E con la
// barra senza `order_token`, controllata un istante prima di inserire lo script
// (`canLoadTagsNow` in `lib/cookie-consent.js`). *Togliere il token prima che
// parta React non reggerebbe: all'avvio Next riscrive la barra con l'indirizzo
// che conosce lui, query compresa (`app-router.js`, `replaceState(canonicalUrl)`).*
//
// ⚠️ SE LA MEMORIA NON FUNZIONA LA QUERY RESTA: senza un posto dove conservarlo,
// togliere il token lo perderebbe. La pagina funziona come oggi; su /conferma
// quel cliente non viene contato, perché la barra contiene il token. È il lato
// sicuro.

export const TOKEN_KEY = "km_last_order_token";
// E1: il token dell'ultimo ordine resta nel browser 30 giorni, con una scadenza
// VERA nel codice — `localStorage` da solo non cancella niente.
export const TOKEN_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

// I due segnali fra la pagina di conferma e il banner. Un nome solo, importato
// da entrambi.
export const CONFIRMATION_READY_EVENT = "km:conferma-pronta";
export const ORDER_TO_COUNT_EVENT = "km:ordine-da-contare";

function tokenDallaQuery(search) {
  try {
    const valore = new URLSearchParams(search ?? "").get("order_token");
    return typeof valore === "string" && valore.trim() !== "" ? valore.trim() : null;
  } catch {
    return null;
  }
}

// Decide da dove viene il token e cosa fare della query.
// Ritorna { token, origine: "query" | "memoria" | null, togliQuery }.
export function resolveOrderToken({ search, storage, now = Date.now() } = {}) {
  const daQuery = tokenDallaQuery(search);

  if (daQuery) {
    // Un solo token, l'ultimo: si sovrascrive quello di prima.
    try {
      storage.setItem(TOKEN_KEY, JSON.stringify({ token: daQuery, savedAt: now }));
      return { token: daQuery, origine: "query", togliQuery: true };
    } catch {
      return { token: daQuery, origine: "query", togliQuery: false };
    }
  }

  let grezzo;
  try {
    grezzo = storage.getItem(TOKEN_KEY);
  } catch {
    return { token: null, origine: null, togliQuery: false };
  }
  if (typeof grezzo !== "string" || grezzo === "") {
    return { token: null, origine: null, togliQuery: false };
  }

  let dato = null;
  try {
    dato = JSON.parse(grezzo);
  } catch {
    dato = null;
  }
  const valido =
    dato &&
    typeof dato.token === "string" &&
    dato.token !== "" &&
    typeof dato.savedAt === "number" &&
    dato.savedAt <= now &&
    now - dato.savedAt < TOKEN_MAX_AGE_MS;

  if (!valido) {
    // Scaduto, illeggibile o di forma sbagliata: si cancella (E1, scadenza vera).
    try {
      storage.removeItem(TOKEN_KEY);
    } catch {
      /* niente da fare: alla prossima lettura si riprova */
    }
    return { token: null, origine: null, togliQuery: false };
  }
  return { token: dato.token, origine: "memoria", togliQuery: false };
}

// L'indirizzo della conferma senza la query, da passare a `history.replaceState`.
// Conserva un eventuale frammento (#…), che non contiene il token.
export function confirmationPathWithoutQuery(pathname, hash) {
  return `${pathname || "/conferma"}${hash || ""}`;
}
