"use client";

import { motion } from "framer-motion";
import type { TrustReceipt } from "@/lib/types";
import { VERDICT_META, SPECIALISTS } from "@/lib/agents";
import { RiskGauge } from "./RiskGauge";
import { FindingRow } from "./FindingRow";
import { TrustReceiptCard } from "./TrustReceiptCard";
import { spring, riseIn, stagger } from "@/lib/motion";

/**
 * Screen 3 — "The Verdict + Trust Receipt". Animated gauge counts up to the
 * fused score, the plain-language explanation lands, each agent's findings
 * expand, then the Trust Receipt reveals.
 */
export function VerdictPanel({
  receipt,
  onReset,
}: {
  receipt: TrustReceipt;
  onReset: () => void;
}) {
  const v = VERDICT_META[receipt.verdict];

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="mx-auto w-full max-w-3xl px-5 pb-24"
    >
      {/* Verdict headline + gauge */}
      <motion.div
        variants={riseIn}
        className="glass glass-accent relative overflow-hidden rounded-xl3 p-6 text-center"
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-40 opacity-40"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${v.accent}33, transparent 70%)`,
          }}
        />
        <VerdictBadge verdict={receipt.verdict} />

        <div className="mt-4 flex justify-center">
          <RiskGauge score={receipt.riskScore} verdict={receipt.verdict} />
        </div>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="mx-auto mt-2 max-w-xl text-pretty text-[15px] leading-relaxed text-slate-300"
        >
          {receipt.explanation}
        </motion.p>
      </motion.div>

      {/* Per-agent evidence */}
      <motion.div variants={riseIn} className="mt-6 space-y-4">
        {receipt.entries.map((e) => {
          const meta = SPECIALISTS[e.specialist];
          return (
            <div key={e.specialist} className="glass rounded-xl2 p-4">
              <div className="mb-2.5 flex items-center gap-2.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d={meta.icon} stroke={meta.hue} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-sm font-semibold text-white">{meta.name}</span>
                <span className="font-mono text-[11px] text-slate-500">
                  confidence {(e.result.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <div className="space-y-1.5">
                {e.result.findings.map((f) => (
                  <FindingRow key={f.code} finding={f} />
                ))}
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* Trust Receipt */}
      <motion.div variants={riseIn} className="mt-6">
        <TrustReceiptCard receipt={receipt} />
      </motion.div>

      {/* Reset */}
      <motion.div variants={riseIn} className="mt-8 flex justify-center">
        <motion.button
          onClick={onReset}
          whileHover={{ scale: 1.04, y: -1 }}
          whileTap={{ scale: 0.97 }}
          transition={spring}
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-slate-200 transition hover:border-cyan-glow/40 hover:text-white"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M3 12a9 9 0 1 0 3-6.7L3 8m0-5v5h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Investigate another
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

function VerdictBadge({ verdict }: { verdict: TrustReceipt["verdict"] }) {
  const v = VERDICT_META[verdict];
  const safe = verdict === "safe";
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ ...spring, delay: 0.05 }}
      className="inline-flex flex-col items-center"
    >
      {/* Animated crest flourish */}
      <div className="relative mb-2 flex h-14 w-14 items-center justify-center">
        <motion.span
          className="absolute inset-0 rounded-2xl"
          style={{ boxShadow: `0 0 0 2px ${v.accent}` }}
          initial={{ scale: 0.6, opacity: 0.8 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
        />
        <svg width="40" height="40" viewBox="0 0 32 32" fill="none">
          <motion.path
            d="M16 2.5 5 6.5v8.2C5 22.5 16 29 16 29s11-6.5 11-14.3V6.5L16 2.5Z"
            stroke={v.accent}
            strokeWidth={1.8}
            fill={`${v.accent}18`}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.9, delay: 0.1 }}
          />
          {safe ? (
            <motion.path
              d="M11 16.2 14.5 20 21 12.5"
              stroke={v.accent}
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: 0.7 }}
            />
          ) : (
            <motion.path
              d="M16 10v7M16 21h.01"
              stroke={v.accent}
              strokeWidth={2.6}
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.7 }}
            />
          )}
        </svg>
      </div>

      <span
        className="text-hero font-semibold"
        style={{ color: v.accent }}
      >
        {v.label}
      </span>
      <span className="mt-1 text-sm text-slate-400">{v.blurb}</span>
    </motion.div>
  );
}
