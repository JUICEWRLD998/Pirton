import { createHash } from 'crypto';

/**
 * Canonical JSON stringify: keys sorted recursively so the same logical object
 * always hashes identically regardless of insertion order. Used for proof and
 * receipt hashes so they are reproducible and verifiable.
 */
export function canonicalize(value: unknown): string {
  return JSON.stringify(sortDeep(value));
}

function sortDeep(v: any): any {
  if (Array.isArray(v)) return v.map(sortDeep);
  if (v && typeof v === 'object') {
    return Object.keys(v)
      .sort()
      .reduce<Record<string, any>>((acc, k) => {
        acc[k] = sortDeep(v[k]);
        return acc;
      }, {});
  }
  return v;
}

export function sha256Hex(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

/** sha256 over the canonical form of an object, prefixed for clarity. */
export function proofHashOf(value: unknown): string {
  return 'sha256:' + sha256Hex(canonicalize(value));
}
