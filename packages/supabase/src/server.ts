import { createServerClient as _createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
import { requireSupabaseEnv } from "./env";
import type { Database } from "./types";

export const createServerClient = cache(async function createServerClient() {
  const cookieStore = await cookies();
  const { url, key } = requireSupabaseEnv();

  type CookieToSet = {
    name: string;
    value: string;
    options?: Parameters<typeof cookieStore.set>[2];
  };

  return _createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }: CookieToSet) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // The `setAll` method is called from a Server Component.
          // This can be ignored if middleware refreshes sessions.
        }
      },
    },
  });
});
