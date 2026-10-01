"use client";

import Link from "next/link";
import {
  ArrowLeft, BarChart3, BellRing, BookOpenCheck, CalendarDays, CheckCircle2, CreditCard, GraduationCap, LayoutDashboard,
  MessagesSquare, Moon, QrCode, ShieldCheck, Smartphone, Sparkles, Sun, Trophy, Users,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { APP_NAME } from "@/lib/supabase";
import { homeFor } from "@/lib/types";
import { IconBadge } from "@/components/ui";

const features = [
  { icon: QrCode, color: "#6D5DFC", title: "حضور ذكي بالـ QR", text: "رمز متغير كل 5 ثوانٍ ضد الغش، مع تحقق اختياري من موقع الطالب داخل المركز." },
  { icon: BookOpenCheck, color: "#10B981", title: "كويزات تفاعلية", text: "تصحيح تلقائي على السيرفر، توقيت، محاولات متعددة، وخلط الأسئلة." },
  { icon: BarChart3, color: "#0EA5E9", title: "تقارير وتحليلات", text: "منحنيات الحضور، تنبيهات الغياب المتكرر، وتصدير Excel بضغطة." },
  { icon: CreditCard, color: "#F59E0B", title: "المالية والاشتراكات", text: "تجديد الاشتراكات، متابعة المتأخرين في السداد، وإيرادات الشهر." },
  { icon: MessagesSquare, color: "#EC4899", title: "تواصل مباشر", text: "محادثات بين المدرس وولي الأمر، إشعارات فورية، ورسائل جماعية." },
  { icon: GraduationCap, color: "#8B5CF6", title: "كورسات ودروس", text: "محتوى مرئي منظم، ومتابعة تقدم كل طالب درساً بدرس." },
];

const portals = [
  { icon: LayoutDashboard, title: "لوحة الإدارة والمدرسين", points: ["إدارة الطلاب والمجموعات والجدول", "الحضور والدرجات والكويزات", "المالية والتقارير وسجل العمليات", "صلاحيات دقيقة للمساعدين"] },
  { icon: GraduationCap, title: "بوابة الطالب", points: ["كورساتي ومتابعة التقدم", "حل الكويزات والامتحانات", "الدرجات والجدول الدراسي", "تسجيل الحضور بمسح الـ QR"] },
  { icon: Users, title: "بوابة ولي الأمر", points: ["متابعة حضور الأبناء لحظياً", "الدرجات والتقارير", "حالة الاشتراك والمدفوعات", "التواصل المباشر مع المدرس"] },
];

export default function Landing() {
  const { profile } = useAuth();
  const { mode, toggle } = useTheme();
  const cta = profile ? { href: homeFor(profile.role), label: "الذهاب للوحة التحكم" } : { href: "/login", label: "تسجيل الدخول" };

  return (
    <div className="min-h-screen overflow-x-hidden bg-bg">
      {/* Header */}
      <header className="fixed inset-x-0 top-0 z-40 glass border-b border-line/60">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" className="size-10 rounded-xl object-cover shadow" />
          <span className="text-xl font-black">{APP_NAME}</span>
          <nav className="ms-8 hidden gap-6 text-sm font-bold text-muted md:flex">
            <a href="#features" className="hover:text-primary">المميزات</a>
            <a href="#portals" className="hover:text-primary">البوابات</a>
            <a href="#security" className="hover:text-primary">الأمان</a>
          </nav>
          <div className="flex-1" />
          <button onClick={toggle} aria-label="تبديل الوضع" className="grid size-10 place-items-center rounded-xl border border-line bg-surface cursor-pointer">
            {mode === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </button>
          {!profile && <Link href="/register" className="hidden rounded-2xl px-4 py-2.5 text-sm font-bold text-primary hover:bg-primary-soft sm:block">إنشاء حساب</Link>}
          <Link href={cta.href} className="rounded-2xl bg-brand px-5 py-2.5 text-sm font-bold text-white shadow-[0_8px_20px_-8px_rgba(91,76,245,0.8)]">{cta.label}</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative bg-hero pt-32 pb-40 text-white">
        <div className="absolute -top-24 -start-24 size-[420px] rounded-full bg-[#8b83ff]/40 blur-3xl" />
        <div className="absolute -bottom-32 end-0 size-[480px] rounded-full bg-[#38bdf8]/25 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 lg:grid-cols-2">
          <div className="animate-in">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-sm font-bold">
              <Sparkles className="size-4" /> منصة إدارة التعليم والمتابعة الذكية
            </span>
            <h1 className="mt-6 text-4xl font-black leading-[1.25] md:text-6xl">
              كل ما يحتاجه مركزك التعليمي
              <br />
              <span className="bg-gradient-to-l from-[#c4b5fd] to-[#7dd3fc] bg-clip-text text-transparent">في منصة واحدة</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/80">
              الحضور، الدرجات، الكويزات، الكورسات، المالية والتواصل مع أولياء الأمور — من الموبايل أو من المتصفح، بنفس الحساب ونفس البيانات.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href={cta.href} className="inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-3.5 font-extrabold text-primary-2 shadow-xl transition hover:-translate-y-0.5">
                {cta.label} <ArrowLeft className="size-5" />
              </Link>
              {!profile && (
                <Link href="/register" className="inline-flex items-center gap-2 rounded-2xl border border-white/30 bg-white/10 px-7 py-3.5 font-bold transition hover:bg-white/20">
                  حساب ولي أمر / طالب
                </Link>
              )}
            </div>
            <div className="mt-10 flex flex-wrap gap-6 text-sm text-white/80">
              {["بدون تثبيت — يعمل من المتصفح", "متزامن مع تطبيق الموبايل", "عربي بالكامل"].map((t) => (
                <span key={t} className="flex items-center gap-2"><CheckCircle2 className="size-4 text-[#86efac]" />{t}</span>
              ))}
            </div>
          </div>

          {/* Product preview */}
          <div className="relative hidden lg:block">
            <div className="animate-float rounded-[32px] border border-white/20 bg-white/10 p-4 shadow-2xl backdrop-blur-xl">
              <div className="rounded-3xl bg-bg p-5 text-ink">
                <div className="rounded-2xl bg-welcome p-5 text-white">
                  <div className="text-xs text-white/80">الأحد 5 أكتوبر</div>
                  <div className="mt-1 text-xl font-black">أهلاً أ. محمد 👋</div>
                  <div className="mt-3 flex gap-2 text-xs">
                    <span className="rounded-full bg-white/20 px-3 py-1">4 حصص اليوم</span>
                    <span className="rounded-full bg-white/20 px-3 py-1">126 حاضر</span>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {[
                    { i: Users, c: "#6D5DFC", v: "342", l: "طالب نشط" },
                    { i: CheckCircle2, c: "#10B981", v: "94%", l: "نسبة الحضور" },
                    { i: Trophy, c: "#F59E0B", v: "87%", l: "متوسط الدرجات" },
                    { i: CreditCard, c: "#0EA5E9", v: "48,500", l: "إيرادات الشهر" },
                  ].map((s) => (
                    <div key={s.l} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 shadow-soft">
                      <IconBadge icon={s.i} color={s.c} size={38} />
                      <div>
                        <div className="text-lg font-black leading-tight">{s.v}</div>
                        <div className="text-[11px] text-muted">{s.l}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex h-24 items-end gap-2 rounded-2xl border border-line bg-surface p-3">
                  {[55, 70, 62, 85, 78, 92, 88, 95, 80, 90].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t-md bg-brand" style={{ height: `${h}%`, opacity: 0.5 + i * 0.05 }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="relative z-10 mx-auto -mt-20 max-w-6xl px-5">
        <div className="grid gap-4 rounded-[28px] border border-line bg-surface p-6 shadow-soft sm:grid-cols-2 lg:grid-cols-4">
          {[
            { i: QrCode, c: "#6D5DFC", t: "حضور في ثوانٍ", s: "QR متغير + يدوي" },
            { i: BellRing, c: "#EF4461", t: "إشعار فوري", s: "لولي الأمر عند الغياب" },
            { i: CalendarDays, c: "#10B981", t: "جدول ذكي", s: "حصص وامتحانات" },
            { i: Smartphone, c: "#0EA5E9", t: "ويب + موبايل", s: "نفس الحساب والبيانات" },
          ].map((x) => (
            <div key={x.t} className="flex items-center gap-4">
              <IconBadge icon={x.i} color={x.c} />
              <div>
                <div className="font-extrabold">{x.t}</div>
                <div className="text-sm text-muted">{x.s}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-5 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-black md:text-4xl">كل الأدوات في <span className="text-gradient">مكان واحد</span></h2>
          <p className="mt-4 text-lg text-muted">صُممت خصيصاً للسناتر والمدارس في مصر والخليج</p>
        </div>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="group rounded-[28px] border border-line bg-surface p-7 shadow-soft transition hover:-translate-y-1 hover:border-primary/40">
              <IconBadge icon={f.icon} color={f.color} size={54} />
              <h3 className="mt-5 text-xl font-extrabold">{f.title}</h3>
              <p className="mt-2 leading-7 text-muted">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Portals */}
      <section id="portals" className="bg-surface-2 py-24">
        <div className="mx-auto max-w-7xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-black md:text-4xl">بوابة لكل مستخدم</h2>
            <p className="mt-4 text-lg text-muted">كل شخص يرى ما يخصه فقط — بصلاحيات محمية من قاعدة البيانات</p>
          </div>
          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {portals.map((p, i) => (
              <div key={p.title} className={i === 0 ? "relative overflow-hidden rounded-[28px] bg-hero p-8 text-white shadow-2xl" : "rounded-[28px] border border-line bg-surface p-8 shadow-soft"}>
                {i === 0 && <div className="absolute -top-16 -end-16 size-48 rounded-full bg-white/10" />}
                <div className={i === 0 ? "relative grid size-14 place-items-center rounded-2xl bg-white/15" : "grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary"}>
                  <p.icon className="size-7" />
                </div>
                <h3 className="relative mt-5 text-2xl font-black">{p.title}</h3>
                <ul className="relative mt-5 space-y-3">
                  {p.points.map((pt) => (
                    <li key={pt} className="flex items-center gap-2.5 font-semibold">
                      <CheckCircle2 className={i === 0 ? "size-5 text-[#86efac]" : "size-5 text-success"} />
                      <span className={i === 0 ? "text-white/90" : ""}>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="mx-auto max-w-7xl px-5 py-24">
        <div className="grid items-center gap-10 rounded-[32px] border border-line bg-surface p-8 shadow-soft md:p-12 lg:grid-cols-[1fr_auto]">
          <div>
            <div className="flex items-center gap-3">
              <IconBadge icon={ShieldCheck} color="#10B981" size={52} />
              <h2 className="text-2xl font-black md:text-3xl">بياناتك محمية بالكامل</h2>
            </div>
            <p className="mt-5 max-w-2xl leading-8 text-muted">
              كل صلاحية تُفحص داخل قاعدة البيانات نفسها (Row Level Security): ولي الأمر لا يرى إلا أبناءه، والمساعد لا يرى إلا ما سمح له به المدرس،
              والحضور بالـ QR يُتحقق منه على السيرفر فقط. لكل مركز قاعدة بيانات مستقلة تماماً.
            </p>
          </div>
          <Link href={cta.href} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand px-8 py-4 text-lg font-extrabold text-white shadow-[0_12px_28px_-10px_rgba(91,76,245,0.9)]">
            ابدأ الآن <ArrowLeft className="size-5" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-line py-8 text-center text-sm text-muted">
        © {new Date().getFullYear()} {APP_NAME} — جميع الحقوق محفوظة
      </footer>
    </div>
  );
}
