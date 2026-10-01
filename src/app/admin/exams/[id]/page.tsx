"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Award, Download, ListChecks, Save, Search, TrendingDown, TrendingUp, Users } from "lucide-react";
import * as XLSX from "xlsx";
import { classApi, examApi } from "@/lib/api";
import { useAsync } from "@/lib/hooks";
import { Fmt } from "@/lib/fmt";
import { EXAM_KIND_LABEL } from "@/lib/types";
import { Async, Avatar, Button, Card, Input, PageHeader, StatCard, cx, useUi } from "@/components/ui";

export default function GradeEntry() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { run, toast } = useUi();
  const state = useAsync(async () => {
    const exam = await examApi.get(id);
    const [roster, grades] = await Promise.all([classApi.roster(exam.class_id), examApi.grades(id)]);
    return { exam, roster, grades };
  }, [id]);
  const [values, setValues] = useState<Record<string, { score: string; remarks: string }>>({});
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!state.data) return;
    const v: typeof values = {};
    for (const s of state.data.roster) {
      const g = state.data.grades.find((x) => x.student_id === s.id);
      v[s.id] = { score: g ? String(g.score) : "", remarks: g?.remarks ?? "" };
    }
    setValues(v);
  }, [state.data]);

  const stats = useMemo(() => {
    const max = state.data?.exam.max_score ?? 1;
    const nums = Object.values(values).map((v) => v.score).filter((s) => s !== "").map(Number).filter((n) => !Number.isNaN(n));
    if (!nums.length) return null;
    const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
    return { count: nums.length, avg, avgPct: (avg / max) * 100, top: Math.max(...nums), low: Math.min(...nums), pass: nums.filter((n) => n / max >= 0.5).length };
  }, [values, state.data]);

  const save = async () => {
    const max = state.data!.exam.max_score;
    const rows = Object.entries(values).filter(([, v]) => v.score !== "").map(([student_id, v]) => ({ student_id, score: Number(v.score), remarks: v.remarks }));
    const bad = rows.find((r) => Number.isNaN(r.score) || r.score < 0 || r.score > max);
    if (bad) return toast(`الدرجة يجب أن تكون بين 0 و ${Fmt.number(max)}`, "error");
    setBusy(true);
    await run(() => examApi.saveGrades(id, rows), `تم حفظ ${rows.length} درجة وإشعار أولياء الأمور`);
    setBusy(false);
  };

  return (
    <Async state={state}>
      {({ exam, roster }) => {
        const shown = roster.filter((s) => !q.trim() || s.name.includes(q.trim()));
        const exportXlsx = () => {
          const ws = XLSX.utils.json_to_sheet(roster.map((s) => ({ "الكود": s.student_code, "الاسم": s.name, "الدرجة": values[s.id]?.score ?? "", "من": exam.max_score, "ملاحظات": values[s.id]?.remarks ?? "" })));
          const wb = XLSX.utils.book_new();
          wb.Workbook = { Views: [{ RTL: true }] };
          XLSX.utils.book_append_sheet(wb, ws, "الدرجات");
          XLSX.writeFile(wb, `${exam.title}.xlsx`);
        };
        return (
          <>
            <button onClick={() => router.push("/admin/exams")} className="mb-4 flex items-center gap-1.5 text-sm font-bold text-muted hover:text-primary cursor-pointer"><ArrowRight className="size-4" /> كل الامتحانات</button>
            <PageHeader title={exam.title} icon={ListChecks} subtitle={`${EXAM_KIND_LABEL[exam.kind]} • ${exam.classes?.name ?? ""} • الدرجة النهائية ${Fmt.number(exam.max_score)}${exam.exam_date ? ` • ${Fmt.date(exam.exam_date)}` : ""}`}
              actions={<><Button variant="outline" icon={Download} onClick={exportXlsx}>تصدير</Button><Button icon={Save} loading={busy} onClick={save}>حفظ الدرجات</Button></>} />
            <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard label="تم رصدهم" value={`${stats?.count ?? 0} / ${roster.length}`} icon={Users} />
              <StatCard label="المتوسط" value={stats ? `${Fmt.number(Math.round(stats.avg * 10) / 10)} (${Math.round(stats.avgPct)}%)` : "—"} icon={Award} tone="info" />
              <StatCard label="أعلى درجة" value={stats ? Fmt.number(stats.top) : "—"} icon={TrendingUp} tone="success" />
              <StatCard label="الناجحون" value={stats ? `${stats.pass}` : "—"} icon={TrendingDown} tone="warning" hint={stats ? `أقل درجة ${Fmt.number(stats.low)}` : undefined} />
            </div>
            <div className="mb-4"><Input icon={Search} placeholder="بحث بالاسم" value={q} onChange={(e) => setQ(e.target.value)} /></div>
            <div className="space-y-2">
              {shown.map((s) => {
                const v = values[s.id] ?? { score: "", remarks: "" };
                const n = Number(v.score);
                const pct = v.score === "" || Number.isNaN(n) ? null : (n / exam.max_score) * 100;
                const invalid = v.score !== "" && (Number.isNaN(n) || n < 0 || n > exam.max_score);
                return (
                  <Card key={s.id} className="grid items-center gap-3 !p-3 sm:grid-cols-[1fr_140px_1fr]">
                    <div className="flex items-center gap-3">
                      <Avatar name={s.name} size={40} />
                      <div className="min-w-0">
                        <div className="truncate font-bold">{s.name}</div>
                        <div className="text-xs text-muted" dir="ltr" style={{ textAlign: "right" }}>{s.student_code}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input type="number" inputMode="decimal" min={0} max={exam.max_score} step="0.25" value={v.score} placeholder="—"
                        onChange={(e) => setValues({ ...values, [s.id]: { ...v, score: e.target.value } })}
                        className={cx("text-center text-lg font-black", invalid && "!border-danger")} />
                      {pct !== null && !invalid && <span className={cx("w-12 text-sm font-black", pct >= 85 ? "text-success" : pct >= 50 ? "text-primary" : "text-danger")}>{Math.round(pct)}%</span>}
                    </div>
                    <Input placeholder="ملاحظة (اختياري)" value={v.remarks} onChange={(e) => setValues({ ...values, [s.id]: { ...v, remarks: e.target.value } })} />
                  </Card>
                );
              })}
            </div>
            <div className="sticky bottom-24 z-10 mt-6 flex justify-center lg:bottom-6">
              <Button size="lg" icon={Save} loading={busy} onClick={save} className="shadow-2xl">حفظ الدرجات</Button>
            </div>
          </>
        );
      }}
    </Async>
  );
}
