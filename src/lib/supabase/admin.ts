import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Chave secreta: só no servidor. Usada para pedidos e avisos de visitantes,
// sempre depois de validar o Turnstile.
export function createAdminClient() {
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Para o Auth contar as verificações de código pelo IP de quem está no site, e não pelo IP do servidor
// (precisa de "IP address forwarding" ligado no painel do Supabase e de uma chave sb_secret).
export function createAuthClientFor(ip: string | undefined) {
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: ip ? { "Sb-Forwarded-For": ip } : {} },
  });
}
