import { createServerFn } from '@tanstack/react-start';
import { agentInput, DEFAULT_OPENAI_MODEL } from './agent';
import { runAgentStep } from './agent.server';

export const agentStep = createServerFn({ method: 'POST' })
  .inputValidator(input => agentInput.parse(input))
  .handler(async ({ data }) => {
    const openaiKey = process.env['OPENAI_API_KEY'];
    const exaKey = process.env['EXA_API_KEY'];
    const stateKey = process.env['AGENT_STATE_SECRET'];
    if (!openaiKey || !exaKey || !stateKey) return { done: true, sources: [], rounds: 0, error: 'The assistant is not configured yet. Please try again later.' };
    return runAgentStep(data, { openaiKey, exaKey, stateKey, model: process.env['OPENAI_MODEL'] || DEFAULT_OPENAI_MODEL });
  });