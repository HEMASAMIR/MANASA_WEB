import { initBackend, isDemo, sb } from "./supabase";

export interface CatalogLesson {
  id: string;
  title: string;
  duration_seconds: number;
  position: number;
  is_locked: boolean;
  has_video: boolean;
}

export interface CatalogCourse {
  id: string;
  title: string;
  description: string | null;
  icon: string;
  color: number | null;
  created_at: string;
  class_name: string;
  grade: string;
  subject: string | null;
  monthly_fee: number;
  teacher: string | null;
  lessons: CatalogLesson[];
}

export interface Catalog {
  center: { name: string; logo_url: string | null; contact_phone: string | null; currency: string } | null;
  courses: CatalogCourse[];
  /** True when the database is unreachable and sample content is shown instead. */
  demo: boolean;
}

/** Published courses for visitors (no login needed) via the `public_catalog()` RPC. */
export async function loadCatalog(): Promise<Catalog> {
  await initBackend();
  try {
    const { data, error } = await sb().rpc("public_catalog");
    if (error) throw error;
    const d = data as { center: Catalog["center"]; courses: CatalogCourse[] };
    return { center: d.center, courses: d.courses ?? [], demo: isDemo() };
  } catch {
    return { center: null, courses: [], demo: isDemo() };
  }
}
