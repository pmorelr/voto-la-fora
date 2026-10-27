import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Cliente sem sessão, só para dados públicos (cidades e contagens).
export function createPublicClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
