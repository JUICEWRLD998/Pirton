import { startProvider } from '@pirton/agent-core';
import { SDK_KEY_ENV } from '@pirton/shared';
import { makeAuditorHandler } from './handler';

/**
 * Contract Auditor CAP provider entrypoint. Connects with its own SDK key,
 * auto-accepts negotiations, and on payment fetches verified source and reasons
 * over it for rug patterns, delivering cited findings.
 *
 *   npm run auditor:serve
 */
async function main() {
  const provider = await startProvider({
    specialist: 'auditor',
    sdkKeyEnv: SDK_KEY_ENV.auditor,
    handler: makeAuditorHandler(),
  });

  console.log('[auditor] provider running. Ctrl-C to stop.');

  const shutdown = () => {
    console.log('\n[auditor] shutting down…');
    provider.close();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('[auditor] fatal:', err?.message ?? err);
  process.exit(1);
});
