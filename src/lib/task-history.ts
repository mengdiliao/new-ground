import type { Task } from './task-data';
export function renameTask(task: Task, title: string): Task { return title.trim() ? { ...task, title: title.trim().slice(0, 120) } : task; }
export function toggleAction(task: Task, action: string): Task {
  if (!task.results?.steps.includes(action)) return task;
  const completed = task.completedActions ?? [];
  return { ...task, completedActions: completed.includes(action) ? completed.filter(item => item !== action) : [...completed, action] };
}
export function answerActions(answer: string): string[] {
  return answer.split('\n').filter(line => /^\s*\d+[.)]\s+\S/.test(line)).map(line => line.replace(/^\s*\d+[.)]\s+/, '').trim());
}
export function updatedLabel(task: Task) { return task.updatedAt ? `Updated ${new Date(task.updatedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}` : 'Just added'; }