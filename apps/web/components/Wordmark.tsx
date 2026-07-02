"use client";

import { motion } from "framer-motion";

/** Pirton shield mark — a small animated crest used in the header + verdict. */
export function ShieldMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <defs>
        <linearGradient id="pir-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#38E1FF" />
          <stop offset="100%" stopColor="#2DD4BF" />
        </linearGradient>
      </defs>
      <motion.path
        d="M16 2.5 5 6.5v8.2C5 22.5 16 29 16 29s11-6.5 11-14.3V6.5L16 2.5Z"
        stroke="url(#pir-grad)"
        strokeWidth={1.7}
        fill="rgba(56,225,255,0.06)"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1, ease: "easeInOut" }}
      />
      <motion.path
        d="M11 16.2 14.5 20 21 12.5"
        stroke="url(#pir-grad)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
      />
    </svg>
  );
}

export function Wordmark() {
  return (
    <div className="flex items-center gap-2.5">
      <ShieldMark />
      <span className="text-lg font-semibold tracking-tight text-white">
        Pirton
      </span>
      <span className="hidden rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest text-slate-400 sm:inline">
        Living Security Console
      </span>
    </div>
  );
}
