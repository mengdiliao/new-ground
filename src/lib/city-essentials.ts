import { z } from 'zod';
import type { MoveProfile } from './profile';
import { moveContext } from './profile';
import type { Source } from './task-data';
import { cleanHighlight } from './exa-search';

export const categories = ['moving-requirements', 'find-your-people', 'emergency-essentials', 'arrival-checklist'] as const;
export type EssentialCategory = typeof categories[number];
export const ESSENTIALS_STORAGE_KEY = 'new-ground.city-essentials.v1';
const sourceSchema = z.object({ title: z.string(), url: z.string().url().refine(value => /^https?:\/\//.test(value)), domain: z.string(), highlights: z.array(z.string()), preview: z.string(), publishedDate: z.string().nullable() });
export const researchedItemSchema = z.object({ title: z.string().min(1).max(100), shortSummary: z.string().min(1).max(450), detailedExplanation: z.string().min(1).max(2200), applicabilityStatus: z.enum(['source-supported', 'conditional', 'needs-information']), qualification: z.string().max(600), question: z.string().max(300), actionable: z.boolean(), interest: z.enum(['general', 'sports', 'language', 'volunteering', 'creative', 'professional']), contactNumber: z.string().max(40).nullable(), region: z.string().max(160), sourceNumbers: z.array(z.number().int().positive()).min(1).max(5) });
export const researchItemsSchema = z.object({ items: z.array(researchedItemSchema).max(6) });
export const essentialItemSchema = researchedItemSchema.omit({ sourceNumbers: true }).extend({ id: z.string(), featureCategory: z.enum(categories), destinationId: z.number(), associatedMoveId: z.string(), researchedAt: z.string().datetime(), sourceReferences: z.array(sourceSchema).min(1).max(5) });
export type EssentialItem = z.infer<typeof essentialItemSchema>;
export const moduleSchema = z.object({ key: z.string(), moveId: z.string(), category: z.enum(categories), status: z.enum(['loading', 'success', 'error']), items: z.array(essentialItemSchema).max(6), researchedAt: z.string().datetime().optional(), error: z.string().optional() });
export type EssentialModule = z.infer<typeof moduleSchema>;
export type EssentialCache = Record<string, EssentialModule>;
const cacheSchema = z.object({ version: z.literal(1), modules: z.array(moduleSchema).max(400) });

export function essentialKey(move: MoveProfile, category: EssentialCategory) {
  const context = moveContext(move);
  const details = context.confirmedDetails;
  const relevant = category === 'emergency-essentials' ? { destination: move.destination?.cityId } : category === 'find-your-people' ? { destination: move.destination?.cityId, interests: details.interests, language: details.language } : { ...context, originId: move.origin?.cityId, destinationId: move.destination?.cityId, confirmedDetails: { residency: details.residency, purpose: details.purpose } };
  return JSON.stringify([1, move.id, category, relevant]);
}
export function needsResearch(move: MoveProfile | null, category: EssentialCategory, cache: EssentialCache) { return Boolean(move?.destination && !cache[essentialKey(move, category)]); }
export function normalizeItems(input: unknown, sources: Source[], moveId: string, destinationId: number, category: EssentialCategory, now: string): EssentialItem[] {
  return researchItemsSchema.parse(input).items.flatMap((item, index) => {
    const references = item.sourceNumbers.map(number => sources[number - 1]).filter((source): source is Source => Boolean(source)).map(source => ({ ...source, domain: source.domain ?? new URL(source.url).hostname, highlights: source.highlights ?? [], preview: source.preview ?? '', publishedDate: source.publishedDate ?? null }));
    if (!references.length) return [];
    // Phone numbers must occur in retrieved evidence, not just model output.
    if (item.contactNumber) {
      const digits = item.contactNumber.replace(/[^\d]/g, '');
      if (!digits || !references.some(source => source.highlights.some(text => (text.match(/\+?\d[\d ()-]*\d|\d/g) ?? []).some(number => number.replace(/[^\d]/g, '') === digits)))) return [];
    }
    const needsIdentity = ['moving-requirements', 'arrival-checklist'].includes(category);
    return [{ ...item, title: cleanHighlight(item.title), shortSummary: cleanHighlight(item.shortSummary), sourceReferences: references, applicabilityStatus: needsIdentity && item.applicabilityStatus === 'source-supported' ? 'conditional' as const : item.applicabilityStatus, id: `${moveId}-${category}-${index}-${now}`, featureCategory: category, destinationId, associatedMoveId: moveId, researchedAt: now }];
  });
}
export function loadEssentials(storage: Pick<Storage, 'getItem'>): EssentialCache {
  const raw = storage.getItem(ESSENTIALS_STORAGE_KEY);
  if (!raw) return {};
  const parsed = cacheSchema.parse(JSON.parse(raw));
  return Object.fromEntries(parsed.modules.map(module => [module.key, module.status === 'loading' ? { ...module, status: 'error', error: 'Research was interrupted. Retry when you’re ready.' } : module]));
}
export function saveEssentials(storage: Pick<Storage, 'setItem'>, cache: EssentialCache) { storage.setItem(ESSENTIALS_STORAGE_KEY, JSON.stringify(cacheSchema.parse({ version: 1, modules: Object.values(cache).slice(-400) }))); }
export function isOutdated(module: EssentialModule, now = Date.now()) { return Boolean(module.researchedAt && now - Date.parse(module.researchedAt) > 7 * 86400000); }
export function itemContext(item: EssentialItem) { return `${item.title}: ${item.shortSummary}\n${item.detailedExplanation}\nQualifications: ${item.qualification}\nApplies in: ${item.region}\nResearched: ${item.researchedAt}\nSources: ${item.sourceReferences.map(source => `${source.title}: ${source.url}`).join('\n')}\nPlease check current primary sources and explain how this applies to my confirmed move.`.slice(0, 3900); }