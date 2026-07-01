import {
  AgentClient,
  DeliverableType,
  EventType,
  isInsufficientBalance,
  type Event,
  type Order,
} from '@croo-network/sdk';
import {
  capConfig,
  deriveReputation,
  requireEnv,
  type ReceiptEntry,
  type ReputationSignal,
  type SettlementRecord,
  type SpecialistId,
  type SpecialistResult,
} from '@pirton/shared';

export type HireStage =
  | 'negotiating'
  | 'order_created'
  | 'paying'
  | 'paid'
  | 'delivering'
  | 'done'
  | 'error';

export interface HireProgress {
  specialist: SpecialistId;
  serviceId: string;
  stage: HireStage;
  orderId?: string;
  negotiationId?: string;
  payTxHash?: string;
  providerAgentId?: string;
  message?: string;
}

export type ProgressFn = (p: HireProgress) => void;

export interface HireRequest {
  specialist: SpecialistId;
  serviceId: string;
  /** JSON-serializable requirements handed to the provider. */
  requirements: Record<string, unknown>;
}

export interface OrchestratorOptions {
  now?: () => string;
  onProgress?: ProgressFn;
  logger?: Pick<Console, 'info' | 'warn' | 'error'>;
  /** Max ms to wait for a single hire to complete. */
  hireTimeoutMs?: number;
}

/**
 * The Pirton orchestrator: a CAP requester that hires providers, pays their
 * USDC escrow, collects deliverables, and derives each provider's reputation
 * from job history. One AgentClient + one WS stream drives all hires; each
 * hire() awaits its own order lifecycle via event correlation.
 */
export class Orchestrator {
  readonly client: AgentClient;
  private stream!: Awaited<ReturnType<AgentClient['connectWebSocket']>>;
  private readonly log: Pick<Console, 'info' | 'warn' | 'error'>;
  private readonly now: () => string;
  private readonly onProgress?: ProgressFn;
  private readonly hireTimeoutMs: number;

  // Per-order waiters, keyed by orderId, resolved as lifecycle events arrive.
  private orderEvents = new Map<string, OrderWaiter>();
  // Correlate negotiationId → orderId (OrderCreated carries order_id only).
  private negToOrder = new Map<string, string>();

  private constructor(client: AgentClient, opts: OrchestratorOptions) {
    this.client = client;
    this.log = opts.logger ?? console;
    this.now = opts.now ?? (() => new Date().toISOString());
    this.onProgress = opts.onProgress;
    this.hireTimeoutMs = opts.hireTimeoutMs ?? 120_000;
  }

  static async create(opts: OrchestratorOptions = {}): Promise<Orchestrator> {
    const cfg = capConfig();
    const client = new AgentClient(
      { baseURL: cfg.baseURL, wsURL: cfg.wsURL, rpcURL: cfg.rpcURL },
      requireEnv('CROO_SDK_KEY_ORCHESTRATOR')
    );
    const orch = new Orchestrator(client, opts);
    orch.stream = await client.connectWebSocket();
    orch.wireEvents();
    return orch;
  }

  private wireEvents(): void {
    // Pay as soon as the order exists on-chain.
    this.stream.on(EventType.OrderCreated, async (e: Event) => {
      const orderId = e.order_id;
      if (!orderId) return;
      const waiter = this.orderEvents.get(orderId);
      if (waiter) waiter.progress('order_created', { orderId, negotiationId: e.negotiation_id });
      try {
        this.emitById(orderId, 'paying');
        const pay = await this.client.payOrder(orderId);
        this.emitById(orderId, 'paid', { payTxHash: pay.txHash });
        waiter?.onPay(pay.txHash);
      } catch (err: any) {
        if (isInsufficientBalance(err)) {
          waiter?.reject(
            new InsufficientFundsError(
              'Orchestrator AA wallet has no USDC. Fund it on Base, then re-run.'
            )
          );
        } else {
          waiter?.reject(err);
        }
      }
    });

    // Deliverable is ready — pull it.
    this.stream.on(EventType.OrderCompleted, async (e: Event) => {
      const orderId = e.order_id;
      if (!orderId) return;
      const waiter = this.orderEvents.get(orderId);
      if (!waiter) return;
      try {
        waiter.progress('delivering', { orderId });
        const delivery = await this.client.getDelivery(orderId);
        waiter.onDelivery(delivery.deliverableText, delivery.contentHash);
      } catch (err: any) {
        waiter.reject(err);
      }
    });

    this.stream.on(EventType.OrderRejected, (e: Event) => {
      if (e.order_id) this.orderEvents.get(e.order_id)?.reject(new Error(`order rejected: ${e.reason ?? ''}`));
    });
    this.stream.on(EventType.OrderExpired, (e: Event) => {
      if (e.order_id) this.orderEvents.get(e.order_id)?.reject(new Error('order expired (SLA breach)'));
    });
  }

  /**
   * Hire one specialist end-to-end: negotiate → (auto) pay on OrderCreated →
   * collect delivery → derive reputation → return a fully-formed ReceiptEntry.
   */
  async hire(req: HireRequest): Promise<ReceiptEntry> {
    this.emit({ specialist: req.specialist, serviceId: req.serviceId, stage: 'negotiating' });

    const neg = await this.client.negotiateOrder({
      serviceId: req.serviceId,
      requirements: JSON.stringify(req.requirements),
    });

    // The order id isn't known until OrderCreated. Register a waiter keyed by
    // negotiation, promoted to orderId when OrderCreated correlates them.
    return await new Promise<ReceiptEntry>((resolve, reject) => {
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error(`hire(${req.specialist}) timed out after ${this.hireTimeoutMs}ms`));
      }, this.hireTimeoutMs);

      let orderId: string | undefined;
      let payTxHash: string | undefined;

      const waiter: OrderWaiter = {
        onPay: (tx) => {
          payTxHash = tx;
        },
        onDelivery: async (text, contentHash) => {
          try {
            const entry = await this.finalize(req, orderId!, payTxHash, text, contentHash);
            cleanup();
            resolve(entry);
          } catch (err) {
            cleanup();
            reject(err);
          }
        },
        reject: (err) => {
          cleanup();
          reject(err);
        },
        progress: (stage, extra) => this.emit({ specialist: req.specialist, serviceId: req.serviceId, stage, ...extra }),
      };

      // Bridge: OrderCreated carries order_id + negotiation_id but no service/
      // specialist. EventStream has no off(), so we register a filtered handler
      // that self-disables once it has bound this negotiation's order id, moving
      // the waiter under orderId where the class-level handlers will find it.
      let bound = false;
      this.stream.on(EventType.OrderCreated, (e: Event) => {
        if (bound) return;
        if (e.negotiation_id === neg.negotiationId && e.order_id) {
          bound = true;
          orderId = e.order_id;
          this.negToOrder.set(neg.negotiationId, orderId);
          this.orderEvents.set(orderId, waiter);
        }
      });

      const cleanup = () => {
        clearTimeout(timeout);
        if (orderId) this.orderEvents.delete(orderId);
      };

      this.emit({
        specialist: req.specialist,
        serviceId: req.serviceId,
        stage: 'negotiating',
        negotiationId: neg.negotiationId,
      });
    });
  }

  /** Build the receipt entry after a delivery arrives. */
  private async finalize(
    req: HireRequest,
    orderId: string,
    payTxHash: string | undefined,
    deliverableText: string,
    contentHash?: string
  ): Promise<ReceiptEntry> {
    const order = await this.client.getOrder(orderId);
    const result = parseSpecialistResult(req.specialist, deliverableText);
    const reputation = await this.deriveReputationFor(order.providerAgentId);

    const settlement: SettlementRecord = {
      serviceId: req.serviceId,
      providerAgentId: order.providerAgentId,
      negotiationId: order.negotiationId,
      orderId,
      priceBaseUnits: order.price,
      paymentToken: order.paymentToken,
      createTxHash: order.createTxHash,
      payTxHash: payTxHash ?? order.payTxHash,
      deliverTxHash: order.deliverTxHash,
      contentHash,
    };

    this.emit({
      specialist: req.specialist,
      serviceId: req.serviceId,
      stage: 'done',
      orderId,
      providerAgentId: order.providerAgentId,
      payTxHash: settlement.payTxHash,
    });

    return { specialist: req.specialist, providerAgentId: order.providerAgentId, result, settlement, reputation };
  }

  /** Derive a provider's reputation from its completed-order history. */
  async deriveReputationFor(providerAgentId: string): Promise<ReputationSignal> {
    try {
      const orders = await this.client.listOrders({
        agentId: providerAgentId,
        status: 'completed',
        pageSize: 50,
      });
      return deriveReputation(providerAgentId, orders.length);
    } catch {
      // If history isn't queryable, fall back to the neutral baseline.
      return deriveReputation(providerAgentId, 0);
    }
  }

  close(): void {
    this.stream.close();
  }

  private emit(p: HireProgress): void {
    this.onProgress?.(p);
    this.log.info(`[orchestrator] ${p.specialist} → ${p.stage}${p.orderId ? ` (order ${p.orderId})` : ''}`);
  }

  private emitById(orderId: string, stage: HireStage, extra?: Partial<HireProgress>): void {
    const waiter = this.orderEvents.get(orderId);
    // We may not know the specialist here; the waiter carries progress emission.
    waiter?.progress(stage, { orderId, ...extra });
  }
}

interface OrderWaiter {
  onPay: (txHash: string) => void;
  onDelivery: (deliverableText: string, contentHash?: string) => void;
  reject: (err: unknown) => void;
  progress: (stage: HireStage, extra?: Partial<HireProgress>) => void;
}

export class InsufficientFundsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InsufficientFundsError';
  }
}

function parseSpecialistResult(specialist: SpecialistId, text: string): SpecialistResult {
  try {
    const obj = JSON.parse(text) as SpecialistResult;
    if (obj && obj.specialist && Array.isArray(obj.findings)) return obj;
  } catch {
    /* fall through */
  }
  // Defensive fallback: wrap unparseable deliverables so the receipt still renders.
  return {
    specialist,
    subject: 'unknown',
    confidence: 0,
    findings: [],
    summary: `Unparseable deliverable: ${text.slice(0, 120)}`,
    proofHash: 'sha256:unverified',
  };
}
