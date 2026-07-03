"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, CornerDownLeft, ShieldCheck, Coins, FileCheck2 } from "lucide-react";
import { EXAMPLES } from "@/lib/demo";
import { SwarmCanvas } from "./SwarmCanvas";
import { riseIn, stagger } from "@/lib/motion";

interface Props {
  onScan: (input: string) => void;
}

const TRUST = [
  { icon: ShieldCheck, label: "4 specialist agents" },
  { icon: Coins, label: "USDC-settled on Base" },
  { icon: FileCheck2, label: "Signed Trust Receipt" },
];

/** Hero — the scam-check tool front and center, with the live swarm alongside. */
export function Hero({ onScan }: Props) {
  const [value, setValue] = useState("");

  const submit = () => {
    const v = value.trim();
    if (v) onScan(v);
  };

  return (
    <section id="tool" className="relative container-x pt-12 sm:pt-16 lg:pt-20">
      <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        {/* ── Left: copy + paste tool ── */}
        <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-xl">
          <motion.span variants={riseIn} className="eyebrow">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-spectrum" />
            The immune system for the agent economy
          </motion.span>

          <motion.h1
            variants={riseIn}
            className="mt-5 text-balance font-display text-display font-semibold text-white"
          >
            Is it a scam?{" "}
            <span className="text-spectrum">Let a swarm of agents find out.</span>
          </motion.h1>

          <motion.p
            variants={riseIn}
            className="mt-5 max-w-lg text-pretty text-base leading-relaxed text-slate-400 sm:text-lg"
          >
            Paste a token, an offer, a link, or a contract. Pirton hires and pays a
            team of specialist agents on Base to investigate — then returns a
            signed, auditable Trust Receipt.
          </motion.p>

          {/* Paste tool */}
          <motion.div variants={riseIn} className="mt-8">
            <div className="card-grad overflow-hidden p-2 shadow-lift">
              <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit();
                }}
                rows={3}
                placeholder="Paste a suspicious token address, DM, job post, or link…"
                aria-label="Suspicious item to investigate"
                className="w-full resize-none bg-transparent px-3.5 pt-3 text-[15px] leading-relaxed text-white placeholder:text-slate-500 focus:outline-none"
              />
              <div className="flex items-center justify-between gap-3 px-2 pb-1 pt-1">
                <span className="hidden items-center gap-1 pl-1.5 text-xs text-slate-500 sm:inline-flex">
                  <kbd className="rounded border border-line bg-white/5 px-1.5 py-0.5 font-mono text-[10px]">⌘</kbd>
                  <CornerDownLeft size={11} className="text-slate-500" />
                  to investigate
                </span>
                <button
                  onClick={submit}
                  disabled={!value.trim()}
                  className="btn-primary ml-auto h-11 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                >
                  <Search size={16} strokeWidth={2.4} />
                  Investigate
                </button>
              </div>
            </div>

            {/* Example chips */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500">Try:</span>
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  onClick={() => onScan(ex.value)}
                  title={ex.hint}
                  className="inline-flex min-h-9 items-center rounded-full border border-line bg-white/[0.03] px-3.5 py-1.5 text-xs text-slate-300 transition-colors hover:border-brand-400/50 hover:bg-brand-500/10 hover:text-white"
                >
                  {ex.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Trust row */}
          <motion.div variants={riseIn} className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
            {TRUST.map((t) => (
              <div key={t.label} className="inline-flex items-center gap-2 text-[13px] text-slate-400">
                <t.icon size={15} className="text-brand-300" />
                {t.label}
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* ── Right: live swarm ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          className="relative order-first lg:order-none"
        >
          <div className="card relative aspect-square w-full overflow-hidden sm:aspect-[4/3] lg:aspect-square">
            {/* soft interior glow */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 50% 45%, rgba(124,58,237,0.16), transparent 62%)",
              }}
            />
            <SwarmCanvas />
            {/* legend */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[10px] text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 animate-twinkle rounded-full bg-signal-400" />
                Live swarm · orchestrator + 4 specialists
              </span>
              <span className="mono hidden sm:inline">CAP · Base</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
