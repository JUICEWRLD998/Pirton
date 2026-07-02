import type { SpecialistHandler, HandlerResult } from '@pirton/agent-core';
import { chat, llmAvailable, type Citation, type Finding } from '@pirton/shared';
import { webSearch, searchAvailable, type SearchHit } from './search';

/**
 * The Reputation / Web-signal specialist. It searches the open web for scam
 * reports, complaints, and known-scam mentions of the pasted subject (a domain,
 * token address, or offer text) and returns a *cited* finding.
 *
 * Discipline (plan §2.5): the LLM only *synthesizes retrieved sources* — it never
 * invents facts. Whether the web signal is negative is decided deterministically
 * from the actual search results; the citations are always real result URLs. If
 * no search key is configured the agent says the web check was skipped.
 */
export function makeReputationHandler(): SpecialistHandler {
  return async (req): Promise<HandlerResult> => {
    const subject = pickSubject(req.subject, asString(req.json?.raw), req.raw);
    if (!subject) {
      return {
        subject: '',
        confidence: 0.2,
        findings: [info('no_subject', 'Nothing to check', 'No subject text, domain, or address was provided to look up.')],
        summary: 'No subject was provided for a web-reputation check.',
      };
    }

    if (!searchAvailable()) {
      return {
        subject,
        confidence: 0.3,
        findings: [{
          code: 'web_check_skipped',
          title: 'Web reputation not checked',
          severity: 'info',
          detail:
            'No web-search key is configured, so Pirton could not search the open web for scam reports about this subject. ' +
            'This is a gap in coverage, not a clean bill of health.',
          citations: [],
        }],
        summary: 'Web-reputation check skipped (no search key configured).',
      };
    }

    const query = `"${subject}" scam OR fraud OR "rug pull" OR phishing OR complaint OR warning`;
    const results = await webSearch(query);

    if (!results || results.length === 0) {
      return {
        subject,
        confidence: 0.5,
        findings: [info('no_web_signal', 'No web reports found',
          `A web search for "${subject}" returned no notable scam reports or complaints. Absence of reports is weak evidence, not proof of safety.`)],
        summary: `No scam reports surfaced online for ${subject}.`,
      };
    }

    const negative = results.filter((r) => NEGATIVE_RE.test(`${r.title} ${r.content}`));

    if (negative.length === 0) {
      return {
        subject,
        confidence: 0.55,
        findings: [info('no_negative_signal', 'No negative web signals',
          `Web results mentioned "${subject}" but none read as scam reports or fraud complaints in this pass.`,
          results.slice(0, 3).map((r) => cite(hostOf(r.url), r.url)))],
        summary: `Web search found mentions of ${subject} but no clear scam reports.`,
      };
    }

    const severity = negative.length >= 3 ? 'high' : 'medium';
    const citations = negative.slice(0, 5).map((r) => cite(r.title || hostOf(r.url), r.url));
    const detail = await synthesize(subject, negative);

    return {
      subject,
      confidence: 0.7,
      findings: [{
        code: 'negative_web_reports',
        title: `Scam/fraud reports found online (${negative.length})`,
        severity,
        detail,
        citations,
      }],
      summary: `Found ${negative.length} online source(s) reporting scam/fraud signals for ${subject}.`,
    };
  };
}

const NEGATIVE_RE = /\b(scam|fraud|rug\s*pull|rugpull|honeypot|phishing|drainer|stole[n]?|ponzi|fake|fraudulent|avoid|blacklist|reported|complaint|warning)\b/i;

/** LLM synthesizes the negative results into one plain, cited-in-spirit sentence. */
async function synthesize(subject: string, hits: SearchHit[]): Promise<string> {
  const deterministic =
    `Multiple web sources associate "${subject}" with scam or fraud reports (${hits.length} matching result(s)). See the cited links for details.`;
  if (!llmAvailable()) return deterministic;

  const prompt = [
    `You summarize web search results about a possibly-fraudulent subject for a non-technical person.`,
    `Only use the snippets below — do NOT invent facts, names, or numbers. If they are vague, say so.`,
    `Subject: ${subject}`,
    `RESULTS:`,
    ...hits.slice(0, 5).map((h, i) => `[${i + 1}] ${h.title} — ${h.content.slice(0, 300)}`),
    ``,
    `Write 1-2 short sentences explaining what the web reports say. No markdown, no hype.`,
  ].join('\n');

  const out = await chat(prompt, { tier: 'fast', temperature: 0.2, maxTokens: 180 });
  return out && out.length > 0 ? out : deterministic;
}

const URL_RE = /\bhttps?:\/\/[^\s]+|\b([a-z0-9-]+\.(?:com|io|xyz|net|org|finance|app|co|dev))\b/i;
const EVM_ADDRESS_RE = /0x[a-fA-F0-9]{40}/;

/** Choose the most searchable identity: a domain, else an address, else short text. */
function pickSubject(subject?: string, raw?: string, rawFallback?: string): string {
  const text = (raw ?? subject ?? rawFallback ?? '').trim();
  const url = text.match(URL_RE);
  if (url) return hostOf(url[0]);
  const addr = text.match(EVM_ADDRESS_RE);
  if (addr) return addr[0];
  return text.slice(0, 80);
}

function hostOf(u: string): string {
  try {
    return new URL(u.startsWith('http') ? u : `https://${u}`).hostname.replace(/^www\./, '');
  } catch {
    return u;
  }
}

function asString(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined;
}

function cite(label: string, ref: string): Citation {
  return { label, ref };
}

function info(code: string, title: string, detail: string, citations: Citation[] = []): Finding {
  return { code, title, severity: 'info', detail, citations };
}
