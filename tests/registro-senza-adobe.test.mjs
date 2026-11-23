// §65b (decisione 21a di Andrea, 23/11/2026) — IL REGISTRO DELLE SCELTE NON
// SALVA PIÙ LA SCELTA SU ADOBE FONTS (non serve a dimostrare nessun consenso).
// Esegui con: node tests/registro-senza-adobe.test.mjs   (exit code 0 = tutti PASS)
//
//   a) il file 7: si ferma se la tabella non è vuota; toglie la colonna; toglie la
//      funzione a 7 parametri e la ricrea a 6, IDENTICA per il resto al file 6;
//   b) il browser non manda più la scelta su Adobe, la rotta non la accetta;
//   c) i file 3 e 4 seguono.
// ⚠️ NON si prova qui: il database vivo (passi di prova di Andrea).
import { readFileSync } from "node:fs";

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
function sqlCompatto(t) {
  return (t ?? "").split("\n").map((r) => r.replace(/--.*$/, "")).join("\n").replace(/\s+/g, " ").trim().toLowerCase();
}

// ===========================================================================
// a) IL FILE 7
// ===========================================================================
const f7 = sqlCompatto(leggi("sql/20261123_registro_scelte_banner_7_senza_adobe.sql"));
const f6 = sqlCompatto(leggi("sql/20261123_registro_scelte_banner_6_solo_consensi_e_revoche.sql"));
assert(f7 !== "", "a1) esiste il file 7");
assert(/^begin; .* commit;$/.test(f7), "a2) tutto in una transazione: o tutto o niente");
const freno = "if exists (select 1 from consensi.scelte_banner) then raise exception";
const iFreno = f7.indexOf(freno);
const iDrop = f7.indexOf("alter table consensi.scelte_banner drop column adobe_fonts;");
assert(iFreno > 0 && iDrop > iFreno, "a3) ⚠️ PRIMA si controlla che la tabella sia vuota, POI si toglie la colonna: nessun dato vero può andare perso");
assert(iDrop > 0, "a4) la colonna adobe_fonts si toglie");
assert(f7.includes("drop function public.registra_scelta_banner(uuid, text, boolean, boolean, boolean, text, text);"), "a5) la funzione a 7 parametri si toglie (nessuno la chiama più)");
const firma6 = "create function public.registra_scelta_banner( p_id_browser uuid, p_versione_testo text, p_google boolean, p_meta boolean, p_azione text, p_origine text )";
assert(f7.includes(firma6), "a6) si ricrea a 6 parametri, senza p_adobe_fonts");
assert(!f7.slice(f7.indexOf(firma6)).includes("adobe"), "a7) nella funzione nuova Adobe non compare più");
// Il resto identico al file 6, tolta Adobe.
const corpo6 = f6.slice(f6.indexOf("returns text"), f6.indexOf("$$; revoke"));
const atteso = corpo6
  .replace(" or p_adobe_fonts is null", "")
  .replace("(id_browser, versione_testo, google, meta, adobe_fonts, azione, origine)", "(id_browser, versione_testo, google, meta, azione, origine)")
  .replace("(p_id_browser, p_versione_testo, p_google, p_meta, p_adobe_fonts, p_azione, p_origine)", "(p_id_browser, p_versione_testo, p_google, p_meta, p_azione, p_origine)");
assert(corpo6.length > 0 && atteso !== corpo6, "a8) dal file 6 si ricava il corpo atteso togliendo solo Adobe (tre punti)");
assert(f7.includes(atteso), "a9) il corpo della funzione nuova è quello del file 6 tolta Adobe: stessi controlli, stessi limiti, stessa regola della revoca, stessa protezione");
assert(f7.includes("revoke execute on function public.registra_scelta_banner(uuid, text, boolean, boolean, text, text) from public, anon, authenticated;") && f7.includes("grant execute on function public.registra_scelta_banner(uuid, text, boolean, boolean, text, text) to service_role;"), "a10) stessi permessi, sulla firma nuova");
for (const vietato of ["pulisci_scelte_banner", "pulizia_ordini_mai_pagati", "pulizia_stato", "manutenzione.", "cron.", "create table"]) {
  assert(!f7.includes(vietato), `a11) il file 7 non tocca: ${vietato}`);
}
// CONTROPROVA di a9: un corpo con un limite cambiato non risulterebbe.
assert(!f7.replace(">= 20 then", ">= 21 then").includes(atteso), "a12) CONTROPROVA: con il limite cambiato da 20 a 21 il confronto di a9 se ne accorge");

// ===========================================================================
// b) IL BROWSER E LA ROTTA
// ===========================================================================
const reg = await import("../lib/consenso-registro.js").catch(() => ({}));
const corpo = reg.corpoRegistro?.({ google: true, meta: false, adobeFonts: false, idBrowser: "3f2a6c1e-8b4d-4c2a-9e1f-0a1b2c3d4e5f", version: "v1" }, "personalizza", "banner");
assert(corpo && !("adobeFonts" in corpo), "b1) il browser non manda la scelta su Adobe, nemmeno quando è spenta");
const conAdobe = JSON.stringify({ idBrowser: "3f2a6c1e-8b4d-4c2a-9e1f-0a1b2c3d4e5f", versione: "v1", google: true, meta: false, adobeFonts: false, azione: "personalizza", origine: "banner" });
assert(reg.rigaDaRichiesta?.(conAdobe, "v1")?.ok === false, "b2) la rotta rifiuta una richiesta che porta ancora la scelta su Adobe");
const lib = leggi("lib/consenso-registro.js") ?? "";
assert(!/adobe/i.test(lib.replace(/\/\/.*$/gm, "")), "b3) nel codice del modulo del registro Adobe non compare più (solo nei commenti)");

// ===========================================================================
// c) FILE 3 E 4
// ===========================================================================
const f3 = sqlCompatto(leggi("sql/20261123_registro_scelte_banner_3_lettura_sola_lettura.sql"));
assert(f3.includes("versione_testo, azione, origine, google, meta from consensi.scelte_banner") && !f3.includes("adobe"), "c1) la lettura non chiede più adobe_fonts");
const f4 = sqlCompatto(leggi("sql/20261123_registro_scelte_banner_4_controllo_sola_lettura.sql"));
assert(!/\b(insert|update|delete|alter|drop|create)\b/.test(f4), "c2) il controllo resta sola lettura");
assert(f4.includes("to_regprocedure('public.registra_scelta_banner(uuid,text,boolean,boolean,text,text)') is not null as scrittura_creata"), "c3) il controllo cerca la funzione a 6 parametri");
assert(f4.includes("to_regprocedure('public.registra_scelta_banner(uuid,text,boolean,boolean,boolean,text,text)') is null as firma_vecchia_tolta"), "c4) …e verifica che quella a 7 non ci sia più");
assert(f4.includes("as colonna_adobe_tolta"), "c5) …e che la colonna adobe_fonts non ci sia più");
assert(!f4.includes("registra_scelta_banner(uuid,text,boolean,boolean,boolean,text,text)', 'execute')") && !f4.includes("registra_scelta_banner(uuid,text,boolean,boolean,boolean,text,text)'::regprocedure"), "c6) i permessi e la regola della revoca si leggono sulla firma nuova");

console.log(failures === 0 ? "\nTUTTI I TEST PASSATI" : `\n${failures} TEST FALLITI`);
process.exitCode = failures === 0 ? 0 : 1;
