"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { ChevronLeft, Download, FileSpreadsheet, GraduationCap, Search, Upload, UserPlus, UserSearch } from "lucide-react";
import { classApi, classNames, studentApi } from "@/lib/api";
import { useAuth, useStaffPerms } from "@/lib/auth";
import { useAsync } from "@/lib/hooks";
import type { ClassRow, StudentSummary } from "@/lib/types";
import { ClassSelect } from "@/components/shared";
import { Async, Avatar, Badge, Button, Card, Chips, EmptyState, Field, Input, Modal, PageHeader, cx, useUi } from "@/components/ui";

type Filter = "all" | "overdue" | "absences" | "inactive";

export default function StudentsPage() {
  const perms = useStaffPerms();
  const { settings } = useAuth();
  const threshold = settings?.absence_warning_count ?? 2;
  const state = useAsync(async () => {
    const [students, classes] = await Promise.all([studentApi.list(), classApi.list()]);
    return { students, classes };
  }, []);
  const [q, setQ] = useState("");
  const [classId, setClassId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [adding, setAdding] = useState(false);
  const [importing, setImporting] = useState(false);

  const match = (s: StudentSummary) => {
    const t = q.trim().toLowerCase();
    if (t && !(s.student.name.toLowerCase().includes(t) || s.student.student_code.toLowerCase().includes(t) || s.student.parent_phone.includes(t))) return false;
    if (classId && !s.classes.some((c) => c.id === classId)) return false;
    if (filter === "overdue") return !!s.stats?.is_overdue;
    if (filter === "absences") return (s.stats?.absent_count ?? 0) >= threshold;
    if (filter === "inactive") return s.student.status !== "active";
    return true;
  };

  const exportExcel = (rows: StudentSummary[]) => {
    const data = rows.map((s) => ({
      "الكود": s.student.student_code, "الاسم": s.student.name, "الصف": s.student.grade, "المجموعات": classNames(s),
      "ولي الأمر": s.student.parent_name ?? "", "موبايل ولي الأمر": s.student.parent_phone, "موبايل الطالب": s.student.student_phone ?? "",
      "نسبة الحضور": s.stats?.attendance_pct ?? "", "الغياب": s.stats?.absent_count ?? 0, "المتوسط": s.stats?.avg_percent ?? "",
      "نهاية الاشتراك": s.student.subscription_end ?? "", "الحالة": s.student.status,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = Object.keys(data[0] ?? {}).map(() => ({ wch: 18 }));
    const wb = XLSX.utils.book_new();
    wb.Workbook = { Views: [{ RTL: true }] };
    XLSX.utils.book_append_sheet(wb, ws, "الطلاب");
    XLSX.writeFile(wb, `students-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <Async state={state}>
      {({ students, classes }) => {
        const shown = students.filter(match);
        return (
          <>
            <PageHeader
              title="الطلاب"
              icon={GraduationCap}
              subtitle={`${students.length} طالب مسجل`}
              actions={
                <>
                  <Button variant="outline" icon={Download} onClick={() => exportExcel(shown)} disabled={!shown.length}>تصدير Excel</Button>
                  {perms.canManage && <Button variant="outline" icon={Upload} onClick={() => setImporting(true)}>استيراد</Button>}
                  {perms.canManage && <Button icon={UserPlus} onClick={() => setAdding(true)}>إضافة طالب</Button>}
                </>
              }
            />
            <Card className="mb-5 space-y-4">
              <div className="grid gap-3 md:grid-cols-[1fr_280px]">
                <Input icon={Search} placeholder="ابحث بالاسم أو الكود أو رقم ولي الأمر" value={q} onChange={(e) => setQ(e.target.value)} />
                <ClassSelect classes={classes} value={classId} onChange={setClassId} allLabel="كل المجموعات" />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Chips value={filter} onChange={setFilter} items={[
                  { value: "all", label: "الكل" }, { value: "overdue", label: "متأخرون في السداد" },
                  { value: "absences", label: "غياب متكرر" }, { value: "inactive", label: "موقوفون" },
                ]} />
                <span className="text-sm font-bold text-muted">{shown.length} طالب</span>
              </div>
            </Card>
            {shown.length === 0 ? <EmptyState icon={UserSearch} message="لا يوجد طلاب مطابقون" /> : (
              <div className="grid gap-3 lg:grid-cols-2">
                {shown.map((s, i) => <StudentTile key={s.student.id} s={s} i={i} />)}
              </div>
            )}
            <AddStudentModal open={adding} onClose={() => setAdding(false)} classes={classes} onDone={state.reload} />
            <ImportModal open={importing} onClose={() => setImporting(false)} classes={classes} onDone={state.reload} />
          </>
        );
      }}
    </Async>
  );
}

function StudentTile({ s, i }: { s: StudentSummary; i: number }) {
  const pct = s.stats?.attendance_pct;
  const low = pct != null && pct < 75;
  return (
    <Link href={`/admin/students/${s.student.id}`} className="group flex items-center gap-4 rounded-3xl border border-line bg-surface p-4 shadow-soft transition hover:-translate-y-0.5 hover:border-primary/40 animate-in" style={{ animationDelay: `${Math.min(i, 12) * 25}ms` }}>
      <Avatar name={s.student.name} size={50} src={s.student.photo_url} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15.5px] font-extrabold">{s.student.name}</div>
        <div className="truncate text-sm text-muted"><span dir="ltr">{s.student.student_code}</span> • {classNames(s)}</div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {s.student.status !== "active" && <Badge tone="neutral">{s.student.status === "suspended" ? "موقوف" : "مؤرشف"}</Badge>}
          {s.stats?.is_overdue && <Badge tone="danger">اشتراك منتهي</Badge>}
          {pct != null && <Badge tone={low ? "danger" : "success"}>حضور {Math.round(pct)}%</Badge>}
          {(s.stats?.absent_count ?? 0) > 0 && <Badge tone="warning">غياب {s.stats!.absent_count}</Badge>}
          {s.stats?.avg_percent != null && <Badge tone="primary">متوسط {Math.round(s.stats.avg_percent)}%</Badge>}
          {!s.student.user_id && <Badge tone="neutral" dot={false}>بدون حساب طالب</Badge>}
        </div>
      </div>
      <ChevronLeft className="size-5 text-muted transition group-hover:-translate-x-1 group-hover:text-primary" />
    </Link>
  );
}

function AddStudentModal({ open, onClose, classes, onDone }: { open: boolean; onClose(): void; classes: ClassRow[]; onDone(): void }) {
  const { run, toast } = useUi();
  const empty = { name: "", code: "", grade: "", parent_name: "", parent_phone: "", student_phone: "" };
  const [f, setF] = useState(empty);
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const save = async () => {
    if (f.name.trim().length < 2) return toast("الاسم مطلوب", "error");
    if (f.parent_phone.replace(/\D/g, "").length < 10) return toast("رقم ولي الأمر غير صحيح", "error");
    setBusy(true);
    const id = await run(() => studentApi.create({ ...f, class_ids: picked }), "تمت إضافة الطالب");
    setBusy(false);
    if (id) {
      setF(empty);
      setPicked([]);
      onClose();
      onDone();
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="إضافة طالب" wide footer={<><Button variant="ghost" onClick={onClose}>إلغاء</Button><Button loading={busy} onClick={save}>حفظ</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="اسم الطالب *"><Input value={f.name} onChange={set("name")} /></Field>
        <Field label="كود الطالب" hint="اتركه فارغاً ليتم توليده تلقائياً"><Input value={f.code} onChange={set("code")} dir="ltr" className="text-start uppercase" /></Field>
        <Field label="الصف الدراسي"><Input value={f.grade} onChange={set("grade")} /></Field>
        <Field label="اسم ولي الأمر"><Input value={f.parent_name} onChange={set("parent_name")} /></Field>
        <Field label="موبايل ولي الأمر *"><Input value={f.parent_phone} onChange={set("parent_phone")} dir="ltr" className="text-start" /></Field>
        <Field label="موبايل الطالب"><Input value={f.student_phone} onChange={set("student_phone")} dir="ltr" className="text-start" /></Field>
      </div>
      {classes.length > 0 && (
        <div className="mt-5">
          <div className="mb-2 text-[13px] font-bold">المجموعات</div>
          <div className="flex flex-wrap gap-2">
            {classes.map((c) => {
              const on = picked.includes(c.id);
              return (
                <button key={c.id} type="button" onClick={() => setPicked(on ? picked.filter((x) => x !== c.id) : [...picked, c.id])}
                  className={cx("rounded-full border px-3.5 py-1.5 text-sm font-bold transition cursor-pointer", on ? "border-primary bg-primary-soft text-primary" : "border-line text-muted")}>
                  {on ? "✓ " : ""}{c.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </Modal>
  );
}

const HEADERS: Record<string, string[]> = {
  name: ["الاسم", "اسم الطالب", "name"],
  code: ["الكود", "كود الطالب", "code"],
  grade: ["الصف", "الصف الدراسي", "grade"],
  parent_name: ["ولي الأمر", "اسم ولي الأمر", "parent_name"],
  parent_phone: ["موبايل ولي الأمر", "رقم ولي الأمر", "parent_phone"],
  student_phone: ["موبايل الطالب", "رقم الطالب", "student_phone"],
};

function ImportModal({ open, onClose, classes, onDone }: { open: boolean; onClose(): void; classes: ClassRow[]; onDone(): void }) {
  const { run } = useUi();
  const fileRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [classId, setClassId] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [result, setResult] = useState<{ created: number; failed: { index: number; message: string }[] } | null>(null);

  const valid = useMemo(() => rows.filter((r) => r.name && r.parent_phone), [rows]);

  const onFile = async (file: File) => {
    const wb = XLSX.read(await file.arrayBuffer());
    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[wb.SheetNames[0]], { defval: "" });
    setResult(null);
    setRows(json.map((r) => {
      const out: Record<string, string> = {};
      for (const [k, names] of Object.entries(HEADERS)) {
        const key = Object.keys(r).find((h) => names.includes(String(h).trim()));
        out[k] = key ? String(r[key]).trim() : "";
      }
      return out;
    }));
  };

  const template = () => {
    const ws = XLSX.utils.aoa_to_sheet([["الاسم", "الكود", "الصف", "ولي الأمر", "موبايل ولي الأمر", "موبايل الطالب"], ["أحمد محمد", "", "الثالث الثانوي", "محمد علي", "01000000000", ""]]);
    const wb = XLSX.utils.book_new();
    wb.Workbook = { Views: [{ RTL: true }] };
    XLSX.utils.book_append_sheet(wb, ws, "الطلاب");
    XLSX.writeFile(wb, "students-template.xlsx");
  };

  const submit = async () => {
    const res = await run(() => studentApi.importRows(
      valid.map((r) => ({ ...r, class_ids: classId ? [classId] : [] })),
      (d, t) => setProgress(`${d} / ${t}`),
    ));
    setProgress(null);
    if (res) {
      setResult(res);
      onDone();
    }
  };

  return (
    <Modal open={open} onClose={() => { onClose(); setRows([]); setResult(null); }} title="استيراد طلاب من Excel" wide
      footer={<><Button variant="ghost" onClick={onClose}>إغلاق</Button>{!result && <Button icon={Upload} disabled={!valid.length} loading={!!progress} onClick={submit}>{progress ? `جاري الاستيراد ${progress}` : `استيراد ${valid.length} طالب`}</Button>}</>}>
      {result ? (
        <div className="space-y-3">
          <div className="rounded-2xl bg-success/10 p-4 font-bold text-success">تمت إضافة {result.created} طالب بنجاح</div>
          {result.failed.length > 0 && (
            <div className="rounded-2xl bg-danger/10 p-4 text-sm">
              <div className="mb-2 font-bold text-danger">{result.failed.length} صف لم يُضف:</div>
              <ul className="space-y-1">{result.failed.map((f) => <li key={f.index}>• {valid[f.index]?.name ?? `صف ${f.index + 1}`}: {f.message}</li>)}</ul>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-primary/40 bg-primary-soft/40 p-5">
            <FileSpreadsheet className="size-10 text-primary" />
            <div className="flex-1 text-sm">
              <div className="font-bold">اختر ملف Excel يحتوي الأعمدة:</div>
              <div className="text-muted">الاسم، الكود (اختياري)، الصف، ولي الأمر، موبايل ولي الأمر، موبايل الطالب</div>
            </div>
            <Button variant="outline" size="sm" icon={Download} onClick={template}>تحميل نموذج</Button>
            <Button size="sm" icon={Upload} onClick={() => fileRef.current?.click()}>اختيار ملف</Button>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" hidden onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
          </div>
          <Field label="تسجيلهم في مجموعة (اختياري)"><ClassSelect classes={classes} value={classId} onChange={setClassId} allLabel="بدون مجموعة" /></Field>
          {rows.length > 0 && (
            <div className="rounded-2xl border border-line p-4 text-sm">
              <div className="font-bold">{valid.length} صف صالح من {rows.length}</div>
              {rows.length !== valid.length && <div className="text-danger">الصفوف بدون اسم أو موبايل ولي الأمر سيتم تجاهلها</div>}
              <div className="mt-3 max-h-56 overflow-y-auto">
                {valid.slice(0, 50).map((r, i) => <div key={i} className="border-b border-line py-1.5 last:border-0">{r.name} — <span dir="ltr">{r.parent_phone}</span></div>)}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
