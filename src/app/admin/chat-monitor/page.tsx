"use client";

import { useState } from "react";
import { MessagesSquare, Search } from "lucide-react";
import { chatApi } from "@/lib/api";
import { useAsync } from "@/lib/hooks";
import { Fmt } from "@/lib/fmt";
import { ROLE_LABEL, type Role } from "@/lib/types";
import { Async, Avatar, Card, Input, PageHeader } from "@/components/ui";

export default function ChatMonitor() {
  const state = useAsync(() => chatApi.all(300), []);
  const [q, setQ] = useState("");
  return (
    <>
      <PageHeader title="مراقبة المحادثات" icon={MessagesSquare} subtitle="آخر الرسائل المتبادلة بين المستخدمين (للمدير فقط)" />
      <div className="mb-4 max-w-md"><Input icon={Search} placeholder="بحث في الرسائل أو الأسماء" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <Async state={state} empty={(l) => l.length === 0} emptyMessage="لا توجد رسائل" emptyIcon={MessagesSquare}>
        {(rows) => (
          <div className="space-y-2.5">
            {rows.filter((m) => !q.trim() || m.body.includes(q) || m.sender_name.includes(q) || m.recipient_name.includes(q)).map((m) => (
              <Card key={m.id} className="!p-4">
                <div className="flex items-center gap-3">
                  <Avatar name={m.sender_name} size={38} />
                  <div className="min-w-0 flex-1 text-sm">
                    <span className="font-extrabold">{m.sender_name}</span>
                    <span className="text-muted"> ({ROLE_LABEL[m.sender_role as Role] ?? m.sender_role}) ← </span>
                    <span className="font-bold">{m.recipient_name}</span>
                  </div>
                  <span className="text-xs text-muted">{Fmt.dateTime(m.created_at)}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap rounded-2xl bg-surface-2 p-3 text-sm leading-6">{m.body}</p>
              </Card>
            ))}
          </div>
        )}
      </Async>
    </>
  );
}
