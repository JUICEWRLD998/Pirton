import { optionalEnv } from '@pirton/shared';

/**
 * Minimal Base block-explorer client (Etherscan v2 unified endpoint, chainid
 * 8453 = Base mainnet). Used only for facts the RPC can't cheaply give us —
 * source-verification status. Returns null when no key is configured so the
 * forensics handler degrades to pure on-chain checks instead of failing.
 */
const ETHERSCAN_V2 = 'https://api.etherscan.io/v2/api';
const BASE_CHAIN_ID = 8453;

export interface SourceInfo {
  verified: boolean;
  contractName?: string;
  /** Verified Solidity source (flattened), if available. */
  source?: string;
  /** Proxy + implementation, when the explorer resolves them. */
  proxy?: boolean;
  implementation?: string;
}

export function explorerAvailable(): boolean {
  return optionalEnv('EXPLORER_API_KEY') !== '';
}

/** Fetch verified-source info for an address, or null if unavailable/unkeyed. */
export async function getSourceInfo(address: string): Promise<SourceInfo | null> {
  const apiKey = optionalEnv('EXPLORER_API_KEY');
  if (!apiKey) return null;

  const url =
    `${ETHERSCAN_V2}?chainid=${BASE_CHAIN_ID}&module=contract&action=getsourcecode` +
    `&address=${address}&apikey=${apiKey}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data: any = await res.json();
    // status "1" = OK; result is an array with one entry.
    const row = Array.isArray(data?.result) ? data.result[0] : undefined;
    if (!row) return null;

    const source: string = row.SourceCode ?? '';
    const verified = source.trim().length > 0;
    return {
      verified,
      contractName: row.ContractName || undefined,
      source: verified ? source : undefined,
      proxy: row.Proxy === '1',
      implementation: row.Implementation || undefined,
    };
  } catch {
    return null;
  }
}
