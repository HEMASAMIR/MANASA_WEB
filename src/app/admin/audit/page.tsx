"use client";

import { History } from "lucide-react";
import { reportApi } from "@/lib/api";
import { useAsync } from "@/lib/hooks";
import { Fmt } from "@/lib/fmt";
import { Async, Badge, PageHeader, Table } from "@/components/ui";

const ENTITY: Record<string, string> = {
  students: "الطلاب", classes: "المجموعات", payments: "المدفوعات", user_profiles: "الحسابات", assistants: "المساعدون", app_settings: "الإعدادات", enrollments: "التسجيل في المجموعات",
};
const ACTION: Record<string, { l: string; t: "success" | "warning" | "danger" }> = {
  INSERT: { l: "إضافة", t: "success" }, UPDATE: { l: "تعديل", t: "warning" }, DELETE: { l: "حذف", t: "danger" },
};

export default function AuditPage() {
  const state = useAsync(() => reportApi.audit(300), []);
  return (
    <>
      <PageHeader title="سجل العمليات" icon={History} subtitle="كل تعديل على البيانات الحساسة يُسجل تلقائياً" />
      <Async state={state} empty={(l) => l.length === 0} emptyMessage="لا توجد عمليات مسجلة" emptyIcon={History}>
        {(rows) => (
          <Table head={["الوقت", "المستخدم", "العملية", "القسم", "المعرف"]}>
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-surface-2">
                <td className="whitespace-nowrap px-4 py-3 text-muted">{Fmt.dateTime(r.created_at)}</td>
                <td className="px-4 py-3 font-bold">{r.actor_name ?? "النظام"}</td>
                <td className="px-4 py-3"><Badge tone={ACTION[r.action]?.t ?? "neutral"}>{ACTION[r.action]?.l ?? r.action}</Badge></td>
                <td className="px-4 py-3">{ENTITY[r.entity] ?? r.entity}</td>
                <td className="px-4 py-3 font-mono text-xs text-muted" dir="ltr">{r.entity_id?.slice(0, 8) ?? "—"}</td>
              </tr>
            ))}
          </Table>
        )}
      </Async>
    </>
  );
}
