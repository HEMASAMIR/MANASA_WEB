"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Bell, ChevronDown, LogOut, Menu, Moon, Sun, User, X, type LucideIcon } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { sb, APP_NAME } from "@/lib/supabase";
import { notificationApi } from "@/lib/api";
import { homeFor, ROLE_LABEL, type Role } from "@/lib/types";
import { Avatar, IconButton, Spinner, cx, useUi } from "./ui";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Shown in the phone bottom bar (max 4). */
  bottom?: boolean;
  badgeKey?: "notifications";
}

/** Blocks the page until the user is known; sends others to their own portal. */
export function RoleGuard({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { loading, profile } = useAuth();
  const router = useRouter();
  const ok = !!profile && roles.includes(profile.role);

  useEffect(() => {
    if (loading) return;
    if (!profile) router.replace("/login");
    else if (!roles.includes(profile.role)) router.replace(homeFor(profile.role));
  }, [loading, profile, roles, router]);

  if (!ok) {
    return (
      <div className="grid min-h-screen place-items-center portal-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="grid size-16 place-items-center rounded-3xl bg-brand shadow-lg animate-float">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="" className="size-12 rounded-2xl object-cover" />
          </div>
          <Spinner className="size-6" />
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

function useUnreadNotifications() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    if (!user) return;
    let alive = true;
    const refresh = () => notificationApi.unreadCount().then((c) => alive && setCount(c)).catch(() => {});
    refresh();
    const ch = sb()
      .channel(`notif-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, refresh)
      .subscribe();
    const t = setInterval(refresh, 60000);
    return () => {
      alive = false;
      clearInterval(t);
      sb().removeChannel(ch);
    };
  }, [user, pathname]);
  return count;
}

export function PortalShell({ nav, children, portalLabel, notificationsHref }: {
  nav: NavItem[];
  children: ReactNode;
  portalLabel: string;
  notificationsHref: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, settings, logout } = useAuth();
  const { mode, toggle } = useTheme();
  const { confirm } = useUi();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const unread = useUnreadNotifications();

  const base = nav[0]?.href ?? "/";
  const isActive = (href: string) => (href === base ? pathname === href : pathname === href || pathname.startsWith(href + "/"));
  const current = nav.find((n) => isActive(n.href));
  const centerName = settings?.center_name || APP_NAME;

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => menuRef.current && !menuRef.current.contains(e.target as Node) && setMenu(false);
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const doLogout = async () => {
    if (await confirm({ title: "تسجيل الخروج", message: "هل تريد تسجيل الخروج من هذا الحساب؟", confirmLabel: "خروج", danger: true })) {
      await logout();
      router.replace("/login");
    }
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      {/* Brand card */}
      <div className="relative m-3 overflow-hidden rounded-[22px] bg-hero p-4 text-white shadow-[0_14px_30px_-14px_rgba(13,148,136,0.9)]">
        <div className="absolute -top-10 -start-10 size-32 rounded-full bg-white/10" />
        <div className="relative flex items-center gap-3">
          <div className="grid size-11 place-items-center overflow-hidden rounded-2xl border border-white/25 bg-white/15">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={settings?.logo_url || "/logo.png"} alt="" className="size-9 rounded-xl object-cover" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-[15px] font-black">{centerName}</div>
            <div className="text-[11.5px] text-white/75">{portalLabel}</div>
          </div>
        </div>
        <div className="relative mt-4 flex items-center gap-2.5 rounded-2xl bg-white/12 p-2.5">
          <div className="grid size-9 place-items-center rounded-full bg-white font-black text-primary-2">{profile?.name?.charAt(0) || "?"}</div>
          <div className="min-w-0">
            <div className="truncate text-[13px] font-bold">{profile?.name}</div>
            <div className="text-[11px] text-white/75">{profile ? ROLE_LABEL[profile.role] : ""}</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-3">
        {nav.map((n) => {
          const on = isActive(n.href);
          const Icon = n.icon;
          const badge = n.badgeKey === "notifications" ? unread : 0;
          return (
            <Link
              key={n.href}
              href={n.href}
              className={cx(
                "group flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-[14px] transition-all",
                on ? "bg-brand font-extrabold text-white shadow-[0_8px_18px_-8px_rgba(13,148,136,0.9)]" : "font-semibold text-ink/80 hover:bg-surface-3 hover:text-ink",
              )}
            >
              <Icon className={cx("size-[19px] shrink-0", on ? "text-white" : "text-muted group-hover:text-primary")} />
              <span className="flex-1 truncate">{n.label}</span>
              {badge > 0 && <span className={cx("rounded-full px-2 text-[11px] font-black", on ? "bg-white/25" : "bg-danger text-white")}>{badge > 99 ? "99+" : badge}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-line p-3">
        <button onClick={doLogout} className="flex w-full items-center gap-3 rounded-2xl bg-danger/8 px-3.5 py-2.5 text-[14px] font-bold text-danger transition hover:bg-danger/15 cursor-pointer">
          <LogOut className="size-[19px]" />
          تسجيل الخروج
        </button>
      </div>
    </div>
  );

  const bottom = nav.filter((n) => n.bottom).slice(0, 4);

  return (
    <div className="min-h-screen portal-bg">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 start-0 z-30 hidden w-[280px] border-e border-line bg-surface/80 backdrop-blur-xl lg:block">{sidebar}</aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 start-0 w-[290px] max-w-[86vw] rounded-e-[28px] border-e border-line bg-surface shadow-2xl animate-in">
            <button onClick={() => setOpen(false)} className="absolute top-4 end-4 z-10 grid size-9 place-items-center rounded-xl bg-white/15 text-white cursor-pointer" aria-label="إغلاق">
              <X className="size-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="lg:ps-[280px]">
        {/* Top bar */}
        <header className="sticky top-0 z-20 glass border-b border-line no-print">
          <div className="brand-stripe h-1"><span /><span /><span /></div>
          <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4 md:px-8">
            <IconButton icon={Menu} label="القائمة" className="lg:hidden" onClick={() => setOpen(true)} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[17px] font-black">{current?.label ?? centerName}</div>
            </div>
            <IconButton icon={mode === "dark" ? Sun : Moon} label={mode === "dark" ? "الوضع النهاري" : "الوضع الليلي"} onClick={toggle} />
            <IconButton icon={Bell} label="الإشعارات" badge={unread} onClick={() => router.push(notificationsHref)} />
            <div className="relative" ref={menuRef}>
              <button onClick={() => setMenu((v) => !v)} className="flex items-center gap-2 rounded-2xl border border-line bg-surface py-1 ps-1 pe-2.5 transition hover:border-primary/40 cursor-pointer">
                <Avatar name={profile?.name ?? "?"} size={32} />
                <span className="hidden max-w-32 truncate text-sm font-bold sm:block">{profile?.name}</span>
                <ChevronDown className="size-4 text-muted" />
              </button>
              {menu && (
                <div className="absolute end-0 top-12 w-60 overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl animate-in">
                  <div className="border-b border-line px-4 py-3">
                    <div className="truncate text-sm font-extrabold">{profile?.name}</div>
                    <div className="truncate text-xs text-muted">{profile?.email}</div>
                  </div>
                  <Link href={`${base}/profile`} onClick={() => setMenu(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold hover:bg-surface-3">
                    <User className="size-4 text-muted" /> الملف الشخصي
                  </Link>
                  <button onClick={doLogout} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-danger hover:bg-danger/10 cursor-pointer">
                    <LogOut className="size-4" /> تسجيل الخروج
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className={cx("mx-auto max-w-[1400px] px-4 py-6 md:px-8 md:py-8", bottom.length ? "pb-28 lg:pb-8" : "")}>{children}</main>
      </div>

      {/* Phone bottom bar */}
      {bottom.length > 0 && (
        <nav className="fixed inset-x-3 bottom-3 z-30 flex h-[68px] items-center rounded-3xl border border-line glass px-1.5 shadow-soft lg:hidden no-print">
          {bottom.map((n) => {
            const on = isActive(n.href);
            const Icon = n.icon;
            return (
              <Link key={n.href} href={n.href} className="flex flex-1 flex-col items-center gap-1">
                <span className={cx("grid h-8 place-items-center rounded-xl transition-all", on ? "w-12 bg-brand text-white shadow-[0_6px_14px_-6px_rgba(13,148,136,0.9)]" : "w-9 text-muted")}>
                  <Icon className="size-5" />
                </span>
                <span className={cx("text-[10.5px] leading-none", on ? "font-extrabold text-primary" : "font-semibold text-muted")}>{n.label.split(" ")[0]}</span>
              </Link>
            );
          })}
          <button onClick={() => setOpen(true)} className="flex flex-1 flex-col items-center gap-1 cursor-pointer">
            <span className="grid h-8 w-9 place-items-center rounded-xl text-muted"><Menu className="size-5" /></span>
            <span className="text-[10.5px] font-semibold leading-none text-muted">المزيد</span>
          </button>
        </nav>
      )}
    </div>
  );
}
