/**
 * Data access for every portal. Mirrors the Flutter repositories one to one:
 * same tables, same RPCs, and Row Level Security decides what each user sees.
 */
import { sb, fetchAll, must, currentUserId } from "./supabase";
import { AppError } from "./errors";
import type {
  AppSettings, Assistant, AttendanceRecord, AttendanceStatus, ChatContact, ClassRow, Course, Exam, Grade,
  Lesson, MessageRow, NotificationRow, Payment, Profile, Quiz, QuizQuestion, StaffStats, StaffUser, Student,
  StudentSummary, StudentSummaryRow,
} from "./types";

const nn = (s: string | null | undefined) => (s == null || s.trim() === "" ? null : s.trim());

function denied(rows: unknown[] | null) {
  if (!rows || rows.length === 0) throw new AppError("غير مصرح لك بتنفيذ هذا الإجراء");
}

// ─── Settings ────────────────────────────────────────────────────────────────
export const settingsApi = {
  async load(): Promise<AppSettings> {
    return must(await sb().from("app_settings").select("*").eq("id", 1).single());
  },
  async save(patch: Partial<AppSettings>) {
    const rows = must(await sb().from("app_settings").update(patch).eq("id", 1).select("id"));
    denied(rows);
  },
};

// ─── Classes ─────────────────────────────────────────────────────────────────
const CLASS_SELECT = "*, class_schedule(*), user_profiles(name), enrollments(count)";

export interface SlotInput { weekday: number; start: string; end: string; room?: string }

export const classApi = {
  async list(includeInactive = false): Promise<ClassRow[]> {
    let q = sb().from("classes").select(CLASS_SELECT);
    if (!includeInactive) q = q.eq("is_active", true);
    return must(await q.order("name")) as ClassRow[];
  },
  async create(input: {
    name: string; grade: string; subject?: string; teacher_id?: string | null; room?: string;
    monthly_fee?: number; whatsapp_group_url?: string; capacity?: number | null; slots?: SlotInput[];
  }): Promise<string> {
    const row = must(
      await sb().from("classes").insert({
        name: input.name.trim(), grade: input.grade.trim(), subject: nn(input.subject), teacher_id: input.teacher_id ?? null,
        room: nn(input.room), monthly_fee: input.monthly_fee ?? 0, whatsapp_group_url: nn(input.whatsapp_group_url),
        capacity: input.capacity ?? null,
      }).select("id").single(),
    ) as { id: string };
    if (input.slots?.length) await classApi.setSchedule(row.id, input.slots);
    return row.id;
  },
  async update(id: string, patch: Partial<ClassRow>) {
    const rows = must(await sb().from("classes").update(patch).eq("id", id).select("id"));
    denied(rows);
  },
  async remove(id: string) {
    const rows = must(await sb().from("classes").delete().eq("id", id).select("id"));
    denied(rows);
  },
  async setSchedule(classId: string, slots: SlotInput[]) {
    must(await sb().rpc("set_class_schedule", {
      p_class: classId,
      p_slots: slots.map((s) => ({ weekday: s.weekday, start: s.start, end: s.end, room: s.room ?? "" })),
    }));
  },
  async roster(classId: string): Promise<Student[]> {
    const rows = must(
      await sb().from("enrollments").select("students!inner(*)").eq("class_id", classId).eq("students.status", "active"),
    ) as unknown as { students: Student }[];
    return rows.map((r) => r.students).sort((a, b) => a.name.localeCompare(b.name, "ar"));
  },
};

// ─── Students ────────────────────────────────────────────────────────────────
type StudentJoinRow = Student & { enrollments?: { class_id: string; classes: { id: string; name: string } | null }[] };

function toSummary(r: StudentJoinRow, s: StudentSummaryRow | undefined | null): StudentSummary {
  const { enrollments, ...student } = r;
  return {
    student,
    classes: (enrollments ?? []).map((e) => e.classes).filter(Boolean) as { id: string; name: string }[],
    stats: s ?? null,
  };
}

export const classNames = (s: StudentSummary) =>
  s.classes.length ? s.classes.map((c) => c.name).join("، ") : "غير مسجل في مجموعة";

export const studentApi = {
  async list(classId?: string): Promise<StudentSummary[]> {
    const rows = await fetchAll<StudentJoinRow>((from, to) => {
      const q = sb().from("students").select(
        classId ? "*, enrollments!inner(class_id, classes(id, name))" : "*, enrollments(class_id, classes(id, name))",
      );
      return (classId ? q.eq("enrollments.class_id", classId) : q).order("name").range(from, to) as never;
    });
    const summaries = await fetchAll<StudentSummaryRow>((from, to) =>
      sb().from("student_summary").select("*").order("student_id").range(from, to) as never,
    );
    const byId = new Map(summaries.map((s) => [s.student_id, s]));
    return rows.map((r) => toSummary(r, byId.get(r.id)));
  },
  /** Grade text of every active student (stage • track), for the distribution widget. */
  async activeGrades(): Promise<string[]> {
    const rows = await fetchAll<{ grade: string }>((from, to) =>
      sb().from("students").select("grade").eq("status", "active").order("id").range(from, to) as never,
    );
    return rows.map((r) => r.grade ?? "");
  },
  async listAtRisk(threshold: number, limit = 20): Promise<StudentSummary[]> {
    const rows = must(
      await sb().from("students").select("*, enrollments(class_id, classes(id, name))").eq("status", "active").order("name").limit(limit * 5),
    ) as StudentJoinRow[];
    if (!rows.length) return [];
    const sums = must(
      await sb().from("student_summary").select("*").in("student_id", rows.map((r) => r.id))
        .gte("absent_count", threshold).order("absent_count", { ascending: false }).limit(limit),
    ) as StudentSummaryRow[];
    const byId = new Map(sums.map((s) => [s.student_id, s]));
    return rows.filter((r) => byId.has(r.id)).map((r) => toSummary(r, byId.get(r.id)))
      .sort((a, b) => (b.stats?.absent_count ?? 0) - (a.stats?.absent_count ?? 0));
  },
  async get(id: string): Promise<StudentSummary> {
    const row = must(await sb().from("students").select("*, enrollments(class_id, classes(id, name))").eq("id", id).single()) as StudentJoinRow;
    const s = must(await sb().from("student_summary").select("*").eq("student_id", id).maybeSingle()) as StudentSummaryRow | null;
    return toSummary(row, s);
  },
  async create(input: {
    name: string; parent_phone: string; code?: string; grade?: string; parent_name?: string; student_phone?: string; class_ids?: string[];
  }): Promise<string> {
    return must(await sb().rpc("create_student", {
      p_name: input.name, p_parent_phone: input.parent_phone, p_code: nn(input.code), p_grade: input.grade ?? "",
      p_parent_name: nn(input.parent_name), p_student_phone: nn(input.student_phone), p_class_ids: input.class_ids ?? [],
    })) as string;
  },
  async update(id: string, patch: Partial<Student>) {
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(patch)) clean[k] = typeof v === "string" ? (["name", "grade", "parent_phone", "status"].includes(k) ? v.trim() : nn(v)) : v;
    const rows = must(await sb().from("students").update(clean).eq("id", id).select("id"));
    denied(rows);
  },
  async remove(id: string) {
    const rows = must(await sb().from("students").delete().eq("id", id).select("id"));
    denied(rows);
  },
  async setClasses(studentId: string, classIds: string[], current: string[]) {
    const add = classIds.filter((c) => !current.includes(c));
    const del = current.filter((c) => !classIds.includes(c));
    if (add.length) must(await sb().from("enrollments").insert(add.map((c) => ({ student_id: studentId, class_id: c }))));
    if (del.length) must(await sb().from("enrollments").delete().eq("student_id", studentId).in("class_id", del));
  },
  async guardians(studentId: string) {
    const rows = must(await sb().from("guardians").select("parent_id, user_profiles(name, phone, email)").eq("student_id", studentId)) as unknown as
      { parent_id: string; user_profiles: { name: string; phone: string | null; email: string | null } | null }[];
    return rows.map((r) => ({ id: r.parent_id, name: r.user_profiles?.name ?? "", phone: r.user_profiles?.phone ?? null, email: r.user_profiles?.email ?? null }));
  },
  async importRows(rows: Record<string, unknown>[], onProgress?: (done: number, total: number) => void) {
    let created = 0;
    const failed: { index: number; message: string }[] = [];
    for (let start = 0; start < rows.length; start += 200) {
      const part = rows.slice(start, start + 200);
      const res = must(await sb().rpc("import_students", { p_rows: part })) as { created: number; failed: { row: number; message: string }[] };
      created += res.created;
      for (const f of res.failed) failed.push({ index: start + f.row - 1, message: f.message });
      onProgress?.(Math.min(start + part.length, rows.length), rows.length);
    }
    return { created, failed };
  },
  async award(studentId: string, emoji: string, title: string, description?: string) {
    must(await sb().from("achievements").insert({ student_id: studentId, emoji: emoji.trim() || "🏆", title: title.trim(), description: nn(description) }));
  },
  async claim(code: string, phone: string): Promise<string> {
    return must(await sb().rpc("claim_student", { p_student_code: code, p_phone: phone })) as string;
  },
};

// ─── Attendance ──────────────────────────────────────────────────────────────
export const attendanceApi = {
  async forClassDate(classId: string, date: string): Promise<AttendanceRecord[]> {
    return must(await sb().from("attendance_records").select("*").eq("class_id", classId).eq("date", date)) as AttendanceRecord[];
  },
  async submit(records: { student_id: string; class_id: string; date: string; status: AttendanceStatus; note?: string | null; method?: string }[]) {
    if (!records.length) return;
    must(await sb().from("attendance_records").upsert(
      records.map((r) => ({ ...r, note: nn(r.note ?? null), method: r.method ?? "manual" })),
      { onConflict: "student_id,class_id,date" },
    ));
  },
  async history(opts: { classId?: string; studentId?: string; from?: string; to?: string; limit?: number }): Promise<AttendanceRecord[]> {
    let q = sb().from("attendance_records").select("*, students(name, student_code), classes(name)");
    if (opts.classId) q = q.eq("class_id", opts.classId);
    if (opts.studentId) q = q.eq("student_id", opts.studentId);
    if (opts.from) q = q.gte("date", opts.from);
    if (opts.to) q = q.lte("date", opts.to);
    return must(await q.order("date", { ascending: false }).order("recorded_at", { ascending: false }).limit(opts.limit ?? 500)) as AttendanceRecord[];
  },
  async rows(opts: { classId?: string; from: string; to: string }) {
    return fetchAll<Record<string, unknown>>((a, b) => {
      let q = sb().from("attendance_records")
        .select("date, status, note, method, student_id, class_id, students(name, student_code, parent_phone), classes(name)")
        .gte("date", opts.from).lte("date", opts.to);
      if (opts.classId) q = q.eq("class_id", opts.classId);
      return q.order("date").order("class_id").range(a, b) as never;
    });
  },
};

// ─── QR ──────────────────────────────────────────────────────────────────────
export const qrApi = {
  start: async (classId: string, minutes = 90) => must(await sb().rpc("start_qr_session", { p_class: classId, p_minutes: minutes })) as string,
  token: async (sessionId: string) => must(await sb().rpc("get_qr_token", { p_session: sessionId })) as string,
  end: async (sessionId: string) => { must(await sb().rpc("end_qr_session", { p_session: sessionId })); },
  scan: async (payload: string, lat?: number, lng?: number) =>
    must(await sb().rpc("scan_qr_attendance", { p_payload: payload, ...(lat != null ? { p_lat: lat, p_lng: lng } : {}) })) as
      { status: AttendanceStatus; class_name: string; student_name: string },
};

// ─── Exams & grades ──────────────────────────────────────────────────────────
export const examApi = {
  async list(classId?: string): Promise<Exam[]> {
    let q = sb().from("exams").select("*, classes(name)");
    if (classId) q = q.eq("class_id", classId);
    return must(await q.order("created_at", { ascending: false })) as Exam[];
  },
  async get(id: string): Promise<Exam> {
    return must(await sb().from("exams").select("*, classes(name)").eq("id", id).single()) as Exam;
  },
  async create(input: { title: string; max_score: number; class_id: string; kind: string; exam_date?: string | null; exam_time?: string | null; is_published?: boolean }) {
    return must(await sb().from("exams").insert({ ...input, title: input.title.trim(), exam_date: input.exam_date || null, exam_time: input.exam_time || null }).select("id").single()) as { id: string };
  },
  async update(id: string, patch: Partial<Exam>) {
    const rows = must(await sb().from("exams").update(patch).eq("id", id).select("id"));
    denied(rows);
  },
  async remove(id: string) {
    const rows = must(await sb().from("exams").delete().eq("id", id).select("id"));
    denied(rows);
  },
  async grades(examId: string): Promise<Grade[]> {
    return must(await sb().from("grades").select("*").eq("exam_id", examId)) as Grade[];
  },
  async studentGrades(studentId: string): Promise<Grade[]> {
    return must(await sb().from("grades").select("*, exams(title, max_score, kind, exam_date, class_id)").eq("student_id", studentId).order("updated_at", { ascending: false })) as Grade[];
  },
  async saveGrades(examId: string, grades: { student_id: string; score: number; remarks?: string | null }[]) {
    if (!grades.length) return;
    must(await sb().from("grades").upsert(
      grades.map((g) => ({ exam_id: examId, student_id: g.student_id, score: g.score, remarks: nn(g.remarks ?? null) })),
      { onConflict: "exam_id,student_id" },
    ));
  },
  async deleteGrade(examId: string, studentId: string) {
    must(await sb().from("grades").delete().eq("exam_id", examId).eq("student_id", studentId));
  },
};

// ─── Interactive quizzes (staff) ─────────────────────────────────────────────
const QUIZ_SELECT = "*, exams(title, is_published, max_score, question_count), classes(name)";
export interface QuizSettingsInput {
  title: string; description?: string; duration?: number | null; from?: string | null; until?: string | null;
  max_attempts: number; shuffle: boolean; show_answers: boolean;
}
const quizParams = (i: QuizSettingsInput) => ({
  p_title: i.title.trim(), p_description: nn(i.description), p_duration: i.duration ?? null,
  p_from: i.from ? new Date(i.from).toISOString() : null, p_until: i.until ? new Date(i.until).toISOString() : null,
  p_max_attempts: i.max_attempts, p_shuffle: i.shuffle, p_show_answers: i.show_answers,
});

export const quizApi = {
  async list(classId?: string): Promise<Quiz[]> {
    let q = sb().from("quizzes").select(QUIZ_SELECT);
    if (classId) q = q.eq("class_id", classId);
    return must(await q.order("created_at", { ascending: false })) as Quiz[];
  },
  async get(id: string): Promise<Quiz> {
    const row = must(await sb().from("quizzes").select(QUIZ_SELECT).eq("id", id).maybeSingle()) as Quiz | null;
    if (!row) throw new AppError("الكويز غير موجود");
    return row;
  },
  create: async (classId: string, i: QuizSettingsInput) => must(await sb().rpc("create_quiz", { p_class: classId, ...quizParams(i) })) as string,
  update: async (quizId: string, i: QuizSettingsInput) => { must(await sb().rpc("update_quiz", { p_quiz: quizId, ...quizParams(i) })); },
  publish: async (quizId: string, publish: boolean) => (must(await sb().rpc("publish_quiz", { p_quiz: quizId, p_publish: publish })) as number) ?? 0,
  async remove(quiz: Quiz) {
    const rows = must(await sb().from("exams").delete().eq("id", quiz.exam_id).select("id"));
    denied(rows);
  },
  async questions(quizId: string): Promise<QuizQuestion[]> {
    return must(await sb().from("quiz_questions").select("*").eq("quiz_id", quizId).order("position").order("created_at")) as QuizQuestion[];
  },
  async saveQuestion(quizId: string, q: Omit<QuizQuestion, "id" | "quiz_id" | "position">, id?: string) {
    const payload = {
      kind: q.kind, body: q.body.trim(),
      options: q.kind === "tf" ? ["صح", "خطأ"] : q.options.map((o) => o.trim()),
      correct_index: q.correct_index, points: q.points, explanation: nn(q.explanation),
    };
    if (id) {
      const rows = must(await sb().from("quiz_questions").update(payload).eq("id", id).select("id"));
      denied(rows);
      return;
    }
    const last = must(await sb().from("quiz_questions").select("position").eq("quiz_id", quizId).order("position", { ascending: false }).limit(1)) as { position: number }[];
    must(await sb().from("quiz_questions").insert({ quiz_id: quizId, position: last.length ? last[0].position + 1 : 0, ...payload }));
  },
  async deleteQuestion(id: string) {
    const rows = must(await sb().from("quiz_questions").delete().eq("id", id).select("id"));
    denied(rows);
  },
  async attempts(quizId: string) {
    return must(await sb().from("quiz_attempts").select("*, students(name, student_code)").eq("quiz_id", quizId).order("started_at")) as
      { id: string; attempt_no: number; started_at: string; submitted_at: string | null; score: number | null; max_score: number | null; students: { name: string; student_code: string } | null }[];
  },
};

// ─── Courses ─────────────────────────────────────────────────────────────────
export const courseApi = {
  async list(classId?: string): Promise<Course[]> {
    let q = sb().from("courses").select("*, classes(name), lessons(count)");
    if (classId) q = q.eq("class_id", classId);
    return must(await q.order("created_at", { ascending: false })) as Course[];
  },
  async create(input: { title: string; class_id: string; description?: string; icon?: string; color?: number }) {
    return must(await sb().from("courses").insert({
      title: input.title.trim(), class_id: input.class_id, description: nn(input.description), icon: input.icon || "📚",
      color: input.color ?? 4285879295, teacher_id: await currentUserId(),
    }).select("id").single()) as { id: string };
  },
  async update(id: string, patch: Partial<Course>) {
    const rows = must(await sb().from("courses").update(patch).eq("id", id).select("id"));
    denied(rows);
  },
  async remove(id: string) {
    const rows = must(await sb().from("courses").delete().eq("id", id).select("id"));
    denied(rows);
  },
  async lessons(courseId: string): Promise<Lesson[]> {
    return must(await sb().from("lessons").select("*").eq("course_id", courseId).order("position")) as Lesson[];
  },
  async addLesson(courseId: string, l: { title: string; duration_seconds: number; video_url?: string; is_locked: boolean }) {
    const last = must(await sb().from("lessons").select("position").eq("course_id", courseId).order("position", { ascending: false }).limit(1)) as { position: number }[];
    must(await sb().from("lessons").insert({ course_id: courseId, title: l.title.trim(), duration_seconds: l.duration_seconds, video_url: nn(l.video_url), is_locked: l.is_locked, position: last.length ? last[0].position + 1 : 1 }));
  },
  async updateLesson(id: string, patch: Partial<Lesson>) {
    const rows = must(await sb().from("lessons").update(patch).eq("id", id).select("id"));
    denied(rows);
  },
  async removeLesson(id: string) {
    const rows = must(await sb().from("lessons").delete().eq("id", id).select("id"));
    denied(rows);
  },
};

// ─── Finance ─────────────────────────────────────────────────────────────────
export const financeApi = {
  async payments(opts: { studentId?: string; from?: Date; to?: Date; limit?: number } = {}): Promise<Payment[]> {
    let q = sb().from("payments").select("*, students(name, student_code), classes(name), user_profiles(name)");
    if (opts.studentId) q = q.eq("student_id", opts.studentId);
    if (opts.from) q = q.gte("paid_at", opts.from.toISOString());
    if (opts.to) q = q.lt("paid_at", opts.to.toISOString());
    return must(await q.order("paid_at", { ascending: false }).limit(opts.limit ?? 300)) as Payment[];
  },
  renew: async (i: { studentId: string; amount: number; method: string; months: number; classId?: string | null }) =>
    must(await sb().rpc("renew_student", { p_student: i.studentId, p_amount: i.amount, p_method: i.method, p_months: i.months, p_class: i.classId ?? null })) as string,
  async add(i: { studentId: string; amount: number; kind: string; method: string; classId?: string | null; notes?: string }) {
    must(await sb().from("payments").insert({ student_id: i.studentId, amount: i.amount, kind: i.kind, method: i.method, class_id: i.classId ?? null, notes: nn(i.notes) }));
  },
  async remove(id: string) {
    must(await sb().from("payments").delete().eq("id", id));
  },
};

// ─── Reports ─────────────────────────────────────────────────────────────────
export const reportApi = {
  stats: async () => must(await sb().rpc("staff_stats")) as StaffStats,
  leaderboard: async (classId?: string | null, limit = 20) =>
    must(await sb().rpc("leaderboard", { p_class: classId ?? null, p_limit: limit })) as
      { student_id: string; name: string; student_code: string; grade: string; class_name: string | null; avg_percent: number; attendance_pct: number | null; rank: number }[],
  async trend(classId?: string, days = 14) {
    const to = new Date();
    const from = new Date(to.getTime() - (days - 1) * 86400000);
    const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const rows = await attendanceApi.rows({ classId, from: iso(from), to: iso(to) });
    const byDay = new Map<string, { date: string; present: number; absent: number; late: number }>();
    for (let i = 0; i < days; i++) {
      const d = iso(new Date(from.getTime() + i * 86400000));
      byDay.set(d, { date: d, present: 0, absent: 0, late: 0 });
    }
    for (const r of rows) {
      const d = byDay.get(r.date as string);
      if (!d) continue;
      if (r.status === "present") d.present++;
      else if (r.status === "absent") d.absent++;
      else if (r.status === "late") d.late++;
    }
    return [...byDay.values()];
  },
  async audit(limit = 200) {
    const rows = must(await sb().from("audit_logs").select("*").order("created_at", { ascending: false }).limit(limit)) as
      { id: number; actor_id: string | null; action: string; entity: string; entity_id: string | null; created_at: string }[];
    const ids = [...new Set(rows.map((r) => r.actor_id).filter(Boolean))] as string[];
    const names = new Map<string, string>();
    if (ids.length) {
      const ps = must(await sb().from("user_profiles").select("id, name").in("id", ids)) as { id: string; name: string }[];
      ps.forEach((p) => names.set(p.id, p.name));
    }
    return rows.map((r) => ({ ...r, actor_name: r.actor_id ? names.get(r.actor_id) ?? null : null }));
  },
};

// ─── People (teachers / assistants) ──────────────────────────────────────────
async function invokeManageUser(body: Record<string, unknown>) {
  const { data, error } = await sb().functions.invoke("manage-user", { body });
  if (error) {
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx.json === "function") {
      try {
        const j = await ctx.json();
        if (j?.error) throw new AppError(j.error);
      } catch (e) {
        if (e instanceof AppError) throw e;
      }
    }
    throw new AppError("تعذر إتمام العملية. تأكد من نشر دالة manage-user على Supabase.");
  }
  if (data?.error) throw new AppError(data.error);
  return data as Record<string, unknown>;
}

export const peopleApi = {
  async byRole(role: "teacher" | "admin"): Promise<StaffUser[]> {
    return must(await sb().from("user_profiles").select("*").eq("role", role).order("name")) as StaffUser[];
  },
  async assistants(): Promise<StaffUser[]> {
    const as = must(await sb().from("assistants").select("*")) as Assistant[];
    if (!as.length) return [];
    const ps = must(await sb().from("user_profiles").select("*").in("id", as.map((a) => a.id)).order("name")) as Profile[];
    const byId = new Map(as.map((a) => [a.id, a]));
    return ps.map((p) => ({ ...p, assistant: byId.get(p.id) ?? null }));
  },
  create: (body: Record<string, unknown>) => invokeManageUser({ action: "create", ...body }),
  setStatus: (userId: string, active: boolean) => invokeManageUser({ action: "set_status", user_id: userId, status: active ? "active" : "disabled" }),
  resetPassword: (userId: string, password: string) => invokeManageUser({ action: "reset_password", user_id: userId, password }),
  async updateProfile(userId: string, patch: { name?: string; phone?: string; subject?: string }) {
    const clean: Record<string, unknown> = {};
    if (patch.name !== undefined) clean.name = patch.name.trim();
    if (patch.phone !== undefined) clean.phone = nn(patch.phone);
    if (patch.subject !== undefined) clean.subject = nn(patch.subject);
    const rows = must(await sb().from("user_profiles").update(clean).eq("id", userId).select("id"));
    denied(rows);
  },
  async updateAssistant(id: string, patch: Partial<Assistant>) {
    const rows = must(await sb().from("assistants").update(patch).eq("id", id).select("id"));
    denied(rows);
  },
  async myAssistant(uid: string): Promise<Assistant | null> {
    return must(await sb().from("assistants").select("*").eq("id", uid).maybeSingle()) as Assistant | null;
  },
};

// ─── Notifications ───────────────────────────────────────────────────────────
export const notificationApi = {
  list: async (limit = 100) => must(await sb().from("notifications").select("*").order("created_at", { ascending: false }).limit(limit)) as NotificationRow[],
  markRead: async (id: string) => { must(await sb().from("notifications").update({ is_read: true }).eq("id", id)); },
  markAllRead: async () => { must(await sb().from("notifications").update({ is_read: true }).eq("is_read", false)); },
  remove: async (id: string) => { must(await sb().from("notifications").delete().eq("id", id)); },
  async unreadCount(): Promise<number> {
    const { count, error } = await sb().from("notifications").select("id", { count: "exact", head: true }).eq("is_read", false);
    if (error) throw error;
    return count ?? 0;
  },
  broadcast: async (title: string, body: string, audience: string, classId?: string | null) =>
    must(await sb().rpc("broadcast", { p_title: title.trim(), p_body: body.trim(), p_audience: audience, p_class: classId ?? null })) as number,
  async sendNote(studentId: string, title: string, body: string) {
    const n = must(await sb().rpc("send_note", { p_student: studentId, p_title: title.trim(), p_body: body.trim() })) as number;
    if (n === 0) throw new AppError("لا يوجد حساب مرتبط بهذا الطالب لاستقبال الإشعار. اطلب من ولي الأمر إنشاء حساب.");
    return n;
  },
};

// ─── Chat ────────────────────────────────────────────────────────────────────
export const chatApi = {
  async contacts(myRole: string, myId: string): Promise<ChatContact[]> {
    const out = new Map<string, ChatContact>();
    if (myRole === "parent" || myRole === "student") {
      const classes = must(await sb().from("classes").select("name, teacher_id, user_profiles(name, phone)")) as unknown as
        { name: string; teacher_id: string | null; user_profiles: { name: string; phone: string | null } | null }[];
      for (const c of classes) {
        if (!c.teacher_id || !c.user_profiles) continue;
        out.set(c.teacher_id, { id: c.teacher_id, name: c.user_profiles.name, phone: c.user_profiles.phone, subtitle: `مدرس ${c.name}` });
      }
      const admins = must(await sb().from("user_profiles").select("id, name, phone").eq("role", "admin")) as { id: string; name: string; phone: string | null }[];
      for (const a of admins) out.set(a.id, { id: a.id, name: a.name || "الإدارة", phone: a.phone, subtitle: "إدارة المركز" });
    } else {
      const guardians = await fetchAll<{ parent_id: string; student_id: string; user_profiles: { name: string; phone: string | null } | null; students: { name: string } | null }>((f, t) =>
        sb().from("guardians").select("parent_id, student_id, user_profiles(name, phone), students(name)").range(f, t) as never);
      for (const g of guardians) {
        const prev = out.get(g.parent_id);
        out.set(g.parent_id, {
          id: g.parent_id, name: g.user_profiles?.name ?? "", phone: g.user_profiles?.phone, studentId: g.student_id,
          subtitle: prev ? `${prev.subtitle} + ${g.students?.name ?? ""}` : `ولي أمر ${g.students?.name ?? ""}`,
        });
      }
      const students = await fetchAll<{ id: string; name: string; user_id: string }>((f, t) =>
        sb().from("students").select("id, name, user_id").not("user_id", "is", null).range(f, t) as never);
      for (const s of students) if (!out.has(s.user_id)) out.set(s.user_id, { id: s.user_id, name: s.name, studentId: s.id, subtitle: "الطالب" });
      if (myRole === "admin") {
        const staff = must(await sb().from("user_profiles").select("id, name, phone, role").in("role", ["teacher", "assistant"])) as { id: string; name: string; phone: string | null; role: string }[];
        for (const t of staff) out.set(t.id, { id: t.id, name: t.name, phone: t.phone, subtitle: t.role === "teacher" ? "مدرس" : "مساعد" });
      }
    }
    out.delete(myId);
    return [...out.values()].sort((a, b) => a.name.localeCompare(b.name, "ar"));
  },
  async conversations(myRole: string, myId: string) {
    const msgs = must(await sb().from("messages").select("*").or(`sender_id.eq.${myId},recipient_id.eq.${myId}`).order("created_at", { ascending: false }).limit(500)) as MessageRow[];
    const last = new Map<string, MessageRow>();
    const unread = new Map<string, number>();
    for (const m of msgs) {
      const other = m.sender_id === myId ? m.recipient_id : m.sender_id;
      if (!last.has(other)) last.set(other, m);
      if (m.recipient_id === myId && !m.read_at) unread.set(other, (unread.get(other) ?? 0) + 1);
    }
    const contacts = await chatApi.contacts(myRole, myId);
    const known = new Map(contacts.map((c) => [c.id, c]));
    const missing = [...last.keys()].filter((id) => !known.has(id));
    if (missing.length) {
      const ps = must(await sb().from("user_profiles").select("id, name, phone").in("id", missing)) as { id: string; name: string; phone: string | null }[];
      ps.forEach((p) => known.set(p.id, { id: p.id, name: p.name, phone: p.phone }));
    }
    const convs = [...last.entries()].map(([id, m]) => ({ contact: known.get(id) ?? { id, name: "مستخدم" }, last: m, unread: unread.get(id) ?? 0 }));
    return { conversations: convs, contacts };
  },
  async thread(myId: string, otherId: string): Promise<MessageRow[]> {
    return must(await sb().from("messages").select("*")
      .or(`and(sender_id.eq.${myId},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${myId})`)
      .order("created_at").limit(300)) as MessageRow[];
  },
  async send(myId: string, recipientId: string, body: string, studentId?: string | null) {
    const text = body.trim();
    if (!text) return;
    must(await sb().from("messages").insert({ sender_id: myId, recipient_id: recipientId, body: text, student_id: studentId ?? null }));
  },
  async markRead(myId: string, otherId: string) {
    await sb().from("messages").update({ read_at: new Date().toISOString() }).eq("recipient_id", myId).eq("sender_id", otherId).is("read_at", null);
  },
  async all(limit = 200) {
    const msgs = must(await sb().from("messages").select("*").order("created_at", { ascending: false }).limit(limit)) as MessageRow[];
    if (!msgs.length) return [];
    const ids = [...new Set(msgs.flatMap((m) => [m.sender_id, m.recipient_id]))];
    const ps = must(await sb().from("user_profiles").select("id, name, role").in("id", ids)) as { id: string; name: string; role: string }[];
    const byId = new Map(ps.map((p) => [p.id, p]));
    return msgs.map((m) => ({ ...m, sender_name: byId.get(m.sender_id)?.name ?? "", sender_role: byId.get(m.sender_id)?.role ?? "", recipient_name: byId.get(m.recipient_id)?.name ?? "" }));
  },
};
