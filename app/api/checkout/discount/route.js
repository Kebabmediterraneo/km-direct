import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase-admin";
import { getActiveStore } from "../../../../lib/get-active-store";
import { validateCheckoutRequest } from "../../../../lib/checkout-validation";
// ⚠️ GLI STESSI lettori che usa il pagamento, importati e mai ricopiati (§14,
// "strada B"). Sono loro a contenere le decisioni vere — prezzo, proteina,
// extra carne, disponibilità, fuori menu, combo — ed è da lì che passerebbe la
// divergenza pericolosa fra quello che lo sconto vede e quello che il pagamento
// addebita. Una copia locale di quel giro sarebbe uno sconto deciso su un
// carrello diverso da quello che poi si paga.
//
// `READ_ERROR` viaggia con loro **e va importato, mai ricreato**: è un Symbol, e
// due `Symbol()` distinti non sono mai uguali (la ragione per esteso sta in cima
// a `lib/checkout-resolve.js`). Il cuore lo riconosce anche per forma, ma qui si
// può passare quello vero e si passa: due reti, non una.
import { READ_ERROR, resolveProduct, resolveCombo } from "../../../../lib/checkout-resolve";
import {
  checkDiscountEligibility,
  ELIGIBLE,
  ALREADY_REDEEMED,
  UNKNOWN_CODE,
  BELOW_THRESHOLD,
  UNRESOLVABLE_LINE,
  READ_FAILURE,
} from "../../../../lib/discount-eligibility";

// §14 (spec v68) — LA VERIFICA DEL CODICE SCONTO scritto nel campo "Hai un
// codice sconto?" del checkout.
//
// Rotta sottile, nella forma del progetto: il cuore che decide sta in
// `lib/discount-eligibility.js` ed è provabile; qui restano la lettura del
// corpo, i lettori da passare e la traduzione dell'esito nella frase. Le sette
// frasi vivono in questo file perché **la parola verso il cliente è della
// rotta** (§46 v46): il modulo dice cosa è successo e non parla al cliente.
//
// ---------------------------------------------------------------------------
// ⚠️ QUESTA ROTTA NON SCRIVE NIENTE. MAI.
// ---------------------------------------------------------------------------
// Nessuna `insert`, nessun `upsert`, nessun `update`, nessuna riga di registro.
// È il vincolo che regge tutta la scelta di §14: la rotta del pagamento, per
// sapere chi è il cliente, fa un `upsert` su `customers` — nome, cognome,
// email, marketing e `privacy_accepted_at`. Farlo anche qui riempirebbe il
// database di clienti che non hanno mai ordinato, ognuno con una privacy
// segnata come accettata **per un gesto che accettazione non è**. Chi non
// esiste non può aver già riscosso: si risponde "spetta" e non si scrive nulla.
//
// ---------------------------------------------------------------------------
// ⚠️ IL PEDAGGIO: si passa dal validatore del pagamento, PER INTERO
// ---------------------------------------------------------------------------
// La difesa di §14 non è un muro ma un pedaggio: la risposta arriva **solo
// insieme a un ordine intero e plausibile**, mai su un numero di telefono da
// solo. Per ricostruire l'elenco di chi ha già ordinato non basta digitare
// numeri, bisogna comporre ordini finti completi, uno per numero.
//
// Perciò qui si chiama `validateCheckoutRequest`, **lo stesso** modulo che usa
// il pagamento, e lo si chiama intero. Riscrivere quei controlli o sceglierne
// un sottoinsieme renderebbe il pedaggio finto: due metri diversi divergono, e
// il più largo dei due diventa la porta di servizio. Cambia solo la risposta —
// qui si dice la frase di §14 sui dati incompleti, non il messaggio specifico
// del pagamento, che nomina campi di un modulo che il cliente non sta ancora
// compilando.
//
// ⚠️ **E NON SI GUARDANO NÉ GLI ORARI NÉ IL PERIMETRO DI CONSEGNA.** Locale
// chiuso, slot scaduto, indirizzo fuori zona: nulla di tutto questo riguarda lo
// sconto. **Decisione di Andrea del 10/08/2026.** A fermare un ordine fuori
// orario o fuori zona è il pagamento, che ha già i suoi controlli
// (`lib/checkout-timing.js` e il geofence dentro `app/api/checkout/route.js`);
// duplicarli qui significherebbe due copie della stessa regola che prima o poi
// divergono, con l'effetto assurdo di negare uno sconto a chi sta componendo un
// ordine perfettamente valido per domani. *Il subtotale invece si ricalcola,
// perché quello sì che decide se lo sconto spetta.*
//
// ---------------------------------------------------------------------------
// LE SETTE RISPOSTE, parola per parola da §14 (v68)
// ---------------------------------------------------------------------------
// Sono testo deciso da Andrea e copiato carattere per carattere: chi le cambia
// sta cambiando una decisione, non sistemando una frase.
const FRASE_DATI_INCOMPLETI = "Completa i dati dell'ordine per applicare il codice.";
const FRASE_CODICE_NON_VALIDO = "Questo codice non è valido.";
const FRASE_GIA_UTILIZZATO = "Hai già utilizzato questo codice sconto.";
const FRASE_GUASTO = "Non siamo riusciti a verificare il codice. Riprova fra qualche istante.";
// ⚠️ Decisione di Andrea: per la riga che non si risolve si **riusa** la frase
// che il pagamento già dice, invece di inventarne una nuova. Due frasi diverse
// per lo stesso fatto insegnerebbero al cliente che sono due fatti diversi.
const FRASE_ARTICOLO_NON_DISPONIBILE = "Un articolo del carrello non è più disponibile.";
// L'unica con un numero dentro. L'importo si scrive all'italiana — due decimali
// e la virgola — perché è testo che il cliente legge, non un dato.
const fraseSottoSoglia = (mancante) =>
  `Ti mancano ${mancante.toFixed(2).replace(".", ",")} € per usare questo codice.`;

// ---------------------------------------------------------------------------
// Il lettore del cliente, IN SOLA LETTURA. Vive qui e non nel cuore perché il
// cuore non deve conoscere il database: è ciò che lo rende provabile.
//
// Due letture in fila: il telefono in `customers`, e solo se esiste il suo
// eventuale riscatto in `promo_redemptions`. Restituisce due booleani e
// nient'altro — l'`id` del cliente serve alla seconda query e **non esce da
// questa funzione**.
//
// ⚠️ SE UNA DELLE DUE LETTURE DÀ ERRORE, SI SOLLEVA. Non si legge il nulla come
// "nessun riscatto trovato": il cuore trasforma l'eccezione in guasto di
// lettura, e il cliente si sente dire "riprova". È il verso **opposto** a
// `lib/checkout-discount.js`, dove un guasto fa concedere lo sconto — là è
// comportamento del 2026 conservato alla lettera in un riordino, qui è codice
// nuovo e la scelta si può fare bene. *Regalare 5 € su una lettura fallita è
// denaro che esce senza che nessuno se ne accorga; dire "riprova" non costa
// niente a nessuno.*
async function findCustomerRedemption({ phone, code }) {
  const { data: customer, error: erroreCliente } = await supabaseAdmin
    .from("customers")
    .select("id")
    .eq("phone", phone)
    .maybeSingle();

  if (erroreCliente) {
    console.error("[POST /api/checkout/discount] Errore lettura customers:", erroreCliente);
    throw new Error("Lettura del cliente fallita.");
  }

  // Telefono mai visto: nessuna scrittura e nessuna seconda lettura.
  if (!customer) return { found: false };

  const { data: riscatto, error: erroreRiscatto } = await supabaseAdmin
    .from("promo_redemptions")
    .select("id")
    .eq("promo_code", code)
    .eq("customer_id", customer.id)
    .maybeSingle();

  if (erroreRiscatto) {
    console.error("[POST /api/checkout/discount] Errore lettura promo_redemptions:", erroreRiscatto);
    throw new Error("Lettura dei riscatti fallita.");
  }

  return { found: true, redeemed: !!riscatto };
}

export async function POST(request) {
  // 1) Il corpo, dentro un try/catch. ⚠️ Nella rotta del pagamento la
  // `request.json()` **non è protetta** — comportamento noto, registrato e non
  // corretto lì perché sarebbe una modifica vera da decidere prima in spec. Qui
  // è codice nuovo, quindi si fa bene subito: un corpo malformato è una
  // richiesta sbagliata, non un guasto nostro.
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ outcome: "richiesta_non_valida", message: FRASE_DATI_INCOMPLETI }, { status: 400 });
  }

  // 2) IL PEDAGGIO. Il validatore del pagamento, per intero.
  const validazione = validateCheckoutRequest(body);
  if (!validazione.ok) {
    // ⚠️ Si scarta il messaggio del pagamento e si dice la frase di §14: quei
    // testi nominano campi e regole del modulo d'ordine, non del campo del
    // codice. Il verdetto è lo stesso, la parola no.
    return NextResponse.json(
      { outcome: "dati_incompleti", message: FRASE_DATI_INCOMPLETI },
      { status: 200 }
    );
  }

  // Lo store serve a `resolveCombo`, che filtra `combo_pricing` per store: senza
  // di esso ogni carrello con un menu combo risulterebbe non risolvibile, e lo
  // sconto verrebbe negato a chi non ha sbagliato niente. Del suo esito si usa
  // solo lo store — la risposta d'errore che quella funzione confeziona parla
  // con le parole del pagamento, e qui non deve arrivare al cliente.
  const { store } = await getActiveStore();
  if (!store) {
    return NextResponse.json({ outcome: READ_FAILURE, message: FRASE_GUASTO }, { status: 500 });
  }

  // 3) Il cuore, con i lettori veri.
  const esito = await checkDiscountEligibility({
    code: body?.code,
    items: body?.items,
    phone: body?.customer?.phone,
    storeId: store.id,
    resolveProduct,
    resolveCombo,
    findCustomerRedemption,
    readError: READ_ERROR,
  });

  // 4) La traduzione. Un esito per volta, nessun ramo che ne copra due.
  switch (esito.outcome) {
    case ELIGIBLE:
      // L'unico caso in cui non c'è una frase: il checkout mostra la riga dello
      // sconto nel riepilogo (§14). L'importo viene dal cuore, che a sua volta
      // lo prende da `lib/givemefive.js`: non è riscritto qui.
      return NextResponse.json(
        { outcome: ELIGIBLE, applied: true, discount: esito.discount, message: null },
        { status: 200 }
      );

    case BELOW_THRESHOLD:
      return NextResponse.json(
        {
          outcome: BELOW_THRESHOLD,
          applied: false,
          missing: esito.missing,
          message: fraseSottoSoglia(esito.missing),
        },
        { status: 200 }
      );

    case UNKNOWN_CODE:
      return NextResponse.json(
        { outcome: UNKNOWN_CODE, applied: false, message: FRASE_CODICE_NON_VALIDO },
        { status: 200 }
      );

    case ALREADY_REDEEMED:
      return NextResponse.json(
        { outcome: ALREADY_REDEEMED, applied: false, message: FRASE_GIA_UTILIZZATO },
        { status: 200 }
      );

    case UNRESOLVABLE_LINE:
      return NextResponse.json(
        { outcome: UNRESOLVABLE_LINE, applied: false, message: FRASE_ARTICOLO_NON_DISPONIBILE },
        { status: 200 }
      );

    case READ_FAILURE:
      // §46b: un guasto nostro è un 500, non una risposta al cliente travestita
      // da normalità. Tutti gli altri esiti sono 200 perché sono risposte —
      // "questo codice non è valido" non è un errore della richiesta.
      return NextResponse.json({ outcome: READ_FAILURE, message: FRASE_GUASTO }, { status: 500 });

    default:
      // Un esito che non conosciamo è un guasto nostro, e si sbaglia dalla parte
      // di chi dice "riprova": mai concedere uno sconto su una risposta che
      // questo file non ha capito.
      console.error("[POST /api/checkout/discount] Esito non riconosciuto:", esito?.outcome);
      return NextResponse.json({ outcome: READ_FAILURE, message: FRASE_GUASTO }, { status: 500 });
  }
}
