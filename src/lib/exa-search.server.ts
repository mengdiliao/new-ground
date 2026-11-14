import { exaRequest, normalizeExaResponse, searchFailure, type SearchOutcome } from '@/lib/exa-search';

export async function requestExa(query: string, apiKey: string, fetcher: typeof fetch = fetch): Promise<SearchOutcome> {
  try {
    const response = await fetcher('https://api.exa.ai/search', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey }, body: JSON.stringify(exaRequest(query)), signal: AbortSignal.timeout(20000) });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) return searchFailure('credentials');
      if (response.status === 429) return searchFailure('rate_limit');
      return searchFailure('unavailable');
    }
    try { return { ok: true, sources: normalizeExaResponse(await response.json()) }; }
    catch { return searchFailure('invalid_response'); }
  } catch (error) {
    return searchFailure(error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name) ? 'timeout' : 'network');
  }
}