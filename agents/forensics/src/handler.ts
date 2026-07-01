import { ethers } from 'ethers';
import type { SpecialistHandler, HandlerResult } from '@pirton/agent-core';
import { chat, llmAvailable, optionalEnv, type Finding } from '@pirton/shared';
import { runForensics } from './checks';

/**
 * The Forensics specialist handler. Given a token/contract address it runs the
 * deterministic on-chain sweep (checks.ts) and returns findings. The LLM is
 * used ONLY to phrase a one-line human summary over the already-computed facts
 * — it never invents on-chain data (plan §2.5).
 */
export function makeForensicsHandler(): SpecialistHandler {
  const rpcURL = optionalEnv('BASE_RPC_URL', 'https://mainnet.base.org');
  const provider = new ethers.JsonRpcProvider(rpcURL);

  return async (req): Promise<HandlerResult> => {
    const address = extractAddress(req.subject) ?? extractAddress(req.raw);
    if (!address) {
      return {
        subject: req.subject ?? req.raw ?? '',
        confidence: 0.2,
        findings: [
          {
            code: 'no_address',
            title: 'No analyzable address provided',
            severity: 'info',
            detail: 'Forensics needs a token/contract address; none was found in the request.',
            citations: [],
          },
        ],
        summary: 'No on-chain address was provided to analyze.',
      };
    }

    const data = await runForensics(address, provider);
    const summary = await phraseSummary(address, data.findings);

    return {
      subject: address,
      confidence: data.confidence,
      findings: data.findings,
      summary,
    };
  };
}

const EVM_ADDRESS_RE = /0x[a-fA-F0-9]{40}/;

function extractAddress(s?: string): string | undefined {
  if (!s) return undefined;
  const m = s.match(EVM_ADDRESS_RE);
  return m && ethers.isAddress(m[0]) ? ethers.getAddress(m[0]) : undefined;
}

async function phraseSummary(address: string, findings: Finding[]): Promise<string> {
  const serious = findings.filter((f) => f.severity === 'high' || f.severity === 'critical');
  const deterministic =
    findings.length === 0
      ? `On-chain checks for ${address} surfaced no red flags.`
      : serious.length > 0
        ? `On-chain checks flagged ${serious.length} serious issue(s): ${serious
            .map((f) => f.title.toLowerCase())
            .join(', ')}.`
        : `On-chain checks surfaced ${findings.length} lower-severity note(s).`;

  if (!llmAvailable() || findings.length === 0) return deterministic;

  const prompt = [
    `You phrase a one-sentence, plain-language summary of on-chain token forensics for a non-technical person.`,
    `Do not invent facts. Only summarize these findings:`,
    ...findings.map((f) => `- [${f.severity}] ${f.title}: ${f.detail}`),
    ``,
    `Return ONE sentence, no markdown, no hype.`,
  ].join('\n');

  const out = await chat(prompt, { tier: 'fast', temperature: 0.2, maxTokens: 120 });
  return out && out.length > 0 ? out : deterministic;
}
