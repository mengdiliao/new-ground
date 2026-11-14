export type TaskStatus = 'Planning' | 'Researching' | 'Completed';
export interface Task { id: string; title: string; description: string; status: TaskStatus; category: 'support' | 'compare' | 'process' | 'plan'; demo: boolean; }
export const sampleTasks: Task[] = [
  { id: 'moving', title: 'A fresh start in a new city', description: 'Getting the essentials sorted for my upcoming move.', status: 'Planning', category: 'plan', demo: true },
  { id: 'insurance', title: 'Find the right health insurance', description: 'Comparing coverage, costs, and what matters to me.', status: 'Researching', category: 'compare', demo: true },
  { id: 'garden', title: 'Start a little balcony garden', description: 'A simple plan to bring a little green into my everyday.', status: 'Completed', category: 'support', demo: true },
];
export function createLocalTask(text: string, id: string): Task | undefined {
  const description = text.trim();
  if (!description) return undefined;
  return { id, title: description.length > 65 ? `${description.slice(0, 62)}…` : description, description, status: 'Planning', category: 'plan', demo: false };
}