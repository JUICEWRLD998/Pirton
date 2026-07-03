"use client";

import { motion } from "framer-motion";
import type { ScanState } from "@/lib/useScan";
import { AgentCard } from "./AgentCard";
import { STAGE_META, SPECIALISTS } from "@/lib/agents";
import { stagger, riseIn } from "@/lib/motion";
import { formatUsdc } from "@/lib/format";

/** Screen 2 — the live scan console: hub status + a board of working agents. */
export function ScanProgress({ state }: { state: ScanState }) {
  const { agents, classification } = state;
  const doneCount = agents.filter((a) => a.stage === "done").length;
  const overall =
    agents.length === 0
      ? 0
      : agents.reduce((acc, a) => acc + STAGE_META[a.stage].pct, 0) / agents.length;
  const totalPaid = agents.reduce((acc, a) => acc + BigInt(a.priceBaseUnits ?? "0"), 0n);

  const lastDone = [...agents].reverse().find((a) => a.stage === "done");
  const announce =
    state.phase === "classifying"
      ? "Classifying the pasted item."
      : `${doneCount} of ${agents.length} agents delivered.${
          lastDone ? ` ${SPECIALISTS[lastDone.specialist].name} finished.` : ""
        }`;

  return (
    <section className="container-x pt-10 sm:pt-14">
      <div aria-live="polite" className="sr-only">
        {announce}
      </div>

      {/* console header panel */}
      <div className="mx-auto max-w-3xl">
        <div className="card-grad relative overflow-hidden p-6 sm:p-7">
          <div
            className="pointer-events-none absolute -left-16 -top-16 h-48 w-48 rounded-full opacity-60 blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(99,102,241,0.28), transparent 65%)" }}
          />

          <div className="relative flex items-end justify-between gap-4">
            <div>
              <span className="eyebrow">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal-400/70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-signal-400" />
                </span>
                Live investigation
              </span>
              <h1 className="mt-3 font-display text-hero font-semibold text-white">
                Pirton is investigating…
              </h1>
              {classification && (
                <p className="mt-2 text-sm text-slate-400">{classification.reason}</p>
              )}
            </div>
            <div className="hidden shrink-0 text-right sm:block">
              <div className="font-display text-3xl font-semibold text-white">
                {doneCount}
                <span className="text-slate-500">/{agents.length}</span>
              </div>
              <div className="text-[11px] uppercase tracking-wider text-slate-500">delivered</div>
            </div>
          </div>

          {/* subject */}
          {classification && (
            <div className="relative mt-4 inline-flex max-w-full items-center gap-2 rounded-lg border border-line bg-black/20 px-3 py-1.5">
              <span className="text-[11px] uppercase tracking-wide text-slate-500">subject</span>
              <span className="mono truncate text-xs text-slate-300">{classification.subject}</span>
            </div>
          )}

          {/* overall progress */}
          <div className="relative mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full transition-[width] duration-500 ease-out"
              style={{
                width: `${Math.round(overall * 100)}%`,
                background: "linear-gradient(90deg, #6366F1, #8B5CF6, #22D3EE)",
              }}
            />
          </div>
          <div className="relative mt-2 flex justify-between text-xs text-slate-500">
            <span>Hiring specialists on Base</span>
            <span className="mono text-slate-400">{formatUsdc(totalPaid)} USDC escrowed</span>
          </div>
        </div>
      </div>

      {/* agent board */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="mx-auto mt-6 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2"
      >
        {agents.map((a) => (
          <motion.div key={a.specialist} variants={riseIn}>
            <AgentCard agent={a} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
