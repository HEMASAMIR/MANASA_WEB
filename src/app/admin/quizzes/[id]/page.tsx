"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, BadgeCheck, CheckCircle2, Edit3, Eye, EyeOff, ListOrdered, Plus, Settings, Trash2, Users, X } from "lucide-react";
import { quizApi } from "@/lib/api";
import { useAsync } from "@/lib/hooks";
import { Fmt } from "@/lib/fmt";
import type { QuizQuestion } from "@/lib/types";
import { Async, Badge, Button, Card, EmptyState, Field, Input, Modal, PageHeader, Table, Tabs, Textarea, cx, useUi } from "@/components/ui";
import { QuizSettingsModal } from "../settings-modal";

export default function QuizEditor() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { run, confirm, toast } = useUi();
  const state = useAsync(async () => {
    const [quiz, questions] = await Promise.all([quizApi.get(id), quizApi.questions(id)]);
    return { quiz, questions };
  }, [id]);
  const [tab, setTab] = useState<"questions" | "results">("questions");
  const [editQ, setEditQ] = useState<QuizQuestion | "new" | null>(null);
  const [settings, setSettings] = useState(false);

  return (
    <Async state={state}>
      {({ quiz, questions }) => {
        const published = !!quiz.exams?.is_published;
        const total = questions.reduce((a, q) => a + Number(q.points), 0);
        const publish = async () => {
          const n = await run(() => quizApi.publish(quiz.id, !published));
          if (n !== undefined) {
            toast(published ? "تم إخفاء الكويز" : n > 0 ? `تم النشر وإشعار ${n} حساب` : "تم نشر الكويز");
            state.reload();
          }
        };
        const remove = async () => {
          if (!(await confirm({ title: "حذف الكويز", message: "سيتم حذف الكويز وكل محاولات الطلاب ودرجاتهم فيه.", confirmLabel: "حذف", danger: true }))) return;
          if (await run(() => quizApi.remove(quiz), "تم حذف الكويز") !== undefined) router.replace("/admin/quizzes");
        };
        return (
          <>
            <button onClick={() => router.push("/admin/quizzes")} className="mb-4 flex items-center gap-1.5 text-sm font-bold text-muted hover:text-primary cursor-pointer"><ArrowRight className="size-4" /> كل الكويزات</button>
            <PageHeader title={quiz.exams?.title ?? "كويز"} icon={BadgeCheck}
              subtitle={<span className="flex flex-wrap items-center gap-2">
                <Badge tone={published ? "success" : "warning"}>{published ? "منشور" : "مسودة"}</Badge>
                {quiz.classes?.name} • {questions.length} سؤال • {Fmt.number(total)} درجة
                {quiz.duration_minutes ? ` • ${quiz.duration_minutes} دقيقة` : ""} • {quiz.max_attempts} محاولة
              </span>}
              actions={<>
                <Button variant="outline" icon={Settings} onClick={() => setSettings(true)}>الإعدادات</Button>
                <Button variant={published ? "outline" : "success"} icon={published ? EyeOff : Eye} onClick={publish}>{published ? "إخفاء" : "نشر للطلاب"}</Button>
                <Button variant="ghost" icon={Trash2} onClick={remove} className="text-danger" />
              </>} />
            <Tabs value={tab} onChange={setTab} items={[{ value: "questions", label: "الأسئلة", icon: ListOrdered, count: questions.length }, { value: "results", label: "النتائج", icon: Users }]} />
            {tab === "questions" ? (
              <>
                {questions.length === 0 ? <EmptyState icon={ListOrdered} message="لا توجد أسئلة بعد" action={<Button icon={Plus} onClick={() => setEditQ("new")}>أضف أول سؤال</Button>} /> : (
                  <div className="space-y-3">
                    {questions.map((q, i) => (
                      <Card key={q.id} className="!p-5">
                        <div className="flex items-start gap-3">
                          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand font-black text-white">{i + 1}</span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="flex-1 whitespace-pre-wrap font-bold leading-7">{q.body}</p>
                              <Badge tone="info" dot={false}>{q.kind === "tf" ? "صح / خطأ" : "اختيار من متعدد"}</Badge>
                              <Badge tone="primary" dot={false}>{Fmt.number(q.points)} درجة</Badge>
                            </div>
                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                              {q.options.map((o, j) => (
                                <div key={j} className={cx("flex items-center gap-2 rounded-xl border px-3 py-2 text-sm", j === q.correct_index ? "border-success/50 bg-success/10 font-bold text-success" : "border-line")}>
                                  {j === q.correct_index ? <CheckCircle2 className="size-4" /> : <span className="size-4 rounded-full border-2 border-line" />} {o}
                                </div>
                              ))}
                            </div>
                            {q.explanation && <p className="mt-2 text-sm text-muted">💡 {q.explanation}</p>}
                          </div>
                          <div className="flex flex-col gap-1">
                            <button onClick={() => setEditQ(q)} className="grid size-9 place-items-center rounded-xl text-muted hover:bg-surface-3 hover:text-primary cursor-pointer"><Edit3 className="size-4" /></button>
                            <button onClick={async () => {
                              if (await confirm({ title: "حذف السؤال", message: "هل تريد حذف هذا السؤال؟", confirmLabel: "حذف", danger: true })) {
                                await run(() => quizApi.deleteQuestion(q.id), "تم الحذف");
                                state.reload();
                              }
                            }} className="grid size-9 place-items-center rounded-xl text-muted hover:bg-danger/10 hover:text-danger cursor-pointer"><Trash2 className="size-4" /></button>
                          </div>
                        </div>
                      </Card>
                    ))}
                    <Button variant="secondary" icon={Plus} className="w-full" onClick={() => setEditQ("new")}>إضافة سؤال</Button>
                  </div>
                )}
              </>
            ) : <Results quizId={quiz.id} />}
            {editQ && <QuestionModal quizId={quiz.id} q={editQ === "new" ? null : editQ} onClose={() => setEditQ(null)} onDone={state.reload} />}
            {settings && <QuizSettingsModal quiz={quiz} onClose={() => setSettings(false)} onSaved={() => state.reload()} />}
          </>
        );
      }}
    </Async>
  );
}

function Results({ quizId }: { quizId: string }) {
  const state = useAsync(() => quizApi.attempts(quizId), [quizId]);
  return (
    <Async state={state} empty={(l) => l.length === 0} emptyMessage="لم يحل أحد الكويز بعد" emptyIcon={Users}>
      {(rows) => (
        <Table head={["الطالب", "المحاولة", "البداية", "التسليم", "الدرجة"]}>
          {rows.map((a) => (
            <tr key={a.id} className="hover:bg-surface-2">
              <td className="px-4 py-3 font-bold">{a.students?.name} <span className="text-xs text-muted">{a.students?.student_code}</span></td>
              <td className="px-4 py-3">{a.attempt_no}</td>
              <td className="whitespace-nowrap px-4 py-3 text-muted">{Fmt.dateTime(a.started_at)}</td>
              <td className="whitespace-nowrap px-4 py-3">{a.submitted_at ? Fmt.dateTime(a.submitted_at) : <Badge tone="warning">لم يسلم</Badge>}</td>
              <td className="px-4 py-3 font-black">{a.score != null ? `${Fmt.number(a.score)} / ${Fmt.number(a.max_score)}` : "—"}</td>
            </tr>
          ))}
        </Table>
      )}
    </Async>
  );
}

function QuestionModal({ quizId, q, onClose, onDone }: { quizId: string; q: QuizQuestion | null; onClose(): void; onDone(): void }) {
  const { run, toast } = useUi();
  const [kind, setKind] = useState<"mcq" | "tf">(q?.kind ?? "mcq");
  const [body, setBody] = useState(q?.body ?? "");
  const [options, setOptions] = useState<string[]>(q?.kind === "mcq" ? q.options : ["", "", "", ""]);
  const [correct, setCorrect] = useState(q?.correct_index ?? 0);
  const [points, setPoints] = useState(String(q?.points ?? 1));
  const [explanation, setExplanation] = useState(q?.explanation ?? "");
  const [busy, setBusy] = useState(false);
  const opts = kind === "tf" ? ["صح", "خطأ"] : options;

  const save = async () => {
    if (!body.trim()) return toast("اكتب نص السؤال", "error");
    const clean = kind === "tf" ? opts : options.map((o) => o.trim()).filter(Boolean);
    if (kind === "mcq" && clean.length < 2) return toast("أضف اختيارين على الأقل", "error");
    if (correct >= clean.length || (kind === "mcq" && !options[correct]?.trim())) return toast("حدد الإجابة الصحيحة", "error");
    if (!(Number(points) > 0)) return toast("الدرجة غير صحيحة", "error");
    // Keep the chosen index aligned after removing blank options.
    const idx = kind === "tf" ? correct : clean.indexOf(options[correct].trim());
    setBusy(true);
    const ok = await run(() => quizApi.saveQuestion(quizId, { kind, body, options: clean, correct_index: idx, points: Number(points), explanation }, q?.id), "تم حفظ السؤال");
    setBusy(false);
    if (ok !== undefined) { onClose(); onDone(); }
  };

  return (
    <Modal open onClose={onClose} title={q ? "تعديل السؤال" : "سؤال جديد"} wide footer={<><Button variant="ghost" onClick={onClose}>إلغاء</Button><Button loading={busy} onClick={save}>حفظ</Button></>}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-surface-2 p-1.5">
          {(["mcq", "tf"] as const).map((k) => (
            <button key={k} onClick={() => { setKind(k); setCorrect(0); }} className={cx("rounded-xl py-2 font-bold cursor-pointer", kind === k ? "bg-brand text-white" : "text-muted")}>{k === "mcq" ? "اختيار من متعدد" : "صح أم خطأ"}</button>
          ))}
        </div>
        <Field label="نص السؤال"><Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} /></Field>
        <div>
          <div className="mb-2 text-[13px] font-bold">الاختيارات (اضغط الدائرة لتحديد الإجابة الصحيحة)</div>
          <div className="space-y-2">
            {opts.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <button onClick={() => setCorrect(i)} className={cx("grid size-10 shrink-0 place-items-center rounded-xl border-2 transition cursor-pointer", correct === i ? "border-success bg-success text-white" : "border-line text-transparent")}><CheckCircle2 className="size-5" /></button>
                {kind === "tf" ? <div className="flex-1 rounded-2xl border border-line bg-surface-2 px-4 py-3 font-bold">{o}</div> : (
                  <Input value={o} placeholder={`الاختيار ${i + 1}`} onChange={(e) => setOptions(options.map((x, j) => (j === i ? e.target.value : x)))} />
                )}
                {kind === "mcq" && options.length > 2 && <button onClick={() => { setOptions(options.filter((_, j) => j !== i)); if (correct >= i && correct > 0) setCorrect(correct - 1); }} className="grid size-10 place-items-center rounded-xl text-muted hover:text-danger cursor-pointer"><X className="size-4" /></button>}
              </div>
            ))}
          </div>
          {kind === "mcq" && options.length < 6 && <Button size="sm" variant="ghost" icon={Plus} className="mt-2" onClick={() => setOptions([...options, ""])}>إضافة اختيار</Button>}
        </div>
        <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
          <Field label="الدرجة"><Input type="number" min={0.25} step={0.25} value={points} onChange={(e) => setPoints(e.target.value)} /></Field>
          <Field label="شرح الإجابة (اختياري)"><Input value={explanation} onChange={(e) => setExplanation(e.target.value)} /></Field>
        </div>
      </div>
    </Modal>
  );
}
