import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Client Supabase legato ai cookie della richiesta corrente — usato in
// Server Component e Route Handler del pannello staff (app/staff, app/api/
// staff) per leggere/verificare la sessione admin (§66).
export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Da un Server Component non si possono scrivere cookie: ci
            // pensa il middleware a rinfrescare la sessione ad ogni richiesta.
          }
        },
      },
    }
  );
}
