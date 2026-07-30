// §12b — test del verdetto puro sulla selezione orario RITIRO.
// Esegui: node tests/scheduled-selection-pickup.test.mjs   (exit 0 = tutti PASS)
//
// La funzione è stata ESTRATTA dal codice che viveva in linea in app/page.js
// (condizione di pagamento e effetto di scadenza). Questi test fissano il
// comportamento di allora, valori limite compresi: se un domani cambia, deve
// essere una decisione, non una svista.
import { classifyPickupSelection } from "../lib/scheduled-selection.js";

let failures = 0;
function assert(cond, msg) {
  console.log(`${cond ? "PASS" : "FAIL"} — ${msg}`);
  if (!cond) failures++;
}

// Slot di ritiro come li produce getPickupSlots: quarti d'ora, chiusura
// INCLUSA (§12b). La funzione non sa nulla di questa regola: li riceve pronti.
const SLOTS = ["12:15", "12:30", "12:45", "13:00"];

// a) i tre esiti nel caso normale
{
  assert(classifyPickupSelection({ pickupTime: "12:30", daySlots: SLOTS }) === "ok", "a1) orario ancora fra quelli disponibili → ok");
  assert(classifyPickupSelection({ pickupTime: "11:45", daySlots: SLOTS }) === "expired", "a2) orario non più fra quelli disponibili → expired");
  assert(classifyPickupSelection({ pickupTime: null, daySlots: SLOTS }) === "none", "a3) nessun orario scelto → none (va preselezionato, non è un blocco)");
}

// b) l'ultimo slot è valido come gli altri: la chiusura inclusa (§12b) è già
//    dentro l'elenco, la funzione non deve trattarlo in modo speciale
{
  assert(classifyPickupSelection({ pickupTime: "13:00", daySlots: SLOTS }) === "ok", "b) ultimo slot (orario di chiusura) → ok, nessun caso speciale");
}

// c) pickupTime assente in tutte le forme che l'inline trattava come "nessuna
//    scelta": il confronto era `pickupTime != null`, quindi largo
{
  assert(classifyPickupSelection({ pickupTime: undefined, daySlots: SLOTS }) === "none", "c1) undefined → none (il confronto largo prende anche undefined)");
  assert(classifyPickupSelection({ daySlots: SLOTS }) === "none", "c2) campo assente → none");
}

// d) stringa vuota: NON è null, quindi passa dal confronto con gli slot e non
//    essendoci finisce in expired. Comportamento dell'inline, riprodotto tale
//    e quale — non è una scelta nuova.
{
  assert(classifyPickupSelection({ pickupTime: "", daySlots: SLOTS }) === "expired", "d) stringa vuota → expired (non è null: passa dal confronto)");
}

// e) elenco slot vuoto o assente — il giorno non ha slot (locale chiuso, turno
//    chiuso da eccezione §68). Un orario scelto non può che essere scaduto.
{
  assert(classifyPickupSelection({ pickupTime: "12:30", daySlots: [] }) === "expired", "e1) elenco vuoto + orario scelto → expired");
  assert(classifyPickupSelection({ pickupTime: "12:30", daySlots: undefined }) === "expired", "e2) elenco assente + orario scelto → expired");
  assert(classifyPickupSelection({ pickupTime: "12:30" }) === "expired", "e3) campo daySlots assente + orario scelto → expired");
  assert(classifyPickupSelection({ pickupTime: null, daySlots: [] }) === "none", "e4) elenco vuoto senza orario scelto → none (precede il confronto)");
  assert(classifyPickupSelection({ pickupTime: null, daySlots: undefined }) === "none", "e5) elenco assente senza orario scelto → none");
}

// f) confronto ESATTO sulla stringa, come per la Delivery: nessun trim,
//    nessuna normalizzazione, nessuna equivalenza fra formati orari
{
  assert(classifyPickupSelection({ pickupTime: "12:30 ", daySlots: SLOTS }) === "expired", "f1) spazio in coda → expired (nessun trim)");
  assert(classifyPickupSelection({ pickupTime: "12.30", daySlots: SLOTS }) === "expired", "f2) separatore diverso → expired");
  assert(classifyPickupSelection({ pickupTime: "9:00", daySlots: ["09:00"] }) === "expired", "f3) ora senza zero iniziale → expired (nessuna normalizzazione)");
}

// g) i due punti di aggancio in app/page.js leggono l'esito allo stesso modo
//    (`=== "ok"`), quindi "none" e "expired" devono restare entrambi diversi da
//    "ok": è ciò che rende l'estrazione a comportamento invariato.
{
  assert(classifyPickupSelection({ pickupTime: null, daySlots: SLOTS }) !== "ok", "g1) none non è ok → pagamento bloccato come prima");
  assert(classifyPickupSelection({ pickupTime: "11:45", daySlots: SLOTS }) !== "ok", "g2) expired non è ok → pagamento bloccato come prima");
}

console.log(failures === 0 ? "\nTUTTI I TEST PASSATI" : `\n${failures} TEST FALLITI`);
process.exitCode = failures === 0 ? 0 : 1;
