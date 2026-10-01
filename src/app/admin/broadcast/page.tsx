"use client";

import { useState } from "react";
import { GraduationCap, Megaphone, Send, Users, UserSquare, Globe, Layers } from "lucide-react";
import { classApi, notificationApi } from "@/lib/api";
import { useStaffPerms } from "@/lib/auth";
import { useAsync } from "@/lib/hooks";
import { ClassSelect } from "@/components/shared";
import { Button, Card, Field, Input, PageHeader, Textarea, cx, useUi } from "@/components/ui";

export default function BroadcastPage() {
  const perms = useStaffPerms();
  const { run, toast } = useUi();
  const classes = useAsync(() => classApi.list(), []);
  const [audience, setAudience] = useState(perms.isAdmin ? "all" : "class");
  const [classId, setClassId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const options = [
    ...(perms.isAdmin ? [
      { v: "all", l: "الجميع", i: Globe },
      { v: "parents", l: "أولياء الأمور", i: Users },
      { v: "students", l: "الطلاب", i: GraduationCap },
      { v: "teachers", l: "المدرسون والمساعدون", i: UserSquare },
    ] : []),
    { v: "class", l: "مجموعة محددة", i: Layers },
  ];

  const send = async () => {
    if (!title.trim() || !body.trim()) return toast("اكتب العنوان والنص", "error");
    if (audience === "class" && !classId) return toast("اختر المجموعة", "error");
    setBusy(true);
    const n = await run(() => notificationApi.broadcast(title, body, audience, audience === "class" ? classId : null));
    setBusy(false);
    if (n !== undefined) {
      toast(`تم إرسال الإشعار إلى ${n} مستخدم`);
      setTitle("");
      setBody("");
    }
  };

  return (
    <>
      <PageHeader title="إشعار جماعي" icon={Megaphone} subtitle="أرسل إعلاناً يصل فوراً لتطبيق وموقع المستخدمين" />
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <Card className="space-y-5">
          <div>
            <div className="mb-2 text-[13px] font-bold">المستلمون</div>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {options.map((o) => (
                <button key={o.v} onClick={() => setAudience(o.v)} className={cx("flex items-center gap-2 rounded-2xl border p-3 text-sm font-bold transition cursor-pointer", audience === o.v ? "border-primary bg-primary-soft text-primary" : "border-line text-muted hover:text-ink")}>
                  <o.i className="size-5" /> {o.l}
                </button>
              ))}
            </div>
          </div>
          {audience === "class" && <Field label="المجموعة"><ClassSelect classes={classes.data ?? []} value={classId} onChange={setClassId} /></Field>}
          <Field label="العنوان"><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: تغيير موعد حصة السبت" /></Field>
          <Field label="النص"><Textarea rows={6} value={body} onChange={(e) => setBody(e.target.value)} /></Field>
          <Button size="lg" icon={Send} loading={busy} onClick={send}>إرسال الإشعار</Button>
        </Card>
        <div>
          <div className="mb-2 text-sm font-bold text-muted">معاينة</div>
          <div className="rounded-[28px] bg-hero p-5 shadow-soft">
            <div className="rounded-3xl bg-surface p-4 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="grid size-11 place-items-center rounded-2xl bg-brand text-white"><Megaphone className="size-5" /></div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-extrabold">{title || "عنوان الإشعار"}</div>
                  <div className="text-xs text-muted">الآن</div>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-ink/80">{body || "نص الإشعار سيظهر هنا..."}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
