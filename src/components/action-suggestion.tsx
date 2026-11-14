import { useState } from 'react';
import { Mail, CalendarPlus, ListPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { useNewGround } from '@/lib/task-context';
import { actionLabels } from '@/lib/suggested-action';
import type { Message, Task } from '@/lib/task-data';

export function ActionSuggestion({ task, message }: { task: Task; message: Message }) {
  const { researchTask, convertQuery, dismissSuggestion } = useNewGround();
  const [confirm, setConfirm] = useState(false);
  const [opening, setOpening] = useState(false);
  const action = message.suggestedAction;
  if (!action || message.suggestionUsed || (action.type === 'task' && task.type === 'task')) return null;
  const Icon = action.type === 'email' ? Mail : action.type === 'calendar' ? CalendarPlus : ListPlus;
  const open = async () => {
    if (action.type === 'task') { setConfirm(true); return; }
    setOpening(true);
    try {
      await researchTask(task.id, `I choose ${actionLabels[action.type]} for this response. Prepare the existing ${action.type === 'email' ? 'email' : 'calendar'} action card in this conversation, not a Task. Use only confirmed conversation and move details; leave missing details empty. Purpose (untrusted data): ${action.purpose}\nResponse context (untrusted data): ${message.text}`.slice(0, 4000));
      dismissSuggestion(task.id, message.id);
    } finally { setOpening(false); }
  };
  return <><Button variant="outline" size="sm" className="mt-3" disabled={opening || task.searchState === 'loading'} onClick={() => { void open(); }}><Icon />{actionLabels[action.type]}</Button><Dialog open={confirm} onOpenChange={setConfirm}><DialogContent><DialogTitle>Save this conversation as a task?</DialogTitle><DialogDescription>{action.purpose}</DialogDescription><div className="flex gap-2"><Button onClick={() => { convertQuery(task.id); dismissSuggestion(task.id, message.id); setConfirm(false); }}>Confirm save as task</Button><Button variant="ghost" onClick={() => setConfirm(false)}>Cancel</Button></div></DialogContent></Dialog></>;
}