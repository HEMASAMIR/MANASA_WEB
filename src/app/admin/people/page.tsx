"use client";

import { useState } from "react";
import { Activity, KeyRound, Plus, Power, ShieldCheck, UserCog } from "lucide-react";
import { peopleApi } from "@/lib/api";
import { useAuth, useStaffPerms } from "@/lib/auth";
import { useAsync } from "@/lib/hooks";
import type { StaffUser } from "@/lib/types";
import { Async, Avatar, Badge, Button, Card, EmptyState, Field, Input, Modal, PageHeader, Select, Switch, Tabs, useUi } from "@/components/ui";

type Tab = "teachers" | "assistants" | "admins";

export default function PeoplePage() {
  const perms = useStaffPerms();
  const { profile } = useAuth();
  const { run, confirm } = useUi();
  const [tab, setTab] = useState<Tab>(perms.isAdmin ? "teachers" : "assistants");
  const state = useAsync(async () => {
    const [teachers, assistants, admins] = await Promise.all([
      perms.isAdmin ? peopleApi.byRole("teacher") : Promise.resolve([]),
      peopleApi.assistants(),
      perms.isAdmin ? peopleApi.byRole("admin") : Promise.resolve([]),
    ]);
    return { teachers, assistants, admins };
  }, [perms.isAdmin]);
  const [creating, setCreating] = useState(false);
  const [perm, setPerm] = useState<StaffUser | null>(null);
  const [pw, setPw] = useState<StaffUser | null>(null);

  const toggle = async (u: StaffUser) => {
    const active = u.status !== "active";
    if (!active && !(await confirm({ title: "إيقاف الحساب", message: `لن يتمكن ${u.name} من تسجيل الدخول حتى يتم تفعيله مرة أخرى.`, confirmLabel: "إيقاف", danger: true }))) return;
    if (await run(() => peopleApi.setStatus(u.id, active), active ? "تم تفعيل الحساب" : "تم إيقاف الحساب") !== undefined) state.reload();
  };

  return (
    <>
      <PageHeader title="المدرسون والمساعدون" icon={Activity} subtitle="إنشاء الحسابات وإدارة الصلاحيات" actions={<Button icon={Plus} onClick={() => setCreating(true)}>حساب جديد</Button>} />
      {perms.isAdmin && <Tabs value={tab} onChange={setTab} items={[
        { value: "teachers", label: "المدرسون", count: state.data?.teachers.length },
        { value: "assistants", label: "المساعدون", count: state.data?.assistants.length },
        { value: "admins", label: "المديرون", count: state.data?.admins.length },
      ]} />}
      <Async state={state}>
        {(d) => {
          const list = d[tab];
          if (!list.length) return <EmptyState icon={UserCog} message="لا توجد حسابات بعد" />;
          const teacherName = (id: string) => d.teachers.find((t) => t.id === id)?.name;
          return (
            <div className="grid gap-3 lg:grid-cols-2">
              {list.map((u) => (
                <Card key={u.id} className="!p-4">
                  <div className="flex items-center gap-4">
                    <Avatar name={u.name} size={50} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2"><span className="truncate font-extrabold">{u.name}</span>{u.status !== "active" && <Badge tone="danger">موقوف</Badge>}</div>
                      <div className="truncate text-sm text-muted" dir="ltr" style={{ textAlign: "right" }}>{u.email}{u.phone ? ` • ${u.phone}` : ""}</div>
                      {u.subject && <div className="text-sm text-muted">{u.subject}</div>}
                      {u.assistant && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <Badge tone="primary" dot={false}>{u.assistant.role_title}</Badge>
                          {perms.isAdmin && teacherName(u.assistant.teacher_id) && <Badge tone="neutral" dot={false}>مع {teacherName(u.assistant.teacher_id)}</Badge>}
                          {u.assistant.can_scan_attendance && <Badge tone="success">حضور</Badge>}
                          {u.assistant.can_enter_grades && <Badge tone="primary">درجات</Badge>}
                          {u.assistant.can_contact_parents && <Badge tone="info">تواصل</Badge>}
                          {u.assistant.can_view_financials && <Badge tone="warning">مالية</Badge>}
                        </div>
                      )}
                    </div>
                  </div>
                  {u.id !== profile?.id && (
                    <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-3">
                      {u.assistant && <Button size="sm" variant="secondary" icon={ShieldCheck} onClick={() => setPerm(u)}>الصلاحيات</Button>}
                      <Button size="sm" variant="outline" icon={KeyRound} onClick={() => setPw(u)}>كلمة المرور</Button>
                      <Button size="sm" variant={u.status === "active" ? "ghost" : "success"} icon={Power} onClick={() => toggle(u)} className={u.status === "active" ? "text-danger" : ""}>{u.status === "active" ? "إيقاف" : "تفعيل"}</Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          );
        }}
      </Async>
      {creating && <CreateModal teachers={state.data?.teachers ?? []} onClose={() => setCreating(false)} onDone={state.reload} />}
      {perm && <PermModal u={perm} onClose={() => setPerm(null)} onDone={state.reload} />}
      {pw && <PasswordModal u={pw} onClose={() => setPw(null)} />}
    </>
  );
}

function CreateModal({ teachers, onClose, onDone }: { teachers: StaffUser[]; onClose(): void; onDone(): void }) {
  const perms = useStaffPerms();
  const { run, toast } = useUi();
  const [role, setRole] = useState(perms.isAdmin ? "teacher" : "assistant");
  const [f, setF] = useState({ name: "", email: "", password: "", phone: "", subject: "", role_title: "مساعد", teacher_id: teachers[0]?.id ?? "" });
  const [p, setP] = useState({ can_scan_attendance: true, can_enter_grades: false, can_contact_parents: true, can_view_financials: false });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  const save = async () => {
    if (f.name.trim().length < 2) return toast("الاسم مطلوب", "error");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.trim())) return toast("البريد الإلكتروني غير صحيح", "error");
    if (f.password.length < 8) return toast("كلمة المرور يجب ألا تقل عن 8 أحرف", "error");
    if (role === "assistant" && perms.isAdmin && !f.teacher_id) return toast("اختر المدرس التابع له المساعد", "error");
    setBusy(true);
    const ok = await run(() => peopleApi.create({
      role, name: f.name.trim(), email: f.email.trim(), password: f.password, phone: f.phone.trim() || null, subject: f.subject.trim() || null,
      ...(role === "assistant" ? { role_title: f.role_title, teacher_id: f.teacher_id || null, ...p } : {}),
    }), "تم إنشاء الحساب");
    setBusy(false);
    if (ok) { onClose(); onDone(); }
  };

  return (
    <Modal open onClose={onClose} title="حساب جديد" wide footer={<><Button variant="ghost" onClick={onClose}>إلغاء</Button><Button loading={busy} onClick={save}>إنشاء</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        {perms.isAdmin && (
          <Field label="نوع الحساب">
            <Select value={role} onChange={(e) => setRole(e.target.value)}><option value="teacher">مدرس</option><option value="assistant">مساعد</option><option value="admin">مدير</option></Select>
          </Field>
        )}
        <Field label="الاسم"><Input value={f.name} onChange={set("name")} /></Field>
        <Field label="البريد الإلكتروني"><Input dir="ltr" className="text-start" value={f.email} onChange={set("email")} /></Field>
        <Field label="كلمة المرور" hint="8 أحرف على الأقل"><Input type="text" dir="ltr" className="text-start" value={f.password} onChange={set("password")} /></Field>
        <Field label="الموبايل"><Input dir="ltr" className="text-start" value={f.phone} onChange={set("phone")} /></Field>
        {role === "teacher" && <Field label="المادة"><Input value={f.subject} onChange={set("subject")} /></Field>}
        {role === "assistant" && <Field label="المسمى"><Input value={f.role_title} onChange={set("role_title")} /></Field>}
        {role === "assistant" && perms.isAdmin && (
          <Field label="تابع للمدرس"><Select value={f.teacher_id} onChange={set("teacher_id")}>{teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</Select></Field>
        )}
      </div>
      {role === "assistant" && (
        <div className="mt-5 rounded-2xl bg-surface-2 p-4">
          <div className="mb-2 font-bold">الصلاحيات</div>
          <Switch checked={p.can_scan_attendance} onChange={(v) => setP({ ...p, can_scan_attendance: v })} label="تسجيل الحضور" />
          <Switch checked={p.can_enter_grades} onChange={(v) => setP({ ...p, can_enter_grades: v })} label="إدخال الدرجات والكويزات" />
          <Switch checked={p.can_contact_parents} onChange={(v) => setP({ ...p, can_contact_parents: v })} label="التواصل مع أولياء الأمور" />
          <Switch checked={p.can_view_financials} onChange={(v) => setP({ ...p, can_view_financials: v })} label="المالية والاشتراكات" />
        </div>
      )}
    </Modal>
  );
}

function PermModal({ u, onClose, onDone }: { u: StaffUser; onClose(): void; onDone(): void }) {
  const { run } = useUi();
  const a = u.assistant!;
  const [f, setF] = useState({ role_title: a.role_title, can_scan_attendance: a.can_scan_attendance, can_enter_grades: a.can_enter_grades, can_contact_parents: a.can_contact_parents, can_view_financials: a.can_view_financials });
  const save = async () => {
    if (await run(() => peopleApi.updateAssistant(u.id, f), "تم حفظ الصلاحيات") !== undefined) { onClose(); onDone(); }
  };
  return (
    <Modal open onClose={onClose} title={`صلاحيات ${u.name}`} footer={<><Button variant="ghost" onClick={onClose}>إلغاء</Button><Button onClick={save}>حفظ</Button></>}>
      <Field label="المسمى"><Input value={f.role_title} onChange={(e) => setF({ ...f, role_title: e.target.value })} /></Field>
      <div className="mt-4 rounded-2xl bg-surface-2 p-4">
        <Switch checked={f.can_scan_attendance} onChange={(v) => setF({ ...f, can_scan_attendance: v })} label="تسجيل الحضور" />
        <Switch checked={f.can_enter_grades} onChange={(v) => setF({ ...f, can_enter_grades: v })} label="إدخال الدرجات والكويزات" />
        <Switch checked={f.can_contact_parents} onChange={(v) => setF({ ...f, can_contact_parents: v })} label="التواصل مع أولياء الأمور" />
        <Switch checked={f.can_view_financials} onChange={(v) => setF({ ...f, can_view_financials: v })} label="المالية والاشتراكات" />
      </div>
    </Modal>
  );
}

function PasswordModal({ u, onClose }: { u: StaffUser; onClose(): void }) {
  const { run, toast } = useUi();
  const [pw, setPw] = useState("");
  const save = async () => {
    if (pw.length < 8) return toast("كلمة المرور يجب ألا تقل عن 8 أحرف", "error");
    if (await run(() => peopleApi.resetPassword(u.id, pw), "تم تغيير كلمة المرور")) onClose();
  };
  return (
    <Modal open onClose={onClose} title={`كلمة مرور جديدة لـ ${u.name}`} footer={<><Button variant="ghost" onClick={onClose}>إلغاء</Button><Button onClick={save}>حفظ</Button></>}>
      <Field label="كلمة المرور الجديدة"><Input dir="ltr" className="text-start" value={pw} onChange={(e) => setPw(e.target.value)} /></Field>
    </Modal>
  );
}
