"use client";

import { useState } from "react";
import { BookOpen, Edit3, Eye, EyeOff, Lock, PlayCircle, Plus, Trash2, Unlock, Video } from "lucide-react";
import { classApi, courseApi } from "@/lib/api";
import { useAsync } from "@/lib/hooks";
import { Fmt, PALETTE, argbToHex, hexToArgb } from "@/lib/fmt";
import type { Course, Lesson } from "@/lib/types";
import { ClassSelect } from "@/components/shared";
import { Async, Badge, Button, Card, EmptyState, Field, Input, Modal, PageHeader, Switch, Textarea, cx, useUi } from "@/components/ui";

export default function CoursesPage() {
  const classes = useAsync(() => classApi.list(), []);
  const [classId, setClassId] = useState<string | null>(null);
  const state = useAsync(() => courseApi.list(classId ?? undefined), [classId]);
  const [editing, setEditing] = useState<Course | "new" | null>(null);
  const [open, setOpen] = useState<Course | null>(null);
  const { run, confirm } = useUi();

  return (
    <>
      <PageHeader title="الكورسات والدروس" icon={BookOpen} subtitle="محتوى مرئي منظم يظهر للطلاب في بوابتهم" actions={<Button icon={Plus} onClick={() => setEditing("new")} disabled={!classes.data?.length}>كورس جديد</Button>} />
      <Card className="mb-5 max-w-md"><Field label="المجموعة"><ClassSelect classes={classes.data ?? []} value={classId} onChange={setClassId} allLabel="كل المجموعات" /></Field></Card>
      <Async state={state} empty={(l) => l.length === 0} emptyMessage="لا توجد كورسات بعد" emptyIcon={BookOpen}>
        {(list) => (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {list.map((c) => {
              const color = argbToHex(c.color);
              const count = (c.lessons as { count: number }[] | undefined)?.[0]?.count ?? 0;
              return (
                <div key={c.id} className="overflow-hidden rounded-[28px] border border-line bg-surface shadow-soft animate-in">
                  <button onClick={() => setOpen(c)} className="relative block h-32 w-full cursor-pointer" style={{ background: `linear-gradient(135deg, color-mix(in srgb, ${color} 70%, white), ${color})` }}>
                    <span className="absolute inset-0 grid place-items-center text-6xl drop-shadow">{c.icon}</span>
                    {!c.is_published && <span className="absolute top-3 start-3 rounded-full bg-black/40 px-3 py-1 text-xs font-bold text-white">مخفي</span>}
                  </button>
                  <div className="p-5">
                    <h3 className="truncate text-lg font-black">{c.title}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
                      <span>{c.classes?.name}</span> • <span className="flex items-center gap-1"><PlayCircle className="size-4" />{count} درس</span>
                    </div>
                    {c.description && <p className="mt-2 line-clamp-2 text-sm text-ink/70">{c.description}</p>}
                    <div className="mt-4 flex gap-1.5 border-t border-line pt-3">
                      <Button size="sm" variant="secondary" icon={Video} onClick={() => setOpen(c)}>الدروس</Button>
                      <div className="flex-1" />
                      <button title={c.is_published ? "إخفاء" : "نشر"} onClick={async () => { await run(() => courseApi.update(c.id, { is_published: !c.is_published })); state.reload(); }} className="grid size-9 place-items-center rounded-xl text-muted hover:bg-surface-3 cursor-pointer">{c.is_published ? <Eye className="size-4" /> : <EyeOff className="size-4" />}</button>
                      <button title="تعديل" onClick={() => setEditing(c)} className="grid size-9 place-items-center rounded-xl text-muted hover:bg-surface-3 hover:text-primary cursor-pointer"><Edit3 className="size-4" /></button>
                      <button title="حذف" onClick={async () => {
                        if (await confirm({ title: "حذف الكورس", message: `سيتم حذف "${c.title}" وكل دروسه.`, confirmLabel: "حذف", danger: true })) { await run(() => courseApi.remove(c.id), "تم الحذف"); state.reload(); }
                      }} className="grid size-9 place-items-center rounded-xl text-muted hover:bg-danger/10 hover:text-danger cursor-pointer"><Trash2 className="size-4" /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Async>
      {editing && <CourseForm course={editing === "new" ? null : editing} classes={classes.data ?? []} defaultClass={classId} onClose={() => setEditing(null)} onDone={state.reload} />}
      {open && <LessonsModal course={open} onClose={() => { setOpen(null); state.reload(); }} />}
    </>
  );
}

const ICONS = ["📚", "🧪", "📐", "🧮", "🌍", "📖", "✍️", "🔬", "💻", "🎨", "🗣️", "⚛️"];

function CourseForm({ course, classes, defaultClass, onClose, onDone }: { course: Course | null; classes: { id: string; name: string }[]; defaultClass: string | null; onClose(): void; onDone(): void }) {
  const { run, toast } = useUi();
  const [title, setTitle] = useState(course?.title ?? "");
  const [desc, setDesc] = useState(course?.description ?? "");
  const [icon, setIcon] = useState(course?.icon ?? "📚");
  const [color, setColor] = useState(course ? argbToHex(course.color) : PALETTE[0]);
  const [classId, setClassId] = useState<string | null>(course?.class_id ?? defaultClass ?? classes[0]?.id ?? null);
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (!title.trim()) return toast("العنوان مطلوب", "error");
    if (!classId) return toast("اختر المجموعة", "error");
    setBusy(true);
    const ok = await run(async () => {
      if (course) await courseApi.update(course.id, { title: title.trim(), description: desc.trim() || null, icon, color: hexToArgb(color) });
      else await courseApi.create({ title, class_id: classId, description: desc, icon, color: hexToArgb(color) });
      return true;
    }, "تم الحفظ");
    setBusy(false);
    if (ok) { onClose(); onDone(); }
  };
  return (
    <Modal open onClose={onClose} title={course ? "تعديل الكورس" : "كورس جديد"} footer={<><Button variant="ghost" onClick={onClose}>إلغاء</Button><Button loading={busy} onClick={save}>حفظ</Button></>}>
      <div className="space-y-4">
        <Field label="العنوان"><Input value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
        {!course && <Field label="المجموعة"><ClassSelect classes={classes} value={classId} onChange={setClassId} /></Field>}
        <Field label="الوصف"><Textarea value={desc} onChange={(e) => setDesc(e.target.value)} /></Field>
        <div>
          <div className="mb-2 text-[13px] font-bold">الأيقونة</div>
          <div className="flex flex-wrap gap-2">{ICONS.map((i) => <button key={i} onClick={() => setIcon(i)} className={cx("grid size-11 place-items-center rounded-2xl border text-2xl cursor-pointer", icon === i ? "border-primary bg-primary-soft" : "border-line")}>{i}</button>)}</div>
        </div>
        <div>
          <div className="mb-2 text-[13px] font-bold">اللون</div>
          <div className="flex flex-wrap gap-2">{PALETTE.map((c) => <button key={c} onClick={() => setColor(c)} className={cx("size-10 rounded-full ring-offset-2 ring-offset-surface cursor-pointer", color.toLowerCase() === c.toLowerCase() && "ring-2 ring-ink")} style={{ background: c }} />)}</div>
        </div>
      </div>
    </Modal>
  );
}

function LessonsModal({ course, onClose }: { course: Course; onClose(): void }) {
  const { run, confirm, toast } = useUi();
  const state = useAsync(() => courseApi.lessons(course.id), [course.id]);
  const [editing, setEditing] = useState<Lesson | "new" | null>(null);
  const [f, setF] = useState({ title: "", minutes: "", url: "", locked: false });

  const startEdit = (l: Lesson | "new") => {
    setEditing(l);
    setF(l === "new" ? { title: "", minutes: "", url: "", locked: false } : { title: l.title, minutes: l.duration_seconds ? String(Math.round(l.duration_seconds / 60)) : "", url: l.video_url ?? "", locked: l.is_locked });
  };
  const save = async () => {
    if (!f.title.trim()) return toast("عنوان الدرس مطلوب", "error");
    const payload = { title: f.title.trim(), duration_seconds: Math.round((Number(f.minutes) || 0) * 60), video_url: f.url.trim() || null, is_locked: f.locked };
    const ok = await run(async () => {
      if (editing === "new") await courseApi.addLesson(course.id, { ...payload, video_url: payload.video_url ?? undefined });
      else if (editing) await courseApi.updateLesson(editing.id, payload);
      return true;
    }, "تم حفظ الدرس");
    if (ok) { setEditing(null); state.reload(); }
  };

  return (
    <Modal open onClose={onClose} title={<span>{course.icon} {course.title}</span>} wide>
      {editing ? (
        <div className="space-y-4">
          <Field label="عنوان الدرس"><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
          <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
            <Field label="المدة (دقائق)"><Input type="number" min={0} value={f.minutes} onChange={(e) => setF({ ...f, minutes: e.target.value })} /></Field>
            <Field label="رابط الفيديو" hint="YouTube أو Vimeo أو رابط مباشر"><Input dir="ltr" className="text-start" value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} /></Field>
          </div>
          <Switch checked={f.locked} onChange={(v) => setF({ ...f, locked: v })} label="مقفل (يظهر للطالب لكن لا يمكن فتحه)" />
          <div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setEditing(null)}>رجوع</Button><Button onClick={save}>حفظ الدرس</Button></div>
        </div>
      ) : (
        <Async state={state}>
          {(lessons) => (
            <>
              {lessons.length === 0 ? <EmptyState icon={PlayCircle} message="لا توجد دروس بعد" /> : (
                <div className="space-y-2">
                  {lessons.map((l, i) => (
                    <div key={l.id} className="flex items-center gap-3 rounded-2xl border border-line p-3">
                      <span className="grid size-9 place-items-center rounded-xl bg-primary-soft font-black text-primary">{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-bold">{l.title}</div>
                        <div className="flex items-center gap-2 text-xs text-muted">{l.duration_seconds ? Fmt.duration(l.duration_seconds) : "—"} {l.video_url ? "• فيديو" : "• بدون فيديو"} {l.is_locked && <Badge tone="neutral">مقفل</Badge>}</div>
                      </div>
                      <button title={l.is_locked ? "فتح" : "قفل"} onClick={async () => { await run(() => courseApi.updateLesson(l.id, { is_locked: !l.is_locked })); state.reload(); }} className="grid size-9 place-items-center rounded-xl text-muted hover:bg-surface-3 cursor-pointer">{l.is_locked ? <Lock className="size-4" /> : <Unlock className="size-4" />}</button>
                      <button onClick={() => startEdit(l)} className="grid size-9 place-items-center rounded-xl text-muted hover:bg-surface-3 hover:text-primary cursor-pointer"><Edit3 className="size-4" /></button>
                      <button onClick={async () => { if (await confirm({ title: "حذف الدرس", message: l.title, confirmLabel: "حذف", danger: true })) { await run(() => courseApi.removeLesson(l.id)); state.reload(); } }} className="grid size-9 place-items-center rounded-xl text-muted hover:bg-danger/10 hover:text-danger cursor-pointer"><Trash2 className="size-4" /></button>
                    </div>
                  ))}
                </div>
              )}
              <Button variant="secondary" icon={Plus} className="mt-4 w-full" onClick={() => startEdit("new")}>إضافة درس</Button>
            </>
          )}
        </Async>
      )}
    </Modal>
  );
}
