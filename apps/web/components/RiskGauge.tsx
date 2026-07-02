"use client";

import { useEffect, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";
import type { Verdict } from "@/lib/types";
import { VERDICT_META } from "@/lib/agents";

interface Props {
  score: number; // 0..100
  verdict: Verdict;
}

/** Animated semicircular risk gauge that counts up to the fused score. */
export function RiskGauge({ score, verdict }: Props) {
  const reduce = useReducedMotion();
  const [val, setVal] = useState(0);
  const accent = VERDICT_META[verdict].accent;

  useEffect(() => {
    if (reduce) {
      setVal(score);
      return;
    }
    const controls = animate(0, score, {
      duration: 1.6,
      delay: 0.25,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setVal(v),
    });
    return () => controls.stop();
  }, [score, reduce]);

  // Semicircle geometry.
  const R = 90;
  const CX = 110;
  const CY = 110;
  const circ = Math.PI * R; // half circumference
  const frac = val / 100;

  return (
    <div className="relative flex flex-col items-center">
      <svg width="220" height="132" viewBox="0 0 220 132" className="overflow-visible">
        <defs>
          <linearGradient id="gauge-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#2DD4BF" />
            <stop offset="50%" stopColor="#F5B14C" />
            <stop offset="100%" stopColor="#F4523B" />
          </linearGradient>
        </defs>

        {/* track */}
        <path
          d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="14"
          strokeLinecap="round"
        />
        {/* value arc */}
        <path
          d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
          fill="none"
          stroke="url(#gauge-grad)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - frac)}
          style={{ filter: `drop-shadow(0 0 10px ${accent}88)` }}
        />
        {/* needle */}
        <g
          style={{
            transform: `rotate(${-90 + frac * 180}deg)`,
            transformOrigin: `${CX}px ${CY}px`,
            transition: "none",
          }}
        >
          <line
            x1={CX}
            y1={CY}
            x2={CX}
            y2={CY - R + 6}
            stroke={accent}
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx={CX} cy={CY} r="6" fill={accent} />
        </g>
      </svg>

      <div className="-mt-8 text-center">
        <div
          className="font-mono text-5xl font-bold tabular-nums"
          style={{ color: accent }}
        >
          {Math.round(val)}
        </div>
        <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
          risk / 100
        </div>
      </div>
    </div>
  );
}
