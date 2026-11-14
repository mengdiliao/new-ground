import { useRef, useState, type ReactNode } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { agentStep } from '@/lib/agent.functions';
import { MAX_AGENT_STEPS } from '@/lib/agent';
import { sampleTasks, createLocalTask, createDraftTask, appendMessage, advanceDemo, type Task } from '@/lib/task-data';
import { TaskContext } from '@/lib/task-context';
export function NewGroundProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState(sampleTasks);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const step = useServerFn(agentStep);
  const states = useRef(new Map<string, string>());
  const activeRequests = useRef(new Set<string>());
  const addTask = (text: string) => {
    const task = createLocalTask(text, crypto.randomUUID());
    if (task) setTasks(current => [task, ...current]);
    return task;
  };
  const updateTask = (id: string, update: (task: Task) => Task) => setTasks(current => current.map(task => task.id === id ? update(task) : task));
  const researchTask = async (id: string, query: string) => {
    if (activeRequests.current.has(id)) return;
    activeRequests.current.add(id);
    updateTask(id, task => ({ ...task, demo: false, status: 'Planning', agentStage: 'Understanding your request', searchState: 'loading', searchError: undefined, results: undefined }));
    try {
      let state = states.current.get(id);
      for (let index = 0; index <= MAX_AGENT_STEPS + 1; index++) {
        const result = await step({ data: index === 0 ? { state, message: query } : { state } });
        if (result.state) { state = result.state; states.current.set(id, state); }
        updateTask(id, task => ({ ...task, agentState: state, agentStage: result.stage ?? task.agentStage, researchPlan: result.plan ?? task.researchPlan, sources: result.sources, searchRounds: result.rounds,
          status: result.done ? result.clarification || result.error ? 'Planning' : 'Reviewing' : result.stage === 'Understanding your request' ? 'Planning' : result.stage === 'Preparing your answer' || result.stage === 'Comparing findings' ? 'Reviewing' : 'Researching',
          searchState: result.done ? result.error ? 'error' : 'success' : 'loading', searchError: result.error,
          ...(result.answer ? { messages: [...task.messages, { id: crypto.randomUUID(), role: 'assistant' as const, text: result.answer }], results: result.clarification ? undefined : { summary: result.answer, options: [], steps: [] } } : {}) }));
        if (result.done) return;
        if (!state) throw new Error('Missing continuation');
      }
      throw new Error('Research limit');
    } catch { updateTask(id, task => ({ ...task, searchState: 'error', searchError: 'The assistant could not connect. Your conversation and sources are preserved. Please retry.' })); }
    finally { activeRequests.current.delete(id); }
  };
  return <TaskContext.Provider value={{ tasks, addTask, researchTask, newTask: () => { const task = createDraftTask(crypto.randomUUID()); setTasks(current => [task, ...current]); return task; }, updateDraft: (id, draft) => updateTask(id, task => ({ ...task, draft })), sendMessage: (id, text) => updateTask(id, task => appendMessage(task, text)), advanceTask: id => updateTask(id, advanceDemo), showSuggestions, setShowSuggestions }}>{children}</TaskContext.Provider>;
}