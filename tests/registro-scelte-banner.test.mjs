// §65b (E4, decisioni di Andrea del 23/11/2026) — IL REGISTRO DELLE SCELTE DEL
// BANNER (pezzo 3).
// Esegui con: node tests/registro-scelte-banner.test.mjs   (exit code 0 = tutti PASS)
//
// Cosa si prova qui:
//   a) l'identificativo del browser e i controlli della richiesta (lib/consenso-registro.js);
//   b) l'identificativo DENTRO la scelta salvata (lib/cookie-consent.js);
//   c) il banner: scrive a ogni salvataggio, con keepalive, prima del ricaricamento;
//      il codice visibile in «Preferenze cookie»;
//   d) la rotta: risponde sempre 204, nel log solo il codice d'errore;
//   e) il file SQL: tabella, limiti, permessi, pulizia, registro di manutenzione;
//   f) ⚠️ la pulizia degli ordini, già online, resta IDENTICA;
//   g) l'avviso del pannello copre anche il lavoro nuovo;
//   h) il testo della versione v1 conservato in docs/banner/v1.md.
// ⚠️ NON si prova qui: la scrittura vera sul database e i limiti dal vivo (passi di Andrea).
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";

let failures = 0;
function assert(cond, msg) {
  console.log(`${cond ? "PASS" : "FAIL"} — ${msg}`);
  if (!cond) failures++;
}
function leggi(percorso) {
  try {
    return readFileSync(new URL(`../${percorso}`, import.meta.url), "utf8");
  } catch {
    return null;
  }
}
function sqlCompatto(testo) {
  return (testo ?? "")
    .split("\n")
    .map((r) => r.replace(/--.*$/, ""))
    .join("\n")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}
async function importa(percorso) {
  try {
    return await import(percorso);
  } catch {
    return null;
  }
}

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

// ===========================================================================
// a) IDENTIFICATIVO E CONTROLLI DELLA RICHIESTA
// ===========================================================================
const reg = await importa("../lib/consenso-registro.js");
assert(reg !== null, "a1) esiste lib/consenso-registro.js");
const R = reg ?? {};

assert(JSON.stringify(R.AZIONI_REGISTRO) === JSON.stringify(["accetta_tutti", "rifiuta_tutti", "chiudi_x", "personalizza"]), "a2) le quattro azioni registrate");
assert(JSON.stringify(R.ORIGINI_REGISTRO) === JSON.stringify(["banner", "preferenze"]), "a3) le due origini");
assert(R.PULSANTE_DA_AZIONE?.accept_all === "accetta_tutti" && R.PULSANTE_DA_AZIONE?.reject_all === "rifiuta_tutti" && R.PULSANTE_DA_AZIONE?.close === "chiudi_x" && R.PULSANTE_DA_AZIONE?.custom === "personalizza", "a4) ogni azione del banner ha il suo nome nel registro (la X = chiudi_x)");

const id1 = R.nuovoIdBrowser?.(globalThis.crypto);
assert(typeof id1 === "string" && UUID_V4.test(id1), `a5) l'identificativo nasce con randomUUID ed è un uuid v4 (${id1})`);
const soloRandom = { getRandomValues: (a) => globalThis.crypto.getRandomValues(a) };
const id2 = R.nuovoIdBrowser?.(soloRandom);
assert(typeof id2 === "string" && UUID_V4.test(id2), `a6) senza randomUUID si costruisce da getRandomValues, sempre v4 (${id2})`);
assert(R.nuovoIdBrowser?.(null) === null && R.nuovoIdBrowser?.({}) === null, "a7) senza nessun generatore casuale: nessun identificativo (e quindi nessuna riga), mai uno inventato");
assert(id1 !== R.nuovoIdBrowser?.(globalThis.crypto), "a8) due identificativi non sono uguali");

const ID = "3f2a6c1e-8b4d-4c2a-9e1f-0a1b2c3d4e5f";
const scelta = { google: true, meta: false, adobeFonts: true, idBrowser: ID, version: "v1", savedAt: 1 };
const corpo = R.corpoRegistro?.(scelta, "personalizza", "preferenze");
// ⚠️ ROVESCIATA APPOSTA il 23/11/2026 (decisione 21a di Andrea): il registro
// non salva più la scelta su Adobe Fonts, e il browser non la manda più. Il
// testo vecchio era:
//   a9)  …["adobeFonts", "azione", "google", "idBrowser", "meta", "origine", "versione"] … "il corpo ha esattamente 7 campi"
//   a10) …&& corpo?.adobeFonts === true, "…con i valori della scelta salvata"
assert(corpo && JSON.stringify(Object.keys(corpo).sort()) === JSON.stringify(["azione", "google", "idBrowser", "meta", "origine", "versione"]), `a9) il corpo ha esattamente 6 campi, senza Adobe (${corpo ? Object.keys(corpo).join(",") : "nessuno"})`);
assert(corpo?.versione === "v1" && corpo?.idBrowser === ID && corpo?.google === true && corpo?.meta === false && !("adobeFonts" in (corpo ?? {})), "a10) …con i valori della scelta salvata, e la scelta su Adobe NON parte");
assert(!corpo || !("savedAt" in corpo), "a11) l'ora NON parte dal browser: la mette il database");
assert(R.corpoRegistro?.({ ...scelta, idBrowser: null }, "personalizza", "banner") === null, "a12) senza identificativo non si manda niente");
assert(R.corpoRegistro?.(scelta, "boh", "banner") === null && R.corpoRegistro?.(scelta, "personalizza", "boh") === null, "a13) azione o origine sconosciute: niente");

// ⚠️ ROVESCIATA APPOSTA il 23/11/2026 (decisione 21a di Andrea): il registro
// non salva più la scelta su Adobe Fonts, e il browser non la manda più. Il
// testo vecchio era:
//   const giusto = JSON.stringify({ idBrowser: ID, versione: "v1", google: true, meta: false, adobeFonts: true, azione: "accetta_tutti", origine: "banner" });
//   a15) …p_adobe_fonts: true… "…e diventa i 7 parametri della funzione del database, con i nomi giusti"
const giusto = JSON.stringify({ idBrowser: ID, versione: "v1", google: true, meta: false, azione: "accetta_tutti", origine: "banner" });
const ok = R.rigaDaRichiesta?.(giusto, "v1");
assert(ok?.ok === true, "a14) una richiesta giusta passa");
assert(ok?.parametri && JSON.stringify(ok.parametri) === JSON.stringify({ p_id_browser: ID, p_versione_testo: "v1", p_google: true, p_meta: false, p_azione: "accetta_tutti", p_origine: "banner" }), "a15) …e diventa i 6 parametri della funzione del database, con i nomi giusti");
const rifiuti = [
  ["corpo troppo lungo", giusto.slice(0, -1) + "," + '"x":"' + "a".repeat(1100) + '"}'],
  ["non è JSON", "{non json"],
  ["un campo in più", JSON.stringify({ ...JSON.parse(giusto), ip: "1.2.3.4" })],
  ["un campo in meno", JSON.stringify({ ...JSON.parse(giusto), origine: undefined })],
  ["versione diversa dal server", JSON.stringify({ ...JSON.parse(giusto), versione: "v2" })],
  ["identificativo non uuid", JSON.stringify({ ...JSON.parse(giusto), idBrowser: "abc" })],
  ["google non booleano", JSON.stringify({ ...JSON.parse(giusto), google: "true" })],
  ["la scelta su Adobe (non si accetta più)", JSON.stringify({ ...JSON.parse(giusto), adobeFonts: true })],
  ["azione sconosciuta", JSON.stringify({ ...JSON.parse(giusto), azione: "accept_all" })],
  ["origine sconosciuta", JSON.stringify({ ...JSON.parse(giusto), origine: "staff" })],
  ["un array", "[]"],
  ["vuoto", ""],
];
for (const [nome, testo] of rifiuti) {
  assert(R.rigaDaRichiesta?.(testo, "v1")?.ok === false, `a16) rifiutata: ${nome}`);
}
assert(R.MAX_CORPO === 1024, "a17) il corpo massimo è 1 KB");

// ===========================================================================
// b) L'IDENTIFICATIVO DENTRO LA SCELTA SALVATA
// ===========================================================================
const cc = await importa("../lib/cookie-consent.js");
function memoria() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}
const T0 = Date.parse("2026-11-23T10:00:00Z");
const s1 = memoria();
cc?.saveConsent(s1, { google: true, meta: true, adobeFonts: true, idBrowser: ID }, T0);
const letta = cc?.readConsent(s1, T0 + 1000);
assert(letta?.idBrowser === ID, "b1) l'identificativo si salva dentro km_cookie_consent e si rilegge");
assert(JSON.parse(s1.getItem("km_cookie_consent") ?? "{}").idBrowser === ID, "b2) il campo si chiama idBrowser");
const s2 = memoria();
cc?.saveConsent(s2, { google: true, meta: true, idBrowser: "non-valido" }, T0);
assert(cc?.readConsent(s2, T0)?.idBrowser === null, "b3) un identificativo non valido si legge come assente");
const s3 = memoria();
cc?.saveConsent(s3, { google: true, meta: true, idBrowser: ID }, T0);
const scaduto = new Date(T0);
scaduto.setUTCMonth(scaduto.getUTCMonth() + 6);
assert(cc?.readConsent(s3, scaduto.getTime()) === null, "b4) dura quanto la scelta: a sei mesi la scelta, e con lei l'identificativo, non valgono più");

// ===========================================================================
// c) IL BANNER
// ===========================================================================
const banner = leggi("app/cookie-consent.js") ?? "";
assert(/from "\.\.\/lib\/consenso-registro"/.test(banner), "c1) il banner usa lib/consenso-registro");
const iScegli = banner.indexOf("function scegli(");
const corpoScegli = banner.slice(iScegli, banner.indexOf("\n  }\n", iScegli));
// ⚠️ ROVESCIATA APPOSTA il 23/11/2026 (decisione 19 di Andrea). Il testo vecchio era:
//   /prima\?\.idBrowser/ && /nuovoIdBrowser\(/ … "c2) scegli() riusa l'identificativo della scelta valida, altrimenti ne crea uno nuovo"
// Perché: l'identificativo ora nasce SOLO al primo consenso; chi rifiuta e basta non ne ha.
assert(/nuova\.idBrowser = prima\?\.idBrowser \|\| \(\(nuova\.google \|\| nuova\.meta\) \? nuovoIdBrowser\(globalThis\.crypto\) : null\)/.test(corpoScegli), "c2) scegli() riusa l'identificativo della scelta valida; ne crea uno nuovo SOLO se la scelta ha un consenso");
const iRegistra = corpoScegli.indexOf("registraScelta(");
const iReload = corpoScegli.indexOf("window.location.reload()");
assert(iRegistra > 0 && iReload > iRegistra, "c3) la riga parte PRIMA del ricaricamento della revoca");
const iSalva = corpoScegli.indexOf("saveConsent(");
assert(iSalva > 0 && iRegistra > iSalva, "c4) …e DOPO il salvataggio della scelta");
assert(/vista === "preferenze" \? "preferenze" : "banner"/.test(corpoScegli), "c5) l'origine dipende da dove si è scelto");
const iFn = banner.indexOf("function registraScelta(");
const fnRegistra = banner.slice(iFn, banner.indexOf("\n}\n", iFn));
assert(iFn > 0 && /fetch\("\/api\/consenso-banner"/.test(fnRegistra) && /keepalive: true/.test(fnRegistra), "c6) spara e dimentica: fetch alla rotta con keepalive");
assert(/try \{/.test(fnRegistra) && /\.catch\(\(\) => \{\}\)/.test(fnRegistra), "c7) un errore della scrittura non arriva mai al cliente");
assert(!/await/.test(fnRegistra), "c8) il banner non aspetta la risposta");
assert(/scegli\("custom", \{ google: true, meta: true, adobeFonts: bozza\.adobeFonts \}, "accetta_tutti"\)/.test(banner), "c9) «Accetta tutti» dentro Personalizza/Preferenze si registra come accetta_tutti");
assert(/scegli\("custom", \{ google: false, meta: false, adobeFonts: bozza\.adobeFonts \}, "rifiuta_tutti"\)/.test(banner), "c10) «Rifiuta tutti» dentro Personalizza/Preferenze si registra come rifiuta_tutti");
assert(/function chiudi\(\)[\s\S]{0,300}scegli\("close"\)/.test(banner), "c11) la X resta scegli(\"close\") (diventa chiudi_x nel registro)");
assert(/Codice della tua scelta: \{codice\}/.test(banner) && /vista === "preferenze" && codice/.test(banner), "c12) il codice si mostra solo in «Preferenze cookie», e solo se c'è");

// ===========================================================================
// d) LA ROTTA
// ===========================================================================
const rotta = leggi("app/api/consenso-banner/route.js");
assert(rotta !== null, "d1) esiste app/api/consenso-banner/route.js");
const r = rotta ?? "";
assert(/export async function POST\(/.test(r) && !/export async function GET\(/.test(r), "d2) solo POST");
const stati = [...r.matchAll(/status: (\d+)/g)].map((m) => m[1]);
assert(stati.length >= 1 && stati.every((x) => x === "204"), `d3) risponde SEMPRE 204 (${stati.join(",") || "nessuno"})`);
assert(/rigaDaRichiesta\(testo, BANNER_VERSION\)/.test(r), "d4) controlla la richiesta con la versione del server");
assert(/\.rpc\("registra_scelta_banner", esito\.parametri\)/.test(r), "d5) scrive solo dalla funzione del database");
const logs = [...r.matchAll(/console\.error\(([\s\S]*?)\);/g)].map((m) => m[1]);
assert(logs.length >= 1 && logs.every((l) => !/idBrowser|parametri|testo|esito\b/.test(l.replace(/"[^"]*"/g, ""))), "d6) nel log solo il codice d'errore: mai identificativo né corpo");
assert(/content-length/.test(r) && /MAX_CORPO/.test(r), "d7) un corpo dichiarato troppo grande non viene neppure letto");
assert(!/from\("/.test(r), "d8) nessuna lettura o scrittura diretta di tabelle");

// ===========================================================================
// e) IL FILE SQL
// ===========================================================================
const S_STRUTTURA = "sql/20261123_registro_scelte_banner_1_struttura.sql";
const S_OROLOGIO = "sql/20261123_registro_scelte_banner_2_orologio_accensione.sql";
const S_LETTURA = "sql/20261123_registro_scelte_banner_3_lettura_sola_lettura.sql";
const S_CONTROLLO = "sql/20261123_registro_scelte_banner_4_controllo_sola_lettura.sql";
const S_DELETE = "sql/20261123_registro_scelte_banner_5_cancella_righe_di_prova.sql";
const st = sqlCompatto(leggi(S_STRUTTURA));
assert(st !== "", `e1) esiste ${S_STRUTTURA}`);
assert(/^begin; .* commit;$/.test(st), "e2) tutto in una transazione");
assert(st.includes("create schema if not exists consensi;") && st.includes("revoke all on schema consensi from public, anon, authenticated;"), "e3) schema consensi, chiuso");
const tab = st.match(/create table if not exists consensi\.scelte_banner \((.*?)\);/)?.[1] ?? "";
for (const col of ["scelto_il timestamptz not null default now()", "id_browser uuid not null", "versione_testo text not null", "google boolean not null", "meta boolean not null", "adobe_fonts boolean not null", "azione text not null", "origine text not null"]) {
  assert(tab.includes(col), `e4) colonna: ${col}`);
}
assert(tab.includes("check (azione in ('accetta_tutti', 'rifiuta_tutti', 'chiudi_x', 'personalizza'))") && tab.includes("check (origine in ('banner', 'preferenze'))") && tab.includes("check (versione_testo ~ '^v[0-9]+$')"), "e5) i valori ammessi sono chiusi");
assert(!/\b(ip|indirizzo|order|ordine|customer|cliente|telefono|email)\b/.test(tab), "e6) nessun IP, nessun dato d'ordine o di cliente");
assert(st.includes("revoke all on table consensi.scelte_banner from public, anon, authenticated;") && st.includes("alter table consensi.scelte_banner enable row level security;"), "e7) la tabella è chiusa all'API pubblica");
const fnReg = st.slice(st.indexOf("create or replace function public.registra_scelta_banner("));
assert(fnReg.length > 0 && /security definer set search_path = ''/.test(fnReg.slice(0, 400)), "e8) la funzione di scrittura è security definer con search_path vuoto");
assert(fnReg.includes("interval '24 hours'") && fnReg.includes(">= 20 then"), "e9) limite: 20 righe per identificativo nelle 24 ore");
assert(fnReg.includes("interval '1 minute'") && fnReg.includes(">= 120 then"), "e10) limite: 120 righe al minuto in tutto");
assert(fnReg.includes("pg_advisory_xact_lock"), "e11) le scritture si mettono in fila: i limiti sono esatti anche con richieste insieme");
assert(st.includes("revoke execute on function public.registra_scelta_banner(uuid, text, boolean, boolean, boolean, text, text) from public, anon, authenticated;") && st.includes("grant execute on function public.registra_scelta_banner(uuid, text, boolean, boolean, boolean, text, text) to service_role;"), "e12) la scrive solo il server (service_role)");
const fnPul = st.slice(st.indexOf("create or replace function consensi.pulisci_scelte_banner("));
assert(fnPul.length > 0 && fnPul.includes("p_mesi not in (7, 13, 25)"), "e13) la pulizia accetta solo 7, 13 o 25 mesi");
assert(fnPul.includes("delete from consensi.scelte_banner where scelto_il < v_soglia;"), "e14) cancella solo le righe più vecchie della soglia");
assert(fnPul.includes("'pulizia_scelte_banner'") && fnPul.includes("insert into manutenzione.pulizia_registro"), "e15) scrive la sua riga nel registro di manutenzione, come lavoro pulizia_scelte_banner");
assert(fnPul.includes("when sqlstate 'kmp01' then v_esito := 'prova'") && fnPul.includes("when others then v_esito := 'errore'"), "e16) modo prova e errori come la pulizia degli ordini");
assert(st.includes("revoke execute on function consensi.pulisci_scelte_banner(integer, text) from public, anon, authenticated;"), "e17) la pulizia non è chiamabile dall'API");
assert(!/cron\./.test(st), "e18) il file di struttura NON accende l'orologio");
assert(st.includes("alter table manutenzione.pulizia_registro add column if not exists lavoro text not null default 'pulizia_ordini' check (lavoro in ('pulizia_ordini', 'pulizia_scelte_banner'));"), "e19) il registro di manutenzione ha la colonna lavoro, che per le righe di oggi vale pulizia_ordini");

const orol = sqlCompatto(leggi(S_OROLOGIO));
assert(orol.includes("cron.schedule( 'km-pulizia-scelte-banner', '11 23 * * *', $$select consensi.pulisci_scelte_banner(25, 'automatica')$$ );"), "e20) l'orologio separato: ogni notte alle 23:11 UTC, 25 mesi");
const lett = sqlCompatto(leggi(S_LETTURA));
assert(lett.includes("from consensi.scelte_banner") && lett.includes("where id_browser =") && !/\b(insert|update|delete|alter|drop|create)\b/.test(lett), "e21) la SELECT di lettura per identificativo, sola lettura");
const contr = sqlCompatto(leggi(S_CONTROLLO));
assert(contr.includes("has_function_privilege") && contr.includes("public.pulizia_stato()") && !/\b(insert|update|delete|alter|drop|create)\b/.test(contr), "e22) la SELECT di controllo, sola lettura");
const del = sqlCompatto(leggi(S_DELETE));
assert(/delete from consensi\.scelte_banner where id_browser = any \(array\[.*\]::uuid\[\]\) returning/.test(del), "e23) il DELETE delle righe di prova è per identificativo, e mostra cosa toglie");
assert(!/delete from consensi\.scelte_banner;/.test(del) && !/truncate/.test(del), "e24) CONTROPROVA: mai un DELETE senza condizione");

// ===========================================================================
// f) ⚠️ LA PULIZIA DEGLI ORDINI, GIÀ ONLINE, RESTA IDENTICA
// ===========================================================================
const vecchiaStruttura = leggi("sql/20261122_pulizia_automatica_1_struttura.sql");
const shaVecchia = vecchiaStruttura === null ? "" : createHash("sha256").update(vecchiaStruttura).digest("hex");
assert(shaVecchia === "ddd2642e4d471554b94e372a78085cd0ac696990faafb8776291910a2294c788", "f1) il file della pulizia degli ordini è quello lanciato il 22/11 (sha ddd2642e…)");
assert(!st.includes("pulizia_ordini_mai_pagati"), "f2) il file nuovo non ridefinisce la funzione della pulizia degli ordini");
assert(!/alter table manutenzione\.pulizia_registro (drop|alter column|rename)/.test(st) && !/drop constraint/.test(st), "f3) il registro di manutenzione si ALLARGA soltanto: niente tolto, niente cambiato");
const vecchiaInsert = sqlCompatto(vecchiaStruttura).match(/insert into manutenzione\.pulizia_registro \(\s*modo, soglia_giorni, soglia_istante, esito, motivo,[^)]*\)/)?.[0] ?? "";
assert(vecchiaInsert !== "" && !vecchiaInsert.includes("lavoro"), "f4) la riga di registro della pulizia degli ordini non nomina «lavoro»: prende il valore predefinito pulizia_ordini");
const statoNuovo = st.slice(st.indexOf("create or replace function public.pulizia_stato()"));
const statoVecchio = sqlCompatto(vecchiaStruttura).slice(sqlCompatto(vecchiaStruttura).indexOf("create or replace function public.pulizia_stato()"));
assert(statoNuovo.length > 0, "f5) pulizia_stato() si aggiorna nel file nuovo");
const chiaviOrdini = ["'ultima', ( select jsonb_build_object('eseguita_il', r.eseguita_il, 'esito', r.esito, 'modo', r.modo) from manutenzione.pulizia_registro r where r.modo in ('automatica', 'manuale') and r.lavoro = 'pulizia_ordini'", "'ultima_ok', ( select jsonb_build_object('eseguita_il', r.eseguita_il, 'modo', r.modo) from manutenzione.pulizia_registro r where r.modo in ('automatica', 'manuale') and r.esito = 'ok' and r.lavoro = 'pulizia_ordini'"];
assert(chiaviOrdini.every((k) => statoNuovo.includes(k)), "f6) le due chiavi di oggi (ultima, ultima_ok) restano, con lo stesso contenuto, filtrate sul solo lavoro pulizia_ordini");
assert(statoVecchio.includes("'ultima', ( select jsonb_build_object('eseguita_il', r.eseguita_il, 'esito', r.esito, 'modo', r.modo) from manutenzione.pulizia_registro r where r.modo in ('automatica', 'manuale') order by"), "f7) CONTROPROVA: nella versione online le stesse chiavi non avevano il filtro (tutte le righe erano della pulizia ordini)");
assert(statoNuovo.includes("'scelte_ultima'") && statoNuovo.includes("'scelte_ultima_ok'") && (statoNuovo.match(/r\.lavoro = 'pulizia_scelte_banner'/g) ?? []).length === 2, "f8) due chiavi nuove per il lavoro delle scelte");
assert(/security definer set search_path = ''/.test(statoNuovo.slice(0, 300)) && st.includes("revoke execute on function public.pulizia_stato() from public, anon, authenticated;") && st.includes("grant execute on function public.pulizia_stato() to service_role;"), "f9) stessi permessi di prima su pulizia_stato()");

// ===========================================================================
// g) L'AVVISO COPRE ANCHE IL LAVORO NUOVO
// ===========================================================================
const ps = await importa("../lib/pulizia-stato.js");
const ORA = Date.parse("2026-11-24T08:00:00Z");
const okOrdini = { letturaRiuscita: true, ultima: { eseguita_il: "2026-11-23T23:01:00Z", esito: "ok", modo: "automatica" }, ultimaOk: { eseguita_il: "2026-11-23T23:01:00Z" }, now: ORA };
const statoOrd = ps?.statoAvvisoPulizia(okOrdini);
const testoOrd = ps?.testoAvvisoPulizia({ acceso: true, motivo: "nessuna_ok", ultimaOkIl: null });
assert(statoOrd?.acceso === false && typeof testoOrd === "string" && testoOrd.includes("degli ordini mai pagati"), "g1) per la pulizia degli ordini la regola e il testo sono quelli di prima");
const testoSc = ps?.testoAvvisoPulizia({ acceso: true, motivo: "nessuna_ok", ultimaOkIl: null }, "scelte");
assert(typeof testoSc === "string" && testoSc.includes("registro delle scelte sui cookie") && !testoSc.includes("ordini mai pagati"), `g2) per il lavoro nuovo il testo nomina il registro delle scelte («${testoSc}»)`);
assert(ps?.testoAvvisoPulizia(statoOrd, "scelte") === null, "g3) spento resta spento anche col soggetto nuovo");
const rottaStato = leggi("app/api/staff/pulizia-stato/route.js") ?? "";
assert(/avvisoScelte: statoAvvisoPulizia\(\{/.test(rottaStato) && /data\.scelte_ultima \?\? null/.test(rottaStato) && /data\.scelte_ultima_ok \?\? null/.test(rottaStato), "g4) la rotta dello stato calcola anche l'avviso del lavoro nuovo, con la stessa regola");
assert(/avvisoScelte: statoAvvisoPulizia\(\{ letturaRiuscita: false \}\)/.test(rottaStato), "g5) se la lettura fallisce, anche il secondo avviso è acceso");
const comp = leggi("app/staff/avviso-pulizia.js") ?? "";
assert(/testoAvvisoPulizia\(data\?\.avviso\)/.test(comp) && /testoAvvisoPulizia\(data\?\.avvisoScelte, "scelte"\)/.test(comp), "g6) il pannello mostra tutti e due gli avvisi");

// ===========================================================================
// h) IL TESTO DELLA VERSIONE v1
// ===========================================================================
const v1 = leggi("docs/banner/v1.md");
assert(v1 !== null, "h1) esiste docs/banner/v1.md");
const testiBanner = [
  "Usiamo la memoria del browser necessaria per far funzionare il sito e gestire il tuo ordine. Con il tuo consenso, utilizziamo anche cookie e strumenti di Google e Meta per misurare gli ordini generati dagli annunci e aiutare a ottimizzare le campagne.",
  "Puoi accettarli tutti, rifiutarli o scegliere quali attivare. Se chiudi questo banner, continuerai a navigare senza attivare gli strumenti facoltativi. Puoi cambiare scelta in qualsiasi momento da «Preferenze cookie».",
  "misura gli ordini arrivati dagli annunci Google.",
  "misura gli ordini arrivati dagli annunci Meta.",
  "carattere del tuo dispositivo dalla pagina successiva.",
];
const bannerPiatto = banner.replace(/\s+/g, " ");
const v1Piatto = (v1 ?? "").replace(/\s+/g, " ");
assert(testiBanner.every((t) => bannerPiatto.includes(t)), "h2) i testi di riferimento sono davvero nel banner di oggi");
assert(testiBanner.every((t) => v1Piatto.includes(t)), "h3) …e sono conservati parola per parola in docs/banner/v1.md");
assert(/versione: v1/i.test(v1 ?? "") && cc?.BANNER_VERSION === "v1", "h4) il file dichiara v1, ed è la versione del codice");

console.log(failures === 0 ? "\nTUTTI I TEST PASSATI" : `\n${failures} TEST FALLITI`);
process.exitCode = failures === 0 ? 0 : 1;
