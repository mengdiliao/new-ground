import { describe, expect, it } from 'vitest';
import { createDraftTask, createLocalTask } from '@/lib/task-data';
import { loadTasks, saveTasks, TASK_STORAGE_KEY } from '@/lib/task-storage';
import { renameTask, toggleAction, answerActions } from '@/lib/task-history';
function memoryStorage() { const data = new Map<string, string>(); return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } }; }
describe('Browser task history', () => {
  it('retains the original request, conversation, results, sources and timestamps after reopening', () => {
    const storage = memoryStorage(); const initial = createLocalTask('Plan my move', 'saved'); if (!initial) throw new Error('Missing task');
    const task = { ...initial, status: 'Completed' as const, results: { summary: 'Plan', options: [], steps: ['Check requirements'] }, completedActions: ['Check requirements'], sources: [{ title: 'Official', preview: 'Evidence', url: 'https://example.org/' }] };
    saveTasks(storage, [task]); expect(loadTasks(storage)[0]).toMatchObject(task);
  });
  it('does not persist credentials, internal continuation state, unsent drafts or demos', () => {
    const storage = memoryStorage(); const task = { ...createDraftTask('safe'), agentState: 'private-continuation', draft: 'unsent-sensitive-text', apiKey: 'private-key' };
    saveTasks(storage, [task, { ...createDraftTask('demo'), demo: true }]);
    const raw = storage.getItem(TASK_STORAGE_KEY) ?? ''; expect(raw).not.toContain('private-continuation'); expect(raw).not.toContain('private-key'); expect(raw).not.toContain('unsent-sensitive-text'); expect(loadTasks(storage).map(item => item.id)).toEqual(['safe']);
  });
  it('persists deletion without restoring removed tasks', () => { const storage = memoryStorage(); saveTasks(storage, [createDraftTask('delete')]); saveTasks(storage, []); expect(loadTasks(storage)).toEqual([]); });
  it('renames without changing the original request or conversation', () => { const task = createLocalTask('Original request', 'rename'); if (!task) throw new Error('Missing task'); const renamed = renameTask(task, 'New name'); expect(renamed.title).toBe('New name'); expect(renamed.description).toBe('Original request'); expect(renamed.messages).toEqual(task.messages); });
  it('checks and unchecks only real action items', () => { const task = { ...createDraftTask('actions'), results: { summary: 'Plan', options: [], steps: ['Check requirements'] } }; const checked = toggleAction(task, 'Check requirements'); expect(checked.completedActions).toEqual(['Check requirements']); expect(toggleAction(checked, 'Check requirements').completedActions).toEqual([]); expect(toggleAction(task, 'Invented action')).toBe(task); });
  it('extracts actual numbered answer steps without generating new advice', () => { expect(answerActions('Next steps:\n1. Check your tax card\n2. Contact your university')).toEqual(['Check your tax card', 'Contact your university']); expect(answerActions('A summary with no checklist.')).toEqual([]); });
  it('turns interrupted research into a retryable task on reload', () => { const storage = memoryStorage(); saveTasks(storage, [{ ...createDraftTask('interrupted'), searchState: 'loading' }]); expect(loadTasks(storage)[0]?.searchState).toBe('error'); });
});