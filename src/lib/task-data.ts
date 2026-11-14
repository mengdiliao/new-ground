export const taskStages = ['Not Started', 'In Progress', 'Waiting', 'Completed'] as const;
export type TaskStatus = typeof taskStages[number];
export type ConversationType = 'query' | 'task';
export interface Message { id: string; role: 'user' | 'assistant'; text: string; calendarDraft?: import('./calendar-draft').CalendarDraft | undefined; emailDraft?: import('./email-draft').EmailDraft | undefined; images?: import('./research-images').ResearchImage[] | undefined; }
export interface Source { title: string; preview: string; url: string; domain?: string | undefined; highlights?: string[] | undefined; publishedDate?: string | null | undefined; images?: import('./research-images').ResearchImage[] | undefined; }
export interface Results { summary: string; options: string[]; steps: string[]; }
export interface Task { id: string; title: string; description: string; type: ConversationType; status?: TaskStatus | undefined; notes?: string | undefined; category: 'support' | 'compare' | 'process' | 'plan'; demo: boolean; messages: Message[]; draft: string; sources: Source[]; results?: Results | undefined; searchState?: 'idle' | 'loading' | 'success' | 'error' | undefined; searchError?: string | undefined; agentState?: string | undefined; agentStage?: import('./agent').AgentStage | undefined; searchRounds?: number | undefined; researchPlan?: string | undefined; createdAt?: string; updatedAt?: string; completedActions?: string[]; moveId?: string | null | undefined; moveRevision?: string | undefined; moveSnapshot?: import('./profile').MoveContext | null | undefined; }
const samples: Omit<Task, 'messages' | 'draft' | 'sources' | 'results'>[] = [
  { id: 'moving', title: 'A fresh start in a new city', description: 'Getting the essentials sorted for my upcoming move.', type: 'task', status: 'Not Started', category: 'plan', demo: true },
  { id: 'insurance', title: 'Find the right health insurance', description: 'Comparing coverage, costs, and what matters to me.', type: 'task', status: 'In Progress', category: 'compare', demo: true },
  { id: 'garden', title: 'Start a little balcony garden', description: 'A simple plan to bring a little green into my everyday.', type: 'task', status: 'Completed', category: 'support', demo: true },
];
export const sampleTasks: Task[] = samples.map(task => {
  let workspace: Task = { ...task, status: 'Not Started', draft: '', sources: [], messages: [{ id: `${task.id}-request`, role: 'user', text: task.description }, { id: `${task.id}-intro`, role: 'assistant', text: 'This is a sample workspace. What would a good outcome look like for you?' }] };
  while (workspace.status !== task.status) workspace = advanceDemo(workspace);
  return workspace;
});
export function createDraftTask(id: string, type: ConversationType = 'query'): Task { const now = new Date().toISOString(); return { id, type, title: type === 'task' ? 'Untitled task' : 'Untitled question', description: '', ...(type === 'task' ? { status: 'Not Started' as const, notes: '' } : {}), category: 'plan', demo: false, messages: [], draft: '', sources: [], createdAt: now, updatedAt: now, completedActions: [] }; }
export function createLocalTask(text: string, id: string, type: ConversationType = 'query'): Task | undefined {
  const description = text.trim();
  if (!description) return undefined;
  return { ...createDraftTask(id, type), title: description.length > 65 ? `${description.slice(0, 62)}…` : description, description: text, messages: [{ id: `${id}-request`, role: 'user', text }] };
}
export function appendMessage(task: Task, text: string): Task {
  if (!text.trim()) return task;
  if (!task.description) { const created = createLocalTask(text, task.id, task.type); return created ? { ...task, ...created, moveId: task.moveId, moveRevision: task.moveRevision, moveSnapshot: task.moveSnapshot, status: task.status, notes: task.notes } : task; }
  if (!task.demo) return { ...task, draft: '', messages: [...task.messages, { id: `${task.id}-${task.messages.length}`, role: 'user', text }] };
  return { ...task, draft: '', messages: [...task.messages, { id: `${task.id}-${task.messages.length}`, role: 'user', text }, { id: `${task.id}-${task.messages.length + 1}`, role: 'assistant', text: 'I’ve added that context to this demo conversation. Keep your priorities, constraints, and timeline in mind as you review the example plan. No live research has been performed.' }] };
}
export function advanceDemo(task: Task): Task {
  if (!task.demo) return task;
  if (!task.description || task.status === 'Completed') return task;
  const status = taskStages[taskStages.indexOf(task.status ?? 'Not Started') + 1] ?? 'Completed';
  const sources: Source[] = [{ title: 'USA.gov — Government information', preview: 'An example starting point for public services and official requirements. Not searched or verified for your request.', url: 'https://www.usa.gov/' }, { title: 'Citizens Advice — Practical guidance', preview: 'An example resource for everyday questions in the UK. Relevance depends on your location.', url: 'https://www.citizensadvice.org.uk/' }];
  const results: Results = { summary: 'This example plan organizes your request into a manageable decision. It is not personalized advice or a researched conclusion.', options: ['Start with official guidance and check the requirements that apply to you.', 'Compare two or three options against your budget, timeline, and priorities.'], steps: ['Write down your ideal outcome and any non-negotiables.', 'Check current details directly with relevant organizations.', 'Choose one small action and a date to take it.'] };
  return { ...task, status, sources: task.sources.length ? task.sources : sources, results: status === 'Waiting' || status === 'Completed' ? results : task.results };
}