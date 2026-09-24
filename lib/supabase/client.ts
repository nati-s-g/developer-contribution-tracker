/**
 * Supabase client placeholder
 *
 * Persistence is deferred for the MVP per project rules.
 * This module will initialize the Supabase client when persistence is required.
 */

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
};
