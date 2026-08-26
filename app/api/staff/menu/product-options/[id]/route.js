import { NextResponse } from "next/server";
import { requireStaffSession } from "../../../../../../lib/require-staff-session";
import { supabaseAdmin } from "../../../../../../lib/supabase-admin";
import { readProductOptionsCore } from "../../../../../../lib/menu-options-reader";

export const dynamic = "force-dynamic";

// §63-64 (passo 4a, 26/08/2026) — LE OPZIONI DI UN ARTICOLO, in lettura.
//
// Fino a oggi nessuna rotta dello staff sapeva rispondere alla domanda "quali
// opzioni ha l'articolo X": `options` restituisce i due CATALOGHI di tutto il
// menu, e l'elenco del menu non legge le quattro tabelle. La scheda unica ha
// bisogno di saperlo **prima** di poter salvare, perché
// `updateProductOptionsCore` sostituisce e un gruppo assente vale come vuoto.
//
// ⚠️ **È una rotta NUOVA e non un allargamento dell'elenco del menu**
// (decisione di Andrea, 26/08/2026): quel dato serve solo quando si apre una
// scheda, e farlo pagare a ogni apertura della sezione Menu sarebbe lo stesso
// costo continuo che la decisione "B" del 12/08 aveva già rifiutato per i due
// cataloghi.
//
// ⚠️ **Sta in `[id]` accanto alla rotta che salva, e non dentro di essa**: quella
// è una POST che riscrive le opzioni, questa una GET che le legge — due mestieri
// con conseguenze diverse, come `options` e `product-options` restano separate
// per la stessa ragione.
//
// Sottile come le altre rotte del menu: sessione verificata e client del
// database qui, tutto il resto nel cuore, che una prova può eseguire mentre una
// rotta di Next no (§46b: una sola implementazione).
export async function GET(request, { params }) {
  const { errorResponse } = await requireStaffSession();
  if (errorResponse) return errorResponse;

  const { status, body } = await readProductOptionsCore({
    id: params?.id,
    db: supabaseAdmin,
  });
  return NextResponse.json(body, { status });
}
