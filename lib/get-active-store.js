import { NextResponse } from "next/server";
import { supabaseAdmin } from "./supabase-admin";

// §5/§64: store_id obbligatorio ovunque, anche con un solo store attivo.
// Centralizzato qui (usato da /api/geofence e /api/checkout) perché un
// errore di connessione/permessi verso Supabase (es. secret key non valida
// o non aggiornata) va distinto da "nessuno store attivo in tabella":
// altrimenti entrambi i casi mostrano lo stesso "Store non trovato",
// nascondendo un problema di configurazione dietro un 404 fuorviante.
export async function getActiveStore() {
  const { data: store, error } = await supabaseAdmin
    .from("stores")
    .select("id")
    .eq("is_active", true)
    .limit(1)
    .single();

  if (error) {
    // PGRST116 = "JSON object requested, multiple (or no) rows returned":
    // è il codice che PostgREST usa con .single() quando la query è andata
    // a buon fine ma non ci sono righe — il caso genuino di "nessuno store
    // attivo". Qualsiasi altro codice è un problema di connessione/permessi
    // e va loggato, non nascosto.
    if (error.code !== "PGRST116") {
      console.error("[getActiveStore] Errore Supabase nella lookup dello store:", error);
      return {
        store: null,
        errorResponse: NextResponse.json(
          { error: "Errore di connessione al database." },
          { status: 500 }
        ),
      };
    }

    return {
      store: null,
      errorResponse: NextResponse.json({ error: "Store non trovato." }, { status: 404 }),
    };
  }

  if (!store) {
    return {
      store: null,
      errorResponse: NextResponse.json({ error: "Store non trovato." }, { status: 404 }),
    };
  }

  return { store, errorResponse: null };
}
