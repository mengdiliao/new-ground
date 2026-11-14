import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
const { request } = vi.hoisted(() => ({ request: vi.fn(async (_input: unknown) => ({ done: true, items: [], error: 'Research unavailable' })) }));
vi.mock('@tanstack/react-start', () => ({ useServerFn: () => request }));
vi.mock('@/lib/city-essentials.functions', () => ({ essentialsStep: vi.fn() }));
import { CityEssentialsProvider } from '@/components/city-essentials-provider';
import { ProfileProvider } from '@/components/profile-provider';
import { useProfile } from '@/lib/profile-context';
import { useEssentials } from '@/lib/city-essentials-context';
import { emptyProfile } from '@/lib/profile';
function Consumer() {
  const { saveMove } = useProfile(); const { cache, refresh } = useEssentials();
  return <><output aria-label="Cached modules">{Object.values(cache).filter(module => module.status === 'error').length}</output><button onClick={() => saveMove({ ...emptyProfile, destination: { cityId: 658225, cityName: 'Helsinki', countryCode: 'FI', countryName: 'Finland' } }, 'move')}>Save</button><button onClick={() => refresh('moving-requirements')}>Retry</button></>;
}
const mount = () => render(<ProfileProvider><CityEssentialsProvider><Consumer /></CityEssentialsProvider></ProfileProvider>);
afterEach(() => { cleanup(); window.localStorage.clear(); request.mockClear(); });
it('starts four bounded categories after saving a destination, without creating any tasks', async () => {
  mount(); expect(request).not.toHaveBeenCalled();
  await act(async () => { fireEvent.click(screen.getByText('Save')); });
  expect(request).toHaveBeenCalledTimes(4);
  expect(request.mock.calls[0]?.[0]).toMatchObject({ data: { moveId: 'move', destinationId: 658225, request: { move: { destination: { city: 'Helsinki', country: 'Finland' } } } } });
  expect(window.localStorage.getItem('new-ground.tasks.v1')).toBeNull();
});
it('reuses saved failures on reopen and retries only the explicitly selected category', async () => {
  const view = mount(); await act(async () => { fireEvent.click(screen.getByText('Save')); });
  await waitFor(() => expect(screen.getByLabelText('Cached modules')).toHaveTextContent('4'));
  view.unmount(); request.mockClear(); mount();
  await waitFor(() => expect(screen.getByLabelText('Cached modules')).toHaveTextContent('4'));
  expect(request).not.toHaveBeenCalled();
  await act(async () => { fireEvent.click(screen.getByText('Retry')); });
  expect(request).toHaveBeenCalledTimes(1);
  expect(request.mock.calls[0]?.[0]).toMatchObject({ data: { category: 'moving-requirements' } });
});