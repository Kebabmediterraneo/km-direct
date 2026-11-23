// §65b (decisioni 15a, 16a, 18-20 di Andrea, 23/11/2026) — IL REGISTRO TIENE SOLO
// CONSENSI E REVOCHE; L'OPPOSIZIONE AD ADOBE DURA E SI RINNOVA.
// Esegui con: node tests/consensi-revoche-font.test.mjs   (exit code 0 = tutti PASS)
//
//   a) quando il browser manda la riga (consenso o revoca, mai un rifiuto puro);
//   b) il database rifiuta una riga senza consensi che non sia una revoca (file 6);
//   c) la scelta su Adobe si legge dal cookie, non riparte da «sì» (il difetto);
//   d) il cookie dura 400 giorni e il middleware lo riscrive a ogni visita,
//      senza Supabase, con il ramo staff invariato.
// ⚠️ NON si prova qui: il database vivo e il comportamento reale dei browser
// (Safari, Firefox): passi di prova di Andrea.
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
async function importa(p) {
  try {
    return await import(p);
  } catch {
    return null;
  }
}

// ===========================================================================
// a) QUANDO SI MANDA LA RIGA
// ===========================================================================
const reg = (await importa("../lib/consenso-registro.js")) ?? {};
const dr = reg.deveRegistrare ?? (() => null);
const SI = { google: true, meta: false };
const NO = { google: false, meta: false };
assert(dr(null, SI) === true, "a1) primo consenso: si registra");
assert(dr(NO, SI) === true, "a2) consenso dopo un rifiuto: si registra");
assert(dr(SI, { google: true, meta: true }) === true, "a3) un consenso che cambia (resta almeno uno): si registra");
assert(dr({ google: true, meta: true }, { google: false, meta: true }) === true, "a4) revoca parziale (resta Meta): si registra, ha un consenso");
assert(dr(SI, NO) === true, "a5) REVOCA (prima un consenso, ora nessuno): si registra");
assert(dr(null, NO) === false, "a6) rifiuto puro, prima nessuna scelta: NON si registra");
assert(dr(NO, NO) === false, "a7) rifiuto dopo un rifiuto (o dopo una revoca): NON si registra");
assert(dr(NO, { ...NO, adobeFonts: false }) === false, "a8) cambio della sola scelta su Adobe senza consensi: NON si registra");
assert(dr({ google: null, meta: null }, NO) === false, "a9) da «non ancora scelto» a rifiuto: NON si registra");

const banner = leggi("app/cookie-consent.js") ?? "";
const iScegli = banner.indexOf("function scegli(");
const corpoScegli = banner.slice(iScegli, banner.indexOf("\n  }\n", iScegli));
assert(/if \(deveRegistrare\(prima, salvata\)\) \{\s*registraScelta\(/.test(corpoScegli), "a10) scegli() manda la riga solo se deveRegistrare(prima, salvata)");
assert(/import \{[^}]*deveRegistrare[^}]*\} from "\.\.\/lib\/consenso-registro"/.test(banner), "a11) …importata dal modulo provato qui");
assert(/vista === "preferenze" && codice && \(/.test(banner), "a12) il codice si mostra solo se esiste");

// ===========================================================================
// b) IL DATABASE: SOLO CONSENSI E REVOCHE
// ===========================================================================
const f6 = sqlCompatto(leggi("sql/20261123_registro_scelte_banner_6_solo_consensi_e_revoche.sql"));
const f1 = sqlCompatto(leggi("sql/20261123_registro_scelte_banner_1_struttura.sql"));
assert(f6 !== "", "b1) esiste il file 6");
assert(/^begin; .* commit;$/.test(f6), "b2) una transazione");
assert(f6.includes("create or replace function public.registra_scelta_banner( p_id_browser uuid, p_versione_testo text, p_google boolean, p_meta boolean, p_adobe_fonts boolean, p_azione text, p_origine text )"), "b3) stessa funzione, stessa firma");
assert(/security definer set search_path = ''/.test(f6), "b4) stessa protezione: security definer, search_path vuoto");
const regola = "if not (p_google or p_meta) then select (s.google or s.meta) into v_ultima_con_consenso from consensi.scelte_banner s where s.id_browser = p_id_browser order by s.scelto_il desc, s.id desc limit 1; if v_ultima_con_consenso is not true then return 'ignorata: nessun consenso da revocare'; end if; end if;";
assert(f6.includes(regola), "b5) la regola: una riga senza consensi passa solo se l'ultima riga di quel codice aveva un consenso");
const iLock = f6.indexOf("pg_advisory_xact_lock");
assert(iLock > 0 && f6.indexOf(regola) > iLock, "b6) la regola si controlla DOPO il blocco: due richieste insieme non la scavalcano");
for (const pezzo of [
  "if p_id_browser is null or p_versione_testo is null or p_google is null or p_meta is null or p_adobe_fonts is null or p_azione is null or p_origine is null then return 'rifiutata: dati mancanti'; end if;",
  "where id_browser = p_id_browser and scelto_il > now() - interval '24 hours'; if v_n >= 20 then return 'ignorata: limite per browser'; end if;",
  "where scelto_il > now() - interval '1 minute'; if v_n >= 120 then return 'ignorata: limite totale'; end if;",
  "insert into consensi.scelte_banner (id_browser, versione_testo, google, meta, adobe_fonts, azione, origine) values (p_id_browser, p_versione_testo, p_google, p_meta, p_adobe_fonts, p_azione, p_origine); return 'scritta';",
]) {
  assert(f6.includes(pezzo) && f1.includes(pezzo), `b7) identico al file 1: ${pezzo.slice(0, 60)}…`);
}
assert(f6.includes("revoke execute on function public.registra_scelta_banner(uuid, text, boolean, boolean, boolean, text, text) from public, anon, authenticated;") && f6.includes("grant execute on function public.registra_scelta_banner(uuid, text, boolean, boolean, boolean, text, text) to service_role;"), "b8) stessi permessi");
for (const vietato of ["pulisci_scelte_banner", "pulizia_ordini_mai_pagati", "pulizia_stato", "manutenzione.", "create table", "alter table", "drop ", "cron."]) {
  assert(!f6.includes(vietato), `b9) il file 6 non tocca: ${vietato}`);
}
// CONTROPROVA della sonda b5: senza la riga «is not true» non passerebbe.
assert(!f6.replace("is not true", "is null").includes(regola), "b10) CONTROPROVA: con «is null» al posto di «is not true» la regola non risulta (un NULL farebbe passare un rifiuto puro)");
const f4 = sqlCompatto(leggi("sql/20261123_registro_scelte_banner_4_controllo_sola_lettura.sql"));
assert(f4.includes("pg_get_functiondef") && f4.includes("nessun consenso da revocare") && !/\b(insert|update|delete|alter|drop|create)\b/.test(f4), "b11) il controllo (sola lettura) dice se la regola della revoca è attiva");

// ===========================================================================
// c) LA SCELTA SU ADOBE SI LEGGE DAL COOKIE
// ===========================================================================
const cc = (await importa("../lib/cookie-consent.js")) ?? {};
const spento = cc.fontSpentoNelCookie ?? (() => null);
assert(spento("altro=1; km_font_off=1; x=2") === true, "c1) km_font_off=1 nel cookie → opposizione");
assert(spento("km_font_off=; x=2") === false && spento("") === false && spento(null) === false, "c2) senza il cookie (o vuoto) → nessuna opposizione");
assert(spento("xkm_font_off=1") === false, "c3) CONTROPROVA: un altro cookie col nome simile non conta");
const daCookie = cc.choiceFromAction?.("accept_all", null, null, false);
assert(daCookie?.adobeFonts === false, "c4) ⚠️ IL DIFETTO: senza scelta salvata (scaduta) ma col cookie, «Accetta tutti» NON riaccende Adobe");
assert(cc.choiceFromAction?.("accept_all", null, null)?.adobeFonts === true, "c5) senza cookie e senza scelta resta «sì» (legittimo interesse)");
assert(cc.choiceFromAction?.("reject_all", { adobeFonts: true }, null, false)?.adobeFonts === false, "c6) il cookie vince anche su una scelta salvata che dice il contrario");
assert(cc.choiceFromAction?.("custom", null, { google: true, meta: false, adobeFonts: true }, false)?.adobeFonts === true, "c7) chi riaccende Adobe da «Preferenze cookie» lo riaccende davvero");
assert((banner.match(/!fontSpentoNelCookie\(document\.cookie\)/g) ?? []).length >= 3, "c8) il banner legge il cookie in scegli(), in «Preferenze cookie» e in «Personalizza»");
assert(!/adobeFonts: attuale \? attuale\.adobeFonts !== false : true/.test(banner) && !/adobeFonts: consent \? consent\.adobeFonts !== false : true/.test(banner), "c9) non resta nessun «riparte da sì» nel banner");

// ===========================================================================
// d) 400 GIORNI E RINNOVO A OGNI VISITA
// ===========================================================================
assert(cc.FONT_MAX_AGE_S === 34560000, `d1) la durata è 400 giorni = 34560000 secondi (${cc.FONT_MAX_AGE_S})`);
assert(/Max-Age=34560000/.test(cc.fontCookieString?.(false, true) ?? ""), "d2) il browser lo scrive per 400 giorni");
const mw = leggi("middleware.js") ?? "";
const matcher = mw.match(/matcher: (\[[^\]]*\])/)?.[1] ?? "";
assert(["\"/\"", "\"/privacy\"", "\"/conferma\"", "\"/staff/:path*\"", "\"/api/staff/:path*\""].every((m) => matcher.includes(m)), `d3) il middleware gira sulle pagine cliente e, come prima, su quelle staff (${matcher})`);
// ⚠️ RISCRITTA PRIMA DEL PRIMO VERDE (23/11). Il testo vecchio cercava:
//   "if (!isStaffPath(request.nextUrl.pathname))"
// Ma `isStaffPath` di lib/cookie-consent guarda solo le PAGINE /staff, non le
// rotte /api/staff: usata qui, avrebbe fatto saltare il controllo della
// sessione alle API dello staff. Il middleware ha una funzione sua che copre
// tutte e due, e la prova d4b lo verifica.
const iRamo = mw.indexOf("if (!isPercorsoStaff(request.nextUrl.pathname))");
const fnStaff = mw.slice(mw.indexOf("function isPercorsoStaff("), mw.indexOf("\n}\n", mw.indexOf("function isPercorsoStaff(")));
assert(/pathname\.startsWith\("\/staff\/"\)/.test(fnStaff) && /pathname\.startsWith\("\/api\/staff\/"\)/.test(fnStaff), "d4b) ⚠️ le rotte /api/staff passano ancora dal controllo della sessione");
const iSupabase = mw.indexOf("createServerClient(");
assert(iRamo > 0 && iSupabase > iRamo, "d4) il ramo delle pagine cliente viene PRIMA di Supabase…");
const ramo = mw.slice(iRamo, mw.indexOf("\n  }\n", iRamo));
assert(/return /.test(ramo) && !/supabase|getUser/i.test(ramo), "d5) …e ritorna senza nessuna chiamata a Supabase");
assert(/request\.cookies\.get\(FONT_COOKIE\)\?\.value === "1"/.test(ramo) && /response\.cookies\.set\(FONT_COOKIE, "1", \{/.test(ramo) && /maxAge: FONT_MAX_AGE_S/.test(ramo), "d6) se il cliente si è opposto, la risposta riscrive km_font_off=1 per altri 400 giorni");
assert(/path: "\/"/.test(ramo) && /sameSite: "lax"/.test(ramo) && /secure: request\.nextUrl\.protocol === "https:"/.test(ramo) && !/httpOnly: true/.test(ramo), "d7) stesso cookie del browser: Path=/, SameSite=Lax, Secure su https, NON HttpOnly (il browser deve poterlo togliere)");
assert(!/cookies\.set\([^)]*"0"|cookies\.delete/.test(ramo), "d8) il middleware non crea e non toglie mai l'opposizione: la rinnova soltanto");

console.log(failures === 0 ? "\nTUTTI I TEST PASSATI" : `\n${failures} TEST FALLITI`);
process.exitCode = failures === 0 ? 0 : 1;
