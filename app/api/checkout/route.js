import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "../../../lib/supabase-admin";
import { getActiveStore } from "../../../lib/get-active-store";
import { getStoreGeofencePolygon } from "../../../lib/get-store-geofence";
import { isPointInPolygon } from "../../../lib/geo";
import {
  validateCheckoutRequest,
  validateResolvedOrder,
} from "../../../lib/checkout-validation";
import { verifyOrderTiming } from "../../../lib/checkout-timing";
// ⚠️ READ_ERROR va importato, mai ricreato: è un Symbol, e due `Symbol()`
// distinti non sono mai uguali, quindi una copia locale renderebbe il confronto
// **sempre falso**. La conseguenza è stata verificata eseguendola (§46 v46,
// punto 2) e non è quella che verrebbe da immaginare — né la stessa nei due
// punti che confrontano la sentinella:
//  - QUI, nei resolver, il ramo successivo è `if (!resolved)`. Un Symbol è
//    **veritiero**, quindi quel ramo NON scatta: la sentinella estranea
//    prosegue **come se fosse una riga valida**, il prezzo diventa `NaN`, e
//    `NaN` attraversa il totale scavalcando in silenzio **l'ordine minimo e il
//    controllo dei 18 anni** (ogni confronto con `NaN` è falso). L'ordine si
//    schianta solo all'inserimento, contro il `not null` su `subtotal` e
//    `total` — dopo che la riga cliente è già stata scritta.
//  - Nel guard degli orari (`lib/checkout-timing.js`) il ramo è `if (!timing.ok)`:
//    un Symbol non ha `.ok`, quindi il ramo scatta e solleva un'eccezione non
//    gestita, cioè un 500 generico di Next al posto del nostro messaggio.
// ⚠️ Corollario: la sentinella deve restare **veritiera**. Chi la
// "semplificasse" in `null`, `false` o "" farebbe crollare la distinzione fra
// guasto nostro e riga rifiutata senza toccare una riga dei confronti.
// *Fino alla v46 questo commento diceva che il guasto sarebbe degradato in
// "articolo non disponibile" con 400: era falso, e nel modo peggiore — dava per
// pulita una conseguenza che invece corrompe gli importi.*
import { READ_ERROR, resolveProduct, resolveCombo } from "../../../lib/checkout-resolve";
// §46 (v44/v45): il confronto fra prezzo mostrato e prezzo reale vive in un
// modulo puro, raggiungibile da un test senza passare da Next. Si importano
// anche le costanti degli esiti, così che le stringhe del verdetto non vengano
// riscritte a mano qui: il modulo decide, la route traduce in risposta HTTP
// (§46 v46, "Forma dell'estrazione", punto 1 — nessun modulo confeziona la
// risposta, nessuna route ripete la logica).
import { OK, CHANGED, checkAllLines } from "../../../lib/price-guard";
// §14/§62 (08/08/2026): lo sconto e il calcolo del totale vivono in un modulo
// raggiungibile da una prova, con lo stesso criterio del price-guard qui sopra.
// Le tre costanti di GIVEMEFIVE — codice, soglia, importo — non stanno né qui
// né lì: dal 09/08/2026 vivono in `lib/givemefive.js`, un modulo di sole
// costanti che anche il browser può importare, e `checkout-discount` le
// ri-esporta per chi le prendeva da lui. Erano riscritte a mano in quattro
// file, e nessuna prova poteva confrontarle.
// ⚠️ `round2` arriva dallo stesso modulo per la stessa ragione: è l'unica
// definizione dell'arrotondamento nel percorso del pagamento, e due copie di un
// arrotondamento divergono senza che nulla lo segnali.
import { resolveDiscountAndTotal, round2 } from "../../../lib/checkout-discount";
// SPEC CODICI SCONTO (A1, A3) — il cuore dei codici nuovi. Riceve `db` come
// parametro, come tutti gli altri cuori di questo progetto.
import {
  COUPON_RESERVED,
  COUPON_UNKNOWN,
  COUPON_INACTIVE,
  COUPON_BELOW_THRESHOLD,
  COUPON_TAKEN,
  COUPON_BURNED,
  COUPON_RULE_INVALID,
  COUPON_READ_FAILURE,
  leggiRegolaCodice,
  calcolaScontoDaRegola,
  prenotaCodice,
  attaccaOrdineAllaPrenotazione,
} from "../../../lib/coupon-reservation";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const DELIVERY_FEE = 2.5;

// SPEC CODICI SCONTO (A3/A5) — quanto dura una prenotazione. È un tempo NOSTRO e
// non quello della sessione di Stripe: quando la riga viene scritta la sessione
// non esiste ancora. Ventisei ore, cioè più delle ventiquattro predefinite di
// Stripe, così chi paga dentro la propria sessione trova sempre il codice suo.
// ⚠️ Passata la finestra nessuno "libera" niente: è il prossimo che scrive a
// sovrascrivere una prenotazione scaduta.
const RESERVATION_WINDOW_MS = 26 * 60 * 60 * 1000;
const MARKETING_TEXT_VERSION = "v1";

// §v19: messaggio unico per gli errori TECNICI di sistema mostrati al cliente
// (accorpati). I log tecnici restano distinti lato server (console.error) per
// il debug: cambia solo il testo restituito al client, non la tracciabilità.
const SYSTEM_ERROR_MESSAGE =
  "Qualcosa è andato storto durante l'ordine. Riprova tra poco; se hai già pagato, non ti verrà addebitato nulla.";

// §46 v44 punto 4 — il listino si è mosso mentre il cliente guardava. Testo
// definitivo in §46b, elenco dei messaggi. I testi stanno qui e non nel modulo
// per la stessa ragione di `SYSTEM_ERROR_MESSAGE` (§46 v46, punto 3): il modulo
// dice cosa è successo, la route possiede la parola rivolta al cliente.
const PRICE_CHANGED_MESSAGE = "Abbiamo aggiornato il listino, controlla il tuo carrello";

// §46 v44 punto 6, testo fissato dalla v47. Non accusa il cliente: a questo
// messaggio ci si arriva solo se il sito si è rotto o se la richiesta è stata
// costruita a mano, quindi è un problema nostro e indica l'unica cosa che chi
// legge può fare.
const PRICE_MALFORMED_MESSAGE = "Si è verificato un problema. Ricarica la pagina e riprova.";

// ⚠️ (A6) — quando la verifica di uno sconto si guasta, il pagamento SI FERMA.
// Non si concede (regalerebbe il 20% a ogni rallentamento) e soprattutto non si
// prosegue senza (chi ha visto "−5,00 €" nel riepilogo pagherebbe di più senza
// saperlo, che è il danno peggiore dei due).
//
// ⚠️ QUESTA FRASE È UNA SECONDA COPIA, DICHIARATA. L'originale è `FRASE_GUASTO`
// in `app/api/checkout/discount/route.js`: una rotta non importa da un'altra
// rotta senza tirarsi dietro tutto il suo modulo, e questo file è il percorso di
// pagamento, che non si riapre per spostare una costante (§46 v46). È la stessa
// situazione dei due messaggi del listino, e si tratta allo stesso modo: due
// copie **più una prova che fallisce se divergono di un carattere**
// (`tests/checkout-messages.test.mjs`).
const DISCOUNT_UNVERIFIABLE_MESSAGE =
  "Non siamo riusciti a verificare il codice. Riprova fra qualche istante.";

// ✅ TESTO APPROVATO DA ANDREA (06/09/2026). Serve per i due casi che §14 non
// aveva previsti, perché nascono solo con i codici che valgono una volta AL
// MONDO: il codice è già stato usato, oppure qualcun altro lo sta usando proprio
// adesso. Le sei frasi del campo non ne coprono nessuno dei due — "questo codice
// non è valido" sarebbe falso, il codice è validissimo.
//
// ⚠️ UNA FRASE SOLA PER DUE CASI, ed è voluto: dire "qualcun altro lo sta
// usando" sarebbe più preciso e più inquietante, e non aiuterebbe chi legge.
// ⚠️ E non dà un ordine, lascia la scelta. La prima stesura diceva "torna al
// carrello e riprova senza": un'istruzione che il cliente potrebbe non voler
// seguire, perché magari ha solo sbagliato a digitare.
//
// ⚠️ SECONDA COPIA, DICHIARATA. L'originale è `FRASE_CODICE_NON_PIU_DISPONIBILE`
// in `app/api/checkout/discount/route.js`: una rotta non importa da un'altra
// rotta senza tirarsi dietro tutto il suo modulo, e questo file è il percorso di
// pagamento, che non si riapre per spostare una costante (§46 v46). Due copie
// **più una prova che fallisce se divergono di un carattere**
// (`tests/checkout-messages.test.mjs`).
const COUPON_GONE_MESSAGE =
  "Questo codice sconto non è più disponibile. Puoi completare l'ordine senza, oppure controllare il codice.";

// §58: pickup_code progressivo (KM-0001, KM-0002, ...), mai casuale. Riprova
// con un numero più alto in caso di collisione (race condition tra ordini
// concorrenti sullo stesso conteggio).
async function insertOrderWithPickupCode(orderPayload) {
  const { count } = await supabaseAdmin
    .from("orders")
    .select("id", { count: "exact", head: true });

  const baseNumber = (count ?? 0) + 1;

  for (let attempt = 0; attempt < 5; attempt++) {
    const pickupCode = `KM-${String(baseNumber + attempt).padStart(4, "0")}`;
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .insert({ ...orderPayload, pickup_code: pickupCode })
      .select()
      .single();

    if (!error) return order;
    if (error.code !== "23505") throw error;
  }

  throw new Error("Impossibile generare un codice ritiro univoco.");
}

export async function POST(request) {
  const body = await request.json();
  const {
    items,
    fulfillment,
    delivery,
    customer,
    marketingOptIn,
    ageConfirmed,
    giveMeFiveRequested,
    // SPEC CODICI SCONTO (A2) — il cliente manda IL CODICE, mai l'importo. Qui
    // entra una stringa e nient'altro: nessun numero del browser viene letto.
    couponCode,
  } = body ?? {};

  // §46b/§41-45: validazioni di forma — carrello, modalità, contatti, privacy,
  // indirizzo, coordinate, e l'orario concordato calcolato qui da giorno+ora e
  // mai preso pronto dal client (§12/§12b/§46). Stesse condizioni, stesso
  // ordine e stessi messaggi di prima: sono state spostate in
  // `lib/checkout-validation.js` perché un test possa raggiungerle davvero
  // (§46, lavoro 1: questo file non è importabile fuori da Next), non per
  // cambiarle. Qui resta soltanto la risposta HTTP.
  const validation = validateCheckoutRequest(body);
  if (!validation.ok) {
    return NextResponse.json(validation.body, { status: validation.status });
  }

  // I quattro valori derivati arrivano dal modulo e non si ricalcolano qui:
  // una seconda derivazione è esattamente la doppia implementazione che §46b
  // vieta, nel punto in cui deciderebbe zona, orario e indirizzo salvato.
  const { isDelivery, deliveryLatitude, deliveryLongitude, scheduledDeliveryAt } = validation;

  const { store, errorResponse } = await getActiveStore();
  if (errorResponse) return errorResponse;

  // §10/§41-45: l'indirizzo è verificato lato client (autocomplete +
  // point-in-polygon) e mostrato in sola lettura al checkout, ma un client
  // malevolo potrebbe comunque chiamare questa route direttamente con
  // coordinate manomesse — qui lo store lo impedisce, non solo la UI.
  if (isDelivery) {
    const polygon = await getStoreGeofencePolygon(store.id);
    if (!polygon || !isPointInPolygon([deliveryLongitude, deliveryLatitude], polygon)) {
      return NextResponse.json(
        { error: "Questo indirizzo è fuori dalla nostra zona di consegna." },
        { status: 400 }
      );
    }
  }

  // §68.4/§46b: il blocco del checkout durante una chiusura (orari base §7/§13
  // o eccezione §68) vive lato client — un client malevolo o una pagina stantia
  // potrebbe comunque POSTare un ordine in un turno chiuso. Qui lo riverifichiamo
  // server-side con le stesse funzioni pure di /api/service-status (unica fonte
  // di verità) e rifiutiamo l'ordine se il timing richiesto non è disponibile.
  // Vale per entrambe le modalità: Delivery (ASAP/programmata) e Ritiro (§12b).
  //
  // Le due letture e i tre rami stanno in `lib/checkout-timing.js`; qui resta
  // la traduzione in risposta HTTP. Il 500 lo confeziona la route perché il
  // testo di §v19 è suo e serve ad altre cinque uscite (§46b, "un guasto di
  // lettura non è un rifiuto").
  const timing = await verifyOrderTiming({
    storeId: store.id,
    isDelivery,
    timingType: delivery?.timingType,
    scheduledDeliveryAt,
  });
  if (timing === READ_ERROR) {
    return NextResponse.json({ error: SYSTEM_ERROR_MESSAGE }, { status: 500 });
  }
  if (!timing.ok) {
    return NextResponse.json(timing.body, { status: timing.status });
  }

  // §46, non negoziabile: ogni prezzo viene ricalcolato qui, ignorando
  // qualsiasi prezzo arrivato dal client.
  let subtotal = 0;
  let hasBeer = false;
  const resolvedItems = [];
  // §46 v44 punto 1: i prezzi unitari MOSTRATI, nell'ordine delle righe. Vive
  // accanto a `resolvedItems` perché i due elenchi si riempiono nella stessa
  // iterazione e restino paralleli **per costruzione**, non per disciplina.
  const shownUnitPrices = [];

  for (const item of items) {
    const quantity = Number.isInteger(item?.quantity) && item.quantity > 0 ? item.quantity : 1;
    const ref = item?.ref;

    if (!ref || (ref.kind !== "product" && ref.kind !== "combo")) {
      return NextResponse.json({ error: "Articolo non valido." }, { status: 400 });
    }
    if (ref.kind !== "combo" && !ref.id) {
      return NextResponse.json({ error: "Articolo non valido." }, { status: 400 });
    }
    if (ref.kind === "combo" && !ref.rollProductId) {
      return NextResponse.json({ error: "Articolo non valido." }, { status: 400 });
    }

    let resolved;
    if (ref.kind === "combo") {
      resolved = await resolveCombo(ref, store.id);
    } else {
      // §30: le salse sono prodotti nella tabella `products` e si risolvono
      // come qualunque altro articolo — lettura da products, prezzo da
      // base_price, controllo is_available, e category ('salse') + product_id
      // ricavati dal DB, non scritti a mano.
      resolved = await resolveProduct(ref);
    }

    // §46b: un guasto nella lettura delle etichette ammesse è un errore
    // interno, non un rifiuto della riga — va distinto PRIMA del caso `null`.
    if (resolved === READ_ERROR) {
      return NextResponse.json({ error: SYSTEM_ERROR_MESSAGE }, { status: 500 });
    }

    if (!resolved) {
      return NextResponse.json(
        { error: "Un articolo del carrello non è più disponibile." },
        { status: 400 }
      );
    }

    if (resolved.category === "birre") hasBeer = true;

    const lineTotal = round2(resolved.unitPrice * quantity);
    subtotal += lineTotal;

    // §46 v44 punto 1: il prezzo mostrato viaggia **dentro la riga**, accanto a
    // `ref` e `quantity`, e si raccoglie solo per le righe risolte con successo
    // — è precisamente la garanzia che §46 v45 punto 4 chiede a chi chiama. Un
    // campo assente entra qui come `undefined` e il modulo lo dichiara
    // malformato: mai un confronto saltato (punto 6).
    shownUnitPrices.push(item?.unitPriceShown);

    resolvedItems.push({
      product_id: resolved.productId,
      product_name_snapshot: resolved.name,
      category_snapshot: resolved.category,
      quantity,
      unit_price_snapshot: resolved.unitPrice,
      line_total: lineTotal,
      is_combo: ref.kind === "combo",
      configuration: resolved.configuration,
    });
  }

  // §46 v44: confronto fra il prezzo MOSTRATO al cliente e quello REALE appena
  // ricalcolato. Sta qui — subito dopo il ciclo — per due ragioni: il prezzo
  // reale di ogni riga esiste già, e si è ancora prima di **qualunque**
  // scrittura, compresa la riga cliente (punto 7 e §65: un tentativo fermato
  // non deve lasciare residui da ripulire).
  //
  // ⚠️ Il prezzo ricevuto serve SOLO al confronto (punto 2). Non entra in
  // `subtotal`, che nasce da `resolved.unitPrice`, cioè dai dati vivi. Non è
  // una regola da ricordare: `price-guard` non restituisce importi, quindi a
  // valle non esiste nulla del browser da addebitare per sbaglio.
  //
  // I due elenchi hanno la stessa lunghezza per costruzione e `items` non può
  // essere vuoto (rifiutato da `validateCheckoutRequest`): i due controlli di
  // lunghezza del modulo non possono scattare da questo chiamante, e restano
  // suoi perché valgono per chi lo riuserà altrove (§46 v45 punto 5).
  const priceVerdict = checkAllLines(
    shownUnitPrices,
    resolvedItems.map((line) => line.unit_price_snapshot)
  );

  // §46 v44 punti 4 e 5 / §46b: richiesta ben formata ma non accettabile nello
  // stato attuale del listino, in **entrambe** le direzioni — anche un prezzo
  // sceso ferma il checkout. Il carrello non viene svuotato (§9, §46b).
  if (priceVerdict === CHANGED) {
    return NextResponse.json({ error: PRICE_CHANGED_MESSAGE }, { status: 409 });
  }

  // §46 v44 punto 6 (testo dalla v47): il prezzo mostrato non è arrivato o non
  // è utilizzabile. Qui finisce **qualunque** esito diverso da `ok`, non solo
  // `malformato`: gli esiti sono tre e un quarto non esiste (§46 v45 punto 1),
  // ma fra bloccare per un verdetto che non conosciamo e lasciar passare, si
  // sbaglia dalla parte che non addebita.
  if (priceVerdict !== OK) {
    return NextResponse.json({ error: PRICE_MALFORMED_MESSAGE }, { status: 400 });
  }

  subtotal = round2(subtotal);

  // §9/§33: ordine minimo Delivery (la fee non concorre) e conferma dei 18
  // anni se il carrello contiene birre. Si possono giudicare solo qui, sul
  // subtotale appena ricalcolato e su `hasBeer`, che nasce dalla categoria
  // letta dal database e mai da ciò che dichiara il client.
  const orderCheck = validateResolvedOrder({ isDelivery, subtotal, hasBeer, ageConfirmed });
  if (!orderCheck.ok) {
    return NextResponse.json(orderCheck.body, { status: orderCheck.status });
  }

  const phone = customer.phone.trim();
  const nowIso = new Date().toISOString();

  // ⚠️ LAVORO 2 DEL PUNTO 16 — L'UPSERT NON AZZERA PIÙ LA PROVA DI UN CONSENSO
  // PASSATO (04/09/2026).
  //
  // Fino a oggi queste due colonne venivano riscritte a `null` ogni volta che un
  // cliente riordinava SENZA spuntare il marketing. Il consenso corrente
  // diventava `false`, ed è giusto; ma spariva anche la **prova** di quello di
  // prima — la data e la versione del testo che aveva letto. L'art. 7 GDPR
  // impone di poter dimostrare un consenso prestato, e l'informativa al punto
  // 11.4 lo dichiara: cancellarne la traccia toglieva la possibilità di farlo.
  //
  // La correzione è quella minima già decisa in spec: quando il nuovo valore è
  // `false`, quelle due colonne **non si mandano affatto**. Un `upsert` scrive
  // solo le colonne che riceve, quindi non toccarle significa lasciarle come
  // stanno. Il consenso corrente resta l'ultimo, la traccia del precedente
  // sopravvive.
  //
  // ⚠️ Non è uno storico e non vuole esserlo: resta la prova dell'ULTIMO
  // consenso dato, non di tutti. Chi un domani volesse la sequenza completa
  // deve costruirla, non aspettarsela da qui.
  const provaDelConsensoMarketing = marketingOptIn
    ? { marketing_opt_in_at: nowIso, marketing_text_version: MARKETING_TEXT_VERSION }
    : {};

  const { data: customerRow, error: customerError } = await supabaseAdmin
    .from("customers")
    .upsert(
      {
        phone,
        first_name: customer.firstName.trim(),
        last_name: customer.lastName.trim(),
        email: customer.email?.trim() || null,
        marketing_opt_in: !!marketingOptIn,
        // ⚠️ LAVORO 2 del punto 16 — le due colonne della PROVA non si scrivono
        // affatto quando il consenso non c'è: vedi il blocco qui sopra.
        ...provaDelConsensoMarketing,
        privacy_accepted_at: nowIso,
      },
      { onConflict: "phone" }
    )
    .select()
    .single();

  if (customerError || !customerRow) {
    // ⚠️ LAVORO 3 del punto 16 — si registrano i soli campi utili a capire che
    // cosa sia andato storto. Prima si passava l'oggetto intero, e dentro un
    // errore di Supabase il campo `details` può riportare il contenuto della
    // riga che si stava scrivendo: qui dentro ci sono nome, cognome, telefono ed
    // email di una persona vera. Il modello è quello già scritto più sotto per
    // Stripe, e si copia invece di inventarne un altro.
    console.error("[POST /api/checkout] Errore nella gestione del cliente:", {
      code: customerError?.code,
      message: customerError?.message,
    });
    return NextResponse.json({ error: SYSTEM_ERROR_MESSAGE }, { status: 500 });
  }

  // §14/§62: GIVEMEFIVE consumata solo dopo pagamento confermato (Fase B) —
  // qui si verifica solo l'eleggibilità, senza inserire promo_redemptions.
  // Il come sta in `lib/checkout-discount.js`; qui resta la sola chiamata.
  //
  // ⚠️ `subtotal` è quello RICALCOLATO poche righe sopra dai dati vivi, mai
  // quello arrivato dal browser: è la condizione che rende sensato il controllo
  // della soglia, e va tenuta d'occhio se un giorno queste righe si spostano.
  const deliveryFee = isDelivery ? DELIVERY_FEE : 0;
  const codiceChiesto = typeof couponCode === "string" ? couponCode.trim() : "";

  // ⚠️ (R1) UN SOLO CODICE PER ORDINE. Non si cumulano, né fra loro né col
  // codice storico: due sconti sullo stesso ordine sono un totale che nessuno sa
  // più ricostruire. Il vincolo vero è la colonna `orders.coupon_code`, che ne
  // tiene UNO; qui si rifiuta prima di arrivarci.
  // Il testo è quello di §46 v44 punto 6 e non è nuovo: a questo caso non ci si
  // arriva usando il sito, ci si arriva solo se il sito si è rotto o se la
  // richiesta è stata costruita a mano.
  if (giveMeFiveRequested && codiceChiesto !== "") {
    return NextResponse.json({ error: PRICE_MALFORMED_MESSAGE }, { status: 400 });
  }

  let discountAmount = 0;
  let couponCodeApplicato = null;
  let total;
  // Resta valorizzato solo se una prenotazione è andata a buon fine: serve dopo
  // la creazione dell'ordine, per attaccarle l'ordine.
  let codicePrenotato = null;

  if (codiceChiesto !== "") {
    // ── I CODICI NUOVI ────────────────────────────────────────────────────────
    // (A1) la regola si legge dalla tabella, mai dal codice sorgente.
    // ⚠️ (A2) di ciò che arriva dal browser entra qui SOLO la stringa del
    // codice. Il subtotale è quello ricalcolato poche righe sopra dai dati vivi.
    const lettura = await leggiRegolaCodice({ db: supabaseAdmin, code: codiceChiesto });

    if (lettura.outcome === COUPON_READ_FAILURE) {
      return NextResponse.json({ error: DISCOUNT_UNVERIFIABLE_MESSAGE }, { status: 500 });
    }
    if (lettura.outcome !== COUPON_RESERVED) {
      return NextResponse.json({ error: COUPON_GONE_MESSAGE }, { status: 400 });
    }

    const calcolo = calcolaScontoDaRegola({ regola: lettura.regola, subtotal });

    // Una regola scritta male in tabella è colpa nostra, non del cliente: si
    // ferma con la frase del guasto, non con quella del codice non disponibile.
    if (calcolo.outcome === COUPON_RULE_INVALID) {
      console.error("[POST /api/checkout] Regola di sconto non utilizzabile:", {
        code: lettura.code,
      });
      return NextResponse.json({ error: DISCOUNT_UNVERIFIABLE_MESSAGE }, { status: 500 });
    }
    if (calcolo.outcome === COUPON_INACTIVE || calcolo.outcome === COUPON_BELOW_THRESHOLD) {
      return NextResponse.json({ error: COUPON_GONE_MESSAGE }, { status: 400 });
    }

    // ⚠️⚠️ (A3) LA PRENOTAZIONE, PRIMA DI MANDARE IL CLIENTE A PAGARE.
    // Si scrive adesso, non dopo: guardare e scrivere sono un gesto solo, e se
    // due ordini partono insieme è il database a rifiutare il secondo.
    //
    // ⚠️ L'ordine non esiste ancora, e va bene così: quella colonna ammette il
    // vuoto proprio per questo, e l'ordine si attacca subito dopo averlo creato.
    // Prenotare PRIMA dell'ordine significa che un codice conteso non lascia in
    // giro un ordine con un totale scontato che nessuno onorerà.
    const adesso = new Date();
    const prenotazione = await prenotaCodice({
      db: supabaseAdmin,
      code: lettura.code,
      customerId: customerRow.id,
      // ⚠️ LA FINESTRA È UN TEMPO NOSTRO, non quello della sessione di Stripe
      // (decisione del 03/09/2026). La sessione non esiste ancora quando questa
      // riga viene scritta, quindi la sua scadenza non è conoscibile qui; e fra
      // due orologi che divergono e una finestra in cui un pagamento è aperto
      // mentre il codice non è prenotato, si è scelto il primo danno. È perciò
      // GENEROSA rispetto alle 24 ore predefinite di Stripe: chi paga entro la
      // sua sessione trova sempre il proprio codice ancora suo.
      reservedUntil: new Date(adesso.getTime() + RESERVATION_WINDOW_MS).toISOString(),
      now: adesso.toISOString(),
    });

    if (prenotazione.outcome === COUPON_READ_FAILURE) {
      return NextResponse.json({ error: DISCOUNT_UNVERIFIABLE_MESSAGE }, { status: 500 });
    }
    if (prenotazione.outcome === COUPON_TAKEN || prenotazione.outcome === COUPON_BURNED) {
      return NextResponse.json({ error: COUPON_GONE_MESSAGE }, { status: 400 });
    }
    if (prenotazione.outcome !== COUPON_RESERVED) {
      return NextResponse.json({ error: DISCOUNT_UNVERIFIABLE_MESSAGE }, { status: 500 });
    }

    discountAmount = calcolo.discount;
    couponCodeApplicato = lettura.code;
    codicePrenotato = lettura.code;
    total = round2(subtotal - discountAmount + deliveryFee);
  } else {
    // ── IL CODICE STORICO, INTATTO ───────────────────────────────────────────
    // Nessuna riga di questo ramo è cambiata, tranne la lettura dell'esito nuovo
    // qui sotto: quel percorso resta quello di sempre.
    const esitoSconto = await resolveDiscountAndTotal({
      db: supabaseAdmin,
      giveMeFiveRequested,
      subtotal,
      customerId: customerRow.id,
      deliveryFee,
    });

    // ⚠️ (A6) IL GUASTO FERMA IL PAGAMENTO. Non concede — regalerebbe lo sconto a
    // ogni rallentamento — e non prosegue senza, perché chi ha visto la riga
    // dello sconto nel riepilogo pagherebbe di più senza saperlo.
    if (esitoSconto.readFailure) {
      return NextResponse.json({ error: DISCOUNT_UNVERIFIABLE_MESSAGE }, { status: 500 });
    }

    discountAmount = esitoSconto.discountAmount;
    couponCodeApplicato = esitoSconto.couponCode;
    total = esitoSconto.total;
  }

  const orderPayload = {
    store_id: store.id,
    customer_id: customerRow.id,
    fulfillment,
    // §12b: il Ritiro è sempre programmato (mai ASAP) → delivery_timing="scheduled".
    delivery_timing: isDelivery ? delivery?.timingType ?? "asap" : "scheduled",
    scheduled_delivery_at: scheduledDeliveryAt ? scheduledDeliveryAt.toISOString() : null,
    delivery_address: isDelivery ? delivery.address.trim() : null,
    delivery_civico: isDelivery ? delivery.houseNumber.trim() : null,
    delivery_citofono: isDelivery ? delivery?.intercom?.trim() || null : null,
    delivery_piano_interno: isDelivery ? delivery?.floorInterior?.trim() || null : null,
    delivery_edificio_scala: isDelivery ? delivery?.buildingStaircase?.trim() || null : null,
    delivery_note_rider: isDelivery ? delivery?.riderNotes?.trim() || null : null,
    delivery_latitude: deliveryLatitude,
    delivery_longitude: deliveryLongitude,
    status: "nuovo",
    delivery_status: isDelivery ? "da_richiedere" : null,
    subtotal,
    delivery_fee: deliveryFee,
    discount_amount: discountAmount,
    total,
    coupon_code: couponCodeApplicato,
    payment_status: "pending",
    age_declared_18: !!ageConfirmed,
    privacy_accepted_at: nowIso,
  };

  let order;
  try {
    order = await insertOrderWithPickupCode(orderPayload);
  } catch (err) {
    // ⚠️ LAVORO 3 del punto 16 — solo i campi utili, non l'errore intero.
    console.error("[POST /api/checkout] Errore nella creazione dell'ordine:", {
      code: err?.code,
      message: err?.message,
    });
    return NextResponse.json({ error: SYSTEM_ERROR_MESSAGE }, { status: 500 });
  }

  // ⚠️ L'ORDINE SI ATTACCA ALLA PRENOTAZIONE, e non è un secondo cancello.
  // La prenotazione è già stata vinta o persa poche righe sopra: qui si scrive
  // soltanto a quale ordine appartiene, perché l'annullamento dal pannello possa
  // ritrovarla. Se questa scrittura fallisce non si ferma niente: il codice
  // resta prenotato da questo cliente e la finestra scade da sola. Mescolarla al
  // gesto della prenotazione l'avrebbe resa annullabile da un errore che non
  // c'entra.
  if (codicePrenotato) {
    await attaccaOrdineAllaPrenotazione({
      db: supabaseAdmin,
      code: codicePrenotato,
      customerId: customerRow.id,
      orderId: order.id,
    });
  }

  const orderItemsPayload = resolvedItems.map((item) => ({ ...item, order_id: order.id }));
  const { error: itemsError } = await supabaseAdmin.from("order_items").insert(orderItemsPayload);

  if (itemsError) {
    // ⚠️ LAVORO 3 del punto 16 — solo i campi utili, non l'errore intero.
    console.error("[POST /api/checkout] Errore nel salvataggio degli articoli:", {
      code: itemsError?.code,
      message: itemsError?.message,
    });
    return NextResponse.json({ error: SYSTEM_ERROR_MESSAGE }, { status: 500 });
  }

  const origin = new URL(request.url).origin;

  let session;
  try {
    session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "eur",
              product_data: { name: `Ordine KM Direct #${order.pickup_code}` },
              unit_amount: Math.round(total * 100),
            },
            quantity: 1,
          },
        ],
        metadata: { order_id: order.id },
        success_url: `${origin}/conferma?order_token=${order.order_token}`,
        cancel_url: `${origin}/`,
      },
      { idempotencyKey: order.id }
    );
  } catch (err) {
    console.error("[POST /api/checkout] Errore nella creazione della Stripe Checkout Session:", {
      type: err.type,
      code: err.code,
      message: err.message,
    });
    return NextResponse.json({ error: SYSTEM_ERROR_MESSAGE }, { status: 500 });
  }

  await supabaseAdmin
    .from("orders")
    .update({ stripe_checkout_session_id: session.id })
    .eq("id", order.id);

  return NextResponse.json({ url: session.url });
}
