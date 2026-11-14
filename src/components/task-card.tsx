import { ArrowUpRight, Sprout, Scale, Map, CircleCheck, Circle, Clock, StickyNote, MessageCircle, Files, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from '@tanstack/react-router';
import type { Task } from '@/lib/task-data';
import { updatedLabel, cardPreview } from '@/lib/task-history';
export const categoryStyles = { support: 'bg-sage text-sage-foreground', compare: 'bg-lilac text-lilac-foreground', process: 'bg-sky text-sky-foreground', plan: 'bg-peach text-peach-foreground' };
const icons: Record<Task['category'], LucideIcon> = { support: Sprout, compare: Scale, process: Files, plan: Map };
export function Status({ task }: { task: Task }) {
  if (task.type === 'query') return <span className="status status-not-started"><MessageCircle size={12} />Quick Query</span>;
  const status = task.status ?? 'Not Started'; const Icon = status === 'Completed' ? CircleCheck : status === 'Waiting' ? Clock : Circle;
  return <span className={`status status-${status.toLowerCase().replace(/ /g, '-')}`}><Icon size={12} />{status}</span>;
}
export function TaskCard({ task }: { task: Task }) {
  const navigate = useNavigate(); const Icon = icons[task.category]; const preview = cardPreview(task);
  return <Button variant="task" className="task-card" onClick={() => navigate({ to: '/tasks/$taskId', params: { taskId: task.id } })}>
    <span className="flex items-center justify-between"><span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${categoryStyles[task.category]}`}><Icon size={18} /></span><Status task={task} /></span>
    <span className="mt-3 line-clamp-2 break-words text-sm font-semibold">{task.title}</span>
    {preview && <span className="line-clamp-2 break-words text-xs font-normal leading-relaxed text-muted-foreground">{preview}</span>}{task.type === 'task' && task.notes?.trim() && <span className="flex items-center gap-1 text-xs font-normal text-muted-foreground"><StickyNote size={12} />Notes</span>}
    <span className="mt-auto flex items-center justify-between gap-2 pt-3 text-xs font-normal text-muted-foreground"><span className="min-w-0 whitespace-normal break-words">{task.demo ? 'Demo task' : updatedLabel(task)}</span><ArrowUpRight size={14} className="shrink-0" /></span>
  </Button>;
}