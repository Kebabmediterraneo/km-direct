import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase-admin";
import { requireStaffSession } from "../../../../lib/require-staff-session";

export const dynamic = "force-dynamic";

// §53: le tre sezioni della dashboard, come insiemi di status ordine.
// Nuovi/Attivi sono operative (le più recenti prima, da lavorare in
// ordine); Storico è sola lettura (le più recenti prima, limitate: non
// serve la stessa profondità operativa, §52-56). "problema" resta in
// Attivi (non è concluso, va ancora risolto o annullato, §62b) — solo
// "annullato" e i due stati finali normali vanno in Storico.
const SECTIONS = {
  nuovi: { statuses: ["nuovo"], ascending: true },
  attivi: { statuses: ["in_preparazione", "pronto", "problema"], ascending: true },
  storico: {
    statuses: ["ritirato", "consegnato_al_rider", "annullato"],
    ascending: false,
    limit: 50,
  },
};

export async function GET(request) {
  const { errorResponse } = await requireStaffSession();
  if (errorResponse) return errorResponse;

  const section = new URL(request.url).searchParams.get("section") ?? "nuovi";
  const config = SECTIONS[section];
  if (!config) {
    return NextResponse.json({ error: "Sezione non valida." }, { status: 400 });
  }

  // §52-56, correzione critica: un ordine esiste su database (status='nuovo')
  // ancora prima che il pagamento Stripe sia confermato — se il cliente
  // abbandona o il pagamento fallisce, resta payment_status='pending'
  // indefinitamente. Nessuna delle tre sezioni deve mai mostrare un ordine
  // non pagato, quindi il filtro è qui, condiviso da tutte. "refunded" resta
  // incluso: un ordine rimborsato (§62b) è stato pagato con successo e poi
  // restituito — è un evento reale che deve restare visibile in Storico,
  // non un ordine "mai pagato" da nascondere insieme a pending/failed.
  let query = supabaseAdmin
    .from("orders")
    .select(
      "id, pickup_code, status, fulfillment, total, payment_status, coupon_code, created_at, delivery_timing, scheduled_delivery_at, external_delivery_id, customers(first_name, last_name, phone), order_items(product_name_snapshot, category_snapshot, quantity, unit_price_snapshot, line_total, is_combo, configuration), stores(glovo_outlet_id)"
    )
    .in("status", config.statuses)
    .in("payment_status", ["succeeded", "refunded"])
    .order("created_at", { ascending: config.ascending });

  if (config.limit) {
    query = query.limit(config.limit);
  }

  const { data: orders, error } = await query;

  if (error) {
    console.error("[GET /api/staff/orders] Errore Supabase:", error);
    return NextResponse.json({ error: "Errore nel caricamento degli ordini." }, { status: 500 });
  }

  return NextResponse.json({ orders });
}
