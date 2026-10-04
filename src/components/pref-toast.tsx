"use client";

import { useEffect, useState } from "react";
import { Languages, Moon, Sun } from "lucide-react";
import { PREFERENCE_EVENT, type PreferenceChange } from "@/lib/notice";

const DURATION = 2800;

/** Elegant confirmation shown when the user switches theme or language. Written in the new language. */
export function PreferenceToast() {
  const [toast, setToast] = useState<(PreferenceChange & { id: number }) | null>(null);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    let hide = 0;
    let drop = 0;
    const on = (e: Event) => {
      const detail = (e as CustomEvent<PreferenceChange>).detail;
      window.clearTimeout(hide);
      window.clearTimeout(drop);
      setLeaving(false);
      setToast({ ...detail, id: Date.now() });
      hide = window.setTimeout(() => setLeaving(true), DURATION);
      drop = window.setTimeout(() => setToast(null), DURATION + 400);
    };
    window.addEventListener(PREFERENCE_EVENT, on);
    return () => {
      window.removeEventListener(PREFERENCE_EVENT, on);
      window.clearTimeout(hide);
      window.clearTimeout(drop);
    };
  }, []);

  if (!toast) return null;
  const en = toast.kind === "lang" ? toast.value === "en" : document.documentElement.lang === "en";
  const c =
    toast.kind === "theme"
      ? toast.value === "dark"
        ? { Icon: Moon, tile: "bg-[linear-gradient(135deg,#1e3a8a,#0e2c4e)] text-amber-300", bar: "#fbbf24",
            title: en ? "Dark mode is on" : "الوضع الليلي اتفعّل", sub: en ? "Easier on your eyes for late-night study 🌙" : "مريح لعينك في مذاكرة الليل 🌙" }
        : { Icon: Sun, tile: "bg-gold text-navy", bar: "#f59e0b",
            title: en ? "Light mode is on" : "الوضع النهاري اتفعّل", sub: en ? "Brighter colours, sharper text ☀️" : "ألوان أنصع وكلام أوضح ☀️" }
      : toast.value === "en"
        ? { Icon: Languages, tile: "bg-brand text-white", bar: "#14b8a6", title: "Switched to English", sub: "The whole platform is now in English 🌍" }
        : { Icon: Languages, tile: "bg-brand text-white", bar: "#14b8a6", title: "تم التحويل للعربية", sub: "المنصة كلها بقت بالعربي 🇪🇬" };

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[120] flex justify-center px-4 no-print" data-no-translate>
      <div key={toast.id} role="status" aria-live="polite" dir={en ? "ltr" : "rtl"}
        className={`pref-toast pointer-events-auto relative flex w-full max-w-sm items-center gap-3.5 overflow-hidden rounded-[22px] border border-slate-200/80 bg-white/95 p-3.5 pe-5 shadow-[0_24px_50px_-14px_rgba(14,44,78,0.55)] ring-1 ring-black/5 backdrop-blur-xl dark:border-line dark:bg-surface/95 ${leaving ? "pref-toast-out" : ""}`}>
        <span className={`pref-icon grid size-12 shrink-0 place-items-center rounded-2xl shadow-lg ${c.tile}`}>
          <c.Icon className="size-6" />
        </span>
        <div className="min-w-0">
          <div className="truncate text-[15px] font-black text-ink">{c.title}</div>
          <div className="truncate text-xs font-semibold text-muted">{c.sub}</div>
        </div>
        <span className="pref-bar absolute inset-x-0 bottom-0 h-[3px]" style={{ background: c.bar, animationDuration: `${DURATION}ms` }} />
      </div>
    </div>
  );
}
