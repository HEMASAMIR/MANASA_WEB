"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Scroll animations for the whole site.
 *
 *  data-reveal="up|down|start|end|zoom|blur|flip"  animates the element in when it scrolls into view
 *  data-reveal-stagger="90"                         children with data-reveal appear one after another (ms)
 *  data-count="350" [data-suffix="%"]               number counts up from 0 when revealed
 *  data-parallax="0.15"                             element drifts with the scroll
 *
 * Cards inside the portals (<main data-reveal-auto>) are revealed automatically.
 * State lives in data-* attributes (never className) so React re-renders don't undo it.
 */
export function Motion() {
  const pathname = usePathname();

  useEffect(() => {
    const html = document.documentElement;
    html.classList.add("reveal-active", "motion-on");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const countUp = (el: HTMLElement) => {
      if (el.dataset.counted) return;
      el.dataset.counted = "1";
      const target = Number(el.dataset.count);
      if (!Number.isFinite(target)) return;
      const suffix = el.dataset.suffix ?? "";
      if (reduce) {
        el.textContent = `${target.toLocaleString("en-US")}${suffix}`;
        return;
      }
      const start = performance.now();
      const dur = 1400;
      const step = (now: number) => {
        const p = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - p, 4);
        el.textContent = `${Math.round(target * eased).toLocaleString("en-US")}${suffix}`;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const show = (el: HTMLElement) => {
      el.setAttribute("data-shown", "");
      el.querySelectorAll<HTMLElement>("[data-count]").forEach(countUp);
      if (el.dataset.count) countUp(el);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            show(e.target as HTMLElement);
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );

    const AUTO = '[class*="rounded-3xl"],[class*="rounded-[28px]"],[class*="rounded-[2rem]"],[class*="rounded-[24px]"],[class*="rounded-[30px]"]';

    const scan = (root: ParentNode) => {
      // Portal pages: tag top-level cards automatically.
      root.querySelectorAll<HTMLElement>("[data-reveal-auto]").forEach((main) => {
        main.querySelectorAll<HTMLElement>(AUTO).forEach((el) => {
          if (el.hasAttribute("data-reveal") || el.closest("[data-reveal],[data-no-reveal],[role=dialog]")) return;
          if (el.parentElement?.closest(AUTO)) return;
          el.setAttribute("data-reveal", "up");
        });
      });
      // Staggered groups.
      root.querySelectorAll<HTMLElement>("[data-reveal-stagger]").forEach((group) => {
        const step = Number(group.dataset.revealStagger) || 90;
        let i = 0;
        for (const child of Array.from(group.children) as HTMLElement[]) {
          if (!child.hasAttribute("data-reveal")) child.setAttribute("data-reveal", group.dataset.revealChild || "up");
          child.style.setProperty("--rd", `${Math.min(i, 12) * step}ms`);
          i++;
        }
      });
      root.querySelectorAll<HTMLElement>("[data-reveal]:not([data-shown]):not([data-watched])").forEach((el) => {
        el.setAttribute("data-watched", "");
        io.observe(el);
      });
      root.querySelectorAll<HTMLElement>("[data-count]:not([data-counted])").forEach((el) => {
        if (!el.closest("[data-reveal]")) io.observe(el);
      });
    };

    scan(document);
    // New content (data loads, route changes): rescan once per frame.
    let pending = 0;
    const mo = new MutationObserver((muts) => {
      if (pending || !muts.some((m) => m.addedNodes.length)) return;
      pending = requestAnimationFrame(() => {
        pending = 0;
        scan(document);
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });

    // Parallax
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const y = window.scrollY;
        document.querySelectorAll<HTMLElement>("[data-parallax]").forEach((el) => {
          el.style.setProperty("--py", `${y * Number(el.dataset.parallax || 0.15)}px`);
        });
      });
    };
    if (!reduce) window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      io.disconnect();
      // Let the next run (Strict Mode re-run, route change) observe whatever hasn't been revealed yet.
      document.querySelectorAll("[data-watched]:not([data-shown])").forEach((el) => el.removeAttribute("data-watched"));
      mo.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [pathname]);

  return <ScrollProgress />;
}

/** Thin teal → gold bar at the very top that fills as you scroll. */
function ScrollProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const on = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setP(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
    };
  }, []);
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[90] h-[3px] no-print">
      <div className="scroll-progress h-full origin-left rtl:origin-right" style={{ transform: `scaleX(${p})` }} />
    </div>
  );
}
