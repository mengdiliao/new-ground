import { useState } from 'react';
import { Search } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { TaskCard } from '@/components/task-card';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { useNewGround } from '@/lib/task-context';
import { historyForType } from '@/lib/task-history';
import { taskStages } from '@/lib/task-data';
import neighborhood from '@/assets/neighborhood-refined.png';
export function TaskHistoryPanel({ compact = false }: { compact?: boolean }) {
  const { tasks, historyReady } = useNewGround();
  const [query, setQuery] = useState(''); const [status, setStatus] = useState('all');
  if (!historyReady) return <p role="status" className="py-6 text-sm text-muted-foreground">Opening your history…</p>;
  return <Tabs defaultValue="task"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><TabsList aria-label="History category"><TabsTrigger value="task">Tasks <span className="ml-2 text-xs">{historyForType(tasks, 'task').length}</span></TabsTrigger><TabsTrigger value="query">Past Queries <span className="ml-2 text-xs">{historyForType(tasks, 'query').length}</span></TabsTrigger></TabsList>{!compact && <label className="flex items-center gap-2 rounded-md border border-input bg-card px-3 py-2"><Search size={15} className="text-muted-foreground" /><input aria-label="Search history" placeholder="Search history…" className="w-36 bg-transparent text-sm outline-none" value={query} onChange={event => setQuery(event.target.value)} /></label>}</div>{(['task', 'query'] as const).map(type => {
    const filtered = historyForType(tasks, type).filter(task => (type === 'query' || status === 'all' || task.status === status) && `${task.title} ${task.description} ${task.notes ?? ''}`.toLowerCase().includes(query.toLowerCase()));
    return <TabsContent key={type} value={type}>{!compact && type === 'task' && <div className="mb-5 max-w-52"><Select value={status} onValueChange={setStatus}><SelectTrigger aria-label="Filter task status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{taskStages.map(stage => <SelectItem key={stage} value={stage}>{stage}</SelectItem>)}</SelectContent></Select></div>}<div className="task-grid">{(compact ? filtered.slice(0, 3) : filtered).map(task => <TaskCard task={task} key={task.id} />)}</div>{!filtered.length && <div className={compact ? 'py-7 text-center' : 'py-12 text-center'}>{!compact && <img src={neighborhood} alt="A miniature neighborhood ready for a fresh start" className="empty-world" width={1536} height={1024} />}<h3 className="text-base font-medium">{query || status !== 'all' && type === 'task' ? 'No matching conversations' : type === 'task' ? 'No tracked tasks yet' : 'No past queries yet'}</h3><p className="mt-2 text-sm text-muted-foreground">{type === 'task' ? 'Start a task when you have something to work toward.' : 'Your questions and follow-ups will stay here.'}</p>{(query || status !== 'all') && <Button variant="link" onClick={() => { setQuery(''); setStatus('all'); }}>Clear filters</Button>}</div>}</TabsContent>;
  })}</Tabs>;
}
