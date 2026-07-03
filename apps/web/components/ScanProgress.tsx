"use client";

import { motion } from "framer-motion";
import type { ScanState } from "@/lib/useScan";
import { AgentCard } from "./AgentCard";
import { STAGE_META, SPECIALISTS } from "@/lib/agents";
import { stagger, riseIn } from "@/lib/motion";
import { formatUsdc } from "@/lib/format";

/** Screen 2 — the live scan: a clean list of agents with progress. */
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

      {/* header */}
      <div className="mx-auto max-w-3xl">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400/70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-400" />
              </span>
              <h1 className="text-hero font-semibold text-white">Pirton is investigating…</h1>
            </div>
            {classification && (
              <p className="mt-2 text-sm text-slate-400">{classification.reason}</p>
            )}
          </div>
          <div className="hidden shrink-0 text-right sm:block">
            <div className="font-mono text-2xl font-semibold text-white">
              {doneCount}
              <span className="text-slate-500">/{agents.length}</span>
            </div>
            <div className="text-[11px] uppercase tracking-wider text-slate-500">delivered</div>
          </div>
        </div>

        {/* subject + overall progress */}
        {classification && (
          <div className="mt-4 inline-flex max-w-full items-center gap-2 rounded-lg border border-line bg-white/[0.03] px-3 py-1.5">
            <span className="text-[11px] uppercase tracking-wide text-slate-500">subject</span>
            <span className="mono truncate text-xs text-slate-300">{classification.subject}</span>
          </div>
        )}

        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400 transition-[width] duration-500 ease-out"
            style={{ width: `${Math.round(overall * 100)}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-slate-500">
          <span>Hiring specialists on Base</span>
          <span className="mono text-slate-400">{formatUsdc(totalPaid)} USDC escrowed</span>
        </div>
      </div>

      {/* agent list */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="mx-auto mt-8 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2"
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
