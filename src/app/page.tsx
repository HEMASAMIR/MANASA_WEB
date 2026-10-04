"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft, Award, BarChart3, BellRing, BookOpenCheck, CalendarDays, CheckCircle2, CreditCard, GraduationCap, LayoutDashboard,
  MessagesSquare, MonitorPlay, QrCode, Search, ShieldCheck, Smartphone, Sparkles, Users, Zap, PlayCircle, Trophy,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useAsync } from "@/lib/hooks";
import { loadCatalog } from "@/lib/catalog";
import { TRACKS } from "@/lib/education";
import { STAGES } from "@/lib/curriculum";
import { Marquee, RotatingWord } from "@/components/fx";
import { SubjectName } from "@/components/curriculum";
import { CourseGroupBanner, GroupAction, splitCourses } from "@/components/course-groups";
import { APP_NAME } from "@/lib/supabase";
import { homeFor } from "@/lib/types";
import { BrandStripe, CourseCard, DemoBanner, SiteFooter, SiteHeader } from "@/components/site";
import { Skeleton } from "@/components/ui";

const features = [
  { icon: QrCode, cls: "bg-teal-50 text-teal-600 dark:bg-teal-950/50", title: "حضور ذكي بالـ QR", text: "رمز متغير كل 5 ثوانٍ ضد الغش، مع تحقق اختياري من موقع الطالب داخل المركز." },
  { icon: MonitorPlay, cls: "bg-amber-50 text-amber-600 dark:bg-amber-950/50", title: "كورسات ودروس مسجلة", text: "محتوى مرئي منظم لكل مجموعة، ومتابعة تقدم كل طالب درساً بدرس." },
  { icon: BookOpenCheck, cls: "bg-sky-50 text-sky-600 dark:bg-sky-950/50", title: "كويزات تفاعلية", text: "تصحيح تلقائي على السيرفر، توقيت، محاولات متعددة، ومراجعة الإجابات." },
  { icon: BarChart3, cls: "bg-violet-50 text-violet-600 dark:bg-violet-950/50", title: "تقارير وتحليلات", text: "منحنيات الحضور، تنبيهات الغياب المتكرر، وتصدير Excel بضغطة." },
  { icon: CreditCard, cls: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50", title: "المالية والاشتراكات", text: "تجديد الاشتراكات، متابعة المتأخرين في السداد، وإيرادات الشهر." },
  { icon: MessagesSquare, cls: "bg-rose-50 text-rose-600 dark:bg-rose-950/50", title: "تواصل مباشر", text: "محادثات بين المدرس وولي الأمر، إشعارات فورية، ورسائل جماعية." },
];

const portals = [
  { icon: LayoutDashboard, title: "لوحة الإدارة والمدرسين", points: ["إدارة الطلاب والمجموعات والجدول", "الحضور والدرجات والكويزات", "الكورسات والدروس والمالية", "صلاحيات دقيقة للمساعدين"] },
  { icon: GraduationCap, title: "بوابة الطالب", points: ["كورساتي ومشغل الدروس", "حل الكويزات والامتحانات", "الدرجات والجدول الدراسي", "تسجيل الحضور بمسح الـ QR"] },
  { icon: Users, title: "بوابة ولي الأمر", points: ["متابعة حضور الأبناء لحظياً", "الدرجات والتقارير", "حالة الاشتراك والمدفوعات", "التواصل المباشر مع المدرس"] },
];

const SUBJECTS = [...new Map(STAGES.flatMap((s) => s.subjects).map((x) => {
  const name = x.name.replace(" (مستوى رفيع)", "");
  return [name, { name, emoji: x.emoji, color: x.color }] as const;
})).values()];
const RIBBON = [SUBJECTS.slice(0, Math.ceil(SUBJECTS.length / 2)), SUBJECTS.slice(Math.ceil(SUBJECTS.length / 2))];

const ORBIT = [
  { e: "⚛️", c: "#0d9488", pos: "top-[16%] right-[6%]", d: "0s" },
  { e: "🧪", c: "#0ea5e9", pos: "top-[48%] right-[3%]", d: "-3s" },
  { e: "📖", c: "#8b5cf6", pos: "bottom-[14%] right-[9%]", d: "-6s" },
  { e: "📐", c: "#f59e0b", pos: "top-[14%] left-[7%]", d: "-2s" },
  { e: "🧬", c: "#10b981", pos: "top-[46%] left-[3%]", d: "-8s" },
  { e: "💻", c: "#6366f1", pos: "bottom-[16%] left-[10%]", d: "-5s" },
];

export default function Landing() {
  const { profile } = useAuth();
  const router = useRouter();
  const catalog = useAsync(() => loadCatalog(), []);
  const [q, setQ] = useState("");
  const cta = profile ? { href: homeFor(profile.role), label: "الذهاب للوحتي" } : { href: "/register", label: "ابدأ الآن مجاناً" };
  const courses = catalog.data?.courses ?? [];
  const totalLessons = courses.reduce((a, c) => a + c.lessons.length, 0);
  const currency = catalog.data?.center?.currency ?? "ج.م";

  return (
    <div className="min-h-screen overflow-x-clip bg-bg">
      {catalog.data?.demo && <DemoBanner />}
      <SiteHeader />

      {/* ─── Hero ─── */}
      <section className="spotlight bg-soft-hero relative overflow-hidden border-b border-slate-200/70 pt-12 pb-20 lg:pt-16 lg:pb-28 dark:border-line" style={{ "--spot-size": "640px" } as React.CSSProperties}>
        <div className="aurora" />
        <div data-parallax="0.25" className="pointer-events-none absolute -top-32 right-[10%]"><div className="blob-drift size-[520px] rounded-full bg-teal-300/25 blur-[120px]" /></div>
        <div data-parallax="0.12" className="pointer-events-none absolute top-40 left-[5%]"><div className="blob-drift size-[420px] rounded-full bg-amber-300/20 blur-[120px]" style={{ animationDelay: "-5s" }} /></div>
        <div className="grid-lines pointer-events-none absolute inset-0 opacity-40" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 hidden h-[640px] xl:block">
          {ORBIT.map((o) => (
            <span key={o.e} className={`orbit absolute grid size-16 place-items-center rounded-3xl border bg-white/90 text-3xl shadow-xl backdrop-blur dark:bg-surface/90 ${o.pos}`}
              style={{ animationDelay: o.d, borderColor: `${o.c}40`, boxShadow: `0 18px 40px -18px ${o.c}` }}>{o.e}</span>
          ))}
        </div>

        <div className="relative mx-auto max-w-7xl space-y-12 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl space-y-7 text-center" data-reveal-stagger="130">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white/90 px-5 py-2 text-xs font-black text-teal-800 shadow-md shadow-teal-900/5 backdrop-blur sm:text-sm dark:border-teal-900 dark:bg-surface dark:text-teal-300">
              <Sparkles className="size-4 animate-pulse text-amber-500" /> منصة إدارة التعليم والمتابعة الذكية للسناتر والمدارس
            </div>
            <h1 data-reveal="blur" className="text-[2rem] font-black leading-[1.3] tracking-tight text-navy sm:text-5xl lg:text-6xl dark:text-white">
              <span className="block">
                كل مركزك التعليمي في{" "}
                <span className="shimmer-text relative inline-block">
                  {APP_NAME}
                  <BrandStripe className="stripe-grow absolute inset-x-0 -bottom-1 h-1.5 overflow-hidden rounded-full sm:-bottom-2 sm:h-2" />
                </span>
              </span>
              <span className="mt-3 block text-2xl sm:mt-4 sm:text-4xl lg:text-5xl">حضور، كورسات، درجات <RotatingWord words={["ومتابعة", "وكويزات", "وبكالوريا", "وتقارير"]} className="text-amber-500" /></span>
            </h1>
            <p className="mx-auto max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg dark:text-muted">
              الطالب يتعلم من الكورسات والدروس المسجلة ويحل الكويزات، والمدرس يدير الحضور والدرجات، وولي الأمر يتابع كل شيء لحظة بلحظة — من الموبايل أو المتصفح.
            </p>

            <form onSubmit={(e) => { e.preventDefault(); router.push(q.trim() ? `/courses?q=${encodeURIComponent(q.trim())}` : "/courses"); }}>
              <div className="mx-auto flex max-w-2xl items-center rounded-2xl border-2 border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/[0.06] transition-colors focus-within:border-teal-400 dark:border-line dark:bg-surface">
                <Search className="ms-3 size-5 shrink-0 text-teal-600" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث عن كورس أو مادة (فيزياء، كيمياء، إنجليزي...)" className="w-full bg-transparent px-3 py-2 text-sm font-semibold text-ink placeholder-slate-400 outline-none" />
                <button type="submit" className="shine flex shrink-0 items-center gap-1.5 rounded-xl bg-navy dark:bg-teal-600 px-4 py-3 text-xs font-black text-white transition-colors hover:bg-teal-700 sm:px-6 sm:text-sm cursor-pointer">
                  استعرض الكورسات <ArrowLeft className="size-4" />
                </button>
              </div>
            </form>

            <div className="flex flex-wrap items-center justify-center gap-2.5 text-xs sm:text-sm" data-reveal-stagger="90" data-reveal-child="zoom">
              {[
                { icon: PlayCircle, text: `${courses.length || "+"} كورس متاح`, cls: "bg-teal-50 border-teal-200 text-teal-800 dark:bg-teal-500/10 dark:border-teal-400/25 dark:text-teal-300", ic: "text-teal-600" },
                { icon: MonitorPlay, text: `${totalLessons || "+"} درس مسجل`, cls: "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-500/10 dark:border-amber-400/25 dark:text-amber-300", ic: "text-amber-600" },
                { icon: ShieldCheck, text: "بيانات محمية 100%", cls: "bg-sky-50 border-sky-200 text-sky-800 dark:bg-sky-500/10 dark:border-sky-400/25 dark:text-sky-300", ic: "text-sky-600" },
                { icon: Zap, text: "إشعارات فورية لولي الأمر", cls: "bg-violet-50 border-violet-200 text-violet-800 dark:bg-violet-500/10 dark:border-violet-400/25 dark:text-violet-300", ic: "text-violet-600" },
              ].map((p) => (
                <span key={p.text} className={`flex items-center gap-2 rounded-full border px-4 py-2 font-bold transition hover:-translate-y-0.5 hover:shadow-md ${p.cls}`}>
                  <p.icon className={`size-4 ${p.ic}`} /> {p.text}
                </span>
              ))}
            </div>
          </div>

          <div className="grid items-center gap-8 lg:grid-cols-12">
            {/* Why card */}
            <div data-reveal="start" className="relative overflow-hidden rounded-[2rem] bg-hero p-6 text-white shadow-2xl shadow-navy/30 sm:p-8 lg:col-span-6">
              <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "18px 18px" }} />
              <BrandStripe className="absolute inset-x-0 top-0 h-1.5" />
              <div className="relative space-y-6">
                <h3 className="flex items-center gap-3 text-xl font-black sm:text-2xl">
                  <span className="bg-gold grid size-12 shrink-0 place-items-center rounded-2xl text-navy shadow-lg shadow-amber-500/30"><Award className="size-6" /></span>
                  <span>لماذا <span className="text-amber-300">{APP_NAME}</span>؟</span>
                </h3>
                <ol className="space-y-3" data-reveal-stagger="150" data-reveal-child="start">
                  {[
                    { icon: MonitorPlay, t: "كورسات ودروس مسجلة لكل مجموعة", d: "الطالب يذاكر في أي وقت، والمنصة تحفظ تقدمه في كل درس.", bar: "bg-teal-400", ic: "bg-teal-400/15 border-teal-300/30 text-teal-300" },
                    { icon: QrCode, t: "حضور في ثوانٍ وتنبيه فوري", d: "يُرسل إشعار لولي الأمر تلقائياً عند الغياب أو التأخير.", bar: "bg-amber-400", ic: "bg-amber-400/15 border-amber-300/30 text-amber-300" },
                    { icon: Trophy, t: "كويزات تفاعلية ولوحة شرف", d: "تصحيح تلقائي فوري، وترتيب يحفز الطلاب على التفوق.", bar: "bg-sky-400", ic: "bg-sky-400/15 border-sky-300/30 text-sky-300" },
                  ].map((x, i) => (
                    <li key={x.t} className="shine group relative flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-4 transition hover:-translate-x-1 hover:bg-white/[0.11]">
                      <span className={`absolute start-0 top-4 bottom-4 w-1 rounded-e-full opacity-70 ${x.bar}`} />
                      <span className={`wiggle grid size-11 shrink-0 place-items-center rounded-xl border ${x.ic}`}><x.icon className="size-5" /></span>
                      <div className="min-w-0 flex-1">
                        <span className="block text-sm font-black leading-snug sm:text-base">{x.t}</span>
                        <span className="mt-1 block text-xs leading-relaxed text-slate-300 sm:text-[13px]">{x.d}</span>
                      </div>
                      <span className="shrink-0 text-3xl leading-none font-black text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,0.2)]" dir="ltr">{String(i + 1).padStart(2, "0")}</span>
                    </li>
                  ))}
                </ol>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Link href="/courses" className="bg-gold glow-gold shimmer-auto flex items-center justify-center gap-2 rounded-2xl py-4 text-sm font-black text-navy transition-transform hover:-translate-y-0.5">
                    <PlayCircle className="size-4" /> تصفح الكورسات
                  </Link>
                  <Link href={cta.href} className="flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 py-4 text-sm font-black transition-colors hover:bg-white/15">
                    <GraduationCap className="size-4" /> {cta.label}
                  </Link>
                </div>
              </div>
            </div>

            {/* Product preview */}
            <div data-reveal="end" className="lg:col-span-6">
            <div data-tilt="7" className="spotlight relative space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl dark:border-line dark:bg-surface">
              <div className="float-mid absolute -top-5 -start-4 z-10 hidden items-center gap-2 rounded-2xl border border-emerald-200 bg-white px-3 py-2 text-xs font-black text-emerald-700 shadow-xl sm:flex dark:border-emerald-900 dark:bg-surface-2">
                <span className="ping-dot size-2 rounded-full bg-emerald-500" /> تم تسجيل حضور أحمد
              </div>
              <div className="float-fast absolute -bottom-5 -end-3 z-10 hidden items-center gap-2 rounded-2xl border border-amber-200 bg-white px-3 py-2 text-xs font-black text-amber-700 shadow-xl sm:flex dark:border-amber-900 dark:bg-surface-2">
                🏆 درجة الكويز 19 / 20
              </div>
              <div className="float-slow absolute top-1/2 -start-10 z-10 hidden items-center gap-2 rounded-2xl border border-sky-200 bg-white px-3 py-2 text-xs font-black text-sky-700 shadow-xl xl:flex dark:border-sky-900 dark:bg-surface-2">
                🔔 إشعار جديد لولي الأمر
              </div>
              <div className="flex items-center justify-between">
                <span className="rounded-full border border-teal-200 bg-teal-50 px-3.5 py-1 text-xs font-bold text-teal-700">لوحة الطالب</span>
                <span className="flex items-center gap-1 text-xs font-semibold text-amber-700"><Smartphone className="size-3.5 text-amber-500" /> موبايل + ويب</span>
              </div>
              <div className="rounded-2xl bg-welcome p-5 text-white">
                <div className="text-xs text-white/80">صباح الخير 👋</div>
                <div className="mt-1 text-xl font-black">أحمد محمد</div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20"><div className="bar-fill h-full w-[72%] rounded-full bg-amber-300" /></div>
                <div className="mt-1.5 text-xs text-white/85">أنجزت 72% من دروسك</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { i: BookOpenCheck, c: "text-teal-600 bg-teal-50", v: "18/25", l: "درس مكتمل" },
                  { i: CheckCircle2, c: "text-emerald-600 bg-emerald-50", v: "96%", l: "نسبة الحضور" },
                  { i: Trophy, c: "text-amber-600 bg-amber-50", v: "88%", l: "متوسط الدرجات" },
                  { i: CalendarDays, c: "text-sky-600 bg-sky-50", v: "السبت", l: "الحصة القادمة" },
                ].map((s) => (
                  <div key={s.l} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-line dark:bg-surface-2">
                    <span className={`grid size-10 place-items-center rounded-xl ${s.c}`}><s.i className="size-5" /></span>
                    <div><div className="font-black leading-tight text-navy dark:text-white" {...(/^\d+%$/.test(s.v) ? { "data-count": parseInt(s.v), "data-suffix": "%" } : {})}>{s.v}</div><div className="text-[11px] text-slate-500">{s.l}</div></div>
                  </div>
                ))}
              </div>
              <p className="text-center text-[11px] text-muted">مثال توضيحي لواجهة الطالب</p>
            </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Subject ribbon ─── */}
      <section aria-label="المواد" className="border-b border-slate-200/70 bg-surface py-9 dark:border-line">
        <p className="mb-5 flex items-center justify-center gap-2 text-center text-xs font-black text-muted sm:text-sm">
          <Sparkles className="size-4 text-amber-500" /> كل مواد البكالوريا المصرية والثانوية العامة في مكان واحد
        </p>
        <div className="space-y-3">
          {RIBBON.map((row, i) => (
            <Marquee key={i} reverse={i === 1}>
              {row.map((s) => (
                <Link key={s.name} href={`/courses?q=${encodeURIComponent(s.name)}`}
                  className="flex shrink-0 items-center gap-2 rounded-full border bg-white px-4 py-2 text-sm font-bold whitespace-nowrap text-navy shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-surface-2 dark:text-white"
                  style={{ borderColor: `${s.color}40` }}>
                  <span className="grid size-7 place-items-center rounded-full text-base" style={{ background: `${s.color}1f` }}>{s.emoji}</span>
                  <SubjectName n={s.name} />
                </Link>
              ))}
            </Marquee>
          ))}
        </div>
      </section>

      {/* ─── Baccalaureate ─── */}
      <section id="baccalaureate" className="bg-surface pt-20 pb-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div data-reveal="zoom" className="glow-border relative grid items-center gap-8 overflow-hidden rounded-[2rem] bg-hero p-6 text-white shadow-2xl shadow-navy/30 sm:p-10 lg:grid-cols-2">
            <BrandStripe className="absolute inset-x-0 top-0 h-1.5" />
            <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "18px 18px" }} />
            <div className="relative space-y-5">
              <span className="inline-flex items-center gap-2 rounded-full bg-teal-500 px-4 py-1.5 text-xs font-black shadow-lg shadow-teal-500/30">
                <span className="ping-dot size-2 rounded-full bg-white" /> العام الدراسي 2026/2027
              </span>
              <h2 className="text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">دليل <span className="text-amber-300">البكالوريا المصرية</span> والثانوية العامة</h2>
              <p className="leading-8 text-slate-300">المسارات الأربعة، المواد من أولى لتالتة ثانوي، توزيع الـ 600 درجة، مواعيد الفرص الامتحانية — وحاسبة مجموع تفاعلية.</p>
              <div className="flex flex-wrap gap-3">
                <Link href="/baccalaureate#tracks" className="bg-gold glow-gold shimmer-auto inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-black text-navy transition hover:-translate-y-0.5">
                  <GraduationCap className="size-5" /> اكتشف مسارك
                </Link>
                <Link href="/baccalaureate#calculator" className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-black transition hover:bg-white/15">
                  احسب مجموعك <ArrowLeft className="size-4" />
                </Link>
              </div>
            </div>
            <div className="relative grid grid-cols-2 gap-3" data-reveal-stagger="110" data-reveal-child="zoom">
              {TRACKS.map((t) => (
                <Link key={t.id} href="/baccalaureate#tracks" data-tilt="10" className="shine group rounded-3xl border border-white/10 bg-white/[0.06] p-4 transition hover:-translate-y-1 hover:bg-white/[0.12] sm:p-5">
                  <span className="grid size-14 place-items-center rounded-2xl text-3xl transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6" style={{ background: `${t.color}33`, boxShadow: `inset 0 0 0 1px ${t.color}66` }}>{t.emoji}</span>
                  <span className="mt-3 block text-sm font-black leading-snug sm:text-base">{t.name}</span>
                  <span className="mt-1 block text-[11px] font-semibold text-slate-300">{t.g3[0].replace(" (مستوى رفيع)", "")} • {t.g3[1].replace(" (مستوى رفيع)", "")}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Courses ─── */}
      <section id="courses" className="relative border-t border-slate-200 bg-surface py-24 dark:border-line">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-14 max-w-3xl space-y-4 text-center" data-reveal-stagger="110">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-black text-navy shadow-sm dark:border-line dark:bg-surface-2 dark:text-white">
              <Sparkles className="size-4 text-amber-500" /> المحتوى التعليمي للمركز
            </div>
            <h2 className="text-3xl font-black text-navy sm:text-5xl dark:text-white">الكورسات والدروس <span className="ms-2 inline-grid min-w-12 place-items-center rounded-2xl bg-teal-50 px-3 align-middle text-2xl text-teal-600 sm:text-3xl dark:bg-teal-500/15 dark:text-teal-300">{courses.length}</span></h2>
            <BrandStripe className="stripe-grow mx-auto h-1.5 w-24 overflow-hidden rounded-full" />
            <p className="text-sm text-slate-600 sm:text-base dark:text-muted">دروس مسجلة بجودة عالية لكل مجموعة، ومتابعة تقدم الطالب في كل درس، وكويزات بعد كل جزء.</p>
          </div>
          {catalog.loading && !catalog.data ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-[440px] rounded-[2rem]" />)}</div>
          ) : courses.length === 0 ? (
            <p className="text-center text-slate-500">لا توجد كورسات منشورة حالياً.</p>
          ) : (
            <>
              <div className="space-y-16">
                {splitCourses(courses).map(({ group, courses: list }) => (
                  <div key={group.id}>
                    <CourseGroupBanner id={group.id} courses={list}
                      onTrack={(track) => router.push(`/courses?stage=bac2&track=${track}`)}
                      action={<GroupAction href={`/courses?system=${group.id}`}>{group.id === "bac" ? "كل كورسات البكالوريا" : group.id === "ta" ? "كل كورسات الثانوية العامة" : group.id === "other" ? "عرض الكل" : "عرض هذا القسم"}</GroupAction>} />
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" data-reveal-stagger="140" data-reveal-child="flip">
                      {list.slice(0, 3).map((c) => <CourseCard key={c.id} c={c} currency={currency} />)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-12 text-center" data-reveal="zoom">
                <Link href="/courses" className="shimmer-auto inline-flex items-center gap-2 rounded-full bg-navy px-8 py-4 font-black text-white shadow-xl shadow-navy/25 transition hover:-translate-y-0.5">
                  كل الكورسات <ArrowLeft className="size-5" />
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ─── Numbers band ─── */}
      <section className="relative z-10 mx-auto -mb-14 max-w-6xl px-5 pt-16">
        <div data-reveal="zoom" className="glow-border relative overflow-hidden rounded-[28px] bg-hero p-6 text-white shadow-2xl shadow-navy/30 sm:p-8">
          <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "18px 18px" }} />
          <div className="relative grid grid-cols-2 gap-6 lg:grid-cols-4 lg:divide-x lg:divide-x-reverse lg:divide-white/10" data-reveal-stagger="120" data-reveal-child="up">
            {[
              { i: PlayCircle, n: courses.length, l: "كورس منشور", c: "text-teal-300 bg-teal-400/15" },
              { i: MonitorPlay, n: totalLessons, l: "درس مسجل", c: "text-amber-300 bg-amber-400/15" },
              { i: GraduationCap, n: 4, l: "مسارات بكالوريا", c: "text-sky-300 bg-sky-400/15" },
              { i: Users, n: 3, l: "بوابات: إدارة وطالب وولي أمر", c: "text-violet-300 bg-violet-400/15" },
            ].map((x) => (
              <div key={x.l} className="group flex flex-col items-center gap-3 px-2 text-center">
                <span className={`wiggle grid size-12 place-items-center rounded-2xl ${x.c}`}><x.i className="size-6" /></span>
                <div className="text-4xl font-black sm:text-5xl" dir="ltr">
                  {catalog.data ? <span data-count={x.n}>{x.n}</span> : <span className="opacity-50">—</span>}
                </div>
                <div className="text-xs font-bold text-slate-300 sm:text-sm">{x.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="bg-soft-hero pt-28 pb-24">
        <div className="mx-auto max-w-7xl px-5">
          <div className="mx-auto max-w-2xl text-center" data-reveal-stagger="110">
            <h2 className="text-3xl font-black text-navy md:text-5xl dark:text-white">كل الأدوات في <span className="shimmer-text">مكان واحد</span></h2>
            <BrandStripe className="stripe-grow mx-auto mt-4 h-1.5 w-24 overflow-hidden rounded-full" />
            <p className="mt-4 text-lg text-muted">صُممت خصيصاً للسناتر والمدارس في مصر والخليج</p>
          </div>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" data-reveal-stagger="110" data-reveal-child="zoom">
            {features.map((f) => (
              <div key={f.title}>
                <div data-tilt="6" className="spotlight shine group relative h-full overflow-hidden rounded-[28px] border border-slate-200 bg-white p-7 shadow-soft transition-[border-color,box-shadow] duration-300 hover:border-teal-300 hover:shadow-[0_24px_48px_-16px_rgba(15,23,42,0.18)] dark:border-line dark:bg-surface">
                  <span className="pointer-events-none absolute end-6 top-5 text-5xl leading-none font-black text-transparent [-webkit-text-stroke:1.5px_rgba(14,44,78,0.09)] dark:[-webkit-text-stroke:1.5px_rgba(255,255,255,0.08)]">{String(features.indexOf(f) + 1).padStart(2, "0")}</span>
                  <span className={`wiggle grid size-14 place-items-center rounded-2xl transition-transform duration-500 group-hover:scale-110 ${f.cls}`}><f.icon className="size-7" /></span>
                  <h3 className="mt-5 text-xl font-extrabold text-navy dark:text-white">{f.title}</h3>
                  <p className="mt-2 leading-7 text-muted">{f.text}</p>
                  <span className="absolute inset-x-8 bottom-0 h-1 scale-x-0 rounded-t-full bg-gradient-to-l from-teal-400 via-amber-400 to-sky-400 transition-transform duration-500 group-hover:scale-x-100" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section id="how" className="relative overflow-hidden border-t border-slate-200 bg-surface py-24 dark:border-line">
        <div className="mx-auto max-w-7xl px-5">
          <div className="mx-auto max-w-2xl text-center" data-reveal-stagger="110">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-black text-navy shadow-sm dark:border-line dark:bg-surface-2 dark:text-white">
              <Zap className="size-4 text-amber-500" /> إزاي بتشتغل؟
            </div>
            <h2 className="mt-4 text-3xl font-black text-navy md:text-5xl dark:text-white">3 خطوات <span className="shimmer-text">وكل حاجة ماشية</span></h2>
            <BrandStripe className="stripe-grow mx-auto mt-4 h-1.5 w-24 overflow-hidden rounded-full" />
          </div>
          <div className="relative mt-16">
            <div data-reveal="up" className="line-draw absolute inset-x-[17%] top-12 hidden h-1 rounded-full bg-gradient-to-l from-teal-400 via-amber-400 to-sky-400 lg:block" />
            <div className="relative grid gap-12 lg:grid-cols-3 lg:gap-8" data-reveal-stagger="220" data-reveal-child="up">
              {[
                { i: MonitorPlay, c: "#0d9488", t: "المدرس يرفع الكورس", d: "يختار الصف والمسار والمادة، ويرفع الدروس والكويزات في دقائق.", tags: ["بكالوريا", "ثانوية عامة"] },
                { i: BookOpenCheck, c: "#f59e0b", t: "الطالب يذاكر ويحل", d: "يشوف خطة مذاكرة مساره، يكمّل دروسه، ويحل كويزات بنفس شكل الامتحان.", tags: ["خطة مذاكرة", "تصحيح فوري"] },
                { i: BellRing, c: "#0ea5e9", t: "ولي الأمر يتابع لحظة بلحظة", d: "إشعار فوري بالحضور والدرجات، وتقارير توضح مستوى ابنه في كل مادة.", tags: ["إشعارات", "تقارير"] },
              ].map((s, k) => (
                <div key={s.t} className="group flex flex-col items-center text-center">
                  <div className="pulse-ring relative grid size-24 place-items-center rounded-full bg-hero text-white shadow-2xl transition-transform duration-500 group-hover:scale-105" style={{ color: s.c, boxShadow: `0 20px 40px -18px ${s.c}` }}>
                    <s.i className="size-10 text-white" />
                    <span className="bg-gold absolute -top-1 -end-1 grid size-9 place-items-center rounded-full border-4 border-surface text-sm font-black text-navy" dir="ltr">{k + 1}</span>
                  </div>
                  <h3 className="mt-6 text-2xl font-black text-navy dark:text-white">{s.t}</h3>
                  <p className="mt-2 max-w-xs leading-7 text-muted">{s.d}</p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {s.tags.map((x) => <span key={x} className="rounded-full px-3 py-1 text-xs font-black" style={{ color: s.c, background: `${s.c}14` }}>{x}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Portals ─── */}
      <section id="portals" className="border-t border-slate-200 bg-surface py-24 dark:border-line">
        <div className="mx-auto max-w-7xl px-5">
          <div className="mx-auto max-w-2xl text-center" data-reveal-stagger="110">
            <h2 className="text-3xl font-black text-navy md:text-5xl dark:text-white">بوابة لكل مستخدم</h2>
            <BrandStripe className="stripe-grow mx-auto mt-4 h-1.5 w-24 overflow-hidden rounded-full" />
            <p className="mt-4 text-lg text-muted">كل شخص يرى ما يخصه فقط — بصلاحيات محمية من قاعدة البيانات</p>
          </div>
          <div className="mt-14 grid gap-6 lg:grid-cols-3" data-reveal-stagger="160" data-reveal-child="flip">
            {portals.map((p, i) => (
              <div key={p.title}>
              <div data-tilt="6" className={i === 0 ? "glow-teal glow-border relative h-full overflow-hidden rounded-[28px] bg-hero p-8 text-white" : "spotlight h-full rounded-[28px] border border-slate-200 bg-white p-8 shadow-soft transition-colors hover:border-teal-300 dark:border-line dark:bg-surface-2"}>
                {i === 0 && <BrandStripe className="absolute inset-x-0 top-0 h-1.5" />}
                <div className={i === 0 ? "bg-gold grid size-14 place-items-center rounded-2xl text-navy" : "grid size-14 place-items-center rounded-2xl bg-teal-50 text-teal-600"}><p.icon className="size-7" /></div>
                <h3 className={`mt-5 text-2xl font-black ${i === 0 ? "" : "text-navy dark:text-white"}`}>{p.title}</h3>
                <ul className="mt-5 space-y-3">
                  {p.points.map((pt) => (
                    <li key={pt} className="flex items-center gap-2.5 font-semibold">
                      <CheckCircle2 className={i === 0 ? "size-5 text-amber-300" : "size-5 text-teal-600"} />
                      <span className={i === 0 ? "text-white/90" : "text-slate-700 dark:text-ink/85"}>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Security + CTA ─── */}
      <section id="security" className="mx-auto max-w-7xl px-5 py-24">
        <div data-reveal="zoom" className="glow-border relative grid items-center gap-10 overflow-hidden rounded-[32px] bg-hero p-8 text-white shadow-2xl shadow-navy/30 md:p-12 lg:grid-cols-[1fr_auto]">
          <div className="aurora opacity-30" />
          <BrandStripe className="absolute inset-x-0 top-0 h-1.5" />
          <div>
            <div className="flex items-center gap-3">
              <span className="grid size-14 place-items-center rounded-2xl bg-teal-400/15 text-teal-300"><ShieldCheck className="size-7" /></span>
              <h2 className="text-2xl font-black md:text-3xl">بيانات مركزك محمية بالكامل</h2>
            </div>
            <p className="mt-5 max-w-2xl leading-8 text-slate-300">
              كل صلاحية تُفحص داخل قاعدة البيانات نفسها: ولي الأمر لا يرى إلا أبناءه، والمساعد لا يرى إلا ما سمح له به المدرس،
              وروابط الفيديو لا تظهر إلا للطالب المسجل في المجموعة. لكل مركز قاعدة بيانات مستقلة تماماً.
            </p>
          </div>
          <Link href={cta.href} className="bg-gold glow-gold shimmer-auto inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-4 text-lg font-extrabold text-navy transition hover:-translate-y-0.5">
            {cta.label} <ArrowLeft className="size-5" />
          </Link>
        </div>
      </section>

      <SiteFooter phone={catalog.data?.center?.contact_phone} />
    </div>
  );
}
