import { fireEvent, render, screen, cleanup, act } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
const { request } = vi.hoisted(() => ({ request: vi.fn(async (_input: unknown): Promise<import('@/lib/agent').AgentReply> => ({ done: true, sources: [], rounds: 0 })) }));
vi.mock('@tanstack/react-start', () => ({ useServerFn: () => request }));
vi.mock('@/lib/agent.functions', () => ({ agentStep: vi.fn() }));
import { NewGroundProvider } from '@/components/new-ground-provider';
import { useNewGround } from '@/lib/task-context';
import { ProfileProvider } from '@/components/profile-provider';
import { useProfile } from '@/lib/profile-context';
import { emptyProfile } from '@/lib/profile';
import { createDraftTask } from '@/lib/task-data';
import { saveTasks, loadTasks } from '@/lib/task-storage';
import type { AgentReply } from '@/lib/agent';
import { emptyCalendar } from '@/lib/calendar-draft';

afterEach(() => { cleanup(); window.localStorage.clear(); request.mockClear(); });

it('keeps calendar actions in the existing task while preserving email, notes, results and manual status', async () => {
  const task = { ...createDraftTask('calendar-task', 'task'), status: 'Waiting' as const, notes: 'Private note', results: { summary: 'Earlier findings', options: [], steps: ['Call office'] }, completedActions: ['Call office'] };
  saveTasks(window.localStorage, [task]);
  function CalendarConsumer() { const { tasks, researchTask, editCalendar, cancelCalendar, editEmail } = useNewGround(); const current = tasks[0]; const draft = current?.messages.find(message => message.calendarDraft)?.calendarDraft; return <><output aria-label="Calendar task state">{JSON.stringify(current)}</output><button onClick={() => { if (current) void researchTask(current.id, 'Prepare a calendar reminder'); }}>Prepare calendar</button><button onClick={() => { if (current && draft) editCalendar(current.id, { ...draft, title: 'Edited calendar title', startDate: '2026-11-17' }); }}>Edit calendar</button><button onClick={() => { if (current && draft) cancelCalendar(current.id, draft.id); }}>Cancel calendar</button></>; }
  request.mockResolvedValueOnce({ done: true, sources: [], rounds: 0, calendarAction: { ...emptyCalendar, title: 'Visit office' } });
  render(<ProfileProvider><NewGroundProvider><CalendarConsumer /></NewGroundProvider></ProfileProvider>);
  await act(async () => { fireEvent.click(screen.getByText('Prepare calendar')); });
  fireEvent.click(screen.getByText('Edit calendar'));
  const current = JSON.parse(screen.getByLabelText('Calendar task state').textContent ?? '{}');
  expect(current.messages).toHaveLength(1); expect(current.messages[0].calendarDraft).toMatchObject({ title: 'Edited calendar title', startDate: '2026-11-17' });
  expect(current).toMatchObject({ status: 'Waiting', notes: task.notes, results: task.results, completedActions: task.completedActions });
  expect(loadTasks(window.localStorage)).toHaveLength(1); expect(loadTasks(window.localStorage)[0]?.messages).toEqual([]);
  fireEvent.click(screen.getByText('Cancel calendar')); expect(JSON.parse(screen.getByLabelText('Calendar task state').textContent ?? '{}').messages).toEqual([]);
});

function Consumer() {
  const { tasks, addTask } = useNewGround();
  return <><output aria-label="Task count">{tasks.length}</output><button onClick={() => addTask('A local test task')}>Add task</button></>;
}

it('keeps consumers connected to task state when the provider rerenders', () => {
  const view = render(<ProfileProvider><NewGroundProvider><Consumer /></NewGroundProvider></ProfileProvider>);
  expect(screen.getByLabelText('Task count')).toHaveTextContent('0');
  fireEvent.click(screen.getByText('Add task'));
  expect(screen.getByLabelText('Task count')).toHaveTextContent('1');
  view.rerender(<ProfileProvider><NewGroundProvider><Consumer /></NewGroundProvider></ProfileProvider>);
  expect(screen.getByLabelText('Task count')).toHaveTextContent('1');
});
function MoveConsumer() {
  const { saveMove, activeMove, moves, switchMove, confirmDetail } = useProfile();
  const { tasks, allTasks, addTask, researchTask } = useNewGround();
  return <><output aria-label="Move count">{moves.length}</output><output aria-label="Move task count">{tasks.filter(task => !task.demo).length}</output><output aria-label="All count">{allTasks.filter(task => !task.demo).length}</output><button onClick={() => saveMove({ ...emptyProfile, destination: { cityId: 658225, cityName: 'Helsinki', countryCode: 'FI', countryName: 'Finland' } })}>Save move</button><button onClick={() => { const task = addTask('Where is my library?'); if (task) void researchTask(task.id, task.description); }}>Research</button><button onClick={() => switchMove(moves[0]?.id ?? null)}>First move</button><button onClick={() => { if (activeMove) confirmDetail(activeMove.id, 'interests', 'Cycling'); }}>Confirm interests</button></>;
}
it('saving does not research; new tasks use confirmed context and remain separate after switching', async () => {
  render(<ProfileProvider><NewGroundProvider><MoveConsumer /></NewGroundProvider></ProfileProvider>);
  fireEvent.click(screen.getByText('Save move'));
  expect(request).not.toHaveBeenCalled();
  fireEvent.click(screen.getByText('Confirm interests'));
  await act(async () => { fireEvent.click(screen.getByText('Research')); });
  expect(request.mock.calls[0]?.[0]).toMatchObject({ data: { move: { destination: { city: 'Helsinki', country: 'Finland' }, origin: null, confirmedDetails: { interests: 'Cycling' } } } });
  fireEvent.click(screen.getByText('Save move'));
  expect(screen.getByLabelText('Move task count')).toHaveTextContent('0');
  expect(screen.getByLabelText('All count')).toHaveTextContent('1');
  fireEvent.click(screen.getByText('First move'));
  expect(screen.getByLabelText('Move task count')).toHaveTextContent('1');
});
function StatusConsumer() {
  const { tasks, newTask, updateNotes, setTaskStatus, researchTask } = useNewGround(); const task = tasks[0];
  return <><output aria-label="Manual status">{task?.status}</output><button onClick={() => newTask('task')}>Explicit task</button><button onClick={() => { if (task) { updateNotes(task.id, 'PRIVATE NOTE'); setTaskStatus(task.id, 'Waiting'); } }}>Save private note</button><button onClick={() => { if (task) void researchTask(task.id, 'Find Oodi hours'); }}>Run research</button></>;
}
it('does not send personal notes or change manual progress when research finishes', async () => {
  render(<ProfileProvider><NewGroundProvider><StatusConsumer /></NewGroundProvider></ProfileProvider>);
  fireEvent.click(screen.getByText('Explicit task')); fireEvent.click(screen.getByText('Save private note'));
  await act(async () => { fireEvent.click(screen.getByText('Run research')); });
  expect(screen.getByLabelText('Manual status')).toHaveTextContent('Waiting');
  expect(JSON.stringify(request.mock.calls)).not.toContain('PRIVATE NOTE');
  expect(request.mock.calls[0]?.[0]).toMatchObject({ data: { message: 'Find Oodi hours' } });
});

it('preserves earlier research sources when a follow-up needs no new search', async () => {
  const sources = [{ title: 'Official library', preview: 'Opening hours', url: 'https://oodihelsinki.fi/' }];
  saveTasks(window.localStorage, [{ ...createDraftTask('saved', 'task'), sources, notes: 'My note', status: 'Waiting' }]);
  render(<ProfileProvider><NewGroundProvider><StatusConsumer /></NewGroundProvider></ProfileProvider>);
  await act(async () => { fireEvent.click(screen.getByText('Run research')); });
  expect(loadTasks(window.localStorage)[0]).toMatchObject({ sources, notes: 'My note', status: 'Waiting' });
});

it('preserves City Essentials references on explicitly created tasks', () => {
  const sources = [{ title: 'Original authority', url: 'https://112.fi/en', preview: 'Emergency services' }];
  function AddEssential() { const { addTask } = useNewGround(); return <button onClick={() => addTask('Save emergency contacts', 'task', sources)}>Confirm essential</button>; }
  render(<ProfileProvider><NewGroundProvider><AddEssential /></NewGroundProvider></ProfileProvider>);
  fireEvent.click(screen.getByText('Confirm essential'));
  expect(loadTasks(window.localStorage)[0]).toMatchObject({ type: 'task', status: 'Not Started', sources });
  expect(request).not.toHaveBeenCalled();
});

it('keeps email drafting and rewriting inside the same task without altering its progress or history count', async () => {
  const original = { ...createDraftTask('email-task', 'task'), status: 'Waiting' as const, notes: 'PRIVATE', results: { summary: 'Existing research', options: [], steps: ['Existing step'] }, completedActions: ['Existing step'] };
  saveTasks(window.localStorage, [original]);
  const email = { recipientName: '', to: '', cc: '', subject: 'Move-in request', body: 'May I move in earlier?', language: 'English', sourceNumbers: [] };
  request.mockResolvedValueOnce({ done: true, sources: [], rounds: 0, emailAction: email } as AgentReply);
  function EmailConsumer() {
    const { tasks, researchTask, editEmail, cancelEmail } = useNewGround(); const task = tasks[0]; const draft = task?.messages.find(message => message.emailDraft)?.emailDraft;
    return <><output aria-label="Email state">{JSON.stringify(task)}</output><button onClick={() => { if (task) void researchTask(task.id, 'Write an email to my landlord'); }}>Draft email</button><button onClick={() => { if (task && draft) editEmail(task.id, { ...draft, to: 'owner@example.org', cc: 'cc@example.org', body: 'Manually edited body' }); }}>Edit email</button><button onClick={() => { if (task) void researchTask(task.id, 'More formal', true); }}>Rewrite email</button><button onClick={() => { if (task && draft) cancelEmail(task.id, draft.id); }}>Cancel email</button></>;
  }
  render(<ProfileProvider><NewGroundProvider><EmailConsumer /></NewGroundProvider></ProfileProvider>);
  await act(async () => { fireEvent.click(screen.getByText('Draft email')); });
  const state = () => JSON.parse(screen.getByLabelText('Email state').textContent ?? '{}');
  const id = state().messages[0].emailDraft.id;
  fireEvent.click(screen.getByText('Edit email'));
  request.mockResolvedValueOnce({ done: true, sources: [], rounds: 0, emailAction: { ...email, to: 'unrelated@example.org', body: 'A formal revision' } } as AgentReply);
  await act(async () => { fireEvent.click(screen.getByText('Rewrite email')); });
  expect(request.mock.calls.at(-1)?.[0]).toMatchObject({ data: { emailDraft: { to: 'owner@example.org', body: 'Manually edited body' } } });
  expect(state().messages).toHaveLength(1);
  expect(state().messages[0].emailDraft).toMatchObject({ id, to: 'owner@example.org', cc: 'cc@example.org', body: 'A formal revision' });
  expect(state()).toMatchObject({ status: 'Waiting', notes: 'PRIVATE', results: original.results, completedActions: ['Existing step'] });
  expect(loadTasks(window.localStorage)).toHaveLength(1);
  expect(loadTasks(window.localStorage)[0]?.messages).toEqual([]);
  fireEvent.click(screen.getByText('Cancel email'));
  expect(state().messages).toEqual([]);
});
