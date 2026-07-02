"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Finding } from "@/lib/types";
import { SEVERITY_META } from "@/lib/agents";

const isUrl = (s: string) => /^https?:\/\//.test(s);
const isTx = (s: string) => /^0x[a-fA-F0-9]{40,}$/.test(s);

/** A single evidence-backed finding, expandable to show plain-language detail + citations. */
export function FindingRow({ finding }: { finding: Finding }) {
  const [open, setOpen] = useState(false);
  const sev = SEVERITY_META[finding.severity];

  return (
    <div className="rounded-lg border border-white/8 bg-white/[0.02]">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
        aria-expanded={open}
      >
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ background: sev.color, boxShadow: `0 0 8px ${sev.color}` }}
        />
        <span className="min-w-0 flex-1 truncate text-[13px] text-slate-200">
          {finding.title}
        </span>
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
          style={{ color: sev.color, background: `${sev.color}1a` }}
        >
          {sev.label}
        </span>
        <motion.svg
          animate={{ rotate: open ? 180 : 0 }}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          className="shrink-0 text-slate-500"
        >
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </motion.svg>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/8 px-3 py-2.5">
              <p className="text-[12.5px] leading-relaxed text-slate-400">
                {finding.detail}
              </p>
              {finding.citations.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {finding.citations.map((c, i) => {
                    const linkable = isUrl(c.ref) || isTx(c.ref);
                    const href = isUrl(c.ref)
                      ? c.ref
                      : isTx(c.ref)
                        ? `https://basescan.org/tx/${c.ref}`
                        : undefined;
                    const body = (
                      <>
                        <span className="text-slate-500">{c.label}:</span>{" "}
                        <span className="mono text-slate-300">
                          {c.ref.length > 30 ? c.ref.slice(0, 14) + "…" + c.ref.slice(-6) : c.ref}
                        </span>
                      </>
                    );
                    return linkable && href ? (
                      <a
                        key={i}
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-md border border-white/10 bg-black/30 px-2 py-1 text-[11px] transition hover:border-cyan-glow/40 hover:text-white"
                      >
                        {body} ↗
                      </a>
                    ) : (
                      <span
                        key={i}
                        className="rounded-md border border-white/10 bg-black/30 px-2 py-1 text-[11px]"
                      >
                        {body}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
