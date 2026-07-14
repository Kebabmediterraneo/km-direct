import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../../lib/supabase-admin";
import { requireStaffSession } from "../../../../../../lib/require-staff-session";

// §62b: "Risolvi" riporta un ordine in `problema` allo stato immediatamente
// precedente — stesso principio del "torna indietro" (§52-56), ma il
// target non è fisso: `problema` può arrivare da nuovo, in_preparazione o
// pronto, quindi va letto da order_status_history (l'ultima riga di
// order_status diversa da "problema"). Se non esiste nessuna riga
// precedente, l'ordine era ancora "nuovo" quando è stato segnalato — stato
// implicito mai scritto in order_status_history (§54).
export async function POST(request, { params }) {
  const { user, errorResponse } = await requireStaffSession();
  if (errorResponse) return errorResponse;

  const { id } = params;

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .select("id, status")
    .eq("id", id)
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "Ordine non trovato." }, { status: 404 });
  }

  if (order.status !== "problema") {
    return NextResponse.json(
      { error: "Solo un ordine in stato 'problema' può essere risolto." },
      { status: 400 }
    );
  }

  const { data: history, error: historyError } = await supabaseAdmin
    .from("order_status_history")
    .select("status_value, changed_at")
    .eq("order_id", id)
    .eq("status_type", "order_status")
    .order("changed_at", { ascending: false });

  if (historyError) {
    return NextResponse.json({ error: "Errore nel recupero dello storico." }, { status: 500 });
  }

  const previous = (history ?? []).find((row) => row.status_value !== "problema");
  const targetStatus = previous?.status_value ?? "nuovo";

  const { error: updateError } = await supabaseAdmin
    .from("orders")
    .update({ status: targetStatus })
    .eq("id", id)
    .eq("status", "problema"); // guardia anti-race

  if (updateError) {
    return NextResponse.json({ error: "Errore nell'aggiornamento dello stato." }, { status: 500 });
  }

  await supabaseAdmin.from("order_status_history").insert({
    order_id: id,
    status_type: "order_status",
    status_value: targetStatus,
    changed_by: `staff:${user.email}`,
  });

  return NextResponse.json({ status: targetStatus });
}
