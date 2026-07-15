import { NextResponse } from "next/server";
import { getActiveStore } from "../../../lib/get-active-store";
import { supabaseAdmin } from "../../../lib/supabase-admin";
import { getScheduledSlots } from "../../../lib/scheduled-slots";

export const dynamic = "force-dynamic";

// §7/§12/§13: store_order_windows è amministrativa (mai esposta con la
// publishable key). Questa route gira lato server con la secret key,
// calcola sia il semaforo (§7) sia gli slot reali per la consegna
// programmata (§12) dagli stessi orari, e restituisce al client solo il
// risultato — mai gli orari grezzi né la logica di calcolo.
//
// Il parametro opzionale ?at=<ISO timestamp> forza l'ora usata per il
// calcolo: serve solo per verificare manualmente le fasce/slot senza dover
// aspettare l'orario reale (resta comunque puramente informativo, non ha
// alcun effetto su checkout/prezzi).
export async function GET(request) {
  const { store, errorResponse } = await getActiveStore();
  if (errorResponse) return errorResponse;

  const { data: windows, error } = await supabaseAdmin
    .from("store_order_windows")
    .select("day_of_week, opens_at, closes_at, is_defined")
    .eq("store_id", store.id);

  if (error) {
    console.error("[GET /api/service-status] Errore Supabase:", error);
    return NextResponse.json({ error: "Errore nel calcolo dello stato del servizio." }, { status: 500 });
  }

  const atParam = new URL(request.url).searchParams.get("at");
  const simulatedDate = atParam ? new Date(atParam) : null;
  const referenceDate =
    simulatedDate && !Number.isNaN(simulatedDate.getTime()) ? simulatedDate : new Date();

  const result = getScheduledSlots(windows, referenceDate);
  if (!result.phase) {
    return NextResponse.json({ error: "Nessun orario configurato." }, { status: 404 });
  }

  return NextResponse.json(result);
}
