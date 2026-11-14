import { createContext, useContext, type Context } from 'react';
import type { Profile, MoveProfile, MoveDetail } from '@/lib/profile';

export interface ProfileContextValue {
  profile: Profile;
  saveProfile: (profile: Profile) => void;
  profileReady: boolean;
  activeMove: MoveProfile | null;
  moves: MoveProfile[];
  storageError: string;
  saveMove: (profile: Profile, id?: string, makeActive?: boolean) => void;
  switchMove: (id: string | null) => void;
  confirmDetail: (id: string, key: MoveDetail, value: string) => void;
  completeMove: (id: string) => void;
}

// Separate from the refreshable provider so live component updates do not
// replace the context object used by already-mounted consumers.
// Preserve identity during live edits; never put profile values in this cache.
const hot = import.meta.hot;
export const ProfileContext: Context<ProfileContextValue | undefined> = hot?.data?.profileContext ?? createContext<ProfileContextValue | undefined>(undefined);
if (hot?.data) hot.data.profileContext = ProfileContext;

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) throw new Error('Profile provider is missing');
  return context;
}
