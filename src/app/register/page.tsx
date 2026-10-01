"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AtSign, GraduationCap, Hash, Lock, MailCheck, Phone, User, Users } from "lucide-react";
import { AuthLayout } from "@/components/auth-layout";
import { Button, Field, Input, cx } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { friendlyError } from "@/lib/errors";
import { homeFor } from "@/lib/types";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [role, setRole] = useState<"parent" | "student">("parent");
  const [f, setF] = useState({ name: "", email: "", phone: "", code: "", parentPhone: "", password: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (f.name.trim().length < 2) return setError("الرجاء إدخال الاسم");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.trim())) return setError("البريد الإلكتروني غير صالح");
    if (f.phone.replace(/\D/g, "").length < 10) return setError("الرجاء إدخال رقم موبايل صحيح");
    if (!f.code.trim()) return setError("الرجاء إدخال كود الطالب (من إدارة المركز)");
    if (role === "student" && f.parentPhone.replace(/\D/g, "").length < 10) return setError("الرجاء إدخال رقم ولي الأمر المسجل بالمركز");
    if (f.password.length < 8) return setError("كلمة المرور يجب ألا تقل عن 8 أحرف");
    if (f.password !== f.confirm) return setError("كلمتا المرور غير متطابقتين");
    setBusy(true);
    try {
      const res = await register({ email: f.email, password: f.password, name: f.name, role, phone: f.phone, studentCode: f.code, parentPhone: f.parentPhone });
      if (res.needsConfirmation) setSent(true);
      else router.replace(homeFor(res.profile!.role));
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  if (sent) {
    return (
      <AuthLayout title="تحقق من بريدك الإلكتروني" subtitle="خطوة أخيرة لتفعيل حسابك">
        <div className="rounded-3xl border border-line bg-surface-2 p-6 text-center">
          <MailCheck className="mx-auto size-14 text-success" />
          <p className="mt-4 leading-7">أرسلنا رابط التفعيل إلى <b dir="ltr">{f.email}</b>. افتح الرابط ثم سجّل الدخول، وسيتم ربط حسابك بالطالب تلقائياً.</p>
          <Link href="/login" className="mt-6 inline-flex h-11 items-center rounded-2xl bg-brand px-6 font-bold text-white">الذهاب لتسجيل الدخول</Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="إنشاء حساب جديد" subtitle="لأولياء الأمور والطلاب المسجلين بالمركز">
      <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl border border-line bg-surface-2 p-1.5">
        {([
          { v: "parent", l: "ولي أمر", i: Users },
          { v: "student", l: "طالب", i: GraduationCap },
        ] as const).map((o) => (
          <button key={o.v} type="button" onClick={() => setRole(o.v)} className={cx("flex items-center justify-center gap-2 rounded-xl py-2.5 font-bold transition cursor-pointer", role === o.v ? "bg-brand text-white shadow" : "text-muted")}>
            <o.i className="size-4" /> {o.l}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="space-y-3.5">
        <Field label="الاسم بالكامل"><Input icon={User} value={f.name} onChange={set("name")} autoComplete="name" /></Field>
        <Field label="البريد الإلكتروني"><Input icon={AtSign} type="email" dir="ltr" className="text-start" value={f.email} onChange={set("email")} autoComplete="email" /></Field>
        <Field label={role === "parent" ? "رقم موبايلك (المسجل بالمركز)" : "رقم موبايلك"}><Input icon={Phone} type="tel" dir="ltr" className="text-start" value={f.phone} onChange={set("phone")} /></Field>
        <Field label="كود الطالب" hint="تحصل عليه من إدارة المركز"><Input icon={Hash} value={f.code} onChange={set("code")} dir="ltr" className="text-start uppercase" /></Field>
        {role === "student" && <Field label="رقم موبايل ولي الأمر (المسجل بالمركز)"><Input icon={Phone} type="tel" dir="ltr" className="text-start" value={f.parentPhone} onChange={set("parentPhone")} /></Field>}
        <div className="grid gap-3.5 sm:grid-cols-2">
          <Field label="كلمة المرور"><Input icon={Lock} type="password" value={f.password} onChange={set("password")} autoComplete="new-password" /></Field>
          <Field label="تأكيد كلمة المرور"><Input icon={Lock} type="password" value={f.confirm} onChange={set("confirm")} autoComplete="new-password" /></Field>
        </div>
        {error && <div className="rounded-2xl bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">{error}</div>}
        <Button type="submit" loading={busy} className="h-13 w-full text-base">إنشاء الحساب</Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        لديك حساب بالفعل؟ <Link href="/login" className="font-bold text-primary hover:underline">سجّل الدخول</Link>
      </p>
    </AuthLayout>
  );
}
