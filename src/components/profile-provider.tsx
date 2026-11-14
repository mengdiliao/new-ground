import { useEffect, useRef, useState, type ReactNode } from 'react';
import { emptyProfile, type Profile } from '@/lib/profile';
import { ProfileContext } from '@/lib/profile-context';
import { loadProfile, saveProfileToStorage } from '@/lib/profile-storage';

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [profileReady, setProfileReady] = useState(false);
  const writable = useRef(true);
  useEffect(() => {
    try { setProfile(loadProfile(window.localStorage)); }
    catch { writable.current = false; }
    setProfileReady(true);
  }, []);
  const saveProfile = (next: Profile) => {
    const stamped = { ...next, updatedAt: new Date().toISOString() };
    setProfile(stamped);
    if (!writable.current) return;
    try { saveProfileToStorage(window.localStorage, stamped); }
    catch { writable.current = false; }
  };
  return <ProfileContext.Provider value={{ profile, saveProfile, profileReady }}>{children}</ProfileContext.Provider>;
}
