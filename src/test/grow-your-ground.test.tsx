import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { GrowYourGround, plantStorageKey } from '@/components/grow-your-ground';

afterEach(() => { cleanup(); localStorage.clear(); });

it('starts at stage 0 and advances exactly one stage per manual watering up to 4', () => {
  render(<GrowYourGround />);
  expect(localStorage.getItem(plantStorageKey)).toBe('0');
  for (const stage of [1, 2, 3, 4]) {
    fireEvent.click(screen.getByRole('button', { name: 'Water plant' }));
    expect(localStorage.getItem(plantStorageKey)).toBe(String(stage));
  }
  expect(screen.queryByRole('button', { name: 'Water plant' })).toBeNull();
});

it('retains the watered stage across remounts without advancing it', () => {
  const first = render(<GrowYourGround />);
  fireEvent.click(screen.getByRole('button', { name: 'Water plant' }));
  fireEvent.click(screen.getByRole('button', { name: 'Water plant' }));
  first.unmount();
  render(<GrowYourGround />);
  expect(localStorage.getItem(plantStorageKey)).toBe('2');
  fireEvent.click(screen.getByRole('button', { name: 'Water plant' }));
  expect(localStorage.getItem(plantStorageKey)).toBe('3');
});

it.each(['-1', '5', '1.5', 'invalid'])('rejects invalid saved stage %s', value => {
  localStorage.setItem(plantStorageKey, value);
  render(<GrowYourGround />);
  expect(localStorage.getItem(plantStorageKey)).toBe('0');
});

it('leaves unrelated task and profile storage unchanged', () => {
  localStorage.setItem('new-ground:tasks', 'unchanged tasks');
  localStorage.setItem('new-ground:profile', 'unchanged profile');
  render(<GrowYourGround />);
  fireEvent.click(screen.getByRole('button', { name: 'Water plant' }));
  expect(localStorage.getItem('new-ground:tasks')).toBe('unchanged tasks');
  expect(localStorage.getItem('new-ground:profile')).toBe('unchanged profile');
});