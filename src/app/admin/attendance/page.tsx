"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCheck, ClipboardCheck, History, QrCode, Save, Search, StickyNote } from "lucide-react";
import { attendanceApi, classApi } from "@/lib/api";
import { useAsync } from "@/lib/hooks";
import { Fmt, parseDate } from "@/lib/fmt";
import { STATUS_LABEL, STATUS_TONE, type AttendanceStatus, type Student } from "@/lib/types";
import { ClassSelect } from "@/components/shared";
import { Async, Avatar, Badge, Button, Card, EmptyState, Field, Input, LoadingBlock, PageHeader, StatCard, TONE_HEX, Table, Tabs, cx, useUi } from "@/components/ui";

const STATUSES: AttendanceStatus[] = ["present", "absent", "late", "excused"];

export default function AttendancePage() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <AttendanceInner />
    </Suspense>
  );
}

function AttendanceInner() {
  const params = useSearchParams();
  const classes = useAsync(() => classApi.list(), []);
  const [classId, setClassId] = useState<string | null>(params.get("class"));
  const [date, setDate] = useState(Fmt.isoDate());
  const [tab, setTab] = useState<"sheet" | "history">("sheet");

  useEffect(() => {
    if (!classId && classes.data?.length) setClassId(classes.data[0].id);
  }, [classes.data, classId]);

  return (
    <>
      <PageHeader
        title="تسجيل الحضور"
        icon={ClipboardCheck}
        subtitle="سجّل الحضور يدوياً أو اعرض رمز QR ليمسحه الطلاب"
        actions={classId && (
          <Link href={`/admin/attendance/qr/${classId}`} className="inline-flex h-11 items-center gap-2 rounded-2xl bg-brand px-5 font-bold text-white shadow-[0_8px_20px_-8px_rgba(13,148,136,0.8)]">
            <QrCode className="size-5" /> حضور بالـ QR
          </Link>
        )}
      />
      <Async state={classes} empty={(c) => c.length === 0} emptyMessage="لا توجد مجموعات بعد. أضف مجموعة أولاً من صفحة المجموعات.">
        {(list) => (
          <>
            <Card className="mb-5 grid gap-4 sm:grid-cols-2">
              <Field label="المجموعة"><ClassSelect classes={list} value={classId} onChange={setClassId} /></Field>
              <Field label="التاريخ"><Input type="date" value={date} max={Fmt.isoDate()} onChange={(e) => setDate(e.target.value)} /></Field>
            </Card>
            <Tabs value={tab} onChange={setTab} items={[{ value: "sheet", label: "كشف الحضور", icon: ClipboardCheck }, { value: "history", label: "السجل", icon: History }]} />
            {classId && (tab === "sheet" ? <Sheet key={`${classId}-${date}`} classId={classId} date={date} /> : <HistoryView classId={classId} />)}
          </>
        )}
      </Async>
    </>
  );
}

function Sheet({ classId, date }: { classId: string; date: string }) {
  const { run } = useUi();
  const state = useAsync(async () => {
    const [roster, records] = await Promise.all([classApi.roster(classId), attendanceApi.forClassDate(classId, date)]);
    return { roster, records };
  }, [classId, date]);
  const [marks, setMarks] = useState<Record<string, { status: AttendanceStatus | null; note: string }>>({});
  const [q, setQ] = useState("");
  const [saving, setSaving] = useState(false);
  const [noteFor, setNoteFor] = useState<string | null>(null);

  useEffect(() => {
    if (!state.data) return;
    const m: typeof marks = {};
    for (const s of state.data.roster) {
      const r = state.data.records.find((x) => x.student_id === s.id);
      m[s.id] = { status: r?.status ?? null, note: r?.note ?? "" };
    }
    setMarks(m);
  }, [state.data]);

  const counts = useMemo(() => {
    const c = { present: 0, absent: 0, late: 0, excused: 0, none: 0 };
    Object.values(marks).forEach((m) => (m.status ? c[m.status]++ : c.none++));
    return c;
  }, [marks]);

  const set = (id: string, status: AttendanceStatus) => setMarks((m) => ({ ...m, [id]: { ...m[id], status } }));
  const all = (status: AttendanceStatus) => setMarks((m) => Object.fromEntries(Object.entries(m).map(([k, v]) => [k, { ...v, status: v.status ?? status }])));

  const save = async () => {
    const rows = Object.entries(marks).filter(([, v]) => v.status).map(([student_id, v]) => ({ student_id, class_id: classId, date, status: v.status!, note: v.note }));
    if (!rows.length) return;
    setSaving(true);
    await run(() => attendanceApi.submit(rows), `تم حفظ حضور ${rows.length} طالب`);
    setSaving(false);
  };

  return (
    <Async state={state} empty={(d) => d.roster.length === 0} emptyMessage="لا يوجد طلاب نشطون في هذه المجموعة">
      {({ roster }) => {
        const shown = roster.filter((s) => !q.trim() || s.name.includes(q.trim()) || s.student_code.toLowerCase().includes(q.trim().toLowerCase()));
        return (
          <>
            <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-5">
              <StatCard label="حاضر" value={counts.present} icon={CheckCheck} tone="success" />
              <StatCard label="غائب" value={counts.absent} icon={ClipboardCheck} tone="danger" />
              <StatCard label="متأخر" value={counts.late} icon={ClipboardCheck} tone="warning" />
              <StatCard label="بعذر" value={counts.excused} icon={ClipboardCheck} tone="info" />
              <StatCard label="لم يُسجل" value={counts.none} icon={ClipboardCheck} tone="neutral" />
            </div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <div className="min-w-60 flex-1"><Input icon={Search} placeholder="بحث بالاسم أو الكود" value={q} onChange={(e) => setQ(e.target.value)} /></div>
              <Button variant="secondary" icon={CheckCheck} onClick={() => all("present")}>الباقي حاضر</Button>
              <Button variant="outline" onClick={() => all("absent")}>الباقي غائب</Button>
            </div>
            <div className="space-y-2.5">
              {shown.map((s: Student, i) => {
                const m = marks[s.id] ?? { status: null, note: "" };
                return (
                  <Card key={s.id} className="!p-3.5 animate-in" >
                    <div className="flex flex-wrap items-center gap-3" style={{ animationDelay: `${Math.min(i, 12) * 25}ms` }}>
                      <Avatar name={s.name} size={42} />
                      <div className="min-w-40 flex-1">
                        <div className="font-extrabold">{s.name}</div>
                        <div className="text-xs text-muted" dir="ltr" style={{ textAlign: "right" }}>{s.student_code}</div>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {STATUSES.map((st) => {
                          const on = m.status === st;
                          const c = TONE_HEX[STATUS_TONE[st]];
                          return (
                            <button key={st} onClick={() => set(s.id, st)}
                              className={cx("rounded-xl border px-3.5 py-2 text-sm font-bold transition cursor-pointer", on ? "text-white shadow" : "border-line bg-surface text-muted hover:text-ink")}
                              style={on ? { background: c, borderColor: c, boxShadow: `0 6px 14px -6px ${c}` } : undefined}>
                              {STATUS_LABEL[st]}
                            </button>
                          );
                        })}
                        <button onClick={() => setNoteFor(noteFor === s.id ? null : s.id)} title="ملاحظة"
                          className={cx("grid size-10 place-items-center rounded-xl border transition cursor-pointer", m.note ? "border-warning/50 bg-warning/10 text-warning" : "border-line text-muted hover:text-ink")}>
                          <StickyNote className="size-4" />
                        </button>
                      </div>
                    </div>
                    {noteFor === s.id && (
                      <Input className="mt-3" placeholder="ملاحظة تظهر لولي الأمر (اختياري)" value={m.note} onChange={(e) => setMarks((x) => ({ ...x, [s.id]: { ...m, note: e.target.value } }))} autoFocus />
                    )}
                  </Card>
                );
              })}
            </div>
            <div className="sticky bottom-24 z-10 mt-6 flex justify-center lg:bottom-6">
              <Button size="lg" icon={Save} loading={saving} onClick={save} disabled={counts.none === roster.length} className="shadow-2xl">
                حفظ الحضور ({roster.length - counts.none}/{roster.length})
              </Button>
            </div>
          </>
        );
      }}
    </Async>
  );
}

function HistoryView({ classId }: { classId: string }) {
  const [from, setFrom] = useState(() => Fmt.isoDate(new Date(Date.now() - 13 * 86400000)));
  const [to, setTo] = useState(Fmt.isoDate());
  const state = useAsync(() => attendanceApi.history({ classId, from, to, limit: 1000 }), [classId, from, to]);
  return (
    <>
      <Card className="mb-4 grid gap-4 sm:grid-cols-2">
        <Field label="من"><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
        <Field label="إلى"><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
      </Card>
      <Async state={state}>
        {(rows) => rows.length === 0 ? <EmptyState icon={History} message="لا يوجد سجل حضور في هذه الفترة" /> : (
          <Table head={["التاريخ", "الطالب", "الكود", "الحالة", "الطريقة", "ملاحظة"]}>
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-surface-2">
                <td className="whitespace-nowrap px-4 py-3">{Fmt.weekday(parseDate(r.date))} {Fmt.date(r.date)}</td>
                <td className="px-4 py-3 font-bold">{r.students?.name}</td>
                <td className="px-4 py-3 text-muted">{r.students?.student_code}</td>
                <td className="px-4 py-3"><Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge></td>
                <td className="px-4 py-3 text-muted">{r.method === "manual" ? "يدوي" : "QR"}</td>
                <td className="px-4 py-3 text-muted">{r.note ?? "—"}</td>
              </tr>
            ))}
          </Table>
        )}
      </Async>
    </>
  );
}
