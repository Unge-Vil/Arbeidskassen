export const SUPABASE_ENV_ERROR_MESSAGE =
  "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and either NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.";

export function resolvePublicSupabaseEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
    key:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      null,
  };
}

export function resolveSupabaseEnv() {
  const publicEnv = resolvePublicSupabaseEnv();

  return {
    url: publicEnv.url ?? process.env.SUPABASE_URL ?? null,
    key:
      publicEnv.key ??
      process.env.SUPABASE_PUBLISHABLE_KEY ??
      process.env.SUPABASE_ANON_KEY ??
      null,
  };
}

export function requirePublicSupabaseEnv() {
  const { url, key } = resolvePublicSupabaseEnv();

  if (!url || !key) {
    throw new Error(SUPABASE_ENV_ERROR_MESSAGE);
  }

  return { url, key };
}

export function requireSupabaseEnv() {
  const { url, key } = resolveSupabaseEnv();

  if (!url || !key) {
    throw new Error(SUPABASE_ENV_ERROR_MESSAGE);
  }

  return { url, key };
}
