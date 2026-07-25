// §12b Task D (spec v16, §52-56) — test dell'ordinamento coda staff per
// "orario di riferimento". Esegui con: node tests/staff-queue-order.test.mjs
// Exit code 0 = tutti PASS.
import {
  sortQueueByReferenceTime,
  asapReferenceMs,
} from "../lib/staff-queue-order.js";

let failures = 0;
function assert(cond, msg) {
  console.log(`${cond ? "PASS" : "FAIL"} — ${msg}`);
  if (!cond) failures++;
}

const ms = (iso) => new Date(iso).getTime();
const codes = (orders) => orders.map((o) => o.pickup_code).join(",");

// Fabbrica ordini minimi (solo i campi usati dalla logica + pickup_code).
function programmato(code, scheduledIso, createdIso) {
  return { pickup_code: code, scheduled_delivery_at: scheduledIso, delivery_timing: "scheduled", created_at: createdIso };
}
function asap(code, createdIso) {
  return { pickup_code: code, scheduled_delivery_at: null, delivery_timing: "asap", created_at: createdIso };
}

// ---- a) programmato e ASAP sullo stesso quarto d'ora → tiebreak created_at ----
{
  // P: ref = 18:30 (concordato); A ASAP created 18:10 → +15 = 18:25 → 18:30.
  const P = programmato("P", "2026-08-15T18:30:00Z", "2026-08-15T18:05:00Z");
  const A = asap("A", "2026-08-15T18:10:00Z");
  // P creato prima (18:05 < 18:10) → P davanti.
  assert(codes(sortQueueByReferenceTime([A, P])) === "P,A", "a1) stesso quarto (18:30): created_at 18:05 < 18:10 → P prima di A");

  // Contro-caso: ASAP creato prima del programmato → ASAP davanti.
  const A2 = asap("A2", "2026-08-15T18:00:30Z");            // +15 = 18:15:30 → 18:30
  const P2 = programmato("P2", "2026-08-15T18:30:00Z", "2026-08-15T18:20:00Z");
  assert(codes(sortQueueByReferenceTime([P2, A2])) === "A2,P2", "a2) stesso quarto (18:30): created_at 18:00:30 < 18:20 → A2 prima di P2");
}

// ---- b) arrotondamento in avanti dell'ASAP ----
{
  // created 20:10 → +15 = 20:25 → arrotondato in avanti → 20:30.
  assert(asapReferenceMs(ms("2026-08-15T20:10:00Z")) === ms("2026-08-15T20:30:00Z"), "b1) ASAP 20:10 → +15 = 20:25 → 20:30");
  // created 20:00 → +15 = 20:15 esatto → resta 20:15 (non sale a 20:30).
  assert(asapReferenceMs(ms("2026-08-15T20:00:00Z")) === ms("2026-08-15T20:15:00Z"), "b2) ASAP 20:00 → +15 = 20:15 esatto → 20:15 (invariato)");
}

// ---- c) mix di più programmati e più ASAP: ordine finale completo ----
{
  const A2 = asap("A2", "2026-08-15T18:40:00Z");                             // +15 = 18:55 → 19:00
  const P1 = programmato("P1", "2026-08-15T19:15:00Z", "2026-08-15T18:00:00Z"); // 19:15
  const P2 = programmato("P2", "2026-08-15T19:30:00Z", "2026-08-15T17:00:00Z"); // 19:30, created 17:00
  const A1 = asap("A1", "2026-08-15T19:05:00Z");                             // +15 = 19:20 → 19:30, created 19:05
  const P3 = programmato("P3", "2026-08-15T20:00:00Z", "2026-08-15T19:50:00Z"); // 20:00

  // Input volutamente disordinato.
  const sorted = sortQueueByReferenceTime([P3, A1, P1, P2, A2]);
  // ref: A2=19:00, P1=19:15, {P2,A1}=19:30 (tie → created: P2 17:00 < A1 19:05), P3=20:00
  assert(codes(sorted) === "A2,P1,P2,A1,P3", "c) mix programmati+ASAP → A2,P1,P2,A1,P3 (tie 19:30 risolto da created_at)");
}

// ---- d) l'input non viene mutato, il risultato è un nuovo array ----
{
  const P = programmato("P", "2026-08-15T19:30:00Z", "2026-08-15T18:00:00Z");
  const A = asap("A", "2026-08-15T18:40:00Z"); // ref 19:00 → andrà prima
  const input = [P, A];
  const snapshot = [...input];
  const keysBefore = input.map((o) => Object.keys(o).sort().join(","));

  const result = sortQueueByReferenceTime(input);

  assert(result !== input, "d1) ritorna un nuovo array (result !== input)");
  assert(input[0] === snapshot[0] && input[1] === snapshot[1], "d2) l'ordine dell'array input non è mutato");
  const keysAfter = input.map((o) => Object.keys(o).sort().join(","));
  assert(JSON.stringify(keysBefore) === JSON.stringify(keysAfter), "d3) nessuna proprietà (referenceTime/ref) aggiunta agli ordini in input");
  assert(codes(result) === "A,P", "d4) il risultato è comunque ordinato correttamente (A ref 19:00 < P ref 19:30)");
}

console.log(failures === 0 ? "\nTUTTI I TEST PASSATI" : `\n${failures} TEST FALLITI`);
process.exitCode = failures === 0 ? 0 : 1;
