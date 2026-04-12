import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Create a Supabase client with the service_role key.
 *
 * SECURITY: This client bypasses RLS — use ONLY in:
 * - Webhook handlers (Stripe, external integrations)
 * - Background jobs / cron tasks
 * - Admin operations that cannot run as a specific user
 *
 * Never expose this client to browser code or pass it to Server Components.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for admin client.",
    );
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
