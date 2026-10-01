"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, Pie, PieChart, Cell } from "recharts";
import { CheckCircle2, Clock, Download, FileBarChart, FileSpreadsheet, Printer, UserX } from "lucide-react";
import * as XLSX from "xlsx";
import { attendanceApi, classApi, reportApi } from "@/lib/api";
import { useAsync } from "@/lib/hooks";
import { Fmt, parseDate } from "@/lib/fmt";
import { STATUS_LABEL, type AttendanceStatus } from "@/lib/types";
import { ClassSelect } from "@/components/shared";
import { Async, Button, Card, Field, Input, PageHeader, SectionTitle, Select, StatCard, useUi } from "@/components/ui";

const tooltipStyle = { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, color: "var(--ink)" };

export default function ReportsPage() {
  const { run } = useUi();
  const classes = useAsync(() => classApi.list(), []);
  const [classId, setClassId] = useState<string | null>(null);
  const [days, setDays] = useState(14);
  const trend = useAsync(() => reportApi.trend(classId ?? undefined, days), [classId, days]);
  const [from, setFrom] = useState(() => Fmt.isoDate(new Date(Date.now() - 29 * 86400000)));
  const [to, setTo] = useState(Fmt.isoDate());
  const [busy, setBusy] = useState(false);

  const exportAttendance = async () => {
    setBusy(true);
    await run(async () => {
      const rows = await attendanceApi.rows({ classId: classId ?? undefined, from, to });
      const detail = rows.map((r) => {
        const s = r.students as { name: string; student_code: string; parent_phone: string } | null;
        const c = r.classes as { name: string } | null;
        return { "التاريخ": r.date as string, "اليوم": Fmt.weekday(parseDate(r.date as string)), "المجموعة": c?.name ?? "", "الطالب": s?.name ?? "", "الكود": s?.student_code ?? "", "الحالة": STATUS_LABEL[r.status as AttendanceStatus] ?? r.status, "ملاحظة": (r.note as string) ?? "", "موبايل ولي الأمر": s?.parent_phone ?? "" };
      });
      // Per-student summary
      const per = new Map<string, { name: string; code: string; present: number; absent: number; late: number; excused: number }>();
      for (const r of rows) {
        const s = r.students as { name: string; student_code: string } | null;
        const k = r.student_id as string;
        const e = per.get(k) ?? { name: s?.name ?? "", code: s?.student_code ?? "", present: 0, absent: 0, late: 0, excused: 0 };
        e[r.status as AttendanceStatus]++;
        per.set(k, e);
      }
      const summary = [...per.values()].map((e) => {
        const total = e.present + e.absent + e.late;
        return { "الطالب": e.name, "الكود": e.code, "حاضر": e.present, "غائب": e.absent, "متأخر": e.late, "بعذر": e.excused, "نسبة الحضور %": total ? Math.round(((e.present + e.late) / total) * 100) : "" };
      }).sort((a, b) => a["الطالب"].localeCompare(b["الطالب"], "ar"));
      const wb = XLSX.utils.book_new();
      wb.Workbook = { Views: [{ RTL: true }, { RTL: true }] };
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary), "ملخص الطلاب");
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(detail), "التفاصيل");
      XLSX.writeFile(wb, `attendance-${from}-${to}.xlsx`);
    }, "تم تصدير التقرير");
    setBusy(false);
  };

  return (
    <>
      <PageHeader title="التقارير والتحليلات" icon={FileBarChart} subtitle="اتجاهات الحضور وتصدير التقارير" actions={<Button variant="outline" icon={Printer} onClick={() => window.print()}>طباعة</Button>} />
      <Card className="mb-6 grid gap-4 sm:grid-cols-2 lg:max-w-2xl">
        <Field label="المجموعة"><ClassSelect classes={classes.data ?? []} value={classId} onChange={setClassId} allLabel="كل المجموعات" /></Field>
        <Field label="الفترة"><Select value={days} onChange={(e) => setDays(Number(e.target.value))}>{[7, 14, 30, 60].map((d) => <option key={d} value={d}>آخر {d} يوم</option>)}</Select></Field>
      </Card>
      <Async state={trend}>
        {(data) => {
          const tot = data.reduce((a, d) => ({ p: a.p + d.present, ab: a.ab + d.absent, l: a.l + d.late }), { p: 0, ab: 0, l: 0 });
          const all = tot.p + tot.ab + tot.l;
          const rate = all ? Math.round(((tot.p + tot.l) / all) * 100) : 0;
          const chart = data.map((d) => ({ ...d, label: `${parseDate(d.date).getDate()}/${parseDate(d.date).getMonth() + 1}` }));
          const pie = [{ n: "حاضر", v: tot.p, c: "#10B981" }, { n: "متأخر", v: tot.l, c: "#F59E0B" }, { n: "غائب", v: tot.ab, c: "#EF4461" }].filter((x) => x.v > 0);
          return (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="نسبة الحضور" value={`${rate}%`} icon={CheckCircle2} tone="success" />
                <StatCard label="حضور" value={tot.p} icon={CheckCircle2} tone="primary" />
                <StatCard label="تأخير" value={tot.l} icon={Clock} tone="warning" />
                <StatCard label="غياب" value={tot.ab} icon={UserX} tone="danger" />
              </div>
              <div className="mt-6 grid gap-6 xl:grid-cols-[2fr_1fr]">
                <Card className="h-96">
                  <h3 className="mb-3 font-extrabold">الحضور اليومي</h3>
                  <ResponsiveContainer width="100%" height="88%">
                    <BarChart data={chart} margin={{ left: 0, right: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="label" reversed tick={{ fill: "var(--muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis orientation="right" allowDecimals={false} tick={{ fill: "var(--muted)", fontSize: 12 }} axisLine={false} tickLine={false} width={36} />
                      <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--surface-3)" }} />
                      <Legend wrapperStyle={{ fontSize: 13 }} />
                      <Bar dataKey="present" name="حاضر" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="late" name="متأخر" stackId="a" fill="#F59E0B" />
                      <Bar dataKey="absent" name="غائب" stackId="a" fill="#EF4461" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
                <Card className="h-96">
                  <h3 className="mb-3 font-extrabold">التوزيع</h3>
                  {pie.length === 0 ? <p className="py-20 text-center text-muted">لا توجد بيانات</p> : (
                    <ResponsiveContainer width="100%" height="88%">
                      <PieChart>
                        <Pie data={pie} dataKey="v" nameKey="n" innerRadius="55%" outerRadius="85%" paddingAngle={3} stroke="none">
                          {pie.map((p) => <Cell key={p.n} fill={p.c} />)}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} />
                        <Legend wrapperStyle={{ fontSize: 13 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </Card>
              </div>
            </>
          );
        }}
      </Async>

      <SectionTitle>تصدير تقرير الحضور</SectionTitle>
      <Card className="grid items-end gap-4 sm:grid-cols-[1fr_1fr_auto] lg:max-w-3xl">
        <Field label="من"><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
        <Field label="إلى"><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
        <Button icon={busy ? undefined : FileSpreadsheet} loading={busy} onClick={exportAttendance}>تصدير Excel</Button>
      </Card>
      <p className="mt-2 flex items-center gap-1.5 text-sm text-muted"><Download className="size-4" /> يحتوي الملف على ملخص لكل طالب + كل السجلات التفصيلية</p>
    </>
  );
}
