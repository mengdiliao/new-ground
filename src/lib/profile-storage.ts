import { z } from 'zod';
import { durationChoices, emptyProfile, type Profile } from './profile';
import type { TaskStorage } from './task-storage';

export const PROFILE_STORAGE_KEY = 'new-ground.profile.v1';

const location = z.object({
  cityId: z.number().int(),
  cityName: z.string().min(1),
  countryCode: z.string().regex(/^[A-Z]{2}$/),
  countryName: z.string().min(1),
  region: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

const savedProfile = z.object({
  origin: location.nullable(),
  destination: location.nullable(),
  arrival: z.union([
    z.object({ kind: z.literal('exact'), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }),
    z.object({ kind: z.literal('month'), month: z.string().regex(/^\d{4}-\d{2}$/) }),
    z.object({ kind: z.literal('unsure') }),
  ]).nullable(),
  duration: z.object({ choice: z.enum(durationChoices), custom: z.string().max(120).optional() }).nullable(),
  updatedAt: z.string().datetime().optional(),
});

export function loadProfile(storage: TaskStorage): Profile {
  const raw = storage.getItem(PROFILE_STORAGE_KEY);
  if (!raw) return emptyProfile;
  const result = savedProfile.safeParse(JSON.parse(raw));
  return result.success ? result.data : emptyProfile;
}

export function saveProfileToStorage(storage: TaskStorage, profile: Profile) {
  storage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(savedProfile.parse(profile)));
}
