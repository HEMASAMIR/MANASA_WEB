/* Smoke test for the demo backend: runs the real data layer (src/lib/api.ts) against it.
   Run: npx tsx scripts/demo-crud.test.ts */
const store = new Map<string, string>();
(globalThis as any).localStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => store.set(k, v), removeItem: (k: string) => store.delete(k) };
(globalThis as any).window = { location: { search: "?demo=1" } };

async function main() {
  const { initBackend, sb } = await import("../src/lib/supabase");
  const api = await import("../src/lib/api");
  const assert = (c: unknown, m: string) => { if (!c) throw new Error("FAIL: " + m); console.log("  ✓", m); };

  console.log("mode:", await initBackend());
  const { error } = await sb().auth.signInWithPassword({ email: "admin@manara.demo", password: "demo1234" });
  assert(!error, "admin login");

  const stats = await api.reportApi.stats();
  assert(stats.students > 30, `stats: ${stats.students} students, ${stats.classes} classes`);

  // Classes CRUD
  const cid = await api.classApi.create({ name: "مجموعة اختبار", grade: "الأول الثانوي", slots: [{ weekday: 6, start: "10:00", end: "11:00" }] });
  let classes = await api.classApi.list(true);
  assert(classes.find((c) => c.id === cid)?.class_schedule?.length === 1, "create class with schedule");
  await api.classApi.update(cid, { name: "مجموعة اختبار 2" });
  classes = await api.classApi.list(true);
  assert(classes.find((c) => c.id === cid)?.name === "مجموعة اختبار 2", "update class");

  // Students CRUD
  const sid = await api.studentApi.create({ name: "طالب تجريبي", parent_phone: "01011112222", class_ids: [cid] });
  let st = await api.studentApi.get(sid);
  assert(st.student.student_code.startsWith("S") && st.classes[0]?.id === cid, `create student ${st.student.student_code} enrolled`);
  await api.studentApi.update(sid, { name: "طالب معدل", status: "suspended" });
  st = await api.studentApi.get(sid);
  assert(st.student.name === "طالب معدل" && st.student.status === "suspended", "update student");
  const list = await api.studentApi.list();
  assert(list.some((s) => s.student.id === sid), `list students (${list.length})`);
  const imp = await api.studentApi.importRows([{ name: "مستورد 1", parent_phone: "01000000001" }, { name: "", parent_phone: "" }]);
  assert(imp.created === 1 && imp.failed.length === 1, "import students (1 ok, 1 rejected)");

  // Attendance
  const today = new Date().toISOString().slice(0, 10);
  await api.studentApi.update(sid, { status: "active" });
  await api.attendanceApi.submit([{ student_id: sid, class_id: cid, date: today, status: "absent" }]);
  const att = await api.attendanceApi.forClassDate(cid, today);
  assert(att.length === 1 && att[0].status === "absent", "record attendance");
  const roster = await api.classApi.roster(cid);
  assert(roster.length === 1, "class roster");

  // Exams & grades
  const ex = await api.examApi.create({ title: "اختبار", max_score: 20, class_id: cid, kind: "exam" });
  await api.examApi.saveGrades(ex.id, [{ student_id: sid, score: 17 }]);
  const grades = await api.examApi.grades(ex.id);
  assert(grades[0]?.score === 17, "save grade");
  await api.examApi.saveGrades(ex.id, [{ student_id: sid, score: 19 }]);
  assert((await api.examApi.grades(ex.id))[0]?.score === 19, "update grade (upsert)");

  // Finance
  const end = await api.financeApi.renew({ studentId: sid, amount: 300, method: "cash", months: 2, classId: cid });
  assert(!!end, `renew subscription until ${end}`);
  await api.financeApi.add({ studentId: sid, amount: 50, kind: "materials", method: "cash" });
  const pays = await api.financeApi.payments({ studentId: sid });
  assert(pays.length === 2 && !!pays[0].students?.name, "payments with student join");

  // Courses & lessons
  const course = await api.courseApi.create({ title: "كورس تجريبي", class_id: cid });
  await api.courseApi.addLesson(course.id, { title: "درس 1", duration_seconds: 600, is_locked: false });
  await api.courseApi.addLesson(course.id, { title: "درس 2", duration_seconds: 900, is_locked: true });
  const lessons = await api.courseApi.lessons(course.id);
  assert(lessons.length === 2 && lessons[1].position === 2, "add lessons");
  await api.courseApi.removeLesson(lessons[0].id);
  assert((await api.courseApi.lessons(course.id)).length === 1, "delete lesson");

  // Quiz
  const qid = await api.quizApi.create(cid, { title: "كويز تجريبي", max_attempts: 2, shuffle: false, show_answers: true });
  await api.quizApi.saveQuestion(qid, { kind: "mcq", body: "2+2؟", options: ["3", "4"], correct_index: 1, points: 2, explanation: null });
  await api.quizApi.saveQuestion(qid, { kind: "tf", body: "الأرض كروية", options: [], correct_index: 0, points: 1, explanation: null });
  const quiz = await api.quizApi.get(qid);
  assert(quiz.exams?.question_count === 2 && quiz.exams?.max_score === 3, "quiz questions sync total score");
  await api.quizApi.publish(qid, true);
  assert((await api.quizApi.get(qid)).exams?.is_published, "publish quiz");

  // People (edge function)
  await api.peopleApi.create({ role: "teacher", name: "مدرس جديد", email: "new.teacher@manara.demo", password: "12345678" });
  assert((await api.peopleApi.byRole("teacher")).some((t) => t.email === "new.teacher@manara.demo"), "create teacher account");

  // Notifications / broadcast
  const n = await api.notificationApi.broadcast("تجربة", "رسالة", "all");
  assert(n > 5, `broadcast to ${n} users`);

  // Deletes cascade
  await api.courseApi.remove(course.id);
  await api.studentApi.remove(sid);
  assert(!(await api.studentApi.list()).some((s) => s.student.id === sid), "delete student");
  await api.classApi.remove(cid);
  assert(!(await api.classApi.list(true)).some((c) => c.id === cid), "delete class (cascade)");

  // Teacher only sees own classes
  await sb().auth.signOut();
  await sb().auth.signInWithPassword({ email: "teacher@manara.demo", password: "demo1234" });
  const tClasses = await api.classApi.list();
  assert(tClasses.length === 1, `teacher sees only own classes (${tClasses.length})`);

  // Student portal data
  await sb().auth.signOut();
  await sb().auth.signInWithPassword({ email: "student@manara.demo", password: "demo1234" });
  const { loadPortal } = await import("../src/lib/student");
  const portal = await loadPortal();
  assert(portal !== "not-linked" && portal.courses.length >= 2, "student portal loads courses");
  console.log("\nALL GOOD ✅");
}
main().catch((e) => { console.error(e); process.exit(1); });
