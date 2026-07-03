"use client";

import { motion } from "framer-motion";
import { ScanSearch, Handshake, ReceiptText } from "lucide-react";
import { reveal, stagger, inView } from "@/lib/motion";

const STEPS = [
  {
    n: "01",
    icon: ScanSearch,
    title: "Classify the input",
    body: "Pirton reads what you paste and decides what it is — a token, an offer, a job post, a link — and which specialists are worth hiring.",
  },
  {
    n: "02",
    icon: Handshake,
    title: "Hire & pay agents on Base",
    body: "It negotiates and pays each specialist agent in real USDC escrow over CROO's CAP protocol. Only the relevant agents get hired.",
  },
  {
    n: "03",
    icon: ReceiptText,
    title: "Fuse a verdict + Trust Receipt",
    body: "Findings are fused into a reputation-weighted risk score, then sealed into a signed, on-chain-linked Trust Receipt you can audit.",
  },
];

/** "How it works" — three connected numbered steps with icons. */
export function HowItWorks() {
  return (
    <section id="how" className="container-x py-20 sm:py-28">
      <motion.div
        variants={reveal}
        initial="hidden"
        whileInView="show"
        viewport={inView}
        className="max-w-2xl"
      >
        <span className="eyebrow">
          <span className="h-px w-6 bg-brand-spectrum" />
          How it works
        </span>
        <h2 className="mt-4 font-display text-hero font-semibold text-white">
          One paste. A real multi-agent investigation.
        </h2>
        <p className="mt-3 text-slate-400">
          Money and work flow autonomously between independent agents — no
          dashboards to wire up, no accounts to create.
        </p>
      </motion.div>

      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={inView}
        className="relative mt-14 grid gap-8 sm:grid-cols-3 sm:gap-6"
      >
        {/* connecting line (desktop) */}
        <div className="pointer-events-none absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-brand-400/40 via-violet-400/30 to-signal-400/40 sm:block" />

        {STEPS.map((s) => (
          <motion.div key={s.n} variants={reveal} className="relative">
            <div className="flex items-center gap-3">
              <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-bg-soft text-brand-300 shadow-card">
                <s.icon size={20} strokeWidth={1.9} />
              </div>
              <span className="font-display text-4xl font-semibold text-white/[0.08]">{s.n}</span>
            </div>
            <h3 className="mt-5 text-lg font-semibold text-white">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{s.body}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
