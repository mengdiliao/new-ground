import { StickyNote, Check } from 'lucide-react';
import type { Task } from '@/lib/task-data';
import { useNewGround } from '@/lib/task-context';
export function TaskNotes({ task }: { task: Task }) {
  const { updateNotes, storageError, historyReady } = useNewGround();
  return <section className="border-b border-border py-7" aria-labelledby="notes-title"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 id="notes-title" className="flex items-center gap-2 text-base font-semibold"><StickyNote size={18} />Personal notes</h2><span role="status" className={`flex items-center gap-1 text-xs ${storageError ? 'text-destructive' : 'text-sage-foreground'}`}>{storageError ? 'Not saved — keep this page open' : historyReady ? <><Check size={13} />Saved in this browser</> : 'Saving…'}</span></div><textarea aria-label="Personal notes" className="min-h-36 w-full resize-y rounded-lg border border-input bg-card p-3 text-sm leading-6 outline-none focus:border-ring" placeholder="Things to remember…" value={task.notes ?? ''} onChange={event => updateNotes(task.id, event.target.value)} /><p className="mt-2 text-xs text-muted-foreground">Private to this task. Not shared with the assistant or web search.</p></section>;
}
