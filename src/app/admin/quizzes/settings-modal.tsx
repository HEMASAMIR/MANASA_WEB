"use client";

import { useState } from "react";
import { quizApi } from "@/lib/api";
import type { Quiz } from "@/lib/types";
import { ClassSelect } from "@/components/shared";
import { Button, Field, Input, Modal, Switch, Textarea, useUi } from "@/components/ui";

/** "2026-10-01T18:30" for <input type="datetime-local"> in local time. */
function toLocalInput(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function QuizSettingsModal({ quiz, classes, defaultClass, onClose, onSaved }: {
  quiz?: Quiz; classes?: { id: string; name: string }[]; defaultClass?: string | null; onClose(): void; onSaved(id: string): void;
}) {
  const { run, toast } = useUi();
  const [classId, setClassId] = useState<string | null>(defaultClass ?? classes?.[0]?.id ?? null);
  const [f, setF] = useState({
    title: quiz?.exams?.title ?? "", description: quiz?.description ?? "", duration: quiz?.duration_minutes ? String(quiz.duration_minutes) : "",
    from: toLocalInput(quiz?.available_from), until: toLocalInput(quiz?.available_until), attempts: String(quiz?.max_attempts ?? 1),
    shuffle: quiz?.shuffle_questions ?? false, show: quiz?.show_answers ?? true,
  });
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!f.title.trim()) return toast("عنوان الكويز مطلوب", "error");
    if (f.from && f.until && f.until <= f.from) return toast("وقت الإغلاق يجب أن يكون بعد وقت الفتح", "error");
    const input = {
      title: f.title, description: f.description, duration: f.duration ? Number(f.duration) : null,
      from: f.from || null, until: f.until || null, max_attempts: Math.max(1, Math.min(20, Number(f.attempts) || 1)), shuffle: f.shuffle, show_answers: f.show,
    };
    setBusy(true);
    const id = await run(async () => {
      if (quiz) { await quizApi.update(quiz.id, input); return quiz.id; }
      if (!classId) throw new Error("اختر المجموعة");
      return quizApi.create(classId, input);
    }, quiz ? "تم حفظ الإعدادات" : "تم إنشاء الكويز — أضف الأسئلة الآن");
    setBusy(false);
    if (id) { onSaved(id); onClose(); }
  };

  return (
    <Modal open onClose={onClose} title={quiz ? "إعدادات الكويز" : "كويز جديد"} wide footer={<><Button variant="ghost" onClick={onClose}>إلغاء</Button><Button loading={busy} onClick={save}>حفظ</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="العنوان *" className="sm:col-span-2"><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
        {!quiz && classes && <Field label="المجموعة"><ClassSelect classes={classes} value={classId} onChange={setClassId} /></Field>}
        <Field label="المدة بالدقائق" hint="اتركها فارغة لوقت مفتوح"><Input type="number" min={1} max={600} value={f.duration} onChange={(e) => setF({ ...f, duration: e.target.value })} /></Field>
        <Field label="عدد المحاولات"><Input type="number" min={1} max={20} value={f.attempts} onChange={(e) => setF({ ...f, attempts: e.target.value })} /></Field>
        <Field label="يفتح في (اختياري)"><Input type="datetime-local" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} /></Field>
        <Field label="يغلق في (اختياري)"><Input type="datetime-local" value={f.until} onChange={(e) => setF({ ...f, until: e.target.value })} /></Field>
        <Field label="وصف / تعليمات" className="sm:col-span-2"><Textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
      </div>
      <div className="mt-4 space-y-1 rounded-2xl bg-surface-2 p-4">
        <Switch checked={f.shuffle} onChange={(v) => setF({ ...f, shuffle: v })} label="ترتيب عشوائي للأسئلة لكل طالب" />
        <Switch checked={f.show} onChange={(v) => setF({ ...f, show: v })} label="إظهار الإجابات الصحيحة بعد التسليم" />
      </div>
    </Modal>
  );
}
