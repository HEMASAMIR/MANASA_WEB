"use client";

import {
  createContext, forwardRef, useCallback, useContext, useEffect, useState,
  type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes,
} from "react";
import { AlertTriangle, CheckCircle2, Inbox, Info, Loader2, RefreshCw, WifiOff, X, XCircle, type LucideIcon } from "lucide-react";
import { colorFor } from "@/lib/fmt";
import { friendlyError } from "@/lib/errors";
import type { Tone } from "@/lib/types";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

export const TONE_HEX: Record<Tone, string> = {
  primary: "#0D9488",
  success: "#10B981",
  danger: "#EF4461",
  warning: "#F59E0B",
  info: "#0EA5E9",
  neutral: "#64748B",
};

// ─── Buttons ─────────────────────────────────────────────────────────────────
type BtnVariant = "primary" | "secondary" | "ghost" | "danger" | "success" | "outline";
interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: LucideIcon;
}

export const Button = forwardRef<HTMLButtonElement, BtnProps>(function Button(
  { variant = "primary", size = "md", loading, icon: Icon, className, children, disabled, ...rest }, ref,
) {
  const v: Record<BtnVariant, string> = {
    primary: "bg-brand text-white shadow-[0_8px_20px_-8px_rgba(13,148,136,0.7)] hover:shadow-[0_12px_26px_-8px_rgba(13,148,136,0.8)] hover:-translate-y-px",
    secondary: "bg-primary-soft text-primary hover:bg-primary/20",
    ghost: "text-ink/80 hover:bg-surface-3",
    outline: "border border-line bg-surface text-ink hover:border-primary/50 hover:text-primary",
    danger: "bg-danger text-white hover:bg-danger/90 shadow-[0_8px_20px_-10px_rgba(239,68,97,0.8)]",
    success: "bg-success text-white hover:bg-success/90 shadow-[0_8px_20px_-10px_rgba(16,185,129,0.8)]",
  };
  const s = { sm: "h-9 px-3 text-sm gap-1.5 rounded-xl", md: "h-11 px-5 text-[15px] gap-2 rounded-2xl", lg: "h-13 px-7 text-base gap-2 rounded-2xl" }[size];
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cx(
        "inline-flex items-center justify-center font-bold transition-all duration-200 select-none cursor-pointer",
        "disabled:opacity-55 disabled:cursor-not-allowed disabled:translate-y-0 disabled:shadow-none",
        v[variant], s, className,
      )}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : Icon ? <Icon className="size-[18px]" /> : null}
      {children}
    </button>
  );
});

export function IconButton({ icon: Icon, label, className, badge, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { icon: LucideIcon; label: string; badge?: number }) {
  return (
    <button
      title={label}
      aria-label={label}
      className={cx(
        "relative inline-flex size-10 items-center justify-center rounded-xl border border-line bg-surface text-ink/80 transition hover:border-primary/40 hover:text-primary cursor-pointer",
        className,
      )}
      {...rest}
    >
      <Icon className="size-[19px]" />
      {badge ? (
        <span className="absolute -top-1.5 -end-1.5 min-w-5 h-5 px-1 rounded-full bg-danger text-white text-[10px] font-black grid place-items-center ring-2 ring-surface">
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
    </button>
  );
}

// ─── Surfaces ────────────────────────────────────────────────────────────────
export function Card({ children, className, onClick, padded = true }: { children: ReactNode; className?: string; onClick?: () => void; padded?: boolean }) {
  return (
    <div
      onClick={onClick}
      className={cx(
        "rounded-3xl border border-line bg-surface shadow-soft",
        padded && "p-5",
        onClick && "cursor-pointer transition hover:-translate-y-0.5 hover:border-primary/40",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function IconBadge({ icon: Icon, color = TONE_HEX.primary, size = 46 }: { icon: LucideIcon; color?: string; size?: number }) {
  return (
    <div
      className="grid shrink-0 place-items-center text-white"
      style={{
        width: size, height: size, borderRadius: size * 0.32,
        background: `linear-gradient(135deg, color-mix(in srgb, ${color} 78%, white), ${color})`,
        boxShadow: `0 8px 18px -8px ${color}`,
      }}
    >
      <Icon style={{ width: size * 0.48, height: size * 0.48 }} />
    </div>
  );
}

export function StatCard({ label, value, icon, tone = "primary", hint }: { label: string; value: ReactNode; icon: LucideIcon; tone?: Tone; hint?: string }) {
  const color = TONE_HEX[tone];
  return (
    <div className="relative overflow-hidden rounded-3xl border border-line bg-surface p-5 shadow-soft animate-in">
      <div className="absolute -top-10 -end-10 size-32 rounded-full" style={{ background: `${color}14` }} />
      <div className="relative flex items-center gap-4">
        <IconBadge icon={icon} color={color} />
        <div className="min-w-0">
          <div className="text-2xl font-black leading-tight truncate">{value}</div>
          <div className="text-[13px] font-semibold text-muted truncate">{label}</div>
          {hint && <div className="text-[11px] text-muted/80 mt-0.5">{hint}</div>}
        </div>
      </div>
    </div>
  );
}

export function Badge({ children, tone = "primary", dot = true }: { children: ReactNode; tone?: Tone; dot?: boolean }) {
  const c = TONE_HEX[tone];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11.5px] font-extrabold whitespace-nowrap"
      style={{ color: c, background: `${c}1a`, border: `1px solid ${c}40` }}
    >
      {dot && <span className="size-1.5 rounded-full" style={{ background: c }} />}
      {children}
    </span>
  );
}

/** First letter of a name, skipping titles such as "أ." / "د." / "Mr." */
export function initialOf(name: string): string {
  return (name || "").trim().replace(/^(أ\.|د\.|م\.|Mr\.|Ms\.|Mrs\.|Dr\.)\s*/i, "").charAt(0) || "?";
}

export function Avatar({ name, size = 44, src }: { name: string; size?: number; src?: string | null }) {
  const n = (name || "?").trim();
  const c = colorFor(n);
  const initial = initialOf(n);
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={n} className="rounded-full object-cover shrink-0" style={{ width: size, height: size }} />;
  }
  return (
    <div
      className="grid shrink-0 place-items-center rounded-full font-black text-white"
      style={{ width: size, height: size, fontSize: size * 0.4, background: `linear-gradient(135deg, color-mix(in srgb, ${c} 78%, white), ${c})`, boxShadow: `0 6px 14px -6px ${c}` }}
    >
      {initial}
    </div>
  );
}

export function PageHeader({ title, subtitle, actions, icon: Icon }: { title: string; subtitle?: ReactNode; actions?: ReactNode; icon?: LucideIcon }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 animate-in">
      <div className="flex items-center gap-3 min-w-0">
        {Icon && <IconBadge icon={Icon} size={48} />}
        <div className="min-w-0">
          <h1 className="text-2xl md:text-[28px] font-black tracking-tight truncate">{title}</h1>
          {subtitle && <p className="text-sm text-muted mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 mt-7 flex items-center gap-2.5">
      <span className="h-5 w-1 rounded-full bg-brand" />
      <h2 className="flex-1 text-[17px] font-extrabold">{children}</h2>
      {action}
    </div>
  );
}

// ─── Form controls ───────────────────────────────────────────────────────────
const fieldCls =
  "w-full rounded-2xl border border-line bg-surface-2 px-4 py-3 text-[15px] text-ink outline-none transition placeholder:text-muted/70 focus:border-primary focus:ring-4 focus:ring-primary/15 disabled:opacity-60";

export function Field({ label, error, hint, children, className }: { label?: string; error?: string | null; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cx("block", className)}>
      {label && <span className="mb-1.5 block text-[13px] font-bold text-ink/80">{label}</span>}
      {children}
      {error ? <span className="mt-1 block text-xs font-semibold text-danger">{error}</span> : hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { icon?: LucideIcon }>(function Input({ className, icon: Icon, ...p }, ref) {
  if (!Icon) return <input ref={ref} className={cx(fieldCls, className)} {...p} />;
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute top-1/2 start-3.5 size-[18px] -translate-y-1/2 text-muted" />
      <input ref={ref} className={cx(fieldCls, "ps-11", className)} {...p} />
    </div>
  );
});

export function Select({ className, children, ...p }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cx(fieldCls, "cursor-pointer appearance-none bg-[length:16px] bg-no-repeat bg-[position:left_14px_center] pe-4 ps-10", className)} style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236e7191' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }} {...p}>
      {children}
    </select>
  );
}

export function Textarea({ className, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx(fieldCls, "min-h-24 resize-y", className)} {...p} />;
}

export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange(v: boolean): void; label?: ReactNode; disabled?: boolean }) {
  return (
    <label className={cx("flex items-center justify-between gap-3 py-1.5", disabled ? "opacity-60" : "cursor-pointer")}>
      {label && <span className="text-sm font-semibold">{label}</span>}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cx("relative h-7 w-12 shrink-0 rounded-full transition", checked ? "bg-brand" : "bg-surface-3 border border-line")}
      >
        <span className={cx("absolute top-1 size-5 rounded-full bg-white shadow transition-all", checked ? "start-6" : "start-1")} />
      </button>
    </label>
  );
}

export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange(v: NoInfer<T>): void; items: { value: NoInfer<T>; label: string; icon?: LucideIcon; count?: number }[] }) {
  return (
    <div className="mb-5 flex gap-1.5 overflow-x-auto rounded-2xl border border-line bg-surface p-1.5 shadow-soft">
      {items.map((it) => {
        const on = it.value === value;
        const Icon = it.icon;
        return (
          <button
            key={it.value}
            onClick={() => onChange(it.value)}
            className={cx(
              "flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition cursor-pointer",
              on ? "bg-brand text-white shadow-[0_6px_14px_-6px_rgba(13,148,136,0.8)]" : "text-muted hover:text-ink hover:bg-surface-3",
            )}
          >
            {Icon && <Icon className="size-4" />}
            {it.label}
            {it.count !== undefined && <span className={cx("rounded-full px-1.5 text-[11px]", on ? "bg-white/25" : "bg-surface-3")}>{it.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function Chips<T extends string>({ value, onChange, items }: { value: T; onChange(v: NoInfer<T>): void; items: { value: NoInfer<T>; label: string }[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((it) => (
        <button
          key={it.value}
          onClick={() => onChange(it.value)}
          className={cx(
            "rounded-full border px-3.5 py-1.5 text-[13px] font-bold transition cursor-pointer",
            it.value === value ? "border-primary bg-primary-soft text-primary" : "border-line bg-surface text-muted hover:text-ink",
          )}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

// ─── States ──────────────────────────────────────────────────────────────────
export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cx("animate-spin text-primary", className ?? "size-8")} />;
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("skeleton rounded-2xl", className)} />;
}

export function LoadingBlock({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-3xl" />)}
      </div>
      {Array.from({ length: rows }).map((_, i) => <Skeleton key={i} className="h-16 rounded-3xl" />)}
    </div>
  );
}

function StateIcon({ icon: Icon, color }: { icon: LucideIcon; color: string }) {
  return (
    <div className="mx-auto grid size-24 place-items-center rounded-full" style={{ background: `radial-gradient(circle, ${color}2e, ${color}0a)` }}>
      <Icon className="size-11" style={{ color }} />
    </div>
  );
}

export function EmptyState({ message, icon = Inbox, action }: { message: string; icon?: LucideIcon; action?: ReactNode }) {
  return (
    <div className="py-14 text-center animate-in">
      <StateIcon icon={icon} color={TONE_HEX.primary} />
      <p className="mx-auto mt-4 max-w-md whitespace-pre-line text-[15px] font-semibold text-muted">{message}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="py-14 text-center animate-in">
      <StateIcon icon={WifiOff} color={TONE_HEX.danger} />
      <p className="mx-auto mt-4 max-w-md text-[15px] font-semibold">{message}</p>
      {onRetry && (
        <div className="mt-5 flex justify-center">
          <Button icon={RefreshCw} onClick={onRetry}>إعادة المحاولة</Button>
        </div>
      )}
    </div>
  );
}

/** Renders loading / error / content for a `useAsync` result. */
export function Async<T>({ state, children, empty, emptyMessage, emptyIcon }: {
  state: { data: T | null; error: string | null; loading: boolean; reload(): void };
  children: (data: T) => ReactNode;
  empty?: (data: T) => boolean;
  emptyMessage?: string;
  emptyIcon?: LucideIcon;
}) {
  if (state.loading && state.data === null) return <LoadingBlock />;
  if (state.error && state.data === null) return <ErrorState message={state.error} onRetry={state.reload} />;
  if (state.data === null) return null;
  if (empty?.(state.data)) return <EmptyState message={emptyMessage ?? "لا توجد بيانات"} icon={emptyIcon} />;
  return <>{children(state.data)}</>;
}

// ─── Modal ───────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, footer, wide }: { open: boolean; onClose(): void; title: ReactNode; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-[#0b0d1a]/55 backdrop-blur-sm animate-in" onClick={onClose} />
      <div className={cx("relative flex max-h-[92vh] w-full flex-col rounded-t-[28px] sm:rounded-[28px] border border-line bg-surface shadow-2xl animate-in", wide ? "sm:max-w-3xl" : "sm:max-w-lg")}>
        <div className="flex items-center justify-between gap-3 border-b border-line px-6 py-4">
          <h3 className="text-lg font-black">{title}</h3>
          <button onClick={onClose} className="grid size-9 place-items-center rounded-xl text-muted hover:bg-surface-3 cursor-pointer" aria-label="إغلاق">
            <X className="size-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}

// ─── Toasts & confirm ────────────────────────────────────────────────────────
type ToastKind = "success" | "error" | "info";
interface ToastItem { id: number; kind: ToastKind; text: string }
interface ConfirmOpts { title: string; message: string; confirmLabel?: string; danger?: boolean }

const UiCtx = createContext<{
  toast(text: string, kind?: ToastKind): void;
  confirm(o: ConfirmOpts): Promise<boolean>;
  run<T>(fn: () => Promise<T>, success?: string): Promise<T | undefined>;
} | null>(null);

export function UiProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirm] = useState<(ConfirmOpts & { resolve(v: boolean): void }) | null>(null);

  const toast = useCallback((text: string, kind: ToastKind = "success") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const confirm = useCallback((o: ConfirmOpts) => new Promise<boolean>((resolve) => setConfirm({ ...o, resolve })), []);

  const run = useCallback(async <T,>(fn: () => Promise<T>, success?: string) => {
    try {
      const r = await fn();
      if (success) toast(success, "success");
      return r;
    } catch (e) {
      toast(friendlyError(e), "error");
      return undefined;
    }
  }, [toast]);

  const close = (v: boolean) => {
    confirmState?.resolve(v);
    setConfirm(null);
  };

  const icons = { success: CheckCircle2, error: XCircle, info: Info };
  const colors = { success: TONE_HEX.success, error: TONE_HEX.danger, info: TONE_HEX.info };

  return (
    <UiCtx.Provider value={{ toast, confirm, run }}>
      {children}
      <div className="pointer-events-none fixed bottom-5 inset-x-0 z-[100] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => {
          const I = icons[t.kind];
          return (
            <div key={t.id} className="pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl bg-[#0E2C4E] px-4 py-3 text-sm font-semibold text-white shadow-2xl animate-in dark:bg-[#2a2e48]">
              <I className="size-5 shrink-0" style={{ color: colors[t.kind] }} />
              <span>{t.text}</span>
            </div>
          );
        })}
      </div>
      <Modal
        open={!!confirmState}
        onClose={() => close(false)}
        title={
          <span className="flex items-center gap-2">
            {confirmState?.danger && <AlertTriangle className="size-5 text-danger" />}
            {confirmState?.title}
          </span>
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => close(false)}>إلغاء</Button>
            <Button variant={confirmState?.danger ? "danger" : "primary"} onClick={() => close(true)}>{confirmState?.confirmLabel ?? "تأكيد"}</Button>
          </>
        }
      >
        <p className="text-[15px] leading-7 text-ink/85">{confirmState?.message}</p>
      </Modal>
    </UiCtx.Provider>
  );
}

export function useUi() {
  const v = useContext(UiCtx);
  if (!v) throw new Error("useUi outside UiProvider");
  return v;
}

// ─── Tables ──────────────────────────────────────────────────────────────────
export function Table({ head, children }: { head: ReactNode[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-3xl border border-line bg-surface shadow-soft">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line bg-surface-2 text-muted">
            {head.map((h, i) => <th key={i} className="whitespace-nowrap px-4 py-3 text-start text-[12.5px] font-extrabold">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  );
}

export function Progress({ value, color = TONE_HEX.primary, className }: { value: number; color?: string; className?: string }) {
  return (
    <div className={cx("h-2 w-full overflow-hidden rounded-full bg-surface-3", className)}>
      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }} />
    </div>
  );
}

export function Ring({ value, size = 96, stroke = 9, color = TONE_HEX.primary, track = "var(--surface-3)", children }: { value: number; size?: number; stroke?: number; color?: string; track?: string; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (c * v) / 100} style={{ transition: "stroke-dashoffset 1s ease" }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}
