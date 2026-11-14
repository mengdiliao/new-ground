import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
const { request } = vi.hoisted(() => ({ request: vi.fn(async (_input: unknown): Promise<import('@/lib/agent').AgentReply> => ({ done: true, rounds: 0, sources: [] })) }));
vi.mock('@tanstack/react-start', () => ({ useServerFn: () => request }));
vi.mock('@/lib/agent.functions', () => ({ agentStep: vi.fn() }));
import { eligibleSuggestion, suggestedActionSchema } from '@/lib/suggested-action';
import { NewGroundProvider } from '@/components/new-ground-provider';
import { ProfileProvider } from '@/components/profile-provider';
import { ActionSuggestion } from '@/components/action-suggestion';
import { useNewGround } from '@/lib/task-context';
import { createDraftTask } from '@/lib/task-data';
import { loadTasks, saveTasks } from '@/lib/task-storage';
import { emptyCalendar } from '@/lib/calendar-draft';

afterEach(() => { cleanup(); localStorage.clear(); request.mockReset(); });
function Consumer() {
  const { tasks, researchTask } = useNewGround(); const task = tasks[0];
  return <><output aria-label="Tracked count">{tasks.filter(task => task.type === 'task').length}</output><output aria-label="Conversation count">{tasks.length}</output><ButtonForResponse run={() => { if (task) void researchTask(task.id, 'What should I do?'); }} />{task?.messages.map(message => message.suggestedAction ? <ActionSuggestion key={message.id} task={task} message={message} /> : message.emailDraft ? <output aria-label="Opened email">{message.emailDraft.subject}</output> : message.calendarDraft ? <output aria-label="Opened calendar">{message.calendarDraft.title}</output> : null)}</>;
}
function ButtonForResponse({ run }: { run: () => void }) { return <button onClick={run}>Ask assistant</button>; }
function mount() { saveTasks(localStorage, [createDraftTask('query')]); render(<ProfileProvider><NewGroundProvider><Consumer /></NewGroundProvider></ProfileProvider>); }
it('shows one email suggestion without drafting or creating tasks until clicked', async () => {
  request.mockResolvedValueOnce({ done: true, sources: [], rounds: 0, answer: 'Ask your landlord whether early access is possible.', suggestedAction: { type: 'email', purpose: 'Ask the landlord about early access' } });
  mount(); await act(async () => { fireEvent.click(screen.getByText('Ask assistant')); });
  expect(screen.getByRole('button', { name: 'Draft Email' })).toBeVisible(); expect(request).toHaveBeenCalledOnce(); expect(screen.queryByLabelText('Opened email')).toBeNull(); expect(screen.getByLabelText('Tracked count')).toHaveTextContent('0');
  request.mockResolvedValueOnce({ done: true, sources: [], rounds: 0, emailAction: { recipientName: '', to: '', cc: '', subject: 'Early access', body: 'Could early access be possible?', language: 'English', sourceNumbers: [] } });
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Draft Email' })); });
  expect(screen.getByLabelText('Opened email')).toHaveTextContent('Early access'); expect(screen.getByLabelText('Tracked count')).toHaveTextContent('0'); expect(screen.getByLabelText('Conversation count')).toHaveTextContent('1'); expect(loadTasks(localStorage)[0]?.type).toBe('query');
});
it('shows one calendar suggestion and opens a calendar draft without creating a task', async () => {
  request.mockResolvedValueOnce({ done: true, sources: [], rounds: 0, answer: 'Your appointment is Tuesday.', suggestedAction: { type: 'calendar', purpose: 'Keep the appointment on your calendar' } });
  mount(); await act(async () => { fireEvent.click(screen.getByText('Ask assistant')); });
  expect(screen.getByRole('button', { name: 'Add to Calendar' })).toBeVisible(); expect(screen.queryByLabelText('Opened calendar')).toBeNull(); expect(request).toHaveBeenCalledOnce();
  request.mockResolvedValueOnce({ done: true, sources: [], rounds: 0, calendarAction: { ...emptyCalendar, title: 'Appointment' } });
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Add to Calendar' })); });
  expect(screen.getByLabelText('Opened calendar')).toHaveTextContent('Appointment'); expect(screen.getByLabelText('Tracked count')).toHaveTextContent('0'); expect(loadTasks(localStorage)).toHaveLength(1);
});
it('requires explicit confirmation to save as a task and cancellation has no effect', async () => {
  request.mockResolvedValueOnce({ done: true, sources: [], rounds: 0, answer: 'Gather the documents later.', suggestedAction: { type: 'task', purpose: 'Gather registration documents' } });
  mount(); await act(async () => { fireEvent.click(screen.getByText('Ask assistant')); });
  fireEvent.click(screen.getByRole('button', { name: 'Save as Task' })); expect(screen.getByLabelText('Tracked count')).toHaveTextContent('0'); fireEvent.click(screen.getByRole('button', { name: 'Cancel' })); expect(screen.getByLabelText('Tracked count')).toHaveTextContent('0');
  fireEvent.click(screen.getByRole('button', { name: 'Save as Task' })); fireEvent.click(screen.getByRole('button', { name: 'Confirm save as task' })); expect(screen.getByLabelText('Tracked count')).toHaveTextContent('1'); expect(loadTasks(localStorage)).toHaveLength(1); expect(request).toHaveBeenCalledOnce();
});
it('rejects multiple actions and suppresses repeated offers or already tracked responsibilities', () => {
  const action = { type: 'email' as const, purpose: 'Contact landlord' };
  expect(suggestedActionSchema.safeParse([action, action]).success).toBe(false);
  expect(eligibleSuggestion(action, [{ id: 'answer', role: 'assistant', text: 'Ask landlord', suggestedAction: action }], false)).toBeUndefined();
  expect(eligibleSuggestion({ type: 'task', purpose: 'Collect documents' }, [], true)).toBeUndefined();
  expect(eligibleSuggestion(undefined, [], false)).toBeUndefined();
});