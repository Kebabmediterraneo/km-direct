import { NextResponse } from "next/server";
import { getActiveStore } from "../../../lib/get-active-store";
import { supabaseAdmin } from "../../../lib/supabase-admin";
import { getScheduledSlots } from "../../../lib/scheduled-slots";
import { todayRomeDate, computeExceptionEffects } from "../../../lib/schedule-exceptions";

export const dynamic = "force-dynamic";
// route pubblica: senza questo Next serve dati stale dalla cache fetch anche
// con dynamic=force-dynamic (§68 richiede letture sempre fresche)
export const fetchCache = "force-no-store";

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

  // §68.4: chiusure eccezionali nell'orizzonte utile (oggi..+31 giorni, per
  // coprire anche il calcolo della "prossima apertura" di nextOpenSlot).
  const fromDate = todayRomeDate(referenceDate);
  const toDate = todayRomeDate(new Date(referenceDate.getTime() + 31 * 86400000));
  const { data: exceptions, error: exceptionsError } = await supabaseAdmin
    .from("store_schedule_exceptions")
    .select("date, closure_type")
    .eq("store_id", store.id)
    .gte("date", fromDate)
    .lte("date", toDate);

  if (exceptionsError) {
    console.error("[GET /api/service-status] Errore eccezioni:", exceptionsError);
    return NextResponse.json({ error: "Errore nel calcolo dello stato del servizio." }, { status: 500 });
  }

  const exceptionRows = exceptions ?? [];
  const result = getScheduledSlots(windows, referenceDate, exceptionRows);
  if (!result.phase) {
    return NextResponse.json({ error: "Nessun orario configurato." }, { status: 404 });
  }

  // §68.4: override semaforo + flag ASAP/checkout in base alle eccezioni.
  // Additivo: senza eccezioni sul turno rilevante, i campi restano invariati.
  const effects = computeExceptionEffects(result, referenceDate, windows, exceptionRows);

  return NextResponse.json({ ...result, ...effects });
}
