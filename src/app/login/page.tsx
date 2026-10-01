"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, AtSign, Eye, EyeOff, Lock, UserPlus } from "lucide-react";
import { AuthLayout } from "@/components/auth-layout";
import { DemoLogin } from "@/components/demo-login";
import { Button, Field, Input } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { friendlyError } from "@/lib/errors";
import { homeFor } from "@/lib/types";

export default function LoginPage() {
  const { login, profile, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && profile) {
      const next = new URLSearchParams(window.location.search).get("next");
      router.replace(next && next.startsWith("/") ? next : homeFor(profile.role));
    }
  }, [loading, profile, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return setError("الرجاء إدخال بريد إلكتروني صالح");
    if (!password) return setError("الرجاء إدخال كلمة المرور");
    setBusy(true);
    try {
      const p = await login(email, password);
      router.replace(homeFor(p.role));
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthLayout title="مرحباً بعودتك 👋" subtitle="سجّل الدخول لمتابعة حسابك">
      <form onSubmit={submit} className="space-y-4">
        <Field label="البريد الإلكتروني">
          <Input icon={AtSign} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" dir="ltr" className="text-start" />
        </Field>
        <Field label="كلمة المرور">
          <div className="relative">
            <Input icon={Lock} type={show ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            <button type="button" onClick={() => setShow((v) => !v)} className="absolute top-1/2 end-3 -translate-y-1/2 text-muted cursor-pointer" aria-label="إظهار كلمة المرور">
              {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          </div>
        </Field>
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-sm font-bold text-primary hover:underline">نسيت كلمة المرور؟</Link>
        </div>
        {error && <div className="rounded-2xl bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">{error}</div>}
        <Button type="submit" loading={busy} className="h-13 w-full text-base">
          تسجيل الدخول <ArrowLeft className="size-5" />
        </Button>
      </form>
      <div className="my-6 flex items-center gap-3 text-sm text-muted">
        <span className="h-px flex-1 bg-line" /> أو <span className="h-px flex-1 bg-line" />
      </div>
      <Link href="/register" className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-line bg-surface font-bold text-primary transition hover:border-primary/50">
        <UserPlus className="size-5" /> إنشاء حساب ولي أمر / طالب
      </Link>
      <DemoLogin />
    </AuthLayout>
  );
}
