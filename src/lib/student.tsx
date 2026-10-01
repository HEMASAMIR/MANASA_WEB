"use client";

import { createContext, useContext, type ReactNode } from "react";
import { sb, must } from "./supabase";
import { AppError } from "./errors";
import { Fmt, argbToHex, colorFor, parseDate } from "./fmt";
import type { ClassRow, Course, Exam, Lesson, NotificationRow, Student } from "./types";

export interface PortalLesson extends Lesson { completed: boolean; lastPos: number }
export interface PortalCourse {
  id: string; title: string; description: string | null; teacher: string; icon: string; color: string; className: string;
  /** The group's subject and grade, used to place the course in the student's study plan. */
  subject: string | null; grade: string;
  lessons: PortalLesson[]; done: number; isNew: boolean;
}
export interface PortalExam { exam: Exam; score: number | null; status: "upcoming" | "completed" | "missed"; daysLeft: number; subject: string; color: string }
export interface PortalQuiz {
  exam: Exam; score: number | null; subject: string; color: string; interactiveId: string | null; attemptsUsed: number; maxAttempts: number;
  opensAt: Date | null; closesAt: Date | null; hasOpenAttempt: boolean; durationMin: number | null;
}
export interface ScheduleEvent { id: string; title: string; subject: string; date: Date; time: string; type: "lesson" | "exam"; color: string; room?: string | null }
export interface Achievement { id: string; emoji: string; title: string; description: string; color: string; awarded_at: string }

export interface PortalData {
  student: Student;
  email: string;
  classes: ClassRow[];
  courses: PortalCourse[];
  exams: PortalExam[];
  quizzes: PortalQuiz[];
  subjects: { subject: string; pct: number; color: string }[];
  notifications: NotificationRow[];
  events: ScheduleEvent[];
  achievements: Achievement[];
  lastCourseId: string | null;
  totalLessons: number;
  completedLessons: number;
}

export async function loadPortal(): Promise<PortalData | "not-linked"> {
  const { data: u } = await sb().auth.getUser();
  const user = u.user;
  if (!user) throw new AppError("انتهت الجلسة، يرجى تسجيل الدخول مرة أخرى");
  const student = must(await sb().from("students").select("*").eq("user_id", user.id).maybeSingle()) as Student | null;
  if (!student) return "not-linked";
  const sid = student.id;

  const [classes, courses, progress, exams, grades, notifications, achievements, iq, attempts] = await Promise.all([
    sb().from("classes").select("*, class_schedule(*)").eq("is_active", true).then(must),
    sb().from("courses").select("*, lessons(*), user_profiles(name), classes(name)").order("created_at").then(must),
    sb().from("lesson_progress").select("*").eq("student_id", sid).then(must),
    sb().from("exams").select("*, classes(name)").order("exam_date", { ascending: true }).then(must),
    sb().from("grades").select("*").eq("student_id", sid).then(must),
    sb().from("notifications").select("*").order("created_at", { ascending: false }).limit(60).then(must),
    sb().from("achievements").select("*").eq("student_id", sid).order("awarded_at", { ascending: false }).then(must),
    sb().from("quizzes").select("id, exam_id, duration_minutes, available_from, available_until, max_attempts").then(must),
    sb().from("quiz_attempts").select("id, quiz_id, submitted_at").eq("student_id", sid).then(must),
  ]) as unknown as [
    ClassRow[], (Course & { lessons: Lesson[] })[], { lesson_id: string; completed: boolean; last_position_sec: number; updated_at: string }[],
    Exam[], { exam_id: string; score: number }[], NotificationRow[], { id: string; emoji: string; title: string; description: string | null; color: number; awarded_at: string }[],
    { id: string; exam_id: string; duration_minutes: number | null; available_from: string | null; available_until: string | null; max_attempts: number }[],
    { id: string; quiz_id: string; submitted_at: string | null }[],
  ];

  const now = new Date();
  const day0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const progressBy = new Map(progress.map((p) => [p.lesson_id, p]));
  const classById = new Map(classes.map((c) => [c.id, c]));
  const gradeBy = new Map(grades.map((g) => [g.exam_id, Number(g.score)]));
  const iqBy = new Map(iq.map((q) => [q.exam_id, q]));
  const attemptsBy = new Map<string, typeof attempts>();
  attempts.forEach((a) => attemptsBy.set(a.quiz_id, [...(attemptsBy.get(a.quiz_id) ?? []), a]));

  // Courses
  let lastCourseId: string | null = null;
  let lastAt = 0;
  let totalLessons = 0;
  let completedLessons = 0;
  const portalCourses: PortalCourse[] = courses.map((c) => {
    const lessons = [...(c.lessons ?? [])].sort((a, b) => a.position - b.position).map((l) => {
      const p = progressBy.get(l.id);
      if (p) {
        const at = new Date(p.updated_at).getTime();
        if (at > lastAt) { lastAt = at; lastCourseId = c.id; }
      }
      return { ...l, completed: !!p?.completed, lastPos: p?.last_position_sec ?? 0 };
    });
    const done = lessons.filter((l) => l.completed).length;
    totalLessons += lessons.length;
    completedLessons += done;
    return {
      id: c.id, title: c.title, description: c.description, teacher: c.user_profiles?.name ?? "", icon: c.icon || "📚",
      color: argbToHex(c.color, colorFor(c.id)), className: c.classes?.name ?? "", lessons, done,
      subject: classById.get(c.class_id)?.subject ?? null, grade: classById.get(c.class_id)?.grade ?? "",
      isNew: now.getTime() - new Date(c.created_at).getTime() <= 14 * 86400000,
    };
  });

  // Exams / quizzes
  const portalExams: PortalExam[] = [];
  const portalQuizzes: PortalQuiz[] = [];
  const subjTotals = new Map<string, [number, number]>();
  for (const e of exams) {
    const subject = e.subject?.trim() || e.classes?.name || "";
    const color = colorFor(subject);
    const score = gradeBy.has(e.id) ? gradeBy.get(e.id)! : null;
    if (score !== null) {
      const t = subjTotals.get(subject) ?? [0, 0];
      subjTotals.set(subject, [t[0] + score, t[1] + Number(e.max_score)]);
    }
    if (e.kind === "exam") {
      const date = e.exam_date ? parseDate(e.exam_date) : null;
      let status: PortalExam["status"] = "missed";
      let daysLeft = 0;
      if (score !== null) status = "completed";
      else if (!date || date >= day0) { status = "upcoming"; daysLeft = date ? Math.round((date.getTime() - day0.getTime()) / 86400000) : 0; }
      portalExams.push({ exam: e, score, status, daysLeft, subject, color });
    } else {
      const q = iqBy.get(e.id);
      const at = q ? attemptsBy.get(q.id) ?? [] : [];
      portalQuizzes.push({
        exam: e, score, subject, color, interactiveId: q?.id ?? null, attemptsUsed: at.filter((a) => a.submitted_at).length, maxAttempts: q?.max_attempts ?? 1,
        opensAt: q?.available_from ? new Date(q.available_from) : null, closesAt: q?.available_until ? new Date(q.available_until) : null,
        hasOpenAttempt: at.some((a) => !a.submitted_at), durationMin: q?.duration_minutes ?? e.duration_minutes,
      });
    }
  }
  portalExams.sort((a, b) => a.daysLeft - b.daysLeft);

  // Schedule: next 14 days
  const events: ScheduleEvent[] = [];
  for (const c of classes) {
    const subject = c.subject?.trim() || c.name;
    for (const s of c.class_schedule ?? []) {
      for (let i = 0; i < 14; i++) {
        const d = new Date(day0.getTime() + i * 86400000);
        if (d.getDay() !== s.weekday) continue;
        const [h, m] = s.start_time.split(":").map(Number);
        events.push({ id: `${s.id}-${Fmt.isoDate(d)}`, title: c.name, subject, date: new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m), time: `${Fmt.time12(s.start_time)} - ${Fmt.time12(s.end_time)}`, type: "lesson", color: colorFor(subject), room: s.room || c.room });
      }
    }
  }
  for (const pe of portalExams.filter((x) => x.status === "upcoming" && x.exam.exam_date)) {
    const d = parseDate(pe.exam.exam_date!);
    if ((d.getTime() - day0.getTime()) / 86400000 > 60) continue;
    events.push({ id: `exam-${pe.exam.id}`, title: pe.exam.title, subject: pe.subject, date: d, time: Fmt.time12(pe.exam.exam_time), type: "exam", color: pe.color });
  }
  events.sort((a, b) => a.date.getTime() - b.date.getTime());

  return {
    student, email: user.email ?? "", classes, courses: portalCourses, exams: portalExams, quizzes: portalQuizzes,
    subjects: [...subjTotals.entries()].map(([subject, [s, m]]) => ({ subject, pct: m ? (s / m) * 100 : 0, color: colorFor(subject) })).sort((a, b) => a.subject.localeCompare(b.subject, "ar")),
    notifications, events,
    achievements: achievements.map((a) => ({ id: a.id, emoji: a.emoji || "🏆", title: a.title, description: a.description ?? "", color: argbToHex(a.color), awarded_at: a.awarded_at })),
    lastCourseId, totalLessons, completedLessons,
  };
}

export const studentPortalApi = {
  saveProgress: async (studentId: string, lessonId: string, completed: boolean, pos = 0) => {
    must(await sb().from("lesson_progress").upsert({ student_id: studentId, lesson_id: lessonId, completed, last_position_sec: pos, updated_at: new Date().toISOString() }, { onConflict: "student_id,lesson_id" }));
  },
  startQuiz: async (quizId: string) => must(await sb().rpc("start_quiz_attempt", { p_quiz: quizId })) as QuizAttemptPayload,
  submitQuiz: async (attemptId: string, answers: Record<string, number>) => must(await sb().rpc("submit_quiz_attempt", { p_attempt: attemptId, p_answers: answers })) as QuizResult,
};

export interface QuizAttemptPayload {
  attempt_id: string; attempt_no: number; title: string; description: string | null; duration_minutes: number | null; deadline: string | null;
  server_now: string; max_attempts: number; max_score: number; questions: { id: string; kind: "mcq" | "tf"; body: string; options: string[]; points: number }[];
}
export interface QuizResult {
  score: number; max_score: number; percent: number; attempts_left: number; late?: boolean;
  review: { question_id: string; body: string; options: string[]; chosen: number | null; correct_index: number; correct: boolean; points: number; explanation: string | null }[] | null;
}

// ─── Context ─────────────────────────────────────────────────────────────────
const Ctx = createContext<{ data: PortalData; reload(): Promise<void> } | null>(null);
export function PortalProvider({ data, reload, children }: { data: PortalData; reload(): Promise<void>; children: ReactNode }) {
  return <Ctx.Provider value={{ data, reload }}>{children}</Ctx.Provider>;
}
export function usePortal() {
  const v = useContext(Ctx);
  if (!v) throw new Error("usePortal outside PortalProvider");
  return v;
}
