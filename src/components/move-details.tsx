import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/lib/profile-context';
import { detailLabels, type MoveDetail } from '@/lib/profile';

export function MoveDetails() {
  const { activeMove, confirmDetail, completeMove } = useProfile();
  const [key, setKey] = useState<MoveDetail>('purpose');
  const [value, setValue] = useState('');
  if (!activeMove) return null;
  return <section className="mt-6 border-t border-border pt-5"><details><summary className="cursor-pointer text-sm font-semibold">Confirmed preferences · optional</summary><dl className="mt-4 space-y-2 text-sm">{Object.entries(activeMove.confirmedDetails).filter(([, value]) => value).map(([key, value]) => <div key={key}><dt className="text-xs text-muted-foreground">{detailLabels[key as MoveDetail]}</dt><dd>{value}</dd></div>)}</dl><form className="mt-4 grid gap-3" onSubmit={event => { event.preventDefault(); confirmDetail(activeMove.id, key, value); setValue(''); }}><label className="text-xs text-muted-foreground" htmlFor="detail-key">Save only what you want reused for this move</label><select id="detail-key" className="move-fact-input" value={key} onChange={event => { const next = Object.keys(detailLabels).find(key => key === event.target.value) as MoveDetail | undefined; if (next) { setKey(next); setValue(''); } }}>{Object.entries(detailLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><input aria-label="Confirmed preference" className="move-fact-input" maxLength={300} value={value} placeholder={activeMove.confirmedDetails[key] ?? 'Not set'} onChange={event => setValue(event.target.value)} /><Button type="submit" variant="outline" className="justify-self-start" disabled={!value.trim()}>Confirm and save</Button></form></details><Button variant="ghost" className="mt-4 px-0 text-xs" onClick={() => completeMove(activeMove.id)}>Mark move completed</Button></section>;
}