import { makeReputationHandler } from './handler';

/**
 * Offline self-test: runs the reputation handler directly (no CAP, no SDK key).
 * Requires WEB_SEARCH_API_KEY to actually search; without it the agent honestly
 * reports the web check as skipped. Pass a domain / address / offer text.
 *
 *   npm run reputation:selftest -- "some-suspicious-domain.xyz"
 */
async function main() {
  const subject = process.argv.slice(2).join(' ').trim() || 'free-crypto-airdrop-claim.xyz';
  console.log(`[selftest] reputation on: ${subject}\n`);

  const handler = makeReputationHandler();
  const t0 = Date.now();
  const result = await handler({ raw: subject, subject });
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
