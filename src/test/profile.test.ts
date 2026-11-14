import { describe, it, expect } from 'vitest';
import { emptyProfile, arrivalLabel, durationLabel, swapLocations, hasDestination, type Profile } from '@/lib/profile';
import { loadProfile, saveProfileToStorage, PROFILE_STORAGE_KEY } from '@/lib/profile-storage';
import type { LocationValue } from '@/lib/locations';

const helsinki: LocationValue = { cityId: 658225, cityName: 'Helsinki', countryCode: 'FI', countryName: 'Finland', region: 'Uusimaa', latitude: 60.1695, longitude: 24.9354 };
const copenhagen: LocationValue = { cityId: 2618425, cityName: 'Copenhagen', countryCode: 'DK', countryName: 'Denmark', region: 'Capital Region', latitude: 55.6759, longitude: 12.5655 };

function memoryStorage() {
  const map = new Map<string, string>();
  return { getItem: (key: string) => map.get(key) ?? null, setItem: (key: string, value: string) => { map.set(key, value); } };
}

describe('Profile model', () => {
  it('a completely new user has no preset location, arrival date, or duration', () => {
    expect(emptyProfile.origin).toBeNull();
    expect(emptyProfile.destination).toBeNull();
    expect(emptyProfile.arrival).toBeNull();
    expect(emptyProfile.duration).toBeNull();
    expect(arrivalLabel(emptyProfile)).toBe('Arrival date not set');
    expect(durationLabel(emptyProfile)).toBe('Duration not set');
    expect(hasDestination(emptyProfile)).toBe(false);
  });
  it('never substitutes example values like Copenhagen, Helsinki, or one semester', () => {
    const serialized = JSON.stringify(emptyProfile);
    expect(serialized).not.toContain('Copenhagen');
    expect(serialized).not.toContain('Helsinki');
    expect(serialized).not.toContain('2027-01-15');
  });
  it('swaps origin and destination', () => {
    const profile: Profile = { ...emptyProfile, origin: copenhagen, destination: helsinki };
    const swapped = swapLocations(profile);
    expect(swapped.origin?.cityName).toBe('Helsinki');
    expect(swapped.destination?.cityName).toBe('Copenhagen');
  });
  it('supports exact, approximate, and unsure arrival plans', () => {
    expect(arrivalLabel({ ...emptyProfile, arrival: { kind: 'exact', date: '2027-08-20' } })).toBe('20 August 2027');
    expect(arrivalLabel({ ...emptyProfile, arrival: { kind: 'month', month: '2027-08' } })).toBe('August 2027');
    expect(arrivalLabel({ ...emptyProfile, arrival: { kind: 'unsure' } })).toBe('Not sure yet');
  });
  it('stores the selected duration explicitly, including custom text', () => {
    expect(durationLabel({ ...emptyProfile, duration: { choice: 'm3-6' } })).toBe('3–6 months');
    expect(durationLabel({ ...emptyProfile, duration: { choice: 'indefinite' } })).toBe('Indefinite');
    expect(durationLabel({ ...emptyProfile, duration: { choice: 'custom', custom: 'Two academic years' } })).toBe('Two academic years');
    expect(durationLabel({ ...emptyProfile, duration: { choice: 'unsure' } })).toBe('Not sure yet');
  });
  it('persists a profile and restores it exactly', () => {
    const storage = memoryStorage();
    const profile: Profile = { origin: copenhagen, destination: helsinki, arrival: { kind: 'month', month: '2027-08' }, duration: { choice: 'm6-12' }, updatedAt: new Date().toISOString() };
    saveProfileToStorage(storage, profile);
    expect(loadProfile(storage)).toEqual(profile);
  });
  it('an empty store loads as a fully unknown profile', () => {
    expect(loadProfile(memoryStorage())).toEqual(emptyProfile);
  });
  it('corrupted saved data falls back to unknown values instead of inventing defaults', () => {
    const storage = memoryStorage();
    storage.setItem(PROFILE_STORAGE_KEY, '{"origin":"Copenhagen"}');
    expect(loadProfile(storage)).toEqual(emptyProfile);
  });
  it('free text is never a valid location: only structured selections persist', () => {
    const storage = memoryStorage();
    storage.setItem(PROFILE_STORAGE_KEY, JSON.stringify({ origin: 'Helsin', destination: null, arrival: null, duration: null }));
    expect(loadProfile(storage).origin).toBeNull();
  });
});
