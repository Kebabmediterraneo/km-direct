// §65b (E4, decisioni di Andrea del 23/11/2026) — IL REGISTRO DELLE SCELTE DEL
// BANNER. Modulo puro: nessun browser, nessun React, nessun database.
//
// A ogni SALVATAGGIO di una scelta (mai a ogni visita) il browser manda alla
// rotta `/api/consenso-banner` una riga: identificativo casuale del browser,
// versione del testo, le tre scelte, il pulsante usato e da dove. La data e
// l'ora le mette il database. Niente IP, niente dati dell'ordine.
// ⚠️ L'identificativo è uno PSEUDONIMO, non è anonimo: con lui si risale alle
// scelte di quel browser. Nasce al primo salvataggio, vive DENTRO la scelta
// salvata (`idBrowser` in `km_cookie_consent`) e muore con lei.

export const AZIONI_REGISTRO = ["accetta_tutti", "rifiuta_tutti", "chiudi_x", "personalizza"];
export const ORIGINI_REGISTRO = ["banner", "preferenze"];

// Il nome nel registro delle azioni del banner. ⚠️ La X vale rifiuto, e nel
// registro resta riconoscibile come X.
export const PULSANTE_DA_AZIONE = {
  accept_all: "accetta_tutti",
  reject_all: "rifiuta_tutti",
  close: "chiudi_x",
  custom: "personalizza",
};

export const MAX_CORPO = 1024;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export function idBrowserValido(valore) {
  return typeof valore === "string" && UUID.test(valore);
}

// Un identificativo nuovo: uuid v4 da `randomUUID`, oppure costruito da
// `getRandomValues`. Senza un generatore casuale: `null` — mai un numero
// inventato in altro modo.
export function nuovoIdBrowser(generatore) {
  try {
    if (generatore && typeof generatore.randomUUID === "function") {
      const id = String(generatore.randomUUID()).toLowerCase();
      return idBrowserValido(id) ? id : null;
    }
    if (generatore && typeof generatore.getRandomValues === "function") {
      const b = generatore.getRandomValues(new Uint8Array(16));
      b[6] = (b[6] & 0x0f) | 0x40; // versione 4
      b[8] = (b[8] & 0x3f) | 0x80; // variante RFC 4122
      const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
      const id = `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
      return idBrowserValido(id) ? id : null;
    }
  } catch {
    return null;
  }
  return null;
}

// Il corpo della richiesta, dal lato del browser. Esattamente sette campi;
// `null` se manca qualcosa (allora non si manda niente).
export function corpoRegistro(consent, azione, origine) {
  if (!consent || !idBrowserValido(consent.idBrowser)) return null;
  if (!AZIONI_REGISTRO.includes(azione) || !ORIGINI_REGISTRO.includes(origine)) return null;
  if (typeof consent.version !== "string") return null;
  return {
    idBrowser: consent.idBrowser,
    versione: consent.version,
    google: consent.google === true,
    meta: consent.meta === true,
    adobeFonts: consent.adobeFonts !== false,
    azione,
    origine,
  };
}

// (decisioni 15a e 18 di Andrea, 23/11/2026) Il registro tiene SOLO i
// consensi e le revoche. Si manda la riga se la scelta nuova ha almeno un
// consenso, oppure se la scelta di prima ne aveva almeno uno (revoca). Un
// rifiuto puro, o un cambio della sola scelta su Adobe senza consensi, non si
// manda. ⚠️ La stessa regola la applica il database (file 6): il browser non
// è l'unica difesa.
export function deveRegistrare(prima, salvata) {
  const ha = (s) => s?.google === true || s?.meta === true;
  return ha(salvata) || ha(prima);
}

const CAMPI = ["adobeFonts", "azione", "google", "idBrowser", "meta", "origine", "versione"];

// Il controllo della richiesta, dal lato del server. Accetta SOLO i sette
// campi, con i tipi giusti, e la versione del testo che il server conosce.
export function rigaDaRichiesta(testo, versioneAttesa) {
  if (typeof testo !== "string" || testo.length === 0 || testo.length > MAX_CORPO) {
    return { ok: false, motivo: "corpo" };
  }
  let dato;
  try {
    dato = JSON.parse(testo);
  } catch {
    return { ok: false, motivo: "json" };
  }
  if (!dato || typeof dato !== "object" || Array.isArray(dato)) return { ok: false, motivo: "forma" };
  if (JSON.stringify(Object.keys(dato).sort()) !== JSON.stringify(CAMPI)) return { ok: false, motivo: "campi" };
  if (!idBrowserValido(dato.idBrowser)) return { ok: false, motivo: "id" };
  if (dato.versione !== versioneAttesa) return { ok: false, motivo: "versione" };
  for (const k of ["google", "meta", "adobeFonts"]) {
    if (typeof dato[k] !== "boolean") return { ok: false, motivo: k };
  }
  if (!AZIONI_REGISTRO.includes(dato.azione)) return { ok: false, motivo: "azione" };
  if (!ORIGINI_REGISTRO.includes(dato.origine)) return { ok: false, motivo: "origine" };
  return {
    ok: true,
    parametri: {
      p_id_browser: dato.idBrowser,
      p_versione_testo: dato.versione,
      p_google: dato.google,
      p_meta: dato.meta,
      p_adobe_fonts: dato.adobeFonts,
      p_azione: dato.azione,
      p_origine: dato.origine,
    },
  };
}
