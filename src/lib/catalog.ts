import { sb, isConfigured } from "./supabase";

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

/**
 * Published courses for visitors (no login needed) via the `public_catalog()` RPC.
 * If the database cannot be reached (or the function was not installed yet),
 * sample content is returned with `demo: true` so the site never looks empty.
 */
export async function loadCatalog(): Promise<Catalog> {
  if (!isConfigured) return { ...DEMO, demo: true };
  try {
    const { data, error } = await sb().rpc("public_catalog");
    if (error) throw error;
    const d = data as { center: Catalog["center"]; courses: CatalogCourse[] };
    return { center: d.center, courses: d.courses ?? [], demo: false };
  } catch {
    return { ...DEMO, demo: true };
  }
}

// ─── Sample content (shown only in demo mode, always labelled as such) ───────
const L = (id: string, titles: [string, number][]): CatalogLesson[] =>
  titles.map(([title, min], i) => ({ id: `${id}-${i}`, title, duration_seconds: min * 60, position: i + 1, is_locked: i > 2, has_video: true }));

const DEMO: Omit<Catalog, "demo"> = {
  center: { name: "منارة", logo_url: null, contact_phone: null, currency: "ج.م" },
  courses: [
    {
      id: "demo-physics", title: "الفيزياء — الثالث الثانوي", description: "شرح كامل للمنهج مع حل أسئلة الامتحانات السابقة وملخصات لكل فصل.",
      icon: "⚛️", color: 0xff0d9488, created_at: "2026-09-20", class_name: "فيزياء 3ث — السبت", grade: "الثالث الثانوي", subject: "فيزياء", monthly_fee: 350, teacher: "أ. محمد عبد الله",
      lessons: L("p", [["مقدمة: التيار الكهربي وقانون أوم", 42], ["توصيل المقاومات على التوالي والتوازي", 55], ["قانونا كيرشوف", 48], ["التأثير المغناطيسي للتيار", 51], ["الحث الكهرومغناطيسي", 60], ["دوائر التيار المتردد", 58]]),
    },
    {
      id: "demo-chem", title: "الكيمياء — الثالث الثانوي", description: "تأسيس قوي في الكيمياء العضوية والتحليلية مع تجارب مصورة.",
      icon: "🧪", color: 0xff0ea5e9, created_at: "2026-09-18", class_name: "كيمياء 3ث — الأحد", grade: "الثالث الثانوي", subject: "كيمياء", monthly_fee: 320, teacher: "أ. سارة حسن",
      lessons: L("c", [["العناصر الانتقالية", 45], ["التحليل الكيميائي", 50], ["الاتزان الكيميائي", 47], ["الكيمياء الكهربية", 53], ["الكيمياء العضوية: الهيدروكربونات", 62]]),
    },
    {
      id: "demo-math", title: "الرياضيات البحتة", description: "التفاضل والتكامل خطوة بخطوة مع تدريبات تفاعلية بعد كل درس.",
      icon: "📐", color: 0xfff59e0b, created_at: "2026-09-15", class_name: "رياضيات 3ث — الإثنين", grade: "الثالث الثانوي", subject: "رياضيات", monthly_fee: 300, teacher: "أ. أحمد سمير",
      lessons: L("m", [["النهايات والاتصال", 40], ["قواعد الاشتقاق", 52], ["تطبيقات التفاضل", 49], ["التكامل المحدود", 56]]),
    },
    {
      id: "demo-english", title: "English — Grammar & Writing", description: "قواعد اللغة الإنجليزية والكتابة الإبداعية مع تدريب على الترجمة.",
      icon: "🗣️", color: 0xffe11d48, created_at: "2026-09-10", class_name: "إنجليزي 2ث — الثلاثاء", grade: "الثاني الثانوي", subject: "لغة إنجليزية", monthly_fee: 250, teacher: "Mr. Omar Adel",
      lessons: L("e", [["Tenses review", 38], ["Conditionals", 44], ["Passive voice", 41], ["Essay writing", 50], ["Translation skills", 46]]),
    },
    {
      id: "demo-arabic", title: "اللغة العربية — النحو والبلاغة", description: "تبسيط النحو والبلاغة والأدب بأسلوب ممتع وخرائط ذهنية.",
      icon: "📖", color: 0xff8b5cf6, created_at: "2026-09-05", class_name: "عربي 3ث — الأربعاء", grade: "الثالث الثانوي", subject: "لغة عربية", monthly_fee: 280, teacher: "أ. منى إبراهيم",
      lessons: L("a", [["الإعراب التقديري", 35], ["أسلوب الشرط", 43], ["التشبيه والاستعارة", 39], ["الأدب في العصر الحديث", 48]]),
    },
    {
      id: "demo-bio", title: "الأحياء", description: "الدعامة والحركة والتكاثر والوراثة بالرسوم التوضيحية.",
      icon: "🔬", color: 0xff10b981, created_at: "2026-09-01", class_name: "أحياء 3ث — الخميس", grade: "الثالث الثانوي", subject: "أحياء", monthly_fee: 300, teacher: "د. هبة مصطفى",
      lessons: L("b", [["الدعامة في الكائنات الحية", 44], ["الحركة", 40], ["التكاثر", 52], ["الوراثة الجزيئية", 58]]),
    },
  ],
};
