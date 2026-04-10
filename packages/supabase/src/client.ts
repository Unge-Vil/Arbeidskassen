import { createBrowserClient as _createBrowserClient } from "@supabase/ssr";
import { requireSupabaseEnv } from "./env";
import type { Database } from "./types";

export function createBrowserClient() {
  const { url, key } = requireSupabaseEnv();

  return _createBrowserClient<Database>(url, key);
}
