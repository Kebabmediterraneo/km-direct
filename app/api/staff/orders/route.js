import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase-admin";
import { requireStaffSession } from "../../../../lib/require-staff-session";

export const dynamic = "force-dynamic";

// §53: le tre sezioni della dashboard, come insiemi di status ordine.
// Nuovi/Attivi sono operative (le più recenti prima, da lavorare in
// ordine); Storico è sola lettura (le più recenti prima, limitate: non
// serve la stessa profondità operativa, §52-56).
const SECTIONS = {
  nuovi: { statuses: ["nuovo"], ascending: true },
  attivi: { statuses: ["in_preparazione", "pronto"], ascending: true },
  storico: {
    statuses: ["ritirato", "consegnato_al_rider", "problema", "annullato"],
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

  let query = supabaseAdmin
    .from("orders")
    .select(
      "id, pickup_code, status, fulfillment, total, created_at, customers(first_name, last_name, phone), order_items(product_name_snapshot, category_snapshot, quantity, unit_price_snapshot, line_total, is_combo, configuration)"
    )
    .in("status", config.statuses)
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
