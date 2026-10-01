"use client";

import Link from "next/link";
import { useState } from "react";
import { BadgeCheck, Clock, Lock, Play, Repeat, Trophy } from "lucide-react";
import { usePortal, type PortalQuiz } from "@/lib/student";
import { Fmt } from "@/lib/fmt";
import { EXAM_KIND_LABEL } from "@/lib/types";
import { Badge, Card, EmptyState, PageHeader, Tabs } from "@/components/ui";

function quizState(q: PortalQuiz): { label: string; tone: "success" | "warning" | "danger" | "neutral" | "primary"; canStart: boolean } {
  const now = new Date();
  if (!q.interactiveId) return q.score !== null ? { label: "تم التصحيح", tone: "success", canStart: false } : { label: "ورقي", tone: "neutral", canStart: false };
  if (q.opensAt && now < q.opensAt) return { label: `يفتح ${Fmt.dateTime(q.opensAt)}`, tone: "neutral", canStart: false };
  if (q.closesAt && now > q.closesAt) return { label: "انتهى الموعد", tone: "danger", canStart: false };
  if (q.hasOpenAttempt) return { label: "محاولة جارية", tone: "warning", canStart: true };
  if (q.attemptsUsed >= q.maxAttempts) return { label: "تم الحل", tone: "success", canStart: false };
  return { label: q.attemptsUsed ? "يمكنك المحاولة مجدداً" : "متاح الآن", tone: "primary", canStart: true };
}

export default function StudentQuizzes() {
  const { data } = usePortal();
  const [tab, setTab] = useState<"open" | "done">("open");
  const list = data.quizzes.filter((q) => (tab === "done" ? q.score !== null : q.score === null || quizState(q).canStart));

  return (
    <>
      <PageHeader title="الكويزات والواجبات" icon={BadgeCheck} subtitle="حل الكويزات التفاعلية واعرف نتيجتك فوراً" />
      <Tabs value={tab} onChange={setTab} items={[
        { value: "open", label: "المتاحة", count: data.quizzes.filter((q) => q.score === null || quizState(q).canStart).length },
        { value: "done", label: "المنتهية", count: data.quizzes.filter((q) => q.score !== null).length },
      ]} />
      {list.length === 0 ? <EmptyState icon={BadgeCheck} message={tab === "open" ? "لا توجد كويزات متاحة حالياً 🎉" : "لم تحل أي كويز بعد"} /> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((q, i) => {
            const s = quizState(q);
            const pct = q.score !== null ? (q.score / Number(q.exam.max_score)) * 100 : null;
            const body = (
              <Card className="h-full !p-0 overflow-hidden transition hover:-translate-y-0.5 animate-in">
                <div className="h-1.5" style={{ background: q.color }} />
                <div className="p-5" style={{ animationDelay: `${i * 40}ms` }}>
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold" style={{ color: q.color }}>{q.subject} • {EXAM_KIND_LABEL[q.exam.kind]}</div>
                      <h3 className="mt-1 truncate text-lg font-black">{q.exam.title}</h3>
                    </div>
                    {pct !== null && <div className="rounded-2xl bg-success/12 px-3 py-2 text-center text-success"><div className="text-lg font-black leading-none">{Math.round(pct)}%</div><div className="text-[10px] font-bold">{Fmt.number(q.score)}/{Fmt.number(q.exam.max_score)}</div></div>}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
                    {q.exam.question_count ? <span>{q.exam.question_count} سؤال</span> : null}
                    {q.durationMin && <span className="flex items-center gap-1"><Clock className="size-3.5" />{q.durationMin} دقيقة</span>}
                    {q.interactiveId && <span className="flex items-center gap-1"><Repeat className="size-3.5" />{q.attemptsUsed}/{q.maxAttempts}</span>}
                    {q.closesAt && <span>يغلق {Fmt.dateTime(q.closesAt)}</span>}
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <Badge tone={s.tone}>{s.label}</Badge>
                    {s.canStart ? <span className="flex items-center gap-1.5 rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white"><Play className="size-4 fill-current" />{q.hasOpenAttempt ? "استكمال" : "ابدأ"}</span>
                      : q.score !== null ? <Trophy className="size-5 text-warning" /> : <Lock className="size-5 text-muted" />}
                  </div>
                </div>
              </Card>
            );
            return s.canStart ? <Link key={q.exam.id} href={`/student/quizzes/${q.interactiveId}`}>{body}</Link> : <div key={q.exam.id}>{body}</div>;
          })}
        </div>
      )}
    </>
  );
}
