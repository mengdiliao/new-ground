import { createContext, useContext, useState, type ReactNode } from 'react';
import { sampleTasks, createLocalTask, createDraftTask, appendMessage, advanceDemo, type Task } from '@/lib/task-data';
interface TaskContextValue { tasks: Task[]; addTask: (text: string) => Task | undefined; newTask: () => Task; updateDraft: (id: string, text: string) => void; sendMessage: (id: string, text: string) => void; advanceTask: (id: string) => void; showSuggestions: boolean; setShowSuggestions: (value: boolean) => void; }
const TaskContext = createContext<TaskContextValue | undefined>(undefined);
export function NewGroundProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState(sampleTasks);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const addTask = (text: string) => {
    const task = createLocalTask(text, crypto.randomUUID());
    if (task) setTasks(current => [task, ...current]);
    return task;
  };
  const updateTask = (id: string, update: (task: Task) => Task) => setTasks(current => current.map(task => task.id === id ? update(task) : task));
  return <TaskContext.Provider value={{ tasks, addTask, newTask: () => { const task = createDraftTask(crypto.randomUUID()); setTasks(current => [task, ...current]); return task; }, updateDraft: (id, draft) => updateTask(id, task => ({ ...task, draft })), sendMessage: (id, text) => updateTask(id, task => appendMessage(task, text)), advanceTask: id => updateTask(id, advanceDemo), showSuggestions, setShowSuggestions }}>{children}</TaskContext.Provider>;
}
export function useNewGround() { const context = useContext(TaskContext); if (!context) throw new Error('New Ground provider is missing'); return context; }