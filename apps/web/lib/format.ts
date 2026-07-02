/** USDC display + explorer link helpers (Base). Mirrors packages/shared/format. */

export const USDC_DECIMALS = 6;

export function formatUsdc(baseUnits: string | bigint): string {
  const n = typeof baseUnits === "bigint" ? baseUnits : BigInt(baseUnits || "0");
  const whole = n / 1_000_000n;
  const frac = (n % 1_000_000n).toString().padStart(6, "0").replace(/0+$/, "");
  return frac ? `${whole}.${frac}` : `${whole}`;
}

/** USDC as a float, for count-up animation. */
export function usdcFloat(baseUnits?: string): number {
  if (!baseUnits) return 0;
  return Number(BigInt(baseUnits)) / 1_000_000;
}

export function txUrl(hash?: string): string | undefined {
  return hash ? `https://basescan.org/tx/${hash}` : undefined;
}

export function addressUrl(addr?: string): string | undefined {
  return addr ? `https://basescan.org/address/${addr}` : undefined;
}

export function shortHash(h?: string, lead = 10, tail = 8): string {
  if (!h) return "";
  return h.length <= lead + tail ? h : `${h.slice(0, lead)}…${h.slice(-tail)}`;
}

export function shortAddr(a?: string): string {
  if (!a) return "";
  return a.length <= 12 ? a : `${a.slice(0, 6)}…${a.slice(-4)}`;
}
