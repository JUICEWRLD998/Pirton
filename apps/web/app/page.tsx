"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useScan } from "@/lib/useScan";
import { AuroraBackground } from "@/components/AuroraBackground";
import { Wordmark } from "@/components/Wordmark";
import { Hero } from "@/components/Hero";
import { HiringBoard } from "@/components/HiringBoard";
import { VerdictPanel } from "@/components/VerdictPanel";
import { fade } from "@/lib/motion";

export default function Home() {
  const { state, start, reset } = useScan();

  const scanning = state.phase === "classifying" || state.phase === "hiring";
  const done = state.phase === "done" && state.receipt;
  // Theme the whole console by the verdict once it lands.
  const verdict = done ? state.receipt!.verdict : undefined;

  return (
    <div data-verdict={verdict} className="relative min-h-screen">
      <AuroraBackground dim={scanning || !!done} />

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-ink-950/40 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <Wordmark />
          <div className="flex items-center gap-3">
            {(scanning || done) && (
              <button
                onClick={reset}
                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-300 transition hover:border-white/20 hover:text-white"
              >
                New scan
              </button>
            )}
            <a
              href="https://agent.croo.network"
              target="_blank"
              rel="noreferrer"
              className="hidden rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-400 transition hover:text-white sm:inline"
            >
              Powered by CROO CAP · Base
            </a>
          </div>
        </div>
      </header>

      {/* Soft notice (e.g. live→demo fallback) */}
      <AnimatePresence>
        {state.notice && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mx-auto mt-3 w-fit rounded-full border border-caution/30 bg-caution/10 px-4 py-1.5 text-xs text-caution-soft"
          >
            {state.notice}
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative z-10 py-8">
        <AnimatePresence mode="wait">
          {state.phase === "idle" && (
            <motion.div key="hero" variants={fade} initial="hidden" animate="show" exit="exit">
              <Hero onScan={(input) => start(input)} />
            </motion.div>
          )}

          {scanning && (
            <motion.div
              key="board"
              variants={fade}
              initial="hidden"
              animate="show"
              exit="exit"
              className="pt-6"
            >
              <SectionLabel>Live hiring board</SectionLabel>
              <HiringBoard state={state} />
            </motion.div>
          )}

          {done && (
            <motion.div key="verdict" variants={fade} initial="hidden" animate="show" exit="exit">
              <VerdictPanel receipt={state.receipt!} onReset={reset} />
            </motion.div>
          )}

          {state.phase === "error" && (
            <motion.div
              key="error"
              variants={fade}
              initial="hidden"
              animate="show"
              className="mx-auto max-w-md px-5 py-24 text-center"
            >
              <p className="text-danger">Something went wrong: {state.error}</p>
              <button
                onClick={reset}
                className="mt-4 rounded-full border border-white/15 px-4 py-2 text-sm text-slate-200 hover:text-white"
              >
                Try again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto mb-6 flex max-w-5xl items-center gap-3 px-5">
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
      <span className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
        {children}
      </span>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
    </div>
  );
}
