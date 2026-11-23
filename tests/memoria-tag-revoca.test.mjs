// §65b (23/11/2026, scelta «a» di Andrea) — LA MEMORIA DEL BROWSER SCRITTA DAI
// TAG DI GOOGLE E META SI CANCELLA INSIEME AI LORO COOKIE.
// Esegui con: node tests/memoria-tag-revoca.test.mjs   (exit code 0 = tutti PASS)
//
// Le voci (solo queste tre, nessun'altra):
//   Google → «_gcl_ls»;
//   Meta   → «lastExternalReferrer», «lastExternalReferrerTime».
// Quando: per ogni fornitore senza un «sì» valido —
//   a) alla revoca (da «sì» a «no»), dove già si cancellavano i cookie;
//   b) a ogni apertura delle pagine cliente: scelta assente, scaduta o «no».
//      Questo punto è NUOVO: prima i cookie si cancellavano solo alla revoca.
// Google e Meta restano separati. `km_cookie_consent` non si tocca mai.
//
// ⚠️ NON si prova qui: il browser vero (cosa scrivono davvero i tag, e quando).
// Il cablaggio nel componente si legge come testo (blocco e).
import { readFileSync } from "node:fs";
import * as m from "../lib/cookie-consent.js";

let failures = 0;
function assert(cond, msg) {
  console.log(`${cond ? "PASS" : "FAIL"} — ${msg}`);
  if (!cond) failures++;
}
function leggi(p) {
  try {
    return readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
  } catch {
    return null;
  }
}

// Una memoria finta, con le voci dei tag, la scelta e altre voci del sito.
const SCELTA = JSON.stringify({ google: true, meta: true, adobeFonts: true, version: "v2", savedAt: 1, idBrowser: null });
function memoriaPiena({ lanciaRimozione = false } = {}) {
  const dati = {
    _gcl_ls: "g",
    lastExternalReferrer: "facebook.com",
    lastExternalReferrerTime: "1",
    km_cookie_consent: SCELTA,
    km_ultimo_ordine: "x",
    // nomi simili, che NON devono essere toccati (controprova sui nomi esatti)
    _gcl_lsx: "simile",
    lastExternalReferrerTimeX: "simile",
  };
  return {
    getItem: (k) => (Object.prototype.hasOwnProperty.call(dati, k) ? dati[k] : null),
    setItem: (k, v) => {
      dati[k] = String(v);
    },
    removeItem: (k) => {
      if (lanciaRimozione) throw new Error("SecurityError");
      delete dati[k];
    },
    dati,
  };
}
const chiavi = (mem) => Object.keys(mem.dati).sort().join(",");

// ===========================================================================
// a) QUALI VOCI, PER QUALE FORNITORE
// ===========================================================================
assert(typeof m.storageDeletions === "function", "a1) esiste la regola delle voci da cancellare");
assert(JSON.stringify(m.storageDeletions?.("google")) === JSON.stringify(["_gcl_ls"]), "a2) Google: solo «_gcl_ls»");
assert(JSON.stringify(m.storageDeletions?.("meta")) === JSON.stringify(["lastExternalReferrer", "lastExternalReferrerTime"]), "a3) Meta: solo «lastExternalReferrer» e «lastExternalReferrerTime»");
assert(JSON.stringify(m.storageDeletions?.("adobe")) === "[]" && JSON.stringify(m.storageDeletions?.(undefined)) === "[]", "a4) un fornitore sconosciuto: nessuna voce");
const tutte = [...(m.storageDeletions?.("google") ?? []), ...(m.storageDeletions?.("meta") ?? [])];
assert(!tutte.includes("km_cookie_consent") && tutte.length === 3, "a5) in tutto tre nomi, e mai km_cookie_consent");

// ===========================================================================
// b) LA REVOCA
// ===========================================================================
{
  // Entrambi.
  const mem = memoriaPiena();
  for (const f of m.revokedProviders({ google: true, meta: true }, { google: false, meta: false })) m.clearProviderStorage?.(mem, f);
  assert(chiavi(mem) === "_gcl_lsx,km_cookie_consent,km_ultimo_ordine,lastExternalReferrerTimeX", "b1) revoca di entrambi: via le tre voci, il resto intatto");
  assert(mem.dati.km_cookie_consent === SCELTA, "b2) km_cookie_consent intatto, carattere per carattere");
}
{
  // Solo Google.
  const mem = memoriaPiena();
  for (const f of m.revokedProviders({ google: true, meta: true }, { google: false, meta: true })) m.clearProviderStorage?.(mem, f);
  assert(!("_gcl_ls" in mem.dati) && mem.dati.lastExternalReferrer === "facebook.com" && mem.dati.lastExternalReferrerTime === "1", "b3) revoca solo di Google: via «_gcl_ls», le voci di Meta restano");
}
{
  // Solo Meta.
  const mem = memoriaPiena();
  for (const f of m.revokedProviders({ google: true, meta: true }, { google: true, meta: false })) m.clearProviderStorage?.(mem, f);
  assert(mem.dati._gcl_ls === "g" && !("lastExternalReferrer" in mem.dati) && !("lastExternalReferrerTime" in mem.dati), "b4) revoca solo di Meta: via le due voci di Meta, «_gcl_ls» resta");
  assert(mem.dati.km_cookie_consent === SCELTA, "b5) …e km_cookie_consent intatto");
}
{
  const mem = memoriaPiena();
  const tolte = m.clearProviderStorage?.(mem, "google");
  assert(JSON.stringify(tolte) === JSON.stringify(["_gcl_ls"]), "b6) la pulizia dice cosa ha tolto");
  assert(mem.dati._gcl_lsx === "simile" && mem.dati.lastExternalReferrerTimeX === "simile", "b7) CONTROPROVA: i nomi sono esatti, «_gcl_lsx» e «…TimeX» restano");
}

// ===========================================================================
// c) L'APERTURA DELLA PAGINA: chi non ha un «sì» valido
// ===========================================================================
assert(typeof m.providersWithoutConsent === "function", "c1) esiste la regola dei fornitori senza consenso");
assert(m.providersWithoutConsent?.(null)?.join() === "google,meta", "c2) nessuna scelta: entrambi da pulire");
const ora = Date.UTC(2026, 10, 23, 12);
const scaduta = { getItem: () => JSON.stringify({ google: true, meta: true, adobeFonts: true, version: m.BANNER_VERSION, savedAt: Date.UTC(2026, 3, 1), idBrowser: null }) };
assert(m.readConsent(scaduta, ora) === null && m.providersWithoutConsent?.(m.readConsent(scaduta, ora))?.join() === "google,meta", "c3) scelta scaduta (oltre 6 mesi): letta come nessuna scelta, entrambi da pulire");
assert(m.providersWithoutConsent?.({ google: false, meta: false })?.join() === "google,meta", "c4) rifiuto di entrambi: entrambi da pulire");
assert(m.providersWithoutConsent?.({ google: true, meta: false })?.join() === "meta", "c5) solo Google sì: si pulisce solo Meta");
assert(m.providersWithoutConsent?.({ google: false, meta: true })?.join() === "google", "c6) solo Meta sì: si pulisce solo Google");
assert(m.providersWithoutConsent?.({ google: true, meta: true })?.length === 0, "c7) entrambi sì: niente da pulire");
assert(m.providersWithoutConsent?.({ google: null, meta: null })?.join() === "google,meta", "c8) senza risposta (null) non è un sì: entrambi da pulire");
{
  const mem = memoriaPiena();
  for (const f of m.providersWithoutConsent?.(null) ?? []) m.clearProviderStorage?.(mem, f);
  assert(chiavi(mem) === "_gcl_lsx,km_cookie_consent,km_ultimo_ordine,lastExternalReferrerTimeX", "c9) caricamento senza consenso: via le tre voci, km_cookie_consent e le altre intatte");
}

// ===========================================================================
// d) LA MEMORIA CHE DÀ ERRORE: il sito continua
// ===========================================================================
{
  let lanciato = false;
  let r;
  try {
    r = m.clearProviderStorage?.(memoriaPiena({ lanciaRimozione: true }), "google");
  } catch {
    lanciato = true;
  }
  assert(typeof m.clearProviderStorage === "function" && !lanciato && Array.isArray(r) && r.length === 0, "d1) removeItem che lancia: nessun errore, niente tolto");
  lanciato = false;
  try {
    r = m.clearProviderStorage?.(null, "meta");
  } catch {
    lanciato = true;
  }
  assert(typeof m.clearProviderStorage === "function" && !lanciato && Array.isArray(r) && r.length === 0, "d2) memoria assente (null): nessun errore");
  lanciato = false;
  const ostile = new Proxy({}, { get() { throw new Error("SecurityError"); } });
  try {
    r = m.clearProviderStorage?.(ostile, "meta");
  } catch {
    lanciato = true;
  }
  assert(typeof m.clearProviderStorage === "function" && !lanciato && Array.isArray(r) && r.length === 0, "d3) memoria che lancia anche solo a nominarla: nessun errore");
}
{
  // Una voce che fallisce non ferma le altre.
  const dati = { lastExternalReferrer: "a", lastExternalReferrerTime: "b" };
  const mem = { removeItem: (k) => { if (k === "lastExternalReferrer") throw new Error("x"); delete dati[k]; } };
  const r = m.clearProviderStorage?.(mem, "meta");
  assert(JSON.stringify(r) === JSON.stringify(["lastExternalReferrerTime"]) && !("lastExternalReferrerTime" in dati), "d4) una voce che dà errore non ferma la successiva");
}

// ===========================================================================
// e) IL CABLAGGIO NEL BANNER, letto come testo
// ===========================================================================
const b = leggi("app/cookie-consent.js") ?? "";
assert(/clearProviderStorage/.test(b) && /providersWithoutConsent/.test(b), "e1) il banner usa le due regole nuove");
const corpoPulisci = b.match(/function pulisciFornitori\(([\s\S]*?)\n\}/)?.[0] ?? "";
assert(/cookieDeletions\(/.test(corpoPulisci) && /clearProviderStorage\(memoria\(\), /.test(corpoPulisci), "e2) un solo punto pulisce un fornitore: i suoi cookie E la sua memoria, con la stessa logica");
assert(/try \{[\s\S]*document\.cookie = riga;[\s\S]*\} catch/.test(corpoPulisci), "e3) i cookie si cancellano dentro try/catch: il sito continua");
const iScegli = b.indexOf("function scegli(");
const corpoScegli = b.slice(iScegli, b.indexOf("\n  }\n", iScegli));
const iRevocati = corpoScegli.indexOf("revokedProviders(prima, salvata)");
const iPulRev = corpoScegli.indexOf("pulisciFornitori(revocati)");
const iReload = corpoScegli.indexOf("window.location.reload()");
assert(iRevocati > 0 && iPulRev > iRevocati && iReload > iPulRev, "e4) alla revoca: si puliscono i fornitori revocati, POI si ricarica");
const iEffetto = b.indexOf("const letta = readConsent(memoria());");
const corpoEffetto = b.slice(iEffetto, b.indexOf("}, [pathname]);", iEffetto));
const iPulApre = corpoEffetto.indexOf("pulisciFornitori(providersWithoutConsent(letta))");
const iCarica = corpoEffetto.indexOf("caricaTag(letta");
assert(iEffetto > 0 && iPulApre > 0 && iCarica > iPulApre, "e5) all'apertura: si puliscono i fornitori senza un «sì» valido, PRIMA di caricare i tag");
const effettoIntero = b.slice(b.lastIndexOf("useEffect(", iEffetto), iEffetto);
assert(/if \(isStaffPath\(pathname\)\) return;/.test(effettoIntero), "e6) sulle pagine staff non si pulisce niente (il componente non fa niente)");
assert(!/removeItem\(\s*["']km_cookie_consent/.test(b) && !/localStorage\.clear\(/.test(b), "e7) il banner non toglie mai km_cookie_consent e non svuota la memoria");
// CONTROPROVA di e5: la sonda direbbe di no se la pulizia venisse dopo il caricamento.
const sbagliato = "const letta = readConsent(memoria());\n caricaTag(letta, p, i);\n pulisciFornitori(providersWithoutConsent(letta));\n }, [pathname]);";
assert(!(sbagliato.indexOf("pulisciFornitori(providersWithoutConsent(letta))") < sbagliato.indexOf("caricaTag(letta")), "e8) CONTROPROVA: con la pulizia DOPO il caricamento, la sonda di e5 direbbe di no");

console.log(failures === 0 ? "\nTUTTI I TEST PASSATI" : `\n${failures} TEST FALLITI`);
process.exitCode = failures === 0 ? 0 : 1;
