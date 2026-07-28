import { NextResponse } from "next/server";
import { requireStaffSession } from "../../../../../lib/require-staff-session";
import { updateProductCore } from "../../../../../lib/menu-editor";

// §63-64 (Fase 1) / §66: editing dei cinque campi semplici di un prodotto
// (name, description, base_price, badge, sort_order). Come il toggle
// disponibile/esaurito, l'unica scrittura passa da qui: sessione staff
// verificata + secret key. Il client non scrive mai diretto sul DB.
// Tutta la logica (validazioni + update + log) sta in `updateProductCore`,
// così è testabile senza il livello HTTP (§46b: una sola implementazione).
export async function POST(request) {
  const { user, errorResponse } = await requireStaffSession();
  if (errorResponse) return errorResponse;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Richiesta non valida." }, { status: 400 });
  }

  const { status, body: responseBody } = await updateProductCore({ user, payload: body });
  return NextResponse.json(responseBody, { status });
}
