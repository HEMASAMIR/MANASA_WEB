"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarDays, ChevronLeft, Eye, EyeOff, ListChecks, Plus, Trash2 } from "lucide-react";
import { classApi, examApi } from "@/lib/api";
import { useAsync } from "@/lib/hooks";
import { Fmt } from "@/lib/fmt";
import { EXAM_KIND_LABEL, type Exam } from "@/lib/types";
import { ClassSelect } from "@/components/shared";
import { Async, Badge, Button, Card, EmptyState, Field, IconBadge, Input, Modal, PageHeader, Select, Switch, TONE_HEX, useUi } from "@/components/ui";

export default function ExamsPage() {
  const classes = useAsync(() => classApi.list(), []);
  const [classId, setClassId] = useState<string | null>(null);
  const state = useAsync(() => examApi.list(classId ?? undefined), [classId]);
  const [creating, setCreating] = useState(false);
  const { run, confirm } = useUi();

  const togglePublish = async (e: Exam) => {
    await run(() => examApi.update(e.id, { is_published: !e.is_published }), e.is_published ? "تم إخفاء الدرجات عن الطلاب" : "تم نشر الدرجات");
    state.reload();
  };
  const remove = async (e: Exam) => {
    if (!(await confirm({ title: "حذف الامتحان", message: `سيتم حذف "${e.title}" وكل درجاته.`, confirmLabel: "حذف", danger: true }))) return;
    await run(() => examApi.remove(e.id), "تم الحذف");
    state.reload();
  };

  return (
    <>
      <PageHeader title="الامتحانات والدرجات" icon={ListChecks} subtitle="أضف امتحاناً ثم أدخل درجات الطلاب" actions={<Button icon={Plus} onClick={() => setCreating(true)} disabled={!classes.data?.length}>امتحان جديد</Button>} />
      <Card className="mb-5 max-w-md"><Field label="المجموعة"><ClassSelect classes={classes.data ?? []} value={classId} onChange={setClassId} allLabel="كل المجموعات" /></Field></Card>
      <Async state={state}>
        {(list) => {
          const exams = list;
          if (!exams.length) return <EmptyState icon={ListChecks} message="لا توجد امتحانات بعد" />;
          return (
            <div className="grid gap-3 lg:grid-cols-2">
              {exams.map((e, i) => (
                <Card key={e.id} className="flex items-center gap-4 !p-4 animate-in" >
                  <Link href={`/admin/exams/${e.id}`} className="flex min-w-0 flex-1 items-center gap-4" style={{ animationDelay: `${i * 25}ms` }}>
                    <IconBadge icon={ListChecks} color={e.kind === "exam" ? TONE_HEX.primary : e.kind === "quiz" ? TONE_HEX.warning : TONE_HEX.info} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-extrabold">{e.title}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-muted">
                        <Badge tone="primary" dot={false}>{EXAM_KIND_LABEL[e.kind]}</Badge>
                        <span>{e.classes?.name}</span>
                        <span>• من {Fmt.number(e.max_score)}</span>
                        {e.exam_date && <span className="flex items-center gap-1">• <CalendarDays className="size-3.5" /> {Fmt.date(e.exam_date)}</span>}
                        {!e.is_published && <Badge tone="neutral">مخفي</Badge>}
                      </div>
                    </div>
                    <ChevronLeft className="size-5 text-muted" />
                  </Link>
                  <button title={e.is_published ? "إخفاء" : "نشر"} onClick={() => togglePublish(e)} className="grid size-9 place-items-center rounded-xl text-muted hover:bg-surface-3 hover:text-primary cursor-pointer">{e.is_published ? <Eye className="size-4" /> : <EyeOff className="size-4" />}</button>
                  <button title="حذف" onClick={() => remove(e)} className="grid size-9 place-items-center rounded-xl text-muted hover:bg-danger/10 hover:text-danger cursor-pointer"><Trash2 className="size-4" /></button>
                </Card>
              ))}
            </div>
          );
        }}
      </Async>
      {creating && classes.data && <CreateExam classes={classes.data} defaultClass={classId} onClose={() => setCreating(false)} onDone={state.reload} />}
    </>
  );
}

function CreateExam({ classes, defaultClass, onClose, onDone }: { classes: { id: string; name: string }[]; defaultClass: string | null; onClose(): void; onDone(): void }) {
  const { run, toast } = useUi();
  const [f, setF] = useState({ title: "", max: "20", kind: "exam", date: "", time: "", published: true });
  const [classId, setClassId] = useState<string | null>(defaultClass ?? classes[0]?.id ?? null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (!classId && classes[0]) setClassId(classes[0].id); }, [classes, classId]);
  const save = async () => {
    if (!f.title.trim()) return toast("العنوان مطلوب", "error");
    if (!(Number(f.max) > 0)) return toast("الدرجة النهائية غير صحيحة", "error");
    if (!classId) return toast("اختر المجموعة", "error");
    setBusy(true);
    const r = await run(() => examApi.create({ title: f.title, max_score: Number(f.max), class_id: classId, kind: f.kind, exam_date: f.date || null, exam_time: f.time || null, is_published: f.published }), "تمت إضافة الامتحان");
    setBusy(false);
    if (r) { onClose(); onDone(); }
  };
  return (
    <Modal open onClose={onClose} title="امتحان جديد" footer={<><Button variant="ghost" onClick={onClose}>إلغاء</Button><Button loading={busy} onClick={save}>حفظ</Button></>}>
      <div className="space-y-4">
        <Field label="العنوان"><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="مثال: امتحان الشهر الأول" /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="المجموعة"><ClassSelect classes={classes} value={classId} onChange={setClassId} /></Field>
          <Field label="النوع"><Select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}><option value="exam">امتحان</option><option value="homework">واجب</option><option value="quiz">كويز (ورقي)</option></Select></Field>
          <Field label="الدرجة النهائية"><Input type="number" min={1} value={f.max} onChange={(e) => setF({ ...f, max: e.target.value })} /></Field>
          <Field label="التاريخ"><Input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
          <Field label="الوقت"><Input type="time" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} /></Field>
        </div>
        <Switch checked={f.published} onChange={(v) => setF({ ...f, published: v })} label="إظهار الدرجات للطلاب وأولياء الأمور" />
      </div>
    </Modal>
  );
}
