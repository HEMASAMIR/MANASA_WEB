"use client";

import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts";
import { Award, BarChart3, TrendingUp } from "lucide-react";
import { usePortal } from "@/lib/student";
import { Fmt } from "@/lib/fmt";
import { EXAM_KIND_LABEL } from "@/lib/types";
import { Card, EmptyState, PageHeader, Progress, Ring, SectionTitle, StatCard, TONE_HEX } from "@/components/ui";

function grade(p: number) {
  if (p >= 90) return { l: "ممتاز", c: TONE_HEX.success };
  if (p >= 75) return { l: "جيد جداً", c: TONE_HEX.primary };
  if (p >= 65) return { l: "جيد", c: TONE_HEX.info };
  if (p >= 50) return { l: "مقبول", c: TONE_HEX.warning };
  return { l: "ضعيف", c: TONE_HEX.danger };
}

export default function StudentGrades() {
  const { data } = usePortal();
  const graded = [...data.exams.filter((e) => e.score !== null).map((e) => ({ title: e.exam.title, kind: e.exam.kind, subject: e.subject, score: e.score!, max: Number(e.exam.max_score), date: e.exam.exam_date })),
    ...data.quizzes.filter((q) => q.score !== null).map((q) => ({ title: q.exam.title, kind: q.exam.kind, subject: q.subject, score: q.score!, max: Number(q.exam.max_score), date: q.exam.exam_date }))];
  const avg = data.subjects.length ? data.subjects.reduce((a, s) => a + s.pct, 0) / data.subjects.length : 0;
  const best = [...data.subjects].sort((a, b) => b.pct - a.pct)[0];
  const g = grade(avg);

  if (!graded.length) return <><PageHeader title="الدرجات" icon={BarChart3} /><EmptyState icon={BarChart3} message="لا توجد درجات منشورة بعد" /></>;

  return (
    <>
      <PageHeader title="الدرجات" icon={BarChart3} subtitle={`${graded.length} تقييم`} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="flex items-center gap-4">
          <Ring value={avg} size={80} stroke={9} color={g.c}><span className="font-black">{Math.round(avg)}%</span></Ring>
          <div><div className="font-extrabold">المتوسط العام</div><div className="text-sm font-bold" style={{ color: g.c }}>{g.l}</div></div>
        </Card>
        <StatCard label="أفضل مادة" value={best ? best.subject : "—"} icon={Award} tone="success" hint={best ? `${Math.round(best.pct)}%` : undefined} />
        <StatCard label="عدد التقييمات" value={graded.length} icon={TrendingUp} tone="info" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div>
          <SectionTitle>حسب المادة</SectionTitle>
          <Card className="space-y-4">
            {data.subjects.map((s) => (
              <div key={s.subject}>
                <div className="mb-1.5 flex justify-between text-sm"><span className="font-bold">{s.subject}</span><span className="font-black" style={{ color: s.color }}>{Math.round(s.pct)}%</span></div>
                <Progress value={s.pct} color={s.color} className="h-2.5" />
              </div>
            ))}
          </Card>
        </div>
        {data.subjects.length >= 3 && (
          <div>
            <SectionTitle>خريطة المستوى</SectionTitle>
            <Card className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={data.subjects.map((s) => ({ s: s.subject, v: Math.round(s.pct) }))}>
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis dataKey="s" tick={{ fill: "var(--muted)", fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14 }} />
                  <Radar dataKey="v" name="%" stroke="#6D5DFC" fill="#6D5DFC" fillOpacity={0.35} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </Card>
          </div>
        )}
      </div>
      <SectionTitle>كل الدرجات</SectionTitle>
      <div className="grid gap-3 md:grid-cols-2">
        {graded.map((x, i) => {
          const pct = x.max ? (x.score / x.max) * 100 : 0;
          const gg = grade(pct);
          return (
            <Card key={i} className="flex items-center gap-4 !p-4">
              <Ring value={pct} size={58} stroke={6} color={gg.c}><span className="text-xs font-black">{Math.round(pct)}%</span></Ring>
              <div className="min-w-0 flex-1">
                <div className="truncate font-extrabold">{x.title}</div>
                <div className="text-sm text-muted">{x.subject} • {EXAM_KIND_LABEL[x.kind]}{x.date ? ` • ${Fmt.date(x.date)}` : ""}</div>
              </div>
              <div className="text-end"><div className="text-lg font-black">{Fmt.number(x.score)}</div><div className="text-xs text-muted">من {Fmt.number(x.max)}</div></div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
