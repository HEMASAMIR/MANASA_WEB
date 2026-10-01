"use client";

import { useState } from "react";
import { BadgeCheck, BarChart3, Bell, BookOpen, CalendarDays, ClipboardCheck, FileText, Hash, Home, Link2, LogOut, MessageCircle, Phone } from "lucide-react";
import { PortalShell, RoleGuard, type NavItem } from "@/components/shell";
import { Button, ErrorState, Field, Input, LoadingBlock, useUi } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useAsync } from "@/lib/hooks";
import { loadPortal, PortalProvider } from "@/lib/student";
import { studentApi } from "@/lib/api";

const NAV: NavItem[] = [
  { href: "/student", label: "الرئيسية", icon: Home, bottom: true },
  { href: "/student/attendance", label: "حضوري", icon: ClipboardCheck, bottom: true },
  { href: "/student/courses", label: "كورساتي", icon: BookOpen, bottom: true },
  { href: "/student/quizzes", label: "الكويزات والواجبات", icon: BadgeCheck, bottom: true },
  { href: "/student/exams", label: "الامتحانات", icon: FileText },
  { href: "/student/grades", label: "الدرجات", icon: BarChart3 },
  { href: "/student/schedule", label: "الجدول", icon: CalendarDays },
  { href: "/student/messages", label: "الرسائل", icon: MessageCircle },
  { href: "/student/notifications", label: "الإشعارات", icon: Bell, badgeKey: "notifications" },
];

function StudentFrame({ children }: { children: React.ReactNode }) {
  const state = useAsync(() => loadPortal(), []);
  if (state.loading && !state.data) return <div className="min-h-screen p-6 portal-bg"><LoadingBlock /></div>;
  if (state.error && !state.data) return <div className="grid min-h-screen place-items-center portal-bg"><ErrorState message={state.error} onRetry={state.reload} /></div>;
  if (!state.data) return null;
  if (state.data === "not-linked") return <ClaimCard onDone={state.reload} />;
  return (
    <PortalProvider data={state.data} reload={state.reload}>
      <PortalShell nav={NAV} portalLabel="منصة الطالب" notificationsHref="/student/notifications">{children}</PortalShell>
    </PortalProvider>
  );
}

function ClaimCard({ onDone }: { onDone(): void }) {
  const { logout } = useAuth();
  const { run, toast } = useUi();
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return toast("الرجاء إدخال كود الطالب", "error");
    if (phone.replace(/\D/g, "").length < 10) return toast("الرجاء إدخال رقم هاتف صالح", "error");
    setBusy(true);
    const ok = await run(() => studentApi.claim(code, phone), "تم ربط الحساب بنجاح! جاري تحميل بياناتك...");
    setBusy(false);
    if (ok) onDone();
  };
  return (
    <div className="grid min-h-screen place-items-center p-4 portal-bg">
      <form onSubmit={submit} className="w-full max-w-md rounded-[28px] border border-line bg-surface p-7 shadow-soft animate-in">
        <div className="mx-auto grid size-20 place-items-center rounded-[26px] bg-brand text-white shadow-lg"><Link2 className="size-10" /></div>
        <h1 className="mt-5 text-center text-2xl font-black">حسابك غير مرتبط بطالب بعد</h1>
        <p className="mt-2 text-center text-sm leading-6 text-muted">أدخل كود الطالب ورقم ولي الأمر المسجلين لدى المركز لربط حسابك وتنشيط الخدمات فوراً.</p>
        <div className="mt-6 space-y-4">
          <Field label="كود الطالب"><Input icon={Hash} dir="ltr" className="text-start uppercase" value={code} onChange={(e) => setCode(e.target.value)} /></Field>
          <Field label="رقم موبايل ولي الأمر (المسجل بالمركز)"><Input icon={Phone} dir="ltr" className="text-start" value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
          <Button type="submit" loading={busy} className="h-12 w-full">ربط الحساب وتنشيط الدخول</Button>
          <Button type="button" variant="ghost" icon={LogOut} className="w-full" onClick={() => logout()}>تسجيل الخروج</Button>
        </div>
      </form>
    </div>
  );
}

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard roles={["student"]}>
      <StudentFrame>{children}</StudentFrame>
    </RoleGuard>
  );
}
