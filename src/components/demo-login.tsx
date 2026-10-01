"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { BadgeCheck, GraduationCap, LayoutDashboard, Sparkles, UserCog, Users, type LucideIcon } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { isDemo } from "@/lib/supabase";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/demo/seed";
import { homeFor } from "@/lib/types";
import { friendlyError } from "@/lib/errors";
import { Spinner, cx, useUi } from "./ui";

const META: Record<string, { icon: LucideIcon; desc: string; tone: string }> = {
  admin: { icon: LayoutDashboard, desc: "كل الصلاحيات: الطلاب، المالية، الإعدادات", tone: "from-teal-500 to-teal-700" },
  teacher: { icon: UserCog, desc: "مجموعاته، الحضور، الدرجات، الكورسات", tone: "from-sky-500 to-sky-700" },
  assistant: { icon: BadgeCheck, desc: "الحضور والدرجات بصلاحيات محددة", tone: "from-violet-500 to-violet-700" },
  student: { icon: GraduationCap, desc: "الكورسات، الكويزات، الدرجات", tone: "from-amber-400 to-amber-600" },
  parent: { icon: Users, desc: "متابعة الأبناء والمدفوعات", tone: "from-rose-500 to-rose-700" },
};

/** One-click logins for the demo backend (only shown when the real database is unreachable). */
export function DemoLogin() {
  const { login, loading } = useAuth();
  const { toast } = useUi();
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const auto = useRef(false);

  const go = async (email: string, key: string) => {
    setBusy(key);
    try {
      const p = await login(email, DEMO_PASSWORD);
      const next = new URLSearchParams(window.location.search).get("next");
      router.replace(next && next.startsWith("/") ? next : homeFor(p.role));
    } catch (e) {
      toast(friendlyError(e), "error");
      setBusy(null);
    }
  };

  useEffect(() => {
    if (loading || auto.current || !isDemo()) return;
    const as = new URLSearchParams(window.location.search).get("as");
    const acc = DEMO_ACCOUNTS.find((a) => a.key === as);
    if (acc) {
      auto.current = true;
      go(acc.email, acc.key);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  if (loading || !isDemo()) return null;

  return (
    <div className="mt-8 rounded-[24px] border border-amber-200 bg-gradient-to-b from-amber-50 to-white p-4 dark:border-amber-900/60 dark:from-amber-950/30 dark:to-surface">
      <div className="mb-3 flex items-center gap-2 text-sm font-black text-amber-800 dark:text-amber-300">
        <Sparkles className="size-4" /> جرّب المنصة الآن — دخول تجريبي بضغطة
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {DEMO_ACCOUNTS.map((a) => {
          const m = META[a.key];
          return (
            <button key={a.key} onClick={() => go(a.email, a.key)} disabled={!!busy}
              className={cx("group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-2.5 text-start transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-lg disabled:opacity-60 dark:border-line dark:bg-surface-2 cursor-pointer", a.key === "admin" && "sm:col-span-2")}>
              <span className={cx("grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow-md transition group-hover:scale-105", m.tone)}>
                {busy === a.key ? <Spinner className="size-5 text-white" /> : <m.icon className="size-5" />}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-black text-navy dark:text-white">{a.label}</span>
                <span className="block truncate text-[11.5px] text-muted">{m.desc}</span>
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-center text-[11px] text-muted">نسخة تجريبية ببيانات وهمية — جرّب الإضافة والتعديل والحذف بحرية</p>
    </div>
  );
}
