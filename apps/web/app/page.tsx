"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useScan } from "@/lib/useScan";
import { Galaxy } from "@/components/Galaxy";
import { SiteHeader } from "@/components/SiteHeader";
import { Hero } from "@/components/Hero";
import { HowItWorks } from "@/components/HowItWorks";
import { AgentsShowcase } from "@/components/AgentsShowcase";
import { TrustBand } from "@/components/TrustBand";
import { SiteFooter } from "@/components/SiteFooter";
import { ScanProgress } from "@/components/ScanProgress";
import { VerdictPanel } from "@/components/VerdictPanel";
import { fade } from "@/lib/motion";

export default function Home() {
  const { state, start, reset } = useScan();

  const scanning = state.phase === "classifying" || state.phase === "hiring";
  const done = state.phase === "done" && !!state.receipt;
  const active = scanning || done || state.phase === "error";

  return (
    <div id="top" className="relative min-h-screen">
      <Galaxy />
      <SiteHeader showReset={active} onReset={reset} />

      {/* Soft notice (e.g. live→demo fallback) */}
      <AnimatePresence>
        {state.notice && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="container-x mt-3"
          >
            <div className="mx-auto w-fit rounded-full border border-caution/40 bg-caution/10 px-4 py-1.5 text-xs text-caution">
              {state.notice}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative">
        <AnimatePresence mode="wait">
          {state.phase === "idle" && (
            <motion.div key="landing" variants={fade} initial="hidden" animate="show" exit="exit">
              <Hero onScan={(input) => start(input)} />
              <HowItWorks />
              <AgentsShowcase />
              <TrustBand />
            </motion.div>
          )}

          {scanning && (
            <motion.div key="scan" variants={fade} initial="hidden" animate="show" exit="exit">
              <ScanProgress state={state} />
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
              className="container-x py-24 text-center"
            >
              <p className="text-danger">Something went wrong: {state.error}</p>
              <button onClick={reset} className="btn-ghost mt-4 h-11 rounded-full px-5">
                Try again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {state.phase === "idle" && <SiteFooter />}
    </div>
  );
}
