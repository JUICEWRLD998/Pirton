import { addressUrl, type Citation, type Finding, type Severity } from '@pirton/shared';

/**
 * Deterministic scam red-flag detectors over an offer's TEXT. Each detector is a
 * labelled pattern; when it matches, the *matched phrase* becomes the citation so
 * the receipt can show "we flagged this because you wrote …". Facts stay in code
 * (plan §2.5); the LLM only phrases a summary over these findings.
 */
interface Detector {
  code: string;
  title: string;
  severity: Severity;
  detail: string;
  re: RegExp;
}

const DETECTORS: Detector[] = [
  {
    code: 'guaranteed_returns',
    title: 'Promises guaranteed / unrealistic returns',
    severity: 'high',
    detail: 'The offer promises guaranteed or outsized profit. Real investments cannot guarantee returns — this is a hallmark of investment fraud.',
    re: /\b(guaranteed?|risk[-\s]?free|no risk|100%\s*(?:safe|profit|return)|double your|10x|100x|(?:\d{2,4}\s*%)\s*(?:daily|weekly|monthly|returns?|profit|roi|apy))\b/i,
  },
  {
    code: 'urgency_pressure',
    title: 'Creates false urgency',
    severity: 'medium',
    detail: 'The message pressures you to act immediately. Urgency is used to stop you from thinking or checking — a classic manipulation tactic.',
    re: /\b(act now|limited time|hurry|only \d+ (?:spots|left)|expires? (?:today|soon|in)|last chance|don'?t miss|ending soon|before it'?s too late)\b/i,
  },
  {
    code: 'seed_phrase_request',
    title: 'Asks for your seed phrase / private key',
    severity: 'critical',
    detail: 'The offer asks for a seed phrase, recovery phrase, or private key. No legitimate service ever needs these — anyone with them can drain your wallet.',
    re: /\b(seed\s*phrase|recovery\s*phrase|private\s*key|mnemonic|12[-\s]word|24[-\s]word|wallet\s*password)\b/i,
  },
  {
    code: 'wallet_drainer',
    title: 'Wallet-connect / claim drainer language',
    severity: 'high',
    detail: 'The offer pushes you to connect your wallet or “verify/sync” it to claim something. This is the setup for wallet-drainer approvals that steal your assets.',
    re: /\b(connect (?:your )?wallet|verify (?:your )?wallet|sync (?:your )?wallet|claim (?:your )?(?:airdrop|reward|tokens?|nft)|validate (?:your )?wallet|restore (?:your )?wallet)\b/i,
  },
  {
    code: 'upfront_payment',
    title: 'Requires an upfront payment / fee',
    severity: 'high',
    detail: 'You are asked to pay a fee, deposit, or tax up front to receive money, a job, or a rental. Advance-fee demands are a core scam structure.',
    re: /\b(processing fee|activation fee|upfront (?:fee|payment)|pay .* (?:to (?:claim|release|unlock)|first)|security deposit|gas fee to (?:claim|receive)|small fee|release fee|tax before)\b/i,
  },
  {
    code: 'impersonation',
    title: 'Impersonates a known brand or authority',
    severity: 'medium',
    detail: 'The message claims to be from a well-known company, exchange, or official body. Impersonation borrows trust it hasn’t earned — verify via official channels.',
    re: /\b(official (?:team|support)|customer support|(?:binance|coinbase|metamask|paypal|amazon|microsoft|apple|irs|government)\b.*(?:support|team|security|refund)|verified account|account (?:suspended|locked|compromised))\b/i,
  },
  {
    code: 'contact_offplatform',
    title: 'Pushes you to a private / off-platform channel',
    severity: 'low',
    detail: 'The offer steers you to WhatsApp/Telegram/DM to continue. Moving off public platforms helps scammers avoid moderation and pressure you privately.',
    re: /\b(whatsapp|telegram|dm me|direct message|message me on|contact me on|t\.me\/)\b/i,
  },
  {
    code: 'too_good_job',
    title: 'Unrealistic pay for little work',
    severity: 'medium',
    detail: 'The job/task promises high pay for minimal, vague work (e.g. “$500/day, no experience”). This pattern fronts task/reshipping and money-mule scams.',
    re: /\$\s?\d{2,4}\s*(?:\/|per\s*)?(?:day|hour|task)\b.*\b(no experience|easy|from home|part[-\s]?time)|\b(no experience|easy money)\b.*\$\s?\d{2,4}/i,
  },
];

export interface ClaimsScan {
  findings: Finding[];
  /** Number of distinct red-flag categories matched. */
  matched: number;
}

/** Scan offer text against all detectors, citing the matched phrase. */
export function scanClaims(text: string, address?: string): ClaimsScan {
  const findings: Finding[] = [];
  for (const d of DETECTORS) {
    const m = d.re.exec(text);
    if (!m) continue;
    const phrase = m[0].trim().slice(0, 120);
    const citations: Citation[] = [{ label: 'Matched text', ref: `"${phrase}"` }];
    if (address) citations.push({ label: 'Address in offer', ref: addressUrl(address)! });
    findings.push({ code: d.code, title: d.title, severity: d.severity, detail: d.detail, citations });
  }
  return { findings, matched: findings.length };
}
