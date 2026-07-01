import { Orchestrator, InsufficientFundsError, type HireProgress } from '@pirton/agent-core';
import {
  buildTrustReceipt,
  classifyInput,
  formatUsdc,
  optionalEnv,
  SERVICE_ID_ENV,
  txUrl,
  verdictLabel,
  type ReceiptEntry,
} from '@pirton/shared';

/**
 * Pirton orchestrator entrypoint (CAP requester). One run:
 *   classify the pasted item → hire the relevant specialists that have a
 *   configured service id → pay each (real USDC escrow) → collect deliveries →
 *   fuse a reputation-weighted verdict → print the signed Trust Receipt.
 *
 *   npm run orchestrate -- "0x<token>"   (or any pasted text)
 */
async function main() {
  const raw = process.argv.slice(2).join(' ').trim();
  if (!raw) {
    console.error('Usage: npm run orchestrate -- "<address or suspicious text>"');
    process.exit(1);
  }

  console.log(`\n🛡  Pirton — analyzing:\n   ${truncate(raw, 100)}\n`);

  // 1) Classify + route (cost-aware: only relevant specialists).
  const classification = await classifyInput(raw);
  console.log(`▸ classified as: ${classification.kind}`);
  console.log(`▸ routing:       ${classification.reason}`);
  console.log(`▸ wants to hire: ${classification.hire.join(', ')}`);

  // 2) Keep only specialists that actually have a configured service id.
  const routed = classification.hire
    .map((s) => ({ specialist: s, serviceId: optionalEnv(SERVICE_ID_ENV[s]) }))
    .filter((r) => r.serviceId !== '');

  if (routed.length === 0) {
    console.error(
      `\n✗ None of the routed specialists (${classification.hire.join(', ')}) have a ` +
        `CROO_SERVICE_ID_* set in .env. Register the service(s) on agent.croo.network ` +
        `and fill in the service id(s). See .env.example.`
    );
    process.exit(2);
  }
  const skipped = classification.hire.filter((s) => !routed.some((r) => r.specialist === s));
  if (skipped.length) console.log(`▸ skipped (no service id yet): ${skipped.join(', ')}`);

  // 3) Requirements payload each specialist receives.
  const requirements = {
    subject: classification.address ?? raw,
    address: classification.address,
    kind: classification.kind,
    raw,
  };

  // 4) Hire (parallel) with live progress logging.
  const orch = await Orchestrator.create({ onProgress: logProgress });

  const entries: ReceiptEntry[] = [];
  try {
    const settled = await Promise.allSettled(
      routed.map((r) =>
        orch.hire({ specialist: r.specialist, serviceId: r.serviceId, requirements })
      )
    );

    for (let i = 0; i < settled.length; i++) {
      const s = settled[i];
      if (s.status === 'fulfilled') {
        entries.push(s.value);
      } else {
        const err = s.reason;
        if (err instanceof InsufficientFundsError) {
          console.error(`\n✗ ${err.message}`);
        }
        console.error(`✗ hire(${routed[i].specialist}) failed: ${err?.message ?? err}`);
      }
    }
  } finally {
    orch.close();
  }

  if (entries.length === 0) {
    console.error('\n✗ No specialists delivered — cannot build a Trust Receipt.');
    process.exit(3);
  }

  // 5) Fuse + build the signed Trust Receipt.
  const receipt = await buildTrustReceipt({
    subject: classification.address ?? truncate(raw, 80),
    inputKind: classification.kind,
    entries,
    createdAt: new Date().toISOString(),
    signerPrivateKey: optionalEnv('RECEIPT_SIGNER_KEY') || undefined,
  });

  printReceipt(receipt);
}

function logProgress(p: HireProgress): void {
  const tx = p.payTxHash ? ` ${txUrl(p.payTxHash)}` : '';
  console.log(`   · ${p.specialist.padEnd(10)} ${p.stage}${tx}`);
}

function printReceipt(r: Awaited<ReturnType<typeof buildTrustReceipt>>): void {
  const bar = '─'.repeat(60);
  console.log(`\n${bar}`);
  console.log(`  TRUST RECEIPT — ${verdictLabel(r.verdict)}  (risk ${r.riskScore}/100)`);
  console.log(bar);
  console.log(`  subject:   ${r.subject}`);
  console.log(`  input:     ${r.inputKind}`);
  console.log(`  ${r.explanation}`);
  console.log(`\n  agents hired: ${r.entries.length}   total paid: ${formatUsdc(r.totalPaidBaseUnits)} USDC`);
  for (const e of r.entries) {
    console.log(`\n  ▸ ${e.specialist}  (rep ${e.reputation.weight}, ${e.reputation.completedOrders} completed)`);
    console.log(`    findings: ${e.result.findings.length}, confidence ${e.result.confidence}`);
    for (const f of e.result.findings) {
      console.log(`      [${f.severity}] ${f.title}`);
    }
    console.log(`    paid ${formatUsdc(e.settlement.priceBaseUnits)} USDC · pay tx ${txUrl(e.settlement.payTxHash) ?? '—'}`);
    console.log(`    proof ${e.result.proofHash}`);
  }
  console.log(`\n  receiptHash: ${r.receiptHash}`);
  if (r.signature) console.log(`  signed by:   ${r.signature.signer}`);
  console.log(bar + '\n');
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n) + '…';
}

main().catch((err) => {
  console.error('[orchestrator] fatal:', err?.message ?? err);
  process.exit(1);
});
