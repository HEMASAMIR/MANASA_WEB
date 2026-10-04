"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, BookOpen, PlayCircle } from "lucide-react";
import { TRACKS } from "@/lib/education";
import { parseStage } from "@/lib/curriculum";
import type { CatalogCourse } from "@/lib/catalog";

export type GroupId = "bac" | "ta" | "other";

export const COURSE_GROUPS: { id: GroupId; title: string; sub: string; emoji: string; from: string; to: string; accent: string }[] = [
  { id: "bac", title: "كورسات البكالوريا المصرية", sub: "مواد الصف الأول والثاني والثالث الثانوي بالمسارات الأربعة", emoji: "🎓", from: "#0f766e", to: "#0e2c4e", accent: "#fbbf24" },
  { id: "ta", title: "كورسات الثانوية العامة", sub: "مواد الصف الثاني والثالث الثانوي — علمي علوم وعلمي رياضة وأدبي", emoji: "📘", from: "#0369a1", to: "#0e2c4e", accent: "#38bdf8" },
  { id: "other", title: "كورسات أخرى", sub: "مواد وصفوف تانية بيدرّسها المركز", emoji: "📚", from: "#475569", to: "#1e293b", accent: "#cbd5e1" },
];

export const groupOf = (grade: string): GroupId => parseStage(grade)?.system ?? "other";

/** Splits courses into Baccalaureate / Thanaweya Amma / other, keeping only groups that have courses. */
export function splitCourses(courses: CatalogCourse[]) {
  return COURSE_GROUPS.map((g) => ({ group: g, courses: courses.filter((c) => groupOf(c.grade) === g.id) })).filter((x) => x.courses.length);
}

/** Wide banner that opens each group of courses. */
export function CourseGroupBanner({ id, courses, action, onTrack }: {
  id: GroupId;
  courses: CatalogCourse[];
  action?: ReactNode;
  /** Baccalaureate only: called with a track id when a track chip is clicked (omit to hide the chips). */
  onTrack?: (trackId: string) => void;
}) {
  const g = COURSE_GROUPS.find((x) => x.id === id)!;
  const lessons = courses.reduce((a, c) => a + c.lessons.length, 0);
  return (
    <div data-reveal="up" className="glow-border relative mb-7 overflow-hidden rounded-[28px] p-6 text-white shadow-2xl shadow-navy/25 sm:p-8"
      style={{ background: `radial-gradient(ellipse at top right, ${g.accent}33, transparent 55%), linear-gradient(135deg, ${g.from}, ${g.to})` }}>
      <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "18px 18px" }} />
      <span aria-hidden className="float-slow pointer-events-none absolute -bottom-6 end-6 hidden text-[7rem] leading-none opacity-20 sm:block">{g.emoji}</span>
      <div className="relative flex flex-wrap items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <span className="grid size-16 shrink-0 place-items-center rounded-3xl border border-white/20 bg-white/10 text-4xl shadow-xl backdrop-blur">{g.emoji}</span>
          <div>
            <h2 className="text-2xl font-black sm:text-3xl">{g.title}</h2>
            <p className="mt-1 text-sm text-white/75">{g.sub}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-black">
              <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1"><PlayCircle className="size-3.5" style={{ color: g.accent }} /><span dir="ltr">{courses.length}</span> كورس</span>
              <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1"><BookOpen className="size-3.5" style={{ color: g.accent }} /><span dir="ltr">{lessons}</span> درس</span>
            </div>
          </div>
        </div>
        {action}
      </div>
      {id === "bac" && onTrack && (
        <div className="relative mt-6 flex flex-wrap gap-2 border-t border-white/10 pt-5">
          {TRACKS.map((t) => (
            <button key={t.id} onClick={() => onTrack(t.id)}
              className="group flex items-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-3.5 py-2 text-sm font-bold backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/20 cursor-pointer">
              <span className="grid size-7 place-items-center rounded-lg text-base transition-transform group-hover:scale-110" style={{ background: `${t.color}55` }}>{t.emoji}</span>
              {t.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Link-style button used as the banner action. */
export function GroupAction({ href, onClick, children }: { href?: string; onClick?: () => void; children: ReactNode }) {
  const cls = "bg-gold shimmer-auto inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-black text-navy shadow-lg transition hover:-translate-y-0.5 cursor-pointer";
  return href
    ? <Link href={href} className={cls}>{children} <ArrowLeft className="size-4" /></Link>
    : <button onClick={onClick} className={cls}>{children} <ArrowLeft className="size-4" /></button>;
}
