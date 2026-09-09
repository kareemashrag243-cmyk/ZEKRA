import { createClient } from "@supabase/supabase-js";

// Public client: safe to use in the browser. Can only do what the
// database's Row Level Security policies allow (see supabase/schema.sql).
export const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Admin client: SERVER-ONLY. Uses the service role key, which bypasses
// Row Level Security entirely. Never import this file from a component
// that renders in the browser — only from pages/api/** route handlers.
export function supabaseAdmin() {
  if (typeof window !== "undefined") {
    throw new Error("supabaseAdmin() must never be called from the browser");
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}
