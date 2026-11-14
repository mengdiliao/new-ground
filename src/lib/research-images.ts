import { z } from 'zod';
export const researchImageSchema = z.object({ url: z.string().url(), sourceUrl: z.string().url(), sourceTitle: z.string(), alt: z.string(), kind: z.enum(['page', 'content']), dataUrl: z.string().regex(/^data:image\/(jpeg|png|webp|avif);base64,/).optional() });
export type ResearchImage = z.infer<typeof researchImageSchema>;
export function safeImageUrl(value: string) {
  try { const url = new URL(value); const host = url.hostname.toLowerCase(); if (url.protocol !== 'https:' || url.username || url.password || url.port || !host.includes('.') || host === 'localhost' || /(^|\.)(local|internal|localhost)$/.test(host) || /^[\d.]+$/.test(host) || host.includes(':')) return null; return url.href; } catch { return null; }
}
export function imageCandidates(result: { url: string; title?: string | null | undefined; image?: string | null | undefined; extras?: { imageLinks?: string[] | null | undefined; richImageLinks?: { url: string; alt?: string | undefined }[] | null | undefined } | null | undefined }): ResearchImage[] {
  const seen = new Set<string>();
  return [...(result.extras?.richImageLinks ?? []).map(image => ({ ...image, kind: 'content' as const })), ...(result.image ? [{ url: result.image, alt: '', kind: 'page' as const }] : [])].flatMap(image => {
    const url = safeImageUrl(image.url); const alt = image.alt?.trim() ?? '';
    if (!url || seen.has(url) || /logo|favicon|sprite|pixel|tracking|badge|avatar|icon|placeholder|\.svg(?:\?|$)/i.test(`${url} ${alt}`)) return [];
    if (image.kind === 'content' && (!alt || !alt.toLowerCase().split(/\W+/).some(word => word.length > 3 && (result.title ?? '').toLowerCase().includes(word)))) return [];
    seen.add(url); return [{ url, alt, kind: image.kind, sourceUrl: result.url, sourceTitle: result.title ?? new URL(result.url).hostname }];
  }).slice(0, 2);
}
export function selectedImages(sources: { images?: ResearchImage[] | undefined }[], refs: number[] = sources.map((_, i) => i + 1)) {
  const seen = new Set<string>(); return refs.flatMap(number => sources[number - 1]?.images ?? []).filter(image => { if (!image.dataUrl || seen.has(image.url)) return false; seen.add(image.url); return true; }).slice(0, 3);
}