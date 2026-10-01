"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BadgeCheck, ChevronLeft, Clock, Plus, Repeat } from "lucide-react";
import { classApi, quizApi } from "@/lib/api";
import { useAsync } from "@/lib/hooks";
import { Fmt } from "@/lib/fmt";
import { ClassSelect } from "@/components/shared";
import { Async, Badge, Button, Card, EmptyState, Field, IconBadge, PageHeader, TONE_HEX } from "@/components/ui";
import { QuizSettingsModal } from "./settings-modal";

export default function QuizzesPage() {
  const router = useRouter();
  const classes = useAsync(() => classApi.list(), []);
  const [classId, setClassId] = useState<string | null>(null);
  const state = useAsync(() => quizApi.list(classId ?? undefined), [classId]);
  const [creating, setCreating] = useState(false);

  return (
    <>
      <PageHeader title="الكويزات التفاعلية" icon={BadgeCheck} subtitle="يحلها الطلاب من الموقع أو التطبيق وتُصحح تلقائياً" actions={<Button icon={Plus} onClick={() => setCreating(true)} disabled={!classes.data?.length}>كويز جديد</Button>} />
      <Card className="mb-5 max-w-md"><Field label="المجموعة"><ClassSelect classes={classes.data ?? []} value={classId} onChange={setClassId} allLabel="كل المجموعات" /></Field></Card>
      <Async state={state} empty={(l) => l.length === 0} emptyMessage="لا توجد كويزات بعد" emptyIcon={BadgeCheck}>
        {(list) => (
          <div className="grid gap-3 lg:grid-cols-2">
            {list.map((q) => {
              const published = !!q.exams?.is_published;
              const closed = q.available_until && new Date(q.available_until) < new Date();
              return (
                <Link key={q.id} href={`/admin/quizzes/${q.id}`} className="group flex items-center gap-4 rounded-3xl border border-line bg-surface p-4 shadow-soft transition hover:-translate-y-0.5 hover:border-primary/40 animate-in">
                  <IconBadge icon={BadgeCheck} color={published ? TONE_HEX.success : TONE_HEX.neutral} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-extrabold">{q.exams?.title}</div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-muted">
                      <Badge tone={published ? (closed ? "neutral" : "success") : "warning"}>{published ? (closed ? "مغلق" : "منشور") : "مسودة"}</Badge>
                      <span>{q.classes?.name}</span>
                      <span>• {q.exams?.question_count ?? 0} سؤال</span>
                      {q.duration_minutes && <span className="flex items-center gap-1">• <Clock className="size-3.5" />{q.duration_minutes} د</span>}
                      <span className="flex items-center gap-1">• <Repeat className="size-3.5" />{q.max_attempts} محاولة</span>
                      {q.available_until && <span>• يغلق {Fmt.dateTime(q.available_until)}</span>}
                    </div>
                  </div>
                  <ChevronLeft className="size-5 text-muted transition group-hover:-translate-x-1" />
                </Link>
              );
            })}
          </div>
        )}
      </Async>
      {creating && classes.data && (
        <QuizSettingsModal classes={classes.data} defaultClass={classId} onClose={() => setCreating(false)} onSaved={(id) => router.push(`/admin/quizzes/${id}`)} />
      )}
      {!classes.data?.length && !classes.loading && <EmptyState message="أضف مجموعة أولاً لتتمكن من إنشاء كويز" />}
    </>
  );
}
