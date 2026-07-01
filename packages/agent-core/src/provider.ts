import {
  AgentClient,
  DeliverableType,
  EventType,
  type Event,
} from '@croo-network/sdk';
import {
  capConfig,
  proofHashOf,
  requireEnv,
  type Finding,
  type SpecialistId,
  type SpecialistResult,
} from '@pirton/shared';

/**
 * The handler a specialist implements: given the requirements string the
 * requester sent, produce findings + a confidence + an optional summary.
 * agent-core wraps this into the full CAP provider lifecycle and stamps the
 * proof hash + timestamp so every provider behaves identically.
 */
export interface HandlerResult {
  subject: string;
  confidence: number;
  findings: Finding[];
  summary?: string;
}

export type SpecialistHandler = (requirements: RequirementsInput) => Promise<HandlerResult>;

/** Parsed requirements passed to a handler. */
export interface RequirementsInput {
  /** Raw requirements string from the negotiation/order. */
  raw: string;
  /** Parsed JSON if the requirements were JSON, else undefined. */
  json?: Record<string, unknown>;
  /** Convenience: `subject` / `address` / `text` fields if present. */
  subject?: string;
}

export interface ProviderOptions {
  specialist: SpecialistId;
  /** Env var name holding this provider's SDK key. */
  sdkKeyEnv: string;
  handler: SpecialistHandler;
  /** ISO clock — injected so callers control time (tests/replay). */
  now?: () => string;
  logger?: Pick<Console, 'info' | 'warn' | 'error'>;
}

export interface RunningProvider {
  client: AgentClient;
  close: () => void;
}

/**
 * Start a CAP provider: auto-accept negotiations, and on payment run the
 * handler and deliver the result. Mirrors examples/provider.ts but generalized
 * and hardened (idempotency guard, structured deliverable, proof hash).
 */
export async function startProvider(opts: ProviderOptions): Promise<RunningProvider> {
  const log = opts.logger ?? console;
  const now = opts.now ?? (() => new Date().toISOString());
  const cfg = capConfig();
  const sdkKey = requireEnv(opts.sdkKeyEnv);

  const client = new AgentClient(
    { baseURL: cfg.baseURL, wsURL: cfg.wsURL, rpcURL: cfg.rpcURL },
    sdkKey
  );

  const stream = await client.connectWebSocket();
  log.info(`[${opts.specialist}] provider online, awaiting negotiations…`);

  // Guard against duplicate deliveries if OrderPaid fires more than once.
  const delivered = new Set<string>();

  stream.on(EventType.NegotiationCreated, async (e: Event) => {
    const negId = e.negotiation_id;
    if (!negId) return;
    try {
      const res = await client.acceptNegotiation(negId);
      log.info(`[${opts.specialist}] accepted negotiation ${negId} → order ${res.order.orderId}`);
    } catch (err: any) {
      log.error(`[${opts.specialist}] accept failed for ${negId}: ${err?.message ?? err}`);
    }
  });

  stream.on(EventType.OrderPaid, async (e: Event) => {
    const orderId = e.order_id;
    if (!orderId || delivered.has(orderId)) return;
    delivered.add(orderId);
    try {
      // Requirements live on the negotiation, not the order — fetch both.
      const order = await client.getOrder(orderId);
      const neg = await client.getNegotiation(order.negotiationId);
      const parsed = parseRequirementsString(neg.requirements);

      log.info(`[${opts.specialist}] order ${orderId} paid → running handler`);
      const hr = await opts.handler(parsed);

      const result: SpecialistResult = {
        specialist: opts.specialist,
        subject: hr.subject,
        confidence: clamp01(hr.confidence),
        findings: hr.findings,
        summary: hr.summary,
        producedAt: now(),
        proofHash: '', // set below over the canonical payload (excluding itself)
      };
      result.proofHash = proofHashOf({
        specialist: result.specialist,
        subject: result.subject,
        confidence: result.confidence,
        findings: result.findings,
        producedAt: result.producedAt,
      });

      await client.deliverOrder(orderId, {
        deliverableType: DeliverableType.Text,
        deliverableText: JSON.stringify(result),
      });
      log.info(`[${opts.specialist}] delivered order ${orderId} (${result.findings.length} findings)`);
    } catch (err: any) {
      delivered.delete(orderId); // allow retry on transient failure
      log.error(`[${opts.specialist}] deliver failed for ${orderId}: ${err?.message ?? err}`);
    }
  });

  return {
    client,
    close: () => stream.close(),
  };
}

function parseRequirementsString(raw: string): RequirementsInput {
  const input: RequirementsInput = { raw: raw ?? '' };
  if (!raw) return input;
  try {
    const json = JSON.parse(raw);
    if (json && typeof json === 'object') {
      input.json = json;
      input.subject =
        (json.subject as string) ??
        (json.address as string) ??
        (json.text as string) ??
        undefined;
    }
  } catch {
    // requirements weren't JSON — treat the whole string as the subject/text.
    input.subject = raw;
  }
  return input;
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}
