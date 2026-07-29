import React from "react";

/**
 * Shared background: soft glow blobs + a faint grid.
 * The blobs drift continuously (floatGlow keyframes, defined in index.css)
 * so the whole site feels quietly alive even when nothing else is animating.
 */
export default function AmbientField() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute -top-40 left-1/4 h-[560px] w-[560px] rounded-full bg-indigo-600/20 blur-[120px]"
        style={{ animation: "floatGlow 9s ease-in-out infinite" }}
      />
      <div
        className="absolute top-1/3 -right-32 h-[480px] w-[480px] rounded-full bg-violet-600/20 blur-[130px]"
        style={{ animation: "floatGlow 11s ease-in-out infinite 1.5s" }}
      />
      <div
        className="absolute bottom-0 left-1/3 h-[420px] w-[420px] rounded-full bg-blue-500/10 blur-[110px]"
        style={{ animation: "floatGlow 13s ease-in-out infinite 0.5s" }}
      />
      <svg className="absolute inset-0 h-full w-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="42" height="42" patternUnits="userSpaceOnUse">
            <path d="M 42 0 L 0 0 0 42" fill="none" stroke="#7c8bff" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
}
