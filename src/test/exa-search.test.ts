import { describe, expect, it, vi } from 'vitest';
import actualResponse from './fixtures/exa-live-response.json';
import { exaRequest, normalizeExaResponse, searchInput } from '@/lib/exa-search';
import { requestExa } from '@/lib/exa-search.server';

describe('Exa search contract', () => {
  it('uses auto search, five results, and highlights', () => { expect(exaRequest('moving to Helsinki')).toEqual({ query: 'moving to Helsinki', type: 'auto', numResults: 5, contents: { highlights: true } }); });
  it('normalizes a genuine Exa response captured on November 14, 2026', () => {
    const sources = normalizeExaResponse(actualResponse);
    expect(sources).toHaveLength(5);
    expect(sources[0]?.title).toBe('Welcome Helsinki | City of Helsinki');
    expect(sources[0]?.url).toBe('https://www.hel.fi/en/welcome-helsinki');
    expect(sources[0]?.domain).toBe('hel.fi');
    expect(sources[0]?.highlights[0]).toContain('Have you recently moved to Helsinki?');
  });
  it('handles empty results without fabricated replacements', () => { expect(normalizeExaResponse({ results: [] })).toEqual([]); });
  it('rejects invalid response structure', () => { expect(() => normalizeExaResponse({ error: 'bad' })).toThrow(); });
  it('removes unsafe website URLs and normalizes publication dates', () => { expect(normalizeExaResponse({ results: [{ url: 'javascript:alert(1)' }, { url: 'https://example.org/', publishedDate: '2026-11-14', highlights: [] }] })).toEqual([{ title: 'example.org', url: 'https://example.org/', domain: 'example.org', highlights: [], preview: '', publishedDate: '2026-11-14' }]); });
  it('rejects blank or excessive search inputs', () => { expect(searchInput.safeParse({ query: ' ' }).success).toBe(false); expect(searchInput.safeParse({ query: 'a'.repeat(2001) }).success).toBe(false); });
  it.each([[401, 'credentials'], [403, 'credentials'], [429, 'rate_limit'], [500, 'unavailable']])('handles HTTP %s safely', async (status, error) => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response('provider details must stay private', { status: Number(status) }));
    const result = await requestExa('query', 'test-only-credential', fetcher);
    expect(result).toMatchObject({ ok: false, error });
    expect(JSON.stringify(result)).not.toContain('provider details');
    expect(result).not.toHaveProperty('sources');
  });
  it.each([['TimeoutError', 'timeout'], ['AbortError', 'timeout'], ['TypeError', 'network']])('handles %s safely', async (name, error) => {
    const failure = new Error('internal details'); failure.name = name;
    const result = await requestExa('query', 'test-only-credential', vi.fn<typeof fetch>().mockRejectedValue(failure));
    expect(result).toMatchObject({ ok: false, error });
    expect(JSON.stringify(result)).not.toContain('internal details');
  });
});