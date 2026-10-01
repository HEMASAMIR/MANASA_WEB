"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { EN } from "./i18n-en";

export type Lang = "ar" | "en";

const AR = /[؀-ۿ]/;
const ATTRS = ["placeholder", "title", "aria-label", "alt"];

// Dictionary helpers ----------------------------------------------------------
const dict = new Map<string, string>();
for (const [k, v] of Object.entries(EN)) dict.set(k.trim(), v);

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** Every known phrase, longest first, matched only on whole words. */
const phraseRe = new RegExp(
  `(?<![\\u0600-\\u06FF])(${[...dict.keys()].filter((k) => AR.test(k)).sort((a, b) => b.length - a.length).map(escape).join("|")})(?![\\u0600-\\u06FF])`,
  "g",
);

/** Sentences that carry numbers or names. */
const PATTERNS: [RegExp, (m: RegExpMatchArray) => string][] = [
  [/^غاب (\d+) مرات$/, (m) => `Absent ${m[1]} times`],
  [/^غياب (\d+)$/, (m) => `Absences ${m[1]}`],
  [/^حضور (\d+)%$/, (m) => `Attendance ${m[1]}%`],
  [/^متوسط (\d+)%$/, (m) => `Average ${m[1]}%`],
  [/^منذ (\d+) دقيقة$/, (m) => `${m[1]} min ago`],
  [/^منذ (\d+) ساعة$/, (m) => `${m[1]} h ago`],
  [/^منذ (\d+) يوم$/, (m) => `${m[1]} days ago`],
  [/^(\d+) طالب مسجل$/, (m) => `${m[1]} registered students`],
  [/^(\d+) طالب$/, (m) => `${m[1]} students`],
  [/^(\d+) درس$/, (m) => `${m[1]} lessons`],
  [/^(\d+) سؤال$/, (m) => `${m[1]} questions`],
  [/^(\d+) شهر$/, (m) => `${m[1]} month${m[1] === "1" ? "" : "s"}`],
  [/^(\d+) دقيقة$/, (m) => `${m[1]} min`],
  [/^آخر (\d+) يوم$/, (m) => `Last ${m[1]} days`],
  [/^(\d+) ساعة و (\d+) دقيقة$/, (m) => `${m[1]} h ${m[2]} min`],
  [/^(\d+) ساعة$/, (m) => `${m[1]} h`],
  [/^(\d+) إشعار غير مقروء$/, (m) => `${m[1]} unread notifications`],
  [/^المحاولة (\d+) من (\d+)/, (m) => `Attempt ${m[1]} of ${m[2]}`],
  [/^سؤال (\d+) من (\d+)$/, (m) => `Question ${m[1]} of ${m[2]}`],
  [/^(\d+) درجة$/, (m) => `${m[1]} marks`],
  [/^أهلاً (.+) 👋$/, (m) => `Hello ${m[1]} 👋`],
];

function translate(text: string): string {
  if (!AR.test(text)) return text;
  const lead = text.match(/^\s*/)![0];
  const trail = text.match(/\s*$/)![0];
  const core = text.trim();
  const exact = dict.get(core);
  if (exact !== undefined) return lead + exact + trail;
  for (const [re, fn] of PATTERNS) {
    const m = core.match(re);
    if (m) return lead + fn(m) + trail;
  }
  return text.replace(phraseRe, (p) => dict.get(p) ?? p);
}

// DOM translation -------------------------------------------------------------
interface Saved { ar: string; en: string }
const textStore = new WeakMap<Node, Saved>();
const attrStore = new WeakMap<Element, Record<string, Saved>>();

function translateText(node: Text) {
  const cur = node.nodeValue ?? "";
  const saved = textStore.get(node);
  if (saved && cur === saved.en) return;
  if (!AR.test(cur)) return;
  const en = translate(cur);
  textStore.set(node, { ar: cur, en });
  if (en !== cur) node.nodeValue = en;
}

function translateAttrs(el: Element) {
  for (const a of ATTRS) {
    const cur = el.getAttribute(a);
    if (!cur) continue;
    const bag = attrStore.get(el) ?? {};
    if (bag[a] && cur === bag[a].en) continue;
    if (!AR.test(cur)) continue;
    const en = translate(cur);
    bag[a] = { ar: cur, en };
    attrStore.set(el, bag);
    if (en !== cur) el.setAttribute(a, en);
  }
}

function walk(root: Node) {
  if (root.nodeType === Node.TEXT_NODE) return translateText(root as Text);
  if (root.nodeType !== Node.ELEMENT_NODE) return;
  const el = root as Element;
  if (el.closest("script,style,textarea,[data-no-translate]")) return;
  translateAttrs(el);
  const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let n: Node | null = tw.nextNode();
  while (n) {
    if (n.nodeType === Node.TEXT_NODE) {
      const p = n.parentElement;
      if (p && !p.closest("script,style,textarea,[data-no-translate]")) translateText(n as Text);
    } else translateAttrs(n as Element);
    n = tw.nextNode();
  }
}

function restore(root: Node) {
  const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let n: Node | null = tw.currentNode;
  while (n) {
    if (n.nodeType === Node.TEXT_NODE) {
      const s = textStore.get(n);
      if (s && n.nodeValue === s.en) n.nodeValue = s.ar;
    } else {
      const bag = attrStore.get(n as Element);
      if (bag) for (const [a, s] of Object.entries(bag)) if ((n as Element).getAttribute(a) === s.en) (n as Element).setAttribute(a, s.ar);
    }
    n = tw.nextNode();
  }
}

// Context ---------------------------------------------------------------------

const Ctx = createContext<{ lang: Lang; setLang(l: Lang): void; toggle(): void; t(s: string): string }>({
  lang: "ar", setLang() {}, toggle() {}, t: (s) => s,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");
  const observer = useRef<MutationObserver | null>(null);

  const apply = useCallback((l: Lang) => {
    const html = document.documentElement;
    html.lang = l;
    html.dir = l === "en" ? "ltr" : "rtl";
    observer.current?.disconnect();
    observer.current = null;
    if (l === "en") {
      walk(document.body);
      const mo = new MutationObserver((muts) => {
        for (const m of muts) {
          if (m.type === "characterData") translateText(m.target as Text);
          else if (m.type === "attributes") translateAttrs(m.target as Element);
          else m.addedNodes.forEach((n) => walk(n));
        }
      });
      mo.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
      observer.current = mo;
      const title = translate(document.title);
      if (title !== document.title) document.title = title;
    } else {
      restore(document.body);
    }
    html.classList.remove("i18n-pending");
  }, []);

  useEffect(() => {
    let saved: Lang = "ar";
    try {
      saved = localStorage.getItem("lang") === "en" ? "en" : "ar";
    } catch {}
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLangState(saved);
    apply(saved);
    return () => observer.current?.disconnect();
  }, [apply]);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("lang", l);
    } catch {}
    apply(l);
  };

  return (
    <Ctx.Provider value={{ lang, setLang, toggle: () => setLang(lang === "ar" ? "en" : "ar"), t: (s) => (lang === "en" ? translate(s) : s) }}>
      {children}
    </Ctx.Provider>
  );
}

export const useLang = () => useContext(Ctx);

/** Small "EN / ع" switch used in every header. */
export function LangSwitch({ className }: { className?: string }) {
  const { lang, toggle } = useLang();
  return (
    <button
      onClick={toggle}
      data-no-translate
      aria-label={lang === "ar" ? "Switch to English" : "التحويل للعربية"}
      title={lang === "ar" ? "English" : "العربية"}
      className={className ?? "grid h-10 min-w-10 place-items-center rounded-full border border-slate-200 bg-surface px-3 text-sm font-black text-navy transition hover:border-teal-300 dark:border-line dark:text-white cursor-pointer"}
    >
      {lang === "ar" ? "EN" : "ع"}
    </button>
  );
}
