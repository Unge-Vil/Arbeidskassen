import { createBrowserClient as _createBrowserClient } from "@supabase/ssr";
import { requirePublicSupabaseEnv } from "./env";
import type { Database } from "./types";

export function createBrowserClient() {
  const { url, key } = requirePublicSupabaseEnv();

  return _createBrowserClient<Database>(url, key);
}
