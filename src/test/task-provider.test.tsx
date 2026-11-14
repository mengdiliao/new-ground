import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
vi.mock('@tanstack/react-start', () => ({ useServerFn: () => vi.fn() }));
vi.mock('@/lib/exa-search.functions', () => ({ searchWeb: vi.fn() }));
import { NewGroundProvider } from '@/components/new-ground-provider';
import { useNewGround } from '@/lib/task-context';

afterEach(cleanup);

function Consumer() {
  const { tasks, addTask } = useNewGround();
  return <><output aria-label="Task count">{tasks.length}</output><button onClick={() => addTask('A local test task')}>Add task</button></>;
}

it('keeps consumers connected to task state when the provider rerenders', () => {
  const view = render(<NewGroundProvider><Consumer /></NewGroundProvider>);
  expect(screen.getByLabelText('Task count')).toHaveTextContent('3');
  fireEvent.click(screen.getByText('Add task'));
  expect(screen.getByLabelText('Task count')).toHaveTextContent('4');
  view.rerender(<NewGroundProvider><Consumer /></NewGroundProvider>);
  expect(screen.getByLabelText('Task count')).toHaveTextContent('4');
});