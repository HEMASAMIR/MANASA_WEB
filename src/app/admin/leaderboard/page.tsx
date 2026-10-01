"use client";

import Link from "next/link";
import { useState } from "react";
import { Crown, Medal, Trophy } from "lucide-react";
import { classApi, reportApi } from "@/lib/api";
import { useAsync } from "@/lib/hooks";
import { Fmt } from "@/lib/fmt";
import { ClassSelect } from "@/components/shared";
import { Async, Avatar, Card, Field, PageHeader, Progress, cx } from "@/components/ui";

const PODIUM = [
  { c: "#F59E0B", h: "h-40", label: "الأول" },
  { c: "#94A3B8", h: "h-32", label: "الثاني" },
  { c: "#D97706", h: "h-24", label: "الثالث" },
];

export default function LeaderboardPage() {
  const classes = useAsync(() => classApi.list(), []);
  const [classId, setClassId] = useState<string | null>(null);
  const state = useAsync(() => reportApi.leaderboard(classId, 50), [classId]);

  return (
    <>
      <PageHeader title="لوحة الشرف" icon={Trophy} subtitle="ترتيب الطلاب حسب متوسط الدرجات ثم نسبة الحضور" />
      <Card className="mb-6 max-w-md"><Field label="المجموعة"><ClassSelect classes={classes.data ?? []} value={classId} onChange={setClassId} allLabel="كل المجموعات" /></Field></Card>
      <Async state={state} empty={(l) => l.length === 0} emptyMessage="لا توجد درجات كافية لبناء الترتيب بعد" emptyIcon={Trophy}>
        {(rows) => {
          const top = rows.slice(0, 3);
          const order = [top[1], top[0], top[2]].filter(Boolean);
          return (
            <>
              <div className="relative mb-8 overflow-hidden rounded-[32px] bg-hero px-4 pt-10 text-white shadow-soft">
                <div className="absolute -top-20 -start-10 size-60 rounded-full bg-white/10" />
                <div className="relative mx-auto flex max-w-2xl items-end justify-center gap-3 sm:gap-6">
                  {order.map((r) => {
                    const idx = top.indexOf(r);
                    const p = PODIUM[idx];
                    return (
                      <Link key={r.student_id} href={`/admin/students/${r.student_id}`} className="flex w-28 flex-col items-center sm:w-40">
                        {idx === 0 && <Crown className="mb-1 size-8 text-[#FCD34D] animate-float" />}
                        <div className="rounded-full p-1" style={{ background: p.c }}><Avatar name={r.name} size={idx === 0 ? 76 : 62} /></div>
                        <div className="mt-2 w-full truncate text-center font-extrabold">{r.name}</div>
                        <div className="text-sm text-white/80">{Fmt.pct(r.avg_percent)}</div>
                        <div className={cx("mt-3 grid w-full place-items-center rounded-t-3xl text-3xl font-black", p.h)} style={{ background: `linear-gradient(180deg, ${p.c}, ${p.c}55)` }}>{idx + 1}</div>
                      </Link>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2.5">
                {rows.map((r) => (
                  <Link key={r.student_id} href={`/admin/students/${r.student_id}`} className="flex items-center gap-4 rounded-3xl border border-line bg-surface p-4 shadow-soft transition hover:border-primary/40 animate-in">
                    <span className={cx("grid size-10 shrink-0 place-items-center rounded-2xl font-black", r.rank <= 3 ? "bg-warning/15 text-warning" : "bg-surface-3 text-muted")}>
                      {r.rank <= 3 ? <Medal className="size-5" /> : r.rank}
                    </span>
                    <Avatar name={r.name} size={44} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-extrabold">{r.name}</div>
                      <div className="truncate text-sm text-muted">{r.class_name ?? ""} {r.grade ? `• ${r.grade}` : ""}</div>
                    </div>
                    <div className="hidden w-48 sm:block">
                      <div className="mb-1 flex justify-between text-xs text-muted"><span>المتوسط</span><span className="font-black text-ink">{Fmt.pct(r.avg_percent)}</span></div>
                      <Progress value={r.avg_percent} />
                    </div>
                    <div className="w-20 text-center">
                      <div className="text-xs text-muted">الحضور</div>
                      <div className="font-black text-success">{Fmt.pct(r.attendance_pct)}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          );
        }}
      </Async>
    </>
  );
}
