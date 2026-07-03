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
        className="mt-14 grid gap-5 sm:grid-cols-3"
      >
        {STEPS.map((s) => (
          <motion.div
            key={s.n}
            variants={reveal}
            className="card-grad group relative h-full p-6 transition-transform duration-300 hover:-translate-y-1 sm:p-7"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-200 ring-1 ring-brand-400/30 shadow-[0_8px_28px_-10px_rgba(124,58,237,0.7)]">
                <s.icon size={22} strokeWidth={2} />
              </div>
              <span className="text-spectrum font-display text-3xl font-bold tracking-tight opacity-90">
                {s.n}
              </span>
            </div>
            <h3 className="mt-6 text-lg font-semibold text-white">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">{s.body}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
