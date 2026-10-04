"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { BarChart3, Moon, QrCode, Sun, Users, BookOpenCheck } from "lucide-react";
import { APP_NAME } from "@/lib/supabase";
import { useTheme } from "@/lib/theme";
import { TRACKS } from "@/lib/education";
import { LogoMark } from "@/components/logo";
import { LangSwitch } from "@/lib/i18n";
import { Marquee, RotatingWord } from "@/components/fx";

const ORBIT = ["⚛️", "📖", "🧪", "📐", "🧬", "💻"];

const TOASTS = [
  { e: "✅", t: "تم تسجيل حضور أحمد", s: "منذ دقيقة", pos: "top-[9%] start-[6%]", cls: "float-slow" },
  { e: "🏆", t: "درجة الكويز 19 / 20", s: "الفيزياء — 2 بكالوريا", pos: "top-[6%] end-[4%]", cls: "float-mid" },
  { e: "🎯", t: "خطة مذاكرتك جاهزة", s: "مسار الطب وعلوم الحياة", pos: "bottom-[12%] end-[4%]", cls: "float-fast", tall: true },
];

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  const { mode, toggle } = useTheme();
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-hero text-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:items-center lg:justify-center lg:p-12">
        <div className="aurora opacity-40" />
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
        <div className="brand-stripe absolute inset-x-0 top-0 h-1.5"><span /><span /><span /></div>

        {/* Live-looking notifications */}
        {TOASTS.map((x) => (
          <div key={x.t} className={`absolute z-10 hidden items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 shadow-2xl backdrop-blur-md ${"tall" in x ? "xl:[@media(min-height:880px)]:flex" : "xl:flex"} ${x.pos} ${x.cls}`}>
            <span className="grid size-10 place-items-center rounded-xl bg-white/15 text-xl">{x.e}</span>
            <span><span className="block text-sm font-black">{x.t}</span><span className="block text-[11px] font-bold text-white/65">{x.s}</span></span>
          </div>
        ))}

        {/* Lighthouse with a sweeping beam and orbiting subjects */}
        <div className="relative grid size-64 place-items-center">
          <span className="beam" />
          {ORBIT.map((e, i) => (
            <span key={e} className="orbit absolute grid size-12 place-items-center rounded-2xl border border-white/20 bg-white/10 text-2xl shadow-xl backdrop-blur"
              style={{ top: `${50 - 46 * Math.cos((i / ORBIT.length) * 2 * Math.PI)}%`, left: `${50 + 46 * Math.sin((i / ORBIT.length) * 2 * Math.PI)}%`, translate: "-50% -50%", animationDelay: `${-i * 2.3}s` }}>
              {e}
            </span>
          ))}
          <Link href="/" className="relative rounded-[34px] border border-white/30 bg-white/15 p-2 shadow-2xl shadow-amber-500/20 animate-float">
            <LogoMark size={112} className="rounded-[28px]" />
          </Link>
        </div>

        <h1 className="relative mt-6 text-5xl font-black"><span className="shimmer-text">{APP_NAME}</span></h1>
        <p className="relative mt-3 text-lg text-white/85">
          منصة واحدة لـ <RotatingWord words={["الحضور", "الكورسات", "الكويزات", "البكالوريا", "المتابعة"]} className="font-black text-amber-300" />
        </p>
        <div className="relative mt-8 flex max-w-md flex-wrap justify-center gap-2.5">
          {[
            { i: QrCode, t: "حضور بالـ QR" },
            { i: BarChart3, t: "تقارير وتحليلات" },
            { i: BookOpenCheck, t: "كويزات تفاعلية" },
            { i: Users, t: "متابعة أولياء الأمور" },
          ].map((f) => (
            <span key={f.t} className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/15">
              <f.i className="size-4 text-amber-300" /> {f.t}
            </span>
          ))}
        </div>

        <div className="absolute inset-x-0 bottom-6">
          <Marquee>
            {TRACKS.flatMap((t) => [...t.g3, ...t.g2Options].map((s) => ({ s: s.replace(" (مستوى رفيع)", ""), t }))).filter((x, i, a) => a.findIndex((y) => y.s === x.s) === i).map(({ s, t }) => (
              <span key={s} className="flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3.5 py-1.5 text-xs font-bold whitespace-nowrap text-white/85">
                <span>{t.emoji}</span> {s}
              </span>
            ))}
          </Marquee>
        </div>
      </div>

      {/* Form panel */}
      <div className="bg-soft-hero relative flex flex-col overflow-hidden">
        <div className="pointer-events-none absolute -top-40 -end-40 hidden size-[520px] rounded-full bg-teal-300/20 blur-[110px] lg:block" />
        <div className="pointer-events-none absolute -bottom-40 -start-32 hidden size-[460px] rounded-full bg-amber-300/20 blur-[110px] lg:block" />
        <div className="grid-lines pointer-events-none absolute inset-0 hidden opacity-30 lg:block" />

        {/* Phone header */}
        <div className="relative overflow-hidden rounded-b-[36px] bg-hero px-6 pb-20 pt-6 text-center text-white lg:hidden">
          <div className="aurora opacity-40" />
          <Link href="/" className="relative mx-auto mt-4 grid w-fit place-items-center">
            <span className="beam" />
            <span className="relative block rounded-3xl border border-white/30 bg-white/15 p-1.5"><LogoMark size={80} /></span>
          </Link>
          <div className="relative mt-3 text-3xl font-black"><span className="shimmer-text">{APP_NAME}</span></div>
          <div className="relative text-sm text-white/85">منصة إدارة التعليم والمتابعة الذكية</div>
        </div>

        <LangSwitch className="absolute top-5 end-[4.25rem] z-20 grid size-10 place-items-center rounded-xl border border-white/25 bg-white/15 text-sm font-black text-white backdrop-blur lg:border-line lg:bg-surface lg:text-ink cursor-pointer" />
        <button onClick={toggle} aria-label="تبديل الوضع" className="absolute top-5 end-5 z-20 grid size-10 place-items-center rounded-xl border border-white/25 bg-white/15 text-white backdrop-blur lg:border-line lg:bg-surface lg:text-ink cursor-pointer">
          {mode === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </button>

        <div className="relative flex flex-1 items-start justify-center px-4 pb-10 lg:items-center lg:px-12 lg:pt-24 lg:pb-12">
          <div className="glow-border relative z-10 -mt-12 w-full max-w-[460px] rounded-[28px] border border-line bg-surface/95 p-6 shadow-2xl shadow-slate-900/10 backdrop-blur-xl sm:p-8 lg:mt-0 animate-in">
            <div className="brand-stripe absolute inset-x-8 top-0 h-1 overflow-hidden rounded-b-full"><span /><span /><span /></div>
            <h2 className="text-2xl font-black sm:text-3xl">{title}</h2>
            <p className="mt-1 text-sm text-muted">{subtitle}</p>
            <div className="mt-7">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
