import { z } from 'zod';
import type { Task } from './task-data';
import { moveContextSchema } from './agent';
import { researchImageSchema } from './research-images';
export const TASK_STORAGE_KEY = 'new-ground.tasks.v1';
const text = z.string();
const source = z.object({ title: text, preview: text, url: z.string().url().refine(url => /^https?:\/\//.test(url)), domain: text.optional(), highlights: z.array(text).optional(), publishedDate: text.nullable().optional(), images: z.array(researchImageSchema).max(3).optional() });
// Explicit allowlist: internal continuation state and credentials never persist.
const savedTask = z.object({ id: text.min(1), title: text.min(1), description: text, type: z.enum(['query', 'task']), status: z.enum(['Not Started', 'In Progress', 'Waiting', 'Completed']).optional(), notes: text.optional(), category: z.enum(['support', 'compare', 'process', 'plan']), demo: z.boolean(), messages: z.array(z.object({ id: text, role: z.enum(['user', 'assistant']), text, images: z.array(researchImageSchema).max(3).optional() })), draft: z.literal('').default(''), sources: z.array(source), results: z.object({ summary: text, options: z.array(text), steps: z.array(text) }).optional(), completedActions: z.array(text).default([]), createdAt: z.string().datetime(), updatedAt: z.string().datetime(), searchState: z.enum(['idle', 'loading', 'success', 'error']).optional(), searchRounds: z.number().int().min(0).max(3).optional(), researchPlan: text.optional(), moveId: text.nullable().optional(), moveRevision: text.optional(), moveSnapshot: moveContextSchema.nullable().optional() });
export interface TaskStorage { getItem(key: string): string | null; setItem(key: string, value: string): void; }
function migrateConversation(value: unknown): unknown {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  const record = value as Record<string, unknown>;
  // Old processing stages are not evidence of a user-confirmed task.
  const type = record['type'] === 'task' ? 'task' : 'query';
  const allowed = ['Not Started', 'In Progress', 'Waiting', 'Completed'];
  return { ...record, type, status: type === 'task' ? allowed.includes(String(record['status'])) ? record['status'] : 'Not Started' : undefined, notes: type === 'task' && typeof record['notes'] === 'string' ? record['notes'] : undefined };
}
export function loadTasks(storage: TaskStorage): Task[] {
  const raw = storage.getItem(TASK_STORAGE_KEY);
  if (!raw) return [];
  const parsed = z.object({ version: z.union([z.literal(1), z.literal(2)]), tasks: z.array(z.unknown()) }).parse(JSON.parse(raw));
  return parsed.tasks.flatMap(value => { const result = savedTask.safeParse(migrateConversation(value)); if (!result.success) return []; const task = result.data; return [{ ...task, ...(task.searchState === 'loading' ? { searchState: 'error' as const, searchError: 'This research was interrupted. Retry your request to continue.' } : {}) }]; });
}
export function saveTasks(storage: TaskStorage, tasks: Task[]) {
  storage.setItem(TASK_STORAGE_KEY, JSON.stringify({ version: 2, tasks: tasks.filter(task => !task.demo).map(task => savedTask.parse({ ...task, messages: task.messages.filter(message => !message.emailDraft), draft: '' })) }));
}