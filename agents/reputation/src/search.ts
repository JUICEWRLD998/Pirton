import { optionalEnv } from '@pirton/shared';

/**
 * Minimal web-search client for the Reputation / Web-signal agent. Uses Tavily
 * (https://tavily.com — simple JSON search API) when WEB_SEARCH_API_KEY is set.
 * Returns null when unkeyed or on failure, so the handler degrades to an honest
 * "web reputation unchecked" finding instead of fabricating sources.
 */
const TAVILY_URL = 'https://api.tavily.com/search';

export interface SearchHit {
  title: string;
  url: string;
  /** Snippet/content Tavily returns for the result. */
  content: string;
}

export function searchAvailable(): boolean {
  return optionalEnv('WEB_SEARCH_API_KEY') !== '';
}

/** Run a web search; returns up to `maxResults` hits, or null if unavailable. */
export async function webSearch(query: string, maxResults = 6): Promise<SearchHit[] | null> {
  const apiKey = optionalEnv('WEB_SEARCH_API_KEY');
  if (!apiKey) return null;

  try {
    const res = await fetch(TAVILY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: 'basic',
        max_results: maxResults,
      }),
    });
    if (!res.ok) return null;
    const data: any = await res.json();
    const results = Array.isArray(data?.results) ? data.results : [];
    return results
      .map((r: any) => ({
        title: typeof r?.title === 'string' ? r.title : '',
        url: typeof r?.url === 'string' ? r.url : '',
        content: typeof r?.content === 'string' ? r.content : '',
      }))
      .filter((h: SearchHit) => h.url.length > 0);
  } catch {
    return null;
  }
}
