import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../lib/supabase-admin";
import { BANNER_VERSION } from "../../../lib/cookie-consent";
import { rigaDaRichiesta, MAX_CORPO } from "../../../lib/consenso-registro";

export const dynamic = "force-dynamic";

// §65b (E4, 23/11/2026) — il registro delle scelte del banner.
// Il browser la chiama «spara e dimentica» a ogni salvataggio di una scelta.
// ⚠️ Risponde SEMPRE 204, qualunque cosa succeda: chi la chiama non deve poter
// capire se una riga è stata scritta, rifiutata o fermata dai limiti, e il
// banner non deve mai dipendere da lei.
// ⚠️ Scrive SOLO attraverso `public.registra_scelta_banner(...)`, che applica i
// limiti (20 righe per identificativo nelle 24 ore, 120 al minuto in tutto).
// ⚠️ Nel log solo il codice dell'errore: mai l'identificativo, mai il corpo.
const VUOTA = () => new NextResponse(null, { status: 204 });

export async function POST(request) {
  try {
    const dichiarata = Number(request.headers.get("content-length"));
    if (Number.isFinite(dichiarata) && dichiarata > MAX_CORPO) return VUOTA();

    const testo = await request.text();
    const esito = rigaDaRichiesta(testo, BANNER_VERSION);
    if (!esito.ok) return VUOTA();

    const { error } = await supabaseAdmin.rpc("registra_scelta_banner", esito.parametri);
    if (error) {
      console.error("[POST /api/consenso-banner] Scrittura non riuscita:", { code: error.code ?? "sconosciuto" });
    }
  } catch (err) {
    console.error("[POST /api/consenso-banner] Errore:", { code: err?.code ?? "sconosciuto" });
  }
  return VUOTA();
}
