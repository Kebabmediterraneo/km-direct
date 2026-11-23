// §65b (D1, E3, E5) — la SCELTA del cliente sui cookie e sugli strumenti
// facoltativi, e le regole che ne discendono. Modulo puro: nessun browser,
// nessun React. La memoria (`storage`), l'ora (`now`) e l'indirizzo arrivano
// da fuori, così una prova lo esegue per intero (`tests/cookie-consent.test.mjs`).
//
// ===========================================================================
// COSA SI RICORDA
// ===========================================================================
// In `localStorage`, sotto una chiave sola:
//   google      true / false / null (null = non ancora scelto)
//   meta        true / false / null
//   adobeFonts  true salvo opposizione (E5: legittimo interesse)
//   version     la versione del testo del banner a cui il cliente ha risposto
//   savedAt     quando ha scelto (millisecondi)
//   idBrowser   (E4, 23/11/2026) l'identificativo casuale del registro delle
//               scelte: nasce al primo salvataggio e muore con la scelta
//               (lib/consenso-registro.js)
//
// ⚠️ LA SCELTA VALE 6 MESI (§65b, Linee guida del Garante 2021): passati i sei
// mesi si legge come «nessuna scelta» e il banner ricompare. ⚠️ E vale solo per
// la versione del testo a cui il cliente ha risposto: cambiare `BANNER_VERSION`
// rimette la domanda a tutti.
//
// ⚠️ OGNI LETTURA E SCRITTURA È PROTETTA. Una memoria che non risponde — un
// browser che la blocca, una navigazione privata — non deve mai rompere il sito:
// la lettura dà «nessuna scelta», cioè banner mostrato e nessuno strumento
// facoltativo caricato. È il lato sicuro: senza scelta non parte niente.

import { idBrowserValido } from "./consenso-registro.js";

// ⚠️ La versione sale di uno quando cambia un testo che descrive finalità,
// fornitori o conseguenze della scelta (decisione di Andrea, 23/11/2026). Il
// testo di ogni versione è conservato in docs/banner/<versione>.md.
export const BANNER_VERSION = "v1";
export const STORAGE_KEY = "km_cookie_consent";
export const VALIDITY_MONTHS = 6;

// Il cookie tecnico del carattere (P5, proposta A): esiste SOLO per chi si
// oppone ad Adobe Fonts. Il layout lo legge sul server e non scrive il <link>.
export const FONT_COOKIE = "km_font_off";

// L'evento con cui il collegamento «Preferenze cookie» del piè di pagina chiede
// al banner di riaprire le scelte. Un nome solo, importato da entrambi.
export const OPEN_PREFERENCES_EVENT = "km:open-cookie-preferences";

// Le pagine dove compare da solo il banner, e quelle dove, dopo la scelta, si
// caricano i tag. ⚠️ MAI le pagine staff. Su `/conferma` il banner non compare
// da solo (chi non ha scelto sulla home non viene contato), ma dal pezzo 2
// (16/11/2026) i tag si caricano — solo alle condizioni di `canLoadTagsNow`.
const PAGINE_BANNER = ["/", "/privacy"];
const PAGINE_TAG = ["/", "/privacy", "/conferma"];
const PAGINE_CLIENTE = ["/", "/privacy", "/conferma"];

// I cookie che i due fornitori scrivono sul nostro dominio, da cancellare alla
// revoca. Google Ads con il solo ad_storage concesso scrive i `_gcl_*`; Meta
// scrive `_fbp` e, se l'arrivo porta un `fbclid`, `_fbc`.
const COOKIE_FORNITORE = {
  google: (nome) => nome.startsWith("_gcl_"),
  meta: (nome) => nome === "_fbp" || nome === "_fbc",
};

// ⚠️ In UTC, non nell'ora locale: con `setMonth` la scadenza si spostava di
// un'ora attraverso il cambio dell'ora legale, e dipendeva dal fuso del
// browser. Trovato dalla prova b1 alla prima esecuzione.
function seiMesiDopo(ms) {
  const d = new Date(ms);
  d.setUTCMonth(d.getUTCMonth() + VALIDITY_MONTHS);
  return d.getTime();
}

function triStato(v) {
  return v === true || v === false ? v : null;
}

// Legge la scelta. Ritorna l'oggetto, oppure `null` se non c'è, è illeggibile,
// è scaduta, appartiene a un'altra versione del banner, o la memoria lancia.
export function readConsent(storage, now = Date.now()) {
  let grezzo;
  try {
    grezzo = storage?.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
  if (typeof grezzo !== "string" || grezzo === "") return null;

  let dato;
  try {
    dato = JSON.parse(grezzo);
  } catch {
    return null;
  }
  if (!dato || typeof dato !== "object") return null;
  if (dato.version !== BANNER_VERSION) return null;
  if (typeof dato.savedAt !== "number" || !Number.isFinite(dato.savedAt)) return null;
  if (dato.savedAt > now) return null; // una data nel futuro non è una scelta credibile
  if (now >= seiMesiDopo(dato.savedAt)) return null;

  return {
    google: triStato(dato.google),
    meta: triStato(dato.meta),
    adobeFonts: dato.adobeFonts !== false,
    version: dato.version,
    savedAt: dato.savedAt,
    idBrowser: idBrowserValido(dato.idBrowser) ? dato.idBrowser : null,
  };
}

// Salva una scelta. Ritorna l'oggetto salvato e `ok`: `false` se la memoria ha
// rifiutato. Non lancia mai.
export function saveConsent(storage, scelta, now = Date.now()) {
  const dato = {
    google: triStato(scelta?.google),
    meta: triStato(scelta?.meta),
    adobeFonts: scelta?.adobeFonts !== false,
    version: BANNER_VERSION,
    savedAt: now,
    idBrowser: idBrowserValido(scelta?.idBrowser) ? scelta.idBrowser : null,
  };
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(dato));
    return { ok: true, consent: dato };
  } catch {
    return { ok: false, consent: dato };
  }
}

// Il banner serve finché uno dei due fornitori non ha una risposta.
// ⚠️ Chi ha solo spento Adobe Fonts dalle preferenze non ha ancora risposto a
// Google e Meta: il banner resta.
export function needsBanner(consent) {
  return !consent || consent.google === null || consent.meta === null;
}

// Le tre risposte del banner. ⚠️ CHIUDERE CON LA X È RIFIUTARE (§65b).
// `adobeFonts` non è una domanda del banner: si conserva quella che c'era.
export function choiceFromAction(azione, attuale = null, personalizzata = null) {
  const font = attuale ? attuale.adobeFonts !== false : true;
  if (azione === "accept_all") return { google: true, meta: true, adobeFonts: font };
  if (azione === "reject_all" || azione === "close") return { google: false, meta: false, adobeFonts: font };
  if (azione === "custom") {
    return {
      google: personalizzata?.google === true,
      meta: personalizzata?.meta === true,
      adobeFonts: personalizzata?.adobeFonts === undefined ? font : personalizzata.adobeFonts !== false,
    };
  }
  throw new Error(`cookie-consent: azione sconosciuta "${azione}"`);
}

// I fornitori che passano da «sì» a «no»: sono quelli da revocare (cookie
// cancellati e pagina ricaricata, P4).
export function revokedProviders(prima, dopo) {
  const out = [];
  for (const f of ["google", "meta"]) {
    if (prima?.[f] === true && dopo?.[f] !== true) out.push(f);
  }
  return out;
}

export function isStaffPath(pathname) {
  return pathname === "/staff" || (typeof pathname === "string" && pathname.startsWith("/staff/"));
}

export function showsBanner(pathname) {
  return PAGINE_BANNER.includes(pathname);
}

export function isCustomerPath(pathname) {
  return PAGINE_CLIENTE.includes(pathname);
}

// ⚠️⚠️ D5 — SI POSSONO CARICARE I TAG ADESSO? Da chiamare UN ISTANTE PRIMA di
// inserire gli script. Su "/" e "/privacy" sì. Su "/conferma" solo se la pagina
// ha già sistemato il token (segnale «conferma pronta») E la barra
// dell'indirizzo non contiene `order_token`. La seconda condizione è la
// garanzia vera: anche se l'ordine degli eventi cambiasse, un tag non si carica
// mai con il token nell'indirizzo. Altrove, mai.
export function canLoadTagsNow({ pathname, search, confirmationReady } = {}) {
  if (isStaffPath(pathname)) return false;
  if (showsBanner(pathname)) return true;
  if (pathname !== "/conferma") return false;
  if (confirmationReady !== true) return false;
  let conToken = true;
  try {
    conToken = new URLSearchParams(search ?? "").has("order_token");
  } catch {
    conToken = true;
  }
  return !conToken && !/order_token/i.test(String(search ?? ""));
}

// Quali tag caricare, e con quale ID. Nessuna scelta → nessuno. ID mancante →
// quel tag no, e il sito funziona. Pagina fuori elenco → nessuno.
// ⚠️ Non guarda il momento: quello lo decide `canLoadTagsNow`.
export function tagsToLoad(consent, pathname, ids = {}) {
  if (!consent || !PAGINE_TAG.includes(pathname)) return [];
  const out = [];
  const googleId = typeof ids.googleAdsId === "string" ? ids.googleAdsId.trim() : "";
  const metaId = typeof ids.metaPixelId === "string" ? ids.metaPixelId.trim() : "";
  if (consent.google === true && googleId !== "") out.push({ provider: "google", id: googleId });
  if (consent.meta === true && metaId !== "") out.push({ provider: "meta", id: metaId });
  return out;
}

// Il dominio dei cookie di Google (P4): quello della pagina. Su
// `ordina.kebabmediterraneo.it` resta il sottodominio, non `.kebabmediterraneo.it`
// condiviso col sito vetrina. Su `localhost` gtag vuole `none`.
export function googleCookieDomain(hostname) {
  if (!hostname || hostname === "localhost" || /^[0-9.]+$/.test(hostname)) return "none";
  return hostname;
}

// Le istruzioni di gtag, in ordine, per Consent Mode v2 in modalità BASE: il tag
// si carica solo dopo il «sì», e dichiara subito cosa è concesso e cosa no.
export function googleCommands(id, hostname) {
  return [
    ["consent", "default", {
      ad_storage: "granted",
      ad_user_data: "granted",
      ad_personalization: "denied",
      analytics_storage: "denied",
    }],
    ["set", "url_passthrough", false],
    ["js", "__DATE__"],
    ["config", id, { cookie_domain: googleCookieDomain(hostname) }],
  ];
}

// Le istruzioni del Pixel Meta, in ordine. ⚠️ `autoConfig` va spento PRIMA di
// `init`. `init` riceve il solo ID: nessun dato per il matching.
export function metaCommands(id) {
  return [
    ["set", "autoConfig", false, id],
    ["init", id],
    ["track", "PageView"],
  ];
}

// Le varianti di dominio con cui un cookie può essere stato scritto: nessun
// dominio, il dominio della pagina, e ogni dominio padre con almeno un punto.
export function domainVariants(hostname) {
  const out = [null];
  if (!hostname) return out;
  out.push(hostname);
  const parti = hostname.split(".");
  for (let i = 1; i < parti.length - 1; i++) {
    const padre = parti.slice(i).join(".");
    out.push(padre, `.${padre}`);
  }
  if (!hostname.startsWith(".") && parti.length > 1) out.push(`.${hostname}`);
  return [...new Set(out)];
}

// Le stringhe da assegnare a `document.cookie` per cancellare i cookie di un
// fornitore. Riceve i nomi presenti (letti da `document.cookie`) e l'host.
export function cookieDeletions(provider, cookieString, hostname) {
  const vale = COOKIE_FORNITORE[provider];
  if (!vale) return [];
  const nomi = String(cookieString ?? "")
    .split(";")
    .map((p) => p.split("=")[0].trim())
    .filter((n) => n !== "" && vale(n));
  const out = [];
  for (const nome of [...new Set(nomi)]) {
    for (const dominio of domainVariants(hostname)) {
      out.push(`${nome}=; Max-Age=0; Path=/${dominio ? `; Domain=${dominio}` : ""}`);
    }
  }
  return out;
}

// Il cookie del carattere: scritto a chi si oppone, tolto a chi riaccende.
export function fontCookieString(adobeFonts, secure) {
  const coda = `; Path=/; SameSite=Lax${secure ? "; Secure" : ""}`;
  if (adobeFonts === false) {
    return `${FONT_COOKIE}=1; Max-Age=${60 * 60 * 24 * 183}${coda}`;
  }
  return `${FONT_COOKIE}=; Max-Age=0${coda}`;
}
