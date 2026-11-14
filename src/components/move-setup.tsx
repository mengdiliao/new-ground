import { useState } from 'react';
import { ArrowLeftRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LocationPicker } from '@/components/location-picker';
import { emptyProfile, durationChoices, durationLabels, swapLocations, type Profile } from '@/lib/profile';

export function MoveSetup({ initial = emptyProfile, onSave, onCancel, allowActivation = false }: { initial?: Profile; onSave: (profile: Profile, active: boolean) => void; onCancel?: () => void; allowActivation?: boolean }) {
  const [draft, setDraft] = useState<Profile>(initial);
  const [active, setActive] = useState(true);
  const [error, setError] = useState('');
  const mode = draft.arrival?.kind ?? 'exact';
  return <form onSubmit={event => { event.preventDefault(); if (!draft.destination) { setError('Choose a destination to save your move.'); return; } onSave(draft, active); }}>
    <div className="journey-row">
      <LocationPicker id="setup-origin" label="Moving from" value={draft.origin} onSelect={origin => setDraft({ ...draft, origin })} placeholder="Where from?" />
      <Button type="button" variant="outline" size="icon" className="journey-swap" aria-label="Swap origin and destination" title="Swap origin and destination" onClick={() => setDraft(swapLocations(draft))}><ArrowLeftRight size={15} /></Button>
      <LocationPicker id="setup-destination" label="Moving to" value={draft.destination} onSelect={destination => { setDraft({ ...draft, destination }); setError(''); }} placeholder="Where to?" />
    </div>
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      <div><label htmlFor="arrival-mode" className="move-fact-label">Arrival · optional</label><select id="arrival-mode" className="move-fact-input" value={mode} onChange={event => setDraft({ ...draft, arrival: event.target.value === 'unsure' ? { kind: 'unsure' } : event.target.value === 'month' ? { kind: 'month', month: '' } : null })}><option value="exact">Exact date</option><option value="month">Approximate month</option><option value="unsure">Not sure yet</option></select>{mode !== 'unsure' && <input aria-label={mode === 'month' ? 'Arrival month' : 'Arrival date'} className="move-fact-input" type={mode === 'month' ? 'month' : 'date'} value={draft.arrival?.kind === 'exact' ? draft.arrival.date : draft.arrival?.kind === 'month' ? draft.arrival.month : ''} onChange={event => setDraft({ ...draft, arrival: event.target.value ? mode === 'month' ? { kind: 'month', month: event.target.value } : { kind: 'exact', date: event.target.value } : null })} />}</div>
      <div><label htmlFor="setup-duration" className="move-fact-label">Duration · optional</label><select id="setup-duration" className="move-fact-input" value={draft.duration?.choice ?? ''} onChange={event => { const choice = durationChoices.find(choice => choice === event.target.value); setDraft({ ...draft, duration: choice ? { choice } : null }); }}><option value="">Not set</option>{durationChoices.map(choice => <option key={choice} value={choice}>{durationLabels[choice]}</option>)}</select>{draft.duration?.choice === 'custom' && <input aria-label="Custom duration" maxLength={120} className="move-fact-input" value={draft.duration.custom ?? ''} onChange={event => setDraft({ ...draft, duration: { choice: 'custom', custom: event.target.value } })} />}</div>
    </div>
    {allowActivation && <label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" checked={active} onChange={event => setActive(event.target.checked)} />Make this my current move</label>}
    {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
    <div className="mt-5 flex flex-wrap gap-2"><Button type="submit"><Check size={15} />Save my move</Button>{onCancel && <Button variant="ghost" type="button" onClick={onCancel}>Cancel</Button>}</div>
  </form>;
}