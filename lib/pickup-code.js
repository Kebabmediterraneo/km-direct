// §69 — il numero d'ordine (`pickup_code`: KM-0001, KM-0002, …), progressivo e
// mai casuale. Sta in un modulo suo, col client `db` passato da fuori, perché
// sia eseguibile da una prova (`tests/pickup-code.test.mjs`): dentro la rotta
// non lo era, e il guasto del 14/11/2026 è passato da lì.
//
// ===========================================================================
// ⚠️⚠️ IL GUASTO DEL 14/11/2026: IL SITO VIVO NON PRENDEVA ORDINI
// ===========================================================================
// Fino a quel giorno il numero nuovo era **quanti ordini ci sono in tabella più
// uno**. Funzionava solo finché nessuno cancellava ordini: la pulizia mensile
// del 06/11 ne ha cancellati una PARTE — i mai pagati — e il conteggio è sceso
// sotto il numero più alto già usato. Misura di Andrea alle 19:21: 27 ordini,
// il più alto 39. Il sito provava KM-0028, che esiste, poi i quattro successivi,
// tutti esistenti, e si arrendeva: ogni cliente vedeva il messaggio di errore
// tecnico prima di arrivare a Stripe. *La spec lo aveva scritto (§69):
// "Cancellare in futuro solo una parte degli ordini produrrebbe collisioni".*
//
// Ora il numero nuovo è **il più alto già presente più uno**.
//
// ===========================================================================
// COME SI LEGGE IL PIÙ ALTO, E PERCHÉ COSÌ
// ===========================================================================
// ⚠️ **Non si leggono tutti i codici per calcolare il massimo qui**: le letture
// hanno un tetto di righe, e oltre quel tetto il massimo sarebbe sbagliato in
// silenzio. Si chiede al database **una riga sola**.
//
// ⚠️ **Ma l'ordinamento è alfabetico**, perché `pickup_code` è testo: 'KM-10000'
// cade PRIMA di 'KM-9999'. Ordinare e prendere il primo darebbe KM-9999 per
// sempre, e dopo il diecimillesimo ordine ogni ordine nuovo urterebbe un
// doppione. Quindi si chiede il più alto **per ogni lunghezza**: fra codici con
// lo stesso numero di cifre l'ordine alfabetico coincide con quello numerico.
// Si parte da quattro cifre e si sale finché una lunghezza non ha nessun
// codice: oggi sono due letture da una riga.
//
// ⚠️ Il filtro chiede la forma esatta `KM-` seguito da sole cifre: un codice
// scritto in un'altra forma non sposta il numero. (Il suffisso `KM-0001-B` di
// §57-61 sta in `external_delivery_id`, non qui; il filtro lo escluderebbe
// comunque.)
//
// ⚠️⚠️ **SE LA LETTURA FALLISCE, SI FERMA CON UN ERRORE. MAI KM-0001.** La logica
// vecchia, su un conteggio non letto, ripartiva da uno in silenzio. Un errore
// costa un ordine non partito, con il messaggio di sempre al cliente e una riga
// nel log; ripartire da uno costa cinque doppioni e lo stesso errore, ma senza
// dire perché. *Lo zero vero — tabella vuota, lettura riuscita — resta distinto
// dal guasto: lì KM-0001 è giusto.*

const PREFISSO = "KM-";
const CIFRE_MINIME = 4;
// Un tetto alla salita, perché un ciclo che legge il database non resti mai
// senza fine. Dodici cifre sono mille miliardi di ordini.
const CIFRE_MASSIME = 12;
const TENTATIVI = 5;

function formatta(numero) {
  return `${PREFISSO}${String(numero).padStart(CIFRE_MINIME, "0")}`;
}

// Il numero da cui partire: il più alto già usato più uno. Solleva un errore se
// una lettura fallisce.
export async function nextPickupNumber(db) {
  let piuAlto = 0;
  for (let cifre = CIFRE_MINIME; cifre <= CIFRE_MASSIME; cifre++) {
    const { data, error } = await db
      .from("orders")
      .select("pickup_code")
      .regexMatch("pickup_code", `^${PREFISSO}[0-9]{${cifre}}$`)
      .order("pickup_code", { ascending: false })
      .limit(1);

    if (error) {
      const guasto = new Error(
        `Lettura del numero d'ordine più alto non riuscita (${cifre} cifre): ${error.message ?? "errore sconosciuto"}`
      );
      guasto.code = error.code;
      throw guasto;
    }

    const codice = data?.[0]?.pickup_code;
    if (codice === undefined) {
      // Nessun codice di questa lunghezza. A quattro cifre si sale lo stesso
      // (una tabella vuota e una partita da un numero alto sono entrambe
      // possibili); oltre, la numerazione progressiva non salta lunghezze.
      if (cifre > CIFRE_MINIME) break;
      continue;
    }
    piuAlto = Number(codice.slice(PREFISSO.length));
  }
  return piuAlto + 1;
}

// Inserisce l'ordine col numero nuovo. Riprova col successivo se il database
// rifiuta un doppione (23505: un altro ordine ha preso lo stesso numero un
// istante prima), fino a cinque volte; ogni altro errore si solleva subito.
export async function insertOrderWithPickupCode(db, orderPayload) {
  const baseNumber = await nextPickupNumber(db);

  for (let attempt = 0; attempt < TENTATIVI; attempt++) {
    const pickupCode = formatta(baseNumber + attempt);
    const { data: order, error } = await db
      .from("orders")
      .insert({ ...orderPayload, pickup_code: pickupCode })
      .select()
      .single();

    if (!error) return order;
    if (error.code !== "23505") throw error;
  }

  throw new Error("Impossibile generare un codice ritiro univoco.");
}
