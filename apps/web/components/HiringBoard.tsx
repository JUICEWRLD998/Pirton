"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import type { ScanState } from "@/lib/useScan";
import { OrchestratorNode } from "./OrchestratorNode";
import { AgentCard } from "./AgentCard";
import { AnimatedBeam } from "./AnimatedBeam";
import { SPECIALISTS } from "@/lib/agents";
import { stagger } from "@/lib/motion";
import { formatUsdc } from "@/lib/format";

/**
 * Screen 2 — "The Hiring Board". Orchestrator at top-center, specialist cards
 * branch below with live animated beams. This screen is driven entirely by the
 * SSE progress events and is the demo's centerpiece.
 */
export function HiringBoard({ state }: { state: ScanState }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const orchRef = useRef<HTMLDivElement | null>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());

  const { agents, classification } = state;
  const doneCount = agents.filter((a) => a.stage === "done").length;
  const totalPaid = agents.reduce(
    (acc, a) => acc + BigInt(a.priceBaseUnits ?? "0"),
    0n
  );

  return (
    <div ref={containerRef} className="relative mx-auto w-full max-w-5xl px-5">
      {/* Beams layer (behind cards, above background) */}
      {agents.map((a) => {
        const working =
          a.stage !== "done" && a.stage !== "error";
        return (
          <AnimatedBeam
            key={`beam-${a.specialist}`}
            containerRef={containerRef}
            fromRef={orchRef}
            toRef={{ current: cardRefs.current.get(a.specialist) ?? null }}
            active={working}
            done={a.stage === "done"}
            color={SPECIALISTS[a.specialist].hue}
          />
        );
      })}

      <OrchestratorNode
        ref={orchRef}
        subject={classification?.subject ?? state.input}
        reason={classification?.reason ?? "Classifying the pasted item…"}
        hiredCount={agents.length}
        doneCount={doneCount}
      />

      {/* Live tally */}
      <div className="mt-4 flex items-center justify-center gap-6 text-xs text-slate-400">
        <Tally label="agents hired" value={String(agents.length)} />
        <span className="h-3 w-px bg-white/10" />
        <Tally label="delivered" value={`${doneCount}/${agents.length}`} />
        <span className="h-3 w-px bg-white/10" />
        <Tally label="USDC escrowed" value={formatUsdc(totalPaid)} accent />
      </div>

      {/* Agent cards */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        {agents.map((a) => (
          <AgentCard
            key={a.specialist}
            agent={a}
            ref={(el) => {
              cardRefs.current.set(a.specialist, el);
            }}
          />
        ))}
      </motion.div>
    </div>
  );
}

function Tally({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span
        className={`font-mono text-sm font-semibold ${
          accent ? "text-safe-soft" : "text-white"
        }`}
      >
        {value}
      </span>
      <span className="text-[11px] text-slate-500">{label}</span>
    </div>
  );
}
