import { ethers } from 'ethers';
import { addressUrl, type Citation, type Finding } from '@pirton/shared';
import { getSourceInfo, explorerAvailable } from './explorer';

/**
 * Deterministic on-chain forensics. Every finding here is derived from real
 * chain/explorer data (RPC eth_getCode/eth_call + optional block-explorer),
 * never from an LLM — the Trust Receipt's facts must be auditable (plan §2.5).
 *
 * Techniques used, all keyless except source verification:
 *  - contract existence (eth_getCode)
 *  - ERC-20 identity via eth_call (name/symbol/decimals/totalSupply)
 *  - ownership renounce check via owner()/getOwner()
 *  - dangerous-capability detection by scanning runtime bytecode for the
 *    4-byte selectors of mint/pause/blacklist/fee-setter functions (the
 *    dispatcher embeds PUSH4 <selector> for every external function)
 *  - source-verification status (explorer, when EXPLORER_API_KEY is set)
 */

const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function owner() view returns (address)',
  'function getOwner() view returns (address)',
];

/** Capability selectors we treat as rug/honeypot levers if present in bytecode. */
const CAPABILITY_SIGNATURES: Array<{
  code: string;
  title: string;
  severity: Finding['severity'];
  detail: string;
  sigs: string[];
}> = [
  {
    code: 'mint_authority',
    title: 'Token can mint new supply',
    severity: 'high',
    detail:
      'The contract exposes a mint function, so its owner can inflate supply and dilute holders — a common rug lever.',
    sigs: ['mint(address,uint256)', 'mint(uint256)', 'mint(address)'],
  },
  {
    code: 'pausable_transfers',
    title: 'Transfers can be paused',
    severity: 'high',
    detail:
      'A pause function lets the owner freeze all transfers, which can trap buyers (a classic honeypot mechanism).',
    sigs: ['pause()', 'setPaused(bool)', 'setTradingEnabled(bool)', 'enableTrading()'],
  },
  {
    code: 'blacklist_capability',
    title: 'Addresses can be blacklisted',
    severity: 'high',
    detail:
      'The contract can blacklist wallets, letting the owner block specific holders from selling.',
    sigs: [
      'blacklist(address)',
      'addBlackList(address)',
      'setBlacklist(address,bool)',
      'setBlackList(address,bool)',
      'setBots(address,bool)',
      'setBot(address,bool)',
    ],
  },
  {
    code: 'mutable_fees',
    title: 'Trading fees are owner-adjustable',
    severity: 'medium',
    detail:
      'Fee/tax setters let the owner raise sell taxes after launch, sometimes to 100% (a soft honeypot).',
    sigs: [
      'setFee(uint256)',
      'setFees(uint256,uint256)',
      'setTaxFee(uint256)',
      'setSellFee(uint256)',
      'setBuyFee(uint256)',
    ],
  },
];

export interface ForensicsData {
  address: string;
  isContract: boolean;
  token?: { name?: string; symbol?: string; decimals?: number; totalSupply?: string };
  ownerAddress?: string;
  ownershipRenounced?: boolean;
  verified?: boolean;
  findings: Finding[];
  /** 0..1 — how much of the intended check set actually ran. */
  confidence: number;
}

const ZERO = '0x0000000000000000000000000000000000000000';

function cite(label: string, ref: string): Citation {
  return { label, ref };
}

/** Run the full forensics sweep against a single address. */
export async function runForensics(
  address: string,
  provider: ethers.JsonRpcProvider
): Promise<ForensicsData> {
  const addr = ethers.getAddress(address);
  const findings: Finding[] = [];
  const explorerCite = cite('BaseScan', addressUrl(addr)!);

  // 1) Contract vs EOA.
  const code = await provider.getCode(addr);
  const isContract = code !== '0x' && code.length > 2;
  const data: ForensicsData = { address: addr, isContract, findings, confidence: 0.9 };

  if (!isContract) {
    findings.push({
      code: 'not_a_contract',
      title: 'Address is not a smart contract',
      severity: 'medium',
      detail:
        'There is no contract code at this address — it is a wallet (EOA), not a token/contract. If you were told this is a token, that is a red flag.',
      citations: [explorerCite],
    });
    return data; // nothing else to check on an EOA
  }

  // 2) ERC-20 identity (best-effort; not every contract is a token).
  const c = new ethers.Contract(addr, ERC20_ABI, provider);
  const token: NonNullable<ForensicsData['token']> = {};
  token.name = await safeCall<string>(() => c.name());
  token.symbol = await safeCall<string>(() => c.symbol());
  const dec = await safeCall<bigint>(() => c.decimals());
  if (dec !== undefined) token.decimals = Number(dec);
  const supply = await safeCall<bigint>(() => c.totalSupply());
  if (supply !== undefined) token.totalSupply = supply.toString();
  if (token.name || token.symbol || token.totalSupply) data.token = token;

  // 3) Ownership renounce check.
  const owner =
    (await safeCall<string>(() => c.owner())) ??
    (await safeCall<string>(() => c.getOwner()));
  if (owner !== undefined) {
    const renounced = owner.toLowerCase() === ZERO;
    data.ownerAddress = owner;
    data.ownershipRenounced = renounced;
    if (renounced) {
      findings.push({
        code: 'ownership_renounced',
        title: 'Ownership is renounced',
        severity: 'info',
        detail: 'The owner is the zero address, so owner-only rug levers cannot be used. This is a positive signal.',
        citations: [explorerCite],
      });
    } else {
      findings.push({
        code: 'ownership_not_renounced',
        title: 'Ownership is not renounced',
        severity: 'medium',
        detail: `A single owner (${owner}) still controls this contract and can call any owner-only functions.`,
        citations: [cite('Owner address', addressUrl(owner)!)],
      });
    }
  }

  // 4) Dangerous capabilities via bytecode selector scan.
  const bytecode = code.toLowerCase();
  for (const cap of CAPABILITY_SIGNATURES) {
    const hit = cap.sigs.find((sig) => bytecode.includes(selector(sig)));
    if (hit) {
      findings.push({
        code: cap.code,
        title: cap.title,
        severity: cap.severity,
        detail: `${cap.detail} (detected function: ${hit})`,
        citations: [explorerCite],
      });
    }
  }

  // 5) Source verification status (explorer, optional).
  if (explorerAvailable()) {
    const src = await getSourceInfo(addr);
    if (src) {
      data.verified = src.verified;
      if (!src.verified) {
        findings.push({
          code: 'unverified_source',
          title: 'Contract source is not verified',
          severity: 'medium',
          detail:
            'The contract has no verified source code on the explorer, so its behavior cannot be independently audited.',
          citations: [cite('BaseScan code', `${addressUrl(addr)}#code`)],
        });
      } else if (src.proxy) {
        findings.push({
          code: 'upgradeable_proxy',
          title: 'Upgradeable proxy contract',
          severity: 'medium',
          detail: `Logic lives behind a proxy (implementation ${src.implementation ?? 'unknown'}) and can be swapped by the admin, changing behavior after you buy.`,
          citations: [cite('BaseScan code', `${addressUrl(addr)}#code`)],
        });
      }
    }
  } else {
    data.confidence = 0.75; // source check skipped
  }

  return data;
}

/** ethers.id gives keccak256 of the signature; first 4 bytes = selector. */
function selector(signature: string): string {
  return ethers.id(signature).slice(2, 10);
}

async function safeCall<T>(fn: () => Promise<T>): Promise<T | undefined> {
  try {
    return await fn();
  } catch {
    return undefined;
  }
}
