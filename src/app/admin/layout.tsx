"use client";

import {
  Activity, BadgeCheck, Bell, BookOpen, ClipboardCheck, CreditCard, FileBarChart, GraduationCap, History, LayoutDashboard,
  Megaphone, MessageCircle, MessagesSquare, Settings, Trophy, Users, ListChecks,
} from "lucide-react";
import { PortalShell, RoleGuard, type NavItem } from "@/components/shell";
import { useStaffPerms } from "@/lib/auth";

function AdminFrame({ children }: { children: React.ReactNode }) {
  const p = useStaffPerms();
  const all: (NavItem & { show: boolean })[] = [
    { href: "/admin", label: "نظرة عامة", icon: LayoutDashboard, show: true, bottom: true },
    { href: "/admin/attendance", label: "الحضور", icon: ClipboardCheck, show: p.canTakeAttendance, bottom: true },
    { href: "/admin/students", label: "الطلاب", icon: GraduationCap, show: true, bottom: true },
    { href: "/admin/classes", label: "المجموعات والجدول", icon: Users, show: true },
    { href: "/admin/exams", label: "الامتحانات والدرجات", icon: ListChecks, show: p.canGrade, bottom: true },
    { href: "/admin/quizzes", label: "الكويزات التفاعلية", icon: BadgeCheck, show: p.canGrade },
    { href: "/admin/courses", label: "الكورسات والدروس", icon: BookOpen, show: p.canManage },
    { href: "/admin/finance", label: "المالية والاشتراكات", icon: CreditCard, show: p.canSeeFinance },
    { href: "/admin/messages", label: "الرسائل", icon: MessageCircle, show: p.canContactParents },
    { href: "/admin/leaderboard", label: "لوحة الشرف", icon: Trophy, show: p.canManage },
    { href: "/admin/broadcast", label: "إشعار جماعي", icon: Megaphone, show: p.canManage },
    { href: "/admin/reports", label: "التقارير والتحليلات", icon: FileBarChart, show: !p.isAssistant },
    { href: "/admin/people", label: "المدرسون والمساعدون", icon: Activity, show: p.canManage },
    { href: "/admin/chat-monitor", label: "مراقبة المحادثات", icon: MessagesSquare, show: p.isAdmin },
    { href: "/admin/notifications", label: "الإشعارات", icon: Bell, show: true, badgeKey: "notifications" },
    { href: "/admin/settings", label: "إعدادات المركز", icon: Settings, show: p.isAdmin },
    { href: "/admin/audit", label: "سجل العمليات", icon: History, show: p.isAdmin },
  ];
  const nav = all.filter((n) => n.show);
  return (
    <PortalShell nav={nav} portalLabel="لوحة الإدارة" notificationsHref="/admin/notifications">
      {children}
    </PortalShell>
  );
}

const STAFF = ["admin", "teacher", "assistant"] as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard roles={[...STAFF]}>
      <AdminFrame>{children}</AdminFrame>
    </RoleGuard>
  );
}
