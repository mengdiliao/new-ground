import { useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { CalendarPlus, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { CalendarActionCard } from '@/components/calendar-action-card';
import { agentStep } from '@/lib/agent.functions';
import { MAX_AGENT_STEPS } from '@/lib/agent';
import { emptyCalendar, type CalendarDraft } from '@/lib/calendar-draft';
import { useProfile } from '@/lib/profile-context';
import { moveContext } from '@/lib/profile';
import type { Source } from '@/lib/task-data';

export function AddToCalendar({ title, context, sources = [], onPrepare }: { title: string; context: string; sources?: Source[]; onPrepare?: () => void }) {
  const [draft, setDraft] = useState<CalendarDraft | null>(null); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const step = useServerFn(agentStep); const { activeMove } = useProfile();
  const prepare = async () => {
    if (onPrepare) { onPrepare(); return; }
    const id = crypto.randomUUID(); setDraft({ ...emptyCalendar, id, title: title.slice(0, 300), description: context.slice(0, 18000), sourceUrl: sources[0]?.url ?? '' }); setBusy(true); setError('');
    try { let state: string | undefined; for (let index = 0; index <= MAX_AGENT_STEPS + 1; index++) {
      const result = await step({ data: index === 0 ? { message: `Prepare a tentative calendar draft from this information. Never assume a booking, date, time or address. Leave missing fields empty and ask for what is missing.\n${context}`.slice(0, 4000), move: activeMove ? moveContext(activeMove) : null, initialSources: sources.map(({ title, url, preview }) => ({ title, url, preview })).slice(0, 15) } : { state } });
      state = result.state; if (result.done) { if (result.calendarAction) setDraft({ ...result.calendarAction, id }); else setError(result.error ?? result.answer ?? 'Supply the event date and time below.'); return; } if (!state) throw new Error('Missing state');
    } throw new Error('Limit'); } catch { setError('The assistant could not prepare this event. You can fill in the details below.'); } finally { setBusy(false); }
  };
  return <><Button variant="outline" size="sm" onClick={() => { void prepare(); }}><CalendarPlus />Add to Calendar</Button><Dialog open={Boolean(draft)} onOpenChange={open => { if (!open && !busy) setDraft(null); }}><DialogContent className="max-h-[90dvh] w-[calc(100%-24px)] max-w-xl overflow-y-auto"><DialogTitle>Prepare a calendar event</DialogTitle><DialogDescription>Review the details before opening your calendar.</DialogDescription>{busy && <p role="status" className="flex items-center gap-2 text-xs text-muted-foreground"><LoaderCircle size={14} className="animate-spin" />Preparing event details…</p>}{error && <p role="alert" className="text-xs text-muted-foreground">{error}</p>}{draft && <CalendarActionCard draft={draft} busy={busy} onEdit={setDraft} onCancel={() => setDraft(null)} />}</DialogContent></Dialog></>;
}