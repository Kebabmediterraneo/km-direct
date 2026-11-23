import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase-admin";
import { requireStaffSession } from "../../../../lib/require-staff-session";
import { statoAvvisoPulizia } from "../../../../lib/pulizia-stato";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

// §69 (22/11/2026): lo stato della pulizia notturna per l'avviso rosso del
// pannello staff. Legge SOLO `public.pulizia_stato()`, che restituisce data,
// esito e modo dell'ultima esecuzione e dell'ultima riuscita — nessun dato di
// clienti o ordini. La decisione «acceso / spento» la prende qui il server,
// con la regola di lib/pulizia-stato.js, sul suo orologio.
// ⚠️ Se la lettura fallisce l'avviso è ACCESO, non spento.
export async function GET() {
  const { errorResponse } = await requireStaffSession();
  if (errorResponse) return errorResponse;

  const { data, error } = await supabaseAdmin.rpc("pulizia_stato");

  if (error || !data || typeof data !== "object") {
    console.error("[GET /api/staff/pulizia-stato] Stato non leggibile:", { code: error?.code, message: error?.message });
    return NextResponse.json({
      avviso: statoAvvisoPulizia({ letturaRiuscita: false }),
      avvisoScelte: statoAvvisoPulizia({ letturaRiuscita: false }),
    });
  }

  // §65b (E4, 23/11/2026): stessa regola anche per la pulizia notturna del
  // registro delle scelte del banner (chiavi `scelte_ultima`, `scelte_ultima_ok`).
  return NextResponse.json({
    avviso: statoAvvisoPulizia({
      letturaRiuscita: true,
      ultima: data.ultima ?? null,
      ultimaOk: data.ultima_ok ?? null,
    }),
    avvisoScelte: statoAvvisoPulizia({
      letturaRiuscita: true,
      ultima: data.scelte_ultima ?? null,
      ultimaOk: data.scelte_ultima_ok ?? null,
    }),
  });
}
