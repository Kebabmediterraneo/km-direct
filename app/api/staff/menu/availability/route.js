import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../../lib/supabase-admin";
import { requireStaffSession } from "../../../../../lib/require-staff-session";

const TABLE_BY_KIND = {
  product: "products",
  // COMPATIBILITÀ TEMPORANEA (§30): le salse sono righe di `products`, ma il
  // pannello invia ancora kind:"sauce" fino al secondo tempo. Lo accettiamo
  // instradandolo su `products`. DA RIMUOVERE quando il pannello invierà
  // kind:"product" anche per le salse.
  sauce: "products",
};

// §63: unica route che può scrivere is_available — la publishable key ha
// solo permessi di lettura sulle tabelle menu (scelta di sicurezza già
// presa in precedenza), quindi il toggle deve passare da qui, con la
// secret key, dietro sessione staff.
export async function POST(request) {
  const { user, errorResponse } = await requireStaffSession();
  if (errorResponse) return errorResponse;

  const body = await request.json();
  const { kind, id, isAvailable } = body ?? {};

  const table = TABLE_BY_KIND[kind];
  if (!table || !id || typeof isAvailable !== "boolean") {
    return NextResponse.json({ error: "Richiesta non valida." }, { status: 400 });
  }

  // §66: valore "prima" (dal DB) + nome, per il log. Non cambia il
  // comportamento del toggle: è una semplice lettura preliminare.
  const { data: before } = await supabaseAdmin
    .from(table)
    .select("name, is_available")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabaseAdmin
    .from(table)
    .update({ is_available: isAvailable })
    .eq("id", id);

  if (error) {
    console.error("[POST /api/staff/menu/availability] Errore Supabase:", error);
    return NextResponse.json({ error: "Errore nell'aggiornamento." }, { status: 500 });
  }

  // §66: traccia il cambio di disponibilità in staff_action_log (prima/dopo),
  // solo se è cambiato davvero. Il log non deve far fallire il toggle.
  if (before && before.is_available !== isAvailable) {
    const { error: logError } = await supabaseAdmin.from("staff_action_log").insert({
      staff_identifier: `staff:${user?.email ?? "sconosciuto"}`,
      order_id: null,
      action: "modifica_disponibilita",
      detail: {
        kind,
        item_id: id,
        item_name: before.name,
        changes: [{ field: "is_available", before: before.is_available, after: isAvailable }],
      },
    });
    if (logError) {
      console.error("[POST /api/staff/menu/availability] Errore staff_action_log:", logError);
    }
  }

  return NextResponse.json({ isAvailable });
}
