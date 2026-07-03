"use client";

import { motion } from "framer-motion";
import { Fingerprint, FileSearch, Globe, MessageSquareWarning } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SPECIALISTS, SPECIALIST_ORDER } from "@/lib/agents";
import type { SpecialistId } from "@/lib/types";
import { reveal, stagger, inView } from "@/lib/motion";

/** Per-agent icon + hue — a visual identity that matches the hero swarm. */
const LOOK: Record<SpecialistId, { icon: LucideIcon; hue: string }> = {
  forensics: { icon: Fingerprint, hue: "#818CF8" },
  auditor: { icon: FileSearch, hue: "#A78BFA" },
  reputation: { icon: Globe, hue: "#22D3EE" },
  claims: { icon: MessageSquareWarning, hue: "#60A5FA" },
};

/** "The swarm" — the four specialist agents as gradient-bordered cards. */
export function AgentsShowcase() {
  return (
    <section id="agents" className="container-x py-20 sm:py-28">
      <motion.div
        variants={reveal}
        initial="hidden"
        whileInView="show"
        viewport={inView}
        className="max-w-2xl"
      >
        <span className="eyebrow">
          <span className="h-px w-6 bg-brand-spectrum" />
          The swarm
        </span>
        <h2 className="mt-4 font-display text-hero font-semibold text-white">
          Four specialists, each an on-chain provider.
        </h2>
        <p className="mt-3 text-slate-400">
          Every agent is an independent CAP provider with its own wallet, DID, and
          reputation. Pirton hires only the ones that fit your input.
        </p>
      </motion.div>

      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={inView}
        className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {SPECIALIST_ORDER.map((id) => {
          const a = SPECIALISTS[id];
          const look = LOOK[id];
          return (
            <motion.div
              key={id}
              variants={reveal}
              className="card-grad group h-full p-5 transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl ring-1"
                  style={{
                    background: `${look.hue}1f`,
                    color: look.hue,
                    boxShadow: `inset 0 0 0 1px ${look.hue}33`,
                  }}
                >
                  <look.icon size={20} strokeWidth={1.9} />
                </div>
                <span
                  className="font-mono text-[11px] font-semibold tracking-wider"
                  style={{ color: `${look.hue}` }}
                >
                  {a.monogram}
                </span>
              </div>
              <h3 className="mt-4 text-sm font-semibold text-white">{a.name}</h3>
              <p className="mt-0.5 font-mono text-[11px] text-slate-500">{a.role}</p>
              <p className="mt-2.5 text-[13px] leading-relaxed text-slate-400">{a.blurb}</p>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
