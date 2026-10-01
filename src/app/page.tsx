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
    <div className="min-h-screen overflow-x-hidden bg-bg">
      {catalog.data?.demo && <DemoBanner />}
      <SiteHeader />

      {/* ─── Hero ─── */}
      <section className="bg-soft-hero relative overflow-hidden border-b border-slate-200/70 pt-12 pb-20 lg:pt-16 lg:pb-28 dark:border-line">
        <div className="pointer-events-none absolute -top-32 right-[10%] size-[520px] rounded-full bg-teal-300/25 blur-[120px]" />
        <div className="pointer-events-none absolute top-40 left-[5%] size-[420px] rounded-full bg-amber-300/20 blur-[120px]" />
        <div className="grid-lines pointer-events-none absolute inset-0 opacity-40" />

        <div className="relative mx-auto max-w-7xl space-y-12 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl space-y-7 text-center animate-in">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white/90 px-5 py-2 text-xs font-black text-teal-800 shadow-md shadow-teal-900/5 backdrop-blur sm:text-sm dark:border-teal-900 dark:bg-surface dark:text-teal-300">
              <Sparkles className="size-4 animate-pulse text-amber-500" /> منصة إدارة التعليم والمتابعة الذكية للسناتر والمدارس
            </div>
            <h1 className="text-[2rem] font-black leading-[1.3] tracking-tight text-navy sm:text-5xl lg:text-6xl dark:text-white">
              <span className="block">
                كل مركزك التعليمي في{" "}
                <span className="relative inline-block text-teal-600 dark:text-teal-400">
                  {APP_NAME}
                  <BrandStripe className="absolute inset-x-0 -bottom-1 h-1.5 overflow-hidden rounded-full sm:-bottom-2 sm:h-2" />
                </span>
              </span>
              <span className="mt-3 block text-2xl sm:mt-4 sm:text-4xl lg:text-5xl">حضور، كورسات، درجات <span className="text-amber-500">ومتابعة</span></span>
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

            <div className="flex flex-wrap items-center justify-center gap-2.5 text-xs sm:text-sm">
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
            <div className="relative overflow-hidden rounded-[2rem] bg-hero p-6 text-white shadow-2xl shadow-navy/30 sm:p-8 lg:col-span-6">
              <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "18px 18px" }} />
              <BrandStripe className="absolute inset-x-0 top-0 h-1.5" />
              <div className="relative space-y-6">
                <h3 className="flex items-center gap-3 text-xl font-black sm:text-2xl">
                  <span className="bg-gold grid size-12 shrink-0 place-items-center rounded-2xl text-navy shadow-lg shadow-amber-500/30"><Award className="size-6" /></span>
                  <span>لماذا <span className="text-amber-300">{APP_NAME}</span>؟</span>
                </h3>
                <ol className="space-y-3">
                  {[
                    { icon: MonitorPlay, t: "كورسات ودروس مسجلة لكل مجموعة", d: "الطالب يذاكر في أي وقت، والمنصة تحفظ تقدمه في كل درس.", bar: "bg-teal-400", ic: "bg-teal-400/15 border-teal-300/30 text-teal-300" },
                    { icon: QrCode, t: "حضور في ثوانٍ وتنبيه فوري", d: "يُرسل إشعار لولي الأمر تلقائياً عند الغياب أو التأخير.", bar: "bg-amber-400", ic: "bg-amber-400/15 border-amber-300/30 text-amber-300" },
                    { icon: Trophy, t: "كويزات تفاعلية ولوحة شرف", d: "تصحيح تلقائي فوري، وترتيب يحفز الطلاب على التفوق.", bar: "bg-sky-400", ic: "bg-sky-400/15 border-sky-300/30 text-sky-300" },
                  ].map((x, i) => (
                    <li key={x.t} className="shine group relative flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-4 transition hover:-translate-x-1 hover:bg-white/[0.11]">
                      <span className={`absolute start-0 top-4 bottom-4 w-1 rounded-e-full opacity-70 ${x.bar}`} />
                      <span className={`grid size-11 shrink-0 place-items-center rounded-xl border ${x.ic}`}><x.icon className="size-5" /></span>
                      <div className="min-w-0 flex-1">
                        <span className="block text-sm font-black leading-snug sm:text-base">{x.t}</span>
                        <span className="mt-1 block text-xs leading-relaxed text-slate-300 sm:text-[13px]">{x.d}</span>
                      </div>
                      <span className="shrink-0 text-3xl leading-none font-black text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,0.2)]" dir="ltr">{String(i + 1).padStart(2, "0")}</span>
                    </li>
                  ))}
                </ol>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Link href="/courses" className="bg-gold flex items-center justify-center gap-2 rounded-2xl py-4 text-sm font-black text-navy shadow-xl shadow-amber-500/25 transition-transform hover:-translate-y-0.5">
                    <PlayCircle className="size-4" /> تصفح الكورسات
                  </Link>
                  <Link href={cta.href} className="flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 py-4 text-sm font-black transition-colors hover:bg-white/15">
                    <GraduationCap className="size-4" /> {cta.label}
                  </Link>
                </div>
              </div>
            </div>

            {/* Product preview */}
            <div className="relative space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl lg:col-span-6 dark:border-line dark:bg-surface">
              <div className="flex items-center justify-between">
                <span className="rounded-full border border-teal-200 bg-teal-50 px-3.5 py-1 text-xs font-bold text-teal-700">لوحة الطالب</span>
                <span className="flex items-center gap-1 text-xs font-semibold text-amber-700"><Smartphone className="size-3.5 text-amber-500" /> موبايل + ويب</span>
              </div>
              <div className="rounded-2xl bg-welcome p-5 text-white">
                <div className="text-xs text-white/80">صباح الخير 👋</div>
                <div className="mt-1 text-xl font-black">أحمد محمد</div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20"><div className="h-full w-[72%] rounded-full bg-amber-300" /></div>
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
                    <div><div className="font-black leading-tight text-navy dark:text-white">{s.v}</div><div className="text-[11px] text-slate-500">{s.l}</div></div>
                  </div>
                ))}
              </div>
              <p className="text-center text-[11px] text-muted">مثال توضيحي لواجهة الطالب</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Courses ─── */}
      <section id="courses" className="relative border-t border-slate-200 bg-surface py-24 dark:border-line">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-14 max-w-3xl space-y-4 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-black text-navy shadow-sm dark:border-line dark:bg-surface-2 dark:text-white">
              <Sparkles className="size-4 text-amber-500" /> المحتوى التعليمي للمركز
            </div>
            <h2 className="text-3xl font-black text-navy sm:text-5xl dark:text-white">الكورسات والدروس <span className="ms-2 inline-grid min-w-12 place-items-center rounded-2xl bg-teal-50 px-3 align-middle text-2xl text-teal-600 sm:text-3xl dark:bg-teal-500/15 dark:text-teal-300">{courses.length}</span></h2>
            <BrandStripe className="mx-auto h-1.5 w-24 overflow-hidden rounded-full" />
            <p className="text-sm text-slate-600 sm:text-base dark:text-muted">دروس مسجلة بجودة عالية لكل مجموعة، ومتابعة تقدم الطالب في كل درس، وكويزات بعد كل جزء.</p>
          </div>
          {catalog.loading && !catalog.data ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-[440px] rounded-[2rem]" />)}</div>
          ) : courses.length === 0 ? (
            <p className="text-center text-slate-500">لا توجد كورسات منشورة حالياً.</p>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {courses.slice(0, 6).map((c) => <CourseCard key={c.id} c={c} currency={currency} />)}
              </div>
              <div className="mt-12 text-center">
                <Link href="/courses" className="shine inline-flex items-center gap-2 rounded-full bg-navy px-8 py-4 font-black text-white shadow-xl shadow-navy/25 transition hover:-translate-y-0.5">
                  كل الكورسات <ArrowLeft className="size-5" />
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ─── Stats strip ─── */}
      <section className="mx-auto -mb-12 max-w-6xl px-5 pt-16">
        <div className="grid gap-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-soft sm:grid-cols-2 lg:grid-cols-4 dark:border-line dark:bg-surface">
          {[
            { i: QrCode, c: "bg-teal-50 text-teal-600", t: "حضور في ثوانٍ", s: "QR متغير + يدوي" },
            { i: BellRing, c: "bg-rose-50 text-rose-600", t: "إشعار فوري", s: "لولي الأمر عند الغياب" },
            { i: CalendarDays, c: "bg-amber-50 text-amber-600", t: "جدول ذكي", s: "حصص وامتحانات" },
            { i: Smartphone, c: "bg-sky-50 text-sky-600", t: "ويب + موبايل", s: "نفس الحساب والبيانات" },
          ].map((x) => (
            <div key={x.t} className="flex items-center gap-4">
              <span className={`grid size-12 shrink-0 place-items-center rounded-2xl ${x.c}`}><x.i className="size-6" /></span>
              <div><div className="font-extrabold text-navy dark:text-white">{x.t}</div><div className="text-sm text-muted">{x.s}</div></div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="bg-soft-hero pt-28 pb-24">
        <div className="mx-auto max-w-7xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-black text-navy md:text-5xl dark:text-white">كل الأدوات في <span className="text-teal-600">مكان واحد</span></h2>
            <BrandStripe className="mx-auto mt-4 h-1.5 w-24 overflow-hidden rounded-full" />
            <p className="mt-4 text-lg text-muted">صُممت خصيصاً للسناتر والمدارس في مصر والخليج</p>
          </div>
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="shine group rounded-[28px] border border-slate-200 bg-white p-7 shadow-soft transition hover:-translate-y-1 hover:border-teal-300 hover:shadow-[0_20px_40px_-12px_rgba(15,23,42,0.12)] dark:border-line dark:bg-surface">
                <span className={`grid size-14 place-items-center rounded-2xl ${f.cls}`}><f.icon className="size-7" /></span>
                <h3 className="mt-5 text-xl font-extrabold text-navy dark:text-white">{f.title}</h3>
                <p className="mt-2 leading-7 text-muted">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Portals ─── */}
      <section id="portals" className="border-t border-slate-200 bg-surface py-24 dark:border-line">
        <div className="mx-auto max-w-7xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-black text-navy md:text-5xl dark:text-white">بوابة لكل مستخدم</h2>
            <BrandStripe className="mx-auto mt-4 h-1.5 w-24 overflow-hidden rounded-full" />
            <p className="mt-4 text-lg text-muted">كل شخص يرى ما يخصه فقط — بصلاحيات محمية من قاعدة البيانات</p>
          </div>
          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {portals.map((p, i) => (
              <div key={p.title} className={i === 0 ? "relative overflow-hidden rounded-[28px] bg-hero p-8 text-white shadow-2xl shadow-navy/30" : "rounded-[28px] border border-slate-200 bg-white p-8 shadow-soft dark:border-line dark:bg-surface-2"}>
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
            ))}
          </div>
        </div>
      </section>

      {/* ─── Security + CTA ─── */}
      <section id="security" className="mx-auto max-w-7xl px-5 py-24">
        <div className="relative grid items-center gap-10 overflow-hidden rounded-[32px] bg-hero p-8 text-white shadow-2xl shadow-navy/30 md:p-12 lg:grid-cols-[1fr_auto]">
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
          <Link href={cta.href} className="bg-gold inline-flex items-center justify-center gap-2 rounded-2xl px-8 py-4 text-lg font-extrabold text-navy shadow-xl shadow-amber-500/25 transition hover:-translate-y-0.5">
            {cta.label} <ArrowLeft className="size-5" />
          </Link>
        </div>
      </section>

      <SiteFooter phone={catalog.data?.center?.contact_phone} />
    </div>
  );
}
