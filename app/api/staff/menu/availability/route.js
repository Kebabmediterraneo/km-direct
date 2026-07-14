import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../lib/supabase-admin";
import { requireStaffSession } from "../../../../../lib/require-staff-session";

const TABLE_BY_KIND = {
  product: "products",
  sauce: "sauces",
};

// §63: unica route che può scrivere is_available — la publishable key ha
// solo permessi di lettura sulle tabelle menu (scelta di sicurezza già
// presa in precedenza), quindi il toggle deve passare da qui, con la
// secret key, dietro sessione staff.
export async function POST(request) {
  const { errorResponse } = await requireStaffSession();
  if (errorResponse) return errorResponse;

  const body = await request.json();
  const { kind, id, isAvailable } = body ?? {};

  const table = TABLE_BY_KIND[kind];
  if (!table || !id || typeof isAvailable !== "boolean") {
    return NextResponse.json({ error: "Richiesta non valida." }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from(table)
    .update({ is_available: isAvailable })
    .eq("id", id);

  if (error) {
    console.error("[POST /api/staff/menu/availability] Errore Supabase:", error);
    return NextResponse.json({ error: "Errore nell'aggiornamento." }, { status: 500 });
  }

  return NextResponse.json({ isAvailable });
}
