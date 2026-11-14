import { MessageCircle, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ConversationType } from '@/lib/task-data';
export function ConversationChoice({ value, onChange }: { value: ConversationType; onChange: (value: ConversationType) => void }) {
  return <div className="mb-3 flex flex-wrap gap-2" aria-label="Conversation type"><Button type="button" size="sm" variant={value === 'query' ? 'secondary' : 'ghost'} aria-pressed={value === 'query'} title="Ask a question, with follow-ups" onClick={() => onChange('query')}><MessageCircle size={15} />Quick Question</Button><Button type="button" size="sm" variant={value === 'task' ? 'secondary' : 'ghost'} aria-pressed={value === 'task'} title="Keep a plan, status, and personal notes" onClick={() => onChange('task')}><ListChecks size={15} />Start a Task</Button></div>;
}
