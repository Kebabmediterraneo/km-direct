import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "../../../lib/supabase-admin";
import { getActiveStore } from "../../../lib/get-active-store";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const DELIVERY_FEE = 2.5;
const DELIVERY_MINIMUM_ORDER = 15;
const GIVEMEFIVE_THRESHOLD = 25;
const GIVEMEFIVE_DISCOUNT = 5;
const GIVEMEFIVE_CODE = "GIVEMEFIVE";
const MARKETING_TEXT_VERSION = "v1";

function round2(value) {
  return Math.round(value * 100) / 100;
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

  let unitPrice = Number(product.base_price);
  const configuration = {};

  if (ref.proteinLabel) {
    const { data: choice } = await supabaseAdmin
      .from("product_choice_options")
      .select("*")
      .eq("product_id", ref.id)
      .eq("label", ref.proteinLabel)
      .maybeSingle();
    if (!choice) return null;
    unitPrice += Number(choice.price_delta);
    configuration.choiceLabel = choice.choice_label;
    configuration.choice = choice.label;
  }

  if (ref.removals && ref.removals.length > 0) {
    configuration.removals = ref.removals;
  }

  if (ref.accompanimentLabel) {
    configuration.accompaniment = ref.accompanimentLabel;
  }

  if (ref.extraMeat) {
    const { data: addon } = await supabaseAdmin
      .from("product_addons")
      .select("*")
      .eq("product_id", ref.id)
      .limit(1)
      .maybeSingle();
    if (!addon) return null;
    unitPrice += Number(addon.price);
    configuration.extraMeat = true;
  }

  return {
    productId: product.id,
    name: product.name,
    category: product.category,
    unitPrice: round2(unitPrice),
    configuration,
  };
}

async function resolveSauce(ref) {
  const { data: sauce } = await supabaseAdmin
    .from("sauces")
    .select("*")
    .eq("id", ref.id)
    .eq("is_available", true)
    .single();

  if (!sauce) return null;

  return {
    productId: null,
    name: sauce.name,
    category: "salse",
    unitPrice: round2(Number(sauce.price)),
    configuration: {},
  };
}

async function resolveCombo(ref, storeId) {
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

  let unitPrice = Number(pricing.combo_base_price);
  const configuration = { roll: roll.name };

  if (ref.proteinLabel) {
    const { data: choice } = await supabaseAdmin
      .from("product_choice_options")
      .select("*")
      .eq("product_id", ref.rollProductId)
      .eq("label", ref.proteinLabel)
      .maybeSingle();
    if (!choice) return null;
    unitPrice += Number(choice.price_delta);
    configuration.protein = choice.label;
  }

  if (ref.removals && ref.removals.length > 0) {
    configuration.removals = ref.removals;
  }

  if (ref.sideLabel) {
    const { data: side } = await supabaseAdmin
      .from("combo_side_options")
      .select("*")
      .eq("store_id", storeId)
      .eq("label", ref.sideLabel)
      .eq("is_available", true)
      .maybeSingle();
    if (!side) return null;
    unitPrice += Number(side.price_delta);
    configuration.side = side.label;
  }

  if (ref.drinkName) {
    const { data: drinkProduct } = await supabaseAdmin
      .from("products")
      .select("id")
      .eq("category", "drink")
      .eq("name", ref.drinkName)
      .maybeSingle();
    if (!drinkProduct) return null;

    const { data: drink } = await supabaseAdmin
      .from("combo_drink_options")
      .select("*")
      .eq("store_id", storeId)
      .eq("drink_product_id", drinkProduct.id)
      .eq("is_available", true)
      .maybeSingle();
    if (!drink) return null;
    unitPrice += Number(drink.price_delta);
    configuration.drink = ref.drinkName;
  }

  return {
    productId: roll.id,
    name: `Menu Combo · ${roll.name}`,
    category: "menu_combo",
    unitPrice: round2(unitPrice),
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
    return NextResponse.json({ error: "Modalità non valida." }, { status: 400 });
  }
  if (
    !customer?.firstName?.trim() ||
    !customer?.lastName?.trim() ||
    !customer?.phone?.trim()
  ) {
    return NextResponse.json({ error: "Dati cliente incompleti." }, { status: 400 });
  }
  if (!privacyAccepted) {
    return NextResponse.json({ error: "Privacy non accettata." }, { status: 400 });
  }

  const isDelivery = fulfillment === "delivery";
  if (isDelivery && (!delivery?.address?.trim() || !delivery?.houseNumber?.trim())) {
    return NextResponse.json({ error: "Indirizzo delivery incompleto." }, { status: 400 });
  }

  const { store, errorResponse } = await getActiveStore();
  if (errorResponse) return errorResponse;

  // §46, non negoziabile: ogni prezzo viene ricalcolato qui, ignorando
  // qualsiasi prezzo arrivato dal client.
  let subtotal = 0;
  let hasBeer = false;
  const resolvedItems = [];

  for (const item of items) {
    const quantity = Number.isInteger(item?.quantity) && item.quantity > 0 ? item.quantity : 1;
    const ref = item?.ref;

    if (!ref || (ref.kind !== "product" && ref.kind !== "sauce" && ref.kind !== "combo")) {
      return NextResponse.json({ error: "Articolo non valido." }, { status: 400 });
    }
    if (ref.kind !== "combo" && !ref.id) {
      return NextResponse.json({ error: "Articolo non valido." }, { status: 400 });
    }
    if (ref.kind === "combo" && !ref.rollProductId) {
      return NextResponse.json({ error: "Articolo non valido." }, { status: 400 });
    }

    let resolved;
    if (ref.kind === "sauce") {
      resolved = await resolveSauce(ref);
    } else if (ref.kind === "combo") {
      resolved = await resolveCombo(ref, store.id);
    } else {
      resolved = await resolveProduct(ref);
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
      { error: "Conferma di avere almeno 18 anni richiesta." },
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
    return NextResponse.json({ error: "Errore nella gestione del cliente." }, { status: 500 });
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
    delivery_timing: isDelivery ? delivery?.timingType ?? "asap" : null,
    delivery_address: isDelivery ? delivery.address.trim() : null,
    delivery_civico: isDelivery ? delivery.houseNumber.trim() : null,
    delivery_citofono: isDelivery ? delivery?.intercom?.trim() || null : null,
    delivery_piano_interno: isDelivery ? delivery?.floorInterior?.trim() || null : null,
    delivery_edificio_scala: isDelivery ? delivery?.buildingStaircase?.trim() || null : null,
    delivery_note_rider: isDelivery ? delivery?.riderNotes?.trim() || null : null,
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
    return NextResponse.json({ error: "Errore nella creazione dell'ordine." }, { status: 500 });
  }

  const orderItemsPayload = resolvedItems.map((item) => ({ ...item, order_id: order.id }));
  const { error: itemsError } = await supabaseAdmin.from("order_items").insert(orderItemsPayload);

  if (itemsError) {
    return NextResponse.json({ error: "Errore nel salvataggio degli articoli." }, { status: 500 });
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
    return NextResponse.json({ error: "Errore nella creazione del pagamento." }, { status: 500 });
  }

  await supabaseAdmin
    .from("orders")
    .update({ stripe_checkout_session_id: session.id })
    .eq("id", order.id);

  return NextResponse.json({ url: session.url });
}
