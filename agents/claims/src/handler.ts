import { ethers } from 'ethers';
import type { SpecialistHandler, HandlerResult } from '@pirton/agent-core';
import { chat, llmAvailable, type Finding } from '@pirton/shared';
import { scanClaims } from './heuristics';

/**
 * The Claims / Misinformation specialist. It evaluates the *text* of an offer,
 * job post, or message against scam red-flag heuristics (guaranteed returns,
 * urgency, seed-phrase requests, wallet-drainer language, advance fees,
 * impersonation) and cites which phrase triggered which flag.
 *
 * Facts are deterministic (heuristics.ts); the LLM (plan §2.5) only phrases a
 * plain-language summary over the flags it found — it does not invent claims.
 */
export function makeClaimsHandler(): SpecialistHandler {
  return async (req): Promise<HandlerResult> => {
    const text = pickText(asString(req.json?.raw), req.subject, req.raw);
    if (!text || text.trim().length === 0) {
      return {
        subject: '',
        confidence: 0.2,
        findings: [{
          code: 'no_text',
          title: 'No offer text to analyze',
          severity: 'info',
          detail: 'The claims agent analyzes message/offer text, but the request contained none.',
          citations: [],
        }],
        summary: 'No offer text was provided to analyze.',
      };
    }

    const address = extractAddress(text);
    const { findings, matched } = scanClaims(text, address);
    const subject = digest(text);

    if (matched === 0) {
      return {
        subject,
        confidence: confidenceFor(text),
        findings: [{
          code: 'no_scam_language',
          title: 'No scam red-flags in the text',
          severity: 'info',
          detail: 'The wording did not match common scam patterns (guaranteed returns, urgency, credential/seed-phrase requests, advance fees). This checks language only, not the underlying entity.',
          citations: [],
        }],
        summary: 'The message text did not trigger common scam red-flags.',
      };
    }

    return {
      subject,
      confidence: confidenceFor(text),
      findings,
      summary: await phraseSummary(findings),
    };
  };
}

async function phraseSummary(findings: Finding[]): Promise<string> {
  const serious = findings.filter((f) => f.severity === 'high' || f.severity === 'critical');
  const deterministic =
    serious.length > 0
      ? `The text shows ${serious.length} serious scam red-flag(s): ${serious.map((f) => f.title.toLowerCase()).join(', ')}.`
      : `The text shows ${findings.length} lower-severity red-flag(s): ${findings.map((f) => f.title.toLowerCase()).join(', ')}.`;

  if (!llmAvailable()) return deterministic;

  const prompt = [
    `You phrase a one-sentence, plain-language summary of scam red-flags found in a message, for a non-technical person.`,
    `Do not invent anything. Only summarize these flags:`,
    ...findings.map((f) => `- [${f.severity}] ${f.title}: ${f.detail}`),
    ``,
    `Return ONE sentence, no markdown, no hype.`,
  ].join('\n');

  const out = await chat(prompt, { tier: 'fast', temperature: 0.2, maxTokens: 120 });
  return out && out.length > 0 ? out : deterministic;
}

/** Longer, richer text → more confident the language scan is meaningful. */
function confidenceFor(text: string): number {
  const len = text.trim().length;
  if (len < 20) return 0.4;
  if (len < 80) return 0.65;
  return 0.85;
}

const EVM_ADDRESS_RE = /0x[a-fA-F0-9]{40}/;

function extractAddress(s: string): string | undefined {
  const m = s.match(EVM_ADDRESS_RE);
  return m && ethers.isAddress(m[0]) ? ethers.getAddress(m[0]) : undefined;
}

/** A short human-readable digest of the analyzed text for the receipt subject. */
function digest(text: string): string {
  const oneLine = text.replace(/\s+/g, ' ').trim();
  return oneLine.length <= 80 ? oneLine : oneLine.slice(0, 80) + '…';
}

function pickText(...candidates: Array<string | undefined>): string {
  for (const c of candidates) if (c && c.trim().length > 0) return c;
  return '';
}

function asString(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined;
}
