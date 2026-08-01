// §46b/§68.4 — test di ciò che in `lib/checkout-timing.js` è verificabile
// senza un database, che è poco ma non è nulla.
// Esegui con: node tests/checkout-timing.test.mjs   (exit code 0 = tutti PASS)
//
// ⚠️ **Che cosa questo file NON prova.** I tre rami del guard — Ritiro,
// Delivery programmata, ASAP — stanno **dopo** due letture da Supabase, quindi
// non sono raggiungibili senza un database e non esiste qui alcun modo onesto
// di provarli: simularli proverebbe la simulazione (lezione `v`). Le loro tre
// uscite 409 sono coperte dalla fotografia della route, ai casi
// `riga-93-past`, `riga-93-closed` e `riga-473`.
//
// ✅ **Che cosa invece prova, e non è poco**: il ramo del **guasto di lettura**,
// che la fotografia NON copre — è una delle sette uscite dichiarate scoperte
// (le 427/447 di allora, "guasti Supabase"). Qui viene esercitato davvero,
// puntando il client a una porta chiusa: nessun finto, nessuna simulazione, la
// lettura fallisce sul serio e si verifica che il modulo risponda `READ_ERROR`
// invece di degradare in un rifiuto (§46b, "un guasto di lettura non è un
// rifiuto").
//
// ⚠️ **Costa ~7 secondi**: è il tempo che il client Supabase impiega a
// arrendersi su ECONNREFUSED. È l'unico test lento della cartella, e il prezzo
// è dichiarato qui perché nessuno lo scambi per un blocco.
//
// Presupposto: **nulla è in ascolto su 127.0.0.1:59999**. Se qualcosa ci
// fosse, la lettura fallirebbe comunque (risposta non valida) e l'esito
// resterebbe `READ_ERROR`; se invece riuscisse, l'asserzione fallisce in modo
// rumoroso invece di passare per caso.
process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:59999";
process.env.SUPABASE_SECRET_KEY = "chiave-finta-nessuna-lettura-puo-riuscire";

const { verifyOrderTiming } = await import("../lib/checkout-timing.js");
const { READ_ERROR } = await import("../lib/checkout-resolve.js");

let failures = 0;
function assert(cond, msg) {
  console.log(`${cond ? "PASS" : "FAIL"} — ${msg}`);
  if (!cond) failures++;
}

// a) superficie esportata
{
  assert(typeof verifyOrderTiming === "function", "a1) verifyOrderTiming esportata");
  assert(verifyOrderTiming.length === 1, "a2) prende un solo oggetto di parametri");
}

// b) il guasto di lettura — l'unica via percorribile senza database.
//
// Sotto, il `console.error` del modulo stampa l'errore ECONNREFUSED: è atteso
// e fa parte di ciò che si sta verificando (il log tecnico resta distinto dal
// messaggio al cliente, §v19).
{
  console.log("\n  (qui sotto il log tecnico atteso del modulo, non è un errore del test)");
  const esito = await verifyOrderTiming({
    storeId: "store-inesistente",
    isDelivery: false,
    timingType: undefined,
    scheduledDeliveryAt: new Date(),
  });
  console.log("");

  assert(esito === READ_ERROR, "b1) lettura fallita → READ_ERROR, non un rifiuto (§46b)");

  // ⚠️ Il punto sottile dell'estrazione: `checkout-timing` importa la
  // sentinella da `checkout-resolve` invece di ricrearla, quindi la route la
  // riconosce. Se un domani qualcuno vi scrivesse un proprio
  // `Symbol("read-error")`, questo confronto fallirebbe — mentre nella route
  // il guasto scivolerebbe **in silenzio** nel ramo successivo, rispondendo
  // 409 al posto del 500.
  assert(
    esito === READ_ERROR && typeof esito === "symbol",
    "b2) ed è LO STESSO Symbol esportato da checkout-resolve, non una copia"
  );

  // Non deve mai essere un esito "ok" travestito: un guasto che passa sarebbe
  // il caso peggiore, perché lascerebbe proseguire l'ordine senza aver
  // verificato l'orario.
  assert(esito?.ok !== true, "b3) e non è mai un via libera");
}

console.log(failures === 0 ? "\nTUTTI I TEST PASSATI" : `\n${failures} TEST FALLITI`);
process.exitCode = failures === 0 ? 0 : 1;
