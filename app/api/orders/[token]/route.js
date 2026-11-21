import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase-admin";
import { isCountable, orderTotal } from "../../../../lib/order-conversion";

// Il payment_status cambia in modo asincrono (webhook Stripe): senza questo,
// Next.js mette in cache la risposta GET e il polling della pagina di
// conferma continuerebbe a vedere 'pending' anche dopo l'aggiornamento reale.
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

// order_token è pensato per essere non prevedibile (§66) e non lega a dati
// sensibili: qui esponiamo solo il minimo che serve alla pagina di stato
// persistente (§47-51) per mostrare il messaggio giusto — pickup_code,
// status e fulfillment (per distinguere "pronto" Ritiro/Delivery).
//
// §65b (D7, 16/11/2026) — riaperto apposta: in più il TOTALE e `daContare`.
// «Il server decide, la pagina esegue»: `daContare` è vero solo se l'ordine è
// pagato E nato da meno di tre ore (D6), calcolato qui da `isCountable`.
// ⚠️ La data di nascita si legge per quel calcolo e NON esce verso il browser.
// Il totale non è un dato personale.
export async function GET(request, { params }) {
  const { token } = params;

  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .select("pickup_code, payment_status, status, fulfillment, total, created_at")
    .eq("order_token", token)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "Ordine non trovato." }, { status: 404 });
  }

  return NextResponse.json({
    pickupCode: order.pickup_code,
    paymentStatus: order.payment_status,
    status: order.status,
    fulfillment: order.fulfillment,
    total: orderTotal(order.total),
    daContare: isCountable(order),
  });
}
