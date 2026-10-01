"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ListVideo, Search, Sparkles } from "lucide-react";
import { useAsync } from "@/lib/hooks";
import { loadCatalog } from "@/lib/catalog";
import { BrandStripe, CourseCard, DemoBanner, SiteFooter, SiteHeader } from "@/components/site";
import { EmptyState, Skeleton, cx } from "@/components/ui";

export default function CoursesPage() {
  return (
    <Suspense fallback={null}>
      <CoursesInner />
    </Suspense>
  );
}

function CoursesInner() {
  const params = useSearchParams();
  const catalog = useAsync(() => loadCatalog(), []);
  const [q, setQ] = useState(params.get("q") ?? "");
  const [grade, setGrade] = useState("all");
  const courses = useMemo(() => catalog.data?.courses ?? [], [catalog.data]);
  const grades = useMemo(() => [...new Set(courses.map((c) => c.grade).filter(Boolean))], [courses]);
  const shown = courses.filter((c) => {
    const t = q.trim();
    if (grade !== "all" && c.grade !== grade) return false;
    if (!t) return true;
    return [c.title, c.subject, c.class_name, c.teacher, c.description].some((x) => x?.includes(t)) || c.lessons.some((l) => l.title.includes(t));
  });

  return (
    <div className="min-h-screen bg-bg">
      {catalog.data?.demo && <DemoBanner />}
      <SiteHeader />
      <section className="bg-soft-hero relative overflow-hidden border-b border-slate-200/70 py-14 dark:border-line">
        <div className="pointer-events-none absolute -top-32 right-[10%] size-[420px] rounded-full bg-teal-300/25 blur-[120px]" />
        <div className="grid-lines pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative mx-auto max-w-4xl space-y-5 px-4 text-center" data-reveal-stagger="110">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white/90 px-4 py-1.5 text-xs font-black text-teal-800 shadow-sm dark:border-teal-900 dark:bg-surface dark:text-teal-300">
            <ListVideo className="size-4 text-amber-500" /> {courses.length} كورس • {courses.reduce((a, c) => a + c.lessons.length, 0)} درس
          </div>
          <h1 data-reveal="blur" className="text-4xl font-black text-navy sm:text-5xl dark:text-white">الكورسات <span className="shimmer-text">والدروس</span></h1>
          <BrandStripe className="stripe-grow mx-auto h-1.5 w-24 overflow-hidden rounded-full" />
          <p className="text-slate-600 dark:text-muted">اختر الكورس لعرض كل دروسه. مشاهدة الدروس متاحة للطلاب المسجلين في المجموعة.</p>
          <div className="mx-auto flex max-w-2xl items-center rounded-2xl border-2 border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/[0.06] focus-within:border-teal-400 dark:border-line dark:bg-surface">
            <Search className="ms-3 size-5 shrink-0 text-teal-600" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث باسم الكورس أو الدرس أو المدرس..." className="w-full bg-transparent px-3 py-2.5 text-sm font-semibold text-ink placeholder-slate-400 outline-none" />
          </div>
          {grades.length > 1 && (
            <div className="flex flex-wrap justify-center gap-2 pt-1">
              {["all", ...grades].map((g) => (
                <button key={g} onClick={() => setGrade(g)} className={cx("rounded-full border px-5 py-2 text-xs font-black transition-all cursor-pointer", grade === g ? "border-transparent bg-navy text-white shadow-lg" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-line dark:bg-surface dark:text-muted")}>
                  {g === "all" ? "جميع الصفوف" : g}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        {catalog.loading && !catalog.data ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-[440px] rounded-[2rem]" />)}</div>
        ) : shown.length === 0 ? (
          <EmptyState icon={Sparkles} message={courses.length ? "لا توجد نتائج مطابقة للبحث" : "لا توجد كورسات منشورة حالياً"} />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" data-reveal-stagger="120" data-reveal-child="flip">
            {shown.map((c) => <CourseCard key={c.id} c={c} currency={catalog.data?.center?.currency} />)}
          </div>
        )}
      </section>
      <SiteFooter phone={catalog.data?.center?.contact_phone} />
    </div>
  );
}
