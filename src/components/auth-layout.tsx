"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { BarChart3, Moon, QrCode, Sun, Users, BookOpenCheck } from "lucide-react";
import { APP_NAME } from "@/lib/supabase";
import { useTheme } from "@/lib/theme";
import { LogoMark } from "@/components/logo";
import { LangSwitch } from "@/lib/i18n";

export function AuthLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  const { mode, toggle } = useTheme();
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-hero text-white lg:flex lg:flex-col lg:items-center lg:justify-center lg:p-12">
        <div className="brand-stripe absolute inset-x-0 top-0 h-1.5"><span /><span /><span /></div>
        <div className="absolute -top-24 -start-20 size-80 rounded-full bg-white/10" />
        <div className="absolute -bottom-32 -end-16 size-96 rounded-full bg-white/[0.07]" />
        <div className="absolute top-32 end-16 size-16 rounded-full bg-white/10" />
        <Link href="/" className="relative rounded-[34px] border border-white/30 bg-white/15 p-2 shadow-2xl animate-float">
          <LogoMark size={112} className="rounded-[28px]" />
        </Link>
        <h1 className="relative mt-7 text-5xl font-black">{APP_NAME}</h1>
        <p className="relative mt-3 text-lg text-white/85">منصة إدارة التعليم والمتابعة الذكية</p>
        <div className="relative mt-10 flex max-w-md flex-wrap justify-center gap-2.5">
          {[
            { i: QrCode, t: "حضور بالـ QR" },
            { i: BarChart3, t: "تقارير وتحليلات" },
            { i: BookOpenCheck, t: "كويزات تفاعلية" },
            { i: Users, t: "متابعة أولياء الأمور" },
          ].map((f) => (
            <span key={f.t} className="flex items-center gap-2 rounded-full border border-white/25 bg-white/12 px-4 py-2 text-sm font-bold">
              <f.i className="size-4" /> {f.t}
            </span>
          ))}
        </div>
      </div>

      {/* Form panel */}
      <div className="relative flex flex-col bg-bg">
        {/* Phone header */}
        <div className="relative overflow-hidden rounded-b-[36px] bg-hero px-6 pb-20 pt-6 text-center text-white lg:hidden">
          <div className="absolute -top-16 -start-16 size-56 rounded-full bg-white/10" />
          <Link href="/" className="relative mx-auto mt-4 block w-fit rounded-3xl border border-white/30 bg-white/15 p-1.5">
            <LogoMark size={80} />
          </Link>
          <div className="relative mt-3 text-3xl font-black">{APP_NAME}</div>
          <div className="relative text-sm text-white/85">منصة إدارة التعليم والمتابعة الذكية</div>
        </div>

        <LangSwitch className="absolute top-5 end-[4.25rem] z-10 grid size-10 place-items-center rounded-xl border border-white/25 bg-white/15 text-sm font-black text-white lg:border-line lg:bg-surface lg:text-ink cursor-pointer" />
        <button onClick={toggle} aria-label="تبديل الوضع" className="absolute top-5 end-5 z-10 grid size-10 place-items-center rounded-xl border border-white/25 bg-white/15 text-white lg:border-line lg:bg-surface lg:text-ink cursor-pointer">
          {mode === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </button>

        <div className="flex flex-1 items-start justify-center px-4 lg:items-center lg:p-12">
          <div className="relative z-10 -mt-12 w-full max-w-[440px] rounded-[28px] border border-line bg-surface p-6 shadow-soft sm:p-8 lg:mt-0 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none animate-in">
            <h2 className="text-2xl font-black">{title}</h2>
            <p className="mt-1 text-sm text-muted">{subtitle}</p>
            <div className="mt-7">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
