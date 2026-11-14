import type { Task, TaskStatus, ConversationType } from './task-data';
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
export function convertToTask(task: Task): Task { return task.type === 'task' ? task : { ...task, type: 'task', status: 'Not Started', notes: '' }; }
export function changeTaskStatus(task: Task, status: TaskStatus): Task { return task.type === 'task' ? { ...task, status } : task; }
export function updateTaskNotes(task: Task, notes: string): Task { return task.type === 'task' ? { ...task, notes } : task; }
export function historyForType(tasks: Task[], type: ConversationType): Task[] { return tasks.filter(task => !task.demo && task.type === type).sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '')); }
export function cardPreview(task: Task): string { const reply = [...task.messages].reverse().find(message => message.role === 'assistant'); return reply?.text.replace(/[#*_`]/g, '').replace(/\s+/g, ' ').trim() ?? (task.description.trim() !== task.title.trim() && !task.description.trim().startsWith(task.title.replace(/…$/, '')) ? task.description.trim() : ''); }
