"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft, BookOpen, Clock, Home, LayoutDashboard, LogIn, Mail, Menu, MessageCircle, Moon, Phone, PlayCircle, Sparkles, Sun, User,
  Users, X, Layers, ShieldCheck, Info, GraduationCap, ArrowUp, ChevronLeft, Smartphone, Languages,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { LangSwitch } from "@/lib/i18n";
import { APP_NAME } from "@/lib/supabase";
import { homeFor } from "@/lib/types";
import { Fmt, argbToHex, colorFor, whatsappLink } from "@/lib/fmt";
import { TRACKS } from "@/lib/education";
import type { CatalogCourse } from "@/lib/catalog";
import { parseStage, subjectTracks } from "@/lib/curriculum";
import { LogoMark } from "@/components/logo";
import { cx } from "./ui";

const NAV: { label: string; href: string; icon: typeof Home; bar?: string; text?: string; tile: string; highlighted?: boolean; badge?: string }[] = [
  { label: "الرئيسية", href: "/", icon: Home, bar: "bg-teal-500", text: "text-teal-600", tile: "bg-teal-50 text-teal-600" },
  { label: "الكورسات", href: "/courses", icon: Sparkles, highlighted: true, tile: "bg-amber-50 text-amber-600" },
  { label: "البكالوريا", href: "/baccalaureate", icon: GraduationCap, bar: "bg-rose-500", text: "text-rose-600", tile: "bg-rose-50 text-rose-600" },
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
    <>
    <header className={cx("sticky top-0 z-40 border-b border-slate-200/70 transition-all duration-300 dark:border-line", scrolled ? "glass shadow-lg shadow-slate-900/[0.06]" : "bg-surface")}>
      <BrandStripe />
      <div className={cx("mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 transition-all duration-300 sm:px-6 lg:px-8", scrolled ? "h-16" : "h-20")}>
        <Link href="/" className="group flex shrink-0 items-center gap-3">
          <LogoMark size={scrolled ? 42 : 50} className="shrink-0 drop-shadow-[0_8px_16px_rgba(14,44,78,0.25)] transition-all duration-300 group-hover:scale-105 group-hover:-rotate-3" />
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
                <Link key={l.href} href={l.href} className="shimmer-auto mx-1 inline-flex items-center gap-1.5 rounded-full bg-navy px-4 py-2 text-[13px] font-black text-white shadow-lg shadow-navy/25 transition-all hover:-translate-y-0.5">
                  <Sparkles className="size-4 text-amber-300" /> {l.label}
                </Link>
              );
            }
            const active = !l.href.includes("#") && pathname === l.href;
            return (
              <a key={l.href} href={l.href} className={cx("group relative px-2.5 py-2 text-[13px] font-bold whitespace-nowrap transition-colors xl:px-3", active ? l.text : "text-slate-600 hover:text-navy dark:text-muted dark:hover:text-white")}>
                {l.label}
                {l.badge && <span className="absolute -top-1.5 end-0 rounded-full bg-rose-500 px-1.5 py-px text-[9px] leading-tight font-black text-white shadow-sm shadow-rose-500/40">{l.badge}</span>}
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
              {l.badge && <span className="ms-auto rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-black text-white">{l.badge}</span>}
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
    <SiteBottomNav />
    </>
  );
}

/** Floating tab bar for phones and tablets, always visible. */
function SiteBottomNav() {
  const { profile } = useAuth();
  const pathname = usePathname();

  const items: { href: string; label: string; icon: typeof Home; center?: boolean }[] = [
    { href: "/", label: "الرئيسية", icon: Home },
    { href: "/courses", label: "الكورسات", icon: PlayCircle },
    { href: "/baccalaureate", label: "البكالوريا", icon: GraduationCap, center: true },
    { href: "/#contact", label: "تواصل", icon: MessageCircle },
    profile ? { href: homeFor(profile.role), label: "لوحتي", icon: LayoutDashboard } : { href: "/login", label: "دخول", icon: User },
  ];
  const isOn = (h: string) => (h === "/" ? pathname === "/" : !h.includes("#") && (pathname === h || pathname.startsWith(h + "/")));

  return (
    <nav aria-label="التنقل" className="fixed inset-x-3 bottom-3 z-40 lg:hidden no-print"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}>
      <div className="glass relative mx-auto flex h-[70px] max-w-md items-center rounded-[26px] border border-slate-200/80 px-1 shadow-[0_18px_40px_-14px_rgba(14,44,78,0.4)] dark:border-line">
        <BrandStripe className="absolute inset-x-10 top-0 h-[3px] overflow-hidden rounded-b-full" />
        {items.map((it) => {
          const on = isOn(it.href);
          if (it.center) {
            return (
              <Link key={it.href} href={it.href} className="relative -mt-9 flex flex-1 flex-col items-center gap-1">
                <span className="pulse-ring rounded-full text-amber-400">
                  <span className={cx("bg-gold relative grid size-[60px] place-items-center rounded-full text-navy ring-4 ring-[var(--surface)] transition-transform duration-300 active:scale-90", on ? "glow-gold scale-105" : "shadow-[0_12px_26px_-8px_rgba(245,158,11,0.8)]")}>
                    <it.icon className="size-7" />
                  </span>
                </span>
                <span className={cx("text-[10.5px] leading-none font-black", on ? "text-amber-600 dark:text-amber-300" : "text-amber-700/90 dark:text-amber-300/90")}>{it.label}</span>
              </Link>
            );
          }
          return (
            <Link key={it.href} href={it.href} className="group relative flex flex-1 flex-col items-center gap-1">
              <span className={cx("grid h-9 place-items-center rounded-2xl transition-all duration-300 group-active:scale-90", on ? "w-12 bg-brand text-white shadow-[0_8px_16px_-6px_rgba(13,148,136,0.9)]" : "w-10 text-slate-500 dark:text-muted")}>
                <it.icon className="size-5" />
              </span>
              <span className={cx("max-w-[64px] truncate text-[10.5px] leading-none", on ? "font-black text-primary" : "font-bold text-slate-500 dark:text-muted")}>{it.label}</span>
              {on && <span className="absolute -bottom-2 size-1 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

const FOOTER_LINKS = [
  { href: "/courses", label: "الكورسات" },
  { href: "/baccalaureate", label: "دليل البكالوريا والثانوية العامة" },
  { href: "/#features", label: "المميزات" },
  { href: "/#how", label: "إزاي بتشتغل؟" },
  { href: "/login", label: "تسجيل الدخول" },
  { href: "/register", label: "حساب ولي أمر / طالب" },
];

export function SiteFooter({ phone }: { phone?: string | null }) {
  const wa = whatsappLink(phone, "مرحباً، عايز أعرف تفاصيل أكتر عن منارة");
  return (
    <footer id="contact" className="relative overflow-hidden bg-navy text-white">
      <div className="aurora opacity-30" />
      <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
      <BrandStripe className="relative h-1.5" />

      {/* Call to action */}
      <div className="relative mx-auto max-w-7xl px-5 pt-14">
        <div data-reveal="zoom" className="glow-border spotlight relative flex flex-col items-center gap-8 overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.06] p-7 text-center backdrop-blur-md sm:p-10 lg:flex-row lg:text-start"
          style={{ "--spot": "rgba(251, 191, 36, 0.12)", "--spot-size": "520px" } as React.CSSProperties}>
          <div className="relative grid size-28 shrink-0 place-items-center">
            <span className="beam" />
            <LogoMark size={84} className="relative drop-shadow-[0_12px_30px_rgba(251,191,36,0.35)]" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-3xl font-black leading-tight sm:text-4xl">جاهز <span className="shimmer-text">تنوّر</span> مركزك؟</h3>
            <p className="mt-3 max-w-xl leading-8 text-slate-300 lg:max-w-none">ابدأ مع {APP_NAME} النهارده — حضور ذكي، كورسات بالبكالوريا والثانوية العامة، كويزات، ومتابعة لحظية لكل طالب.</p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row lg:flex-col xl:flex-row">
            <Link href="/register" className="bg-gold glow-gold shimmer-auto inline-flex items-center justify-center gap-2 rounded-2xl px-7 py-4 font-black text-navy transition hover:-translate-y-0.5">
              ابدأ الآن مجاناً <ArrowLeft className="size-5" />
            </Link>
            {wa && (
              <a href={wa} target="_blank" rel="noreferrer" className="shine inline-flex items-center justify-center gap-2 rounded-2xl bg-[#25d366] px-7 py-4 font-black text-white shadow-lg shadow-[#25d366]/25 transition hover:-translate-y-0.5">
                <MessageCircle className="size-5" /> كلّمنا واتساب
              </a>
            )}
            <Link href="/login" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-7 py-4 font-black transition hover:bg-white/15">
              <PlayCircle className="size-5" /> جرّب المنصة
            </Link>
          </div>
        </div>
      </div>

      {/* Columns */}
      <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-[1.35fr_1fr_1fr_1.15fr]" data-reveal-stagger="120">
        <div>
          <div className="flex items-center gap-3">
            <LogoMark size={52} />
            <div>
              <span className="block text-2xl font-black">{APP_NAME}</span>
              <span className="block text-xs font-bold text-teal-300">منصة إدارة التعليم والمتابعة الذكية</span>
            </div>
          </div>
          <p className="mt-4 leading-7 text-slate-300">منصة متكاملة لإدارة السناتر والمدارس: حضور ذكي، كورسات ودروس، كويزات تفاعلية، ومتابعة لحظية لأولياء الأمور.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {[
              { i: Smartphone, t: "ويب + موبايل" },
              { i: ShieldCheck, t: "بيانات محمية" },
              { i: Languages, t: "عربي / English" },
            ].map((x) => (
              <span key={x.t} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-xs font-bold text-slate-200">
                <x.i className="size-3.5 text-amber-300" /> {x.t}
              </span>
            ))}
          </div>
        </div>

        <div>
          <FooterTitle>روابط سريعة</FooterTitle>
          <ul className="space-y-2.5">
            {FOOTER_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="group inline-flex items-center gap-1.5 text-slate-300 transition-colors hover:text-white">
                  <ChevronLeft className="size-4 -me-1 text-amber-300 opacity-0 transition-all duration-300 group-hover:me-0 group-hover:opacity-100" />
                  <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-bottom-right bg-no-repeat transition-[background-size] duration-300 group-hover:bg-[length:100%_1px]">{l.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <FooterTitle>مسارات البكالوريا</FooterTitle>
          <ul className="space-y-2">
            {TRACKS.map((t) => (
              <li key={t.id}>
                <Link href={`/courses?stage=bac2&track=${t.id}`} className="group flex items-center gap-3 rounded-xl p-1.5 -ms-1.5 transition-colors hover:bg-white/[0.06]">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl text-lg transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6" style={{ background: `${t.color}33`, boxShadow: `inset 0 0 0 1px ${t.color}55` }}>{t.emoji}</span>
                  <span className="text-sm font-bold text-slate-200 group-hover:text-white">{t.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <FooterTitle>تواصل معنا</FooterTitle>
          <div className="space-y-2.5">
            {phone && (
              <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-3 transition hover:border-teal-300/40 hover:bg-white/[0.09]">
                <span className="grid size-10 place-items-center rounded-xl bg-teal-400/15 text-teal-300 transition-transform group-hover:scale-110"><Phone className="size-5" /></span>
                <span className="min-w-0"><span className="block text-[11px] font-bold text-slate-400">اتصل بنا</span><span className="block font-black" dir="ltr">{phone}</span></span>
              </a>
            )}
            {wa && (
              <a href={wa} target="_blank" rel="noreferrer" className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-3 transition hover:border-[#25d366]/50 hover:bg-white/[0.09]">
                <span className="grid size-10 place-items-center rounded-xl bg-[#25d366]/15 text-[#25d366] transition-transform group-hover:scale-110"><MessageCircle className="size-5" /></span>
                <span><span className="block text-[11px] font-bold text-slate-400">واتساب</span><span className="block font-black">راسلنا في أي وقت</span></span>
              </a>
            )}
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-3">
              <span className="grid size-10 place-items-center rounded-xl bg-amber-400/15 text-amber-300"><Mail className="size-5" /></span>
              <span><span className="block text-[11px] font-bold text-slate-400">من داخل المنصة</span><span className="block font-black">رسائل مباشرة للمدرس والإدارة</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* Giant outlined name */}
      <div aria-hidden className="pointer-events-none relative -mb-[3%] select-none overflow-hidden text-center text-[clamp(6rem,19vw,17rem)] leading-[0.85] font-black text-transparent [-webkit-text-stroke:1.5px_rgba(255,255,255,0.07)]">
        {APP_NAME}
      </div>

      <div className="relative border-t border-white/10 bg-navy/60 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 py-5 text-sm text-slate-400 sm:flex-row">
          <span>© {new Date().getFullYear()} {APP_NAME} — جميع الحقوق محفوظة</span>
          <span className="flex items-center gap-1.5"><Sparkles className="size-4 text-amber-300" /> صُممت للسناتر والمدارس في مصر والخليج</span>
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="لأعلى الصفحة"
            className="group grid size-11 place-items-center rounded-full border border-white/15 bg-white/10 text-white transition hover:-translate-y-1 hover:bg-white/20 cursor-pointer">
            <ArrowUp className="size-5 transition-transform group-hover:-translate-y-0.5" />
          </button>
        </div>
      </div>
      <div aria-hidden className="h-24 lg:hidden" />
    </footer>
  );
}

function FooterTitle({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="mb-5 flex items-center gap-2 font-black text-amber-300">
      <span className="h-4 w-1 rounded-full bg-gradient-to-b from-amber-300 to-teal-400" /> {children}
    </h4>
  );
}

export function DemoBanner() {
  return (
    <div className="relative z-50 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-amber-200 bg-gradient-to-l from-amber-50 via-amber-100/70 to-amber-50 px-4 py-2 text-center text-xs font-bold text-amber-900 dark:border-amber-900 dark:from-amber-950/40 dark:via-amber-900/30 dark:to-amber-950/40 dark:text-amber-200">
      <span className="flex items-center gap-1.5"><Info className="size-4" /> نسخة تجريبية ببيانات توضيحية</span>
      <Link href="/login" className="rounded-full bg-navy px-3 py-1 text-[11px] font-black text-white shadow hover:bg-teal-700">جرّب لوحة الأدمن الآن ←</Link>
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
      <div className="shine sweep-once relative flex h-full flex-col overflow-hidden rounded-[calc(2rem-2px)] bg-surface">
        <div className="relative h-40 overflow-hidden" style={{ background: `linear-gradient(135deg, color-mix(in srgb, ${color} 70%, white), ${color})` }}>
          <div className="dot-pattern absolute inset-0 opacity-25" />
          <span className="absolute -top-10 -end-10 size-40 rounded-full bg-white/15 transition-transform duration-700 group-hover:scale-125" />
          <span className="absolute top-8 end-16 size-16 rounded-full border-2 border-white/30 transition-transform duration-700 group-hover:-translate-y-2 group-hover:translate-x-3" />
          <span className="absolute -bottom-12 start-10 size-28 rounded-full bg-black/10 transition-transform duration-700 group-hover:scale-110" />
          <div className="relative flex h-full items-end justify-between p-5 text-white">
            <div>
              <span className="relative z-10 mb-2 block w-fit rounded-full bg-black/15 px-2.5 py-0.5 text-[11px] font-black tracking-wide text-white backdrop-blur-sm">{parseStage(c.grade)?.short ?? (c.grade || c.class_name)}</span>
              <span className="float-mid block text-6xl leading-none drop-shadow-[0_6px_16px_rgba(0,0,0,0.18)] transition-transform duration-500 group-hover:scale-110">{c.icon || "📚"}</span>
            </div>
            <span className="grid size-12 place-items-center rounded-2xl border border-white/30 bg-white/20 backdrop-blur transition-transform duration-500 group-hover:rotate-12"><PlayCircle className="size-6" /></span>
          </div>
          <svg className="absolute inset-x-0 -bottom-px h-6 w-full text-[var(--surface)]" viewBox="0 0 400 24" preserveAspectRatio="none" aria-hidden><path d="M0 24 C 120 0, 280 0, 400 24 Z" fill="currentColor" /></svg>
        </div>
        <div className="flex flex-1 flex-col px-6 pt-3 pb-6">
          <Link href={`/courses/${c.id}`}><h3 className="text-xl font-black leading-snug text-navy dark:text-white">{c.title}</h3></Link>
          <span className="mt-3 block h-1 w-10 rounded-full transition-all duration-500 group-hover:w-20" style={{ background: color }} />
          {c.teacher && <p className="mt-2 text-xs font-bold" style={{ color }}>{c.teacher}</p>}
          {subjectTracks(parseStage(c.grade), c.subject).length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {subjectTracks(parseStage(c.grade), c.subject).map((t) => (
                <span key={t.id} className="rounded-full px-2 py-0.5 text-[10px] font-black" style={{ color: t.color, background: `${t.color}1a` }}>{t.emoji} {t.name}</span>
              ))}
            </div>
          )}
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
