import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "../../../lib/supabase-admin";
import { getActiveStore } from "../../../lib/get-active-store";
import { getStoreGeofencePolygon } from "../../../lib/get-store-geofence";
import { isPointInPolygon } from "../../../lib/geo";
import { validateRemovals } from "../../../lib/menu-removals";
import { productLinePrice, comboLinePrice } from "../../../lib/menu-pricing";
import { computeScheduledDeliveryAt, getScheduledSlots } from "../../../lib/scheduled-slots";
import {
  todayRomeDate,
  computeExceptionEffects,
  classifyScheduledSlot,
} from "../../../lib/schedule-exceptions";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const DELIVERY_FEE = 2.5;
const DELIVERY_MINIMUM_ORDER = 15;
const GIVEMEFIVE_THRESHOLD = 25;
const GIVEMEFIVE_DISCOUNT = 5;
const GIVEMEFIVE_CODE = "GIVEMEFIVE";
const MARKETING_TEXT_VERSION = "v1";

// §v19: messaggio unico per gli errori TECNICI di sistema mostrati al cliente
// (accorpati). I log tecnici restano distinti lato server (console.error) per
// il debug: cambia solo il testo restituito al client, non la tracciabilità.
const SYSTEM_ERROR_MESSAGE =
  "Qualcosa è andato storto durante l'ordine. Riprova tra poco; se hai già pagato, non ti verrà addebitato nulla.";

function round2(value) {
  return Math.round(value * 100) / 100;
}

// §18/§46/§46b: sentinella per distinguere un PROBLEMA NOSTRO dal rifiuto della
// riga. `null` significa "questa riga non è accettabile" e produce un 400; un
// problema dei nostri dati — un errore nel leggere `product_removals`/
// `product_addons`, un addon ambiguo (più righe valide per la stessa
// configurazione), o un prezzo che il modulo non riesce a calcolare — non è
// "non disponibile" ed è colpa nostra, quindi produce il 500 di §46b, come già
// fanno le letture di store_order_windows e store_schedule_exceptions. Un solo
// tipo di esito per tutti questi casi (§46b, "riusa la struttura").
const READ_ERROR = Symbol("read-error");

// §18: assente, null o elenco vuoto = niente da controllare. È il caso normale
// della gran parte degli ordini e non deve costare una query. Qualunque altro
// valore passa dal modulo — comprese le forme sbagliate (una stringa, un
// oggetto), che vanno rifiutate e non ignorate in silenzio.
function needsRemovalCheck(requested) {
  if (requested === null || requested === undefined) return false;
  return !(Array.isArray(requested) && requested.length === 0);
}

// §18/§46b: le rimozioni non spostano il prezzo, quindi finora non le
// controllava nulla — il controllo su proteina, accompagnamento, contorno e
// bibita è nato come effetto del ricalcolo prezzo, e dove il ricalcolo non
// serviva non c'era. Ma quello che il client manda finisce in
// `order_items.configuration` e da lì sotto gli occhi di chi prepara, in
// evidenza forte (§56): va verificato come tutto il resto.
//
// Le etichette ammesse sono quelle di QUEL prodotto (`product_removals` lega
// ogni riga a un `product_id`, §18): tutte le etichette del menu sono condivise
// fra prodotti diversi — a partire dalla coppia Roll/Bowl, che resta fatta di
// due dati distinti (§16) — quindi una lista globale accetterebbe "Senza feta"
// su "Il Turco". Il verdetto lo dà `lib/menu-removals.js`, funzione pura e
// testata in `tests/menu-removals.test.mjs`.
async function resolveRemovals(productId, requested) {
  if (!needsRemovalCheck(requested)) return { removals: [] };

  const { data, error } = await supabaseAdmin
    .from("product_removals")
    .select("label")
    .eq("product_id", productId);

  if (error) {
    console.error("[POST /api/checkout] Errore lettura product_removals:", error);
    return READ_ERROR;
  }

  const verdict = validateRemovals((data ?? []).map((row) => row.label), requested);
  if (!verdict.ok) return null;
  return { removals: verdict.removals };
}

// §46b: rifiuto 409 di uno slot programmato (Delivery o Ritiro) in base al
// verdetto di classifyScheduledSlot. Stringhe §46b: "past" → orario non più
// disponibile; "closed" → fuori apertura o turno chiuso.
function scheduledRejection(verdict) {
  const error =
    verdict === "past"
      ? "L'orario che hai scelto non è più disponibile. Scegline un altro tra quelli proposti."
      : "In quell'orario siamo chiusi. Scegli un altro orario tra quelli proposti.";
  return NextResponse.json({ error }, { status: 409 });
}

// §46: ricalcola il prezzo di un prodotto (Roll/Bowl/Fritti/Sides/Dolci/
// Drink/Birre) interrogando Supabase — mai fidarsi del prezzo del client.
async function resolveProduct(ref) {
  const { data: product } = await supabaseAdmin
    .from("products")
    .select("*")
    .eq("id", ref.id)
    .eq("is_available", true)
    .single();

  if (!product) return null;

  const configuration = {};

  // Proteina: il choice_key (forma con underscore, es. "pollo_tacchino") serve
  // sia al prezzo sia alla lookup dell'extra carne (§22), quindi vive fuori dal
  // blocco. proteinKey resta null se non è stata scelta una proteina.
  let proteinSurcharge = null;
  let proteinKey = null;
  if (ref.proteinLabel) {
    const { data: choice } = await supabaseAdmin
      .from("product_choice_options")
      .select("*")
      .eq("product_id", ref.id)
      .eq("label", ref.proteinLabel)
      .maybeSingle();
    if (!choice) return null;
    proteinSurcharge = Number(choice.price_delta);
    proteinKey = choice.choice_key;
    configuration.choiceLabel = choice.choice_label;
    configuration.choice = choice.label;
  }

  // §18/§46b: rimozioni verificate contro le etichette di QUESTO prodotto.
  // Si salvano quelle ripulite dal modulo, mai il valore grezzo del client.
  const productRemovals = await resolveRemovals(ref.id, ref.removals);
  if (productRemovals === READ_ERROR) return READ_ERROR;
  if (!productRemovals) return null;
  if (productRemovals.removals.length > 0) {
    configuration.removals = productRemovals.removals;
  }

  // §21: accompagnamento obbligatorio e validato per i prodotti che lo
  // prevedono (Bowl), in parallelo alla validazione della proteina sopra. Se il
  // prodotto ha opzioni di accompagnamento, ref.accompanimentLabel deve essere
  // presente e corrispondere a una label reale, altrimenti l'ordine è rifiutato
  // (nessun default: la scelta è sempre esplicita). Se il prodotto non ne ha,
  // comportamento invariato.
  const { data: accompaniments } = await supabaseAdmin
    .from("product_accompaniments")
    .select("label")
    .eq("product_id", ref.id);
  if (accompaniments && accompaniments.length > 0) {
    const valid = accompaniments.some((a) => a.label === ref.accompanimentLabel);
    if (!valid) return null;
    configuration.accompaniment = ref.accompanimentLabel;
  } else if (ref.accompanimentLabel) {
    configuration.accompaniment = ref.accompanimentLabel;
  }

  // §22 (chiusura lato server): l'addon dell'extra carne valido è quello che si
  // applica alla proteina scelta — `requires_protein` uguale al choice_key —
  // oppure che vale sempre (`requires_protein` NULL). Niente più `.limit(1)`:
  // si contano le righe valide. Se `ref.extraMeat` arriva senza proteina,
  // proteinKey è null e restano valide solo le righe NULL: sulle Bowl reali, che
  // richiedono "Pollo e tacchino", non ce ne sono, quindi l'ordine è rifiutato —
  // mai un extra carne che passa senza proteina.
  let extraMeatPrice;
  let extraMeatApplied = false;
  if (ref.extraMeat) {
    const { data: addons, error } = await supabaseAdmin
      .from("product_addons")
      .select("price, requires_protein")
      .eq("product_id", ref.id);
    if (error) {
      console.error("[POST /api/checkout] Errore lettura product_addons:", error);
      return READ_ERROR;
    }
    const valid = (addons ?? []).filter(
      (a) => a.requires_protein === null || a.requires_protein === proteinKey
    );
    if (valid.length === 0) return null; // §22: extra carne non ammessa con questa proteina → 400
    if (valid.length > 1) return READ_ERROR; // addon ambiguo: dato nostro, non scelta del cliente → 500
    extraMeatPrice = Number(valid[0].price);
    extraMeatApplied = true;
    configuration.extraMeat = true;
  }

  // §46 (v37): unico calcolo del prezzo di riga. Le letture e le validazioni qui
  // sopra restano; cambia solo che a sommare è il modulo. Un rifiuto del modulo
  // (prezzo non numerico o negativo) nasce dai NOSTRI dati, non dalla richiesta:
  // è un 500, come READ_ERROR (§46b).
  const priceResult = productLinePrice({
    basePrice: Number(product.base_price),
    proteinSurcharge,
    extraMeatPrice,
    extraMeatApplied,
  });
  if (!priceResult.ok) return READ_ERROR;

  return {
    productId: product.id,
    name: product.name,
    category: product.category,
    unitPrice: priceResult.price,
    configuration,
  };
}

async function resolveCombo(ref, storeId) {
  // §22: l'extra carne non esiste nei combo. I combo contengono solo Roll, e
  // tutte le righe di `product_addons` sono su Bowl — quindi un combo con
  // extra carne non è un caso limite, è una configurazione che il menu non
  // prevede e che solo una richiesta costruita a mano potrebbe inviare. Va
  // rifiutata come ogni altra opzione che non corrisponde (return null → 400).
  // Se ref.extraMeat è assente o falso, comportamento identico a prima.
  if (ref.extraMeat) return null;

  const { data: roll } = await supabaseAdmin
    .from("products")
    .select("*")
    .eq("id", ref.rollProductId)
    .eq("is_available", true)
    .single();

  if (!roll) return null;

  const { data: pricing } = await supabaseAdmin
    .from("combo_pricing")
    .select("*")
    .eq("roll_product_id", ref.rollProductId)
    .eq("store_id", storeId)
    .eq("is_active", true)
    .maybeSingle();

  if (!pricing) return null;

  const configuration = { roll: roll.name };

  let proteinSurcharge = null;
  if (ref.proteinLabel) {
    const { data: choice } = await supabaseAdmin
      .from("product_choice_options")
      .select("*")
      .eq("product_id", ref.rollProductId)
      .eq("label", ref.proteinLabel)
      .maybeSingle();
    if (!choice) return null;
    proteinSurcharge = Number(choice.price_delta);
    configuration.protein = choice.label;
  }

  // §18/§46b: le rimozioni del combo sono quelle del Roll scelto (il combo non
  // è un prodotto e non ha righe proprie in `product_removals`), come già fa la
  // validazione della proteina qui sopra.
  const comboRemovals = await resolveRemovals(ref.rollProductId, ref.removals);
  if (comboRemovals === READ_ERROR) return READ_ERROR;
  if (!comboRemovals) return null;
  if (comboRemovals.removals.length > 0) {
    configuration.removals = comboRemovals.removals;
  }

  let sideSurcharge = null;
  if (ref.sideLabel) {
    const { data: side } = await supabaseAdmin
      .from("combo_side_options")
      .select("*")
      .eq("store_id", storeId)
      .eq("label", ref.sideLabel)
      .eq("is_available", true)
      .maybeSingle();
    if (!side) return null;
    sideSurcharge = Number(side.price_delta);
    configuration.side = side.label;
  }

  let drinkSurcharge = null;
  if (ref.drinkProductId) {
    const { data: drink } = await supabaseAdmin
      .from("combo_drink_options")
      .select("*, products(name)")
      .eq("store_id", storeId)
      .eq("drink_product_id", ref.drinkProductId)
      .eq("is_available", true)
      .maybeSingle();
    if (!drink) return null;
    drinkSurcharge = Number(drink.price_delta);
    configuration.drink = drink.products.name;
  }

  // §25/§46 (v37): unico calcolo, dal prezzo combo del Roll scelto e con i tre
  // supplementi sommati qualunque sia il segno. Rifiuto del modulo → 500 (§46b).
  const priceResult = comboLinePrice({
    comboBasePrice: Number(pricing.combo_base_price),
    proteinSurcharge,
    sideSurcharge,
    drinkSurcharge,
  });
  if (!priceResult.ok) return READ_ERROR;

  return {
    productId: roll.id,
    name: `Menu Combo · ${roll.name}`,
    category: "menu_combo",
    unitPrice: priceResult.price,
    configuration,
  };
}

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
    pickup,
    customer,
    privacyAccepted,
    marketingOptIn,
    ageConfirmed,
    giveMeFiveRequested,
  } = body ?? {};

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Il carrello è vuoto." }, { status: 400 });
  }
  if (fulfillment !== "delivery" && fulfillment !== "pickup") {
    return NextResponse.json({ error: "Si è verificato un problema con la modalità scelta. Riprova." }, { status: 400 });
  }
  if (
    !customer?.firstName?.trim() ||
    !customer?.lastName?.trim() ||
    !customer?.phone?.trim()
  ) {
    return NextResponse.json({ error: "Controlla di aver compilato nome, cognome e telefono." }, { status: 400 });
  }
  if (!privacyAccepted) {
    return NextResponse.json({ error: "Per procedere, accetta l'informativa privacy." }, { status: 400 });
  }

  const isDelivery = fulfillment === "delivery";
  if (isDelivery && (!delivery?.address?.trim() || !delivery?.houseNumber?.trim())) {
    return NextResponse.json({ error: "Manca qualche dato dell'indirizzo. Controlla e riprova." }, { status: 400 });
  }

  const deliveryLatitude = isDelivery ? Number(delivery?.latitude) : null;
  const deliveryLongitude = isDelivery ? Number(delivery?.longitude) : null;
  if (isDelivery && (!Number.isFinite(deliveryLatitude) || !Number.isFinite(deliveryLongitude))) {
    return NextResponse.json({ error: "Non siamo riusciti a individuare l'indirizzo. Riprova a inserirlo." }, { status: 400 });
  }

  // §12/§12b: il timestamp reale dell'orario concordato va calcolato qui —
  // mai fidarsi di un timestamp pronto arrivato dal client (§46) — da
  // scheduledDay/scheduledTime. Vale per la Delivery programmata e per il
  // Ritiro (§12b: il Ritiro sceglie sempre giorno e orario, mai ASAP).
  let scheduledDeliveryAt = null;
  if (isDelivery && delivery?.timingType === "scheduled") {
    scheduledDeliveryAt = computeScheduledDeliveryAt(delivery?.scheduledDay, delivery?.scheduledTime);
    if (!scheduledDeliveryAt) {
      return NextResponse.json(
        { error: "Orario di consegna programmata non valido." },
        { status: 400 }
      );
    }
  }
  if (!isDelivery) {
    scheduledDeliveryAt = computeScheduledDeliveryAt(pickup?.scheduledDay, pickup?.scheduledTime);
    if (!scheduledDeliveryAt) {
      return NextResponse.json(
        { error: "Orario di ritiro non valido." },
        { status: 400 }
      );
    }
  }

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
  {
    const { data: windows, error: windowsError } = await supabaseAdmin
      .from("store_order_windows")
      .select("day_of_week, opens_at, closes_at, is_defined")
      .eq("store_id", store.id);

    if (windowsError) {
      console.error("[POST /api/checkout] Errore lettura store_order_windows:", windowsError);
      return NextResponse.json(
        { error: SYSTEM_ERROR_MESSAGE },
        { status: 500 }
      );
    }

    // Stessa finestra di service-status (oggi..+31gg) così la "prossima
    // apertura" del messaggio ASAP è coerente.
    const now = new Date();
    const fromDate = todayRomeDate(now);
    const toDate = todayRomeDate(new Date(now.getTime() + 31 * 86400000));
    const { data: exceptionRows, error: exceptionsError } = await supabaseAdmin
      .from("store_schedule_exceptions")
      .select("date, closure_type")
      .eq("store_id", store.id)
      .gte("date", fromDate)
      .lte("date", toDate);

    if (exceptionsError) {
      console.error("[POST /api/checkout] Errore lettura store_schedule_exceptions:", exceptionsError);
      return NextResponse.json(
        { error: SYSTEM_ERROR_MESSAGE },
        { status: 500 }
      );
    }

    const exceptions = exceptionRows ?? [];

    if (!isDelivery) {
      // §12b/§46b: il Ritiro è sempre programmato (mai ASAP). Lo slot deve
      // cadere in una finestra base reale non chiusa da eccezione, e nel
      // futuro — con chiusura INCLUSA (un ritiro all'orario di chiusura è
      // valido, §12b). Stesse stringhe §46b della Delivery programmata.
      const verdict = classifyScheduledSlot(scheduledDeliveryAt, now, windows, exceptions, true);
      if (verdict !== "ok") return scheduledRejection(verdict);
    } else if (delivery?.timingType === "scheduled") {
      // §46b/§68: lo slot programmato deve cadere in una finestra base reale non
      // chiusa da eccezione, e nel futuro (chiusura esclusa, come §12).
      const verdict = classifyScheduledSlot(scheduledDeliveryAt, now, windows, exceptions);
      if (verdict !== "ok") return scheduledRejection(verdict);
    } else {
      // §46b: ASAP disponibile solo se il turno corrente è aperto (verde) e non
      // chiuso da un'eccezione — esattamente asapAvailable di §68.4.
      const status = getScheduledSlots(windows, now, exceptions);
      const effects = computeExceptionEffects(status, now, windows, exceptions);
      if (!effects.asapAvailable) {
        return NextResponse.json(
          {
            error:
              "Non possiamo più accettare ordini immediati in questo momento. Scegli un orario tra quelli disponibili.",
          },
          { status: 409 }
        );
      }
    }
  }

  // §46, non negoziabile: ogni prezzo viene ricalcolato qui, ignorando
  // qualsiasi prezzo arrivato dal client.
  let subtotal = 0;
  let hasBeer = false;
  const resolvedItems = [];

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

  subtotal = round2(subtotal);

  // §9: ordine minimo 15€ di prodotti, solo Delivery (la fee non concorre).
  if (isDelivery && subtotal < DELIVERY_MINIMUM_ORDER) {
    return NextResponse.json(
      { error: `Ordine minimo ${DELIVERY_MINIMUM_ORDER}€ di prodotti per la Delivery.` },
      { status: 400 }
    );
  }

  if (hasBeer && !ageConfirmed) {
    return NextResponse.json(
      { error: "Per ordinare alcolici devi confermare di avere almeno 18 anni." },
      { status: 400 }
    );
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
  // qui verifichiamo solo l'eleggibilità, senza inserire promo_redemptions.
  let discountAmount = 0;
  let couponCode = null;
  if (giveMeFiveRequested && subtotal >= GIVEMEFIVE_THRESHOLD) {
    const { data: existingRedemption } = await supabaseAdmin
      .from("promo_redemptions")
      .select("id")
      .eq("promo_code", GIVEMEFIVE_CODE)
      .eq("customer_id", customerRow.id)
      .maybeSingle();

    if (!existingRedemption) {
      discountAmount = GIVEMEFIVE_DISCOUNT;
      couponCode = GIVEMEFIVE_CODE;
    }
  }

  const deliveryFee = isDelivery ? DELIVERY_FEE : 0;
  const total = round2(subtotal - discountAmount + deliveryFee);

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
