import { startProvider } from '@pirton/agent-core';
import { SDK_KEY_ENV } from '@pirton/shared';
import { makeReputationHandler } from './handler';

/**
 * Reputation / Web-signal CAP provider entrypoint. Connects with its own SDK
 * key, auto-accepts negotiations, and on payment searches the web for scam
 * reports about the subject, delivering cited findings.
 *
 *   npm run reputation:serve
 */
async function main() {
  const provider = await startProvider({
    specialist: 'reputation',
    sdkKeyEnv: SDK_KEY_ENV.reputation,
    handler: makeReputationHandler(),
  });

  console.log('[reputation] provider running. Ctrl-C to stop.');

  const shutdown = () => {
    console.log('\n[reputation] shutting down…');
    provider.close();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('[reputation] fatal:', err?.message ?? err);
  process.exit(1);
});
