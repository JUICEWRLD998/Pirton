"use client";

import { forwardRef } from "react";
import { motion } from "framer-motion";
import type { AgentState } from "@/lib/useScan";
import { SPECIALISTS, STAGE_META, SEVERITY_META } from "@/lib/agents";
import { cardIn, spring } from "@/lib/motion";
import { NumberTicker } from "./ui/NumberTicker";
import { usdcFloat, txUrl, shortAddr } from "@/lib/format";

const TONE: Record<
  string,
  { dot: string; text: string; ring: string }
> = {
  idle: { dot: "#64748b", text: "text-slate-400", ring: "border-white/10" },
  active: { dot: "#38E1FF", text: "text-cyan-glow", ring: "border-cyan-glow/30" },
  pay: { dot: "#5EEAD4", text: "text-safe-soft", ring: "border-safe/30" },
  done: { dot: "#2DD4BF", text: "text-safe", ring: "border-safe/40" },
  error: { dot: "#F4523B", text: "text-danger", ring: "border-danger/40" },
};

export const AgentCard = forwardRef<HTMLDivElement, { agent: AgentState }>(
  function AgentCard({ agent }, ref) {
    const meta = SPECIALISTS[agent.specialist];
    const stage = STAGE_META[agent.stage];
    const tone = TONE[stage.tone];
    const isWorking =
      agent.stage !== "done" && agent.stage !== "error";
    const done = agent.stage === "done";
    const price = usdcFloat(agent.priceBaseUnits);

    const findings = agent.entry?.result.findings ?? [];
    const worst = findings.reduce(
      (acc, f) => (SEVERITY_META[f.severity].rank > SEVERITY_META[acc].rank ? f.severity : acc),
      "info" as (typeof findings)[number]["severity"]
    );

    return (
      <motion.div
        ref={ref}
        layout
        variants={cardIn}
        className={`glass border-beam relative overflow-hidden rounded-xl2 p-4 ${
          isWorking ? "" : "before:hidden"
        }`}
        style={{ borderColor: done ? "rgba(45,212,191,0.4)" : undefined }}
      >
        {/* header */}
        <div className="flex items-start gap-3">
          <div
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
            style={{
              borderColor: `${meta.hue}55`,
              background: `radial-gradient(circle at 30% 30%, ${meta.hue}22, transparent 70%)`,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path
                d={meta.icon}
                stroke={meta.hue}
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {isWorking && (
              <span
                className="absolute inset-0 rounded-xl animate-pulse-ring"
                style={{ boxShadow: `0 0 0 2px ${meta.hue}` }}
              />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="truncate text-sm font-semibold text-white">
                {meta.name}
              </h3>
              <StatusPill label={stage.label} dot={tone.dot} text={tone.text} pulse={isWorking} />
            </div>
            <p className="mt-0.5 font-mono text-[11px] text-slate-500">{meta.role}</p>
          </div>
        </div>

        {/* progress rail */}
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: done
                ? "linear-gradient(90deg,#2DD4BF,#5EEAD4)"
                : `linear-gradient(90deg, ${meta.hue}, #ffffffaa)`,
            }}
            initial={{ width: "6%" }}
            animate={{ width: `${Math.round(stage.pct * 100)}%` }}
            transition={spring}
          />
        </div>

        {/* body: DID + settlement */}
        <div className="mt-3 space-y-2 text-xs">
          <Row label="Agent DID">
            <span className="mono text-slate-400">
              {agent.providerAgentId ? shortAddr(agent.providerAgentId.replace("did:croo:", "")) : "—"}
            </span>
          </Row>
          <Row label="USDC paid">
            {price > 0 ? (
              <span className="mono font-semibold text-safe-soft">
                <NumberTicker value={price} decimals={2} duration={0.9} /> USDC
              </span>
            ) : (
              <span className="text-slate-600">escrow pending…</span>
            )}
          </Row>
          {agent.payTxHash && (
            <Row label="Pay tx">
              <a
                href={txUrl(agent.payTxHash)}
                target="_blank"
                rel="noreferrer"
                className="mono text-cyan-glow underline-offset-2 hover:underline"
              >
                {shortAddr(agent.payTxHash)} ↗
              </a>
            </Row>
          )}
        </div>

        {/* delivered summary */}
        {done && agent.entry && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.05 }}
            className="mt-3 rounded-lg border border-white/8 bg-black/20 p-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-slate-500">
                {findings.length} finding{findings.length === 1 ? "" : "s"}
              </span>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                style={{
                  color: SEVERITY_META[worst].color,
                  background: `${SEVERITY_META[worst].color}1a`,
                }}
              >
                {SEVERITY_META[worst].label}
              </span>
            </div>
            {agent.entry.result.summary && (
              <p className="mt-1.5 text-[12px] leading-snug text-slate-300">
                {agent.entry.result.summary}
              </p>
            )}
          </motion.div>
        )}
      </motion.div>
    );
  }
);

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-slate-500">{label}</span>
      {children}
    </div>
  );
}

function StatusPill({
  label,
  dot,
  text,
  pulse,
}: {
  label: string;
  dot: string;
  text: string;
  pulse: boolean;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] font-medium ${text}`}
    >
      <span className="relative flex h-1.5 w-1.5">
        {pulse && (
          <span
            className="absolute inline-flex h-full w-full animate-ping rounded-full"
            style={{ background: dot, opacity: 0.7 }}
          />
        )}
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: dot }} />
      </span>
      {label}
    </span>
  );
}
