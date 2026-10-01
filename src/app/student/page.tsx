"use client";

import Link from "next/link";
import { useState } from "react";
import { BookOpen, CalendarDays, CheckCircle2, ChevronLeft, FileText, Play, Star, Bell } from "lucide-react";
import { usePortal } from "@/lib/student";
import { Fmt } from "@/lib/fmt";
import { Card, EmptyState, Progress, Ring, SectionTitle } from "@/components/ui";

export default function StudentHome() {
  const { data } = usePortal();
  const progress = data.totalLessons ? (data.completedLessons / data.totalLessons) * 100 : 0;
  const last = data.courses.find((c) => c.id === data.lastCourseId) ?? data.courses[0];
  const avg = data.subjects.length ? data.subjects.reduce((a, s) => a + s.pct, 0) / data.subjects.length : 0;
  const [now] = useState(() => Date.now());
  const nextLesson = data.events.find((e) => e.type === "lesson" && e.date.getTime() >= now - 3600000);
  const nextExam = data.exams.find((e) => e.status === "upcoming");
  const hour = new Date(now).getHours();
  const greeting = hour < 12 ? "صباح الخير" : hour < 18 ? "مساء النور" : "مساء الخير";

  const stats = [
    { icon: BookOpen, label: "الكورسات", value: data.courses.length, from: "#0D9488", to: "#0F766E" },
    { icon: CheckCircle2, label: "الدروس المنتهية", value: data.completedLessons, from: "#10B981", to: "#059669" },
    { icon: FileText, label: "الامتحانات", value: data.exams.length, from: "#F59E0B", to: "#EA580C" },
    { icon: Star, label: "متوسط الدرجات", value: `${Math.round(avg)}%`, from: "#EC4899", to: "#BE185D" },
  ];

  return (
    <>
      {/* Welcome */}
      <div className="relative overflow-hidden rounded-[30px] bg-welcome p-6 text-white shadow-[0_24px_50px_-20px_rgba(13,148,136,0.8)] animate-in md:p-8">
        <div className="absolute -top-16 -end-12 size-60 rounded-full bg-white/10" />
        <div className="absolute -bottom-20 end-40 size-40 rounded-full bg-white/[0.07]" />
        <div className="relative flex flex-wrap items-center gap-6">
          <div className="min-w-0 flex-1">
            <span className="rounded-full bg-white/16 px-3 py-1 text-xs font-bold">{greeting} 👋</span>
            <h1 className="mt-3 truncate text-3xl font-black md:text-4xl">{data.student.name}</h1>
            <p className="mt-1 text-white/85">استمر في التعلم وحقق أهدافك 🎯</p>
          </div>
          <Ring value={progress} size={104} stroke={9} color="#fff" track="rgba(255,255,255,0.2)">
            <div className="text-center"><div className="text-2xl font-black">{Math.round(progress)}%</div><div className="text-[11px] text-white/80">إنجاز</div></div>
          </Ring>
        </div>
        {last && (
          <div className="relative mt-6 flex items-center gap-3 rounded-3xl border border-white/20 bg-white/14 p-3">
            <div className="grid size-12 place-items-center rounded-2xl bg-white/20 text-2xl">{last.icon}</div>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-white/70">تابع من حيث توقفت</div>
              <div className="truncate font-extrabold">{last.title}</div>
            </div>
            <Link href={`/student/courses/${last.id}`} className="flex items-center gap-1 rounded-2xl bg-white px-4 py-2.5 text-sm font-extrabold text-primary-2 shadow-lg transition hover:-translate-y-0.5">
              استكمال <Play className="size-4 fill-current" />
            </Link>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s, i) => (
          <div key={s.label} className="relative h-32 overflow-hidden rounded-[24px] p-4 text-white shadow-lg animate-in" style={{ background: `linear-gradient(135deg, ${s.from}, ${s.to})`, animationDelay: `${i * 70}ms`, boxShadow: `0 14px 28px -14px ${s.from}` }}>
            <s.icon className="absolute -bottom-4 -end-4 size-24 text-white/15" />
            <div className="grid size-10 place-items-center rounded-2xl bg-white/22"><s.icon className="size-5" /></div>
            <div className="mt-3 text-2xl font-black leading-none">{s.value}</div>
            <div className="mt-1 text-xs font-semibold text-white/90">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Next lesson + exam */}
        <div>
          <SectionTitle action={<Link href="/student/schedule" className="text-sm font-bold text-primary">الجدول</Link>}>القادم</SectionTitle>
          <div className="space-y-3">
            {nextLesson ? (
              <Card className="flex items-center gap-4 !p-4">
                <div className="grid size-14 place-items-center rounded-2xl text-white" style={{ background: nextLesson.color }}><CalendarDays className="size-7" /></div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-muted">الحصة القادمة</div>
                  <div className="truncate text-lg font-extrabold">{nextLesson.title}</div>
                  <div className="text-sm text-muted">{Fmt.weekday(nextLesson.date)} {Fmt.date(nextLesson.date)} • {nextLesson.time}</div>
                </div>
              </Card>
            ) : <Card><EmptyState icon={CalendarDays} message="لا توجد حصص قادمة في جدولك حالياً" /></Card>}
            {nextExam && (
              <Card className="flex items-center gap-4 !p-4">
                <div className="grid size-14 place-items-center rounded-2xl bg-warning/15 text-warning"><FileText className="size-7" /></div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-muted">الامتحان القادم</div>
                  <div className="truncate text-lg font-extrabold">{nextExam.exam.title}</div>
                  <div className="text-sm text-muted">{nextExam.exam.exam_date ? Fmt.date(nextExam.exam.exam_date) : "الموعد غير محدد"}</div>
                </div>
                {nextExam.exam.exam_date && <div className="rounded-2xl bg-warning/15 px-3 py-2 text-center text-warning"><div className="text-xl font-black leading-none">{nextExam.daysLeft}</div><div className="text-[10px] font-bold">يوم</div></div>}
              </Card>
            )}
          </div>

          <SectionTitle action={<Link href="/student/courses" className="text-sm font-bold text-primary">الكل</Link>}>تقدمي في الكورسات</SectionTitle>
          <Card className="space-y-4">
            {data.courses.length === 0 ? <EmptyState icon={BookOpen} message="لا توجد كورسات متاحة بعد" /> : data.courses.slice(0, 5).map((c) => {
              const pct = c.lessons.length ? (c.done / c.lessons.length) * 100 : 0;
              return (
                <Link key={c.id} href={`/student/courses/${c.id}`} className="block">
                  <div className="mb-1.5 flex items-center gap-2 text-sm">
                    <span>{c.icon}</span><span className="flex-1 truncate font-bold">{c.title}</span><span className="font-black" style={{ color: c.color }}>{Math.round(pct)}%</span>
                  </div>
                  <Progress value={pct} color={c.color} />
                </Link>
              );
            })}
          </Card>
        </div>

        {/* Notifications + achievements */}
        <div>
          <SectionTitle action={<Link href="/student/notifications" className="text-sm font-bold text-primary">الكل</Link>}>آخر الإشعارات</SectionTitle>
          <Card padded={false} className="divide-y divide-line">
            {data.notifications.length === 0 ? <EmptyState icon={Bell} message="لا توجد إشعارات" /> : data.notifications.slice(0, 5).map((n) => (
              <div key={n.id} className="flex items-start gap-3 p-4">
                <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${n.is_read ? "bg-line" : "bg-primary"}`} />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-bold">{n.title}</div>
                  <div className="line-clamp-1 text-sm text-muted">{n.body}</div>
                </div>
                <span className="shrink-0 text-xs text-muted">{Fmt.timeAgo(n.created_at)}</span>
              </div>
            ))}
          </Card>

          <SectionTitle>إنجازاتي</SectionTitle>
          {data.achievements.length === 0 ? <Card><EmptyState message="واصل التفوق لتحصل على أول وسام 🏆" icon={Star} /></Card> : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {data.achievements.map((a) => (
                <div key={a.id} className="rounded-3xl border border-line bg-surface p-4 text-center shadow-soft" style={{ background: `linear-gradient(160deg, ${a.color}1f, transparent 70%)` }}>
                  <div className="text-4xl">{a.emoji}</div>
                  <div className="mt-2 font-extrabold">{a.title}</div>
                  {a.description && <div className="mt-0.5 text-xs text-muted">{a.description}</div>}
                </div>
              ))}
            </div>
          )}
          <Link href="/student/grades" className="mt-6 flex items-center justify-between rounded-3xl bg-hero p-5 text-white shadow-soft">
            <div><div className="text-sm text-white/80">متوسط درجاتك</div><div className="text-3xl font-black">{Math.round(avg)}%</div></div>
            <ChevronLeft className="size-6" />
          </Link>
        </div>
      </div>
    </>
  );
}
