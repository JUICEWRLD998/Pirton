import 'dotenv/config';

/** Read a required env var or throw a clear error naming it. */
export function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v || v.trim() === '' || v.endsWith('...')) {
    throw new Error(`Missing required env var: ${name} (set it in .env — see .env.example)`);
  }
  return v.trim();
}

export function optionalEnv(name: string, fallback = ''): string {
  const v = process.env[name];
  return v && v.trim() !== '' ? v.trim() : fallback;
}

/** Shared CAP connection config (per-agent SDK key passed separately). */
export function capConfig() {
  return {
    baseURL: requireEnv('CROO_API_URL'),
    wsURL: requireEnv('CROO_WS_URL'),
    rpcURL: optionalEnv('BASE_RPC_URL', 'https://mainnet.base.org'),
  };
}

/** The five agents' SDK keys, keyed by role. */
export const SDK_KEY_ENV = {
  orchestrator: 'CROO_SDK_KEY_ORCHESTRATOR',
  forensics: 'CROO_SDK_KEY_FORENSICS',
  auditor: 'CROO_SDK_KEY_AUDITOR',
  reputation: 'CROO_SDK_KEY_REPUTATION',
  claims: 'CROO_SDK_KEY_CLAIMS',
} as const;

/** Provider service IDs the orchestrator negotiates against. */
export const SERVICE_ID_ENV = {
  forensics: 'CROO_SERVICE_ID_FORENSICS',
  auditor: 'CROO_SERVICE_ID_AUDITOR',
  reputation: 'CROO_SERVICE_ID_REPUTATION',
  claims: 'CROO_SERVICE_ID_CLAIMS',
} as const;
