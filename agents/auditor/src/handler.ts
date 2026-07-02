import { ethers } from 'ethers';
import type { SpecialistHandler, HandlerResult } from '@pirton/agent-core';
import {
  addressUrl,
  chat,
  llmAvailable,
  parseJsonLoose,
  type Citation,
  type Finding,
  type Severity,
} from '@pirton/shared';
import { getVerifiedSource, explorerAvailable, type VerifiedSource } from './explorer';

/**
 * The Contract Auditor specialist. It pulls a contract's *verified Solidity
 * source* from the explorer and reasons over it for rug patterns (hidden/owner-
 * adjustable fees, transfer pauses, mint/blacklist authority, upgradeable proxy,
 * self-destruct/delegatecall). Two layers, both auditable:
 *
 *  1. Deterministic source scan — flags well-known risky constructs with the
 *     matched line as a citation. Runs with no LLM, so the agent always produces
 *     something factual.
 *  2. LLM reasoning (strong tier, plan §2.5) — Gemini reads the source and adds
 *     findings it can justify, constrained to constructs actually present.
 *
 * When source is unavailable (no explorer key, or unverified), the auditor says
 * so honestly — an unverifiable contract is itself a risk signal.
 */
export function makeAuditorHandler(): SpecialistHandler {
  return async (req): Promise<HandlerResult> => {
    const address = extractAddress(req.subject) ?? extractAddress(req.raw);
    if (!address) {
      return {
        subject: req.subject ?? req.raw ?? '',
        confidence: 0.2,
        findings: [info('no_address', 'No contract address to audit',
          'The auditor needs a token/contract address; none was found in the request.')],
        summary: 'No contract address was provided to audit.',
      };
    }

    if (!explorerAvailable()) {
      return {
        subject: address,
        confidence: 0.3,
        findings: [{
          code: 'audit_unavailable',
          title: 'Source audit unavailable',
          severity: 'medium',
          detail:
            'No block-explorer key is configured, so the verified source code could not be fetched for an automated audit. ' +
            'Treat the contract as un-audited until its source is reviewed.',
          citations: [cite('BaseScan code', `${addressUrl(address)}#code`)],
        }],
        summary: 'Could not fetch verified source to audit (no explorer key configured).',
      };
    }

    const src = await getVerifiedSource(address);
    if (!src) {
      return {
        subject: address,
        confidence: 0.6,
        findings: [{
          code: 'unverified_source',
          title: 'Contract source is not verified',
          severity: 'high',
          detail:
            'The contract has no verified source code on the explorer, so its behavior cannot be independently audited. ' +
            'Unverified contracts are a common way to hide malicious logic — treat with caution.',
          citations: [cite('BaseScan code', `${addressUrl(address)}#code`)],
        }],
        summary: 'The contract source is not verified, so it cannot be audited.',
      };
    }

    const findings: Finding[] = [];
    const codeCite = cite('BaseScan code', `${addressUrl(address)}#code`);

    // Upgradeable proxy is a first-class source-level risk.
    if (src.proxy) {
      findings.push({
        code: 'upgradeable_proxy',
        title: 'Upgradeable proxy contract',
        severity: 'medium',
        detail:
          `Logic lives behind a proxy (implementation ${src.implementation ?? 'unknown'}) and can be swapped by the admin, ` +
          `changing the contract's behavior after you interact with it.`,
        citations: [codeCite],
      });
    }

    // 1) Deterministic source-pattern scan.
    for (const f of scanSource(src.source, address)) findings.push(f);

    // 2) LLM reasoning over the source (strong tier), merged and de-duped.
    let llmRan = false;
    if (llmAvailable()) {
      const llmFindings = await auditWithLlm(address, src);
      if (llmFindings) {
        llmRan = true;
        for (const f of llmFindings) if (!findings.some((g) => g.code === f.code)) findings.push(f);
      }
    }

    if (findings.length === 0) {
      findings.push(info('audit_clean', 'No obvious rug patterns in source',
        `The verified source of ${src.contractName ?? 'the contract'} did not match known rug patterns in this pass. This is not a guarantee of safety.`));
    }

    return {
      subject: address,
      // Verified source + LLM reasoning is our strongest audit; source-only scan is weaker.
      confidence: llmRan ? 0.85 : 0.65,
      findings,
      summary: await phraseSummary(address, src, findings),
    };
  };
}

/** Deterministic source constructs we treat as rug/honeypot levers. */
const SOURCE_PATTERNS: Array<{ code: string; title: string; severity: Severity; detail: string; re: RegExp }> = [
  {
    code: 'src_selfdestruct',
    title: 'Contract can self-destruct',
    severity: 'high',
    detail: 'The source contains selfdestruct, letting an owner destroy the contract and potentially strand funds.',
    re: /\bselfdestruct\s*\(|\bsuicide\s*\(/,
  },
  {
    code: 'src_delegatecall',
    title: 'Contract uses delegatecall',
    severity: 'medium',
    detail: 'delegatecall runs external code in this contract’s context — a powerful primitive often behind upgradeable or arbitrary-call risks.',
    re: /\.delegatecall\s*\(/,
  },
  {
    code: 'src_mint_authority',
    title: 'Source exposes a mint function',
    severity: 'high',
    detail: 'A callable mint function lets the owner inflate supply and dilute holders after launch.',
    re: /function\s+mint\s*\(/i,
  },
  {
    code: 'src_blacklist',
    title: 'Source can blacklist addresses',
    severity: 'high',
    detail: 'The source references a blacklist / bot-block mechanism that can stop specific wallets from selling.',
    re: /blacklist|_isBlacklisted|isBot\b|_isBot\b|setBots?\s*\(/i,
  },
  {
    code: 'src_pausable',
    title: 'Transfers can be paused / gated',
    severity: 'high',
    detail: 'The source can pause or gate trading (e.g. a tradingEnabled flag), which can trap buyers — a honeypot mechanism.',
    re: /whenNotPaused|_pause\s*\(|tradingEnabled|tradingActive|setTrading|enableTrading/i,
  },
  {
    code: 'src_mutable_fees',
    title: 'Fees/taxes are owner-adjustable',
    severity: 'medium',
    detail: 'Fee/tax setters let the owner raise sell taxes after launch, sometimes to punitive levels (a soft honeypot).',
    re: /function\s+set(?:Fee|Fees|Tax|TaxFee|SellFee|BuyFee|Taxes)\s*\(/i,
  },
];

/** Scan flattened source for risky constructs, citing the first matching line. */
function scanSource(source: string, address: string): Finding[] {
  const out: Finding[] = [];
  for (const p of SOURCE_PATTERNS) {
    const m = p.re.exec(source);
    if (!m) continue;
    const line = lineOf(source, m.index);
    out.push({
      code: p.code,
      title: p.title,
      severity: p.severity,
      detail: p.detail,
      citations: [cite(`Source (near line ${line})`, `${addressUrl(address)}#code`)],
    });
  }
  return out;
}

/** LLM reads the verified source and returns findings it can justify. */
async function auditWithLlm(address: string, src: VerifiedSource): Promise<Finding[] | null> {
  const source = src.source.slice(0, 24_000); // cap tokens; rug levers cluster near the top
  const prompt = [
    `You are a smart-contract auditor. Review this VERIFIED Solidity source for rug/scam patterns`,
    `(hidden or owner-adjustable fees, transfer pauses/gates, mint or blacklist authority, upgradeable`,
    `proxy admin power, self-destruct, arbitrary delegatecall, owner-only withdrawal of user funds).`,
    ``,
    `Rules:`,
    `- Only report patterns ACTUALLY present in the source. Do NOT invent issues.`,
    `- If the source looks clean, return {"findings": []}.`,
    `- severity is one of: info, low, medium, high, critical.`,
    ``,
    `Return JSON only: {"findings":[{"code":"snake_case","title":"short","severity":"...","detail":"one plain sentence","line": <int or 0>}]}`,
    ``,
    `Contract: ${src.contractName ?? 'unknown'} @ ${address}`,
    `SOURCE:`,
    source,
  ].join('\n');

  const out = await chat(prompt, { tier: 'strong', json: true, temperature: 0, maxTokens: 900 });
  const parsed = parseJsonLoose<{ findings?: unknown }>(out);
  if (!parsed || !Array.isArray(parsed.findings)) return null;

  const findings: Finding[] = [];
  for (const raw of parsed.findings as any[]) {
    if (!raw || typeof raw.title !== 'string') continue;
    const code = typeof raw.code === 'string' && raw.code ? `llm_${raw.code}` : `llm_${slug(raw.title)}`;
    const line = Number.isFinite(raw.line) && raw.line > 0 ? ` (near line ${raw.line})` : '';
    findings.push({
      code,
      title: raw.title.slice(0, 120),
      severity: toSeverity(raw.severity),
      detail: typeof raw.detail === 'string' ? raw.detail.slice(0, 400) : 'Flagged by source audit.',
      citations: [cite(`Source${line}`, `${addressUrl(address)}#code`)],
    });
  }
  return findings;
}

async function phraseSummary(address: string, src: VerifiedSource, findings: Finding[]): Promise<string> {
  const serious = findings.filter((f) => f.severity === 'high' || f.severity === 'critical');
  const name = src.contractName ?? 'the contract';
  const deterministic =
    serious.length > 0
      ? `Audit of ${name} flagged ${serious.length} serious issue(s): ${serious.map((f) => f.title.toLowerCase()).join(', ')}.`
      : `Audit of ${name}’s verified source surfaced no high-severity rug patterns.`;

  if (!llmAvailable() || findings.length === 0) return deterministic;

  const prompt = [
    `You phrase a one-sentence, plain-language summary of a smart-contract audit for a non-technical person.`,
    `Do not invent facts. Only summarize these findings for ${name} (${address}):`,
    ...findings.map((f) => `- [${f.severity}] ${f.title}: ${f.detail}`),
    ``,
    `Return ONE sentence, no markdown, no hype.`,
  ].join('\n');

  const out = await chat(prompt, { tier: 'fast', temperature: 0.2, maxTokens: 120 });
  return out && out.length > 0 ? out : deterministic;
}

const EVM_ADDRESS_RE = /0x[a-fA-F0-9]{40}/;

function extractAddress(s?: string): string | undefined {
  if (!s) return undefined;
  const m = s.match(EVM_ADDRESS_RE);
  return m && ethers.isAddress(m[0]) ? ethers.getAddress(m[0]) : undefined;
}

function lineOf(source: string, index: number): number {
  let line = 1;
  for (let i = 0; i < index && i < source.length; i++) if (source[i] === '\n') line++;
  return line;
}

const SEVERITIES: Severity[] = ['info', 'low', 'medium', 'high', 'critical'];
function toSeverity(s: unknown): Severity {
  return typeof s === 'string' && (SEVERITIES as string[]).includes(s) ? (s as Severity) : 'medium';
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40) || 'finding';
}

function cite(label: string, ref: string): Citation {
  return { label, ref };
}

function info(code: string, title: string, detail: string): Finding {
  return { code, title, severity: 'info', detail, citations: [] };
}
