"use client";

import { useEffect, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";
import type { Verdict } from "@/lib/types";
import { VERDICT_META } from "@/lib/agents";

/** Clean horizontal 0–100 risk meter with a marker + count-up number. */
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
      duration: 1.3,
      delay: 0.15,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setVal(v),
    });
    return () => controls.stop();
  }, [score, reduce]);

  return (
    <div className="w-full">
      <div className="flex items-end justify-between">
        <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Risk score</span>
        <span className="mono text-3xl font-bold tabular-nums" style={{ color }}>
          {Math.round(val)}
          <span className="text-base font-medium text-slate-500">/100</span>
        </span>
      </div>

      <div className="relative mt-3 h-2.5 w-full overflow-hidden rounded-full">
        {/* gradient track (safe → caution → danger) */}
        <div
          className="absolute inset-0 rounded-full opacity-30"
          style={{ background: "linear-gradient(90deg, #34D399, #FBBF24, #F87171)" }}
        />
        {/* filled portion */}
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: `${val}%`,
            background: "linear-gradient(90deg, #34D399, #FBBF24, #F87171)",
          }}
        />
        {/* marker */}
        <div
          className="absolute top-1/2 h-4 w-1 -translate-y-1/2 rounded-full"
          style={{ left: `calc(${val}% - 2px)`, background: color, boxShadow: `0 0 8px ${color}` }}
        />
      </div>

      <div className="mt-1.5 flex justify-between text-[10px] uppercase tracking-wide text-slate-600">
        <span>Safe</span>
        <span>Caution</span>
        <span>Scam</span>
      </div>
    </div>
  );
}
