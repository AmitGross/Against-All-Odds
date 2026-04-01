import { createBrowserClient } from "@supabase/ssr";

// TODO: Replace Database type once generated from Supabase CLI
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
