/**
 * SSE contract + Trust Receipt types for the Pirton web console.
 *
 * These MIRROR `@pirton/shared` (packages/shared/src/types.ts) so the frontend
 * renders whatever the orchestrator emits over the wire — but they are kept
 * local so the web app builds and demos standalone, with no dependency on the
 * CAP/agent packages. The orchestrator's live SSE stream emits the exact same
 * JSON shapes defined here.
 */

export type InputKind =
  | "token_or_contract"
  | "offer_text"
  | "job_or_rental"
  | "url"
  | "unknown";

export type SpecialistId = "forensics" | "auditor" | "reputation" | "claims";

export type Severity = "info" | "low" | "medium" | "high" | "critical";

export type Verdict = "safe" | "caution" | "likely_scam";

/** CAP order lifecycle stage, per hire. Drives the agent-card state machine. */
export type HireStage =
  | "negotiating"
  | "order_created"
  | "paying"
  | "paid"
  | "delivering"
  | "done"
  | "error";

export interface Citation {
  label: string;
  ref: string;
}

export interface Finding {
  code: string;
  title: string;
  severity: Severity;
  detail: string;
  citations: Citation[];
}

export interface SpecialistResult {
  specialist: SpecialistId;
  subject: string;
  confidence: number;
  findings: Finding[];
  summary?: string;
  proofHash: string;
  producedAt?: string;
}

export interface SettlementRecord {
  serviceId: string;
  providerAgentId: string;
  negotiationId: string;
  orderId: string;
  priceBaseUnits: string;
  paymentToken: string;
  createTxHash?: string;
  payTxHash?: string;
  deliverTxHash?: string;
  contentHash?: string;
}

export interface ReputationSignal {
  providerAgentId: string;
  completedOrders: number;
  weight: number;
  basis: string;
}

export interface ReceiptEntry {
  specialist: SpecialistId;
  providerAgentId: string;
  result: SpecialistResult;
  settlement: SettlementRecord;
  reputation: ReputationSignal;
}

export interface TrustReceipt {
  version: "1";
  subject: string;
  inputKind: InputKind;
  createdAt: string;
  riskScore: number;
  verdict: Verdict;
  explanation: string;
  entries: ReceiptEntry[];
  receiptHash: string;
  signature?: { signer: string; value: string };
  totalPaidBaseUnits: string;
}

/* ------------------------------------------------------------------ */
/*  SSE wire events (data: JSON per line, event: <type>)              */
/* ------------------------------------------------------------------ */

export interface ClassifiedEvent {
  type: "classified";
  kind: InputKind;
  subject: string;
  reason: string;
  hire: SpecialistId[];
  mode: "demo" | "live";
}

export interface ProgressEvent {
  type: "progress";
  specialist: SpecialistId;
  stage: HireStage;
  serviceId?: string;
  orderId?: string;
  negotiationId?: string;
  providerAgentId?: string;
  payTxHash?: string;
  /** USDC price (base units, 6dp) once known — lets the ticker start. */
  priceBaseUnits?: string;
  message?: string;
}

export interface DeliveredEvent {
  type: "delivered";
  specialist: SpecialistId;
  entry: ReceiptEntry;
}

export interface ReceiptReadyEvent {
  type: "receipt";
  receipt: TrustReceipt;
}

export interface ErrorEvent {
  type: "error";
  message: string;
}

export type ScanEvent =
  | ClassifiedEvent
  | ProgressEvent
  | DeliveredEvent
  | ReceiptReadyEvent
  | ErrorEvent;
