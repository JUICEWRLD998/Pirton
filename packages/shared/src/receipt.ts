import { ethers } from 'ethers';
import { canonicalize, sha256Hex } from './hash';
import { fuseRisk } from './fusion';
import { chat, llmAvailable } from './llm';
import {
  InputKind,
  ReceiptEntry,
  TrustReceipt,
  Verdict,
} from './types';

const VERDICT_LABEL: Record<Verdict, string> = {
  safe: 'Safe',
  caution: 'Caution',
  likely_scam: 'Likely Scam',
};

export function verdictLabel(v: Verdict): string {
  return VERDICT_LABEL[v];
}

export interface BuildReceiptArgs {
  subject: string;
  inputKind: InputKind;
  entries: ReceiptEntry[];
  createdAt: string; // ISO — injected (no Date.now in deterministic code paths)
  /** Optional signer private key (hex). If present, the receipt is signed. */
  signerPrivateKey?: string;
}

/**
 * Assemble the Trust Receipt from settled specialist entries: fuse risk, phrase
 * the explanation (LLM if available, deterministic otherwise), hash, and sign.
 */
export async function buildTrustReceipt(args: BuildReceiptArgs): Promise<TrustReceipt> {
  const { subject, inputKind, entries, createdAt } = args;

  const fusion = fuseRisk(
    entries.map((e) => ({ result: e.result, reputation: e.reputation }))
  );

  const totalPaid = entries.reduce(
    (acc, e) => acc + BigInt(e.settlement.priceBaseUnits || '0'),
    0n
  );

  const explanation = await explain(subject, fusion.verdict, fusion.riskScore, entries);

  const base: Omit<TrustReceipt, 'receiptHash' | 'signature'> = {
    version: '1',
    subject,
    inputKind,
    createdAt,
    riskScore: fusion.riskScore,
    verdict: fusion.verdict,
    explanation,
    entries,
    totalPaidBaseUnits: totalPaid.toString(),
  };

  const receiptHash = 'sha256:' + sha256Hex(canonicalize(base));

  let signature: TrustReceipt['signature'] | undefined;
  if (args.signerPrivateKey) {
    try {
      const wallet = new ethers.Wallet(args.signerPrivateKey);
      const value = await wallet.signMessage(receiptHash);
      signature = { signer: wallet.address, value };
    } catch (err: any) {
      console.warn(`[receipt] signing skipped: ${err?.message ?? err}`);
    }
  }

  return { ...base, receiptHash, signature };
}

/** LLM-phrased plain-language explanation, with a deterministic fallback. */
async function explain(
  subject: string,
  verdict: Verdict,
  risk: number,
  entries: ReceiptEntry[]
): Promise<string> {
  const flags = entries
    .flatMap((e) => e.result.findings)
    .filter((f) => f.severity === 'high' || f.severity === 'critical')
    .map((f) => `- ${f.title}: ${f.detail}`);

  const deterministic = deterministicExplanation(verdict, risk, flags);

  if (!llmAvailable() || flags.length === 0) return deterministic;

  const prompt = [
    `You are Pirton, a scam-shield that explains risk to ordinary people in plain language.`,
    `Subject analyzed: ${subject}`,
    `Computed verdict: ${VERDICT_LABEL[verdict]} (risk ${risk}/100). Do NOT change this number or verdict.`,
    `Key evidence found by specialist agents:`,
    ...flags,
    ``,
    `Write 2-3 short sentences a non-technical person understands, explaining WHY this risk`,
    `level was assigned, referencing the evidence above. No jargon, no hype, no markdown.`,
  ].join('\n');

  const out = await chat(prompt, { tier: 'fast', temperature: 0.3, maxTokens: 220 });
  return out && out.length > 0 ? out : deterministic;
}

function deterministicExplanation(verdict: Verdict, risk: number, flags: string[]): string {
  const head =
    verdict === 'likely_scam'
      ? `We think this is likely a scam (risk ${risk}/100).`
      : verdict === 'caution'
        ? `Be careful with this one (risk ${risk}/100).`
        : `We didn't find strong scam signals (risk ${risk}/100).`;
  if (flags.length === 0) {
    return `${head} No high-severity red flags were raised by the agents we hired.`;
  }
  return `${head} Our agents flagged: ${flags
    .map((f) => f.replace(/^- /, ''))
    .join('; ')}.`;
}
