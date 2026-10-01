"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle, BadgeCheck, CalendarCheck, CheckCircle2, Clock, CreditCard, GraduationCap, Hash, Link2, Phone, Plus, ShieldCheck, UserX, Users,
} from "lucide-react";
import { attendanceApi, classNames, examApi, financeApi, studentApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useAsync } from "@/lib/hooks";
import { Fmt, parseDate } from "@/lib/fmt";
import { PAYMENT_KIND_LABEL, PAYMENT_METHOD_LABEL, STATUS_LABEL, STATUS_TONE, type StudentSummary } from "@/lib/types";
import { Async, Avatar, Badge, Button, Card, EmptyState, Field, Input, Modal, Ring, StatCard, TONE_HEX, Tabs, cx, useUi } from "@/components/ui";

export default function ParentHome() {
  const { settings, claimWarning, clearClaimWarning } = useAuth();
  const { toast } = useUi();
  const state = useAsync(() => studentApi.list(), []);
  const [childId, setChildId] = useState<string | null>(null);
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    if (claimWarning) { toast(claimWarning, "error"); clearClaimWarning(); }
  }, [claimWarning, toast, clearClaimWarning]);

  return (
    <Async state={state}>
      {(children) => {
        if (!children.length) {
          return (
            <>
              <EmptyState icon={Users} message={"لا يوجد طالب مرتبط بحسابك بعد.\nاضغط \"ربط طالب\" وأدخل كود الطالب ورقم موبايلك المسجل لدى المركز."} action={<Button icon={Link2} onClick={() => setLinking(true)}>ربط طالب</Button>} />
              {linking && <LinkModal onClose={() => setLinking(false)} onDone={state.reload} />}
            </>
          );
        }
        const child = children.find((c) => c.student.id === childId) ?? children[0];
        return (
          <>
            <div className="mb-5 flex flex-wrap items-center gap-2">
              {children.map((c) => (
                <button key={c.student.id} onClick={() => setChildId(c.student.id)}
                  className={cx("flex items-center gap-2 rounded-2xl border py-1.5 ps-1.5 pe-4 font-bold transition cursor-pointer", c.student.id === child.student.id ? "border-primary bg-primary-soft text-primary" : "border-line bg-surface text-muted hover:text-ink")}>
                  <Avatar name={c.student.name} size={32} /> {c.student.name.split(" ")[0]}
                </button>
              ))}
              <Button variant="outline" size="sm" icon={Plus} onClick={() => setLinking(true)}>ربط طالب</Button>
            </div>
            <ChildView key={child.student.id} s={child} currency={settings?.currency ?? "ج.م"} />
            {linking && <LinkModal onClose={() => setLinking(false)} onDone={state.reload} />}
          </>
        );
      }}
    </Async>
  );
}

function ChildView({ s, currency }: { s: StudentSummary; currency: string }) {
  const [tab, setTab] = useState<"attendance" | "grades" | "subscription">("attendance");
  const st = s.student;
  const pct = s.stats?.attendance_pct ?? null;
  return (
    <>
      <div className="relative mb-6 overflow-hidden rounded-[28px] bg-hero p-6 text-white shadow-[0_20px_40px_-18px_rgba(13,148,136,0.8)] animate-in md:p-8">
        <div className="absolute -top-16 -end-12 size-56 rounded-full bg-white/10" />
        <div className="relative flex flex-wrap items-center gap-5">
          <div className="rounded-full border-2 border-white/50 p-1"><Avatar name={st.name} size={76} src={st.photo_url} /></div>
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-black">{st.name}</h1>
            <div className="mt-2 flex flex-wrap gap-2 text-sm">
              <span className="rounded-full bg-white/18 px-3 py-1" dir="ltr">{st.student_code}</span>
              {st.grade && <span className="rounded-full bg-white/18 px-3 py-1">{st.grade}</span>}
              <span className="rounded-full bg-white/18 px-3 py-1">{classNames(s)}</span>
            </div>
          </div>
          <Ring value={pct ?? 0} size={96} stroke={9} color="#fff" track="rgba(255,255,255,0.2)">
            <div className="text-center"><div className="text-xl font-black">{Fmt.pct(pct)}</div><div className="text-[10px] text-white/80">الحضور</div></div>
          </Ring>
        </div>
      </div>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="الغياب" value={s.stats?.absent_count ?? 0} icon={UserX} tone="danger" />
        <StatCard label="التأخير" value={s.stats?.late_count ?? 0} icon={Clock} tone="warning" />
        <StatCard label="متوسط الدرجات" value={Fmt.pct(s.stats?.avg_percent)} icon={GraduationCap} />
        <StatCard label="الاشتراك" value={!st.subscription_end ? "—" : s.stats?.is_overdue ? "منتهي" : "ساري"} icon={s.stats?.is_overdue ? AlertTriangle : ShieldCheck} tone={s.stats?.is_overdue ? "danger" : "success"} hint={st.subscription_end ? `حتى ${Fmt.date(st.subscription_end)}` : undefined} />
      </div>
      <Tabs value={tab} onChange={setTab} items={[
        { value: "attendance", label: "الحضور", icon: CalendarCheck },
        { value: "grades", label: "الدرجات", icon: BadgeCheck },
        { value: "subscription", label: "الاشتراك والمدفوعات", icon: CreditCard },
      ]} />
      {tab === "attendance" && <AttendanceTab id={st.id} />}
      {tab === "grades" && <GradesTab id={st.id} />}
      {tab === "subscription" && <PaymentsTab s={s} currency={currency} />}
    </>
  );
}

function AttendanceTab({ id }: { id: string }) {
  const state = useAsync(() => attendanceApi.history({ studentId: id, limit: 200 }), [id]);
  const today = Fmt.isoDate();
  return (
    <Async state={state} empty={(r) => r.length === 0} emptyMessage="لا يوجد سجل حضور بعد" emptyIcon={CalendarCheck}>
      {(rows) => {
        const todays = rows.filter((r) => r.date === today);
        return (
          <>
            {todays.length > 0 && (
              <Card className="mb-4 flex flex-wrap items-center gap-3 border-primary/40 bg-primary-soft/50">
                <CheckCircle2 className="size-6 text-primary" />
                <span className="font-extrabold">اليوم:</span>
                {todays.map((r) => <span key={r.id} className="flex items-center gap-2">{r.classes?.name} <Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge></span>)}
              </Card>
            )}
            <div className="grid gap-3 md:grid-cols-2">
              {rows.map((r) => (
                <Card key={r.id} className="flex items-center gap-4 !p-4">
                  <div className="grid size-12 shrink-0 place-items-center rounded-2xl text-center" style={{ background: `${TONE_HEX[STATUS_TONE[r.status]]}1a`, color: TONE_HEX[STATUS_TONE[r.status]] }}>
                    <div><div className="text-lg font-black leading-none">{parseDate(r.date).getDate()}</div><div className="text-[10px] font-bold">{Fmt.monthName(parseDate(r.date).getMonth() + 1)}</div></div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-extrabold">{r.classes?.name}</div>
                    <div className="text-sm text-muted">{Fmt.weekday(parseDate(r.date))}</div>
                    {r.note && <div className="text-sm text-warning">ملاحظة المدرس: {r.note}</div>}
                  </div>
                  <Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                </Card>
              ))}
            </div>
          </>
        );
      }}
    </Async>
  );
}

function GradesTab({ id }: { id: string }) {
  const state = useAsync(() => examApi.studentGrades(id), [id]);
  return (
    <Async state={state} empty={(r) => r.length === 0} emptyMessage="لا توجد درجات منشورة بعد" emptyIcon={BadgeCheck}>
      {(rows) => (
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map((g) => {
            const max = g.exams?.max_score ?? 0;
            const p = max ? (g.score / max) * 100 : 0;
            return (
              <Card key={g.id} className="flex items-center gap-4 !p-4">
                <Ring value={p} size={60} stroke={7} color={p >= 85 ? TONE_HEX.success : p >= 50 ? TONE_HEX.primary : TONE_HEX.danger}><span className="text-xs font-black">{Math.round(p)}%</span></Ring>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-extrabold">{g.exams?.title ?? "—"}</div>
                  <div className="text-sm text-muted">{g.exams?.exam_date ? Fmt.date(g.exams.exam_date) : Fmt.date(g.updated_at)}</div>
                  {g.remarks && <div className="text-sm text-info">ملاحظة: {g.remarks}</div>}
                </div>
                <div className="text-end"><div className="text-lg font-black">{Fmt.number(g.score)}</div><div className="text-xs text-muted">من {Fmt.number(max)}</div></div>
              </Card>
            );
          })}
        </div>
      )}
    </Async>
  );
}

function PaymentsTab({ s, currency }: { s: StudentSummary; currency: string }) {
  const state = useAsync(() => financeApi.payments({ studentId: s.student.id }), [s.student.id]);
  const end = s.student.subscription_end;
  const overdue = s.stats?.is_overdue;
  return (
    <>
      <Card className={cx("mb-4 flex items-center gap-4", overdue ? "border-danger/40 bg-danger/5" : "border-success/40 bg-success/5")}>
        {overdue ? <AlertTriangle className="size-9 text-danger" /> : <ShieldCheck className="size-9 text-success" />}
        <div>
          <div className="text-lg font-extrabold">{!end ? "لا يوجد اشتراك مسجل" : overdue ? `انتهى الاشتراك في ${Fmt.date(end)}` : `الاشتراك ساري حتى ${Fmt.date(end)}`}</div>
          {overdue && <div className="text-sm text-muted">يرجى التواصل مع الإدارة لتجديد الاشتراك</div>}
        </div>
      </Card>
      <Async state={state} empty={(r) => r.length === 0} emptyMessage="لا توجد مدفوعات مسجلة" emptyIcon={CreditCard}>
        {(rows) => (
          <div className="grid gap-3 md:grid-cols-2">
            {rows.map((p) => (
              <Card key={p.id} className="flex items-center gap-4 !p-4">
                <div className="grid size-12 place-items-center rounded-2xl bg-success/12 text-success"><CreditCard className="size-6" /></div>
                <div className="min-w-0 flex-1">
                  <div className="font-extrabold">{PAYMENT_KIND_LABEL[p.kind] ?? p.kind} • {PAYMENT_METHOD_LABEL[p.method] ?? p.method}</div>
                  <div className="text-sm text-muted">{Fmt.date(p.paid_at)}</div>
                </div>
                <div className="text-lg font-black text-success">{Fmt.money(p.amount, currency)}</div>
              </Card>
            ))}
          </div>
        )}
      </Async>
    </>
  );
}

function LinkModal({ onClose, onDone }: { onClose(): void; onDone(): void }) {
  const { run, toast } = useUi();
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const save = async () => {
    if (!code.trim()) return toast("أدخل كود الطالب", "error");
    if (phone.replace(/\D/g, "").length < 10) return toast("أدخل رقم الموبايل المسجل لدى المركز", "error");
    setBusy(true);
    const ok = await run(() => studentApi.claim(code, phone), "تم ربط الطالب");
    setBusy(false);
    if (ok) { onClose(); onDone(); }
  };
  return (
    <Modal open onClose={onClose} title="ربط طالب بحسابك" footer={<><Button variant="ghost" onClick={onClose}>إلغاء</Button><Button loading={busy} icon={Link2} onClick={save}>ربط</Button></>}>
      <div className="space-y-4">
        <Field label="كود الطالب"><Input icon={Hash} dir="ltr" className="text-start uppercase" value={code} onChange={(e) => setCode(e.target.value)} /></Field>
        <Field label="موبايل ولي الأمر المسجل لدى المركز"><Input icon={Phone} dir="ltr" className="text-start" value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
      </div>
    </Modal>
  );
}
