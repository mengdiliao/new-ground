import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConversationChoice } from '@/components/conversation-choice';
import { TaskHistoryPanel } from '@/components/task-history-panel';
import type { ConversationType } from '@/lib/task-data';
import { useNewGround } from '@/lib/task-context';
export const Route = createFileRoute('/tasks')({ head: () => ({ meta: [{ title: 'Task History — New Ground' }, { name: 'description', content: 'Revisit your questions and keep tracked tasks, research, and personal notes together.' }, { property: 'og:title', content: 'Task History — New Ground' }, { property: 'og:description', content: 'A little progress, every day. Your plans and next steps.' }, { property: 'og:type', content: 'website' }, { name: 'twitter:card', content: 'summary_large_image' }] }), component: Tasks });
function Tasks() {
  const { newTask } = useNewGround(); const navigate = useNavigate(); const [type, setType] = useState<ConversationType>('query');
  return <main className="page-content soft-enter"><div className="mb-8 flex flex-wrap items-start justify-between gap-4"><h1 className="font-display text-3xl font-semibold">Task History</h1><div><ConversationChoice value={type} onChange={setType} /><Button onClick={() => { const task = newTask(type); void navigate({ to: '/tasks/$taskId', params: { taskId: task.id } }); }}><Plus />{type === 'task' ? 'Start a Task' : 'Ask a Question'}</Button></div></div><TaskHistoryPanel /></main>;
}
