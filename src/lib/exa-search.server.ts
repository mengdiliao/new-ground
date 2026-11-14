import { exaRequest, normalizeExaResponse, searchFailure, type SearchOutcome } from '@/lib/exa-search';
import { cacheResearchImage } from './research-images.server';

export async function requestExa(query: string, apiKey: string, fetcher: typeof fetch = fetch): Promise<SearchOutcome> {
  try {
    const response = await fetcher('https://api.exa.ai/search', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey }, body: JSON.stringify(exaRequest(query)), signal: AbortSignal.timeout(20000) });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) return searchFailure('credentials');
      if (response.status === 429) return searchFailure('rate_limit');
      return searchFailure('unavailable');
    }
    try {
      const sources = normalizeExaResponse(await response.json());
      let budget = 2;
      for (const source of sources) {
        const images = [];
        for (const image of source.images ?? []) { if (budget-- <= 0) break; const cached = await cacheResearchImage(image, fetcher); if (cached) images.push(cached); }
        if (source.images) source.images = images;
      }
      return { ok: true, sources };
    }
    catch { return searchFailure('invalid_response'); }
  } catch (error) {
    return searchFailure(error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name) ? 'timeout' : 'network');
  }
}