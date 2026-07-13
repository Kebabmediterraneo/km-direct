import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "./supabase-server";

// §66: admin autenticato — ogni route API del pannello staff deve
// riverificare la sessione lato server, non fidarsi solo del middleware
// (che protegge le pagine, ma è bene che ogni route sia autonoma).
export async function requireStaffSession() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      errorResponse: NextResponse.json({ error: "Non autenticato." }, { status: 401 }),
    };
  }

  return { user, errorResponse: null };
}
