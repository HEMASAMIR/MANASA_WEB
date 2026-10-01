"use client";

import { Bell, Home, MessageCircle } from "lucide-react";
import { PortalShell, RoleGuard, type NavItem } from "@/components/shell";

const NAV: NavItem[] = [
  { href: "/parent", label: "أبنائي", icon: Home, bottom: true },
  { href: "/parent/messages", label: "الرسائل", icon: MessageCircle, bottom: true },
  { href: "/parent/notifications", label: "الإشعارات", icon: Bell, bottom: true, badgeKey: "notifications" },
];

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard roles={["parent"]}>
      <PortalShell nav={NAV} portalLabel="بوابة ولي الأمر" notificationsHref="/parent/notifications">{children}</PortalShell>
    </RoleGuard>
  );
}
