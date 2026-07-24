// Test deterministici §68 — logica pura di lib/schedule-exceptions.js.
// Coprono i casi a–r della Task A. Nessun DB, nessun dato reale.
//
// Come eseguirlo:  node tests/schedule-exceptions.test.mjs
//
// Convenzione (primo file di riferimento del progetto): i test deterministici
// sono file `.mjs` sotto tests/, eseguibili con `node` senza framework né
// build — la lib usa export ESM e package.json è CommonJS, quindi l'estensione
// .mjs è necessaria per usare `import` direttamente. Exit code 0 = tutti PASS.
import {
  enumerateDates,
  validateDateRange,
  buildCreateRows,
  detectConflicts,
  groupRows,
  buildWindowsByDow,
  orderShift,
  filterAffectedOrders,
  closedShiftKeys,
  computeReconciliation,
  classifyScheduledSlot,
  nextOpenSlot,
  computeExceptionEffects,
} from "../lib/schedule-exceptions.js";
import { getScheduledSlots, getPickupSlots, computeScheduledDeliveryAt } from "../lib/scheduled-slots.js";

let failures = 0;
function assert(cond, msg) {
  console.log(`${cond ? "PASS" : "FAIL"} — ${msg}`);
  if (!cond) failures++;
}

const TODAY = "2026-07-23";

// Finestre §13 per tutti i giorni (lunch 12:00-14:30, dinner 19:00-22:30).
const WINDOWS = [];
for (let dow = 0; dow <= 6; dow++) {
  WINDOWS.push({ day_of_week: dow, opens_at: "12:00", closes_at: "14:30", is_defined: true });
  WINDOWS.push({ day_of_week: dow, opens_at: "19:00", closes_at: "22:30", is_defined: true });
}
const windowsByDow = buildWindowsByDow(WINDOWS);

// ---- a) POST full_day singolo giorno → 1 riga, gruppo con 1 riga ----
{
  const rows = buildCreateRows(
    { dateStart: "2026-08-10", dateEnd: "2026-08-10", closureType: "full_day", reason: null },
    { storeId: "S", exceptionGroupId: "G-a" }
  );
  const entries = groupRows(rows, { includePast: true, today: TODAY });
  assert(rows.length === 1 && entries.length === 1 && entries[0].count === 1, "a) full_day 1 giorno → 1 riga, gruppo count 1");
}

// ---- b) POST full_day intervallo 3 giorni → 3 righe, stesso gruppo ----
{
  const rows = buildCreateRows(
    { dateStart: "2026-08-10", dateEnd: "2026-08-12", closureType: "full_day", reason: "Ferie" },
    { storeId: "S", exceptionGroupId: "G-b" }
  );
  const sameGroup = rows.every((r) => r.exception_group_id === "G-b");
  const entries = groupRows(rows, { includePast: true, today: TODAY });
  assert(
    rows.length === 3 && sameGroup && entries[0].count === 3 && entries[0].date_start === "2026-08-10" && entries[0].date_end === "2026-08-12",
    "b) full_day 3 giorni → 3 righe stesso gruppo, entry date_start/end corretti"
  );
}

// ---- c) lunch + dinner stesso giorno (gruppi distinti) → coesistenza ok, 2 gruppi ----
{
  const c1 = detectConflicts(["2026-08-15"], "lunch", {}); // primo inserimento
  const c2 = detectConflicts(["2026-08-15"], "dinner", { "2026-08-15": ["lunch"] }); // dinner con lunch presente
  const rowsLunch = buildCreateRows({ dateStart: "2026-08-15", dateEnd: "2026-08-15", closureType: "lunch" }, { storeId: "S", exceptionGroupId: "G-c1" });
  const rowsDinner = buildCreateRows({ dateStart: "2026-08-15", dateEnd: "2026-08-15", closureType: "dinner" }, { storeId: "S", exceptionGroupId: "G-c2" });
  const entries = groupRows([...rowsLunch, ...rowsDinner], { includePast: true, today: TODAY });
  assert(c1.length === 0 && c2.length === 0 && entries.length === 2, "c) lunch+dinner stesso giorno coesistono → 2 gruppi, nessun conflitto");
}

// ---- d) full_day su giorno che ha già lunch (altro gruppo) → conflitto rule ----
{
  const c = detectConflicts(["2026-08-15"], "full_day", { "2026-08-15": ["lunch"] });
  assert(c.length === 1 && c[0].kind === "rule", "d) full_day su giorno con lunch → conflitto 'rule' (409)");
}

// ---- e) lunch su giorno che ha già full_day → conflitto rule ----
{
  const c = detectConflicts(["2026-08-15"], "lunch", { "2026-08-15": ["full_day"] });
  assert(c.length === 1 && c[0].kind === "rule", "e) lunch su giorno con full_day → conflitto 'rule' (409)");
}

// ---- f) duplicato identico (stesso closure_type altro gruppo) → UNIQUE ----
{
  const c = detectConflicts(["2026-08-15"], "lunch", { "2026-08-15": ["lunch"] });
  assert(c.length === 1 && c[0].kind === "duplicate", "f) lunch duplicato → conflitto 'duplicate' (409 UNIQUE)");
}

// ---- g) date_start < oggi → 400 ----
{
  const v = validateDateRange({ dateStart: "2026-07-22", dateEnd: "2026-07-25", closureType: "full_day" }, TODAY);
  assert(v.ok === false && v.status === 400, "g) date_start nel passato → 400");
}

// ---- h) date_end < date_start → 400 ----
{
  const v = validateDateRange({ dateStart: "2026-08-10", dateEnd: "2026-08-09", closureType: "full_day" }, TODAY);
  assert(v.ok === false && v.status === 400, "h) date_end < date_start → 400");
}

// ---- i/j) GET filtro passate ----
{
  const pastRows = buildCreateRows({ dateStart: "2026-07-01", dateEnd: "2026-07-02", closureType: "full_day" }, { storeId: "S", exceptionGroupId: "G-past" });
  const futureRows = buildCreateRows({ dateStart: "2026-08-01", dateEnd: "2026-08-01", closureType: "full_day" }, { storeId: "S", exceptionGroupId: "G-fut" });
  const all = [...pastRows, ...futureRows];
  const def = groupRows(all, { includePast: false, today: TODAY });
  const withPast = groupRows(all, { includePast: true, today: TODAY });
  assert(def.length === 1 && def[0].exception_group_id === "G-fut", "i) GET default: gruppo interamente passato escluso");
  assert(withPast.length === 2, "j) GET include_past=true: incluso anche il gruppo passato");
}

// ---- k) raggruppamento: 3 giorni → UNA entry ----
{
  const rows = buildCreateRows({ dateStart: "2026-08-10", dateEnd: "2026-08-12", closureType: "dinner", reason: "Evento" }, { storeId: "S", exceptionGroupId: "G-k" });
  const entries = groupRows(rows, { includePast: true, today: TODAY });
  assert(entries.length === 1 && entries[0].date_start === "2026-08-10" && entries[0].date_end === "2026-08-12" && entries[0].count === 3, "k) 3 giorni → una entry con date_start/end/count corretti");
}

// Helper: righe DB correnti di un gruppo.
function currentRows(groupId, dates, closureType, reason) {
  return dates.map((date, i) => ({ id: `${groupId}-${i}`, exception_group_id: groupId, date, closure_type: closureType, reason: reason ?? null }));
}

// ---- l) PATCH solo reason → tutte le righe aggiornate, niente delete/insert ----
{
  const rows = currentRows("G-l", ["2026-08-10", "2026-08-11"], "full_day", "vecchio");
  const rec = computeReconciliation(rows, { dates: ["2026-08-10", "2026-08-11"], closureType: "full_day", reason: "nuovo" });
  assert(rec.toDeleteIds.length === 0 && rec.toInsertDates.length === 0 && rec.toUpdateIds.length === 2, "l) PATCH reason → 2 update, 0 delete, 0 insert");
}

// ---- m) PATCH allunga intervallo +2 giorni → 2 insert, 0 delete ----
{
  const rows = currentRows("G-m", ["2026-08-10", "2026-08-11"], "full_day", "r");
  const newDates = enumerateDates("2026-08-10", "2026-08-13");
  const rec = computeReconciliation(rows, { dates: newDates, closureType: "full_day", reason: "r" });
  assert(rec.toInsertDates.length === 2 && rec.toDeleteIds.length === 0 && JSON.stringify(rec.toInsertDates) === JSON.stringify(["2026-08-12", "2026-08-13"]), "m) PATCH +2 giorni → 2 insert (12,13), 0 delete");
}

// ---- n) PATCH accorcia intervallo → righe fuori range cancellate ----
{
  const rows = currentRows("G-n", ["2026-08-10", "2026-08-11", "2026-08-12"], "full_day", "r");
  const newDates = enumerateDates("2026-08-10", "2026-08-11");
  const rec = computeReconciliation(rows, { dates: newDates, closureType: "full_day", reason: "r" });
  assert(rec.toDeleteIds.length === 1 && rec.toDeleteIds[0] === "G-n-2" && rec.toInsertDates.length === 0, "n) PATCH accorcia → 1 delete (il 12), 0 insert");
}

// ---- o) PATCH cambia closure_type full_day→lunch → tutte ricreate; conflitto se collide ----
{
  const rows = currentRows("G-o", ["2026-08-10", "2026-08-11"], "full_day", "r");
  const newDates = ["2026-08-10", "2026-08-11"];
  const rec = computeReconciliation(rows, { dates: newDates, closureType: "lunch", reason: "r" });
  const allDeleted = rec.toDeleteIds.length === 2;
  const allInserted = JSON.stringify(rec.toInsertDates) === JSON.stringify(newDates);
  // conflitto con altro gruppo che ha full_day il 2026-08-10
  const conflict = detectConflicts(newDates, "lunch", { "2026-08-10": ["full_day"] });
  assert(allDeleted && allInserted, "o) PATCH full_day→lunch → 2 delete + 2 insert (stesse date, nuovo tipo)");
  assert(conflict.length === 1 && conflict[0].kind === "rule", "o') PATCH con collisione su altro gruppo → conflitto 'rule' (409)");
}

// ---- p) DELETE gruppo → righe del gruppo rimosse (groupRows del resto le ignora) ----
{
  const gDel = buildCreateRows({ dateStart: "2026-08-10", dateEnd: "2026-08-11", closureType: "full_day" }, { storeId: "S", exceptionGroupId: "G-del" });
  const gKeep = buildCreateRows({ dateStart: "2026-08-20", dateEnd: "2026-08-20", closureType: "full_day" }, { storeId: "S", exceptionGroupId: "G-keep" });
  const afterDelete = [...gKeep]; // simula rimozione di tutte le righe di G-del
  const entries = groupRows(afterDelete, { includePast: true, today: TODAY });
  assert(entries.length === 1 && entries[0].exception_group_id === "G-keep", "p) DELETE gruppo → nessuna entry residua del gruppo eliminato");
}

// ---- q) affected-orders: ordine in turno chiuso compare, in turno aperto no ----
{
  const orders = [
    { pickup_code: "KM-LUNCH", scheduled_delivery_at: "2026-08-15T11:00:00Z", total: 20 }, // 13:00 Roma → lunch
    { pickup_code: "KM-DINNER", scheduled_delivery_at: "2026-08-15T18:00:00Z", total: 25 }, // 20:00 Roma → dinner
    { pickup_code: "KM-OUT", scheduled_delivery_at: "2026-08-25T11:00:00Z", total: 30 }, // fuori range
  ];
  const affected = filterAffectedOrders(orders, windowsByDow, { dateStart: "2026-08-10", dateEnd: "2026-08-20", closureType: "lunch" });
  const codes = affected.map((o) => o.pickup_code);
  assert(JSON.stringify(codes) === JSON.stringify(["KM-LUNCH"]), "q) closure lunch → solo l'ordine del pranzo (no dinner, no fuori range)");
  // shift detection sanity
  assert(orderShift("2026-08-15T18:00:00Z", windowsByDow).shift === "dinner", "q') orderShift 20:00 Roma → dinner");
}

// ---- r) affected-orders con exclude_group_id: ordine nel gruppo escluso non compare ----
{
  const orders = [
    { pickup_code: "KM-LUNCH", scheduled_delivery_at: "2026-08-15T11:00:00Z", total: 20 },
  ];
  const excludedRows = [{ date: "2026-08-15", closure_type: "lunch" }];
  const excludedClosedSet = closedShiftKeys(excludedRows);
  const affected = filterAffectedOrders(orders, windowsByDow, { dateStart: "2026-08-10", dateEnd: "2026-08-20", closureType: "lunch", excludedClosedSet });
  assert(affected.length === 0, "r) exclude_group_id copre 2026-08-15 lunch → ordine escluso, 0 affected");
}

// ---- §68.3: ordine all'orario di chiusura pranzo (14:30 Roma = 12:30 UTC).
//      Ritiro (chiusura inclusa §12b) → colpito; Delivery (esclusa §12) → no. ----
{
  const atLunchClose = "2026-08-15T12:30:00Z"; // Roma 14:30 = chiusura pranzo
  const range = { dateStart: "2026-08-10", dateEnd: "2026-08-20", closureType: "lunch" };

  // s) Ritiro esattamente alla chiusura → tra gli ordini colpiti.
  const pickupOrders = [{ pickup_code: "KM-PICKUP-CLOSE", fulfillment: "pickup", scheduled_delivery_at: atLunchClose, total: 18 }];
  const pickupAffected = filterAffectedOrders(pickupOrders, windowsByDow, range);
  assert(
    pickupAffected.map((o) => o.pickup_code).join() === "KM-PICKUP-CLOSE",
    "s) Ritiro alle 14:30 (chiusura pranzo) chiuso da eccezione lunch → colpito"
  );

  // t) Delivery allo stesso orario di chiusura → NON colpito (§12 invariata).
  const deliveryOrders = [{ pickup_code: "KM-DELIVERY-CLOSE", fulfillment: "delivery", scheduled_delivery_at: atLunchClose, total: 22 }];
  const deliveryAffected = filterAffectedOrders(deliveryOrders, windowsByDow, range);
  assert(
    deliveryAffected.length === 0,
    "t) Delivery alle 14:30 (chiusura esclusa) → NON colpito"
  );
}

// ===== Task C §68.4/§68.5 — effetti lato cliente =====

// Finestre §13 come righe store_order_windows (tutti i giorni: lunch 12:00-14:30,
// dinner 19:00-22:30). day_of_week irrilevante qui: uguali per ogni giorno.
const WINROWS = [];
for (let dow = 0; dow <= 6; dow++) {
  WINROWS.push({ day_of_week: dow, opens_at: "12:00", closes_at: "14:30", is_defined: true });
  WINROWS.push({ day_of_week: dow, opens_at: "19:00", closes_at: "22:30", is_defined: true });
}

// ---- STEP 1: nextOpenSlot ----

// s1) prossima apertura = oggi cena (sameDay=true). Ora: 15:00 Roma (13:00Z).
{
  const now = new Date("2026-08-12T13:00:00Z");
  const r = nextOpenSlot(now, [], WINROWS);
  assert(r && r.sameDay === true && r.openAt.toISOString() === "2026-08-12T17:00:00.000Z",
    "s1) nextOpenSlot → oggi cena (19:00 Roma), sameDay=true");
}

// s2) prossima apertura = domani pranzo (sameDay=false). Ora: 23:00 Roma (21:00Z).
{
  const now = new Date("2026-08-12T21:00:00Z");
  const r = nextOpenSlot(now, [], WINROWS);
  assert(r && r.sameDay === false && r.openAt.toISOString() === "2026-08-13T10:00:00.000Z",
    "s2) nextOpenSlot → domani pranzo (12:00 Roma), sameDay=false");
}

// s3) salta un intervallo full_day di 3 giorni (oggi, +1, +2). Ora 11:00 Roma.
{
  const now = new Date("2026-08-12T09:00:00Z");
  const exc = [
    { date: "2026-08-12", closure_type: "full_day" },
    { date: "2026-08-13", closure_type: "full_day" },
    { date: "2026-08-14", closure_type: "full_day" },
  ];
  const r = nextOpenSlot(now, exc, WINROWS);
  assert(r && r.date === "2026-08-15" && r.shift === "lunch" && r.openAt.toISOString() === "2026-08-15T10:00:00.000Z",
    "s3) nextOpenSlot salta 3 giorni full_day → 2026-08-15 pranzo");
}

// s4) salta un mix lunch/dinner su 2 giorni (oggi cena chiusa, domani pranzo
//     chiuso). Ora 15:00 Roma → oggi pranzo già passato.
{
  const now = new Date("2026-08-12T13:00:00Z");
  const exc = [
    { date: "2026-08-12", closure_type: "dinner" },
    { date: "2026-08-13", closure_type: "lunch" },
  ];
  const r = nextOpenSlot(now, exc, WINROWS);
  assert(r && r.date === "2026-08-13" && r.shift === "dinner" && r.sameDay === false,
    "s4) nextOpenSlot salta oggi-cena + domani-pranzo → domani cena");
}

// ---- STEP 6: selettore giorno programmata ----

// s5) oggi tutto aperto, domani full_day chiuso → solo oggi ha slot.
{
  const now = new Date("2026-08-12T06:00:00Z"); // 08:00 Roma
  const exc = [{ date: "2026-08-13", closure_type: "full_day" }];
  const base = getScheduledSlots(WINROWS, now, exc);
  assert(base.slots.today.length > 0 && base.slots.tomorrow.length === 0,
    "s5) oggi aperto / domani full_day → slot solo oggi");
}

// s6) oggi cena chiusa, domani pranzo chiuso → oggi solo pranzo, domani solo cena.
{
  const now = new Date("2026-08-12T06:00:00Z"); // 08:00 Roma
  const exc = [
    { date: "2026-08-12", closure_type: "dinner" },
    { date: "2026-08-13", closure_type: "lunch" },
  ];
  const base = getScheduledSlots(WINROWS, now, exc);
  const toMin = (s) => { const [h, m] = s.split(":").map(Number); return h * 60 + m; };
  const todayAllLunch = base.slots.today.length > 0 && base.slots.today.every((s) => toMin(s) < 19 * 60);
  const tomorrowAllDinner = base.slots.tomorrow.length > 0 && base.slots.tomorrow.every((s) => toMin(s) >= 19 * 60);
  assert(todayAllLunch && tomorrowAllDinner,
    "s6) oggi cena chiusa / domani pranzo chiuso → oggi solo pranzo, domani solo cena");
}

// ---- STEP 6: blocco checkout ----

// s7) oggi tutto chiuso, domani tutto chiuso, dopodomani aperto → checkout
//     bloccato, messaggio con dopodomani.
{
  const now = new Date("2026-08-12T11:00:00Z"); // 13:00 Roma (dentro il pranzo per gli orari base)
  const exc = [
    { date: "2026-08-12", closure_type: "full_day" },
    { date: "2026-08-13", closure_type: "full_day" },
  ];
  const base = getScheduledSlots(WINROWS, now, exc);
  const eff = computeExceptionEffects(base, now, WINROWS, exc);
  assert(eff.checkoutBlocked === true, "s7a) checkout bloccato (né ASAP né slot in 2 giorni)");
  assert(eff.phase === "red" && eff.label === "Chiuso", "s7b) semaforo override → rosso 'Chiuso'");
  assert(
    typeof eff.blockMessage === "string" &&
      eff.blockMessage.startsWith("Al momento non stiamo ricevendo ordini. La prossima apertura è ") &&
      eff.blockMessage.includes("alle 12:00.") &&
      !eff.blockMessage.includes("oggi"),
    "s7c) messaggio blocco con dopodomani (non 'oggi') alle 12:00"
  );
}

// s8) additività: nessuna eccezione → phase/label/message invariati, non bloccato.
{
  const now = new Date("2026-08-12T13:00:00Z"); // 15:00 Roma (chiuso, tra pranzo e cena)
  const base = getScheduledSlots(WINROWS, now, []);
  const eff = computeExceptionEffects(base, now, WINROWS, []);
  assert(eff.phase === base.phase && eff.label === base.label && eff.message === base.message && eff.checkoutBlocked === false,
    "s8) senza eccezioni: semaforo invariato e checkout non bloccato (additività)");
}

// ===== fix firstSlotDay/firstSlotLabel coerenti con gli slot esposti =====

// t1) entrambi i giorni con slot → firstSlotDay="today", label = primo slot oggi.
{
  const now = new Date("2026-08-12T06:00:00Z"); // 08:00 Roma
  const base = getScheduledSlots(WINROWS, now, []);
  assert(
    base.slots.today.length > 0 && base.slots.tomorrow.length > 0 &&
      base.firstSlotDay === "today" && base.firstSlotLabel === base.slots.today[0],
    "t1) oggi+domani con slot → firstSlotDay='today', label = primo slot oggi"
  );
}

// t2) oggi vuoto (full_day oggi), domani con slot → firstSlotDay="tomorrow".
{
  const now = new Date("2026-08-12T06:00:00Z");
  const exc = [{ date: "2026-08-12", closure_type: "full_day" }];
  const base = getScheduledSlots(WINROWS, now, exc);
  assert(
    base.slots.today.length === 0 && base.slots.tomorrow.length > 0 &&
      base.firstSlotDay === "tomorrow" && base.firstSlotLabel === base.slots.tomorrow[0],
    "t2) oggi chiuso / domani con slot → firstSlotDay='tomorrow', label = primo slot domani"
  );
}

// t3) entrambi vuoti (full_day oggi + domani) → firstSlotDay=null, label=null
//     (scenario live che ha esposto il bug: il primo slot cade su dopodomani).
{
  const now = new Date("2026-08-12T06:00:00Z");
  const exc = [
    { date: "2026-08-12", closure_type: "full_day" },
    { date: "2026-08-13", closure_type: "full_day" },
  ];
  const base = getScheduledSlots(WINROWS, now, exc);
  assert(
    base.slots.today.length === 0 && base.slots.tomorrow.length === 0 &&
      base.firstSlotDay === null && base.firstSlotLabel === null,
    "t3) oggi+domani chiusi → firstSlotDay=null, firstSlotLabel=null"
  );
}

// ---- Task D: classifyScheduledSlot (guard checkout server-side §46b/§68.4) ----
// WINDOWS: lunch 12:00-14:30, dinner 19:00-22:30 (ogni giorno). Agosto = CEST
// (UTC+2): Roma 13:00 = 11:00Z (lunch), Roma 20:00 = 18:00Z (dinner),
// Roma 16:00 = 14:00Z (fuori finestra). now = 09:00Z (Roma 11:00, pre-lunch).
{
  const now = new Date("2026-08-15T09:00:00Z");
  assert(
    classifyScheduledSlot("2026-08-15T11:00:00Z", now, WINDOWS, []) === "ok",
    "u1) slot lunch futuro, nessuna eccezione → ok"
  );
  assert(
    classifyScheduledSlot("2026-08-15T18:00:00Z", now, WINDOWS, []) === "ok",
    "u2) slot dinner futuro, nessuna eccezione → ok"
  );
  assert(
    classifyScheduledSlot("2026-08-15T11:00:00Z", now, WINDOWS, [{ date: "2026-08-15", closure_type: "lunch" }]) === "closed",
    "u3) slot lunch ma lunch chiuso da eccezione → closed"
  );
  assert(
    classifyScheduledSlot("2026-08-15T18:00:00Z", now, WINDOWS, [{ date: "2026-08-15", closure_type: "full_day" }]) === "closed",
    "u4) slot dinner ma full_day → closed"
  );
  assert(
    classifyScheduledSlot("2026-08-15T14:00:00Z", now, WINDOWS, []) === "closed",
    "u5) slot fuori da ogni finestra base (Roma 16:00) → closed"
  );
  assert(
    classifyScheduledSlot("2026-08-15T08:00:00Z", now, WINDOWS, []) === "past",
    "u6) slot nel passato (Roma 10:00, prima di now) → past"
  );
}

// ---- §12b Task A: calcolo slot Ritiro (getPickupSlots) ----
// WINROWS: lunch 12:00-14:30, dinner 19:00-22:30 (ogni giorno). Agosto = CEST
// (UTC+2): Roma HH:00 = (HH-2):00 UTC.
{
  // pk1) verde, arrotondamento non-esatto: Roma 12:07 → +15 = 12:22 → 12:30.
  const p1 = getPickupSlots(WINROWS, new Date("2026-08-15T10:07:00Z"));
  assert(
    p1.firstSlotDay === "today" && p1.firstSlotLabel === "12:30" && p1.slots.today[0] === "12:30",
    "pk1) Ritiro verde 12:07 → primo slot 12:30 (arrotondamento avanti)"
  );

  // pk2) verde, quarto esatto tenuto: Roma 12:00 → +15 = 12:15 (tenuto).
  const p2 = getPickupSlots(WINROWS, new Date("2026-08-15T10:00:00Z"));
  assert(
    p2.firstSlotLabel === "12:15" && p2.slots.today[0] === "12:15",
    "pk2) Ritiro verde 12:00 → primo slot 12:15 (quarto esatto tenuto)"
  );

  // pk3) chiusura inclusa (Ritiro) vs esclusa (Delivery), stesso now = Roma 12:00.
  const d2 = getScheduledSlots(WINROWS, new Date("2026-08-15T10:00:00Z"));
  assert(
    p2.slots.today.includes("14:30") === true,
    "pk3a) Ritiro: ultimo slot pranzo = 14:30 (chiusura inclusa)"
  );
  assert(
    d2.slots.today.includes("14:30") === false && d2.slots.today.includes("14:15") === true,
    "pk3b) Delivery invariata: ultimo slot pranzo = 14:15 (chiusura esclusa)"
  );

  // pk4) CASO CHE DISTINGUE LE DUE MODALITÀ (§12b): locale aperto, Roma 14:00,
  // mancano 30 min alla chiusura pranzo (14:30). Delivery (+60) slitta a cena
  // 19:30; Ritiro (+15) resta a 14:15 nel pranzo.
  const now4 = new Date("2026-08-15T12:00:00Z");
  const d4 = getScheduledSlots(WINROWS, now4);
  const p4 = getPickupSlots(WINROWS, now4);
  assert(
    d4.firstSlotDay === "today" && d4.firstSlotLabel === "19:30" && d4.slots.today.includes("14:15") === false,
    "pk4a) Delivery 14:00 → slitta alla cena, primo slot 19:30"
  );
  assert(
    p4.firstSlotDay === "today" && p4.firstSlotLabel === "14:15" && p4.slots.today.includes("14:30") === true,
    "pk4b) Ritiro 14:00 → resta nel pranzo, primo slot 14:15 (fino a 14:30)"
  );

  // pk5) giallo/rosso: apertura + 15 (Ritiro) vs + 30 (Delivery). Roma 11:45,
  // prima dell'apertura pranzo (12:00).
  const now5 = new Date("2026-08-15T09:45:00Z");
  const p5 = getPickupSlots(WINROWS, now5);
  const d5 = getScheduledSlots(WINROWS, now5);
  assert(
    p5.firstSlotLabel === "12:15",
    "pk5a) Ritiro pre-apertura → apertura 12:00 + 15 = 12:15"
  );
  assert(
    d5.firstSlotLabel === "12:30",
    "pk5b) Delivery invariata pre-apertura → apertura 12:00 + 30 = 12:30"
  );

  // pk6) oggi+domani interamente chiusi → nessuno slot: checkout Ritiro
  // bloccato e coerenza firstSlotDay/label = null (no regressione bug Task C).
  const now6 = new Date("2026-08-12T06:00:00Z");
  const exc6 = [
    { date: "2026-08-12", closure_type: "full_day" },
    { date: "2026-08-13", closure_type: "full_day" },
  ];
  const p6 = getPickupSlots(WINROWS, now6, exc6);
  assert(
    p6.slots.today.length === 0 && p6.slots.tomorrow.length === 0 &&
      p6.firstSlotDay === null && p6.firstSlotLabel === null &&
      p6.checkoutBlocked === true && typeof p6.blockMessage === "string" && p6.blockMessage.length > 0,
    "pk6) Ritiro oggi+domani chiusi → blocked, firstSlotDay/label null, blockMessage presente"
  );
}

// ---- §12b Task C: guard Ritiro (classifyScheduledSlot con closingInclusive) ----
// WINDOWS: lunch 12:00-14:30, dinner 19:00-22:30. Agosto = CEST (UTC+2):
// Roma 14:30 (chiusura pranzo) = 12:30 UTC; Roma 13:00 = 11:00 UTC.
// now = 09:00Z (Roma 11:00).
{
  const now = new Date("2026-08-15T09:00:00Z");
  const atClose = "2026-08-15T12:30:00Z"; // Roma 14:30 = orario di chiusura pranzo

  // gc1) CASO CHIAVE: orario esattamente alla chiusura. Ritiro (chiusura
  // inclusa) → valido; Delivery (chiusura esclusa, default) → closed.
  assert(
    classifyScheduledSlot(atClose, now, WINDOWS, [], true) === "ok",
    "gc1a) Ritiro slot alla chiusura (14:30) con closingInclusive=true → ok"
  );
  assert(
    classifyScheduledSlot(atClose, now, WINDOWS, []) === "closed",
    "gc1b) Delivery invariata: stesso slot 14:30 (default esclusivo) → closed"
  );

  // gc2) slot Ritiro interno alla finestra → ok (sanity closingInclusive).
  assert(
    classifyScheduledSlot("2026-08-15T11:00:00Z", now, WINDOWS, [], true) === "ok",
    "gc2) Ritiro slot 13:00 dentro pranzo → ok"
  );

  // gc3) slot Ritiro alla chiusura ma turno chiuso da eccezione → closed
  // (l'inclusività non aggira le eccezioni).
  assert(
    classifyScheduledSlot(atClose, now, WINDOWS, [{ date: "2026-08-15", closure_type: "lunch" }], true) === "closed",
    "gc3) Ritiro slot 14:30 ma pranzo chiuso da eccezione → closed"
  );

  // gc4) orario mancante/invalido → computeScheduledDeliveryAt null (meccanismo
  // del rifiuto 400 nella route, coerente con la Delivery programmata).
  assert(
    computeScheduledDeliveryAt(undefined, undefined) === null,
    "gc4a) orario ritiro assente → computeScheduledDeliveryAt null (→ 400)"
  );
  assert(
    computeScheduledDeliveryAt("today", undefined) === null,
    "gc4b) giorno senza orario → null (→ 400)"
  );
  assert(
    computeScheduledDeliveryAt("today", "14:30") instanceof Date,
    "gc4c) giorno+orario validi → Date (non 400)"
  );
}

console.log(failures === 0 ? "\nTUTTI I TEST PASSATI" : `\n${failures} TEST FALLITI`);
process.exitCode = failures === 0 ? 0 : 1;
