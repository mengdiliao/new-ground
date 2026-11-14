import { useRef, useState, type ReactNode } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { searchWeb } from '@/lib/exa-search.functions';
import { searchFailure } from '@/lib/exa-search';
import { sampleTasks, createLocalTask, createDraftTask, appendMessage, advanceDemo, type Task } from '@/lib/task-data';
import { TaskContext } from '@/lib/task-context';
export function NewGroundProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState(sampleTasks);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const search = useServerFn(searchWeb);
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
    updateTask(id, task => ({ ...task, demo: false, status: 'Researching', searchState: 'loading', searchError: undefined, sources: [], results: undefined }));
    try {
      const result = await search({ data: { query } });
      updateTask(id, task => result.ok ? { ...task, status: 'Reviewing', searchState: 'success', sources: result.sources } : { ...task, searchState: 'error', searchError: result.message, sources: [] });
    } catch { const failure = searchFailure('network'); if (!failure.ok) updateTask(id, task => ({ ...task, searchState: 'error', searchError: failure.message, sources: [] })); }
    finally { activeRequests.current.delete(id); }
  };
  return <TaskContext.Provider value={{ tasks, addTask, researchTask, newTask: () => { const task = createDraftTask(crypto.randomUUID()); setTasks(current => [task, ...current]); return task; }, updateDraft: (id, draft) => updateTask(id, task => ({ ...task, draft })), sendMessage: (id, text) => updateTask(id, task => appendMessage(task, text)), advanceTask: id => updateTask(id, advanceDemo), showSuggestions, setShowSuggestions }}>{children}</TaskContext.Provider>;
}