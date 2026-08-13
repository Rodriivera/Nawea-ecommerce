import "server-only";

import { createClient } from "@supabase/supabase-js";

/**
 * Cliente con SUPABASE_SERVICE_ROLE_KEY: bypass de RLS.
 *
 * IMPORTANTE: este módulo nunca debe importarse desde Client Components ni
 * rutas que expongan datos al navegador. Solo Route Handlers, Server Actions
 * y procesos de backend que necesiten operar con la service role.
 * El import "server-only" rompe el build si un Client Component lo importa.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export function createAdminClient() {
  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
