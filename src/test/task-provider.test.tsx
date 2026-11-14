import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
const { request } = vi.hoisted(() => ({ request: vi.fn(async (_input: unknown) => ({ done: true, sources: [], rounds: 0 })) }));
vi.mock('@tanstack/react-start', () => ({ useServerFn: () => request }));
vi.mock('@/lib/agent.functions', () => ({ agentStep: vi.fn() }));
import { NewGroundProvider } from '@/components/new-ground-provider';
import { useNewGround } from '@/lib/task-context';
import { ProfileProvider } from '@/components/profile-provider';
import { useProfile } from '@/lib/profile-context';
import { emptyProfile } from '@/lib/profile';

afterEach(() => { cleanup(); window.localStorage.clear(); request.mockClear(); });

function Consumer() {
  const { tasks, addTask } = useNewGround();
  return <><output aria-label="Task count">{tasks.length}</output><button onClick={() => addTask('A local test task')}>Add task</button></>;
}

it('keeps consumers connected to task state when the provider rerenders', () => {
  const view = render(<ProfileProvider><NewGroundProvider><Consumer /></NewGroundProvider></ProfileProvider>);
  expect(screen.getByLabelText('Task count')).toHaveTextContent('3');
  fireEvent.click(screen.getByText('Add task'));
  expect(screen.getByLabelText('Task count')).toHaveTextContent('4');
  view.rerender(<ProfileProvider><NewGroundProvider><Consumer /></NewGroundProvider></ProfileProvider>);
  expect(screen.getByLabelText('Task count')).toHaveTextContent('4');
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
  fireEvent.click(screen.getByText('Research'));
  expect(request.mock.calls[0]?.[0]).toMatchObject({ data: { move: { destination: { city: 'Helsinki', country: 'Finland' }, origin: null, confirmedDetails: { interests: 'Cycling' } } } });
  fireEvent.click(screen.getByText('Save move'));
  expect(screen.getByLabelText('Move task count')).toHaveTextContent('0');
  expect(screen.getByLabelText('All count')).toHaveTextContent('1');
  fireEvent.click(screen.getByText('First move'));
  expect(screen.getByLabelText('Move task count')).toHaveTextContent('1');
});