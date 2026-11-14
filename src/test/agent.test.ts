import { describe, expect, it, vi } from 'vitest';
import { runAgentStep } from '@/lib/agent.server';
import { DEFAULT_OPENAI_MODEL, groundedText, type AgentReply } from '@/lib/agent';

const config = { openaiKey: 'test-credential', exaKey: 'test-credential', stateKey: 'test-signing-key', model: DEFAULT_OPENAI_MODEL };
const toolResponse = (id: string) => Response.json({ id, output: [{ type: 'function_call', name: 'exa_search', call_id: `call-${id}`, arguments: JSON.stringify({ query: 'Helsinki library opening hours' }) }] });
const answerResponse = () => Response.json({ id: 'answer', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify({ plan: 'Check official library guidance.', answer: 'Check the official page for the date you need [1].', needsClarification: false }) }] }] });
const searchResponse = () => Response.json({ results: [{ title: 'Library', url: 'https://example.org/library', highlights: ['Opening hours vary by day.'] }] });

describe('OpenAI assistant safety and orchestration', () => {
  it('returns a structured email with no recipient or search for a basic drafting request', async () => {
    const fetcher = vi.fn(async () => Response.json({ id: 'email', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify({ answer: 'Review your email below.', plan: '', needsClarification: false, imageSourceNumbers: [], emailAction: { recipientName: '', to: '', cc: '', subject: 'Earlier move-in', body: 'Dear landlord,\nMay I move in earlier?\n[Your name]', language: 'English', sourceNumbers: [] } }) }] }] })) as unknown as typeof fetch;
    let result = await runAgentStep({ message: 'Write an email asking my landlord about moving in earlier.' }, config, fetcher);
    while (!result.done) result = await runAgentStep({ state: result.state }, config, fetcher);
    expect(result.emailAction).toMatchObject({ to: '', subject: 'Earlier move-in' }); expect(result.rounds).toBe(0); expect(fetcher).toHaveBeenCalledOnce();
  });
  it('passes the edited draft into revisions and rejects an invented recipient', async () => {
    const draft = { id: 'existing', recipientName: '', to: 'owner@example.org', cc: '', subject: 'My edited subject', body: 'My edited body', language: 'English', sourceNumbers: [] };
    const fetcher = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)); expect(body.instructions).toContain('My edited subject'); expect(body.instructions).toContain('My edited body');
      return Response.json({ id: 'revision', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify({ answer: 'Updated.', plan: '', needsClarification: false, emailAction: { ...draft, to: 'fake@example.org', body: 'Dear landlord, please confirm.' } }) }] }] });
    }) as unknown as typeof fetch;
    let result = await runAgentStep({ message: 'Make that email more formal.', emailDraft: draft }, config, fetcher);
    while (!result.done) result = await runAgentStep({ state: result.state }, config, fetcher);
    expect(result.emailAction?.body).toBe('Dear landlord, please confirm.'); expect(result.emailAction?.to).toBe('');
  });
  it('restores saved conversation context without a persisted continuation token', async () => {
    const fetcher = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body)); expect(body.input).toEqual([{ role: 'user', content: 'Help me move.' }, { role: 'assistant', content: 'Which city?' }, { role: 'user', content: 'Helsinki.' }]); return answerResponse();
    }) as unknown as typeof fetch;
    let result = await runAgentStep({ message: 'Helsinki.', history: [{ role: 'user', text: 'Help me move.' }, { role: 'assistant', text: 'Which city?' }] }, config, fetcher);
    while (!result.done) result = await runAgentStep({ state: result.state }, config, fetcher);
    expect(fetcher).toHaveBeenCalledOnce(); expect(result.answer).toBeDefined();
  });
  it('uses the requested configurable default model', () => { expect(DEFAULT_OPENAI_MODEL).toBe('gpt-6-luna'); });
  it('keeps OpenAI context on a task follow-up and asks for missing essentials without searching', async () => {
    let count = 0;
    const fetcher = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      const body = JSON.parse(String(init?.body));
      if (count++ > 0) expect(body.previous_response_id).toBe('clarification');
      return Response.json({ id: 'clarification', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify({ answer: 'Which city are you moving to?', plan: 'Confirm the destination before researching local services.', needsClarification: true }) }] }] });
    }) as unknown as typeof fetch;
    let result = await runAgentStep({ message: 'Help me move.' }, config, fetcher);
    while (!result.done) result = await runAgentStep({ state: result.state }, config, fetcher);
    expect(result.clarification).toBe(true); expect(result.rounds).toBe(0);
    result = await runAgentStep({ state: result.state, message: 'Helsinki.' }, config, fetcher);
    while (!result.done) result = await runAgentStep({ state: result.state }, config, fetcher);
    expect(count).toBe(2);
  });
  it('executes Exa tools and delivers an evidence-grounded answer', async () => {
    let models = 0;
    const fetcher = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      if (String(url).includes('exa.ai')) return searchResponse();
      const body = JSON.parse(String(init?.body));
      expect(body.model).toBe('gpt-6-luna');
      if (models++ === 0) return toolResponse('first');
      expect(body.input[0].type).toBe('function_call_output');
      expect(JSON.parse(body.input[0].output).sources[0].number).toBe(1);
      return answerResponse();
    }) as unknown as typeof fetch;
    let result = await runAgentStep({ message: 'Help me check library hours in Helsinki.' }, config, fetcher);
    const stages = [result.stage];
    while (!result.done) { result = await runAgentStep({ state: result.state }, config, fetcher); stages.push(result.stage); }
    expect(result.answer).toContain('[1]'); expect(result.sources[0]?.url).toBe('https://example.org/library');
    expect(stages).toContain('Searching for information'); expect(stages).toContain('Reading sources'); expect(stages).toContain('Preparing your answer');
  });
  it('enforces at most three searches across follow-ups in the same task', async () => {
    let searches = 0;
    const fetcher = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      if (String(url).includes('exa.ai')) { searches++; return searchResponse(); }
      const body = JSON.parse(String(init?.body));
      return body.tool_choice === 'none' ? answerResponse() : toolResponse(`model-${searches}`);
    }) as unknown as typeof fetch;
    let result: AgentReply = await runAgentStep({ message: 'Research libraries.' }, config, fetcher);
    while (!result.done) result = await runAgentStep({ state: result.state }, config, fetcher);
    expect(searches).toBe(3);
    result = await runAgentStep({ state: result.state, message: 'Compare those sources again.' }, config, fetcher);
    while (!result.done) result = await runAgentStep({ state: result.state }, config, fetcher);
    expect(searches).toBe(3);
  });
  it('limits each tool output to five results', async () => {
    let calls = 0;
    const fetcher = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      if (String(url).includes('exa.ai')) return Response.json({ results: Array.from({ length: 9 }, (_, i) => ({ title: `${i}`, url: `https://example.org/${i}`, highlights: ['Evidence'] })) });
      if (calls++ === 0) return toolResponse('first');
      const output = JSON.parse(JSON.parse(String(init?.body)).input[0].output);
      expect(output.sources).toHaveLength(5); return answerResponse();
    }) as unknown as typeof fetch;
    let result = await runAgentStep({ message: 'Research libraries.' }, config, fetcher);
    while (!result.done) result = await runAgentStep({ state: result.state }, config, fetcher);
    expect(result.sources).toHaveLength(5);
  });
  it('stops infinite tool-calling without making unlimited API requests', async () => {
    const fetcher = vi.fn(async () => Response.json({ id: 'repeat', output: [{ type: 'function_call', name: 'unknown', call_id: 'call', arguments: '{}' }] })) as unknown as typeof fetch;
    let result = await runAgentStep({ message: 'Help.' }, config, fetcher);
    let steps = 0;
    while (!result.done && steps++ < 20) result = await runAgentStep({ state: result.state }, config, fetcher);
    expect(result.error).toContain('safety limit'); expect(steps).toBeLessThanOrEqual(13);
  });
  it('does not fall back to fabricated answers after an Exa failure', async () => {
    const fetcher = vi.fn(async (url: string | URL | Request) => String(url).includes('exa.ai') ? new Response('', { status: 503 }) : toolResponse('first')) as unknown as typeof fetch;
    let result = await runAgentStep({ message: 'Research libraries.' }, config, fetcher);
    while (!result.done) result = await runAgentStep({ state: result.state }, config, fetcher);
    expect(result.answer).toBeUndefined(); expect(result.sources).toEqual([]); expect(result.error).toContain('unavailable');
  });
  it('rejects tampered continuation state without executing tools', async () => {
    const fetcher = vi.fn();
    const result = await runAgentStep({ state: 'forged-token', message: 'Reset searches.' }, config, fetcher);
    expect(result.error).toBeDefined(); expect(fetcher).not.toHaveBeenCalled();
  });
  it('omits invented URLs and references to nonexistent sources', () => {
    expect(groundedText('See https://invented.example/path [9]', [])).toBe('See (unverified link omitted) (source unavailable)');
  });
});