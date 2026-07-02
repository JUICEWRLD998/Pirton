"use client";

import { forwardRef } from "react";
import { motion } from "framer-motion";
import { ShieldMark } from "./Wordmark";
import { spring } from "@/lib/motion";

interface Props {
  subject: string;
  reason: string;
  hiredCount: number;
  doneCount: number;
}

/** The Pirton orchestrator at the center of the board — the "brain". */
export const OrchestratorNode = forwardRef<HTMLDivElement, Props>(
  function OrchestratorNode({ subject, reason, hiredCount, doneCount }, ref) {
    const complete = hiredCount > 0 && doneCount >= hiredCount;
    return (
      <motion.div
        ref={ref}
        layout
        initial={{ opacity: 0, scale: 0.85, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={spring}
        className="glass glass-accent relative z-10 mx-auto w-full max-w-xl rounded-xl3 px-6 py-5 text-center"
      >
        {/* rotating halo */}
        <div className="pointer-events-none absolute -inset-8 -z-10 opacity-60">
          <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgb(var(--accent)/0.22),transparent_65%)] blur-2xl" />
        </div>

        <div className="flex items-center justify-center gap-3">
          <span className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-glow/40 bg-cyan-glow/10">
            <ShieldMark size={24} />
            {!complete && (
              <span className="absolute inset-0 rounded-2xl animate-pulse-ring" style={{ boxShadow: "0 0 0 2px rgb(var(--accent))" }} />
            )}
          </span>
          <div className="text-left">
            <div className="text-sm font-semibold text-white">Pirton Orchestrator</div>
            <div className="font-mono text-[11px] text-slate-400">
              {complete ? "fusing verdict…" : `hiring ${hiredCount} agents · ${doneCount} delivered`}
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-center gap-2 text-xs">
          <span className="rounded-md border border-white/10 bg-black/30 px-2 py-1 font-mono text-slate-300">
            {truncate(subject, 42)}
          </span>
        </div>
        <p className="mx-auto mt-2 max-w-md text-pretty text-[12px] leading-snug text-slate-500">
          {reason}
        </p>
      </motion.div>
    );
  }
);

function truncate(s: string, n: number) {
  return s.length <= n ? s : s.slice(0, n) + "…";
}
