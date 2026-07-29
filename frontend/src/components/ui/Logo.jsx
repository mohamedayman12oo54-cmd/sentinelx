import React from "react";

/**
 * The single source of truth for the SentinelX mark: a shield with an "X"
 * drawn inside it. Used everywhere the brand mark appears (nav, sidebar,
 * auth layout, welcome intro) so it never drifts into slightly different
 * shields in different places.
 */
export default function Logo({ size = 32, glow = true, className = "" }) {
  const gradId = "sxLogoGrad";
  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {glow && (
        <div
          className="absolute inset-0 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 blur-md opacity-60"
          style={{ animation: "sxLogoGlow 3.2s ease-in-out infinite" }}
        />
      )}
      <svg viewBox="0 0 100 100" className="relative h-full w-full">
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>
        </defs>
        <path
          d="M50 6 L88 20 V48 C88 72 72 88 50 96 C28 88 12 72 12 48 V20 Z"
          fill="rgba(129,140,248,0.08)"
          stroke={`url(#${gradId})`}
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M38 38 L62 62" fill="none" stroke={`url(#${gradId})`} strokeWidth="6" strokeLinecap="round" />
        <path d="M62 38 L38 62" fill="none" stroke={`url(#${gradId})`} strokeWidth="6" strokeLinecap="round" />
      </svg>
    </div>
  );
}
