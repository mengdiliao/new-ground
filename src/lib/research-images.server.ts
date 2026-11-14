import { safeImageUrl, type ResearchImage } from './research-images';
// No browser hotlinks or generic image proxy. Only URLs returned by Exa are fetched here.
export async function cacheResearchImage(image: ResearchImage, fetcher: typeof fetch = fetch): Promise<ResearchImage | null> {
  if (!safeImageUrl(image.url)) return null;
  try {
    const response = await fetcher(image.url, { redirect: 'error', signal: AbortSignal.timeout(6000), headers: { Accept: 'image/avif,image/webp,image/png,image/jpeg' } });
    const mime = (response.headers.get('content-type') ?? '').split(';')[0];
    if (!response.ok || !['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(mime ?? '') || Number(response.headers.get('content-length')) > 2000000) return null;
    const reader = response.body?.getReader(); if (!reader) return null;
    const chunks: Uint8Array[] = []; let size = 0;
    while (true) { const { value, done } = await reader.read(); if (done) break; size += value.length; if (size > 2000000) { await reader.cancel(); return null; } chunks.push(value); }
    if (size < 1500) return null;
    const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    let binary = ''; for (const byte of bytes) binary += String.fromCharCode(byte);
    return { ...image, dataUrl: `data:${mime};base64,${btoa(binary)}` };
  } catch { return null; }
}