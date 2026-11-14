import { describe, it, expect, vi } from 'vitest';
import { emptyProfile, emptyMoveStore, putMove, activateMove, moveContext, moveRevision } from '@/lib/profile';
import { loadMoveStore, saveMoveStore, PROFILE_STORAGE_KEY } from '@/lib/profile-storage';
import { createDraftTask, appendMessage } from '@/lib/task-data';
import { saveTasks, loadTasks } from '@/lib/task-storage';
import { runAgentStep } from '@/lib/agent.server';
const destination = { cityId: 658225, cityName: 'Helsinki', countryCode: 'FI', countryName: 'Finland' };
const now = '2026-11-14T20:56:00.000Z';
const first = () => putMove(emptyMoveStore, { ...emptyProfile, destination }, 'first', now);
function memory() { const data = new Map<string, string>(); return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } }; }
describe('Persistent moves', () => {
  it('keeps a blank task bound to its original move when the first message arrives', () => { const task = appendMessage({ ...createDraftTask('draft'), moveId: 'first' }, 'My first question'); expect(task.moveId).toBe('first'); expect(task.messages[0]?.text).toBe('My first question'); });
  it('starts without a preset active move', () => { expect(loadMoveStore(memory())).toEqual({ version: 2, moves: [], activeMoveId: null }); });
  it('preserves unknown optional values on save and reload', () => { const storage = memory(); saveMoveStore(storage, first()); expect(loadMoveStore(storage).moves[0]).toMatchObject({ id: 'first', destination, origin: null, arrival: null, duration: null, purpose: null, confirmedDetails: {} }); });
  it('migrates the existing profile in the same storage key', () => { const storage = memory(); storage.setItem(PROFILE_STORAGE_KEY, JSON.stringify({ ...emptyProfile, destination })); const store = loadMoveStore(storage); saveMoveStore(storage, store); expect(loadMoveStore(storage).activeMoveId).toBe('legacy-move'); expect(loadMoveStore(storage).moves).toHaveLength(1); });
  it('edits the same move ID and preserves its creation time', () => { const store = putMove(first(), { ...emptyProfile, destination, arrival: { kind: 'exact', date: '2026-11-19' } }, 'first', '2026-11-15T00:00:00.000Z'); expect(store.moves).toHaveLength(1); expect(store.moves[0]?.createdAt).toBe(now); expect(store.moves[0]?.arrival).toEqual({ kind: 'exact', date: '2026-11-19' }); });
  it('creates a separate move without reusing old optional fields', () => { const store = putMove(first(), { ...emptyProfile, destination: { ...destination, cityName: 'Copenhagen' } }, 'second', now); expect(store.moves).toHaveLength(2); expect(store.activeMoveId).toBe('second'); expect(store.moves[1]?.arrival).toBeNull(); expect(store.moves.filter(move => move.status === 'active')).toHaveLength(1); });
  it('allows saving another move without activating it', () => { const store = putMove(first(), { ...emptyProfile, destination }, 'second', now, false); expect(store.activeMoveId).toBe('first'); expect(store.moves[1]?.status).toBe('archived'); });
  it('switches moves while preserving separately associated task histories', () => { const storage = memory(); const store = activateMove(putMove(first(), { ...emptyProfile, destination }, 'second', now), 'first'); saveTasks(storage, [{ ...createDraftTask('a'), moveId: 'first', completedActions: ['Saved step'] }, { ...createDraftTask('b'), moveId: 'second' }]); expect(store.activeMoveId).toBe('first'); expect(loadTasks(storage).filter(task => task.moveId === store.activeMoveId).map(task => task.id)).toEqual(['a']); expect(loadTasks(storage)[0]?.completedActions).toEqual(['Saved step']); });
  it('changes research revision only when confirmed context changes', () => { const move = first().moves[0]; if (!move) throw new Error('Missing move'); expect(moveRevision({ ...move, updatedAt: '2026-11-15T00:00:00.000Z' })).toBe(moveRevision(move)); expect(moveRevision({ ...move, duration: { choice: 'm3-6' } })).not.toBe(moveRevision(move)); expect(moveContext(move)).not.toHaveProperty('nationality'); expect(moveContext(move)).not.toHaveProperty('latitude'); });
  it('carries validated destination context into planning and Exa, including updated follow-ups', async () => {
    const move = first().moves[0]; if (!move) throw new Error('Missing move');
    const config = { openaiKey: 'test', exaKey: 'test', stateKey: 'test', model: 'test' };
    let calls = 0; const queries: string[] = [];
    const fetcher = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      if (String(url).includes('exa.ai')) { queries.push(body.query); return Response.json({ results: [{ title: 'Official', url: 'https://example.org', highlights: ['Library information'] }] }); }
      expect(body.instructions).toContain('Never assume nationality');
      if (calls++ === 0) { expect(body.instructions).toContain('Helsinki'); return Response.json({ id: 'search', output: [{ type: 'function_call', name: 'exa_search', call_id: 's', arguments: JSON.stringify({ query: 'Helsinki Finland public library' }) }] }); }
      if (calls > 2) expect(body.instructions).toContain('Copenhagen');
      return Response.json({ id: 'answer', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify({ answer: 'Official library [1]', plan: 'Check official sources', needsClarification: false }) }] }] });
    }) as unknown as typeof fetch;
    let reply = await runAgentStep({ message: 'Where is the library?', move: moveContext(move) }, config, fetcher);
    while (!reply.done) reply = await runAgentStep({ state: reply.state }, config, fetcher);
    expect(queries).toEqual(['Helsinki Finland public library']);
    reply = await runAgentStep({ state: reply.state, message: 'What about now?', move: moveContext({ ...move, destination: { ...destination, cityName: 'Copenhagen' } }) }, config, fetcher);
    while (!reply.done) reply = await runAgentStep({ state: reply.state }, config, fetcher);
    expect(calls).toBe(3); expect(reply.rounds).toBe(1);
  });
});