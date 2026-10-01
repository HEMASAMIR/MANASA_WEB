import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "منارة";

export const isConfigured = url.startsWith("https://") && key.length > 20;

let client: SupabaseClient | null = null;

/**
 * Browser Supabase client. All permissions are enforced by Row Level Security
 * in the database, exactly as for the mobile app.
 */
export function sb(): SupabaseClient {
  if (!client) {
    client = createClient(url || "https://placeholder.supabase.co", key || "placeholder-key-placeholder", {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
  }
  return client;
}

/** Fetches every row of a paged query (PostgREST caps responses at 1000 rows). */
export async function fetchAll<T = Record<string, unknown>>(
  page: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
  size = 1000,
): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += size) {
    const { data, error } = await page(from, from + size - 1);
    if (error) throw error;
    const rows = data ?? [];
    out.push(...rows);
    if (rows.length < size) break;
  }
  return out;
}

/** Throws the Supabase error if present, otherwise returns the data. */
export function must<T>(res: { data: T | null; error: unknown }): T {
  if (res.error) throw res.error;
  return res.data as T;
}

export async function currentUserId(): Promise<string | null> {
  const { data } = await sb().auth.getSession();
  return data.session?.user.id ?? null;
}
