/**
 * Realistic sample data for the in-browser demo backend.
 * Deterministic (seeded random) so every visitor sees the same center.
 */
import { classFitsStudent, parseStage, studentGradeText } from "../curriculum";

export type Row = Record<string, unknown>;
export type DB = Record<string, Row[]>;

export const DEMO_PASSWORD = "demo1234";

export const DEMO_ACCOUNTS = [
  { key: "admin", email: "admin@manara.demo", role: "admin", label: "مدير النظام" },
  { key: "teacher", email: "teacher@manara.demo", role: "teacher", label: "مدرس" },
  { key: "assistant", email: "assistant@manara.demo", role: "assistant", label: "مساعد" },
  { key: "student", email: "student@manara.demo", role: "student", label: "طالب" },
  { key: "parent", email: "parent@manara.demo", role: "parent", label: "ولي أمر" },
] as const;

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let counter = 0;
export function uid(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c?.randomUUID) return c.randomUUID();
  counter++;
  const r = () => Math.floor(Math.random() * 0x10000).toString(16).padStart(4, "0");
  return `${r()}${r()}-${r()}-4${r().slice(1)}-a${r().slice(1)}-${r()}${r()}${(counter % 0xffff).toString(16).padStart(4, "0")}`;
}

const iso = (d: Date) => d.toISOString();
const isoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const daysAgo = (n: number, h = 10) => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(h, 0, 0, 0); return d; };

const FIRST = ["أحمد", "محمد", "يوسف", "عمر", "مريم", "سلمى", "ملك", "حبيبة", "زياد", "آدم", "نور", "جنى", "كريم", "مازن", "فريدة", "ليلى", "علي", "حمزة", "رقية", "تسنيم", "إياد", "سيف", "هنا", "روان", "مالك", "جودي", "أنس", "شهد", "بلال", "ريم", "معاذ", "لمى", "إسلام", "دارين", "ياسين", "خديجة"];
const LAST = ["السيد", "عبد الرحمن", "حسن", "إبراهيم", "مصطفى", "الشريف", "عادل", "سامي", "فتحي", "النجار", "الجمال", "منصور", "رمضان", "شوقي", "عزت", "كامل", "الدسوقي", "حمدي"];
const PARENTS = ["محمد", "أحمد", "محمود", "خالد", "طارق", "هشام", "وليد", "شريف", "عمرو", "حسام", "أيمن", "ياسر"];

const VIDEO = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

const BAC1 = "الصف الأول الثانوي — بكالوريا";
const BAC2 = "الصف الثاني الثانوي — بكالوريا";
const TA3 = "الصف الثالث الثانوي — ثانوية عامة";

/** Groups of the demo center. The first two are the demo student's main courses (progress + quizzes). */
const COURSES = [
  { subject: "الفيزياء", icon: "⚛️", color: 0xff0d9488, title: "الفيزياء — 2 بكالوريا", desc: "مادة التخصص لمسار الطب وعلوم الحياة: شرح مبسط وتجارب مصورة وأسئلة بنظام البكالوريا.", grade: BAC2, cls: "فيزياء 2 بكالوريا — السبت", fee: 300, days: [6, 2], start: "16:00", end: "17:30", room: "قاعة 1",
    teacher: { name: "أ. محمد عبد الله", email: "teacher@manara.demo" },
    lessons: [["الكميات الفيزيائية والقياس", 40], ["الحركة في خط مستقيم", 48], ["قوانين نيوتن للحركة", 55], ["الشغل والطاقة", 50], ["كمية الحركة والتصادمات", 52], ["الحركة الدائرية", 46]] },
  { subject: "اللغة العربية", icon: "📖", color: 0xff8b5cf6, title: "اللغة العربية — 2 بكالوريا", desc: "النحو والبلاغة والقراءة والتعبير بأسلوب ممتع وخرائط ذهنية — مادة أساسية لكل المسارات.", grade: BAC2, cls: "عربي 2 بكالوريا — الأحد", fee: 260, days: [0, 3], start: "17:00", end: "18:30", room: "قاعة 2",
    teacher: { name: "أ. منى إبراهيم", email: "mona@manara.demo" },
    lessons: [["المرفوعات من الأسماء", 38], ["أسلوب الشرط", 43], ["التشبيه والاستعارة", 39], ["قراءة متحررة: نصوص مختارة", 45], ["التعبير الوظيفي والإبداعي", 40]] },
  { subject: "التاريخ", icon: "🏛️", color: 0xffb45309, title: "التاريخ — 2 بكالوريا", desc: "تاريخ مصر من الحضارة القديمة للعصر الحديث بالخرائط والقصص — مادة أساسية لكل المسارات.", grade: BAC2, cls: "تاريخ 2 بكالوريا — الإثنين", fee: 220, days: [1], start: "15:00", end: "16:30", room: "قاعة 3",
    teacher: { name: "أ. حسام فؤاد", email: "hossam@manara.demo" },
    lessons: [["مصر القديمة: الحضارة والدولة", 44], ["مصر في العصرين البطلمي والروماني", 41], ["مصر في العصر الإسلامي", 46], ["مصر في العصر الحديث", 50]] },
  { subject: "اللغة الأجنبية الأولى", icon: "🗣️", color: 0xffe11d48, title: "اللغة الإنجليزية — 2 بكالوريا", desc: "قواعد اللغة الإنجليزية والكتابة والترجمة — مادة أساسية لكل المسارات.", grade: BAC2, cls: "إنجليزي 2 بكالوريا — الثلاثاء", fee: 250, days: [2, 5], start: "18:00", end: "19:30", room: "قاعة 1",
    teacher: { name: "Mr. Omar Adel", email: "omar@manara.demo" },
    lessons: [["Tenses review", 38], ["Conditionals", 44], ["Passive voice", 41], ["Essay writing", 50], ["Translation skills", 46]] },
  { subject: "البرمجة والذكاء الاصطناعي", icon: "💻", color: 0xff6366f1, title: "البرمجة والذكاء الاصطناعي — 2 بكالوريا", desc: "مادة التخصص لمسار الهندسة وعلوم الحاسب: بايثون من الصفر ومدخل للذكاء الاصطناعي.", grade: BAC2, cls: "برمجة 2 بكالوريا — الأربعاء", fee: 320, days: [3], start: "16:00", end: "17:30", room: "معمل الحاسب",
    teacher: { name: "م. كريم ناصر", email: "karim@manara.demo" },
    lessons: [["مقدمة في التفكير الحاسوبي", 35], ["أساسيات بايثون", 50], ["الشروط والتكرار", 48], ["الدوال والقوائم", 52], ["مدخل إلى الذكاء الاصطناعي", 45]] },
  { subject: "المحاسبة", icon: "🧮", color: 0xffca8a04, title: "المحاسبة — 2 بكالوريا", desc: "مادة التخصص لمسار الأعمال: المفاهيم المحاسبية والقيود والقوائم خطوة بخطوة.", grade: BAC2, cls: "محاسبة 2 بكالوريا — الخميس", fee: 260, days: [4], start: "15:00", end: "16:30", room: "قاعة 4",
    teacher: { name: "أ. نهى عادل", email: "noha@manara.demo" },
    lessons: [["مفاهيم محاسبية أساسية", 40], ["المعادلة المحاسبية", 42], ["القيد المزدوج ودفتر اليومية", 50], ["ميزان المراجعة", 47]] },
  { subject: "علم النفس", icon: "🧠", color: 0xffdb2777, title: "علم النفس — 2 بكالوريا", desc: "مادة التخصص لمسار الآداب والفنون: افهم نفسك والناس من حولك بأمثلة من الحياة.", grade: BAC2, cls: "علم نفس 2 بكالوريا — السبت", fee: 220, days: [6], start: "13:00", end: "14:30", room: "قاعة 4",
    teacher: { name: "د. ريهام سعيد", email: "reham@manara.demo" },
    lessons: [["ما هو علم النفس؟", 36], ["الإحساس والإدراك", 42], ["الذاكرة والنسيان", 45], ["الدافعية والانفعالات", 44]] },
  { subject: "العلوم المتكاملة", icon: "🔬", color: 0xff10b981, title: "العلوم المتكاملة — 1 بكالوريا", desc: "فيزياء وكيمياء وأحياء وعلوم أرض في مادة واحدة مترابطة — تأسيس قوي قبل اختيار المسار.", grade: BAC1, cls: "علوم متكاملة 1 بكالوريا — الأحد", fee: 240, days: [0], start: "14:00", end: "15:30", room: "قاعة 3",
    teacher: { name: "أ. إيمان سامي", email: "eman@manara.demo" },
    lessons: [["المادة وخصائصها", 40], ["الطاقة وتحولاتها", 45], ["الخلية وحدة بناء الكائن الحي", 48], ["الأرض والبيئة", 42]] },
  { subject: "الفيزياء", icon: "⚛️", color: 0xff0f766e, title: "الفيزياء — 3 ثانوية عامة", desc: "شرح كامل للمنهج مع حل أسئلة الامتحانات السابقة وملخصات لكل فصل.", grade: TA3, cls: "فيزياء 3ث — الإثنين", fee: 350, days: [1, 4], start: "17:00", end: "18:30", room: "قاعة 1",
    teacher: { name: "أ. طارق رشدي", email: "tarek@manara.demo" },
    lessons: [["مقدمة: التيار الكهربي وقانون أوم", 42], ["توصيل المقاومات على التوالي والتوازي", 55], ["قانونا كيرشوف", 48], ["التأثير المغناطيسي للتيار", 51], ["الحث الكهرومغناطيسي", 60], ["دوائر التيار المتردد", 58]] },
  { subject: "الكيمياء", icon: "🧪", color: 0xff0ea5e9, title: "الكيمياء — 3 ثانوية عامة", desc: "تأسيس قوي في الكيمياء العضوية والتحليلية مع تجارب مصورة.", grade: TA3, cls: "كيمياء 3ث — الثلاثاء", fee: 320, days: [2, 6], start: "15:00", end: "16:30", room: "قاعة 2",
    teacher: { name: "أ. سارة حسن", email: "sara@manara.demo" },
    lessons: [["العناصر الانتقالية", 45], ["التحليل الكيميائي", 50], ["الاتزان الكيميائي", 47], ["الكيمياء الكهربية", 53], ["الكيمياء العضوية: الهيدروكربونات", 62]] },
  { subject: "الرياضيات", icon: "📐", color: 0xfff59e0b, title: "الرياضيات البحتة — 3 ثانوية عامة", desc: "التفاضل والتكامل خطوة بخطوة مع تدريبات تفاعلية بعد كل درس.", grade: TA3, cls: "رياضيات 3ث — الأربعاء", fee: 300, days: [3, 0], start: "18:00", end: "19:30", room: "قاعة 3",
    teacher: { name: "أ. أحمد سمير", email: "ahmed@manara.demo" },
    lessons: [["النهايات والاتصال", 40], ["قواعد الاشتقاق", 52], ["تطبيقات التفاضل", 49], ["التكامل المحدود", 56]] },
  { subject: "الأحياء", icon: "🧬", color: 0xff16a34a, title: "الأحياء — 3 ثانوية عامة", desc: "الدعامة والحركة والتكاثر والوراثة بالرسوم التوضيحية.", grade: TA3, cls: "أحياء 3ث — الخميس", fee: 300, days: [4, 0], start: "16:30", end: "18:00", room: "قاعة 2",
    teacher: { name: "د. هبة مصطفى", email: "heba@manara.demo" },
    lessons: [["الدعامة في الكائنات الحية", 44], ["الحركة", 40], ["التكاثر", 52], ["الوراثة الجزيئية", 58]] },
] as const;

/** Students cycle through these [grade, track] plans — every Baccalaureate track and Thanaweya Amma section appears. */
const STUDENT_PLANS: [string, string | null][] = [
  [BAC2, "الطب وعلوم الحياة"], [BAC2, "الهندسة وعلوم الحاسب"], [BAC2, "الأعمال"], [BAC2, "الآداب والفنون"],
  [TA3, "علمي علوم"], [TA3, "علمي رياضة"], [BAC2, "الطب وعلوم الحياة"], [BAC1, null], [TA3, "علمي علوم"],
];

const QUIZ_BANK: Record<string, [string, string[], number][]> = {
  "الفيزياء": [
    ["وحدة قياس القوة في النظام الدولي هي:", ["النيوتن", "الجول", "الوات", "الباسكال"], 0],
    ["الجسم الساكن يظل ساكناً ما لم تؤثر عليه قوة محصلة — هذا هو:", ["قانون نيوتن الأول", "قانون نيوتن الثاني", "قانون نيوتن الثالث", "قانون الجذب العام"], 0],
    ["القوة المحصلة = الكتلة × العجلة", ["صح", "خطأ"], 0],
    ["السرعة كمية:", ["قياسية", "متجهة", "ليس لها وحدة", "ثابتة دائماً"], 1],
    ["طاقة الحركة تتناسب طردياً مع مربع السرعة", ["صح", "خطأ"], 0],
  ],
  "اللغة العربية": [
    ["الفاعل في جملة (نجحَ الطالبُ المجتهدُ) هو:", ["نجح", "الطالبُ", "المجتهدُ", "لا يوجد فاعل"], 1],
    ["(إنْ تذاكرْ تنجحْ) — أداة الشرط هي:", ["إنْ", "تذاكرْ", "تنجحْ", "لا توجد"], 0],
    ["في قولنا (العلمُ نورٌ) تشبيه بليغ", ["صح", "خطأ"], 0],
    ["إعراب (الكتابَ) في (قرأتُ الكتابَ):", ["فاعل مرفوع", "مفعول به منصوب", "مبتدأ مرفوع", "مضاف إليه مجرور"], 1],
  ],
};

export function buildSeed(): DB {
  const r = rng(20261001);
  const pick = <T,>(a: readonly T[]) => a[Math.floor(r() * a.length)];
  const now = new Date();
  const db: DB = {};
  const t = (name: string) => (db[name] ??= []);

  // Settings
  t("app_settings").push({
    id: 1, center_name: "منارة", logo_url: null, contact_phone: "01000000000", currency: "ج.م", country_code: "20", timezone: "Africa/Cairo",
    campus_lat: null, campus_lng: null, campus_radius_m: 250, geofence_enabled: false, late_after_minutes: 10,
    absence_warning_count: 2, absence_danger_count: 3, absence_critical_count: 5, updated_at: iso(now),
  });

  const users: Row[] = t("auth_users");
  const profiles = t("user_profiles");
  const addUser = (email: string, role: string, name: string, extra: Row = {}) => {
    const id = uid();
    users.push({ id, email, password: DEMO_PASSWORD, user_metadata: {} });
    profiles.push({ id, email, role, name, phone: extra.phone ?? `010${Math.floor(10000000 + r() * 89999999)}`, avatar_url: null, subject: extra.subject ?? null, status: "active", created_at: iso(daysAgo(120)), updated_at: iso(now) });
    return id;
  };

  const adminId = addUser("admin@manara.demo", "admin", "أ. خالد إبراهيم");
  const teacherIds = COURSES.map((c) => addUser(c.teacher.email, "teacher", c.teacher.name, { subject: c.subject }));
  const assistantId = addUser("assistant@manara.demo", "assistant", "يوسف علي");
  t("assistants").push({ id: assistantId, teacher_id: teacherIds[0], role_title: "مساعد مدرس", can_scan_attendance: true, can_enter_grades: true, can_contact_parents: true, can_view_financials: false, is_active: true, created_at: iso(daysAgo(90)) });

  // Classes, schedule, courses, lessons
  const classIds: string[] = [];
  const courseIds: string[] = [];
  COURSES.forEach((c, i) => {
    const id = uid();
    classIds.push(id);
    t("classes").push({ id, name: c.cls, grade: c.grade, subject: c.subject, teacher_id: teacherIds[i], room: c.room, monthly_fee: c.fee, capacity: 40, whatsapp_group_url: null, is_active: true, created_at: iso(daysAgo(100 - i)) });
    for (const d of c.days) t("class_schedule").push({ id: uid(), class_id: id, weekday: d, start_time: `${c.start}:00`, end_time: `${c.end}:00`, room: c.room });
    const courseId = uid();
    courseIds.push(courseId);
    t("courses").push({ id: courseId, title: c.title, description: c.desc, class_id: id, teacher_id: teacherIds[i], icon: c.icon, color: c.color, is_published: true, created_at: iso(daysAgo(30 - i * 3)) });
    c.lessons.forEach(([title, min], j) => {
      t("lessons").push({ id: uid(), course_id: courseId, title, duration_seconds: min * 60, video_url: VIDEO, position: j + 1, is_locked: j > 3, created_at: iso(daysAgo(30 - j)) });
    });
  });

  // Students
  const studentIds: string[] = [];
  for (let i = 0; i < 36; i++) {
    const id = uid();
    studentIds.push(id);
    const last = pick(LAST);
    const endOffset = r() < 0.18 ? -Math.floor(5 + r() * 20) : Math.floor(5 + r() * 40);
    const end = new Date(); end.setDate(end.getDate() + endOffset);
    t("students").push({
      id, student_code: `S${1001 + i}`, name: `${FIRST[i % FIRST.length]} ${pick(PARENTS)} ${last}`, grade: studentGradeText(parseStage(STUDENT_PLANS[i % STUDENT_PLANS.length][0]), parseStage(STUDENT_PLANS[i % STUDENT_PLANS.length][0])?.tracks.find((x) => x.name === STUDENT_PLANS[i % STUDENT_PLANS.length][1]) ?? null),
      parent_name: `${pick(PARENTS)} ${last}`, parent_phone: `01${pick(["0", "1", "2", "5"])}${Math.floor(10000000 + r() * 89999999)}`, student_phone: null, photo_url: null,
      user_id: null, status: i === 35 ? "suspended" : "active", subscription_end: isoDate(end), notes: null, created_by: adminId, created_at: iso(daysAgo(90 - i)),
    });
    const grade = String(t("students")[i].grade);
    const fits = COURSES.map((c, k) => (classFitsStudent(c.grade, c.subject, grade) ? k : -1)).filter((k) => k >= 0);
    const set = new Set<number>(i === 0 ? [0, 1, 3] : i === 1 ? [1, 4] : fits.filter(() => r() < 0.6));
    if (!set.size && fits.length) set.add(fits[0]);
    for (const k of set) t("enrollments").push({ student_id: id, class_id: classIds[k], enrolled_at: iso(daysAgo(80)) });
  }

  // Student + parent accounts
  const studentUser = addUser("student@manara.demo", "student", "أحمد محمد السيد");
  const st0 = t("students")[0];
  st0.user_id = studentUser;
  st0.name = "أحمد محمد السيد";
  const parentUser = addUser("parent@manara.demo", "parent", "محمد السيد");
  t("guardians").push({ parent_id: parentUser, student_id: studentIds[0], created_at: iso(daysAgo(60)) }, { parent_id: parentUser, student_id: studentIds[1], created_at: iso(daysAgo(60)) });
  t("students")[1].name = "ملك محمد السيد";

  // Attendance: last 28 days on scheduled days
  const enr = t("enrollments");
  for (let d = 27; d >= 0; d--) {
    const day = daysAgo(d);
    COURSES.forEach((c, i) => {
      if (!(c.days as readonly number[]).includes(day.getDay())) return;
      for (const e of enr.filter((x) => x.class_id === classIds[i])) {
        const x = r();
        const status = x < 0.8 ? "present" : x < 0.88 ? "late" : x < 0.97 ? "absent" : "excused";
        t("attendance_records").push({ id: uid(), student_id: e.student_id, class_id: classIds[i], teacher_id: teacherIds[i], date: isoDate(day), status, method: r() < 0.5 ? "dynamic_qr" : "manual", note: status === "absent" && r() < 0.3 ? "بدون عذر مسبق" : null, recorded_at: iso(day) });
      }
    });
  }

  // Exams & grades
  classIds.forEach((cid, i) => {
    [["امتحان الشهر الأول", 24, 20], ["امتحان الشهر الثاني", 6, 20], ["واجب الفصل الثالث", 3, 10], ["امتحان الشهر الثالث", -5, 30]].forEach(([title, ago, max], k) => {
      const id = uid();
      const date = daysAgo(ago as number);
      t("exams").push({ id, title, kind: k === 2 ? "homework" : "exam", subject: COURSES[i].subject, max_score: max, class_id: cid, teacher_id: teacherIds[i], exam_date: isoDate(date), exam_time: "16:00:00", duration_minutes: 60, question_count: null, is_published: true, created_at: iso(daysAgo((ago as number) + 7)) });
      if ((ago as number) <= 0) return;
      for (const e of enr.filter((x) => x.class_id === cid)) {
        const score = Math.round((0.5 + r() * 0.5) * (max as number) * 2) / 2;
        t("grades").push({ id: uid(), exam_id: id, student_id: e.student_id, score, remarks: score / (max as number) > 0.9 ? "ممتاز، استمر" : null, updated_at: iso(date) });
      }
    });
  });

  // Interactive quizzes
  [0, 1].forEach((i) => {
    const examId = uid();
    const quizId = uid();
    const bank = QUIZ_BANK[COURSES[i].subject];
    t("exams").push({ id: examId, title: `كويز ${COURSES[i].subject} التفاعلي`, kind: "quiz", subject: COURSES[i].subject, max_score: bank.length, class_id: classIds[i], teacher_id: teacherIds[i], exam_date: null, exam_time: null, duration_minutes: 15, question_count: bank.length, is_published: true, created_at: iso(daysAgo(2)) });
    const until = new Date(); until.setDate(until.getDate() + 5);
    t("quizzes").push({ id: quizId, exam_id: examId, class_id: classIds[i], description: "اقرأ كل سؤال جيداً قبل الإجابة. لديك محاولتان.", duration_minutes: 15, available_from: null, available_until: iso(until), max_attempts: 2, shuffle_questions: false, show_answers: true, notified_at: iso(daysAgo(2)), created_at: iso(daysAgo(2)) });
    bank.forEach(([body, options, correct], j) => {
      t("quiz_questions").push({ id: uid(), quiz_id: quizId, position: j, kind: options.length === 2 ? "tf" : "mcq", body, options, correct_index: correct, points: 1, explanation: null, created_at: iso(daysAgo(2)) });
    });
  });

  // Lesson progress for the demo student
  const firstLessons = t("lessons").filter((l) => l.course_id === courseIds[0] || l.course_id === courseIds[1]);
  firstLessons.slice(0, 6).forEach((l, k) => t("lesson_progress").push({ student_id: studentIds[0], lesson_id: l.id, completed: k < 5, last_position_sec: k < 5 ? 0 : 600, updated_at: iso(daysAgo(6 - k)) }));

  // Payments
  for (const s of t("students")) {
    const cls = enr.find((e) => e.student_id === s.id)?.class_id ?? null;
    const fee = (t("classes").find((c) => c.id === cls)?.monthly_fee as number) ?? 300;
    for (let m = 0; m < 2; m++) {
      if (m === 0 && String(s.subscription_end) < isoDate(now)) continue;
      t("payments").push({ id: uid(), student_id: s.id, class_id: cls, amount: fee, method: pick(["cash", "cash", "wallet", "transfer"]), kind: "subscription", period_month: null, notes: null, received_by: adminId, paid_at: iso(m === 0 ? daysAgo(Math.floor(r() * Math.max(1, now.getDate())), 9) : daysAgo(30 + Math.floor(r() * 10))) });
    }
    if (r() < 0.3) t("payments").push({ id: uid(), student_id: s.id, class_id: cls, amount: 120, method: "cash", kind: "materials", period_month: null, notes: "مذكرة الفصل", received_by: adminId, paid_at: iso(daysAgo(Math.floor(r() * 25))) });
  }

  // Achievements
  t("achievements").push(
    { id: uid(), student_id: studentIds[0], emoji: "🏆", title: "الأول على المجموعة", description: "أعلى درجة في امتحان الشهر", color: 0xfff59e0b, awarded_by: teacherIds[0], awarded_at: iso(daysAgo(5)) },
    { id: uid(), student_id: studentIds[0], emoji: "🔥", title: "حضور مثالي", description: "لم يغب طوال الشهر", color: 0xffe11d48, awarded_by: adminId, awarded_at: iso(daysAgo(12)) },
    { id: uid(), student_id: studentIds[0], emoji: "🧠", title: "بطل الكويزات", description: "", color: 0xff0d9488, awarded_by: teacherIds[1], awarded_at: iso(daysAgo(20)) },
  );

  // Notifications
  const note = (user: string, title: string, body: string, type: string, ago: number, read = false) =>
    t("notifications").push({ id: uid(), user_id: user, title, body, type, data: {}, is_read: read, created_at: iso(daysAgo(ago, 9 + (ago % 8))) });
  for (const u of [parentUser, studentUser]) {
    note(u, "درجة جديدة: امتحان الشهر الثاني", "أحمد محمد السيد حصل على 18 من 20", "grade", 1);
    note(u, "كويز جديد: كويز الفيزياء التفاعلي", "تم إتاحة كويز جديد — المدة 15 دقيقة", "exam", 2);
    note(u, "تغيير موعد حصة العربي", "حصة الأحد القادم ستكون الساعة 6 مساءً بدلاً من 5", "announcement", 3, true);
  }
  note(parentUser, "تأخر: أحمد محمد السيد", "تم تسجيل تأخر أحمد محمد السيد عن فيزياء 2 بكالوريا — السبت", "absence", 4, true);
  for (const u of [adminId, ...teacherIds, assistantId]) {
    note(u, "اجتماع المدرسين", "اجتماع شهري يوم الخميس الساعة 8 مساءً لمراجعة نتائج الطلاب", "announcement", 1);
    note(u, "تم تحديث الجدول", "تمت إضافة مواعيد مراجعات لطلاب 2 بكالوريا و3 ثانوية عامة", "schedule", 6, true);
  }

  // Messages
  const msg = (from: string, to: string, body: string, ago: number, h: number, read = true) =>
    t("messages").push({ id: uid(), sender_id: from, recipient_id: to, student_id: studentIds[0], body, read_at: read ? iso(daysAgo(ago, h + 1)) : null, created_at: iso(daysAgo(ago, h)) });
  msg(parentUser, teacherIds[0], "السلام عليكم أستاذ محمد، أحمد مستواه عامل إيه في الفيزياء؟", 3, 18);
  msg(teacherIds[0], parentUser, "وعليكم السلام، أحمد ممتاز ومن أفضل الطلاب في المجموعة، محتاج بس يركز أكتر في المسائل.", 3, 20);
  msg(parentUser, teacherIds[0], "شكراً جداً يا أستاذ، هتابع معاه إن شاء الله", 2, 12);
  msg(studentUser, teacherIds[1], "مس منى ممكن حضرتك تشرحي تاني أسلوب الشرط؟", 1, 15, false);

  // Announcement + audit
  t("announcements").push({ id: uid(), title: "تغيير موعد حصة العربي", body: "حصة الأحد القادم ستكون الساعة 6 مساءً", audience: "class", class_id: classIds[1], created_by: teacherIds[1], created_at: iso(daysAgo(3)) });
  t("audit_logs").push(
    { id: 1, actor_id: adminId, action: "INSERT", entity: "students", entity_id: studentIds[30], details: {}, created_at: iso(daysAgo(2)) },
    { id: 2, actor_id: adminId, action: "UPDATE", entity: "app_settings", entity_id: "1", details: {}, created_at: iso(daysAgo(4)) },
    { id: 3, actor_id: teacherIds[0], action: "INSERT", entity: "payments", entity_id: uid(), details: {}, created_at: iso(daysAgo(1)) },
  );
  for (const name of ["qr_sessions", "lesson_progress", "quiz_attempts", "announcements"]) t(name);
  return db;
}
