"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ArrowUpRight } from "lucide-react";
import type { Finding } from "@/lib/types";
import { SEVERITY_META } from "@/lib/agents";

const isUrl = (s: string) => /^https?:\/\//.test(s);
const isTx = (s: string) => /^0x[a-fA-F0-9]{40,}$/.test(s);

/** A single evidence-backed finding — quiet accordion with citation pills. */
export function FindingRow({ finding }: { finding: Finding }) {
  const [open, setOpen] = useState(false);
  const sev = SEVERITY_META[finding.severity];

  return (
    <div className="rounded-xl border border-line-soft bg-white/[0.02]">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-3.5 py-3 text-left"
        aria-expanded={open}
      >
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: sev.color }} />
        <span className="min-w-0 flex-1 truncate text-[13px] text-slate-200">{finding.title}</span>
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
          style={{ color: sev.color, background: `${sev.color}1f` }}
        >
          {sev.label}
        </span>
        <ChevronDown
          size={15}
          className="shrink-0 text-slate-500 transition-transform"
          style={{ transform: open ? "rotate(180deg)" : "none" }}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-line-soft px-3.5 py-3">
              <p className="text-[12.5px] leading-relaxed text-slate-400">{finding.detail}</p>
              {finding.citations.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {finding.citations.map((c, i) => {
                    const href = isUrl(c.ref)
                      ? c.ref
                      : isTx(c.ref)
                        ? `https://basescan.org/tx/${c.ref}`
                        : undefined;
                    const label = (
                      <>
                        <span className="text-slate-500">{c.label}:</span>{" "}
                        <span className="mono text-slate-300">
                          {c.ref.length > 28 ? c.ref.slice(0, 12) + "…" + c.ref.slice(-6) : c.ref}
                        </span>
                      </>
                    );
                    return href ? (
                      <a
                        key={i}
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg border border-line bg-black/20 px-2 py-1 text-[11px] transition-colors hover:border-brand-400/50 hover:text-white"
                      >
                        {label}
                        <ArrowUpRight size={12} className="text-slate-500" />
                      </a>
                    ) : (
                      <span
                        key={i}
                        className="rounded-lg border border-line bg-black/20 px-2 py-1 text-[11px]"
                      >
                        {label}
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
