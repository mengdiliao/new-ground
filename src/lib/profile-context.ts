import { createContext, useContext } from 'react';
import type { Profile } from '@/lib/profile';

export interface ProfileContextValue {
  profile: Profile;
  saveProfile: (profile: Profile) => void;
  profileReady: boolean;
}

// Separate from the refreshable provider so live component updates do not
// replace the context object used by already-mounted consumers.
export const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) throw new Error('Profile provider is missing');
  return context;
}
