"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowRight, Award, BellRing, CalendarCheck, CreditCard, Edit3, GraduationCap, MessageCircle, Phone, Trash2, UserCheck,
  UserX, Users, Wallet, ClipboardList,
} from "lucide-react";
import { attendanceApi, classApi, classNames, examApi, financeApi, notificationApi, studentApi } from "@/lib/api";
import { useAuth, useStaffPerms } from "@/lib/auth";
import { useAsync } from "@/lib/hooks";
import { Fmt, parseDate, whatsappLink } from "@/lib/fmt";
import { PAYMENT_KIND_LABEL, PAYMENT_METHOD_LABEL, STATUS_LABEL, STATUS_TONE, type StudentSummary } from "@/lib/types";
import { ClassSelect } from "@/components/shared";
import {
  Async, Avatar, Badge, Button, Card, Field, Input, Modal, Ring, Select, StatCard, TONE_HEX, Table, Tabs, Textarea, cx, useUi,
} from "@/components/ui";

export default function StudentDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const perms = useStaffPerms();
  const { settings } = useAuth();
  const { run, confirm } = useUi();
  const state = useAsync(() => studentApi.get(id), [id]);
  const [tab, setTab] = useState<"attendance" | "grades" | "payments" | "guardians">("attendance");
  const [modal, setModal] = useState<null | "edit" | "classes" | "renew" | "payment" | "note" | "award">(null);
  const currency = settings?.currency ?? "ج.م";

  return (
    <Async state={state}>
      {(s) => {
        const st = s.student;
        const wa = whatsappLink(st.parent_phone, `السلام عليكم ولي أمر الطالب ${st.name}، معكم ${settings?.center_name ?? "إدارة المركز"}.`, settings?.country_code);
        const toggleStatus = async () => {
          const next = st.status === "active" ? "suspended" : "active";
          if (await run(() => studentApi.update(st.id, { status: next }), next === "active" ? "تم تفعيل الطالب" : "تم إيقاف الطالب") !== undefined) state.reload();
        };
        const remove = async () => {
          if (!(await confirm({ title: "حذف الطالب", message: `سيتم حذف ${st.name} وكل سجلاته (الحضور، الدرجات، المدفوعات) نهائياً. هل أنت متأكد؟`, confirmLabel: "حذف نهائي", danger: true }))) return;
          if (await run(() => studentApi.remove(st.id), "تم حذف الطالب") !== undefined) router.replace("/admin/students");
        };
        return (
          <>
            <button onClick={() => router.back()} className="mb-4 flex items-center gap-1.5 text-sm font-bold text-muted hover:text-primary cursor-pointer"><ArrowRight className="size-4" /> رجوع</button>

            {/* Hero */}
            <div className="relative mb-6 overflow-hidden rounded-[28px] bg-hero p-6 text-white shadow-soft animate-in md:p-8">
              <div className="absolute -top-16 -end-12 size-56 rounded-full bg-white/10" />
              <div className="relative flex flex-wrap items-center gap-5">
                <div className="rounded-full border-2 border-white/50 p-1"><Avatar name={st.name} size={80} src={st.photo_url} /></div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-3xl font-black">{st.name}</h1>
                  <div className="mt-2 flex flex-wrap gap-2 text-sm">
                    <span className="rounded-full bg-white/18 px-3 py-1 font-bold" dir="ltr">{st.student_code}</span>
                    {st.grade && <span className="rounded-full bg-white/18 px-3 py-1">{st.grade}</span>}
                    <span className="rounded-full bg-white/18 px-3 py-1">{classNames(s)}</span>
                    <span className={cx("rounded-full px-3 py-1 font-bold", st.status === "active" ? "bg-success/30" : "bg-danger/40")}>{st.status === "active" ? "نشط" : st.status === "suspended" ? "موقوف" : "مؤرشف"}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-white/85">
                    <span>ولي الأمر: {st.parent_name || "—"} • <span dir="ltr">{st.parent_phone}</span></span>
                    {st.student_phone && <span>الطالب: <span dir="ltr">{st.student_phone}</span></span>}
                    <span>الاشتراك: {st.subscription_end ? `حتى ${Fmt.date(st.subscription_end)}` : "غير مسجل"}</span>
                  </div>
                </div>
              </div>
              <div className="relative mt-6 flex flex-wrap gap-2">
                {perms.canManage && <HeroBtn icon={Edit3} onClick={() => setModal("edit")}>تعديل</HeroBtn>}
                {perms.canManage && <HeroBtn icon={Users} onClick={() => setModal("classes")}>المجموعات</HeroBtn>}
                {perms.canSeeFinance && <HeroBtn icon={Wallet} onClick={() => setModal("renew")}>تجديد الاشتراك</HeroBtn>}
                {perms.canSeeFinance && <HeroBtn icon={CreditCard} onClick={() => setModal("payment")}>دفعة أخرى</HeroBtn>}
                {perms.canContactParents && <HeroBtn icon={BellRing} onClick={() => setModal("note")}>إشعار لولي الأمر</HeroBtn>}
                {perms.canManage && <HeroBtn icon={Award} onClick={() => setModal("award")}>منح وسام</HeroBtn>}
                {perms.canContactParents && wa && <a href={wa} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-success px-3.5 py-2 text-sm font-bold"><MessageCircle className="size-4" /> واتساب</a>}
                {perms.canContactParents && <a href={`tel:${st.parent_phone}`} className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-3.5 py-2 text-sm font-bold hover:bg-white/25"><Phone className="size-4" /> اتصال</a>}
                {perms.canManage && <HeroBtn icon={st.status === "active" ? UserX : UserCheck} onClick={toggleStatus}>{st.status === "active" ? "إيقاف" : "تفعيل"}</HeroBtn>}
                {perms.isAdmin && <HeroBtn icon={Trash2} onClick={remove} danger>حذف</HeroBtn>}
              </div>
            </div>

            <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Card className="flex items-center gap-4">
                <Ring value={s.stats?.attendance_pct ?? 0} size={72} stroke={8} color={TONE_HEX.success}><span className="text-sm font-black">{Fmt.pct(s.stats?.attendance_pct)}</span></Ring>
                <div><div className="font-extrabold">نسبة الحضور</div><div className="text-sm text-muted">{s.stats?.total_sessions ?? 0} حصة</div></div>
              </Card>
              <StatCard label="مرات الغياب" value={s.stats?.absent_count ?? 0} icon={UserX} tone="danger" hint={`تأخر ${s.stats?.late_count ?? 0}`} />
              <StatCard label="متوسط الدرجات" value={Fmt.pct(s.stats?.avg_percent)} icon={GraduationCap} />
              {perms.canSeeFinance && <StatCard label="إجمالي المدفوع" value={Fmt.money(s.stats?.total_paid, currency)} icon={Wallet} tone={s.stats?.is_overdue ? "danger" : "success"} hint={s.stats?.is_overdue ? "الاشتراك منتهي" : undefined} />}
            </div>

            {st.notes && <Card className="mb-6 border-warning/40 bg-warning/5"><div className="text-sm font-bold text-warning">ملاحظات</div><p className="mt-1 whitespace-pre-line">{st.notes}</p></Card>}

            <Tabs value={tab} onChange={setTab} items={[
              { value: "attendance", label: "الحضور", icon: CalendarCheck },
              { value: "grades", label: "الدرجات", icon: ClipboardList },
              ...(perms.canSeeFinance ? [{ value: "payments" as const, label: "المدفوعات", icon: CreditCard }] : []),
              { value: "guardians", label: "أولياء الأمور", icon: Users },
            ]} />
            {tab === "attendance" && <AttendanceTab id={st.id} />}
            {tab === "grades" && <GradesTab id={st.id} />}
            {tab === "payments" && <PaymentsTab id={st.id} currency={currency} isAdmin={perms.isAdmin} />}
            {tab === "guardians" && <GuardiansTab id={st.id} />}

            <EditModal open={modal === "edit"} onClose={() => setModal(null)} s={s} onDone={state.reload} />
            <ClassesModal open={modal === "classes"} onClose={() => setModal(null)} s={s} onDone={state.reload} />
            <RenewModal open={modal === "renew"} onClose={() => setModal(null)} s={s} onDone={state.reload} currency={currency} />
            <PaymentModal open={modal === "payment"} onClose={() => setModal(null)} s={s} onDone={state.reload} />
            <NoteModal open={modal === "note"} onClose={() => setModal(null)} s={s} />
            <AwardModal open={modal === "award"} onClose={() => setModal(null)} s={s} />
          </>
        );
      }}
    </Async>
  );
}

function HeroBtn({ icon: Icon, children, onClick, danger }: { icon: typeof Edit3; children: React.ReactNode; onClick(): void; danger?: boolean }) {
  return (
    <button onClick={onClick} className={cx("inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-bold transition cursor-pointer", danger ? "bg-danger/80 hover:bg-danger" : "bg-white/15 hover:bg-white/25")}>
      <Icon className="size-4" /> {children}
    </button>
  );
}

function AttendanceTab({ id }: { id: string }) {
  const state = useAsync(() => attendanceApi.history({ studentId: id, limit: 300 }), [id]);
  return (
    <Async state={state} empty={(r) => r.length === 0} emptyMessage="لا يوجد سجل حضور بعد" emptyIcon={CalendarCheck}>
      {(rows) => (
        <Table head={["التاريخ", "المجموعة", "الحالة", "الطريقة", "ملاحظة"]}>
          {rows.map((r) => (
            <tr key={r.id} className="hover:bg-surface-2">
              <td className="whitespace-nowrap px-4 py-3 font-semibold">{Fmt.weekday(parseDate(r.date))} {Fmt.date(r.date)}</td>
              <td className="px-4 py-3">{r.classes?.name}</td>
              <td className="px-4 py-3"><Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge></td>
              <td className="px-4 py-3 text-muted">{r.method === "manual" ? "يدوي" : "QR"}</td>
              <td className="px-4 py-3 text-muted">{r.note ?? "—"}</td>
            </tr>
          ))}
        </Table>
      )}
    </Async>
  );
}

function GradesTab({ id }: { id: string }) {
  const state = useAsync(() => examApi.studentGrades(id), [id]);
  return (
    <Async state={state} empty={(r) => r.length === 0} emptyMessage="لا توجد درجات بعد" emptyIcon={ClipboardList}>
      {(rows) => (
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map((g) => {
            const max = g.exams?.max_score ?? 0;
            const pct = max ? (g.score / max) * 100 : 0;
            const tone = pct >= 85 ? TONE_HEX.success : pct >= 50 ? TONE_HEX.primary : TONE_HEX.danger;
            return (
              <Card key={g.id} className="flex items-center gap-4 !p-4">
                <Ring value={pct} size={60} stroke={7} color={tone}><span className="text-xs font-black">{Math.round(pct)}%</span></Ring>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-extrabold">{g.exams?.title ?? "—"}</div>
                  <div className="text-sm text-muted">{g.exams?.exam_date ? Fmt.date(g.exams.exam_date) : Fmt.date(g.updated_at)}{g.remarks ? ` • ${g.remarks}` : ""}</div>
                </div>
                <div className="text-lg font-black">{Fmt.number(g.score)}<span className="text-sm text-muted"> / {Fmt.number(max)}</span></div>
              </Card>
            );
          })}
        </div>
      )}
    </Async>
  );
}

function PaymentsTab({ id, currency, isAdmin }: { id: string; currency: string; isAdmin: boolean }) {
  const { run, confirm } = useUi();
  const state = useAsync(() => financeApi.payments({ studentId: id }), [id]);
  return (
    <Async state={state} empty={(r) => r.length === 0} emptyMessage="لا توجد مدفوعات مسجلة" emptyIcon={CreditCard}>
      {(rows) => (
        <Table head={["التاريخ", "النوع", "الطريقة", "المبلغ", "استلمها", ...(isAdmin ? [""] : [])]}>
          {rows.map((p) => (
            <tr key={p.id} className="hover:bg-surface-2">
              <td className="whitespace-nowrap px-4 py-3">{Fmt.dateTime(p.paid_at)}</td>
              <td className="px-4 py-3">{PAYMENT_KIND_LABEL[p.kind] ?? p.kind}</td>
              <td className="px-4 py-3 text-muted">{PAYMENT_METHOD_LABEL[p.method] ?? p.method}</td>
              <td className="px-4 py-3 font-black text-success">{Fmt.money(p.amount, currency)}</td>
              <td className="px-4 py-3 text-muted">{p.user_profiles?.name ?? "—"}</td>
              {isAdmin && (
                <td className="px-4 py-3">
                  <button className="rounded-lg p-1.5 text-muted hover:bg-danger/10 hover:text-danger cursor-pointer" onClick={async () => {
                    if (await confirm({ title: "حذف الدفعة", message: "سيتم حذف هذه الدفعة (لن يتغير تاريخ نهاية الاشتراك).", confirmLabel: "حذف", danger: true })) {
                      await run(() => financeApi.remove(p.id), "تم حذف الدفعة");
                      state.reload();
                    }
                  }}><Trash2 className="size-4" /></button>
                </td>
              )}
            </tr>
          ))}
        </Table>
      )}
    </Async>
  );
}

function GuardiansTab({ id }: { id: string }) {
  const state = useAsync(() => studentApi.guardians(id), [id]);
  return (
    <Async state={state} empty={(r) => r.length === 0} emptyMessage={"لا يوجد حساب ولي أمر مرتبط.\nيمكن لولي الأمر إنشاء حساب من الموقع أو التطبيق باستخدام كود الطالب ورقم موبايله."} emptyIcon={Users}>
      {(rows) => (
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map((g) => (
            <Card key={g.id} className="flex items-center gap-4 !p-4">
              <Avatar name={g.name} />
              <div className="min-w-0">
                <div className="font-extrabold">{g.name}</div>
                <div className="truncate text-sm text-muted" dir="ltr">{g.phone ?? ""} {g.email ? `• ${g.email}` : ""}</div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Async>
  );
}

// ─── Modals ──────────────────────────────────────────────────────────────────
type MP = { open: boolean; onClose(): void; s: StudentSummary; onDone?: () => void };

function EditModal({ open, onClose, s, onDone }: MP) {
  const { run } = useUi();
  const st = s.student;
  const [f, setF] = useState({ name: st.name, grade: st.grade, parent_name: st.parent_name ?? "", parent_phone: st.parent_phone, student_phone: st.student_phone ?? "", notes: st.notes ?? "" });
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    const ok = await run(() => studentApi.update(st.id, f), "تم حفظ التعديلات");
    setBusy(false);
    if (ok !== undefined) { onClose(); onDone?.(); }
  };
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });
  return (
    <Modal open={open} onClose={onClose} title="تعديل بيانات الطالب" wide footer={<><Button variant="ghost" onClick={onClose}>إلغاء</Button><Button loading={busy} onClick={save}>حفظ</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="الاسم"><Input value={f.name} onChange={set("name")} /></Field>
        <Field label="الصف"><Input value={f.grade} onChange={set("grade")} /></Field>
        <Field label="اسم ولي الأمر"><Input value={f.parent_name} onChange={set("parent_name")} /></Field>
        <Field label="موبايل ولي الأمر"><Input value={f.parent_phone} onChange={set("parent_phone")} dir="ltr" className="text-start" /></Field>
        <Field label="موبايل الطالب"><Input value={f.student_phone} onChange={set("student_phone")} dir="ltr" className="text-start" /></Field>
        <Field label="ملاحظات" className="sm:col-span-2"><Textarea value={f.notes} onChange={set("notes")} /></Field>
      </div>
    </Modal>
  );
}

function ClassesModal({ open, onClose, s, onDone }: MP) {
  const { run } = useUi();
  const classes = useAsync(() => (open ? classApi.list() : Promise.resolve([])), [open]);
  const current = s.classes.map((c) => c.id);
  const [picked, setPicked] = useState<string[]>(current);
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    const ok = await run(() => studentApi.setClasses(s.student.id, picked, current), "تم تحديث المجموعات");
    setBusy(false);
    if (ok !== undefined) { onClose(); onDone?.(); }
  };
  return (
    <Modal open={open} onClose={onClose} title="مجموعات الطالب" footer={<><Button variant="ghost" onClick={onClose}>إلغاء</Button><Button loading={busy} onClick={save}>حفظ</Button></>}>
      <Async state={classes} empty={(c) => c.length === 0} emptyMessage="لا توجد مجموعات">
        {(list) => (
          <div className="space-y-2">
            {list.map((c) => {
              const on = picked.includes(c.id);
              return (
                <button key={c.id} onClick={() => setPicked(on ? picked.filter((x) => x !== c.id) : [...picked, c.id])}
                  className={cx("flex w-full items-center gap-3 rounded-2xl border p-3 text-start transition cursor-pointer", on ? "border-primary bg-primary-soft" : "border-line")}>
                  <span className={cx("grid size-6 place-items-center rounded-lg border-2 text-xs font-black", on ? "border-primary bg-primary text-white" : "border-line")}>{on && "✓"}</span>
                  <span className="flex-1 font-bold">{c.name}</span>
                  <span className="text-sm text-muted">{c.grade}</span>
                </button>
              );
            })}
          </div>
        )}
      </Async>
    </Modal>
  );
}

function RenewModal({ open, onClose, s, onDone, currency }: MP & { currency: string }) {
  const { run, toast } = useUi();
  const classes = useAsync(() => (open ? classApi.list() : Promise.resolve([])), [open]);
  const [amount, setAmount] = useState("");
  const [months, setMonths] = useState(1);
  const [method, setMethod] = useState("cash");
  const [classId, setClassId] = useState<string | null>(s.classes[0]?.id ?? null);
  const [busy, setBusy] = useState(false);
  const fee = classes.data?.find((c) => c.id === classId)?.monthly_fee;
  const save = async () => {
    const a = Number(amount || (fee ? fee * months : 0));
    if (!(a > 0)) return toast("المبلغ غير صحيح", "error");
    setBusy(true);
    const end = await run(() => financeApi.renew({ studentId: s.student.id, amount: a, method, months, classId }));
    setBusy(false);
    if (end) { toast(`تم التجديد حتى ${Fmt.date(end)}`); onClose(); onDone?.(); }
  };
  return (
    <Modal open={open} onClose={onClose} title="تجديد الاشتراك" footer={<><Button variant="ghost" onClick={onClose}>إلغاء</Button><Button loading={busy} onClick={save} icon={Wallet}>تسجيل الدفع والتجديد</Button></>}>
      <div className="space-y-4">
        <div className="rounded-2xl bg-surface-2 p-3 text-sm">الاشتراك الحالي: <b>{s.student.subscription_end ? `حتى ${Fmt.date(s.student.subscription_end)}` : "لا يوجد"}</b></div>
        {classes.data && classes.data.length > 0 && <Field label="المجموعة"><ClassSelect classes={classes.data} value={classId} onChange={setClassId} allLabel="بدون تحديد" /></Field>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="عدد الشهور"><Select value={months} onChange={(e) => setMonths(Number(e.target.value))}>{[1, 2, 3, 4, 5, 6, 9, 12].map((m) => <option key={m} value={m}>{m} شهر</option>)}</Select></Field>
          <Field label={`المبلغ (${currency})`} hint={fee ? `الرسوم الشهرية: ${Fmt.money(fee, currency)}` : undefined}><Input type="number" min={0} value={amount} placeholder={fee ? String(fee * months) : ""} onChange={(e) => setAmount(e.target.value)} /></Field>
        </div>
        <Field label="طريقة الدفع"><Select value={method} onChange={(e) => setMethod(e.target.value)}>{Object.entries(PAYMENT_METHOD_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
      </div>
    </Modal>
  );
}

function PaymentModal({ open, onClose, s, onDone }: MP) {
  const { run, toast } = useUi();
  const [amount, setAmount] = useState("");
  const [kind, setKind] = useState("materials");
  const [method, setMethod] = useState("cash");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const save = async () => {
    const a = Number(amount);
    if (!(a > 0)) return toast("المبلغ غير صحيح", "error");
    setBusy(true);
    const ok = await run(() => financeApi.add({ studentId: s.student.id, amount: a, kind, method, notes }), "تم تسجيل الدفعة");
    setBusy(false);
    if (ok !== undefined) { onClose(); onDone?.(); }
  };
  return (
    <Modal open={open} onClose={onClose} title="تسجيل دفعة" footer={<><Button variant="ghost" onClick={onClose}>إلغاء</Button><Button loading={busy} onClick={save}>حفظ</Button></>}>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="النوع"><Select value={kind} onChange={(e) => setKind(e.target.value)}>{Object.entries(PAYMENT_KIND_LABEL).filter(([k]) => k !== "subscription").map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
          <Field label="المبلغ"><Input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
        </div>
        <Field label="طريقة الدفع"><Select value={method} onChange={(e) => setMethod(e.target.value)}>{Object.entries(PAYMENT_METHOD_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
        <Field label="ملاحظات"><Input value={notes} onChange={(e) => setNotes(e.target.value)} /></Field>
      </div>
    </Modal>
  );
}

function NoteModal({ open, onClose, s }: MP) {
  const { run, toast } = useUi();
  const [title, setTitle] = useState(`ملاحظة بخصوص ${s.student.name}`);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const send = async () => {
    if (!body.trim()) return toast("اكتب نص الإشعار", "error");
    setBusy(true);
    const n = await run(() => notificationApi.sendNote(s.student.id, title, body));
    setBusy(false);
    if (n) { toast(`تم الإرسال إلى ${n} حساب`); setBody(""); onClose(); }
  };
  return (
    <Modal open={open} onClose={onClose} title="إشعار لولي الأمر والطالب" footer={<><Button variant="ghost" onClick={onClose}>إلغاء</Button><Button loading={busy} icon={BellRing} onClick={send}>إرسال</Button></>}>
      <div className="space-y-4">
        <Field label="العنوان"><Input value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
        <Field label="النص"><Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} /></Field>
      </div>
    </Modal>
  );
}

function AwardModal({ open, onClose, s }: MP) {
  const { run, toast } = useUi();
  const [emoji, setEmoji] = useState("🏆");
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (!title.trim()) return toast("اكتب عنوان الوسام", "error");
    setBusy(true);
    const ok = await run(() => studentApi.award(s.student.id, emoji, title, desc), "تم منح الوسام 🎉");
    setBusy(false);
    if (ok !== undefined) { setTitle(""); setDesc(""); onClose(); }
  };
  return (
    <Modal open={open} onClose={onClose} title="منح وسام للطالب" footer={<><Button variant="ghost" onClick={onClose}>إلغاء</Button><Button loading={busy} icon={Award} onClick={save}>منح</Button></>}>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {["🏆", "🥇", "⭐", "🎯", "🔥", "💯", "📚", "🧠", "👑", "🚀"].map((e) => (
            <button key={e} onClick={() => setEmoji(e)} className={cx("grid size-12 place-items-center rounded-2xl border text-2xl transition cursor-pointer", emoji === e ? "border-primary bg-primary-soft scale-110" : "border-line")}>{e}</button>
          ))}
        </div>
        <Field label="العنوان"><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: الأول على المجموعة" /></Field>
        <Field label="الوصف (اختياري)"><Input value={desc} onChange={(e) => setDesc(e.target.value)} /></Field>
      </div>
    </Modal>
  );
}

