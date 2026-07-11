import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "../../../../lib/supabase-admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const GIVEMEFIVE_CODE = "GIVEMEFIVE";

// §46: mai fidarsi di un evento non verificato — chiunque potrebbe inviare
// richieste finte a questo endpoint spacciandosi per Stripe. Per verificare
// la firma serve il body RAW, esattamente come ricevuto (request.text(),
// non request.json()).
export async function POST(request) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return NextResponse.json({ error: "Firma webhook non valida." }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object;
  const orderId = session.metadata?.order_id;

  if (!orderId) {
    return NextResponse.json({ error: "order_id mancante nei metadata." }, { status: 400 });
  }

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .select("id, payment_status, coupon_code, customer_id")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "Ordine non trovato." }, { status: 404 });
  }

  // Idempotenza (§46, §14/§62): Stripe può reinviare lo stesso evento più
  // volte. Se il pagamento risulta già confermato, non rifare nulla — in
  // particolare non riapplicare GIVEMEFIVE una seconda volta.
  if (order.payment_status === "succeeded") {
    return NextResponse.json({ received: true });
  }

  const { data: updatedOrders, error: updateError } = await supabaseAdmin
    .from("orders")
    .update({
      payment_status: "succeeded",
      stripe_payment_intent_id: session.payment_intent ?? null,
    })
    .eq("id", orderId)
    .eq("payment_status", "pending") // guardia anti-race su eventi concorrenti
    .select();

  if (updateError) {
    return NextResponse.json({ error: "Errore nell'aggiornamento dell'ordine." }, { status: 500 });
  }

  // Se l'update non ha toccato righe, un'altra consegna dell'evento ci ha
  // preceduto nel frattempo: idempotenza già garantita, nulla da fare.
  if (!updatedOrders || updatedOrders.length === 0) {
    return NextResponse.json({ received: true });
  }

  // §14: GIVEMEFIVE si consuma SOLO ora, ad ordine pagato confermato — mai
  // prima. coupon_code è stato tracciato in orders al momento della
  // creazione ordine (Fase A), quando il client aveva richiesto lo sconto.
  if (order.coupon_code === GIVEMEFIVE_CODE) {
    const { error: redemptionError } = await supabaseAdmin.from("promo_redemptions").insert({
      promo_code: GIVEMEFIVE_CODE,
      customer_id: order.customer_id,
      order_id: orderId,
    });

    // 23505 = unique violation: redemption già presente (doppio evento
    // sfuggito alla guardia sopra) — non è un errore reale, è idempotenza.
    if (redemptionError && redemptionError.code !== "23505") {
      return NextResponse.json({ error: "Errore nella registrazione della promo." }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
