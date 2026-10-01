"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft, BookOpen, Clock, Home, LayoutDashboard, LogIn, Mail, Menu, MessageCircle, Moon, Phone, PlayCircle, Sparkles, Sun, User,
  Users, X, Layers, ShieldCheck, Info,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { LangSwitch } from "@/lib/i18n";
import { APP_NAME } from "@/lib/supabase";
import { homeFor } from "@/lib/types";
import { Fmt, argbToHex, colorFor } from "@/lib/fmt";
import type { CatalogCourse } from "@/lib/catalog";
import { cx } from "./ui";

const NAV = [
  { label: "الرئيسية", href: "/", icon: Home, bar: "bg-teal-500", text: "text-teal-600", tile: "bg-teal-50 text-teal-600" },
  { label: "الكورسات", href: "/courses", icon: Sparkles, highlighted: true, tile: "bg-amber-50 text-amber-600" },
  { label: "المميزات", href: "/#features", icon: Layers, bar: "bg-amber-500", text: "text-amber-600", tile: "bg-amber-50 text-amber-600" },
  { label: "البوابات", href: "/#portals", icon: Users, bar: "bg-emerald-500", text: "text-emerald-600", tile: "bg-emerald-50 text-emerald-600" },
  { label: "الأمان", href: "/#security", icon: ShieldCheck, bar: "bg-violet-500", text: "text-violet-600", tile: "bg-violet-50 text-violet-600" },
  { label: "تواصل معنا", href: "/#contact", icon: MessageCircle, bar: "bg-sky-500", text: "text-sky-600", tile: "bg-sky-50 text-sky-600" },
];

export function BrandStripe({ className }: { className?: string }) {
  return <div className={cx("brand-stripe", className ?? "h-1")}><span /><span /><span /></div>;
}

export function SiteHeader() {
  const { profile, loading } = useAuth();
  const { mode, toggle } = useTheme();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={cx("sticky top-0 z-40 border-b border-slate-200/70 transition-all duration-300 dark:border-line", scrolled ? "glass shadow-lg shadow-slate-900/[0.06]" : "bg-surface")}>
      <BrandStripe />
      <div className={cx("mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 transition-all duration-300 sm:px-6 lg:px-8", scrolled ? "h-16" : "h-20")}>
        <Link href="/" className="group flex shrink-0 items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" className={cx("rounded-2xl object-cover shadow-md transition-all duration-300 group-hover:scale-105", scrolled ? "size-10" : "size-12")} />
          <div className="hidden flex-col sm:flex">
            <span className="text-2xl font-black leading-tight text-navy dark:text-white">{APP_NAME}</span>
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-muted">
              <span className="size-1.5 animate-pulse rounded-full bg-teal-500" /> منصة إدارة التعليم والمتابعة الذكية
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex xl:gap-1">
          {NAV.map((l) => {
            if (l.highlighted) {
              return (
                <Link key={l.href} href={l.href} className="shine mx-1 inline-flex items-center gap-1.5 rounded-full bg-navy px-4 py-2 text-[13px] font-black text-white shadow-lg shadow-navy/25 transition-all hover:-translate-y-0.5">
                  <Sparkles className="size-4 text-amber-300" /> {l.label}
                </Link>
              );
            }
            const active = l.href === "/" ? pathname === "/" : false;
            return (
              <a key={l.href} href={l.href} className={cx("group relative px-2.5 py-2 text-[13px] font-bold whitespace-nowrap transition-colors xl:px-3", active ? l.text : "text-slate-600 hover:text-navy dark:text-muted dark:hover:text-white")}>
                {l.label}
                <span className={cx("absolute inset-x-3 bottom-0 h-[3px] origin-center rounded-full transition-transform duration-300", l.bar, active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100")} />
              </a>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <LangSwitch />
          <button onClick={toggle} aria-label="تبديل الوضع" className="grid size-10 place-items-center rounded-full border border-slate-200 bg-surface text-navy transition hover:border-teal-300 dark:border-line dark:text-white cursor-pointer">
            {mode === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          {loading ? (
            <span className="h-10 w-28 animate-pulse rounded-full bg-slate-100 dark:bg-surface-3" />
          ) : profile ? (
            <Link href={homeFor(profile.role)} className="shine inline-flex h-10 items-center gap-2 rounded-full bg-brand px-4 text-xs font-black text-white shadow-lg shadow-navy/25 transition-all hover:-translate-y-0.5 sm:h-11 sm:px-5 sm:text-sm">
              <LayoutDashboard className="size-4" /> لوحتي
            </Link>
          ) : (
            <Link href="/login" className="shine inline-flex h-10 items-center gap-2 rounded-full bg-brand px-4 text-xs font-black text-white shadow-lg shadow-navy/25 transition-all hover:-translate-y-0.5 sm:h-11 sm:px-5 sm:text-sm">
              <User className="size-4" /> دخول<span className="hidden sm:inline"> / حساب جديد</span>
            </Link>
          )}
          <button onClick={() => setOpen((v) => !v)} aria-label="القائمة" className="grid size-10 place-items-center rounded-full border border-slate-200 bg-slate-100 text-navy lg:hidden dark:border-line dark:bg-surface-3 dark:text-white cursor-pointer">
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      <div className={cx("overflow-hidden transition-all duration-300 lg:hidden", open ? "max-h-[80vh] opacity-100" : "max-h-0 opacity-0")}>
        <div className="grid grid-cols-2 gap-2 border-t border-slate-100 bg-surface px-4 pt-3 pb-5 dark:border-line">
          {[...NAV].sort((a, b) => Number(!!b.highlighted) - Number(!!a.highlighted)).map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className={cx("flex items-center gap-2.5 rounded-2xl border p-3 transition-colors", l.highlighted ? "col-span-2 border-navy bg-navy text-white" : "border-slate-200/70 bg-slate-50 text-navy dark:border-line dark:bg-surface-2 dark:text-white")}>
              <span className={cx("grid size-9 shrink-0 place-items-center rounded-xl", l.highlighted ? "bg-white/10 text-amber-300" : l.tile)}><l.icon className="size-4" /></span>
              <span className="text-sm font-black">{l.label}</span>
            </a>
          ))}
          {!profile && (
            <Link href="/login" className="col-span-2 flex items-center justify-center gap-2 rounded-2xl bg-brand py-3.5 text-sm font-black text-white">
              <LogIn className="size-4" /> دخول / حساب جديد
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export function SiteFooter({ phone }: { phone?: string | null }) {
  return (
    <footer id="contact" className="relative overflow-hidden bg-navy text-white">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(20,184,166,0.25),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(245,158,11,0.18),transparent_55%)]" />
      <BrandStripe className="relative h-1.5" />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="" className="size-12 rounded-2xl object-cover" />
            <span className="text-2xl font-black">{APP_NAME}</span>
          </div>
          <p className="mt-4 leading-7 text-slate-300">منصة متكاملة لإدارة السناتر والمدارس: حضور ذكي، كورسات ودروس، كويزات تفاعلية، ومتابعة لحظية لأولياء الأمور.</p>
        </div>
        <div>
          <h4 className="mb-4 font-black text-amber-300">روابط سريعة</h4>
          <ul className="space-y-2.5 text-slate-300">
            <li><Link href="/courses" className="hover:text-white">الكورسات</Link></li>
            <li><Link href="/#features" className="hover:text-white">المميزات</Link></li>
            <li><Link href="/login" className="hover:text-white">تسجيل الدخول</Link></li>
            <li><Link href="/register" className="hover:text-white">حساب ولي أمر / طالب</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-4 font-black text-amber-300">تواصل معنا</h4>
          <ul className="space-y-3 text-slate-300">
            {phone && <li className="flex items-center gap-2"><Phone className="size-4 text-teal-300" /><span dir="ltr">{phone}</span></li>}
            <li className="flex items-center gap-2"><MessageCircle className="size-4 text-teal-300" /> رسائل مباشرة من داخل المنصة</li>
            <li className="flex items-center gap-2"><Mail className="size-4 text-teal-300" /> الدعم الفني لإدارة المركز</li>
          </ul>
        </div>
      </div>
      <div className="relative border-t border-white/10 py-5 text-center text-sm text-slate-400">© {new Date().getFullYear()} {APP_NAME} — جميع الحقوق محفوظة</div>
    </footer>
  );
}

export function DemoBanner() {
  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs font-bold text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
      <Info className="me-1 inline size-4" />
      عرض توضيحي: قاعدة البيانات غير متصلة حالياً، والكورسات المعروضة أمثلة للتوضيح فقط.
    </div>
  );
}

export function courseColor(c: CatalogCourse) {
  return c.color ? argbToHex(c.color) : colorFor(c.subject || c.title);
}

export function totalMinutes(c: CatalogCourse) {
  return Math.round(c.lessons.reduce((a, l) => a + (l.duration_seconds || 0), 0) / 60);
}

export function CourseCard({ c, currency = "ج.م" }: { c: CatalogCourse; currency?: string }) {
  const color = courseColor(c);
  const mins = totalMinutes(c);
  return (
    <div className="group relative h-full rounded-[2rem] p-[2px] shadow-xl shadow-slate-900/[0.06] transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl"
      style={{ background: `linear-gradient(135deg, color-mix(in srgb, ${color} 55%, var(--surface)), var(--surface) 50%, color-mix(in srgb, ${color} 40%, var(--surface)))` }}>
      <div className="shine relative flex h-full flex-col overflow-hidden rounded-[calc(2rem-2px)] bg-surface">
        <div className="relative h-40 overflow-hidden" style={{ background: `linear-gradient(135deg, color-mix(in srgb, ${color} 70%, white), ${color})` }}>
          <div className="dot-pattern absolute inset-0 opacity-25" />
          <span className="absolute -top-10 -end-10 size-40 rounded-full bg-white/15 transition-transform duration-700 group-hover:scale-125" />
          <span className="absolute top-8 end-16 size-16 rounded-full border-2 border-white/30 transition-transform duration-700 group-hover:-translate-y-2 group-hover:translate-x-3" />
          <span className="absolute -bottom-12 start-10 size-28 rounded-full bg-black/10 transition-transform duration-700 group-hover:scale-110" />
          <div className="relative flex h-full items-end justify-between p-5 text-white">
            <div>
              <span className="mb-1 block text-[11px] font-black tracking-wide text-white/85">{c.grade || c.class_name}</span>
              <span className="block text-6xl leading-none drop-shadow-[0_6px_16px_rgba(0,0,0,0.18)] transition-transform duration-500 group-hover:scale-110">{c.icon || "📚"}</span>
            </div>
            <span className="grid size-12 place-items-center rounded-2xl border border-white/30 bg-white/20 backdrop-blur transition-transform duration-500 group-hover:rotate-12"><PlayCircle className="size-6" /></span>
          </div>
          <svg className="absolute inset-x-0 -bottom-px h-6 w-full text-[var(--surface)]" viewBox="0 0 400 24" preserveAspectRatio="none" aria-hidden><path d="M0 24 C 120 0, 280 0, 400 24 Z" fill="currentColor" /></svg>
        </div>
        <div className="flex flex-1 flex-col px-6 pt-3 pb-6">
          <Link href={`/courses/${c.id}`}><h3 className="text-xl font-black leading-snug text-navy dark:text-white">{c.title}</h3></Link>
          <span className="mt-3 block h-1 w-10 rounded-full transition-all duration-500 group-hover:w-20" style={{ background: color }} />
          {c.teacher && <p className="mt-2 text-xs font-bold" style={{ color }}>{c.teacher}</p>}
          {c.description && <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-600 dark:text-muted">{c.description}</p>}
          <ul className="mt-4 space-y-2 text-xs font-semibold text-slate-700 dark:text-ink/80">
            <li className="flex items-center gap-2"><BookOpen className="size-4" style={{ color }} /> {c.lessons.length} درس</li>
            {mins > 0 && <li className="flex items-center gap-2"><Clock className="size-4" style={{ color }} /> {durationLabel(mins)}</li>}
            <li className="flex items-center gap-2"><Users className="size-4" style={{ color }} /> {c.class_name}</li>
          </ul>
          <div className="flex-1" />
          {c.monthly_fee > 0 && (
            <div className="mt-6 flex items-center justify-between gap-2 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-line dark:bg-surface-2">
              <span className="text-xs font-black text-slate-500 dark:text-muted">الاشتراك الشهري</span>
              <span className="flex items-baseline gap-1.5"><span className="text-2xl font-black" style={{ color }}>{Fmt.number(c.monthly_fee)}</span><span className="text-xs font-black text-slate-500">{currency}</span></span>
            </div>
          )}
          <Link href={`/courses/${c.id}`} className="mt-4 flex w-full items-center justify-between gap-2 rounded-2xl px-4 py-3.5 text-sm font-black text-white shadow-lg transition-all hover:brightness-110" style={{ background: color, boxShadow: `0 10px 22px -12px ${color}` }}>
            <span className="flex items-center gap-2"><PlayCircle className="size-4" /> تفاصيل الكورس والدروس</span>
            <span className="grid size-7 place-items-center rounded-full bg-white/20 transition-transform group-hover:-translate-x-1"><ArrowLeft className="size-4" /></span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export function durationLabel(mins: number) {
  if (mins < 60) return `${mins} دقيقة`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} ساعة و ${m} دقيقة` : `${h} ساعة`;
}
