/**
 * Demo scenario engine.
 *
 * Live CAP settlement is gated on registered service ids + a funded orchestrator
 * wallet (see PHASE1/PHASE2). Until those are provisioned, the console runs a
 * scripted, realistically-timed scan that emits the EXACT SAME SSE contract the
 * live orchestrator emits — so the UI is always presentable and the demo/video
 * is deterministic. This mirrors implementation.md's fallback ladder.
 *
 * Every scenario produces a fully-formed TrustReceipt with real-shaped fields
 * (DIDs, USDC base units, Base tx hashes, proof/receipt hashes).
 */

import type {
  ClassifiedEvent,
  Finding,
  InputKind,
  ReceiptEntry,
  ScanEvent,
  SpecialistId,
  SpecialistResult,
  TrustReceipt,
  Verdict,
} from "./types";

export interface ExampleChip {
  label: string;
  value: string;
  hint: string;
}

export const EXAMPLES: ExampleChip[] = [
  {
    label: "🪙 Crypto “airdrop” + token",
    hint: "offer text with a contract address · hires all four agents",
    value:
      "🚀 CONGRATS! You're whitelisted for the $MOONX airdrop — GUARANTEED 100x. " +
      "Claim now before it closes tonight! Connect wallet & verify at moonx-claim.finance. " +
      "Token: 0x9f2a5c1E7b4D0aA31c88eF6b2D449C7A0e13B7Fa",
  },
  {
    label: "💼 Too-good remote job",
    hint: "job post · hires reputation + claims",
    value:
      "REMOTE — earn $4,800/week working 2 hrs/day, no experience needed. " +
      "We only communicate on Telegram @hr_payflow. Small $250 onboarding deposit " +
      "required to activate your account. Start today!",
  },
  {
    label: "✅ Blue-chip token",
    hint: "bare contract address · forensics + auditor · clears",
    value: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  },
];

/* ---------------------------- classification ---------------------------- */

const EVM_RE = /0x[a-fA-F0-9]{40}/;

interface DemoPlan {
  classified: ClassifiedEvent;
  entries: ReceiptEntry[];
  receipt: TrustReceipt;
}

/** Deterministic pseudo-hex from a seed — stable receipts per subject. */
function hex(seed: string, len: number): string {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  let out = "";
  while (out.length < len) {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    h >>>= 0;
    out += h.toString(16).padStart(8, "0");
  }
  return out.slice(0, len);
}
const txHash = (seed: string) => "0x" + hex(seed, 64);
const did = (seed: string) => "did:croo:0x" + hex(seed, 40);
const proof = (seed: string) => "sha256:" + hex(seed, 64);

const PRICE: Record<SpecialistId, string> = {
  forensics: "250000", // 0.25 USDC
  auditor: "400000", // 0.40
  reputation: "200000", // 0.20
  claims: "150000", // 0.15
};

const REP: Record<SpecialistId, { completed: number; weight: number }> = {
  forensics: { completed: 42, weight: 1.32 },
  auditor: { completed: 27, weight: 1.18 },
  reputation: { completed: 19, weight: 1.05 },
  claims: { completed: 34, weight: 1.24 },
};

function entry(
  specialist: SpecialistId,
  subject: string,
  confidence: number,
  findings: Finding[],
  summary: string
): ReceiptEntry {
  const providerAgentId = did(specialist + subject);
  const result: SpecialistResult = {
    specialist,
    subject,
    confidence,
    findings,
    summary,
    proofHash: proof(specialist + subject),
    producedAt: new Date().toISOString(),
  };
  const rep = REP[specialist];
  return {
    specialist,
    providerAgentId,
    result,
    settlement: {
      serviceId: `svc-${specialist}`,
      providerAgentId,
      negotiationId: "neg_" + hex(specialist + subject + "neg", 24),
      orderId: "ord_" + hex(specialist + subject + "ord", 24),
      priceBaseUnits: PRICE[specialist],
      paymentToken: "USDC",
      createTxHash: txHash(specialist + subject + "create"),
      payTxHash: txHash(specialist + subject + "pay"),
      deliverTxHash: txHash(specialist + subject + "deliver"),
      contentHash: "0x" + hex(specialist + subject + "content", 64),
    },
    reputation: {
      providerAgentId,
      completedOrders: rep.completed,
      weight: rep.weight,
      basis: `${rep.completed} completed CAP orders on Base · normalized to [0.5,1.5]`,
    },
  };
}

/* ------------------------------ scenarios ------------------------------ */

function scamAirdropPlan(raw: string): DemoPlan {
  const addr = raw.match(EVM_RE)?.[0] ?? "0x9f2a5c1E7b4D0aA31c88eF6b2D449C7A0e13B7Fa";
  const subject = addr;

  const entries: ReceiptEntry[] = [
    entry(
      "forensics",
      subject,
      0.94,
      [
        {
          code: "honeypot_sell_blocked",
          title: "Sells are blocked — honeypot pattern",
          severity: "critical",
          detail:
            "Simulated swaps show buys succeed but sells revert. Liquidity can be added but not removed by holders — a classic honeypot.",
          citations: [
            { label: "Token on BaseScan", ref: `https://basescan.org/token/${addr}` },
            { label: "sell simulation tx", ref: txHash(subject + "sim") },
          ],
        },
        {
          code: "owner_not_renounced",
          title: "Ownership not renounced",
          severity: "high",
          detail:
            "The contract still has an active owner able to change fees and pause transfers at any time.",
          citations: [{ label: "owner() read", ref: `https://basescan.org/address/${addr}#readContract` }],
        },
        {
          code: "mint_authority",
          title: "Mint function present",
          severity: "high",
          detail:
            "Bytecode exposes a mint selector — supply can be inflated after you buy.",
          citations: [{ label: "4byte selector 0x40c10f19", ref: "https://www.4byte.directory/signatures/?bytes4_signature=0x40c10f19" }],
        },
      ],
      "Buys succeed, sells revert, owner retains mint + pause powers — on-chain honeypot."
    ),
    entry(
      "auditor",
      subject,
      0.88,
      [
        {
          code: "hidden_fee_setter",
          title: "Owner-adjustable transfer fee up to 99%",
          severity: "critical",
          detail:
            "setFee(uint256) has no upper bound and is owner-only — the team can seize almost all of any transfer.",
          citations: [
            { label: "line 214 · setFee()", ref: `https://basescan.org/address/${addr}#code#L214` },
          ],
        },
        {
          code: "pausable_transfers",
          title: "Transfers can be paused by owner",
          severity: "high",
          detail:
            "A _paused guard on _transfer lets the owner freeze all trading, trapping holders.",
          citations: [{ label: "line 331 · _transfer()", ref: `https://basescan.org/address/${addr}#code#L331` }],
        },
      ],
      "Verified source confirms an unbounded owner fee setter and a global transfer pause."
    ),
    entry(
      "reputation",
      "moonx-claim.finance",
      0.83,
      [
        {
          code: "known_scam_report",
          title: "Domain reported as a wallet-drainer",
          severity: "critical",
          detail:
            "Multiple community reports flag moonx-claim.finance as a drainer front that empties wallets on ‘verify’.",
          citations: [
            { label: "ScamSniffer report", ref: "https://scam-sniffer.io/" },
            { label: "Chainabuse thread", ref: "https://www.chainabuse.com/" },
          ],
        },
        {
          code: "domain_age",
          title: "Domain registered 6 days ago",
          severity: "high",
          detail: "WHOIS shows the domain was created less than a week ago — typical of throwaway scam sites.",
          citations: [{ label: "WHOIS record", ref: "https://who.is/whois/moonx-claim.finance" }],
        },
      ],
      "Newly-registered domain with active drainer reports across scam databases."
    ),
    entry(
      "claims",
      "offer text",
      0.9,
      [
        {
          code: "guaranteed_returns",
          title: "“GUARANTEED 100x” return claim",
          severity: "high",
          detail: "No legitimate investment guarantees returns. Guaranteed multiples are a hallmark of fraud.",
          citations: [{ label: "matched phrase", ref: "GUARANTEED 100x" }],
        },
        {
          code: "urgency",
          title: "Artificial urgency — “before it closes tonight”",
          severity: "medium",
          detail: "Deadline pressure is used to stop you from checking. Real airdrops don't expire in hours.",
          citations: [{ label: "matched phrase", ref: "before it closes tonight" }],
        },
        {
          code: "wallet_connect_drainer",
          title: "‘Connect wallet & verify’ drainer flow",
          severity: "critical",
          detail: "Asking you to connect and ‘verify’ on an external site is the standard wallet-drainer script.",
          citations: [{ label: "matched phrase", ref: "Connect wallet & verify" }],
        },
      ],
      "Guaranteed returns + urgency + wallet-connect ‘verify’ — textbook drainer copy."
    ),
  ];

  return finalize({
    raw,
    subject,
    kind: "offer_text",
    reason:
      "Offer text embeds a contract address and drainer link → hire forensics + auditor (on-chain) and reputation + claims (text/web).",
    hire: ["forensics", "auditor", "reputation", "claims"],
    entries,
    riskScore: 91,
    verdict: "likely_scam",
    explanation:
      "We think this is almost certainly a scam. The token is a honeypot — you could buy but never sell — and the owner can mint unlimited supply and take up to 99% of any transfer. The ‘claim’ site is a newly-registered wallet-drainer, and the message uses classic pressure: guaranteed 100x returns and a fake deadline.",
  });
}

function fakeJobPlan(raw: string): DemoPlan {
  const entries: ReceiptEntry[] = [
    entry(
      "claims",
      "job post",
      0.86,
      [
        {
          code: "unrealistic_pay",
          title: "$4,800/week for 2 hrs/day, no experience",
          severity: "high",
          detail: "Pay wildly disproportionate to effort/skill is the top signal of a job scam.",
          citations: [{ label: "matched phrase", ref: "$4,800/week ... 2 hrs/day" }],
        },
        {
          code: "advance_fee",
          title: "Up-front “onboarding deposit” required",
          severity: "critical",
          detail: "Legitimate employers never ask you to pay to start. A $250 deposit is an advance-fee scam.",
          citations: [{ label: "matched phrase", ref: "$250 onboarding deposit" }],
        },
        {
          code: "off_platform",
          title: "Pushed to Telegram only",
          severity: "medium",
          detail: "Moving hiring entirely to Telegram avoids platform protections and identity checks.",
          citations: [{ label: "matched phrase", ref: "Telegram @hr_payflow" }],
        },
      ],
      "Advance-fee + unrealistic pay + off-platform contact — classic recruitment scam."
    ),
    entry(
      "reputation",
      "@hr_payflow",
      0.72,
      [
        {
          code: "no_footprint",
          title: "No verifiable company footprint",
          severity: "medium",
          detail: "No registered company, website, or employee records match the recruiter handle.",
          citations: [{ label: "web search", ref: "https://www.google.com/search?q=hr_payflow+scam" }],
        },
      ],
      "Recruiter handle has no legitimate corporate footprint online."
    ),
  ];

  return finalize({
    raw,
    subject: "Remote job offer",
    kind: "job_or_rental",
    reason: "Job/rental text with no address → hire claims (red-flag heuristics) + reputation (web-signal).",
    hire: ["reputation", "claims"],
    entries,
    riskScore: 78,
    verdict: "likely_scam",
    explanation:
      "This is very likely a job scam. It promises far too much money for almost no work, then asks you to pay a $250 ‘onboarding deposit’ before you start — a payment real employers never request — and pushes everything to Telegram to avoid oversight.",
  });
}

function blueChipPlan(raw: string): DemoPlan {
  const addr = raw.match(EVM_RE)?.[0] ?? "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
  const subject = addr;
  const entries: ReceiptEntry[] = [
    entry(
      "forensics",
      subject,
      0.95,
      [
        {
          code: "ownership_renounced",
          title: "No dangerous owner capabilities",
          severity: "info",
          detail:
            "No mint, pause, or blacklist selectors in bytecode; sells simulate successfully. Standard ERC-20 behavior.",
          citations: [{ label: "Token on BaseScan", ref: `https://basescan.org/token/${addr}` }],
        },
      ],
      "Clean ERC-20: sells work, no mint/pause/blacklist authority detected."
    ),
    entry(
      "auditor",
      subject,
      0.9,
      [
        {
          code: "source_verified_clean",
          title: "Verified source, no rug patterns",
          severity: "info",
          detail:
            "Source is verified on the explorer; no owner-adjustable fees, hidden pauses, or upgradeable proxy risk found.",
          citations: [{ label: "Verified source", ref: `https://basescan.org/address/${addr}#code` }],
        },
      ],
      "Verified source with no owner-controlled fee, pause, or proxy risk."
    ),
  ];

  return finalize({
    raw,
    subject,
    kind: "token_or_contract",
    reason: "Bare EVM address → on-chain forensics + source audit.",
    hire: ["forensics", "auditor"],
    entries,
    riskScore: 8,
    verdict: "safe",
    explanation:
      "We didn't find scam signals. This token behaves like a normal ERC-20 — you can sell it, there's no hidden mint or pause power, and its source code is verified with no rug patterns. As always, only you can judge whether the project itself is worth holding.",
  });
}

/* ------------------------------ assembly ------------------------------ */

function finalize(a: {
  raw: string;
  subject: string;
  kind: InputKind;
  reason: string;
  hire: SpecialistId[];
  entries: ReceiptEntry[];
  riskScore: number;
  verdict: Verdict;
  explanation: string;
}): DemoPlan {
  const total = a.entries.reduce(
    (acc, e) => acc + BigInt(e.settlement.priceBaseUnits),
    0n
  );
  const receipt: TrustReceipt = {
    version: "1",
    subject: a.subject,
    inputKind: a.kind,
    createdAt: new Date().toISOString(),
    riskScore: a.riskScore,
    verdict: a.verdict,
    explanation: a.explanation,
    entries: a.entries,
    receiptHash: "sha256:" + hex(a.subject + a.riskScore + "receipt", 64),
    signature: {
      signer: "0x" + hex(a.subject + "signer", 40),
      value: "0x" + hex(a.subject + "sig", 130),
    },
    totalPaidBaseUnits: total.toString(),
  };
  const classified: ClassifiedEvent = {
    type: "classified",
    kind: a.kind,
    subject: a.subject,
    reason: a.reason,
    hire: a.hire,
    mode: "demo",
  };
  return { classified, entries: a.entries, receipt };
}

/** Route arbitrary pasted input to the closest demo scenario. */
export function planDemo(raw: string): DemoPlan {
  const text = raw.trim();
  const isBareAddr = EVM_RE.test(text) && text.replace(EVM_RE, "").trim().length === 0;

  if (isBareAddr) return blueChipPlan(text);

  const lower = text.toLowerCase();
  const jobish = /(job|hiring|remote|salary|\/week|onboarding|deposit|per day|hrs\/day)/.test(lower);
  const hasAddr = EVM_RE.test(text);

  if (hasAddr || /airdrop|token|100x|guaranteed|claim|wallet|connect/.test(lower)) {
    return scamAirdropPlan(text);
  }
  if (jobish) return fakeJobPlan(text);
  // default to the flagship scenario so any paste yields the full swarm.
  return scamAirdropPlan(text);
}

/**
 * Expand a plan into a timed SSE script. Each specialist walks its CAP stages
 * with staggered starts so the board assembles with rhythm; `delivered` +
 * final `receipt` land last.
 */
export function scriptDemo(
  plan: DemoPlan
): Array<{ delay: number; event: ScanEvent }> {
  const out: Array<{ delay: number; event: ScanEvent }> = [];
  out.push({ delay: 350, event: plan.classified });

  // Per-agent lifecycle. Stagger each agent's entrance by 520ms.
  const perStage: Array<[import("./types").HireStage, number]> = [
    ["negotiating", 0],
    ["order_created", 620],
    ["paying", 520],
    ["paid", 700],
    ["delivering", 780],
    ["done", 640],
  ];

  plan.entries.forEach((e, i) => {
    let t = 700 + i * 520;
    for (const [stage, dt] of perStage) {
      t += dt;
      out.push({
        delay: t,
        event: {
          type: "progress",
          specialist: e.specialist,
          stage,
          serviceId: e.settlement.serviceId,
          orderId: stage === "negotiating" ? undefined : e.settlement.orderId,
          negotiationId: e.settlement.negotiationId,
          providerAgentId: e.providerAgentId,
          priceBaseUnits:
            stage === "paying" || stage === "paid" || stage === "delivering" || stage === "done"
              ? e.settlement.priceBaseUnits
              : undefined,
          payTxHash: stage === "paid" || stage === "done" ? e.settlement.payTxHash : undefined,
        },
      });
      if (stage === "done") {
        out.push({
          delay: t + 60,
          event: { type: "delivered", specialist: e.specialist, entry: e },
        });
      }
    }
  });

  const lastDone = Math.max(...out.map((o) => o.delay));
  out.push({ delay: lastDone + 900, event: { type: "receipt", receipt: plan.receipt } });

  return out.sort((a, b) => a.delay - b.delay);
}
