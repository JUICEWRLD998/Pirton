import { optionalEnv } from '@pirton/shared';

/**
 * Verified-source fetch for the Contract Auditor (Etherscan v2 unified endpoint,
 * chainid 8453 = Base mainnet). The auditor reasons over *source*, so unlike the
 * forensics bytecode scan it needs the flattened Solidity. Returns null when no
 * key is configured or the source isn't verified, so the handler degrades to an
 * honest "cannot audit" finding instead of failing.
 */
const ETHERSCAN_V2 = 'https://api.etherscan.io/v2/api';
const BASE_CHAIN_ID = 8453;

export interface VerifiedSource {
  contractName?: string;
  /** Flattened Solidity source. */
  source: string;
  compilerVersion?: string;
  /** Proxy + implementation, when the explorer resolves them. */
  proxy: boolean;
  implementation?: string;
}

export function explorerAvailable(): boolean {
  return optionalEnv('EXPLORER_API_KEY') !== '';
}

/**
 * Fetch verified Solidity source for an address. Returns null when the key is
 * missing, the request fails, or the contract source is unverified.
 */
export async function getVerifiedSource(address: string): Promise<VerifiedSource | null> {
  const apiKey = optionalEnv('EXPLORER_API_KEY');
  if (!apiKey) return null;

  const url =
    `${ETHERSCAN_V2}?chainid=${BASE_CHAIN_ID}&module=contract&action=getsourcecode` +
    `&address=${address}&apikey=${apiKey}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data: any = await res.json();
    const row = Array.isArray(data?.result) ? data.result[0] : undefined;
    if (!row) return null;

    // Etherscan may wrap multi-file sources in {{ ... }} JSON; keep the raw
    // string either way — the auditor reads it as text.
    const source: string = (row.SourceCode ?? '').trim();
    if (source.length === 0) return null; // unverified

    return {
      contractName: row.ContractName || undefined,
      source,
      compilerVersion: row.CompilerVersion || undefined,
      proxy: row.Proxy === '1',
      implementation: row.Implementation && row.Implementation !== '' ? row.Implementation : undefined,
    };
  } catch {
    return null;
  }
}
