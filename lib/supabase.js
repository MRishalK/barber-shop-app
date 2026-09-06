// lib/supabase.js
import { createClient } from "@supabase/supabase-js";

// Public client — safe to use in the browser (customer booking page).
// Only has access to what your Row Level Security policies allow.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Server-only client — uses the service role key, bypasses RLS.
// NEVER import this into a client component. Only use inside app/api/* routes.
export function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}
