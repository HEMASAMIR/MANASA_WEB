"use client";

import Link from "next/link";
import { ArrowLeft, GraduationCap, Home, PlayCircle } from "lucide-react";
import { LogoMark } from "@/components/logo";
import { BrandStripe } from "@/components/site";

export default function NotFound() {
  return (
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-hero px-5 text-center text-white">
      <div className="aurora opacity-50" />
      <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
      <BrandStripe className="absolute inset-x-0 top-0 h-1.5" />
      <div className="relative max-w-xl animate-in">
        <div className="relative mx-auto grid size-36 place-items-center">
          <span className="beam" />
          <LogoMark size={104} className="relative animate-float rounded-[28px]" />
        </div>
        <div className="mt-6 text-[7rem] leading-none font-black text-transparent [-webkit-text-stroke:2px_rgba(255,255,255,0.35)]" dir="ltr">404</div>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">الصفحة دي <span className="shimmer-text">مش موجودة</span></h1>
        <p className="mt-3 leading-8 text-slate-300">يمكن الرابط اتغير أو اتكتب غلط. المنارة هتنوّر لك الطريق 👇</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="bg-gold glow-gold shimmer-auto inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 font-black text-navy transition hover:-translate-y-0.5">
            <Home className="size-5" /> الرئيسية
          </Link>
          <Link href="/courses" className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-3.5 font-black transition hover:bg-white/15">
            <PlayCircle className="size-5" /> الكورسات
          </Link>
          <Link href="/baccalaureate" className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-6 py-3.5 font-black transition hover:bg-white/15">
            <GraduationCap className="size-5" /> دليل البكالوريا <ArrowLeft className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
