"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarDays, Clock, Edit3, MapPin, MessageCircle, Plus, Power, Trash2, User, Users, X } from "lucide-react";
import { classApi, peopleApi, type SlotInput } from "@/lib/api";
import { useAuth, useStaffPerms } from "@/lib/auth";
import { useAsync } from "@/lib/hooks";
import { Fmt, colorFor } from "@/lib/fmt";
import type { ClassRow } from "@/lib/types";
import { Async, Badge, Button, Card, EmptyState, Field, Input, Modal, PageHeader, Select, Switch, Tabs, cx, useUi } from "@/components/ui";

export default function ClassesPage() {
  const perms = useStaffPerms();
  const { settings } = useAuth();
  const [showInactive, setShowInactive] = useState(false);
  const [view, setView] = useState<"cards" | "week">("cards");
  const state = useAsync(() => classApi.list(true), []);
  const [editing, setEditing] = useState<ClassRow | "new" | null>(null);
  const { run, confirm } = useUi();

  return (
    <>
      <PageHeader title="المجموعات والجدول" icon={Users} subtitle="المجموعات الدراسية ومواعيدها الأسبوعية" actions={perms.canManage && <Button icon={Plus} onClick={() => setEditing("new")}>مجموعة جديدة</Button>} />
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <Tabs value={view} onChange={setView} items={[{ value: "cards", label: "المجموعات", icon: Users }, { value: "week", label: "الجدول الأسبوعي", icon: CalendarDays }]} />
        <div className="mb-5"><Switch checked={showInactive} onChange={setShowInactive} label="عرض المجموعات الموقوفة" /></div>
      </div>
      <Async state={state}>
        {(all) => {
          const list = all.filter((c) => showInactive || c.is_active);
          if (!list.length) return <EmptyState icon={Users} message="لا توجد مجموعات بعد" action={perms.canManage && <Button icon={Plus} onClick={() => setEditing("new")}>أضف أول مجموعة</Button>} />;
          if (view === "week") return <WeekView classes={list.filter((c) => c.is_active)} />;
          return (
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {list.map((c, i) => {
                const color = colorFor(c.subject || c.name);
                const count = c.enrollments?.[0]?.count ?? 0;
                return (
                  <div key={c.id} className={cx("relative overflow-hidden rounded-[28px] border border-line bg-surface shadow-soft animate-in", !c.is_active && "opacity-60")} style={{ animationDelay: `${i * 30}ms` }}>
                    <div className="h-2" style={{ background: `linear-gradient(90deg, ${color}, color-mix(in srgb, ${color} 50%, white))` }} />
                    <div className="p-5">
                      <div className="flex items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-lg font-black">{c.name}</h3>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {c.grade && <Badge tone="primary" dot={false}>{c.grade}</Badge>}
                            {c.subject && <Badge tone="info" dot={false}>{c.subject}</Badge>}
                            {!c.is_active && <Badge tone="neutral">موقوفة</Badge>}
                          </div>
                        </div>
                        <div className="rounded-2xl px-3 py-2 text-center" style={{ background: `${color}14`, color }}>
                          <div className="text-xl font-black leading-none">{count}</div>
                          <div className="text-[10px] font-bold">طالب</div>
                        </div>
                      </div>
                      <div className="mt-4 space-y-1.5 text-sm text-muted">
                        {c.user_profiles?.name && <div className="flex items-center gap-2"><User className="size-4" /> {c.user_profiles.name}</div>}
                        {c.room && <div className="flex items-center gap-2"><MapPin className="size-4" /> {c.room}</div>}
                        {c.monthly_fee > 0 && <div className="flex items-center gap-2">💰 {Fmt.money(c.monthly_fee, settings?.currency)} شهرياً</div>}
                      </div>
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {(c.class_schedule ?? []).sort((a, b) => a.weekday - b.weekday || a.start_time.localeCompare(b.start_time)).map((s, j) => (
                          <span key={j} className="flex items-center gap-1.5 rounded-xl bg-surface-3 px-2.5 py-1 text-xs font-bold"><Clock className="size-3.5" />{Fmt.weekdays[s.weekday]} {Fmt.time12(s.start_time)}</span>
                        ))}
                        {!c.class_schedule?.length && <span className="text-xs text-muted">لا توجد مواعيد</span>}
                      </div>
                      <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
                        {perms.canTakeAttendance && c.is_active && <Link href={`/admin/attendance?class=${c.id}`} className="rounded-xl bg-primary-soft px-3 py-2 text-sm font-bold text-primary">الحضور</Link>}
                        {c.whatsapp_group_url && <a href={c.whatsapp_group_url} target="_blank" rel="noreferrer" className="grid size-9 place-items-center rounded-xl bg-success/10 text-success"><MessageCircle className="size-4" /></a>}
                        <div className="flex-1" />
                        {perms.canManage && (
                          <>
                            <button title="تعديل" onClick={() => setEditing(c)} className="grid size-9 place-items-center rounded-xl text-muted hover:bg-surface-3 hover:text-primary cursor-pointer"><Edit3 className="size-4" /></button>
                            <button title={c.is_active ? "إيقاف" : "تفعيل"} onClick={async () => { await run(() => classApi.update(c.id, { is_active: !c.is_active }), c.is_active ? "تم إيقاف المجموعة" : "تم تفعيل المجموعة"); state.reload(); }} className="grid size-9 place-items-center rounded-xl text-muted hover:bg-surface-3 hover:text-warning cursor-pointer"><Power className="size-4" /></button>
                            <button title="حذف" onClick={async () => {
                              if (await confirm({ title: "حذف المجموعة", message: `سيتم حذف "${c.name}" مع سجلات حضورها وامتحاناتها وكورساتها. يفضل إيقافها بدلاً من الحذف.`, confirmLabel: "حذف نهائي", danger: true })) {
                                await run(() => classApi.remove(c.id), "تم حذف المجموعة");
                                state.reload();
                              }
                            }} className="grid size-9 place-items-center rounded-xl text-muted hover:bg-danger/10 hover:text-danger cursor-pointer"><Trash2 className="size-4" /></button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        }}
      </Async>
      {editing && <ClassForm cls={editing === "new" ? null : editing} onClose={() => setEditing(null)} onDone={state.reload} />}
    </>
  );
}

function WeekView({ classes }: { classes: ClassRow[] }) {
  const today = new Date().getDay();
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {[6, 0, 1, 2, 3, 4, 5].map((d) => {
        const items = classes.flatMap((c) => (c.class_schedule ?? []).filter((s) => s.weekday === d).map((s) => ({ c, s }))).sort((a, b) => a.s.start_time.localeCompare(b.s.start_time));
        return (
          <Card key={d} className={cx("!p-4", d === today && "ring-2 ring-primary")}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-black">{Fmt.weekdays[d]}</h3>
              {d === today && <Badge>اليوم</Badge>}
            </div>
            {items.length === 0 ? <p className="py-4 text-center text-sm text-muted">لا توجد حصص</p> : (
              <div className="space-y-2">
                {items.map(({ c, s }, i) => {
                  const color = colorFor(c.subject || c.name);
                  return (
                    <div key={i} className="rounded-2xl border-s-4 bg-surface-2 p-3" style={{ borderColor: color }}>
                      <div className="font-bold">{c.name}</div>
                      <div className="text-xs text-muted">{Fmt.time12(s.start_time)} - {Fmt.time12(s.end_time)}{s.room || c.room ? ` • ${s.room || c.room}` : ""}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

function ClassForm({ cls, onClose, onDone }: { cls: ClassRow | null; onClose(): void; onDone(): void }) {
  const { run, toast } = useUi();
  const perms = useStaffPerms();
  const { profile } = useAuth();
  const teachers = useAsync(() => (perms.isAdmin ? peopleApi.byRole("teacher") : Promise.resolve([])), []);
  const [f, setF] = useState({
    name: cls?.name ?? "", grade: cls?.grade ?? "", subject: cls?.subject ?? "", room: cls?.room ?? "",
    monthly_fee: String(cls?.monthly_fee ?? ""), whatsapp_group_url: cls?.whatsapp_group_url ?? "", capacity: cls?.capacity ? String(cls.capacity) : "",
    teacher_id: cls?.teacher_id ?? (perms.isTeacher ? profile?.id ?? "" : ""),
  });
  const [slots, setSlots] = useState<SlotInput[]>(
    (cls?.class_schedule ?? []).map((s) => ({ weekday: s.weekday, start: s.start_time.slice(0, 5), end: s.end_time.slice(0, 5), room: s.room ?? "" })),
  );
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  const save = async () => {
    if (f.name.trim().length < 2) return toast("اسم المجموعة مطلوب", "error");
    for (const s of slots) if (!s.start || !s.end || s.end <= s.start) return toast("تأكد من أن وقت النهاية بعد وقت البداية في كل موعد", "error");
    setBusy(true);
    const teacher = perms.isTeacher ? profile!.id : f.teacher_id || null;
    const ok = await run(async () => {
      if (cls) {
        await classApi.update(cls.id, {
          name: f.name.trim(), grade: f.grade.trim(), subject: f.subject.trim() || null, room: f.room.trim() || null,
          monthly_fee: Number(f.monthly_fee) || 0, whatsapp_group_url: f.whatsapp_group_url.trim() || null,
          capacity: f.capacity ? Number(f.capacity) : null, ...(perms.isAdmin ? { teacher_id: teacher } : {}),
        });
        await classApi.setSchedule(cls.id, slots);
      } else {
        await classApi.create({ name: f.name, grade: f.grade, subject: f.subject, room: f.room, monthly_fee: Number(f.monthly_fee) || 0, whatsapp_group_url: f.whatsapp_group_url, capacity: f.capacity ? Number(f.capacity) : null, teacher_id: teacher, slots });
      }
      return true;
    }, cls ? "تم حفظ المجموعة" : "تمت إضافة المجموعة");
    setBusy(false);
    if (ok) { onClose(); onDone(); }
  };

  return (
    <Modal open onClose={onClose} title={cls ? "تعديل المجموعة" : "مجموعة جديدة"} wide footer={<><Button variant="ghost" onClick={onClose}>إلغاء</Button><Button loading={busy} onClick={save}>حفظ</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="اسم المجموعة *"><Input value={f.name} onChange={set("name")} placeholder="مثال: فيزياء 3ث - السبت" /></Field>
        <Field label="الصف الدراسي"><Input value={f.grade} onChange={set("grade")} /></Field>
        <Field label="المادة"><Input value={f.subject} onChange={set("subject")} /></Field>
        <Field label="القاعة"><Input value={f.room} onChange={set("room")} /></Field>
        <Field label="الرسوم الشهرية"><Input type="number" min={0} value={f.monthly_fee} onChange={set("monthly_fee")} /></Field>
        <Field label="السعة (اختياري)"><Input type="number" min={1} value={f.capacity} onChange={set("capacity")} /></Field>
        {perms.isAdmin && (
          <Field label="المدرس">
            <Select value={f.teacher_id} onChange={set("teacher_id")}>
              <option value="">بدون مدرس</option>
              {teachers.data?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
          </Field>
        )}
        <Field label="رابط جروب واتساب"><Input value={f.whatsapp_group_url} onChange={set("whatsapp_group_url")} dir="ltr" className="text-start" placeholder="https://chat.whatsapp.com/..." /></Field>
      </div>
      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="font-extrabold">المواعيد الأسبوعية</h4>
          <Button size="sm" variant="secondary" icon={Plus} onClick={() => setSlots([...slots, { weekday: 6, start: "16:00", end: "17:30", room: "" }])}>إضافة موعد</Button>
        </div>
        {slots.length === 0 && <p className="rounded-2xl bg-surface-2 p-4 text-center text-sm text-muted">لم تتم إضافة مواعيد</p>}
        <div className="space-y-2">
          {slots.map((s, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-2 rounded-2xl bg-surface-2 p-2">
              <Select value={s.weekday} onChange={(e) => setSlots(slots.map((x, j) => (j === i ? { ...x, weekday: Number(e.target.value) } : x)))}>
                {Fmt.weekdays.map((w, d) => <option key={d} value={d}>{w}</option>)}
              </Select>
              <Input type="time" value={s.start} onChange={(e) => setSlots(slots.map((x, j) => (j === i ? { ...x, start: e.target.value } : x)))} />
              <Input type="time" value={s.end} onChange={(e) => setSlots(slots.map((x, j) => (j === i ? { ...x, end: e.target.value } : x)))} />
              <button onClick={() => setSlots(slots.filter((_, j) => j !== i))} className="grid size-10 place-items-center rounded-xl text-muted hover:bg-danger/10 hover:text-danger cursor-pointer"><X className="size-4" /></button>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
