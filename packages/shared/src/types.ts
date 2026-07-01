// Core domain types shared across the orchestrator, providers, and the web UI.
// The Trust Receipt is the product's signature artifact — every field here is
// meant to be renderable and auditable.

/** What the user pasted, after classification. */
export type InputKind =
  | 'token_or_contract' // an EVM address (token / contract)
  | 'offer_text' // an investment/airdrop/DM offer
  | 'job_or_rental' // a job post or rental listing
  | 'url' // a bare link/domain
  | 'unknown';

/** Which specialist services exist. Maps 1:1 to CROO provider services. */
export type SpecialistId = 'forensics' | 'auditor' | 'reputation' | 'claims';

/** Severity of a single finding, ordered. Drives the risk math. */
export type Severity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export const SEVERITY_WEIGHT: Record<Severity, number> = {
  info: 0,
  low: 15,
  medium: 40,
  high: 70,
  critical: 100,
};

/** A single evidence-backed observation from a specialist. */
export interface Finding {
  /** Stable machine key, e.g. "ownership_not_renounced". */
  code: string;
  /** One-line human summary. */
  title: string;
  severity: Severity;
  /** Plain-language "we flagged this because…" detail. */
  detail: string;
  /** Citations: explorer links, tx hashes, source lines, web URLs. */
  citations: Citation[];
}

export interface Citation {
  label: string;
  /** URL, tx hash, contract line ref, etc. */
  ref: string;
}

/**
 * A specialist's full deliverable. This is what a provider returns from its
 * handler and what gets JSON-serialized into the CAP deliverableText.
 */
export interface SpecialistResult {
  specialist: SpecialistId;
  /** Subject that was analyzed (address / text digest / url). */
  subject: string;
  /** Overall confidence 0..1 that the findings are reliable. */
  confidence: number;
  findings: Finding[];
  /** Optional one-line phrasing from the agent's LLM. */
  summary?: string;
  /**
   * Deterministic proof anchor: sha256 of the canonical result payload.
   * Embedded in the deliverable so the receipt can show tamper-evidence
   * alongside CAP's server-set contentHash.
   */
  proofHash: string;
  /** ISO timestamp the provider stamps at delivery (injected by caller). */
  producedAt?: string;
}

/** The CAP settlement facts captured per hire, for the receipt. */
export interface SettlementRecord {
  serviceId: string;
  providerAgentId: string;
  negotiationId: string;
  orderId: string;
  /** USDC price in base units (6 decimals) as decimal string. */
  priceBaseUnits: string;
  paymentToken: string;
  /** on-chain tx hashes */
  createTxHash?: string;
  payTxHash?: string;
  deliverTxHash?: string;
  /** CAP server-set content hash of the delivery. */
  contentHash?: string;
}

/** A derived, transparent trust weight for a provider (SDK exposes no score). */
export interface ReputationSignal {
  providerAgentId: string;
  /** Completed orders observed via listOrders — the basis of the weight. */
  completedOrders: number;
  /** Normalized weight in [0.5, 1.5] applied in fusion. */
  weight: number;
  /** How the weight was derived, shown honestly on the receipt. */
  basis: string;
}

/** One line item on the Trust Receipt: a hired agent + what it produced + what it cost. */
export interface ReceiptEntry {
  specialist: SpecialistId;
  providerAgentId: string;
  result: SpecialistResult;
  settlement: SettlementRecord;
  reputation: ReputationSignal;
}

export type Verdict = 'safe' | 'caution' | 'likely_scam';

export interface TrustReceipt {
  version: '1';
  subject: string;
  inputKind: InputKind;
  createdAt: string;
  /** Fused risk 0..100. */
  riskScore: number;
  verdict: Verdict;
  /** Plain-language explanation (LLM-phrased, or deterministic fallback). */
  explanation: string;
  entries: ReceiptEntry[];
  /** sha256 over the canonical receipt body (excludes this field + signature). */
  receiptHash: string;
  /** Optional signature over receiptHash (added if a signing key is present). */
  signature?: {
    signer: string;
    value: string;
  };
  /** Total USDC paid across all hires, base units decimal string. */
  totalPaidBaseUnits: string;
}
