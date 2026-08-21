import { NextResponse } from "next/server";
import { requireStaffSession } from "../../../../../lib/require-staff-session";
import { supabaseAdmin } from "../../../../../lib/supabase-admin";
import { updateProductOptionsCore } from "../../../../../lib/menu-options-editor";
// §63-64 (Fase 4, 12/08/2026): l'elenco delle proteine esistenti. La lettura sta
// in un modulo suo — come `getActiveStore()` — perché una rotta di Next non è
// importabile da una prova, e quel controllo deve poter essere eseguito.
import { readProteinCatalog } from "../../../../../lib/protein-catalog";

// §63-64 (la MODIFICA, 13/08/2026) / §66 — aggiornamento delle OPZIONI di un
// articolo che esiste già: proteine, rimozioni, accompagnamento, extra.
//
// Come le altre rotte del menu, l'unica scrittura passa da qui — sessione staff
// verificata + secret key — e il client non scrive mai diretto sul database.
//
// Sottile come `product`, `allergens`, `create` e `visibility`: **tutta** la
// logica sta in `updateProductOptionsCore` (`lib/menu-options-editor.js`,
// commit `5cfa3bc`), provabile senza il livello HTTP. ⚠️ §46b: una sola
// implementazione. *Un pezzo di regola aggiunto qui sarebbe la seconda, e la
// seconda non la esegue nessuna prova: le rotte di Next non sono importabili.*
//
// ---------------------------------------------------------------------------
// IL NOME — `product-options`, e perché non `options`
// ---------------------------------------------------------------------------
// `options` esiste già ed è una **GET** che restituisce i due elenchi (proteine
// esistenti, rimozioni già usate) al modulo di creazione. ⚠️ Metterci dentro
// anche la scrittura le farebbe fare due mestieri: leggere il catalogo del menu
// intero e riscrivere le opzioni di UN articolo. *Sono cose diverse, con
// permessi diversi da ragionare e conseguenze diverse in caso di guasto.*
//
// `product-options` sta accanto a `product` con la stessa logica con cui quel
// nome è stato scelto: `product` modifica i campi semplici di un articolo,
// `product-options` ne modifica le opzioni.
//
// ---------------------------------------------------------------------------
// ⚠️⚠️ QUESTA ROTTA NON VERIFICA CHE L'ARTICOLO SIA DI QUESTO STORE
// ---------------------------------------------------------------------------
// **E non è una dimenticanza: NESSUNA delle sei rotte del menu lo verifica**,
// accertato il 13/08/2026 leggendole tutte e sei e leggendo i loro cuori —
// `menu-allergens.js`, `menu-editor.js`, `menu-visibility.js` e
// `menu-options-editor.js` non nominano `store_id` in nessuna riga, e
// `availability` aggiorna per `id` e basta. `create` è l'unica che usa
// `getActiveStore()`, ma per **assegnare** lo store alla riga nuova, non per
// verificare quello di una riga che esiste.
//
// *Aggiungerlo qui e solo qui sarebbe una decisione presa dal codice, e per di
// più una decisione a metà: un articolo di un altro store resterebbe
// modificabile dalle altre sei porte. Se va chiuso, va chiuso per tutte e sette
// insieme — è una decisione di Andrea, non di questo file.*
//
// Per la stessa ragione qui non c'è `getActiveStore()`: si aggiorna un articolo
// per `id`, come fanno `product`, `availability` e `visibility`.
export async function POST(request) {
  const { user, errorResponse } = await requireStaffSession();
  if (errorResponse) return errorResponse;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Richiesta non valida." }, { status: 400 });
  }

  // §63-64 (Fase 4) — IL CATALOGO DELLE PROTEINE, l'unica cosa che questa rotta
  // aggiunge oltre alla sessione e al client. È **cablaggio, non validazione**:
  // il catalogo è un parametro che il cuore riceve, come `db`, e chi decide se
  // le proteine scelte vanno bene resta `validateProductOptions`, dentro il
  // cuore.
  //
  // ⚠️ **Si legge SOLO se il salvataggio porta proteine**, esattamente come in
  // `create` e per lo stesso motivo: una salsa, una birra, un dolce non hanno
  // proteine e non devono dipendere da una lettura che potrebbe fallire. *Se il
  // catalogo fosse letto sempre, una divergenza di etichette impedirebbe di
  // correggere le rimozioni di un articolo che con le proteine non c'entra.*
  //
  // ⚠️ E quando serve e non si può avere, il messaggio è **quello vero**: se il
  // catalogo si fermasse per due etichette diverse sulla stessa chiave, dire al
  // pannello "elenco non disponibile" nasconderebbe la causa a chi può
  // correggerla.
  let proteinCatalog;
  const chiedeProteine = Array.isArray(body?.proteins) && body.proteins.length > 0;
  if (chiedeProteine) {
    const catalogo = await readProteinCatalog(supabaseAdmin);
    if (!catalogo.ok) {
      return NextResponse.json({ error: catalogo.error }, { status: 500 });
    }
    proteinCatalog = catalogo.catalog;
  }

  const { status, body: responseBody } = await updateProductOptionsCore({
    user,
    payload: body,
    db: supabaseAdmin,
    proteinCatalog,
  });
  return NextResponse.json(responseBody, { status });
}
