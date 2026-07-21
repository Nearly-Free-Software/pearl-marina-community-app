const requiredKeys = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"] as const;

export function getSupabaseEnv() {
  const missing = requiredKeys.filter((key) => !process.env[key]);
  if (missing.length > 0) throw new Error(`Missing Supabase environment variables: ${missing.join(", ")}`);
  return { url: process.env.NEXT_PUBLIC_SUPABASE_URL!, publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY! };
}
