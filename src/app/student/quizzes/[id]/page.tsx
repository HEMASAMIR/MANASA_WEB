"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, Flag, Send, Trophy, XCircle } from "lucide-react";
import { studentPortalApi, usePortal, type QuizAttemptPayload, type QuizResult } from "@/lib/student";
import { friendlyError } from "@/lib/errors";
import { Fmt } from "@/lib/fmt";
import { Button, Card, ErrorState, LoadingBlock, Progress, Ring, cx, useUi } from "@/components/ui";

const storeKey = (attempt: string) => `quiz-answers-${attempt}`;

export default function TakeQuiz() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { reload } = usePortal();
  const { confirm } = useUi();
  const [attempt, setAttempt] = useState<QuizAttemptPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [idx, setIdx] = useState(0);
  const [left, setLeft] = useState<number | null>(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const offset = useRef(0);
  const submittedRef = useRef(false);

  useEffect(() => {
    studentPortalApi.startQuiz(id).then((a) => {
      offset.current = new Date(a.server_now).getTime() - Date.now();
      setAttempt(a);
      try {
        const saved = localStorage.getItem(storeKey(a.attempt_id));
        if (saved) setAnswers(JSON.parse(saved));
      } catch {}
    }).catch((e) => setError(friendlyError(e)));
  }, [id]);

  useEffect(() => {
    if (!attempt) return;
    try { localStorage.setItem(storeKey(attempt.attempt_id), JSON.stringify(answers)); } catch {}
  }, [answers, attempt]);

  const submit = useCallback(async () => {
    if (!attempt || submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      const r = await studentPortalApi.submitQuiz(attempt.attempt_id, answers);
      try { localStorage.removeItem(storeKey(attempt.attempt_id)); } catch {}
      setResult(r);
      reload();
    } catch (e) {
      submittedRef.current = false;
      setError(friendlyError(e));
    } finally {
      setSubmitting(false);
    }
  }, [attempt, answers, reload]);

  // Countdown against the server clock; auto-submit when time runs out.
  useEffect(() => {
    if (!attempt?.deadline || result) return;
    const end = new Date(attempt.deadline).getTime();
    const tick = () => {
      const s = Math.max(0, Math.floor((end - (Date.now() + offset.current)) / 1000));
      setLeft(s);
      if (s === 0) submit();
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [attempt, result, submit]);

  if (error && !result) return <ErrorState message={error} onRetry={() => router.push("/student/quizzes")} />;
  if (!attempt) return <LoadingBlock />;

  if (result) {
    const pct = result.percent;
    return (
      <div className="mx-auto max-w-3xl">
        <div className="relative overflow-hidden rounded-[32px] bg-hero p-8 text-center text-white shadow-soft animate-in">
          <div className="absolute -top-16 -end-12 size-56 rounded-full bg-white/10" />
          <Trophy className="mx-auto size-12 text-[#FCD34D]" />
          <h1 className="mt-3 text-3xl font-black">{pct >= 85 ? "ممتاز! 🎉" : pct >= 50 ? "أحسنت 👏" : "حاول مرة أخرى 💪"}</h1>
          <div className="mx-auto mt-6 w-fit"><Ring value={pct} size={150} stroke={12} color="#fff" track="rgba(255,255,255,0.2)"><div><div className="text-4xl font-black">{Math.round(pct)}%</div><div className="text-sm text-white/80">{Fmt.number(result.score)} / {Fmt.number(result.max_score)}</div></div></Ring></div>
          {result.late && <p className="mt-4 rounded-2xl bg-danger/40 p-2 text-sm">تم التسليم بعد انتهاء الوقت</p>}
          <p className="mt-4 text-white/85">{result.attempts_left > 0 ? `متبقي لك ${result.attempts_left} محاولة` : "لا توجد محاولات متبقية"}</p>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="outline" className="!border-white/30 !bg-white/10 !text-white" onClick={() => router.push("/student/quizzes")}>العودة للكويزات</Button>
            <Button variant="secondary" className="!bg-white !text-primary-2" onClick={() => router.push("/student/grades")}>درجاتي</Button>
          </div>
        </div>
        {result.review && (
          <div className="mt-6 space-y-3">
            <h2 className="text-lg font-extrabold">مراجعة الإجابات</h2>
            {result.review.map((r, i) => (
              <Card key={r.question_id} className={cx("!p-5 border-s-4", r.correct ? "!border-s-success" : "!border-s-danger")}>
                <div className="flex items-start gap-3">
                  {r.correct ? <CheckCircle2 className="size-6 shrink-0 text-success" /> : <XCircle className="size-6 shrink-0 text-danger" />}
                  <div className="min-w-0 flex-1">
                    <p className="font-bold leading-7">{i + 1}. {r.body}</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {r.options.map((o, j) => (
                        <div key={j} className={cx("rounded-xl border px-3 py-2 text-sm", j === r.correct_index ? "border-success/50 bg-success/10 font-bold text-success" : j === r.chosen ? "border-danger/50 bg-danger/10 text-danger line-through" : "border-line text-muted")}>{o}</div>
                      ))}
                    </div>
                    {r.chosen === null && <p className="mt-2 text-sm text-warning">لم تجب على هذا السؤال</p>}
                    {r.explanation && <p className="mt-2 rounded-xl bg-surface-2 p-3 text-sm">💡 {r.explanation}</p>}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  const qs = attempt.questions;
  const q = qs[idx];
  const answered = Object.keys(answers).filter((k) => qs.some((x) => x.id === k)).length;
  const lowTime = left !== null && left <= 60;

  const finish = async () => {
    const missing = qs.length - answered;
    if (missing > 0 && !(await confirm({ title: "تسليم الكويز", message: `لم تجب على ${missing} سؤال. هل تريد التسليم الآن؟`, confirmLabel: "تسليم" }))) return;
    submit();
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="sticky top-16 z-10 -mx-4 mb-5 border-b border-line glass px-4 py-3 md:-mx-8 md:px-8">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="truncate font-black">{attempt.title}</div>
            <div className="text-xs text-muted">المحاولة {attempt.attempt_no} من {attempt.max_attempts} • أجبت {answered}/{qs.length}</div>
          </div>
          {left !== null && (
            <div className={cx("flex items-center gap-1.5 rounded-2xl px-3.5 py-2 font-black tabular-nums", lowTime ? "animate-pulse bg-danger text-white" : "bg-primary-soft text-primary")}>
              <Clock className="size-4" /> {String(Math.floor(left / 60)).padStart(2, "0")}:{String(left % 60).padStart(2, "0")}
            </div>
          )}
        </div>
        <Progress value={(answered / qs.length) * 100} className="mt-3 h-1.5" />
      </div>

      {attempt.description && idx === 0 && <Card className="mb-4 border-info/30 bg-info/5 text-sm leading-7">{attempt.description}</Card>}

      <Card key={q.id} className="!p-6 animate-in">
        <div className="mb-4 flex items-center justify-between text-sm">
          <span className="rounded-full bg-primary-soft px-3 py-1 font-black text-primary">سؤال {idx + 1} من {qs.length}</span>
          <span className="text-muted">{Fmt.number(q.points)} درجة</span>
        </div>
        <p className="whitespace-pre-wrap text-xl font-extrabold leading-9">{q.body}</p>
        <div className="mt-6 grid gap-3">
          {q.options.map((o, j) => {
            const on = answers[q.id] === j;
            return (
              <button key={j} onClick={() => setAnswers({ ...answers, [q.id]: j })}
                className={cx("flex items-center gap-4 rounded-2xl border-2 p-4 text-start text-[16px] font-bold transition cursor-pointer", on ? "border-primary bg-primary-soft text-primary shadow-[0_8px_20px_-12px_rgba(13,148,136,0.9)]" : "border-line hover:border-primary/40")}>
                <span className={cx("grid size-9 shrink-0 place-items-center rounded-xl text-sm font-black", on ? "bg-brand text-white" : "bg-surface-3 text-muted")}>{q.kind === "tf" ? (j === 0 ? "✓" : "✗") : "أبجد"[j] ?? j + 1}</span>
                {o}
              </button>
            );
          })}
        </div>
      </Card>

      <div className="mt-5 flex items-center gap-2">
        <Button variant="outline" icon={ArrowRight} disabled={idx === 0} onClick={() => setIdx(idx - 1)}>السابق</Button>
        <div className="flex-1" />
        {idx < qs.length - 1 ? <Button onClick={() => setIdx(idx + 1)}>التالي <ArrowLeft className="size-4" /></Button> : <Button variant="success" icon={Send} loading={submitting} onClick={finish}>تسليم الكويز</Button>}
      </div>

      <Card className="mt-6">
        <div className="mb-3 flex items-center gap-2 text-sm font-bold"><Flag className="size-4 text-primary" /> التنقل بين الأسئلة</div>
        <div className="flex flex-wrap gap-2">
          {qs.map((x, i) => (
            <button key={x.id} onClick={() => setIdx(i)} className={cx("grid size-10 place-items-center rounded-xl text-sm font-black transition cursor-pointer", i === idx ? "bg-brand text-white" : answers[x.id] !== undefined ? "bg-success/15 text-success" : "bg-surface-3 text-muted")}>{i + 1}</button>
          ))}
        </div>
        <Button variant="success" icon={Send} className="mt-4 w-full" loading={submitting} onClick={finish}>تسليم الكويز</Button>
      </Card>
    </div>
  );
}
