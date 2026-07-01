import { ReputationSignal } from './types';

/**
 * Derive a transparent reputation weight from observable job history, because
 * the CROO SDK v0.2.0 exposes no reputation score (verified in Phase 0).
 *
 * We count a provider's completed orders and map them onto a bounded weight in
 * [0.5, 1.5] via a saturating curve. A brand-new agent starts slightly below
 * neutral (0.9) rather than at zero, so it is never fully discounted — we label
 * exactly how the number was produced on the receipt (honesty over theater).
 */
export function deriveReputation(
  providerAgentId: string,
  completedOrders: number
): ReputationSignal {
  const n = Math.max(0, completedOrders);
  // saturating: 0 -> 0.9, ~5 -> ~1.15, ~20 -> ~1.4, asymptote 1.5
  const weight = round2(0.9 + 0.6 * (1 - Math.exp(-n / 8)));
  const basis =
    n === 0
      ? 'No completed CAP orders yet — neutral-minus baseline (0.9).'
      : `Derived from ${n} completed CAP order(s) via listOrders(status=completed).`;
  return {
    providerAgentId,
    completedOrders: n,
    weight,
    basis,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
