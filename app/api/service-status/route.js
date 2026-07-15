import { NextResponse } from "next/server";
import { getActiveStore } from "../../../lib/get-active-store";
import { supabaseAdmin } from "../../../lib/supabase-admin";
import { computeServiceStatus, getRomeNow } from "../../../lib/service-status";

export const dynamic = "force-dynamic";

// §7/§13: store_order_windows è amministrativa (mai esposta con la
// publishable key). Questa route gira lato server con la secret key,
// calcola il semaforo e restituisce al client solo il risultato — mai gli
// orari grezzi né la logica di calcolo.
//
// Il parametro opzionale ?at=<ISO timestamp> forza l'ora usata per il
// calcolo: serve solo per verificare manualmente le 4 fasce senza dover
// aspettare l'orario reale (il semaforo resta comunque puramente
// informativo, non ha alcun effetto su checkout/prezzi).
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
  const nowMinuteOfWeek =
    simulatedDate && !Number.isNaN(simulatedDate.getTime())
      ? getRomeNow(simulatedDate)
      : undefined;

  const status = computeServiceStatus(windows, nowMinuteOfWeek);
  if (!status) {
    return NextResponse.json({ error: "Nessun orario configurato." }, { status: 404 });
  }

  return NextResponse.json(status);
}
