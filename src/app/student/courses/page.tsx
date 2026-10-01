"use client";

import Link from "next/link";
import { useState } from "react";
import { BookOpen, PlayCircle, User } from "lucide-react";
import { usePortal } from "@/lib/student";
import { EmptyState, PageHeader, Progress, Tabs } from "@/components/ui";
import { StudyPlan } from "@/components/study-plan";

export default function StudentCourses() {
  const { data } = usePortal();
  const [tab, setTab] = useState<"all" | "active" | "done">("all");
  const list = data.courses.filter((c) => tab === "all" || (tab === "done" ? c.lessons.length > 0 && c.done === c.lessons.length : c.done < c.lessons.length || !c.lessons.length));

  return (
    <>
      <PageHeader title="كورساتي" icon={BookOpen} subtitle={`${data.courses.length} كورس • ${data.completedLessons}/${data.totalLessons} درس مكتمل`} />
      <StudyPlan grade={data.student.grade} courses={data.courses} />
      <Tabs value={tab} onChange={setTab} items={[{ value: "all", label: "الكل" }, { value: "active", label: "قيد الدراسة" }, { value: "done", label: "مكتملة" }]} />
      {list.length === 0 ? <EmptyState icon={BookOpen} message="لا توجد كورسات هنا" /> : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((c, i) => {
            const pct = c.lessons.length ? (c.done / c.lessons.length) * 100 : 0;
            return (
              <Link key={c.id} href={`/student/courses/${c.id}`} className="group overflow-hidden rounded-[28px] border border-line bg-surface shadow-soft transition hover:-translate-y-1 animate-in" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="relative grid h-36 place-items-center" style={{ background: `linear-gradient(135deg, color-mix(in srgb, ${c.color} 65%, white), ${c.color})` }}>
                  <span className="text-6xl drop-shadow-lg transition group-hover:scale-110">{c.icon}</span>
                  {c.isNew && <span className="absolute top-3 start-3 rounded-full bg-white px-3 py-1 text-xs font-black" style={{ color: c.color }}>جديد ✨</span>}
                  <span className="absolute bottom-3 end-3 grid size-11 place-items-center rounded-full bg-white/90 opacity-0 shadow-lg transition group-hover:opacity-100" style={{ color: c.color }}><PlayCircle className="size-6" /></span>
                </div>
                <div className="p-5">
                  <h3 className="truncate text-lg font-black">{c.title}</h3>
                  <div className="mt-1 flex items-center gap-1.5 text-sm text-muted"><User className="size-4" /> {c.teacher || c.className}</div>
                  <div className="mt-4 mb-1.5 flex justify-between text-xs font-bold"><span className="text-muted">{c.done} من {c.lessons.length} درس</span><span style={{ color: c.color }}>{Math.round(pct)}%</span></div>
                  <Progress value={pct} color={c.color} />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
