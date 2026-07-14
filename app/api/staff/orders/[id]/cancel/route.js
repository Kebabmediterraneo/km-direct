import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "../../../../../../lib/supabase-admin";
import { requireStaffSession } from "../../../../../../lib/require-staff-session";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const GIVEMEFIVE_CODE = "GIVEMEFIVE";

// §62b: annullamento con rimborso condizionale. Il confine è
// "in_preparazione mai raggiunto" (nessuna riga in order_status_history con
// quel valore) — sotto quella soglia il rimborso è automatico e completo
// via Stripe; sopra, nessun rimborso automatico, va gestito manualmente
// fuori dal sistema. GIVEMEFIVE va sempre rilasciato (promo_redemptions
// eliminata), indipendentemente dal rimborso.
export async function POST(request, { params }) {
  const { user, errorResponse } = await requireStaffSession();
  if (errorResponse) return errorResponse;

  const { id } = params;
  const body = await request.json();
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";

  if (!reason) {
    return NextResponse.json({ error: "Motivo obbligatorio." }, { status: 400 });
  }

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .select("id, status, coupon_code, payment_status, stripe_payment_intent_id")
    .eq("id", id)
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "Ordine non trovato." }, { status: 404 });
  }

  if (order.status !== "problema") {
    return NextResponse.json(
      { error: "Si può annullare solo un ordine in stato 'problema'." },
      { status: 400 }
    );
  }

  const { data: preparationRows, error: historyError } = await supabaseAdmin
    .from("order_status_history")
    .select("id")
    .eq("order_id", id)
    .eq("status_type", "order_status")
    .eq("status_value", "in_preparazione")
    .limit(1);

  if (historyError) {
    return NextResponse.json({ error: "Errore nel recupero dello storico." }, { status: 500 });
  }

  const everInPreparation = (preparationRows ?? []).length > 0;
  const wasPaid = order.payment_status === "succeeded";

  let refundOutcome = "none"; // "automatic" | "manual" | "none"
  let newPaymentStatus = order.payment_status;

  if (wasPaid && !everInPreparation) {
    if (!order.stripe_payment_intent_id) {
      return NextResponse.json(
        { error: "Nessun pagamento Stripe associato all'ordine: impossibile rimborsare." },
        { status: 500 }
      );
    }
    try {
      await stripe.refunds.create({ payment_intent: order.stripe_payment_intent_id });
    } catch (err) {
      console.error("[POST /api/staff/orders/[id]/cancel] Errore rimborso Stripe:", err);
      return NextResponse.json(
        { error: `Rimborso Stripe fallito: ${err.message}` },
        { status: 500 }
      );
    }
    refundOutcome = "automatic";
    newPaymentStatus = "refunded";
  } else if (wasPaid && everInPreparation) {
    refundOutcome = "manual";
  }

  const { error: updateError } = await supabaseAdmin
    .from("orders")
    .update({
      status: "annullato",
      cancellation_reason: reason,
      payment_status: newPaymentStatus,
    })
    .eq("id", id)
    .eq("status", "problema"); // guardia anti-race

  if (updateError) {
    return NextResponse.json({ error: "Errore nell'aggiornamento dell'ordine." }, { status: 500 });
  }

  const changedBy = `staff:${user.email}`;

  await supabaseAdmin.from("order_status_history").insert({
    order_id: id,
    status_type: "order_status",
    status_value: "annullato",
    changed_by: changedBy,
  });

  await supabaseAdmin.from("staff_action_log").insert({
    staff_identifier: changedBy,
    order_id: id,
    action: "annulla_ordine",
    detail: { reason, refund: refundOutcome },
  });

  // §14/§62b: GIVEMEFIVE va rilasciata in ogni caso, l'ordine originale non
  // si è concluso — il cliente deve poterla riusare su un ordine futuro.
  if (order.coupon_code === GIVEMEFIVE_CODE) {
    await supabaseAdmin.from("promo_redemptions").delete().eq("order_id", id);
  }

  return NextResponse.json({
    status: "annullato",
    refund: refundOutcome,
    manualRefundNeeded: refundOutcome === "manual",
  });
}
