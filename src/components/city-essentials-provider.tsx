import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { essentialsStep } from '@/lib/city-essentials.functions';
import { EssentialsContext } from '@/lib/city-essentials-context';
import { categories, essentialKey, loadEssentials, saveEssentials, needsResearch, type EssentialCache, type EssentialCategory, type EssentialModule } from '@/lib/city-essentials';
import { MAX_AGENT_STEPS } from '@/lib/agent';
import { useProfile } from '@/lib/profile-context';
import { moveContext, type MoveProfile } from '@/lib/profile';
import type { Source } from '@/lib/task-data';
import { compactSourceImages } from '@/lib/research-images';

export function CityEssentialsProvider({ children }: { children: ReactNode }) {
  const { activeMove, profileReady } = useProfile();
  const [cache, setCache] = useState<EssentialCache>({});
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState('');
  const ref = useRef(cache);
  const writable = useRef(true);
  const running = useRef(new Set<string>());
  const step = useServerFn(essentialsStep);
  useEffect(() => { try { ref.current = loadEssentials(window.localStorage); setCache(ref.current); } catch { writable.current = false; setStorageError('Saved City Essentials could not be read. New information will last for this visit only.'); } setReady(true); }, []);
  const put = (module: EssentialModule) => {
    ref.current = { ...ref.current, [module.key]: module }; setCache(ref.current);
    if (writable.current) try { saveEssentials(window.localStorage, ref.current); } catch { setStorageError('Your browser could not save City Essentials. Keep this page open to retain them.'); }
  };
  const research = async (move: MoveProfile, category: EssentialCategory) => {
    if (!move.destination) return;
    const key = essentialKey(move, category);
    if (running.current.has(key)) return;
    running.current.add(key);
    const module: EssentialModule = { key, moveId: move.id, category, status: 'loading', items: [] };
    put(module);
    try {
      let state: string | undefined;
      const imageSources = new Map<string, Source>();
      for (let i = 0; i <= MAX_AGENT_STEPS + 1; i++) {
        const result = await step({ data: { category, moveId: move.id, destinationId: move.destination.cityId, request: i === 0 ? { message: 'Research City Essentials', move: moveContext(move) } : { state } } });
        state = result.state;
        for (const source of await compactSourceImages(result.sources ?? [])) if (source.images?.some(image => image.dataUrl)) imageSources.set(source.url, source);
        if (result.done) { put({ ...module, status: result.error ? 'error' : 'success', items: result.items.map(item => ({ ...item, sourceReferences: item.sourceReferences.map(source => ({ ...source, images: imageSources.get(source.url)?.images ?? source.images })) })), researchedAt: result.error ? undefined : new Date().toISOString(), error: result.error }); return; }
        if (!state) break;
      }
      throw new Error('Research limit');
    } catch { put({ ...module, status: 'error', error: 'City research could not finish. Retry when you’re ready.' }); }
    finally { running.current.delete(key); }
  };
  useEffect(() => {
    if (!ready || !profileReady || !activeMove?.destination) return;
    // Claim all categories synchronously; each request remains bounded and saves independently.
    for (const category of categories) if (needsResearch(activeMove, category, ref.current)) void research(activeMove, category);
  }, [ready, profileReady, activeMove]); // Cache updates do not trigger automatic retries.
  return <EssentialsContext.Provider value={{ cache, ready, storageError, refresh: category => { if (activeMove) void research(activeMove, category); } }}>{children}</EssentialsContext.Provider>;
}