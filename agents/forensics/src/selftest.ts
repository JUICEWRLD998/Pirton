import { makeForensicsHandler } from './handler';

/**
 * Offline self-test: runs the forensics handler directly (no CAP, no SDK key)
 * against a real Base address so we can confirm the on-chain checks work using
 * only the public RPC. Pass an address as argv, or it defaults to USDC on Base.
 *
 *   npm run forensics:selftest -- 0x<address>
 */
async function main() {
  // Default: canonical USDC on Base (a known-good, verified, safe token).
  const address = process.argv[2] ?? '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
  console.log(`[selftest] forensics on ${address}\n`);

  const handler = makeForensicsHandler();
  const t0 = Date.now();
  const result = await handler({ raw: address, subject: address });
  const ms = Date.now() - t0;

  console.log(`subject:    ${result.subject}`);
  console.log(`confidence: ${result.confidence}`);
  console.log(`summary:    ${result.summary}`);
  console.log(`findings (${result.findings.length}):`);
  for (const f of result.findings) {
    console.log(`  [${f.severity.toUpperCase()}] ${f.code} — ${f.title}`);
    console.log(`      ${f.detail}`);
    for (const c of f.citations) console.log(`      · ${c.label}: ${c.ref}`);
  }
  console.log(`\n[selftest] done in ${ms}ms`);
}

main().catch((err) => {
  console.error('[selftest] failed:', err?.message ?? err);
  process.exit(1);
});
