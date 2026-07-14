import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../../lib/supabase-admin";
import { requireStaffSession } from "../../../../../../lib/require-staff-session";

// §54: stato ordine (cucina) e stato consegna (rider) separati — questa
// route cambia solo lo stato ordine. Da "pronto" in poi i due fulfillment
// divergono verso stati finali esclusivi ed escludenti: "ritirato" solo
// per Ritiro, "consegnato_al_rider" solo per Delivery, mai mescolati
// (§52-56). "problema" è raggiungibile da qualunque stato attivo, con un
// motivo obbligatorio (§62b) — niente integrazione Glovo reale, solo
// cambio di stato manuale (§57-61, fase 1).
const FORWARD_TRANSITIONS = {
  nuovo: ["in_preparazione", "problema"],
  in_preparazione: ["pronto", "problema"],
  pronto: {
    pickup: ["ritirato", "problema"],
    delivery: ["consegnato_al_rider", "problema"],
  },
};

// §52-56, decisione operativa: ogni avanzamento è annullabile con "Torna
// indietro", verso lo stato immediatamente precedente. "problema" non ha
// un target fisso (può arrivare da nuovo/in_preparazione/pronto) — la sua
// risoluzione passa dalla route dedicata /resolve, non da qui.
const BACKWARD_TRANSITIONS = {
  in_preparazione: { pickup: "nuovo", delivery: "nuovo" },
  pronto: { pickup: "in_preparazione", delivery: "in_preparazione" },
  ritirato: { pickup: "pronto" },
  consegnato_al_rider: { delivery: "pronto" },
};

function isValidTransition(currentStatus, fulfillment, nextStatus) {
  const forwardAllowed = FORWARD_TRANSITIONS[currentStatus];
  const forwardList = Array.isArray(forwardAllowed) ? forwardAllowed : forwardAllowed?.[fulfillment];
  if (forwardList?.includes(nextStatus)) return true;

  const backwardTarget = BACKWARD_TRANSITIONS[currentStatus]?.[fulfillment];
  return backwardTarget === nextStatus;
}

export async function POST(request, { params }) {
  const { user, errorResponse } = await requireStaffSession();
  if (errorResponse) return errorResponse;

  const { id } = params;
  const body = await request.json();
  const nextStatus = body?.status;
  const reason = typeof body?.reason === "string" ? body.reason.trim() : "";

  if (nextStatus === "problema" && !reason) {
    return NextResponse.json({ error: "Motivo obbligatorio." }, { status: 400 });
  }

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .select("id, status, fulfillment")
    .eq("id", id)
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "Ordine non trovato." }, { status: 404 });
  }

  if (!isValidTransition(order.status, order.fulfillment, nextStatus)) {
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

  const changedBy = `staff:${user.email}`;

  await supabaseAdmin.from("order_status_history").insert({
    order_id: id,
    status_type: "order_status",
    status_value: nextStatus,
    changed_by: changedBy,
  });

  // §62b/§66: il motivo non ha una colonna dedicata in order_status_history
  // (schema minimale di proposito) — va nel log azioni staff, già pensato
  // per questo (staff_action_log.detail).
  if (nextStatus === "problema") {
    await supabaseAdmin.from("staff_action_log").insert({
      staff_identifier: changedBy,
      order_id: id,
      action: "segnala_problema",
      detail: { reason },
    });
  }

  return NextResponse.json({ status: nextStatus });
}
