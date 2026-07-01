import { AgentClient } from '@croo-network/sdk';
import { capConfig, optionalEnv, SDK_KEY_ENV } from '@pirton/shared';

/**
 * Connectivity smoke test: for every configured agent SDK key, open a WebSocket
 * and immediately close it. Confirms the key is valid and the CAP gateway is
 * reachable before any real order flow. Keys left as placeholders are skipped.
 *
 *   npm run smoke:keys
 */
async function main() {
  const cfg = capConfig();
  let ok = 0;
  let skipped = 0;
  let failed = 0;

  for (const [role, envName] of Object.entries(SDK_KEY_ENV)) {
    const key = optionalEnv(envName);
    if (!key || key.endsWith('...')) {
      console.log(`  ○ ${role.padEnd(12)} — skipped (no key in ${envName})`);
      skipped++;
      continue;
    }
    try {
      const client = new AgentClient({ baseURL: cfg.baseURL, wsURL: cfg.wsURL, rpcURL: cfg.rpcURL }, key);
      const stream = await client.connectWebSocket();
      stream.close();
      console.log(`  ✓ ${role.padEnd(12)} — connected`);
      ok++;
    } catch (err: any) {
      console.log(`  ✗ ${role.padEnd(12)} — ${err?.message ?? err}`);
      failed++;
    }
  }

  console.log(`\nsmoke: ${ok} ok, ${skipped} skipped, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('[smoke] fatal:', err?.message ?? err);
  process.exit(1);
});
