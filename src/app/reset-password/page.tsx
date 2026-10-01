"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { AuthLayout } from "@/components/auth-layout";
import { Button, Field, Input, useUi } from "@/components/ui";
import { sb } from "@/lib/supabase";
import { friendlyError } from "@/lib/errors";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { toast } = useUi();
  const [ready, setReady] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // The recovery link signs the user in; wait for that session.
    sb().auth.getSession().then(({ data }) => setReady(!!data.session));
    const { data } = sb().auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (pw.length < 8) return setError("كلمة المرور يجب ألا تقل عن 8 أحرف");
    if (pw !== pw2) return setError("كلمتا المرور غير متطابقتين");
    setBusy(true);
    const { error } = await sb().auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return setError(friendlyError(error));
    toast("تم تغيير كلمة المرور بنجاح");
    await sb().auth.signOut();
    router.replace("/login");
  };

  return (
    <AuthLayout title="تعيين كلمة مرور جديدة" subtitle="اختر كلمة مرور قوية لا تقل عن 8 أحرف">
      {!ready ? (
        <p className="rounded-2xl bg-surface-2 p-5 text-center text-muted">افتح هذه الصفحة من رابط إعادة التعيين المرسل إلى بريدك.</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field label="كلمة المرور الجديدة"><Input icon={Lock} type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" /></Field>
          <Field label="تأكيد كلمة المرور"><Input icon={Lock} type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" /></Field>
          {error && <div className="rounded-2xl bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">{error}</div>}
          <Button type="submit" loading={busy} className="h-12 w-full">حفظ كلمة المرور</Button>
        </form>
      )}
    </AuthLayout>
  );
}
