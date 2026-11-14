import { createContext, useContext, useState, type ReactNode } from 'react';
import { sampleTasks, createLocalTask, type Task } from '@/lib/task-data';
interface TaskContextValue { tasks: Task[]; addTask: (text: string) => Task | undefined; completeTask: (id: string) => void; selectedTask: Task | undefined; selectTask: (task: Task | undefined) => void; showSuggestions: boolean; setShowSuggestions: (value: boolean) => void; }
const TaskContext = createContext<TaskContextValue | undefined>(undefined);
export function NewGroundProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState(sampleTasks);
  const [selectedId, setSelectedId] = useState<string>();
  const [showSuggestions, setShowSuggestions] = useState(true);
  const addTask = (text: string) => {
    const task = createLocalTask(text, crypto.randomUUID());
    if (task) { setTasks(current => [task, ...current]); setSelectedId(task.id); }
    return task;
  };
  return <TaskContext.Provider value={{ tasks, addTask, completeTask: id => setTasks(current => current.map(task => task.id === id ? { ...task, status: 'Completed' } : task)), selectedTask: tasks.find(task => task.id === selectedId), selectTask: task => setSelectedId(task?.id), showSuggestions, setShowSuggestions }}>{children}</TaskContext.Provider>;
}
export function useNewGround() { const context = useContext(TaskContext); if (!context) throw new Error('New Ground provider is missing'); return context; }