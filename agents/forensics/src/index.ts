import { startProvider } from '@pirton/agent-core';
import { SDK_KEY_ENV } from '@pirton/shared';
import { makeForensicsHandler } from './handler';

/**
 * Forensics CAP provider entrypoint. Connects with its own SDK key, auto-accepts
 * negotiations, and on payment runs real on-chain checks and delivers findings.
 *
 *   npm run forensics:serve
 */
async function main() {
  const provider = await startProvider({
    specialist: 'forensics',
    sdkKeyEnv: SDK_KEY_ENV.forensics,
    handler: makeForensicsHandler(),
  });

  console.log('[forensics] provider running. Ctrl-C to stop.');

  const shutdown = () => {
    console.log('\n[forensics] shutting down…');
    provider.close();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('[forensics] fatal:', err?.message ?? err);
  process.exit(1);
});
