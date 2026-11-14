import { ArrowUpRight, Sprout, Scale, Map, CircleCheck, Circle, Files, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from '@tanstack/react-router';
import type { Task } from '@/lib/task-data';
export const categoryStyles = { support: 'bg-sage text-sage-foreground', compare: 'bg-lilac text-lilac-foreground', process: 'bg-sky text-sky-foreground', plan: 'bg-peach text-peach-foreground' };
const icons: Record<Task['category'], LucideIcon> = { support: Sprout, compare: Scale, process: Files, plan: Map };
export function Status({ task }: { task: Task }) { return <span className={`status status-${task.status === 'Reviewing' ? 'researching' : task.status.toLowerCase()}`}>{task.status === 'Completed' ? <CircleCheck size={11} /> : <Circle size={7} fill="currentColor" />}{task.status}</span>; }
export function TaskCard({ task }: { task: Task }) {
  const navigate = useNavigate(); const Icon = icons[task.category];
  return <Button variant="task" className="task-card" onClick={() => navigate({ to: '/tasks/$taskId', params: { taskId: task.id } })}>
    <span className="flex items-center justify-between"><span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${categoryStyles[task.category]}`}><Icon size={18} /></span><Status task={task} /></span>
    <span className="mt-3 text-sm font-semibold">{task.title}</span>
    <span className="text-xs font-normal leading-relaxed text-muted-foreground">{task.description}</span>
    <span className="mt-auto flex items-center justify-between pt-3 text-xs font-normal text-muted-foreground"><span>{task.demo ? 'Demo task' : 'Just added'}</span><ArrowUpRight size={14} /></span>
  </Button>;
}