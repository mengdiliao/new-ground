import { useEffect, useRef, useState, type ReactNode } from 'react';
import { emptyProfile, emptyMoveStore, putMove, activateMove, type Profile, type MoveStore, type MoveDetail } from '@/lib/profile';
import { ProfileContext } from '@/lib/profile-context';
import { loadMoveStore, saveMoveStore } from '@/lib/profile-storage';

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<MoveStore>(emptyMoveStore);
  const storeRef = useRef(store);
  const [storageError, setStorageError] = useState('');
  const [profileReady, setProfileReady] = useState(false);
  const writable = useRef(true);
  useEffect(() => {
    try { const loaded = loadMoveStore(window.localStorage); storeRef.current = loaded; setStore(loaded); }
    catch { writable.current = false; setStorageError('Your saved moves could not be read. Changes will last only for this visit.'); }
    setProfileReady(true);
  }, []);
  const persist = (next: MoveStore) => {
    storeRef.current = next;
    setStore(next);
    if (!writable.current) return;
    try { saveMoveStore(window.localStorage, next); setStorageError(''); }
    catch { writable.current = false; setStorageError('This browser could not save your move. Changes will last only for this visit.'); }
  };
  const saveMove = (next: Profile, id?: string, makeActive = true) => persist(putMove(storeRef.current, next, id ?? crypto.randomUUID(), new Date().toISOString(), makeActive));
  const activeMove = store.moves.find(move => move.id === store.activeMoveId) ?? null;
  const confirmDetail = (id: string, key: MoveDetail, value: string) => {
    const clean = value.trim().slice(0, 300);
    persist({ ...storeRef.current, moves: storeRef.current.moves.map(move => move.id !== id ? move : { ...move, updatedAt: new Date().toISOString(), ...(key === 'purpose' ? { purpose: clean || null } : {}), confirmedDetails: { ...move.confirmedDetails, [key]: clean || undefined } }) });
  };
  return <ProfileContext.Provider value={{ profile: activeMove ?? emptyProfile, activeMove, moves: store.moves, storageError, saveMove, saveProfile: next => saveMove(next, storeRef.current.activeMoveId ?? undefined), switchMove: id => persist(activateMove(storeRef.current, id)), confirmDetail, completeMove: id => persist({ ...storeRef.current, activeMoveId: storeRef.current.activeMoveId === id ? null : storeRef.current.activeMoveId, moves: storeRef.current.moves.map(move => move.id === id ? { ...move, status: 'completed' as const, updatedAt: new Date().toISOString() } : move) }), profileReady }}>{children}</ProfileContext.Provider>;
}
