import { describe, it, expect } from 'vitest';
import { createLocalTask, sampleTasks } from '@/lib/task-data';
describe('Frontend-only task foundation', () => {
  it('creates a local planning task from user input', () => { expect(createLocalTask('  Plan my move  ', 'local-1')).toEqual({ id: 'local-1', title: 'Plan my move', description: 'Plan my move', status: 'Planning', category: 'plan', demo: false }); });
  it('does not create an empty task', () => { expect(createLocalTask('   ', 'empty')).toBeUndefined(); });
  it('clearly identifies necessary sample data as demo tasks', () => { expect(sampleTasks.length).toBe(3); expect(sampleTasks.every(task => task.demo)).toBe(true); expect(sampleTasks.map(task => task.status)).toEqual(['Planning', 'Researching', 'Completed']); });
});