const WEEKDAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const MONTHS = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

export const Fmt = {
  weekdays: WEEKDAYS,

  /** 0 = Sunday, matching `class_schedule.weekday`. */
  dbWeekday: (d: Date) => d.getDay(),

  weekday: (d: Date) => WEEKDAYS[d.getDay()],

  monthName: (m: number) => MONTHS[m - 1] ?? "",

  /** "5 مارس 2026" */
  date(d: Date | string | null | undefined): string {
    if (!d) return "—";
    const x = typeof d === "string" ? parseDate(d) : d;
    return `${x.getDate()} ${MONTHS[x.getMonth()]} ${x.getFullYear()}`;
  },

  dateTime(d: Date | string): string {
    const x = typeof d === "string" ? new Date(d) : d;
    return `${Fmt.date(x)} • ${Fmt.time12(`${pad(x.getHours())}:${pad(x.getMinutes())}`)}`;
  },

  /** YYYY-MM-DD in local time. */
  isoDate(d: Date = new Date()): string {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  },

  /** "16:30:00" -> "4:30 م" */
  time12(t: string | null | undefined): string {
    if (!t) return "—";
    const [hs, ms] = t.split(":");
    const h = Number(hs);
    if (Number.isNaN(h)) return t;
    const suffix = h < 12 ? "ص" : "م";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${ms ?? "00"} ${suffix}`;
  },

  number(n: number | null | undefined): string {
    if (n === null || n === undefined) return "—";
    return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, "");
  },

  money(n: number | null | undefined, currency = "ج.م"): string {
    return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(n ?? 0)} ${currency}`;
  },

  timeAgo(d: Date | string): string {
    const x = typeof d === "string" ? new Date(d) : d;
    const s = Math.max(0, (Date.now() - x.getTime()) / 1000);
    if (s < 60) return "الآن";
    const m = Math.floor(s / 60);
    if (m < 60) return `منذ ${m} دقيقة`;
    const h = Math.floor(m / 60);
    if (h < 24) return `منذ ${h} ساعة`;
    const days = Math.floor(h / 24);
    if (days === 1) return "أمس";
    if (days < 30) return `منذ ${days} يوم`;
    return Fmt.date(x);
  },

  duration(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m >= 60) return `${Math.floor(m / 60)}:${pad(m % 60)}:${pad(s)}`;
    return `${m}:${pad(s)}`;
  },

  pct(n: number | null | undefined): string {
    return n === null || n === undefined ? "—" : `${Math.round(n)}%`;
  },
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Parses "YYYY-MM-DD" as a LOCAL date (not UTC midnight). */
export function parseDate(s: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(s);
}

/** Digits-only phone with country code, for wa.me links. */
export function whatsappLink(phone: string | null | undefined, text: string, countryCode = "20"): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("00")) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = countryCode + digits.slice(1);
  else if (!digits.startsWith(countryCode)) digits = countryCode + digits;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export const PALETTE = ["#0D9488", "#0EA5E9", "#10B981", "#F59E0B", "#EC4899", "#8B5CF6", "#14B8A6", "#EF4461"];

export function colorFor(key: string): string {
  let h = 0;
  for (const ch of key) h = (h + ch.charCodeAt(0)) % 997;
  return PALETTE[h % PALETTE.length];
}

/** Flutter stores colors as signed/unsigned ARGB ints. */
export function argbToHex(v: number | null | undefined, fallback = "#0D9488"): string {
  if (v === null || v === undefined) return fallback;
  const n = Number(v) >>> 0;
  return `#${(n & 0xffffff).toString(16).padStart(6, "0")}`;
}

export function hexToArgb(hex: string): number {
  return (0xff000000 + parseInt(hex.replace("#", ""), 16)) >>> 0;
}
