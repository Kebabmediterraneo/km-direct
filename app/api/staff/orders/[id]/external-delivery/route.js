import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../../lib/supabase-admin";
import { requireStaffSession } from "../../../../../../lib/require-staff-session";

// §57-61: external_delivery_id è l'identificativo univoco che KM comunica a
// Glovo per la consegna (NON un codice restituito da Glovo). Default = codice
// ordine (pickup_code); resta modificabile per la ri-richiesta di un rider
// (suffisso progressivo KM-0001-B, …, dato che Glovo rifiuta duplicati).
// Nessuna automazione API in questa fase: lo staff salva a mano.
export async function POST(request, { params }) {
  const { user, errorResponse } = await requireStaffSession();
  if (errorResponse) return errorResponse;

  const { id } = params;
  const body = await request.json();
  const externalDeliveryId = typeof body?.externalDeliveryId === "string" ? body.externalDeliveryId.trim() : "";

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .select("id, fulfillment")
    .eq("id", id)
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "Ordine non trovato." }, { status: 404 });
  }

  if (order.fulfillment !== "delivery") {
    return NextResponse.json({ error: "Disponibile solo per ordini Delivery." }, { status: 400 });
  }

  const { error: updateError } = await supabaseAdmin
    .from("orders")
    .update({ external_delivery_id: externalDeliveryId || null })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: "Errore nel salvataggio." }, { status: 500 });
  }

  await supabaseAdmin.from("staff_action_log").insert({
    staff_identifier: `staff:${user.email}`,
    order_id: id,
    action: "salva_external_delivery_id",
    detail: { externalDeliveryId },
  });

  return NextResponse.json({ externalDeliveryId });
}
