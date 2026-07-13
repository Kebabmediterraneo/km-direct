import { createBrowserClient } from "@supabase/ssr";

// Client Supabase per il browser, solo per il login del pannello staff
// (app/staff/login): usa la publishable key e salva la sessione nei
// cookie, condivisi con il middleware e le Route Handler server-side.
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}
