import type { HireStage, SpecialistId, Severity, Verdict } from "./types";

export interface SpecialistMeta {
  id: SpecialistId;
  name: string;
  role: string;
  /** Short blurb shown on the card. */
  blurb: string;
  /** Two-letter monogram avatar (no decorative icons). */
  monogram: string;
}

export const SPECIALISTS: Record<SpecialistId, SpecialistMeta> = {
  forensics: {
    id: "forensics",
    name: "On-chain Forensics",
    role: "RPC · bytecode sweep",
    blurb: "Honeypot signals, mint/blacklist authority, ownership, delegation.",
    monogram: "FA",
  },
  auditor: {
    id: "auditor",
    name: "Contract Auditor",
    role: "verified source · LLM",
    blurb: "Rug patterns in Solidity — hidden fees, pausable transfers, proxies.",
    monogram: "CA",
  },
  reputation: {
    id: "reputation",
    name: "Reputation / Web-signal",
    role: "web search · WHOIS",
    blurb: "Scam reports, domain age, social footprint, known-scam lists.",
    monogram: "RW",
  },
  claims: {
    id: "claims",
    name: "Claims / Misinformation",
    role: "red-flag heuristics · LLM",
    blurb: "Guaranteed returns, urgency, impersonation, wallet-drainer language.",
    monogram: "CM",
  },
};

export const SPECIALIST_ORDER: SpecialistId[] = [
  "forensics",
  "auditor",
  "reputation",
  "claims",
];

/** Human labels + progress fraction + tone for each CAP stage. */
export const STAGE_META: Record<
  HireStage,
  { label: string; pct: number; tone: "idle" | "active" | "pay" | "done" | "error" }
> = {
  negotiating: { label: "Negotiating", pct: 0.18, tone: "active" },
  order_created: { label: "Order created", pct: 0.36, tone: "active" },
  paying: { label: "Escrowing USDC", pct: 0.55, tone: "pay" },
  paid: { label: "Paid · working", pct: 0.72, tone: "pay" },
  delivering: { label: "Delivering", pct: 0.88, tone: "active" },
  done: { label: "Delivered", pct: 1, tone: "done" },
  error: { label: "Failed", pct: 1, tone: "error" },
};

/** Severity colors tuned for the dark theme. */
export const SEVERITY_META: Record<
  Severity,
  { label: string; color: string; rank: number }
> = {
  info: { label: "Info", color: "#94A3B8", rank: 0 },
  low: { label: "Low", color: "#38BDF8", rank: 1 },
  medium: { label: "Medium", color: "#FBBF24", rank: 2 },
  high: { label: "High", color: "#FB923C", rank: 3 },
  critical: { label: "Critical", color: "#F87171", rank: 4 },
};

export const VERDICT_META: Record<
  Verdict,
  { label: string; blurb: string; color: string; tint: string }
> = {
  safe: {
    label: "Looks Safe",
    blurb: "No strong scam signals across the hired agents.",
    color: "#34D399",
    tint: "rgba(52,211,153,0.12)",
  },
  caution: {
    label: "Caution",
    blurb: "Mixed signals — treat with care before acting.",
    color: "#FBBF24",
    tint: "rgba(251,191,36,0.12)",
  },
  likely_scam: {
    label: "Likely Scam",
    blurb: "Multiple independent agents flagged this.",
    color: "#F87171",
    tint: "rgba(248,113,113,0.12)",
  },
};
