import { createContext, useContext, type Context } from 'react';
import type { EssentialCache, EssentialCategory } from './city-essentials';
interface EssentialsValue { cache: EssentialCache; ready: boolean; storageError: string; refresh: (category: EssentialCategory) => void; }
const hot = import.meta.hot;
export const EssentialsContext: Context<EssentialsValue | undefined> = hot?.data?.essentialsContext ?? createContext<EssentialsValue | undefined>(undefined);
if (hot?.data) hot.data.essentialsContext = EssentialsContext;
export function useEssentials() { const value = useContext(EssentialsContext); if (!value) throw new Error('City Essentials provider is missing'); return value; }