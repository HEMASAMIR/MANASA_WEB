"use client";

import Link from "next/link";
import { useState } from "react";
import { AtSign, MailCheck } from "lucide-react";
import { AuthLayout } from "@/components/auth-layout";
import { Button, Field, Input } from "@/components/ui";
import { sb } from "@/lib/supabase";
import { friendlyError } from "@/lib/errors";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return setError("بريد إلكتروني غير صالح");
    setBusy(true);
    const { error } = await sb().auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/reset-password` });
    setBusy(false);
    if (error) setError(friendlyError(error));
    else setSent(true);
  };

  return (
    <AuthLayout title="إعادة تعيين كلمة المرور" subtitle="سنرسل لك رابطاً لتعيين كلمة مرور جديدة">
      {sent ? (
        <div className="rounded-3xl border border-line bg-surface-2 p-6 text-center">
          <MailCheck className="mx-auto size-14 text-success" />
          <p className="mt-4 leading-7">تم إرسال رابط إعادة التعيين إلى <b dir="ltr">{email}</b></p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field label="البريد الإلكتروني"><Input icon={AtSign} type="email" dir="ltr" className="text-start" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          {error && <div className="rounded-2xl bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">{error}</div>}
          <Button type="submit" loading={busy} className="h-12 w-full">إرسال الرابط</Button>
        </form>
      )}
      <p className="mt-6 text-center text-sm"><Link href="/login" className="font-bold text-primary hover:underline">العودة لتسجيل الدخول</Link></p>
    </AuthLayout>
  );
}
