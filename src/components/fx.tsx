"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

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

/** Number that counts up the first time it scrolls into view (React-managed, so later updates are safe). */
export function CountUp({ value, duration = 1300, format = (n: number) => n.toLocaleString("en-US") }: { value: number; duration?: number; format?: (n: number) => string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(0);
  const current = useRef(0);
  const started = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const run = () => {
      const from = current.current;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        current.current = value;
        setShown(value);
        return;
      }
      const t0 = performance.now();
      const step = (now: number) => {
        const p = Math.min(1, (now - t0) / duration);
        current.current = Math.round(from + (value - from) * (1 - Math.pow(1 - p, 4)));
        setShown(current.current);
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    // Already visible once: animate from the current number to the new one.
    if (started.current) {
      run();
      return () => cancelAnimationFrame(raf);
    }
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      started.current = true;
      run();
    }, { threshold: 0.2 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [value, duration]);
  return <span ref={ref} dir="ltr">{format(shown)}</span>;
}

/** Ticking clock (hh:mm with a blinking colon). */
export function LiveClock({ className }: { className?: string }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!now) return null;
  const h = now.getHours();
  const h12 = ((h + 11) % 12) + 1;
  const mm = String(now.getMinutes()).padStart(2, "0");
  return (
    <span className={className}>
      <span dir="ltr" className="tabular-nums">{h12}<span className={now.getSeconds() % 2 ? "opacity-30" : ""}>:</span>{mm}</span>{" "}
      <span className="text-[0.55em] font-bold opacity-80">{h < 12 ? "ص" : "م"}</span>
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
