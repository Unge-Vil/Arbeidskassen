const SUPABASE_URL_ENV_NAMES = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_URL",
] as const;

const SUPABASE_KEY_ENV_NAMES = [
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_ANON_KEY",
  "SUPABASE_PUBLISHABLE_KEY",
] as const;

export const SUPABASE_ENV_ERROR_MESSAGE =
  "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and either NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.";

function readFirstEnv(names: readonly string[]) {
  for (const name of names) {
    const value = process.env[name];

    if (value) {
      return value;
    }
  }

  return null;
}

export function resolveSupabaseEnv() {
  return {
    url: readFirstEnv(SUPABASE_URL_ENV_NAMES),
    key: readFirstEnv(SUPABASE_KEY_ENV_NAMES),
  };
}

export function requireSupabaseEnv() {
  const { url, key } = resolveSupabaseEnv();

  if (!url || !key) {
    throw new Error(SUPABASE_ENV_ERROR_MESSAGE);
  }

  return { url, key };
}
