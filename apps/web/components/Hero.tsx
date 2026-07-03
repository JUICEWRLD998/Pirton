"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, CornerDownLeft } from "lucide-react";
import { riseIn, stagger } from "@/lib/motion";

interface Props {
  onScan: (input: string) => void;
}

/** Hero — the scam-check tool, front and center. */
export function Hero({ onScan }: Props) {
  const [value, setValue] = useState("");

  const submit = () => {
    const v = value.trim();
    if (v) onScan(v);
  };

  return (
    <section id="tool" className="relative container-x pt-12 sm:pt-16 lg:pt-24">
      <div className="mx-auto flex flex-col items-center text-center">
        {/* Copy + paste tool, centered */}
        <motion.div variants={stagger} initial="hidden" animate="show" className="w-full max-w-2xl">
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
            className="mx-auto mt-5 max-w-xl text-pretty text-base leading-relaxed text-slate-400 sm:text-lg"
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
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
