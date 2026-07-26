// §12 (spec v17) — test del verdetto puro sulla selezione orario Delivery.
// Esegui: node tests/scheduled-selection.test.mjs   (exit 0 = tutti PASS)
import {
  classifyScheduledSelection,
  firstAvailableSlot,
} from "../lib/scheduled-selection.js";

let failures = 0;
function assert(cond, msg) {
  console.log(`${cond ? "PASS" : "FAIL"} — ${msg}`);
  if (!cond) failures++;
}

const SLOTS = ["20:00", "20:15", "20:30"];

// a) programmata con slot ancora presente → ok
assert(
  classifyScheduledSelection({ timingType: "scheduled", scheduledTime: "20:15", daySlots: SLOTS }) === "ok",
  "a) scheduled + slot presente → ok"
);

// b) programmata con slot sparito → expired (caso 3)
assert(
  classifyScheduledSelection({ timingType: "scheduled", scheduledTime: "20:15", daySlots: ["20:30", "20:45"] }) === "expired",
  "b) scheduled + slot non più disponibile → expired"
);

// c) ASAP → ok, nessun blocco (indipendente da scheduledTime)
assert(
  classifyScheduledSelection({ timingType: "asap", scheduledTime: null, daySlots: [] }) === "ok",
  "c1) asap + nessuno slot → ok (nessun blocco)"
);
assert(
  classifyScheduledSelection({ timingType: "asap", scheduledTime: "99:99", daySlots: SLOTS }) === "ok",
  "c2) asap ignora scheduledTime → ok"
);

// d) giorno senza slot
assert(
  classifyScheduledSelection({ timingType: "scheduled", scheduledTime: "20:00", daySlots: [] }) === "expired",
  "d1) scheduled + slot scelto ma giorno senza slot → expired"
);
assert(
  classifyScheduledSelection({ timingType: "scheduled", scheduledTime: null, daySlots: [] }) === "none",
  "d2) scheduled + nessuno slot scelto + giorno senza slot → none"
);

// e) programmata senza slot scelto ma con slot disponibili → none (da preselezionare)
assert(
  classifyScheduledSelection({ timingType: "scheduled", scheduledTime: null, daySlots: SLOTS }) === "none",
  "e) scheduled + scheduledTime null (con slot) → none (preselezione)"
);

// f) firstAvailableSlot
assert(firstAvailableSlot(SLOTS) === "20:00", "f1) firstAvailableSlot → primo slot");
assert(firstAvailableSlot([]) === null, "f2) firstAvailableSlot([]) → null");
assert(firstAvailableSlot(undefined) === null, "f3) firstAvailableSlot(undefined) → null");

console.log(failures === 0 ? "\nTUTTI I TEST PASSATI" : `\n${failures} TEST FALLITI`);
process.exitCode = failures === 0 ? 0 : 1;
