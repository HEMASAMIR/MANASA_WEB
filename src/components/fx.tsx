"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cx } from "./ui";

/** Cycles through words with a flip-in animation (stays on the first word when motion is reduced). */
export function RotatingWord({ words, className, interval = 2600 }: { words: string[]; className?: string; interval?: number }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setI((x) => (x + 1) % words.length), interval);
    return () => clearInterval(t);
  }, [words.length, interval]);
  return (
    <span className={cx("inline-block [perspective:600px]", className)}>
      <span key={i} className="word-in">{words[i]}</span>
    </span>
  );
}

/** Endless horizontal ribbon; children are rendered twice so the loop is seamless. */
export function Marquee({ children, reverse, className }: { children: ReactNode; reverse?: boolean; className?: string }) {
  return (
    <div className={cx("marquee", className)}>
      <div className={cx("marquee-track", reverse && "reverse")}>
        <div className="flex shrink-0 gap-3 pe-3">{children}</div>
        <div aria-hidden className="flex shrink-0 gap-3 pe-3">{children}</div>
      </div>
    </div>
  );
}
