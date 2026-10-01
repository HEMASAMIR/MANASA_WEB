"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Clock, GraduationCap, ListVideo, Lock, LogIn, PlayCircle, User, Users } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useAsync } from "@/lib/hooks";
import { loadCatalog } from "@/lib/catalog";
import { Fmt } from "@/lib/fmt";
import { homeFor } from "@/lib/types";
import { BrandStripe, CourseCard, DemoBanner, SiteFooter, SiteHeader, courseColor, durationLabel, totalMinutes } from "@/components/site";
import { EmptyState, Skeleton } from "@/components/ui";

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const catalog = useAsync(() => loadCatalog(), []);
  const course = catalog.data?.courses.find((c) => c.id === id);
  const related = (catalog.data?.courses ?? []).filter((c) => c.id !== id).slice(0, 3);
  const currency = catalog.data?.center?.currency ?? "ج.م";

  const action = !profile
    ? { href: "/login", label: "سجّل الدخول لمشاهدة الدروس", icon: LogIn }
    : profile.role === "student"
      ? { href: `/student/courses/${id}`, label: "ابدأ مشاهدة الدروس", icon: PlayCircle }
      : { href: homeFor(profile.role), label: "الذهاب للوحتي", icon: GraduationCap };

  return (
    <div className="min-h-screen bg-bg">
      {catalog.data?.demo && <DemoBanner />}
      <SiteHeader />
      {catalog.loading && !catalog.data ? (
        <div className="mx-auto max-w-7xl space-y-4 px-4 py-10"><Skeleton className="h-64 rounded-[2rem]" /><Skeleton className="h-96 rounded-[2rem]" /></div>
      ) : !course ? (
        <div className="py-20"><EmptyState icon={BookOpen} message="الكورس غير موجود أو لم يعد متاحاً" action={<Link href="/courses" className="rounded-full bg-navy px-6 py-3 font-black text-white">كل الكورسات</Link>} /></div>
      ) : (() => {
        const color = courseColor(course);
        const mins = totalMinutes(course);
        return (
          <>
            {/* Hero band */}
            <section className="relative overflow-hidden text-white" style={{ background: `linear-gradient(135deg, color-mix(in srgb, ${color} 70%, #0e2c4e), #0e2c4e)` }}>
              <div className="dot-pattern absolute inset-0 opacity-10" />
              <div className="absolute -top-24 -end-16 size-80 rounded-full bg-white/10" />
              <div className="absolute -bottom-32 start-20 size-72 rounded-full" style={{ background: `${color}40` }} />
              <BrandStripe className="relative h-1.5" />
              <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1fr_auto] lg:px-8">
                <div data-reveal-stagger="110">
                  <Link href="/courses" className="mb-5 inline-flex items-center gap-1.5 text-sm font-bold text-white/75 hover:text-white"><ArrowRight className="size-4" /> كل الكورسات</Link>
                  <div className="flex flex-wrap gap-2 text-xs font-black">
                    {course.grade && <span className="rounded-full bg-white/15 px-3 py-1">{course.grade}</span>}
                    {course.subject && <span className="rounded-full bg-white/15 px-3 py-1">{course.subject}</span>}
                    <span className="rounded-full bg-amber-400 px-3 py-1 text-navy">{course.class_name}</span>
                  </div>
                  <h1 className="mt-4 text-4xl font-black leading-tight sm:text-5xl">{course.title}</h1>
                  {course.description && <p className="mt-4 max-w-2xl text-lg leading-8 text-white/85">{course.description}</p>}
                  <div className="mt-6 flex flex-wrap gap-5 text-sm font-bold text-white/90">
                    {course.teacher && <span className="flex items-center gap-2"><User className="size-4 text-amber-300" /> {course.teacher}</span>}
                    <span className="flex items-center gap-2"><ListVideo className="size-4 text-amber-300" /> {course.lessons.length} درس</span>
                    {mins > 0 && <span className="flex items-center gap-2"><Clock className="size-4 text-amber-300" /> {durationLabel(mins)}</span>}
                    <span className="flex items-center gap-2"><Users className="size-4 text-amber-300" /> لطلاب المجموعة</span>
                  </div>
                </div>
                <div data-reveal="zoom" className="w-full rounded-[2rem] border border-white/15 bg-white/10 p-6 backdrop-blur lg:w-80">
                  <div className="float-mid grid size-24 place-items-center rounded-3xl bg-white/15 text-6xl">{course.icon || "📚"}</div>
                  {course.monthly_fee > 0 && (
                    <div className="mt-5 flex items-baseline gap-2"><span className="text-4xl font-black">{Fmt.number(course.monthly_fee)}</span><span className="font-bold text-white/80">{currency} / شهرياً</span></div>
                  )}
                  <Link href={action.href} className="bg-gold glow-gold shimmer-auto mt-5 flex items-center justify-center gap-2 rounded-2xl py-4 font-black text-navy transition hover:-translate-y-0.5">
                    <action.icon className="size-5" /> {action.label}
                  </Link>
                  {!profile && <Link href="/register" className="mt-2 flex items-center justify-center gap-2 rounded-2xl border border-white/25 py-3 text-sm font-bold hover:bg-white/10">إنشاء حساب طالب</Link>}
                </div>
              </div>
            </section>

            {/* Lessons */}
            <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_340px] lg:px-8">
              <div data-reveal="up" className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-line dark:bg-surface">
                <div className="border-b border-slate-200 bg-gradient-to-l from-teal-50 to-white px-6 py-5 dark:border-line dark:from-teal-950/30 dark:to-surface">
                  <h2 className="flex items-center gap-2 text-lg font-black text-navy dark:text-white"><ListVideo className="size-5 text-teal-600" /> محتوى الكورس</h2>
                  <p className="mt-0.5 text-xs font-bold text-slate-500">{course.lessons.length} درس{mins > 0 ? ` • ${durationLabel(mins)}` : ""}</p>
                </div>
                {course.lessons.length === 0 ? <EmptyState icon={PlayCircle} message="لم تُضف دروس لهذا الكورس بعد" /> : (
                  <ol className="divide-y divide-slate-100 dark:divide-line" data-reveal-stagger="90" data-reveal-child="start">
                    {course.lessons.map((l, i) => (
                      <li key={l.id}>
                        <Link href={action.href} className="group flex items-center gap-4 border-s-4 border-transparent px-5 py-4 transition-colors hover:border-teal-500 hover:bg-teal-50/60 dark:hover:bg-teal-950/20">
                          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-slate-100 text-sm font-black text-slate-500 transition group-hover:bg-teal-600 group-hover:text-white dark:bg-surface-3">{i + 1}</span>
                          <span className="relative grid aspect-video w-24 shrink-0 place-items-center overflow-hidden rounded-lg" style={{ background: `linear-gradient(135deg, color-mix(in srgb, ${color} 60%, white), ${color})` }}>
                            <PlayCircle className="size-7 text-white/90" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block font-bold leading-snug text-slate-800 dark:text-ink">{l.title}</span>
                            {l.duration_seconds > 0 && <span className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-slate-500"><Clock className="size-3" /> {durationLabel(Math.round(l.duration_seconds / 60))}</span>}
                          </span>
                          {profile?.role === "student" && !l.is_locked ? <PlayCircle className="size-5 text-teal-600" /> : <Lock className="size-4 text-slate-400" />}
                        </Link>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
              <aside className="space-y-4" data-reveal-stagger="160" data-reveal-child="end">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-line dark:bg-surface">
                  <h3 className="font-black text-navy dark:text-white">ماذا ستحصل عليه؟</h3>
                  <ul className="mt-4 space-y-3 text-sm font-semibold text-slate-700 dark:text-ink/85">
                    {["دروس مسجلة تشاهدها في أي وقت", "حفظ تقدمك في كل درس", "كويزات تفاعلية بتصحيح فوري", "متابعة من المدرس وولي الأمر"].map((x) => (
                      <li key={x} className="flex items-center gap-2"><CheckCircle2 className="size-5 text-teal-600" /> {x}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-3xl bg-hero p-6 text-white">
                  <h3 className="font-black">مسجل في المجموعة؟</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">سجّل دخولك بحساب الطالب، أو أنشئ حساباً بكود الطالب من إدارة المركز.</p>
                  <Link href={action.href} className="mt-4 flex items-center justify-between rounded-2xl bg-white/10 px-4 py-3 text-sm font-black hover:bg-white/15">{action.label} <ArrowLeft className="size-4" /></Link>
                </div>
              </aside>
            </section>

            {related.length > 0 && (
              <section className="border-t border-slate-200 bg-surface py-14 dark:border-line">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                  <h2 data-reveal="blur" className="mb-8 text-2xl font-black text-navy dark:text-white">كورسات أخرى</h2>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" data-reveal-stagger="140" data-reveal-child="flip">{related.map((c) => <CourseCard key={c.id} c={c} currency={currency} />)}</div>
                </div>
              </section>
            )}
          </>
        );
      })()}
      <SiteFooter phone={catalog.data?.center?.contact_phone} />
    </div>
  );
}
