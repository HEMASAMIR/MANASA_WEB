"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Clock, FileText, MapPin } from "lucide-react";
import { usePortal } from "@/lib/student";
import { Fmt } from "@/lib/fmt";
import { Card, EmptyState, PageHeader, cx } from "@/components/ui";

export default function StudentSchedule() {
  const { data } = usePortal();
  const days = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return Array.from({ length: 14 }, (_, i) => new Date(start.getTime() + i * 86400000));
  }, []);
  const [sel, setSel] = useState(0);
  const day = days[sel];
  const items = data.events.filter((e) => e.date.toDateString() === day.toDateString());

  return (
    <>
      <PageHeader title="الجدول الدراسي" icon={CalendarDays} subtitle="حصصك وامتحاناتك خلال الأسبوعين القادمين" />
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {days.map((d, i) => {
          const has = data.events.some((e) => e.date.toDateString() === d.toDateString());
          const on = i === sel;
          return (
            <button key={i} onClick={() => setSel(i)} className={cx("flex w-[68px] shrink-0 flex-col items-center rounded-3xl border py-3 transition cursor-pointer", on ? "border-transparent bg-brand text-white shadow-[0_10px_22px_-10px_rgba(13,148,136,0.9)]" : "border-line bg-surface hover:border-primary/40")}>
              <span className={cx("text-[11px] font-bold", on ? "text-white/80" : "text-muted")}>{i === 0 ? "اليوم" : Fmt.weekday(d).slice(0, 3)}</span>
              <span className="text-2xl font-black">{d.getDate()}</span>
              <span className={cx("mt-1 size-1.5 rounded-full", has ? (on ? "bg-white" : "bg-primary") : "bg-transparent")} />
            </button>
          );
        })}
      </div>
      <h2 className="mb-4 text-lg font-extrabold">{Fmt.weekday(day)} {Fmt.date(day)}</h2>
      {items.length === 0 ? <EmptyState icon={CalendarDays} message="لا توجد حصص أو امتحانات في هذا اليوم" /> : (
        <div className="relative space-y-4 ps-6 before:absolute before:inset-y-2 before:start-2 before:w-0.5 before:bg-line">
          {items.map((e) => (
            <div key={e.id} className="relative animate-in">
              <span className="absolute -start-[22px] top-6 size-4 rounded-full border-4 border-bg" style={{ background: e.color }} />
              <Card className="flex items-center gap-4 !p-4">
                <div className="grid size-14 shrink-0 place-items-center rounded-2xl text-white" style={{ background: e.color }}>{e.type === "exam" ? <FileText className="size-7" /> : <CalendarDays className="size-7" />}</div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold" style={{ color: e.color }}>{e.type === "exam" ? "امتحان" : "حصة"} • {e.subject}</div>
                  <div className="truncate text-lg font-black">{e.title}</div>
                  <div className="mt-0.5 flex flex-wrap gap-3 text-sm text-muted">
                    <span className="flex items-center gap-1"><Clock className="size-4" />{e.time}</span>
                    {e.room && <span className="flex items-center gap-1"><MapPin className="size-4" />{e.room}</span>}
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
