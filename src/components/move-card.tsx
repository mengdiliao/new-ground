import { useState } from 'react';
import { ArrowRight, MapPin, Pencil, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { MoveSetup } from '@/components/move-setup';
import { useProfile } from '@/lib/profile-context';
import { arrivalLabel, durationLabel } from '@/lib/profile';
import { locationLabel } from '@/lib/locations';

export function MoveCard() {
  const { activeMove, moves, saveMove, switchMove, profileReady, storageError } = useProfile();
  const [mode, setMode] = useState<'edit' | 'new' | null>(null);
  if (!profileReady) return null;
  return <section className="move-card" aria-labelledby="move-heading">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 id="move-heading" className="flex items-center gap-2 text-base font-semibold"><MapPin size={17} className="text-primary" />{activeMove ? 'Current Move' : 'Set up your move'}</h2>{activeMove && <div className="flex gap-1"><Button variant="ghost" className="h-8 px-2 text-xs" onClick={() => setMode('edit')}><Pencil size={13} />Edit Move</Button><Button variant="ghost" className="h-8 px-2 text-xs" onClick={() => setMode('new')}><Plus size={13} />New Move</Button></div>}</div>
    {activeMove ? <><p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium">{activeMove.origin && <>{locationLabel(activeMove.origin)}<ArrowRight size={14} className="text-primary" /></>}{activeMove.destination && locationLabel(activeMove.destination)}</p><div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">{activeMove.arrival && activeMove.arrival.kind !== 'unsure' && <span>Arrival: {arrivalLabel(activeMove)}</span>}{activeMove.duration && activeMove.duration.choice !== 'unsure' && <span>Duration: {durationLabel(activeMove)}</span>}</div></> : <><p className="mt-2 text-sm text-muted-foreground">A new chapter starts here. Add your destination; the rest can wait.</p><MoveSetup onSave={(profile, active) => saveMove(profile, undefined, active)} /></>}
    {moves.length > 0 && <div className="mt-3 flex flex-wrap items-center gap-2"><label htmlFor="current-move" className="text-xs text-muted-foreground">Your moves</label><select id="current-move" value={activeMove?.id ?? ''} className="min-w-0 max-w-full rounded-lg border border-input bg-background px-2 py-1 text-xs" onChange={event => switchMove(event.target.value || null)}><option value="">No current move</option>{moves.map(move => <option key={move.id} value={move.id}>{move.destination ? locationLabel(move.destination) : 'Move'} · {move.status}</option>)}</select></div>}
    <p className="mt-3 text-[11px] text-muted-foreground">Saved in this browser only.</p>{storageError && <p role="alert" className="mt-2 text-xs text-destructive">{storageError}</p>}
    <Dialog open={mode !== null} onOpenChange={open => { if (!open) setMode(null); }}><DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl"><DialogHeader><DialogTitle>{mode === 'edit' ? 'Edit Move' : 'New Move'}</DialogTitle><DialogDescription>{mode === 'edit' ? 'Past conversations and checked steps stay unchanged.' : 'Start fresh. Your previous moves and research stay saved.'}</DialogDescription></DialogHeader>{mode && <MoveSetup key={`${mode}-${activeMove?.id}`} initial={mode === 'edit' ? activeMove ?? undefined : undefined} allowActivation={mode === 'new'} onCancel={() => setMode(null)} onSave={(profile, active) => { saveMove(profile, mode === 'edit' ? activeMove?.id : undefined, active); setMode(null); }} />}</DialogContent></Dialog>
  </section>;
}