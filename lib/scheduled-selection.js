// §12 (spec v17) — verdetto puro sulla selezione di orario di **consegna
// programmata** (Delivery) rispetto agli slot correnti del giorno scelto.
// Pura e senza dipendenze: testabile in isolamento.
//
// Verdetto:
//  - "ok"      : ASAP (nessuno slot da rispettare), oppure programmata con lo
//                slot scelto ancora tra quelli disponibili → niente da fare.
//  - "expired" : programmata con uno slot scelto che NON è più tra quelli
//                disponibili → §12 caso 3: azzerare la selezione, bloccare il
//                pagamento e mostrare il messaggio §46b. MAI spostamento
//                silenzioso su un altro slot.
//  - "none"    : programmata senza uno slot scelto (scheduledTime null) → va
//                preselezionato il primo slot (compito degli handler di
//                ingresso in modalità programmata), non è un blocco.
//
// Nota (§12b): la Delivery, a differenza del Ritiro, NON ha il caso
// "automatico/silenzioso" (primo slot preselezionato-e-non-toccato). Sulla
// Delivery ogni orario programmato è esplicito, quindi qui non serve un flag
// "esplicito": basta il verdetto sullo stato corrente.
function classifyScheduledSelection({ timingType, scheduledTime, daySlots }) {
  if (timingType !== "scheduled") return "ok";
  if (scheduledTime == null) return "none";
  return (daySlots ?? []).includes(scheduledTime) ? "ok" : "expired";
}

// Primo slot disponibile di un giorno (per la preselezione all'ingresso in
// modalità programmata), oppure null se il giorno non ha slot.
function firstAvailableSlot(daySlots) {
  return (daySlots ?? [])[0] ?? null;
}

export { classifyScheduledSelection, firstAvailableSlot };
