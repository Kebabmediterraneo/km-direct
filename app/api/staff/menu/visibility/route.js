import { NextResponse } from "next/server";
import { requireStaffSession } from "../../../../../lib/require-staff-session";
import { supabaseAdmin } from "../../../../../lib/supabase-admin";
import { setInMenuCore } from "../../../../../lib/menu-visibility";

// §63-64 ("togli dal menu", spec v62) / §66: toglie un articolo dal menu del
// cliente e ce lo rimette. Come le altre rotte del menu, l'unica scrittura passa
// da qui — sessione staff verificata + secret key — e il client non scrive mai
// diretto sul database.
//
// Sottile come `product`, `allergens` e `create`: validazioni, scrittura e riga
// di registro stanno in `setInMenuCore`, provabile senza il livello HTTP
// (§46b: una sola implementazione).
//
// Il CLIENT database lo passa la rotta: `menu-visibility.js` non importa
// `supabase-admin.js` apposta — quel file costruisce il client al caricamento e
// renderebbe il modulo non provabile.
//
// Non serve `getActiveStore`: si aggiorna un articolo per `id`, come fa la rotta
// della disponibilità, non un insieme filtrato per store.
export async function POST(request) {
  const { user, errorResponse } = await requireStaffSession();
  if (errorResponse) return errorResponse;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Richiesta non valida." }, { status: 400 });
  }

  const { status, body: responseBody } = await setInMenuCore({
    user,
    id: body?.id,
    isInMenu: body?.isInMenu,
    db: supabaseAdmin,
  });
  return NextResponse.json(responseBody, { status });
}
