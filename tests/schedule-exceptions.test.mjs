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
} from "../lib/schedule-exceptions.js";

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

console.log(failures === 0 ? "\nTUTTI I TEST PASSATI" : `\n${failures} TEST FALLITI`);
process.exitCode = failures === 0 ? 0 : 1;
