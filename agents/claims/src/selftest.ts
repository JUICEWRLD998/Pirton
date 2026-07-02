import { makeClaimsHandler } from './handler';

/**
 * Offline self-test: runs the claims handler directly (no CAP, no SDK key, no
 * external services — fully offline heuristics). Pass offer text as argv, or a
 * built-in scammy sample is used.
 *
 *   npm run claims:selftest -- "Guaranteed 10x returns! Connect your wallet now to claim."
 */
async function main() {
  const text =
    process.argv.slice(2).join(' ').trim() ||
    'URGENT: Guaranteed 100% risk-free returns! Only 3 spots left — connect your wallet now to claim your airdrop. DM me on Telegram.';
  console.log(`[selftest] claims on:\n   "${text}"\n`);

  const handler = makeClaimsHandler();
  const t0 = Date.now();
  const result = await handler({ raw: text, subject: text });
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
