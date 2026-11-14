import { createContext, useContext } from 'react';
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
export const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) throw new Error('Profile provider is missing');
  return context;
}
