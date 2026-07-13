import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../../lib/supabase-admin";
import { requireStaffSession } from "../../../../../../lib/require-staff-session";

// §54: stato ordine (cucina) e stato consegna (rider) separati — questa
// route avanza solo lo stato ordine. Da "pronto" in poi i due fulfillment
// divergono verso stati finali esclusivi ed escludenti: "ritirato" solo
// per Ritiro, "consegnato_al_rider" solo per Delivery, mai mescolati
// (§52-56). Niente integrazione Glovo reale, solo cambio di stato manuale
// (§57-61, fase 1).
const ALLOWED_TRANSITIONS = {
  nuovo: ["in_preparazione"],
  in_preparazione: ["pronto"],
  pronto: {
    pickup: ["ritirato"],
    delivery: ["consegnato_al_rider"],
  },
};

export async function POST(request, { params }) {
  const { user, errorResponse } = await requireStaffSession();
  if (errorResponse) return errorResponse;

  const { id } = params;
  const body = await request.json();
  const nextStatus = body?.status;

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .select("id, status, fulfillment")
    .eq("id", id)
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "Ordine non trovato." }, { status: 404 });
  }

  const allowedFromCurrent = ALLOWED_TRANSITIONS[order.status];
  const allowedNext = Array.isArray(allowedFromCurrent)
    ? allowedFromCurrent
    : allowedFromCurrent?.[order.fulfillment];

  if (!allowedNext || !allowedNext.includes(nextStatus)) {
    return NextResponse.json(
      { error: `Transizione di stato non valida (${order.status} → ${nextStatus}).` },
      { status: 400 }
    );
  }

  const { error: updateError } = await supabaseAdmin
    .from("orders")
    .update({ status: nextStatus })
    .eq("id", id)
    .eq("status", order.status); // guardia anti-race su due staff concorrenti

  if (updateError) {
    return NextResponse.json({ error: "Errore nell'aggiornamento dello stato." }, { status: 500 });
  }

  await supabaseAdmin.from("order_status_history").insert({
    order_id: id,
    status_type: "order_status",
    status_value: nextStatus,
    changed_by: `staff:${user.email}`,
  });

  return NextResponse.json({ status: nextStatus });
}
