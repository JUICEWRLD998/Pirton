import {
  Finding,
  ReputationSignal,
  SEVERITY_WEIGHT,
  SpecialistResult,
  Verdict,
} from './types';

/**
 * Reputation-weighted risk fusion. Deterministic, in code (NOT the LLM) — the
 * numbers on the Trust Receipt must be auditable.
 *
 * Approach: each specialist contributes a per-specialist risk (0..100) derived
 * from its worst findings, scaled by its own confidence and by the provider's
 * derived reputation weight. We combine specialists with a "noisy-OR"-style
 * aggregation so multiple independent red flags escalate risk rather than
 * averaging each other away.
 */

export interface SpecialistContribution {
  specialist: string;
  /** 0..100 risk this specialist argues for. */
  risk: number;
  /** reputation weight applied. */
  weight: number;
  confidence: number;
}

/** Risk implied by a single specialist's findings (0..100). */
export function specialistRisk(result: SpecialistResult): number {
  if (result.findings.length === 0) return 0;
  // Worst finding dominates; additional serious findings add a diminishing bump.
  const weights = result.findings
    .map((f: Finding) => SEVERITY_WEIGHT[f.severity])
    .sort((a, b) => b - a);
  const top = weights[0];
  let extra = 0;
  for (let i = 1; i < weights.length; i++) {
    // each subsequent finding contributes at 30% of its own weight, decaying.
    extra += weights[i] * 0.3 * Math.pow(0.7, i - 1);
  }
  return clamp(top + extra, 0, 100);
}

export interface FusionInput {
  result: SpecialistResult;
  reputation: ReputationSignal;
}

export interface FusionOutput {
  riskScore: number;
  verdict: Verdict;
  contributions: SpecialistContribution[];
}

export function fuseRisk(inputs: FusionInput[]): FusionOutput {
  const contributions: SpecialistContribution[] = inputs.map(({ result, reputation }) => {
    const raw = specialistRisk(result);
    // Confidence scales how much we trust the raw risk.
    const conf = clamp(result.confidence, 0, 1);
    return {
      specialist: result.specialist,
      risk: raw,
      weight: reputation.weight,
      confidence: conf,
    };
  });

  // Noisy-OR over weighted per-specialist "probabilities of scam".
  // p_i = (risk/100) * confidence, nudged by reputation weight (capped at 1).
  let survivalProduct = 1; // P(none flag it)
  let weightSum = 0;
  for (const c of contributions) {
    const p = clamp((c.risk / 100) * c.confidence * relWeight(c.weight), 0, 0.99);
    survivalProduct *= 1 - p;
    weightSum += c.weight;
  }
  const combined = 1 - survivalProduct; // P(at least one real flag)
  const riskScore = Math.round(clamp(combined * 100, 0, 100));

  return {
    riskScore,
    verdict: toVerdict(riskScore),
    contributions,
  };
}

/** Map reputation weight [0.5,1.5] to a multiplier around 1 that never zeroes a signal. */
function relWeight(w: number): number {
  return clamp(0.7 + (w - 0.5) * 0.6, 0.7, 1.3);
}

export function toVerdict(risk: number): Verdict {
  if (risk >= 70) return 'likely_scam';
  if (risk >= 35) return 'caution';
  return 'safe';
}

export function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}
