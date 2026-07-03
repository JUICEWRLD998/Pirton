"use client";

import { useEffect, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";
import type { Verdict } from "@/lib/types";
import { VERDICT_META } from "@/lib/agents";

/** Semicircular 0–100 risk gauge with a gradient arc, marker, and count-up. */
export function RiskMeter({ score, verdict }: { score: number; verdict: Verdict }) {
  const reduce = useReducedMotion();
  const [val, setVal] = useState(reduce ? score : 0);
  const color = VERDICT_META[verdict].color;

  useEffect(() => {
    if (reduce) {
      setVal(score);
      return;
    }
    const controls = animate(0, score, {
      duration: 1.4,
      delay: 0.2,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setVal(v),
    });
    return () => controls.stop();
  }, [score, reduce]);

  // Gauge geometry — top semicircle.
  const cx = 100;
  const cy = 100;
  const r = 84;
  const clamped = Math.max(0, Math.min(100, val));
  const theta = Math.PI * (1 - clamped / 100); // 180° → 0°
  const mx = cx + r * Math.cos(theta);
  const my = cy - r * Math.sin(theta);
  const arcPath = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;

  return (
    <div className="flex w-full flex-col items-center">
      <svg viewBox="0 0 200 116" className="w-full max-w-[240px]" role="img" aria-label={`Risk score ${Math.round(val)} of 100`}>
        <defs>
          <linearGradient id="risk-arc" x1="16" y1="0" x2="184" y2="0" gradientUnits="userSpaceOnUse">
            <stop stopColor="#34D399" />
            <stop offset="0.5" stopColor="#FBBF24" />
            <stop offset="1" stopColor="#F87171" />
          </linearGradient>
        </defs>

        {/* track */}
        <path d={arcPath} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" strokeLinecap="round" />
        {/* filled portion */}
        <path
          d={arcPath}
          fill="none"
          stroke="url(#risk-arc)"
          strokeWidth="12"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={`${clamped} 100`}
        />
        {/* marker */}
        <circle cx={mx} cy={my} r="7" fill="#0A0E1A" stroke={color} strokeWidth="3" />

        {/* center readout */}
        <text x={cx} y={cy - 22} textAnchor="middle" fontSize="34" fontWeight="700" fill={color} fontFamily="var(--font-mono)">
          {Math.round(val)}
        </text>
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="10" fill="#64748B" letterSpacing="1.5">
          / 100 RISK
        </text>
      </svg>

      <div className="mt-1 flex w-full max-w-[240px] justify-between px-1 text-[10px] uppercase tracking-wide text-slate-600">
        <span>Safe</span>
        <span>Caution</span>
        <span>Scam</span>
      </div>
    </div>
  );
}
