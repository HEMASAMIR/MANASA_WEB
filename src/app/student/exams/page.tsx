"use client";

import { useState } from "react";
import { CalendarDays, Clock, FileText } from "lucide-react";
import { usePortal } from "@/lib/student";
import { Fmt } from "@/lib/fmt";
import { Badge, Card, EmptyState, PageHeader, Ring, TONE_HEX, Tabs } from "@/components/ui";

export default function StudentExams() {
  const { data } = usePortal();
  const [tab, setTab] = useState<"upcoming" | "completed" | "missed">("upcoming");
  const list = data.exams.filter((e) => e.status === tab);
  const count = (s: string) => data.exams.filter((e) => e.status === s).length;

  return (
    <>
      <PageHeader title="الامتحانات" icon={FileText} />
      <Tabs value={tab} onChange={setTab} items={[
        { value: "upcoming", label: "القادمة", count: count("upcoming") },
        { value: "completed", label: "المنتهية", count: count("completed") },
        { value: "missed", label: "الفائتة", count: count("missed") },
      ]} />
      {list.length === 0 ? <EmptyState icon={FileText} message="لا توجد امتحانات هنا" /> : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((e) => {
            const pct = e.score !== null ? (e.score / Number(e.exam.max_score)) * 100 : null;
            return (
              <Card key={e.exam.id} className="flex items-center gap-4 !p-5 animate-in">
                {pct !== null ? (
                  <Ring value={pct} size={70} stroke={8} color={pct >= 85 ? TONE_HEX.success : pct >= 50 ? TONE_HEX.primary : TONE_HEX.danger}><span className="text-sm font-black">{Math.round(pct)}%</span></Ring>
                ) : (
                  <div className="grid size-[70px] shrink-0 place-items-center rounded-3xl text-center" style={{ background: `${e.color}1a`, color: e.color }}>
                    {e.status === "upcoming" && e.exam.exam_date ? <div><div className="text-2xl font-black leading-none">{e.daysLeft}</div><div className="text-[11px] font-bold">{e.daysLeft === 0 ? "اليوم" : "يوم"}</div></div> : <FileText className="size-7" />}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold" style={{ color: e.color }}>{e.subject}</div>
                  <div className="truncate text-lg font-black">{e.exam.title}</div>
                  <div className="mt-1 flex flex-wrap gap-3 text-sm text-muted">
                    <span className="flex items-center gap-1"><CalendarDays className="size-4" />{e.exam.exam_date ? Fmt.date(e.exam.exam_date) : "الموعد غير محدد"}</span>
                    {e.exam.exam_time && <span className="flex items-center gap-1"><Clock className="size-4" />{Fmt.time12(e.exam.exam_time)}</span>}
                  </div>
                </div>
                {e.score !== null ? <div className="text-end"><div className="text-xl font-black">{Fmt.number(e.score)}</div><div className="text-xs text-muted">من {Fmt.number(e.exam.max_score)}</div></div>
                  : <Badge tone={e.status === "missed" ? "danger" : "warning"}>{e.status === "missed" ? "فائت" : "قادم"}</Badge>}
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
