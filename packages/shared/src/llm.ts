import { optionalEnv } from './env';

/**
 * Thin OpenRouter (OpenAI-compatible) client for Gemini. The LLM is used only
 * for *phrasing and reasoning over retrieved facts* — never to invent on-chain
 * data. Every call is optional: if no key is set, callers fall back to
 * deterministic text so the pipeline still runs offline.
 */

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export type ModelTier = 'strong' | 'fast';

export function llmAvailable(): boolean {
  return optionalEnv('OPENROUTER_API_KEY') !== '';
}

function modelFor(tier: ModelTier): string {
  return tier === 'strong'
    ? optionalEnv('OPENROUTER_MODEL_STRONG', 'google/gemini-2.5-pro')
    : optionalEnv('OPENROUTER_MODEL_FAST', 'google/gemini-2.5-flash');
}

export interface ChatOptions {
  tier?: ModelTier;
  system?: string;
  /** Force a JSON object response. */
  json?: boolean;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Single-shot chat completion. Returns the assistant text, or null if the LLM
 * is unavailable or the call fails (callers must handle null with a fallback).
 */
export async function chat(prompt: string, opts: ChatOptions = {}): Promise<string | null> {
  const apiKey = optionalEnv('OPENROUTER_API_KEY');
  if (!apiKey) return null;

  const body: Record<string, unknown> = {
    model: modelFor(opts.tier ?? 'fast'),
    messages: [
      ...(opts.system ? [{ role: 'system', content: opts.system }] : []),
      { role: 'user', content: prompt },
    ],
    temperature: opts.temperature ?? 0.2,
    max_tokens: opts.maxTokens ?? 700,
  };
  if (opts.json) body.response_format = { type: 'json_object' };

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://github.com/JUICEWRLD998/Pirton',
        'X-Title': 'Pirton',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.warn(`[llm] ${res.status} ${res.statusText}: ${text.slice(0, 200)}`);
      return null;
    }
    const data: any = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    return typeof content === 'string' ? content.trim() : null;
  } catch (err: any) {
    console.warn(`[llm] request failed: ${err?.message ?? err}`);
    return null;
  }
}

/** Parse a JSON object out of an LLM response, tolerating code fences. */
export function parseJsonLoose<T = any>(text: string | null): T | null {
  if (!text) return null;
  let s = text.trim();
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start >= 0 && end > start) s = s.slice(start, end + 1);
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}
