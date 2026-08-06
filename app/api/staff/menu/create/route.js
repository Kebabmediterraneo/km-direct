import { NextResponse } from "next/server";
import { requireStaffSession } from "../../../../../lib/require-staff-session";
import { getActiveStore } from "../../../../../lib/get-active-store";
import { supabaseAdmin } from "../../../../../lib/supabase-admin";
import { createProductCore } from "../../../../../lib/menu-create";

// §63-64 (Fase 3) / §67 / §66: creazione di un articolo di menu. Come le altre
// rotte del menu, l'unica scrittura passa da qui — sessione staff verificata +
// secret key — e il client non scrive mai diretto sul database.
//
// Sottile come `product` e `allergens`: tutta la logica (validazioni, slug,
// collisione, ordine vincolante delle scritture, log) sta in `createProductCore`,
// testabile senza il livello HTTP (§46b: una sola implementazione).
//
// Due cose le aggiunge la rotta, e sono le stesse che aggiunge la creazione
// delle chiusure eccezionali di §68:
//   - lo STORE, risolto con `getActiveStore()`. Il modulo non va a cercarlo:
//     `getActiveStore()` restituisce una NextResponse in caso di errore, quindi
//     vive qui e non nella lib;
//   - il CLIENT database. `menu-create.js` non importa `supabase-admin.js`
//     apposta — quel file costruisce il client al caricamento e renderebbe il
//     modulo non provabile — quindi glielo passa la rotta.
export async function POST(request) {
  const { user, errorResponse } = await requireStaffSession();
  if (errorResponse) return errorResponse;

  const { store, errorResponse: storeError } = await getActiveStore();
  if (storeError) return storeError;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Richiesta non valida." }, { status: 400 });
  }

  const { status, body: responseBody } = await createProductCore({
    user,
    storeId: store.id,
    payload: body,
    db: supabaseAdmin,
  });
  return NextResponse.json(responseBody, { status });
}
