export type Role = "admin" | "teacher" | "assistant" | "parent" | "student";

export const ROLE_LABEL: Record<Role, string> = {
  admin: "مدير النظام",
  teacher: "مدرس",
  assistant: "مساعد",
  parent: "ولي أمر",
  student: "طالب",
};

export const isStaffRole = (r: Role) => r === "admin" || r === "teacher" || r === "assistant";

export function homeFor(role: Role): string {
  if (isStaffRole(role)) return "/admin";
  if (role === "student") return "/student";
  return "/parent";
}

export interface Profile {
  id: string;
  email: string | null;
  role: Role;
  name: string;
  phone: string | null;
  avatar_url: string | null;
  subject: string | null;
  status: "active" | "disabled";
  created_at: string;
}

export interface Assistant {
  id: string;
  teacher_id: string;
  role_title: string;
  can_scan_attendance: boolean;
  can_enter_grades: boolean;
  can_contact_parents: boolean;
  can_view_financials: boolean;
  is_active: boolean;
}

export interface AppSettings {
  center_name: string;
  logo_url: string | null;
  contact_phone: string | null;
  currency: string;
  country_code: string;
  timezone: string;
  campus_lat: number | null;
  campus_lng: number | null;
  campus_radius_m: number;
  geofence_enabled: boolean;
  late_after_minutes: number;
  absence_warning_count: number;
  absence_danger_count: number;
  absence_critical_count: number;
}

export interface ScheduleSlot {
  id?: string;
  class_id?: string;
  weekday: number;
  start_time: string;
  end_time: string;
  room?: string | null;
}

export interface ClassRow {
  id: string;
  name: string;
  grade: string;
  subject: string | null;
  teacher_id: string | null;
  room: string | null;
  monthly_fee: number;
  capacity: number | null;
  whatsapp_group_url: string | null;
  is_active: boolean;
  created_at: string;
  class_schedule?: ScheduleSlot[];
  user_profiles?: { name: string } | null;
  enrollments?: { count: number }[];
}

export interface Student {
  id: string;
  student_code: string;
  name: string;
  grade: string;
  parent_name: string | null;
  parent_phone: string;
  student_phone: string | null;
  photo_url: string | null;
  user_id: string | null;
  status: "active" | "suspended" | "archived";
  subscription_end: string | null;
  notes: string | null;
  created_at: string;
}

export interface StudentSummaryRow {
  student_id: string;
  present_count: number;
  absent_count: number;
  late_count: number;
  excused_count: number;
  total_sessions: number;
  attendance_pct: number | null;
  avg_percent: number | null;
  total_paid: number;
  is_overdue: boolean;
}

export interface StudentSummary {
  student: Student;
  classes: { id: string; name: string }[];
  stats: StudentSummaryRow | null;
}

export type AttendanceStatus = "present" | "absent" | "late" | "excused";

export const STATUS_LABEL: Record<AttendanceStatus, string> = {
  present: "حاضر",
  absent: "غائب",
  late: "متأخر",
  excused: "بعذر",
};

export const STATUS_TONE: Record<AttendanceStatus, Tone> = {
  present: "success",
  absent: "danger",
  late: "warning",
  excused: "info",
};

export type Tone = "primary" | "success" | "danger" | "warning" | "info" | "neutral";

export interface AttendanceRecord {
  id: string;
  student_id: string;
  class_id: string;
  date: string;
  status: AttendanceStatus;
  method: string;
  note: string | null;
  recorded_at: string;
  students?: { name: string; student_code: string } | null;
  classes?: { name: string } | null;
}

export interface Exam {
  id: string;
  title: string;
  kind: "exam" | "quiz" | "homework";
  subject: string | null;
  max_score: number;
  class_id: string;
  exam_date: string | null;
  exam_time: string | null;
  duration_minutes: number | null;
  question_count: number | null;
  is_published: boolean;
  created_at: string;
  classes?: { name: string } | null;
}

export const EXAM_KIND_LABEL: Record<Exam["kind"], string> = { exam: "امتحان", quiz: "كويز", homework: "واجب" };

export interface Grade {
  id: string;
  exam_id: string;
  student_id: string;
  score: number;
  remarks: string | null;
  updated_at: string;
  exams?: { title: string; max_score: number; kind: string; exam_date: string | null } | null;
}

export interface Payment {
  id: string;
  student_id: string;
  class_id: string | null;
  amount: number;
  method: string;
  kind: "subscription" | "registration" | "materials" | "other";
  notes: string | null;
  paid_at: string;
  students?: { name: string; student_code: string } | null;
  classes?: { name: string } | null;
  user_profiles?: { name: string } | null;
}

export const PAYMENT_KIND_LABEL: Record<Payment["kind"], string> = {
  subscription: "اشتراك شهري",
  registration: "رسوم تسجيل",
  materials: "مذكرات ومواد",
  other: "أخرى",
};

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  cash: "نقداً",
  wallet: "محفظة إلكترونية",
  card: "بطاقة",
  transfer: "تحويل بنكي",
};

export interface NotificationRow {
  id: string;
  title: string;
  body: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface MessageRow {
  id: string;
  sender_id: string;
  recipient_id: string;
  student_id: string | null;
  body: string;
  read_at: string | null;
  created_at: string;
}

export interface ChatContact {
  id: string;
  name: string;
  phone?: string | null;
  subtitle?: string;
  studentId?: string | null;
}

export interface Course {
  id: string;
  title: string;
  description: string | null;
  class_id: string;
  icon: string;
  color: number;
  is_published: boolean;
  created_at: string;
  classes?: { name: string } | null;
  lessons?: { count: number }[] | Lesson[];
  user_profiles?: { name: string } | null;
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  duration_seconds: number;
  video_url: string | null;
  position: number;
  is_locked: boolean;
}

export interface Quiz {
  id: string;
  exam_id: string;
  class_id: string;
  description: string | null;
  duration_minutes: number | null;
  available_from: string | null;
  available_until: string | null;
  max_attempts: number;
  shuffle_questions: boolean;
  show_answers: boolean;
  created_at: string;
  exams?: { title: string; is_published: boolean; max_score: number; question_count: number | null } | null;
  classes?: { name: string } | null;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  position: number;
  kind: "mcq" | "tf";
  body: string;
  options: string[];
  correct_index: number;
  points: number;
  explanation: string | null;
}

export interface StaffStats {
  students: number;
  classes: number;
  teachers: number;
  exams: number;
  courses: number;
  revenue: number;
  revenue_month: number;
  present_today: number;
  absent_today: number;
}

export interface StaffUser extends Profile {
  assistant?: Assistant | null;
}
