import { z } from 'zod';
import { durationChoices, emptyProfile, emptyMoveStore, type Profile, type MoveStore } from './profile';
import type { TaskStorage } from './task-storage';

export const PROFILE_STORAGE_KEY = 'new-ground.profile.v1';

export const locationSchema = z.object({
  cityId: z.number().int(),
  cityName: z.string().min(1),
  countryCode: z.string().regex(/^[A-Z]{2}$/),
  countryName: z.string().min(1),
  region: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

const savedProfile = z.object({
  origin: locationSchema.nullable(),
  destination: locationSchema.nullable(),
  arrival: z.union([
    z.object({ kind: z.literal('exact'), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }),
    z.object({ kind: z.literal('month'), month: z.string().regex(/^\d{4}-\d{2}$/) }),
    z.object({ kind: z.literal('unsure') }),
  ]).nullable(),
  duration: z.object({ choice: z.enum(durationChoices), custom: z.string().max(120).optional() }).nullable(),
  updatedAt: z.string().datetime().optional(),
});
export const confirmedDetailsSchema = z.object({ purpose: z.string().max(300).optional(), housing: z.string().max(300).optional(), budget: z.string().max(300).optional(), interests: z.string().max(300).optional(), language: z.string().max(300).optional(), residency: z.string().max(300).optional() });
const savedMove = savedProfile.extend({ id: z.string().min(1), createdAt: z.string().datetime(), updatedAt: z.string().datetime(), status: z.enum(['active', 'archived', 'completed']), purpose: z.string().max(300).nullable(), confirmedDetails: confirmedDetailsSchema });
const savedStore = z.object({ version: z.literal(2), activeMoveId: z.string().nullable(), moves: z.array(savedMove).max(100) }).refine(store => store.moves.filter(move => move.status === 'active').length === (store.activeMoveId ? 1 : 0) && (!store.activeMoveId || store.moves.some(move => move.id === store.activeMoveId && move.status === 'active')) && new Set(store.moves.map(move => move.id)).size === store.moves.length);
export function loadMoveStore(storage: TaskStorage): MoveStore {
  const raw = storage.getItem(PROFILE_STORAGE_KEY);
  if (!raw) return emptyMoveStore;
  const value: unknown = JSON.parse(raw);
  const store = savedStore.safeParse(value);
  if (store.success) return store.data;
  const legacy = savedProfile.safeParse(value);
  if (!legacy.success || !legacy.data.destination) return emptyMoveStore;
  const now = legacy.data.updatedAt ?? new Date().toISOString();
  return { version: 2, activeMoveId: 'legacy-move', moves: [{ ...legacy.data, id: 'legacy-move', createdAt: now, updatedAt: now, status: 'active', purpose: null, confirmedDetails: {} }] };
}
export function saveMoveStore(storage: TaskStorage, store: MoveStore) { storage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(savedStore.parse(store))); }

export function loadProfile(storage: TaskStorage): Profile {
  const raw = storage.getItem(PROFILE_STORAGE_KEY);
  if (!raw) return emptyProfile;
  const store = savedStore.safeParse(JSON.parse(raw));
  if (store.success) return store.data.moves.find(move => move.id === store.data.activeMoveId) ?? emptyProfile;
  const result = savedProfile.safeParse(JSON.parse(raw));
  return result.success ? result.data : emptyProfile;
}

export function saveProfileToStorage(storage: TaskStorage, profile: Profile) {
  storage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(savedProfile.parse(profile)));
}
