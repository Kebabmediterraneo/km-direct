import { NextResponse } from "next/server";
import { requireStaffSession } from "../../../../../lib/require-staff-session";
import { getActiveStore } from "../../../../../lib/get-active-store";
import { supabaseAdmin } from "../../../../../lib/supabase-admin";
import { createProductCore } from "../../../../../lib/menu-create";
// §63-64 (Fase 4, 12/08/2026): l'elenco delle proteine esistenti. La lettura sta
// in un modulo suo — come `getActiveStore()` — perché una rotta di Next non è
// importabile da una prova, e quel controllo deve poter essere eseguito.
import { readProteinCatalog } from "../../../../../lib/protein-catalog";

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

  // §63-64 (Fase 4) — IL CATALOGO DELLE PROTEINE, terza cosa che la rotta
  // aggiunge oltre allo store e al client.
  //
  // ⚠️ **Si legge SOLO se l'articolo ha proteine.** Non è un'ottimizzazione: è
  // ciò che tiene la Fase 3 identica a com'era. Una salsa, una birra, un dolce
  // non hanno proteine e non devono dipendere da una lettura che potrebbe
  // fallire — se il catalogo fosse letto sempre, un guasto o una divergenza di
  // etichette bloccherebbero la creazione di articoli che con le proteine non
  // c'entrano niente.
  //
  // ⚠️ E quando serve e non si può avere, il messaggio è **quello vero**: se il
  // catalogo si fermasse per due etichette diverse, dire al pannello "elenco non
  // disponibile" nasconderebbe la causa a chi può correggerla.
  let proteinCatalog;
  const chiedeProteine = Array.isArray(body?.options?.proteins) && body.options.proteins.length > 0;
  if (chiedeProteine) {
    const catalogo = await readProteinCatalog(supabaseAdmin);
    if (!catalogo.ok) {
      return NextResponse.json({ error: catalogo.error }, { status: 500 });
    }
    proteinCatalog = catalogo.catalog;
  }

  const { status, body: responseBody } = await createProductCore({
    user,
    storeId: store.id,
    payload: body,
    db: supabaseAdmin,
    proteinCatalog,
  });
  return NextResponse.json(responseBody, { status });
}
