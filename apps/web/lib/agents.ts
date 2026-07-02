import type { HireStage, SpecialistId, Severity, Verdict } from "./types";

export interface SpecialistMeta {
  id: SpecialistId;
  name: string;
  role: string;
  /** Short blurb shown on the card. */
  blurb: string;
  /** Inline SVG icon path (24x24 viewbox, stroke). */
  icon: string;
  /** Accent hue for this agent's beam/dot (idle color; verdict overrides later). */
  hue: string;
}

export const SPECIALISTS: Record<SpecialistId, SpecialistMeta> = {
  forensics: {
    id: "forensics",
    name: "On-chain Forensics",
    role: "RPC · bytecode sweep",
    blurb: "Honeypot, mint/blacklist authority, ownership, delegation.",
    // radar / pulse
    icon: "M12 2a10 10 0 1 0 10 10M12 12l7-4M12 12v9",
    hue: "#38E1FF",
  },
  auditor: {
    id: "auditor",
    name: "Contract Auditor",
    role: "verified source · LLM",
    blurb: "Rug patterns in Solidity — hidden fees, pausable transfers, proxies.",
    // file-code
    icon: "M9 12l-2 2 2 2M15 12l2 2-2 2M14 3v4a1 1 0 0 0 1 1h4M5 3h9l5 5v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z",
    hue: "#A78BFA",
  },
  reputation: {
    id: "reputation",
    name: "Reputation / Web-signal",
    role: "web search · WHOIS",
    blurb: "Scam reports, domain age, social footprint, known-scam lists.",
    // globe-search
    icon: "M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zM2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20",
    hue: "#34D399",
  },
  claims: {
    id: "claims",
    name: "Claims / Misinformation",
    role: "red-flag heuristics · LLM",
    blurb: "Guaranteed returns, urgency, impersonation, wallet-drainer language.",
    // shield-alert
    icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM12 8v4M12 16h.01",
    hue: "#F5B14C",
  },
};

export const SPECIALIST_ORDER: SpecialistId[] = [
  "forensics",
  "auditor",
  "reputation",
  "claims",
];

/** Human labels + progress fraction for each CAP stage. */
export const STAGE_META: Record<
  HireStage,
  { label: string; pct: number; tone: "idle" | "active" | "pay" | "done" | "error" }
> = {
  negotiating: { label: "Negotiating", pct: 0.18, tone: "active" },
  order_created: { label: "Order created", pct: 0.36, tone: "active" },
  paying: { label: "Escrowing USDC", pct: 0.55, tone: "pay" },
  paid: { label: "Paid — working", pct: 0.72, tone: "pay" },
  delivering: { label: "Delivering", pct: 0.88, tone: "active" },
  done: { label: "Delivered", pct: 1, tone: "done" },
  error: { label: "Failed", pct: 1, tone: "error" },
};

export const SEVERITY_META: Record<
  Severity,
  { label: string; color: string; rank: number }
> = {
  info: { label: "Info", color: "#7DD3FC", rank: 0 },
  low: { label: "Low", color: "#5EEAD4", rank: 1 },
  medium: { label: "Medium", color: "#F5B14C", rank: 2 },
  high: { label: "High", color: "#FB7185", rank: 3 },
  critical: { label: "Critical", color: "#F4523B", rank: 4 },
};

export const VERDICT_META: Record<
  Verdict,
  { label: string; blurb: string; accent: string }
> = {
  safe: {
    label: "Looks Safe",
    blurb: "No strong scam signals across the hired agents.",
    accent: "#2DD4BF",
  },
  caution: {
    label: "Caution",
    blurb: "Mixed signals — treat with care before acting.",
    accent: "#F5B14C",
  },
  likely_scam: {
    label: "Likely Scam",
    blurb: "Multiple independent agents flagged this.",
    accent: "#F4523B",
  },
};
