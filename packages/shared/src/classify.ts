import { ethers } from 'ethers';
import { chat, llmAvailable, parseJsonLoose } from './llm';
import { InputKind, SpecialistId } from './types';

export interface Classification {
  kind: InputKind;
  /** EVM address if the input is (or contains) one. */
  address?: string;
  /** Which specialists to hire — cost-aware, only the relevant ones. */
  hire: SpecialistId[];
  reason: string;
}

const EVM_ADDRESS_RE = /0x[a-fA-F0-9]{40}/;
const URL_RE = /\bhttps?:\/\/[^\s]+|\b[a-z0-9-]+\.(?:com|io|xyz|net|org|finance|app|co)\b/i;

/**
 * Classify pasted input and decide which specialists to hire. Deterministic
 * rules first (addresses/urls are unambiguous); the LLM only refines the fuzzy
 * text cases. Phase 1 only actually hires forensics, but the routing is written
 * to the full plan so Phase 2 just flips agents on.
 */
export async function classifyInput(raw: string): Promise<Classification> {
  const text = raw.trim();
  const addrMatch = text.match(EVM_ADDRESS_RE);
  const looksLikeBareAddress = addrMatch && text.replace(EVM_ADDRESS_RE, '').trim().length === 0;

  if (looksLikeBareAddress && ethers.isAddress(addrMatch![0])) {
    return {
      kind: 'token_or_contract',
      address: ethers.getAddress(addrMatch![0]),
      hire: ['forensics', 'auditor'],
      reason: 'Input is a bare EVM address → on-chain forensics + source audit.',
    };
  }

  // Heuristic fallback (used when LLM is unavailable).
  const heuristic = heuristicClassify(text, addrMatch?.[0]);
  if (!llmAvailable()) return heuristic;

  const prompt = [
    `Classify a suspicious item a user pasted into a scam checker. Return JSON only:`,
    `{"kind": one of ["token_or_contract","offer_text","job_or_rental","url","unknown"],`,
    ` "address": "0x... if any, else empty",`,
    ` "hire": subset of ["forensics","auditor","reputation","claims"],`,
    ` "reason": "one short sentence"}`,
    ``,
    `Rules: forensics+auditor need an on-chain address. reputation fits urls/domains/offers.`,
    `claims fits any persuasive offer/job/rental text. Only hire what is relevant (cost-aware).`,
    ``,
    `ITEM:`,
    text.slice(0, 2000),
  ].join('\n');

  const out = await chat(prompt, { tier: 'fast', json: true, temperature: 0 });
  const parsed = parseJsonLoose<Partial<Classification>>(out);
  if (!parsed || !parsed.kind || !Array.isArray(parsed.hire) || parsed.hire.length === 0) {
    return heuristic;
  }

  let address = parsed.address && ethers.isAddress(parsed.address)
    ? ethers.getAddress(parsed.address)
    : addrMatch && ethers.isAddress(addrMatch[0])
      ? ethers.getAddress(addrMatch[0])
      : undefined;

  // Guard: never hire on-chain specialists without an address.
  let hire = parsed.hire.filter((h): h is SpecialistId =>
    ['forensics', 'auditor', 'reputation', 'claims'].includes(h as string)
  );
  if (!address) hire = hire.filter((h) => h !== 'forensics' && h !== 'auditor');
  if (hire.length === 0) hire = heuristic.hire;

  return {
    kind: parsed.kind as InputKind,
    address,
    hire,
    reason: parsed.reason ?? heuristic.reason,
  };
}

function heuristicClassify(text: string, addr?: string): Classification {
  const hasAddr = addr && ethers.isAddress(addr);
  if (hasAddr) {
    return {
      kind: 'token_or_contract',
      address: ethers.getAddress(addr!),
      hire: ['forensics', 'auditor'],
      reason: 'Contains an EVM address → forensics + audit.',
    };
  }
  if (URL_RE.test(text)) {
    return {
      kind: 'url',
      hire: ['reputation', 'claims'],
      reason: 'Contains a link/domain → reputation + claims.',
    };
  }
  const jobish = /\b(salary|remote|hiring|position|rent|deposit|apartment|landlord)\b/i.test(text);
  return {
    kind: jobish ? 'job_or_rental' : 'offer_text',
    hire: jobish ? ['claims', 'reputation'] : ['claims'],
    reason: jobish
      ? 'Reads like a job/rental post → claims + reputation.'
      : 'Free text offer → claims heuristics.',
  };
}
