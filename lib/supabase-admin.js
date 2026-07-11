// Client Supabase con la Secret Key: bypassa la Row Level Security ed è
// destinato SOLO alle route API server-side (es. app/api/**/route.js).
// Non importare mai questo file in un componente client: SUPABASE_SECRET_KEY
// non ha il prefisso NEXT_PUBLIC_ e non deve mai raggiungere il browser.
// Per il client usa invece lib/supabase.js.
import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);
