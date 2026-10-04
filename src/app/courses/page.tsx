"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ListVideo, Search, Sparkles } from "lucide-react";
import { useAsync } from "@/lib/hooks";
import { loadCatalog } from "@/lib/catalog";
import { BrandStripe, CourseCard, DemoBanner, SiteFooter, SiteHeader } from "@/components/site";
import { EmptyState, Skeleton, cx } from "@/components/ui";
import { SYSTEMS, STAGES, parseStage, subjectTracks, type SystemId } from "@/lib/curriculum";
import { CourseGroupBanner, GroupAction, splitCourses } from "@/components/course-groups";

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
  const initialStage = STAGES.find((s) => s.id === params.get("stage")) ?? null;
  const sysParam = params.get("system");
  const [system, setSystem] = useState<SystemId | "all" | "other">(initialStage?.system ?? (sysParam === "bac" || sysParam === "ta" || sysParam === "other" ? sysParam : "all"));
  const [stageId, setStageId] = useState<string | null>(initialStage?.id ?? null);
  const [trackId, setTrackId] = useState<string | null>(initialStage?.tracks.some((x) => x.id === params.get("track")) ? params.get("track") : null);
  const courses = useMemo(() => catalog.data?.courses ?? [], [catalog.data]);
  const stageOf = (g: string) => parseStage(g);
  const systemsHere = SYSTEMS.filter((s) => courses.some((c) => stageOf(c.grade)?.system === s.id));
  const hasOther = courses.some((c) => !stageOf(c.grade));
  const stagesHere = STAGES.filter((s) => s.system === system && courses.some((c) => stageOf(c.grade)?.id === s.id));
  const stage = STAGES.find((s) => s.id === stageId) ?? null;
  const pickSystem = (s: typeof system) => { setSystem(s); setStageId(null); setTrackId(null); };
  /** Jump to a Baccalaureate track (grade 11, where every track has its own subject). */
  const pickTrack = (id: string) => {
    setSystem("bac"); setStageId("bac2"); setTrackId(id);
    document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const grouped = system === "all" && !stageId && !trackId && !q.trim();
  const shown = courses.filter((c) => {
    const t = q.trim();
    const cs = stageOf(c.grade);
    if (system === "other" && cs) return false;
    if (system !== "all" && system !== "other" && cs?.system !== system) return false;
    if (stageId && cs?.id !== stageId) return false;
    if (trackId && cs) {
      const tr = subjectTracks(cs, c.subject);
      if (tr.length && !tr.some((x) => x.id === trackId)) return false;
    }
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
          {(systemsHere.length > 0 || hasOther) && (
            <div className="space-y-3 pt-1">
              <div className="flex flex-wrap justify-center gap-2">
                <FilterChip on={system === "all"} onClick={() => pickSystem("all")}>جميع الصفوف</FilterChip>
                {systemsHere.map((s) => <FilterChip key={s.id} on={system === s.id} color={s.color} onClick={() => pickSystem(s.id)}>{s.emoji} {s.name}</FilterChip>)}
                {hasOther && systemsHere.length > 0 && <FilterChip on={system === "other"} onClick={() => pickSystem("other")}>صفوف أخرى</FilterChip>}
              </div>
              {stagesHere.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2">
                  {stagesHere.map((s) => <FilterChip key={s.id} small on={stageId === s.id} onClick={() => { setStageId(stageId === s.id ? null : s.id); setTrackId(null); }}>{s.label.split(" — ")[0]}</FilterChip>)}
                </div>
              )}
              {stage && stage.tracks.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2">
                  {stage.tracks.map((x) => <FilterChip key={x.id} small on={trackId === x.id} color={x.color} onClick={() => setTrackId(trackId === x.id ? null : x.id)}>{x.emoji} {x.name}</FilterChip>)}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <section id="results" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-14 sm:px-6 lg:px-8">
        {catalog.loading && !catalog.data ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-[440px] rounded-[2rem]" />)}</div>
        ) : shown.length === 0 ? (
          <EmptyState icon={Sparkles} message={courses.length ? "لا توجد نتائج مطابقة للبحث" : "لا توجد كورسات منشورة حالياً"} />
        ) : grouped ? (
          // Everything: one section per system, Baccalaureate first
          <div className="space-y-16">
            {splitCourses(shown).map(({ group, courses: list }) => (
              <div key={group.id}>
                <CourseGroupBanner id={group.id} courses={list} onTrack={pickTrack}
                  action={<GroupAction onClick={() => { pickSystem(group.id); document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }); }}>{group.id === "bac" ? "كورسات البكالوريا فقط" : group.id === "ta" ? "كورسات الثانوية العامة فقط" : "عرض الكل"}</GroupAction>} />
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" data-reveal-stagger="120" data-reveal-child="flip">
                  {list.map((c) => <CourseCard key={c.id} c={c} currency={catalog.data?.center?.currency} />)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {system !== "all" && (
              <CourseGroupBanner id={system} courses={shown} onTrack={system === "bac" && !trackId ? pickTrack : undefined}
                action={<GroupAction onClick={() => pickSystem("all")}>كل الكورسات</GroupAction>} />
            )}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" data-reveal-stagger="120" data-reveal-child="flip">
              {shown.map((c) => <CourseCard key={c.id} c={c} currency={catalog.data?.center?.currency} />)}
            </div>
          </>
        )}
      </section>
      <SiteFooter phone={catalog.data?.center?.contact_phone} />
    </div>
  );
}

function FilterChip({ on, color, small, onClick, children }: { on: boolean; color?: string; small?: boolean; onClick(): void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={cx("rounded-full border font-black transition-all cursor-pointer", small ? "px-4 py-1.5 text-[11px]" : "px-5 py-2 text-xs", on ? "border-transparent text-white shadow-lg" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-line dark:bg-surface dark:text-muted", on && !color && "bg-navy dark:bg-teal-600")}
      style={on && color ? { background: color } : undefined}>
      {children}
    </button>
  );
}
