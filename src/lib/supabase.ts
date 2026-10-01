import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { demoClient } from "./demo/client";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "منارة";

export const isConfigured = url.startsWith("https://") && key.length > 20;

let client: SupabaseClient | null = null;
let mode: "real" | "demo" | null = null;
let probing: Promise<"real" | "demo"> | null = null;

/**
 * Decides once whether the real Supabase project answers. If it doesn't (not configured,
 * deleted project, offline) the site runs on the in-browser demo backend instead.
 * `?demo=1` / `?demo=0` force a mode (remembered in localStorage).
 */
export function initBackend(): Promise<"real" | "demo"> {
  if (mode) return Promise.resolve(mode);
  if (probing) return probing;
  probing = (async () => {
    let forced: string | null = null;
    try {
      const q = new URLSearchParams(window.location.search).get("demo");
      if (q === "1" || q === "0") localStorage.setItem("manara-demo-mode", q);
      forced = localStorage.getItem("manara-demo-mode");
    } catch {}
    if (forced === "1" || !isConfigured) return (mode = "demo");
    if (forced === "0") return (mode = "real");
    try {
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), 5000);
      await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key }, signal: ctl.signal });
      clearTimeout(t);
      mode = "real";
    } catch {
      mode = "demo";
    }
    return mode;
  })();
  return probing;
}

export const isDemo = () => mode === "demo";

/**
 * Supabase client (or the demo stand-in). All permissions are enforced by Row Level
 * Security in the real database, exactly as for the mobile app.
 */
export function sb(): SupabaseClient {
  if (mode === "demo") return demoClient as unknown as SupabaseClient;
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
