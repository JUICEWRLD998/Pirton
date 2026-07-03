"use client";

import { motion } from "framer-motion";
import { Link2, Quote, BadgeCheck } from "lucide-react";
import { reveal, stagger, inView } from "@/lib/motion";

const SIGNALS = [
  {
    icon: Link2,
    title: "Real on-chain settlement",
    body: "Every agent is hired and paid in USDC escrow on Base — not a mock. The transactions are linked on the receipt.",
  },
  {
    icon: Quote,
    title: "Every finding is cited",
    body: "Explorer links, transaction hashes, source lines, and the exact phrases that triggered each flag — no hand-waving.",
  },
  {
    icon: BadgeCheck,
    title: "An auditable Trust Receipt",
    body: "A signed, hash-anchored bill of materials: who was hired, what they found, what they earned, and their reputation.",
  },
];

/** Why-Pirton trust band — three concise trust signals in a lit glass panel. */
export function TrustBand() {
  return (
    <section className="container-x py-20 sm:py-24">
      <motion.div
        variants={reveal}
        initial="hidden"
        whileInView="show"
        viewport={inView}
        className="card-grad relative overflow-hidden p-8 sm:p-12"
      >
        {/* corner glow */}
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full opacity-60 blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(124,58,237,0.25), transparent 65%)" }}
        />

        <div className="relative max-w-2xl">
          <span className="eyebrow">
            <span className="h-px w-6 bg-brand-spectrum" />
            Why you can trust it
          </span>
          <h2 className="mt-4 font-display text-hero font-semibold text-white">
            The math and the money are deterministic.
          </h2>
          <p className="mt-3 text-slate-400">
            Verifiable facts are kept out of the model's hands. What can be proven
            on-chain, is.
          </p>
        </div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={inView}
          className="relative mt-10 grid gap-8 sm:grid-cols-3 sm:gap-6"
        >
          {SIGNALS.map((s) => (
            <motion.div key={s.title} variants={reveal}>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-200 ring-1 ring-brand-400/30 shadow-[0_8px_28px_-10px_rgba(124,58,237,0.7)]">
                <s.icon size={20} strokeWidth={2} />
              </div>
              <h3 className="mt-5 text-base font-semibold text-white">{s.title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-slate-400">{s.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
