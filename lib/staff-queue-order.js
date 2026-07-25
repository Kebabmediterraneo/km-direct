// §12b Task D (spec v16, §52-56): ordinamento delle code di lavorazione dello
// staff (Nuovi/Attivi) per "orario di riferimento". Logica pura, senza DB e
// senza dipendenze dalla UI, così è isolata e testabile.
//
// Orario di riferimento di un ordine:
//  - ordine PROGRAMMATO (scheduled_delivery_at valorizzato: ritiro o consegna
//    programmata) → l'orario concordato stesso.
//  - ordine ASAP (scheduled_delivery_at null) → created_at + 15 minuti,
//    arrotondato IN AVANTI al quarto d'ora (:00/:15/:30/:45). Se è già su un
//    quarto d'ora, resta invariato (non sale oltre). Riusa ceilToQuarterHour di
//    §12b Task A per NON reimplementare l'arrotondamento.
//
// Nota fuso: il quarto d'ora è invariante rispetto a Europe/Rome (offset a ore
// intere, +1/+2), quindi arrotondare l'istante UTC coincide col quarto d'ora
// locale — nessuna conversione di fuso è necessaria per la chiave di ordine.
//
// L'orario di riferimento è SOLO una chiave di ordinamento interna: la funzione
// NON muta gli ordini in input e non scrive mai referenceTime da nessuna parte
// (in particolare mai in scheduled_delivery_at, che per gli ASAP resta null,
// §52-56). Ritorna un nuovo array ordinato.

import { ceilToQuarterHour } from "./scheduled-slots.js";

const MS_PER_MINUTE = 60000;
const ASAP_PREP_MINUTES = 15;

// Istante di riferimento (ms epoch) di un ordine ASAP: created_at + 15 min,
// arrotondato in avanti al quarto d'ora tramite ceilToQuarterHour (che lavora
// in minuti). Passiamo i minuti-dall'epoch: Math.ceil(min/15)*15 arrotonda in
// avanti e lascia invariato un valore già su un quarto d'ora.
function asapReferenceMs(createdAtMs) {
  const targetMinutes = (createdAtMs + ASAP_PREP_MINUTES * MS_PER_MINUTE) / MS_PER_MINUTE;
  return ceilToQuarterHour(targetMinutes) * MS_PER_MINUTE;
}

// ms epoch dell'orario di riferimento di un ordine (programmato o ASAP).
function referenceMs(order) {
  if (order.scheduled_delivery_at) {
    return new Date(order.scheduled_delivery_at).getTime();
  }
  return asapReferenceMs(new Date(order.created_at).getTime());
}

// Ordina una coda (Nuovi/Attivi) per orario di riferimento crescente; a parità
// di orario di riferimento, per created_at crescente (chi ha ordinato prima sta
// prima). L'orario di riferimento ASAP deriva da created_at (§52-56), non da
// "adesso", quindi la funzione non ha bisogno di un "now". Ritorna un NUOVO
// array; non muta l'input né i suoi elementi.
function sortQueueByReferenceTime(orders) {
  return (orders ?? [])
    .map((order) => ({
      order,
      ref: referenceMs(order),
      created: new Date(order.created_at).getTime(),
    }))
    .sort((a, b) => a.ref - b.ref || a.created - b.created)
    .map((entry) => entry.order);
}

export { sortQueueByReferenceTime, asapReferenceMs, referenceMs };
