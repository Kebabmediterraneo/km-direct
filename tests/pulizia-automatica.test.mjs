// §69 (22/11/2026) — PULIZIA AUTOMATICA NOTTURNA degli ordini mai pagati.
// Esegui con: node tests/pulizia-automatica.test.mjs   (exit code 0 = tutti PASS)
//
// Cosa si prova qui:
//   a) la regola dell'avviso rosso nel pannello staff (lib/pulizia-stato.js);
//   b) che la funzione SQL nuova porti le STESSE regole, gli STESSI freni e gli
//      STESSI controlli finali dello script manuale `pulizia_mensile_…` — non
//      riscritti a memoria: estratti dal file vecchio e cercati nel nuovo;
//   c) permessi, intervallo 20-30, modi, registro senza dati personali;
//   d) i file di conteggio, controprova e orologio;
//   e) la rotta e l'avviso staff, il filtro «Ultimi 28 giorni».
// ⚠️ NON si prova qui: che la funzione giri davvero sul database (lo dice la
// prova dal vivo di Andrea), e il ramo «freno» dal vivo (servirebbero dati
// fabbricati, che non si fanno).
import { readFileSync, existsSync } from "node:fs";

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

// Toglie i commenti SQL di riga e comprime gli spazi: così il confronto fra i
// due file guarda le istruzioni, non l'impaginazione.
function sqlSenzaCommenti(testo) {
  return (testo ?? "")
    .split("\n")
    .map((riga) => riga.replace(/--.*$/, ""))
    .join("\n");
}
function compatta(testo) {
  return testo.replace(/\s+/g, " ").trim().toLowerCase();
}

const VECCHIO_PERCORSO = "sql/pulizia_mensile_ordini_mai_pagati.sql";
const STRUTTURA_PERCORSO = "sql/20261122_pulizia_automatica_1_struttura.sql";
const CONTEGGIO_PERCORSO = "sql/20261122_pulizia_automatica_2_conteggio_sola_lettura.sql";
const CONTROPROVA_PERCORSO = "sql/20261122_pulizia_automatica_3_controprova_sola_lettura.sql";
const OROLOGIO_PERCORSO = "sql/20261122_pulizia_automatica_4_orologio_accensione.sql";
const VERIFICA_PERCORSO = "sql/20261122_pulizia_automatica_5_orologio_verifica_sola_lettura.sql";

// ===========================================================================
// a) LA REGOLA DELL'AVVISO
// ===========================================================================
let mod = null;
try {
  mod = await import("../lib/pulizia-stato.js");
} catch {
  mod = null;
}
assert(mod !== null, "a1) esiste lib/pulizia-stato.js");
const stato = mod?.statoAvvisoPulizia ?? (() => ({ acceso: null }));
const testo = mod?.testoAvvisoPulizia ?? (() => null);

const ORA = Date.parse("2026-11-22T12:00:00Z");
const fa = (ore) => new Date(ORA - ore * 3600 * 1000).toISOString();

assert(mod?.ORE_MASSIME_SENZA_OK === 26, `a2) la soglia dell'avviso è 26 ore (${mod?.ORE_MASSIME_SENZA_OK})`);

let s = stato({ letturaRiuscita: true, ultima: { eseguita_il: fa(2), esito: "ok", modo: "automatica" }, ultimaOk: { eseguita_il: fa(2) }, now: ORA });
assert(s.acceso === false, "a3) ultima riuscita 2 ore fa → avviso SPENTO");

s = stato({ letturaRiuscita: true, ultima: { eseguita_il: fa(25.98), esito: "ok", modo: "automatica" }, ultimaOk: { eseguita_il: fa(25.98) }, now: ORA });
assert(s.acceso === false, "a4) ultima riuscita poco meno di 26 ore fa → avviso SPENTO");

s = stato({ letturaRiuscita: true, ultima: { eseguita_il: fa(26.02), esito: "ok", modo: "automatica" }, ultimaOk: { eseguita_il: fa(26.02) }, now: ORA });
assert(s.acceso === true && s.motivo === "ok_troppo_vecchia", `a5) ultima riuscita poco più di 26 ore fa → avviso ACCESO, motivo ok_troppo_vecchia (${s.motivo})`);

s = stato({ letturaRiuscita: true, ultima: { eseguita_il: fa(1), esito: "fermata", modo: "automatica" }, ultimaOk: { eseguita_il: fa(25) }, now: ORA });
assert(s.acceso === true && s.motivo === "ultima_non_ok", `a6) ultima esecuzione FERMATA dal freno → avviso ACCESO anche con una riuscita recente (${s.motivo})`);

s = stato({ letturaRiuscita: true, ultima: { eseguita_il: fa(1), esito: "errore", modo: "manuale" }, ultimaOk: { eseguita_il: fa(3) }, now: ORA });
assert(s.acceso === true && s.motivo === "ultima_non_ok", `a7) ultima esecuzione in ERRORE → avviso ACCESO (${s.motivo})`);

s = stato({ letturaRiuscita: true, ultima: null, ultimaOk: null, now: ORA });
assert(s.acceso === true && s.motivo === "nessuna_ok", `a8) registro vuoto → avviso ACCESO, motivo nessuna_ok (${s.motivo})`);

s = stato({ letturaRiuscita: true, ultima: { eseguita_il: fa(1), esito: "ok", modo: "manuale" }, ultimaOk: null, now: ORA });
assert(s.acceso === true && s.motivo === "nessuna_ok", `a9) dati incoerenti (ultima ok ma nessuna ok) → avviso ACCESO (${s.motivo})`);

s = stato({ letturaRiuscita: false, now: ORA });
assert(s.acceso === true && s.motivo === "non_leggibile", `a10) stato non leggibile → avviso ACCESO, motivo non_leggibile (${s.motivo})`);

s = stato({ letturaRiuscita: true, ultima: { eseguita_il: "non-una-data", esito: "ok", modo: "automatica" }, ultimaOk: { eseguita_il: "non-una-data" }, now: ORA });
assert(s.acceso === true && s.motivo === "non_leggibile", `a11) data illeggibile → avviso ACCESO, motivo non_leggibile (${s.motivo})`);

s = stato({ letturaRiuscita: true, ultima: { eseguita_il: fa(2), esito: "ok", modo: "manuale" }, ultimaOk: { eseguita_il: fa(2) }, now: ORA });
assert(s.acceso === false, "a12) anche una pulizia MANUALE riuscita spegne l'avviso (è la procedura d'emergenza)");

// Il testo: c'è quando è acceso, non c'è quando è spento; dice l'ora italiana.
const tAcceso = testo(stato({ letturaRiuscita: true, ultima: { eseguita_il: "2026-11-21T23:01:00Z", esito: "fermata", modo: "automatica" }, ultimaOk: { eseguita_il: "2026-11-20T23:01:00Z" }, now: Date.parse("2026-11-22T08:00:00Z") }));
assert(typeof tAcceso === "string" && tAcceso.includes("pulizia"), `a13) con l'avviso acceso c'è un testo che nomina la pulizia («${tAcceso}»)`);
assert(typeof tAcceso === "string" && tAcceso.includes("22/11") && tAcceso.includes("00:01"), "a14) il testo dà data e ora in ITALIA (23:01 UTC del 21/11 = 00:01 del 22/11)");
assert(typeof tAcceso === "string" && /nessun dato .* cancellato/i.test(tAcceso), "a15) per una fermata il testo dice che non è stato cancellato niente");
const tSpento = testo(stato({ letturaRiuscita: true, ultima: { eseguita_il: fa(2), esito: "ok", modo: "automatica" }, ultimaOk: { eseguita_il: fa(2) }, now: ORA }));
assert(tSpento === null, "a16) con l'avviso spento non c'è testo");
const tMai = testo(stato({ letturaRiuscita: true, ultima: null, ultimaOk: null, now: ORA }));
assert(typeof tMai === "string" && /mai/i.test(tMai), `a17) registro vuoto: il testo dice che non è mai riuscita («${tMai}»)`);

// ===========================================================================
// b) STESSE REGOLE, STESSI FRENI, STESSI CONTROLLI FINALI
// ===========================================================================
const vecchio = leggi(VECCHIO_PERCORSO);
const struttura = leggi(STRUTTURA_PERCORSO);
assert(vecchio !== null, "b1) lo script manuale c'è ancora (è il riferimento delle regole)");
assert(struttura !== null, `b2) esiste ${STRUTTURA_PERCORSO}`);

const vecchioSql = compatta(sqlSenzaCommenti(vecchio));
const nuovoSql = compatta(sqlSenzaCommenti(struttura));

// Le istruzioni che CAMBIANO i dati, estratte dal vecchio: devono comparire
// identiche nel nuovo.
const scritture = vecchioSql.match(/(?:update [a-z_]+ set|delete from)[\s\S]*?;/g) ?? [];
assert(scritture.length === 7, `b3) dal vecchio script si estraggono 7 istruzioni che scrivono (${scritture.length})`);
const scrittureMancanti = scritture.filter((istr) => !nuovoSql.includes(istr));
assert(scrittureMancanti.length === 0, `b4) tutte e 7 compaiono IDENTICHE nella funzione nuova (mancanti: ${scrittureMancanti.length ? scrittureMancanti.map((x) => x.slice(0, 60)).join(" | ") : "nessuna"})`);

// I conteggi dei freni (passi 1d e 3b) e tutte le condizioni `if … then`.
const freniSelect = vecchioSql.match(/select count\(\*\) filter \(where (?:r\.)?status = 'consumed'\)[\s\S]*?;/g) ?? [];
assert(freniSelect.length === 2, `b5) dal vecchio si estraggono i 2 conteggi dei freni, passi 1d e 3b (${freniSelect.length})`);
assert(freniSelect.every((q) => nuovoSql.includes(q)), "b6) i 2 conteggi dei freni compaiono IDENTICI nel nuovo");

const condizioni = [...new Set(vecchioSql.match(/if [^;]*? then/g) ?? [])];
assert(condizioni.length >= 10, `b7) dal vecchio si estraggono le condizioni dei freni e dei controlli finali (${condizioni.length})`);
const condizioniMancanti = condizioni.filter((c) => !nuovoSql.includes(c));
assert(condizioniMancanti.length === 0, `b8) tutte compaiono nel nuovo (mancanti: ${condizioniMancanti.join(" | ") || "nessuna"})`);

// Le letture «prima» e «dopo» su cui si reggono i controlli.
const letture = vecchioSql.match(/select count\(\*\) into v_[a-z_]+[\s\S]*?;/g) ?? [];
assert(letture.length >= 10, `b9) dal vecchio si estraggono le letture dei controlli (${letture.length})`);
const lettureMancanti = letture.filter((q) => !nuovoSql.includes(q));
assert(lettureMancanti.length === 0, `b10) tutte compaiono identiche nel nuovo (mancanti: ${lettureMancanti.map((x) => x.slice(0, 50)).join(" | ") || "nessuna"})`);

// Le 16 tabelle intoccabili: la stessa lista.
function intoccabili(sql) {
  const m = sql.match(/v_intoccabili constant text\[\] := array\[([^\]]*)\]/);
  return m ? m[1].split(",").map((x) => x.trim().replace(/'/g, "")).filter(Boolean) : [];
}
const intVecchio = intoccabili(vecchioSql);
const intNuovo = intoccabili(nuovoSql);
assert(intVecchio.length === 16, `b11) il vecchio elenca 16 tabelle intoccabili (${intVecchio.length})`);
assert(JSON.stringify(intNuovo) === JSON.stringify(intVecchio), "b12) il nuovo elenca le STESSE 16, nello stesso ordine");

// CONTROPROVA dell'estrazione: un nuovo con UNA parola cambiata viene scoperto.
// ⚠️ RISCRITTA PRIMA DEL PRIMO VERDE (22/11). Il testo vecchio era:
//   nuovoSql.replace("payment_status in ('pending', 'failed') and created_at < v_soglia;", …)
// La prima occorrenza di quel testo è la LETTURA del PRE-CHECK, non una
// cancellazione: la sonda cambiava una riga che b4 non guarda, e b14 falliva
// per un difetto della sonda, non della funzione. Ora la sostituzione colpisce
// proprio la cancellazione degli ordini (passo 2).
const nuovoRotto = nuovoSql.replace(
  "delete from orders where payment_status in ('pending', 'failed') and created_at < v_soglia;",
  "delete from orders where payment_status in ('pending') and created_at < v_soglia;"
);
assert(nuovoRotto !== nuovoSql, "b13) CONTROPROVA: la sostituzione di prova ha trovato il testo da cambiare");
assert(scritture.some((istr) => !nuovoRotto.includes(istr)), "b14) CONTROPROVA: togliendo 'failed' da una cancellazione, il confronto di b4 se ne accorge");

// I passi nello stesso ordine: 1a, 1b, 1c, 1d, 2, 3b, 3.
const posizioni = scritture.map((istr) => nuovoSql.indexOf(istr));
assert(posizioni.every((p, i) => p >= 0 && (i === 0 || p > posizioni[i - 1])), "b15) le 7 scritture sono nello STESSO ORDINE del vecchio script");

// ===========================================================================
// c) FUNZIONE: INTERVALLO, MODI, FRENI CHE REGISTRANO, PERMESSI, REGISTRO
// ===========================================================================
assert(/create schema if not exists manutenzione;/.test(nuovoSql), "c1) crea lo schema separato `manutenzione`");
assert(/revoke all on schema manutenzione from public, anon, authenticated;/.test(nuovoSql), "c2) lo schema è chiuso a public, anon, authenticated");
assert(/create or replace function manutenzione\.pulizia_ordini_mai_pagati\(p_giorni integer, p_modo text\)/.test(nuovoSql), "c3) la funzione è manutenzione.pulizia_ordini_mai_pagati(p_giorni integer, p_modo text)");
assert(/revoke execute on function manutenzione\.pulizia_ordini_mai_pagati\(integer, text\) from public, anon, authenticated;/.test(nuovoSql), "c4) revoke execute della funzione da public, anon, authenticated");
assert(nuovoSql.includes("p_giorni < 20") && nuovoSql.includes("p_giorni > 30"), "c5) accetta solo soglie fra 20 e 30");
assert(nuovoSql.includes("('automatica', 'manuale', 'prova')"), "c6) i tre modi: automatica, manuale, prova");
assert(!/:= 30;/.test(nuovoSql) && !/v_giorni constant integer/.test(nuovoSql), "c7) nessuna soglia scritta dentro la funzione: la decide chi la chiama");

// I freni: errore con codice proprio, raccolto e scritto come «fermata».
const freniKm = (nuovoSql.match(/errcode = 'kmf01'/g) ?? []).length;
assert(freniKm === 4, `c8) i 4 freni (consumati e vivi, passi 1d e 3b) usano il codice proprio KMF01 (${freniKm})`);
assert(/when sqlstate 'kmf01' then v_esito := 'fermata'/.test(nuovoSql), "c9) un freno diventa esito «fermata»");
assert(/when sqlstate 'kmp01' then v_esito := 'prova'/.test(nuovoSql), "c10) il modo prova annulla tutto e diventa esito «prova»");
assert(/when others then v_esito := 'errore'/.test(nuovoSql), "c11) qualunque altro errore diventa esito «errore»");
assert(/if p_modo = 'prova' then raise exception using errcode = 'kmp01'/.test(nuovoSql), "c12) in modo prova, DOPO i controlli finali, si annulla con KMP01");
const iPost7 = nuovoSql.indexOf("if v_consumati_dopo <> v_consumati_prima then");
const iProva = nuovoSql.indexOf("if p_modo = 'prova' then raise exception");
assert(iPost7 > 0 && iProva > iPost7, "c13) l'annullamento della prova viene DOPO l'ultimo controllo finale");
const iEccezione = nuovoSql.indexOf("when sqlstate 'kmp01'");
const iInsert = nuovoSql.indexOf("insert into manutenzione.pulizia_registro", iEccezione);
assert(iEccezione > 0 && iInsert > iEccezione, "c14) la riga del registro si scrive DOPO il blocco protetto: resta anche quando il lavoro è annullato");
assert((nuovoSql.match(/insert into manutenzione\.pulizia_registro/g) ?? []).length >= 2, "c15) anche la soglia rifiutata scrive una riga nel registro");
assert(/pg_try_advisory_xact_lock/.test(nuovoSql), "c16) due pulizie non possono girare insieme (blocco consultivo)");

// Il registro.
const regMatch = nuovoSql.match(/create table if not exists manutenzione\.pulizia_registro \(([\s\S]*?)\);/);
assert(regMatch !== null, "c17) crea la tabella manutenzione.pulizia_registro");
const reg = regMatch?.[1] ?? "";
for (const col of ["eseguita_il", "modo", "soglia_giorni", "soglia_istante", "esito", "motivo", "ordini", "righe_ordine", "storico_stati", "eventi_staccati", "registro_staccato", "promo_cancellati", "coupon_da_ordini", "coupon_da_clienti", "clienti", "pagati_totale", "consumati_totale", "durata_ms"]) {
  assert(new RegExp(`\\b${col}\\b`).test(reg), `c18) il registro ha la colonna ${col}`);
}
assert(reg.includes("check (esito in ('ok', 'fermata', 'errore', 'prova'))"), "c19) gli esiti ammessi sono ok, fermata, errore, prova");
assert(!/(phone|telefono|email|first_name|last_name|nome|cognome|address|indirizzo|customer_id|order_id)/.test(reg), "c20) nessuna colonna con dati personali o riferimenti a clienti e ordini");
assert(/revoke all on table manutenzione\.pulizia_registro from public, anon, authenticated;/.test(nuovoSql), "c21) il registro è chiuso a public, anon, authenticated");

// La funzione di stato per il pannello.
assert(/create or replace function public\.pulizia_stato\(\)/.test(nuovoSql), "c22) c'è public.pulizia_stato() per il pannello");
assert(/security definer set search_path = ''/.test(nuovoSql), "c23) pulizia_stato è security definer con search_path vuoto");
assert(/revoke execute on function public\.pulizia_stato\(\) from public, anon, authenticated;/.test(nuovoSql), "c24) pulizia_stato non è chiamabile da public, anon, authenticated");
assert(/grant execute on function public\.pulizia_stato\(\) to service_role;/.test(nuovoSql), "c25) pulizia_stato è chiamabile solo dal server (service_role)");
const statoSql = nuovoSql.slice(nuovoSql.indexOf("create or replace function public.pulizia_stato()"));
assert((statoSql.match(/r\.modo in \('automatica', 'manuale'\)/g) ?? []).length === 2, "c26) lo stato ignora le prove: guarda solo automatica e manuale");
assert(!/order_id|customer|phone|email/.test(statoSql.slice(0, statoSql.indexOf("$$;", statoSql.indexOf("$$") + 2))), "c27) lo stato non legge niente di clienti e ordini");

// Nessun orologio nel file di struttura.
assert(!/cron\./.test(nuovoSql), "c28) il file di struttura NON accende l'orologio (nessun cron.)");

// ===========================================================================
// d) CONTEGGIO, CONTROPROVA, OROLOGIO
// ===========================================================================
const conteggio = leggi(CONTEGGIO_PERCORSO);
assert(conteggio !== null, `d1) esiste ${CONTEGGIO_PERCORSO}`);
const contSql = compatta(sqlSenzaCommenti(conteggio));
assert(/^with /.test(contSql) && !/\b(insert|update|delete|alter|drop|truncate|create)\b/.test(contSql), "d2) il conteggio è sola lettura");
assert((contSql.match(/make_interval\(days => \d+\)/g) ?? []).length === 1, "d3) la soglia del conteggio si scrive in UN posto solo");
assert(contSql.includes("make_interval(days => 28)"), "d4) il conteggio è pronto a 28 giorni");
assert((contSql.match(/select \d+ as n,|select \d+,/g) ?? []).length === 20, `d5) il conteggio restituisce 20 righe (${(contSql.match(/select \d+ as n,|select \d+,/g) ?? []).length})`);

const controprova = leggi(CONTROPROVA_PERCORSO);
assert(controprova !== null, `d6) esiste ${CONTROPROVA_PERCORSO}`);
const cpSql = compatta(sqlSenzaCommenti(controprova));
assert(/^with /.test(cpSql) && !/\b(insert|update|delete|alter|drop|truncate|create)\b/.test(cpSql), "d7) la controprova è sola lettura");
assert(cpSql.includes("manutenzione.pulizia_registro") && cpSql.includes("soglia_istante"), "d8) la controprova confronta l'ultima riga del registro con il database di adesso");

const orologio = leggi(OROLOGIO_PERCORSO);
assert(orologio !== null, `d9) esiste ${OROLOGIO_PERCORSO}`);
const orSql = compatta(sqlSenzaCommenti(orologio));
assert(orSql.includes("cron.schedule("), "d10) il file dell'orologio usa cron.schedule");
assert(orSql.includes("'1 23 * * *'"), "d11) ogni notte alle 23:01 UTC");
assert(orSql.includes("manutenzione.pulizia_ordini_mai_pagati(28, 'automatica')"), "d12) con soglia 28 e modo automatica");

const verifica = leggi(VERIFICA_PERCORSO);
assert(verifica !== null, `d13) esiste ${VERIFICA_PERCORSO}`);
const vSql = compatta(sqlSenzaCommenti(verifica));
assert(vSql.includes("from cron.job") && !/\b(insert|update|delete|alter|drop|truncate|create|cron\.schedule|cron\.unschedule)\b/.test(vSql), "d14) la verifica legge cron.job e non scrive niente");

// ===========================================================================
// e) ROTTA, AVVISO STAFF, FILTRO 28 GIORNI
// ===========================================================================
const rotta = leggi("app/api/staff/pulizia-stato/route.js");
assert(rotta !== null, "e1) esiste la rotta app/api/staff/pulizia-stato/route.js");
const iSessione = rotta?.indexOf("await requireStaffSession()") ?? -1;
const iRpc = rotta?.indexOf('.rpc("pulizia_stato")') ?? -1;
assert(iSessione > 0 && iRpc > iSessione, "e2) la rotta verifica la sessione staff PRIMA di leggere lo stato");
assert(rotta !== null && /statoAvvisoPulizia\(/.test(rotta), "e3) la rotta decide con la stessa regola provata in a)");
assert(rotta !== null && !/from\("customers"\)|from\("orders"\)/.test(rotta), "e4) la rotta non legge clienti né ordini");
assert(rotta !== null && /letturaRiuscita: false/.test(rotta), "e5) se la lettura fallisce la rotta lo dice (avviso acceso, non spento)");

const avviso = leggi("app/staff/avviso-pulizia.js");
assert(avviso !== null, "e6) esiste il componente app/staff/avviso-pulizia.js");
assert(avviso !== null && avviso.includes('fetch("/api/staff/pulizia-stato"'), "e7) il componente legge la rotta dello stato");
const pagina = leggi("app/staff/page.js");
assert(pagina !== null && /import AvvisoPulizia from "\.\/avviso-pulizia";/.test(pagina), "e8) il pannello importa l'avviso");
const iH1 = pagina?.indexOf(">\n          Ordini\n        </h1>") ?? -1;
const iTag = pagina?.indexOf("<AvvisoPulizia />") ?? -1;
const iBannerSuoni = pagina?.indexOf("{mounted && (!audioUnlocked") ?? -1;
assert(iH1 > 0 && iTag > iH1 && iTag < iBannerSuoni, "e9) l'avviso sta in cima al pannello, sotto il titolo e prima del banner dei suoni");

const rottaCarrelli = leggi("app/api/staff/abandoned-carts/route.js") ?? "";
const periodi = rottaCarrelli.match(/const PERIOD_DAYS = (\{[^}]*\});/)?.[1] ?? "";
let periodiObj = null;
try {
  periodiObj = JSON.parse(periodi.replace(/(\w+):/g, '"$1":'));
} catch {
  periodiObj = null;
}
assert(JSON.stringify(periodiObj) === JSON.stringify({ oggi: 0, "7g": 7, "28g": 28 }), `e10) la rotta dei carrelli ha i periodi oggi, 7g, 28g (${periodi})`);
const paginaCarrelli = leggi("app/staff/abbandonati/page.js") ?? "";
assert(paginaCarrelli.includes('{ key: "28g", label: "Ultimi 28 giorni" }'), "e11) la pagina dei carrelli mostra «Ultimi 28 giorni»");
assert(!/30g|Ultimi 30/.test(rottaCarrelli + paginaCarrelli), "e12) nessuna traccia del vecchio «30 giorni» nei carrelli");
const chiaviPagina = [...paginaCarrelli.matchAll(/key: "([^"]+)"/g)].map((m) => m[1]);
assert(periodiObj !== null && chiaviPagina.every((k) => k in periodiObj), `e13) ogni periodo della pagina esiste nella rotta (${chiaviPagina.join(", ")})`);

// CONTROPROVA di e10: un oggetto col vecchio 30 non passa.
const vecchiPeriodi = JSON.parse('{ "oggi": 0, "7g": 7, "30g": 30 }');
assert(JSON.stringify(vecchiPeriodi) !== JSON.stringify({ oggi: 0, "7g": 7, "28g": 28 }), "e14) CONTROPROVA: i periodi vecchi non superano il confronto di e10");

// L'informativa non si tocca in questo lavoro (decisione di Andrea del 22/11).
assert(existsSync(new URL("../app/privacy/page.js", import.meta.url)), "e15) l'informativa c'è (non è oggetto di questo lavoro)");

console.log(failures === 0 ? "\nTUTTI I TEST PASSATI" : `\n${failures} TEST FALLITI`);
process.exitCode = failures === 0 ? 0 : 1;
