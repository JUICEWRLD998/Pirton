import { makeAuditorHandler } from './handler';

/**
 * Offline self-test: runs the auditor handler directly (no CAP, no SDK key)
 * against a real Base address. Requires EXPLORER_API_KEY to fetch source;
 * without it the agent honestly reports the audit as unavailable.
 *
 *   npm run auditor:selftest -- 0x<address>
 */
async function main() {
  // Default: canonical USDC on Base (verified source, no rug patterns expected).
  const address = process.argv[2] ?? '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
  console.log(`[selftest] auditor on ${address}\n`);

  const handler = makeAuditorHandler();
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
