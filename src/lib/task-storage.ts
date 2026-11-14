import { z } from 'zod';
import type { Task } from './task-data';
export const TASK_STORAGE_KEY = 'new-ground.tasks.v1';
const text = z.string();
const source = z.object({ title: text, preview: text, url: z.string().url().refine(url => /^https?:\/\//.test(url)), domain: text.optional(), highlights: z.array(text).optional(), publishedDate: text.nullable().optional() });
// Explicit allowlist: internal continuation state and credentials never persist.
const savedTask = z.object({ id: text.min(1), title: text.min(1), description: text, status: z.enum(['Planning', 'Researching', 'Reviewing', 'Completed']), category: z.enum(['support', 'compare', 'process', 'plan']), demo: z.boolean(), messages: z.array(z.object({ id: text, role: z.enum(['user', 'assistant']), text })), draft: z.literal('').default(''), sources: z.array(source), results: z.object({ summary: text, options: z.array(text), steps: z.array(text) }).optional(), completedActions: z.array(text).default([]), createdAt: z.string().datetime(), updatedAt: z.string().datetime(), searchState: z.enum(['idle', 'loading', 'success', 'error']).optional(), searchRounds: z.number().int().min(0).max(3).optional(), researchPlan: text.optional() });
export interface TaskStorage { getItem(key: string): string | null; setItem(key: string, value: string): void; }
export function loadTasks(storage: TaskStorage): Task[] {
  const raw = storage.getItem(TASK_STORAGE_KEY);
  if (!raw) return [];
  const parsed = z.object({ version: z.literal(1), tasks: z.array(z.unknown()) }).parse(JSON.parse(raw));
  return parsed.tasks.flatMap(value => { const result = savedTask.safeParse(value); if (!result.success) return []; const task = result.data; return [{ ...task, ...(task.searchState === 'loading' ? { searchState: 'error' as const, searchError: 'This research was interrupted. Retry your request to continue.' } : {}) }]; });
}
export function saveTasks(storage: TaskStorage, tasks: Task[]) {
  storage.setItem(TASK_STORAGE_KEY, JSON.stringify({ version: 1, tasks: tasks.filter(task => !task.demo).map(task => savedTask.parse({ ...task, draft: '' })) }));
}