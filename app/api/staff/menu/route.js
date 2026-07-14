import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase-admin";
import { requireStaffSession } from "../../../../lib/require-staff-session";

export const dynamic = "force-dynamic";

// §63: disponibile/esaurito per articolo — Roll e Bowl restano righe
// indipendenti in `products` (§16), qui semplicemente elencate tutte
// insieme al loro stato attuale. Le Salse vivono in una tabella separata
// (`sauces`) con lo stesso meccanismo is_available.
export async function GET() {
  const { errorResponse } = await requireStaffSession();
  if (errorResponse) return errorResponse;

  const [{ data: products, error: productsError }, { data: sauces, error: saucesError }] =
    await Promise.all([
      supabaseAdmin
        .from("products")
        .select("id, name, category, base_price, is_available")
        .order("category")
        .order("sort_order"),
      supabaseAdmin
        .from("sauces")
        .select("id, name, price, is_available")
        .order("sort_order"),
    ]);

  if (productsError || saucesError) {
    console.error("[GET /api/staff/menu] Errore Supabase:", productsError, saucesError);
    return NextResponse.json({ error: "Errore nel caricamento del menu." }, { status: 500 });
  }

  return NextResponse.json({ products, sauces });
}
