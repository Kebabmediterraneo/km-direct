import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase-admin";
import { requireStaffSession } from "../../../../lib/require-staff-session";

export const dynamic = "force-dynamic";

// §63: disponibile/esaurito per articolo — Roll e Bowl restano righe
// indipendenti in `products` (§16), qui elencate tutte insieme al loro stato
// attuale. Dalla v32 (§30) anche le Salse sono righe di `products`
// (category='salse'): arrivano dalla stessa query, con gli stessi campi.
export async function GET() {
  const { errorResponse } = await requireStaffSession();
  if (errorResponse) return errorResponse;

  // §67 (Fase 2A): oltre ai campi Fase 1, servono al form allergeni i flag
  // dietetici, `allergens_verified_at`, gli allergeni correnti di ogni articolo
  // e il vocabolario dei 14 allergeni UE (letto dalla tabella, mai hardcodato).
  const [
    { data: products, error: productsError },
    { data: allergens, error: allergensError },
    { data: productAllergens, error: paError },
  ] = await Promise.all([
    supabaseAdmin
      .from("products")
      .select(
        // §63-64 ("togli dal menu", spec v62): `is_in_menu` serve al pannello per
        // sapere in quale stato disegnare la riga — l'icona del comando e i tre
        // pulsanti spenti. Senza questa colonna nell'elenco il pannello non
        // saprebbe distinguere un articolo a menu da uno tolto.
        "id, name, category, base_price, is_available, is_in_menu, description, badge, sort_order, spice_level, spice_label, is_vegan, is_vegetarian, allergens_verified_at"
      )
      .order("category")
      .order("sort_order"),
    supabaseAdmin.from("allergens").select("id, label, code").order("label"),
    supabaseAdmin.from("product_allergens").select("product_id, allergen_id"),
  ]);

  if (productsError || allergensError || paError) {
    console.error("[GET /api/staff/menu] Errore Supabase:", productsError, allergensError, paError);
    return NextResponse.json({ error: "Errore nel caricamento del menu." }, { status: 500 });
  }

  // Allega a ogni articolo l'elenco degli id allergene correnti.
  const byProduct = {};
  for (const r of productAllergens ?? []) (byProduct[r.product_id] ??= []).push(r.allergen_id);
  for (const p of products ?? []) p.allergens = byProduct[p.id] ?? [];

  return NextResponse.json({ products, allergens });
}
