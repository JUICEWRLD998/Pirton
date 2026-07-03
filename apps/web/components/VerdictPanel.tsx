"use client";

import { motion } from "framer-motion";
import { ShieldCheck, AlertTriangle, RotateCcw } from "lucide-react";
import type { TrustReceipt } from "@/lib/types";
import { VERDICT_META, SPECIALISTS } from "@/lib/agents";
import { RiskMeter } from "./RiskMeter";
import { FindingRow } from "./FindingRow";
import { TrustReceiptCard } from "./TrustReceiptCard";
import { stagger, riseIn } from "@/lib/motion";

/** Screen 3 — verdict + evidence + Trust Receipt. */
export function VerdictPanel({
  receipt,
  onReset,
}: {
  receipt: TrustReceipt;
  onReset: () => void;
}) {
  const v = VERDICT_META[receipt.verdict];
  const safe = receipt.verdict === "safe";

  return (
    <motion.section
      variants={stagger}
      initial="hidden"
      animate="show"
      className="container-x pb-24 pt-10 sm:pt-14"
    >
      <div className="mx-auto max-w-3xl">
        {/* verdict header */}
        <motion.div variants={riseIn} className="card-grad relative overflow-hidden p-6 sm:p-8">
          {/* verdict-tinted ambient glow */}
          <div
            className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full opacity-70 blur-3xl"
            style={{ background: `radial-gradient(circle, ${v.tint}, transparent 65%)` }}
          />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1"
                style={{ background: v.tint, color: v.color, boxShadow: `inset 0 0 0 1px ${v.color}33` }}
              >
                {safe ? <ShieldCheck size={26} /> : <AlertTriangle size={26} />}
              </div>
              <div>
                <span className="eyebrow">Verdict</span>
                <div className="mt-1 font-display text-2xl font-semibold" style={{ color: v.color }}>
                  {v.label}
                </div>
                <p className="mt-0.5 text-sm text-slate-400">{v.blurb}</p>
              </div>
            </div>
            <div className="w-full sm:w-auto">
              <RiskMeter score={receipt.riskScore} verdict={receipt.verdict} />
            </div>
          </div>

          <p className="relative mt-6 border-t border-line-soft pt-5 text-[15px] leading-relaxed text-slate-300">
            {receipt.explanation}
          </p>
        </motion.div>

        {/* per-agent evidence */}
        <motion.div variants={riseIn} className="mt-6 space-y-4">
          {receipt.entries.map((e) => {
            const meta = SPECIALISTS[e.specialist];
            return (
              <div key={e.specialist} className="card p-4 sm:p-5">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/15 font-mono text-[11px] font-semibold text-brand-300 ring-1 ring-brand-400/30">
                    {meta.monogram}
                  </div>
                  <span className="text-sm font-semibold text-white">{meta.name}</span>
                  <span className="ml-auto font-mono text-[11px] text-slate-500">
                    confidence {(e.result.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="space-y-2">
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

        {/* reset */}
        <motion.div variants={riseIn} className="mt-8 flex justify-center">
          <button onClick={onReset} className="btn-ghost h-11 rounded-full px-5">
            <RotateCcw size={16} />
            Investigate another
          </button>
        </motion.div>
      </div>
    </motion.section>
  );
}
