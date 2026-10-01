"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, CreditCard, Download, TrendingUp, Wallet, Receipt } from "lucide-react";
import * as XLSX from "xlsx";
import { financeApi, studentApi } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useAsync } from "@/lib/hooks";
import { Fmt, parseDate, whatsappLink } from "@/lib/fmt";
import { PAYMENT_KIND_LABEL, PAYMENT_METHOD_LABEL } from "@/lib/types";
import { Async, Avatar, Badge, Button, Card, EmptyState, Field, Input, PageHeader, SectionTitle, StatCard, Table, Tabs } from "@/components/ui";

export default function FinancePage() {
  const { settings } = useAuth();
  const currency = settings?.currency ?? "ج.م";
  const [tab, setTab] = useState<"payments" | "overdue">("payments");
  const now = new Date();
  const [from, setFrom] = useState(Fmt.isoDate(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [to, setTo] = useState(Fmt.isoDate(now));

  const state = useAsync(async () => {
    const end = parseDate(to);
    end.setDate(end.getDate() + 1);
    const [payments, students] = await Promise.all([
      financeApi.payments({ from: new Date(from + "T00:00:00"), to: new Date(Fmt.isoDate(end) + "T00:00:00"), limit: 2000 }),
      studentApi.list(),
    ]);
    return { payments, overdue: students.filter((s) => s.stats?.is_overdue && s.student.status === "active") };
  }, [from, to]);

  const chart = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of state.data?.payments ?? []) {
      const d = Fmt.isoDate(new Date(p.paid_at));
      m.set(d, (m.get(d) ?? 0) + Number(p.amount));
    }
    return [...m.entries()].sort().map(([d, v]) => ({ d: d.slice(5), v }));
  }, [state.data]);

  return (
    <>
      <PageHeader title="المالية والاشتراكات" icon={CreditCard} subtitle="المدفوعات والإيرادات والمتأخرون في السداد" />
      <Card className="mb-5 grid gap-4 sm:grid-cols-2 lg:max-w-2xl">
        <Field label="من"><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
        <Field label="إلى"><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></Field>
      </Card>
      <Async state={state}>
        {({ payments, overdue }) => {
          const total = payments.reduce((a, p) => a + Number(p.amount), 0);
          const subs = payments.filter((p) => p.kind === "subscription").reduce((a, p) => a + Number(p.amount), 0);
          const exportXlsx = () => {
            const ws = XLSX.utils.json_to_sheet(payments.map((p) => ({
              "التاريخ": Fmt.dateTime(p.paid_at), "الطالب": p.students?.name ?? "", "الكود": p.students?.student_code ?? "", "النوع": PAYMENT_KIND_LABEL[p.kind] ?? p.kind,
              "الطريقة": PAYMENT_METHOD_LABEL[p.method] ?? p.method, "المبلغ": Number(p.amount), "المجموعة": p.classes?.name ?? "", "استلمها": p.user_profiles?.name ?? "",
            })));
            const wb = XLSX.utils.book_new();
            wb.Workbook = { Views: [{ RTL: true }] };
            XLSX.utils.book_append_sheet(wb, ws, "المدفوعات");
            XLSX.writeFile(wb, `payments-${from}-${to}.xlsx`);
          };
          return (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard label="إجمالي الفترة" value={Fmt.money(total, currency)} icon={Wallet} tone="success" />
                <StatCard label="اشتراكات" value={Fmt.money(subs, currency)} icon={TrendingUp} />
                <StatCard label="عدد العمليات" value={payments.length} icon={Receipt} tone="info" />
                <StatCard label="متأخرون في السداد" value={overdue.length} icon={AlertTriangle} tone="danger" />
              </div>
              {chart.length > 1 && (
                <>
                  <SectionTitle>الإيرادات اليومية</SectionTitle>
                  <Card className="h-72" padded>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chart} margin={{ left: 8, right: 8, top: 8 }}>
                        <defs><linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6D5DFC" stopOpacity={0.4} /><stop offset="100%" stopColor="#6D5DFC" stopOpacity={0} /></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis dataKey="d" tick={{ fill: "var(--muted)", fontSize: 12 }} axisLine={false} tickLine={false} reversed />
                        <YAxis tick={{ fill: "var(--muted)", fontSize: 12 }} axisLine={false} tickLine={false} orientation="right" width={60} />
                        <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14 }} formatter={(v) => [Fmt.money(Number(v), currency), "الإيراد"]} />
                        <Area type="monotone" dataKey="v" stroke="#6D5DFC" strokeWidth={3} fill="url(#rev)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Card>
                </>
              )}
              <div className="mt-7">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <Tabs value={tab} onChange={setTab} items={[{ value: "payments", label: "المدفوعات", count: payments.length }, { value: "overdue", label: "المتأخرون", count: overdue.length }]} />
                  {tab === "payments" && <Button variant="outline" icon={Download} onClick={exportXlsx} disabled={!payments.length}>تصدير Excel</Button>}
                </div>
                {tab === "payments" ? (payments.length === 0 ? <EmptyState icon={Receipt} message="لا توجد مدفوعات في هذه الفترة" /> : (
                  <Table head={["التاريخ", "الطالب", "النوع", "الطريقة", "المبلغ", "استلمها"]}>
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-surface-2">
                        <td className="whitespace-nowrap px-4 py-3 text-muted">{Fmt.dateTime(p.paid_at)}</td>
                        <td className="px-4 py-3"><Link href={`/admin/students/${p.student_id}`} className="font-bold hover:text-primary">{p.students?.name}</Link></td>
                        <td className="px-4 py-3"><Badge tone={p.kind === "subscription" ? "primary" : "info"} dot={false}>{PAYMENT_KIND_LABEL[p.kind] ?? p.kind}</Badge></td>
                        <td className="px-4 py-3 text-muted">{PAYMENT_METHOD_LABEL[p.method] ?? p.method}</td>
                        <td className="px-4 py-3 font-black text-success">{Fmt.money(p.amount, currency)}</td>
                        <td className="px-4 py-3 text-muted">{p.user_profiles?.name ?? "—"}</td>
                      </tr>
                    ))}
                  </Table>
                )) : (overdue.length === 0 ? <EmptyState message="لا يوجد متأخرون في السداد 👏" /> : (
                  <div className="grid gap-3 lg:grid-cols-2">
                    {overdue.map((s) => {
                      const wa = whatsappLink(s.student.parent_phone, `السلام عليكم، نذكركم بأن اشتراك ${s.student.name} انتهى بتاريخ ${Fmt.date(s.student.subscription_end)}. برجاء التجديد — ${settings?.center_name ?? ""}`, settings?.country_code);
                      return (
                        <Card key={s.student.id} className="flex items-center gap-3 !p-4">
                          <Link href={`/admin/students/${s.student.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                            <Avatar name={s.student.name} />
                            <div className="min-w-0">
                              <div className="truncate font-extrabold">{s.student.name}</div>
                              <div className="text-sm text-danger">انتهى {Fmt.date(s.student.subscription_end)}</div>
                            </div>
                          </Link>
                          {wa && <a href={wa} target="_blank" rel="noreferrer" className="rounded-xl bg-success/10 px-3 py-2 text-sm font-bold text-success">تذكير واتساب</a>}
                        </Card>
                      );
                    })}
                  </div>
                ))}
              </div>
            </>
          );
        }}
      </Async>
    </>
  );
}
