import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase-admin";

// Il payment_status cambia in modo asincrono (webhook Stripe): senza questo,
// Next.js mette in cache la risposta GET e il polling della pagina di
// conferma continuerebbe a vedere 'pending' anche dopo l'aggiornamento reale.
export const dynamic = "force-dynamic";

// order_token è pensato per essere non prevedibile (§66) e non lega a dati
// sensibili: qui esponiamo solo pickup_code e payment_status, il minimo che
// serve alla pagina di conferma per capire se il pagamento è confermato.
export async function GET(request, { params }) {
  const { token } = params;

  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .select("pickup_code, payment_status")
    .eq("order_token", token)
    .single();

  if (error || !order) {
    return NextResponse.json({ error: "Ordine non trovato." }, { status: 404 });
  }

  return NextResponse.json({
    pickupCode: order.pickup_code,
    paymentStatus: order.payment_status,
  });
}
