/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * In-browser stand-in for Supabase, used when the real project is unreachable.
 * Implements the subset of supabase-js the site uses (query builder with embeds and
 * filters, RPCs, auth, edge function) on top of the seed data, with simple
 * per-role visibility that mirrors the Row Level Security rules.
 * Data is kept in localStorage so changes survive reloads.
 */
import { buildSeed, uid, type DB, type Row } from "./seed";

const STORE = "manara-demo-db-v2";
const SESSION = "manara-demo-session";

let db: DB | null = null;
function data(): DB {
  if (db) return db;
  try {
    const raw = localStorage.getItem(STORE);
    if (raw) db = JSON.parse(raw);
  } catch {}
  if (!db) db = buildSeed();
  return db!;
}
let saveTimer: ReturnType<typeof setTimeout> | null = null;
function save() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    try { localStorage.setItem(STORE, JSON.stringify(db)); } catch {}
  }, 150);
}
export function resetDemo() {
  db = buildSeed();
  try { localStorage.setItem(STORE, JSON.stringify(db)); } catch {}
}
const T = (name: string): Row[] => (data()[name] ??= []);
const now = () => new Date().toISOString();
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
class PgError extends Error { constructor(public code: string, message: string) { super(message); } }

// ─── Session / role context ──────────────────────────────────────────────────
function sessionUid(): string | null {
  try { return localStorage.getItem(SESSION); } catch { return null; }
}
function me() {
  const id = sessionUid();
  return id ? (T("user_profiles").find((p) => p.id === id) ?? null) : null;
}
interface Ctx { role: string; uid: string; classes: Set<string>; students: Set<string> }
function ctx(): Ctx | null {
  const p = me();
  if (!p) return null;
  const role = String(p.role);
  const uidv = String(p.id);
  const classes = new Set<string>();
  const students = new Set<string>();
  if (role === "teacher" || role === "assistant") {
    const teacher = role === "teacher" ? uidv : String(T("assistants").find((a) => a.id === uidv)?.teacher_id ?? "");
    T("classes").filter((c) => c.teacher_id === teacher).forEach((c) => classes.add(String(c.id)));
    T("enrollments").filter((e) => classes.has(String(e.class_id))).forEach((e) => students.add(String(e.student_id)));
    T("students").filter((s) => s.created_by === uidv).forEach((s) => students.add(String(s.id)));
  } else if (role === "student") {
    T("students").filter((s) => s.user_id === uidv).forEach((s) => students.add(String(s.id)));
  } else if (role === "parent") {
    T("guardians").filter((g) => g.parent_id === uidv).forEach((g) => students.add(String(g.student_id)));
  }
  if (role === "student" || role === "parent") {
    T("enrollments").filter((e) => students.has(String(e.student_id))).forEach((e) => classes.add(String(e.class_id)));
  }
  return { role, uid: uidv, classes, students };
}
const isStaff = (r: string) => r === "admin" || r === "teacher" || r === "assistant";

function visible(table: string, row: Row, c: Ctx | null): boolean {
  if (table === "app_settings") return true;
  if (!c) return false;
  if (c.role === "admin") return true;
  const staff = isStaff(c.role);
  const cls = (id: unknown) => c.classes.has(String(id));
  const stu = (id: unknown) => c.students.has(String(id));
  const examOf = (id: unknown) => T("exams").find((e) => e.id === id);
  switch (table) {
    case "user_profiles": return staff || row.id === c.uid || ["admin", "teacher", "assistant"].includes(String(row.role));
    case "assistants": return row.id === c.uid || row.teacher_id === c.uid;
    case "classes": return cls(row.id);
    case "class_schedule": return cls(row.class_id);
    case "enrollments": return staff ? cls(row.class_id) : stu(row.student_id);
    case "students": return stu(row.id);
    case "guardians": return row.parent_id === c.uid || stu(row.student_id);
    case "attendance_records": return staff ? cls(row.class_id) : stu(row.student_id);
    case "exams": return cls(row.class_id) && (staff || !!row.is_published);
    case "grades": { const e = examOf(row.exam_id); return !!e && cls(e.class_id) && (staff || (stu(row.student_id) && !!e.is_published)); }
    case "courses": return cls(row.class_id) && (staff || !!row.is_published);
    case "lessons": { const co = T("courses").find((x) => x.id === row.course_id); return !!co && visible("courses", co, c); }
    case "lesson_progress": return stu(row.student_id);
    case "payments": return stu(row.student_id);
    case "notifications": return row.user_id === c.uid;
    case "messages": return row.sender_id === c.uid || row.recipient_id === c.uid;
    case "announcements": return true;
    case "achievements": return stu(row.student_id);
    case "quizzes": { const e = examOf(row.exam_id); return cls(row.class_id) && (staff || !!e?.is_published); }
    case "quiz_questions": return staff;
    case "quiz_attempts": return staff || stu(row.student_id);
    case "qr_sessions": return staff;
    case "audit_logs": return false;
    case "student_summary": return stu(row.student_id);
    default: return staff;
  }
}

// ─── Computed view ───────────────────────────────────────────────────────────
function studentSummary(): Row[] {
  const att = T("attendance_records");
  const grades = T("grades");
  const exams = new Map(T("exams").map((e) => [e.id, e]));
  const pays = T("payments");
  return T("students").map((s) => {
    const a = att.filter((x) => x.student_id === s.id);
    const c = { present: 0, absent: 0, late: 0, excused: 0 } as Record<string, number>;
    a.forEach((x) => c[String(x.status)]++);
    const total = c.present + c.absent + c.late;
    const g = grades.filter((x) => x.student_id === s.id && exams.get(x.exam_id));
    const avg = g.length ? Math.round((g.reduce((acc, x) => acc + (100 * Number(x.score)) / Number(exams.get(x.exam_id)!.max_score), 0) / g.length) * 10) / 10 : null;
    return {
      student_id: s.id, present_count: c.present, absent_count: c.absent, late_count: c.late, excused_count: c.excused, total_sessions: total,
      attendance_pct: total ? Math.round((1000 * (c.present + c.late)) / total) / 10 : null, avg_percent: avg,
      total_paid: pays.filter((p) => p.student_id === s.id).reduce((acc, p) => acc + Number(p.amount), 0),
      is_overdue: !!s.subscription_end && String(s.subscription_end) < today(),
    };
  });
}
const rowsOf = (table: string): Row[] => (table === "student_summary" ? studentSummary() : T(table));

// ─── Relationships for embedded selects ──────────────────────────────────────
const M2O: Record<string, Record<string, string>> = {
  enrollments: { classes: "class_id", students: "student_id" },
  classes: { user_profiles: "teacher_id" },
  courses: { user_profiles: "teacher_id", classes: "class_id" },
  exams: { classes: "class_id" },
  payments: { students: "student_id", classes: "class_id", user_profiles: "received_by" },
  attendance_records: { students: "student_id", classes: "class_id" },
  guardians: { user_profiles: "parent_id", students: "student_id" },
  quizzes: { exams: "exam_id", classes: "class_id" },
  quiz_attempts: { students: "student_id" },
  grades: { exams: "exam_id", students: "student_id" },
};
const O2M: Record<string, Record<string, string>> = {
  students: { enrollments: "student_id" },
  classes: { class_schedule: "class_id", enrollments: "class_id" },
  courses: { lessons: "course_id" },
};
// Deleting a row removes its dependants (ON DELETE CASCADE).
const CASCADE: Record<string, [string, string][]> = {
  students: [["enrollments", "student_id"], ["guardians", "student_id"], ["attendance_records", "student_id"], ["grades", "student_id"], ["lesson_progress", "student_id"], ["payments", "student_id"], ["achievements", "student_id"], ["quiz_attempts", "student_id"]],
  classes: [["class_schedule", "class_id"], ["enrollments", "class_id"], ["attendance_records", "class_id"], ["exams", "class_id"], ["courses", "class_id"], ["quizzes", "class_id"]],
  exams: [["grades", "exam_id"], ["quizzes", "exam_id"]],
  quizzes: [["quiz_questions", "quiz_id"], ["quiz_attempts", "quiz_id"]],
  courses: [["lessons", "course_id"]],
  lessons: [["lesson_progress", "lesson_id"]],
};
function removeWhere(table: string, pred: (r: Row) => boolean) {
  const rows = T(table);
  const gone = rows.filter(pred);
  data()[table] = rows.filter((r) => !pred(r));
  for (const g of gone) for (const [child, fk] of CASCADE[table] ?? []) removeWhere(child, (r) => r[fk] === g.id);
  return gone;
}

interface Sel { all: boolean; cols: string[]; embeds: { name: string; inner: boolean; sub: Sel | "count" }[] }
function splitTop(s: string): string[] {
  const out: string[] = [];
  let depth = 0, cur = "";
  for (const ch of s) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) { out.push(cur.trim()); cur = ""; } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}
function parseSel(s: string): Sel {
  const sel: Sel = { all: false, cols: [], embeds: [] };
  for (const tok of splitTop(s || "*")) {
    if (tok === "*") { sel.all = true; continue; }
    const m = tok.match(/^([\w]+)(!inner)?\(([\s\S]*)\)$/);
    if (m) sel.embeds.push({ name: m[1], inner: !!m[2], sub: m[3].trim() === "count" ? "count" : parseSel(m[3]) });
    else sel.cols.push(tok);
  }
  return sel;
}

type Pred = (r: Row) => boolean;
const val = (r: Row, c: string) => r[c];
const same = (a: unknown, b: unknown) => (a === null || a === undefined ? b === null || b === undefined : String(a) === String(b));

function project(table: string, row: Row, sel: Sel, emb: Map<string, Pred[]>, c: Ctx | null): Row | null {
  const out: Row = sel.all ? { ...row } : Object.fromEntries(sel.cols.map((k) => [k, row[k]]));
  for (const e of sel.embeds) {
    const preds = emb.get(e.name) ?? [];
    const m2o = M2O[table]?.[e.name];
    const o2m = O2M[table]?.[e.name];
    if (m2o) {
      const target = rowsOf(e.name).find((x) => same(x.id, row[m2o]));
      const ok = target && preds.every((p) => p(target)) && (e.name === "user_profiles" || e.name === "classes" || e.name === "exams" || visible(e.name, target, c));
      if (!ok) { if (e.inner) return null; out[e.name] = null; continue; }
      out[e.name] = e.sub === "count" ? { count: 1 } : project(e.name, target!, e.sub, new Map(), c);
    } else if (o2m) {
      const list = rowsOf(e.name).filter((x) => same(x[o2m], row.id) && preds.every((p) => p(x)));
      if (e.inner && !list.length) return null;
      out[e.name] = e.sub === "count" ? [{ count: list.length }] : list.map((x) => project(e.name, x, e.sub as Sel, new Map(), c));
    } else out[e.name] = null;
  }
  return out;
}

// ─── Triggers ────────────────────────────────────────────────────────────────
function notifyStudentFamily(studentId: unknown, title: string, body: string, type: string, extra: Row = {}) {
  const users = new Set<string>();
  T("guardians").filter((g) => g.student_id === studentId).forEach((g) => users.add(String(g.parent_id)));
  const s = T("students").find((x) => x.id === studentId);
  if (s?.user_id) users.add(String(s.user_id));
  for (const u of users) T("notifications").push({ id: uid(), user_id: u, title, body, type, data: extra, is_read: false, created_at: now() });
  return users.size;
}
const DEFAULTS: Record<string, () => Row> = {
  students: () => ({ status: "active", grade: "", notes: null, photo_url: null, user_id: null, subscription_end: null, created_at: now() }),
  classes: () => ({ is_active: true, monthly_fee: 0, grade: "", capacity: null, created_at: now() }),
  exams: () => ({ is_published: true, kind: "exam", max_score: 10, created_at: now() }),
  courses: () => ({ is_published: true, icon: "📚", color: 4285879295, created_at: now() }),
  lessons: () => ({ is_locked: false, duration_seconds: 0, position: 0, created_at: now() }),
  notifications: () => ({ is_read: false, type: "general", data: {}, created_at: now() }),
  payments: () => ({ method: "cash", kind: "subscription", paid_at: now() }),
  attendance_records: () => ({ method: "manual", recorded_at: now() }),
  grades: () => ({ updated_at: now(), remarks: null }),
  messages: () => ({ read_at: null, created_at: now() }),
  achievements: () => ({ awarded_at: now(), emoji: "🏆", color: 4285879295 }),
  enrollments: () => ({ enrolled_at: now() }),
  quiz_questions: () => ({ created_at: now(), points: 1 }),
};
const NO_ID = new Set(["enrollments", "guardians", "lesson_progress", "app_settings"]);

function beforeInsert(table: string, r: Row) {
  const u = sessionUid();
  if (table === "attendance_records" || table === "exams") r.teacher_id ??= u;
  if (table === "payments") r.received_by = u;
  if (table === "students") {
    r.created_by = u;
    if (T("students").some((s) => String(s.student_code).toUpperCase() === String(r.student_code).toUpperCase())) throw new PgError("23505", "duplicate key value violates unique constraint students_student_code_key");
  }
  if (table === "achievements") r.awarded_by = u;
}
function afterWrite(table: string, r: Row, prev?: Row) {
  if (table === "attendance_records" && (r.status === "absent" || r.status === "late") && prev?.status !== r.status) {
    const s = T("students").find((x) => x.id === r.student_id);
    const c = T("classes").find((x) => x.id === r.class_id);
    const word = r.status === "absent" ? "غياب" : "تأخر";
    notifyStudentFamily(r.student_id, `${word}: ${s?.name ?? ""}`, `تم تسجيل ${word} ${s?.name ?? ""} عن ${c?.name ?? "الحصة"} بتاريخ ${r.date}${r.note ? `\nملاحظة: ${r.note}` : ""}`, "absence");
  }
  if (table === "grades" && prev?.score !== r.score) {
    const e = T("exams").find((x) => x.id === r.exam_id);
    const s = T("students").find((x) => x.id === r.student_id);
    if (e?.is_published) notifyStudentFamily(r.student_id, `درجة جديدة: ${e.title}`, `${s?.name ?? ""} حصل على ${r.score} من ${e.max_score}`, "grade");
  }
  if (table === "quiz_questions") syncQuiz(String(r.quiz_id));
}
function syncQuiz(quizId: string) {
  const q = T("quizzes").find((x) => x.id === quizId);
  if (!q) return;
  const qs = T("quiz_questions").filter((x) => x.quiz_id === quizId);
  const e = T("exams").find((x) => x.id === q.exam_id);
  if (e) { e.question_count = qs.length; const sum = qs.reduce((a, x) => a + Number(x.points), 0); if (sum > 0) e.max_score = sum; }
}

// ─── Query builder ───────────────────────────────────────────────────────────
type Res = { data: any; error: any; count?: number | null };

class Query implements PromiseLike<Res> {
  private op: "select" | "insert" | "update" | "delete" | "upsert" = "select";
  private sel = "*";
  private returning = false;
  private head = false;
  private wantCount = false;
  private filters: Pred[] = [];
  private emb = new Map<string, Pred[]>();
  private orders: { col: string; asc: boolean }[] = [];
  private lim: number | null = null;
  private range_: [number, number] | null = null;
  private one: "single" | "maybe" | null = null;
  private values: Row[] = [];
  private patch: Row = {};
  private conflict: string[] = [];

  constructor(private table: string) {}

  select(s = "*", opts?: { count?: string; head?: boolean }) {
    if (this.op === "select") this.sel = s; else { this.returning = true; this.sel = s; }
    if (opts?.count) this.wantCount = true;
    if (opts?.head) this.head = true;
    return this;
  }
  insert(v: Row | Row[]) { this.op = "insert"; this.values = Array.isArray(v) ? v : [v]; return this; }
  upsert(v: Row | Row[], o?: { onConflict?: string }) { this.op = "upsert"; this.values = Array.isArray(v) ? v : [v]; this.conflict = (o?.onConflict ?? "id").split(","); return this; }
  update(v: Row) { this.op = "update"; this.patch = v; return this; }
  delete() { this.op = "delete"; return this; }

  private add(col: string, p: (v: unknown, r: Row) => boolean) {
    const dot = col.indexOf(".");
    if (dot > 0) {
      const rel = col.slice(0, dot), c = col.slice(dot + 1);
      const arr = this.emb.get(rel) ?? [];
      arr.push((r) => p(val(r, c), r));
      this.emb.set(rel, arr);
    } else this.filters.push((r) => p(val(r, col), r));
    return this;
  }
  eq(c: string, v: unknown) { return this.add(c, (x) => same(x, v)); }
  neq(c: string, v: unknown) { return this.add(c, (x) => !same(x, v)); }
  gt(c: string, v: unknown) { return this.add(c, (x) => x != null && String(x) > String(v)); }
  gte(c: string, v: unknown) { return this.add(c, (x) => x != null && (typeof v === "number" ? Number(x) >= v : String(x) >= String(v))); }
  lt(c: string, v: unknown) { return this.add(c, (x) => x != null && String(x) < String(v)); }
  lte(c: string, v: unknown) { return this.add(c, (x) => x != null && String(x) <= String(v)); }
  in(c: string, v: unknown[]) { const s = new Set(v.map(String)); return this.add(c, (x) => s.has(String(x))); }
  is(c: string, v: unknown) { return this.add(c, (x) => (v === null ? x == null : x === v)); }
  ilike(c: string, v: string) { const re = new RegExp("^" + v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/%/g, ".*") + "$", "i"); return this.add(c, (x) => re.test(String(x ?? ""))); }
  not(c: string, opr: string, v: unknown) {
    if (opr === "is") return this.add(c, (x) => (v === null ? x != null : x !== v));
    return this.add(c, (x) => !same(x, v));
  }
  or(expr: string) {
    const parse = (s: string): Pred => {
      const parts = splitTop(s);
      const preds = parts.map((p): Pred => {
        const m = p.match(/^and\((.*)\)$/);
        if (m) { const inner = splitTop(m[1]).map((q) => parse(q)); return (r) => inner.every((f) => f(r)); }
        const [col, opr, ...rest] = p.split(".");
        const v = rest.join(".");
        if (opr === "eq") return (r) => same(r[col], v);
        if (opr === "ilike") { const re = new RegExp(v.replace(/%/g, ".*"), "i"); return (r) => re.test(String(r[col] ?? "")); }
        if (opr === "is") return (r) => (v === "null" ? r[col] == null : String(r[col]) === v);
        return () => false;
      });
      return (r) => preds.some((f) => f(r));
    };
    this.filters.push(parse(expr));
    return this;
  }
  order(col: string, o?: { ascending?: boolean }) { this.orders.push({ col, asc: o?.ascending !== false }); return this; }
  limit(n: number) { this.lim = n; return this; }
  range(a: number, b: number) { this.range_ = [a, b]; return this; }
  single() { this.one = "single"; return this; }
  maybeSingle() { this.one = "maybe"; return this; }

  then<A = Res, B = never>(ok?: ((v: Res) => A | PromiseLike<A>) | null, bad?: ((e: unknown) => B | PromiseLike<B>) | null): PromiseLike<A | B> {
    let res: Res;
    try { res = this.run(); } catch (e) {
      const err = e instanceof PgError ? { code: e.code, message: e.message, details: e.message } : { message: String((e as Error)?.message ?? e) };
      res = { data: null, error: err };
    }
    return Promise.resolve(res).then(ok, bad);
  }

  private match(c: Ctx | null) {
    return rowsOf(this.table).filter((r) => visible(this.table, r, c) && this.filters.every((f) => f(r)));
  }

  private run(): Res {
    const c = ctx();
    const sel = parseSel(this.sel);
    let rows: Row[];
    if (this.op === "select") {
      rows = this.match(c);
    } else if (this.op === "insert" || this.op === "upsert") {
      rows = [];
      for (const v0 of this.values) {
        const v = { ...v0 };
        if (this.op === "upsert") {
          const ex = T(this.table).find((r) => this.conflict.every((k) => same(r[k], v[k])));
          if (ex) {
            const prev = { ...ex };
            Object.assign(ex, v);
            if (this.table === "grades") ex.updated_at = now();
            afterWrite(this.table, ex, prev);
            rows.push(ex);
            continue;
          }
        }
        const row: Row = { ...(DEFAULTS[this.table]?.() ?? {}), ...(NO_ID.has(this.table) ? {} : { id: uid() }), ...v };
        beforeInsert(this.table, row);
        T(this.table).push(row);
        afterWrite(this.table, row);
        rows.push(row);
      }
      save();
    } else if (this.op === "update") {
      rows = this.match(c);
      for (const r of rows) {
        const prev = { ...r };
        Object.assign(r, this.patch);
        if (this.table === "grades") r.updated_at = now();
        afterWrite(this.table, r, prev);
      }
      save();
    } else {
      const victims = new Set(this.match(c));
      rows = removeWhere(this.table, (r) => victims.has(r));
      if (this.table === "quiz_questions") rows.forEach((r) => syncQuiz(String(r.quiz_id)));
      save();
      if (!this.returning) return { data: null, error: null };
    }
    if (this.op !== "select" && !this.returning) return { data: null, error: null };

    let out = rows.map((r) => project(this.table, r, sel, this.emb, c)).filter(Boolean) as Row[];
    for (const o of [...this.orders].reverse()) {
      out = [...out].sort((a, b) => {
        const x = a[o.col], y = b[o.col];
        if (x == null && y == null) return 0;
        if (x == null) return 1;
        if (y == null) return -1;
        const cmp = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "ar");
        return o.asc ? cmp : -cmp;
      });
    }
    const count = out.length;
    if (this.range_) out = out.slice(this.range_[0], this.range_[1] + 1);
    if (this.lim != null) out = out.slice(0, this.lim);
    if (this.head) return { data: null, error: null, count };
    if (this.one) {
      if (!out.length) return this.one === "maybe" ? { data: null, error: null } : { data: null, error: { code: "PGRST116", message: "not found" } };
      return { data: out[0], error: null };
    }
    return { data: out, error: null, count: this.wantCount ? count : null };
  }
}

// ─── RPC functions ───────────────────────────────────────────────────────────
const nextCode = () => {
  const nums = T("students").map((s) => Number(String(s.student_code).replace(/\D/g, ""))).filter(Number.isFinite);
  return `S${Math.max(1000, ...nums) + 1}`;
};
const tail10 = (p: unknown) => String(p ?? "").replace(/\D/g, "").slice(-10);

function quizPayload(attemptId: string) {
  const a = T("quiz_attempts").find((x) => x.id === attemptId)!;
  const q = T("quizzes").find((x) => x.id === a.quiz_id)!;
  const e = T("exams").find((x) => x.id === q.exam_id)!;
  const order = a.question_order as string[];
  const qs = T("quiz_questions").filter((x) => x.quiz_id === q.id).sort((x, y) => order.indexOf(String(x.id)) - order.indexOf(String(y.id)));
  return {
    attempt_id: a.id, attempt_no: a.attempt_no, title: e.title, description: q.description, duration_minutes: q.duration_minutes,
    deadline: a.deadline, server_now: now(), max_attempts: q.max_attempts, max_score: e.max_score,
    questions: qs.map((x) => ({ id: x.id, kind: x.kind, body: x.body, options: x.options, points: x.points })),
  };
}
function finishAttempt(attemptId: string, answers: Record<string, number>, zero: boolean) {
  const a = T("quiz_attempts").find((x) => x.id === attemptId)!;
  const q = T("quizzes").find((x) => x.id === a.quiz_id)!;
  const e = T("exams").find((x) => x.id === q.exam_id)!;
  const qs = T("quiz_questions").filter((x) => x.quiz_id === q.id).sort((x, y) => Number(x.position) - Number(y.position));
  const score = zero ? 0 : qs.reduce((s, x) => s + (Number(answers[String(x.id)]) === Number(x.correct_index) && answers[String(x.id)] !== undefined ? Number(x.points) : 0), 0);
  Object.assign(a, { submitted_at: now(), score, max_score: e.max_score, answers: zero ? {} : answers });
  const g = T("grades").find((x) => x.exam_id === e.id && x.student_id === a.student_id);
  if (g) { if (score > Number(g.score)) { const prev = { ...g }; g.score = score; g.updated_at = now(); afterWrite("grades", g, prev); } }
  else { const row = { id: uid(), exam_id: e.id, student_id: a.student_id, score, remarks: null, updated_at: now() }; T("grades").push(row); afterWrite("grades", row); }
  const used = T("quiz_attempts").filter((x) => x.quiz_id === q.id && x.student_id === a.student_id).length;
  save();
  return {
    score, max_score: e.max_score, percent: Number(e.max_score) > 0 ? Math.round((1000 * score) / Number(e.max_score)) / 10 : 0,
    attempts_left: Math.max(0, Number(q.max_attempts) - used),
    review: q.show_answers && !zero ? qs.map((x) => {
      const ch = answers[String(x.id)];
      return { question_id: x.id, body: x.body, options: x.options, chosen: ch ?? null, correct_index: x.correct_index, correct: ch !== undefined && Number(ch) === Number(x.correct_index), points: x.points, explanation: x.explanation };
    }) : null,
  };
}

const RPC: Record<string, (p: Row) => unknown> = {
  staff_stats() {
    const c = ctx();
    const v = (t: string) => T(t).filter((r) => visible(t, r, c));
    const pays = v("payments");
    const month = new Date(); month.setDate(1); month.setHours(0, 0, 0, 0);
    const att = v("attendance_records").filter((a) => a.date === today());
    return {
      students: v("students").filter((s) => s.status === "active").length, classes: v("classes").filter((x) => x.is_active).length,
      teachers: T("user_profiles").filter((p) => (p.role === "teacher" || p.role === "assistant") && p.status === "active").length,
      exams: v("exams").length, courses: v("courses").length,
      revenue: pays.reduce((a, p) => a + Number(p.amount), 0),
      revenue_month: pays.filter((p) => String(p.paid_at) >= month.toISOString()).reduce((a, p) => a + Number(p.amount), 0),
      present_today: att.filter((a) => a.status === "present" || a.status === "late").length, absent_today: att.filter((a) => a.status === "absent").length,
    };
  },
  leaderboard({ p_class, p_limit }) {
    const c = ctx();
    const sums = studentSummary().filter((s) => s.avg_percent != null && visible("student_summary", s, c));
    const rows = sums.filter((s) => !p_class || T("enrollments").some((e) => e.student_id === s.student_id && e.class_id === p_class)).map((s) => {
      const st = T("students").find((x) => x.id === s.student_id)!;
      const en = T("enrollments").find((e) => e.student_id === s.student_id && (!p_class || e.class_id === p_class));
      return { student_id: st.id, name: st.name, student_code: st.student_code, grade: st.grade, class_name: T("classes").find((x) => x.id === en?.class_id)?.name ?? null, avg_percent: s.avg_percent, attendance_pct: s.attendance_pct };
    }).sort((a, b) => Number(b.avg_percent) - Number(a.avg_percent) || Number(b.attendance_pct ?? 0) - Number(a.attendance_pct ?? 0));
    let rank = 0, last: unknown = null;
    return rows.slice(0, Number(p_limit) || 20).map((r, i) => { if (r.avg_percent !== last) { rank = i + 1; last = r.avg_percent; } return { ...r, rank }; });
  },
  next_student_code: () => nextCode(),
  create_student(p) {
    const code = String(p.p_code ?? "").trim() || nextCode();
    const row: Row = { ...DEFAULTS.students(), id: uid(), student_code: code.toUpperCase(), name: String(p.p_name).trim(), grade: String(p.p_grade ?? "").trim(), parent_name: p.p_parent_name || null, parent_phone: String(p.p_parent_phone).trim(), student_phone: p.p_student_phone || null };
    if (!row.name || !row.parent_phone) throw new PgError("23502", "null value");
    beforeInsert("students", row);
    T("students").push(row);
    for (const cid of (p.p_class_ids as string[]) ?? []) T("enrollments").push({ student_id: row.id, class_id: cid, enrolled_at: now() });
    save();
    return row.id;
  },
  import_students({ p_rows }) {
    let created = 0;
    const failed: Row[] = [];
    (p_rows as Row[]).forEach((r, i) => {
      try {
        RPC.create_student({ p_name: r.name, p_parent_phone: r.parent_phone, p_code: r.code, p_grade: r.grade, p_parent_name: r.parent_name, p_student_phone: r.student_phone, p_class_ids: r.class_ids });
        created++;
      } catch (e) {
        failed.push({ row: i + 1, message: e instanceof PgError && e.code === "23505" ? "كود الطالب مستخدم من قبل" : "الاسم وموبايل ولي الأمر مطلوبان" });
      }
    });
    return { created, failed };
  },
  claim_student({ p_student_code, p_phone }) {
    const p = me();
    if (!p || !["parent", "student"].includes(String(p.role))) throw new PgError("42501", "not allowed");
    const s = T("students").find((x) => String(x.student_code).toUpperCase() === String(p_student_code).trim().toUpperCase() && tail10(x.parent_phone) === tail10(p_phone));
    if (!s) throw new PgError("P0002", "الكود أو رقم ولي الأمر غير صحيح");
    if (p.role === "parent") { if (!T("guardians").some((g) => g.parent_id === p.id && g.student_id === s.id)) T("guardians").push({ parent_id: p.id, student_id: s.id, created_at: now() }); }
    else { if (s.user_id && s.user_id !== p.id) throw new PgError("P0001", "هذا الطالب مرتبط بحساب آخر"); s.user_id = p.id; }
    save();
    return s.id;
  },
  set_class_schedule({ p_class, p_slots }) {
    data().class_schedule = T("class_schedule").filter((x) => x.class_id !== p_class);
    for (const s of p_slots as Row[]) T("class_schedule").push({ id: uid(), class_id: p_class, weekday: Number(s.weekday), start_time: `${String(s.start).slice(0, 5)}:00`, end_time: `${String(s.end).slice(0, 5)}:00`, room: s.room || null });
    save();
    return null;
  },
  renew_student({ p_student, p_amount, p_method, p_months, p_class }) {
    const s = T("students").find((x) => x.id === p_student);
    if (!s) throw new PgError("P0002", "الطالب غير موجود");
    if (!(Number(p_amount) > 0)) throw new PgError("22023", "المبلغ غير صحيح");
    const base = new Date(Math.max(Date.now(), s.subscription_end ? new Date(String(s.subscription_end)).getTime() : 0));
    base.setMonth(base.getMonth() + Number(p_months || 1));
    s.subscription_end = `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, "0")}-${String(base.getDate()).padStart(2, "0")}`;
    if (s.status !== "archived") s.status = "active";
    T("payments").push({ id: uid(), student_id: s.id, class_id: p_class ?? null, amount: Number(p_amount), method: p_method || "cash", kind: "subscription", period_month: null, notes: null, received_by: sessionUid(), paid_at: now() });
    save();
    return s.subscription_end;
  },
  send_note({ p_student, p_title, p_body, p_type }) {
    const n = notifyStudentFamily(p_student, String(p_title), String(p_body), String(p_type ?? "note"));
    save();
    return n;
  },
  broadcast({ p_title, p_body, p_audience, p_class }) {
    const u = sessionUid();
    T("announcements").push({ id: uid(), title: p_title, body: p_body, audience: p_audience, class_id: p_audience === "class" ? p_class : null, created_by: u, created_at: now() });
    const targets = T("user_profiles").filter((p) => {
      if (p.id === u || p.status !== "active") return false;
      if (p_audience === "all") return true;
      if (p_audience === "teachers") return p.role === "teacher" || p.role === "assistant";
      if (p_audience === "parents") return p.role === "parent";
      if (p_audience === "students") return p.role === "student";
      const studs = T("enrollments").filter((e) => e.class_id === p_class).map((e) => e.student_id);
      return T("students").some((s) => studs.includes(s.id) && s.user_id === p.id) || T("guardians").some((g) => studs.includes(g.student_id) && g.parent_id === p.id);
    });
    for (const p of targets) T("notifications").push({ id: uid(), user_id: p.id, title: p_title, body: p_body, type: "announcement", data: {}, is_read: false, created_at: now() });
    save();
    return targets.length;
  },
  start_qr_session({ p_class, p_minutes }) {
    T("qr_sessions").forEach((s) => { if (s.class_id === p_class) s.is_active = false; });
    const id = uid();
    T("qr_sessions").push({ id, class_id: p_class, created_by: sessionUid(), started_at: now(), ends_at: new Date(Date.now() + Number(p_minutes || 90) * 60000).toISOString(), is_active: true });
    save();
    return id;
  },
  get_qr_token({ p_session }) {
    const s = T("qr_sessions").find((x) => x.id === p_session);
    if (!s?.is_active) throw new PgError("P0001", "انتهت جلسة الحضور");
    return `AP1|${s.id}|${Math.floor(Date.now() / 5000)}|demo`;
  },
  end_qr_session({ p_session }) { const s = T("qr_sessions").find((x) => x.id === p_session); if (s) s.is_active = false; save(); return null; },
  scan_qr_attendance({ p_payload }) {
    const parts = String(p_payload).split("|");
    if (parts.length !== 4 || parts[0] !== "AP1") throw new PgError("22023", "رمز QR غير صالح");
    const s = T("qr_sessions").find((x) => x.id === parts[1]);
    if (!s?.is_active) throw new PgError("P0001", "انتهت جلسة الحضور");
    const st = T("students").find((x) => x.user_id === sessionUid());
    if (!st) throw new PgError("P0002", "حسابك غير مرتبط بطالب");
    if (!T("enrollments").some((e) => e.student_id === st.id && e.class_id === s.class_id)) throw new PgError("42501", "أنت غير مسجل في هذه المجموعة");
    let rec = T("attendance_records").find((a) => a.student_id === st.id && a.class_id === s.class_id && a.date === today());
    if (!rec) { rec = { id: uid(), student_id: st.id, class_id: s.class_id, teacher_id: s.created_by, date: today(), status: "present", method: "dynamic_qr", note: null, recorded_at: now() }; T("attendance_records").push(rec); }
    save();
    return { status: rec.status, class_name: T("classes").find((x) => x.id === s.class_id)?.name, student_name: st.name };
  },
  create_quiz(p) {
    const examId = uid(), quizId = uid();
    T("exams").push({ ...DEFAULTS.exams(), id: examId, title: String(p.p_title).trim(), kind: "quiz", max_score: 1, class_id: p.p_class, teacher_id: sessionUid(), exam_date: null, exam_time: null, duration_minutes: p.p_duration ?? null, question_count: 0, is_published: false });
    T("quizzes").push({ id: quizId, exam_id: examId, class_id: p.p_class, description: p.p_description ?? null, duration_minutes: p.p_duration ?? null, available_from: p.p_from ?? null, available_until: p.p_until ?? null, max_attempts: p.p_max_attempts ?? 1, shuffle_questions: !!p.p_shuffle, show_answers: p.p_show_answers !== false, notified_at: null, created_at: now() });
    save();
    return quizId;
  },
  update_quiz(p) {
    const q = T("quizzes").find((x) => x.id === p.p_quiz);
    if (!q) throw new PgError("42501", "الكويز غير موجود أو غير مصرح لك");
    Object.assign(q, { description: p.p_description ?? null, duration_minutes: p.p_duration ?? null, available_from: p.p_from ?? null, available_until: p.p_until ?? null, max_attempts: p.p_max_attempts ?? 1, shuffle_questions: !!p.p_shuffle, show_answers: p.p_show_answers !== false });
    const e = T("exams").find((x) => x.id === q.exam_id);
    if (e) e.title = String(p.p_title).trim();
    save();
    return null;
  },
  publish_quiz({ p_quiz, p_publish }) {
    const q = T("quizzes").find((x) => x.id === p_quiz)!;
    if (p_publish && !T("quiz_questions").some((x) => x.quiz_id === p_quiz)) throw new PgError("22023", "أضف سؤالاً واحداً على الأقل قبل النشر");
    const e = T("exams").find((x) => x.id === q.exam_id)!;
    e.is_published = !!p_publish;
    let n = 0;
    if (p_publish && !q.notified_at) {
      for (const en of T("enrollments").filter((x) => x.class_id === q.class_id)) n += notifyStudentFamily(en.student_id, `كويز جديد: ${e.title}`, "تم إتاحة كويز جديد", "exam");
      q.notified_at = now();
    }
    save();
    return n;
  },
  start_quiz_attempt({ p_quiz }) {
    const st = T("students").find((x) => x.user_id === sessionUid());
    if (!st) throw new PgError("P0002", "حسابك غير مرتبط بطالب");
    const q = T("quizzes").find((x) => x.id === p_quiz);
    if (!q) throw new PgError("P0002", "الكويز غير موجود");
    const e = T("exams").find((x) => x.id === q.exam_id)!;
    if (!e.is_published) throw new PgError("42501", "الكويز غير متاح لك");
    if (q.available_until && Date.now() > new Date(String(q.available_until)).getTime()) throw new PgError("P0001", "انتهى وقت الكويز");
    const open = T("quiz_attempts").find((a) => a.quiz_id === p_quiz && a.student_id === st.id && !a.submitted_at);
    if (open) return quizPayload(String(open.id));
    const used = T("quiz_attempts").filter((a) => a.quiz_id === p_quiz && a.student_id === st.id).length;
    if (used >= Number(q.max_attempts)) throw new PgError("P0001", "استنفدت عدد المحاولات المسموحة");
    const qs = T("quiz_questions").filter((x) => x.quiz_id === p_quiz).sort((x, y) => Number(x.position) - Number(y.position));
    if (!qs.length) throw new PgError("P0001", "الكويز لا يحتوي على أسئلة");
    const order = qs.map((x) => String(x.id));
    if (q.shuffle_questions) order.sort(() => Math.random() - 0.5);
    const id = uid();
    T("quiz_attempts").push({ id, quiz_id: p_quiz, student_id: st.id, attempt_no: used + 1, started_at: now(), deadline: q.duration_minutes ? new Date(Date.now() + Number(q.duration_minutes) * 60000).toISOString() : (q.available_until ?? null), question_order: order, submitted_at: null, score: null, max_score: null, answers: {} });
    save();
    return quizPayload(id);
  },
  submit_quiz_attempt({ p_attempt, p_answers }) {
    const a = T("quiz_attempts").find((x) => x.id === p_attempt);
    if (!a) throw new PgError("42501", "not allowed");
    if (a.submitted_at) throw new PgError("P0001", "تم تسليم هذه المحاولة من قبل");
    const late = !!a.deadline && Date.now() > new Date(String(a.deadline)).getTime() + 60000;
    return { ...finishAttempt(String(p_attempt), (p_answers as Record<string, number>) ?? {}, late), late };
  },
  public_catalog() {
    const s = T("app_settings")[0];
    const courses = T("courses").filter((c) => c.is_published).map((c) => {
      const cl = T("classes").find((x) => x.id === c.class_id);
      if (!cl?.is_active) return null;
      return {
        id: c.id, title: c.title, description: c.description, icon: c.icon, color: c.color, created_at: c.created_at,
        class_name: cl.name, grade: cl.grade, subject: cl.subject, monthly_fee: cl.monthly_fee,
        teacher: T("user_profiles").find((p) => p.id === c.teacher_id)?.name ?? null,
        lessons: T("lessons").filter((l) => l.course_id === c.id).sort((x, y) => Number(x.position) - Number(y.position))
          .map((l) => ({ id: l.id, title: l.title, duration_seconds: l.duration_seconds, position: l.position, is_locked: l.is_locked, has_video: !!l.video_url })),
      };
    }).filter(Boolean).sort((a, b) => String(b!.created_at).localeCompare(String(a!.created_at)));
    return { center: { name: s.center_name, logo_url: s.logo_url, contact_phone: s.contact_phone, currency: s.currency }, courses };
  },
};

// ─── Auth ────────────────────────────────────────────────────────────────────
type Listener = (event: string, session: unknown) => void;
const listeners = new Set<Listener>();
function userObj(id: string) {
  const u = T("auth_users").find((x) => x.id === id);
  return u ? { id: u.id, email: u.email, user_metadata: u.user_metadata ?? {}, identities: [{}] } : null;
}
function session() {
  const id = sessionUid();
  const user = id ? userObj(id) : null;
  return user ? { user, access_token: "demo" } : null;
}
function setSession(id: string | null) {
  try { if (id) localStorage.setItem(SESSION, id); else localStorage.removeItem(SESSION); } catch {}
  const s = session();
  listeners.forEach((l) => l(id ? "SIGNED_IN" : "SIGNED_OUT", s));
}
const err = (message: string, status = 400) => ({ message, status, name: "AuthApiError" });

const auth = {
  async getSession() { return { data: { session: session() }, error: null }; },
  async getUser() { const s = session(); return { data: { user: s?.user ?? null }, error: null }; },
  async signInWithPassword({ email, password }: { email: string; password: string }) {
    const u = T("auth_users").find((x) => String(x.email).toLowerCase() === email.toLowerCase());
    if (!u || u.password !== password) return { data: { user: null, session: null }, error: err("Invalid login credentials") };
    const p = T("user_profiles").find((x) => x.id === u.id);
    if (p?.status !== "active") return { data: { user: null, session: null }, error: err("User is banned") };
    setSession(String(u.id));
    return { data: { user: userObj(String(u.id)), session: session() }, error: null };
  },
  async signUp({ email, password, options }: { email: string; password: string; options?: { data?: Row } }) {
    if (T("auth_users").some((x) => String(x.email).toLowerCase() === email.toLowerCase())) return { data: { user: null, session: null }, error: err("User already registered") };
    if (password.length < 8) return { data: { user: null, session: null }, error: err("Password should be at least 8 characters") };
    const meta = options?.data ?? {};
    const id = uid();
    T("auth_users").push({ id, email, password, user_metadata: meta });
    T("user_profiles").push({ id, email, role: meta.role === "student" ? "student" : "parent", name: String(meta.name ?? email.split("@")[0]), phone: meta.phone ?? null, avatar_url: null, subject: null, status: "active", created_at: now(), updated_at: now() });
    save();
    setSession(id);
    return { data: { user: userObj(id), session: session() }, error: null };
  },
  async signOut() { setSession(null); return { error: null }; },
  async updateUser({ password, data: meta }: { password?: string; data?: Row }) {
    const u = T("auth_users").find((x) => x.id === sessionUid());
    if (!u) return { data: { user: null }, error: err("Not signed in", 401) };
    if (password) u.password = password;
    if (meta) u.user_metadata = { ...(u.user_metadata as Row), ...meta };
    save();
    return { data: { user: userObj(String(u.id)) }, error: null };
  },
  async resetPasswordForEmail() { return { data: {}, error: null }; },
  onAuthStateChange(cb: Listener) {
    listeners.add(cb);
    return { data: { subscription: { unsubscribe: () => listeners.delete(cb) } } };
  },
};

// ─── Edge function: manage-user ──────────────────────────────────────────────
const functions = {
  async invoke(name: string, { body }: { body: Row }) {
    if (name !== "manage-user") return { data: null, error: { message: "unknown function" } };
    const fail = (m: string) => ({ data: { error: m }, error: null });
    if (body.action === "create") {
      const email = String(body.email ?? "").trim().toLowerCase();
      if (T("auth_users").some((x) => x.email === email)) return fail("البريد الإلكتروني مسجل بالفعل");
      if (String(body.password ?? "").length < 8) return fail("كلمة المرور يجب ألا تقل عن 8 أحرف");
      const id = uid();
      T("auth_users").push({ id, email, password: body.password, user_metadata: {} });
      T("user_profiles").push({ id, email, role: body.role, name: String(body.name).trim(), phone: body.phone ?? null, avatar_url: null, subject: body.subject ?? null, status: "active", created_at: now(), updated_at: now() });
      if (body.role === "assistant") {
        const meP = me();
        T("assistants").push({ id, teacher_id: meP?.role === "teacher" ? meP.id : body.teacher_id, role_title: body.role_title ?? "مساعد", can_scan_attendance: body.can_scan_attendance ?? true, can_enter_grades: body.can_enter_grades ?? false, can_contact_parents: body.can_contact_parents ?? true, can_view_financials: body.can_view_financials ?? false, is_active: true, created_at: now() });
      }
      save();
      return { data: { id }, error: null };
    }
    const target = T("user_profiles").find((p) => p.id === body.user_id);
    if (!target) return fail("user not found");
    if (body.action === "set_status") target.status = body.status === "disabled" ? "disabled" : "active";
    if (body.action === "reset_password") { const u = T("auth_users").find((x) => x.id === body.user_id); if (u) u.password = body.password; }
    save();
    return { data: { ok: true }, error: null };
  },
};

// ─── Client ──────────────────────────────────────────────────────────────────
const channelStub = { on() { return channelStub; }, subscribe() { return channelStub; }, unsubscribe() {} };

export const demoClient = {
  from: (table: string) => new Query(table),
  rpc(name: string, params: Row = {}) {
    const fn = RPC[name] as ((p: Row) => unknown) | undefined;
    return {
      then(ok?: (v: Res) => unknown, bad?: (e: unknown) => unknown) {
        let res: Res;
        try { res = { data: fn ? fn(params) : null, error: fn ? null : { message: `function ${name} not found` } }; }
        catch (e) { res = { data: null, error: e instanceof PgError ? { code: e.code, message: e.message } : { message: String(e) } }; }
        return Promise.resolve(res).then(ok, bad);
      },
    };
  },
  auth,
  functions,
  channel: () => channelStub,
  removeChannel: () => {},
};
