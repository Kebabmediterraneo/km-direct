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

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const DELIVERY_FEE = 2.5;
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

  const { data: customerRow, error: customerError } = await supabaseAdmin
    .from("customers")
    .upsert(
      {
        phone,
        first_name: customer.firstName.trim(),
        last_name: customer.lastName.trim(),
        email: customer.email?.trim() || null,
        marketing_opt_in: !!marketingOptIn,
        marketing_opt_in_at: marketingOptIn ? nowIso : null,
        marketing_text_version: marketingOptIn ? MARKETING_TEXT_VERSION : null,
        privacy_accepted_at: nowIso,
      },
      { onConflict: "phone" }
    )
    .select()
    .single();

  if (customerError || !customerRow) {
    console.error("[POST /api/checkout] Errore nella gestione del cliente:", customerError);
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
  const { discountAmount, couponCode, total } = await resolveDiscountAndTotal({
    db: supabaseAdmin,
    giveMeFiveRequested,
    subtotal,
    customerId: customerRow.id,
    deliveryFee,
  });

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
    coupon_code: couponCode,
    payment_status: "pending",
    age_declared_18: !!ageConfirmed,
    privacy_accepted_at: nowIso,
  };

  let order;
  try {
    order = await insertOrderWithPickupCode(orderPayload);
  } catch (err) {
    console.error("[POST /api/checkout] Errore nella creazione dell'ordine:", err);
    return NextResponse.json({ error: SYSTEM_ERROR_MESSAGE }, { status: 500 });
  }

  const orderItemsPayload = resolvedItems.map((item) => ({ ...item, order_id: order.id }));
  const { error: itemsError } = await supabaseAdmin.from("order_items").insert(orderItemsPayload);

  if (itemsError) {
    console.error("[POST /api/checkout] Errore nel salvataggio degli articoli:", itemsError);
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
