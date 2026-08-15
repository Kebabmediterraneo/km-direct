import { NextResponse } from "next/server";
import { requireStaffSession } from "../../../../../lib/require-staff-session";
import { supabaseAdmin } from "../../../../../lib/supabase-admin";
import { readProteinCatalog } from "../../../../../lib/protein-catalog";
import { readRemovalCatalog } from "../../../../../lib/removal-catalog";

// §63-64 (Fase 4, passo 3) / §66 — i due elenchi che servono al modulo di
// creazione: le proteine esistenti e le rimozioni già usate.
//
// Sottile come le altre rotte del menu, e per la stessa ragione: sessione
// verificata + secret key qui, tutto il resto nei moduli di `lib/`, che sono
// eseguibili da una prova mentre una rotta di Next non lo è.
//
// ⚠️ **Una rotta sola per due letture** (scelta di chi ha scritto questo file,
// non una decisione presa a voce): servono **nello stesso istante** — quando si
// apre il modulo di creazione — e due chiamate separate vorrebbero dire due
// giri di rete e due stati di caricamento da tenere allineati nel pannello per
// una schermata sola.
//
// ⚠️ **Si chiama SOLO all'apertura del modulo di creazione**, non al
// caricamento della sezione Menu: è la decisione "B" di Andrea del 12/08/2026.
// Aggiungere queste letture alla rotta del menu avrebbe fatto pagare a ogni
// apertura della sezione un dato che serve di rado.
//
// ⚠️ **Se un catalogo si ferma, la rotta si ferma**: il catalogo delle proteine
// si interrompe quando trova due etichette diverse per la stessa chiave, ed è
// un dato da correggere prima di creare articoli. Rispondere con un elenco a
// metà lascerebbe scegliere una proteina il cui nome gli ordini non
// ritroverebbero — vedi il commento in cima a `lib/protein-catalog.js`.
export async function GET() {
  const { errorResponse } = await requireStaffSession();
  if (errorResponse) return errorResponse;

  const [proteine, rimozioni] = await Promise.all([
    readProteinCatalog(supabaseAdmin),
    readRemovalCatalog(supabaseAdmin),
  ]);

  if (!proteine.ok) {
    return NextResponse.json({ error: proteine.error }, { status: 500 });
  }
  if (!rimozioni.ok) {
    return NextResponse.json({ error: rimozioni.error }, { status: 500 });
  }

  return NextResponse.json({ proteins: proteine.catalog, removals: rimozioni.catalog });
}
