"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { EXAMPLES } from "@/lib/demo";
import { riseIn, stagger, spring } from "@/lib/motion";

interface Props {
  onScan: (input: string) => void;
}

/** Screen 1 — "The Ask". Inviting paste field over the aurora, example chips. */
export function Hero({ onScan }: Props) {
  const [value, setValue] = useState("");

  const submit = () => {
    const v = value.trim();
    if (v) onScan(v);
  };

  return (
    <motion.section
      variants={stagger}
      initial="hidden"
      animate="show"
      exit="exit"
      className="mx-auto flex min-h-[82vh] w-full max-w-3xl flex-col items-center justify-center px-5 text-center"
    >
      <motion.div
        variants={riseIn}
        className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs text-slate-300 backdrop-blur"
      >
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-glow/70" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-glow" />
        </span>
        The immune system for the agent economy
      </motion.div>

      <motion.h1
        variants={riseIn}
        className="text-balance font-semibold text-display text-white"
      >
        Is it a{" "}
        <span className="bg-gradient-to-r from-cyan-glow via-safe-soft to-safe bg-clip-text text-transparent">
          scam
        </span>
        ?
        <br />
        Let a swarm of agents find out.
      </motion.h1>

      <motion.p
        variants={riseIn}
        className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-slate-400 sm:text-lg"
      >
        Paste a token, an offer, a link, or a contract. Pirton hires and pays a
        team of specialist CAP agents on Base to investigate — then returns a
        signed, auditable{" "}
        <span className="text-slate-200">Trust Receipt</span>.
      </motion.p>

      <motion.div variants={riseIn} className="mt-9 w-full">
        <div className="border-beam glass rounded-xl3 p-2 shadow-lift">
          <div className="rounded-[1.35rem] bg-ink-900/60 p-1">
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit();
              }}
              rows={3}
              placeholder="Paste a suspicious token address, DM, job post, or link…"
              aria-label="Suspicious item to investigate"
              className="w-full resize-none bg-transparent px-4 pt-3.5 text-left text-[15px] leading-relaxed text-slate-100 placeholder:text-slate-500 focus:outline-none"
            />
            <div className="flex items-center justify-between gap-3 px-3 pb-2.5 pt-1">
              <span className="hidden text-xs text-slate-500 sm:inline">
                <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px]">
                  ⌘
                </kbd>{" "}
                +{" "}
                <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px]">
                  ↵
                </kbd>{" "}
                to investigate
              </span>
              <motion.button
                onClick={submit}
                disabled={!value.trim()}
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
                transition={spring}
                className="ml-auto inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-glow to-safe px-5 py-2.5 text-sm font-semibold text-ink-950 shadow-glow transition disabled:cursor-not-allowed disabled:opacity-40"
              >
                Investigate
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12h14M13 6l6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Example chips for instant demoability */}
      <motion.div
        variants={riseIn}
        className="mt-6 flex flex-wrap items-center justify-center gap-2.5"
      >
        <span className="text-xs text-slate-500">Try:</span>
        {EXAMPLES.map((ex) => (
          <motion.button
            key={ex.label}
            onClick={() => onScan(ex.value)}
            whileHover={{ y: -2 }}
            title={ex.hint}
            className="group rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs text-slate-300 transition hover:border-cyan-glow/40 hover:bg-cyan-glow/[0.06] hover:text-white"
          >
            {ex.label}
          </motion.button>
        ))}
      </motion.div>
    </motion.section>
  );
}
