import { z } from 'zod';

export interface SearchSource { title: string; url: string; domain: string; highlights: string[]; publishedDate: string | null; preview: string; }
export type SearchOutcome = { ok: true; sources: SearchSource[] } | { ok: false; error: 'configuration' | 'credentials' | 'rate_limit' | 'timeout' | 'network' | 'invalid_response' | 'unavailable'; message: string };
export const searchInput = z.object({ query: z.string().trim().min(1).max(2000) });
export function exaRequest(query: string) { return { query, type: 'auto', numResults: 5, contents: { highlights: true } }; }
const responseSchema = z.object({ results: z.array(z.object({ title: z.string().nullish(), url: z.string(), highlights: z.array(z.string()).nullish(), publishedDate: z.string().nullish() })) });
export function normalizeExaResponse(input: unknown): SearchSource[] {
  const response = responseSchema.parse(input);
  return response.results.flatMap(result => {
    let url: URL; try { url = new URL(result.url); } catch { return []; }
    if (!['https:', 'http:'].includes(url.protocol)) return [];
    const highlights = result.highlights ?? [];
    return [{ title: result.title?.trim() || url.hostname, url: url.href, domain: url.hostname.replace(/^www\./, ''), highlights, preview: highlights.join('\n\n'), publishedDate: result.publishedDate && Number.isFinite(Date.parse(result.publishedDate)) ? result.publishedDate : null }];
  }).slice(0, 5);
}
export function searchFailure(error: Extract<SearchOutcome, { ok: false }>['error']): SearchOutcome {
  const messages = { configuration: 'Web search is not configured yet. Please try again later.', credentials: 'Web search could not connect. Please contact the app owner.', rate_limit: 'Web search is busy or has reached its limit. Please try again later.', timeout: 'The search took too long. Please try again.', network: 'Web search could not connect. Please try again.', invalid_response: 'The search returned an unreadable response. Please try again.', unavailable: 'Web search is temporarily unavailable. Please try again later.' };
  return { ok: false, error, message: messages[error] };
}