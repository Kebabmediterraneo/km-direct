// §12/§12b — verdetti puri sulla selezione di orario rispetto agli slot
// correnti del giorno scelto, per **entrambe** le modalità: Delivery
// (`classifyScheduledSelection`) e Ritiro (`classifyPickupSelection`). Pure e
// senza dipendenze: testabili in isolamento.
//
// Stanno nello stesso file di proposito: sono la stessa famiglia di giudizio e
// tenerle vicine è ciò che impedisce loro di divergere (§46b). Nessuna delle
// due conosce le regole con cui gli slot sono stati calcolati — la chiusura
// inclusa del Ritiro (§12b), le finestre di §13, le eccezioni di §68: gli slot
// arrivano già pronti da chi chiama.
//
// Verdetto (identico per entrambe):
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

// §12b — verdetto sulla selezione di orario di **RITIRO**. Il Ritiro è sempre
// programmato (mai ASAP, §12b), quindi manca il caso "timingType" della gemella
// Delivery: si guarda solo l'orario scelto e gli slot del giorno.
//
// Estratta dal codice di `app/page.js` (v41), dove viveva in linea in due punti
// identici — la condizione di pagamento e l'effetto di scadenza. Estrazione
// FEDELE: `pickupTime == null` (confronto largo, quindi anche `undefined`) è
// "none"; qualunque altro valore passa dal confronto con gli slot.
//
// ⚠️ Il verdetto NON dice cosa farne. La distinzione fra orario scelto dal
// cliente e orario soltanto preselezionato (§36-40 v41) resta di chi chiama:
// è quella a decidere se un "expired" va seguito in silenzio o segnalato.
function classifyPickupSelection({ pickupTime, daySlots }) {
  if (pickupTime == null) return "none";
  return (daySlots ?? []).includes(pickupTime) ? "ok" : "expired";
}

// Primo slot disponibile di un giorno (per la preselezione all'ingresso in
// modalità programmata), oppure null se il giorno non ha slot.
function firstAvailableSlot(daySlots) {
  return (daySlots ?? [])[0] ?? null;
}

export { classifyScheduledSelection, classifyPickupSelection, firstAvailableSlot };
