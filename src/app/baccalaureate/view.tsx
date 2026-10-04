"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft, BadgeCheck, BellRing, BookOpenCheck, Calculator, CalendarClock, CheckCircle2, ChevronDown, Compass, Flag,
  GraduationCap, Layers, ListChecks, MonitorPlay, QrCode, RefreshCw, Repeat2, Route, ShieldCheck, Sparkles, Target, Trophy,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { SubjectName as Subj, useSubjectName } from "@/components/curriculum";
import { useAsync } from "@/lib/hooks";
import { loadCatalog } from "@/lib/catalog";
import { APP_NAME } from "@/lib/supabase";
import { homeFor } from "@/lib/types";
import {
  BAC_ASSESSMENT, BAC_CORE, BAC_EXAMS, BAC_G1, COMPARE, FAQ, TA_G2, TA_OUTSIDE, TA_SECTIONS, TRACKS, type Track,
} from "@/lib/education";
import { BrandStripe, DemoBanner, SiteFooter, SiteHeader } from "@/components/site";
import { cx } from "@/components/ui";

const CORE_COLOR = "#0e2c4e";

export function BaccalaureateView() {
  const { profile } = useAuth();
  const catalog = useAsync(() => loadCatalog(), []);
  const cta = profile ? { href: homeFor(profile.role), label: "الذهاب للوحتي" } : { href: "/register", label: "احجز مكانك الآن" };

  return (
    <div className="min-h-screen overflow-x-clip bg-bg">
      {catalog.data?.demo && <DemoBanner />}
      <SiteHeader />
      <Hero />
      <Journey />
      <TrackExplorer />
      <ExamCalendar />
      <AssessmentReady />
      <ScoreCalculator />
      <Thanaweya />
      <Compare />
      <Faq />
      <FinalCta href={cta.href} label={cta.label} />
      <SiteFooter phone={catalog.data?.center?.contact_phone} />
    </div>
  );
}

// ─── Shared bits ─────────────────────────────────────────────────────────────

function SectionHead({ icon: Icon, kicker, title, accent, text }: { icon: typeof Sparkles; kicker: string; title: string; accent?: string; text?: string }) {
  return (
    <div className="mx-auto mb-12 max-w-3xl space-y-4 text-center" data-reveal-stagger="110">
      <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-black text-navy shadow-sm dark:border-line dark:bg-surface-2 dark:text-white">
        <Icon className="size-4 text-amber-500" /> {kicker}
      </div>
      <h2 className="text-3xl font-black leading-tight text-navy sm:text-5xl dark:text-white">
        {title}
        {accent && <> <span className="shimmer-text">{accent}</span></>}
      </h2>
      <BrandStripe className="stripe-grow mx-auto h-1.5 w-24 overflow-hidden rounded-full" />
      {text && <p className="text-sm leading-relaxed text-slate-600 sm:text-base dark:text-muted">{text}</p>}
    </div>
  );
}

function Marks({ n, className }: { n: number; className?: string }) {
  return <span className={className}>{`${n} درجة`}</span>;
}

// ─── Hero ────────────────────────────────────────────────────────────────────

function Hero() {
  const stats = [
    { n: 4, label: "مسارات للتخصص", icon: Route, cls: "bg-teal-50 text-teal-600 dark:bg-teal-500/15 dark:text-teal-300" },
    { n: 600, label: "درجة مجموع الشهادة", icon: Trophy, cls: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300" },
    { n: 2, label: "فرصة امتحان كل عام", icon: Repeat2, cls: "bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300" },
    { n: 2, label: "مادتان فقط في تالتة", icon: Target, cls: "bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300" },
  ];
  return (
    <section className="bg-soft-hero relative overflow-hidden border-b border-slate-200/70 pt-12 pb-20 lg:pt-16 lg:pb-24 dark:border-line">
      <div data-parallax="0.25" className="pointer-events-none absolute -top-32 right-[8%]"><div className="blob-drift size-[520px] rounded-full bg-teal-300/25 blur-[120px]" /></div>
      <div data-parallax="0.12" className="pointer-events-none absolute top-40 left-[4%]"><div className="blob-drift size-[420px] rounded-full bg-amber-300/20 blur-[120px]" style={{ animationDelay: "-5s" }} /></div>
      <div className="grid-lines pointer-events-none absolute inset-0 opacity-40" />

      {/* Floating track emojis */}
      <div aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block">
        {TRACKS.map((t, i) => (
          <span key={t.id} className={cx("absolute grid size-16 place-items-center rounded-3xl border bg-white text-3xl shadow-xl dark:bg-surface", ["float-slow", "float-mid", "float-fast", "float-mid"][i])}
            style={{ borderColor: `${t.color}55`, boxShadow: `0 18px 40px -18px ${t.color}`, ...[{ top: "18%", right: "7%" }, { top: "58%", right: "11%" }, { top: "22%", left: "8%" }, { top: "62%", left: "12%" }][i] }}>
            {t.emoji}
          </span>
        ))}
      </div>

      <div className="relative mx-auto max-w-5xl space-y-8 px-4 text-center sm:px-6" data-reveal-stagger="130">
        <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white/90 px-5 py-2 text-xs font-black text-teal-800 shadow-md shadow-teal-900/5 backdrop-blur sm:text-sm dark:border-teal-900 dark:bg-surface dark:text-teal-300">
          <span className="ping-dot size-2 rounded-full bg-emerald-500" /> محدّث وفق قرارات وزارة التربية والتعليم للعام الدراسي 2026/2027
        </div>
        <h1 data-reveal="blur" className="text-[2.1rem] font-black leading-[1.3] tracking-tight text-navy sm:text-5xl lg:text-6xl dark:text-white">
          <span className="block">
            <span className="shimmer-text relative inline-block">
              البكالوريا المصرية
              <BrandStripe className="stripe-grow absolute inset-x-0 -bottom-1 h-1.5 overflow-hidden rounded-full sm:-bottom-2 sm:h-2" />
            </span>
          </span>
          <span className="mt-4 block text-2xl sm:text-4xl lg:text-[2.7rem]">والثانوية العامة <span className="text-amber-500">من أولى لتالتة ثانوي</span></span>
        </h1>
        <p className="mx-auto max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg dark:text-muted">
          كل اللي محتاج تعرفه عن النظام الجديد في صفحة واحدة: المسارات الأربعة، المواد، توزيع الدرجات، مواعيد الفرص الامتحانية — واحسب مجموعك المتوقع بنفسك.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a href="#tracks" className="bg-gold glow-gold shimmer-auto inline-flex items-center gap-2 rounded-2xl px-7 py-4 text-sm font-black text-navy transition hover:-translate-y-0.5 sm:text-base">
            <Compass className="size-5" /> اكتشف مسارك
          </a>
          <a href="#calculator" className="shine inline-flex items-center gap-2 rounded-2xl bg-navy px-7 py-4 text-sm font-black text-white shadow-xl shadow-navy/25 transition hover:-translate-y-0.5 sm:text-base dark:bg-teal-600">
            <Calculator className="size-5" /> احسب مجموعك
          </a>
        </div>
        <div className="mx-auto grid max-w-4xl grid-cols-2 gap-3 pt-2 lg:grid-cols-4" data-reveal-stagger="100" data-reveal-child="zoom">
          {stats.map((s) => (
            <div key={s.label} className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/90 p-3.5 text-start shadow-sm backdrop-blur transition hover:-translate-y-1 hover:shadow-lg dark:border-line dark:bg-surface/90">
              <span className={cx("wiggle grid size-11 shrink-0 place-items-center rounded-xl", s.cls)}><s.icon className="size-5" /></span>
              <div className="min-w-0">
                <div className="text-2xl font-black leading-none text-navy dark:text-white" data-count={s.n}>{s.n}</div>
                <div className="mt-1 text-[11px] font-bold leading-tight text-muted sm:text-xs">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Journey: grade 10 → 11 → 12 ─────────────────────────────────────────────

function Journey() {
  const steps = [
    {
      n: "01", title: "الصف الأول الثانوي", tag: "سنة تأسيسية", color: "#0d9488", icon: Layers,
      text: "مواد مشتركة لكل الطلاب تبني الأساس قبل التخصص، ولا تدخل في مجموع الشهادة.",
      items: BAC_G1, foot: "التربية الدينية مادة أساسية • البرمجة واللغة الثانية خارج المجموع", score: null,
    },
    {
      n: "02", title: "الصف الثاني الثانوي", tag: "بداية المسار", color: "#0ea5e9", icon: Route,
      text: "تختار مسارك من أربعة مسارات وتدرس 3 مواد أساسية + مادة تخصص واحدة.",
      items: [...BAC_CORE, "مادة تخصص حسب المسار"], foot: "التربية المالية والتربية الرياضية خارج المجموع", score: 400,
    },
    {
      n: "03", title: "الصف الثالث الثانوي", tag: "سنة التركيز", color: "#f59e0b", icon: Target,
      text: "مادتان فقط بمستوى رفيع حسب مسارك — تركيز كامل بدل تشتت 5 مواد.",
      items: ["مادة تخصص أولى (مستوى رفيع)", "مادة تخصص ثانية"], foot: "التربية الدينية مادة نجاح ورسوب (70%)", score: 200,
    },
  ];
  return (
    <section className="relative bg-surface py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHead icon={GraduationCap} kicker="نظام البكالوريا المصرية" title="رحلتك من أولى" accent="لتالتة ثانوي" text="البكالوريا بتقسم المجموع على سنتين بدل ما يكون كله في سنة واحدة — ضغط أقل وفرص أكتر." />

        <div className="relative grid gap-6 lg:grid-cols-3" data-reveal-stagger="160" data-reveal-child="flip">
          {steps.map((s) => (
            <div key={s.n} className="group relative flex flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white p-7 shadow-soft transition duration-500 hover:-translate-y-2 hover:shadow-2xl dark:border-line dark:bg-surface-2">
              <span className="absolute inset-x-0 top-0 h-1.5" style={{ background: s.color }} />
              <span className="pointer-events-none absolute -end-10 -top-10 size-40 rounded-full opacity-10 transition-transform duration-700 group-hover:scale-125" style={{ background: s.color }} />
              <div className="relative flex items-start justify-between gap-3">
                <span className="wiggle grid size-14 place-items-center rounded-2xl text-white shadow-lg" style={{ background: s.color, boxShadow: `0 12px 24px -12px ${s.color}` }}><s.icon className="size-7" /></span>
                <span className="text-5xl leading-none font-black text-transparent [-webkit-text-stroke:1.5px_rgba(14,44,78,0.15)] dark:[-webkit-text-stroke:1.5px_rgba(255,255,255,0.15)]" dir="ltr">{s.n}</span>
              </div>
              <span className="relative mt-5 inline-flex w-fit rounded-full px-3 py-1 text-[11px] font-black" style={{ background: `${s.color}1a`, color: s.color }}>{s.tag}</span>
              <h3 className="relative mt-2 text-2xl font-black text-navy dark:text-white">{s.title}</h3>
              <p className="relative mt-2 text-sm leading-7 text-muted">{s.text}</p>
              <ul className="relative mt-5 space-y-2">
                {s.items.map((it) => (
                  <li key={it} className="flex items-center gap-2.5 text-sm font-bold text-slate-700 dark:text-ink/85">
                    <CheckCircle2 className="size-4 shrink-0" style={{ color: s.color }} /> <Subj n={it} />
                  </li>
                ))}
              </ul>
              <div className="flex-1" />
              <div className="relative mt-6 flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-line dark:bg-surface">
                <span className="text-xs font-black text-muted">{s.score ? "يدخل في المجموع" : "خارج مجموع الشهادة"}</span>
                {s.score ? <Marks n={s.score} className="text-xl font-black" /> : <span className="text-xl font-black text-slate-400">—</span>}
              </div>
              <p className="relative mt-3 text-[11px] font-semibold leading-5 text-muted">{s.foot}</p>
            </div>
          ))}
        </div>

        {/* 600 bar */}
        <div data-reveal="zoom" className="relative mx-auto mt-10 max-w-4xl overflow-hidden rounded-[28px] bg-hero p-6 text-white shadow-2xl shadow-navy/30 sm:p-8">
          <BrandStripe className="absolute inset-x-0 top-0 h-1.5" />
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-xs font-black text-amber-300">مجموع شهادة البكالوريا</div>
              <div className="mt-1 text-4xl font-black sm:text-5xl"><span data-count="600">600</span> <span className="text-xl text-white/70">درجة</span></div>
            </div>
            <div className="flex gap-4 text-xs font-bold text-white/85">
              <span className="flex items-center gap-1.5"><span className="size-3 rounded-full bg-sky-400" /> الصف الثاني</span>
              <span className="flex items-center gap-1.5"><span className="size-3 rounded-full bg-amber-400" /> الصف الثالث</span>
            </div>
          </div>
          <div className="mt-5 flex h-12 gap-1.5 overflow-hidden rounded-2xl" dir="rtl">
            {[...BAC_CORE, "مادة التخصص"].map((s) => (
              <div key={s} className="bar-fill grid flex-1 place-items-center bg-sky-500/90 px-1 text-center text-[10px] font-black leading-tight sm:text-xs"><Subj n={s} /></div>
            ))}
            {["تخصص 1", "تخصص 2"].map((s) => (
              <div key={s} className="bar-fill grid flex-1 place-items-center bg-amber-400 px-1 text-center text-[10px] font-black text-navy sm:text-xs">{s}</div>
            ))}
          </div>
          <div className="mt-3 flex text-[11px] font-bold text-white/70" dir="rtl">
            <span className="flex-[4] text-center"><Marks n={400} /></span>
            <span className="flex-[2] text-center"><Marks n={200} /></span>
          </div>
          <p className="mt-4 text-center text-xs text-white/70">كل مادة من 100 درجة • 6 مواد على سنتين</p>
        </div>
      </div>
    </section>
  );
}

// ─── Track explorer ──────────────────────────────────────────────────────────

function TrackExplorer() {
  const [active, setActive] = useState(TRACKS[0].id);
  const [pick, setPick] = useState(0);
  const t = TRACKS.find((x) => x.id === active)!;

  return (
    <section id="tracks" className="bg-soft-hero relative scroll-mt-20 overflow-hidden py-24">
      <div className="grid-lines pointer-events-none absolute inset-0 opacity-30" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHead icon={Compass} kicker="المسارات الأربعة" title="اختر المسار" accent="اللي يشبهك" text="دوس على أي مسار وشوف مواده في تانية وتالتة، وتوزيع درجاته، والمجالات القريبة منه." />

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" data-reveal-stagger="100" data-reveal-child="zoom">
          {TRACKS.map((x) => {
            const on = x.id === active;
            return (
              <button key={x.id} onClick={() => { setActive(x.id); setPick(0); }}
                className={cx("group relative overflow-hidden rounded-3xl border-2 p-4 text-start transition-all duration-300 cursor-pointer sm:p-5", on ? "-translate-y-1 text-white shadow-2xl" : "border-slate-200 bg-white hover:-translate-y-1 hover:shadow-lg dark:border-line dark:bg-surface")}
                style={on ? { background: `linear-gradient(135deg, ${x.color}, color-mix(in srgb, ${x.color} 55%, #0e2c4e))`, borderColor: x.color, boxShadow: `0 24px 40px -20px ${x.color}` } : undefined}>
                {on && <span className="dot-pattern absolute inset-0 opacity-20" />}
                <span className="relative block text-4xl transition-transform duration-500 group-hover:scale-110 sm:text-5xl">{x.emoji}</span>
                <span className={cx("relative mt-3 block text-sm font-black leading-snug sm:text-lg", !on && "text-navy dark:text-white")}>{x.name}</span>
                <span className={cx("relative mt-1 hidden text-xs font-semibold leading-5 sm:block", on ? "text-white/85" : "text-muted")}>{x.tagline}</span>
                {on && <CheckCircle2 className="absolute end-3 top-3 size-5 text-white" />}
              </button>
            );
          })}
        </div>

        <TrackDetail key={t.id} t={t} pick={pick} setPick={setPick} />
        <p className="mt-6 text-center text-xs font-semibold text-muted">
          🔁 تغيير المسار متاح في الصف الثالث بشرط دراسة مواد تخصص المسار الجديد (مادة الصف الثاني + مادتي الصف الثالث).
        </p>
      </div>
    </section>
  );
}

function TrackDetail({ t, pick, setPick }: { t: Track; pick: number; setPick(i: number): void }) {
  const sn = useSubjectName();
  const segs = [
    ...BAC_CORE.map((s) => ({ s, c: CORE_COLOR })),
    { s: t.g2Options[pick], c: t.color },
    ...t.g3.map((s) => ({ s, c: t.color })),
  ];
  return (
    <div className="animate-in mt-8 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-900/[0.07] dark:border-line dark:bg-surface">
      <div className="h-2" style={{ background: `linear-gradient(90deg, ${t.color}, #fbbf24)` }} />
      <div className="grid gap-0 lg:grid-cols-2">
        {/* Grade 11 */}
        <div className="border-b border-slate-100 p-6 sm:p-8 lg:border-e lg:border-b-0 dark:border-line">
          <div className="flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-xl font-black text-navy dark:text-white">
              <span className="grid size-9 place-items-center rounded-xl bg-sky-50 text-sm font-black text-sky-600 dark:bg-sky-500/15" dir="ltr">2</span>
              الصف الثاني الثانوي
            </h3>
            <span className="shrink-0 whitespace-nowrap rounded-full bg-sky-50 px-3 py-1 text-xs font-black text-sky-700 dark:bg-sky-500/15 dark:text-sky-300"><Marks n={400} /></span>
          </div>
          <div className="mt-5 text-xs font-black text-muted">مواد أساسية لكل المسارات</div>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {BAC_CORE.map((s) => (
              <div key={s} className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3 text-center text-sm font-black text-navy dark:border-line dark:bg-surface-2 dark:text-white"><Subj n={s} /></div>
            ))}
          </div>
          <div className="mt-5 flex items-center gap-2 text-xs font-black" style={{ color: t.color }}>
            <Sparkles className="size-4" /> اختر مادة تخصص واحدة
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {t.g2Options.map((o, i) => (
              <button key={o} onClick={() => setPick(i)}
                className={cx("relative rounded-2xl border-2 px-3 py-3.5 text-sm font-black transition-all cursor-pointer", pick === i ? "text-white shadow-lg" : "border-dashed border-slate-300 text-slate-600 hover:border-slate-400 dark:border-line dark:text-muted")}
                style={pick === i ? { background: t.color, borderColor: t.color, boxShadow: `0 12px 24px -14px ${t.color}` } : undefined}>
                {o}
                {pick === i && <CheckCircle2 className="absolute -end-1.5 -top-1.5 size-5 rounded-full bg-white" style={{ color: t.color }} />}
              </button>
            ))}
          </div>
        </div>

        {/* Grade 12 */}
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-xl font-black text-navy dark:text-white">
              <span className="grid size-9 place-items-center rounded-xl bg-amber-50 text-sm font-black text-amber-600 dark:bg-amber-500/15" dir="ltr">3</span>
              الصف الثالث الثانوي
            </h3>
            <span className="shrink-0 whitespace-nowrap rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"><Marks n={200} /></span>
          </div>
          <div className="mt-5 text-xs font-black text-muted">مادتان تخصصيتان فقط</div>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {t.g3.map((s) => (
              <div key={s} className="shine relative overflow-hidden rounded-2xl p-5 text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${t.color}, color-mix(in srgb, ${t.color} 60%, #0e2c4e))` }}>
                <span className="dot-pattern absolute inset-0 opacity-20" />
                <span className="relative text-3xl">{t.emoji}</span>
                <div className="relative mt-2 text-base font-black leading-snug">{s}</div>
                <div className="relative mt-1 text-xs font-bold text-white/80"><Marks n={100} /></div>
              </div>
            ))}
          </div>
          <div className="mt-5 text-xs font-black text-muted">مجالات قريبة من المسار</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {t.fields.map((f) => (
              <span key={f} className="rounded-full border px-3 py-1.5 text-xs font-bold" style={{ borderColor: `${t.color}55`, color: t.color, background: `${t.color}10` }}>{f}</span>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-muted">القبول النهائي يحدده مكتب التنسيق وفق المجموع وقواعد القبول.</p>
          <Link href={`/courses?stage=bac2&track=${t.id}`} className="shine mt-5 flex items-center justify-between gap-2 rounded-2xl px-4 py-3.5 text-sm font-black text-white shadow-lg transition hover:brightness-110" style={{ background: t.color, boxShadow: `0 12px 24px -14px ${t.color}` }}>
            <span className="flex items-center gap-2"><MonitorPlay className="size-4" /> كورسات مسار {t.name} في المنصة</span>
            <ArrowLeft className="size-4" />
          </Link>
        </div>
      </div>

      {/* 600 mini-bar */}
      <div className="border-t border-slate-100 bg-slate-50/70 p-5 sm:px-8 dark:border-line dark:bg-surface-2">
        <div className="mb-2 flex items-center justify-between text-xs font-black">
          <span className="text-navy dark:text-white">توزيع الـ 600 درجة في مسار {t.name}</span>
          <span className="text-muted" dir="ltr">6 × 100</span>
        </div>
        <div className="flex h-10 gap-1 overflow-hidden rounded-xl">
          {segs.map((x, i) => (
            <div key={i} title={sn(x.s)} className="grid min-w-0 flex-1 place-items-center px-1 text-center text-[9px] font-black leading-tight text-white sm:text-[11px]" style={{ background: x.c }}>
              <span className="line-clamp-2"><Subj n={x.s} /></span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Exam calendar ───────────────────────────────────────────────────────────

function ExamCalendar() {
  return (
    <section className="bg-surface py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHead icon={CalendarClock} kicker="الفرص الامتحانية" title="فرصتين كل سنة" accent="وأعلى درجة ليك" text="امتحان مش عاجبك؟ ادخل الفرصة التانية وحسّن درجتك — النظام بيحسب لك أعلى درجة جبتها في كل مادة." />

        <div className="relative">
          <div className="absolute inset-x-8 top-[3.25rem] hidden h-1 rounded-full bg-gradient-to-l from-teal-400 via-sky-400 to-amber-400 opacity-40 lg:block" />
          <div className="relative grid gap-5 sm:grid-cols-2 lg:grid-cols-4" data-reveal-stagger="140" data-reveal-child="up">
            {BAC_EXAMS.map((e, i) => {
              const free = e.fee === 0;
              return (
                <div key={i} className="group relative rounded-[28px] border border-slate-200 bg-white p-6 text-center shadow-soft transition hover:-translate-y-1.5 hover:shadow-xl dark:border-line dark:bg-surface-2">
                  <div className={cx("float-mid mx-auto grid h-[4.5rem] min-w-[4.5rem] w-fit place-items-center rounded-3xl border-4 border-white px-3 text-lg font-black shadow-xl dark:border-surface", free ? "bg-brand text-white" : "bg-gold text-navy")}>
                    {e.month}
                  </div>
                  <div className="mt-4 text-xs font-black text-muted">{e.grade}</div>
                  <div className="mt-1 text-lg font-black text-navy dark:text-white">{e.attempt}</div>
                  <div className="mt-3 flex flex-wrap justify-center gap-2">
                    <span className={cx("rounded-full px-3 py-1 text-[11px] font-black", free ? "bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300" : "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300")}>{e.kind}</span>
                    <span className={cx("rounded-full px-3 py-1 text-[11px] font-black", free ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-slate-100 text-slate-700 dark:bg-surface-3 dark:text-ink")}>
                      {free ? "مجانية" : "200 جنيه للمادة"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3" data-reveal-stagger="120" data-reveal-child="zoom">
          {[
            { icon: Trophy, t: "تُحتسب أعلى درجة", d: "كل محاولاتك بتتسجل، والدرجة الأعلى هي اللي بتدخل المجموع.", c: "bg-amber-50 text-amber-600 dark:bg-amber-500/15" },
            { icon: RefreshCw, t: "حتى 4 سنوات دراسية", d: "متاح لك دخول الامتحانات خلال مدة أقصاها أربع سنوات دراسية.", c: "bg-sky-50 text-sky-600 dark:bg-sky-500/15" },
            { icon: ListChecks, t: "50% اختيار من متعدد", d: "والنصف الآخر أسئلة مقالية، بدءاً من العام الدراسي 2026/2027.", c: "bg-violet-50 text-violet-600 dark:bg-violet-500/15" },
          ].map((x) => (
            <div key={x.t} className="group flex items-start gap-4 rounded-3xl border border-slate-200 bg-slate-50/60 p-5 dark:border-line dark:bg-surface-2">
              <span className={cx("wiggle grid size-12 shrink-0 place-items-center rounded-2xl", x.c)}><x.icon className="size-6" /></span>
              <div><div className="font-black text-navy dark:text-white">{x.t}</div><p className="mt-1 text-sm leading-6 text-muted">{x.d}</p></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Continuous assessment + platform fit ────────────────────────────────────

function AssessmentReady() {
  const stops = BAC_ASSESSMENT.map((a, i) => {
    const from = BAC_ASSESSMENT.slice(0, i).reduce((s, x) => s + x.pts, 0);
    return `${a.color} ${from}% ${from + a.pts}%`;
  }).join(", ");

  const fit = [
    { icon: BookOpenCheck, t: "كويزات بنفس شكل الامتحان", d: "اختيار من متعدد بتصحيح فوري، علشان الطالب يتدرب على نص الامتحان قبل ما يدخله." },
    { icon: QrCode, t: "الحضور والمواظبة", d: "حضور بالـ QR في ثوانٍ، لأن السلوك والمواظبة لهم درجة في التقييم." },
    { icon: BellRing, t: "ولي الأمر في الصورة", d: "إشعار فوري بالغياب والدرجات، فمفيش تقييم يفوت ابنك." },
    { icon: MonitorPlay, t: "دروس مسجلة لكل مسار", d: "الطالب يراجع أي درس في أي وقت قبل التقييم الأسبوعي والشهري." },
  ];

  return (
    <section className="bg-soft-hero py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHead icon={BadgeCheck} kicker={`${APP_NAME} جاهزة للبكالوريا`} title="التقييم طول السنة" accent="مش يوم الامتحان بس" text="في البكالوريا لازم الطالب ينجز 60% على الأقل من التقييمات الأسبوعية والشهرية علشان يدخل امتحان الفرصة الأولى." />

        <div className="grid items-stretch gap-6 lg:grid-cols-5">
          <div data-reveal="start" className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl sm:p-8 lg:col-span-2 dark:border-line dark:bg-surface">
            <h3 className="text-lg font-black text-navy dark:text-white">توزيع درجات التقييم المستمر</h3>
            <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row lg:flex-col xl:flex-row">
              <div className="relative size-44 shrink-0 rounded-full shadow-inner" style={{ background: `conic-gradient(${stops})` }}>
                <div className="absolute inset-5 grid place-items-center rounded-full bg-white text-center dark:bg-surface">
                  <div><div className="text-4xl font-black text-navy dark:text-white" data-count="100">100</div><div className="text-xs font-bold text-muted">درجة</div></div>
                </div>
              </div>
              <ul className="w-full space-y-2.5">
                {BAC_ASSESSMENT.map((a) => (
                  <li key={a.label} className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2 font-bold text-slate-700 dark:text-ink/85"><span className="size-3 shrink-0 rounded-full" style={{ background: a.color }} /> {a.label}</span>
                    <span className="font-black" style={{ color: a.color }} dir="ltr">{a.pts}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-900 dark:border-amber-900 dark:bg-amber-500/10 dark:text-amber-200">
              ⚠️ شرط دخول الفرصة الأولى: إنجاز 60% على الأقل من التقييمات.
            </div>
          </div>

          <div data-reveal="end" className="relative overflow-hidden rounded-[2rem] bg-hero p-6 text-white shadow-2xl shadow-navy/30 sm:p-8 lg:col-span-3">
            <BrandStripe className="absolute inset-x-0 top-0 h-1.5" />
            <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "18px 18px" }} />
            <div className="relative">
              <h3 className="flex items-center gap-3 text-xl font-black sm:text-2xl">
                <span className="bg-gold grid size-12 shrink-0 place-items-center rounded-2xl text-navy shadow-lg shadow-amber-500/30"><ShieldCheck className="size-6" /></span>
                <span>ليه <span className="text-amber-300">{APP_NAME}</span> مناسبة للنظام الجديد؟</span>
              </h3>
              <div className="mt-6 grid gap-3 sm:grid-cols-2" data-reveal-stagger="120" data-reveal-child="zoom">
                {fit.map((f) => (
                  <div key={f.t} className="shine group rounded-2xl border border-white/10 bg-white/[0.06] p-4 transition hover:bg-white/[0.11]">
                    <span className="wiggle grid size-10 place-items-center rounded-xl border border-teal-300/30 bg-teal-400/15 text-teal-300"><f.icon className="size-5" /></span>
                    <div className="mt-3 font-black">{f.t}</div>
                    <p className="mt-1 text-xs leading-6 text-slate-300 sm:text-[13px]">{f.d}</p>
                  </div>
                ))}
              </div>
              <Link href="/courses" className="bg-gold glow-gold shimmer-auto mt-6 flex items-center justify-center gap-2 rounded-2xl py-4 text-sm font-black text-navy transition-transform hover:-translate-y-0.5">
                تصفح الكورسات <ArrowLeft className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Score calculator ────────────────────────────────────────────────────────

function gradeLabel(pct: number) {
  if (pct >= 85) return { t: "ممتاز", c: "#10b981", e: "🏆" };
  if (pct >= 75) return { t: "جيد جداً", c: "#0ea5e9", e: "🌟" };
  if (pct >= 65) return { t: "جيد", c: "#6366f1", e: "👍" };
  if (pct >= 50) return { t: "مقبول", c: "#f59e0b", e: "💪" };
  return { t: "محتاج مجهود أكتر", c: "#e11d48", e: "📚" };
}

function ScoreCalculator() {
  const sn = useSubjectName();
  const [system, setSystem] = useState<"bac" | "ta">("bac");
  const [trackId, setTrackId] = useState(TRACKS[0].id);
  const [pick, setPick] = useState(0);
  const [sectionId, setSectionId] = useState(TA_SECTIONS[0].id);
  const [scores, setScores] = useState<Record<string, number>>({});

  const track = TRACKS.find((t) => t.id === trackId)!;
  const section = TA_SECTIONS.find((s) => s.id === sectionId)!;
  const subjects = system === "bac"
    ? [...BAC_CORE, track.g2Options[pick], ...track.g3].map((name) => ({ name, max: 100, key: `bac:${name}` }))
    : section.subjects.map((s) => ({ ...s, key: `ta:${s.name}:${s.max}` }));
  const value = (s: { key: string; max: number }) => scores[s.key] ?? Math.round(s.max * 0.85);
  const total = subjects.reduce((a, s) => a + value(s), 0);
  const max = subjects.reduce((a, s) => a + s.max, 0);
  const pct = max ? (total / max) * 100 : 0;
  const g = gradeLabel(pct);
  const accent = system === "bac" ? track.color : section.color;
  const R = 70;
  const C = 2 * Math.PI * R;

  return (
    <section id="calculator" className="scroll-mt-20 bg-surface py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHead icon={Calculator} kicker="حاسبة المجموع" title="احسب مجموعك" accent="ونسبتك المتوقعة" text="حرّك الدرجات وشوف مجموعك ونسبتك فوراً — في البكالوريا أو الثانوية العامة." />

        <div data-reveal="up" className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-900/[0.07] dark:border-line dark:bg-surface-2">
          {/* System switch */}
          <div className="flex justify-center border-b border-slate-100 bg-slate-50/70 p-4 dark:border-line dark:bg-surface">
            <div className="inline-flex rounded-2xl bg-slate-200/70 p-1.5 dark:bg-surface-3">
              {([["bac", "البكالوريا المصرية"], ["ta", "الثانوية العامة"]] as const).map(([k, l]) => (
                <button key={k} onClick={() => setSystem(k)} className={cx("rounded-xl px-5 py-2.5 text-sm font-black transition-all cursor-pointer sm:px-8", system === k ? "bg-white text-navy shadow-md dark:bg-teal-600 dark:text-white" : "text-slate-500 hover:text-navy dark:text-muted dark:hover:text-white")}>{l}</button>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-[1fr_360px]">
            <div className="p-5 sm:p-8">
              {/* Track / section pills */}
              <div className="flex flex-wrap gap-2">
                {system === "bac"
                  ? TRACKS.map((t) => (
                    <button key={t.id} onClick={() => { setTrackId(t.id); setPick(0); }} className={cx("flex items-center gap-1.5 rounded-full border-2 px-4 py-2 text-xs font-black transition cursor-pointer sm:text-sm", t.id === trackId ? "text-white" : "border-slate-200 text-slate-600 hover:border-slate-300 dark:border-line dark:text-muted")}
                      style={t.id === trackId ? { background: t.color, borderColor: t.color } : undefined}>
                      <span>{t.emoji}</span> {t.name}
                    </button>
                  ))
                  : TA_SECTIONS.map((s) => (
                    <button key={s.id} onClick={() => setSectionId(s.id)} className={cx("flex items-center gap-1.5 rounded-full border-2 px-4 py-2 text-xs font-black transition cursor-pointer sm:text-sm", s.id === sectionId ? "text-white" : "border-slate-200 text-slate-600 hover:border-slate-300 dark:border-line dark:text-muted")}
                      style={s.id === sectionId ? { background: s.color, borderColor: s.color } : undefined}>
                      <span>{s.emoji}</span> {s.name}
                    </button>
                  ))}
              </div>
              {system === "bac" && (
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-bold text-muted">
                  <span>مادة تخصص الصف الثاني:</span>
                  {track.g2Options.map((o, i) => (
                    <button key={o} onClick={() => setPick(i)} className={cx("rounded-full border px-3 py-1.5 font-black transition cursor-pointer", pick === i ? "border-transparent text-white" : "border-slate-200 hover:border-slate-300 dark:border-line")}
                      style={pick === i ? { background: track.color } : undefined}>{o}</button>
                  ))}
                </div>
              )}

              <div className="mt-6 space-y-4">
                {subjects.map((s) => {
                  const v = value(s);
                  return (
                    <div key={s.key} className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 dark:border-line dark:bg-surface">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-black text-navy dark:text-white"><Subj n={s.name} /></span>
                        <span className="flex items-center gap-1 text-sm font-black" dir="ltr">
                          <input type="number" min={0} max={s.max} value={v} aria-label={sn(s.name)}
                            onChange={(e) => setScores((p) => ({ ...p, [s.key]: Math.max(0, Math.min(s.max, Number(e.target.value) || 0)) }))}
                            className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1 text-center font-black text-navy outline-none focus:border-teal-400 dark:border-line dark:bg-surface-2 dark:text-white" />
                          <span className="text-muted">/ {s.max}</span>
                        </span>
                      </div>
                      <input type="range" min={0} max={s.max} value={v} aria-label={sn(s.name)}
                        onChange={(e) => setScores((p) => ({ ...p, [s.key]: Number(e.target.value) }))}
                        className="mt-3 w-full cursor-pointer" style={{ accentColor: accent }} />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Result */}
            <div className="relative overflow-hidden bg-hero p-8 text-white">
              <BrandStripe className="absolute inset-x-0 top-0 h-1.5" />
              <div className="relative flex h-full flex-col items-center justify-center text-center">
                <div className="text-xs font-black text-amber-300">مجموعك المتوقع</div>
                <div className="relative mt-4 size-48">
                  <svg viewBox="0 0 160 160" className="size-full -rotate-90">
                    <circle cx="80" cy="80" r={R} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="12" />
                    <circle cx="80" cy="80" r={R} fill="none" stroke={g.c} strokeWidth="12" strokeLinecap="round"
                      strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)} style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.16,1,0.3,1), stroke 0.4s" }} />
                  </svg>
                  <div className="absolute inset-0 grid place-items-center">
                    <div>
                      <div className="text-4xl font-black" dir="ltr">{pct.toFixed(1)}%</div>
                      <div className="mt-1 text-sm font-bold text-white/75" dir="ltr">{total} / {max}</div>
                    </div>
                  </div>
                </div>
                <div className="mt-5 inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-black" style={{ background: `${g.c}33`, color: "#fff", boxShadow: `inset 0 0 0 1px ${g.c}` }}>
                  <span>{g.e}</span> {g.t}
                </div>
                <p className="mt-5 text-xs leading-6 text-white/70">
                  {system === "bac" ? "6 مواد × 100 درجة على الصفين الثاني والثالث" : "5 مواد في الصف الثالث: العربي 80 والباقي 60"}
                </p>
                <p className="mt-1 text-[11px] text-white/50">الحاسبة للتوضيح فقط</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Thanaweya Amma ──────────────────────────────────────────────────────────

function Thanaweya() {
  const [sec, setSec] = useState(TA_SECTIONS[0].id);
  const s = TA_SECTIONS.find((x) => x.id === sec)!;
  return (
    <section id="thanaweya" className="bg-soft-hero scroll-mt-20 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHead icon={Flag} kicker="النظام الحالي" title="الثانوية العامة" accent="تانية وتالتة ثانوي" text="لطلاب الثانوية العامة: المواد في كل شعبة وتوزيع الـ 320 درجة في الصف الثالث." />

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Grade 11 */}
          <div data-reveal="start" className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl sm:p-8 lg:col-span-2 dark:border-line dark:bg-surface">
            <div className="flex items-center gap-3">
              <span className="grid size-12 place-items-center rounded-2xl bg-sky-50 text-xl font-black text-sky-600 dark:bg-sky-500/15" dir="ltr">2</span>
              <div>
                <h3 className="text-xl font-black text-navy dark:text-white">الصف الثاني الثانوي</h3>
                <p className="text-xs font-bold text-muted">درجاته لا تدخل في مجموع التنسيق</p>
              </div>
            </div>
            <div className="mt-6 space-y-5">
              {TA_G2.map((b) => (
                <div key={b.name}>
                  <div className="mb-2 text-sm font-black text-teal-700 dark:text-teal-300">{b.name}</div>
                  <div className="flex flex-wrap gap-2">
                    {b.subjects.map((x) => <span key={x} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 dark:border-line dark:bg-surface-2 dark:text-ink/85"><Subj n={x} /></span>)}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-line dark:bg-surface-2">
              <div className="text-xs font-black text-muted">مواد نجاح ورسوب خارج المجموع</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {TA_OUTSIDE.map((x) => <span key={x} className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 shadow-sm dark:bg-surface dark:text-muted">{x}</span>)}
              </div>
            </div>
          </div>

          {/* Grade 12 */}
          <div data-reveal="end" className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl lg:col-span-3 dark:border-line dark:bg-surface">
            <div className="h-2 transition-colors" style={{ background: s.color }} />
            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-12 place-items-center rounded-2xl bg-amber-50 text-xl font-black text-amber-600 dark:bg-amber-500/15" dir="ltr">3</span>
                  <div>
                    <h3 className="text-xl font-black text-navy dark:text-white">الصف الثالث الثانوي</h3>
                    <p className="text-xs font-bold text-muted">5 مواد مضافة للمجموع</p>
                  </div>
                </div>
                <div className="text-end"><span className="text-3xl font-black" style={{ color: s.color }} data-count="320">320</span> <span className="text-sm font-bold text-muted">درجة</span></div>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-2">
                {TA_SECTIONS.map((x) => (
                  <button key={x.id} onClick={() => setSec(x.id)} className={cx("rounded-2xl border-2 px-2 py-3 text-xs font-black transition cursor-pointer sm:text-sm", x.id === sec ? "text-white shadow-lg" : "border-slate-200 text-slate-600 hover:border-slate-300 dark:border-line dark:text-muted")}
                    style={x.id === sec ? { background: x.color, borderColor: x.color } : undefined}>
                    <span className="me-1">{x.emoji}</span>{x.name}
                  </button>
                ))}
              </div>
              <div key={s.id} className="animate-in mt-6 space-y-3">
                {s.subjects.map((x) => (
                  <div key={x.name}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-black text-navy dark:text-white"><Subj n={x.name} /></span>
                      <Marks n={x.max} className="font-black text-muted" />
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-surface-3">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(x.max / 80) * 100}%`, background: `linear-gradient(90deg, ${s.color}, color-mix(in srgb, ${s.color} 60%, #fbbf24))` }} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-xs leading-6 text-muted">التربية الدينية والتربية الوطنية واللغة الأجنبية الثانية مواد نجاح ورسوب لا تضاف للمجموع.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Comparison ──────────────────────────────────────────────────────────────

function Compare() {
  return (
    <section className="bg-surface py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <SectionHead icon={Layers} kicker="مقارنة سريعة" title="البكالوريا ولا" accent="الثانوية العامة؟" />
        <div data-reveal="up" className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl dark:border-line dark:bg-surface-2">
          <div className="grid grid-cols-[1fr_1.2fr_1.2fr] text-center text-xs font-black sm:text-sm">
            <div className="bg-slate-50 p-4 dark:bg-surface" />
            <div className="bg-hero p-4 text-white">🎓 البكالوريا المصرية</div>
            <div className="bg-slate-100 p-4 text-navy dark:bg-surface-3 dark:text-white">📘 الثانوية العامة</div>
          </div>
          {COMPARE.map((r, i) => (
            <div key={r.label} className={cx("grid grid-cols-[1fr_1.2fr_1.2fr] border-t border-slate-100 text-center text-xs sm:text-sm dark:border-line", i % 2 === 1 && "bg-slate-50/50 dark:bg-surface/40")}>
              <div className="p-4 text-start font-black text-navy dark:text-white">{r.label}</div>
              <div className="flex items-center justify-center gap-1.5 bg-teal-50/40 p-4 font-bold text-teal-800 dark:bg-teal-500/5 dark:text-teal-300">{r.bac}</div>
              <div className="flex items-center justify-center p-4 font-semibold text-slate-600 dark:text-muted">{r.ta}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="bg-soft-hero py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <SectionHead icon={Sparkles} kicker="أسئلة الطلاب وأولياء الأمور" title="أسئلة" accent="بتتكرر كتير" />
        <div className="space-y-3" data-reveal-stagger="80">
          {FAQ.map((f, i) => {
            const on = open === i;
            return (
              <div key={f.q} className={cx("overflow-hidden rounded-3xl border bg-white transition-all dark:bg-surface", on ? "border-teal-300 shadow-xl shadow-teal-900/5 dark:border-teal-700" : "border-slate-200 dark:border-line")}>
                <button onClick={() => setOpen(on ? null : i)} aria-expanded={on} className="flex w-full items-center justify-between gap-4 p-5 text-start cursor-pointer">
                  <span className="flex items-center gap-3 font-black text-navy dark:text-white">
                    <span className={cx("grid size-8 shrink-0 place-items-center rounded-xl text-xs font-black transition-colors", on ? "bg-brand text-white" : "bg-slate-100 text-slate-500 dark:bg-surface-3")} dir="ltr">{i + 1}</span>
                    {f.q}
                  </span>
                  <ChevronDown className={cx("size-5 shrink-0 text-teal-600 transition-transform duration-300", on && "rotate-180")} />
                </button>
                <div className={cx("grid transition-all duration-300", on ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 ps-16 text-sm leading-7 text-slate-600 dark:text-muted">{f.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Final CTA ───────────────────────────────────────────────────────────────

function FinalCta({ href, label }: { href: string; label: string }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6">
      <div data-reveal="zoom" className="relative overflow-hidden rounded-[32px] bg-hero p-8 text-center text-white shadow-2xl shadow-navy/30 md:p-14">
        <BrandStripe className="absolute inset-x-0 top-0 h-1.5" />
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "18px 18px" }} />
        <div className="relative mx-auto max-w-2xl">
          <div className="flex justify-center gap-2 text-3xl">{TRACKS.map((t) => <span key={t.id} className="float-mid">{t.emoji}</span>)}</div>
          <h2 className="mt-5 text-3xl font-black leading-tight md:text-5xl">ابدأ سنتك <span className="text-amber-300">صح</span> من أول يوم</h2>
          <p className="mt-5 leading-8 text-slate-300">
            مدرسين متخصصين لكل مسار، دروس مسجلة، كويزات بنفس شكل الامتحان، ومتابعة لحظية لولي الأمر — كل ده في {APP_NAME}.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href={href} className="bg-gold glow-gold shimmer-auto inline-flex items-center gap-2 rounded-2xl px-8 py-4 text-lg font-extrabold text-navy transition hover:-translate-y-0.5">
              {label} <ArrowLeft className="size-5" />
            </Link>
            <Link href="/courses" className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-8 py-4 text-lg font-extrabold transition hover:bg-white/15">
              <MonitorPlay className="size-5" /> تصفح الكورسات
            </Link>
          </div>
        </div>
      </div>
      <p className="mt-6 text-center text-[11px] leading-5 text-muted">
        المعلومات مأخوذة من القرارات المعلنة لوزارة التربية والتعليم للعام الدراسي 2026/2027، وقد تخضع لتحديثات رسمية لاحقة.
      </p>
    </section>
  );
}
