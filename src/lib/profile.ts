import type { LocationValue } from './locations';

// Every profile value starts unknown and stays unknown until the user
// explicitly enters or confirms it. Placeholders are never saved.
export type ArrivalPlan = { kind: 'exact'; date: string } | { kind: 'month'; month: string } | { kind: 'unsure' };
export const durationChoices = ['lt3', 'm3-6', 'm6-12', 'gt12', 'indefinite', 'custom', 'unsure'] as const;
export type DurationChoice = typeof durationChoices[number];
export interface DurationPlan { choice: DurationChoice; custom?: string | undefined; }
export interface Profile { origin: LocationValue | null; destination: LocationValue | null; arrival: ArrivalPlan | null; duration: DurationPlan | null; updatedAt?: string | undefined; }
export const detailLabels = { purpose: 'Moving purpose', housing: 'Housing preferences', budget: 'Budget', interests: 'Hobbies and interests', language: 'Language preferences', residency: 'Citizenship or residency circumstances' } as const;
export type MoveDetail = keyof typeof detailLabels;
export interface MoveProfile extends Profile { id: string; createdAt: string; updatedAt: string; status: 'active' | 'archived' | 'completed'; purpose: string | null; confirmedDetails: Partial<Record<MoveDetail, string | undefined>>; }
export interface MoveStore { version: 2; activeMoveId: string | null; moves: MoveProfile[]; }
export const emptyMoveStore: MoveStore = { version: 2, activeMoveId: null, moves: [] };

// Minimal, user-confirmed context: no coordinates, storage timestamps or inferred identity.
export function moveContext(move: MoveProfile) {
  return { origin: move.origin ? { city: move.origin.cityName, country: move.origin.countryName } : null, destination: move.destination ? { city: move.destination.cityName, country: move.destination.countryName } : null, arrival: move.arrival, duration: move.duration, purpose: move.purpose, confirmedDetails: move.confirmedDetails };
}
export type MoveContext = ReturnType<typeof moveContext>;
export function moveRevision(move: MoveProfile): string { return JSON.stringify(moveContext(move)); }
export function putMove(store: MoveStore, profile: Profile, id: string, now: string, makeActive = true): MoveStore {
  const previous = store.moves.find(move => move.id === id);
  const move: MoveProfile = { ...previous, ...profile, id, createdAt: previous?.createdAt ?? now, updatedAt: now, status: makeActive ? 'active' : previous?.status === 'completed' ? 'completed' : 'archived', purpose: previous?.purpose ?? null, confirmedDetails: previous?.confirmedDetails ?? {} };
  const activeMoveId = makeActive ? id : store.activeMoveId === id ? null : store.activeMoveId;
  return { version: 2, activeMoveId, moves: [...store.moves.filter(item => item.id !== id).map(item => item.status === 'active' && item.id !== activeMoveId ? { ...item, status: 'archived' as const } : item), move] };
}
export function activateMove(store: MoveStore, id: string | null): MoveStore {
  if (id && !store.moves.some(move => move.id === id)) return store;
  return { ...store, activeMoveId: id, moves: store.moves.map(move => ({ ...move, status: move.id === id ? 'active' : move.status === 'completed' ? 'completed' : 'archived' })) };
}

export const emptyProfile: Profile = { origin: null, destination: null, arrival: null, duration: null };

export const durationLabels: Record<DurationChoice, string> = {
  'lt3': 'Less than 3 months',
  'm3-6': '3–6 months',
  'm6-12': '6–12 months',
  'gt12': 'More than 1 year',
  'indefinite': 'Indefinite',
  'custom': 'Custom duration',
  'unsure': 'Not sure yet',
};

export function arrivalLabel(profile: Profile): string {
  const arrival = profile.arrival;
  if (!arrival) return 'Arrival date not set';
  if (arrival.kind === 'unsure') return 'Not sure yet';
  if (arrival.kind === 'month') {
    const [year, month] = arrival.month.split('-').map(Number);
    if (!year || !month) return 'Arrival date not set';
    return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  }
  const date = new Date(`${arrival.date}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? 'Arrival date not set' : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export function durationLabel(profile: Profile): string {
  const duration = profile.duration;
  if (!duration) return 'Duration not set';
  if (duration.choice === 'custom') return duration.custom?.trim() ? duration.custom.trim() : 'Custom duration';
  return durationLabels[duration.choice];
}

export function swapLocations(profile: Profile): Profile {
  return { ...profile, origin: profile.destination, destination: profile.origin };
}

export function hasDestination(profile: Profile): boolean {
  return profile.destination !== null;
}
