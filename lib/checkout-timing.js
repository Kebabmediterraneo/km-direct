// §46b/§68.4 — riverifica server-side del momento dell'ordine: il blocco del
// checkout durante una chiusura vive lato client, ma una richiesta costruita a
// mano o una pagina stantia potrebbe POSTare un ordine in un turno chiuso.
// Estratto da `app/api/checkout/route.js` (tappa 2 di §46) a comportamento
// invariato: stesse due letture, stesso ordine, stessi tre rami, stessi
// messaggi.
//
// **Non produce nulla**: è un guard. O lascia passare, o dice di no. Nella
// route viveva dentro un blocco `{ }` proprio per rendere impossibile che una
// sua variabile locale finisse per essere usata più avanti; qui la stessa
// garanzia viene dalla funzione.
//
// **Forma**: come `lib/checkout-resolve.js`, un core che possiede
// `supabaseAdmin` e restituisce dati, mai un `NextResponse`. Non è puro e non
// finge di esserlo: le due letture non sono simulabili in modo onesto, quindi
// la sua rete è la fotografia della route (`tests/route-snapshot.mjs`).
//
// ⚠️ **Perché i 500 tornano come `READ_ERROR` e non come `{status, body}`.**
// Il testo di §v19 mostrato al cliente per gli errori tecnici
// (`SYSTEM_ERROR_MESSAGE`) è usato da **sette** uscite, di cui solo due qui:
// le altre cinque restano nella route. Farlo possedere a questo modulo lo
// metterebbe nel posto sbagliato; copiarlo sarebbe la trappola di `READ_ERROR`
// in forma di stringa — due copie che divergono senza che nulla se ne accorga.
// Si riusa quindi la sentinella che il progetto ha già **per esattamente
// questo caso**: il modulo dice "guasto di lettura, colpa nostra", la route
// possiede la parola. È la regola di §46b — un guasto di lettura non è un
// rifiuto — e il commento di `READ_ERROR` la chiede esplicitamente: *"un solo
// tipo di esito per tutti questi casi (§46b, riusa la struttura)"*.
//
// ⚠️ **NON importare in un componente client**: usa la secret key.
import { supabaseAdmin } from "./supabase-admin.js";
import { getScheduledSlots } from "./scheduled-slots.js";
import {
  todayRomeDate,
  computeExceptionEffects,
  classifyScheduledSlot,
  scheduledRejectionMessage,
} from "./schedule-exceptions.js";
// La sentinella arriva da `checkout-resolve`, **importata e mai ricreata**: è
// lo stesso identico Symbol che la route confronta, e un secondo
// `Symbol("read-error")` non sarebbe mai uguale. Il legame fra i due moduli è
// solo questo — se un terzo consumatore comparisse, il posto giusto per la
// sentinella diventerebbe un modulo di vocabolario condiviso.
import { READ_ERROR } from "./checkout-resolve.js";

// Ritorna:
//  - `READ_ERROR`               → guasto di lettura: la route risponde 500 con
//                                 il proprio SYSTEM_ERROR_MESSAGE (§46b);
//  - `{ ok: false, status, body }` → rifiuto 409 già confezionato nel corpo,
//                                 con i testi §46b;
//  - `{ ok: true }`             → si prosegue.
//
// ⚠️ L'ordine è vincolante e identico a quello della route: **prima** le due
// letture con i loro guasti, **poi** i tre rami — Ritiro, Delivery programmata,
// ASAP. A parità di richiesta sbagliata in più modi il cliente deve vedere lo
// stesso messaggio di prima.
export async function verifyOrderTiming({ storeId, isDelivery, timingType, scheduledDeliveryAt }) {
  const { data: windows, error: windowsError } = await supabaseAdmin
    .from("store_order_windows")
    .select("day_of_week, opens_at, closes_at, is_defined")
    .eq("store_id", storeId);

  if (windowsError) {
    console.error("[POST /api/checkout] Errore lettura store_order_windows:", windowsError);
    return READ_ERROR;
  }

  // Stessa finestra di service-status (oggi..+31gg) così la "prossima
  // apertura" del messaggio ASAP è coerente.
  const now = new Date();
  const fromDate = todayRomeDate(now);
  const toDate = todayRomeDate(new Date(now.getTime() + 31 * 86400000));
  const { data: exceptionRows, error: exceptionsError } = await supabaseAdmin
    .from("store_schedule_exceptions")
    .select("date, closure_type")
    .eq("store_id", storeId)
    .gte("date", fromDate)
    .lte("date", toDate);

  if (exceptionsError) {
    console.error("[POST /api/checkout] Errore lettura store_schedule_exceptions:", exceptionsError);
    return READ_ERROR;
  }

  const exceptions = exceptionRows ?? [];

  if (!isDelivery) {
    // §12b/§46b: il Ritiro è sempre programmato (mai ASAP). Lo slot deve
    // cadere in una finestra base reale non chiusa da eccezione, e nel
    // futuro — con chiusura INCLUSA (un ritiro all'orario di chiusura è
    // valido, §12b). Stesse stringhe §46b della Delivery programmata.
    const verdict = classifyScheduledSlot(scheduledDeliveryAt, now, windows, exceptions, true);
    if (verdict !== "ok") {
      return { ok: false, status: 409, body: { error: scheduledRejectionMessage(verdict) } };
    }
  } else if (timingType === "scheduled") {
    // §46b/§68: lo slot programmato deve cadere in una finestra base reale non
    // chiusa da eccezione, e nel futuro (chiusura esclusa, come §12).
    const verdict = classifyScheduledSlot(scheduledDeliveryAt, now, windows, exceptions);
    if (verdict !== "ok") {
      return { ok: false, status: 409, body: { error: scheduledRejectionMessage(verdict) } };
    }
  } else {
    // §46b: ASAP disponibile solo se il turno corrente è aperto (verde) e non
    // chiuso da un'eccezione — esattamente asapAvailable di §68.4.
    const status = getScheduledSlots(windows, now, exceptions);
    const effects = computeExceptionEffects(status, now, windows, exceptions);
    if (!effects.asapAvailable) {
      return {
        ok: false,
        status: 409,
        body: {
          error:
            "Non possiamo più accettare ordini immediati in questo momento. Scegli un orario tra quelli disponibili.",
        },
      };
    }
  }

  return { ok: true };
}
