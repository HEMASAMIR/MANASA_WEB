"use client";

import { useId } from "react";

/**
 * Manara brand mark: a lighthouse (منارة) casting golden light, on a navy → teal tile.
 * Pure SVG, so it stays crisp at every size.
 */
export function LogoMark({ size = 48, className, rounded = true }: { size?: number; className?: string; rounded?: boolean }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} role="img" aria-label="Manara" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`bg-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0f766e" />
          <stop offset="0.55" stopColor="#0e3a5c" />
          <stop offset="1" stopColor="#0e2c4e" />
        </linearGradient>
        <radialGradient id={`glow-${id}`} cx="0.5" cy="0.32" r="0.55">
          <stop offset="0" stopColor="#fde68a" stopOpacity="0.95" />
          <stop offset="0.35" stopColor="#fbbf24" stopOpacity="0.45" />
          <stop offset="1" stopColor="#fbbf24" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`beam-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fcd34d" stopOpacity="0" />
          <stop offset="1" stopColor="#fcd34d" stopOpacity="0.75" />
        </linearGradient>
        <linearGradient id={`tower-${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#dff7f3" />
        </linearGradient>
        <clipPath id={`clip-${id}`}>
          <rect width="64" height="64" rx={rounded ? 16 : 0} />
        </clipPath>
      </defs>
      <g clipPath={`url(#clip-${id})`}>
        <rect width="64" height="64" fill={`url(#bg-${id})`} />
        <circle cx="32" cy="20" r="26" fill={`url(#glow-${id})`} />
        {/* light beams */}
        <path d="M32 19 L2 9 L2 25 Z" fill={`url(#beam-${id})`} transform="translate(64 0) scale(-1 1)" />
        <path d="M32 19 L2 9 L2 25 Z" fill={`url(#beam-${id})`} />
        {/* sea */}
        <path d="M0 52 C 8 49, 14 49, 22 52 S 36 55, 44 52 S 58 49, 64 52 V64 H0 Z" fill="#14b8a6" opacity="0.55" />
        <path d="M0 56 C 8 53, 14 53, 22 56 S 36 59, 44 56 S 58 53, 64 56 V64 H0 Z" fill="#0d9488" />
        {/* tower */}
        <path d="M27 27 H37 L40 53 H24 Z" fill={`url(#tower-${id})`} />
        <path d="M26.1 34 H37.9 L38.5 39 H25.5 Z" fill="#0d9488" />
        <path d="M25 44 H39 L39.6 49 H24.4 Z" fill="#0d9488" />
        <rect x="30.4" y="41" width="3.2" height="12" rx="1.4" fill="#0e2c4e" opacity="0.85" />
        {/* gallery + lamp room */}
        <rect x="24.5" y="25" width="15" height="3" rx="1.2" fill="#0e2c4e" />
        <rect x="27.5" y="15.5" width="9" height="9.5" rx="2" fill="#0e2c4e" />
        <rect x="29.2" y="17.2" width="5.6" height="6.3" rx="1.2" fill="#fde68a" />
        <circle cx="32" cy="20.3" r="2" fill="#ffffff" />
        {/* roof */}
        <path d="M26.5 15.8 L32 10 L37.5 15.8 Z" fill="#f59e0b" />
        <circle cx="32" cy="9.4" r="1.3" fill="#fbbf24" />
      </g>
    </svg>
  );
}

export function LogoFull({ size = 44, name, tagline, light }: { size?: number; name: string; tagline?: string; light?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <LogoMark size={size} className="shrink-0 drop-shadow-[0_8px_16px_rgba(14,44,78,0.25)]" />
      <span className="flex flex-col leading-tight">
        <span className={`text-2xl font-black tracking-tight ${light ? "text-white" : "text-navy dark:text-white"}`}>{name}</span>
        {tagline && <span className={`text-[11px] font-bold ${light ? "text-white/75" : "text-muted"}`}>{tagline}</span>}
      </span>
    </span>
  );
}
