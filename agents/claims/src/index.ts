import { startProvider } from '@pirton/agent-core';
import { SDK_KEY_ENV } from '@pirton/shared';
import { makeClaimsHandler } from './handler';

/**
 * Claims / Misinformation CAP provider entrypoint. Connects with its own SDK
 * key, auto-accepts negotiations, and on payment scans the offer text for scam
 * red-flags, delivering cited findings.
 *
 *   npm run claims:serve
 */
async function main() {
  const provider = await startProvider({
    specialist: 'claims',
    sdkKeyEnv: SDK_KEY_ENV.claims,
    handler: makeClaimsHandler(),
  });

  console.log('[claims] provider running. Ctrl-C to stop.');

  const shutdown = () => {
    console.log('\n[claims] shutting down…');
    provider.close();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('[claims] fatal:', err?.message ?? err);
  process.exit(1);
});
