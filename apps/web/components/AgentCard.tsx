"use client";

import { Check, ArrowUpRight } from "lucide-react";
import type { AgentState } from "@/lib/useScan";
import { SPECIALISTS, STAGE_META, SEVERITY_META } from "@/lib/agents";
import { NumberTicker } from "./ui/NumberTicker";
import { usdcFloat, txUrl, shortAddr } from "@/lib/format";

const TONE: Record<string, { dot: string; text: string }> = {
  idle: { dot: "#64748b", text: "text-slate-400" },
  active: { dot: "#818CF8", text: "text-brand-300" },
  pay: { dot: "#22D3EE", text: "text-signal-300" },
  done: { dot: "#34D399", text: "text-safe" },
  error: { dot: "#F87171", text: "text-danger" },
};

/** One specialist in the live board: monogram, status, thin progress, cost. */
export function AgentCard({ agent }: { agent: AgentState }) {
  const meta = SPECIALISTS[agent.specialist];
  const stage = STAGE_META[agent.stage];
  const tone = TONE[stage.tone];
  const working = agent.stage !== "done" && agent.stage !== "error";
  const done = agent.stage === "done";
  const price = usdcFloat(agent.priceBaseUnits);

  const findings = agent.entry?.result.findings ?? [];
  const worst = findings.reduce(
    (acc, f) => (SEVERITY_META[f.severity].rank > SEVERITY_META[acc].rank ? f.severity : acc),
    "info" as (typeof findings)[number]["severity"]
  );

  return (
    <div
      className="card-grad p-4 transition-shadow duration-300"
      style={working ? { boxShadow: `0 0 0 1px ${tone.dot}22, 0 14px 40px -18px ${tone.dot}55` } : undefined}
    >
      <div className="flex items-start gap-3">
        {/* monogram avatar */}
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-mono text-sm font-semibold ring-1 ${
            done
              ? "bg-safe/15 text-safe ring-safe/30"
              : "bg-brand-500/15 text-brand-300 ring-brand-400/30"
          }`}
        >
          {done ? <Check size={18} strokeWidth={2.6} /> : meta.monogram}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-sm font-semibold text-white">{meta.name}</h3>
            <span className={`inline-flex shrink-0 items-center gap-1.5 text-[11px] font-medium ${tone.text}`}>
              <span className="relative flex h-1.5 w-1.5">
                {working && (
                  <span
                    className="absolute inline-flex h-full w-full animate-ping rounded-full"
                    style={{ background: tone.dot, opacity: 0.7 }}
                  />
                )}
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: tone.dot }} />
              </span>
              {stage.label}
            </span>
          </div>
          <p className="mt-0.5 font-mono text-[11px] text-slate-500">{meta.role}</p>
        </div>
      </div>

      {/* progress rail */}
      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className="h-full rounded-full transition-[width] duration-500 ease-out"
          style={{
            width: `${Math.round(stage.pct * 100)}%`,
            background: done ? "#34D399" : `linear-gradient(90deg, #6366F1, ${tone.dot})`,
          }}
        />
      </div>

      {/* footer: cost + tx (or delivered summary) */}
      <div className="mt-3 flex items-center justify-between gap-2 text-xs">
        <span className="text-slate-500">
          {price > 0 ? (
            <span className="mono text-slate-300">
              <NumberTicker value={price} decimals={2} duration={0.8} /> USDC
            </span>
          ) : (
            "escrow pending…"
          )}
        </span>
        {agent.payTxHash ? (
          <a
            href={txUrl(agent.payTxHash)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-0.5 text-brand-300 transition-colors hover:text-white"
          >
            {shortAddr(agent.payTxHash)}
            <ArrowUpRight size={13} />
          </a>
        ) : (
          <span className="text-slate-600">—</span>
        )}
      </div>

      {done && agent.entry && (
        <div className="mt-3 rounded-xl border border-line-soft bg-black/20 p-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-slate-500">
              {findings.length} finding{findings.length === 1 ? "" : "s"}
            </span>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
              style={{ color: SEVERITY_META[worst].color, background: `${SEVERITY_META[worst].color}1f` }}
            >
              {SEVERITY_META[worst].label}
            </span>
          </div>
          {agent.entry.result.summary && (
            <p className="mt-1.5 text-[12px] leading-snug text-slate-300">
              {agent.entry.result.summary}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
