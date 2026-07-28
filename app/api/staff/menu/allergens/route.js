import { NextResponse } from "next/server";
import { requireStaffSession } from "../../../../../lib/require-staff-session";
import { updateAllergensCore } from "../../../../../lib/menu-allergens";

// §67 (Fase 2A) / §66: salvataggio di allergeni + flag dietetico +
// `allergens_verified_at` di un prodotto o di una salsa. Come le altre route
// menu, l'unica scrittura passa da qui: sessione staff verificata + secret key,
// il client non scrive mai diretto sul DB. Tutta la logica (validazioni,
// ordine insert-poi-delete, log) sta in `updateAllergensCore`, testabile senza
// il livello HTTP (§46b: una sola implementazione).
export async function POST(request) {
  const { user, errorResponse } = await requireStaffSession();
  if (errorResponse) return errorResponse;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Richiesta non valida." }, { status: 400 });
  }

  const { status, body: responseBody } = await updateAllergensCore({ user, payload: body });
  return NextResponse.json(responseBody, { status });
}
