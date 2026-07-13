import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase-admin";
import { requireStaffSession } from "../../../../lib/require-staff-session";

export const dynamic = "force-dynamic";

// §53: dashboard "Nuovi" — per ora l'unica sezione costruita.
export async function GET() {
  const { errorResponse } = await requireStaffSession();
  if (errorResponse) return errorResponse;

  const { data: orders, error } = await supabaseAdmin
    .from("orders")
    .select(
      "id, pickup_code, fulfillment, total, created_at, customers(first_name, last_name, phone), order_items(product_name_snapshot, category_snapshot, quantity, unit_price_snapshot, line_total, is_combo, configuration)"
    )
    .eq("status", "nuovo")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[GET /api/staff/orders] Errore Supabase:", error);
    return NextResponse.json({ error: "Errore nel caricamento degli ordini." }, { status: 500 });
  }

  return NextResponse.json({ orders });
}
