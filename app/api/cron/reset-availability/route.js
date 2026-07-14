import { NextResponse } from "next/server";
import { supabaseAdmin } from "../../../../lib/supabase-admin";

export const dynamic = "force-dynamic";

// §63-64: reset automatico giornaliero — tutti i prodotti e le salse
// segnati "esaurito" tornano disponibili una volta al giorno, prima di
// qualunque apertura possibile (§13), senza intervento manuale. Invocata
// da Vercel Cron (vedi vercel.json), che invia l'header Authorization con
// il valore di CRON_SECRET — qualunque altra chiamata va rifiutata, per
// evitare che chi scopre l'URL resetti la disponibilità a piacere.
export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Non autorizzato." }, { status: 401 });
  }

  const [{ error: productsError }, { error: saucesError }] = await Promise.all([
    supabaseAdmin.from("products").update({ is_available: true }).eq("is_available", false),
    supabaseAdmin.from("sauces").update({ is_available: true }).eq("is_available", false),
  ]);

  if (productsError || saucesError) {
    console.error(
      "[GET /api/cron/reset-availability] Errore Supabase:",
      productsError,
      saucesError
    );
    return NextResponse.json({ error: "Errore nel reset disponibilità." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
