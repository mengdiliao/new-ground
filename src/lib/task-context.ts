import { createContext, useContext } from 'react';
import type { Task } from '@/lib/task-data';

export interface TaskContextValue {
  tasks: Task[];
  addTask: (text: string) => Task | undefined;
  newTask: () => Task;
  updateDraft: (id: string, text: string) => void;
  sendMessage: (id: string, text: string) => void;
  advanceTask: (id: string) => void;
  researchTask: (id: string, query: string) => Promise<void>;
  renameTask: (id: string, title: string) => void;
  deleteTask: (id: string) => void;
  setTaskCompleted: (id: string, completed: boolean) => void;
  toggleAction: (id: string, action: string) => void;
  historyReady: boolean;
  storageError: string;
  showSuggestions: boolean;
  setShowSuggestions: (value: boolean) => void;
}

// Separate from the refreshable provider so live component updates do not
// replace the context object used by already-mounted consumers.
export const TaskContext = createContext<TaskContextValue | undefined>(undefined);

export function useNewGround() {
  const context = useContext(TaskContext);
  if (!context) throw new Error('New Ground provider is missing');
  return context;
}