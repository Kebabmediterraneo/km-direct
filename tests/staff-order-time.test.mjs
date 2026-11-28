// PANNELLO STAFF — DATA E ORA DELL'ORDINE NELLA SCHEDA (28/11/2026).
// Esegui con: node tests/staff-order-time.test.mjs   (exit code 0 = tutti PASS)
//
// Scelte di Andrea: la data è quella in cui il cliente ha ordinato (created_at),
// davanti all'ora nella riga che c'è già: «sab 28/11 19:15 · Delivery · Nuovo».
// Giorno della settimana abbreviato minuscolo senza punto, giorno/mese a due
// cifre, ora:minuti, sempre in ora italiana. Vale per tutti gli ordini e per le
// due schede (OrderCard e HistoryRow).
//
// ⚠️ Gli esempi del comando dicevano «lun 01/12»: il 01/12/2026 è MARTEDÌ.
// Qui si usa il calendario vero.
// ⚠️ NON si prova qui: come appare a schermo (prova di Andrea, e controllo a 360 px).
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

let failures = 0;
function assert(cond, msg) {
  console.log(`${cond ? "PASS" : "FAIL"} — ${msg}`);
  if (!cond) failures++;
}
// Import dinamico: prima del codice il modulo non esiste, e le prove devono
// fallire una per una invece di fermarsi alla prima riga.
let m = {};
try { m = await import("../lib/staff-order-time.js"); } catch { /* modulo assente */ }
const f = (v) => { try { return m.formatOrderCreatedAt?.(v); } catch (e) { return `ERRORE ${e.message}`; } };
const eq = (v, atteso, msg) => { const r = f(v); assert(r === atteso, `${msg} (atteso «${atteso}», letto «${r}»)`); };

assert(typeof m.formatOrderCreatedAt === "function", "a0) esiste la funzione unica in lib/staff-order-time.js");

// a) I SETTE GIORNI — settimana dal 23/11/2026 (lunedì) al 29/11 (domenica),
//    11:15 UTC = 12:15 italiane (inverno, +1).
const SETTIMANA = ["lun", "mar", "mer", "gio", "ven", "sab", "dom"];
SETTIMANA.forEach((g, i) => {
  const giorno = String(23 + i);
  eq(`2026-11-${giorno}T11:15:00Z`, `${g} ${giorno}/11 12:15`, `a${i + 1}) ${g}`);
});
const tutti = SETTIMANA.map((_, i) => f(`2026-11-${23 + i}T11:15:00Z`) ?? "");
assert(tutti.every((s) => !s.includes(".") && s === s.toLowerCase()), "a8) nessun punto e nessuna maiuscola, in nessun giorno");

// b) ORA ITALIANA: inverno, estate, i due giorni del cambio d'ora.
eq("2026-01-15T19:30:00Z", "gio 15/01 20:30", "b1) inverno: UTC+1");
eq("2026-07-15T19:30:00Z", "mer 15/07 21:30", "b2) estate: UTC+2");
eq("2026-03-29T00:30:00Z", "dom 29/03 01:30", "b3) 29/03, prima del cambio: ancora +1");
eq("2026-03-29T01:30:00Z", "dom 29/03 03:30", "b4) 29/03, dopo il cambio: +2 (le 02:xx non esistono)");
eq("2026-10-25T00:30:00Z", "dom 25/10 02:30", "b5) 25/10, prima del ritorno: +2");
eq("2026-10-25T01:30:00Z", "dom 25/10 02:30", "b6) 25/10, dopo il ritorno: +1 (le 02:30 capitano due volte)");

// c) IL GIORNO DOPO IN ITALIA
eq("2026-11-30T23:30:00Z", "mar 01/12 00:30", "c1) 30/11 23:30 UTC è già martedì 01/12 in Italia");
eq("2026-12-31T23:30:00Z", "ven 01/01 00:30", "c2) …anche a cavallo dell'anno");

// d) ZERI DAVANTI
eq("2026-02-03T08:05:00Z", "mar 03/02 09:05", "d1) giorno, mese, ore e minuti a due cifre");
eq("2026-11-28T23:00:00Z", "dom 29/11 00:00", "d2) mezzanotte: 00:00, non 24:00");

// e) created_at ASSENTE O NON VALIDO: niente errore, la riga resta quella di oggi.
// Oggi la scheda chiama questa formula (formatTime in app/staff/page.js).
const oggi = (v) => new Date(v).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Rome" });
for (const v of [undefined, null, "", "non è una data", "2026-13-45T99:99:99Z"]) {
  const r = f(v);
  assert(typeof r === "string" && !r.startsWith("ERRORE") && r === oggi(v), `e1) ${JSON.stringify(v) ?? "undefined"}: nessun errore, come oggi («${oggi(v)}»; letto «${r}»)`);
}
eq(new Date("2026-11-28T18:15:00Z"), "sab 28/11 19:15", "e2) accetta anche un oggetto Date");

// f) FUSO ESPLICITO: lo stesso calcolo su un computer con un altro fuso dà lo stesso testo.
const modulo = fileURLToPath(new URL("../lib/staff-order-time.js", import.meta.url));
for (const tz of ["UTC", "America/New_York", "Asia/Tokyo"]) {
  let r = "";
  try {
    r = execFileSync(process.execPath, ["--input-type=module", "-e", `const m = await import(${JSON.stringify(modulo)}); process.stdout.write(m.formatOrderCreatedAt("2026-11-30T23:30:00Z"));`], { env: { ...process.env, TZ: tz }, stdio: ["ignore", "pipe", "ignore"] }).toString();
  } catch { /* modulo assente */ }
  assert(r === "mar 01/12 00:30", `f1) con il computer in ${tz} esce comunque l'ora italiana (letto «${r}»)`);
}
// CONTROPROVA di f1: la vecchia scorciatoia senza fuso cambia con il computer.
const senzaFuso = execFileSync(process.execPath, ["-e", `process.stdout.write(new Date("2026-11-30T23:30:00Z").toLocaleDateString("it-IT"))`], { env: { ...process.env, TZ: "America/New_York" } }).toString();
assert(senzaFuso === "30/11/2026", `f2) CONTROPROVA: toLocaleDateString senza fuso, a New York, direbbe ${senzaFuso} — f1 misura qualcosa`);

// g) LE DUE SCHEDE USANO LA FUNZIONE NUOVA
const pagina = readFileSync(new URL("../app/staff/page.js", import.meta.url), "utf8");
assert(/import \{ formatOrderCreatedAt \} from "\.\.\/\.\.\/lib\/staff-order-time";/.test(pagina), "g1) il pannello importa formatOrderCreatedAt (nome esatto: la build non se ne accorgerebbe)");
const corpo = (nome) => { const i = pagina.indexOf(`function ${nome}(`); return pagina.slice(i, pagina.indexOf("\nfunction ", i + 10)); };
const card = corpo("OrderCard"), storico = corpo("HistoryRow");
const riga = /\{formatOrderCreatedAt\(order\.created_at\)\} · \{FULFILLMENT_LABEL\[order\.fulfillment\] \?\? order\.fulfillment\} ·\{" "\}/;
assert(riga.test(card), "g2) OrderCard (Nuovi e Attivi): «data ora · Delivery · stato»");
assert(riga.test(storico), "g3) HistoryRow (Storico): la stessa riga");
assert(!pagina.includes("formatTime(order.created_at)"), "g4) in nessuna scheda resta la sola ora");
// Quello che NON cambia: l'etichetta dei programmati.
const etichetta = '${order.fulfillment === "pickup" ? "Ritiro" : "Consegna programmata"}: ${formatScheduledDeliveryLabel(order.scheduled_delivery_at)}';
assert(card.includes(etichetta) && storico.includes(etichetta), "g5) l'etichetta dei programmati resta identica nelle due schede");
assert(/function formatScheduledDeliveryLabel\(isoString\) \{\n  const scheduledDate = new Date\(isoString\);\n  const time = formatTime\(isoString\);/.test(pagina), "g6) …e continua a usare formatTime per la sua ora");

console.log(failures === 0 ? "\nTUTTI I TEST PASSATI" : `\n${failures} TEST FALLITI`);
process.exitCode = failures === 0 ? 0 : 1;
