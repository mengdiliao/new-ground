import { fireEvent, render, screen, cleanup, act } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
const { request } = vi.hoisted(() => ({ request: vi.fn(async (_input: unknown) => ({ done: true, sources: [], rounds: 0 })) }));
vi.mock('@tanstack/react-start', () => ({ useServerFn: () => request }));
vi.mock('@/lib/agent.functions', () => ({ agentStep: vi.fn() }));
import { NewGroundProvider } from '@/components/new-ground-provider';
import { useNewGround } from '@/lib/task-context';
import { ProfileProvider } from '@/components/profile-provider';
import { useProfile } from '@/lib/profile-context';
import { emptyProfile } from '@/lib/profile';
import { createDraftTask } from '@/lib/task-data';
import { saveTasks, loadTasks } from '@/lib/task-storage';

afterEach(() => { cleanup(); window.localStorage.clear(); request.mockClear(); });

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
