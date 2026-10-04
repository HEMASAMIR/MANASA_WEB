/**
 * The curriculum the platform understands: stages (system + year), their tracks and subjects.
 *
 * Everything is stored as plain text in the existing columns, so no schema change is needed:
 *   classes.grade   = stage label            e.g. "الصف الثاني الثانوي — بكالوريا"
 *   classes.subject = subject name           e.g. "الفيزياء"
 *   students.grade  = stage label • track    e.g. "الصف الثاني الثانوي — بكالوريا • الطب وعلوم الحياة"
 * Older free-text values ("الثالث الثانوي", "فيزياء") are still recognised.
 */
import { TRACKS } from "./education";

export type SystemId = "bac" | "ta" | "ksa" | "qiyas";

export interface TrackRef { id: string; name: string; emoji: string; color: string }

export interface SubjectDef {
  name: string;
  emoji: string;
  color: string;
  /** "all" = every track of the stage. */
  tracks: string[] | "all";
  /** "choice": the student picks one of the track's choice subjects (Baccalaureate grade 11). */
  kind?: "choice";
}

export interface Stage {
  id: string;
  system: SystemId;
  year: 1 | 2 | 3;
  label: string;
  short: string;
  tracks: TrackRef[];
  subjects: SubjectDef[];
}

export const SYSTEMS: { id: SystemId; name: string; emoji: string; color: string }[] = [
  { id: "bac", name: "البكالوريا المصرية", emoji: "🎓", color: "#0d9488" },
  { id: "ta", name: "الثانوية العامة", emoji: "📘", color: "#0ea5e9" },
  { id: "ksa", name: "المنهج السعودي", emoji: "🌴", color: "#16a34a" },
  { id: "qiyas", name: "القدرات والتحصيلي", emoji: "🎯", color: "#7c3aed" },
];

const BAC_TRACKS: TrackRef[] = TRACKS.map(({ id, name, emoji, color }) => ({ id, name, emoji, color }));
const TA_SECTIONS3: TrackRef[] = [
  { id: "sci", name: "علمي علوم", emoji: "🧬", color: "#10b981" },
  { id: "math", name: "علمي رياضة", emoji: "📐", color: "#0ea5e9" },
  { id: "lit", name: "أدبي", emoji: "📜", color: "#8b5cf6" },
];
const TA_SECTIONS2: TrackRef[] = [
  { id: "sci", name: "علمي", emoji: "🔬", color: "#10b981" },
  { id: "lit", name: "أدبي", emoji: "📜", color: "#8b5cf6" },
];

/** Saudi secondary tracks (Ministry of Education, نظام المسارات). */
export const KSA_TRACKS: TrackRef[] = [
  { id: "general", name: "المسار العام", emoji: "📗", color: "#0d9488" },
  { id: "health", name: "مسار الصحة والحياة", emoji: "🩺", color: "#10b981" },
  { id: "cs", name: "مسار علوم الحاسب والهندسة", emoji: "💻", color: "#0ea5e9" },
  { id: "business", name: "مسار إدارة الأعمال", emoji: "📊", color: "#f59e0b" },
  { id: "sharia", name: "المسار الشرعي", emoji: "📜", color: "#8b5cf6" },
];
const QIYAS_TRACKS: TrackRef[] = [
  { id: "qudurat", name: "القدرات العامة", emoji: "🧠", color: "#7c3aed" },
  { id: "tahsili-sci", name: "التحصيلي العلمي", emoji: "🔬", color: "#0ea5e9" },
  { id: "tahsili-lit", name: "التحصيلي النظري", emoji: "📚", color: "#f59e0b" },
];

const S = (name: string, emoji: string, color: string, tracks: SubjectDef["tracks"] = "all", kind?: "choice"): SubjectDef => ({ name, emoji, color, tracks, kind });

export const STAGES: Stage[] = [
  {
    id: "bac1", system: "bac", year: 1, label: "الصف الأول الثانوي — بكالوريا", short: "1 بكالوريا", tracks: [],
    subjects: [
      S("اللغة العربية", "📖", "#8b5cf6"),
      S("اللغة الأجنبية الأولى", "🗣️", "#e11d48"),
      S("التاريخ المصري", "🏛️", "#b45309"),
      S("الرياضيات", "📐", "#f59e0b"),
      S("العلوم المتكاملة", "🔬", "#10b981"),
      S("الفلسفة والمنطق", "💭", "#6366f1"),
    ],
  },
  {
    id: "bac2", system: "bac", year: 2, label: "الصف الثاني الثانوي — بكالوريا", short: "2 بكالوريا", tracks: BAC_TRACKS,
    subjects: [
      S("اللغة العربية", "📖", "#8b5cf6"),
      S("اللغة الأجنبية الأولى", "🗣️", "#e11d48"),
      S("التاريخ", "🏛️", "#b45309"),
      ...TRACKS.flatMap((t) => t.g2Options.map((o, i) => S(o, ["⚛️", "📐", "🧪", "💻", "🧮", "💼", "🧠", "🌐"][TRACKS.indexOf(t) * 2 + i], t.color, [t.id], "choice"))),
    ],
  },
  {
    id: "bac3", system: "bac", year: 3, label: "الصف الثالث الثانوي — بكالوريا", short: "3 بكالوريا", tracks: BAC_TRACKS,
    subjects: TRACKS.flatMap((t) => t.g3.map((g, i) => S(g, ["🧬", "🧪", "📐", "⚛️", "📈", "📐", "🌍", "📊"][TRACKS.indexOf(t) * 2 + i], t.color, [t.id]))),
  },
  {
    id: "ta2", system: "ta", year: 2, label: "الصف الثاني الثانوي — ثانوية عامة", short: "2 ثانوية عامة", tracks: TA_SECTIONS2,
    subjects: [
      S("اللغة العربية", "📖", "#8b5cf6"),
      S("اللغة الأجنبية الأولى", "🗣️", "#e11d48"),
      S("التاريخ", "🏛️", "#b45309"),
      S("الرياضيات", "📐", "#f59e0b"),
      S("الكيمياء", "🧪", "#0ea5e9", ["sci"]),
      S("الفيزياء", "⚛️", "#0d9488", ["sci"]),
      S("الجغرافيا", "🌍", "#16a34a", ["lit"]),
      S("علم النفس والاجتماع", "🧠", "#db2777", ["lit"]),
    ],
  },
  {
    id: "ta3", system: "ta", year: 3, label: "الصف الثالث الثانوي — ثانوية عامة", short: "3 ثانوية عامة", tracks: TA_SECTIONS3,
    subjects: [
      S("اللغة العربية", "📖", "#8b5cf6"),
      S("اللغة الأجنبية الأولى", "🗣️", "#e11d48"),
      S("الفيزياء", "⚛️", "#0d9488", ["sci", "math"]),
      S("الكيمياء", "🧪", "#0ea5e9", ["sci", "math"]),
      S("الأحياء", "🧬", "#10b981", ["sci"]),
      S("الرياضيات", "📐", "#f59e0b", ["math"]),
      S("التاريخ", "🏛️", "#b45309", ["lit"]),
      S("الجغرافيا", "🌍", "#16a34a", ["lit"]),
      S("الإحصاء", "📊", "#6366f1", ["lit"]),
    ],
  },
  {
    id: "ksa1", system: "ksa", year: 1, label: "السنة الأولى المشتركة — ثانوي سعودي", short: "1 ث سعودي", tracks: [],
    subjects: [
      S("الدراسات الإسلامية", "🕌", "#16a34a"),
      S("اللغة العربية", "📖", "#8b5cf6"),
      S("اللغة الإنجليزية", "🗣️", "#e11d48"),
      S("الرياضيات", "📐", "#f59e0b"),
      S("العلوم الطبيعية", "🔬", "#10b981"),
      S("العلوم الاجتماعية", "🌍", "#b45309"),
      S("التقنية الرقمية", "💻", "#0ea5e9"),
      S("التفكير الناقد", "💭", "#6366f1"),
    ],
  },
  ...([2, 3] as const).map((year): Stage => ({
    id: `ksa${year}`, system: "ksa", year, label: `${year === 2 ? "الصف الثاني" : "الصف الثالث"} الثانوي — مسارات سعودية`, short: `${year} ث سعودي`, tracks: KSA_TRACKS,
    subjects: [
      S("الدراسات الإسلامية", "🕌", "#16a34a"),
      S("اللغة العربية", "📖", "#8b5cf6"),
      S("اللغة الإنجليزية", "🗣️", "#e11d48"),
      S("الرياضيات", "📐", "#f59e0b", ["general", "health", "cs", "business"]),
      S("الفيزياء", "⚛️", "#0d9488", ["general", "cs"]),
      S("الكيمياء", "🧪", "#0ea5e9", ["general", "health"]),
      S("الأحياء", "🧬", "#10b981", ["general", "health"]),
      S("علوم الأرض والفضاء", "🔭", "#6366f1", ["general"]),
      S("التقنية الرقمية", "💻", "#0284c7", ["general", "business"]),
      S("أنظمة جسم الإنسان", "💓", "#e11d48", ["health"]),
      S("مقدمة في العلوم الصحية", "🩺", "#14b8a6", ["health"]),
      S("علم البيانات", "📈", "#0ea5e9", ["cs"]),
      S("الذكاء الاصطناعي", "🤖", "#6366f1", ["cs"]),
      S("الأمن السيبراني", "🛡️", "#0f766e", ["cs"]),
      S("الهندسة", "⚙️", "#64748b", ["cs"]),
      S("المحاسبة", "🧮", "#ca8a04", ["business"]),
      S("الاقتصاد", "💹", "#f59e0b", ["business"]),
      S("التسويق", "📣", "#db2777", ["business"]),
      S("ريادة الأعمال", "🚀", "#ea580c", ["business"]),
      S("علوم القرآن", "📗", "#16a34a", ["sharia"]),
      S("أصول الفقه", "⚖️", "#8b5cf6", ["sharia"]),
      S("مصطلح الحديث", "📜", "#b45309", ["sharia"]),
      S("القانون", "🏛️", "#475569", ["business", "sharia"]),
    ],
  })),
  {
    id: "qiyas", system: "qiyas", year: 3, label: "القدرات والتحصيلي", short: "قدرات وتحصيلي", tracks: QIYAS_TRACKS,
    subjects: [
      S("القدرات — الكمي", "🔢", "#7c3aed", ["qudurat"]),
      S("القدرات — اللفظي", "🔤", "#a855f7", ["qudurat"]),
      S("التحصيلي — الرياضيات", "📐", "#f59e0b", ["tahsili-sci"]),
      S("التحصيلي — الفيزياء", "⚛️", "#0d9488", ["tahsili-sci"]),
      S("التحصيلي — الكيمياء", "🧪", "#0ea5e9", ["tahsili-sci"]),
      S("التحصيلي — الأحياء", "🧬", "#10b981", ["tahsili-sci"]),
      S("التحصيلي — الدراسات الإسلامية", "🕌", "#16a34a", ["tahsili-lit"]),
      S("التحصيلي — اللغة العربية", "📖", "#8b5cf6", ["tahsili-lit"]),
      S("التحصيلي — الدراسات الاجتماعية", "🌍", "#b45309", ["tahsili-lit"]),
    ],
  },
];

export const stageById = (id: string | null | undefined) => STAGES.find((s) => s.id === id) ?? null;

// ─── Parsing stored text ─────────────────────────────────────────────────────

const YEAR_WORDS: [RegExp, 1 | 2 | 3][] = [[/الأول|الاول|أولى|اولى|1/, 1], [/الثاني|تانية|ثانية|2/, 2], [/الثالث|تالتة|ثالثة|3/, 3]];

/** Which stage a stored grade text refers to (exact labels first, then older free text). */
export function parseStage(grade: string | null | undefined): Stage | null {
  if (!grade) return null;
  const base = grade.split(" • ")[0].trim();
  const exact = STAGES.find((s) => s.label === base);
  if (exact) return exact;
  const year = YEAR_WORDS.find(([re]) => re.test(base))?.[1];
  if (!year || !/ثانوي|بكالوريا|ثانوية/.test(base)) return null;
  const system: SystemId = /بكالوريا/.test(base) || year === 1 ? "bac" : "ta";
  return STAGES.find((s) => s.system === system && s.year === year) ?? null;
}

/** A student's stage and track, read from students.grade. */
export function parseStudentGrade(grade: string | null | undefined): { stage: Stage | null; track: TrackRef | null } {
  const stage = parseStage(grade);
  const trackName = grade?.split(" • ")[1]?.trim();
  const track = stage?.tracks.find((t) => t.name === trackName) ?? null;
  return { stage, track };
}

export const studentGradeText = (stage: Stage | null, track: TrackRef | null, fallback = "") =>
  stage ? (track ? `${stage.label} • ${track.name}` : stage.label) : fallback;

// ─── Subjects ────────────────────────────────────────────────────────────────

const ALIASES: Record<string, string> = {
  "انجليزي": "لغة أجنبية أولى", "إنجليزي": "لغة أجنبية أولى", "لغة إنجليزية": "لغة أجنبية أولى", "لغة انجليزية": "لغة أجنبية أولى", "english": "لغة أجنبية أولى",
  "عربي": "لغة عربية", "برمجة": "برمجة وذكاء اصطناعي",
};

/** "الفيزياء (مستوى رفيع)" → "فيزياء", so free text and curriculum names compare equal. */
export function normSubject(s: string | null | undefined): string {
  let x = (s ?? "").replace(/\(.*?\)/g, "").trim().toLowerCase();
  x = x.split(/\s+/).map((w) => w.replace(/^ال(?=..)/, "")).join(" ");
  return ALIASES[x] ?? x;
}

export function findSubject(stage: Stage | null, subject: string | null | undefined): SubjectDef | null {
  if (!stage || !subject) return null;
  return stage.subjects.find((x) => x.name === subject) ?? stage.subjects.find((x) => normSubject(x.name) === normSubject(subject)) ?? null;
}

/** Tracks a subject belongs to inside its stage ([] = shared by all / unknown). */
export function subjectTracks(stage: Stage | null, subject: string | null | undefined): TrackRef[] {
  const def = findSubject(stage, subject);
  if (!stage || !def || def.tracks === "all") return [];
  return stage.tracks.filter((t) => (def.tracks as string[]).includes(t.id));
}

/** The subjects a student studies in a stage/track. Choice subjects are the ones to pick from. */
export function planFor(stage: Stage | null, track: TrackRef | null): { core: SubjectDef[]; choice: SubjectDef[]; track: SubjectDef[] } {
  if (!stage) return { core: [], choice: [], track: [] };
  const inTrack = (s: SubjectDef) => s.tracks === "all" || (!!track && s.tracks.includes(track.id));
  return {
    core: stage.subjects.filter((s) => s.tracks === "all"),
    choice: stage.subjects.filter((s) => s.kind === "choice" && inTrack(s)),
    track: stage.subjects.filter((s) => s.tracks !== "all" && !s.kind && inTrack(s)),
  };
}

/** Does a class (grade + subject) belong to what this student studies? */
export function classFitsStudent(classGrade: string, classSubject: string | null, studentGrade: string): boolean {
  const { stage, track } = parseStudentGrade(studentGrade);
  const cs = parseStage(classGrade);
  if (!stage || !cs || cs.id !== stage.id) return false;
  const def = findSubject(stage, classSubject);
  if (!def) return true;
  return def.tracks === "all" || !track || def.tracks.includes(track.id);
}

export const subjectLook = (stage: Stage | null, subject: string | null | undefined) => {
  const def = findSubject(stage, subject);
  return { emoji: def?.emoji ?? "📚", color: def?.color ?? null };
};

/** "2 بكالوريا • الطب وعلوم الحياة" — compact form of a student's grade for chips. */
export function studentGradeShort(grade: string): string {
  const { stage, track } = parseStudentGrade(grade);
  return stage ? [stage.short, track?.name].filter(Boolean).join(" • ") : grade;
}
