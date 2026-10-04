"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft, BarChart3, BellRing, BookOpenCheck, Brain, CheckCircle2, ChevronDown, CreditCard, Globe2, GraduationCap,
  Languages, MessageCircle, MonitorPlay, QrCode, Route, ShieldCheck, Smartphone, Sparkles, Target, Timer, Users,
} from "lucide-react";
import { useAsync } from "@/lib/hooks";
import { loadCatalog } from "@/lib/catalog";
import { APP_NAME } from "@/lib/supabase";
import { whatsappLink } from "@/lib/fmt";
import { KSA_TRACKS, stageById, planFor } from "@/lib/curriculum";
import { CURRENCY_SA, PLANS_SA, YEARLY_MONTHS } from "@/lib/pricing";
import { BrandStripe, DemoBanner, SiteFooter, SiteHeader } from "@/components/site";
import { CountUp, RotatingWord } from "@/components/fx";
import { cx } from "@/components/ui";

const SALES = process.env.NEXT_PUBLIC_SALES_WHATSAPP || "";

/** Short description of each track, from the Ministry of Education guide. */
const TRACK_INFO: Record<string, string> = {
  general: "العلوم الطبيعية والإنسانية بأسلوب يعزز التحليل والتفكير العلمي — متاح في كل المدارس.",
  health: "للتخصصات الطبية والحيوية: علوم صحية وأنظمة جسم الإنسان وإحصاء تطبيقي.",
  cs: "علم البيانات وإنترنت الأشياء والذكاء الاصطناعي والأمن السيبراني والهندسة.",
  business: "التسويق والإدارة والاقتصاد والمحاسبة وريادة الأعمال والقانون.",
  sharia: "علوم القرآن وأصول الفقه ومصطلح الحديث والقانون وتطبيقاته.",
};

export function SaudiView() {
  const catalog = useAsync(() => loadCatalog(), []);
  const wa = whatsappLink(SALES || catalog.data?.center?.contact_phone, `مرحباً، أبغى أعرف تفاصيل منصة ${APP_NAME} لمركزنا في السعودية`, SALES ? "966" : "20");

  return (
    <div className="min-h-screen overflow-x-clip bg-bg">
      {catalog.data?.demo && <DemoBanner />}
      <SiteHeader />
      <Hero wa={wa} />
      <Tracks />
      <Qiyas />
      <Features />
      <Pricing wa={wa} />
      <Faq />
      <FinalCta wa={wa} />
      <SiteFooter phone={catalog.data?.center?.contact_phone} />
    </div>
  );
}

function Head({ icon: Icon, kicker, title, accent, text }: { icon: typeof Sparkles; kicker: string; title: string; accent?: string; text?: string }) {
  return (
    <div className="mx-auto mb-12 max-w-3xl space-y-4 text-center" data-reveal-stagger="110">
      <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-black text-navy shadow-sm dark:border-line dark:bg-surface-2 dark:text-white">
        <Icon className="size-4 text-emerald-500" /> {kicker}
      </div>
      <h2 className="text-3xl font-black leading-tight text-navy sm:text-5xl dark:text-white">
        {title}{accent && <> <span className="shimmer-text">{accent}</span></>}
      </h2>
      <BrandStripe className="stripe-grow mx-auto h-1.5 w-24 overflow-hidden rounded-full" />
      {text && <p className="text-sm leading-relaxed text-slate-600 sm:text-base dark:text-muted">{text}</p>}
    </div>
  );
}

function WaButton({ wa, children, className }: { wa: string | null; children: React.ReactNode; className?: string }) {
  const cls = cx("shine inline-flex items-center justify-center gap-2 rounded-2xl bg-[#25d366] px-7 py-4 font-black text-white shadow-lg shadow-[#25d366]/30 transition hover:-translate-y-0.5", className);
  return wa
    ? <a href={wa} target="_blank" rel="noreferrer" className={cls}><MessageCircle className="size-5" /> {children}</a>
    : <Link href="/#contact" className={cls}><MessageCircle className="size-5" /> {children}</Link>;
}

// ─── Hero ────────────────────────────────────────────────────────────────────

function Hero({ wa }: { wa: string | null }) {
  return (
    <section className="spotlight bg-soft-hero relative overflow-hidden border-b border-slate-200/70 pt-12 pb-20 lg:pt-16 lg:pb-24 dark:border-line"
      style={{ "--spot": "rgba(22, 163, 74, 0.14)", "--spot-size": "620px" } as React.CSSProperties}>
      <div className="aurora" />
      <div className="grid-lines pointer-events-none absolute inset-0 opacity-40" />
      <div aria-hidden className="pointer-events-none absolute inset-0 hidden xl:block">
        {KSA_TRACKS.map((t, i) => (
          <span key={t.id} className={cx("orbit absolute grid size-16 place-items-center rounded-3xl border bg-white/90 text-3xl shadow-xl backdrop-blur dark:bg-surface/90",
            ["top-[14%] right-[6%]", "top-[52%] right-[4%]", "top-[16%] left-[6%]", "top-[54%] left-[5%]", "bottom-[8%] right-[18%]"][i])}
            style={{ animationDelay: `${-i * 2.6}s`, borderColor: `${t.color}40`, boxShadow: `0 18px 40px -18px ${t.color}` }}>{t.emoji}</span>
        ))}
      </div>

      <div className="relative mx-auto max-w-5xl space-y-8 px-4 text-center sm:px-6" data-reveal-stagger="130">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/90 px-5 py-2 text-xs font-black text-emerald-800 shadow-md backdrop-blur sm:text-sm dark:border-emerald-900 dark:bg-surface dark:text-emerald-300">
          🌴 لمراكز التدريب والمدارس في المملكة العربية السعودية
        </div>
        <h1 data-reveal="blur" className="text-[2.1rem] font-black leading-[1.3] tracking-tight text-navy sm:text-5xl lg:text-6xl dark:text-white">
          <span className="block">منصة واحدة <span className="shimmer-text">لمركزك</span></span>
          <span className="mt-4 block text-2xl sm:text-4xl lg:text-[2.7rem]">
            من نظام المسارات إلى <RotatingWord words={["القدرات", "التحصيلي", "الحضور", "المتابعة"]} className="text-emerald-600 dark:text-emerald-400" />
          </span>
        </h1>
        <p className="mx-auto max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg dark:text-muted">
          حضور بالـ QR، كورسات ودروس مسجلة لكل مسار، كويزات بنفس شكل اختبارات قياس، مالية واشتراكات بالريال، وولي الأمر يتابع لحظة بلحظة — بالعربي والإنجليزي.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <WaButton wa={wa}>اطلب عرضاً توضيحياً</WaButton>
          <Link href="/login?demo=1" className="shine inline-flex items-center gap-2 rounded-2xl bg-navy px-7 py-4 font-black text-white shadow-xl shadow-navy/25 transition hover:-translate-y-0.5 dark:bg-teal-600">
            <MonitorPlay className="size-5" /> جرّب المنصة الآن
          </Link>
        </div>
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-3 pt-2 lg:grid-cols-4" data-reveal-stagger="100" data-reveal-child="zoom">
          {[
            { n: 5, l: "مسارات ثانوية", i: Route, c: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300" },
            { n: 3, l: "اختبارات: القدرات والتحصيلي العلمي والنظري", i: Target, c: "bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300" },
            { n: 2, l: "لغتان: عربي وإنجليزي", i: Languages, c: "bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300" },
            { n: 3, l: "بوابات: إدارة وطالب وولي أمر", i: Users, c: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300" },
          ].map((s) => (
            <div key={s.l} className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/90 p-3.5 text-start shadow-sm backdrop-blur transition hover:-translate-y-1 hover:shadow-lg dark:border-line dark:bg-surface/90">
              <span className={cx("wiggle grid size-11 shrink-0 place-items-center rounded-xl", s.c)}><s.i className="size-5" /></span>
              <div className="min-w-0">
                <div className="text-2xl font-black leading-none text-navy dark:text-white"><CountUp value={s.n} /></div>
                <div className="mt-1 text-[11px] font-bold leading-tight text-muted sm:text-xs">{s.l}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Tracks (نظام المسارات) ──────────────────────────────────────────────────

function Tracks() {
  const [active, setActive] = useState(KSA_TRACKS[1].id);
  const year1 = stageById("ksa1")!;
  const stage = stageById("ksa2")!;
  const t = KSA_TRACKS.find((x) => x.id === active)!;
  const plan = planFor(stage, t);
  return (
    <section id="tracks" className="relative scroll-mt-20 bg-surface py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Head icon={Route} kicker="نظام المسارات في المرحلة الثانوية" title="المنصة جاهزة" accent="لمساراتكم الخمسة"
          text="سنة أولى مشتركة، ثم سنتان في المسار. كل طالب يشوف مواد مساره، وكل مدرس يرفع كورسه للمسار والصف الصحيح." />

        <div data-reveal="up" className="mb-8 flex flex-wrap items-center gap-3 rounded-[28px] border border-slate-200 bg-slate-50/70 p-5 dark:border-line dark:bg-surface-2">
          <span className="grid size-12 place-items-center rounded-2xl bg-hero text-xl text-white shadow-lg">1</span>
          <div className="min-w-0 flex-1">
            <div className="font-black text-navy dark:text-white">السنة الأولى المشتركة</div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {year1.subjects.map((s) => <span key={s.name} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-700 dark:border-line dark:bg-surface dark:text-ink/85">{s.emoji} {s.name}</span>)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" data-reveal-stagger="90" data-reveal-child="zoom">
          {KSA_TRACKS.map((x) => {
            const on = x.id === active;
            return (
              <button key={x.id} onClick={() => setActive(x.id)}
                className={cx("group relative overflow-hidden rounded-3xl border-2 p-4 text-start transition-all duration-300 cursor-pointer", on ? "-translate-y-1 text-white shadow-2xl" : "border-slate-200 bg-white hover:-translate-y-1 hover:shadow-lg dark:border-line dark:bg-surface")}
                style={on ? { background: `linear-gradient(135deg, ${x.color}, color-mix(in srgb, ${x.color} 55%, #0e2c4e))`, borderColor: x.color, boxShadow: `0 24px 40px -20px ${x.color}` } : undefined}>
                <span className="block text-4xl transition-transform duration-500 group-hover:scale-110">{x.emoji}</span>
                <span className={cx("mt-3 block text-sm font-black leading-snug sm:text-base", !on && "text-navy dark:text-white")}>{x.name}</span>
                {on && <CheckCircle2 className="absolute end-3 top-3 size-5 text-white" />}
              </button>
            );
          })}
        </div>

        <div key={t.id} className="animate-in mt-6 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-900/[0.07] dark:border-line dark:bg-surface-2">
          <div className="h-2" style={{ background: `linear-gradient(90deg, ${t.color}, #fbbf24)` }} />
          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <div className="text-5xl">{t.emoji}</div>
              <h3 className="mt-3 text-2xl font-black text-navy dark:text-white">{t.name}</h3>
              <p className="mt-2 leading-7 text-muted">{TRACK_INFO[t.id]}</p>
              <Link href="/courses?system=ksa" className="mt-5 inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-black text-white shadow-lg" style={{ background: t.color }}>
                <MonitorPlay className="size-4" /> كورسات المنهج السعودي <ArrowLeft className="size-4" />
              </Link>
            </div>
            <div>
              <div className="text-xs font-black text-muted">مواد مشتركة في كل المسارات</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {plan.core.map((s) => <span key={s.name} className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-black text-navy dark:border-line dark:bg-surface dark:text-white">{s.emoji} {s.name}</span>)}
              </div>
              <div className="mt-5 text-xs font-black" style={{ color: t.color }}>أبرز مواد المسار في الصف الثاني والثالث</div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {plan.track.map((s) => (
                  <div key={s.name} className="flex items-center gap-3 rounded-2xl p-3 text-white shadow-md" style={{ background: `linear-gradient(135deg, ${t.color}, color-mix(in srgb, ${t.color} 60%, #0e2c4e))` }}>
                    <span className="text-2xl">{s.emoji}</span><span className="font-black">{s.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <p className="mt-5 text-center text-xs text-muted">المسارات وموادها حسب النشرة التعريفية لوزارة التعليم. يقدر المركز يضيف أي مادة أو صف إضافي.</p>
      </div>
    </section>
  );
}

// ─── Qiyas ───────────────────────────────────────────────────────────────────

function Qiyas() {
  const cards = [
    {
      emoji: "🧠", color: "#7c3aed", title: "اختبار القدرات العامة", sub: "قسمان: كمي ولفظي",
      points: ["الكمي: حساب وجبر وهندسة وإحصاء", "اللفظي: فهم المقروء والتناظر وإكمال الجمل", "الدرجة من 100 بعد المعايرة"],
    },
    {
      emoji: "🔬", color: "#0ea5e9", title: "التحصيلي العلمي", sub: "من مقررات الصفوف الثلاثة",
      points: ["الرياضيات والفيزياء", "الكيمياء والأحياء", "الأسئلة من الأول والثاني والثالث الثانوي"],
    },
    {
      emoji: "📚", color: "#f59e0b", title: "التحصيلي النظري", sub: "للتخصصات النظرية",
      points: ["الدراسات الإسلامية", "اللغة العربية", "الدراسات الاجتماعية"],
    },
  ];
  return (
    <section id="qiyas" className="bg-soft-hero scroll-mt-20 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Head icon={Target} kicker="القدرات والتحصيلي" title="جهّز طلابك" accent="لاختبارات قياس"
          text="النسبة الموزونة للقبول الجامعي تجمع معدل الثانوي مع القدرات والتحصيلي، وأوزانها تختلف حسب الجامعة والتخصص — فكل درجة فرقها كبير." />
        <div className="grid gap-5 lg:grid-cols-3" data-reveal-stagger="140" data-reveal-child="flip">
          {cards.map((c) => (
            <div key={c.title}>
              <div data-tilt="6" className="spotlight relative h-full overflow-hidden rounded-[28px] border border-slate-200 bg-white p-7 shadow-soft dark:border-line dark:bg-surface"
                style={{ "--spot": `${c.color}1f` } as React.CSSProperties}>
                <span className="absolute inset-x-0 top-0 h-1.5" style={{ background: c.color }} />
                <span className="grid size-14 place-items-center rounded-2xl text-3xl" style={{ background: `${c.color}1a` }}>{c.emoji}</span>
                <h3 className="mt-4 text-2xl font-black text-navy dark:text-white">{c.title}</h3>
                <p className="text-sm font-bold" style={{ color: c.color }}>{c.sub}</p>
                <ul className="mt-5 space-y-2.5">
                  {c.points.map((p) => <li key={p} className="flex items-start gap-2 text-sm font-semibold text-slate-700 dark:text-ink/85"><CheckCircle2 className="mt-0.5 size-4 shrink-0" style={{ color: c.color }} />{p}</li>)}
                </ul>
              </div>
            </div>
          ))}
        </div>
        <div data-reveal="up" className="glow-border relative mt-8 overflow-hidden rounded-[28px] bg-hero p-6 text-white shadow-2xl sm:p-8">
          <div className="aurora opacity-40" />
          <div className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { i: Timer, t: "كويزات مؤقتة", d: "اختيار من متعدد بوقت محدد — نفس إحساس يوم الاختبار." },
              { i: BookOpenCheck, t: "تصحيح فوري", d: "الطالب يعرف إجابته الصح والغلط مع الشرح." },
              { i: BarChart3, t: "مستوى كل قسم", d: "متابعة درجات الطالب في كل مادة وقسم." },
              { i: BellRing, t: "ولي الأمر يعرف", d: "إشعار بالدرجات والحضور أول بأول." },
            ].map((x) => (
              <div key={x.t} className="rounded-2xl border border-white/10 bg-white/[0.07] p-4">
                <x.i className="size-6 text-amber-300" />
                <div className="mt-3 font-black">{x.t}</div>
                <p className="mt-1 text-xs leading-6 text-slate-300">{x.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Features ────────────────────────────────────────────────────────────────

function Features() {
  const items = [
    { i: QrCode, c: "#0d9488", t: "حضور ذكي بالـ QR", d: "رمز متغير ضد الغش وتحقق اختياري من موقع الطالب داخل المركز." },
    { i: MonitorPlay, c: "#f59e0b", t: "كورسات لكل مسار", d: "دروس مسجلة مرتبة حسب الصف والمسار، والطالب يكمل من حيث توقف." },
    { i: CreditCard, c: "#16a34a", t: "مالية بالريال", d: "اشتراكات وتجديدات ومتأخرين في السداد وإيرادات الشهر." },
    { i: Brain, c: "#7c3aed", t: "خطة مذاكرة للطالب", d: "كل طالب يشوف مواد مساره ونسبة إنجازه في كل مادة." },
    { i: ShieldCheck, c: "#0ea5e9", t: "صلاحيات دقيقة", d: "ولي الأمر يشوف أبناءه فقط، والمساعد يشوف المسموح له فقط." },
    { i: Smartphone, c: "#e11d48", t: "ويب وموبايل", d: "نفس الحساب والبيانات على المتصفح وتطبيق الجوال." },
    { i: Languages, c: "#0891b2", t: "عربي وإنجليزي", d: "واجهة كاملة باللغتين للمدارس العالمية والأهلية." },
    { i: Globe2, c: "#475569", t: "مناسبة للخليج", d: "العملة ورمز الدولة والمناهج تتظبط من إعدادات المركز." },
  ];
  return (
    <section className="bg-surface py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Head icon={Sparkles} kicker="ليه منارة؟" title="كل أدوات مركزك" accent="في مكان واحد" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" data-reveal-stagger="80" data-reveal-child="zoom">
          {items.map((f) => (
            <div key={f.t}>
              <div data-tilt="6" className="spotlight group h-full rounded-[28px] border border-slate-200 bg-white p-6 shadow-soft transition-colors hover:border-emerald-300 dark:border-line dark:bg-surface-2"
                style={{ "--spot": `${f.c}1f` } as React.CSSProperties}>
                <span className="wiggle grid size-12 place-items-center rounded-2xl text-white shadow-lg" style={{ background: f.c, boxShadow: `0 12px 24px -12px ${f.c}` }}><f.i className="size-6" /></span>
                <h3 className="mt-4 text-lg font-black text-navy dark:text-white">{f.t}</h3>
                <p className="mt-1.5 text-sm leading-6 text-muted">{f.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pricing ─────────────────────────────────────────────────────────────────

function Pricing({ wa }: { wa: string | null }) {
  const [yearly, setYearly] = useState(true);
  const fmt = (n: number) => n.toLocaleString("en-US");
  return (
    <section id="pricing" className="bg-soft-hero scroll-mt-20 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Head icon={CreditCard} kicker="الباقات والأسعار" title="باقة تناسب" accent="حجم مركزك" text="ابدأ بتجربة مجانية 14 يوم — بدون بطاقة دفع." />
        <div className="mb-10 flex justify-center">
          <div className="inline-flex items-center rounded-2xl bg-slate-200/70 p-1.5 dark:bg-surface-3">
            {([[false, "شهري"], [true, "سنوي"]] as const).map(([v, l]) => (
              <button key={l} onClick={() => setYearly(v)} className={cx("relative rounded-xl px-6 py-2.5 text-sm font-black transition cursor-pointer", yearly === v ? "bg-white text-navy shadow-md dark:bg-emerald-600 dark:text-white" : "text-slate-500 dark:text-muted")}>
                {l}
                {v && <span className="ms-2 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] text-white">شهرين مجاناً</span>}
              </button>
            ))}
          </div>
        </div>
        <div className="grid items-stretch gap-6 lg:grid-cols-3" data-reveal-stagger="140" data-reveal-child="flip">
          {PLANS_SA.map((p) => {
            const total = yearly ? p.monthly * YEARLY_MONTHS : p.monthly;
            return (
              <div key={p.id} className="h-full">
                <div className={cx("relative flex h-full flex-col overflow-hidden rounded-[28px] p-7 transition hover:-translate-y-1", p.popular ? "glow-border bg-hero text-white shadow-2xl shadow-navy/30" : "border border-slate-200 bg-white shadow-soft dark:border-line dark:bg-surface")}>
                  {p.popular && <span className="absolute end-5 top-5 rounded-full bg-amber-400 px-3 py-1 text-[11px] font-black text-navy">الأكثر طلباً</span>}
                  <div className={cx("text-sm font-black", p.popular ? "text-amber-300" : "text-emerald-600")}>{p.name}</div>
                  <div className={cx("mt-1 text-xs font-bold", p.popular ? "text-white/70" : "text-muted")}>{p.students}</div>
                  <div className="mt-5 flex items-baseline gap-2">
                    <span className="text-5xl font-black" dir="ltr">{fmt(total)}</span>
                    <span className={cx("text-sm font-bold", p.popular ? "text-white/75" : "text-muted")}>{CURRENCY_SA} / {yearly ? "سنوياً" : "شهرياً"}</span>
                  </div>
                  {yearly && <div className={cx("mt-1 text-xs font-bold", p.popular ? "text-emerald-300" : "text-emerald-600")}>توفير <span dir="ltr">{fmt(p.monthly * (12 - YEARLY_MONTHS))}</span> {CURRENCY_SA}</div>}
                  <ul className="mt-6 flex-1 space-y-3">
                    {p.features.map((f) => (
                      <li key={f} className={cx("flex items-start gap-2 text-sm font-semibold", p.popular ? "text-white/90" : "text-slate-700 dark:text-ink/85")}>
                        <CheckCircle2 className={cx("mt-0.5 size-4 shrink-0", p.popular ? "text-amber-300" : "text-emerald-600")} /> {f}
                      </li>
                    ))}
                  </ul>
                  <WaButton wa={wa} className={cx("mt-7 w-full", p.popular ? "" : "!bg-navy !shadow-navy/25 dark:!bg-emerald-600")}>ابدأ التجربة المجانية</WaButton>
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-6 text-center text-xs text-muted">الأسعار بالريال السعودي ولا تشمل ضريبة القيمة المضافة. للمدارس والمجموعات التعليمية الكبيرة: تواصل معنا لعرض خاص.</p>
      </div>
    </section>
  );
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  const faq = [
    { q: "هل المنصة تدعم نظام المسارات؟", a: "نعم، السنة الأولى المشتركة والمسارات الخمسة بموادها جاهزة، والمركز يقدر يضيف أي مادة أو صف إضافي." },
    { q: "هل تنفع لمراكز القدرات والتحصيلي؟", a: "نعم، فيه قسم كامل للقدرات (الكمي واللفظي) والتحصيلي العلمي والنظري، مع كويزات مؤقتة وتصحيح فوري." },
    { q: "كم يأخذ تجهيز المنصة لمركزنا؟", a: "نجهز حساب مركزك ونستورد بيانات الطلاب من ملف Excel، وغالباً تكون جاهزة خلال أيام قليلة." },
    { q: "هل فيه تطبيق جوال؟", a: "نعم، نفس الحساب يعمل على المتصفح وعلى تطبيق الجوال للطالب وولي الأمر والمدرس." },
    { q: "أين تُحفظ بيانات الطلاب؟", a: "في قاعدة بيانات سحابية مؤمّنة بصلاحيات دقيقة لكل مستخدم، ونقدر نناقش متطلبات استضافة البيانات الخاصة بمؤسستكم." },
  ];
  return (
    <section className="bg-surface py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <Head icon={GraduationCap} kicker="أسئلة شائعة" title="عندك" accent="سؤال؟" />
        <div className="space-y-3" data-reveal-stagger="80">
          {faq.map((f, i) => {
            const on = open === i;
            return (
              <div key={f.q} className={cx("overflow-hidden rounded-3xl border bg-white transition-all dark:bg-surface-2", on ? "border-emerald-300 shadow-xl dark:border-emerald-700" : "border-slate-200 dark:border-line")}>
                <button onClick={() => setOpen(on ? null : i)} aria-expanded={on} className="flex w-full items-center justify-between gap-4 p-5 text-start font-black text-navy cursor-pointer dark:text-white">
                  {f.q}
                  <ChevronDown className={cx("size-5 shrink-0 text-emerald-600 transition-transform duration-300", on && "rotate-180")} />
                </button>
                <div className={cx("grid transition-all duration-300", on ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
                  <div className="overflow-hidden"><p className="px-5 pb-5 text-sm leading-7 text-slate-600 dark:text-muted">{f.a}</p></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FinalCta({ wa }: { wa: string | null }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
      <div data-reveal="zoom" className="glow-border relative overflow-hidden rounded-[32px] bg-hero p-8 text-center text-white shadow-2xl shadow-navy/30 md:p-14">
        <div className="aurora opacity-40" />
        <BrandStripe className="absolute inset-x-0 top-0 h-1.5" />
        <div className="relative mx-auto max-w-2xl">
          <div className="text-5xl">🌴</div>
          <h2 className="mt-4 text-3xl font-black leading-tight md:text-5xl">جاهز تنقل مركزك <span className="text-amber-300">للمستوى الجاي؟</span></h2>
          <p className="mt-4 leading-8 text-slate-300">احجز عرض توضيحي مجاني لمدة 20 دقيقة، ونوريك المنصة على بيانات مركزك.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <WaButton wa={wa}>احجز العرض على واتساب</WaButton>
            <Link href="/login?demo=1" className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-7 py-4 font-black transition hover:bg-white/15">
              <MonitorPlay className="size-5" /> جرّب بنفسك
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
